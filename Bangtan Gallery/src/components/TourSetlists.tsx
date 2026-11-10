import { useState } from 'react';
import { MapPin, CalendarDays, Gift, ListMusic, ChevronDown, ChevronUp } from 'lucide-react';

// Batch 90 — ARMY Time Capsule's sibling on the Concert page:
// "ARIRANG World Tour — Setlists & Surprise Songs". One box per
// completed concert: title (city + date), the night's surprise
// song(s) highlighted, and the full setlist behind an expand
// toggle so the page stays compact on phones. Data comes from
// the published config's tourSetlists array — the owner manages
// it from Admin Panel → Concerts (add/edit/delete, instant
// publish), and Muse seeded the completed 2026 shows from
// verified setlist sources. Renders nothing when empty.

export interface TourSetlistEntry {
  id: string;
  city: string;
  country?: string;
  venue?: string;
  date: string;
  surpriseSongs?: string[];
  setlist?: string[];
}

function SetlistBox({ entry }: { entry: TourSetlistEntry }) {
  // Batch 103 (owner-corrected): each box opens/closes ONLY by
  // its own button and STAYS as the visitor left it — no
  // accordion, no auto-close. The "other boxes opened too"
  // effect was the grid stretching row-mates to the expanded
  // box's height; the grid's items-start below fixes that.
  const [open, setOpen] = useState(false);
  const songs = Array.isArray(entry.setlist) ? entry.setlist : [];
  const surprises = Array.isArray(entry.surpriseSongs) ? entry.surpriseSongs : [];
  return (
    <div className="p-5 rounded-2xl border border-white/8 bg-black/50 backdrop-blur-md flex flex-col gap-3 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-sans font-black text-base sm:text-lg text-white leading-snug">
          {entry.city}
          {entry.country ? <span className="text-purple-300 font-bold"> · {entry.country}</span> : null}
        </h4>
        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-mono text-gray-400">
          <CalendarDays className="w-3.5 h-3.5 text-purple-400" /> {entry.date}
        </span>
      </div>
      {entry.venue && (
        <p className="flex items-center gap-1.5 text-xs text-purple-300 font-mono -mt-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" /> {entry.venue}
        </p>
      )}

      <div className="rounded-xl border border-fuchsia-400/25 bg-gradient-to-r from-purple-950/60 via-fuchsia-950/40 to-pink-950/40 px-4 py-3">
        <p className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-fuchsia-300 uppercase">
          <Gift className="w-3.5 h-3.5" /> Surprise Song{surprises.length > 1 ? 's' : ''}
        </p>
        {surprises.length > 0 ? (
          <p className="mt-1 text-sm font-bold text-white leading-snug">{surprises.join(' · ')}</p>
        ) : (
          <p className="mt-1 text-xs text-gray-400">No rotating surprise song this night.</p>
        )}
      </div>

      {songs.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="self-start inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 hover:text-purple-200 cursor-pointer"
          >
            <ListMusic className="w-4 h-4" />
            {open ? 'Hide the setlist' : `View full setlist (${songs.length} songs)`}
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {open && (
            <ol className="grid grid-cols-1 gap-x-5 gap-y-1 text-[13px] text-gray-300 leading-relaxed list-none">
              {songs.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-mono text-[11px] text-purple-400 w-6 shrink-0 text-right">{i + 1}.</span>
                  <span className={surprises.includes(s) ? 'text-fuchsia-300 font-semibold' : ''}>{s}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}

export default function TourSetlists({ items }: { items?: TourSetlistEntry[] }) {
  const list = (Array.isArray(items) ? items : [])
    .filter((e) => e && e.city && e.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (list.length === 0) return null;
  return (
    <div id="tour-setlists" className="mt-12 scroll-mt-24">
      <div className="text-center space-y-1.5">
        <h3 className="text-xl sm:text-2xl font-black tracking-wide">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-300">
            🎤 ARIRANG World Tour — Setlists &amp; Surprise Songs
          </span>
        </h3>
        <p className="text-xs sm:text-sm text-gray-400">
          Every completed show, its surprise song and the full setlist — updated after each concert. 💜
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6 items-start">
        {list.map((e) => (
          <SetlistBox key={e.id} entry={e} />
        ))}
      </div>
    </div>
  );
}
