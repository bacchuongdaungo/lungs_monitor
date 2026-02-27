import type { MilestoneBadge } from "../milestones";

type Props = {
  badges: MilestoneBadge[];
  earnedBadgeIds: string[];
  currentDays: number;
};

export function BadgeStrip({ badges, earnedBadgeIds, currentDays }: Props) {
  const earnedSet = new Set(earnedBadgeIds);

  return (
    <section>
      <h2 className="section-title">Milestone Badges</h2>
      <p className="section-subtitle">Badges unlock from your actual smoke-free streak.</p>

      <div className="badge-grid">
        {badges.map((badge) => {
          const unlocked = earnedSet.has(badge.id);
          const daysLeft = Math.max(0, badge.day - currentDays);

          return (
            <article
              key={badge.id}
              data-testid={`badge-${badge.id}`}
              data-unlocked={String(unlocked)}
              className={`badge ${unlocked ? "badge--unlocked" : "badge--locked"}`}
            >
              <header className="badge-head">
                <span className="badge-day">Day {badge.day}</span>
                <span className="badge-status">{unlocked ? "Unlocked" : `${daysLeft}d left`}</span>
              </header>
              <strong className="badge-title">{badge.title}</strong>
              <p className="badge-detail">{badge.detail}</p>
              <small className="badge-source">Source: {badge.sourceKey}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}