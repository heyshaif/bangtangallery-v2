// Visitor profile (Batch 94) — a light, browser-local identity.
// There are no visitor accounts or passwords: the profile lives
// in this browser (localStorage), is created automatically the
// first time the visitor submits anything under a name (joining
// the Supporters Wall, voting, submitting a video/track,
// feedback, contact), and can also be created from the header
// profile button. Only the browser holding the profile can edit
// it. Name changes are NOT instant: they go to the admin as an
// approval request (Admin Panel → Support + an email copy) and
// apply only after the admin accepts.

export interface VisitorProfile {
  id: string;
  name: string;
  emoji: string;
  photo: string; // data URI or ''
  bias: string;
  country: string;
  createdAt: string; // ISO date
}

const KEY = 'bg_profile';
const LAST_KEY = 'bg_profile_last';
const QUIZ_KEY = 'bts_quiz_profile';
export const PROFILE_EVENT = 'bg-profile-changed';

// Batch 126 — the restore stash: when a visitor logs out on
// purpose, their profile (and quiz card) is parked here so a
// later "Restore my profile" tap on THIS browser brings the
// exact same profile id back — the username stays theirs.
// Same-browser only: clearing browser data loses it, and
// there is still no password, by design.
export interface StashedQuizProfile {
  username: string;
  emoji: string;
  photo: string;
}

export interface ProfileStash {
  profile: VisitorProfile;
  quiz: StashedQuizProfile | null;
}

function readQuizCard(): StashedQuizProfile | null {
  try {
    const raw = localStorage.getItem(QUIZ_KEY);
    if (!raw) return null;
    const q = JSON.parse(raw);
    if (!q || typeof q.username !== 'string' || !q.username.trim()) return null;
    return { username: q.username, emoji: q.emoji || '💜', photo: q.photo || '' };
  } catch {
    return null;
  }
}

function emit() {
  try {
    window.dispatchEvent(new Event(PROFILE_EVENT));
  } catch {}
}

// Batch 109 — the owner's one-name rule: once a visitor has a
// profile, every form on the site submits under that name (and
// the profile country follows them to the ARMY World Map).
export function profileName(): string {
  return getProfile()?.name || '';
}

export function profileHandle(): string {
  return profileName()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function getProfile(): VisitorProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p.name !== 'string' || !p.name.trim()) return null;
    return {
      id: String(p.id || ''),
      name: p.name,
      emoji: p.emoji || '💜',
      photo: p.photo || '',
      bias: p.bias || '',
      country: p.country || '',
      createdAt: p.createdAt || ''
    };
  } catch {
    return null;
  }
}

export function saveProfile(p: VisitorProfile): VisitorProfile {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
  emit();
  return p;
}

function newId(): string {
  return `prof-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Create the profile from a submission — only when none exists
 * yet, so later submissions never silently rename the profile
 * (renames go through the admin-approval flow). */
export function ensureProfile(
  name: string,
  extra?: { emoji?: string; bias?: string; country?: string }
): VisitorProfile | null {
  const clean = String(name || '').trim().slice(0, 40);
  if (!clean) return getProfile();
  const existing = getProfile();
  if (existing) return existing;
  return saveProfile({
    id: newId(),
    name: clean,
    emoji: extra?.emoji || '💜',
    photo: '',
    bias: extra?.bias || '',
    country: extra?.country || '',
    createdAt: new Date().toISOString()
  });
}

export function createProfile(input: {
  name: string;
  emoji?: string;
  bias?: string;
  country?: string;
  photo?: string;
}): VisitorProfile {
  return saveProfile({
    id: newId(),
    name: String(input.name || '').trim().slice(0, 40),
    emoji: input.emoji || '💜',
    photo: input.photo || '',
    bias: input.bias || '',
    country: input.country || '',
    createdAt: new Date().toISOString()
  });
}

/** Local-only updates (avatar, bias, country) — these apply at
 * once because they exist only in this browser. */
export function updateProfileLocal(patch: Partial<VisitorProfile>): VisitorProfile | null {
  const cur = getProfile();
  if (!cur) return null;
  return saveProfile({ ...cur, ...patch, id: cur.id, name: cur.name, createdAt: cur.createdAt });
}

/** Applied locally after the server confirms the admin accepted
 * a name-change request. */
export function applyApprovedName(newName: string): VisitorProfile | null {
  const cur = getProfile();
  if (!cur) return null;
  return saveProfile({ ...cur, name: String(newName).slice(0, 40) });
}

/** Log out: removes the profile from this browser. Public
 * submissions already made stay as they are.
 *
 * With { keepRestore: true } (the deliberate Log Out in the
 * profile panel), the current profile + quiz card are first
 * stashed under LAST_KEY so the visitor can restore the SAME
 * profile (same id, same username claim) on this browser
 * later — and the quiz card is cleared too, so a logged-out
 * visitor is genuinely signed out everywhere. Without the
 * option (create-flow rollbacks) the behaviour is unchanged:
 * only the active profile is removed and any older stash is
 * left untouched. */
export function clearProfile(opts?: { keepRestore?: boolean }) {
  try {
    if (opts?.keepRestore) {
      const cur = getProfile();
      if (cur) {
        const stash: ProfileStash = { profile: cur, quiz: readQuizCard() };
        try {
          localStorage.setItem(LAST_KEY, JSON.stringify(stash));
        } catch {}
      }
      localStorage.removeItem(KEY);
      localStorage.removeItem(QUIZ_KEY);
    } else {
      localStorage.removeItem(KEY);
    }
  } catch {}
  emit();
}

/** The profile stashed by the last deliberate log out on this
 * browser, or null. */
export function getLastProfile(): VisitorProfile | null {
  return readStash()?.profile ?? null;
}

function readStash(): ProfileStash | null {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    const p = s?.profile;
    if (!p || typeof p.name !== 'string' || !p.name.trim()) return null;
    const profile: VisitorProfile = {
      id: String(p.id || ''),
      name: p.name,
      emoji: p.emoji || '💜',
      photo: p.photo || '',
      bias: p.bias || '',
      country: p.country || '',
      createdAt: p.createdAt || ''
    };
    const q = s?.quiz;
    const quiz: StashedQuizProfile | null =
      q && typeof q.username === 'string' && q.username.trim()
        ? { username: q.username, emoji: q.emoji || '💜', photo: q.photo || '' }
        : null;
    return { profile, quiz };
  } catch {
    return null;
  }
}

/** Bring back the stashed profile (same id — the username
 * claim in the registry still matches it). Restores the quiz
 * card too, clears the stash, and notifies listeners. */
export function restoreLastProfile(): VisitorProfile | null {
  const stash = readStash();
  if (!stash) return null;
  try {
    localStorage.setItem(KEY, JSON.stringify(stash.profile));
    if (stash.quiz) {
      localStorage.setItem(QUIZ_KEY, JSON.stringify(stash.quiz));
    }
    localStorage.removeItem(LAST_KEY);
  } catch {}
  emit();
  return stash.profile;
}

/** Drop the restore stash (the "This isn't me" path). */
export function forgetLastProfile() {
  try {
    localStorage.removeItem(LAST_KEY);
  } catch {}
}
