/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Batch 160 — Awards tab: the BTS trophy cabinet, grouped by
// ceremony and year. Data comes from the published config (`awards`
// key, editable in the Admin Panel); when the config has no list yet,
// the verified seed in src/data/discography.ts is shown instead.
// Wins and nominations are NEVER mixed: a 'Nominated' entry (the
// Grammy entries — BTS have 0 Grammy wins) always shows a Nominee
// badge and is never counted in the win totals.
import { useState } from 'react';
import { AwardEntry } from '../types';
import { AWARD_ENTRIES, AWARD_STATS } from '../data/discography';
import { Trophy, Medal, Search } from 'lucide-react';

// Filter chips in a fixed showcase order (only shows that have
// entries in the current list are shown).
const SHOW_ORDER = [
  'MAMA Awards',
  'Melon Music Awards',
  'Billboard Music Awards',
  'American Music Awards',
  'MTV Video Music Awards',
  'Golden Disc Awards',
  'IFPI',
  'Grammy Awards',
];

export default function AwardsSection({ items }: { items?: AwardEntry[] }) {
  const displayItems = (items && items.length > 0) ? items : AWARD_ENTRIES;
  const [activeShow, setActiveShow] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter chips: the known shows first (showcase order), then any
  // show the owner added in the Admin Panel (so new shows show up too).
  const showsInData = Array.from(new Set(displayItems.map(i => i.show).filter(Boolean)));
  const shows = ['All', ...SHOW_ORDER.filter(s => showsInData.includes(s)), ...showsInData.filter(s => !SHOW_ORDER.includes(s))];

  const filtered = displayItems
    .filter(entry => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        entry.category.toLowerCase().includes(q) ||
        (entry.work || '').toLowerCase().includes(q) ||
        entry.show.toLowerCase().includes(q) ||
        String(entry.year).includes(searchTerm);
      if (activeShow === 'All') return matchesSearch;
      return entry.show === activeShow && matchesSearch;
    })
    .slice()
    .sort((a, b) => (b.year - a.year) || a.show.localeCompare(b.show));

  const winCount = filtered.filter(e => e.result === 'Won').length;
  const nomCount = filtered.filter(e => e.result === 'Nominated').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and search bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-sans font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" /> Awards Shelf
          </h2>
          <p className="text-gray-400 text-sm">
            The BTS trophy cabinet — {winCount} wins{nomCount > 0 ? ` and ${nomCount} nomination${nomCount === 1 ? '' : 's'}` : ''} in this view.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 font-mono">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search awards, shows or songs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 text-xs pl-10 pr-4 py-2 rounded-lg border border-purple-500/20 focus:border-purple-500/50 text-white outline-none placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {AWARD_STATS.map(stat => (
          <div key={stat.label} className="p-4 rounded-xl border border-amber-500/15 bg-gradient-to-br from-amber-500/10 to-purple-600/10 text-center">
            <p className="text-2xl md:text-3xl font-black text-amber-300">{stat.value}</p>
            <p className="text-xs font-bold text-white mt-0.5">{stat.label}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Show filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-transparent">
        {shows.map(show => (
          <button
            key={show}
            onClick={() => setActiveShow(show)}
            className={`text-xs font-mono px-3.5 py-2 rounded-full border transition-all shrink-0 cursor-pointer ${
              activeShow === show
                ? 'bg-amber-500 border-amber-400 text-black font-bold shadow-md shadow-amber-500/20'
                : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            {show === 'All' ? 'All Shows' : show}
          </button>
        ))}
      </div>

      {/* Trophy grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed border-white/5 bg-white/[0.01]">
          <p className="text-gray-400 font-mono text-xs">No awards found matching your query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((entry) => {
            const isWin = entry.result === 'Won';
            return (
              <article
                key={entry.id || `${entry.show}-${entry.category}-${entry.year}`}
                className={`p-4 rounded-xl border backdrop-blur-md shadow-lg hover:-translate-y-0.5 transition-all ${
                  isWin
                    ? 'border-amber-500/15 bg-amber-500/[0.04] hover:border-amber-500/30'
                    : 'border-white/5 bg-black/50 hover:border-purple-500/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                    isWin
                      ? 'text-amber-300 bg-amber-950/40 border-amber-500/20'
                      : 'text-gray-300 bg-white/[0.03] border-white/10'
                  }`}>
                    {isWin ? <Trophy className="w-3.5 h-3.5" /> : <Medal className="w-3.5 h-3.5" />}
                    {entry.year}
                  </span>
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-1 rounded-full border ${
                    isWin
                      ? 'text-amber-300 border-amber-500/25 bg-amber-500/10'
                      : 'text-purple-300 border-purple-500/25 bg-purple-500/10'
                  }`}>
                    {isWin ? 'Winner' : 'Nominee'}
                  </span>
                </div>
                <h3 className="font-sans font-bold text-base text-white mt-3 leading-snug">
                  {entry.category}
                </h3>
                <p className="text-xs font-mono text-purple-300 mt-1">{entry.show}</p>
                {entry.work && (
                  <p className="text-sm text-gray-300 mt-2">“{entry.work}”</p>
                )}
                {entry.note && (
                  <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">{entry.note}</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
