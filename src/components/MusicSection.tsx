import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Music, Plus, Search, Heart, Sparkles, Disc, 
  AlertCircle, Trash2, X, Clipboard, ExternalLink, Calendar, User,
  Star, Pin, Pause, RotateCcw, RotateCw, Volume2, VolumeX, SkipBack, SkipForward
} from 'lucide-react';
import { useBackend } from '../context/BackendContext';
import { useAudioPlayer, QueueItem } from '../context/AudioPlayerContext';
import { Album } from '../types';

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl: string;
  audioUrl?: string;
  duration?: string;
  spotifyUrl: string;
  spotifyEmbed?: string;
  youtubeUrl?: string;
  externalUrl?: string;
  published?: boolean;
  lyrics?: string;
  description?: string;
  genre?: string; // Holds the Era year (e.g. 2020)
  tags?: string[] | string;
  releaseDate?: string;
  submittedBy?: string;
  submittedAt?: string;
  displayName?: string;
}

const TIMELINE_YEARS = [
  'All Eras', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'
];

export default function MusicSection({ config: passedConfig }: { config?: any }) {
  const { currentUser, registerUser } = useBackend();
  const isAdmin = !!localStorage.getItem('bts_admin_token');

  // Inline sign-in or name chosen if missing session
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerDisplayName, setRegisterDisplayName] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');

  // Local storage persisted favorites list
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('bts_music_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Get variables from global audio player
  const { currentTrack, setWholeQueue, isPlaying, togglePlay } = useAudioPlayer();

  // Track currently selected mapped directly from the global bottom player
  const activePlaybackId = currentTrack?.id || null;

  // Raw tracks fetched from server database
  const [digitalTracks, setDigitalTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEra, setSelectedEra] = useState('All Eras');

  // Submit Modal state
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [spotifyLink, setSpotifyLink] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formArtist, setFormArtist] = useState('');
  const [formCoverUrl, setFormCoverUrl] = useState('');
  const [formEra, setFormEra] = useState('2026');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync favorites back to localStorage
  useEffect(() => {
    localStorage.setItem('bts_music_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (trackId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setFavorites(prev => {
      if (prev.includes(trackId)) {
        return prev.filter(id => id !== trackId);
      } else {
        return [...prev, trackId];
      }
    });
  };

  const fetchMusicData = async () => {
    try {
      const res = await fetch('/api/config/published');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.digitalTracks)) {
          setDigitalTracks(data.digitalTracks);
        }
      }
    } catch (err) {
      console.error('Failed to load published music configs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll for fresh submissions occasionally
  useEffect(() => {
    fetchMusicData();
    const interval = setInterval(fetchMusicData, 7000);
    return () => clearInterval(interval);
  }, []);

  // Handle auto-fetching when pasting Spotify link
  const syncSpotifyMetadata = async (urlStr: string) => {
    if (!urlStr || !urlStr.trim()) return;
    const cleanUrl = urlStr.trim();

    // Check if valid Spotify link structure inside url
    const regex = /(playlist|album|track|artist)[\/:]([a-zA-Z0-9]+)/;
    if (!regex.test(cleanUrl)) {
      setFormError('Please input a valid Spotify track, album, or playlist URL.');
      return;
    }

    setIsResolving(true);
    setFormError('');
    setFormSuccess('');

    try {
      // 1. Try Spotify platform oEmbed endpoint first
      const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`;
      const response = await fetch(oembedUrl);
      if (response.ok) {
        const oembedData = await response.json();
        if (oembedData && oembedData.title) {
          let title = oembedData.title;
          let artist = oembedData.author_name || 'BTS';

          // Trim out " - song by artist" or similar patterns often found in oembed titles
          if (title.includes(' - Song by ')) {
            const parts = title.split(' - Song by ');
            title = parts[0];
            artist = parts[1] || artist;
          } else if (title.includes(' - song by ')) {
            const parts = title.split(' - song by ');
            title = parts[0];
            artist = parts[1] || artist;
          } else if (title.includes(' - playlist by ')) {
            const parts = title.split(' - playlist by ');
            title = parts[0];
            artist = parts[1] || artist;
          } else if (title.includes(' - album by ')) {
            const parts = title.split(' - album by ');
            title = parts[0];
            artist = parts[1] || artist;
          }

          setFormTitle(title);
          setFormArtist(artist);
          setFormCoverUrl(oembedData.thumbnail_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300');
          setFormSuccess('Spotify metadata synchronized in real-time! 🎧🎉');
          setIsResolving(false);
          return;
        }
      }

      // 2. Fall back to backend custom resolver if client fetch failed or was CORS-blocked
      const res = await fetch('/api/spotify/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.title) {
          setFormTitle(data.title);
          setFormArtist(data.artist || 'BTS');
          setFormCoverUrl(data.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300');
          setFormSuccess('Spotify metadata retrieved via connection! 🌌⚡');
          setIsResolving(false);
          return;
        }
      }

      // 3. Fallback to basic extraction
      setFormTitle('Spotify Community Pitch');
      setFormArtist('BTS');
      setFormCoverUrl('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300');
      setFormSuccess('Ready to share coordinates! 🎵');
    } catch (err) {
      console.error('Spotify resolver error:', err);
      setFormTitle('ARMY Synced Song');
      setFormArtist('BTS');
      setFormCoverUrl('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300');
    } finally {
      setIsResolving(false);
    }
  };

  // Watch input link to trigger real-time auto-fetch
  useEffect(() => {
    const trimmed = spotifyLink.trim();
    if (trimmed) {
      const timer = setTimeout(() => {
        syncSpotifyMetadata(trimmed);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [spotifyLink]);

  // Inline registration handle
  const handleRegisterUserInline = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    if (!registerUsername.trim()) {
      setRegisterError('Username is required.');
      return;
    }
    if (!registerDisplayName.trim()) {
      setRegisterError('Display name is required.');
      return;
    }
    const cleanUsername = registerUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      setRegisterError('Username must be at least 3 letters/numbers without spaces.');
      return;
    }
    const ok = await registerUser(cleanUsername, registerDisplayName.trim());
    if (ok) {
      setRegisterSuccess('Identity established successfully! 💜');
    } else {
      setRegisterError('Registration failed. Username may be taken.');
    }
  };

  // Submit shared music coordinates
  const handleMusicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!currentUser) {
      setFormError('An absolute ARMY identity is required to share music.');
      return;
    }

    if (!spotifyLink.trim()) {
      setFormError('A valid Spotify track, album, or playlist link is required.');
      return;
    }

    if (!formTitle.trim() || !formArtist.trim()) {
      setFormError('Title and Artist are required. Please check your Spotify link.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/music/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          artist: formArtist.trim(),
          audioUrl: '',
          spotifyUrl: spotifyLink.trim(),
          description: formDescription.trim() || 'Awesome Spotify track shared by ARMY community.',
          genre: formEra, // Holds the timeline Year (e.g. 2020)
          tags: ['spotify', 'shared', 'army-station'],
          coverUrl: formCoverUrl.trim() || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
          submittedBy: currentUser?.username || 'guest',
          displayName: currentUser?.displayName || 'Guest ARMY'
        })
      });

      if (res.ok) {
        setFormSuccess('Your Spotify Track has been automatically published live! 🎉💜');
        setSpotifyLink('');
        setFormTitle('');
        setFormArtist('');
        setFormCoverUrl('');
        setFormDescription('');
        
        // Refresh local array
        setTimeout(() => {
          fetchMusicData();
          setShowSubmissionForm(false);
          setFormSuccess('');
        }, 1200);
      } else {
        const errorData = await res.json();
        setFormError(errorData.error || 'Failed to submit shared track.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network failure submitting track.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper inside component to parse type & ID from Spotify address and return embedded iframe URL
  const getEmbeddedPlayerUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    const regex = /(playlist|album|track|artist)[\/:]([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    if (match) {
      const type = match[1];
      const id = match[2];
      return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
    }
    return null;
  };

  // Format Date cleanly
  const formatDate = (isoStr: string | undefined) => {
    if (!isoStr) return 'Recently Shared';
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  // Filters calculation
  const filteredTracks = digitalTracks.filter(track => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      track.title.toLowerCase().includes(query) ||
      track.artist.toLowerCase().includes(query) ||
      (track.submittedBy || '').toLowerCase().includes(query) ||
      (track.displayName || '').toLowerCase().includes(query);

    const matchesEra = selectedEra === 'All Eras' || track.genre === selectedEra;
    return matchesSearch && matchesEra;
  });

  // Highlight and prioritize Pinned and Spotlight tracks at the top
  const sortedTracks = [...filteredTracks].sort((a, b) => {
    const aSpot = !!a.isSpotlight;
    const bSpot = !!b.isSpotlight;
    if (aSpot && !bSpot) return -1;
    if (!aSpot && bSpot) return 1;

    const aPin = !!a.isPinned;
    const bPin = !!b.isPinned;
    if (aPin && !bPin) return -1;
    if (!aPin && bPin) return 1;

    return 0;
  });

  const handlePlayTrackAtIndex = (index: number) => {
    const queueItems: QueueItem[] = sortedTracks.map(t => {
      const albumObj: Album = {
        id: t.album || t.id + '-album_wrapper',
        title: t.album || 'Digital Archive',
        coverUrl: t.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
        type: 'group_song',
        releaseDate: t.releaseDate || '2026',
        description: t.description || '',
        tracks: [],
        spotifyEmbed: '',
        appleMusicEmbed: '',
        youtubeEmbed: '',
        relatedVideos: [],
        gallery: []
      };
      return {
        track: {
          id: t.id,
          title: t.title,
          artist: t.artist,
          duration: t.duration || '3:30',
          audioUrl: t.audioUrl || '',
          spotifyUrl: t.spotifyUrl || '',
          description: t.description || '',
          genre: t.genre || 'BTS',
          coverUrl: t.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
        },
        album: albumObj
      };
    });

    setWholeQueue(queueItems, index);
  };

  return (
    <div className="min-h-screen bg-[#070412] text-stone-100 py-10 px-4 md:px-8 font-sans" id="spotify-music-page-root">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Aesthetic Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-950/40 border border-purple-500/20 rounded-full text-purple-300 font-mono text-[10px] uppercase font-bold tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            Spotify Music Station
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold pb-1 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-100 via-pink-200 to-indigo-200 uppercase font-mono">
            ARMY Spotify Stream
          </h1>
          <p className="text-stone-400 text-xs md:text-sm leading-relaxed max-w-lg mx-auto">
            A beautiful, fully real-time Spotify platform. Paste and instantly share your favorite Spotify tracks, albums, or public playlists directly to the ARMY public coordinates board!
          </p>
        </div>

        {/* Central Controls: Search, Era Filter and Share Button */}
        <div className="bg-black/30 border border-purple-500/10 backdrop-blur-md p-4 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-2xl">
          
          {/* Leftside: Search & Selection */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full md:w-auto flex-1">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search songs, artists, or ARMY curators..."
                className="w-full bg-[#0a061b]/80 border border-purple-500/15 hover:border-purple-500/30 focus:border-purple-400 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-200 focus:outline-none placeholder:text-stone-600 transition-all font-sans"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Selector filter for Era Coordinates */}
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-[10px] uppercase font-mono text-purple-400 font-bold hidden sm:inline">Era:</label>
              <select
                value={selectedEra}
                onChange={(e) => setSelectedEra(e.target.value)}
                className="bg-[#0a061b]/80 border border-purple-500/15 hover:border-purple-500/30 focus:border-purple-400 focus:outline-none rounded-2xl px-4 py-2.5 text-xs text-stone-300 transition-all font-sans"
              >
                {TIMELINE_YEARS.map(yr => (
                  <option key={yr} value={yr} className="bg-[#070412] text-stone-300">
                    {yr === 'All Eras' ? 'All BTS Eras' : `Era ${yr}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rightside: Share a Spotify Link Action Button */}
          <button
            onClick={() => setShowSubmissionForm(true)}
            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-95 text-white font-mono text-xs font-bold uppercase rounded-2xl flex items-center justify-center gap-2.5 transition-all select-none cursor-pointer hover:shadow-lg hover:shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            Share Spotify Link
          </button>
        </div>

        {/* PUBLIC MUSIC CORNER GRID */}
        {loading ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-10 h-10 border-2 border-t-purple-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-stone-500 uppercase tracking-widest font-mono">Syncing cosmic coordinate links...</p>
          </div>
        ) : sortedTracks.length === 0 ? (
          <div className="text-center py-24 bg-black/15 border border-purple-500/5 rounded-3xl p-8 max-w-md mx-auto space-y-4">
            <Disc className="w-12 h-12 text-purple-500/30 mx-auto animate-spin" style={{ animationDuration: '8s' }} />
            <h3 className="font-bold text-stone-300 text-sm font-mono uppercase tracking-wide">No Coordinate Matches</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              No matching Spotify tracks shared for this selection. Be the first to launch a track coordinates link!
            </p>
            <button
              onClick={() => setShowSubmissionForm(true)}
              className="px-4 py-2 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/25 rounded-xl text-stone-300 font-mono text-[10px] uppercase font-bold"
            >
              Share Music Now 💜
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start relative animate-in fade-in duration-500">
            {/* Left Side: Spotify-style List Layout */}
            <div className="flex-1 w-full space-y-2">
              <div className="hidden sm:flex items-center justify-between px-4 py-2 border-b border-purple-500/10 text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">
                <div className="flex items-center gap-4 flex-1">
                  <span className="w-8 text-center">#</span>
                  <span>Title / Artist</span>
                </div>
                <div className="flex items-center gap-6 pr-24">
                  <span className="w-24 text-left">Era</span>
                  <span className="w-36 text-left">Curator</span>
                </div>
              </div>

              <div className="space-y-2" id="spotify-list-layout-container">
                {sortedTracks.map((track, idx) => {
                  const isFav = favorites.includes(track.id);
                  const isActive = activePlaybackId === track.id;
                  const isCustom = !!track.audioUrl;
                  
                  return (
                    <div
                      key={track.id}
                      onClick={() => {
                        if (isActive) {
                          togglePlay();
                        } else {
                          handlePlayTrackAtIndex(idx);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl bg-black/15 border transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'border-purple-500 bg-purple-950/20 shadow-lg shadow-purple-900/10 animate-pulse'
                          : track.isSpotlight
                          ? 'border-amber-500/40 bg-amber-950/15 hover:border-amber-400/60 hover:bg-amber-950/25'
                          : track.isPinned
                          ? 'border-indigo-500/20 bg-indigo-950/10 hover:border-indigo-500/40 hover:bg-indigo-950/20'
                          : 'border-purple-500/5 hover:border-purple-500/25 bg-[#0a061b]/35 hover:bg-[#0a061b]/65'
                      }`}
                      id={`music-track-row-${track.id}`}
                    >
                      {/* Left Block: Thumbnail and details */}
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="flex items-center justify-center w-8 shrink-0 text-stone-500 font-mono text-xs">
                          {isActive ? (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                            </span>
                          ) : track.isSpotlight ? (
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                          ) : track.isPinned ? (
                            <Pin className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                          ) : (
                            <span className="text-[11px] font-bold text-stone-600">{idx + 1}</span>
                          )}
                        </div>

                        <img
                          src={track.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'}
                          alt={track.title}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 object-cover rounded-xl shrink-0 border border-purple-500/10"
                        />

                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-stone-100 text-sm truncate max-w-[220px]">
                              {track.title}
                            </span>
                            {track.isSpotlight && (
                              <span className="px-1.5 py-0.5 text-[8px] font-mono leading-none bg-amber-500 text-black font-bold rounded shadow-sm">
                                🌟 Spotlight
                              </span>
                            )}
                            {track.isPinned && (
                              <span className="px-1.5 py-0.5 text-[8px] font-mono leading-none bg-indigo-600 text-white font-bold rounded shadow-sm">
                                📌 Pinned
                              </span>
                            )}
                          </div>
                          <p className="text-[11.5px] text-stone-400 truncate">{track.artist}</p>
                        </div>
                      </div>

                      {/* Middle Block: Era & Curator metadata */}
                      <div className="hidden sm:flex items-center gap-6 text-xs text-stone-400 font-mono pr-6 shrink-0">
                        <div className="w-24 text-left">
                          <span className="px-2 py-0.5 rounded-full bg-purple-950/50 border border-purple-500/10 text-[9px] text-purple-300 font-bold uppercase tracking-wider">
                            Era {track.genre || 'BTS'}
                          </span>
                        </div>
                        <div className="w-36 text-left truncate flex items-center gap-1 text-stone-300">
                          <User className="w-3 h-3 text-purple-400 shrink-0" />
                          <span className="truncate">@{track.submittedBy || 'guest'}</span>
                        </div>
                      </div>

                      {/* Right Block: Interactive triggers (favorites and play) */}
                      <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => toggleFavorite(track.id, e)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isFav
                              ? 'bg-pink-600/20 border-pink-500/40 text-pink-400 hover:bg-pink-500/30'
                              : 'bg-black/40 border-purple-500/10 text-stone-400 hover:text-white hover:bg-black/60'
                          }`}
                          title={isFav ? "Remove from Favorites" : "Mark Favorite"}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isActive) {
                              togglePlay();
                            } else {
                              handlePlayTrackAtIndex(idx);
                            }
                          }}
                          className={`p-2.5 rounded-full transition-all cursor-pointer ${
                            isActive
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                              : 'bg-purple-950/80 border border-purple-500/20 text-purple-300 hover:bg-purple-600 hover:text-white'
                          }`}
                        >
                          {isActive && isPlaying ? (
                            <Pause className="w-3.5 h-3.5 animate-pulse" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SUBMISSION MODAL DRAWER OVERLAY */}
        <AnimatePresence>
          {showSubmissionForm && (
            <div id="spotify-music-submission-overlay" className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-xl bg-[#090618] border border-purple-500/20 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative"
              >
                
                {/* Header title */}
                <div className="flex justify-between items-center pb-3 border-b border-purple-500/10">
                  <div className="flex items-center gap-2 text-stone-100">
                    <div className="p-1.5 bg-purple-950/60 border border-purple-500/20 rounded-lg">
                      <Music className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm md:text-base uppercase tracking-wider font-mono bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-200">
                        Share Spotify Link
                      </h3>
                      <p className="text-[10px] text-stone-500">Auto-approves instantly on the public coordinates board</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSubmissionForm(false)}
                    className="text-stone-400 hover:text-white p-1 rounded-full bg-black/40 border border-purple-500/5 hover:border-purple-500/20 transition-all select-none cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Verification/Registration block inside if NO established ARMY user session */}
                {!currentUser ? (
                  <div className="space-y-4 p-4 md:p-5 rounded-2xl bg-purple-950/15 border border-purple-500/20">
                    <div className="flex gap-2 text-stone-300">
                      <AlertCircle className="w-5 h-5 text-purple-400 shrink-0" />
                      <div className="space-y-1">
                        <span className="font-mono text-xs uppercase font-extrabold text-white block">Identity Required</span>
                        <p className="text-[11px] text-stone-400 leading-relaxed">
                          To keep track of curation history and prevent duplicate pitches, you need active, unique username coordinates to share songs. Pitch your custom handle below!
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleRegisterUserInline} className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-purple-300 uppercase block font-bold">Curator Username*</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. bts_fan_99"
                            value={registerUsername}
                            onChange={(e) => setRegisterUsername(e.target.value)}
                            className="w-full bg-[#04020a]/90 text-stone-200 border border-purple-500/10 hover:border-purple-500/25 focus:border-purple-400 rounded-xl px-3 py-2 text-xs focus:outline-none placeholder:text-stone-700 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-purple-300 uppercase block font-bold">Display Profile Name*</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Taehyung Lover"
                            value={registerDisplayName}
                            onChange={(e) => setRegisterDisplayName(e.target.value)}
                            className="w-full bg-[#04020a]/90 text-stone-200 border border-purple-500/10 hover:border-purple-500/25 focus:border-purple-400 rounded-xl px-3 py-2 text-xs focus:outline-none placeholder:text-stone-700"
                          />
                        </div>
                      </div>

                      {registerError && <p className="text-xxs text-red-400 font-mono">⚠️ {registerError}</p>}
                      {registerSuccess && <p className="text-xxs text-emerald-400 font-mono">✓ {registerSuccess}</p>}

                      <button
                        type="submit"
                        className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold uppercase rounded-xl transition-all cursor-pointer select-none"
                      >
                        Launch My ARMY Identity ⚡
                      </button>
                    </form>
                  </div>
                ) : (
                  
                  // Active Submission cassettes form
                  <form onSubmit={handleMusicSubmit} className="space-y-5 font-sans">
                    
                    {/* User profile identifier bar */}
                    <div className="bg-[#05030e] p-3 rounded-2xl border border-purple-500/10 flex items-center justify-between text-xs text-stone-400">
                      <span className="font-sans">Curator: <span className="text-purple-300 font-mono font-bold">@{currentUser.username}</span></span>
                      <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-purple-950/60 border border-purple-500/10 text-purple-400 rounded-md font-bold">Verified Account 💜</span>
                    </div>

                    {/* Spotify URL pastable link input */}
                    <div className="space-y-1.5 p-4 rounded-2xl bg-black/40 border border-purple-500/10">
                      <label className="font-mono text-xxs text-purple-300 uppercase block font-extrabold tracking-wider">
                        Spotify Music Link (Track, Album, or Playlist) *
                      </label>
                      <p className="text-[10px] text-stone-400 leading-normal pb-1">
                        Paste your link and watch the coordinates automatically resolve and build the live embed player!
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          required
                          value={spotifyLink}
                          onChange={(e) => setSpotifyLink(e.target.value)}
                          placeholder="e.g. https://open.spotify.com/track/50YgV9Hq..."
                          className="flex-grow bg-[#04020a]/80 text-stone-300 border border-purple-500/15 focus:border-purple-400 rounded-xl px-3 py-2 text-xs focus:outline-none placeholder:text-stone-700 font-mono"
                        />
                        <button
                          type="button"
                          disabled={isResolving}
                          onClick={() => syncSpotifyMetadata(spotifyLink)}
                          className="px-3 py-2 bg-purple-950/40 hover:bg-purple-900 border border-purple-500/20 text-purple-300 font-mono text-[10px] uppercase font-bold rounded-xl transition-all shrink-0 cursor-pointer select-none"
                        >
                          {isResolving ? 'Syncing...' : 'Sync ⚡'}
                        </button>
                      </div>
                    </div>

                    {/* Auto Resolved Preview area (Song title, artist, cover artwork thumbnail and embedded player preview!) */}
                    {(formTitle || isResolving) && (
                      <div className="p-4 rounded-2xl bg-[#05030e]/95 border border-purple-500/15 space-y-4">
                        <span className="font-mono text-[9px] text-pink-400 uppercase tracking-widest block font-extrabold">Auto-fetched Metadata Preview</span>
                        
                        {isResolving ? (
                          <div className="text-center py-6 space-y-2">
                            <div className="w-5 h-5 border-2 border-t-purple-400 border-r-purple-400 border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
                            <span className="text-[10px] font-mono text-purple-400/70 block uppercase">Fetching oEmbed streams...</span>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Standard details block */}
                            <div className="flex items-center gap-3">
                              <img 
                                src={formCoverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'} 
                                className="w-14 h-14 object-cover rounded-xl border border-purple-500/10 shadow-md"
                                alt="Cover preview"
                                referrerPolicy="no-referrer"
                              />
                              <div className="text-xs space-y-1">
                                <h5 className="font-extrabold text-white text-xs">{formTitle}</h5>
                                <p className="text-stone-400 text-xxs font-mono truncate">{formArtist}</p>
                              </div>
                            </div>

                            {/* Actual Embedded Player Preview iframe */}
                            {getEmbeddedPlayerUrl(spotifyLink) && (
                              <div className="space-y-1.5">
                                <span className="font-mono text-[8.5px] text-purple-300 uppercase block font-bold">Embedded Player preview</span>
                                <div className="h-[80px] w-full rounded-xl overflow-hidden border border-purple-500/10 shadow-inner bg-black">
                                  <iframe
                                    src={getEmbeddedPlayerUrl(spotifyLink) || undefined}
                                    width="100%"
                                    height="80"
                                    frameBorder="0"
                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                    loading="lazy"
                                  ></iframe>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Era Timeline selector mapping */}
                      <div className="space-y-1.5">
                        <label className="text-[10.5px] font-mono text-purple-300 uppercase block font-bold">BTS Era chronological Year</label>
                        <select
                          value={formEra}
                          onChange={(e) => setFormEra(e.target.value)}
                          className="w-full bg-[#04020a]/80 text-stone-200 border border-purple-500/15 focus:border-purple-400 rounded-xl px-3 py-2 text-xs focus:outline-none font-sans"
                        >
                          {TIMELINE_YEARS.filter(y => y !== 'All Eras').map(yr => (
                            <option key={yr} value={yr}>BTS Era {yr}</option>
                          ))}
                        </select>
                      </div>

                      {/* Descriptive short caption */}
                      <div className="space-y-1.5">
                        <label className="text-[10.5px] font-mono text-purple-300 uppercase block font-bold">Curator Accolade Description</label>
                        <input
                          type="text"
                          placeholder="e.g. Absolutely loving Jimin's Solo vocals! 💜"
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          className="w-full bg-[#04020a]/80 text-stone-200 border border-purple-500/15 focus:border-purple-400 rounded-xl px-3 py-2 text-xs focus:outline-none placeholder:text-stone-700"
                        />
                      </div>
                    </div>

                    {formError && <p className="text-xxs text-red-400 p-2.5 bg-red-950/15 border border-red-500/10 rounded-xl font-mono text-center">⚠️ {formError}</p>}
                    {formSuccess && <p className="text-xxs text-emerald-400 p-2.5 bg-emerald-950/15 border border-emerald-500/10 rounded-xl font-mono text-center">✓ {formSuccess}</p>}

                    <button
                      type="submit"
                      disabled={submitting || isResolving}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-mono text-xs font-bold uppercase rounded-2xl transition-all select-none cursor-pointer hover:shadow-lg shadow-purple-600/10"
                    >
                      {submitting ? 'Auto-Publishing Track...' : 'Publish Instantly Live ⚡'}
                    </button>

                  </form>
                )}

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
