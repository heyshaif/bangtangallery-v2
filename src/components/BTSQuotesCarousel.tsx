/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll } from 'motion/react';
import { Quote as QuoteIcon, Sparkles, Music, ChevronLeft, ChevronRight, Play, Pause, RefreshCw } from 'lucide-react';

interface QuoteItem {
  id: string;
  author: string;
  emoji: string;
  text: string;
  type: 'Quote' | 'Lyric';
  song: string;
  bgColor: string;
  avatarUrl: string;
}

const QUOTES_DATA: QuoteItem[] = [
  {
    id: 'q1',
    author: 'RM',
    emoji: '🐨',
    text: "Please use me. Please use BTS to love yourself. Because you guys helped me learn to love myself.",
    type: 'Quote',
    song: 'Love Yourself Tour Epilogue',
    bgColor: 'from-amber-500/10 to-purple-600/15 border-amber-500/20 hover:border-amber-500/40',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80' // stylized representation node
  },
  {
    id: 'q2',
    author: 'Jin',
    emoji: '🐹',
    text: "Your presence can give happiness. I hope you remember that. Even if you feel down, remember you are beautiful.",
    type: 'Quote',
    song: 'Epiphany Wisdom Recital',
    bgColor: 'from-pink-500/10 to-purple-600/15 border-pink-500/20 hover:border-pink-500/40',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'q3',
    author: 'Suga',
    emoji: '🐱',
    text: "Life is tough, and things don't always work out well, but we should be brave and go on with our lives.",
    type: 'Quote',
    song: 'Agust D Live Diary',
    bgColor: 'from-blue-500/10 to-purple-600/15 border-blue-500/20 hover:border-blue-500/40',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'q4',
    author: 'j-hope',
    emoji: '🐿️',
    text: "If you don't work hard, there won't be good results. I believe that sweat never betrays.",
    type: 'Quote',
    song: 'Hope World Memoirs',
    bgColor: 'from-emerald-500/10 to-purple-600/15 border-emerald-500/20 hover:border-emerald-500/40',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'q5',
    author: 'Jimin',
    emoji: '🐥',
    text: "Go on your path, even if you live for a day. Do something. Put away your weakness.",
    type: 'Quote',
    song: 'Live Reflection Series',
    bgColor: 'from-cyan-500/10 to-purple-600/15 border-cyan-500/20 hover:border-cyan-500/40',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'q6',
    author: 'V',
    emoji: '🐯',
    text: "Don't be trapped in someone else's dream. Be yourself and create your own spectacular colors.",
    type: 'Quote',
    song: 'Inner Child Reflections',
    bgColor: 'from-indigo-500/10 to-purple-600/15 border-indigo-500/20 hover:border-indigo-500/40',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'q7',
    author: 'Jung Kook',
    emoji: '🐰',
    text: "Living without passion is like being dead. Sweat and dedication are the true languages of growth.",
    type: 'Quote',
    song: 'My Time Philosophy',
    bgColor: 'from-rose-500/10 to-purple-600/15 border-rose-500/20 hover:border-rose-500/40',
    avatarUrl: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'l1',
    author: 'BTS',
    emoji: '💥',
    text: "The dawn right before the sun rises is the darkest. Look up at the starlight route and run forward.",
    type: 'Lyric',
    song: 'Tomorrow (Album: Skool Luv Affair)',
    bgColor: 'from-purple-500/10 to-pink-600/15 border-purple-500/25 hover:border-purple-400/40',
    avatarUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'l2',
    author: 'BTS',
    emoji: '💜',
    text: "We will find a way, we always have. You and I, we are bulletproof together forever.",
    type: 'Lyric',
    song: 'We Are Bulletproof: The Eternal',
    bgColor: 'from-fuchsia-500/10 to-violet-600/15 border-fuchsia-500/25 hover:border-fuchsia-400/40',
    avatarUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'l3',
    author: 'RM',
    emoji: '🐨',
    text: "Even if you're not perfect, you're a limited edition. No one else has your specific light.",
    type: 'Quote',
    song: 'Do You Solo Release',
    bgColor: 'from-amber-500/10 to-purple-600/15 border-amber-500/20 hover:border-amber-500/40',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'l4',
    author: 'Suga',
    emoji: '🐱',
    text: "May your trials end in full bloom. Dream, though your beginnings may be humble, may your end be prosperous.",
    type: 'Lyric',
    song: 'So Far Away (First Mixtape)',
    bgColor: 'from-blue-500/10 to-purple-600/15 border-blue-500/20 hover:border-blue-500/40',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'
  }
];

export default function BTSQuotesCarousel() {
  const [isPlaying, setIsPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto Scroll logic (simulating continuous loop marquee but allowing pause and swipe)
  useEffect(() => {
    if (isPlaying) {
      startScrolling();
    } else {
      stopScrolling();
    }
    return () => stopScrolling();
  }, [isPlaying]);

  const startScrolling = () => {
    stopScrolling();
    scrollIntervalRef.current = setInterval(() => {
      if (containerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
        // If we reach near the end, reset scroll back to beginning gently
        if (scrollLeft + clientWidth >= scrollWidth - 5) {
          containerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          containerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
        }
      }
    }, 4500); // Shift every 4.5 seconds for readable pace
  };

  const stopScrolling = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }
  };

  // Helper functions for manual controls
  const handleScrollNext = () => {
    stopScrolling();
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        containerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        containerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
      }
    }
    if (isPlaying) startScrolling();
  };

  const handleScrollPrev = () => {
    stopScrolling();
    if (containerRef.current) {
      const { scrollLeft } = containerRef.current;
      if (scrollLeft <= 5) {
        containerRef.current.scrollTo({ left: containerRef.current.scrollWidth, behavior: 'smooth' });
      } else {
        containerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
      }
    }
    if (isPlaying) startScrolling();
  };

  // Double data to enable smooth looping/infinite layout feel
  const doubledQuotes = [...QUOTES_DATA, ...QUOTES_DATA];

  return (
    <div className="w-full bg-[#070110]/95 border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-[0_15px_40px_rgba(236,72,153,0.05)]">
      {/* Visual neon spotlights */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header section with toggle and arrows */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.04] pb-5 mb-6">
        <div>
          <span className="p-1 px-2.5 rounded-full bg-pink-500/10 text-pink-400 font-mono text-[9px] font-bold uppercase tracking-widest border border-pink-500/15">
            Voice & Harmony Studio
          </span>
          <h2 className="text-xl md:text-2xl font-sans font-extrabold text-white mt-1 flex items-center gap-2 tracking-tight">
            Golden Quotes & Lyrics <Music className="w-5 h-5 text-pink-400" />
          </h2>
          <p className="text-gray-400 text-xs mt-0.5 font-sans">
            Inspirational memoirs, live reflections, and bulletproof lyrics crafted by the members of BTS.
          </p>
        </div>

        {/* Dynamic Controls bar */}
        <div className="flex items-center gap-2">
          {/* Play/Pause control */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-xl transition-all border cursor-pointer active:scale-95 flex items-center justify-center ${
              isPlaying 
                ? 'bg-purple-950/40 border-purple-500/20 text-purple-400 hover:bg-purple-900/30' 
                : 'bg-pink-950/40 border-pink-500/20 text-pink-400 hover:bg-pink-900/30'
            }`}
            title={isPlaying ? "Pause auto-loop scroll" : "Play auto-loop scroll"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 animate-pulse" />}
          </button>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={handleScrollPrev}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleScrollNext}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CONTINUOUS AUTO-PLAY SWIPABLE MARQUEE PORT */}
      <div 
        ref={containerRef}
        onMouseEnter={() => stopScrolling()}
        onMouseLeave={() => { if (isPlaying) startScrolling(); }}
        className="relative z-10 flex gap-5 overflow-x-auto scrollbar-none py-3 px-1 snap-x scroll-smooth cursor-grab active:cursor-grabbing select-none"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {doubledQuotes.map((q, idx) => (
          <div
            key={`${q.id}-${idx}`}
            className={`shrink-0 w-[290px] sm:w-[320px] rounded-2xl bg-gradient-to-br ${q.bgColor} border backdrop-blur-sm p-6 flex flex-col justify-between space-y-5 transition-all duration-300 scale-95 hover:scale-100 relative group/card shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-purple-500/10 snap-center`}
          >
            {/* Top quote marker with float decoration */}
            <div className="flex justify-between items-start">
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest bg-white/[0.03] text-gray-400 border border-white/5`}>
                {q.type}
              </span>
              <QuoteIcon className="w-7 h-7 text-white/10 group-hover/card:text-pink-400/20 group-hover/card:rotate-12 transition-all duration-500 transform scale-y-[-1]" />
            </div>

            {/* Inner quote text content */}
            <div className="flex-grow space-y-2">
              <p className="text-gray-200 text-sm font-sans italic leading-relaxed tracking-wide select-none group-hover/card:text-white transition-colors">
                " {q.text} "
              </p>
            </div>

            {/* Footer segment: Member Profile and Source Song/Event details */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/[0.04]">
              {/* Member stylized face mock preview */}
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                <div className="absolute inset-0 bg-purple-900/60 flex items-center justify-center text-xs font-mono font-bold text-white select-none">
                  {q.emoji}
                </div>
              </div>

              {/* Text description */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-xs font-sans font-extrabold text-white group-hover/card:text-pink-300 transition-colors">
                    {q.author}
                  </span>
                  <span className="text-[10px] select-none text-pink-400 font-bold">{q.emoji}</span>
                </div>
                <span className="text-[9px] font-mono text-gray-500 block truncate mt-1 select-none">
                  Source: {q.song}
                </span>
              </div>
            </div>

            {/* Floating starlight element */}
            <div className="absolute top-2 right-4 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none">
              <Sparkles className="w-3.5 h-3.5 text-pink-300 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom hint bar */}
      <div className="text-center mt-4">
        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
          💖 Swipe or drag horizontally to browse &bull; Pause on hover enabled
        </p>
      </div>
    </div>
  );
}
