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
          <span className="stat-label">Smoking period</span>
          <strong className="stat-value">{state.smokingYears.toFixed(1)} years</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Smoking rate</span>
          <strong className="stat-value">{state.cigsPerDay.toFixed(2)} cig/day</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Equivalent packs/week</span>
          <strong className="stat-value">{state.packsPerWeek.toFixed(2)}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Pack-years (base/effective)</span>
          <strong className="stat-value">{state.packYears.toFixed(1)} / {state.effectivePackYears.toFixed(1)}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Recovery to target</span>
          <strong className="stat-value">{pct(state.recoveryPercent)}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Lung cleanliness index</span>
          <strong className="stat-value">{pct(cleanliness)}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Metabolism estimate</span>
          <strong className="stat-value">
            {state.metabolismCategory} ({state.metabolismFactor.toFixed(2)}x)
          </strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Current age (derived)</span>
          <strong className="stat-value">{state.ageYears.toFixed(1)} years</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">BMR estimate</span>
          <strong className="stat-value">{Math.round(state.bmrKcalPerDay)} kcal/day</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Brand chemistry</span>
          <strong className="stat-value">
            {state.nicotineMgPerCig.toFixed(1)}mg Nic / {state.tarMgPerCig.toFixed(0)}mg Tar
          </strong>
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
          <span>Tar burden</span>
          <span>{pct(state.tarBurden)}</span>
        </div>
        <div className="subscore-row">
          <span>Nicotine dependence</span>
          <span>{pct(state.nicotineDependence)}</span>
        </div>
        <div className="subscore-row">
          <span>Dopamine tolerance</span>
          <span>{pct(state.dopamineTolerance)}</span>
        </div>
        <div className="subscore-row">
          <span>Cilia function</span>
          <span>{pct(state.ciliaFunction)}</span>
        </div>
      </div>

      <p className="stat-footnote">
        Estimated intake: {state.dailyNicotineMg.toFixed(1)}mg nicotine/day, {state.dailyTarMg.toFixed(0)}mg tar/day before quitting.
      </p>
    </section>
  );
}