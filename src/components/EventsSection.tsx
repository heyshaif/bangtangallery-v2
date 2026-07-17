/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { BTSEvent } from '../types';
import { EVENTS } from '../data/btsData';
import AdsterraAd from './AdsterraAd';
import { Calendar, MapPin, Clock, Search, Sparkles, ChevronRight, MessageCircle } from 'lucide-react';

export default function EventsSection({ items }: { items?: BTSEvent[] }) {
  const displayEvents = (items && items.length > 0) ? items : EVENTS;
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past'>('Upcoming');
  const [countdowns, setCountdowns] = useState<{ [key: string]: string }>({});

  // Tab filtering
  const filteredEvents = displayEvents.filter(evt => evt.type === activeTab);

  // Countdown clock calculations for upcoming events
  useEffect(() => {
    const updateClocks = () => {
      const newClocks: { [key: string]: string } = {};
      displayEvents.forEach(evt => {
        const targetStr = evt.countdownTarget || (evt as any).dDayTarget;
        if (evt.type === 'Upcoming' && targetStr) {
          const target = new Date(targetStr).getTime();
          const now = new Date().getTime();
          const difference = target - now;

          if (difference <= 0) {
            newClocks[evt.id] = "HAPPENING/CONCLUDED";
          } else {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((difference % (1000 * 60)) / 1000);
            newClocks[evt.id] = `${days}d ${hours}h ${mins}m ${secs}s`;
          }
        }
      });
      setCountdowns(newClocks);
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, [displayEvents]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-sans font-extrabold text-white">
            ARMY Event Coordinates
          </h2>
          <p className="text-gray-400 text-sm font-sans">
            Track official calendars of concert assemblies, theater releases, and fan meetings.
          </p>
        </div>

        {/* past vs upcoming tab toggles */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5 shrink-0">
          <button
            onClick={() => setActiveTab('Upcoming')}
            className={`text-xs font-mono font-bold px-4 py-2 rounded-md transition-all cursor-pointer ${
              activeTab === 'Upcoming'
                ? 'bg-purple-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setActiveTab('Past')}
            className={`text-xs font-mono font-bold px-4 py-2 rounded-md transition-all cursor-pointer ${
              activeTab === 'Past'
                ? 'bg-purple-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Past Milestones
          </button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed border-white/5 bg-white/[0.01]">
          <p className="text-gray-400 font-mono text-sm">No schedules listed in this category currently.</p>
        </div>
      ) : (
        /* Events cards grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map(evt => (
            <div
              key={evt.id}
              className="p-6 rounded-2xl border border-white/5 bg-black/50 backdrop-blur-md hover:border-purple-500/20 transition-all flex flex-col justify-between h-full relative group shadow-md"
            >
              {/* Abs decoration light */}
              <div className="absolute right-4 top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Calendar className="w-16 h-16 text-purple-400" />
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 border border-purple-400/30 bg-purple-950/40 text-purple-300 rounded uppercase">
                      {evt.type}
                    </span>
                    {evt.type === 'Upcoming' && countdowns[evt.id] && (
                      <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/20 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">
                        ⌛ {countdowns[evt.id]}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" /> {evt.date}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-lg text-white group-hover:text-purple-300 transition-colors leading-snug">
                    {evt.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-purple-300 font-mono">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="line-clamp-1">{evt.location}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed font-sans mt-2">
                  {evt.details || (evt as any).description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-purple-400 font-semibold font-mono">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Time: {evt.time}</span>
                <span className="flex items-center gap-1 group-hover:underline cursor-pointer">Explore coordinates <ChevronRight className="w-3.5 h-3.5" /></span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdsterraAd type={3} />
    </div>
  );
}
