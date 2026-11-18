/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Batch 160 — FESTA 2027 tab: the hub for BTS's 14th anniversary.
// Countdown to June 13, 2027 00:00 KST (the same moment the ARMY
// Time Capsule opens), a link to the Time Capsule on the Events page
// (the capsule form itself is NOT duplicated here), and FESTA events
// from the existing config events list. No 2027 schedule, venue or
// programme is invented — until the owner adds FESTA 2027 events in
// the Admin Panel, the tab says so honestly.
import { useEffect, useState } from 'react';
import { BTSEvent } from '../types';
import { PartyPopper, Calendar, MapPin, Clock, Mail, ChevronRight, Sparkles } from 'lucide-react';

const FESTA_2027_TARGET = new Date('2027-06-13T00:00:00+09:00').getTime();

function getTimeLeft(now: number) {
  const diff = Math.max(0, FESTA_2027_TARGET - now);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    arrived: now >= FESTA_2027_TARGET,
  };
}

export default function Festa2027Section({ events, onOpenTimeCapsule }: { events?: BTSEvent[]; onOpenTimeCapsule?: () => void }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = getTimeLeft(now);

  // FESTA events come from the owner's own events list (Admin Panel
  // → Festa Events); nothing is invented here.
  const festaEvents = (Array.isArray(events) ? events : []).filter((evt: any) => {
    const hay = `${evt?.title || ''} ${evt?.details || ''} ${(evt as any)?.description || ''}`.toLowerCase();
    return hay.includes('festa');
  });

  const units = [
    { label: 'Days', value: left.days },
    { label: 'Hours', value: left.hours },
    { label: 'Minutes', value: left.minutes },
    { label: 'Seconds', value: left.seconds },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h2 className="text-xl md:text-2xl font-sans font-extrabold text-white flex items-center gap-2">
          <PartyPopper className="w-6 h-6 text-rose-400" /> FESTA 2027
        </h2>
        <p className="text-gray-400 text-sm">
          BTS turns 14 on June 13, 2027 — the countdown to the next FESTA is on.
        </p>
      </div>

      {/* Countdown hero */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/60 via-[#160818] to-rose-950/40 p-6 md:p-10 text-center shadow-2xl">
        <div className="absolute -top-10 -right-10 text-[140px] leading-none text-white/[0.04] font-black select-none pointer-events-none">14</div>
        <p className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-purple-300 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" /> 14th Anniversary · June 13, 2027
        </p>
        {left.arrived ? (
          <p className="text-2xl md:text-3xl font-black text-white mt-4">
            FESTA 2027 is here — happy anniversary, ARMY! 💜
          </p>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-xl mx-auto mt-6">
              {units.map(unit => (
                <div key={unit.label} className="rounded-xl border border-white/10 bg-black/50 backdrop-blur-md px-2 py-4 md:py-5">
                  <p className="text-2xl md:text-4xl font-black text-white tabular-nums">
                    {String(unit.value).padStart(2, '0')}
                  </p>
                  <p className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-purple-300 mt-1">
                    {unit.label}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 font-mono mt-4">
              Until June 13, 2027 · 00:00 KST — the day BTS debuted in 2013.
            </p>
          </>
        )}
      </div>

      {/* What is FESTA + Time Capsule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-white/5 bg-black/50 backdrop-blur-md">
          <h3 className="font-sans font-bold text-lg text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" /> What is FESTA?
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed mt-2">
            FESTA is BTS&apos;s debut-anniversary celebration, held every year around
            June 13 — the day BTS debuted in 2013. Each FESTA brings special
            songs, photos, videos and events for ARMY around the world.
          </p>
          <p className="text-sm text-gray-300 leading-relaxed mt-2">
            FESTA 2027 marks 14 years of BTS. When the 2027 programme is
            announced, the owner will add it here — nothing is listed until
            it is real.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-950/30 to-purple-950/20">
          <h3 className="font-sans font-bold text-lg text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-rose-400" /> ARMY Time Capsule
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed mt-2">
            Letters from ARMY, sealed until FESTA — June 13, 2027, 00:00 KST.
            Write yours on the Events page before the capsule opens.
          </p>
          <button
            onClick={onOpenTimeCapsule}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-purple-900/40 hover:opacity-90 cursor-pointer"
          >
            Open the Time Capsule <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FESTA events from the config */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" /> FESTA Events
        </h3>
        {festaEvents.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-white/5 bg-white/[0.01]">
            <p className="text-gray-400 text-sm">No FESTA 2027 events announced yet.</p>
            <p className="text-gray-500 font-mono text-xs mt-1">
              Events added in the Admin Panel (Festa Events) will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {festaEvents.map((evt: any) => (
              <div key={evt.id} className="p-5 rounded-xl border border-white/5 bg-black/50 backdrop-blur-md hover:border-purple-500/20 transition-all">
                <p className="font-sans font-bold text-white">{evt.title}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400 font-mono">
                  {evt.date && (
                    <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-purple-400" />{evt.date}</span>
                  )}
                  {evt.time && (
                    <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-purple-400" />{evt.time}</span>
                  )}
                  {evt.location && (
                    <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-purple-400" />{evt.location}</span>
                  )}
                </div>
                {(evt.details || evt.description) && (
                  <p className="text-xs text-gray-400 leading-relaxed mt-2">{evt.details || evt.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
