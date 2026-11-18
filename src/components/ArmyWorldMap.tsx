import { useEffect, useMemo, useRef, useState } from 'react';
import { Globe2, MapPin, Check } from 'lucide-react';
import { WORLD_DOTS, WORLD_DOT_COLS, WORLD_DOT_ROWS, WORLD_LAT_TOP, WORLD_LAT_BOT } from '../data/worldDots';
import { COUNTRIES, countryCoords } from '../data/countries';
import CountrySelect from './CountrySelect';
import { getSavedCountry, saveCountry } from '../utils/armyMap';
import { getProfile } from '../utils/profile';

// ARMY World Map (Batch 91) — Home section after the Supporters
// Wall. A dotted world map drawn on a canvas from a tiny land-dot
// grid (no map images, no external tiles — a few KB, drawn once).
// Visitors pick their country and Join: a glowing pin lights
// their country and the count grows. Counts live in ONE Firestore
// doc (config/armyMap) via /api/army-map; submission forms pin
// through the same endpoint. Counts are REAL — they start at
// zero and grow only with real joins/submissions.

const MAP_COUNTRY_KEY = 'bg_armymap_country';

export default function ArmyWorldMap() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [joined, setJoined] = useState<string>(() => {
    try {
      return localStorage.getItem(MAP_COUNTRY_KEY) || '';
    } catch {
      return '';
    }
  });
  const [changing, setChanging] = useState(false);
  const [pick, setPick] = useState<string>(() => getProfile()?.country || getSavedCountry());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/army-map');
        if (res.ok) {
          const data = await res.json();
          if (data?.success && data.counts) setCounts(data.counts);
        }
      } catch {}
    })();
  }, []);

  // Gentle pin pulse — two glow phases a second apart, cheap.
  useEffect(() => {
    const t = setInterval(() => setPulse((p) => (p + 1) % 2), 1000);
    return () => clearInterval(t);
  }, []);

  const lit = useMemo(
    () =>
      Object.entries(counts)
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1]),
    [counts]
  );
  const totalPins = lit.reduce((s, [, n]) => s + n, 0);
  const top = lit.slice(0, 6);
  const labelSet = useMemo(() => new Set(lit.slice(0, 5).map(([c]) => c)), [lit]);

  // ---- canvas drawing ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const draw = () => {
      const w = parent.clientWidth;
      const h = Math.round((w * WORLD_DOT_ROWS) / WORLD_DOT_COLS);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);
      const cellW = w / WORLD_DOT_COLS;
      const cellH = h / WORLD_DOT_ROWS;
      const shades = ['#7c3aed', '#8b5cf6', '#6d28d9', '#a78bfa'];
      // land dots
      for (let r = 0; r < WORLD_DOT_ROWS; r++) {
        const row = WORLD_DOTS[r];
        for (let c = 0; c < WORLD_DOT_COLS; c++) {
          if (row[c] !== '1') continue;
          const x = (c + 0.5) * cellW;
          const y = (r + 0.5) * cellH;
          ctx.beginPath();
          ctx.fillStyle = shades[(r * 31 + c * 17) % shades.length];
          ctx.globalAlpha = 0.85;
          ctx.arc(x, y, Math.max(1.1, cellW * 0.32), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      // pins
      const latSpan = WORLD_LAT_TOP - WORLD_LAT_BOT;
      for (const [name, n] of lit) {
        const pos = countryCoords(name);
        if (!pos) continue;
        const x = ((pos.lon + 180) / 360) * w;
        const y = ((WORLD_LAT_TOP - pos.lat) / latSpan) * h;
        const base = 3 + Math.min(4, Math.log10(n + 1) * 2.4);
        const glowR = base * (pulse === 0 ? 2.6 : 3.4);
        const g = ctx.createRadialGradient(x, y, 0, x, y, glowR);
        g.addColorStop(0, 'rgba(236,72,153,0.55)');
        g.addColorStop(1, 'rgba(236,72,153,0)');
        ctx.beginPath();
        ctx.fillStyle = g;
        ctx.arc(x, y, glowR, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = '#ec4899';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        ctx.arc(x, y, base, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(x, y, base * 0.38, 0, Math.PI * 2);
        ctx.fill();
        if (labelSet.has(name)) {
          // Batch 108: canvas text ignores CSS theme rules — the
          // white/pale label colours vanished on the light theme's
          // white page. Detect the theme from the .light ancestor
          // and draw deep purple/pink instead. The pulse redraw
          // picks a theme switch up within a second.
          const isLight = !!canvas.closest('.light');
          ctx.font = '600 11px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = isLight ? 'rgba(76,29,149,0.95)' : 'rgba(255,255,255,0.95)';
          // Batch 154: the country NAME shows on the map, but the
          // count number under it is gone (the count is admin-only
          // now — see the Dashboard card in AdminPanel).
          ctx.fillText(name, x, y - glowR - 8);
        }
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [lit, labelSet, pulse]);

  const join = async () => {
    const country = pick.trim();
    if (!country) {
      setError('Please select your country first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/army-map/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, previous: joined && joined !== country ? joined : '' })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error('pin failed');
      setCounts(data.counts || {});
      setJoined(country);
      saveCountry(country);
      try {
        localStorage.setItem(MAP_COUNTRY_KEY, country);
      } catch {}
      setChanging(false);
    } catch {
      setError('Could not pin your country right now — please try again.');
    }
    setBusy(false);
  };

  return (
    <section className="mt-14 px-1">
      <div className="rounded-3xl border border-white/8 bg-black/50 backdrop-blur-md p-5 sm:p-7 shadow-xl">
        <div className="text-center space-y-1.5">
          <h3 className="flex items-center justify-center gap-2 text-xl sm:text-2xl font-black tracking-wide">
            <Globe2 className="w-6 h-6 text-purple-300" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-300">
              ARMY Around the World
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-gray-400">
            {lit.length > 0 ? (
              <>
                ARMY from <span className="text-white font-bold">{lit.length} {lit.length === 1 ? 'country' : 'countries'}</span> ·{' '}
                <span className="text-white font-bold">{totalPins.toLocaleString()}</span> pins on the map 💜
              </>
            ) : (
              'Be the first ARMY to light up your country on the map 💜'
            )}
          </p>
        </div>

        <div className="mt-5">
          <canvas ref={canvasRef} className="block mx-auto max-w-full" aria-label="World map with ARMY country pins" />
        </div>

        {joined && !changing ? (
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <p className="inline-flex items-center gap-2 text-sm text-white">
              <Check className="w-4 h-4 text-emerald-400" />
              You are on the map from <span className="font-bold text-fuchsia-300">{joined}</span> 💜
            </p>
            <button
              type="button"
              onClick={() => {
                setPick(joined);
                setChanging(true);
              }}
              className="text-xs font-bold text-purple-300 hover:text-purple-200 underline underline-offset-2 cursor-pointer"
            >
              Change country
            </button>
          </div>
        ) : (
          <div className="mt-5 flex flex-col sm:flex-row items-center gap-3 max-w-2xl mx-auto">
            <p className="inline-flex items-center gap-1.5 text-sm text-gray-300 shrink-0">
              <MapPin className="w-4 h-4 text-pink-400" /> I&apos;m ARMY from
            </p>
            <div className="flex-1 w-full">
              <CountrySelect value={pick} onChange={setPick} />
            </div>
            <button
              type="button"
              onClick={join}
              disabled={busy}
              className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-black disabled:opacity-60 cursor-pointer shadow-lg shadow-purple-500/25"
            >
              {busy ? 'Pinning…' : 'Join the map'}
            </button>
          </div>
        )}
        {error && <p className="mt-2 text-center text-xs text-rose-300">{error}</p>}

        {/* Batch 154: country names only — the count number after
            each name is gone from the public site (admin-only now). */}
        {top.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {top.map(([name]) => (
              <span
                key={name}
                className="px-3 py-1.5 rounded-full bg-purple-950/50 border border-purple-500/25 text-xs text-purple-200 font-mono"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
