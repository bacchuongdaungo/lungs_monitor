import type { RecoveryState } from "../model";

type Props = {
  state: RecoveryState;
};

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function StatsCards({ state }: Props) {
  const cleanliness = 1 - state.overallDirtiness;

  return (
    <section>
      <h2 className="section-title">Progress Snapshot</h2>
      <p className="section-subtitle">Educational proxies, not personal medical measurements.</p>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Smoke-free streak</span>
          <strong className="stat-value">{state.daysSinceQuit} days</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Viewing timeline day</span>
          <strong className="stat-value">{state.previewDays}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Pack-years</span>
          <strong className="stat-value">{state.packYears.toFixed(1)}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Lung cleanliness index</span>
          <strong className="stat-value">{pct(cleanliness)}</strong>
        </div>
      </div>

      <div className="subscore-list">
        <div className="subscore-row">
          <span>Soot load</span>
          <span>{pct(state.sootLoad)}</span>
        </div>
        <div className="subscore-row">
          <span>Inflammation</span>
          <span>{pct(state.inflammation)}</span>
        </div>
        <div className="subscore-row">
          <span>Mucus</span>
          <span>{pct(state.mucus)}</span>
        </div>
        <div className="subscore-row">
          <span>Cilia function</span>
          <span>{pct(state.ciliaFunction)}</span>
        </div>
      </div>
    </section>
  );
}