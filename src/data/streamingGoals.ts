// ARMY Streaming Goals — starter data (Batch 93).
// Counts are REAL Spotify stream totals read from the public
// Spotify counter (kworb.net) on Nov 9, 2026 — the same public
// data streaming trackers display. They are NOT site views and
// never start at zero. Goals are the next round milestone.
// The live list lives in config (streamingGoals) and can be
// updated from the Admin Panel; this file is the seed/fallback.

export interface StreamingGoal {
  id: string;
  title: string;
  current: number;
  goal: number;
  updatedAt: string;
}

export const STREAMING_GOALS_UPDATED = 'Nov 9, 2026';

export const DEFAULT_STREAMING_GOALS: StreamingGoal[] = [
  { id: 'goal-swim', title: 'SWIM', current: 1040872911, goal: 1100000000, updatedAt: STREAMING_GOALS_UPDATED },
  { id: 'goal-normal', title: 'NORMAL', current: 433476354, goal: 450000000, updatedAt: STREAMING_GOALS_UPDATED },
  { id: 'goal-body-to-body', title: 'Body to Body', current: 432177583, goal: 450000000, updatedAt: STREAMING_GOALS_UPDATED },
  { id: 'goal-hooligan', title: 'Hooligan', current: 397974696, goal: 400000000, updatedAt: STREAMING_GOALS_UPDATED },
  { id: 'goal-2-0', title: '2.0', current: 392011009, goal: 400000000, updatedAt: STREAMING_GOALS_UPDATED },
  { id: 'goal-fya', title: 'FYA', current: 335274609, goal: 350000000, updatedAt: STREAMING_GOALS_UPDATED },
  { id: 'goal-they-dont-know', title: "they don't know 'bout us", current: 330760583, goal: 350000000, updatedAt: STREAMING_GOALS_UPDATED },
  { id: 'goal-like-animals', title: 'Like Animals', current: 324601854, goal: 350000000, updatedAt: STREAMING_GOALS_UPDATED },
  { id: 'goal-aliens', title: 'Aliens', current: 319440602, goal: 350000000, updatedAt: STREAMING_GOALS_UPDATED },
  { id: 'goal-merry-go-round', title: 'Merry Go Round', current: 287688905, goal: 300000000, updatedAt: STREAMING_GOALS_UPDATED },
  { id: 'goal-into-the-sun', title: 'Into the Sun', current: 279784923, goal: 300000000, updatedAt: STREAMING_GOALS_UPDATED },
  { id: 'goal-please', title: 'Please', current: 272141483, goal: 300000000, updatedAt: STREAMING_GOALS_UPDATED },
  { id: 'goal-one-more-night', title: 'One More Night', current: 265288328, goal: 300000000, updatedAt: STREAMING_GOALS_UPDATED },
  { id: 'goal-no-29', title: 'No. 29', current: 214220827, goal: 250000000, updatedAt: STREAMING_GOALS_UPDATED },
  { id: 'goal-come-over', title: 'Come Over', current: 193850506, goal: 200000000, updatedAt: STREAMING_GOALS_UPDATED }
];

/** 1,040,872,911 → "1.04B"; 433,476,354 → "433.5M"; 2,025,704 → "2.03M" */
export function formatStreams(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
