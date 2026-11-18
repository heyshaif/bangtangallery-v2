import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getBirthdayInfo, ordinal } from '../utils/birthdays';

// Batch 74 — birthday-day wish. When a visitor opens the site on a
// member's birthday, this foam-3D wish appears FIRST (above every
// other popup), stays about 5 seconds, then closes by itself. It
// shows at most once per visitor per birthday (localStorage stamp),
// so it never nags on every page change.
const SEEN_KEY = 'bts_birthday_wish_seen';

const CONFETTI = [
  { left: '8%', delay: '0s', color: '#e879f9' },
  { left: '18%', delay: '0.5s', color: '#a855f7' },
  { left: '30%', delay: '0.2s', color: '#f472b6' },
  { left: '42%', delay: '0.8s', color: '#facc15' },
  { left: '55%', delay: '0.35s', color: '#e879f9' },
  { left: '66%', delay: '0.65s', color: '#a855f7' },
  { left: '78%', delay: '0.1s', color: '#f472b6' },
  { left: '90%', delay: '0.45s', color: '#facc15' }
];

export default function BirthdayWish() {
  const info = getBirthdayInfo();
  const [visible, setVisible] = useState(false);

  const stamp = info
    ? `${info.member.id}:${info.date.getFullYear()}-${info.date.getMonth() + 1}-${info.date.getDate()}`
    : '';

  useEffect(() => {
    if (!info || !info.isToday) return;
    let seen = '';
    try {
      seen = localStorage.getItem(SEEN_KEY) || '';
    } catch {
      /* storage blocked — still show once for this mount */
    }
    if (seen === stamp) return;
    setVisible(true);
    const t = setTimeout(() => dismiss(), 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(SEEN_KEY, stamp);
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  if (!visible || !info) return null;
  const { member, turningAge } = info;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md rounded-3xl border border-purple-500/30 bg-gradient-to-b from-[#1b0533] via-[#12041f] to-[#0a0114] px-6 py-8 text-center shadow-[0_0_80px_rgba(168,85,247,0.45)] overflow-hidden bday-pop">
        {/* falling confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className="bday-confetti"
              style={{ left: c.left, backgroundColor: c.color, animationDelay: c.delay }}
            />
          ))}
        </div>

        <button
          onClick={dismiss}
          aria-label="Close birthday wish"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative space-y-3">
          <div className="flex items-end justify-center gap-3">
            <span className="text-3xl bday-float" style={{ animationDelay: '0.3s' }}>🎈</span>
            <span className="text-6xl sm:text-7xl bday-bounce inline-block">🎂</span>
            <span className="text-3xl bday-float">🎈</span>
          </div>

          <p className="font-foam text-lg sm:text-xl tracking-wide foam-text-soft">
            ✦ HAPPY {ordinal(turningAge).toUpperCase()} BIRTHDAY ✦
          </p>

          <h2 className="font-foam foam-text text-6xl sm:text-7xl leading-none uppercase">
            {member.name}
          </h2>

          <p className="text-sm text-purple-200">
            {member.emoji} With love from all of ARMY 💜 {member.emoji}
          </p>
        </div>
      </div>
    </div>
  );
}
