/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState } from 'react';
import { TimelineEvent } from '../types';
import { TIMELINE_EVENTS } from '../data/btsData';
import { getTimelinePhoto } from '../data/timelinePhotos';
import { Search, Flame, Music, Globe, HelpCircle, Trophy, BookOpen, Clock, Calendar, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

export default function TimelineSection({ items }: { items?: TimelineEvent[] }) {
  const displayEvents = (items && items.length > 0) ? items : TIMELINE_EVENTS;
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  // Batch 187 — the year whose full details are open (null = the list).
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const openYear = (evt: TimelineEvent) => {
    setSelected(evt);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Categories list
  const categoriesList = ['All', 'Debut', 'Albums', 'Awards', 'Tours', 'Military', 'Solo Era', 'Comebacks'];

  // Search filter implementation
  const filteredEvents = displayEvents.filter(evt => {
    const matchesSearch = evt.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      evt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.year.includes(searchTerm);
    
    if (activeCategory === 'All') return matchesSearch;
    return evt.category === activeCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Debut': return <Flame className="w-5 h-5 text-red-400" />;
      case 'Albums': return <Music className="w-5 h-5 text-purple-400" />;
      case 'Awards': return <Trophy className="w-5 h-5 text-amber-400" />;
      case 'Tours': return <Globe className="w-5 h-5 text-emerald-400" />;
      case 'Military': return <Clock className="w-5 h-5 text-gray-400" />;
      case 'Solo Era': return <BookOpen className="w-5 h-5 text-rose-400" />;
      default: return <Clock className="w-5 h-5 text-purple-400" />;
    }
  };

  // Batch 187 — prev/next year walk the full chronological list.
  const selectedIndex = selected ? displayEvents.findIndex(e => e.year === selected.year && e.date === selected.date) : -1;
  const prevEvent = selectedIndex > 0 ? displayEvents[selectedIndex - 1] : null;
  const nextEvent = selectedIndex >= 0 && selectedIndex < displayEvents.length - 1 ? displayEvents[selectedIndex + 1] : null;
  const selectedPhoto = selected ? getTimelinePhoto(selected) : undefined;

  return (
    <div ref={topRef} className="space-y-8 animate-fade-in scroll-mt-28">
      {/* Header and search bar context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-sans font-extrabold text-white">
            13 Winters & Springs: BTS History
          </h2>
          <p className="text-gray-400 text-sm">
            Interactive chronological history tracking our bulletproof journey from 2013 debut to 2026.
          </p>
        </div>

        {!selected && (
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 font-mono">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search matching years or records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 text-xs pl-10 pr-4 py-2 rounded-lg border border-purple-500/20 focus:border-purple-500/50 text-white outline-none placeholder:text-gray-500"
            />
          </div>
        )}
      </div>

      {/* Batch 187 — year detail view: clicking an entry opens that year's full details separately */}
      {selected ? (
        <div className="rounded-2xl border border-white/5 bg-black/50 backdrop-blur-md shadow-lg overflow-hidden animate-fade-in">
          <div className="p-6 md:p-10">
            <button
              onClick={() => setSelected(null)}
              className="inline-flex items-center gap-2 text-sm font-bold text-purple-300 hover:text-purple-200 cursor-pointer mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Timeline
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {selectedPhoto && (
                <div>
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <img
                      src={selectedPhoto.photo}
                      alt={`${selected.year} — ${selected.title}`}
                      className="w-full aspect-[16/10] object-cover"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 font-mono mt-3">Photo: {selectedPhoto.credit}</p>
                  {selectedPhoto.note && (
                    <p className="text-xs text-gray-400 leading-relaxed mt-2 border-l-2 border-purple-500/40 pl-3">
                      {selectedPhoto.note}
                    </p>
                  )}
                </div>
              )}
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-purple-300 bg-purple-950/40 px-2.5 py-1 rounded border border-purple-500/15 mb-4">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  {selected.year} &bull; {selected.category}
                </div>
                <h3 className="font-sans font-bold text-2xl md:text-3xl text-white leading-tight">
                  {selected.title}
                </h3>
                <p className="text-sm text-gray-400 mt-3">{selected.date}</p>
                <p className="text-sm md:text-base text-gray-300 leading-relaxed mt-5">
                  {selected.description}
                </p>
                <div className="flex gap-3 mt-8">
                  {prevEvent ? (
                    <button
                      onClick={() => openYear(prevEvent)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-sm font-bold text-gray-300 cursor-pointer transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" /> {prevEvent.year}
                    </button>
                  ) : (
                    <span className="px-4 py-2.5 rounded-lg border border-white/5 text-sm font-bold text-gray-600 cursor-default">
                      The beginning
                    </span>
                  )}
                  {nextEvent ? (
                    <button
                      onClick={() => openYear(nextEvent)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-sm font-bold text-gray-300 cursor-pointer transition-all"
                    >
                      {nextEvent.year} <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="px-4 py-2.5 rounded-lg border border-white/5 text-sm font-bold text-gray-600 cursor-default">
                      The latest chapter
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Filter Horizontal Line */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-transparent">
            {categoriesList.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs font-mono px-3.5 py-2 rounded-full border transition-all shrink-0 cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/20'
                    : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Main Timeline graphical representation */}
          {filteredEvents.length === 0 ? (
            <div className="text-center py-20 rounded-xl border border-dashed border-white/5 bg-white/[0.01]">
              <p className="text-gray-400 font-mono text-xs">No records found matching your query.</p>
            </div>
          ) : (
            <div className="relative border-l border-purple-500/20 pl-6 md:pl-10 ml-4 md:ml-10 space-y-12 max-w-6xl mx-auto py-4">
              {filteredEvents.map((evt, idx) => {
                const photo = getTimelinePhoto(evt);
                return (
                  <div
                    key={idx}
                    className="relative group transition-all duration-300 hover:-translate-x-1"
                  >
                    {/* Graphic Point/Bullet */}
                    <div className="absolute -left-[30px] md:-left-[46px] top-1.5 w-7 h-7 rounded-full border-2 border-purple-500/40 bg-black flex items-center justify-center shadow-lg group-hover:border-purple-400 transition-colors z-10 shadow-purple-500/10">
                      {getCategoryIcon(evt.category)}
                    </div>

                    {/* Time Indicator Bubble */}
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-purple-300 bg-purple-950/40 px-2.5 py-1 rounded border border-purple-500/15 mb-3">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      {evt.year} &bull; {evt.date}
                    </div>

                    {/* Content Panel Box — Batch 187: the whole card is clickable and the year's photo fills the right side */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => openYear(evt)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openYear(evt); } }}
                      className="rounded-xl border border-white/5 bg-black/50 backdrop-blur-md shadow-lg group-hover:border-purple-500/30 transition-all cursor-pointer overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                    >
                      <div className="flex flex-col md:flex-row">
                        <div className="p-6 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5 mb-3">
                            <h3 className="font-sans font-bold text-lg text-white group-hover:text-purple-300 transition-colors">
                              {evt.title}
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 border border-purple-500/20 bg-purple-950/20 text-purple-300 rounded uppercase">
                              {evt.category}
                            </span>
                          </div>

                          <p className="text-sm text-gray-300 leading-relaxed">
                            {evt.description}
                          </p>
                          <p className="text-xs font-bold text-purple-300 mt-4">
                            Click for full details →
                          </p>
                        </div>
                        {photo && (
                          <div className="md:w-[42%] shrink-0">
                            <img
                              src={photo.photo}
                              alt={`${evt.year} — ${evt.title}`}
                              loading="lazy"
                              className="w-full h-48 md:h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
