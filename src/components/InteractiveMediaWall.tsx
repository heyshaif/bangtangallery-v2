import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, ExternalLink, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface WeversePost {
  id: string;
  name: string;
  profileImg: string;
  postText: string;
  postImg: string;
  weverseLink: string;
  emoji: string;
  customDate?: string;
}

interface InteractiveMediaWallProps {
  config?: any;
  onTileClick?: (tab: string, payload?: any) => void;
}

export default function InteractiveMediaWall({ config, onTileClick }: InteractiveMediaWallProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedPost, setSelectedPost] = useState<WeversePost | null>(null);

  const defaultWeversePosts: WeversePost[] = [
    {
      id: 'rm',
      name: 'RM',
      profileImg: 'https://i.pinimg.com/736x/54/2c/1f/542c1f883a3bd13ec106c26648607235.jpg',
      postText: "Let's live while seeing beautiful things in this world. Indigo is out! 💜 Doing some Namjooning in the galleries.",
      postImg: 'https://i.pinimg.com/1200x/01/c4/58/01c4582f586e3be1514f4875b2a2b944.jpg',
      weverseLink: 'https://weverse.io/bts/artist/rm',
      emoji: '🐨'
    },
    {
      id: 'jin',
      name: 'Jin',
      profileImg: 'https://i.pinimg.com/736x/71/1d/ef/711def665b44d2a7cc6fb87c05c67d21.jpg',
      postText: "ARMY, did you eat delicious food? Worldwide handsome is here to bless your feed! 🍜 Get ready for my special single.",
      postImg: 'https://i.pinimg.com/1200x/01/c4/58/01c4582f586e3be1514f4875b2a2b944.jpg',
      weverseLink: 'https://weverse.io/bts/artist/jin',
      emoji: '🐹'
    },
    {
      id: 'suga',
      name: 'SUGA',
      profileImg: 'https://i.pinimg.com/736x/8e/a1/97/8ea19755ac88dbb212fa0cd1a520b1ca.jpg',
      postText: "Working hard in the studio today. D-DAY tour memories are still fresh in my heart. Rock on! 🎹 Let's create together.",
      postImg: 'https://i.pinimg.com/1200x/01/c4/58/01c4582f586e3be1514f4875b2a2b944.jpg',
      weverseLink: 'https://weverse.io/bts/artist/suga',
      emoji: '🐱'
    },
    {
      id: 'jhope',
      name: 'j-hope',
      profileImg: 'https://i.pinimg.com/736x/fa/64/15/fa6415c33f4e45d96d40178b26749ece.jpg',
      postText: "Hope right here! ARMY, are you smiling today? Always remember I am your hope, you are my hope! ☀️ Live dance stream soon!",
      postImg: 'https://i.pinimg.com/1200x/01/c4/58/01c4582f586e3be1514f4875b2a2b944.jpg',
      weverseLink: 'https://weverse.io/bts/artist/j-hope',
      emoji: '🐿️'
    },
    {
      id: 'jimin',
      name: 'Jimin',
      profileImg: 'https://i.pinimg.com/736x/95/ae/24/95ae248bf13dcb912809e3a34e05210f.jpg',
      postText: "Your warm thoughts are always with me. I hope you have a beautiful night, my angels. Always stay healthy and happy! 🌸",
      postImg: 'https://i.pinimg.com/1200x/01/c4/58/01c4582f586e3be1514f4875b2a2b944.jpg',
      weverseLink: 'https://weverse.io/bts/artist/jimin',
      emoji: '🐥'
    },
    {
      id: 'v',
      name: 'V',
      profileImg: 'https://i.pinimg.com/736x/c7/e4/22/c7e42240811e1cb8f07dd0f441da8c69.jpg',
      postText: "Yeontan says hello. Listening to classic jazz on a rainy day. Take care of your health, ARMY! 🎷 Enjoying the quiet times.",
      postImg: 'https://i.pinimg.com/1200x/01/c4/58/01c4582f586e3be1514f4875b2a2b944.jpg',
      weverseLink: 'https://weverse.io/bts/artist/v',
      emoji: '🐯'
    },
    {
      id: 'jungkook',
      name: 'Jung Kook',
      profileImg: 'https://i.pinimg.com/736x/8d/c6/46/8dc64647c2f6fc97396735d3c19e4ee8.jpg',
      postText: "Late night singing live for you guys. ARMY, what songs are you listening to right now? Missing you all so much. 🎤",
      postImg: 'https://i.pinimg.com/1200x/01/c4/58/01c4582f586e3be1514f4875b2a2b944.jpg',
      weverseLink: 'https://weverse.io/bts/artist/jungkook',
      emoji: '🐰'
    },
    {
      id: 'bts',
      name: 'BTS Group',
      profileImg: 'https://i.pinimg.com/1200x/01/c4/58/01c4582f586e3be1514f4875b2a2b944.jpg',
      postText: "We had only seven. But we have you all now. Thank you for walking this bulletproof path with us! Borahae! ⟭⟬⁷",
      postImg: 'https://i.pinimg.com/1200x/01/c4/58/01c4582f586e3be1514f4875b2a2b944.jpg',
      weverseLink: 'https://weverse.io/bts/feed',
      emoji: '💜'
    }
  ];

  const weversePosts: WeversePost[] = (config && Array.isArray(config) && config.length > 0)
    ? config
    : defaultWeversePosts;

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 360; // scroll slightly more than one card width for smooth feel
      const newScrollLeft = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  function getPostDate(post: WeversePost): string {
    if (post.customDate) return post.customDate;
    const dates: Record<string, string> = {
      rm: 'Jul 05, 2026',
      jin: 'Jul 04, 2026',
      suga: 'Jul 03, 2026',
      jhope: 'Jul 02, 2026',
      jimin: 'Jul 01, 2026',
      v: 'Jun 30, 2026',
      jungkook: 'Jun 29, 2026',
      bts: 'Jun 28, 2026'
    };
    return dates[post.id] || 'Jul 07, 2026';
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPost(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <section className="relative overflow-hidden py-14 border border-white/10 rounded-3xl bg-gradient-to-b from-[#0a0014]/60 to-black/80 backdrop-blur-md">
      {/* Visual floating neon bubbles around the showcase */}
      <div className="absolute top-1/4 -left-12 w-48 h-48 rounded-full bg-purple-600/10 blur-[60px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-12 w-48 h-48 rounded-full bg-rose-600/10 blur-[60px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-purple-400 font-bold block mb-1">
            📱 Weverse Feed
          </span>
          <h2 className="text-2xl md:text-3xl font-sans font-black text-white uppercase tracking-wider flex items-center gap-2">
            Latest Weverse Posts <Flame className="w-5 h-5 text-red-500 animate-pulse" />
          </h2>
          <p className="text-gray-400 text-xs mt-1 md:max-w-xl">
            Real-time interactive fan portal streams directly from the official septet profiles and BTS group feed.
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
          <div className="text-right hidden md:block mr-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Interactive Stream</span>
            <span className="text-xs text-purple-400 font-bold flex items-center gap-1.5 mt-0.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" /> Live Syncing
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => handleScroll('left')}
              className="p-2.5 rounded-full border border-white/10 bg-purple-950/20 hover:bg-purple-900/40 text-purple-300 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
              aria-label="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="p-2.5 rounded-full border border-white/10 bg-purple-950/20 hover:bg-purple-900/40 text-purple-300 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
              aria-label="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal snapping list */}
      <div className="relative max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div 
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-6 scroll-smooth snap-x snap-mandatory pr-6"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(168,85,247,0.3) transparent'
          }}
        >
          {weversePosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{
                scale: 1.03,
                y: -6,
                transition: { duration: 0.25, ease: 'easeOut' }
              }}
              onClick={() => setSelectedPost(post)}
              className="group relative rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-end h-[280px] cursor-pointer w-[280px] sm:w-[320px] shrink-0 snap-start transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]"
            >
              {/* Post Image as Background */}
              <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl pointer-events-none">
                <img
                  src={post.postImg}
                  alt={`${post.name} post attachment`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                {/* Dark Overlay (Opacity 30% - 40%) */}
                <div className="absolute inset-0 bg-black/35 group-hover:bg-black/50 transition-colors duration-500" />
              </div>

              {/* Foreground Content Card Overlay - Placed at the bottom */}
              <div className="relative z-10 p-5 flex flex-col items-start w-full bg-gradient-to-t from-black/95 via-black/45 to-transparent pt-10">
                {/* Member Name and Verified Badge */}
                <div className="flex items-center gap-2 mb-1">
                  {post.profileImg && (
                    <img
                      src={post.profileImg}
                      alt={post.name}
                      className="w-5 h-5 rounded-full object-cover border border-purple-500/40 shrink-0 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="flex items-center gap-1">
                    <h4 className="font-sans font-black text-xs text-white tracking-wide flex items-center gap-1 leading-none">
                      {post.name} {post.emoji && <span className="text-xs shrink-0">{post.emoji}</span>}
                    </h4>
                    {/* Verified Badge */}
                    <span className="inline-flex items-center justify-center text-purple-400 shrink-0" title="Verified Artist">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Post Date */}
                <span className="text-[11px] text-zinc-300/90 font-mono mt-1 block">
                  {getPostDate(post)}
                </span>

                {/* Card "View Post" Button (only visible if weverseLink is present) */}
                {post.weverseLink && (
                  <a
                    href={post.weverseLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevents opening modal
                    }}
                    className="mt-2 inline-flex items-center justify-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold rounded-lg transition-all duration-300 hover:shadow-md hover:shadow-purple-500/20 hover:scale-105 active:scale-95 shrink-0"
                  >
                    View Post
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="text-center mt-6 relative z-10">
        <span className="text-[9px] font-mono text-purple-400 py-1 px-3 border border-purple-500/20 bg-purple-950/20 rounded-full tracking-wider uppercase">
          🔮 Swipe or use controls above to navigate Weverse posts • Tap any card to open premium interactive view 🌠
        </span>
      </div>

      {/* Premium Preview Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside
              className="relative w-full max-w-3xl bg-[#120a2c] border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_0_50px_rgba(168,85,247,0.3)] z-10 max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible"
            >
              {/* Close Button (X) */}
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-black/80 text-zinc-400 hover:text-white border border-white/10 transition-all duration-200 cursor-pointer hover:scale-110"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Big Post Image */}
              <div className="w-full md:w-1/2 h-[260px] md:h-[480px] relative overflow-hidden shrink-0 bg-black">
                <img
                  src={selectedPost.postImg}
                  alt={`${selectedPost.name} post full`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden" />
              </div>

              {/* Post Details (Right side) */}
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between bg-gradient-to-b from-[#180d30] to-black/40">
                <div>
                  {/* Header info */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <img
                      src={selectedPost.profileImg}
                      alt={selectedPost.name}
                      className="w-8 h-8 rounded-full object-cover border border-purple-500/30"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-sans font-black text-base text-white tracking-wide">
                          {selectedPost.name}
                        </span>
                        {selectedPost.emoji && <span className="text-sm shrink-0">{selectedPost.emoji}</span>}
                        {/* Verified Badge */}
                        <span className="inline-flex items-center justify-center text-purple-400" title="Verified Artist">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </span>
                      </div>
                      <span className="text-[10px] text-purple-400 font-mono block leading-none mt-0.5">
                        Official Weverse Account
                      </span>
                    </div>
                  </div>

                  {/* Post Date */}
                  <span className="text-xs text-zinc-400 font-mono mb-4 block">
                    Posted on {getPostDate(selectedPost)}
                  </span>

                  {/* Post Content */}
                  <div className="mt-4">
                    <h5 className="text-[10px] uppercase font-mono tracking-wider text-purple-400 font-bold mb-2">
                      Post Content
                    </h5>
                    <div className="text-sm text-slate-200 leading-relaxed max-h-[160px] md:max-h-[240px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-transparent">
                      <p className="whitespace-pre-line">{selectedPost.postText}</p>
                    </div>
                  </div>
                </div>

                {/* Modal Footer with Action/Redirect */}
                {selectedPost.weverseLink && (
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <a
                      href={selectedPost.weverseLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white text-xs md:text-sm font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 active:scale-95 text-center"
                    >
                      Open Original Post on Weverse
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
