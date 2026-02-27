import type { CSSProperties } from "react";
import type { RecoveryState } from "../model";

type Props = {
  state: RecoveryState;
};

export function BreathingDemo({ state }: Props) {
  const damagedAmplitude = Math.max(4, 11 - state.ciliaFunction * 6.5);
  const damagedDuration = Math.max(1.2, 2.2 - state.ciliaFunction * 0.8);

  const healthyStyle = {
    "--breath-amp": "12px",
    "--breath-duration": "3.2s",
  } as CSSProperties;

  const damagedStyle = {
    "--breath-amp": `${damagedAmplitude.toFixed(1)}px`,
    "--breath-duration": `${damagedDuration.toFixed(2)}s`,
  } as CSSProperties;

  return (
    <section>
      <h2 className="section-title">Breathing Demo: Damaged vs Healthy</h2>
      <p className="section-subtitle">
        Damaged breathing is simulated as shallower and less efficient than healthy breathing.
      </p>

      <div className="breathing-grid">
        <article className="breath-card breath-card--damaged" style={damagedStyle}>
          <h3>Current damaged profile</h3>
          <div className="breath-lungs" aria-label="Damaged breathing simulation">
            <span className="breath-lung" />
            <span className="breath-lung" />
          </div>
          <p>
            Depth and rhythm adapt from your current cilia function ({Math.round(state.ciliaFunction * 100)}%).
          </p>
        </article>

        <article className="breath-card breath-card--healthy" style={healthyStyle}>
          <h3>Healthy reference profile</h3>
          <div className="breath-lungs" aria-label="Healthy breathing simulation">
            <span className="breath-lung" />
            <span className="breath-lung" />
          </div>
          <p>Reference pattern: deeper expansion with smoother cadence.</p>
        </article>
      </div>
    </section>
  );
}