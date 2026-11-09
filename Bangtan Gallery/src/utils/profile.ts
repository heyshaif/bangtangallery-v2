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
export const PROFILE_EVENT = 'bg-profile-changed';

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
 * submissions already made stay as they are. */
export function clearProfile() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  emit();
}
