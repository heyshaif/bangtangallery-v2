import { useEffect, useState } from 'react';

// Batch 89 — Days With BTS counter. BTS debuted on June 13, 2013;
// this strip shows how long ARMY has been with BTS — total days
// plus a live-ticking hh:mm:ss. Per the owner's placement rule it
// sits on Home just before the Supporters Wall & Community
// section, slim and fully TRANSPARENT (no card, no background),
// so it blends into the page instead of looking like a block.
const DEBUT = new Date(2013, 5, 13).getTime();

function parts(now: number) {
  const diff = Math.max(0, now - DEBUT);
  return {
    days: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000)
  };
}

export default function DaysWithBTS() {
  const [t, setT] = useState(() => parts(Date.now()));
  useEffect(() => {
    const iv = setInterval(() => setT(parts(Date.now())), 1000);
    return () => clearInterval(iv);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="w-full text-center select-none" aria-label="How long ARMY has been with BTS">
      <p className="text-sm sm:text-base">
        <span className="opacity-75">💜 ARMY has been with BTS for </span>
        <span className="font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 drop-shadow-[0_0_12px_rgba(217,70,239,0.45)]">
          {t.days.toLocaleString('en-US')} days · {pad(t.h)}:{pad(t.m)}:{pad(t.s)}
        </span>
      </p>
    </div>
  );
}
