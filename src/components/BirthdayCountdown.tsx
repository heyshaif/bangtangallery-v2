import React, { useState, useEffect } from 'react';
import { getBirthdayInfo, ordinal } from '../utils/birthdays';

// Batch 74 — the owner's "chotto notice": a one-line birthday countdown
// in the empty space under the Home members showcase. Ticks down to the
// next member's birthday; on the day itself it turns into a greeting.
export default function BirthdayCountdown() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const info = getBirthdayInfo(now);
  if (!info) return null;
  const { member, date, turningAge, isToday } = info;

  if (isToday) {
    return (
      <div className="w-full text-center rounded-2xl border border-pink-500/30 bg-gradient-to-r from-purple-950/60 via-pink-950/40 to-purple-950/60 px-3 py-2">
        <p className="text-[11px] sm:text-xs font-bold text-pink-300">
          🎉🎂 Today is {member.name}'s {ordinal(turningAge)} Birthday! {member.emoji} Happy Birthday, {member.name}! 💜
        </p>
      </div>
    );
  }

  const diff = Math.max(0, date.getTime() - now.getTime());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="w-full text-center rounded-2xl border border-white/5 bg-black/45 backdrop-blur-md px-3 py-2">
      <p className="text-[11px] sm:text-xs text-gray-300 font-sans">
        🎂 Next Birthday: <span className="font-bold text-white">{member.emoji} {member.name}</span>
        <span className="text-gray-400"> turns {turningAge} in </span>
        <span className="font-mono font-bold text-purple-300">
          {d > 0 ? `${d}d ` : ''}{pad(h)}h : {pad(m)}m : {pad(s)}s
        </span>
      </p>
    </div>
  );
}
