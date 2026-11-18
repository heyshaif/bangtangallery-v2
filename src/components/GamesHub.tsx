// GamesHub.tsx — Batch 112: the Play Game page becomes a hub.
// A menu of game tabs comes first; picking one opens that game,
// and a Back button returns to the menu. Before the first game,
// a one-time popup asks for a username and a country (the
// owner's rule: username ditei hobe) — it creates the visitor
// profile and the quiz player card in one step, so the same
// name is used by every game and every form on the site.

import React, { useEffect, useState } from 'react';
import {
  Gamepad2,
  Pencil,
  Music,
  Layers,
  Type,
  Smile,
  Bomb,
  Brain,
  ArrowLeft,
  X,
  Trophy,
} from 'lucide-react';
import MusicQuiz from './MusicQuiz';
import { MemoryMatch, GuessSong, EmojiQuiz, BombTap, BtsTrivia } from './ArcadeGames';
import CountrySelect from './CountrySelect';
import { getProfile, createProfile, clearProfile, getLastProfile, restoreLastProfile, forgetLastProfile, PROFILE_EVENT } from '../utils/profile';
import { saveCountry, pinCountry, getSavedCountry } from '../utils/armyMap';

const BTSGlobalQuest = React.lazy(() => import('./BTSGlobalQuest'));

type View = 'menu' | 'quiz' | 'memory' | 'wordle' | 'emoji' | 'bomb' | 'trivia';

const MEMBER_EMOJIS = ['🐨', '🐹', '🐱', '🐿️', '🐥', '🐯', '🐰'];

function quizProfileName(): string {
  try {
    const raw = localStorage.getItem('bts_quiz_profile');
    if (!raw) return '';
    const p = JSON.parse(raw);
    return typeof p?.username === 'string' ? p.username : '';
  } catch {
    return '';
  }
}

function identityName(): string {
  return getProfile()?.name || quizProfileName();
}

const GAMES: {
  id: View;
  icon: React.ReactNode;
  title: string;
  blurb: string;
  accent: string;
}[] = [
  {
    id: 'quiz',
    icon: <Music className="w-7 h-7" />,
    title: 'Music Quiz',
    blurb: 'Guess songs from clips, lyrics and covers — climb the Top 10 leaderboard.',
    accent: 'from-purple-600 to-fuchsia-600',
  },
  {
    id: 'memory',
    icon: <Layers className="w-7 h-7" />,
    title: 'Memory Match',
    blurb: 'Flip the cards and find all 6 member pairs in as few moves as you can.',
    accent: 'from-indigo-600 to-purple-600',
  },
  {
    id: 'wordle',
    icon: <Type className="w-7 h-7" />,
    title: 'Guess the Song',
    blurb: 'Wordle style: 6 tries to guess the song title, letter by letter.',
    accent: 'from-emerald-600 to-teal-600',
  },
  {
    id: 'emoji',
    icon: <Smile className="w-7 h-7" />,
    title: 'Emoji Quiz',
    blurb: 'Every emoji clue hides a song. 10 rounds — how many can you read?',
    accent: 'from-amber-500 to-orange-600',
  },
  {
    id: 'trivia',
    icon: <Brain className="w-7 h-7" />,
    title: 'BTS Trivia',
    blurb: 'No songs — just facts: debut, birthdays, albums. How well do you know BTS?',
    accent: 'from-sky-600 to-indigo-600',
  },
  {
    id: 'bomb',
    icon: <Bomb className="w-7 h-7" />,
    title: 'Bomb Tap',
    blurb: '30 seconds: tap the glowing ARMY Bombs before they fade. Gold = 3 points!',
    accent: 'from-pink-600 to-rose-600',
  },
];

export default function GamesHub({
  tracks,
  quizEnabled,
  audioEnabled,
  lyricsEnabled,
  config,
  targetUsername,
  onOpenProfile,
  onExitProfile,
  onCloseQuiz,
}: {
  tracks: any[];
  quizEnabled: boolean;
  audioEnabled: boolean;
  lyricsEnabled: boolean;
  config: any;
  targetUsername: any;
  onOpenProfile: () => void;
  onExitProfile: () => void;
  onCloseQuiz: () => void;
}) {
  const [view, setView] = useState<View>('menu');
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingView, setPendingView] = useState<View | null>(null);
  const [name, setName] = useState(() => identityName());
  // Batch 123: the menu shows the game profile card; it
  // refreshes whenever the profile changes anywhere.
  const [, setProfileTick] = useState(0);
  useEffect(() => {
    const bump = () => {
      setProfileTick((t) => t + 1);
      setName(identityName());
    };
    window.addEventListener(PROFILE_EVENT, bump);
    return () => window.removeEventListener(PROFILE_EVENT, bump);
  }, []);
  const prof = getProfile();
  let quizPic = '';
  let quizEmoji = '';
  try {
    const q = JSON.parse(localStorage.getItem('bts_quiz_profile') || 'null');
    quizPic = q?.photo || '';
    quizEmoji = q?.emoji || '';
  } catch { /* no quiz card */ }
  const avatarPhoto = prof?.photo || quizPic;
  const avatarEmoji = prof?.emoji || quizEmoji || '💜';
  const myCountry = prof?.country || getSavedCountry();

  // First entry with no name anywhere: the popup comes by itself.
  useEffect(() => {
    if (!identityName()) setGateOpen(true);
  }, []);

  const enter = (v: View) => {
    if (v === 'quiz' && !quizEnabled) return;
    if (!identityName()) {
      setPendingView(v);
      setGateOpen(true);
      return;
    }
    setView(v);
  };

  const afterGate = (savedName: string) => {
    setName(savedName);
    setGateOpen(false);
    if (pendingView) {
      setView(pendingView);
      setPendingView(null);
    }
  };

  const visibleGames = GAMES.filter((g) => g.id !== 'quiz' || quizEnabled);

  return (
    <div className="space-y-6">
      {view === 'menu' && (
        <>
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-black text-white inline-flex items-center gap-2.5">
              <Gamepad2 className="w-7 h-7 text-purple-400" /> Play Game
            </h2>
            <p className="text-sm text-slate-400">
              {name ? (
                <>
                  Playing as <span className="font-bold text-fuchsia-300">{name}</span> — pick a game, ARMY!
                </>
              ) : (
                'Pick a game, ARMY — your name is asked once, then every game knows you.'
              )}
            </p>
          </div>

          {name && (
            <div className="max-w-xl mx-auto w-full flex items-center gap-3.5 p-4 rounded-3xl bg-gradient-to-r from-purple-950/50 to-fuchsia-950/30 border border-purple-500/25">
              {avatarPhoto ? (
                <img src={avatarPhoto} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-fuchsia-400/60" />
              ) : (
                <span className="w-12 h-12 rounded-full bg-purple-600/40 border-2 border-fuchsia-400/60 flex items-center justify-center text-2xl">
                  {avatarEmoji}
                </span>
              )}
              <span className="flex-1 min-w-0 text-left">
                <span className="block font-black text-white truncate">{name}</span>
                <span className="block text-xs text-slate-400">
                  {myCountry ? `🌍 ${myCountry} · ` : ''}Your game profile — one name for every game
                </span>
              </span>
              <button
                type="button"
                onClick={onOpenProfile}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.06] border border-white/15 text-white text-xs font-bold cursor-pointer hover:border-fuchsia-400/50 transition-colors shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Profile
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {visibleGames.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => enter(g.id)}
                className="text-left p-5 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-purple-400/50 hover:bg-white/[0.05] transition-all cursor-pointer active:scale-[0.98] group"
              >
                <span
                  className={`inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br ${g.accent} text-white items-center justify-center shadow-lg`}
                >
                  {g.icon}
                </span>
                <span className="block mt-3 text-lg font-black text-white group-hover:text-purple-200 transition-colors">
                  {g.title}
                </span>
                <span className="block mt-1 text-sm text-slate-400 leading-relaxed">{g.blurb}</span>
              </button>
            ))}
          </div>

          <React.Suspense fallback={null}>
            <BTSGlobalQuest config={config} targetUsername={targetUsername} onExitProfile={onExitProfile} />
          </React.Suspense>
        </>
      )}

      {view !== 'menu' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setView('menu')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.05] border border-white/12 text-sm font-bold text-white cursor-pointer hover:bg-white/[0.09] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Games
            </button>
            <h2 className="text-lg sm:text-xl font-black text-white">
              {GAMES.find((g) => g.id === view)?.title}
            </h2>
          </div>

          {view === 'quiz' && (
            <MusicQuiz tracks={tracks} audioEnabled={audioEnabled} lyricsEnabled={lyricsEnabled} onClose={onCloseQuiz} />
          )}
          {view === 'memory' && (
            <div className="p-4 sm:p-6 rounded-3xl bg-white/[0.02] border border-white/10">
              <MemoryMatch />
            </div>
          )}
          {view === 'wordle' && (
            <div className="p-4 sm:p-6 rounded-3xl bg-white/[0.02] border border-white/10">
              <GuessSong tracks={tracks} />
            </div>
          )}
          {view === 'emoji' && (
            <div className="p-4 sm:p-6 rounded-3xl bg-white/[0.02] border border-white/10">
              <EmojiQuiz tracks={tracks} />
            </div>
          )}
          {view === 'trivia' && (
            <div className="p-4 sm:p-6 rounded-3xl bg-white/[0.02] border border-white/10">
              <BtsTrivia />
            </div>
          )}
          {view === 'bomb' && (
            <div className="p-4 sm:p-6 rounded-3xl bg-white/[0.02] border border-white/10">
              <BombTap />
            </div>
          )}
        </div>
      )}

      {gateOpen && (
        <GatePopup
          onClose={() => setGateOpen(false)}
          onSaved={afterGate}
        />
      )}
    </div>
  );
}

/* ---------------- The one-time name + country popup ---------------- */

function GatePopup({ onClose, onSaved }: { onClose: () => void; onSaved: (name: string) => void }) {
  const [username, setUsername] = useState('');
  const [emoji, setEmoji] = useState('💜');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  // Batch 126: a visitor who logged out on this device can
  // restore the same profile instead of creating a new one.
  const [lastProfile, setLastProfile] = useState(() => getLastProfile());

  const restore = () => {
    const p = restoreLastProfile();
    if (p) {
      onSaved(p.name);
    } else {
      setLastProfile(null);
    }
  };

  const forgetLast = () => {
    forgetLastProfile();
    setLastProfile(null);
  };

  const save = async () => {
    const clean = username.trim().replace(/\s+/g, ' ');
    if (clean.length < 2 || clean.length > 20) {
      setError('Please choose a username of 2–20 characters.');
      return;
    }
    if (!country) {
      setError('Please choose your country — it lights up on the ARMY World Map!');
      return;
    }
    setSaving(true);
    setError('');
    try {
      // One username = one ARMY (Batch 102 registry).
      const chk = await fetch('/api/profile/check-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clean, profileId: '' }),
      }).then((r) => r.json()).catch(() => null);
      if (chk && chk.taken) {
        setError('This username is already taken — please choose a different name.');
        setSaving(false);
        return;
      }
      const p = createProfile({ name: clean, emoji, country });
      const reg = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean, displayName: clean, profileId: p.id }),
      }).then((r) => r.json()).catch(() => null);
      if (reg && reg.success === false) {
        clearProfile();
        setError('This username is already taken — please choose a different name.');
        setSaving(false);
        return;
      }
      // The Music Quiz player card uses the same identity.
      try {
        localStorage.setItem('bts_quiz_profile', JSON.stringify({ username: clean, emoji, photo: '' }));
      } catch {}
      saveCountry(country);
      const joined = (() => {
        try {
          return localStorage.getItem('bg_armymap_country') || '';
        } catch {
          return '';
        }
      })();
      if (joined !== country) {
        const ok = await pinCountry(country, joined || undefined);
        if (ok) {
          try {
            localStorage.setItem('bg_armymap_country', country);
          } catch {}
        }
      }
      onSaved(clean);
    } catch {
      setError('Something went wrong — please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10003] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-[#0d0618] border border-purple-500/30 rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.06] text-slate-300 flex items-center justify-center cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        {lastProfile && (
          <div className="rounded-2xl border border-purple-500/30 bg-purple-600/10 px-4 py-3 space-y-2">
            <div className="flex items-center gap-3">
              {lastProfile.photo ? (
                <img src={lastProfile.photo} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-lg shrink-0">
                  {lastProfile.emoji || '💜'}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-black text-white truncate">Welcome back, {lastProfile.name}?</p>
                <p className="text-[11px] text-slate-400">You logged out on this device — pick up right where you left off.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={restore}
                className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-black cursor-pointer"
              >
                Restore my profile
              </button>
              <button
                type="button"
                onClick={forgetLast}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold cursor-pointer"
              >
                This isn't me
              </button>
            </div>
          </div>
        )}

        <div className="text-center space-y-1">
          <span className="inline-flex w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 items-center justify-center text-2xl">
            🎮
          </span>
          <h3 className="text-xl font-black text-white">Before you play…</h3>
          <p className="text-sm text-slate-400">
            Pick your ARMY name and country once — every game (and everything you submit on the site) will use this
            name.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              placeholder="e.g. borahae_army"
              className="mt-1.5 w-full bg-black/40 border border-white/12 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-purple-400 placeholder:text-slate-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Your avatar</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {['💜', ...MEMBER_EMOJIS].map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-full text-xl flex items-center justify-center cursor-pointer border-2 transition-all ${
                    emoji === e ? 'border-fuchsia-400 bg-fuchsia-500/20 scale-110' : 'border-white/10 bg-white/[0.04]'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Country</label>
            <div className="mt-1.5">
              <CountrySelect value={country} onChange={setCountry} />
            </div>
          </div>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-sm cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4" /> {saving ? 'Saving…' : 'Save & Play'}
          </button>
          <p className="text-[11px] text-slate-500 text-center">
            One name belongs to one ARMY — if your name is taken, please pick another.
          </p>
        </div>
      </div>
    </div>
  );
}
