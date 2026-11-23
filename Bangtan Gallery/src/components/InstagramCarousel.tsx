// Batch 188 — this member's own Instagram posts, embedded side by side in a
// horizontal carousel strip, newest first. Real Instagram embeds (official
// embed.js): a multi-photo post shows Instagram's own in-embed carousel, a
// reel plays in place. Only posts near the viewport load — the strip uses an
// IntersectionObserver to render each embed as it approaches, so a member
// with 200 posts never loads 200 iframes up front. The post lists live in
// their own chunk (memberInstagramPosts) and load on demand.
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Instagram } from 'lucide-react';
import {
  MEMBER_INSTAGRAM_HANDLE,
  loadMemberInstagramPosts,
  type MemberInstagramPost,
} from '../data/memberInstagram';

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

// Instagram's embed script, loaded at most once per page visit.
let embedScriptPromise: Promise<void> | null = null;
function loadEmbedScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.instgrm) return Promise.resolve();
  if (embedScriptPromise) return embedScriptPromise;
  embedScriptPromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://www.instagram.com/embed.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // embeds degrade to plain links
    document.body.appendChild(s);
  });
  return embedScriptPromise;
}

function formatPostDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function InstagramCarousel({
  memberId,
  memberName,
}: {
  memberId: string;
  memberName: string;
}) {
  const handle = MEMBER_INSTAGRAM_HANDLE[memberId];
  const [posts, setPosts] = useState<MemberInstagramPost[] | null>(null);
  const [active, setActive] = useState<Set<number>>(new Set([0, 1, 2]));
  const [progress, setProgress] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load this member's posts (own chunk) when the section mounts.
  useEffect(() => {
    let cancelled = false;
    loadMemberInstagramPosts(memberId).then((list) => {
      if (!cancelled) setPosts(list);
    });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  // Activate embeds as their slots approach the viewport (600px ahead).
  useEffect(() => {
    if (!posts || posts.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setActive((prev) => {
          const next = new Set(prev);
          let changed = false;
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx) && !next.has(idx)) {
              next.add(idx);
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      },
      { root: stripRef.current, rootMargin: '0px 600px 0px 600px', threshold: 0 }
    );
    slotRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [posts]);

  // Ask Instagram to render newly mounted embeds.
  useEffect(() => {
    if (active.size === 0) return;
    let cancelled = false;
    loadEmbedScript().then(() => {
      if (!cancelled) window.instgrm?.Embeds.process();
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  if (!handle) return null;
  if (posts === null) {
    return (
      <div className="px-6 md:px-12 pb-12 pt-8 border-t border-white/5">
        <p className="text-sm text-gray-400 font-mono">Loading Instagram posts…</p>
      </div>
    );
  }
  if (posts.length === 0) return null;

  const scrollBySlot = (dir: 1 | -1) => {
    const strip = stripRef.current;
    if (!strip) return;
    const slot = strip.querySelector<HTMLElement>('[data-slot]');
    const w = slot ? slot.offsetWidth + 16 : 360;
    strip.scrollBy({ left: dir * w, behavior: 'smooth' });
  };

  const onScroll = () => {
    const strip = stripRef.current;
    if (!strip) return;
    const max = strip.scrollWidth - strip.clientWidth;
    setProgress(max > 0 ? strip.scrollLeft / max : 0);
  };

  return (
    <div className="px-6 md:px-12 pb-12 pt-8 border-t border-white/5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-400" /> {memberName} on Instagram
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-1.5">
            @{handle} · {posts.length} posts · Newest first · Swipe to browse them all
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`https://www.instagram.com/${handle}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-pink-300 hover:text-pink-200 uppercase tracking-wider mr-1"
          >
            View profile ↗
          </a>
          <button
            onClick={() => scrollBySlot(-1)}
            aria-label="Previous Instagram posts"
            className="p-2.5 rounded-full border border-white/10 bg-purple-950/20 hover:bg-purple-900/40 text-purple-300 hover:text-white transition-all cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollBySlot(1)}
            aria-label="Next Instagram posts"
            className="p-2.5 rounded-full border border-white/10 bg-purple-950/20 hover:bg-purple-900/40 text-purple-300 hover:text-white transition-all cursor-pointer active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={stripRef}
        onScroll={onScroll}
        className="mt-6 flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(168,85,247,0.3) transparent' }}
      >
        {posts.map((post, i) => (
          <div
            key={post.url}
            data-slot
            data-index={i}
            ref={(el) => {
              slotRefs.current[i] = el;
            }}
            className="w-[300px] sm:w-[340px] shrink-0 snap-start"
          >
            {active.has(i) ? (
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-white min-h-[420px]">
                <blockquote
                  className="instagram-media"
                  data-instgrm-permalink={post.url}
                  data-instgrm-version="14"
                  style={{ margin: 0 }}
                >
                  <a href={post.url} target="_blank" rel="noopener noreferrer">
                    View this post on Instagram
                  </a>
                </blockquote>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] min-h-[420px] flex flex-col items-center justify-center gap-3 p-6 text-center">
                <Instagram className="w-8 h-8 text-purple-400/60" />
                <p className="text-sm font-bold text-white">@{handle}</p>
                <p className="text-xs text-gray-400 font-mono">{formatPostDate(post.date)}</p>
                <p className="text-[11px] text-gray-500">Post {i + 1} of {posts.length}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Scroll progress */}
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-200"
          style={{ width: `${Math.max(4, progress * 100)}%` }}
        />
      </div>
      <p className="text-[11px] text-gray-500 font-mono mt-3">
        Posts load from Instagram as you scroll — multi-photo posts swipe inside their own card.
      </p>
    </div>
  );
}
