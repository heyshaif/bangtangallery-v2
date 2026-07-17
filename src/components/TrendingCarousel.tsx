import { useRef } from 'react';
import { motion } from 'motion/react';
import { Flame, ChevronLeft, ChevronRight, Play, Heart, MessageCircle, Share2, Sparkles } from 'lucide-react';

interface TrendingItem {
  id: string;
  rank: string;
  title: string;
  creator?: string;
  subtitle?: string;
  views?: string;
  likes?: string;
  tag: string;
  thumbnail: string;
  category: string;
  categoryLabel?: string;
  description?: string;
  watchButtonText?: string;
  watchButtonLink?: string;
  externalUrl?: string;
  showButton?: boolean;
  published?: boolean;
}

interface TrendingCarouselProps {
  config?: TrendingItem[];
  onNavigate: (tab: string, payload?: any) => void;
}

export default function TrendingCarousel({ config, onNavigate }: TrendingCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const trendingListFallback: TrendingItem[] = [
    {
      id: 'trend-1',
      rank: '#1',
      title: 'Jungkook "Seven" (feat. Latto) Official MV Recording',
      creator: 'HYBE LABELS',
      views: '410M',
      likes: '12M',
      tag: 'Remix',
      thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
      category: 'YouTube',
      published: true
    },
    {
      id: 'trend-2',
      rank: '#2',
      title: 'Yet To Come - Dynamic Busan Reunion Live Stage Remaster',
      creator: 'BigHit Music Team',
      views: '84M',
      likes: '4.8M',
      tag: 'Concert',
      thumbnail: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=400&q=80',
      category: 'YouTube',
      published: true
    },
    {
      id: 'trend-3',
      rank: '#3',
      title: 'Agust D "Haegum" Haegeum Epic Traditional Remix',
      creator: 'Min Yoongi Projects',
      views: '54M',
      likes: '3.1M',
      tag: 'MV Re-release',
      thumbnail: 'https://images.unsplash.com/photo-1487180142328-054b783fc471?auto=format&fit=crop&w=400&q=80',
      category: 'Music',
      published: true
    },
    {
      id: 'trend-4',
      rank: '#4',
      title: 'Like Crazy Instrumental Synthesizer - Jimin Tribute',
      creator: 'ARMY Synth Labs',
      views: '23M',
      likes: '1.9M',
      tag: 'Fan Creation',
      thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80',
      category: 'Music',
      published: true
    },
    {
      id: 'trend-5',
      rank: '#5',
      title: 'Kim Taehyung Conceptual Artwork Collection V-Cut',
      creator: 'V Visualist Team',
      views: '19M',
      likes: '2.5M',
      tag: 'Studio Shots',
      thumbnail: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=400&q=80',
      category: 'Gallery',
      published: true
    }
  ];

  const activeTrending = (config && config.length > 0 ? config : trendingListFallback).filter(item => item.published !== false);

  const handleScroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = dir === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({
        left: offset,
        behavior: 'smooth'
      });
    }
  };

  const handleAction = (item: TrendingItem) => {
    if (item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
    } else {
      onNavigate(item.watchButtonLink || item.category);
    }
  };

  return (
    <section className="space-y-6 relative">
      {/* Decorative side blurs for cinematic masking */}
      <div className="absolute left-0 top-14 bottom-0 w-8 bg-gradient-to-r from-[#05000a] to-transparent z-20 pointer-events-none hidden md:block" />
      <div className="absolute right-0 top-14 bottom-0 w-8 bg-gradient-to-l from-[#05000a] to-transparent z-20 pointer-events-none hidden md:block" />

      {/* Header section with scroll navigation triggers */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 px-1">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-purple-400 font-bold block mb-1">
            🔥 Hot community picks
          </span>
          <h3 className="text-xl md:text-2xl font-sans font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            Trending Showcase <Flame className="w-5 h-5 text-purple-400 animate-pulse" />
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            Infinite scrollable list of trending studio remasters, fan creations, and highest rated media uploads.
          </p>
        </div>

        {/* Desktop sliding controls */}
        <div className="flex items-center gap-2 self-end">
          <button
            onClick={() => handleScroll('left')}
            className="p-1.5 md:p-2 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/35 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer shadow active:scale-90"
            title="Slide Left"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 h-5" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="p-1.5 md:p-2 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/35 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer shadow active:scale-90"
            title="Slide Right"
          >
            <ChevronRight className="w-4 h-4 md:w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Drag Carousel container */}
      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none scroll-smooth custom-scrollbar select-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {activeTrending.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ 
              y: -8,
              scale: 1.02,
              boxShadow: '0 20px 30px -10px rgba(168, 85, 247, 0.3)',
              borderColor: 'rgba(168, 85, 247, 0.35)'
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 18 }}
            className="min-w-[280px] sm:min-w-[320px] max-w-[325px] snap-start rounded-2xl border border-white/5 bg-black/45 overflow-hidden flex flex-col justify-between transition-all pointer-events-auto card-ios"
          >
            {/* Top thumbnail representation */}
            <div className="h-44 relative overflow-hidden group/thumb cursor-pointer animate-fade-in" onClick={() => handleAction(item)}>
              <img
                src={item.thumbnail}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover/thumb:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black via-black/40 to-transparent" />

              {/* Floating Rank circle */}
              <div className="absolute top-3 left-3 w-8 h-8 rounded-xl bg-gradient-to-r from-red-650 to-purple-650 shadow-md font-sans font-black text-white text-xs flex items-center justify-center border border-white/10">
                {item.rank}
              </div>

              {/* Tag overlay */}
              <div className="absolute top-3 right-3 bg-black/75 border border-white/10 backdrop-blur-md text-[9px] font-mono font-bold text-purple-300 px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" /> {item.tag}
              </div>

              {/* Center Play Circle animation */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-12 rounded-full bg-purple-600/80 border border-purple-300/40 backdrop-blur-sm flex items-center justify-center text-white shadow-lg animate-pulse">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
              </div>
            </div>

            {/* Bottom details page link */}
            <div className="p-4 flex-grow flex flex-col justify-between space-y-3.5">
              <div className="space-y-1.5 text-left">
                <span className="text-[9px] font-mono text-purple-400 uppercase font-black tracking-wider block">
                  {item.categoryLabel || item.category} channel
                </span>
                <h4 
                  onClick={() => handleAction(item)}
                  className="font-sans font-bold text-xs sm:text-sm text-slate-100 hover:text-purple-300 transition-colors cursor-pointer line-clamp-2 leading-snug"
                >
                  {item.title}
                </h4>
                {item.description && (
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 font-sans pt-0.5">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 border-t border-white/[0.04] pt-3">
                <span className="text-gray-500 font-sans font-medium shrink-0 truncate max-w-[140px]">
                  {item.subtitle || item.creator}
                </span>
                {item.showButton !== false && (
                  <button 
                    onClick={() => handleAction(item)}
                    className="hover:text-purple-300 transition-colors text-[10px] font-mono flex items-center gap-0.5 animate-pulse bg-transparent border-none cursor-pointer"
                  >
                    {item.watchButtonText || 'Watch \u2192'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
