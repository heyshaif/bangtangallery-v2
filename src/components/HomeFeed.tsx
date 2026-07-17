import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Youtube, Newspaper, Calendar, Search, 
  ExternalLink, Video, BookOpen, Clock, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getYoutubeEmbedUrl, getYoutubeVideoId } from './youtubeUtils';

interface HomeFeedProps {
  config?: any;
}

interface FeedItem {
  id: string;
  type: 'video' | 'news';
  title: string;
  description: string;
  thumbnailUrl: string;
  publishDate: string;
  // Video specific
  embedUrl?: string; 
  // News specific
  newsLink?: string;
  category?: string;
  rawDate: Date;
}

export default function HomeFeed({ config }: HomeFeedProps) {
  const [localConfig, setLocalConfig] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'videos' | 'news'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dual loading: parse from props, or fetch via API for bulletproof live sync fallback
  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config/published');
        if (res.ok) {
          const data = await res.json();
          setLocalConfig(data);
        }
      } catch (err) {
        console.warn('Failed to sync feed configs inside HomeFeed.', err);
      }
    };

    fetchConfig();
    const interval = setInterval(fetchConfig, 4000); // 4s polling for absolute real-time live-update!
    return () => clearInterval(interval);
  }, []);

  // Format date safely for sorting
  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date(0);
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };

  // Build Unified lists
  const getUnifiedFeed = (): FeedItem[] => {
    const feed: FeedItem[] = [];
    const source = localConfig || config;
    if (!source) return [];

    // Parse Videos from CMS
    if (Array.isArray(source.videos)) {
      source.videos.forEach((vid: any) => {
        // Respect Publish/Unpublish status (only show if published is not explicitly false)
        if (vid.published !== false) {
          const videoId = getYoutubeVideoId(vid.url || '');
          const fallbackThumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600';
          
          feed.push({
            id: vid.id || `vid-${Date.now()}-${Math.random()}`,
            type: 'video',
            title: vid.title || 'Untitled Video',
            description: vid.description || 'No description provided.',
            thumbnailUrl: vid.imageUrl || fallbackThumbnail,
            publishDate: vid.uploadedAt || vid.date || 'August 21, 2020',
            embedUrl: getYoutubeEmbedUrl(vid.url || ''),
            rawDate: parseDate(vid.uploadedAt || vid.date || '')
          });
        }
      });
    }

    // Parse News from CMS
    if (Array.isArray(source.news)) {
      source.news.forEach((n: any) => {
        // Respect Publish/Unpublish status
        if (n.published !== false) {
          feed.push({
            id: n.id || `news-${Date.now()}-${Math.random()}`,
            type: 'news',
            title: n.title || 'Untitled Article',
            description: n.summary || n.content || 'No details specified.',
            thumbnailUrl: n.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
            publishDate: n.date || 'Jun 13, 2026',
            newsLink: n.link || n.newsLink || '',
            category: n.category || 'Announcement',
            rawDate: parseDate(n.date || '')
          });
        }
      });
    }

    // Sort chronologically (latest first)
    return feed.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
  };

  const unifiedFeed = getUnifiedFeed();

  // Filter items
  let filteredFeed: FeedItem[] = [];
  const q = searchQuery.toLowerCase().trim();

  const getMatchesSearch = (item: FeedItem) => {
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  };

  if (activeFilter === 'all') {
    // Show only the 1 most recent video and 1 most recent news article matching the search
    const matchedVideos = unifiedFeed.filter(item => item.type === 'video' && getMatchesSearch(item));
    const matchedNews = unifiedFeed.filter(item => item.type === 'news' && getMatchesSearch(item));
    
    const result: FeedItem[] = [];
    if (matchedVideos.length > 0) result.push(matchedVideos[0]);
    if (matchedNews.length > 0) result.push(matchedNews[0]);
    
    // Sort combined result chronologically latest first
    filteredFeed = result.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
  } else {
    const targetType = activeFilter === 'videos' ? 'video' : 'news';
    filteredFeed = unifiedFeed.filter(item => item.type === targetType && getMatchesSearch(item));
  }

  return (
    <div id="home-controlled-feed" className="space-y-8 animate-fade-in relative z-10 font-sans">
      
      {/* HEADER CMS DECK */}
      <div className="p-6 rounded-3xl border border-purple-500/10 bg-[#090412]/80 backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-[10px] font-mono text-purple-400 tracking-widest uppercase flex items-center gap-1.5 mb-1.5">
            🌌 DYNAMIC FAN HUB <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse fill-purple-400/20" />
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">
            Official Broadcasts & Streams
          </h2>
          <p className="text-gray-400 text-xs max-w-xl">
            Live updates curated from the Admin Control Panel. Enjoy official stream reveals, exclusive comeback news, and anniversary announcements in real-time.
          </p>
        </div>

        {/* Global Statistics Indicators */}
        <div className="grid grid-cols-2 gap-6 border-l border-white/10 pl-6 text-xs font-mono">
          <div>
            <span className="text-gray-500 block uppercase">Video releases</span>
            <span className="text-red-400 mt-0.5 font-bold block">
              {unifiedFeed.filter(x => x.type === 'video').length} Live
            </span>
          </div>
          <div>
            <span className="text-gray-500 block uppercase">News articles</span>
            <span className="text-yellow-400 mt-0.5 font-bold block">
              {unifiedFeed.filter(x => x.type === 'news').length} Live
            </span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-b border-white/5 pb-5">
        
        {/* Navigation tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all' as const, label: 'All Updates', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'videos' as const, label: 'Video Releases', icon: <Video className="w-3.5 h-3.5" /> },
            { id: 'news' as const, label: 'News Feed', icon: <BookOpen className="w-3.5 h-3.5" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-purple-900/40 border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                  : 'bg-black/25 border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Live Instant Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feed records..."
            className="w-full text-xs bg-black/40 text-slate-200 pl-10 pr-4 py-2 border border-purple-500/10 rounded-xl focus:border-purple-500/45 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* DYNAMIC CMS LIST RENDERING */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredFeed.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="p-5 md:p-6 rounded-3xl border border-purple-500/5 bg-[#090312]/50 hover:bg-[#0d071a]/60 hover:border-purple-500/15 transition-all duration-300 group flex flex-col md:flex-row gap-5 md:gap-7 items-stretch"
            >
              
              {/* Left Column: Visual Media Display */}
              <div className="w-full md:w-[320px] shrink-0 aspect-video rounded-2xl overflow-hidden border border-white/5 bg-black relative shadow-lg">
                {item.type === 'video' && item.embedUrl ? (
                  <iframe
                    src={`${item.embedUrl}?autoplay=0&muted=1`}
                    title={item.title}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                )}
                
                {/* Visual Category overlay tag */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider shadow-md ${
                    item.type === 'video' 
                      ? 'bg-red-950/80 text-red-400 border border-red-500/25' 
                      : 'bg-amber-950/80 text-amber-400 border border-amber-500/25'
                  }`}>
                    {item.type === 'video' ? 'VIDEO' : item.category || 'NEWS'}
                  </span>
                </div>
              </div>

              {/* Right Column: Context Information */}
              <div className="flex-grow flex flex-col justify-between min-w-0 py-1 space-y-4">
                <div className="space-y-2">
                  
                  {/* Metadata Row */}
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      {item.publishDate}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1 text-[#a855f7]/85 font-semibold">
                      {item.type === 'video' ? <Video className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                      {item.type === 'video' ? 'Cinema Stream' : 'Official Press'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base md:text-lg font-bold text-white group-hover:text-purple-300 transition-colors leading-snug font-sans">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3">
                    {item.description}
                  </p>
                </div>

                {/* News CTA External Link (strictly controlled by Admin News Link) */}
                {item.type === 'news' && item.newsLink && (
                  <div className="pt-2">
                    <a
                      href={item.newsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-950/30 border border-purple-500/20 text-purple-300 hover:border-purple-500/40 hover:bg-purple-900/25 hover:text-white text-xs font-mono rounded-xl font-bold transition-all"
                    >
                      <span>Read Full Article</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

            </motion.div>
          ))}
        </AnimatePresence>

        {/* EMPTY STATE */}
        {filteredFeed.length === 0 && (
          <div className="text-center py-20 rounded-3xl border border-dashed border-purple-500/10 bg-black/15 flex flex-col justify-center items-center p-6 space-y-3">
            <AlertCircle className="w-8 h-8 text-purple-500/50" />
            <p className="text-gray-400 font-mono text-xs max-w-sm">
              No live entries matches your filter criteria or search query. Create some spectacular content inside the Secure Admin Dashboard!
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
