import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tv, Play, ExternalLink, RefreshCw, Sparkles, Youtube, Send, Video,
  Clock, Calendar, Info, Trash2, Heart, Share2, X, Plus, AlertCircle, Check, Download, Layers,
  Pin, Edit3, Film, Search, UploadCloud, Eye, Star, User, Compass, Music, AlertTriangle, PlayCircle
} from 'lucide-react';
import { useBackend } from '../context/BackendContext';
import MemberEmojiPicker, { loadBiasEmoji } from './MemberEmojiPicker';
import CountrySelect from './CountrySelect';
import { getSavedCountry, saveCountry, pinCountry } from '../utils/armyMap';
import { ensureProfile, profileName, profileHandle } from '../utils/profile';
import { getYoutubeEmbedUrl, getYoutubeVideoId } from './youtubeUtils';
import RecentConcertReplay from './RecentConcertReplay';

interface VideoItem {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string; // This holds Month/Era e.g. "2020" or user select
  era?: string; // Selected Era/Year e.g. "2020"
  videoCategory?: string; // MV, Run BTS, Live Stream Session, Fan Made, Showcase
  isCustomUpload?: boolean;
  uploadedAt: string;
  submittedBy?: string;
  displayName?: string;
  memberEmoji?: string;
  imageUrl?: string;
  isPinned?: boolean;
}

// Media service helpers
const getPlatformName = (url: string): string => {
  if (!url) return 'YouTube';
  const l = url.toLowerCase();
  if (l.includes('twitter.com') || l.includes('x.com')) return 'X / Twitter';
  if (l.includes('t.me')) return 'Telegram';
  return 'YouTube';
};

const isValidVideoLink = (url: string): boolean => {
  if (!url) return false;
  const l = url.toLowerCase().trim();
  return l.includes('youtube.com') || l.includes('youtu.be') || l.includes('twitter.com') || l.includes('x.com') || l.includes('t.me') || l.includes('.mp4') || l.includes('vimeo.com') || l.startsWith('<iframe') || l.includes('src=');
};

const getTwitterTweetId = (url: string): string => {
  if (!url) return '';
  const match = url.match(/(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/([0-9]+)/);
  return match ? match[1] : '';
};

const getVideoThumbnail = (url: string, fallbackImg?: string): string => {
  if (fallbackImg) return fallbackImg;
  if (!url) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg';
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = getYoutubeVideoId(url);
    if (videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  
  if (url.includes('twitter.com') || url.includes('x.com')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg'; // Dark Twitter/X aesthetic
  }
  
  if (url.includes('t.me')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg'; // Dark Telegram logo/symbol aesthetic
  }
  
  return 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg';
};

const getMediaEmbedUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return getYoutubeEmbedUrl(url);
  }
  if (url.includes('t.me/')) {
    const cleanUrl = url.split('?')[0];
    return `${cleanUrl}?embed=1`;
  }
  if (url.includes('twitter.com') || url.includes('x.com')) {
    const tweetId = getTwitterTweetId(url);
    if (tweetId) {
      return `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=dark`;
    }
  }
  return '';
};

const getPlatformIcon = (url: string): React.ReactNode => {
  if (!url) return <Youtube className="w-4 h-4" />;
  const l = url.toLowerCase();
  if (l.includes('twitter.com') || l.includes('x.com')) return <Video className="w-4 h-4 text-sky-400" />;
  if (l.includes('t.me')) return <Send className="w-4 h-4 text-blue-400" />;
  return <Youtube className="w-4 h-4 text-red-500" />;
};

const VIDEO_CATEGORIES = [
  'All Types',
  'MV',
  'Run BTS',
  'Live Stream Session',
  'Fan Made',
  'Showcase'
];

const TIMELINE_YEARS = [
  'All Years', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '25/26 Solos', '2020', '2021', '2022', '2023', '2024', '2025', '2026'
];

export default function YouTubeClone({ config: passedConfig }: { config?: any }) {
  const { currentUser, registerUser, refreshData } = useBackend();
  const isAdmin = !!localStorage.getItem('bts_admin_token');

  // Inline registration state
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerDisplayName, setRegisterDisplayName] = useState('');
  const [registerError, setRegisterError] = useState('');

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [featuredVideoId, setFeaturedVideoId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedCategory, setSelectedCategory] = useState('All Types');

  // Submit Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [heroMode, setHeroMode] = useState<'info' | 'submit'>('info');
  const [formTitle, setFormTitle] = useState('');
  const [biasEmoji, setBiasEmoji] = useState<string>(() => loadBiasEmoji());
  const [formDesc, setFormDesc] = useState('');
  const [formYear, setFormYear] = useState('2026');
  const [formCategory, setFormCategory] = useState('MV'); // Default Category
  const [formCountry, setFormCountry] = useState(() => getSavedCountry()); // Batch 91
  const [youtubeLink, setYoutubeLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Active Theater Player Modals
  const [activePlayVideo, setActivePlayVideo] = useState<VideoItem | null>(null);

  const handlePlayVideo = (vid: VideoItem) => {
    setActivePlayVideo(vid);
    setHeroMode('info');
    setTimeout(() => {
      const element = document.getElementById('featured-video-hero-card');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };


  const fileInputRef = useRef<HTMLInputElement>(null);
  // Approved submissions merged into the library, kept in a ref so
  // the passedConfig sync below can merge them instead of wiping them.
  const subsRef = useRef<VideoItem[]>([]);

  // Fetch from endpoint
  // Fetch from endpoint
  const fetchConfigAndVideos = async () => {
    try {
      setLoading(true);
      let list: VideoItem[] = [];
      const res = await fetch('/api/config/published');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          list = Array.isArray(data.videos) ? data.videos : [];
          // Filter out legacy sample videos so library starts clean
          list = list.filter((v: any) => v.videoId !== 'gdZLi9oWNZg' && v.id !== 'vid1' && v.id !== 'vid2' && v.id !== 'vid3' && v.id !== 'vid4' && v.id !== 'vid5' && v.id !== 'vid6');
          if (data.featuredVideoId) {
            setFeaturedVideoId(data.featuredVideoId);
          } else {
            setFeaturedVideoId('');
          }
        }
      }

      // Also merge approved video submissions
      try {
        const subRes = await fetch('/api/video/submissions');
        if (subRes.ok) {
          const subData = await subRes.json();
          if (subData && Array.isArray(subData.submissions)) {
            const existingIds = new Set(list.map(v => v.id));
            const newSubs: VideoItem[] = subData.submissions
              // Batch 80: the public page shows APPROVED submissions
              // only — filter here as well, because the endpoint
              // returns every status when the browser holds an admin
              // token (so the owner saw rejected videos on the page).
              .filter((s: any) => s.status === 'approved')
              .filter((s: any) => !existingIds.has(s.id))
              .map((s: any) => ({
                id: s.id,
                videoId: s.videoId || getYoutubeVideoId(s.youtubeUrl || s.url) || s.id,
                title: s.title || 'Shared BTS Broadcast',
                description: s.description || '',
                era: s.era || '2026',
                url: s.youtubeUrl || s.url,
                youtubeUrl: s.youtubeUrl || s.url,
                category: s.category || 'MV',
                uploadedAt: s.uploadedAt || s.createdAt || new Date().toISOString(),
                submittedBy: s.submittedBy || 'guest',
                displayName: s.displayName || 'Guest ARMY',
                ...(s.memberEmoji ? { memberEmoji: s.memberEmoji } : {}),
                views: s.views || '1',
                likes: s.likes || 0
              }));
            subsRef.current = newSubs;
            list = [...newSubs, ...list];
          }
        }
      } catch (err) {
        // ignore
      }

      // Always apply the fetched list — even when it is empty. The old
      // "only set when non-empty" guard meant a stale list (e.g. seed
      // videos served once from an old cache) stayed on screen forever
      // and flickered against the real (empty) library. The Videos page
      // shows only what the owner has actually added.
      setVideos(list);
    } catch (err) {
      console.error('Failed to load published videos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigAndVideos();
    const interval = setInterval(fetchConfigAndVideos, 8000); // 8s polling
    return () => clearInterval(interval);
  }, []);

  // Sync state with parent passedConfig if any. IMPORTANT: keep the
  // approved submissions merged in — this effect used to overwrite
  // the list with config-only videos, so submission videos appeared
  // (from the polling fetch) and then VANISHED (on every config
  // refresh) over and over.
  useEffect(() => {
    if (passedConfig) {
      let list = Array.isArray(passedConfig.videos) ? passedConfig.videos : [];
      list = list.filter((v: any) => v.videoId !== 'gdZLi9oWNZg' && v.id !== 'vid1' && v.id !== 'vid2' && v.id !== 'vid3' && v.id !== 'vid4' && v.id !== 'vid5' && v.id !== 'vid6');
      const configIds = new Set(list.map((v: any) => v.id));
      const keptSubs = subsRef.current.filter(s => !configIds.has(s.id));
      setVideos([...keptSubs, ...list]);
      if (passedConfig.featuredVideoId) {
        setFeaturedVideoId(passedConfig.featuredVideoId);
      }
    }
  }, [passedConfig]);

  const handleRegisterUserInline = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    if (!registerUsername.trim()) {
      setRegisterError('Username is required.');
      return;
    }
    if (!registerDisplayName.trim()) {
      setRegisterError('Display name is required.');
      return;
    }
    const cleanUsername = registerUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername) {
      setRegisterError('Invalid username. Alphanumeric and underscore characters only.');
      return;
    }
    const ok = await registerUser(cleanUsername, registerDisplayName.trim());
    if (!ok) {
      setRegisterError('Registration failed. Username may be taken.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const submitUsername = profileHandle() || currentUser?.username || registerUsername.trim() || `army_${Math.floor(1000 + Math.random() * 9000)}`;
    const submitDisplayName = profileName() || currentUser?.displayName || registerDisplayName.trim() || 'ARMY Fan';

    if (!formTitle.trim()) {
      setFormError('Video Title is required.');
      return;
    }

    if (!formCountry) {
      setFormError('Please select your country — it lights up on the ARMY World Map!');
      return;
    }

    if (!youtubeLink.trim()) {
      setFormError('Please provide a valid stream URL link first.');
      return;
    }

    if (!isValidVideoLink(youtubeLink)) {
      setFormError('Only links from YouTube, X / Twitter, or Telegram are supported for security.');
      return;
    }

    setUploading(true);
    setUploadProgress(30);

    try {
      const finalUrl = youtubeLink.trim();
      setUploadProgress(60);

      // Call submit API
      const response = await fetch('/api/video/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDesc.trim(),
          era: formYear, // selected Era/Year
          youtubeUrl: finalUrl,
          fileBase64: '',
          filename: '',
          fileType: '',
          submittedBy: submitUsername,
          displayName: submitDisplayName,
          memberEmoji: biasEmoji || undefined,
          country: formCountry, // Batch 91
          category: formCategory // Video Category (MV, Run BTS, Live Stream Session, Fan Made, Showcase)
        })
      });

      setUploadProgress(85);

      let resData: any = null;
      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          resData = await response.json();
        }
      } catch (parseErr) {
        console.warn('Non-JSON response received, using client submission data:', parseErr);
      }

      const submittedItem: VideoItem = resData?.video || resData?.item || {
        id: 'vsub_' + Date.now(),
        videoId: getYoutubeVideoId(finalUrl) || 'vsub_' + Date.now(),
        title: formTitle.trim(),
        description: formDesc.trim(),
        era: formYear,
        url: finalUrl,
        youtubeUrl: finalUrl,
        category: formCategory,
        uploadedAt: new Date().toISOString(),
        submittedBy: submitUsername,
        displayName: submitDisplayName,
        ...(biasEmoji ? { memberEmoji: biasEmoji } : {}),
        views: '1',
        likes: 0
      };

      // Optimistically place the video into the library and play it immediately!
      setVideos(prev => [submittedItem, ...prev.filter(v => v.id !== submittedItem.id)]);
      setActivePlayVideo(submittedItem);

      setUploadProgress(100);
      saveCountry(formCountry);
      pinCountry(formCountry);
      ensureProfile(submitDisplayName, { country: formCountry });
      setFormSuccess('Video submitted! 💜 It joins the site after admin approval — you can preview it here now.');

      // Clear Form state
      setFormTitle('');
      setFormDesc('');
      setYoutubeLink('');

      // Refresh data
      fetchConfigAndVideos();
      if (refreshData) refreshData();

      // Close modal/reset mode after delay
      setTimeout(() => {
        setShowUploadModal(false);
        setHeroMode('info');
        setFormSuccess('');
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setUploading(false);
    }
  };

  // Gather & Sort Videos: Featured always first, then Newest First!
  const getProcessedVideos = () => {
    let list = [...videos];

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(v => 
        (v.title || '').toLowerCase().includes(q) || 
        (v.description || '').toLowerCase().includes(q)
      );
    }

    // Filter by Selected Timeline Year
    if (selectedYear !== 'All Years') {
      const yearStr = selectedYear === '25/26 Solos' ? '2025' : selectedYear;
      list = list.filter(v => (v.category === yearStr || v.era === yearStr));
    }

    // Filter by custom category
    if (selectedCategory !== 'All Types') {
      list = list.filter(v => (v.videoCategory === selectedCategory || v.category === selectedCategory));
    }

    // Sort: Featured first, then newest first
    return list.sort((a, b) => {
      const isA_Featured = a.id === featuredVideoId;
      const isB_Featured = b.id === featuredVideoId;

      if (isA_Featured && !isB_Featured) return -1;
      if (!isA_Featured && isB_Featured) return 1;

      // Standard Chronological desc (fallback id timestamp comparison)
      const aTime = a.id.split('-').find(p => /^\d+$/.test(p)) || '0';
      const bTime = b.id.split('-').find(p => /^\d+$/.test(p)) || '0';
      return parseInt(bTime) - parseInt(aTime);
    });
  };

  const processedVideos = getProcessedVideos();
  const featuredVideoItem = videos.find(v => v.id === featuredVideoId) || videos[0];

  return (
    <div className="w-full space-y-10 py-2 animate-fade-in font-sans text-white">
      
      {/* RECENT CONCERT REPLAY GALLERY */}
      <RecentConcertReplay concerts={passedConfig?.concerts} linkMode />

      {/* 1. FEATURED VIDEO HERO PANEL & BROADCAST HUB (DUAL-PANE) */}
      {(featuredVideoItem || activePlayVideo) && (() => {
        const isEnteringLink = youtubeLink && isValidVideoLink(youtubeLink);
        const currentPlaying = activePlayVideo || featuredVideoItem;
        const currentVideoUrl = isEnteringLink ? youtubeLink : (currentPlaying?.url || '');
        const isYoutube = currentVideoUrl.toLowerCase().includes('youtube.com') || currentVideoUrl.toLowerCase().includes('youtu.be');
        const isTelegram = currentVideoUrl.toLowerCase().includes('t.me/');
        const isTwitter = currentVideoUrl.toLowerCase().includes('twitter.com') || currentVideoUrl.toLowerCase().includes('x.com');
        const previewEmbedUrl = isEnteringLink ? getMediaEmbedUrl(youtubeLink) : getYoutubeEmbedUrl(currentPlaying?.url || '');

        return (
          <section id="featured-video-hero-card" className="w-full rounded-3xl overflow-hidden border border-purple-500/20 bg-[#0c051a]/85 backdrop-blur-2xl relative shadow-2xl animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-t from-[#090412] via-transparent to-transparent z-[2]" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 p-6 md:p-8 relative z-10 items-stretch">
              
              {/* Left Pane: Display Video Iframe / Image Preview - THE CINEMA SCREEN */}
              <div className="lg:col-span-3 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${activePlayVideo ? 'bg-red-500 animate-pulse' : 'bg-purple-500 animate-ping'}`} />
                      <span className="font-mono text-[10px] text-purple-300 uppercase tracking-widest font-bold">
                        {isEnteringLink ? "Live Submission Cinema Screen" : activePlayVideo ? "Now Playing Cinema Screen" : "Official Spotlight Cinema Screen"}
                      </span>
                    </div>

                    {activePlayVideo && (
                      <button
                        onClick={() => setActivePlayVideo(null)}
                        className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/40 border border-red-500/35 text-red-400 hover:text-white font-mono text-[9px] uppercase font-black flex items-center gap-1 transition-all cursor-pointer shadow-lg active:scale-95"
                      >
                        <X className="w-3 h-3" /> Close Player
                      </button>
                    )}
                  </div>
                  <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-inner relative group bg-black/60">
                    {currentVideoUrl ? (
                      (isYoutube || isTelegram || isTwitter) && previewEmbedUrl ? (
                        <iframe
                          title="Spotlight Cinema Player"
                          className="w-full h-full"
                          src={previewEmbedUrl}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="w-full h-full relative">
                          <img
                            src={getVideoThumbnail(currentVideoUrl)}
                            alt="Platform Preview"
                            className="w-full h-full object-cover opacity-85"
                            onError={(e) => {
                              const img = e.currentTarget;
                              if (!img.src.includes('og-cover-2.jpg')) img.src = '/images/og-cover-2.jpg';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-4 text-left">
                            <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/85 border border-white/5 text-[9px] font-mono text-purple-300 flex items-center gap-1.5">
                              {getPlatformIcon(currentVideoUrl)}
                              {getPlatformName(currentVideoUrl)}
                            </span>
                            <div className="w-10 h-10 rounded-full bg-purple-600/95 absolute inset-0 m-auto flex items-center justify-center text-white border border-white/15 shadow-lg shadow-purple-600/45 cursor-pointer hover:scale-105 transition-all">
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </div>
                            <h4 className="text-sm font-bold text-white truncate">{formTitle.trim() || 'Untitled Broadcast'}</h4>
                            <p className="text-[11px] text-purple-200/80 truncate font-light leading-none mt-1">{formDesc.trim() || 'No description provided yet...'}</p>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black/40 text-gray-500 text-xs font-mono">
                        No spotlight stream online
                      </div>
                    )}
                  </div>
                </div>

                {!isEnteringLink && (
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-purple-500/10">
                    <div className="flex flex-wrap gap-2 text-purple-300/80 font-mono text-[10px]">
                      <span className="bg-white/5 px-2 py-1 rounded border border-white/5 uppercase flex items-center gap-1">
                        <Film className="w-3.5 h-3.5" />
                        {currentPlaying.videoCategory || "Official Release"}
                      </span>
                      <span className="bg-white/5 px-2 py-1 rounded border border-white/5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {currentPlaying.era || currentPlaying.category || "All Eras"}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setActivePlayVideo(currentPlaying)}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-sans font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md shadow-purple-600/20"
                      >
                        <PlayCircle className="w-3.5 h-3.5 fill-white/10" /> Theater Mode
                      </button>
                      <a
                        href={currentPlaying.url}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-[11px] flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        Direct Link <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Pane: Split layout for spotlight info vs submit video */}
              <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
                
                {/* Tab Selector */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/15 pb-2">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setHeroMode('info')}
                      className={`pb-1.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        heroMode === 'info' 
                          ? 'text-white border-b-2 border-purple-500 text-purple-300' 
                          : 'text-gray-400 hover:text-purple-300'
                      }`}
                    >
                      Spotlight Info
                    </button>
                    <button
                      onClick={() => {
                        setFormError('');
                        setFormSuccess('');
                        setHeroMode('submit');
                      }}
                      className={`pb-1.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        heroMode === 'submit' 
                          ? 'text-white border-b-2 border-purple-500 text-purple-300' 
                          : 'text-gray-400 hover:text-purple-300'
                      }`}
                    >
                      Pitch Broadcast
                    </button>
                  </div>
                  
                  <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest font-black whitespace-nowrap">
                    BTS Broadcast Hub
                  </span>
                </div>

                {/* Switchable Body Panel */}
                <div className="flex-1 flex flex-col justify-center py-2">
                  {heroMode === 'info' ? (
                    <div className="space-y-4 animate-fade-in">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/20 text-purple-300 text-[10px] font-mono uppercase tracking-widest leading-none font-bold">
                          {activePlayVideo ? <PlayCircle className="w-3 h-3 fill-purple-400/30" /> : <Star className="w-3 h-3 fill-purple-400/30" />} {activePlayVideo ? "NOW PLAYING" : "SPOTLIGHT BROADCAST"}
                        </div>
                        <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-300 uppercase leading-tight tracking-wider line-clamp-3">
                          {currentPlaying.title}
                        </h1>
                        <p className="text-gray-400 text-xs font-sans font-normal leading-relaxed line-clamp-5">
                          {currentPlaying.description || "The central spotlight interactive broadcast promoted directly by the Admin CMS center. Tune in to experience history!"}
                        </p>
                      </div>

                      {currentPlaying.displayName && (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-purple-300">
                          <User className="w-3.5 h-3.5 text-purple-400" />
                          <span>Submitted by: <strong className="text-purple-200">@{currentPlaying.displayName}</strong>{currentPlaying.memberEmoji ? <span className="text-sm"> {currentPlaying.memberEmoji}</span> : null}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 animate-fade-in">
                      {!currentUser ? (
                        <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/15 space-y-3">
                          <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-purple-400 shrink-0" />
                            <h4 className="font-bold text-white uppercase text-xs">Establish ARMY Identity</h4>
                          </div>
                          <p className="text-purple-300/80 text-[10px] leading-relaxed">
                            A registered ARMY nickname is required to pitch broadcasts or tracks onto the public timeline.
                          </p>
                          
                          <form onSubmit={handleRegisterUserInline} className="space-y-3">
                            {registerError && (
                              <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/20 text-red-400 text-[10px]">
                                {registerError}
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="font-mono text-[9px] text-purple-300 uppercase block">Username *</label>
                                <input
                                  type="text"
                                  required
                                  value={registerUsername}
                                  onChange={(e) => setRegisterUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                  placeholder="dynamite_stan"
                                  className="w-full bg-black/40 border border-purple-500/10 hover:border-purple-500/30 focus:border-purple-400 focus:outline-none rounded-lg p-2 text-white font-sans text-xs placeholder:text-gray-600"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="font-mono text-[9px] text-purple-300 uppercase block">Display Name *</label>
                                <input
                                  type="text"
                                  required
                                  value={registerDisplayName}
                                  onChange={(e) => setRegisterDisplayName(e.target.value)}
                                  placeholder="Butter Bias ARMY💜"
                                  className="w-full bg-black/40 border border-purple-500/10 hover:border-purple-500/30 focus:border-purple-400 focus:outline-none rounded-lg p-2 text-white font-sans text-xs placeholder:text-gray-600"
                                />
                              </div>
                            </div>
                            <button
                              type="submit"
                              className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black uppercase tracking-wider text-center text-xs cursor-pointer shadow-lg"
                            >
                              Register & Start Pitching
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Inline feedback blocks */}
                          {formError && (
                            <div className="flex items-center gap-2 p-2 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 text-[10px] animate-fade-in">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{formError}</span>
                            </div>
                          )}

                          {formSuccess && (
                            <div className="flex items-center gap-2 p-2 rounded-xl bg-green-950/40 border border-green-500/20 text-green-400 text-[10px] animate-fade-in">
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{formSuccess}</span>
                            </div>
                          )}

                          <form onSubmit={handleFormSubmit} className="space-y-2 font-sans text-xs">
                            <MemberEmojiPicker value={biasEmoji} onChange={setBiasEmoji} />
                            <div className="space-y-1">
                              <label className="font-mono text-[9px] text-purple-300 uppercase block font-bold">Stream Video URL Link *</label>
                              <input
                                type="url"
                                required
                                value={youtubeLink}
                                onChange={(e) => {
                                  setYoutubeLink(e.target.value);
                                  setFormError('');
                                }}
                                placeholder="Paste YouTube, X/Twitter, or Telegram post Link..."
                                className="w-full bg-black/40 border border-purple-500/10 hover:border-purple-500/30 focus:border-purple-400 focus:outline-none rounded-lg p-2 text-white placeholder:text-gray-600 font-sans text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-mono text-[9px] text-purple-300 uppercase block">Video Title *</label>
                              <input
                                type="text"
                                required
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder="e.g. Dynamite live showcase at Grand Central"
                                className="w-full bg-black/40 border border-purple-500/10 hover:border-purple-500/30 focus:border-purple-400 focus:outline-none rounded-lg p-2 text-white placeholder:text-gray-600 font-sans text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-mono text-[9px] text-purple-300 uppercase block">Short Description</label>
                              <textarea
                                rows={1}
                                value={formDesc}
                                onChange={(e) => setFormDesc(e.target.value)}
                                placeholder="Provide a short description..."
                                className="w-full bg-black/40 border border-purple-500/10 hover:border-purple-500/30 focus:border-purple-400 focus:outline-none rounded-lg p-2 text-white placeholder:text-gray-600 font-sans text-xs"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="font-mono text-[9px] text-purple-300 uppercase block">Category *</label>
                                <select
                                  value={formCategory}
                                  onChange={(e) => setFormCategory(e.target.value)}
                                  className="w-full bg-[#180e2d] border border-purple-500/15 focus:border-purple-400 focus:outline-none rounded-lg p-1.5 text-white font-mono uppercase text-[9px]"
                                >
                                  {VIDEO_CATEGORIES.filter(c => c !== 'All Types').map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                              </div>
                              
                              <div className="space-y-1">
                                <label className="font-mono text-[9px] text-purple-300 uppercase block">Year *</label>
                                <select
                                  value={formYear}
                                  onChange={(e) => setFormYear(e.target.value)}
                                  className="w-full bg-[#180e2d] border border-purple-500/15 focus:border-purple-400 focus:outline-none rounded-lg p-1.5 text-white font-mono text-[9px]"
                                >
                                  {TIMELINE_YEARS.filter(y => y !== 'All Years').map(year => {
                                    const val = year === '25/26 Solos' ? '2025' : year;
                                    return <option key={year} value={val}>{year}</option>;
                                  })}
                                </select>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="font-mono text-[9px] text-purple-300 uppercase block">Your Country *</label>
                              <CountrySelect value={formCountry} onChange={setFormCountry} className="!bg-[#180e2d] !border-purple-500/15 !rounded-lg !p-1.5 !text-[11px]" />
                            </div>

                            {uploading && (
                              <div className="space-y-1 pt-1">
                                <div className="flex justify-between text-[9px] text-purple-400 font-mono">
                                  <span>Uploading...</span>
                                  <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500" style={{ width: `${uploadProgress}%` }} />
                                </div>
                              </div>
                            )}

                            <button
                              type="submit"
                              disabled={uploading}
                              className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-sans font-black uppercase tracking-wider text-center text-[10px] cursor-pointer shadow-lg disabled:opacity-50 transition-all active:scale-95"
                            >
                              {uploading ? 'Processing...' : 'Submit Pitch'}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </section>
        );
      })()}

      {/* 2. CONTROLS NAVIGATION DECK */}
      <section className="p-6 rounded-3xl border border-purple-500/10 bg-[#090412]/80 backdrop-blur-xl space-y-6">
        
        {/* Top filter row: Seek & Submit */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          
          {/* Seek Input */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search through official BTS archives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#140b24]/80 border border-purple-500/20 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-400 placeholder:text-gray-500 transition-all font-sans"
            />
          </div>

          <div className="flex flex-nowrap items-center gap-3 w-full md:w-auto">
            {/* Category selection */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 min-w-0 md:flex-none px-3 py-2 rounded-xl bg-[#140b24]/90 border border-purple-500/20 text-xs text-purple-200 focus:outline-none cursor-pointer font-mono uppercase tracking-wider"
            >
              {VIDEO_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Launch Submission CTA — same row as the type filter */}
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <button
                onClick={() => {
                  setFormError('');
                  setFormSuccess('');
                  setHeroMode('submit');
                  // Scroll to top of YouTube page smoothly
                  const element = document.getElementById('featured-video-hero-card');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 font-sans font-black text-xs uppercase tracking-wider text-white shadow-lg shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 hover:brightness-110"
              >
                <Plus className="w-4 h-4" /> Submit Video
              </button>
            </div>
          </div>

        </div>

        {/* Timeline Era Years Horizontal Scrollbar */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-black block">
            Chronology Timeline Filtering Coordinates
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-transparent">
            {TIMELINE_YEARS.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                  selectedYear === year 
                    ? 'bg-purple-600 border border-purple-400/30 text-white shadow shadow-purple-600/30 scale-105'
                    : 'bg-[#180e2d]/60 border border-white/5 text-purple-300/70 hover:text-white hover:bg-purple-950/40'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

      </section>

      {/* 3. MAIN GALLERY GRID */}
      {loading ? (
        <div className="py-24 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
          <p className="text-xs font-mono text-gray-500">Retrieving official video logs from Firestore...</p>
        </div>
      ) : processedVideos.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-white/5 bg-white/[0.01]">
          <Film className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-400">No broadcasts found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto leading-relaxed">
            There are no videos matching "{searchQuery}" under {selectedYear} / {selectedCategory}. Be the first to share one!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {processedVideos.map((vid, idx) => {
              const isFeatured = vid.id === featuredVideoId;
              const cardThumbnail = getVideoThumbnail(vid.url, vid.imageUrl);

              return (
                <motion.article
                  key={vid.id}
                  id={`video-card-${vid.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.4) }}
                  className={`group rounded-2xl border bg-[#0d071a]/80 backdrop-blur-xl overflow-hidden flex flex-col relative transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-600/10 ${
                    isFeatured 
                      ? 'border-purple-500/40 ring-1 ring-purple-500/20 shadow-purple-600/5' 
                      : 'border-white/5 hover:border-purple-500/20'
                  }`}
                >
                  {/* Aspect Video frame */}
                  <div className="aspect-video w-full overflow-hidden bg-black/40 relative cursor-pointer" onClick={() => handlePlayVideo(vid)}>
                    <img
                      src={cardThumbnail}
                      alt={vid.title}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Play hover button overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-purple-600/90 flex items-center justify-center text-white shadow-xl transition-all scale-95 group-hover:scale-100">
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                      </div>
                    </div>

                    {/* Left overlay chips */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
                      <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur border border-white/10 text-[9px] font-mono uppercase tracking-wider text-white">
                        {vid.videoCategory || "Official Release"}
                      </span>
                      {isFeatured && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-600 border border-purple-400/20 text-[9px] font-mono uppercase tracking-widest text-white flex items-center gap-1 font-black">
                          <Star className="w-3 h-3 fill-white" /> SPOTLIGHT
                        </span>
                      )}
                    </div>

                    {/* Source platform badge overlay bottom-right */}
                    <span className="absolute bottom-2 right-2 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-black/85 backdrop-blur-md border border-white/5 text-[8px] sm:text-[9px] font-mono text-purple-300 flex items-center gap-1 sm:gap-1.5">
                      {getPlatformIcon(vid.url)}
                      {getPlatformName(vid.url)}
                    </span>
                  </div>

                  {/* Body Text */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
                    <div className="space-y-1.5 cursor-pointer" onClick={() => handlePlayVideo(vid)}>
                      <h3 className="font-extrabold text-white text-xs sm:text-sm line-clamp-2 leading-tight uppercase group-hover:text-purple-300 transition-colors">
                        {vid.title}
                      </h3>
                      <p className="text-gray-400 text-[11px] sm:text-xs line-clamp-2 font-sans font-normal leading-relaxed">
                        {vid.description || "ARMY Submission community broadcast video on timeline."}
                      </p>
                    </div>

                    {/* Metadata block updated with date and username */}
                    <div className="flex flex-col gap-2 sm:gap-2.5 text-[9px] sm:text-[10px] font-mono text-slate-500 pt-2.5 sm:pt-3 border-t border-white/5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="flex items-center gap-1 uppercase min-w-0">
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                          <span className="truncate">Era: {vid.era || vid.category || "2026"}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-400 shrink-0">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {vid.uploadedAt || "June 2026"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-purple-300 font-bold truncate max-w-[72px] sm:max-w-[120px]" title={`Uploaded by ${vid.displayName || "Anonymous ARMY"}`}>
                          By: @{vid.displayName || "Anonymous ARMY"}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handlePlayVideo(vid)}
                            className="px-2 sm:px-3 py-1.5 rounded bg-purple-600/35 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-400 text-purple-200 hover:text-white font-bold uppercase tracking-wider text-[8px] sm:text-[9px] transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" /> Watch Now
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal overlay has been replaced with the inline Broadcast Pitch Station at the top of the page */}

      {/* Modal overlay has been replaced with the inline Cinema Theater Player at the top of the page */}

    </div>
  );
}
