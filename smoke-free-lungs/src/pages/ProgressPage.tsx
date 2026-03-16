import { BadgeStrip } from "../components/BadgeStrip";
import { MethodPanel } from "../components/MethodPanel";
import { RecoveryActivity } from "../components/RecoveryActivity";
import { StatsCards } from "../components/StatsCards";
import { TimelineScrubber } from "../components/TimelineScrubber";
import { MILESTONE_BADGES } from "../milestones";
import type { RecoveryState, ValidatedInputs } from "../model";

type Props = {
  state: RecoveryState;
  summary: ValidatedInputs;
  earnedBadgeIds: string[];
  onPreviewDaysChange: (next: number) => void;
};

export function ProgressPage({ state, summary, earnedBadgeIds, onPreviewDaysChange }: Props) {
  return (
    <section className="page-panel">
      <div className="page-grid page-grid--progress">
        <article className="card card--span-12">
          <div className="progress-banner">
            <div>
              <p className="progress-banner__eyebrow">Recovery focus</p>
              <h2 className="section-title">Track recovery against the patient goal</h2>
              <p className="section-subtitle">
                The progress view keeps the smoke-free streak, smoking rate, and target milestones together.
              </p>
            </div>

            <div className="goal-grid">
              <article className="goal-card">
                <span className="goal-card__label">Goal</span>
                <strong className="goal-card__value">{summary.recoveryGoal}</strong>
              </article>
              <article className="goal-card">
                <span className="goal-card__label">Smoke-free time</span>
                <strong className="goal-card__value">{state.daysSinceQuit} days</strong>
              </article>
              <article className="goal-card">
                <span className="goal-card__label">Smoking rate before quit</span>
                <strong className="goal-card__value">{state.cigsPerDay.toFixed(2)} cig/day</strong>
              </article>
            </div>
          </div>
        </article>

        <article className="card card--timeline">
          <TimelineScrubber
            previewDays={state.previewDays}
            actualDays={state.daysSinceQuit}
            maxDays={state.maxPreviewDays}
            quitDateISO={summary.quitDateISO}
            onChange={onPreviewDaysChange}
          />
        </article>

        <article className="card card--activity">
          <RecoveryActivity quitDateISO={summary.quitDateISO} currentDaysSinceQuit={state.daysSinceQuit} />
        </article>

        <article className="card card--stats">
          <StatsCards state={state} />
        </article>

        <article className="card card--span-12">
          <BadgeStrip badges={MILESTONE_BADGES} earnedBadgeIds={earnedBadgeIds} currentDays={state.daysSinceQuit} />
        </article>

        <article className="card card--span-12">
          <MethodPanel />
        </article>
      </div>
    </section>
  );
}
