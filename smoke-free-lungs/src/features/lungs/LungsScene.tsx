import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { LungPartId } from "../../lungKnowledge";
import type { RecoveryState } from "../../model";
import { LungsPrimitive } from "./LungsPrimitive";
import type { BreathingParams, Lungs3DPartId } from "./types";

type Props = {
  state: RecoveryState;
  selectedPartId?: LungPartId | null;
  onSelectPart?: (id: LungPartId) => void;
};

const PART_LABELS: Record<Lungs3DPartId, string> = {
  trachea: "Trachea",
  bronchi: "Bronchi",
  LUL: "Left Upper Lobe",
  LLL: "Left Lower Lobe",
  RUL: "Right Upper Lobe",
  RML: "Right Middle Lobe",
  RLL: "Right Lower Lobe",
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function supportsWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl2 = canvas.getContext("webgl2");
    const gl = canvas.getContext("webgl");
    return gl2 !== null || gl !== null;
  } catch {
    return false;
  }
}

function partToPrimitive(partId: LungPartId | null): Lungs3DPartId | null {
  if (!partId) return null;

  if (partId === "trachea" || partId === "bronchi") return partId;
  if (partId === "left-upper-lobe") return "LUL";
  if (partId === "left-lower-lobe") return "LLL";
  if (partId === "right-upper-lobe") return "RUL";
  if (partId === "right-middle-lobe") return "RML";
  if (partId === "right-lower-lobe") return "RLL";

  return null;
}

function primitiveToPart(id: Lungs3DPartId): LungPartId {
  if (id === "trachea" || id === "bronchi") return id;
  if (id === "LUL") return "left-upper-lobe";
  if (id === "LLL") return "left-lower-lobe";
  if (id === "RUL") return "right-upper-lobe";
  if (id === "RML") return "right-middle-lobe";
  return "right-lower-lobe";
}

export function LungsScene({ state, selectedPartId = null, onSelectPart }: Props) {
  const [motionScale, setMotionScale] = useState<number>(100);
  const [posture, setPosture] = useState<BreathingParams["posture"]>("upright");
  const [localSelectedPartId, setLocalSelectedPartId] = useState<LungPartId | null>(null);
  const canRender3D = useMemo(() => supportsWebGL(), []);

  const effectiveSelectedPartId = selectedPartId ?? localSelectedPartId;
  const selectedPrimitiveId = partToPrimitive(effectiveSelectedPartId);
  const derivedRespRateBpm = clamp(
    state.respirationRatePerMin * (motionScale / 100),
    8,
    30,
  );
  const effort: BreathingParams["effort"] =
    state.inflammation > 0.62 || state.mucus > 0.58
      ? "heavy"
      : state.inflammation > 0.32 || state.mucus > 0.28
        ? "light"
        : "rest";
  const params: BreathingParams = {
    respRateBpm: derivedRespRateBpm,
    posture,
    effort,
  };

  return (
    <section className="lungs3d-section">
      <div className="lungs3d-controls">
        <label className="lungs3d-control" htmlFor="motion-scale-slider">
          <span>Breathing motion: {motionScale}% of your model rate</span>
          <input
            id="motion-scale-slider"
            type="range"
            min={80}
            max={125}
            step={1}
            value={motionScale}
            onChange={(event) => setMotionScale(Number(event.target.value))}
          />
        </label>

        <div className="lungs3d-posture">
          <span>Posture</span>
          <div className="lungs3d-toggle-row">
            <button
              type="button"
              className={`chip ${posture === "upright" ? "chip--primary" : ""}`}
              onClick={() => setPosture("upright")}
            >
              Upright
            </button>
            <button
              type="button"
              className={`chip ${posture === "supine" ? "chip--primary" : ""}`}
              onClick={() => setPosture("supine")}
            >
              Supine
            </button>
          </div>
        </div>
      </div>

      <div className="lungs3d-stats" aria-label="3D scene metrics">
        <article className="lungs3d-stat">
          <span>Live breathing rate</span>
          <strong>{derivedRespRateBpm.toFixed(1)} breaths/min</strong>
        </article>
        <article className="lungs3d-stat">
          <span>Surface soot</span>
          <strong>{Math.round(state.sootLoad * 100)}%</strong>
        </article>
        <article className="lungs3d-stat">
          <span>Inflammation tint</span>
          <strong>{Math.round(state.inflammation * 100)}%</strong>
        </article>
        <article className="lungs3d-stat">
          <span>Cilia glow</span>
          <strong>{Math.round(state.ciliaFunction * 100)}%</strong>
        </article>
      </div>

      <div className="lungs3d-selection">
        Selected region: <strong>{selectedPrimitiveId ? PART_LABELS[selectedPrimitiveId] : "None"}</strong>
      </div>

      <div className="lungs3d-stage">
        {canRender3D ? (
          <Canvas
            gl={{ powerPreference: "high-performance", antialias: false }}
            camera={{ position: [0, 0.35, 5], fov: 38 }}
            dpr={[1, 1.4]}
          >
            <color attach="background" args={["#fff7f2"]} />
            <ambientLight intensity={0.78} />
            <directionalLight
              intensity={0.9}
              position={[4, 5, 4]}
            />
            <pointLight intensity={0.35} position={[-3, 2, 3]} />

            <group position={[0, -0.4, 0]}>
              <LungsPrimitive
                params={params}
                state={state}
                selected={selectedPrimitiveId}
                onPick={(id) => {
                  const nextPart = primitiveToPart(id);
                  if (onSelectPart) {
                    onSelectPart(nextPart);
                    return;
                  }
                  setLocalSelectedPartId(nextPart);
                }}
              />
            </group>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.15, 0]}>
              <circleGeometry args={[6, 32]} />
              <meshStandardMaterial color="#f5dfd0" roughness={0.9} metalness={0.02} />
            </mesh>

            <OrbitControls
              makeDefault
              enablePan={false}
              minDistance={3.1}
              maxDistance={7.2}
              maxPolarAngle={Math.PI * 0.78}
            />
          </Canvas>
        ) : (
          <div className="lungs3d-fallback">
            3D preview is unavailable in this environment (WebGL not detected).
          </div>
        )}
      </div>

      <p className="lungs3d-disclaimer">
        Educational visualization; 3D breathing, color, and surface tone now follow the same recovery state used by the 2D model.
      </p>
    </section>
  );
}
