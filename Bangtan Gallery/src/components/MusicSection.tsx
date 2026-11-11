import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Music, Plus, Search, Heart, Sparkles, Disc, 
  AlertCircle, Trash2, X, Clipboard, ExternalLink, Calendar, User,
  Star, Pin, Pause, RotateCcw, RotateCw, Volume2, VolumeX, SkipBack, SkipForward,
  ChevronDown, ChevronUp, UploadCloud, CheckCircle2,
  Mic, Radio, Music2, Wand2, RefreshCw, Send, Clock, FileText, Shuffle
} from 'lucide-react';
import { useBackend } from '../context/BackendContext';
import { useAudioPlayer, QueueItem } from '../context/AudioPlayerContext';
import { Album } from '../types';
import { getYoutubeVideoId, getYoutubeEmbedUrl } from './youtubeUtils';
import CountrySelect from './CountrySelect';
import { getSavedCountry, saveCountry, pinCountry } from '../utils/armyMap';
import { ensureProfile, profileName, profileHandle } from '../utils/profile';
import StreamingGoals from './StreamingGoals';

// Helper to parse any Spotify track, album, playlist, artist URL or iframe embed code
export const parseSpotifyInput = (input: string | undefined): { type: string; id: string; embedUrl: string; canonicalUrl: string } | null => {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. If an iframe embed code was pasted, extract src
  let target = trimmed;
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (srcMatch) {
    target = srcMatch[1];
  }

  // 2. Extract Spotify type and ID
  // Handles intl-xx prefixes like /intl-es/track/ID and embed paths
  const regex = /(?:intl-[a-z]{2}\/)?(?:embed\/)?(playlist|album|track|artist)[\/:]([a-zA-Z0-9]+)/i;
  const match = target.match(regex);
  if (match) {
    const type = match[1].toLowerCase();
    const id = match[2];
    return {
      type,
      id,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
      canonicalUrl: `https://open.spotify.com/${type}/${id}`
    };
  }

  return null;
};

export const getEmbeddedPlayerUrl = (url: string | undefined): string | null => {
  if (!url) return null;
  const parsed = parseSpotifyInput(url);
  return parsed ? parsed.embedUrl : null;
};

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
  lyricsKo?: string;
  lyricsEn?: string;
  description?: string;
  genre?: string; // Holds the Era year (e.g. 2020)
  tags?: string[] | string;
  releaseDate?: string;
  submittedBy?: string;
  submittedAt?: string;
  displayName?: string;
  isSpotlight?: boolean;
  isPinned?: boolean;
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
  const { currentTrack, setWholeQueue, isPlaying, togglePlay, setSpotifyPanelActive, openLyrics } = useAudioPlayer();

  // Track currently selected mapped directly from the global bottom player
  const activePlaybackId = currentTrack?.id || null;

  // Raw tracks fetched from server database
  const [digitalTracks, setDigitalTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEra, setSelectedEra] = useState('All Eras');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false); // Batch 104

  // Submit Modal state
  // Submit Modal state
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [submissionType, setSubmissionType] = useState<'youtube' | 'spotify' | 'custom' | 'status'>('youtube');
  const [spotifyLink, setSpotifyLink] = useState('');
  const [formAudioUrl, setFormAudioUrl] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formArtist, setFormArtist] = useState('');
  const [formCoverUrl, setFormCoverUrl] = useState('');
  const [formEra, setFormEra] = useState('2026');
  const [formDescription, setFormDescription] = useState('');
  const [formCountry, setFormCountry] = useState(() => getSavedCountry()); // Batch 91
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Audio upload timing state (shows elapsed time and processing duration)
  const [audioUploadState, setAudioUploadState] = useState<{
    isUploading: boolean;
    progress: number;
    elapsedSec: number;
    isProcessing: boolean;
    processingSec: number;
    fileSizeStr: string;
    completed: boolean;
  }>({
    isUploading: false,
    progress: 0,
    elapsedSec: 0,
    isProcessing: false,
    processingSec: 0,
    fileSizeStr: '',
    completed: false
  });

  // Track user submissions & status view
  const [mySubmissionsList, setMySubmissionsList] = useState<any[]>([]);
  const [isLoadingMySubmissions, setIsLoadingMySubmissions] = useState(false);

  // YouTube Submission states (integrated directly into Submit Track modal)
  const [identityYoutubeUrl, setIdentityYoutubeUrl] = useState('');
  const [identityVideoTitle, setIdentityVideoTitle] = useState('');
  const [identityArtist, setIdentityArtist] = useState('BTS');
  const [identityThumbnail, setIdentityThumbnail] = useState('');
  const [identityVideoId, setIdentityVideoId] = useState('');
  const [identityEra, setIdentityEra] = useState('2026');
  const [identityNotes, setIdentityNotes] = useState('');
  const [isValidatingYoutube, setIsValidatingYoutube] = useState(false);

  // Sync favorites back to localStorage
  useEffect(() => {
    localStorage.setItem('bts_music_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Batch 104: the bottom player's heart writes the same key —
  // stay in sync while both are on screen.
  useEffect(() => {
    const reload = () => {
      try {
        const stored = localStorage.getItem('bts_music_favorites');
        if (stored) setFavorites(JSON.parse(stored));
      } catch { /* noop */ }
    };
    window.addEventListener('bts-favorites-changed', reload);
    return () => window.removeEventListener('bts-favorites-changed', reload);
  }, []);

  const toggleFavorite = (trackId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const next = favorites.includes(trackId)
      ? favorites.filter(id => id !== trackId)
      : [...favorites, trackId];
    setFavorites(next);
    try {
      localStorage.setItem('bts_music_favorites', JSON.stringify(next));
    } catch { /* noop */ }
    window.dispatchEvent(new Event('bts-favorites-changed'));
  };

  const fetchMusicData = async () => {
    try {
      let combinedTracks: Track[] = [];

      // 1. Load published tracks
      const res = await fetch('/api/config/published');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.digitalTracks)) {
          combinedTracks = data.digitalTracks;
        }
      }

      // 2. Only merge submissions that have been explicitly approved by an admin
      try {
        const subRes = await fetch('/api/music/submissions');
        if (subRes.ok) {
          const subData = await subRes.json();
          if (subData && Array.isArray(subData.submissions)) {
            const existingIds = new Set(combinedTracks.map(t => t.id));
            const submissionTracks: Track[] = subData.submissions
              .filter((s: any) => s.status === 'approved' && (s.spotifyUrl || s.spotifyEmbed || s.audioUrl || s.youtubeUrl))
              .map((s: any) => ({
                id: s.id,
                title: s.title || 'Official Track',
                artist: s.artist || 'BTS',
                audioUrl: s.audioUrl || '',
                spotifyUrl: s.spotifyUrl || '',
                spotifyEmbed: s.spotifyEmbed || '',
                coverUrl: s.coverUrl || s.thumbnailUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg',
                genre: s.genre || s.album || '2026',
                submittedBy: s.submittedBy || 'admin',
                displayName: s.displayName || 'ARMY Curator',
                description: s.description || s.notes || 'Curated track',
                isPinned: s.isPinned || false,
                isSpotlight: s.isSpotlight || false
              }))
              .filter((t: Track) => !existingIds.has(t.id));

            if (submissionTracks.length > 0) {
              combinedTracks = [...submissionTracks, ...combinedTracks];
            }
          }
        }
      } catch {
        // quiet ignore
      }

      // Drop entries with no playable source at all (e.g. a track
      // saved with an empty audio link) — they rendered as cards
      // that could never play.
      combinedTracks = combinedTracks.filter((t: any) =>
        (t.audioUrl && String(t.audioUrl).trim() !== '') ||
        (t.spotifyUrl && String(t.spotifyUrl).trim() !== '') ||
        (t.spotifyEmbed && String(t.spotifyEmbed).trim() !== '') ||
        (t.youtubeUrl && String(t.youtubeUrl).trim() !== '')
      );

      if (combinedTracks.length > 0) {
        setDigitalTracks(combinedTracks);
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

  // Handle auto-fetching when pasting Spotify, YouTube, or music link
  const syncMusicMetadata = async (urlStr: string) => {
    if (!urlStr || !urlStr.trim()) return;
    const cleanInput = urlStr.trim();

    setIsResolving(true);
    setFormError('');
    setFormSuccess('');

    try {
      // 1. If it's a Spotify link/embed, try direct oEmbed
      const parsedSpotify = parseSpotifyInput(cleanInput);
      if (parsedSpotify) {
        try {
          const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(parsedSpotify.canonicalUrl)}`;
          const response = await fetch(oembedUrl);
          if (response.ok) {
            const oembedData = await response.json();
            if (oembedData && oembedData.title) {
              let title = oembedData.title;
              let artist = oembedData.author_name || 'BTS';
              if (title.includes(' - Song by ')) {
                const parts = title.split(' - Song by ');
                title = parts[0];
                artist = parts[1] || artist;
              } else if (title.includes(' - song by ')) {
                const parts = title.split(' - song by ');
                title = parts[0];
                artist = parts[1] || artist;
              }
              setFormTitle(title);
              setFormArtist(artist);
              setFormCoverUrl(oembedData.thumbnail_url || 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg');
              setFormSuccess('Spotify metadata synchronized in real-time! 🎧🎉');
              setIsResolving(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Direct spotify oEmbed error:', e);
        }
      }

      // 2. Call backend universal identifier (handles YouTube, Spotify, and song titles)
      const res = await fetch('/api/music/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanInput, query: cleanInput })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.title) {
          setFormTitle(data.title);
          setFormArtist(data.artist || 'BTS');
          if (data.coverUrl || data.thumbnail) {
            setFormCoverUrl(data.coverUrl || data.thumbnail);
          }
          if (data.era || data.genre) {
            setFormEra(data.era || data.genre);
          }
          if (data.type === 'youtube') {
            setSubmissionType('custom');
            setFormAudioUrl(data.youtubeUrl || cleanInput);
          }
          setFormSuccess(`Music recognized: "${data.title}" by ${data.artist || 'BTS'}! 🎧🎉`);
          setIsResolving(false);
          return;
        }
      }

      // Fallback
      if (parsedSpotify) {
        setFormTitle(`Spotify ${parsedSpotify.type.toUpperCase()}`);
        setFormArtist('BTS');
        setFormCoverUrl('https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg');
      }
    } catch (err) {
      console.error('Music resolver error:', err);
    } finally {
      setIsResolving(false);
    }
  };

  const syncSpotifyMetadata = syncMusicMetadata;

  // Watch input link to trigger real-time auto-fetch
  useEffect(() => {
    const trimmed = spotifyLink.trim();
    if (trimmed) {
      const timer = setTimeout(() => {
        syncMusicMetadata(trimmed);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [spotifyLink]);

  // YouTube Song Validator & Metadata Handler for User Submissions
  const validateYoutubeMusicUrl = async (urlStr: string) => {
    const trimmed = urlStr.trim();
    if (!trimmed) {
      setIdentityVideoId('');
      setIdentityThumbnail('');
      return;
    }

    const vidId = getYoutubeVideoId(trimmed);
    if (!vidId) {
      setIdentityVideoId('');
      setIdentityThumbnail('');
      return;
    }

    setIdentityVideoId(vidId);
    const thumb = `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`;
    setIdentityThumbnail(thumb);
    setIsValidatingYoutube(true);

    try {
      const oembedRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${vidId}`);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        if (oembedData && oembedData.title) {
          let title = oembedData.title;
          let artist = oembedData.author_name || 'BTS';
          if (title.includes(' - ')) {
            const parts = title.split(' - ');
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim();
          }
          title = title.replace(/\(Official MV\)|\(Official Music Video\)|\[Official MV\]|\(MV\)/gi, '').trim();
          setIdentityVideoTitle(title);
          setIdentityArtist(artist);
        }
      }
    } catch {
      if (!identityVideoTitle) {
        setIdentityVideoTitle('BTS Music Video');
      }
    } finally {
      setIsValidatingYoutube(false);
    }
  };

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

  // Fetch user submission statuses
  const fetchMySubmissions = async () => {
    setIsLoadingMySubmissions(true);
    try {
      const res = await fetch('/api/music/submissions');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.submissions) ? data.submissions : [];
        const uname = (currentUser?.username || registerUsername || localStorage.getItem('bts_music_curator_username') || '').toLowerCase();
        const filtered = uname ? list.filter((s: any) => (s.username || s.submittedBy || '').toLowerCase().includes(uname)) : list;
        setMySubmissionsList(filtered.length > 0 ? filtered : list.slice(0, 10));
      }
    } catch {
    } finally {
      setIsLoadingMySubmissions(false);
    }
  };

  // Submit music request to Admin Panel
  const handleMusicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formCountry) {
      setFormError('Please select your country — it lights up on the ARMY World Map!');
      return;
    }

    const submitUsername = profileHandle() || currentUser?.username || registerUsername.trim() || `army_${Math.floor(1000 + Math.random() * 9000)}`;
    const submitDisplayName = profileName() || currentUser?.displayName || registerDisplayName.trim() || 'ARMY Fan';

    let finalTitle = formTitle.trim();
    let finalArtist = formArtist.trim() || 'BTS';
    let finalAudioUrl = formAudioUrl.trim();
    let finalSpotifyUrl = '';
    let finalSpotifyEmbed = '';
    let finalCover = formCoverUrl.trim();

    if (submissionType === 'youtube') {
      const cleanYt = identityYoutubeUrl.trim();
      if (!cleanYt) {
        setFormError('Please enter a YouTube video URL.');
        return;
      }
      const vidId = identityVideoId || getYoutubeVideoId(cleanYt);
      if (!vidId) {
        setFormError('Please enter a valid YouTube music video link.');
        return;
      }
      finalTitle = identityVideoTitle.trim() || 'BTS Music Video';
      finalArtist = identityArtist.trim() || 'BTS';
      finalAudioUrl = cleanYt;
      finalCover = identityThumbnail || `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`;
    } else if (submissionType === 'spotify') {
      const linkTrimmed = spotifyLink.trim();
      if (!linkTrimmed) {
        setFormError('A valid Spotify track, album, playlist or YouTube music link is required.');
        return;
      }
      if (linkTrimmed.includes('youtube.com') || linkTrimmed.includes('youtu.be')) {
        finalAudioUrl = linkTrimmed;
        finalTitle = finalTitle || 'BTS Broadcast Audio';
      } else {
        const parsed = parseSpotifyInput(linkTrimmed);
        if (parsed) {
          finalTitle = finalTitle || `Spotify ${parsed.type.toUpperCase()}`;
          finalSpotifyUrl = parsed.canonicalUrl;
          finalSpotifyEmbed = parsed.embedUrl;
        } else {
          finalTitle = finalTitle || linkTrimmed;
          finalSpotifyUrl = linkTrimmed;
        }
      }
      if (!finalCover) {
        finalCover = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg';
      }
    } else if (submissionType === 'custom') {
      if (!finalTitle) {
        setFormError('Track title is required.');
        return;
      }
      if (!finalAudioUrl) {
        setFormError('An audio URL or uploaded audio file is required.');
        return;
      }
      if (!finalCover) {
        finalCover = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg';
      }
    }

    setSubmitting(true);

    const submissionPayload = {
      id: 'msub_' + Date.now(),
      title: finalTitle,
      artist: finalArtist,
      audioUrl: finalAudioUrl,
      youtubeUrl: submissionType === 'youtube' ? finalAudioUrl : '',
      spotifyUrl: finalSpotifyUrl,
      spotifyEmbed: finalSpotifyEmbed,
      description: formDescription.trim() || identityNotes.trim() || `${submissionType.toUpperCase()} track pitch by ARMY`,
      genre: submissionType === 'youtube' ? identityEra : formEra,
      album: `Era ${submissionType === 'youtube' ? identityEra : formEra}`,
      tags: [submissionType, 'request', 'community'],
      coverUrl: finalCover,
      thumbnailUrl: finalCover,
      submittedBy: submitDisplayName,
      username: submitUsername,
      country: formCountry, // Batch 91
      submittedAt: new Date().toISOString(),
      status: 'pending' // Must be approved by Admin before appearing in public catalog!
    };

    try {
      const res = await fetch('/api/music/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionPayload)
      });

      // Cache locally to ensure immediate visibility in requests queue
      try {
        const cached = localStorage.getItem('fs_col_cache_music_submissions');
        const list = cached ? JSON.parse(cached) : [];
        list.unshift(submissionPayload);
        localStorage.setItem('fs_col_cache_music_submissions', JSON.stringify(list));
      } catch {}

      saveCountry(formCountry);
      pinCountry(formCountry);
      ensureProfile(submitDisplayName || submitUsername, { country: formCountry });
      setFormSuccess('Track request submitted directly to Admin Music Requests queue! ⏳ Once reviewed and approved by an administrator, your track will be published live to the public music catalog. 💜');
      setSpotifyLink('');
      setFormAudioUrl('');
      setFormTitle('');
      setFormArtist('');
      setFormCoverUrl('');
      setFormDescription('');
      setIdentityYoutubeUrl('');
      setIdentityVideoTitle('');
      setIdentityThumbnail('');
      setIdentityVideoId('');
      setIdentityNotes('');
      fetchMySubmissions();
    } catch (err: any) {
      setFormError(err.message || 'Error submitting music request. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
    const matchesFav = !showFavoritesOnly || favorites.includes(track.id);
    return matchesSearch && matchesEra && matchesFav;
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

  // Batch 104: Streaming Goals cover art + play always use the
  // FULL list, never a filtered view (e.g. Favorites-only).
  const allTracksSorted = [...digitalTracks].sort((a, b) => {
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

  // One player only: the bottom bar. Every track — uploaded audio or
  // Spotify — is queued into the global player and plays there; there
  // is no separate Spotify card on this page anymore.
  const activateTrack = (track: any, idx: number, isActive: boolean) => {
    if (isActive) {
      togglePlay();
    } else {
      handlePlayTrackAtIndex(idx);
    }
  };

  // Batch 78: queue building is shared by per-track play, Play All
  // and Shuffle Play.
  const buildQueueItems = (list: any[]): QueueItem[] => list.map(t => {
      const albumObj: Album = {
        id: t.album || t.id + '-album_wrapper',
        title: t.album || 'Digital Archive',
        coverUrl: t.coverUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg',
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
          lyrics: t.lyrics || '',
          lyricsKo: t.lyricsKo || '',
          lyricsEn: t.lyricsEn || '',
          description: t.description || '',
          genre: t.genre || 'BTS',
          coverUrl: t.coverUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg',
        },
        album: albumObj
      };
    });

  const handlePlayTrackAtIndex = (index: number) => {
    setWholeQueue(buildQueueItems(sortedTracks), index);
  };

  const playAllTracks = () => handlePlayTrackAtIndex(0);

  const shufflePlayTracks = () => {
    const shuffled = [...sortedTracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setWholeQueue(buildQueueItems(shuffled), 0);
  };

  return (
    <div className="min-h-screen bg-[#070412] text-stone-100 py-4 px-4 md:px-8 font-sans" id="spotify-music-page-root">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Simple header — everything plays in the bottom bar */}
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
            🎵 Enjoy your BANGTAN MUSIC
          </h1>
          <p className="text-stone-400 text-xs">
            Tap any track — it plays right in the player bar at the bottom. Spotify tracks play there too.
          </p>
          {/* Batch 78: Play All / Shuffle */}
          {sortedTracks.length > 1 && (
            <div className="flex flex-wrap gap-2 pt-2.5">
              <button
                onClick={playAllTracks}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-extrabold flex items-center gap-1.5 hover:opacity-90 cursor-pointer shadow-lg shadow-purple-900/30"
              >
                <Play className="w-3.5 h-3.5" /> Play All ({sortedTracks.length})
              </button>
              <button
                onClick={shufflePlayTracks}
                className="px-4 py-2 rounded-full border border-purple-400/40 bg-purple-500/10 text-purple-200 text-xs font-extrabold flex items-center gap-1.5 hover:bg-purple-500/20 cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" /> Shuffle
              </button>
            </div>
          )}
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

          {/* Rightside: Submit Track Action Button */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Batch 104 — Favorites filter (owner's pick #7) */}
            <button
              onClick={() => setShowFavoritesOnly((v) => !v)}
              className={`flex-1 md:flex-none px-4 py-3 font-mono text-xs font-bold uppercase rounded-2xl flex items-center justify-center gap-2 transition-all select-none cursor-pointer border ${
                showFavoritesOnly
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-400/40 shadow-lg shadow-pink-600/25'
                  : 'bg-black/30 text-pink-300 border-pink-500/25 hover:border-pink-400/50'
              }`}
              title="Show only your favorite songs"
            >
              <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              <span>Favorites ({favorites.length})</span>
            </button>
            <button
              onClick={() => {
                setShowSubmissionForm(true);
                setFormError('');
                setFormSuccess('');
              }}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-95 text-white font-mono text-xs font-bold uppercase rounded-2xl flex items-center justify-center gap-2 transition-all select-none cursor-pointer shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Track</span>
            </button>
          </div>
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
              {showFavoritesOnly
                ? 'No favorite songs in this selection yet. Tap the heart on any song above to add it here.'
                : 'No matching Spotify tracks shared for this selection. Be the first to launch a track coordinates link!'}
            </p>
            <button
              onClick={() => setShowSubmissionForm(true)}
              className="px-4 py-2 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/25 rounded-xl text-stone-300 font-mono text-[10px] uppercase font-bold"
            >
              Share Music Now 💜
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start relative animate-in fade-in duration-500 pb-28">
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
                  const hasSpotify = !!(track.spotifyUrl || track.spotifyEmbed);
                  
                  return (
                    <div
                      key={track.id}
                      className="flex flex-col space-y-2"
                    >
                      <div
                        onClick={() => activateTrack(track, idx, isActive)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl bg-black/15 border transition-all duration-300 cursor-pointer ${
                          isActive
                            ? 'border-purple-500 bg-purple-950/20 shadow-lg shadow-purple-900/10'
                            : false
                            ? 'border-[#1db954]/50 bg-[#1db954]/10 shadow-lg shadow-green-950/20'
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
                            src={track.coverUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg'}
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
                              {hasSpotify && (() => {
                                // The Spotify badge is a real link (Batch 98):
                                // clicking it opens this track on Spotify in
                                // a new tab instead of playing the row.
                                const spUrl = parseSpotifyInput(track.spotifyUrl || track.spotifyEmbed)?.canonicalUrl || track.spotifyUrl;
                                const badgeCls = "spotify-badge px-1.5 py-0.5 text-[8.5px] font-mono leading-none font-bold rounded flex items-center gap-1";
                                return spUrl ? (
                                  <a
                                    href={spUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Open on Spotify"
                                    className={`${badgeCls} transition-colors cursor-pointer`}
                                  >
                                    <Music className="w-2.5 h-2.5" /> Spotify
                                  </a>
                                ) : (
                                  <span className={badgeCls}>
                                    <Music className="w-2.5 h-2.5" /> Spotify
                                  </span>
                                );
                              })()}
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

                        {/* Right Block: Interactive triggers (favorites, embed toggle, and play) */}
                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {track.lyrics && track.lyrics.trim() !== '' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openLyrics({
                                  id: track.id,
                                  title: track.title,
                                  artist: track.artist,
                                  duration: track.duration || '',
                                  lyrics: track.lyrics,
                                  lyricsKo: track.lyricsKo || '',
                                  lyricsEn: track.lyricsEn || '',
                                  coverUrl: track.coverUrl,
                                  audioUrl: track.audioUrl || '',
                                  spotifyUrl: track.spotifyUrl || '',
                                });
                              }}
                              className="p-2 rounded-xl border bg-black/40 border-purple-500/10 text-stone-300 hover:text-white hover:bg-purple-500/20 transition-all cursor-pointer"
                              title="View lyrics"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={(e) => toggleFavorite(track.id, e)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isFav
                                ? 'bg-pink-600/25 border-pink-500/50 text-pink-400 hover:bg-pink-500/30 scale-105'
                                : 'bg-black/40 border-purple-500/10 text-stone-400 hover:text-pink-300 hover:bg-black/60'
                            }`}
                            title={isFav ? "Remove from Favorites" : "Mark Favorite"}
                          >
                            <Heart className={`w-[18px] h-[18px] ${isFav ? 'fill-current' : ''}`} />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              activateTrack(track, idx, isActive);
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

                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ARMY Streaming Goals (Batch 93) — AFTER the track list
            (owner's placement): one box, five rows visible, the
            rest scroll down inside it */}
        <div className="pb-28">
          <StreamingGoals
            goals={passedConfig?.streamingGoals}
            trackMeta={Object.fromEntries(
              allTracksSorted.map((t: any) => [
                String(t.title || '').toLowerCase(),
                { coverUrl: t.coverUrl || '', spotifyUrl: t.spotifyUrl || '' }
              ])
            )}
            onPlay={(title) => {
              const idx = allTracksSorted.findIndex(
                (t: any) => String(t.title || '').toLowerCase() === title.toLowerCase()
              );
              if (idx >= 0) setWholeQueue(buildQueueItems(allTracksSorted), idx);
            }}
          />
        </div>

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
                        Submit Music Request
                      </h3>
                      <p className="text-[10px] text-stone-400">Routes directly to Admin Music Requests queue for review</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowSubmissionForm(false);
                      setFormError('');
                      setFormSuccess('');
                    }}
                    className="text-stone-400 hover:text-white p-1 rounded-full bg-black/40 border border-purple-500/5 hover:border-purple-500/20 transition-all select-none cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Verification/Registration block inside if NO established ARMY user session */}
                {!currentUser && !profileName() ? (
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
                        Verify Curator Identity ⚡
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

                    {/* Submission Type Switcher Tabs */}
                    <div className="flex border-b border-purple-500/15 gap-2 sm:gap-4 overflow-x-auto pb-1 text-xs font-mono font-bold uppercase">
                      <button
                        type="button"
                        onClick={() => { setSubmissionType('youtube'); setFormError(''); setFormSuccess(''); }}
                        className={`pb-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                          submissionType === 'youtube'
                            ? 'text-pink-400 border-pink-400'
                            : 'text-stone-400 border-transparent hover:text-white'
                        }`}
                      >
                        YouTube Music
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSubmissionType('spotify'); setFormError(''); setFormSuccess(''); }}
                        className={`pb-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                          submissionType === 'spotify'
                            ? 'text-pink-400 border-pink-400'
                            : 'text-stone-400 border-transparent hover:text-white'
                        }`}
                      >
                        Spotify Embed
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSubmissionType('custom'); setFormError(''); setFormSuccess(''); }}
                        className={`pb-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                          submissionType === 'custom'
                            ? 'text-pink-400 border-pink-400'
                            : 'text-stone-400 border-transparent hover:text-white'
                        }`}
                      >
                        📁 Custom Audio File
                      </button>
                      <button
                        type="button"
                        onClick={() => { 
                          setSubmissionType('status'); 
                          setFormError(''); 
                          setFormSuccess('');
                          fetchMySubmissions(); 
                        }}
                        className={`pb-2 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          submissionType === 'status'
                            ? 'text-purple-300 border-purple-400'
                            : 'text-stone-400 border-transparent hover:text-white'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>My Requests Status</span>
                      </button>
                    </div>

                    {/* TAB 4: MY REQUESTS STATUS */}
                    {submissionType === 'status' ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-stone-300">
                            Submissions by <span className="text-purple-300 font-mono font-bold">@{currentUser?.username || 'You'}</span>:
                          </p>
                          <button
                            type="button"
                            onClick={fetchMySubmissions}
                            disabled={isLoadingMySubmissions}
                            className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-mono text-purple-300 border border-purple-500/20 transition-all cursor-pointer"
                          >
                            {isLoadingMySubmissions ? 'Refreshing...' : 'Refresh Status'}
                          </button>
                        </div>

                        {isLoadingMySubmissions ? (
                          <div className="text-center py-8">
                            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <span className="text-xs text-stone-400 font-mono">Loading request statuses...</span>
                          </div>
                        ) : mySubmissionsList.length === 0 ? (
                          <div className="p-8 text-center bg-black/40 border border-white/5 rounded-2xl space-y-2">
                            <Clock className="w-8 h-8 text-purple-400/40 mx-auto" />
                            <p className="text-xs text-stone-300">No requests submitted yet.</p>
                            <p className="text-[11px] text-stone-500">
                              Submit a YouTube link, Spotify URL, or audio file to request tracks from the admin team.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                            {mySubmissionsList.map((item, idx) => (
                              <div
                                key={item.id || idx}
                                className="p-3 bg-[#0e0720] border border-purple-500/20 rounded-xl flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {item.coverUrl || item.thumbnailUrl ? (
                                    <img
                                      src={item.coverUrl || item.thumbnailUrl}
                                      alt={item.title}
                                      className="w-10 h-10 rounded-lg object-cover border border-purple-500/20 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-purple-900/40 border border-purple-500/20 flex items-center justify-center text-purple-300 shrink-0">
                                      <Music className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                                    <p className="text-[10px] text-stone-400 truncate">{item.artist || 'BTS'}</p>
                                  </div>
                                </div>

                                <div className="shrink-0 text-right">
                                  {item.status === 'approved' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Approved & Live</span>
                                    </span>
                                  ) : item.status === 'rejected' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-950/60 border border-rose-500/40 text-rose-300">
                                      <AlertCircle className="w-3 h-3" />
                                      <span>Declined</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-950/60 border border-amber-500/40 text-amber-300">
                                      <Clock className="w-3 h-3 animate-pulse" />
                                      <span>Pending Admin Review</span>
                                    </span>
                                  )}
                                  <div className="text-[9px] text-stone-500 font-mono mt-0.5">
                                    {formatDate(item.submittedAt)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* TAB 1: YOUTUBE MUSIC */}
                        {submissionType === 'youtube' && (
                          <div className="space-y-3">
                            <div className="space-y-1.5 p-3.5 rounded-2xl bg-black/40 border border-purple-500/15">
                              <label className="text-[11px] font-mono font-bold text-purple-300 uppercase block tracking-wider">
                                YouTube Music Video Link *
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  required
                                  value={identityYoutubeUrl}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setIdentityYoutubeUrl(val);
                                    validateYoutubeMusicUrl(val);
                                  }}
                                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                                  className="flex-grow bg-[#04020a]/80 text-stone-200 border border-purple-500/20 focus:border-purple-400 rounded-xl px-3.5 py-2 text-xs focus:outline-none placeholder:text-stone-600 font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => validateYoutubeMusicUrl(identityYoutubeUrl)}
                                  disabled={isValidatingYoutube}
                                  className="px-3.5 py-2 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/25 text-purple-200 font-mono text-xs font-bold uppercase rounded-xl transition-all cursor-pointer shrink-0"
                                >
                                  {isValidatingYoutube ? 'Validating...' : 'Inspect'}
                                </button>
                              </div>
                            </div>

                            {identityVideoId && (
                              <div className="p-3.5 rounded-2xl bg-[#0e0720] border border-purple-500/25 flex flex-col sm:flex-row gap-3 items-center">
                                <div className="relative w-full sm:w-36 aspect-video rounded-xl overflow-hidden border border-purple-500/20 bg-black shrink-0">
                                  <img
                                    src={identityThumbnail || `https://img.youtube.com/vi/${identityVideoId}/hqdefault.jpg`}
                                    alt="Thumbnail"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1 space-y-1 text-left w-full">
                                  <span className="text-[9px] font-mono text-pink-400 uppercase font-bold">Auto-Resolved Track</span>
                                  <h4 className="text-xs font-bold text-white truncate">{identityVideoTitle || 'BTS Video'}</h4>
                                  <p className="text-[10px] text-stone-400 font-mono truncate">{identityArtist || 'BTS'}</p>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono text-purple-300 uppercase block font-bold">Track Title *</label>
                                <input
                                  type="text"
                                  required
                                  value={identityVideoTitle}
                                  onChange={(e) => setIdentityVideoTitle(e.target.value)}
                                  placeholder="e.g. Run BTS, Like Crazy"
                                  className="w-full bg-[#04020a]/80 text-stone-200 border border-purple-500/15 focus:border-purple-400 rounded-xl px-3 py-2 text-xs focus:outline-none placeholder:text-stone-600"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono text-purple-300 uppercase block font-bold">Artist Name *</label>
                                <input
                                  type="text"
                                  required
                                  value={identityArtist}
                                  onChange={(e) => setIdentityArtist(e.target.value)}
                                  placeholder="e.g. BTS, Jimin"
                                  className="w-full bg-[#04020a]/80 text-stone-200 border border-purple-500/15 focus:border-purple-400 rounded-xl px-3 py-2 text-xs focus:outline-none placeholder:text-stone-600"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {submissionType === 'spotify' && (
                      <>
                        {/* Spotify URL pastable link input */}
                        <div className="space-y-1.5 p-4 rounded-2xl bg-black/40 border border-purple-500/10">
                          <label className="font-mono text-xxs text-purple-300 uppercase block font-extrabold tracking-wider">
                            Spotify Music Link or Embed Code *
                          </label>
                          <p className="text-[10px] text-stone-400 leading-normal pb-1">
                            Paste a track, album, playlist URL (e.g. open.spotify.com/track/...) or Spotify &lt;iframe...&gt; embed code.
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={spotifyLink}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSpotifyLink(val);
                                if (val.includes('spotify.com') || val.includes('spotify:')) {
                                  syncSpotifyMetadata(val);
                                }
                              }}
                              placeholder="e.g. https://open.spotify.com/track/... or <iframe src=...>"
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

                        {/* Auto Resolved Preview area */}
                        {(formTitle || isResolving || getEmbeddedPlayerUrl(spotifyLink)) && (
                          <div className="p-4 rounded-2xl bg-[#05030e]/95 border border-purple-500/15 space-y-4">
                            <span className="font-mono text-[9px] text-pink-400 uppercase tracking-widest block font-extrabold">Auto-fetched Metadata Preview</span>
                            
                            {isResolving ? (
                              <div className="text-center py-6 space-y-2">
                                <div className="w-5 h-5 border-2 border-t-purple-400 border-r-purple-400 border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
                                <span className="text-[10px] font-mono text-purple-400/70 block uppercase">Fetching oEmbed streams...</span>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={formCoverUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg'} 
                                    className="w-14 h-14 object-cover rounded-xl border border-purple-500/10 shadow-md"
                                    alt="Cover preview"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="text-xs space-y-1">
                                    <h5 className="font-extrabold text-white text-xs">{formTitle || 'Spotify Track'}</h5>
                                    <p className="text-stone-400 text-xxs font-mono truncate">{formArtist || 'BTS'}</p>
                                  </div>
                                </div>

                                {getEmbeddedPlayerUrl(spotifyLink) && (
                                  <div className="space-y-1.5">
                                    <span className="font-mono text-[8.5px] text-purple-300 uppercase block font-bold">Embedded Player preview</span>
                                    <div className="rounded-xl overflow-hidden border border-[#1db954]/30 shadow-inner bg-black">
                                      <iframe
                                        src={getEmbeddedPlayerUrl(spotifyLink) || undefined}
                                        width="100%"
                                        height="152"
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
                      </>
                    )}

                    {/* TAB 3: CUSTOM AUDIO UPLOAD WITH REAL-TIME TIMERS */}
                    {submissionType === 'custom' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xxs font-mono text-purple-300 uppercase block font-bold">Track Title *</label>
                            <input
                              type="text"
                              required
                              value={formTitle}
                              onChange={(e) => setFormTitle(e.target.value)}
                              placeholder="e.g. Dynamite (Acoustic)"
                              className="w-full bg-[#04020a]/80 text-stone-200 border border-purple-500/15 focus:border-purple-400 rounded-xl px-3 py-2 text-xs focus:outline-none placeholder:text-stone-600"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xxs font-mono text-purple-300 uppercase block font-bold">Artist Name *</label>
                            <input
                              type="text"
                              required
                              value={formArtist}
                              onChange={(e) => setFormArtist(e.target.value)}
                              placeholder="e.g. BTS"
                              className="w-full bg-[#04020a]/80 text-stone-200 border border-purple-500/15 focus:border-purple-400 rounded-xl px-3 py-2 text-xs focus:outline-none placeholder:text-stone-600"
                            />
                          </div>
                        </div>

                        {/* Custom Audio Upload with Real-time Elapsed & Processing Timers */}
                        <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/15 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xxs font-mono text-pink-400 uppercase font-bold flex items-center gap-1.5">
                              <Music className="w-3.5 h-3.5 text-pink-400" />
                              Audio File URL or Device Upload *
                            </label>
                            {audioUploadState.completed && (
                              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Audio Processed & Ready
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={formAudioUrl}
                              onChange={(e) => setFormAudioUrl(e.target.value)}
                              placeholder="e.g. /audio/dynamite_preview.wav or https://.../track.mp3"
                              className="flex-grow bg-[#04020a]/80 text-stone-300 border border-purple-500/15 focus:border-purple-400 rounded-xl px-3 py-2 text-xs focus:outline-none placeholder:text-stone-700 font-mono"
                            />
                            <input
                              type="file"
                              id="public-custom-audio-upload"
                              accept="audio/mp3,audio/mpeg,audio/wav,audio/aac,audio/m4a,audio/ogg"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);
                                const uploadStart = Date.now();

                                setAudioUploadState({
                                  isUploading: true,
                                  progress: 25,
                                  elapsedSec: 0,
                                  isProcessing: false,
                                  processingSec: 0,
                                  fileSizeStr: `${fileSizeMb} MB`,
                                  completed: false
                                });

                                const ticker = setInterval(() => {
                                  const sec = Math.floor((Date.now() - uploadStart) / 1000);
                                  setAudioUploadState(s => ({ ...s, elapsedSec: sec }));
                                }, 200);

                                try {
                                  setTimeout(() => setAudioUploadState(s => ({ ...s, progress: 65 })), 350);
                                  setTimeout(() => setAudioUploadState(s => ({ ...s, progress: 90 })), 750);

                                  const reader = new FileReader();
                                  reader.onload = async (event) => {
                                    clearInterval(ticker);
                                    const totalUploadSec = ((Date.now() - uploadStart) / 1000).toFixed(1);

                                    const procStart = Date.now();
                                    setAudioUploadState(s => ({
                                      ...s,
                                      progress: 95,
                                      isProcessing: true,
                                      elapsedSec: Number(totalUploadSec)
                                    }));

                                    try {
                                      const res = await fetch('/api/upload/audio', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          filename: file.name,
                                          base64: event.target?.result as string,
                                          category: 'Audio'
                                        })
                                      });

                                      const procSec = ((Date.now() - procStart) / 1000).toFixed(1);

                                      if (res.ok) {
                                        const uploaded = await res.json();
                                        const audioPath = uploaded.url || `/audio/${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                                        setFormAudioUrl(audioPath);
                                      } else {
                                        setFormAudioUrl(`/audio/${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
                                      }

                                      setAudioUploadState({
                                        isUploading: false,
                                        progress: 100,
                                        elapsedSec: Number(totalUploadSec),
                                        isProcessing: false,
                                        processingSec: Number(procSec),
                                        fileSizeStr: `${fileSizeMb} MB`,
                                        completed: true
                                      });

                                      if (!formTitle) setFormTitle(file.name.replace(/\.[^/.]+$/, ''));
                                      if (!formArtist) setFormArtist('BTS');
                                    } catch {
                                      setFormAudioUrl(`/audio/${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
                                      setAudioUploadState(s => ({ ...s, isUploading: false, completed: true, progress: 100 }));
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                } catch {
                                  clearInterval(ticker);
                                  setAudioUploadState(s => ({ ...s, isUploading: false }));
                                }
                              }}
                              className="sr-only"
                            />
                            <label
                              htmlFor="public-custom-audio-upload"
                              className="px-3.5 py-2 bg-pink-900/60 hover:bg-pink-800 text-pink-200 text-xs font-mono rounded-xl border border-pink-500/30 cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 select-none"
                            >
                              <UploadCloud className="w-3.5 h-3.5 text-pink-300" />
                              Upload Audio
                            </label>
                          </div>

                          {/* Real-time upload timer and processing duration display */}
                          {(audioUploadState.isUploading || audioUploadState.isProcessing || audioUploadState.completed) && (
                            <div className="p-3 bg-[#0d071e] border border-purple-500/20 rounded-xl space-y-2">
                              <div className="flex items-center justify-between text-[11px] font-mono text-purple-300">
                                <span className="flex items-center gap-1.5">
                                  {audioUploadState.isUploading && <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />}
                                  {audioUploadState.isProcessing && <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />}
                                  {audioUploadState.completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                                  <span>
                                    {audioUploadState.isUploading ? 'Uploading Audio File...' :
                                     audioUploadState.isProcessing ? 'Processing Waveform & Tags...' :
                                     'Upload & Processing Complete!'}
                                  </span>
                                </span>
                                <span>{audioUploadState.progress}%</span>
                              </div>

                              <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                                  style={{ width: `${audioUploadState.progress}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 pt-0.5">
                                <span>Size: {audioUploadState.fileSizeStr || 'Audio'}</span>
                                <span>
                                  ⏱️ Upload Time: <strong className="text-purple-300">{audioUploadState.elapsedSec}s</strong> | Processing: <strong className="text-pink-300">{audioUploadState.processingSec}s</strong>
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-stone-400 font-mono">VS Code presets:</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormAudioUrl('/audio/dynamite_preview.wav');
                                if (!formTitle) setFormTitle('Dynamite Preview');
                                if (!formArtist) setFormArtist('BTS');
                              }}
                              className="px-2 py-0.5 bg-black/60 hover:bg-black/90 text-[10px] text-pink-300 border border-purple-500/20 rounded font-mono transition-colors cursor-pointer"
                            >
                              + /audio/dynamite_preview.wav
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormAudioUrl('/audio/sample_bts_chime.wav');
                                if (!formTitle) setFormTitle('BTS Chime Tone');
                                if (!formArtist) setFormArtist('BTS');
                              }}
                              className="px-2 py-0.5 bg-black/60 hover:bg-black/90 text-[10px] text-purple-300 border border-purple-500/20 rounded font-mono transition-colors cursor-pointer"
                            >
                              + /audio/sample_bts_chime.wav
                            </button>
                          </div>

                          {formAudioUrl && (
                            <div className="p-2.5 bg-[#05030e] border border-pink-500/20 rounded-xl space-y-1.5 animate-fade-in">
                              <span className="text-[10px] text-pink-400 font-mono font-bold uppercase block flex items-center gap-1">
                                <Volume2 className="w-3 h-3 text-pink-400 animate-pulse" />
                                Audio Preview:
                              </span>
                              <audio controls src={formAudioUrl} className="w-full h-8 rounded" preload="none" />
                            </div>
                          )}

                          <p className="text-[10px] text-stone-400 leading-tight">
                            💡 Place any audio file (.mp3, .wav) into <code className="text-pink-300">public/audio/</code> in VS Code, then enter <code className="text-pink-300">/audio/your-song.mp3</code>.
                          </p>
                        </div>

                        {/* Cover Image URL */}
                        <div className="space-y-1">
                          <label className="text-xxs font-mono text-purple-300 uppercase block font-bold">Cover Image URL (Optional)</label>
                          <input
                            type="text"
                            value={formCoverUrl}
                            onChange={(e) => setFormCoverUrl(e.target.value)}
                            placeholder="Paste image URL (leave empty for default BTS cover)"
                            className="w-full bg-[#04020a]/80 text-stone-200 border border-purple-500/15 focus:border-purple-400 rounded-xl px-3 py-2 text-xs focus:outline-none placeholder:text-stone-700 font-mono"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Era Timeline selector mapping */}
                      <div className="space-y-1.5">
                        <label className="text-[10.5px] font-mono text-purple-300 uppercase block font-bold">BTS Era Timeline Year</label>
                        <select
                          value={submissionType === 'youtube' ? identityEra : formEra}
                          onChange={(e) => {
                            if (submissionType === 'youtube') setIdentityEra(e.target.value);
                            else setFormEra(e.target.value);
                          }}
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
                          value={submissionType === 'youtube' ? identityNotes : formDescription}
                          onChange={(e) => {
                            if (submissionType === 'youtube') setIdentityNotes(e.target.value);
                            else setFormDescription(e.target.value);
                          }}
                          className="w-full bg-[#04020a]/80 text-stone-200 border border-purple-500/15 focus:border-purple-400 rounded-xl px-3 py-2 text-xs focus:outline-none placeholder:text-stone-700"
                        />
                      </div>
                    </div>

                    {/* Country (Batch 91) — required; lights the ARMY World Map */}
                    <div className="space-y-1.5">
                      <label className="text-[10.5px] font-mono text-purple-300 uppercase block font-bold">Your Country *</label>
                      <CountrySelect value={formCountry} onChange={setFormCountry} className="!bg-[#04020a]/80 !border-purple-500/15 !rounded-xl !px-3 !py-2 !text-xs" />
                    </div>

                    {/* Admin Moderation Notice */}
                    <p className="text-[10px] text-stone-400 leading-relaxed font-sans bg-black/30 p-2.5 rounded-xl border border-white/5">
                      🛡️ <strong className="text-purple-300 font-mono">Real Media & Moderation Policy:</strong> Submissions are sent to the Admin Panel’s Music Requests queue. Once approved by an administrator, your track will be published live to the public catalog.
                    </p>

                    {formError && <p className="text-xxs text-red-400 p-2.5 bg-red-950/15 border border-red-500/10 rounded-xl font-mono text-center">⚠️ {formError}</p>}
                    {formSuccess && <p className="text-xxs text-emerald-400 p-2.5 bg-emerald-950/15 border border-emerald-500/10 rounded-xl font-mono text-center leading-relaxed">✓ {formSuccess}</p>}

                    <button
                      type="submit"
                      disabled={submitting || isResolving}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-mono text-xs font-bold uppercase rounded-2xl transition-all select-none cursor-pointer hover:shadow-lg shadow-purple-600/10 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <span>Submitting to Admin Queue...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 -rotate-12" />
                          <span>Submit Track to Admin Requests Queue</span>
                        </>
                      )}
                    </button>
                      </>
                    )}

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
