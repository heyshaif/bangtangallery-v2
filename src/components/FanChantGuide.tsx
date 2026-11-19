// FanChantGuide.tsx — Batch 115: the Fan Chant Guide lives as
// a tab on the Dictionary page (owner's placement). The heart
// of it is the name chant — the one chant every ARMY shouts at
// a concert — with a practice mode that lights up one name at
// a time so a first-timer can learn the rhythm before the show.

import { useEffect, useRef, useState } from 'react';
import { Play, Square, Megaphone, Ear, BookOpenCheck } from 'lucide-react';

const CHANT = [
  'Kim Namjoon!',
  'Kim Seokjin!',
  'Min Yoongi!',
  'Jung Hoseok!',
  'Park Jimin!',
  'Kim Taehyung!',
  'Jeon Jungkook!',
  'BTS!',
];

export default function FanChantGuide({ audioUrl }: { audioUrl?: string }) {
  const [active, setActive] = useState(-1);
  const [practicing, setPracticing] = useState(false);
  const [finished, setFinished] = useState(false);
  const timer = useRef<number | null>(null);
  // Batch 138: practice SPEED control (owner's ask). The clip
  // the owner uploaded runs ~1.5s per name, but the highlight
  // timer was a fixed 850ms — out of sync with the real audio.
  // Now the per-name step is DERIVED from the clip's duration
  // (duration / 8 names) once its metadata loads, and the
  // visitor can slow the whole practice down (0.5x / 0.75x) or
  // run it at full speed (1x): the speed scales BOTH the
  // highlight step and the audio's playbackRate together.
  const [rate, setRate] = useState(1);
  const rateRef = useRef(1);
  const stepRef = useRef(850);
  // Batch 122: the chant MUSIC is a real audio clip the owner
  // uploads in Admin Panel → ARMY Dictionary → Fan Chant Audio
  // (config field fanChantAudioUrl). Until the owner adds one,
  // there is deliberately NO sound — no fake or generated chant —
  // and the card says so honestly below.
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch { /* audio already gone */ }
      audioRef.current = null;
    }
  };

  const stop = () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      window.clearInterval(timer.current);
    }
    timer.current = null;
    stopAudio();
    setPracticing(false);
  };

  const start = () => {
    stop();
    setFinished(false);
    setActive(0);
    setPracticing(true);
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.playbackRate = rateRef.current;
      audio.addEventListener('loadedmetadata', () => {
        const per = (audio.duration / CHANT.length) * 1000;
        if (isFinite(per) && per > 300 && per < 5000) stepRef.current = per;
      });
      audioRef.current = audio;
      audio.play().catch(() => { /* browser blocked it — highlights still run */ });
    }
    let i = 0;
    const step = () => {
      i += 1;
      if (i >= CHANT.length) {
        stop();
        setActive(-1);
        setFinished(true);
        return;
      }
      setActive(i);
      timer.current = window.setTimeout(step, stepRef.current / rateRef.current);
    };
    timer.current = window.setTimeout(step, stepRef.current / rateRef.current);
  };

  const pickRate = (r: number) => {
    setRate(r);
    rateRef.current = r;
    if (audioRef.current) {
      try { audioRef.current.playbackRate = r; } catch { /* noop */ }
    }
  };

  useEffect(() => stop, []);

  return (
    <div className="space-y-6">
      {/* Name Chant practice card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-950/50 to-fuchsia-950/30 border border-purple-500/25 text-center space-y-5">
        <p className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-fuchsia-300">
          <Megaphone className="w-4 h-4" /> The Name Chant
        </p>

        <div className="min-h-[64px] flex items-center justify-center">
          {finished ? (
            <span className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-300">
              💜 BORAHAE! 💜
            </span>
          ) : active >= 0 ? (
            <span
              key={active}
              className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-300"
            >
              {CHANT[active]}
            </span>
          ) : (
            <span className="text-xl sm:text-2xl font-black text-slate-300">
              Ready? Shout it with the crowd!
            </span>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {CHANT.map((name, i) => (
            <span
              key={name}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold border transition-all duration-200 ${
                i === active
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent scale-110'
                  : 'bg-white/[0.04] text-slate-300 border-white/10'
              }`}
            >
              {name}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={practicing ? () => { stop(); setActive(-1); } : start}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-sm cursor-pointer shadow-lg shadow-purple-900/40 active:scale-95 transition-transform"
        >
          {practicing ? (
            <>
              <Square className="w-4 h-4" /> Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> {finished ? 'Practice again' : 'Start practice'}
            </>
          )}
        </button>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Speed</span>
          {[
            { label: '0.5× · Slow', v: 0.5 },
            { label: '0.75×', v: 0.75 },
            { label: '1× · Normal', v: 1 }
          ].map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => pickRate(opt.v)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                rate === opt.v
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent'
                  : 'bg-white/[0.04] text-slate-300 border-white/10 hover:border-purple-400/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Leader first, then oldest to youngest — that is the order ARMY chants the names, at the top of our lungs,
          together.
        </p>
        {audioUrl ? (
          <p className="text-xs text-rose-300/90 font-bold">
            🎧 Chant audio is ON — press Start practice and shout along with the clip! Too fast while learning? Slow it down with the Speed buttons above.
          </p>
        ) : (
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Chant audio is coming soon — the clip will be added here, and then Start practice will play it while the
            names light up. Until then, practice with the lights!
          </p>
        )}
      </div>

      {/* How it works cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
          <Ear className="w-5 h-5 text-purple-300" />
          <h3 className="font-black text-white text-sm">When do we chant?</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            During the member introductions, in the break before the encore, and whenever the members call for it —
            listen for the music dropping and the crowd rising.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
          <Megaphone className="w-5 h-5 text-fuchsia-300" />
          <h3 className="font-black text-white text-sm">How fan chants work</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            A fan chant is the part the crowd sings back: names, key lines and answers to the members' calls. You are
            not just watching the show — your voice is part of it.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
          <BookOpenCheck className="w-5 h-5 text-pink-300" />
          <h3 className="font-black text-white text-sm">Song-by-song guides</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            For new title songs, BIGHIT MUSIC posts an official fan chant guide on Weverse — the chant parts are
            written in bold. Learn those before the concert and you will never feel lost.
          </p>
        </div>
      </div>
    </div>
  );
}
