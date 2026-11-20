import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Music } from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';

interface TimedLine {
  time: number; // seconds
  text: string;
}

// Parse lyrics text. Lines may carry LRC-style time tags like [01:23.45].
// If enough lines are timed, the viewer syncs line-by-line with playback;
// otherwise it falls back to a plain scrollable lyrics page.
function parseLyrics(raw: string): { timed: TimedLine[]; plain: string[] } {
  const timed: TimedLine[] = [];
  const plain: string[] = [];
  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const tagRe = /\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]/g;
    let m: RegExpExecArray | null;
    let firstTime: number | null = null;
    while ((m = tagRe.exec(line)) !== null) {
      const t = parseInt(m[1], 10) * 60 + parseFloat(m[2]);
      if (firstTime === null) firstTime = t;
    }
    const text = line.replace(tagRe, '').trim();
    if (firstTime !== null && text) {
      timed.push({ time: firstTime, text });
    }
    plain.push(text || line);
  }
  timed.sort((a, b) => a.time - b.time);
  return { timed, plain };
}

type LyricsLang = 'rom' | 'ko' | 'en';

export default function LyricsViewer() {
  const { lyricsTrack, closeLyrics, currentTrack, currentTime, duration } = useAudioPlayer();
  const activeRef = useRef<HTMLParagraphElement | null>(null);
  const [lang, setLang] = useState<LyricsLang>('rom');

  // Reset to the main (Romanized) version whenever a different track's lyrics open.
  useEffect(() => {
    setLang('rom');
  }, [lyricsTrack?.id]);

  // Available lyric versions for this track. The toggle only appears when
  // the track actually carries more than one version.
  const versions = useMemo(() => {
    if (!lyricsTrack) return [] as { key: LyricsLang; label: string; text: string }[];
    const list: { key: LyricsLang; label: string; text: string }[] = [];
    if (lyricsTrack.lyrics && lyricsTrack.lyrics.trim() !== '') {
      list.push({ key: 'rom', label: 'Romanized', text: lyricsTrack.lyrics });
    }
    if (lyricsTrack.lyricsKo && lyricsTrack.lyricsKo.trim() !== '') {
      list.push({ key: 'ko', label: 'Korean', text: lyricsTrack.lyricsKo });
    }
    if (lyricsTrack.lyricsEn && lyricsTrack.lyricsEn.trim() !== '') {
      list.push({ key: 'en', label: 'English', text: lyricsTrack.lyricsEn });
    }
    return list;
  }, [lyricsTrack]);

  const activeVersion = versions.find((v) => v.key === lang) || versions[0];

  const parsed = useMemo(
    () => (activeVersion ? parseLyrics(activeVersion.text) : { timed: [], plain: [] }),
    [activeVersion]
  );

  const isCurrentTrack = !!lyricsTrack && !!currentTrack && lyricsTrack.id === currentTrack.id;
  const synced = parsed.timed.length >= 3 && isCurrentTrack && duration > 0;

  const activeIndex = useMemo(() => {
    if (!synced) return -1;
    const t = currentTime + 0.25; // tiny lead so the line lands as it is sung
    let idx = -1;
    for (let i = 0; i < parsed.timed.length; i++) {
      if (parsed.timed[i].time <= t) idx = i;
      else break;
    }
    return idx;
  }, [synced, currentTime, parsed.timed]);

  useEffect(() => {
    if (synced && activeIndex >= 0 && activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [synced, activeIndex]);

  if (!lyricsTrack || versions.length === 0) return null;

  const cover = lyricsTrack.coverUrl || '/images/og-cover-2.jpg';

  return (
    <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={closeLyrics} />
      <div className="lyrics-sheet relative w-full sm:max-w-lg max-h-[78vh] flex flex-col bg-[#0d0820] border border-purple-500/30 rounded-t-3xl sm:rounded-3xl shadow-[0_0_60px_rgba(168,85,247,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-purple-500/15 bg-gradient-to-r from-purple-950/60 to-pink-950/30">
          <img src={cover} alt={lyricsTrack.title} className="w-11 h-11 rounded-xl object-cover border border-purple-500/20 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-stone-100 text-sm truncate">{lyricsTrack.title}</p>
            <p className="text-[11px] text-purple-300 truncate">
              {lyricsTrack.artist || 'BTS'} • Lyrics
            </p>
          </div>
          {synced && (
            <span className="hidden sm:flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-pink-300 bg-pink-500/15 border border-pink-500/30 rounded-full px-2 py-1 shrink-0">
              <Music className="w-3 h-3" /> Synced
            </span>
          )}
          <button
            onClick={closeLyrics}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer shrink-0"
            title="Close lyrics"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language toggle — only when this track has more than one version */}
        {versions.length > 1 && (
          <div className="lyrics-bar flex items-center gap-1.5 px-5 py-2.5 border-b border-purple-500/10 bg-black/20">
            {versions.map((v) => {
              const isActive = activeVersion?.key === v.key;
              return (
                <button
                  key={v.key}
                  onClick={() => setLang(v.key)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent'
                      : 'bg-white/5 text-stone-300 border-purple-500/20 hover:bg-purple-500/15'
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5">
          {synced ? (
            <div className="space-y-3.5 text-center">
              {parsed.timed.map((line, i) => {
                const isActive = i === activeIndex;
                const isPast = activeIndex > i;
                return (
                  <p
                    key={i}
                    ref={isActive ? activeRef : undefined}
                    className={`transition-all duration-500 leading-snug ${
                      isActive
                        ? 'text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-300 scale-[1.04] drop-shadow-[0_0_12px_rgba(217,70,239,0.35)]'
                        : isPast
                          ? 'text-sm text-stone-500 font-medium'
                          : 'text-sm text-stone-200 font-semibold'
                    }`}
                  >
                    {isActive ? '💜 ' : ''}{line.text}
                  </p>
                );
              })}
              <p className="pt-3 text-[10px] font-mono text-stone-500">🎵 Lyrics move with the song</p>
            </div>
          ) : (
            <p className="whitespace-pre-line text-sm leading-relaxed text-stone-200 text-center font-medium">
              {parsed.plain.join('\n')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
