/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Admin quick-add for member Weverse posts.
 *
 * Weverse offers no public API or embed, so when a member posts on
 * Weverse the site owner pastes the post here (text, optional photo
 * URL, and the original Weverse post link) and presses Publish — the
 * post then appears on that member's profile page under their Weverse
 * Profile card. Nothing is fetched or faked automatically; every post
 * in the feed was added by the owner from the real post.
 */

import { useRef, useState } from 'react';

export interface WeverseFeedPost {
  id: string;
  memberId: string;
  name: string;
  emoji: string;
  text: string;
  imageUrl?: string;
  link?: string;
  date: string;
  createdAt: number;
}

const MEMBER_OPTIONS = [
  { id: 'rm', name: 'RM', emoji: '🐨' },
  { id: 'jin', name: 'Jin', emoji: '🐹' },
  { id: 'suga', name: 'SUGA', emoji: '🐱' },
  { id: 'jhope', name: 'j-hope', emoji: '🐿️' },
  { id: 'jimin', name: 'Jimin', emoji: '🐥' },
  { id: 'v', name: 'V', emoji: '🐯' },
  { id: 'jungkook', name: 'Jung Kook', emoji: '🐰' },
  { id: 'bts', name: 'BTS Group', emoji: '💜' }
];

interface Props {
  feed: WeverseFeedPost[];
  onChange: (next: WeverseFeedPost[]) => void;
}

export default function WeverseFeedQuickAdd({ feed, onChange }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [memberId, setMemberId] = useState('rm');
  const [date, setDate] = useState(today);
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [link, setLink] = useState('');
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo upload — the same pipeline the Admin Panel's image fields
  // use (optimize in the browser, then POST /api/admin/media/upload);
  // the returned URL is stored on the post exactly like a pasted URL.
  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadMsg('❌ Only image files, please (.jpg, .png, .webp, .gif)');
      return;
    }
    setUploading(true);
    setUploadMsg('Processing photo…');
    try {
      const readAsDataUrl = () =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      let base64 = '';
      const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
      const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
      if (isGif || isSvg || file.size < 1024 * 1024) {
        base64 = await readAsDataUrl();
      } else {
        const raw = await readAsDataUrl();
        base64 = await new Promise<string>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_SIZE = 1000;
            if (width > height) {
              if (width > MAX_SIZE) { height = Math.round((height * MAX_SIZE) / width); width = MAX_SIZE; }
            } else if (height > MAX_SIZE) { width = Math.round((width * MAX_SIZE) / height); height = MAX_SIZE; }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.72));
            } else resolve(raw);
          };
          img.onerror = () => resolve(raw);
          img.src = raw;
        });
      }
      setUploadMsg('Uploading photo… 📡');
      // Hard client-side timeout: the button must never spin forever.
      const res = await Promise.race([
        fetch('/api/admin/media/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': (window as any).btsAdminToken || localStorage.getItem('bts_admin_token') || ''
          },
          body: JSON.stringify({
            filename: file.name,
            base64,
            type: file.type || 'image/jpeg',
            size: `${Math.round(file.size / 1024)} KB`,
            category: 'Weverse'
          })
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('upload timeout')), 45000))
      ]);
      if (!res.ok) throw new Error('upload failed');
      const uploaded = await res.json();
      let finalUrl: string = uploaded.url || '';
      if (finalUrl.includes('/api/media/serve/')) {
        const mediaId = finalUrl.split('/api/media/serve/').pop();
        finalUrl = `/api/media/serve/${mediaId}`;
      }
      if (finalUrl.startsWith('/')) {
        const baseUrl = (import.meta as any).env?.VITE_API_URL || window.location.origin;
        finalUrl = (baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl) + finalUrl;
      }
      if (!finalUrl) throw new Error('no url returned');
      setImageUrl(finalUrl);
      setUploadMsg('✅ Photo uploaded!');
    } catch {
      setUploadMsg('❌ Upload failed — try again, or paste the photo URL instead.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const posts = Array.isArray(feed) ? feed : [];

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Paste the post text first.');
      return;
    }
    const member = MEMBER_OPTIONS.find((m) => m.id === memberId) || MEMBER_OPTIONS[0];
    const post: WeverseFeedPost = {
      id: `wv-${Date.now()}`,
      memberId: member.id,
      name: member.name,
      emoji: member.emoji,
      text: trimmed,
      imageUrl: imageUrl.trim() || undefined,
      link: link.trim() || undefined,
      date: date || today,
      createdAt: Date.now()
    };
    onChange([post, ...posts]);
    setText('');
    setImageUrl('');
    setLink('');
    setError('');
    setAdded(true);
    window.setTimeout(() => setAdded(false), 3000);
  };

  const handleDelete = (id: string) => {
    onChange(posts.filter((p) => p.id !== id));
  };

  const inputCls =
    'w-full px-3 py-2 bg-[#0a0516] border border-purple-500/15 rounded-lg text-white text-sm placeholder:text-gray-500';
  const labelCls = 'text-[10px] font-mono text-purple-300 uppercase font-bold block mb-1';

  return (
    <div className="p-5 rounded-xl border border-emerald-400/25 bg-[#0a1a14]/60 backdrop-blur-md space-y-4">
      <div>
        <h3 className="text-base font-black text-white uppercase tracking-wide">
          ➕ Add a New Weverse Post — Easy
        </h3>
        <p className="text-xs text-emerald-200/70 mt-1 leading-relaxed">
          When a member posts something new on Weverse: paste the post text here, optionally add
          a photo and the original post link, press <b className="text-white">Add Post</b>, then
          <b className="text-white">Publish</b> at the top — the post will appear on that member's
          profile page. (Weverse cannot be auto-fetched, so posts are added by pasting.)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Member</label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className={inputCls}
          >
            {MEMBER_OPTIONS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Post Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Post Text (copy & paste it from Weverse)</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Paste the member's post text here…"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Post Photo (optional — upload or URL)</label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Paste a photo URL, or upload below"
            className={inputCls}
          />
          <div className="flex items-center gap-3 mt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhotoUpload(f);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-purple-500/25"
            >
              {uploading ? 'Uploading…' : '📤 Upload Photo'}
            </button>
            {imageUrl && (
              <>
                <img src={imageUrl} alt="Post photo preview" className="w-11 h-11 rounded-lg object-cover border border-white/15" />
                <button
                  type="button"
                  onClick={() => { setImageUrl(''); setUploadMsg(''); }}
                  className="px-2 py-1 rounded bg-red-950/60 border border-red-500/30 text-red-300 text-[10px] font-bold uppercase tracking-wider hover:bg-red-900/60 cursor-pointer"
                >
                  ✕ Remove
                </button>
              </>
            )}
          </div>
          {uploadMsg && <p className="text-[11px] text-emerald-200/80 mt-1.5">{uploadMsg}</p>}
        </div>
        <div>
          <label className={labelCls}>Weverse Post Link (optional)</label>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://weverse.io/bts/artist/…"
            className={inputCls}
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}
      {added && <p className="text-xs text-emerald-300 font-semibold">✅ Post added! Press Publish at the top to show it on the site.</p>}

      <button
        type="button"
        onClick={handleAdd}
        className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#052e1f] text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-emerald-500/25"
      >
        Add Post
      </button>

      {posts.length > 0 && (
        <div className="pt-2 border-t border-white/10 space-y-2">
          <p className="text-[10px] font-mono text-purple-300 uppercase font-bold">
            Added Posts ({posts.length}) — press Publish to show them on the site
          </p>
          {posts.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-black/30 border border-white/5">
              {p.imageUrl && (
                <img src={p.imageUrl} alt="" className="w-11 h-11 shrink-0 rounded-lg object-cover border border-white/10" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white">
                  {p.emoji} {p.name} <span className="text-gray-400 font-mono font-normal">· {p.date}</span>
                </p>
                <p className="text-xs text-gray-300 mt-1 line-clamp-2">{p.text}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(p.id)}
                className="shrink-0 px-2.5 py-1 rounded bg-red-950/60 border border-red-500/30 text-red-300 text-[10px] font-bold uppercase tracking-wider hover:bg-red-900/60 cursor-pointer"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
