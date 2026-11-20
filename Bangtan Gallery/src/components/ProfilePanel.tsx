import { useEffect, useRef, useState } from 'react';
import { X, Pencil, LogOut, Check, Camera } from 'lucide-react';
import CountrySelect from './CountrySelect';
import {
  VisitorProfile,
  getProfile,
  createProfile,
  updateProfileLocal,
  applyApprovedName,
  clearProfile,
  getLastProfile,
  restoreLastProfile,
  forgetLastProfile
} from '../utils/profile';
import { saveCountry, pinCountry } from '../utils/armyMap';

// Batch 109: a country chosen in the profile follows the
// visitor to the ARMY World Map — remembered for every form,
// and pinned (moving their old pin) when it differs.
const syncMapCountry = async (country: string) => {
  if (!country) return;
  saveCountry(country);
  try {
    const joined = localStorage.getItem('bg_armymap_country') || '';
    if (joined === country) return;
    const ok = await pinCountry(country, joined || undefined);
    if (ok) localStorage.setItem('bg_armymap_country', country);
  } catch { /* best-effort — the map join bar pre-selects it too */ }
};

// Visitor profile panel (Batch 94) — opened from the header
// profile button. No accounts/passwords: the profile lives in
// this browser, and only this browser can edit it. Avatar,
// bias and country apply instantly; a NAME change sends an
// approval request to the admin (Admin Panel → Support, plus
// an email copy) and applies only after the admin accepts.

const MEMBER_EMOJIS: Record<string, string> = {
  RM: '🐨',
  Jin: '🐹',
  SUGA: '🐱',
  'j-hope': '🐿️',
  Jimin: '🐥',
  V: '🐯',
  'Jung Kook': '🐰',
  'OT7 (All 7)': '💜'
};
const BIAS_OPTIONS = Object.keys(MEMBER_EMOJIS);
const ADMIN_NOTIFY_EMAIL = 'tgarirangarmy7@gmail.com';

function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no ctx');
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function ProfilePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [profile, setProfile] = useState<VisitorProfile | null>(null);
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('view');
  const [reqStatus, setReqStatus] = useState<any>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [lastProfile, setLastProfile] = useState<VisitorProfile | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // form state
  const [fName, setFName] = useState('');
  const [fEmoji, setFEmoji] = useState('💜');
  const [fPhoto, setFPhoto] = useState('');
  const [fBias, setFBias] = useState('');
  const [fCountry, setFCountry] = useState('');

  useEffect(() => {
    if (!open) return;
    const p = getProfile();
    setProfile(p);
    setMode(p ? 'view' : 'create');
    setLastProfile(p ? null : getLastProfile());
    setNotice('');
    setError('');
    setConfirmLogout(false);
    setReqStatus(null);
    if (p) {
      // Batch 102: claim this profile's username in the registry
      // (first profile to register a name owns it). If another
      // profile already owns it, tell the visitor plainly.
      fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: p.name, displayName: p.name, profileId: p.id })
      })
        .then((r) => r.json())
        .then((reg) => {
          if (reg && reg.success === false) {
            setNotice('⚠️ Another ARMY has already claimed this username. Please pick a new name from Edit Profile.');
          }
        })
        .catch(() => {});
      fetch('/api/profile/request-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: p.id })
      })
        .then((r) => r.json())
        .then((data) => {
          if (!data?.success) return;
          const req = data.request;
          setReqStatus(req);
          if (req?.status === 'approved' && req.newName && req.newName !== p.name) {
            fetch('/api/users/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: req.newName, displayName: req.newName, profileId: p.id })
            }).catch(() => {});
            const updated = applyApprovedName(req.newName);
            if (updated) {
              setProfile(updated);
              setNotice(`🎉 The admin approved your name change — you are now "${req.newName}"!`);
            }
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  if (!open) return null;

  const startEdit = () => {
    if (!profile) return;
    setFName(profile.name);
    setFEmoji(profile.emoji);
    setFPhoto(profile.photo);
    setFBias(profile.bias);
    setFCountry(profile.country);
    setError('');
    setMode('edit');
  };

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await resizePhoto(file);
      setFPhoto(data);
    } catch {
      setError('That photo could not be read — please try another one.');
    }
    e.target.value = '';
  };

  const submitCreate = async () => {
    if (saving) return;
    const name = fName.trim();
    if (name.length < 2) {
      setError('Please enter your name (at least 2 characters).');
      return;
    }
    setSaving(true);
    setError('');
    // Batch 102 — one username, one owner: check the registry
    // before creating, and claim the name on registration. If the
    // claim race is lost, the just-created profile is rolled back.
    const chk: any = await fetch('/api/profile/check-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
      .then((r) => r.json())
      .catch(() => null);
    if (chk?.taken) {
      setError('This username is already taken — please choose a different name.');
      setSaving(false);
      return;
    }
    const p = createProfile({ name, emoji: fEmoji, bias: fBias, country: fCountry, photo: fPhoto });
    const reg: any = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name, displayName: name, profileId: p.id })
    })
      .then((r) => r.json())
      .catch(() => null);
    if (reg && reg.success === false) {
      clearProfile();
      setError('This username is already taken — please choose a different name.');
      setSaving(false);
      return;
    }
    setProfile(p);
    setMode('view');
    setNotice('💜 Your profile is ready! It lives in this browser.');
    setSaving(false);
    void syncMapCountry(fCountry);
  };

  const submitEdit = async () => {
    if (!profile || saving) return;
    setError('');
    // Local-only fields apply at once.
    updateProfileLocal({ emoji: fEmoji, photo: fPhoto, bias: fBias, country: fCountry });
    if (fCountry && fCountry !== profile.country) void syncMapCountry(fCountry);
    const newName = fName.trim();
    if (newName && newName !== profile.name) {
      if (newName.length < 2) {
        setError('The new name needs at least 2 characters.');
        return;
      }
      setSaving(true);
      try {
        const chk: any = await fetch('/api/profile/check-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName, profileId: profile.id })
        })
          .then((r) => r.json())
          .catch(() => null);
        if (chk?.taken) {
          setError('This username is already taken — please choose a different name.');
          setSaving(false);
          return;
        }
        const res = await fetch('/api/profile/request-edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId: profile.id, oldName: profile.name, newName })
        });
        const data = await res.json();
        if (!data?.success) throw new Error(data?.error || 'Could not send the request.');
        // Email copy to the admin inbox (best-effort, same route
        // as the contact form).
        fetch(`https://formsubmit.co/ajax/${ADMIN_NOTIFY_EMAIL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            name: profile.name,
            _subject: `Bangtan Gallery profile name change: ${profile.name} → ${newName}`,
            message: `A visitor asked to change their profile name.\nCurrent name: ${profile.name}\nRequested name: ${newName}\nReview it in Admin Panel → Support → Profile Requests.`,
            _template: 'table',
            _captcha: 'false'
          })
        }).catch(() => {});
        setReqStatus({ status: 'pending', oldName: profile.name, newName });
        setNotice(`📩 Name change sent! "${profile.name}" → "${newName}" applies when the admin accepts it.`);
      } catch (err: any) {
        setError(err?.message || 'Could not send the request. Please try again.');
        setProfile(getProfile());
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    setProfile(getProfile());
    setMode('view');
  };

  const doLogout = () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
      return;
    }
    // Batch 126: a deliberate log out stashes the profile so
    // the visitor can restore the SAME profile (and username)
    // on this device later — no password needed.
    clearProfile({ keepRestore: true });
    onClose();
  };

  const doRestore = () => {
    const p = restoreLastProfile();
    if (!p) {
      setLastProfile(null);
      return;
    }
    setLastProfile(null);
    setProfile(p);
    setMode('view');
    setNotice('💜 Welcome back! Your profile is restored — same name, same you.');
  };

  const doForgetLast = () => {
    forgetLastProfile();
    setLastProfile(null);
  };

  const avatar = (p: VisitorProfile | null, size: string) =>
    p?.photo ? (
      <img src={p.photo} alt="" className={`${size} rounded-full object-cover shrink-0`} />
    ) : (
      <span className={`${size} rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shrink-0`}>
        <span style={{ fontSize: size.includes('w-16') ? 30 : 16 }}>{p?.emoji || '💜'}</span>
      </span>
    );

  const emojiChips = (
    <div className="flex flex-wrap gap-1.5">
      {BIAS_OPTIONS.map((b) => (
        <button
          key={b}
          type="button"
          onClick={() => {
            setFEmoji(MEMBER_EMOJIS[b]);
            setFBias(b);
          }}
          className={`w-9 h-9 rounded-full text-lg flex items-center justify-center border cursor-pointer ${fEmoji === MEMBER_EMOJIS[b] ? 'bg-purple-600/40 border-purple-400' : 'bg-white/5 border-white/10'}`}
          title={b}
        >
          {MEMBER_EMOJIS[b]}
        </button>
      ))}
    </div>
  );

  const formFields = (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {fPhoto ? (
          <img src={fPhoto} alt="" className="w-14 h-14 rounded-full object-cover" />
        ) : (
          <span className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl">{fEmoji}</span>
        )}
        <button type="button" onClick={() => fileRef.current?.click()} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold text-stone-200 flex items-center gap-1.5 cursor-pointer">
          <Camera className="w-3.5 h-3.5" /> Upload photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
      </div>
      {emojiChips}
      <div className="space-y-1">
        <label className="text-[10px] font-mono font-bold text-purple-300 uppercase block">Your name</label>
        <input value={fName} onChange={(e) => setFName(e.target.value)} maxLength={40} placeholder="e.g. BorahaeArmy" className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-purple-400/50 outline-none text-sm text-white" />
        {mode === 'edit' && <p className="text-[10px] text-stone-500">Name changes are sent to the admin for approval — everything else updates instantly.</p>}
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-mono font-bold text-purple-300 uppercase block">Bias</label>
        <select value={fBias} onChange={(e) => setFBias(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-purple-400/50 outline-none text-sm text-white">
          <option value="">Choose your bias…</option>
          {BIAS_OPTIONS.map((b) => (
            <option key={b} value={b}>{MEMBER_EMOJIS[b]} {b}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-mono font-bold text-purple-300 uppercase block">Country</label>
        <CountrySelect value={fCountry} onChange={setFCountry} />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[10002] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-3" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-3xl border border-purple-500/20 bg-[#0d0620] shadow-2xl shadow-purple-950/50 p-5 space-y-4 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-white font-mono">
            {mode === 'create' ? '💜 Create your profile' : mode === 'edit' ? '✏️ Edit profile' : '💜 My Profile'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-stone-300 cursor-pointer" aria-label="Close profile">
            <X className="w-4 h-4" />
          </button>
        </div>

        {notice && <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-2">{notice}</p>}
        {error && <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 py-2">{error}</p>}

        {mode === 'view' && profile && (
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              {avatar(profile, 'w-16 h-16')}
              <div className="min-w-0">
                <p className="text-lg font-black text-white truncate">{profile.name}</p>
                <p className="text-xs text-stone-400">
                  {profile.bias ? `${MEMBER_EMOJIS[profile.bias] || ''} ${profile.bias} bias` : 'ARMY'}
                  {profile.country ? ` · 🌍 ${profile.country}` : ''}
                </p>
                {profile.createdAt && (
                  <p className="text-[10px] font-mono text-stone-600">
                    Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>

            {reqStatus?.status === 'pending' && (
              <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2">
                ⏳ Name change to "{reqStatus.newName}" is waiting for the admin's approval.
              </p>
            )}
            {reqStatus?.status === 'rejected' && (
              <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 py-2">
                Your last name-change request ("{reqStatus.newName}") was not approved.
              </p>
            )}

            <div className="flex gap-2">
              <button onClick={startEdit} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer">
                <Pencil className="w-3.5 h-3.5" /> Edit Profile
              </button>
              <button onClick={doLogout} className="px-4 py-2.5 rounded-xl bg-rose-600/15 border border-rose-500/30 text-rose-200 text-xs font-black flex items-center gap-1.5 cursor-pointer">
                <LogOut className="w-3.5 h-3.5" /> {confirmLogout ? 'Tap again to log out' : 'Log Out'}
              </button>
            </div>
            <p className="text-[10px] text-stone-600 leading-relaxed">
              Your profile lives only in this browser — only you can edit it here. Logging out removes it from this
              device; posts you already made stay as they are. You can restore this profile on this device anytime —
              no password needed.
            </p>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            {lastProfile && (
              <div className="rounded-2xl border border-purple-500/30 bg-purple-600/10 px-3.5 py-3 space-y-2.5">
                <div className="flex items-center gap-3">
                  {avatar(lastProfile, 'w-11 h-11')}
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white truncate">Welcome back, {lastProfile.name}?</p>
                    <p className="text-[11px] text-stone-400">You logged out on this device — your profile is saved here.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={doRestore} className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-black cursor-pointer">
                    Restore my profile
                  </button>
                  <button onClick={doForgetLast} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-stone-300 text-xs font-bold cursor-pointer">
                    This isn't me
                  </button>
                </div>
              </div>
            )}
            <p className="text-xs text-stone-400 leading-relaxed">
              One profile for everything you do here — the Supporters Wall, votes, video &amp; music submissions and
              more. No password needed.
            </p>
            {formFields}
            <button onClick={submitCreate} className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer">
              <Check className="w-4 h-4" /> Create Profile
            </button>
          </div>
        )}

        {mode === 'edit' && (
          <div className="space-y-4">
            {formFields}
            <div className="flex gap-2">
              <button onClick={submitEdit} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-black disabled:opacity-60 cursor-pointer">
                {saving ? 'Sending…' : 'Save'}
              </button>
              <button onClick={() => setMode('view')} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-stone-200 text-xs font-bold cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
