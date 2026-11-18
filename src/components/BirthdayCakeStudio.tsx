import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Cake, Copy, Download, Facebook, Sparkles, Twitter } from 'lucide-react';
import { roundRectPath } from '../utils/roundRectPath';

/**
 * Birthday Cake Studio (owner feature, 2026-11-05) — decorate a
 * birthday cake the simple, fun way: choose the cake shape and
 * details, recolor cake / icing / piping / plate / background,
 * add candles and emoji stickers (drag them around), write a
 * two-line message, then download or share the PNG. The cake is
 * drawn procedurally on canvas by this site's own code — an
 * original 2D design, not a copy of any other tool's artwork.
 */

const W = 960;
const H = 960;
const CX = W / 2;

const SWATCHES = ['#a855f7', '#cdb8f5', '#f9a8d4', '#fb7185', '#f6ecd9', '#ffffff', '#7c4a2d', '#a7f3d0', '#7dd3fc', '#fde68a'];
const BG_SWATCHES = ['#1b0533', '#2a1245', '#4c1d95', '#0b0214', '#efe4fb', '#fbcfe8', '#fde68a', '#d1fae5', '#bae6fd', '#ffffff'];
const TEXT_COLORS = ['#e11d63', '#a855f7', '#059669', '#0284c7', '#d97706', '#374151', '#ffffff', '#92400e', '#111111'];
const STICKERS = ['💜', '⭐', '🎀', '🌸', '🍓', '🍒', '🦋', '✨', '🎵', '🐨', '🐹', '🐱', '🐿️', '🐥', '🐯', '🐰'];
const WISHES = [
  'Happy Birthday! 💜',
  'Borahae! Have the best day 🎂',
  'Seven stars, one wish ✨',
  'Eat cake, smile big, stay golden 👑',
  'Another year of you — our favorite song 🎵',
];
const FONTS: Record<string, string> = {
  script: '"Segoe Script", "Bradley Hand", cursive',
  bubbly: '"Comic Sans MS", "Chalkboard SE", sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  bold: '"Arial Black", Arial, sans-serif',
};

interface Sticker {
  emoji: string;
  x: number;
  y: number;
  s: number;
}

type TabKey = 'cake' | 'decorate' | 'message' | 'share';

export default function BirthdayCakeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tab, setTab] = useState<TabKey>('cake');
  const [shape, setShape] = useState<'round' | 'square' | 'heart'>('round');
  // Defaults wear Bangtan Gallery's own colors (dark purple + pink) —
  // the b-cd tool only gave the idea/flow, never its colors or art.
  // Every color stays freely changeable by the visitor.
  const [cakeColor, setCakeColor] = useState('#8b5cf6');
  const [icingColor, setIcingColor] = useState('#f472b6');
  const [pipingColor, setPipingColor] = useState('#f5d0fe');
  const [plateColor, setPlateColor] = useState('#3b1470');
  const [bgColor, setBgColor] = useState('#1b0533');
  const [details, setDetails] = useState({ drip: true, swirls: true, topBorder: true, baseBorder: true });
  const [candles, setCandles] = useState(1);
  const [candleColor, setCandleColor] = useState('#f472b6');
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [msgSize, setMsgSize] = useState<'S' | 'M' | 'L'>('M');
  const [msgColor, setMsgColor] = useState('#f9a8d4');
  const [msgFont, setMsgFont] = useState<keyof typeof FONTS>('script');
  const [msgPos, setMsgPos] = useState<'above' | 'on' | 'below'>('above');
  const [copied, setCopied] = useState(false);

  // ── Drawing helpers ─────────────────────────────────────────────
  const drawCakeBody = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = cakeColor;
    if (shape === 'round') {
      ctx.beginPath();
      ctx.moveTo(CX - 220, 470);
      ctx.lineTo(CX - 220, 664);
      ctx.quadraticCurveTo(CX - 220, 692, CX - 192, 692);
      ctx.lineTo(CX + 192, 692);
      ctx.quadraticCurveTo(CX + 220, 692, CX + 220, 664);
      ctx.lineTo(CX + 220, 470);
      ctx.closePath();
      ctx.fill();
    } else if (shape === 'square') {
      ctx.beginPath();
      roundRectPath(ctx, CX - 215, 478, 430, 214, 14);
      ctx.fill();
    } else {
      // heart body
      ctx.beginPath();
      ctx.moveTo(CX, 700);
      ctx.bezierCurveTo(CX - 300, 560, CX - 235, 380, CX - 110, 380);
      ctx.bezierCurveTo(CX - 35, 380, CX, 430, CX, 462);
      ctx.bezierCurveTo(CX, 430, CX + 35, 380, CX + 110, 380);
      ctx.bezierCurveTo(CX + 235, 380, CX + 300, 560, CX, 700);
      ctx.closePath();
      ctx.fill();
    }
  };

  const topSurface = () => {
    if (shape === 'round') return { kind: 'ellipse' as const, cy: 470, rx: 220, ry: 56 };
    if (shape === 'square') return { kind: 'rect' as const, cy: 478, rx: 215, ry: 30 };
    return { kind: 'heart' as const, cy: 452, rx: 200, ry: 60 };
  };

  const drawTopAndDrips = (ctx: CanvasRenderingContext2D) => {
    const t = topSurface();
    ctx.fillStyle = icingColor;
    if (t.kind === 'ellipse') {
      ctx.beginPath();
      ctx.ellipse(CX, t.cy, t.rx, t.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (t.kind === 'rect') {
      ctx.beginPath();
      roundRectPath(ctx, CX - t.rx, t.cy - 26, t.rx * 2, 52, 14);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(CX, 560);
      ctx.bezierCurveTo(CX - 260, 445, CX - 205, 330, CX - 96, 330);
      ctx.bezierCurveTo(CX - 30, 330, CX, 372, CX, 400);
      ctx.bezierCurveTo(CX, 372, CX + 30, 330, CX + 96, 330);
      ctx.bezierCurveTo(CX + 205, 330, CX + 260, 445, CX, 560);
      ctx.closePath();
      ctx.fill();
    }
    if (details.drip && shape !== 'heart') {
      // icing drips hanging over the body's top edge
      ctx.beginPath();
      const baseY = shape === 'round' ? 492 : 500;
      const span = shape === 'round' ? 216 : 210;
      ctx.moveTo(CX - span, baseY - 26);
      const n = 9;
      for (let i = 0; i <= n; i++) {
        const x = CX - span + (2 * span * i) / n;
        const dripLen = 22 + ((i * 37) % 34);
        ctx.lineTo(x - 12, baseY - 26);
        ctx.quadraticCurveTo(x - 12, baseY + dripLen, x, baseY + dripLen);
        ctx.quadraticCurveTo(x + 12, baseY + dripLen, x + 12, baseY - 26);
      }
      ctx.lineTo(CX + span, baseY - 64);
      ctx.closePath();
      ctx.fill();
    }
  };

  const beadRow = (ctx: CanvasRenderingContext2D, points: { x: number; y: number }[], r: number) => {
    ctx.fillStyle = pipingColor;
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // ── Render ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // background + soft spotlight
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);
    const rg = ctx.createRadialGradient(CX, 430, 60, CX, 430, 560);
    rg.addColorStop(0, 'rgba(255,255,255,0.35)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);

    // plate + shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(CX, 716, 320, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = plateColor;
    ctx.beginPath();
    ctx.ellipse(CX, 700, 335, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(CX, 698, 280, 36, 0, 0, Math.PI * 2);
    ctx.stroke();

    // cake
    drawCakeBody(ctx);
    drawTopAndDrips(ctx);

    const t = topSurface();
    // swirls around the top edge
    if (details.swirls) {
      ctx.fillStyle = icingColor;
      ctx.strokeStyle = 'rgba(0,0,0,0.10)';
      const count = 9;
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2;
        const sx = CX + Math.cos(ang) * t.rx * 0.78;
        const sy = (shape === 'square' ? 478 : t.cy) + Math.sin(ang) * (shape === 'round' ? t.ry * 0.72 : 20);
        ctx.beginPath();
        ctx.arc(sx, sy, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx, sy, 9, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // bead borders
    if (details.topBorder) {
      const pts: { x: number; y: number }[] = [];
      const n = 18;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2;
        pts.push({ x: CX + Math.cos(ang) * t.rx * 0.94, y: (shape === 'square' ? 478 : t.cy) + Math.sin(ang) * (shape === 'round' ? t.ry * 0.92 : 24) });
      }
      beadRow(ctx, pts, 7);
    }
    if (details.baseBorder) {
      const pts: { x: number; y: number }[] = [];
      const baseHalf = shape === 'square' ? 208 : 212;
      const baseY = shape === 'heart' ? 678 : 684;
      for (let x = CX - baseHalf; x <= CX + baseHalf; x += 26) pts.push({ x, y: baseY });
      beadRow(ctx, pts, 7);
    }

    // candles
    if (candles > 0) {
      const spread = shape === 'heart' ? 130 : 150;
      for (let i = 0; i < candles; i++) {
        const fx = candles === 1 ? CX : CX - spread + (2 * spread * i) / (candles - 1);
        const topY = (shape === 'square' ? 478 : 452) - 8;
        // flame glow
        const fg = ctx.createRadialGradient(fx, topY - 108, 2, fx, topY - 108, 44);
        fg.addColorStop(0, 'rgba(255,190,60,0.85)');
        fg.addColorStop(1, 'rgba(255,190,60,0)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(fx, topY - 108, 44, 0, Math.PI * 2);
        ctx.fill();
        // stick
        ctx.fillStyle = candleColor;
        ctx.beginPath();
        roundRectPath(ctx, fx - 9, topY - 84, 18, 84, 6);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(fx - 9, topY - 66, 18, 6);
        ctx.fillRect(fx - 9, topY - 40, 18, 6);
        // flame
        ctx.fillStyle = '#ffb703';
        ctx.beginPath();
        ctx.moveTo(fx, topY - 138);
        ctx.quadraticCurveTo(fx + 13, topY - 108, fx, topY - 92);
        ctx.quadraticCurveTo(fx - 13, topY - 108, fx, topY - 138);
        ctx.fill();
        ctx.fillStyle = '#fff3c4';
        ctx.beginPath();
        ctx.ellipse(fx, topY - 106, 4.5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // stickers
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    stickers.forEach((s, i) => {
      ctx.font = `${Math.round(62 * s.s)}px serif`;
      if (i === selected) {
        ctx.save();
        ctx.strokeStyle = 'rgba(168,85,247,0.8)';
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 44 * s.s, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.fillText(s.emoji, s.x, s.y);
    });

    // message
    if (line1 || line2) {
      const sizePx = msgSize === 'S' ? 40 : msgSize === 'M' ? 56 : 76;
      ctx.fillStyle = msgColor;
      ctx.font = `${sizePx}px ${FONTS[msgFont]}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const ys = msgPos === 'above' ? [168, 168 + sizePx * 1.25] : msgPos === 'below' ? [792, 792 + sizePx * 1.25] : [586, 586 + sizePx * 1.2];
      if (line1) ctx.fillText(line1, CX, ys[0]);
      if (line2) ctx.fillText(line2, CX, ys[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape, cakeColor, icingColor, pipingColor, plateColor, bgColor, details, candles, candleColor, stickers, selected, line1, line2, msgSize, msgColor, msgFont, msgPos]);

  // ── Sticker interactions ────────────────────────────────────────
  const toPos = (e: ReactPointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
  };
  const onPointerDown = (e: ReactPointerEvent) => {
    const p = toPos(e);
    for (let i = stickers.length - 1; i >= 0; i--) {
      const s = stickers[i];
      if (Math.hypot(s.x - p.x, s.y - p.y) < 48 * s.s) {
        dragRef.current = i;
        setSelected(i);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
    }
    setSelected(null);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (dragRef.current === null) return;
    const p = toPos(e);
    setStickers(prev => prev.map((s, i) => (i === dragRef.current ? { ...s, x: p.x, y: p.y } : s)));
  };
  const onPointerUp = () => { dragRef.current = null; };

  const addSticker = (emoji: string) => {
    const spots = [
      { x: CX - 120, y: 560 }, { x: CX + 120, y: 560 }, { x: CX, y: 610 },
      { x: CX - 170, y: 620 }, { x: CX + 170, y: 620 }, { x: CX, y: 520 },
    ];
    const spot = spots[stickers.length % spots.length];
    setStickers(prev => [...prev, { emoji, x: spot.x, y: spot.y, s: 1 }]);
    setSelected(stickers.length);
  };

  // ── Share actions ───────────────────────────────────────────────
  const download = () => {
    const a = document.createElement('a');
    a.download = `bangtan-birthday-cake-${Date.now()}.png`;
    a.href = canvasRef.current!.toDataURL('image/png');
    a.click();
  };
  const copyImage = () => {
    canvasRef.current!.toBlob(async blob => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* clipboard may be unavailable */ }
    });
  };

  const swatchRow = (label: string, value: string, set: (v: string) => void, list: string[] = SWATCHES) => (
    <div className="space-y-1.5">
      <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">{label}</label>
      <div className="flex flex-wrap items-center gap-1.5">
        {list.map(c => (
          <button
            key={c}
            onClick={() => set(c)}
            className={`w-6 h-6 rounded-full border-2 cursor-pointer ${value === c ? 'border-purple-400 scale-110' : 'border-white/20'}`}
            style={{ background: c }}
            title={c}
          />
        ))}
        <input type="color" value={value} onChange={e => set(e.target.value)} className="w-7 h-7 rounded bg-transparent cursor-pointer" title="Custom colour" />
      </div>
    </div>
  );

  const toggle = (key: keyof typeof details, label: string) => (
    <label className="flex items-center justify-between py-1 cursor-pointer">
      <span className="text-xs text-slate-200">{label}</span>
      <input
        type="checkbox"
        checked={details[key]}
        onChange={e => setDetails(d => ({ ...d, [key]: e.target.checked }))}
        className="w-4 h-4 accent-purple-500 cursor-pointer"
      />
    </label>
  );

  const tabBtn = (k: TabKey, label: string) => (
    <button
      onClick={() => setTab(k)}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${tab === k ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* Preview */}
      <div className="lg:col-span-6 space-y-3">
        <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
          <Cake className="w-3.5 h-3.5" /> Your Cake
        </span>
        <div className="rounded-2xl overflow-hidden border border-purple-500/15 bg-black/40 max-w-[520px]">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="w-full h-auto block touch-none cursor-grab active:cursor-grabbing"
          />
        </div>
        <p className="text-[10px] text-slate-500 font-mono">Tap a sticker to select it, then drag it around the cake.</p>
      </div>

      {/* Controls */}
      <div className="lg:col-span-6 space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {tabBtn('cake', '🎂 Cake')}
          {tabBtn('decorate', '✨ Decorate')}
          {tabBtn('message', '💌 Message')}
          {tabBtn('share', '📤 Share')}
        </div>

        {tab === 'cake' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Shape</label>
              <div className="flex gap-1.5">
                {(['round', 'square', 'heart'] as const).map(sh => (
                  <button key={sh} onClick={() => setShape(sh)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer capitalize ${shape === sh ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
                    {sh === 'round' ? '⭕ Round' : sh === 'square' ? '⬜ Square' : '💜 Heart'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4">
              {toggle('drip', 'Drip icing')}
              {toggle('swirls', 'Frosting swirls')}
              {toggle('topBorder', 'Top border')}
              {toggle('baseBorder', 'Base border')}
            </div>
            {swatchRow('Cake colour', cakeColor, setCakeColor)}
            {swatchRow('Icing colour', icingColor, setIcingColor)}
            {swatchRow('Piping colour', pipingColor, setPipingColor)}
            {swatchRow('Plate colour', plateColor, setPlateColor)}
            {swatchRow('Background', bgColor, setBgColor, BG_SWATCHES)}
          </div>
        )}

        {tab === 'decorate' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Candles: {candles}</label>
              <input type="range" min={0} max={7} value={candles} onChange={e => setCandles(Number(e.target.value))} className="w-full accent-purple-500" />
              {swatchRow('Candle colour', candleColor, setCandleColor)}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Stickers — tap to add</label>
              <div className="flex flex-wrap gap-1.5">
                {STICKERS.map(em => (
                  <button key={em} onClick={() => addSticker(em)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-xl cursor-pointer hover:bg-purple-500/20">
                    {em}
                  </button>
                ))}
              </div>
            </div>
            {selected !== null && stickers[selected] && (
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Selected sticker size</label>
                <input
                  type="range" min={0.5} max={2.2} step={0.1}
                  value={stickers[selected].s}
                  onChange={e => setStickers(prev => prev.map((s, i) => (i === selected ? { ...s, s: Number(e.target.value) } : s)))}
                  className="w-full accent-purple-500"
                />
                <button
                  onClick={() => { setStickers(prev => prev.filter((_, i) => i !== selected)); setSelected(null); }}
                  className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-400/30 text-red-300 text-[11px] font-bold cursor-pointer"
                >
                  Remove selected sticker
                </button>
              </div>
            )}
            {stickers.length > 0 && (
              <button onClick={() => { setStickers([]); setSelected(null); }} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-bold cursor-pointer">
                Clear all stickers
              </button>
            )}
          </div>
        )}

        {tab === 'message' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Quick wish</label>
              <div className="flex flex-wrap gap-1.5">
                {WISHES.map(wsh => (
                  <button key={wsh} onClick={() => setLine1(wsh)} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-[11px] cursor-pointer hover:bg-purple-500/20">
                    {wsh}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Line 1 ({line1.length}/30)</label>
              <input type="text" value={line1} maxLength={30} onChange={e => setLine1(e.target.value)} placeholder="Happy Birthday" className="w-full px-2.5 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-100" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Line 2 ({line2.length}/30)</label>
              <input type="text" value={line2} maxLength={30} onChange={e => setLine2(e.target.value)} placeholder="...to you! 💜" className="w-full px-2.5 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-100" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Text size</label>
                <div className="flex gap-1">
                  {(['S', 'M', 'L'] as const).map(sz => (
                    <button key={sz} onClick={() => setMsgSize(sz)} className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${msgSize === sz ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>{sz}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Font</label>
                <select value={msgFont} onChange={e => setMsgFont(e.target.value as keyof typeof FONTS)} className="w-full px-2 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-100 text-xs">
                  <option value="script">Festive script</option>
                  <option value="bubbly">Playful bubbly</option>
                  <option value="serif">Elegant serif</option>
                  <option value="bold">Bold stacked</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Position</label>
                <select value={msgPos} onChange={e => setMsgPos(e.target.value as typeof msgPos)} className="w-full px-2 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-100 text-xs">
                  <option value="above">Above cake</option>
                  <option value="on">On cake</option>
                  <option value="below">Below cake</option>
                </select>
              </div>
            </div>
            {swatchRow('Text colour', msgColor, setMsgColor, TEXT_COLORS)}
          </div>
        )}

        {tab === 'share' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300 font-sans">Your cake is ready! Download it as a PNG or share it with ARMY 💜</p>
            <button onClick={download} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40">
              <Download className="w-4 h-4" /> Download PNG
            </button>
            <button onClick={copyImage} className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5">
              <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied! 💜' : 'Copy Image'}
            </button>
            <div className="flex gap-2">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('I decorated a birthday cake on Bangtan Gallery! 🎂💜')}&url=${encodeURIComponent('https://bangtangallery.online')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Twitter className="w-3.5 h-3.5" /> Share on X
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://bangtangallery.online')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Facebook className="w-3.5 h-3.5" /> Share on Facebook
              </a>
            </div>
            <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Made with the Bangtan Gallery Cake Studio — fan-made, for ARMY.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
