/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Video } from '../types';
import AdsterraAd from './AdsterraAd';
import { VIDEOS as INITIAL_VIDEOS } from '../data/btsData';
import { Search, Eye, Radio, Sparkles, Plus, PlusCircle, Check, Trash2, Youtube, AlertCircle, Play } from 'lucide-react';

export default function VideoSection() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [instantUrl, setInstantUrl] = useState('');

  // Form states for Admin YouTube link pasting
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [pastedUrl, setPastedUrl] = useState('');
  const [adminTitle, setAdminTitle] = useState('');
  const [adminDesc, setAdminDesc] = useState('');
  const [adminPlaylist, setAdminPlaylist] = useState('ARMY Shares');
  const [adminCat, setAdminCat] = useState<'MV' | 'Live Performance' | 'Variety' | 'Festa' | 'Documentary'>('MV');
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState(false);

  // Detect brand category of the video URL (Youtube vs Twitter vs Telegram etc)
  const detectVideoType = (url: string | undefined): 'youtube' | 'twitter' | 'telegram' | 'other' => {
    if (!url) return 'other';
    const lower = url.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be') || /^[a-zA-Z0-9_-]{11}$/.test(url)) return 'youtube';
    if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
    if (lower.includes('t.me/')) return 'telegram';
    return 'other';
  };

  // Resolve custom thumbnail path dynamically based on link properties
  const getVideoThumbnail = (videoId: string): string => {
    const type = detectVideoType(videoId);
    if (type === 'youtube') {
      const ytid = /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? videoId : (videoId.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || videoId.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) || [])[1];
      return `https://img.youtube.com/vi/${ytid || videoId}/hqdefault.jpg`;
    }
    if (type === 'twitter') {
      return 'https://images.unsplash.com/photo-1611605698335-8b15d27e03f9?w=300';
    }
    if (type === 'telegram') {
      return 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=300';
    }
    return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300';
  };

  // Convert url coordinates to a playable iframe embed URL
  const getVideoEmbedUrl = (videoId: string): string => {
    if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
    }
    if (videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
      const ytid = extractYoutubeId(videoId);
      return `https://www.youtube.com/embed/${ytid || videoId}?autoplay=0&rel=0`;
    }
    if (videoId.includes('twitter.com') || videoId.includes('x.com')) {
      const cleanTwitterUrl = videoId.replace('mobile.', '').replace('x.com', 'twitter.com');
      return `https://twitframe.com/show?url=${encodeURIComponent(cleanTwitterUrl)}`;
    }
    if (videoId.includes('t.me/')) {
      const base = videoId.split('?')[0];
      return `${base}?embed=1`;
    }
    if (videoId.startsWith('http')) {
      return videoId;
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
  };

  // Instant Player Paste-and-Stream handler
  const handleInstantUrlChange = (url: string) => {
    setInstantUrl(url);
    if (url.trim()) {
      const type = detectVideoType(url);
      let videoId = url.trim();
      if (type === 'youtube') {
        const ytid = extractYoutubeId(url);
        if (ytid) videoId = ytid;
      }
      
      const tempVideo: Video = {
        id: `instant_${Date.now()}`,
        videoId: videoId,
        title: `Instantly Loaded ${type.toUpperCase()} Stream`,
        description: 'You pasted this social stream to play instantly inside the ARMY Theatre Room.',
        playlist: 'Instant Stream',
        category: 'MV',
        uploadedAt: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
      
      // Update state and list
      setActiveVideo(tempVideo);
      setVideos(prev => {
        if (prev.some(v => v.videoId === videoId)) return prev;
        const updated = [tempVideo, ...prev];
        localStorage.setItem('bts_videos_board', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Load videos from LocalStorage or initialize with static data
  useEffect(() => {
    const saved = localStorage.getItem('bts_videos_board');
    if (saved) {
      try {
        setVideos(JSON.parse(saved));
      } catch (e) {
        setVideos(INITIAL_VIDEOS);
      }
    } else {
      setVideos(INITIAL_VIDEOS);
      localStorage.setItem('bts_videos_board', JSON.stringify(INITIAL_VIDEOS));
    }
  }, []);

  // Update active video if none selected
  useEffect(() => {
    if (videos.length > 0 && !activeVideo) {
      setActiveVideo(videos[0]);
    }
  }, [videos, activeVideo]);

  // Extract YouTube ID from link (highly robust: supports Standard, Shorts, Live, Embeds, Mobile, and Raw IDs with surrounding spaces)
  const extractYoutubeId = (url: string): string | null => {
    if (!url) return null;
    const cleanUrl = url.trim();

    // 1. If it's already an 11-character alphanumeric/hyphen/underscore string, it is already the video ID directly
    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
      return cleanUrl;
    }

    // 2. Regular expressions for various youtube formats
    const patterns = [
      /[?&]v=([a-zA-Z0-9_-]{11})/,                      // watch?v=ID
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,                  // youtu.be/ID
      /embed\/([a-zA-Z0-9_-]{11})/,                      // embed/ID
      /shorts\/([a-zA-Z0-9_-]{11})/,                     // shorts/ID
      /v\/([a-zA-Z0-9_-]{11})/,                          // v/ID
      /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/          // youtube.com/live/ID
    ];

    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // fallback regex
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = cleanUrl.match(regex);
    return match ? match[1] : null;
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess(false);

    if (!pastedUrl.trim()) {
      setAdminError('Please paste a stream link first.');
      return;
    }

    let videoId = '';
    const type = detectVideoType(pastedUrl);
    
    if (type === 'youtube') {
      const ytid = extractYoutubeId(pastedUrl);
      if (!ytid) {
        setAdminError('Could not parse a valid YouTube Video ID. Check your URL format.');
        return;
      }
      videoId = ytid;
    } else {
      videoId = pastedUrl.trim();
    }

    if (!adminTitle.trim()) {
      setAdminError('Please provide a descriptive title.');
      return;
    }

    const newVid: Video = {
      id: `vid_${Date.now()}`,
      videoId: videoId,
      title: adminTitle,
      description: adminDesc || 'No description supplied by board creator.',
      playlist: adminPlaylist || 'ARMY Shared',
      category: adminCat,
      uploadedAt: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    const updated = [newVid, ...videos];
    setVideos(updated);
    localStorage.setItem('bts_videos_board', JSON.stringify(updated));

    // Select this as active video immediately
    setActiveVideo(newVid);

    // Reset Form
    setPastedUrl('');
    setAdminTitle('');
    setAdminDesc('');
    setAdminSuccess(true);
    setTimeout(() => {
      setAdminSuccess(false);
      setShowAdminForm(false);
    }, 1500);
  };

  const handleDeleteVideo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = videos.filter(v => v.id !== id);
    setVideos(updated);
    localStorage.setItem('bts_videos_board', JSON.stringify(updated));
    if (activeVideo?.id === id) {
      setActiveVideo(updated[0] || null);
    }
  };

  // Searching & Category filtering
  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.playlist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedCategory === 'All') return matchesSearch;
    return v.category === selectedCategory && matchesSearch;
  });

  const categoriesList = ['All', 'MV', 'Live Performance', 'Variety', 'Festa', 'Documentary'];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Upper header segment and search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-sans font-extrabold text-white">
            ARMY Media Player Room
          </h2>
          <p className="text-gray-400 text-sm">
            Enjoy full high-production YouTube streams, clips, schedules, and custom media.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Quick toggle to show Admin paste form */}
          <button
            onClick={() => setShowAdminForm(!showAdminForm)}
            id="admin-video-toggle-btn"
            className="flex items-center gap-1.5 text-xs font-mono font-bold px-4 py-2 rounded-lg border border-purple-500 bg-purple-950/30 text-purple-300 hover:bg-purple-900/30 transition-all cursor-pointer shadow-md shadow-purple-500/10 shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-purple-400" />
            {showAdminForm ? 'Close Link Poster' : 'Post YouTube Link'}
          </button>

          <div className="relative w-full md:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search playlists/clips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 text-xs pl-10 pr-4 py-2 rounded-lg border border-purple-500/20 focus:border-purple-500/50 text-white outline-none placeholder:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Instant Paste & Play Streamer Bar */}
      <div className="p-4 rounded-2xl border border-dashed border-purple-500/30 bg-purple-950/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center border border-red-500/20 shrink-0">
            <Youtube className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
              Instant YT URL Streamer <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </h4>
            <p className="text-xs text-slate-400">
              Paste any YouTube Video, Short, or Live link to play instantly in the embed player below
            </p>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex items-center gap-2">
          <input
            type="text"
            placeholder="Paste Link here (e.g. https://youtu.be/...) & stream instantly!"
            value={instantUrl}
            onChange={(e) => handleInstantUrlChange(e.target.value)}
            className="w-full bg-black/50 text-xs px-4 py-2.5 rounded-xl border border-purple-500/30 focus:border-purple-500/70 text-white outline-none placeholder:text-slate-500"
          />
          {instantUrl && (
            <button
              onClick={() => {
                setInstantUrl('');
              }}
              className="px-3 py-2 text-[10px] font-mono font-bold bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-slate-300 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Admin pasting form wrapper */}
      {showAdminForm && (
        <form
          onSubmit={handleAddVideo}
          id="admin-video-paste-form"
          className="p-6 rounded-2xl border border-purple-500/20 bg-[#0c0617]/90 backdrop-blur-md space-y-4 animate-fade-in"
        >
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Radio className="w-5 h-5 text-purple-500 animate-pulse" />
            <h3 className="font-sans font-bold text-white text-base">Post YouTube, X/Twitter, or Telegram Media Link</h3>
          </div>

          {adminError && (
            <div className="flex items-center gap-2 p-3 text-xs bg-red-950/40 border border-red-500/20 text-red-300 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{adminError}</span>
            </div>
          )}

          {adminSuccess && (
            <div className="flex items-center gap-2 p-3 text-xs bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 rounded-lg">
              <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>Video Board link published successfully! Loading...</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-purple-300 uppercase">Video or Post Link (YouTube, X/Twitter, or Telegram) *</label>
              <input
                type="text"
                placeholder="Paste YouTube, X/Twitter, or Telegram link..."
                value={pastedUrl}
                onChange={(e) => setPastedUrl(e.target.value)}
                className="w-full bg-black/60 text-sm p-2.5 rounded-lg border border-white/10 text-white placeholder:text-gray-600 outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-purple-300 uppercase">Clip Title *</label>
              <input
                type="text"
                placeholder="E.g., Jin The Astronaut Cinematic"
                value={adminTitle}
                onChange={(e) => setAdminTitle(e.target.value)}
                className="w-full bg-black/60 text-sm p-2.5 rounded-lg border border-white/10 text-white placeholder:text-gray-600 outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-purple-300 uppercase">Playlist/Album Topic</label>
              <input
                type="text"
                placeholder="E.g., Chapter 2 Vocals"
                value={adminPlaylist}
                onChange={(e) => setAdminPlaylist(e.target.value)}
                className="w-full bg-black/60 text-sm p-2.5 rounded-lg border border-white/10 text-white placeholder:text-gray-600 outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-purple-300 uppercase">Category</label>
              <select
                value={adminCat}
                onChange={(e) => setAdminCat(e.target.value as any)}
                className="w-full bg-[#0c0617] text-sm p-2.5 rounded-lg border border-white/10 text-white outline-none focus:border-purple-500"
              >
                <option value="MV">Music Video (MV)</option>
                <option value="Live Performance">Live Performance</option>
                <option value="Variety">Variety</option>
                <option value="Festa">Festa Special</option>
                <option value="Documentary">Documentary</option>
              </select>
            </div>

            <div className="space-y-1.5 flex items-end">
              <button
                type="submit"
                id="submit-youtube-link-btn"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold py-3 px-4 rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 uppercase"
              >
                <Check className="w-4 h-4" /> Publish Video Board
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-purple-300 uppercase">Brief Description</label>
            <textarea
              placeholder="Provide a description about this incredible performance video..."
              rows={2}
              value={adminDesc}
              onChange={(e) => setAdminDesc(e.target.value)}
              className="w-full bg-black/60 text-sm p-2.5 rounded-lg border border-white/10 text-white placeholder:text-gray-600 outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Real-time pre-publish user preview */}
          {pastedUrl.trim() && (
            <div className="p-4 rounded-xl border border-purple-500/20 bg-black/45 space-y-3 font-sans animate-fade-in text-left">
              <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-purple-400 font-extrabold uppercase tracking-widest leading-none">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                Live Video Preview Card (Pre-Publish)
              </div>
              
              <div className="flex flex-col md:flex-row gap-3.5">
                {/* Thumbnail Preview image wrapper */}
                <div className="w-full md:w-44 aspect-video rounded-lg overflow-hidden border border-white/5 relative bg-black shrink-0">
                  <img
                    src={getVideoThumbnail(pastedUrl)}
                    alt="Live video pre-publish thumbnail preview"
                    className="w-full h-full object-cover animate-fade-in"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="p-1 px-2.5 rounded-full bg-black/75 border border-white/10 text-[9px] font-mono text-purple-300 font-bold uppercase truncate max-w-[130px]">
                      {detectVideoType(pastedUrl)} Link
                    </span>
                  </div>
                </div>

                {/* Simulated metadata row */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="text-white text-xs font-bold font-sans uppercase truncate leading-none">
                    {adminTitle || 'Untitled Clip Coordinate'}
                  </h4>
                  <p className="text-[10.5px] text-purple-300/80 font-mono mt-1.5">
                    Category: {adminCat} | Topic: {adminPlaylist}
                  </p>
                  <p className="text-[10.5px] text-gray-400 line-clamp-2 mt-1 leading-normal">
                    {adminDesc || 'No custom description typed yet...'}
                  </p>
                </div>
              </div>

              {/* Live interactive embed player inside form */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase text-purple-400 font-bold block text-left">
                  Pre-Publish Embedded Stream Preview
                </label>
                <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-black">
                  {getVideoEmbedUrl(pastedUrl) ? (
                    <iframe
                      src={getVideoEmbedUrl(pastedUrl)}
                      title="Pre-publish live stream viewer"
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 bg-slate-950/40">
                      Enter a valid link to view preview
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      )}

      {/* Main Dynamic Player Theatre & Playlist Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Theatre Component (Column span 2) */}
        <div className="lg:col-span-2 space-y-4">
          {activeVideo ? (
            <div className="space-y-4">
              {/* Responsive Embedded YouTube/Social Player */}
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl bg-black">
                <iframe
                  src={getVideoEmbedUrl(activeVideo.videoId)}
                  title={activeVideo.title}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Video Info Section */}
              <div className="p-5 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 border border-purple-400/30 bg-purple-950/40 text-purple-300 rounded uppercase">
                      {activeVideo.category}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      Playlist: <span className="text-purple-400">{activeVideo.playlist}</span>
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">Published: {activeVideo.uploadedAt}</span>
                </div>

                <h1 className="text-xl md:text-2xl font-bold font-sans text-white leading-tight">
                  {activeVideo.title}
                </h1>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {activeVideo.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="aspect-video rounded-2xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <Radio className="w-12 h-12 mb-4 text-purple-600/60 animate-pulse" />
              <p className="font-mono text-sm leading-relaxed">No active videos in queue.</p>
            </div>
          )}
        </div>

        {/* Playlist selection sidebar column */}
        <div className="lg:col-span-1 space-y-4 flex flex-col h-full">
          <div className="p-4 rounded-xl border border-white/5 bg-black/40 flex flex-col gap-3">
            <h3 className="text-sm font-mono font-bold text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Radio className="w-4 h-4 text-purple-400 animate-pulse" /> Videos Library
            </h3>
            
            {/* Horizontal Scroll category selectors */}
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-transparent">
              {categoriesList.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[10px] font-mono px-2.5 py-1 rounded shrink-0 transition-colors uppercase cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Videos listing list with search results */}
          <div className="flex-grow overflow-y-auto max-h-[500px] pr-1 space-y-2">
            {filteredVideos.length === 0 ? (
              <div className="text-center py-10 rounded-xl border border-dashed border-white/5 bg-white/[0.01] text-gray-500">
                <p className="text-xs font-mono">No matching videos in library</p>
              </div>
            ) : (
              filteredVideos.map(vid => {
                const isActive = activeVideo?.id === vid.id;
                return (
                  <div
                    key={vid.id}
                    onClick={() => setActiveVideo(vid)}
                    className={`group flex gap-3 p-2.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                      isActive 
                        ? 'bg-purple-950/30 border-purple-500/40 shadow-inner' 
                        : 'bg-black/50 border-white/5 hover:border-purple-500/25'
                    }`}
                  >
                    {/* Compact Image Video preview container */}
                    <div className="w-24 h-16 rounded-md overflow-hidden bg-black/40 shrink-0 relative border border-white/5">
                      <img
                        src={getVideoThumbnail(vid.videoId)}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Play className="w-4 h-4 text-white fill-white opacity-80" />
                      </div>
                    </div>

                    {/* Meta info columns */}
                    <div className="flex-grow flex flex-col justify-center min-w-0 pr-4">
                      <span className="text-[9px] font-mono text-purple-400 uppercase tracking-wider block">
                        {vid.category} &bull; {vid.playlist}
                      </span>
                      <h4 className="font-sans font-semibold text-xs text-white group-hover:text-purple-300 transition-colors line-clamp-2 mt-0.5 leading-snug">
                        {vid.title}
                      </h4>
                    </div>

                    {/* Delete button (only for items that are not standard, i.e. starting with vid_ to avoid deleting initial clips, but let's allow deleting anything added) */}
                    {vid.id.startsWith('vid_') && (
                      <button
                        onClick={(e) => handleDeleteVideo(vid.id, e)}
                        className="absolute right-2 bottom-2 text-gray-500 hover:text-red-400 p-1 rounded hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete custom clip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
      <AdsterraAd type={2} />
    </div>
  );
}
