import { useEffect, useMemo, useState } from 'react';
import { Target, Play } from 'lucide-react';
import { DEFAULT_STREAMING_GOALS, StreamingGoal, formatStreams } from '../data/streamingGoals';

// ARMY Streaming Goals (Batch 93) — on the Music page, AFTER the
// track list (owner's placement). Percentages come from the
// songs' REAL Spotify stream totals (public counter data),
// never from this site's own views, and never start at zero:
// goals are the next round milestone. The list lives in config
// (streamingGoals), editable in the Admin Panel; the built-in
// kworb snapshot (Nov 9, 2026) is the fallback.
// Layout per the owner (screenshot-checked): rows like the
// track list inside ONE box — FIVE rows visible, the rest
// scroll DOWN inside the box.

interface TrackMeta {
  coverUrl?: string;
  spotifyUrl?: string;
}

export default function StreamingGoals({
  goals,
  trackMeta,
  onPlay
}: {
  goals?: StreamingGoal[];
  trackMeta?: Record<string, TrackMeta>;
  onPlay?: (title: string) => void;
}) {
  const list = useMemo<StreamingGoal[]>(() => {
    const arr = (goals || []).filter((g) => g && g.title && g.goal > 0);
    return arr.length > 0 ? arr : DEFAULT_STREAMING_GOALS;
  }, [goals]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const updated = list.reduce((latest, g) => (g.updatedAt && g.updatedAt > latest ? g.updatedAt : latest), '');

  if (list.length === 0) return null;

  return (
    <section className="bg-black/30 border border-purple-500/10 backdrop-blur-md p-4 sm:p-5 rounded-3xl shadow-2xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="flex items-center gap-2.5 text-base sm:text-lg font-black text-white">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0">
            <Target className="w-5 h-5 text-white" />
          </span>
          ARMY Streaming Goals
          <span className="text-[11px] font-mono font-bold text-purple-300/80">{list.length} songs</span>
        </h2>
        <span className="text-[10px] sm:text-[11px] font-mono text-stone-500">
          Spotify streams{updated ? ` · Updated: ${updated}` : ''}
        </span>
      </div>

      {/* Five rows visible — the rest scroll down inside the box.
          Rows mirror the Music track list itself (owner: "not
          cards — a list like it is now"), with the stream counter
          and goal bar inside each row. */}
      <div className="mt-4 max-h-[392px] overflow-y-auto pr-1.5 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-purple-500/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-white/5 [scrollbar-width:thin]">
        {list.map((g, i) => {
          const pct = Math.min(100, (g.current / g.goal) * 100);
          const reached = g.current >= g.goal;
          const meta = trackMeta?.[g.title.toLowerCase()];
          return (
            <article
              key={g.id}
              className="flex items-center gap-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors px-3 py-2.5"
            >
              <span className="w-5 text-center text-xs font-mono font-bold text-stone-500 shrink-0">{i + 1}</span>
              {meta?.coverUrl ? (
                <img src={meta.coverUrl} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" loading="lazy" />
              ) : (
                <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-700 to-pink-700 shrink-0" />
              )}
              <div className="flex-1 min-w-0 space-y-1.5">
                <h3 className="text-[13px] font-black text-white leading-tight truncate" title={g.title}>
                  {g.title}
                </h3>
                <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 transition-[width] duration-1000 ease-out ${reached ? 'from-emerald-500 via-teal-400 to-emerald-400' : ''}`}
                    style={{ width: mounted ? `${pct}%` : '0%' }}
                  />
                </div>
                <p className="text-[10px] font-mono text-stone-400 leading-none">
                  <span className="text-stone-100 font-bold">{formatStreams(g.current)}</span> / {formatStreams(g.goal)} ·{' '}
                  <span className={reached ? 'text-emerald-300 font-bold' : 'text-fuchsia-300 font-bold'}>
                    {reached ? 'Goal reached! 🎉' : `${pct.toFixed(1)}%`}
                  </span>
                  {!reached && (
                    <>
                      {' · '}
                      {formatStreams(g.goal - g.current)} to go
                    </>
                  )}
                </p>
                {meta?.spotifyUrl && (
                  <a
                    href={meta.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[10px] font-bold text-emerald-300 hover:text-emerald-200 leading-none"
                  >
                    Open in Spotify ↗
                  </a>
                )}
              </div>
              {onPlay && (
                <button
                  type="button"
                  onClick={() => onPlay(g.title)}
                  aria-label={`Play ${g.title}`}
                  className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center shrink-0 cursor-pointer shadow-md shadow-purple-900/40 transition-colors"
                >
                  <Play className="w-4 h-4 text-white fill-white" />
                </button>
              )}
            </article>
          );
        })}
      </div>
      <p className="mt-2.5 text-center text-[10px] font-mono text-stone-600">
        Scroll inside the box for all {list.length} goals ↓
      </p>
    </section>
  );
}
