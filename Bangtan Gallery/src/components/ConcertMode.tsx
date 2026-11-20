import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';

// Batch 76 — Concert Mode: a full-screen lightstick screen for
// watching concerts, on a dark, color-washed screen; the pulse
// follows the music (lively while the main player is playing,
// calm breathing when it is not — or the fan can force
// Party/Calm). Batch 87 replaced the single giant center bomb
// with a crowd of ~30 small ARMY Bombs swaying like a real
// concert audience. Everything is local animation: no network,
// no database, and the component only exists while it is open.

type GlowColor = 'purple' | 'pink' | 'red' | 'rainbow';
type Tempo = 'auto' | 'party' | 'calm';

const COLORS: Record<GlowColor, { glow: string; bg: string; label: string; emoji: string }> = {
  purple: {
    glow: 'rgba(168,85,247,0.85)',
    bg: 'radial-gradient(circle at 50% 42%, rgba(147,51,234,0.5), rgba(88,28,135,0.25) 45%, #050208 78%)',
    label: 'Borahae Purple',
    emoji: '💜'
  },
  pink: {
    glow: 'rgba(244,114,182,0.85)',
    bg: 'radial-gradient(circle at 50% 42%, rgba(219,39,119,0.48), rgba(131,24,67,0.25) 45%, #08030a 78%)',
    label: 'Hot Pink',
    emoji: '🩷'
  },
  red: {
    glow: 'rgba(244,63,94,0.85)',
    bg: 'radial-gradient(circle at 50% 42%, rgba(225,29,72,0.45), rgba(80,7,20,0.3) 45%, #0a0206 78%)',
    label: 'ARIRANG Red',
    emoji: '❤️'
  },
  rainbow: {
    glow: 'rgba(192,132,252,0.9)',
    bg: 'radial-gradient(circle at 50% 42%, rgba(147,51,234,0.5), rgba(88,28,135,0.25) 45%, #050208 78%)',
    label: 'Rainbow Wave',
    emoji: '🌈'
  }
};

export default function ConcertMode({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isPlaying, currentTrack } = useAudioPlayer();
  const [color, setColor] = useState<GlowColor>('purple');
  const [tempo, setTempo] = useState<Tempo>('auto');
  const [controls, setControls] = useState(true);
  const hideTimer = useRef<any>(null);
  const wakeLock = useRef<any>(null);
  // Batch 89 — tap wave: each tap sends a flash of light through
  // the crowd from the tap's x position; bombs light in sequence
  // via a per-bomb animation delay based on their distance.
  const [wave, setWave] = useState<{ id: number; x: number } | null>(null);
  const waveTimer = useRef<any>(null);
  const triggerWave = (clientX: number) => {
    const x = Math.max(0, Math.min(100, (clientX / Math.max(1, window.innerWidth)) * 100));
    setWave({ id: Date.now(), x });
    if (waveTimer.current) clearTimeout(waveTimer.current);
    waveTimer.current = setTimeout(() => setWave(null), 2600);
  };

  const showControls = useCallback(() => {
    setControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControls(false), 3500);
  }, []);

  // Batch 87 — a CROWD of lightsticks instead of one giant bomb
  // (the owner: on a laptop the single bomb was far too big, and a
  // real concert is an ocean of small bombs, each swaying in its
  // own time like a hand is holding it). Deterministic layout
  // (seeded) so it never jumps between renders: four rows, back
  // rows smaller, front rows bigger, every bomb with its own sway
  // duration/delay and pulse delay.
  const crowd = useMemo(() => {
    let seed = 42;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const rows = [
      { y: 4, n: 6, s: 30 },
      { y: 27, n: 7, s: 40 },
      { y: 50, n: 8, s: 52 },
      { y: 74, n: 9, s: 66 }
    ];
    const out: Array<{
      id: string;
      x: number;
      y: number;
      size: number;
      swayDur: number;
      swayDelay: number;
      pulseDelay: number;
      op: number;
    }> = [];
    rows.forEach((row, ri) => {
      for (let i = 0; i < row.n; i++) {
        out.push({
          id: `${ri}-${i}`,
          x: ((i + 0.5) / row.n) * 100 + (rnd() - 0.5) * 6,
          y: row.y + (rnd() - 0.5) * 8,
          size: Math.round(row.s * (0.9 + rnd() * 0.25)),
          swayDur: 1.8 + rnd() * 1.4,
          swayDelay: -rnd() * 3,
          pulseDelay: -rnd() * 2,
          op: 0.78 + rnd() * 0.22
        });
      }
    });
    return out;
  }, []);

  // Fullscreen + screen wake lock while the mode is open (both
  // best-effort: the mode works fine if the browser refuses).
  useEffect(() => {
    if (!open) return;
    showControls();
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    } catch {
      /* noop */
    }
    try {
      (navigator as any).wakeLock?.request?.('screen').then((lock: any) => {
        wakeLock.current = lock;
      }).catch(() => {});
    } catch {
      /* noop */
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (waveTimer.current) clearTimeout(waveTimer.current);
      try {
        wakeLock.current?.release?.();
      } catch {
        /* noop */
      }
      wakeLock.current = null;
      try {
        if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      } catch {
        /* noop */
      }
    };
  }, [open, onClose, showControls]);

  if (!open) return null;

  const party = tempo === 'party' || (tempo === 'auto' && isPlaying);
  const pulseSeconds = party ? 0.5 : 2.6;
  const theme = COLORS[color];

  return (
    <div
      className="fixed inset-0 z-[10005] overflow-hidden select-none"
      style={{ background: theme.bg }}
      onPointerDown={(e) => {
        showControls();
        triggerWave(e.clientX);
      }}
    >
      {/* drifting ambient orbs */}
      <div
        className="absolute w-[70vmin] h-[70vmin] rounded-full blur-3xl opacity-40 cm-drift"
        style={{ background: theme.glow, top: '-15%', left: '-10%' }}
      />
      <div
        className="absolute w-[60vmin] h-[60vmin] rounded-full blur-3xl opacity-30 cm-drift-rev"
        style={{ background: theme.glow, bottom: '-18%', right: '-8%' }}
      />

      <div
        className={`absolute inset-0 flex flex-col items-center justify-center px-6 ${
          color === 'rainbow' ? 'cm-hue' : ''
        }`}
      >
        <p className="text-[11px] sm:text-xs font-black tracking-[0.45em] text-white/80 mb-6 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> CONCERT MODE <Sparkles className="w-4 h-4" />
        </p>

        {/* the crowd — an ocean of small ARMY Bombs (Batch 87) */}
        <div className="relative w-full max-w-6xl h-[48vh] sm:h-[54vh]">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[82%] h-[72%] rounded-full blur-3xl cm-pulse pointer-events-none"
            style={{ background: theme.glow, opacity: 0.32, animationDuration: `${pulseSeconds}s` }}
          />
          {crowd.map((b) => (
            <div
              key={b.id}
              className="absolute cm-sway pointer-events-none"
              style={{
                left: `calc(${b.x}% - ${Math.round(b.size / 2)}px)`,
                top: `${b.y}%`,
                animationDuration: `${party ? b.swayDur * 0.55 : b.swayDur}s`,
                animationDelay: `${b.swayDelay}s`,
                opacity: b.op
              }}
            >
              <img
                src="/images/army-bomb-on.png"
                alt=""
                aria-hidden
                className="cm-pulse block"
                style={{
                  width: b.size,
                  animationDuration: `${pulseSeconds}s`,
                  animationDelay: `${b.pulseDelay}s`,
                  filter: `drop-shadow(0 0 14px ${theme.glow})`
                }}
                draggable={false}
              />
              {wave && (
                <span
                  key={wave.id}
                  className="cm-wave-flash absolute left-1/2 top-1/2 rounded-full pointer-events-none"
                  style={{
                    width: b.size * 2.6,
                    height: b.size * 2.6,
                    background: `radial-gradient(circle, ${theme.glow} 0%, transparent 65%)`,
                    animationDelay: `${Math.round(Math.abs(b.x - wave.x) * 16)}ms`
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <p className="mt-4 text-xl sm:text-2xl font-black text-white tracking-wide text-center">
          💜 ARMY 💜
        </p>
        <p className="mt-2 text-xs sm:text-sm text-white/75 text-center max-w-sm">
          {isPlaying && currentTrack
            ? `🎵 Now playing: ${currentTrack.title}${currentTrack.artist ? ` — ${currentTrack.artist}` : ''}`
            : 'Wave your light with the music — start a song or a concert and enjoy!'}
        </p>
      </div>

      {/* controls (auto-hide) */}
      <div
        className={`absolute inset-x-0 bottom-0 pb-6 pt-10 px-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-500 ${
          controls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {(Object.keys(COLORS) as GlowColor[]).map((c) => (
              <button
                key={c}
                onClick={(e) => {
                  e.stopPropagation();
                  setColor(c);
                  showControls();
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer ${
                  color === c
                    ? 'bg-white text-black border-white'
                    : 'bg-white/10 text-white border-white/25 hover:bg-white/20'
                }`}
              >
                {COLORS[c].emoji} {COLORS[c].label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {(
              [
                ['auto', '🔁 Auto (follows music)'],
                ['party', '🎉 Party'],
                ['calm', '🌙 Calm']
              ] as [Tempo, string][]
            ).map(([t, label]) => (
              <button
                key={t}
                onClick={(e) => {
                  e.stopPropagation();
                  setTempo(t);
                  showControls();
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer ${
                  tempo === t
                    ? 'bg-white text-black border-white'
                    : 'bg-white/10 text-white border-white/25 hover:bg-white/20'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="px-4 py-1.5 rounded-full text-[11px] font-black bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center gap-1.5 cursor-pointer hover:opacity-90"
            >
              <X className="w-3.5 h-3.5" /> Exit
            </button>
          </div>
          <p className="text-[10px] text-white/50">Tap the crowd for a light wave 🌊 • Esc or Exit to leave</p>
        </div>
      </div>
    </div>
  );
}
