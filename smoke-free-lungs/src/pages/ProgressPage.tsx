import { BadgeStrip } from "../components/BadgeStrip";
import { RecoveryActivity } from "../components/RecoveryActivity";
import { StatsCards } from "../components/StatsCards";
import { MILESTONE_BADGES } from "../milestones";
import type { RecoveryState, ValidatedInputs } from "../model";

type Props = {
  state: RecoveryState;
  summary: ValidatedInputs;
  earnedBadgeIds: string[];
};

export function ProgressPage({ state, summary, earnedBadgeIds }: Props) {
  return (
    <section className="page-panel">
      <div className="page-grid page-grid--progress">
        <article className="card card--activity">
          <RecoveryActivity quitDateISO={summary.quitDateISO} currentDaysSinceQuit={state.daysSinceQuit} />
        </article>

        <article className="card card--stats">
          <StatsCards state={state} />
        </article>

        <article className="card card--span-12">
          <BadgeStrip badges={MILESTONE_BADGES} earnedBadgeIds={earnedBadgeIds} currentDays={state.daysSinceQuit} />
        </article>
      </div>
    </section>
  );
}
