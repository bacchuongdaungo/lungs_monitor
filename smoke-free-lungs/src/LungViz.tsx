import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { RecoveryState } from "./model";
import { hashStringToUint32, mulberry32 } from "./rng";

type Props = {
  state: RecoveryState;
  seedKey: string;
};

type Particle = {
  x: number;
  y: number;
  r: number;
};

function genParticles(seedKey: string, count: number): Particle[] {
  const seed = hashStringToUint32(seedKey);
  const rand = mulberry32(seed);

  const left = { x0: 18, x1: 48, y0: 20, y1: 88 };
  const right = { x0: 52, x1: 82, y0: 20, y1: 88 };

  const particles: Particle[] = [];
  for (let idx = 0; idx < count; idx += 1) {
    const box = rand() < 0.5 ? left : right;
    particles.push({
      x: box.x0 + rand() * (box.x1 - box.x0),
      y: box.y0 + rand() * (box.y1 - box.y0),
      r: 0.4 + rand() * 1.5,
    });
  }

  return particles;
}

export function LungViz({ state, seedKey }: Props) {
  const maxParticles = 760;
  const particles = useMemo(() => genParticles(seedKey, maxParticles), [seedKey]);

  const sootCount = Math.round(35 + state.sootLoad * 650);
  const sootOpacity = 0.08 + 0.62 * state.sootLoad;
  const inflammationOpacity = 0.08 + 0.64 * state.inflammation;
  const mucusOpacity = 0.05 + 0.75 * state.mucus;

  const ciliaDuration = `${(2.5 - state.ciliaFunction * 1.5).toFixed(2)}s`;
  const ciliaSwing = `${(0.6 + state.ciliaFunction * 1.9).toFixed(2)}px`;
  const ciliaStyle = {
    "--cilia-duration": ciliaDuration,
    "--cilia-swing": ciliaSwing,
  } as CSSProperties;

  return (
    <section className="lung-wrap">
      <svg viewBox="0 0 100 100" width="100%" role="img" aria-label="Lung recovery visualization">
        <defs>
          <linearGradient id="lungFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffe3cf" />
            <stop offset="100%" stopColor="#ffd4bc" />
          </linearGradient>
          <linearGradient id="mucusFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d9f3ff" />
            <stop offset="100%" stopColor="#b6e3f5" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="100" height="100" fill="#fff7f1" />

        <path
          d="M48 5 C48 15, 48 20, 50 28 C52 20, 52 15, 52 5"
          fill="none"
          stroke="#3f2f27"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M50 28 C44 34, 40 38, 35 44"
          fill="none"
          stroke="#3f2f27"
          strokeWidth="2.0"
          strokeLinecap="round"
        />
        <path
          d="M50 28 C56 34, 60 38, 65 44"
          fill="none"
          stroke="#3f2f27"
          strokeWidth="2.0"
          strokeLinecap="round"
        />

        <path
          d="M48 18
             C40 18, 26 24, 22 38
             C18 52, 20 78, 34 90
             C44 98, 50 88, 48 76
             C46 60, 48 40, 50 32
             C52 40, 54 60, 52 76
             C50 88, 56 98, 66 90
             C80 78, 82 52, 78 38
             C74 24, 60 18, 52 18
             Z"
          fill="url(#lungFill)"
          stroke="#2d211a"
          strokeWidth="2"
        />

        <path
          d="M48 18
             C40 18, 26 24, 22 38
             C18 52, 20 78, 34 90
             C44 98, 50 88, 48 76
             C46 60, 48 40, 50 32
             C52 40, 54 60, 52 76
             C50 88, 56 98, 66 90
             C80 78, 82 52, 78 38
             C74 24, 60 18, 52 18
             Z"
          fill="#d4553d"
          opacity={inflammationOpacity}
        />

        <g opacity={mucusOpacity}>
          <path
            d="M25 55 C35 45, 45 60, 55 50 C65 40, 75 55, 70 68 C65 80, 45 82, 35 75 C25 68, 18 62, 25 55 Z"
            fill="url(#mucusFill)"
          />
        </g>

        <g opacity={sootOpacity}>
          {particles.slice(0, sootCount).map((particle, index) => (
            <circle key={index} cx={particle.x} cy={particle.y} r={particle.r} fill="#1f1f1f" />
          ))}
        </g>

        <g className="cilia-group" style={ciliaStyle} opacity={0.25 + state.ciliaFunction * 0.65}>
          <path d="M34 44 C33 46, 32 48, 31 50" fill="none" stroke="#2d211a" strokeWidth="1" />
          <path d="M35 46 C34 48, 33 50, 32 52" fill="none" stroke="#2d211a" strokeWidth="1" />
          <path d="M66 44 C67 46, 68 48, 69 50" fill="none" stroke="#2d211a" strokeWidth="1" />
          <path d="M65 46 C66 48, 67 50, 68 52" fill="none" stroke="#2d211a" strokeWidth="1" />
        </g>

        {state.isProjected && (
          <g>
            <rect x="68" y="4" width="28" height="8" rx="4" fill="#2b7a78" opacity="0.95" />
            <text x="82" y="9.7" textAnchor="middle" fontSize="3.2" fill="#ffffff">
              Projected
            </text>
          </g>
        )}

        <text x="4" y="98" fontSize="4" fill="#2d211a">
          Dirtiness {(state.overallDirtiness * 100).toFixed(0)}% • Day {state.previewDays}
        </text>
      </svg>

      <div className="viz-caption">
        {state.isProjected
          ? `Previewing day ${state.previewDays} (current streak: ${state.daysSinceQuit} days).`
          : `Today is day ${state.daysSinceQuit} smoke-free.`}
      </div>
    </section>
  );
}