// Batch 188 — Instagram posts per member, collected 2026-11-23 via the
// Instagram connector (instagram-cli posts, newest first). /p/ and /reel/
// URLs only; grid collabs included (they appear on the member's profile).
// RM/SUGA/Jimin/Jung Kook grids are complete; Jin/j-hope/V reach back to
// mid-2022 (a few 2021-22 posts may be missing — the API kept returning
// more pages). Embedded with Instagram's official embed.js; only posts
// near the viewport load (see InstagramCarousel). Counts: RM 31, Jin 163,
// SUGA 85, j-hope 200, Jimin 34, V 159, Jung Kook 57 — 729 total.
export interface MemberInstagramPost { date: string; url: string; }

export const MEMBER_INSTAGRAM_HANDLE: Record<string, string> = {
  rm: 'rkive',
  jin: 'jin',
  suga: 'agustd',
  jhope: 'uarmyhope',
  jimin: 'j.m',
  v: 'thv',
  jungkook: 'mnijungkook',
};

// Loads the (large) post lists on demand so the main bundle stays light.
export async function loadMemberInstagramPosts(memberId: string): Promise<MemberInstagramPost[]> {
  const mod = await import('./memberInstagramPosts');
  return mod.MEMBER_INSTAGRAM_POSTS[memberId] || [];
}
