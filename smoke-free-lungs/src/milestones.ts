// src/milestones.ts
export type MilestoneBadge = {
  id: string;
  day: number;
  title: string;
  detail: string;
  sourceKey: string;
};

export const MILESTONE_BADGES: MilestoneBadge[] = [
  {
    id: "day-1",
    day: 1,
    title: "24 Hours Smoke-Free",
    detail: "Carbon monoxide levels can move toward a healthier range after one day.",
    sourceKey: "CDC-01",
  },
  {
    id: "day-3",
    day: 3,
    title: "72 Hours",
    detail: "Nicotine withdrawal is often strongest in the first three days.",
    sourceKey: "NHS-01",
  },
  {
    id: "day-14",
    day: 14,
    title: "Two Weeks",
    detail: "Breathing comfort and circulation can begin to noticeably improve.",
    sourceKey: "CDC-02",
  },
  {
    id: "day-30",
    day: 30,
    title: "One Month",
    detail: "Cough and mucus symptoms often reduce as airway clearance improves.",
    sourceKey: "PAPER-01",
  },
  {
    id: "day-90",
    day: 90,
    title: "Three Months",
    detail: "Lung function trend can improve in the first few smoke-free months.",
    sourceKey: "NHS-02",
  },
  {
    id: "day-180",
    day: 180,
    title: "Six Months",
    detail: "Respiratory irritation may continue easing with sustained abstinence.",
    sourceKey: "PAPER-02",
  },
  {
    id: "day-365",
    day: 365,
    title: "One Year",
    detail: "Major cardiovascular risk reduction is expected after one year.",
    sourceKey: "CDC-03",
  },
  {
    id: "day-730",
    day: 730,
    title: "Two Years",
    detail: "Longer smoke-free periods support ongoing respiratory recovery.",
    sourceKey: "WHO-01",
  },
];

export function getEarnedBadgeIds(daysSmokeFree: number): string[] {
  return MILESTONE_BADGES.filter((badge) => daysSmokeFree >= badge.day).map((badge) => badge.id);
}

export function mergeEarnedBadgeIds(existing: string[], unlocked: string[]): string[] {
  const merged = new Set<string>(existing);
  for (const id of unlocked) merged.add(id);
  return [...merged];
}