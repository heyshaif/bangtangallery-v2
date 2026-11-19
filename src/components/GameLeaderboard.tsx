// GameLeaderboard.tsx — Batch 123: the Top 10 board shown
// under each arcade game. Every game has its OWN board (the
// owner's rule); Memory Match ranks by fewest moves, the rest
// by points. The visitor's own row is highlighted.

import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { fetchGameLeaderboard, gameIdentity, ArcadeGame } from '../utils/gameScores';

const LABELS: Record<ArcadeGame, string> = {
  memory: 'moves · fewest wins',
  wordle: 'points',
  emoji: 'points',
  bomb: 'points',
  trivia: 'points',
};

export default function GameLeaderboard({
  game,
  refreshKey,
}: {
  game: ArcadeGame;
  refreshKey?: unknown;
}) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const myName = gameIdentity()?.name || '';

  useEffect(() => {
    let alive = true;
    fetchGameLeaderboard(game).then((list) => {
      if (alive) {
        setEntries(list);
        setLoaded(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [game, refreshKey]);

  return (
    <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10">
      <h4 className="flex items-center gap-2 text-sm font-black text-white">
        <Trophy className="w-4 h-4 text-amber-400" /> Leaderboard — Top 10
        <span className="text-[11px] font-mono font-normal text-slate-500">{LABELS[game]}</span>
      </h4>
      {!loaded ? (
        <p className="text-xs text-slate-500 mt-3">Loading the board…</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-slate-500 mt-3">No scores yet — finish a game and be the first name here! 💜</p>
      ) : (
        <ol className="mt-3 space-y-1.5">
          {entries.map((e, i) => {
            const mine = myName && e.name === myName;
            return (
              <li
                key={`${e.name}-${i}`}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm ${
                  mine
                    ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/20 border border-fuchsia-400/40'
                    : 'bg-white/[0.03] border border-white/5'
                }`}
              >
                <span className="w-6 text-center font-black">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-slate-400">{i + 1}</span>}
                </span>
                <span className="text-base leading-none">{e.emoji || '💜'}</span>
                <span className={`flex-1 truncate font-bold ${mine ? 'text-white' : 'text-slate-200'}`}>
                  {e.name}
                  {mine && <span className="text-fuchsia-300 text-xs font-black"> · You</span>}
                </span>
                <span className="font-black text-white">
                  {e.score}
                  <span className="text-[10px] font-mono font-normal text-slate-500">
                    {game === 'memory' ? ' moves' : ' pts'}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
