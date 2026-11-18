/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Batch 160 — Discography tab: every BTS Korean release, era-wise.
// Data comes from the published config (`discography` key, editable
// in the Admin Panel); when the config has no list yet, the verified
// seed in src/data/discography.ts is shown instead. Album cards are
// typographic art (title typography + era colours) — no images,
// never AI-generated or fake covers.
import { useState } from 'react';
import { DiscographyEntry } from '../types';
import { DISCOGRAPHY_ENTRIES, DISCOGRAPHY_ERAS } from '../data/discography';
import { Search, Calendar, Disc3, Music2 } from 'lucide-react';

const ERA_GRADIENTS: Record<string, string> = {
  'School Trilogy': 'from-red-600/90 via-rose-600/70 to-orange-500/50',
  'HYYH': 'from-sky-600/90 via-cyan-500/70 to-blue-500/50',
  'WINGS': 'from-violet-600/90 via-purple-600/70 to-indigo-500/50',
  'Love Yourself': 'from-pink-600/90 via-rose-500/70 to-fuchsia-500/50',
  'Map of the Soul': 'from-indigo-600/90 via-violet-600/70 to-purple-500/50',
  'BE & Proof': 'from-amber-600/90 via-orange-500/70 to-yellow-500/50',
  'ARIRANG': 'from-rose-700/90 via-red-600/70 to-pink-600/50',
  'Singles': 'from-emerald-600/90 via-teal-500/70 to-green-500/50',
};

function formatReleaseDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DiscographySection({ items }: { items?: DiscographyEntry[] }) {
  const displayItems = (items && items.length > 0) ? items : DISCOGRAPHY_ENTRIES;
  const [activeEra, setActiveEra] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter chips: the known eras first (story order), then any era
  // the owner added in the Admin Panel (so new eras show up too).
  const erasInData = Array.from(new Set(displayItems.map(i => i.era).filter(Boolean)));
  const eras = ['All', ...DISCOGRAPHY_ERAS.filter(e => erasInData.includes(e)), ...erasInData.filter(e => !DISCOGRAPHY_ERAS.includes(e))];

  const filtered = displayItems
    .filter(entry => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        entry.title.toLowerCase().includes(q) ||
        (entry.titleTrack || '').toLowerCase().includes(q) ||
        (entry.type || '').toLowerCase().includes(q) ||
        (entry.releaseDate || '').includes(searchTerm);
      if (activeEra === 'All') return matchesSearch;
      return entry.era === activeEra && matchesSearch;
    })
    .slice()
    .sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and search bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-sans font-extrabold text-white flex items-center gap-2">
            <Disc3 className="w-6 h-6 text-purple-400" /> Discography
          </h2>
          <p className="text-gray-400 text-sm">
            Every BTS Korean release from the 2013 debut to ARIRANG — {displayItems.length} releases, 2013–2026 and counting.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 font-mono">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search albums, singles or title tracks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 text-xs pl-10 pr-4 py-2 rounded-lg border border-purple-500/20 focus:border-purple-500/50 text-white outline-none placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Era filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-transparent">
        {eras.map(era => (
          <button
            key={era}
            onClick={() => setActiveEra(era)}
            className={`text-xs font-mono px-3.5 py-2 rounded-full border transition-all shrink-0 cursor-pointer ${
              activeEra === era
                ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            {era === 'All' ? 'All Eras' : era}
          </button>
        ))}
      </div>

      {/* Album cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed border-white/5 bg-white/[0.01]">
          <p className="text-gray-400 font-mono text-xs">No releases found matching your query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((entry) => {
            const year = (entry.releaseDate || '').slice(0, 4);
            const gradient = ERA_GRADIENTS[entry.era] || 'from-purple-600/90 via-fuchsia-600/70 to-pink-500/50';
            return (
              <article
                key={entry.id || entry.title}
                className="rounded-xl overflow-hidden border border-white/5 bg-black/50 backdrop-blur-md shadow-lg hover:border-purple-500/30 hover:-translate-y-0.5 transition-all group"
              >
                {/* Typographic cover art: title type + era colour, no image */}
                <div className={`relative p-5 bg-gradient-to-br ${gradient} overflow-hidden min-h-[132px] flex flex-col justify-end`}>
                  <span className="absolute -right-1 -top-5 text-7xl font-black text-white/15 select-none pointer-events-none">
                    {year}
                  </span>
                  <span className="relative self-start text-[10px] font-mono font-bold uppercase tracking-widest text-white bg-black/30 border border-white/20 px-2 py-0.5 rounded-full mb-2.5">
                    {entry.type}
                  </span>
                  <p className="relative text-white font-sans font-black text-xl leading-tight">
                    {entry.title}
                  </p>
                  {entry.titleTrack && (
                    <p className="relative text-white/85 text-xs mt-1.5 flex items-center gap-1.5">
                      <Music2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Title track: {entry.titleTrack}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-400">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    {formatReleaseDate(entry.releaseDate)}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 border border-purple-500/20 bg-purple-950/20 text-purple-300 rounded uppercase shrink-0">
                    {entry.era}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
