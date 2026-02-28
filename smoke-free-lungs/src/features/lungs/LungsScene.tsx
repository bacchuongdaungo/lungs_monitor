import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { LungPartId } from "../../lungKnowledge";
import { LungsPrimitive } from "./LungsPrimitive";
import type { BreathingParams, Lungs3DPartId } from "./types";

type Props = {
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

export function LungsScene({ selectedPartId = null, onSelectPart }: Props) {
  const [respRateBpm, setRespRateBpm] = useState<number>(14);
  const [posture, setPosture] = useState<BreathingParams["posture"]>("upright");
  const [localSelectedPartId, setLocalSelectedPartId] = useState<LungPartId | null>(null);
  const canRender3D = useMemo(() => supportsWebGL(), []);

  const effectiveSelectedPartId = selectedPartId ?? localSelectedPartId;
  const selectedPrimitiveId = partToPrimitive(effectiveSelectedPartId);
  const params: BreathingParams = {
    respRateBpm,
    posture,
    effort: "rest",
  };

  return (
    <section className="lungs3d-section">
      <div className="lungs3d-controls">
        <label className="lungs3d-control" htmlFor="resp-rate-slider">
          <span>Respiratory Rate: {respRateBpm.toFixed(0)} breaths/min</span>
          <input
            id="resp-rate-slider"
            type="range"
            min={8}
            max={30}
            step={1}
            value={respRateBpm}
            onChange={(event) => setRespRateBpm(Number(event.target.value))}
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

      <div className="lungs3d-selection">
        Selected region: <strong>{selectedPrimitiveId ? PART_LABELS[selectedPrimitiveId] : "None"}</strong>
      </div>

      <div className="lungs3d-stage">
        {canRender3D ? (
          <Canvas
            shadows
            camera={{ position: [0, 0.35, 5], fov: 38 }}
            dpr={[1, 1.75]}
          >
            <color attach="background" args={["#fff7f2"]} />
            <ambientLight intensity={0.62} />
            <directionalLight
              castShadow
              intensity={1}
              position={[4, 5, 4]}
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            <pointLight intensity={0.42} position={[-3, 2, 3]} />

            <group position={[0, -0.4, 0]}>
              <LungsPrimitive
                params={params}
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

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.15, 0]} receiveShadow>
              <circleGeometry args={[6, 48]} />
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

      <p className="lungs3d-disclaimer">Educational visualization; not a medical device.</p>
    </section>
  );
}
