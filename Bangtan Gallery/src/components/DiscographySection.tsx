/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Batch 160 — Discography tab: every BTS Korean release, era-wise.
// Data comes from the published config (`discography` key, editable
// in the Admin Panel); when the config has no list yet, the verified
// seed in src/data/discography.ts is shown instead.
// Batch 164 — cards redesigned as CD jewel cases (owner's reference:
// a vinyl disc in a clear case with stickers): every card shows the
// same case — hinged spine with the title running down it, an
// era-coloured vinyl disc with groove rings + a white centre label
// (year + BTS), a type sticker and a heart sticker. The disc spins
// while its card is hovered (see the .jewel-case rule in index.css).
// All art is pure CSS — no images, never AI-generated or fake covers.
// Light-theme note: the case interior is bg-black/60 (the blanket
// rule turns it white in light mode, like a clear case on a white
// shelf); the spine is bg-black/70 + text-white/70, neither of which
// the blanket rules flip, so it stays dark and readable in both
// themes. Text below the case uses text-white / text-gray-400, which
// the blanket rules flip to dark in light mode.
// Batch 167 — mobile shows 2 cards per row (was 1): the grid is
// grid-cols-2 from mobile up, and the card's text, sticker, heart
// and label scale down on small screens (sm: restores full size).
// Two small-screen fits: the spine title is hidden below sm (a
// long vertical title cannot fit a ~170px case — the ridged spine
// strip stays), and the footer wraps, so a long era name drops
// under the date instead of overflowing the card.
// Batch 169 — the whole card is a link to the album on Spotify
// (owner's choice, 2026-11-19): on hover the disc spins and a green
// "Listen on Spotify" pill fades in over the case; a small green
// Spotify badge in the footer marks the link on every card, so
// mobile visitors (no hover) can see it is tappable too. Cards
// without a spotifyUrl (admin-added releases) stay plain cards.
// Batch 171 — the disc's colour now matches the album's OWN cover
// (owner, 2026-11-19: "album pic jemon background o same color" —
// Take Two's cover is blue, so its disc is blue, not the Singles
// era green). Each entry carries discColor (a hex base); the light
// and dark shades are derived from it. Entries without a colour
// (admin-added releases) fall back to the era colour.
import { useState } from 'react';
import { DiscographyEntry } from '../types';
import { DISCOGRAPHY_ENTRIES, DISCOGRAPHY_ERAS } from '../data/discography';
import { Search, Calendar, Disc3, Music2, Heart, Play } from 'lucide-react';

// Era colours for the vinyl disc (base / highlight / shadow). The
// disc is drawn with inline gradients, so the light-theme blanket
// rules never touch it.
const ERA_DISC_COLORS: Record<string, { base: string; light: string; dark: string }> = {
  'School Trilogy': { base: '#dc2626', light: '#f87171', dark: '#7f1d1d' },
  'HYYH': { base: '#0284c7', light: '#38bdf8', dark: '#0c4a6e' },
  'WINGS': { base: '#7c3aed', light: '#a78bfa', dark: '#4c1d95' },
  'Love Yourself': { base: '#db2777', light: '#f472b6', dark: '#831843' },
  'Map of the Soul': { base: '#4f46e5', light: '#818cf8', dark: '#312e81' },
  'BE & Proof': { base: '#d97706', light: '#fbbf24', dark: '#78350f' },
  'ARIRANG': { base: '#be123c', light: '#fb7185', dark: '#881337' },
  'Singles': { base: '#059669', light: '#34d399', dark: '#064e3b' },
};
const DEFAULT_DISC = { base: '#9333ea', light: '#c084fc', dark: '#581c87' };

// Batch 171 — derive a disc's light/dark shades from one base
// colour (the album's own cover colour): light = 45% toward white,
// dark = 50% toward black. Same gradient recipe the era colours
// use, so a per-album disc looks identical in style.
function discShades(base: string): { base: string; light: string; dark: string } {
  const h = base.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return DEFAULT_DISC;
  const ch = (shift: number) => (num >> shift) & 255;
  const toHex = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const r = ch(16), g = ch(8), b = ch(0);
  return {
    base,
    light: toHex(r + (255 - r) * 0.45, g + (255 - g) * 0.45, b + (255 - b) * 0.45),
    dark: toHex(r * 0.5, g * 0.5, b * 0.5),
  };
}

// Short label for the type sticker on the case.
const TYPE_STICKER: Record<string, string> = {
  'Studio Album': 'ALBUM',
  'Mini Album': 'MINI ALBUM',
  'Single Album': 'SINGLE',
  'Digital Single': 'SINGLE',
  'Special Album': 'SPECIAL',
  'Repackage': 'REPACKAGE',
  'Compilation Album': 'COMPILATION',
  'Anthology Album': 'ANTHOLOGY',
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

      {/* Album cards — jewel cases */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed border-white/5 bg-white/[0.01]">
          <p className="text-gray-400 font-mono text-xs">No releases found matching your query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((entry) => {
            const year = (entry.releaseDate || '').slice(0, 4);
            // Batch 171 — the disc matches the album's own cover
            // colour when one is set; otherwise the era colour.
            const disc = entry.discColor
              ? discShades(entry.discColor)
              : (ERA_DISC_COLORS[entry.era] || DEFAULT_DISC);
            // Batch 169 — a card with a Spotify URL is a link to
            // that album; without one it stays a plain card.
            const CardTag: any = entry.spotifyUrl ? 'a' : 'article';
            return (
              <CardTag
                key={entry.id || entry.title}
                {...(entry.spotifyUrl
                  ? { href: entry.spotifyUrl, target: '_blank', rel: 'noreferrer', 'aria-label': `Listen to ${entry.title} on Spotify` }
                  : {})}
                className="jewel-case group rounded-xl overflow-hidden border border-white/5 bg-black/50 backdrop-blur-md shadow-lg hover:border-purple-500/30 hover:-translate-y-1 transition-all"
              >
                {/* The jewel case: square, clear-plastic look */}
                <div className="relative aspect-square bg-black/60 border-b border-white/10 overflow-hidden">
                  {/* Spine — the hinged edge, title running down it */}
                  <div
                    className="absolute inset-y-0 left-0 w-[22px] bg-black/70 flex items-center justify-center overflow-hidden"
                    style={{ backgroundImage: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.09) 0 2px, transparent 2px 6px)' }}
                  >
                    <span
                      className="text-[9px] font-mono tracking-[0.12em] text-white/70 whitespace-nowrap hidden sm:block"
                      style={{ writingMode: 'vertical-rl' }}
                    >
                      {entry.title}
                    </span>
                  </div>

                  {/* Vinyl disc */}
                  <div className="absolute inset-y-0 right-0 left-[22px] flex items-center justify-center">
                    <div
                      className="jewel-disc relative w-[74%] aspect-square rounded-full"
                      style={{
                        background: `radial-gradient(circle at 32% 30%, ${disc.light} 0%, ${disc.base} 42%, ${disc.dark} 74%, #0a0a12 100%)`,
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.10), 0 14px 34px rgba(0,0,0,0.55)',
                      }}
                    >
                      {/* Groove rings */}
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{ background: 'repeating-radial-gradient(circle at center, rgba(255,255,255,0.07) 0 1px, transparent 1px 4px)' }}
                      />
                      {/* Light sheen */}
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{ background: 'conic-gradient(from 210deg, transparent 0deg, rgba(255,255,255,0.14) 18deg, transparent 42deg, transparent 180deg, rgba(255,255,255,0.07) 200deg, transparent 226deg)' }}
                      />
                      {/* Batch 168 — centre label: the album's own
                          cover photo, or the white year label when
                          no cover is set (e.g. an admin-added
                          release). The photo spins with the disc
                          on hover, like a real record label; the
                          spindle dot sits on top of it. */}
                      {entry.coverUrl ? (
                        <div className="absolute inset-[33%] rounded-full overflow-hidden ring-2 ring-white/80 shadow-[0_1px_6px_rgba(0,0,0,0.45)]">
                          <img
                            src={entry.coverUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-black/85 ring-1 ring-white/70 pointer-events-none" />
                        </div>
                      ) : (
                        <div className="absolute inset-[33%] rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.45)] flex flex-col items-center justify-center gap-[2px] sm:gap-[3px]">
                          <span
                            className="font-black leading-none"
                            style={{ color: disc.base, fontSize: 'clamp(11px, 2.2vw, 20px)' }}
                          >
                            {year}
                          </span>
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-black/85" />
                          <span className="text-[6px] sm:text-[7px] font-mono font-bold tracking-[0.3em] text-gray-500 leading-none">
                            BTS
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Type sticker */}
                  <span
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 -rotate-6 bg-white rounded-md px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-black tracking-wider shadow-[0_4px_14px_rgba(0,0,0,0.45)]"
                    style={{ color: disc.base, border: `2px solid ${disc.base}` }}
                  >
                    {TYPE_STICKER[entry.type] || entry.type.toUpperCase()}
                  </span>

                  {/* Heart sticker */}
                  <span className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 rotate-12 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.45)] flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500" fill="currentColor" />
                  </span>

                  {/* Glass shine across the case */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(115deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 28%, transparent 45%)' }}
                  />

                  {/* Batch 169 — hover cue (desktop only): the disc
                      spins on hover and this pill fades in over the
                      case. pointer-events-none so the card link
                      itself takes the click. */}
                  {entry.spotifyUrl && (
                    <span className="pointer-events-none absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 hidden sm:flex items-center gap-1.5 rounded-full bg-[#1DB954] px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      <Play className="w-3 h-3 fill-white" />
                      Listen on Spotify
                    </span>
                  )}
                </div>

                {/* Info below the case */}
                <div className="px-3 pt-3 pb-3.5 sm:px-4 sm:pt-3.5 sm:pb-4">
                  <p className="text-white font-sans font-black text-base sm:text-lg leading-tight">
                    {entry.title}
                  </p>
                  {entry.titleTrack && (
                    <p className="text-gray-400 text-[11px] sm:text-xs mt-1.5 flex items-center gap-1.5">
                      <Music2 className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                      <span className="truncate">Title track: {entry.titleTrack}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-white/5">
                    <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-gray-400">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      {formatReleaseDate(entry.releaseDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 border border-purple-500/20 bg-purple-950/20 text-purple-300 rounded uppercase shrink-0">
                        {entry.era}
                      </span>
                      {/* Batch 169 — the link cue that is always
                          visible (mobile has no hover). A span, not
                          a nested link: the card itself is the link. */}
                      {entry.spotifyUrl && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#1DB954]/15 border border-[#1DB954]/40 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-[#1DB954] shrink-0">
                          <Play className="w-2.5 h-2.5 fill-[#1DB954]" />
                          Spotify
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </CardTag>
            );
          })}
        </div>
      )}
    </div>
  );
}
