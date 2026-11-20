// ArcadeGames.tsx — Batch 112: four extra Play Game titles that
// sit beside the Music Quiz in the Games Hub. Everything runs
// locally (scores and bests live in localStorage only — no
// database writes), each game mounts only when its tab is
// opened, and all content comes from data the site already
// has: the published tracks and the member list.

import { useEffect, useMemo, useRef, useState } from 'react';
import GameLeaderboard from './GameLeaderboard';
import { postGameScore } from '../utils/gameScores';
import { RotateCcw, Trophy, Play, Delete, CornerDownLeft, Bomb, Timer } from 'lucide-react';
import { MEMBERS } from '../data/btsData';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function best(key: string): number {
  try {
    return Number(localStorage.getItem(key) || 0) || 0;
  } catch {
    return 0;
  }
}
function saveBest(key: string, value: number, higher = true) {
  try {
    const cur = best(key);
    if (higher ? value > cur : cur === 0 || value < cur) localStorage.setItem(key, String(value));
  } catch {}
}

/* ============================ MEMORY MATCH ============================ */

interface MemCard {
  key: number;
  memberId: string;
  name: string;
  emoji: string;
}

export function MemoryMatch() {
  const [deck, setDeck] = useState<MemCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [lock, setLock] = useState(false);
  const [bestMoves, setBestMoves] = useState(() => best('bg_memory_best'));

  const start = () => {
    postedRef.current = false;
    const six = shuffle(MEMBERS).slice(0, 6);
    const cards = shuffle(
      six.flatMap((m) => [
        { key: Math.random(), memberId: m.id, name: m.name, emoji: m.emoji },
        { key: Math.random(), memberId: m.id, name: m.name, emoji: m.emoji },
      ])
    );
    setDeck(cards);
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setLock(false);
  };
  useEffect(start, []);

  const won = matched.size === 6 && deck.length > 0;
  const [boardTick, setBoardTick] = useState(0);
  const postedRef = useRef(false);
  useEffect(() => {
    if (won) {
      saveBest('bg_memory_best', moves, false);
      setBestMoves(best('bg_memory_best'));
      if (!postedRef.current) {
        postedRef.current = true;
        void postGameScore('memory', moves).then(() => setBoardTick((t) => t + 1));
      }
    }
  }, [won, moves]);

  const flip = (idx: number) => {
    if (lock || won) return;
    const card = deck[idx];
    if (matched.has(card.memberId) || flipped.includes(idx)) return;
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next.map((i) => deck[i]);
      if (a.memberId === b.memberId) {
        setMatched((prev) => new Set(prev).add(a.memberId));
        setFlipped([]);
      } else {
        setLock(true);
        setTimeout(() => {
          setFlipped([]);
          setLock(false);
        }, 750);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-slate-300">
          Moves <span className="font-black text-white">{moves}</span> · Pairs{' '}
          <span className="font-black text-white">{matched.size}/6</span>
          {bestMoves > 0 && (
            <span className="text-slate-400"> · Best {bestMoves} moves</span>
          )}
        </p>
        <button
          type="button"
          onClick={start}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-purple-600/25 border border-purple-500/40 text-purple-200 text-xs font-bold cursor-pointer hover:bg-purple-600/40 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> New game
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {deck.map((card, idx) => {
          const up = flipped.includes(idx) || matched.has(card.memberId);
          const isMatch = matched.has(card.memberId);
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => flip(idx)}
              className={`aspect-[4/3.4] rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer ${
                up
                  ? isMatch
                    ? 'bg-purple-950/60 border-emerald-400/60'
                    : 'bg-purple-950/60 border-purple-400/50'
                  : 'bg-gradient-to-br from-purple-700/60 to-fuchsia-800/50 border-purple-500/30 hover:border-fuchsia-400/60 active:scale-95'
              }`}
            >
              {up ? (
                <>
                  <span className="text-4xl sm:text-5xl leading-none">{card.emoji}</span>
                  <span className="text-[11px] sm:text-xs font-black text-white">{card.name}</span>
                </>
              ) : (
                <span className="text-2xl sm:text-3xl leading-none">💜</span>
              )}
            </button>
          );
        })}
      </div>

      {won && (
        <div className="text-center p-5 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 space-y-2">
          <p className="text-lg font-black text-emerald-300">🎉 All 6 pairs found in {moves} moves!</p>
          <button
            type="button"
            onClick={start}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-black cursor-pointer"
          >
            Play again
          </button>
        </div>
      )}
          <GameLeaderboard game="memory" refreshKey={boardTick} />
    </div>
  );
}

/* ============================ GUESS THE SONG ============================ */

const FALLBACK_WORDS = ['SWIM', 'NORMAL', 'ALIENS', 'PLEASE', 'HOOLIGAN', 'COMEOVER'];
const KB_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

function scoreGuess(guess: string, target: string): ('hit' | 'near' | 'miss')[] {
  const res: ('hit' | 'near' | 'miss')[] = Array(target.length).fill('miss');
  const left: Record<string, number> = {};
  for (let i = 0; i < target.length; i++) {
    if (guess[i] === target[i]) res[i] = 'hit';
    else left[target[i]] = (left[target[i]] || 0) + 1;
  }
  for (let i = 0; i < target.length; i++) {
    if (res[i] === 'hit') continue;
    if (left[guess[i]] > 0) {
      res[i] = 'near';
      left[guess[i]]--;
    }
  }
  return res;
}

export function GuessSong({ tracks }: { tracks: any[] }) {
  const pool = useMemo(() => {
    const words = (tracks || [])
      .map((t) => String(t.title || '').toUpperCase().replace(/[^A-Z]/g, ''))
      .filter((w, i, a) => w.length >= 4 && w.length <= 8 && a.indexOf(w) === i);
    return words.length >= 3 ? words : FALLBACK_WORDS;
  }, [tracks]);

  const [target, setTarget] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [done, setDone] = useState<'won' | 'lost' | ''>('');
  const [wins, setWins] = useState(() => best('bg_wordle_wins'));

  const start = () => {
    setTarget(pool[Math.floor(Math.random() * pool.length)]);
    setGuesses([]);
    setCurrent('');
    setDone('');
  };
  // Batch 123: start ONCE. The old [pool] effect restarted the
  // game whenever the config refetched (new array identity) —
  // the same bug the owner hit in the Emoji Quiz.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    start();
  }, [pool]);

  const keyState = useMemo(() => {
    const rank = { miss: 0, near: 1, hit: 2 } as const;
    const map: Record<string, 'hit' | 'near' | 'miss'> = {};
    guesses.forEach((g) => {
      scoreGuess(g, target).forEach((st, i) => {
        const ch = g[i];
        if (!map[ch] || rank[st] > rank[map[ch]]) map[ch] = st;
      });
    });
    return map;
  }, [guesses, target]);

  const [boardTick, setBoardTick] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const currentRef = useRef('');
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  const submitRow = (g: string) => {
    if (done || !target) return;
    const next = [...guesses, g];
    setGuesses(next);
    setCurrent('');
    currentRef.current = '';
    if (g === target) {
      setDone('won');
      saveBest('bg_wordle_wins', wins + 1);
      setWins(wins + 1);
      void postGameScore('wordle', (7 - next.length) * 100).then(() => setBoardTick((t) => t + 1));
    } else if (next.length >= 6) setDone('lost');
  };

  // Batch 123 (owner's rule): 10 seconds per row. When the
  // clock runs out the row locks with whatever is typed (blank
  // cells count as misses) and the next row begins.
  useEffect(() => {
    if (!target || done) return;
    setSecondsLeft(10);
    const iv = window.setInterval(() => {
      setSecondsLeft((sec) => {
        if (sec <= 1) {
          window.clearInterval(iv);
          submitRow((currentRef.current || '').padEnd(target.length, ' '));
          return 10;
        }
        return sec - 1;
      });
    }, 1000);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, guesses.length, done]);

  const press = (k: string) => {
    if (done || !target) return;
    if (k === 'DEL') setCurrent((c) => c.slice(0, -1));
    else if (k === 'ENTER') {
      if (current.length === target.length) submitRow(current);
    } else if (current.length < target.length) setCurrent((c) => c + k);
  };

  const cellCls = (st?: 'hit' | 'near' | 'miss') =>
    st === 'hit'
      ? 'bg-emerald-500 border-emerald-400 text-white'
      : st === 'near'
        ? 'bg-amber-500 border-amber-400 text-white'
        : st === 'miss'
          ? 'bg-slate-600/70 border-slate-500 text-white'
          : 'bg-white/[0.04] border-white/15 text-white';

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-300 text-center">
        Guess the song title in <span className="font-black text-white">6 tries</span>. Green = right letter,
        right place · Yellow = in the title, wrong place. Every row gives you{' '}
        <span className="font-black text-white">10 seconds</span> — type fast!
        {wins > 0 && <span className="text-slate-400"> · 🏆 {wins} solved</span>}
      </p>

      {!done && target && (
        <div className="max-w-sm mx-auto space-y-1">
          <p className={`text-center text-xs font-black ${secondsLeft <= 3 ? 'text-rose-300' : 'text-slate-300'}`}>
            ⏱ {secondsLeft}s for this row
          </p>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${secondsLeft <= 3 ? 'bg-rose-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
              style={{ width: `${secondsLeft * 10}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-1.5">
        {Array.from({ length: 6 }).map((_, r) => {
          const g = guesses[r] || (r === guesses.length ? current : '');
          const scored = r < guesses.length ? scoreGuess(guesses[r], target) : null;
          return (
            <div key={r} className="flex gap-1.5">
              {Array.from({ length: target.length || 6 }).map((_, c) => (
                <div
                  key={c}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg border-2 flex items-center justify-center text-lg font-black ${cellCls(scored?.[c])}`}
                >
                  {g[c] || ''}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {done ? (
        <div
          className={`text-center p-5 rounded-2xl border space-y-2 ${
            done === 'won' ? 'bg-emerald-500/10 border-emerald-400/30' : 'bg-rose-500/10 border-rose-400/30'
          }`}
        >
          <p className="text-lg font-black text-white">
            {done === 'won' ? `🎉 You got it in ${guesses.length} ${guesses.length === 1 ? 'try' : 'tries'}!` : `The song was ${target}`}
          </p>
          <button
            type="button"
            onClick={start}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-black cursor-pointer"
          >
            New song
          </button>
        </div>
      ) : (
        <div className="space-y-1.5 select-none">
          {KB_ROWS.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-1.5">
              {ri === 2 && (
                <button
                  type="button"
                  onClick={() => press('ENTER')}
                  className="h-11 px-3 rounded-lg bg-purple-600/40 border border-purple-500/40 text-white cursor-pointer active:scale-95"
                  aria-label="Enter"
                >
                  <CornerDownLeft className="w-4 h-4" />
                </button>
              )}
              {row.split('').map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => press(ch)}
                  className={`w-8 h-11 sm:w-9 rounded-lg border text-sm font-black cursor-pointer active:scale-95 ${
                    keyState[ch] === 'hit'
                      ? 'bg-emerald-500 border-emerald-400 text-white'
                      : keyState[ch] === 'near'
                        ? 'bg-amber-500 border-amber-400 text-white'
                        : keyState[ch] === 'miss'
                          ? 'bg-slate-700/60 border-slate-600 text-slate-400'
                          : 'bg-white/[0.06] border-white/15 text-white'
                  }`}
                >
                  {ch}
                </button>
              ))}
              {ri === 2 && (
                <button
                  type="button"
                  onClick={() => press('DEL')}
                  className="h-11 px-3 rounded-lg bg-white/[0.06] border border-white/15 text-white cursor-pointer active:scale-95"
                  aria-label="Delete"
                >
                  <Delete className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
          <GameLeaderboard game="wordle" refreshKey={boardTick} />
    </div>
  );
}

/* ============================ EMOJI QUIZ ============================ */

const EMOJI_CLUES: Record<string, string> = {
  'body to body': '💪➡️💪',
  hooligan: '😈🔥🙃',
  aliens: '👽🛸🌌',
  fya: '🔥😤🔥',
  '2.0': '2️⃣⏫✨',
  'no. 29': '🔢2️⃣9️⃣',
  swim: '🌊🏊💦',
  'merry go round': '🎠🔄😊',
  normal: '🧑📅👌',
  'like animals': '🐯🦁🐾',
  "they don't know 'bout us": '🙈🤷💜',
  'one more night': '1️⃣🌙✨',
  please: '🙏🥺💜',
  'into the sun': '🌞🚶🔥',
  'come over': '👋🏠💜',
};

interface EmojiQ {
  title: string;
  clue: string;
  options: string[];
}

export function EmojiQuiz({ tracks }: { tracks: any[] }) {
  const [questions, setQuestions] = useState<EmojiQ[]>([]);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const [bestScore, setBestScore] = useState(() => best('bg_emoji_best'));
  const [boardTick, setBoardTick] = useState(0);

  const start = () => {
    const titles = (tracks || []).map((t) => String(t.title || '')).filter(Boolean);
    const playable = titles.filter((t) => EMOJI_CLUES[t.toLowerCase()]);
    const qs = shuffle(playable.length >= 4 ? playable : Object.keys(EMOJI_CLUES))
      .slice(0, 10)
      .map((title) => {
        const others = shuffle(titles.filter((t) => t !== title && t.toLowerCase() !== title.toLowerCase())).slice(0, 3);
        return {
          title,
          clue: EMOJI_CLUES[title.toLowerCase()] || '🎵💜✨',
          options: shuffle([title, ...others]),
        };
      });
    setQuestions(qs);
    setQi(0);
    setPicked(null);
    setScore(0);
    setStreak(0);
    setFinished(false);
  };
  // Batch 123 (owner's bug report): start ONCE per mount. The
  // old [tracks] effect restarted the quiz at question 1 with
  // score 0 every time the site config refetched and handed
  // down a new tracks array. If the real tracks have not
  // loaded yet, wait for them (2.5s fallback to the built-in
  // clue list so the game never hangs).
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    if ((tracks || []).length > 0) {
      startedRef.current = true;
      start();
      return;
    }
    const t = window.setTimeout(() => {
      if (!startedRef.current) {
        startedRef.current = true;
        start();
      }
    }, 2500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks]);

  const q = questions[qi];
  const answer = (opt: string) => {
    if (picked || !q) return;
    setPicked(opt);
    if (opt === q.title) {
      setScore((s) => s + 100 + Math.min(3, streak) * 25);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
    setTimeout(() => {
      setPicked(null);
      if (qi + 1 >= questions.length) {
        setFinished(true);
        const finalScore = score + (opt === q.title ? 100 + Math.min(3, streak) * 25 : 0);
        saveBest('bg_emoji_best', finalScore);
        setBestScore(best('bg_emoji_best'));
        if (finalScore > 0) void postGameScore('emoji', finalScore).then(() => setBoardTick((t) => t + 1));
      } else {
        setQi(qi + 1);
      }
    }, 900);
  };

  if (finished) {
    return (
      <div className="text-center p-6 rounded-2xl bg-purple-950/30 border border-purple-500/25 space-y-3">
        <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
        <p className="text-2xl font-black text-white">{score} points</p>
        <p className="text-sm text-slate-300">
          Best: {Math.max(bestScore, score)} · Every emoji hides a song — how many did you know?
        </p>
        <button
          type="button"
          onClick={start}
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-black cursor-pointer"
        >
          Play again
        </button>
        <GameLeaderboard game="emoji" refreshKey={boardTick} />
      </div>
    );
  }
  if (!q) return <p className="text-center text-slate-400 text-sm py-8">Loading songs…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300">
          Question <span className="font-black text-white">{qi + 1}/{questions.length}</span>
        </span>
        <span className="text-slate-300">
          Score <span className="font-black text-white">{score}</span>
          {streak >= 2 && <span className="text-orange-300 font-bold"> · 🔥 {streak} streak</span>}
        </span>
      </div>
      <div className="py-6 rounded-2xl bg-purple-950/30 border border-purple-500/25 text-center">
        <span className="text-5xl sm:text-6xl tracking-wide">{q.clue}</span>
        <p className="mt-3 text-xs font-mono uppercase tracking-widest text-purple-300">Which song is this?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {q.options.map((opt) => {
          const isRight = picked && opt === q.title;
          const isWrong = picked === opt && opt !== q.title;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => answer(opt)}
              className={`py-3.5 px-4 rounded-xl border text-sm font-bold text-left cursor-pointer transition-all ${
                isRight
                  ? 'bg-emerald-500/25 border-emerald-400 text-white'
                  : isWrong
                    ? 'bg-rose-500/25 border-rose-400 text-white'
                    : 'bg-white/[0.04] border-white/10 text-slate-100 hover:border-purple-400/50 active:scale-[0.98]'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
          <GameLeaderboard game="emoji" refreshKey={boardTick} />
    </div>
  );
}

/* ============================ BOMB TAP ============================ */

interface BombItem {
  id: number;
  x: number;
  y: number;
  golden: boolean;
  born: number;
}

export function BombTap() {
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [bombs, setBombs] = useState<BombItem[]>([]);
  const [bestScore, setBestScore] = useState(() => best('bg_bomb_best'));
  const idRef = useRef(0);
  const scoreRef = useRef(0);
  const [boardTick, setBoardTick] = useState(0);
  const postedRef = useRef(false);
  useEffect(() => {
    if (!running && timeLeft === 0 && scoreRef.current > 0 && !postedRef.current) {
      postedRef.current = true;
      void postGameScore('bomb', scoreRef.current).then(() => setBoardTick((t) => t + 1));
    }
  }, [running, timeLeft]);

  useEffect(() => {
    if (!running) return;
    const spawn = setInterval(() => {
      const b: BombItem = {
        id: ++idRef.current,
        x: 4 + Math.random() * 84,
        y: 4 + Math.random() * 78,
        golden: Math.random() < 0.12,
        born: Date.now(),
      };
      setBombs((prev) => [...prev.filter((p) => Date.now() - p.born < 950), b]);
    }, 620);
    const prune = setInterval(() => {
      setBombs((prev) => prev.filter((p) => Date.now() - p.born < 950));
    }, 200);
    const clock = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setRunning(false);
          saveBest('bg_bomb_best', scoreRef.current);
          setBestScore(best('bg_bomb_best'));
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      clearInterval(spawn);
      clearInterval(prune);
      clearInterval(clock);
    };
  }, [running]);

  const start = () => {
    postedRef.current = false;
    scoreRef.current = 0;
    setScore(0);
    setBombs([]);
    setTimeLeft(30);
    setRunning(true);
  };

  const tap = (b: BombItem) => {
    if (!running) return;
    scoreRef.current += b.golden ? 3 : 1;
    setScore(scoreRef.current);
    setBombs((prev) => prev.filter((p) => p.id !== b.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap text-sm">
        <span className="inline-flex items-center gap-1.5 text-slate-300">
          <Timer className="w-4 h-4 text-pink-400" />{' '}
          <span className="font-black text-white">{running ? `${timeLeft}s` : '30s'}</span>
        </span>
        <span className="text-slate-300">
          Score <span className="font-black text-white">{score}</span>
          {bestScore > 0 && <span className="text-slate-400"> · Best {bestScore}</span>}
        </span>
        {!running && (
          <button
            type="button"
            onClick={start}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-black cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" /> {score > 0 || timeLeft === 0 ? 'Play again' : 'Start'}
          </button>
        )}
      </div>

      <div className="relative h-72 sm:h-80 rounded-2xl bg-[#0a0616] border border-purple-500/25 overflow-hidden">
        {bombs.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => tap(b)}
            className="absolute cursor-pointer active:scale-90 transition-transform"
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
            aria-label={b.golden ? 'Golden ARMY Bomb — 3 points' : 'ARMY Bomb — 1 point'}
          >
            <img
              src="/images/army-bomb-on.png"
              alt=""
              className={`w-12 h-12 sm:w-14 sm:h-14 object-contain ${
                b.golden
                  ? 'drop-shadow-[0_0_16px_rgba(245,158,11,0.95)]'
                  : 'drop-shadow-[0_0_14px_rgba(236,72,153,0.85)]'
              }`}
              draggable={false}
            />
            {b.golden && (
              <span className="absolute -top-1 -right-1 text-[10px] font-black bg-amber-400 text-black px-1.5 py-0.5 rounded-full">
                +3
              </span>
            )}
          </button>
        ))}
        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-4">
            <Bomb className="w-9 h-9 text-fuchsia-400" />
            <p className="text-white font-black">
              {timeLeft === 0 ? `Time! You scored ${score} 💜` : 'Tap the glowing ARMY Bombs before they fade!'}
            </p>
            <p className="text-xs text-slate-400">Golden bombs are worth 3 points. You have 30 seconds.</p>
          </div>
        )}
        {running && (
          <div className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 transition-all duration-1000" style={{ width: `${(timeLeft / 30) * 100}%` }} />
        )}
      </div>
          <GameLeaderboard game="bomb" refreshKey={boardTick} />
    </div>
  );
}

/* ============================ BTS TRIVIA ============================ */
// Batch 118: facts only — every question below is built from
// facts already verified for this site (debut, birthdays from
// btsData, the ARIRANG release, the iHeartRadio set, the FAQ).

interface TriviaQ {
  q: string;
  answer: string;
  options: string[];
}

const TRIVIA_POOL: TriviaQ[] = [
  { q: 'When did BTS debut?', answer: 'June 13, 2013', options: ['June 13, 2013', 'July 9, 2013', 'May 15, 2012', 'June 12, 2014'] },
  { q: "What was BTS's debut title track?", answer: 'No More Dream', options: ['No More Dream', 'Danger', 'I Need U', 'Boy With Luv'] },
  { q: 'ARMY Day — the day the fandom got its name — is…', answer: 'July 9', options: ['July 9', 'June 13', 'April 29', 'August 21'] },
  { q: 'Whose birthday is December 4?', answer: 'Jin', options: ['Jin', 'V', 'RM', 'Jimin'] },
  { q: 'Who was born on December 30?', answer: 'V', options: ['V', 'Jin', 'SUGA', 'Jung Kook'] },
  { q: 'Who is the leader of BTS?', answer: 'RM', options: ['RM', 'Jin', 'SUGA', 'j-hope'] },
  { q: "Which member's birthday is September 1?", answer: 'Jung Kook', options: ['Jung Kook', 'Jimin', 'SUGA', 'j-hope'] },
  { q: 'When was the ARIRANG album released?', answer: 'March 20, 2026', options: ['March 20, 2026', 'March 21, 2025', 'February 20, 2026', 'April 3, 2026'] },
  { q: 'What is the title track of ARIRANG?', answer: 'SWIM', options: ['SWIM', 'NORMAL', 'Hooligan', 'FYA'] },
  { q: 'How many members are in BTS?', answer: '7', options: ['7', '6', '5', '9'] },
  { q: 'Which member is from Daegu and cheers for the Samsung Lions?', answer: 'SUGA', options: ['SUGA', 'RM', 'V', 'Jimin'] },
  { q: "j-hope's birthday is in which month?", answer: 'February', options: ['February', 'March', 'September', 'October'] },
  { q: "SUGA's birthday is…", answer: 'March 9', options: ['March 9', 'February 18', 'September 12', 'October 13'] },
  { q: "RM's birthday is…", answer: 'September 12', options: ['September 12', 'September 1', 'December 4', 'March 9'] },
  { q: "Jimin's birthday is…", answer: 'October 13', options: ['October 13', 'October 3', 'November 13', 'December 30'] },
  { q: 'The name ARMY was revealed in which year?', answer: '2013', options: ['2013', '2014', '2012', '2015'] },
  { q: "Which album is BTS's fifth studio album?", answer: 'ARIRANG', options: ['ARIRANG', 'Proof', 'BE', 'Map of the Soul: 7'] },
  { q: "BTS's first festival stage in six years (September 2026) was in…", answer: 'Las Vegas', options: ['Las Vegas', 'Seoul', 'Tokyo', 'London'] },
  { q: "'Come Over' first appeared as a hidden track on the ARIRANG…", answer: 'Deluxe vinyl', options: ['Deluxe vinyl', 'CD', 'Cassette', 'Japanese edition'] },
  { q: 'Who is the youngest member (the maknae)?', answer: 'Jung Kook', options: ['Jung Kook', 'Jimin', 'V', 'j-hope'] },
  { q: 'Who coined "Borahae" (I purple you)?', answer: 'V', options: ['V', 'RM', 'Jin', 'SUGA'] },
  { q: 'FESTA celebrates…', answer: "BTS's debut anniversary", options: ["BTS's debut anniversary", "ARMY's birthday", 'The first concert', 'A new album'] },
];

export function BtsTrivia() {
  const [questions, setQuestions] = useState<TriviaQ[]>([]);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [bestScore, setBestScore] = useState(() => best('bg_trivia_best'));
  const [boardTick, setBoardTick] = useState(0);

  const start = () => {
    setQuestions(shuffle(TRIVIA_POOL).slice(0, 10).map((t) => ({ ...t, options: shuffle(t.options) })));
    setQi(0);
    setPicked(null);
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setFinished(false);
  };
  useEffect(start, []);

  const q = questions[qi];
  const answer = (opt: string) => {
    if (picked || !q) return;
    setPicked(opt);
    const right = opt === q.answer;
    const gained = right ? 100 + Math.min(3, streak) * 25 : 0;
    if (right) {
      setScore((s) => s + gained);
      setStreak((s) => s + 1);
      setCorrect((c) => c + 1);
    } else {
      setStreak(0);
    }
    setTimeout(() => {
      setPicked(null);
      if (qi + 1 >= questions.length) {
        setFinished(true);
        saveBest('bg_trivia_best', score + gained);
        setBestScore(best('bg_trivia_best'));
        if (score + gained > 0) void postGameScore('trivia', score + gained).then(() => setBoardTick((t) => t + 1));
      } else {
        setQi(qi + 1);
      }
    }, 1000);
  };

  if (finished) {
    return (
      <div className="text-center p-6 rounded-2xl bg-purple-950/30 border border-purple-500/25 space-y-3">
        <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
        <p className="text-2xl font-black text-white">{score} points · {correct}/10 correct</p>
        <p className="text-sm text-slate-300">
          {correct >= 9 ? '👑 ARMY Legend knowledge!' : correct >= 7 ? '💜 True ARMY!' : correct >= 5 ? '🎤 Solid ARMY knowledge!' : '🌱 Baby ARMY — the Dictionary page can help!'}
          {' '}Best: {Math.max(bestScore, score)}
        </p>
        <button
          type="button"
          onClick={start}
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-black cursor-pointer"
        >
          Play again
        </button>
        <GameLeaderboard game="trivia" refreshKey={boardTick} />
      </div>
    );
  }
  if (!q) return <p className="text-center text-slate-400 text-sm py-8">Loading questions…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300">
          Question <span className="font-black text-white">{qi + 1}/{questions.length}</span>
        </span>
        <span className="text-slate-300">
          Score <span className="font-black text-white">{score}</span>
          {streak >= 2 && <span className="text-orange-300 font-bold"> · 🔥 {streak} streak</span>}
        </span>
      </div>
      <div className="py-6 px-5 rounded-2xl bg-purple-950/30 border border-purple-500/25 text-center">
        <p className="text-lg sm:text-xl font-black text-white leading-snug">{q.q}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {q.options.map((opt) => {
          const isRight = picked && opt === q.answer;
          const isWrong = picked === opt && opt !== q.answer;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => answer(opt)}
              className={`py-3.5 px-4 rounded-xl border text-sm font-bold text-left cursor-pointer transition-all ${
                isRight
                  ? 'bg-emerald-500/25 border-emerald-400 text-white'
                  : isWrong
                    ? 'bg-rose-500/25 border-rose-400 text-white'
                    : 'bg-white/[0.04] border-white/10 text-slate-100 hover:border-purple-400/50 active:scale-[0.98]'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
          <GameLeaderboard game="trivia" refreshKey={boardTick} />
    </div>
  );
}
