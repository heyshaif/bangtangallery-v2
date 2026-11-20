// gameScores.ts — Batch 123: client side of the per-game
// leaderboards. The identity is the visitor profile (falling
// back to the quiz player card), so a score is always posted
// under the one name the visitor uses everywhere on the site.

import { getProfile } from './profile';

export type ArcadeGame = 'memory' | 'wordle' | 'emoji' | 'bomb' | 'trivia';

export function gameIdentity(): { name: string; emoji: string } | null {
  const p = getProfile();
  if (p?.name) return { name: p.name, emoji: p.emoji || '💜' };
  try {
    const raw = localStorage.getItem('bts_quiz_profile');
    if (raw) {
      const q = JSON.parse(raw);
      if (q?.username) return { name: String(q.username), emoji: q.emoji || '💜' };
    }
  } catch {
    /* no identity yet */
  }
  return null;
}

export async function postGameScore(game: ArcadeGame, score: number): Promise<any[] | null> {
  const id = gameIdentity();
  if (!id || !(score > 0)) return null;
  try {
    const r = await fetch('/api/games/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, name: id.name, emoji: id.emoji, score: Math.floor(score) }),
    });
    const d = await r.json().catch(() => null);
    return d?.success && Array.isArray(d.entries) ? d.entries : null;
  } catch {
    return null;
  }
}

export async function fetchGameLeaderboard(game: ArcadeGame): Promise<any[]> {
  try {
    const r = await fetch('/api/games/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game }),
    });
    const d = await r.json().catch(() => null);
    return d?.success && Array.isArray(d.entries) ? d.entries : [];
  } catch {
    return [];
  }
}
