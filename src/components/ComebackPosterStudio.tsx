import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Download, Eraser, Paintbrush, RotateCcw, Trash2, Undo2, Upload } from 'lucide-react';
import { roundRectPath } from '../utils/roundRectPath';

/**
 * Comeback Poster Studio (owner feature, 2026-11-05) — a simple
 * auto-compose poster maker in the spirit of fan poster tools:
 * pick a size, optionally a style template, recolor the icons /
 * wordmark / background, optionally upload a background photo,
 * draw on the poster if you like, then Generate & Download.
 * All artwork here is original to this site (geometric glyphs +
 * the visitor's own text); nothing is copied from any other tool.
 */

type SizeKey = 'poster' | 'header' | 'square';
const SIZES: Record<SizeKey, { w: number; h: number; label: string }> = {
  poster: { w: 1200, h: 630, label: 'Poster (1200×630)' },
  header: { w: 1500, h: 500, label: 'Header (1500×500)' },
  square: { w: 1080, h: 1080, label: 'Square (1080×1080)' },
};

interface Template {
  name: string;
  bg: string;
  bg2: string;
  icon: string;
  text: string;
}
const TEMPLATES: Template[] = [
  // Default first: Bangtan Gallery's own colors (dark purple / pink) —
  // the b-cd tools only gave the idea/flow, never their colors or art.
  { name: 'Borahae Night', bg: '#1b0533', bg2: '#070110', icon: '#c084fc', text: '#f5d0fe' },
  { name: 'Clean White', bg: '#ffffff', bg2: '#ffffff', icon: '#f43f5e', text: '#111111' },
  { name: 'ARIRANG Red', bg: '#2a0208', bg2: '#0b0205', icon: '#ef4444', text: '#fecaca' },
  { name: 'Golden Stage', bg: '#241a02', bg2: '#0d0a02', icon: '#f59e0b', text: '#fde68a' },
];

interface Stroke {
  color: string;
  size: number;
  erase: boolean;
  points: { x: number; y: number }[];
}

export default function ComebackPosterStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [sizeKey, setSizeKey] = useState<SizeKey>('poster');
  const [bgColor, setBgColor] = useState('#1b0533');
  const [bgColor2, setBgColor2] = useState('#070110');
  const [iconColor, setIconColor] = useState('#c084fc');
  const [textColor, setTextColor] = useState('#f5d0fe');
  const [title, setTitle] = useState('BTS');
  const [subline, setSubline] = useState('BANGTAN GALLERY');
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'off'>('off');
  const [brushColor, setBrushColor] = useState('#7c3aed');
  const [brushSize, setBrushSize] = useState(6);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const drawingRef = useRef<Stroke | null>(null);

  const { w: W, h: H } = SIZES[sizeKey];

  const applyTemplate = (t: Template) => {
    setBgColor(t.bg);
    setBgColor2(t.bg2);
    setIconColor(t.icon);
    setTextColor(t.text);
    setBgImage(null);
  };

  const resetAll = () => {
    applyTemplate(TEMPLATES[0]);
    setTitle('BTS');
    setSubline('BANGTAN GALLERY');
    setStrokes([]);
    setTool('off');
  };

  // ── Render ──────────────────────────────────────────────────────
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const layerRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!baseRef.current) baseRef.current = document.createElement('canvas');
    if (!layerRef.current) layerRef.current = document.createElement('canvas');
    const base = baseRef.current;
    base.width = W; base.height = H;
    const ctx = base.getContext('2d');
    if (!ctx) return;

    // Background: photo (cover) or vertical gradient of the two colors
    if (bgImage) {
      const scale = Math.max(W / bgImage.width, H / bgImage.height);
      const dw = bgImage.width * scale;
      const dh = bgImage.height * scale;
      ctx.drawImage(bgImage, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, bgColor);
      grad.addColorStop(1, bgColor2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    const u = Math.min(W, H) / 630; // unit scale
    const cx = W / 2;
    const iconY = H * 0.36;
    const r = 52 * u;
    const gap = 150 * u;

    ctx.fillStyle = iconColor;
    ctx.strokeStyle = iconColor;

    // Glyph 1 — thick ring with a solid center dot
    ctx.lineWidth = r * 0.34;
    ctx.beginPath();
    ctx.arc(cx - gap, iconY, r * 0.83, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - gap, iconY, r * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Glyph 2 — two horizontal bars
    const barW = r * 1.7;
    const barH = r * 0.34;
    ctx.beginPath();
    roundRectPath(ctx, cx - barW / 2, iconY - barH * 1.4, barW, barH, barH / 2);
    roundRectPath(ctx, cx - barW / 2, iconY + barH * 0.4, barW, barH, barH / 2);
    ctx.fill();

    // Glyph 3 — split square (two door panels)
    ctx.lineWidth = 7 * u;
    const sq = r * 1.55;
    ctx.strokeRect(cx + gap - sq / 2, iconY - sq / 2, sq, sq);
    ctx.beginPath();
    ctx.moveTo(cx + gap, iconY - sq / 2);
    ctx.lineTo(cx + gap, iconY + sq / 2);
    ctx.stroke();

    // Wordmark + subline
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleSize = 92 * u;
    ctx.font = `900 ${titleSize}px Arial, sans-serif`;
    try { (ctx as any).letterSpacing = `${18 * u}px`; } catch {}
    ctx.fillText(title || 'BTS', cx, H * 0.68);
    const subSize = 30 * u;
    ctx.font = `600 ${subSize}px Arial, sans-serif`;
    try { (ctx as any).letterSpacing = `${8 * u}px`; } catch {}
    if (subline) ctx.fillText(subline, cx, H * 0.68 + titleSize * 0.78);
    try { (ctx as any).letterSpacing = '0px'; } catch {}

    // Freehand strokes live on their own layer: the eraser punches
    // holes in the paint layer only, never in the poster beneath.
    const layer = layerRef.current!;
    layer.width = W; layer.height = H;
    const lctx = layer.getContext('2d');
    if (lctx) {
      for (const s of strokes) {
        if (s.points.length < 2) continue;
        lctx.save();
        lctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over';
        lctx.strokeStyle = s.color;
        lctx.lineWidth = s.size;
        lctx.lineCap = 'round';
        lctx.lineJoin = 'round';
        lctx.beginPath();
        lctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) lctx.lineTo(s.points[i].x, s.points[i].y);
        lctx.stroke();
        lctx.restore();
      }
    }
    const vis = canvas.getContext('2d');
    if (vis) {
      vis.clearRect(0, 0, W, H);
      vis.drawImage(base, 0, 0);
      vis.drawImage(layer, 0, 0);
    }
  }, [sizeKey, bgColor, bgColor2, iconColor, textColor, title, subline, bgImage, strokes, W, H]);

  // ── Drawing ─────────────────────────────────────────────────────
  const toCanvasPos = (e: ReactPointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };
  const onPointerDown = (e: ReactPointerEvent) => {
    if (tool === 'off') return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const s: Stroke = { color: brushColor, size: brushSize * (W / 900), erase: tool === 'eraser', points: [toCanvasPos(e)] };
    drawingRef.current = s;
    setStrokes(prev => [...prev, s]);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!drawingRef.current) return;
    const p = toCanvasPos(e);
    drawingRef.current.points.push(p);
    setStrokes(prev => [...prev.slice(0, -1), { ...drawingRef.current! }]);
  };
  const onPointerUp = () => { drawingRef.current = null; };

  const handleBgUpload = (f: File | undefined) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => setBgImage(img);
    img.src = url;
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `bangtan-comeback-poster-${Date.now()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  const colorRow = (label: string, value: string, set: (v: string) => void) => (
    <div className="space-y-1">
      <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => set(e.target.value)} className="w-9 h-9 rounded bg-transparent cursor-pointer" />
        <input
          type="text"
          value={value}
          onChange={e => set(e.target.value)}
          className="flex-1 px-2.5 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-100 font-mono text-xs uppercase"
        />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* Preview */}
      <div className="lg:col-span-7 space-y-3">
        <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest">Preview</span>
        <div className="rounded-2xl overflow-hidden border border-purple-500/15 bg-black/40">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className={`w-full h-auto block ${tool !== 'off' ? 'cursor-crosshair touch-none' : ''}`}
          />
        </div>
        <p className="text-[10px] text-slate-500 font-mono">
          {tool !== 'off' ? 'Drawing mode ON — draw directly on the poster. Turn the tool Off to stop.' : 'Tip: turn on the Brush below to draw on your poster.'}
        </p>
      </div>

      {/* Customize */}
      <div className="lg:col-span-5 space-y-4">
        <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest">Customize</span>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Size</label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(SIZES) as SizeKey[]).map(k => (
              <button
                key={k}
                onClick={() => setSizeKey(k)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${sizeKey === k ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}
              >
                {SIZES[k].label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Style Templates (optional)</label>
          <div className="grid grid-cols-4 gap-1.5">
            {TEMPLATES.map(t => (
              <button
                key={t.name}
                onClick={() => applyTemplate(t)}
                className="h-12 rounded-lg border border-white/10 cursor-pointer relative overflow-hidden"
                style={{ background: `linear-gradient(160deg, ${t.bg}, ${t.bg2})` }}
                title={t.name}
              >
                <span className="absolute inset-x-0 bottom-0.5 text-center text-[8px] font-bold" style={{ color: t.text }}>{t.name}</span>
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full" style={{ background: t.icon }} />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {colorRow('Icon Color', iconColor, setIconColor)}
          {colorRow('Logo & Text Color', textColor, setTextColor)}
          {colorRow('Background Color', bgColor, setBgColor)}
          {colorRow('Background Shade', bgColor2, setBgColor2)}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Big Text</label>
            <input type="text" value={title} maxLength={24} onChange={e => setTitle(e.target.value)} className="w-full px-2.5 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-100" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Small Line (date etc.)</label>
            <input type="text" value={subline} maxLength={48} onChange={e => setSubline(e.target.value)} className="w-full px-2.5 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-100" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Background Image (optional)</label>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleBgUpload(e.target.files?.[0])} />
          <div className="flex gap-1.5">
            <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-[11px] font-bold cursor-pointer flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Upload Image
            </button>
            {bgImage && (
              <button onClick={() => setBgImage(null)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-bold cursor-pointer">Remove</button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Drawing Tool</label>
          <div className="flex flex-wrap items-center gap-1.5">
            <button onClick={() => setTool(tool === 'brush' ? 'off' : 'brush')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1.5 ${tool === 'brush' ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
              <Paintbrush className="w-3.5 h-3.5" /> Brush
            </button>
            <button onClick={() => setTool(tool === 'eraser' ? 'off' : 'eraser')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1.5 ${tool === 'eraser' ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
              <Eraser className="w-3.5 h-3.5" /> Eraser
            </button>
            <input type="color" value={brushColor} onChange={e => setBrushColor(e.target.value)} className="w-8 h-8 rounded bg-transparent cursor-pointer" />
            <input type="range" min={2} max={30} value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-24 accent-purple-500" />
            <span className="text-[10px] text-slate-400 font-mono">{brushSize}px</span>
            <button onClick={() => setStrokes(prev => prev.slice(0, -1))} disabled={strokes.length === 0} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-bold cursor-pointer disabled:opacity-40 flex items-center gap-1">
              <Undo2 className="w-3.5 h-3.5" /> Undo
            </button>
            <button onClick={() => setStrokes([])} disabled={strokes.length === 0} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-bold cursor-pointer disabled:opacity-40 flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>

        <button onClick={download} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40">
          <Download className="w-4 h-4" /> Generate & Download
        </button>
        <button onClick={resetAll} className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
        </button>
      </div>
    </div>
  );
}
