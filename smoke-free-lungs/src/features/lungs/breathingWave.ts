const EPS = 1e-6;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function easeInOutCubic(x: number): number {
  const t = clamp(x, 0, 1);
  if (t < 0.5) return 4 * t * t * t;
  const k = -2 * t + 2;
  return 1 - (k * k * k) / 2;
}

function normalizedExhaleDecay(y: number, k = 3.8): number {
  const t = clamp(y, 0, 1);
  const end = Math.exp(-k);
  const cur = Math.exp(-k * t);
  return (cur - end) / Math.max(EPS, 1 - end);
}

export function inhaleFactor(tSec: number, respRateBpm: number, inhaleFrac = 0.33): number {
  const bpm = clamp(respRateBpm, 6, 40);
  const cycleSec = 60 / bpm;
  const inhaleFraction = clamp(inhaleFrac, 0.15, 0.8);
  const inhaleSec = cycleSec * inhaleFraction;
  const phase = ((tSec % cycleSec) + cycleSec) % cycleSec;

  if (phase <= inhaleSec) {
    return easeInOutCubic(phase / Math.max(EPS, inhaleSec));
  }

  const exhaleSec = cycleSec - inhaleSec;
  return normalizedExhaleDecay((phase - inhaleSec) / Math.max(EPS, exhaleSec));
}

export function smoothValue(prev: number, next: number, dt: number, tauSec: number): number {
  const tau = Math.max(EPS, tauSec);
  const deltaTime = Math.max(0, dt);
  const alpha = 1 - Math.exp(-deltaTime / tau);
  return prev + (next - prev) * alpha;
}
