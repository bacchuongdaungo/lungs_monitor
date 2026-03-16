import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { RecoveryState } from "../../model";
import { inhaleFactor, smoothValue } from "./breathingWave";
import type { BreathingParams, LobeId, Lungs3DPartId } from "./types";

type Props = {
  params: BreathingParams;
  state: RecoveryState;
  onPick?: (id: Lungs3DPartId) => void;
  selected?: Lungs3DPartId | null;
};

type LobeRegion = "upper" | "middle" | "lower";

type LobeSpec = {
  id: LobeId;
  region: LobeRegion;
  basePosition: readonly [number, number, number];
  baseScale: readonly [number, number, number];
  baseAmplitude: number;
};

type LobeMesh = THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;

const LOBE_SPECS: readonly LobeSpec[] = [
  {
    id: "LUL",
    region: "upper",
    basePosition: [-0.86, 0.46, 0.02],
    baseScale: [0.9, 1.02, 0.72],
    baseAmplitude: 0.035,
  },
  {
    id: "LLL",
    region: "lower",
    basePosition: [-0.82, -0.78, 0.04],
    baseScale: [0.97, 1.14, 0.79],
    baseAmplitude: 0.06,
  },
  {
    id: "RUL",
    region: "upper",
    basePosition: [0.88, 0.48, 0.02],
    baseScale: [0.94, 1.02, 0.74],
    baseAmplitude: 0.035,
  },
  {
    id: "RML",
    region: "middle",
    basePosition: [0.96, -0.08, 0.22],
    baseScale: [0.71, 0.67, 0.56],
    baseAmplitude: 0.045,
  },
  {
    id: "RLL",
    region: "lower",
    basePosition: [0.86, -0.88, 0.04],
    baseScale: [1.0, 1.2, 0.82],
    baseAmplitude: 0.06,
  },
] as const;

const LOBE_SURFACE: Record<LobeId, { color: number; roughness: number }> = {
  LUL: { color: 0xf1a18e, roughness: 0.66 },
  LLL: { color: 0xe98f79, roughness: 0.68 },
  RUL: { color: 0xf2a58f, roughness: 0.66 },
  RML: { color: 0xea977f, roughness: 0.68 },
  RLL: { color: 0xe1836a, roughness: 0.7 },
};

const LOBE_BY_ID: Record<LobeId, LobeSpec> = {
  LUL: LOBE_SPECS[0],
  LLL: LOBE_SPECS[1],
  RUL: LOBE_SPECS[2],
  RML: LOBE_SPECS[3],
  RLL: LOBE_SPECS[4],
};

const PICKABLE_IDS: readonly Lungs3DPartId[] = [
  "LUL",
  "LLL",
  "RUL",
  "RML",
  "RLL",
  "trachea",
  "bronchi",
] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function mixHex(a: number, b: number, t: number): number {
  const color = new THREE.Color(a);
  color.lerp(new THREE.Color(b), clamp(t, 0, 1));
  return color.getHex();
}

function lobeSurfaceColor(base: number, state: RecoveryState): number {
  const sootTint = mixHex(base, 0x463227, state.sootLoad * 0.72);
  return mixHex(sootTint, 0xc65d49, state.inflammation * 0.38);
}

function airwaySurfaceColor(base: number, state: RecoveryState): number {
  const tarTint = mixHex(base, 0x775243, state.tarBurden * 0.62);
  return mixHex(tarTint, 0x85c4cf, state.mucus * 0.2);
}

function regionPostureFactor(region: LobeRegion, posture: BreathingParams["posture"]): number {
  if (posture === "upright") {
    if (region === "lower") return 1.2;
    if (region === "upper") return 0.9;
    return 1.0;
  }

  if (region === "lower") return 1.05;
  if (region === "upper") return 0.98;
  return 1.0;
}

function effortFactor(effort: BreathingParams["effort"]): number {
  if (effort === "light") return 1.25;
  if (effort === "heavy") return 1.55;
  return 1.0;
}

export function LungsPrimitive({ params, state, onPick, selected = null }: Props) {
  const [hovered, setHovered] = useState<Lungs3DPartId | null>(null);
  const smoothRespRateRef = useRef<number>(params.respRateBpm);
  const elapsedSecRef = useRef<number>(0);
  const airwayGroupRef = useRef<THREE.Group>(null);

  const lulRef = useRef<LobeMesh>(null);
  const lllRef = useRef<LobeMesh>(null);
  const rulRef = useRef<LobeMesh>(null);
  const rmlRef = useRef<LobeMesh>(null);
  const rllRef = useRef<LobeMesh>(null);

  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(1, 24, 16), []);
  const tracheaGeometry = useMemo(() => new THREE.CylinderGeometry(0.09, 0.11, 0.95, 14), []);
  const bronchusGeometry = useMemo(() => new THREE.CylinderGeometry(0.05, 0.07, 0.85, 12), []);
  const heartGeometry = useMemo(() => new THREE.SphereGeometry(1, 18, 12), []);

  const lobeEntries = useMemo(
    () =>
      [
        { id: "LUL" as const, ref: lulRef },
        { id: "LLL" as const, ref: lllRef },
        { id: "RUL" as const, ref: rulRef },
        { id: "RML" as const, ref: rmlRef },
        { id: "RLL" as const, ref: rllRef },
      ] satisfies readonly { id: LobeId; ref: RefObject<LobeMesh | null> }[],
    [],
  );

  useEffect(() => {
    return () => {
      sphereGeometry.dispose();
      tracheaGeometry.dispose();
      bronchusGeometry.dispose();
      heartGeometry.dispose();
    };
  }, [sphereGeometry, tracheaGeometry, bronchusGeometry, heartGeometry]);

  useFrame((_, dt) => {
    smoothRespRateRef.current = smoothValue(
      smoothRespRateRef.current,
      params.respRateBpm,
      dt,
      0.45,
    );
    elapsedSecRef.current += dt;

    const inhale = inhaleFactor(elapsedSecRef.current, smoothRespRateRef.current, 0.33);
    const effortScale = effortFactor(params.effort);

    for (const entry of lobeEntries) {
      const mesh = entry.ref.current;
      if (!mesh) continue;
      const spec = LOBE_BY_ID[entry.id];

      const regionScale = regionPostureFactor(spec.region, params.posture);
      const amplitude = spec.baseAmplitude * effortScale * regionScale;

      const sx = spec.baseScale[0] * (1 + amplitude * inhale * 1.2);
      const sy = spec.baseScale[1] * (1 + amplitude * inhale * 1.03);
      const sz = spec.baseScale[2] * (1 + amplitude * inhale * 0.82);
      mesh.scale.set(sx, sy, sz);

      const lateralDirection = Math.sign(spec.basePosition[0]);
      const ribCageLateralShift = lateralDirection * inhale * 0.06 * regionScale;
      const ribCageApShift = inhale * 0.022 * (spec.region === "middle" ? 1.1 : 0.9);
      const diaphragmDescent =
        spec.region === "lower"
          ? -inhale * (params.posture === "upright" ? 0.14 : 0.09)
          : -inhale * 0.032;

      mesh.position.set(
        spec.basePosition[0] + ribCageLateralShift,
        spec.basePosition[1] + diaphragmDescent,
        spec.basePosition[2] + ribCageApShift,
      );
    }

    if (airwayGroupRef.current) {
      airwayGroupRef.current.position.y = -inhale * 0.036;
      airwayGroupRef.current.position.x = inhale * 0.004;
      airwayGroupRef.current.position.z = inhale * 0.006;
    }
  });

  function resolvePickId(event: ThreeEvent<PointerEvent>): Lungs3DPartId | null {
    const id = event.object.name as Lungs3DPartId;
    for (const pickableId of PICKABLE_IDS) {
      if (pickableId === id) return id;
    }
    return null;
  }

  function handlePointerOver(event: ThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    const id = resolvePickId(event);
    if (id) setHovered(id);
  }

  function handlePointerOut(event: ThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    const id = resolvePickId(event);
    if (!id) return;
    setHovered((current) => (current === id ? null : current));
  }

  function handlePick(event: ThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    const id = resolvePickId(event);
    if (!id) return;
    onPick?.(id);
  }

  const highlightColor = 0x2f899d;
  const isActive = (id: Lungs3DPartId) => hovered === id || selected === id;
  const healthyGlow = mixHex(0x000000, 0xa2ddd1, state.ciliaFunction * 0.45);
  const tracheaColor = airwaySurfaceColor(0xd6b09c, state);
  const bronchiColor = airwaySurfaceColor(0xcfa18d, state);
  const airwayRoughness = clamp(0.48 + state.tarBurden * 0.22 + state.mucus * 0.08, 0.4, 0.86);
  const airwayMetalness = clamp(0.02 + state.mucus * 0.06, 0.02, 0.12);
  const restfulLift = 1 - clamp(state.overallDirtiness * 0.24, 0, 0.24);

  return (
    <group>
      <group ref={airwayGroupRef}>
        <mesh
          name="trachea"
          geometry={tracheaGeometry}
          position={[0, 1.55, 0.05]}
          castShadow
          receiveShadow
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handlePick}
        >
          <meshStandardMaterial
            color={tracheaColor}
            roughness={airwayRoughness}
            metalness={airwayMetalness}
            emissive={isActive("trachea") ? highlightColor : healthyGlow}
            emissiveIntensity={isActive("trachea") ? 0.42 : 0.08 + state.ciliaFunction * 0.06}
          />
        </mesh>
        <mesh
          name="bronchi"
          geometry={bronchusGeometry}
          position={[-0.36, 1.08, 0.02]}
          rotation={[0, 0, 0.54]}
          castShadow
          receiveShadow
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handlePick}
        >
          <meshStandardMaterial
            color={bronchiColor}
            roughness={airwayRoughness}
            metalness={airwayMetalness}
            emissive={isActive("bronchi") ? highlightColor : healthyGlow}
            emissiveIntensity={isActive("bronchi") ? 0.42 : 0.08 + state.ciliaFunction * 0.06}
          />
        </mesh>
        <mesh
          name="bronchi"
          geometry={bronchusGeometry}
          position={[0.36, 1.08, 0.02]}
          rotation={[0, 0, -0.54]}
          castShadow
          receiveShadow
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handlePick}
        >
          <meshStandardMaterial
            color={bronchiColor}
            roughness={airwayRoughness}
            metalness={airwayMetalness}
            emissive={isActive("bronchi") ? highlightColor : healthyGlow}
            emissiveIntensity={isActive("bronchi") ? 0.42 : 0.08 + state.ciliaFunction * 0.06}
          />
        </mesh>
      </group>

      {lobeEntries.map((entry) => {
        const spec = LOBE_BY_ID[entry.id];
        const style = LOBE_SURFACE[entry.id];
        const active = isActive(entry.id);
        return (
          <mesh
            key={entry.id}
            name={entry.id}
            ref={entry.ref}
            geometry={sphereGeometry}
            position={spec.basePosition}
            scale={spec.baseScale}
            castShadow
            receiveShadow
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={handlePick}
          >
            <meshStandardMaterial
              color={lobeSurfaceColor(style.color, state)}
              roughness={clamp(style.roughness + state.sootLoad * 0.12, 0.55, 0.88)}
              metalness={clamp(0.03 + state.mucus * 0.05, 0.03, 0.11)}
              emissive={active ? highlightColor : healthyGlow}
              emissiveIntensity={active ? 0.45 : 0.05 + state.ciliaFunction * 0.08}
            />
          </mesh>
        );
      })}

      <mesh
        geometry={heartGeometry}
        position={[0, -1.92 - state.mucus * 0.06, -0.12]}
        rotation={[0.18, 0, 0]}
        scale={[0.38 * restfulLift, 0.44 * restfulLift, 0.38 * restfulLift]}
      >
        <meshStandardMaterial
          color={mixHex(0xc76872, 0xf0a0a7, state.recoveryPercent * 0.5)}
          roughness={0.42}
          metalness={0.03}
          emissive={0x8d4049}
          emissiveIntensity={0.08}
        />
      </mesh>
    </group>
  );
}
