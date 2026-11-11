import { useState } from 'react';
import { MapPin, CalendarDays, Gift, ListMusic, ChevronDown, ChevronUp, Copy, Check, Download } from 'lucide-react';
import type { Video } from '../types';

// Batch 90 — ARMY Time Capsule's sibling on the Concert page:
// "ARIRANG World Tour — Setlists & Surprise Songs". One box per
// completed concert: title (city + date), the night's surprise
// song(s) highlighted, and the full setlist behind an expand
// toggle so the page stays compact on phones. Data comes from
// the published config's tourSetlists array — the owner manages
// it from Admin Panel → Concerts (add/edit/delete, instant
// publish), and Muse seeded the completed 2026 shows from
// verified setlist sources. Renders nothing when empty.
//
// Batch 141 (owner): every song name is a YouTube link — when
// the song matches one of the site's own official videos it
// opens that exact video, otherwise it opens a YouTube search
// for the song (never a guessed video id). Each box also gets
// a Copy button (the whole box as text: title + venue/date +
// surprise + every song) and a Download button that renders
// the setlist as a branded PNG image — diagonal "BANGTAN
// GALLERY" watermark, footer with the Telegram handle
// @arirang_army7 and bangtangallery.online.

export interface TourSetlistEntry {
  id: string;
  city: string;
  country?: string;
  venue?: string;
  date: string;
  surpriseSongs?: string[];
  setlist?: string[];
}

const norm = (s: string) =>
  s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

function songHref(song: string, videos: Video[]): string {
  const ns = norm(song);
  if (ns.length >= 2) {
    const hit = videos.find((v) => v && v.videoId && norm(v.title || '').includes(ns));
    if (hit) return `https://www.youtube.com/watch?v=${hit.videoId}`;
  }
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`BTS ${song}`)}`;
}

function boxTitle(entry: TourSetlistEntry): string {
  return `BTS ARIRANG World Tour — ${entry.city}${entry.country ? `, ${entry.country}` : ''}`;
}

function setlistText(entry: TourSetlistEntry): string {
  const songs = Array.isArray(entry.setlist) ? entry.setlist : [];
  const surprises = Array.isArray(entry.surpriseSongs) ? entry.surpriseSongs : [];
  const lines: string[] = [boxTitle(entry)];
  const meta = [entry.venue, entry.date].filter(Boolean).join(' · ');
  if (meta) lines.push(meta);
  if (surprises.length > 0) lines.push(`Surprise Song${surprises.length > 1 ? 's' : ''}: ${surprises.join(' · ')}`);
  lines.push('');
  songs.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  lines.push('');
  lines.push('Bangtan Gallery · bangtangallery.online · Telegram: @arirang_army7');
  return lines.join('\n');
}

function downloadSetlistImage(entry: TourSetlistEntry) {
  const songs = Array.isArray(entry.setlist) ? entry.setlist : [];
  const surprises = Array.isArray(entry.surpriseSongs) ? entry.surpriseSongs : [];
  const W = 1080;
  const pad = 64;
  const colGap = 48;
  const colW = (W - pad * 2 - colGap) / 2;
  const rows = Math.ceil(songs.length / 2) || 1;
  const headerH = surprises.length > 0 ? 300 : 236;
  const H = headerH + rows * 44 + 150;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#160329');
  bg.addColorStop(0.55, '#0d0218');
  bg.addColorStop(1, '#070110');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Diagonal watermark
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-0.42);
  ctx.font = '900 92px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(192, 132, 252, 0.055)';
  for (let y = -H; y <= H; y += 190) ctx.fillText('BANGTAN GALLERY', 0, y);
  ctx.restore();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#e879f9';
  ctx.font = '700 25px Arial, sans-serif';
  ctx.fillText('B T S   ·   A R I R A N G   W O R L D   T O U R', pad, 84);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 56px Arial, sans-serif';
  ctx.fillText(`${entry.city}${entry.country ? ` · ${entry.country}` : ''}`, pad, 152);
  ctx.fillStyle = '#c4b5fd';
  ctx.font = '400 27px Arial, sans-serif';
  const meta = [entry.venue, entry.date].filter(Boolean).join('   ·   ');
  if (meta) ctx.fillText(meta, pad, 198);

  let listTop = 252;
  if (surprises.length > 0) {
    ctx.fillStyle = 'rgba(217, 70, 239, 0.12)';
    ctx.beginPath();
    ctx.roundRect(pad, 224, W - pad * 2, 62, 14);
    ctx.fill();
    ctx.fillStyle = '#f0abfc';
    ctx.font = '700 24px Arial, sans-serif';
    ctx.fillText(`SURPRISE:  ${surprises.join('  ·  ')}`, pad + 22, 264);
    listTop = 316;
  }

  ctx.font = '400 27px Arial, sans-serif';
  songs.forEach((s, i) => {
    const col = i < rows ? 0 : 1;
    const row = i % rows;
    const x = pad + col * (colW + colGap);
    const y = listTop + row * 44;
    ctx.fillStyle = '#a855f7';
    ctx.font = '700 24px Arial, sans-serif';
    ctx.fillText(`${i + 1}.`, x, y);
    ctx.fillStyle = surprises.includes(s) ? '#f0abfc' : '#e5e7eb';
    ctx.font = surprises.includes(s) ? '700 27px Arial, sans-serif' : '400 27px Arial, sans-serif';
    ctx.fillText(s, x + 52, y);
  });

  // Footer: Telegram plane badge + handle + site
  const fy = H - 62;
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad, fy - 44);
  ctx.lineTo(W - pad, fy - 44);
  ctx.stroke();
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(pad + 17, fy + 4, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(pad + 8, fy + 5);
  ctx.lineTo(pad + 27, fy - 3);
  ctx.lineTo(pad + 21, fy + 13);
  ctx.lineTo(pad + 15, fy + 8);
  ctx.lineTo(pad + 12, fy + 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e9d5ff';
  ctx.font = '700 25px Arial, sans-serif';
  ctx.fillText('@arirang_army7', pad + 46, fy + 13);
  ctx.fillStyle = '#9ca3af';
  ctx.font = '400 24px Arial, sans-serif';
  const site = 'bangtangallery.online · Bangtan Gallery';
  ctx.fillText(site, W - pad - ctx.measureText(site).width, fy + 13);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `setlist-${entry.city}-${entry.date}.png`.replace(/[^a-z0-9.-]+/gi, '-');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 'image/png');
}

function SetlistBox({ entry, videos }: { entry: TourSetlistEntry; videos: Video[] }) {
  // Batch 103 (owner-corrected): each box opens/closes ONLY by
  // its own button and STAYS as the visitor left it — no
  // accordion, no auto-close. The "other boxes opened too"
  // effect was the grid stretching row-mates to the expanded
  // box's height; the grid's items-start below fixes that.
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const songs = Array.isArray(entry.setlist) ? entry.setlist : [];
  const surprises = Array.isArray(entry.surpriseSongs) ? entry.surpriseSongs : [];

  const copyAll = async () => {
    const text = setlistText(entry);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* clipboard unavailable */ }
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const linkCls = 'hover:text-white hover:underline underline-offset-2 decoration-purple-400/60 transition-colors';

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
          <p className="mt-1 text-sm font-bold text-white leading-snug">
            {surprises.map((s, i) => (
              <span key={i}>
                {i > 0 && <span className="text-fuchsia-300/70"> · </span>}
                <a href={songHref(s, videos)} target="_blank" rel="noopener noreferrer" className={linkCls}>{s}</a>
              </span>
            ))}
          </p>
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
                  <a
                    href={songHref(s, videos)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${linkCls} inline-flex items-center gap-1 ${surprises.includes(s) ? 'text-fuchsia-300 font-semibold' : ''}`}
                  >
                    {s}
                  </a>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      <div className="flex items-center gap-2 pt-1 mt-auto">
        <button
          type="button"
          onClick={copyAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border border-white/10 bg-white/[0.04] text-slate-200 hover:border-purple-400/50 cursor-pointer transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy setlist'}
        </button>
        <button
          type="button"
          onClick={() => downloadSetlistImage(entry)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border border-white/10 bg-white/[0.04] text-slate-200 hover:border-purple-400/50 cursor-pointer transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </button>
      </div>
    </div>
  );
}

export default function TourSetlists({ items, videos }: { items?: TourSetlistEntry[]; videos?: Video[] }) {
  const list = (Array.isArray(items) ? items : [])
    .filter((e) => e && e.city && e.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (list.length === 0) return null;
  const vids = Array.isArray(videos) ? videos : [];
  return (
    <div id="tour-setlists" className="mt-12 scroll-mt-24">
      <div className="text-center space-y-1.5">
        <h3 className="text-xl sm:text-2xl font-black tracking-wide">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-300">
            🎤 ARIRANG World Tour — Setlists &amp; Surprise Songs
          </span>
        </h3>
        <p className="text-xs sm:text-sm text-gray-400">
          Every completed show, its surprise song and the full setlist — updated after each concert. Tap a song to hear it on YouTube. 💜
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6 items-start">
        {list.map((e) => (
          <SetlistBox key={e.id} entry={e} videos={vids} />
        ))}
      </div>
    </div>
  );
}
