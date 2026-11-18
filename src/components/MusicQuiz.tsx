import React, { useState, useEffect, useRef } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';

// Batch 72 — BTS Music Quiz.
// Questions are generated automatically from the site's own tracks and
// lyrics (audio clips use the tracks' self-hosted audio; lyric questions
// use whichever lyric versions the track has). No database writes: the
// player profile, best score and settings live only in this browser's
// localStorage, so the game costs no Firestore quota and adds no load
// for visitors who never open it (it ships inside the lazy Music chunk).

const MEMBER_EMOJIS = [
  { id: 'rm', name: 'RM', emoji: '🐨' },
  { id: 'jin', name: 'Jin', emoji: '🐹' },
  { id: 'suga', name: 'SUGA', emoji: '🐱' },
  { id: 'jhope', name: 'j-hope', emoji: '🐿️' },
  { id: 'jimin', name: 'Jimin', emoji: '🐥' },
  { id: 'v', name: 'V', emoji: '🐯' },
  { id: 'jungkook', name: 'Jung Kook', emoji: '🐰' }
];

const ROUNDS = 10;
const QUESTION_SECONDS = 15;
const CLIP_SECONDS = 10;
const PROFILE_KEY = 'bts_quiz_profile';
const BEST_KEY = 'bts_quiz_best';

interface QuizTrack {
  id: string;
  title: string;
  audioUrl?: string;
  lyrics?: string;
  lyricsKo?: string;
  lyricsEn?: string;
}

interface Profile {
  username: string;
  emoji: string;
  photo: string; // data URI, '' when an emoji avatar is used
}

interface Question {
  kind: 'audio' | 'lyric' | 'nextline' | 'matchline';
  headline: string;
  prompt?: string;
  audioUrl?: string;
  el?: HTMLAudioElement | null;
  startPos?: number;
  options: string[];
  correctIndex: number;
  trackTitle: string;
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const cleanLine = (raw: string) =>
  raw.replace(/^\[\d{1,2}:\d{2}(\.\d+)?\]/, '').trim();

const lyricLinesOf = (t: QuizTrack): string[] => {
  const out: string[] = [];
  for (const tx of [t.lyrics, t.lyricsKo, t.lyricsEn]) {
    if (!tx) continue;
    for (const raw of tx.split('\n')) {
      const line = cleanLine(raw);
      if (line.length >= 8) out.push(line);
    }
  }
  return [...new Set(out)];
};

const lyricPairsOf = (t: QuizTrack): [string, string][] => {
  const pairs: [string, string][] = [];
  for (const tx of [t.lyrics, t.lyricsKo, t.lyricsEn]) {
    if (!tx) continue;
    const lines = tx.split('\n').map(cleanLine).filter((l) => l.length >= 8);
    for (let i = 0; i + 1 < lines.length; i++) pairs.push([lines[i], lines[i + 1]]);
  }
  return pairs;
};

export default function MusicQuiz({
  tracks,
  audioEnabled,
  lyricsEnabled,
  onClose
}: {
  tracks: QuizTrack[];
  audioEnabled: boolean;
  lyricsEnabled: boolean;
  onClose: () => void;
}) {
  const { isPlaying, togglePlay } = useAudioPlayer();

  const [profile, setProfile] = useState<Profile | null>(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
      return p && p.username ? p : null;
    } catch {
      return null;
    }
  });
  const [phase, setPhase] = useState<'gate' | 'ready' | 'playing' | 'result'>(
    profile ? 'ready' : 'gate'
  );

  // Gate form state
  const [nameInput, setNameInput] = useState(profile?.username || '');
  const [emojiPick, setEmojiPick] = useState(profile?.emoji || '');
  const [photoPick, setPhotoPick] = useState(profile?.photo || '');
  const [gateError, setGateError] = useState('');

  // Game state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [selected, setSelected] = useState<number | null>(null);
  const [lastGain, setLastGain] = useState(0);
  const [scoreUi, setScoreUi] = useState(0);
  const [streakUi, setStreakUi] = useState(0);
  const [clipPlaying, setClipPlaying] = useState(false);
  const [best, setBest] = useState<number>(() => {
    const b = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
    return Number.isFinite(b) ? b : 0;
  });

  // Leaderboard (Batch 73): public Top 10 from /api/quiz/leaderboard.
  interface ScoreRow {
    username: string;
    emoji: string;
    photo: string;
    score: number;
    correct: number;
    total: number;
    createdAt?: string;
  }
  const [board, setBoard] = useState<ScoreRow[]>([]);
  const [boardLoading, setBoardLoading] = useState(true);
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const loadBoard = async () => {
    try {
      const r = await fetch('/api/quiz/leaderboard');
      const d = await r.json();
      if (d?.success && Array.isArray(d.leaderboard)) setBoard(d.leaderboard);
    } catch {
      /* leaderboard is a bonus — the game itself never blocks on it */
    }
    setBoardLoading(false);
  };

  useEffect(() => {
    loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const clipTimerRef = useRef<any>(null);
  const answeredRef = useRef(false);
  const timeLeftRef = useRef(QUESTION_SECONDS);
  const statsRef = useRef({ score: 0, streak: 0, correct: 0 });
  timeLeftRef.current = timeLeft;

  const current = questions[qIndex] as Question | undefined;

  const clipWatchRef = useRef<any>(null);

  // Batch 85 — bulletproof clip stop. The old version paused only
  // from a setTimeout started inside loadedmetadata; on the owner's
  // phone the seek/metadata dance with the .m4a files let songs run
  // to the end and leak into the next question. Now the element is
  // fully torn down (pause + src removed) and a watcher interval
  // enforces the 10-second window by playback position AND by
  // wall-clock, whichever comes first.
  const stopClip = () => {
    if (clipTimerRef.current) clearTimeout(clipTimerRef.current);
    if (clipWatchRef.current) clearInterval(clipWatchRef.current);
    clipTimerRef.current = null;
    clipWatchRef.current = null;
    if (audioRef.current) {
      const a = audioRef.current;
      audioRef.current = null;
      const aq = (a as any)._q as Question | undefined;
      if (aq && aq.el === a) aq.el = null;
      try {
        a.pause();
        a.removeAttribute('src');
        a.load();
      } catch {
        /* noop */
      }
    }
    setClipPlaying(false);
  };

  useEffect(() => {
    return () => stopClip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Batch 101 — lag fix. Batch 85's engine built a brand-new
  // Audio element on every tap, so each play/replay re-downloaded
  // the .m4a and re-seeked before any sound came out (the owner's
  // "on hote deri, off o same"). Now every audio question gets
  // ONE element, preloaded in startGame, and the big button is a
  // real toggle: pause is instant and keeps the buffer, replay
  // seeks back on the SAME element. stopClip (answer / next
  // question / unmount) remains the hard teardown, so a clip can
  // still never leak into the next question.
  const startWatch = (a: HTMLAudioElement, q: Question) => {
    if (clipWatchRef.current) clearInterval(clipWatchRef.current);
    if (clipTimerRef.current) clearTimeout(clipTimerRef.current);
    const startPos = q.startPos ?? 0;
    const elapsed = Math.max(0, a.currentTime - startPos);
    const startedAt = Date.now() - elapsed * 1000;
    const finish = () => {
      try {
        a.pause();
      } catch {
        /* noop */
      }
      if (clipWatchRef.current) clearInterval(clipWatchRef.current);
      if (clipTimerRef.current) clearTimeout(clipTimerRef.current);
      clipWatchRef.current = null;
      clipTimerRef.current = null;
      try {
        a.currentTime = startPos;
      } catch {
        /* noop */
      }
      setClipPlaying(false);
    };
    (a as any)._finish = finish;
    clipWatchRef.current = setInterval(() => {
      const posLimit = a.currentTime >= startPos + CLIP_SECONDS;
      const wallLimit = Date.now() - startedAt >= (CLIP_SECONDS + 2) * 1000;
      if (posLimit || wallLimit) finish();
    }, 250);
    clipTimerRef.current = setTimeout(finish, Math.max(1500, (CLIP_SECONDS + 4 - elapsed) * 1000));
  };

  const wireClip = (a: HTMLAudioElement, q: Question) => {
    if ((a as any)._wired) return;
    (a as any)._wired = true;
    (a as any)._q = q;
    const seekOnce = () => {
      if (q.startPos !== undefined) return;
      const dur = Number.isFinite(a.duration) && a.duration > 0 ? a.duration : 30;
      const maxStart = Math.max(1, dur - CLIP_SECONDS - 2);
      q.startPos = Math.min(maxStart, 3 + Math.random() * Math.max(1, maxStart - 3));
      try {
        a.currentTime = q.startPos;
      } catch {
        /* noop */
      }
    };
    if (a.readyState >= 1) seekOnce();
    else a.addEventListener('loadedmetadata', seekOnce);
    a.addEventListener('ended', () => {
      if ((a as any)._finish) (a as any)._finish();
    });
    a.addEventListener('playing', () => {
      if (audioRef.current === a) setClipPlaying(true);
    });
    a.addEventListener('pause', () => {
      if (audioRef.current === a) setClipPlaying(false);
    });
    a.addEventListener('error', () => {
      if (audioRef.current === a) setClipPlaying(false);
    });
  };

  const playClip = (q: Question) => {
    if (!q.audioUrl) return;
    let a = q.el ?? null;
    if (!a || a.error || !a.src) {
      a = new Audio(q.audioUrl);
      a.preload = 'auto';
      q.el = a;
    }
    if (audioRef.current && audioRef.current !== a) stopClip();
    audioRef.current = a;
    a.volume = 0.9;
    wireClip(a, q);
    const startPos = q.startPos ?? 0;
    if (a.currentTime < startPos || a.currentTime >= startPos + CLIP_SECONDS) {
      try {
        a.currentTime = startPos;
      } catch {
        /* metadata may not be ready; seekOnce handles it */
      }
    }
    startWatch(a, q);
    setClipPlaying(true);
    a.play().catch(() => setClipPlaying(false));
  };

  const pauseClip = () => {
    const a = audioRef.current;
    if (a) {
      try {
        a.pause();
      } catch {
        /* noop */
      }
    }
    if (clipWatchRef.current) clearInterval(clipWatchRef.current);
    if (clipTimerRef.current) clearTimeout(clipTimerRef.current);
    clipWatchRef.current = null;
    clipTimerRef.current = null;
    setClipPlaying(false);
  };

  const toggleClip = (q: Question) => {
    const a = audioRef.current;
    if (a && a === q.el && !a.paused) {
      pauseClip();
      return;
    }
    playClip(q);
  };

  // ---------- question generation ----------

  const titleOptions = (target: QuizTrack): { options: string[]; correctIndex: number } => {
    const others = shuffle(tracks.filter((t) => t.title !== target.title).map((t) => t.title));
    const opts = shuffle([target.title, ...[...new Set(others)].slice(0, 3)]);
    return { options: opts, correctIndex: opts.indexOf(target.title) };
  };

  const buildQuestions = (): Question[] => {
    const qs: Question[] = [];
    const audioPool = shuffle(tracks.filter((t) => t.audioUrl && String(t.audioUrl).trim() !== ''));
    const lyricPool = shuffle(tracks.filter((t) => lyricLinesOf(t).length >= 4));

    let pattern: string[] = [];
    if (audioEnabled && lyricsEnabled) {
      pattern = ['audio', 'lyric', 'audio', 'nextline', 'matchline', 'audio', 'lyric', 'nextline', 'audio', 'matchline'];
    } else if (audioEnabled) {
      pattern = Array(ROUNDS).fill('audio');
    } else if (lyricsEnabled) {
      pattern = ['lyric', 'nextline', 'matchline', 'lyric', 'nextline', 'matchline', 'lyric', 'nextline', 'matchline', 'lyric'];
    }

    let ai = 0;
    let li = 0;
    for (const kind of pattern) {
      if (qs.length >= ROUNDS) break;
      if (kind === 'audio') {
        if (audioPool.length === 0) continue;
        const t = audioPool[ai++ % audioPool.length];
        const { options, correctIndex } = titleOptions(t);
        if (options.length < 2) continue;
        qs.push({
          kind: 'audio',
          headline: '🎧 Listen — which song is this?',
          audioUrl: t.audioUrl,
          options,
          correctIndex,
          trackTitle: t.title
        });
      } else {
        if (lyricPool.length === 0) continue;
        const t = lyricPool[li++ % lyricPool.length];
        if (kind === 'lyric') {
          const lines = lyricLinesOf(t);
          const line = lines[Math.floor(Math.random() * lines.length)];
          const { options, correctIndex } = titleOptions(t);
          if (options.length < 2) continue;
          qs.push({
            kind: 'lyric',
            headline: '📜 Which song is this lyric from?',
            prompt: line,
            options,
            correctIndex,
            trackTitle: t.title
          });
        } else if (kind === 'nextline') {
          const pairs = lyricPairsOf(t);
          if (pairs.length === 0) continue;
          const [first, next] = pairs[Math.floor(Math.random() * pairs.length)];
          const distractors = shuffle(
            lyricPool.filter((x) => x.id !== t.id).flatMap((x) => lyricLinesOf(x))
          ).filter((l) => l !== next).slice(0, 3);
          if (distractors.length < 3) continue;
          const options = shuffle([next, ...distractors]);
          qs.push({
            kind: 'nextline',
            headline: '➡️ What line comes next?',
            prompt: first,
            options,
            correctIndex: options.indexOf(next),
            trackTitle: t.title
          });
        } else {
          // matchline: given the song title, pick a line that belongs to it
          const lines = lyricLinesOf(t);
          const mine = lines[Math.floor(Math.random() * lines.length)];
          const distractors = shuffle(
            lyricPool.filter((x) => x.id !== t.id).flatMap((x) => lyricLinesOf(x))
          ).filter((l) => l !== mine).slice(0, 3);
          if (distractors.length < 3) continue;
          const options = shuffle([mine, ...distractors]);
          qs.push({
            kind: 'matchline',
            headline: `🎵 Which of these lines is from “${t.title}”?`,
            options,
            correctIndex: options.indexOf(mine),
            trackTitle: t.title
          });
        }
      }
    }
    return qs;
  };

  // ---------- game flow ----------

  const startGame = () => {
    if (isPlaying) togglePlay(); // keep the main player quiet during clips
    const qs = buildQuestions();
    // Batch 101: pre-buffer every audio clip NOW (right after the
    // Start tap, a real user gesture) so pressing play on any
    // round is instant instead of a fresh download + seek.
    qs.forEach((q) => {
      if (q.kind === 'audio' && q.audioUrl && !q.el) {
        try {
          const el = new Audio(q.audioUrl);
          el.preload = 'auto';
          el.volume = 0.9;
          q.el = el;
        } catch {
          /* playClip creates it on demand */
        }
      }
    });
    if (qs.length < 3) return;
    statsRef.current = { score: 0, streak: 0, correct: 0 };
    setScoreUi(0);
    setStreakUi(0);
    setSubmitState('idle');
    setQuestions(qs);
    setQIndex(0);
    setPhase('playing');
  };

  const doAnswer = (choice: number) => {
    if (answeredRef.current || !current) return;
    answeredRef.current = true;
    stopClip();
    const isCorrect = choice === current.correctIndex;
    let gain = 0;
    if (isCorrect) {
      statsRef.current.streak += 1;
      gain =
        100 +
        Math.round(timeLeftRef.current) * 3 +
        (statsRef.current.streak >= 3 ? 25 : 0);
      statsRef.current.score += gain;
      statsRef.current.correct += 1;
    } else {
      statsRef.current.streak = 0;
    }
    setScoreUi(statsRef.current.score);
    setStreakUi(statsRef.current.streak);
    setSelected(choice);
    setLastGain(gain);
    setTimeout(() => {
      if (qIndex + 1 >= questions.length) {
        const finalScore = statsRef.current.score;
        if (finalScore > best) {
          setBest(finalScore);
          try {
            localStorage.setItem(BEST_KEY, String(finalScore));
          } catch {
            /* noop */
          }
          // New personal best → one leaderboard submission (Batch 73).
          // The board copy of the avatar is shrunk to 48×48 first: the
          // leaderboard is one shared document, so entries stay tiny.
          if (profile) {
            setSubmitState('sending');
            makeBoardPhoto(profile.photo).then((boardPhoto) => {
              fetch('/api/quiz/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  username: profile.username,
                  emoji: profile.emoji,
                  photo: boardPhoto,
                  score: finalScore,
                  correct: statsRef.current.correct,
                  total: questions.length
                })
              })
                .then(async (r) => {
                  const d = await r.json().catch(() => null);
                  if (r.ok && d?.success) {
                    setSubmitState('sent');
                    loadBoard();
                  } else {
                    setSubmitState('failed');
                  }
                })
                .catch(() => {
                  /* score stays saved on this device either way */
                  setSubmitState('failed');
                });
            });
          }
        }
        setPhase('result');
      } else {
        setQIndex(qIndex + 1);
      }
    }, 1500);
  };
  const doAnswerRef = useRef(doAnswer);
  doAnswerRef.current = doAnswer;

  useEffect(() => {
    if (phase !== 'playing' || !current) return;
    answeredRef.current = false;
    setSelected(null);
    setLastGain(0);
    setTimeLeft(QUESTION_SECONDS);
    if (current.kind === 'audio') playClip(current);
    const iv = setInterval(() => {
      setTimeLeft((prev) => {
        if (answeredRef.current) return prev;
        const nt = Math.round((prev - 0.1) * 10) / 10;
        if (nt <= 0) {
          clearInterval(iv);
          setTimeout(() => doAnswerRef.current(-1), 0);
          return 0;
        }
        return nt;
      });
    }, 100);
    return () => {
      clearInterval(iv);
      stopClip();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qIndex]);

  // ---------- gate / profile ----------

  const handlePhoto = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, 128, 128);
        setPhotoPick(canvas.toDataURL('image/jpeg', 0.85));
        setEmojiPick('');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const saveProfile = () => {
    const username = nameInput.trim();
    if (username.length < 2) {
      setGateError('Please enter a username (at least 2 characters).');
      return;
    }
    if (!photoPick && !emojiPick) {
      setGateError('Please pick a member emoji or upload your picture.');
      return;
    }
    const p: Profile = { username, emoji: photoPick ? '' : emojiPick, photo: photoPick };
    setProfile(p);
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    } catch {
      /* storage full/blocked — the game still works for this visit */
    }
    setGateError('');
    setPhase('ready');
  };

  // Shrink an avatar photo for the shared leaderboard document.
  const makeBoardPhoto = (photo: string): Promise<string> =>
    new Promise((resolve) => {
      if (!photo) {
        resolve('');
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 48;
          canvas.height = 48;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve('');
            return;
          }
          const side = Math.min(img.width, img.height);
          ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 48, 48);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      img.src = photo;
    });

  const avatarNode = (size: string) =>
    profile?.photo ? (
      <img src={profile.photo} alt={profile.username} className={`${size} rounded-full object-cover border-2 border-purple-400`} />
    ) : (
      <span className={`${size} rounded-full bg-purple-950/60 border-2 border-purple-400 flex items-center justify-center text-2xl`}>
        {profile?.emoji || '💜'}
      </span>
    );

  const gradeFor = (correct: number, total: number) => {
    const r = total > 0 ? correct / total : 0;
    if (r >= 0.9) return { emoji: '👑', title: 'ARMY Legend' };
    if (r >= 0.7) return { emoji: '💜', title: 'True ARMY' };
    if (r >= 0.5) return { emoji: '🎤', title: 'ARMY' };
    return { emoji: '🌱', title: 'Baby ARMY — keep streaming!' };
  };

  const shareText = encodeURIComponent(
    `🎵 I scored ${statsRef.current.score} points in the Bangtan Gallery Music Quiz as ${profile?.username || 'ARMY'}! 💜 Can you beat me?`
  );
  const shareUrl = encodeURIComponent('https://bangtangallery.online/music');

  // ---------- render ----------

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">🎮 BTS Music Quiz</h2>
        <button
          onClick={() => {
            stopClip();
            onClose();
          }}
          className="px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-950/50 border border-purple-500/30 text-purple-200 hover:bg-purple-900/50 cursor-pointer"
        >
          ← Back to Music
        </button>
      </div>

      {phase === 'gate' && (
        <div className="bg-black/30 border border-purple-500/15 rounded-3xl p-5 sm:p-7 space-y-5 max-w-xl mx-auto">
          <div className="text-center space-y-1">
            <p className="text-3xl">💜</p>
            <h3 className="text-lg font-bold text-white">Set your player card first</h3>
            <p className="text-xs text-stone-400">
              Enter a username and pick a picture or your bias emoji — then the quiz opens.
              Your card stays on this device only.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Username *</label>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={20}
              placeholder="e.g. PurpleARMY7"
              className="w-full bg-[#0a061b]/80 border border-purple-500/25 focus:border-purple-400 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none placeholder:text-stone-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
              Pick your member emoji *
            </label>
            <div className="grid grid-cols-7 gap-2">
              {MEMBER_EMOJIS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  title={m.name}
                  onClick={() => {
                    setEmojiPick(m.emoji);
                    setPhotoPick('');
                  }}
                  className={`py-2.5 rounded-2xl text-2xl border transition-all cursor-pointer ${
                    emojiPick === m.emoji && !photoPick
                      ? 'bg-purple-600/40 border-purple-300 scale-105'
                      : 'bg-black/40 border-purple-500/15 hover:border-purple-400/50'
                  }`}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">…or upload your picture</label>
            <div className="flex items-center gap-3">
              {photoPick ? (
                <img src={photoPick} alt="Your avatar" className="w-14 h-14 rounded-full object-cover border-2 border-purple-400" />
              ) : (
                <span className="w-14 h-14 rounded-full bg-purple-950/60 border border-dashed border-purple-500/40 flex items-center justify-center text-xl">🖼️</span>
              )}
              <label className="px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white cursor-pointer">
                Choose Picture
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0])} />
              </label>
              {photoPick && (
                <button type="button" onClick={() => setPhotoPick('')} className="text-xs text-stone-400 hover:text-white cursor-pointer">
                  Remove
                </button>
              )}
            </div>
          </div>

          {gateError && <p className="text-xs text-red-400 text-center">{gateError}</p>}

          <button
            onClick={saveProfile}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-sm tracking-wide hover:opacity-90 cursor-pointer"
          >
            Enter the Quiz →
          </button>
        </div>
      )}

      {phase === 'ready' && profile && (
        <div className="bg-black/30 border border-purple-500/15 rounded-3xl p-5 sm:p-7 space-y-5 max-w-xl mx-auto text-center">
          <div className="flex flex-col items-center gap-2">
            {avatarNode('w-20 h-20')}
            <p className="text-lg font-bold text-white">{profile.username}</p>
            {best > 0 && <p className="text-xs text-purple-300">🏆 Your best score: {best} points</p>}
          </div>
          <div className="text-xs text-stone-400 space-y-1">
            <p>{ROUNDS} questions — {QUESTION_SECONDS} seconds each.</p>
            <p>
              {audioEnabled && '🎧 Guess songs from short clips. '}
              {lyricsEnabled && '📜 Guess songs from their lyrics.'}
            </p>
            <p>Right answer: 100 points + speed bonus. 3 in a row: streak bonus 🔥</p>
            <p>🏆 Beat your own best score to enter the Leaderboard below!</p>
          </div>
          {tracks.length < 4 ? (
            <p className="text-xs text-amber-300">Songs are still loading — please try again in a moment.</p>
          ) : (
            <button
              onClick={startGame}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-sm tracking-wide hover:opacity-90 cursor-pointer"
            >
              ▶ Start Quiz
            </button>
          )}
          <button
            onClick={() => setPhase('gate')}
            className="text-xs text-stone-400 hover:text-white underline underline-offset-2 cursor-pointer"
          >
            Change player card
          </button>
        </div>
      )}

      {phase === 'playing' && current && profile && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-3 bg-black/30 border border-purple-500/15 rounded-2xl px-4 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              {avatarNode('w-9 h-9')}
              <span className="text-sm font-bold text-white truncate">{profile.username}</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-purple-300">Round {qIndex + 1}/{questions.length}</span>
              <span className="text-white">⭐ {scoreUi}</span>
              {streakUi >= 2 && <span className="text-orange-400">🔥 x{streakUi}</span>}
              <span className={timeLeft <= 5 ? 'text-red-400' : 'text-stone-300'}>⏱️ {Math.ceil(timeLeft)}s</span>
            </div>
          </div>

          <div className="h-1.5 rounded-full bg-purple-950/60 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-100 ${timeLeft <= 5 ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
              style={{ width: `${(timeLeft / QUESTION_SECONDS) * 100}%` }}
            />
          </div>

          <div className="bg-black/30 border border-purple-500/15 rounded-3xl p-5 sm:p-7 space-y-5">
            <h3 className="text-base sm:text-lg font-bold text-white text-center">{current.headline}</h3>

            {current.kind === 'audio' && (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => toggleClip(current)}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white text-3xl flex items-center justify-center shadow-lg shadow-purple-900/50 hover:scale-105 transition-transform cursor-pointer"
                >
                  {clipPlaying ? '⏸' : '▶'}
                </button>
                <p className="text-[11px] text-stone-400">{clipPlaying ? 'Playing a 10-second clip… tap to pause' : 'Tap to play the clip'}</p>
              </div>
            )}

            {current.prompt && (
              <p className="text-center text-sm sm:text-base text-purple-100 italic leading-relaxed bg-purple-950/30 border border-purple-500/10 rounded-2xl px-4 py-4">
                “{current.prompt}”
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {current.options.map((opt, i) => {
                const answered = selected !== null;
                const isCorrect = i === current.correctIndex;
                const isChosen = i === selected;
                let cls = 'bg-[#0a061b]/80 border-purple-500/20 text-stone-100 hover:border-purple-400 hover:bg-purple-950/40';
                if (answered && isCorrect) cls = 'bg-emerald-600/30 border-emerald-400 text-white';
                else if (answered && isChosen) cls = 'bg-red-600/30 border-red-400 text-white';
                else if (answered) cls = 'bg-black/40 border-purple-500/10 text-stone-500';
                return (
                  <button
                    key={i}
                    disabled={answered}
                    onClick={() => doAnswer(i)}
                    className={`px-4 py-3.5 rounded-2xl border text-sm font-semibold text-left break-words transition-all ${answered ? 'cursor-default' : 'cursor-pointer'} ${cls}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {selected !== null && (
              <p className="text-center text-sm font-bold">
                {selected === current.correctIndex ? (
                  <span className="text-emerald-400">✔ Correct! +{lastGain} points</span>
                ) : selected === -1 ? (
                  <span className="text-red-400">⏰ Time up! It was “{current.options[current.correctIndex]}”</span>
                ) : (
                  <span className="text-red-400">✖ Not quite — it was “{current.options[current.correctIndex]}”</span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {phase === 'result' && profile && (
        <div className="bg-black/30 border border-purple-500/15 rounded-3xl p-5 sm:p-7 space-y-5 max-w-xl mx-auto text-center">
          <div className="flex flex-col items-center gap-2">
            {avatarNode('w-20 h-20')}
            <p className="text-sm text-stone-400">{profile.username}, your result</p>
            <p className="text-5xl">{gradeFor(statsRef.current.correct, questions.length).emoji}</p>
            <p className="text-2xl font-extrabold text-white">{gradeFor(statsRef.current.correct, questions.length).title}</p>
            <p className="text-lg text-purple-200 font-bold">⭐ {statsRef.current.score} points</p>
            <p className="text-xs text-stone-400">
              {statsRef.current.correct} of {questions.length} correct · Best score: {best}
            </p>
            {submitState === 'sending' && <p className="text-xs text-purple-300">Saving your score to the leaderboard…</p>}
            {submitState === 'sent' && <p className="text-xs text-emerald-400 font-bold">🏆 New best saved — check the Leaderboard below!</p>}
            {submitState === 'idle' && <p className="text-xs text-stone-500">Beat your best score to enter the Leaderboard.</p>}
            {submitState === 'failed' && <p className="text-xs text-amber-400">The leaderboard save didn't go through — your best is kept on this device.</p>}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={startGame}
              className="py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm hover:opacity-90 cursor-pointer"
            >
              🔁 Play Again
            </button>
            <button
              onClick={() => {
                stopClip();
                onClose();
              }}
              className="py-3 rounded-2xl bg-purple-950/50 border border-purple-500/30 text-purple-200 font-bold text-sm hover:bg-purple-900/50 cursor-pointer"
            >
              🎵 Back to Music
            </button>
            <a
              href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`}
              target="_blank"
              rel="noreferrer"
              className="py-3 rounded-2xl bg-sky-600/80 text-white font-bold text-sm flex items-center justify-center"
            >
              Share on Telegram
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
              target="_blank"
              rel="noreferrer"
              className="py-3 rounded-2xl bg-stone-800 border border-stone-600 text-white font-bold text-sm flex items-center justify-center"
            >
              Share on X
            </a>
          </div>
        </div>
      )}

      {phase !== 'playing' && (
        <div className="bg-black/30 border border-purple-500/15 rounded-3xl p-5 sm:p-6 space-y-3 max-w-2xl mx-auto">
          <h3 className="text-base font-extrabold text-white text-center">🏆 Quiz Leaderboard — Top 10</h3>
          {boardLoading ? (
            <p className="text-xs text-stone-400 text-center py-3">Loading the leaderboard…</p>
          ) : board.length === 0 ? (
            <p className="text-xs text-stone-400 text-center py-3">No scores yet — be the first name on this board! 💜</p>
          ) : (
            <div className="space-y-1.5">
              {board.map((row, i) => {
                const isMe = !!profile && row.username.toLowerCase() === profile.username.toLowerCase();
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl border ${
                      isMe ? 'bg-purple-950/50 border-purple-400' : 'bg-[#0a061b]/60 border-purple-500/10'
                    }`}
                  >
                    <span className="w-7 text-center text-sm font-extrabold text-purple-200">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                    </span>
                    {row.photo ? (
                      <img src={row.photo} alt={row.username} className="w-8 h-8 rounded-full object-cover border border-purple-400/60" />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-purple-950/60 border border-purple-400/60 flex items-center justify-center text-base">
                        {row.emoji || '💜'}
                      </span>
                    )}
                    <span className="flex-1 min-w-0 truncate text-sm font-bold text-white">
                      {row.username}
                      {isMe && <span className="text-purple-300 text-xs"> (You)</span>}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {row.correct}/{row.total} ✔
                    </span>
                    <span className="text-sm font-extrabold text-purple-200">⭐ {row.score}</span>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[11px] text-stone-500 text-center">One entry per player — your best score. Finish a game with a new best to climb!</p>
        </div>
      )}
    </div>
  );
}
