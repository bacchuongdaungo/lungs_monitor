import { useEffect, useMemo, useState } from "react";
import type { RecoveryState } from "./model";
import type { LungPartId } from "./lungKnowledge";
import { hashStringToUint32, mulberry32 } from "./rng";

type Props = {
  state: RecoveryState;
  seedKey: string;
  selectedPartId?: LungPartId | null;
  onSelectPart?: (partId: LungPartId) => void;
};

type LobeId =
  | "left-upper-lobe"
  | "left-lower-lobe"
  | "right-upper-lobe"
  | "right-middle-lobe"
  | "right-lower-lobe";

type Particle = {
  x: number;
  y: number;
  r: number;
  lobe: LobeId;
};

type Region = {
  id: LungPartId;
  label: string;
  path: string;
  kind: "fill" | "stroke";
  strokeWidth?: number;
  labelX: number;
  labelY: number;
};

const LEFT_UPPER_LOBE_PATH =
  "M57 27 C50 22, 36 22, 28 35 C24 43, 25 56, 31 64 C37 67, 45 66, 51 61 C55 56, 57 48, 58 39 C58 34, 58 30, 57 27 Z";
const LEFT_LOWER_LOBE_PATH =
  "M50 61 C44 66, 36 67, 30 64 C24 78, 21 103, 34 124 C44 130, 55 126, 57 109 C58 98, 56 78, 50 61 Z";
const RIGHT_UPPER_LOBE_PATH =
  "M63 27 C70 22, 84 22, 92 35 C96 42, 95 53, 91 59 C85 62, 77 61, 71 57 C66 52, 63 46, 62 38 C62 33, 62 30, 63 27 Z";
const RIGHT_MIDDLE_LOBE_PATH =
  "M70 57 C78 61, 86 62, 92 59 C96 66, 96 78, 92 88 C86 91, 78 91, 70 88 C66 81, 65 70, 70 57 Z";
const RIGHT_LOWER_LOBE_PATH =
  "M70 88 C78 92, 88 92, 93 88 C101 103, 99 116, 86 124 C76 130, 65 126, 63 109 C62 100, 64 93, 70 88 Z";
const LEFT_LUNG_COMBINED = `${LEFT_UPPER_LOBE_PATH} ${LEFT_LOWER_LOBE_PATH}`;
const RIGHT_LUNG_COMBINED = `${RIGHT_UPPER_LOBE_PATH} ${RIGHT_MIDDLE_LOBE_PATH} ${RIGHT_LOWER_LOBE_PATH}`;
const PLEURA_PATH = `${LEFT_LUNG_COMBINED} ${RIGHT_LUNG_COMBINED}`;

const REGIONS: Region[] = [
  {
    id: "trachea",
    label: "Trachea",
    path: "M57 4 L63 4 C66 12, 66 20, 63 27 L57 27 C54 20, 54 12, 57 4 Z",
    kind: "fill",
    labelX: 60,
    labelY: 11,
  },
  {
    id: "bronchi",
    label: "Bronchi",
    path: "M57 25 L63 25 L74 41 L68 45 L60 34 L52 45 L46 41 Z",
    kind: "fill",
    labelX: 60,
    labelY: 39,
  },
  {
    id: "left-upper-lobe",
    label: "Left upper lobe",
    path: LEFT_UPPER_LOBE_PATH,
    kind: "fill",
    labelX: 40,
    labelY: 48,
  },
  {
    id: "left-lower-lobe",
    label: "Left lower lobe",
    path: LEFT_LOWER_LOBE_PATH,
    kind: "fill",
    labelX: 40,
    labelY: 96,
  },
  {
    id: "right-upper-lobe",
    label: "Right upper lobe",
    path: RIGHT_UPPER_LOBE_PATH,
    kind: "fill",
    labelX: 80,
    labelY: 48,
  },
  {
    id: "right-middle-lobe",
    label: "Right middle lobe",
    path: RIGHT_MIDDLE_LOBE_PATH,
    kind: "fill",
    labelX: 80,
    labelY: 74,
  },
  {
    id: "right-lower-lobe",
    label: "Right lower lobe",
    path: RIGHT_LOWER_LOBE_PATH,
    kind: "fill",
    labelX: 80,
    labelY: 102,
  },
  {
    id: "alveoli",
    label: "Alveoli",
    path:
      "M24 80 C24 98, 31 112, 42 118 C50 121, 55 113, 55 103 C53 86, 45 75, 34 73 C28 73, 25 76, 24 80 Z " +
      "M96 80 C96 98, 89 112, 78 118 C70 121, 65 113, 65 103 C67 86, 75 75, 86 73 C92 73, 95 76, 96 80 Z",
    kind: "fill",
    labelX: 60,
    labelY: 115,
  },
  {
    id: "pleura",
    label: "Pleura",
    path: PLEURA_PATH,
    kind: "stroke",
    strokeWidth: 6.6,
    labelX: 100,
    labelY: 95,
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizedPassiveExhale(y: number, k = 4): number {
  const min = Math.exp(-k);
  const current = Math.exp(-k * y);
  return (current - min) / (1 - min);
}

function breathingSignal(ms: number, breathsPerMin: number): number {
  const bpm = clamp(breathsPerMin, 8, 30);
  const cycleSeconds = 60 / bpm;
  const t = (ms / 1000) % cycleSeconds;
  const inhaleSeconds = cycleSeconds / 3;
  const exhaleSeconds = cycleSeconds - inhaleSeconds;

  if (t < inhaleSeconds) {
    const x = t / inhaleSeconds;
    return 0.5 * (1 - Math.cos(Math.PI * x));
  }

  const y = (t - inhaleSeconds) / exhaleSeconds;
  return normalizedPassiveExhale(y);
}

function genParticles(seedKey: string, count: number): Particle[] {
  const seed = hashStringToUint32(seedKey);
  const rand = mulberry32(seed);
  const particles: Particle[] = [];

  let attempts = 0;
  while (particles.length < count && attempts < count * 24) {
    attempts += 1;
    const side = rand() < 0.5 ? "left" : "right";
    const cx = side === "left" ? 40 : 80;
    const cy = 78;
    const rx = 21;
    const ry = 48;

    const x = cx + (rand() * 2 - 1) * rx;
    const y = cy + (rand() * 2 - 1) * ry;
    const nx = (x - cx) / rx;
    const ny = (y - cy) / ry;

    if (nx * nx + ny * ny > 1 || y < 30 || y > 126) {
      continue;
    }

    let lobe: LobeId;
    if (side === "left") {
      lobe = y < 65 ? "left-upper-lobe" : "left-lower-lobe";
    } else if (y < 58) {
      lobe = "right-upper-lobe";
    } else if (y < 86) {
      lobe = "right-middle-lobe";
    } else {
      lobe = "right-lower-lobe";
    }

    particles.push({
      x,
      y,
      r: 0.45 + rand() * 1.3,
      lobe,
    });
  }

  return particles;
}

function lobeTransform(
  cx: number,
  cy: number,
  inhale: number,
  horizontalDir: number,
  amplitudeFactor: number,
): string {
  const sx = 1 + inhale * 0.028 * amplitudeFactor;
  const sy = 1 + inhale * 0.022 * amplitudeFactor;
  const tx = horizontalDir * inhale * 0.95 * amplitudeFactor;
  const ty = -inhale * 2.2 * amplitudeFactor;

  return [
    `translate(${tx.toFixed(2)} ${ty.toFixed(2)})`,
    `translate(${cx} ${cy})`,
    `scale(${sx.toFixed(4)} ${sy.toFixed(4)})`,
    `translate(${-cx} ${-cy})`,
  ].join(" ");
}

function baseSparkleOpacity(inhale: number, ciliaFunction: number): number {
  return clamp(0.18 + ciliaFunction * 0.35 + inhale * 0.14, 0.16, 0.72);
}

export function LungViz({ state, seedKey, selectedPartId = null, onSelectPart }: Props) {
  const particles = useMemo(() => genParticles(seedKey, 900), [seedKey]);
  const [clockMs, setClockMs] = useState(0);
  const [hoveredPartId, setHoveredPartId] = useState<LungPartId | null>(null);

  useEffect(() => {
    let frame = 0;
    let start = 0;

    const tick = (timestamp: number) => {
      if (start === 0) start = timestamp;
      setClockMs(timestamp - start);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const inhale = breathingSignal(clockMs, state.respirationRatePerMin);

  const sootCount = Math.round(40 + state.sootLoad * 760);
  const sootOpacity = 0.08 + 0.62 * state.sootLoad;
  const inflammationOpacity = 0.06 + 0.58 * state.inflammation;
  const mucusOpacity = 0.05 + 0.72 * state.mucus;
  const sparkleOpacity = baseSparkleOpacity(inhale, state.ciliaFunction);

  const heartPhase = ((clockMs / 1000) * (state.restingHeartRateBpm / 60)) % 1;
  const pulsePrimary = Math.max(0, Math.sin(heartPhase * Math.PI * 2));
  const pulseSecondary = Math.max(0, Math.sin((heartPhase * Math.PI * 2 - Math.PI * 0.7) * 2));
  const heartScale = 1 + pulsePrimary * 0.08 + pulseSecondary * 0.03;

  const lobeParticles = {
    "left-upper-lobe": particles
      .filter((particle) => particle.lobe === "left-upper-lobe")
      .slice(0, Math.floor(sootCount * 0.18)),
    "left-lower-lobe": particles
      .filter((particle) => particle.lobe === "left-lower-lobe")
      .slice(0, Math.floor(sootCount * 0.22)),
    "right-upper-lobe": particles
      .filter((particle) => particle.lobe === "right-upper-lobe")
      .slice(0, Math.floor(sootCount * 0.2)),
    "right-middle-lobe": particles
      .filter((particle) => particle.lobe === "right-middle-lobe")
      .slice(0, Math.floor(sootCount * 0.17)),
    "right-lower-lobe": particles
      .filter((particle) => particle.lobe === "right-lower-lobe")
      .slice(0, Math.floor(sootCount * 0.23)),
  } as const;

  const lobeMotion = {
    "left-upper-lobe": lobeTransform(42, 50, inhale, -1, 0.58),
    "left-lower-lobe": lobeTransform(42, 96, inhale, -1, 1),
    "right-upper-lobe": lobeTransform(78, 50, inhale, 1, 0.55),
    "right-middle-lobe": lobeTransform(78, 74, inhale, 1, 0.76),
    "right-lower-lobe": lobeTransform(78, 100, inhale, 1, 1),
  } as const;

  const lobePaths = {
    "left-upper-lobe": LEFT_UPPER_LOBE_PATH,
    "left-lower-lobe": LEFT_LOWER_LOBE_PATH,
    "right-upper-lobe": RIGHT_UPPER_LOBE_PATH,
    "right-middle-lobe": RIGHT_MIDDLE_LOBE_PATH,
    "right-lower-lobe": RIGHT_LOWER_LOBE_PATH,
  } as const;

  const lobeFill = {
    "left-upper-lobe": "url(#leftUpperFill)",
    "left-lower-lobe": "url(#leftLowerFill)",
    "right-upper-lobe": "url(#rightUpperFill)",
    "right-middle-lobe": "url(#rightMiddleFill)",
    "right-lower-lobe": "url(#rightLowerFill)",
  } as const;

  return (
    <section className="lung-wrap">
      <svg
        viewBox="0 0 120 140"
        width="100%"
        role="img"
        aria-label="Lung recovery visualization"
        className="lung-scene"
        onMouseLeave={() => setHoveredPartId(null)}
      >
        <defs>
          <linearGradient id="leftUpperFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffd7c8" />
            <stop offset="100%" stopColor="#f4ab95" />
          </linearGradient>
          <linearGradient id="leftLowerFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffcdb8" />
            <stop offset="100%" stopColor="#e68f75" />
          </linearGradient>
          <linearGradient id="rightUpperFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffd8c8" />
            <stop offset="100%" stopColor="#f0a58c" />
          </linearGradient>
          <linearGradient id="rightMiddleFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffcdb8" />
            <stop offset="100%" stopColor="#ea987d" />
          </linearGradient>
          <linearGradient id="rightLowerFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffc6ae" />
            <stop offset="100%" stopColor="#df856a" />
          </linearGradient>
          <linearGradient id="airwayFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f7d0bf" />
            <stop offset="100%" stopColor="#d8a98f" />
          </linearGradient>
          <linearGradient id="mucusFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d9f5ff" />
            <stop offset="100%" stopColor="#95d5ed" />
          </linearGradient>
          <radialGradient id="alveoliDots" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {Object.entries(lobePaths).map(([id, path]) => (
            <clipPath key={id} id={`${id}-clip`}>
              <path d={path} />
            </clipPath>
          ))}
        </defs>

        <rect x="0" y="0" width="120" height="140" fill="#fff8f4" />

        <path
          d={`M12 ${122 - inhale * 1.3} C30 ${112 - inhale * 1.6}, 52 ${118 - inhale * 1.8}, 60 ${122 - inhale * 1.9} C68 ${
            118 - inhale * 1.8
          }, 90 ${112 - inhale * 1.6}, 108 ${122 - inhale * 1.3}`}
          fill="none"
          stroke="#c68a6c"
          strokeWidth="3.2"
        />

        <g
          transform={`translate(0 ${(-inhale * 0.35).toFixed(2)})`}
          style={{ opacity: 0.72 + state.ciliaFunction * 0.2 }}
        >
          <path
            d="M57 4 L63 4 C66 12, 66 20, 63 27 L57 27 C54 20, 54 12, 57 4 Z"
            fill="url(#airwayFill)"
            stroke="#704c3c"
            strokeWidth="1.5"
          />
          <g fill="none" stroke="#735446" strokeLinecap="round">
            <path d="M60 25 C52 33, 45 39, 37 51" strokeWidth="2.8" />
            <path d="M60 25 C68 33, 75 39, 83 51" strokeWidth="2.8" />
            <path d="M42 43 C35 54, 33 64, 33 76" strokeWidth="1.5" />
            <path d="M78 43 C85 54, 87 64, 87 76" strokeWidth="1.5" />
            <path d="M50 47 C45 58, 44 68, 44 79" strokeWidth="1.2" />
            <path d="M70 47 C75 58, 76 68, 76 79" strokeWidth="1.2" />
          </g>
        </g>

        {(Object.keys(lobePaths) as LobeId[]).map((lobeId) => {
          const isActive = selectedPartId === lobeId || hoveredPartId === lobeId;

          return (
            <g key={lobeId} transform={lobeMotion[lobeId]}>
              <path d={lobePaths[lobeId]} fill={lobeFill[lobeId]} stroke="#6e493b" strokeWidth="1.5" />
              <path d={lobePaths[lobeId]} fill="#c04f3f" opacity={inflammationOpacity} />

              <g clipPath={`url(#${lobeId}-clip)`} opacity={mucusOpacity}>
                <path
                  d={`${
                    lobeId.includes("left")
                      ? "M24 80 C29 72, 40 74, 48 84 C53 92, 53 104, 46 112 C37 122, 26 116, 22 104 C20 95, 20 86, 24 80 Z"
                      : "M96 80 C91 72, 80 74, 72 84 C67 92, 67 104, 74 112 C83 122, 94 116, 98 104 C100 95, 100 86, 96 80 Z"
                  }`}
                  fill="url(#mucusFill)"
                />
              </g>

              <g clipPath={`url(#${lobeId}-clip)`} opacity={sparkleOpacity}>
                <ellipse
                  cx={lobeId.includes("left") ? 38 : 82}
                  cy={lobeId.includes("upper") ? 48 : lobeId.includes("middle") ? 74 : 102}
                  rx={10}
                  ry={7}
                  fill="url(#alveoliDots)"
                />
              </g>

              <g clipPath={`url(#${lobeId}-clip)`} opacity={sootOpacity}>
                {lobeParticles[lobeId].map((particle, index) => (
                  <circle key={`${lobeId}-${index}`} cx={particle.x} cy={particle.y} r={particle.r} fill="#242424" />
                ))}
              </g>

              <path
                d={lobePaths[lobeId]}
                className="anatomy-region anatomy-region--fill"
                fill="#0d5f8a"
                fillOpacity={isActive ? 0.2 : 0}
                stroke="#0d5f8a"
                strokeWidth={isActive ? 1.3 : 0.7}
                strokeOpacity={isActive ? 0.42 : 0}
                data-testid={`hotspot-${lobeId}`}
                aria-label={`Ask about ${REGIONS.find((region) => region.id === lobeId)?.label ?? lobeId}`}
                onMouseEnter={() => setHoveredPartId(lobeId)}
                onMouseLeave={() => setHoveredPartId((current) => (current === lobeId ? null : current))}
                onClick={() => onSelectPart?.(lobeId)}
              />
              {isActive && (
                <text
                  x={REGIONS.find((region) => region.id === lobeId)?.labelX ?? 60}
                  y={REGIONS.find((region) => region.id === lobeId)?.labelY ?? 70}
                  textAnchor="middle"
                  fontSize="3.1"
                  fill="#0d5f8a"
                  className="anatomy-region-label"
                >
                  {REGIONS.find((region) => region.id === lobeId)?.label ?? lobeId}
                </text>
              )}
            </g>
          );
        })}

        <path
          d="M58 63 C56 58, 50 58, 49 64 C48 69, 52 73, 60 81 C68 73, 72 69, 71 64 C70 58, 64 58, 62 63 Z"
          fill="#de6c78"
          stroke="#a44956"
          strokeWidth="1"
          transform={`translate(60 70) scale(${heartScale.toFixed(4)}) translate(-60 -70)`}
        />

        {REGIONS.filter(
          (region) =>
            !(
              region.id.includes("upper-lobe") ||
              region.id.includes("middle-lobe") ||
              region.id.includes("lower-lobe")
            ),
        ).map((region) => {
          const active = selectedPartId === region.id || hoveredPartId === region.id;
          const isStroke = region.kind === "stroke";
          return (
            <g key={region.id}>
              <path
                d={region.path}
                className={`anatomy-region anatomy-region--${region.kind}`}
                fill={isStroke ? "none" : "#0d5f8a"}
                fillOpacity={isStroke ? undefined : active ? 0.2 : 0}
                stroke="#0d5f8a"
                strokeWidth={isStroke ? (active ? 7.5 : region.strokeWidth ?? 6.5) : active ? 1.3 : 0.7}
                strokeOpacity={isStroke ? (active ? 0.35 : 0) : active ? 0.42 : 0}
                pointerEvents={isStroke ? "stroke" : "all"}
                data-testid={`hotspot-${region.id}`}
                aria-label={`Ask about ${region.label}`}
                onMouseEnter={() => setHoveredPartId(region.id)}
                onMouseLeave={() => setHoveredPartId((current) => (current === region.id ? null : current))}
                onClick={() => onSelectPart?.(region.id)}
              />
              {active && (
                <text
                  x={region.labelX}
                  y={region.labelY}
                  textAnchor="middle"
                  fontSize="3.1"
                  fill="#0d5f8a"
                  className="anatomy-region-label"
                >
                  {region.label}
                </text>
              )}
            </g>
          );
        })}

        {state.isProjected && (
          <g>
            <rect x="84" y="6" width="30" height="9" rx="4.5" fill="#2b7a78" opacity="0.95" />
            <text x="99" y="12.2" textAnchor="middle" fontSize="3.2" fill="#ffffff">
              Projected
            </text>
          </g>
        )}

        <text x="4" y="136.5" fontSize="3.7" fill="#2d211a">
          Recovery {(state.recoveryPercent * 100).toFixed(0)}% • Day {state.previewDays}
        </text>
      </svg>

      <div className="viz-caption">
        {state.isProjected
          ? `Previewing day ${state.previewDays} (current streak: ${state.daysSinceQuit} days).`
          : `Today is day ${state.daysSinceQuit} smoke-free.`}
      </div>
      <div className="viz-vitals">
        Estimated resting pulse {state.restingHeartRateBpm.toFixed(0)} bpm • Breathing{" "}
        {state.respirationRatePerMin.toFixed(1)} breaths/min
      </div>
      <div className="viz-hint">Tap an anatomical region to ask questions about that structure.</div>
    </section>
  );
}
