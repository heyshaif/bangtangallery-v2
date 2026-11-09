import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Hls from 'hls.js';
import AdsterraAd from './AdsterraAd';
import {
  Radio, Eye, Copy, RefreshCw, Sparkles, Lock, Calendar, Timer, Check, AlertCircle,
  Play, Pause, Volume2, VolumeX, Maximize2, Shield, Send, Info, Users, BarChart3, Clock, Flame,
  MessageSquare
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getYoutubeEmbedUrl, getYoutubeVideoId } from './youtubeUtils';
import { getStreamEmbedHTML, resolveEmbedSrc } from '../utils/streamEmbed';
import MemberEmojiPicker, { loadBiasEmoji } from './MemberEmojiPicker';

interface ChatMessage {
  id: string;
  username: string;
  memberEmoji?: string;
  text: string;
  timestamp: string;
  isModerator: boolean;
  isSystem: boolean;
  avatarUrl?: string;
}

interface StreamSettings {
  isLive: boolean;
  streamKey: string;
  rtmpUrl: string;
  viewerCount: number;
  peakViewers: number;
  totalViews: number;
  watchTime: number;
  streamDuration: number;
  startedAt: string | null;
  scheduledAt: string | null;
  title: string;
  description: string;
  thumbnail: string;
}

export default function LiveStreamSection({ playerOnly = false, config }: { playerOnly?: boolean; config?: any }) {
  // Authentication & View states
  const [isAdmin, setIsAdmin] = useState(() => !!localStorage.getItem('bts_admin_token'));
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Administrative Control states
  const [adminSettings, setAdminSettings] = useState<StreamSettings | null>(null);
  const [loadingAdminSettings, setLoadingAdminSettings] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [regeneratingKey, setRegeneratingKey] = useState(false);
  const [updatingMetadata, setUpdatingMetadata] = useState(false);
  const [simulatingBroadcaster, setSimulatingBroadcaster] = useState(false);

  // Editable Meta States
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaThumbnail, setMetaThumbnail] = useState('');
  const [metaScheduledAt, setMetaScheduledAt] = useState('');

  // Public stream state. Starts OFFLINE with no source and zeroed stats;
  // the real status is loaded from /api/live/status right after mount.
  // (This used to boot as a permanently-"live" third-party stream with
  // invented viewer counts and a start time 45 minutes in the past.)
  const [streamStatus, setStreamStatus] = useState(() => {
    return {
      isLive: config?.isLive !== undefined ? !!config.isLive : false,
      isBackendOnline: true,
      title: config?.title || 'BTS WORLD TOUR ARIRANG 2026 LIVE STREAM',
      description: config?.description || 'BTS WORLD TOUR ARIRANG 2026 LIVE STREAM LOS ANGELES DAY -4',
      embedCode: config?.embedCode || config?.url || '',
      thumbnail: config?.coverUrl || config?.thumbnail || '',
      viewerCount: 0,
      peakViewers: 0,
      totalViews: 0,
      watchTime: 0,
      streamDuration: 0,
      startedAt: null as string | null,
      scheduledAt: null as string | null
    };
  });
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Sync when config prop changes
  useEffect(() => {
    if (config) {
      setStreamStatus((prev) => ({
        ...prev,
        ...config,
        isLive: config.isLive !== undefined ? !!config.isLive : (config.isStreaming !== undefined ? !!config.isStreaming : !!(config.embedCode || config.url)),
        embedCode: config.embedCode || config.url || prev.embedCode,
        title: config.title || prev.title,
        description: config.description !== undefined ? config.description : prev.description
      }));
    }
  }, [config]);

  // Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatText, setNewChatText] = useState('');
  const [chatAuthorName, setChatAuthorName] = useState(() => {
    return localStorage.getItem('bts_live_chat_name') || '';
  });
  const [biasEmoji, setBiasEmoji] = useState<string>(() => loadBiasEmoji());
  const [savingChatName, setSavingChatName] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  // Player States
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackQuality, setPlaybackQuality] = useState('1080p');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Statistics / Analytics states
  const [timeRemaining, setTimeRemaining] = useState('');
  const [streamDurationFormatted, setStreamDurationFormatted] = useState('00:00:00');

  // High-performance HLS Playback Engine with automatic recovery and seamless retries
  useEffect(() => {
    if (!streamStatus.isLive) {
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Only a real HLS (.m3u8) source is handled by this engine; YouTube and
    // other embeds play through the iframe branch. (This used to fall back
    // to a non-existent '/live/stream.m3u8', which retried forever behind a
    // fake "sync active" overlay and never played anything.)
    const customM3u8 = streamStatus.embedCode && streamStatus.embedCode.includes('.m3u8')
      ? streamStatus.embedCode.trim()
      : null;
    if (!customM3u8) return;
    const streamSource = customM3u8;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        maxMaxBufferLength: 10,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 5,
        manifestLoadingMaxRetry: Infinity,
        manifestLoadingRetryDelay: 1000,
        levelLoadingMaxRetry: Infinity,
        levelLoadingRetryDelay: 1000,
        fragLoadingMaxRetry: Infinity,
        fragLoadingRetryDelay: 1000
      });

      hls.loadSource(streamSource);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isPlaying) {
          video.play().catch(() => {});
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('HLS Network error occurred, retrying connection...');
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('HLS Media error occurred, recovering...');
              hls?.recoverMediaError();
              break;
            default:
              console.error('Fatal HLS error, rebuilding stream pipeline...', data);
              hls?.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari/iOS support
      video.src = streamSource;
      video.addEventListener('loadedmetadata', () => {
        if (isPlaying) {
          video.play().catch(() => {});
        }
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamStatus.isLive, streamStatus.embedCode, isPlaying]);

  // Load public status
  const fetchPublicData = async () => {
    try {
      const res = await fetch('/api/live/status');
      if (res.ok) {
        const data = await res.json();
        setStreamStatus((prev) => ({
          ...prev,
          ...data,
          isLive: data.isLive !== undefined ? !!data.isLive : (data.isStreaming !== undefined ? !!data.isStreaming : !!(data.embedCode || data.url)),
          embedCode: data.embedCode || data.url || prev.embedCode,
          title: data.title || prev.title,
          description: data.description !== undefined ? data.description : prev.description,
          thumbnail: data.thumbnail || data.coverUrl || prev.thumbnail,
          viewerCount: data.viewerCount ?? data.viewers ?? prev.viewerCount,
          isBackendOnline: true
        }));
      }
    } catch (e) {
      console.error('Failed to poll stream updates', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Subscribe to real-time live chat messages via Firestore with local and initial sample fallbacks
  useEffect(() => {
    // Initial friendly welcome messages so the chat is never empty
    const defaultSampleMessages: ChatMessage[] = [
      {
        id: 'sys_1',
        username: 'ARMY Moderator',
        text: '💜 Welcome to the BTS Live Lounge! Chat rules: Be respectful, share love for BTS, and enjoy the stream!',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        isModerator: true,
        isSystem: true
      },
      {
        id: 'sys_2',
        username: 'Borahae_2026',
        text: 'Borahae everyone! So excited for the tour! 💜✨',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        isModerator: false,
        isSystem: false
      }
    ];

    // Read cached local chat if available
    try {
      const cached = localStorage.getItem('bts_cached_live_chat');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChatMessages(parsed);
        } else {
          setChatMessages(defaultSampleMessages);
        }
      } else {
        setChatMessages(defaultSampleMessages);
      }
    } catch {
      setChatMessages(defaultSampleMessages);
    }

    let unsubscribe = () => {};

    try {
      // Query without order constraint first to prevent Firestore missing index crashes
      const q = query(
        collection(db, 'live_chat'),
        limit(100)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const remoteMessages: ChatMessage[] = [];
          snapshot.forEach((snapshotDoc) => {
            const data = snapshotDoc.data();
            remoteMessages.push({
              id: data.id || snapshotDoc.id,
              username: data.username || 'Anonymous',
              text: data.text || '',
              timestamp: data.timestamp || new Date().toISOString(),
              isModerator: !!data.isModerator,
              isSystem: !!data.isSystem,
              avatarUrl: data.avatarUrl || ''
            });
          });

          setChatMessages((prev) => {
            const map = new Map<string, ChatMessage>();
            defaultSampleMessages.forEach((m) => map.set(m.id, m));
            prev.forEach((m) => map.set(m.id, m));
            remoteMessages.forEach((m) => map.set(m.id, m));
            const merged = Array.from(map.values());
            merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            try {
              localStorage.setItem('bts_cached_live_chat', JSON.stringify(merged.slice(-50)));
            } catch {}
            return merged;
          });
        }
      }, (error) => {
        console.warn('Firestore live chat real-time sync note:', error.message);
      });
    } catch (err) {
      console.warn('Could not establish Firestore live chat listener:', err);
    }

    return () => unsubscribe();
  }, []);

  // Poll current live status every 3.5s and listen to Firestore liveStream config in real-time
  useEffect(() => {
    fetchPublicData();
    let unsubFirestore = () => {};
    let unsubPublished = () => {};
    try {
      // NOTE: the published config's liveStream field is only a mirror of
      // config/liveStream. Listening to both made the two snapshots race —
      // a stale mirror could flip the player back offline right after the
      // real stream appeared. config/liveStream (below) is the single
      // source of truth for live state.
      unsubFirestore = onSnapshot(doc(db, 'config', 'liveStream'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setStreamStatus((prev) => ({
            ...prev,
            ...data,
            isLive: data.isLive !== undefined ? !!data.isLive : (data.isStreaming !== undefined ? !!data.isStreaming : !!(data.embedCode || data.url)),
            embedCode: data.embedCode || data.url || prev.embedCode,
            title: data.title || prev.title,
            description: data.description !== undefined ? data.description : prev.description,
            thumbnail: data.thumbnail || data.coverUrl || prev.thumbnail,
            viewerCount: data.viewerCount ?? data.viewers ?? prev.viewerCount,
            isBackendOnline: true
          }));
          setLoadingStatus(false);
        }
      }, (error) => {
        console.warn('Firestore liveStream config listener note:', error.message);
      });
    } catch (err) {
      console.warn('Could not establish Firestore liveStream listener:', err);
    }

    const interval = setInterval(fetchPublicData, 3500);
    return () => {
      unsubFirestore();
      unsubPublished();
      clearInterval(interval);
    };
  }, []);

  // Scroll chat messages to bottom on new items of his container only to prevent window scroll
  const scrollChat = () => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };
  useEffect(() => {
    scrollChat();
  }, [chatMessages]);

  // Fetch admin-only credentials if authenticated
  const fetchAdminSettings = async () => {
    if (!isAdmin) return;
    setLoadingAdminSettings(true);
    try {
      const token = localStorage.getItem('bts_admin_token') || '';
      const res = await fetch('/api/admin/live/settings', {
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminSettings(data.settings);
        // Sync administrative editable fields
        setMetaTitle(data.settings.title || '');
        setMetaDescription(data.settings.description || '');
        setMetaThumbnail(data.settings.thumbnail || '');
        setMetaScheduledAt(data.settings.scheduledAt ? data.settings.scheduledAt.substring(0, 16) : '');
      } else {
        // Token might be expired
        handleAdminLogout();
      }
    } catch {
      // Offline fallback
    } finally {
      setLoadingAdminSettings(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminSettings();
    }
  }, [isAdmin]);

  // Streaming Countdown Timer
  useEffect(() => {
    if (!streamStatus.scheduledAt || streamStatus.isLive) return;

    const interval = setInterval(() => {
      const diff = new Date(streamStatus.scheduledAt!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeRemaining('Starting now...');
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      parts.push(`${hours.toString().padStart(2, '0')}h`);
      parts.push(`${mins.toString().padStart(2, '0')}m`);
      parts.push(`${secs.toString().padStart(2, '0')}s`);

      setTimeRemaining(parts.join(' '));
    }, 1000);

    return () => clearInterval(interval);
  }, [streamStatus.scheduledAt, streamStatus.isLive]);

  // Stream Duration Counter (ticks when Live)
  useEffect(() => {
    if (!streamStatus.isLive || !streamStatus.startedAt) {
      setStreamDurationFormatted('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const durationSeconds = Math.floor((Date.now() - new Date(streamStatus.startedAt!).getTime()) / 1000);
      
      const hours = Math.floor(durationSeconds / 3600);
      const mins = Math.floor((durationSeconds % 3600) / 60);
      const secs = durationSeconds % 60;

      setStreamDurationFormatted(
        `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [streamStatus.isLive, streamStatus.startedAt]);

  // Admin login process
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('bts_admin_token', data.token);
        setIsAdmin(true);
        setShowAdminLogin(false);
        setEmailInput('');
        setPasswordInput('');
        fetchAdminSettings();
      } else {
        setAuthError(data.error || 'Invalid administrator credentials. Try again.');
      }
    } catch {
      setAuthError('Connection failed. Verify server access.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('bts_admin_token');
    setIsAdmin(false);
    setAdminSettings(null);
  };

  // Administrator Action: Regenerate stream credentials
  const handleRegenerateKey = async () => {
    if (!window.confirm('WARNING: Regenerating the Stream Key will immediately invalidate your previous key. Any running broadcast in OBS will be cut off. Continue?')) {
      return;
    }
    setRegeneratingKey(true);
    try {
      const token = localStorage.getItem('bts_admin_token') || '';
      const res = await fetch('/api/admin/live/regenerate-key', {
        method: 'POST',
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminSettings(data.settings);
        setCopiedKey(false);
        triggerAudioBeep(650, 0.4);
      }
    } catch {
      alert('Fail to regenerate credentials.');
    } finally {
      setRegeneratingKey(false);
    }
  };

  // Administrator Action: Save Metadata
  const handleSaveMetadata = async () => {
    setUpdatingMetadata(true);
    try {
      const token = localStorage.getItem('bts_admin_token') || '';
      const res = await fetch('/api/admin/live/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          title: metaTitle,
          description: metaDescription,
          thumbnail: metaThumbnail,
          scheduledAt: metaScheduledAt ? new Date(metaScheduledAt).toISOString() : null
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAdminSettings(data.settings);
        setStreamStatus((prev) => ({
          ...prev,
          title: data.settings.title,
          description: data.settings.description,
          thumbnail: data.settings.thumbnail,
          scheduledAt: data.settings.scheduledAt,
          embedCode: data.settings.embedCode || ''
        }));
        triggerAudioBeep(880, 0.15);
        alert('Stream setup saved successfully!');
      }
    } catch {
      alert('Failed to update live info.');
    } finally {
      setUpdatingMetadata(false);
    }
  };


  // Client Action: Send chat message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;

    const textToSend = newChatText.trim();
    setNewChatText(''); // optimistic clear
    
    const userName = chatAuthorName.trim() || 'ARMY_' + Math.floor(Math.random() * 8999 + 1000);
    const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    
    const messagePayload: ChatMessage = {
      id: msgId,
      username: userName,
      ...(biasEmoji ? { memberEmoji: biasEmoji } : {}),
      text: textToSend,
      timestamp: new Date().toISOString(),
      isModerator: isAdmin,
      isSystem: false,
      avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(userName)}`
    };

    // Optimistically update chat state immediately
    setChatMessages((prev) => {
      const updated = [...prev, messagePayload];
      try {
        localStorage.setItem('bts_cached_live_chat', JSON.stringify(updated.slice(-50)));
      } catch {}
      return updated;
    });
    triggerAudioBeep(1000, 0.05);

    try {
      // Direct write to firestore collection 'live_chat' using random custom safe doc ID
      await setDoc(doc(db, 'live_chat', msgId), messagePayload);
    } catch (err) {
      console.warn('Live chat message saved locally, firestore sync note:', err);
    }
  };

  // Clipboard Copiers
  const copyToClipboard = (text: string, type: 'url' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
    triggerAudioBeep(1200, 0.08);
  };

  // Audio oscillator helper for premium UI ticks
  const triggerAudioBeep = (freq: number, duration: number) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  // Player full screen toggle
  const toggleFullScreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const getEmbedHTML = (codeOrUrl: string) => {
    return getStreamEmbedHTML(codeOrUrl);
  };

  // URL-based sources render as a real React <iframe> — more reliable
  // than injected markup (owner report: admin preview showed the stream
  // but the main player stayed black). Raw script/custom embeds keep
  // the innerHTML path. A "Watch on YouTube" shortcut is offered for
  // YouTube sources so visitors always have a working path even if a
  // browser or blocker refuses the embedded player.
  const currentEmbedSrc = streamStatus.embedCode ? resolveEmbedSrc(streamStatus.embedCode) : null;
  const youtubeWatchUrl = streamStatus.embedCode && !streamStatus.embedCode.includes('.m3u8')
    ? (() => {
        const vid = getYoutubeVideoId(streamStatus.embedCode);
        return vid ? `https://www.youtube.com/watch?v=${vid}` : '';
      })()
    : '';

  if (playerOnly) {
    return (
      <div 
        ref={playerContainerRef}
        className="fixed inset-0 w-full h-full bg-[#05000a] overflow-hidden select-none"
      >
        <AnimatePresence mode="wait">
          {streamStatus.isLive && streamStatus.embedCode && !streamStatus.embedCode.includes('.m3u8') ? (
            /* INJECTED IFRAME STREAM PLAYER */
            <motion.div
              key="embedded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full relative"
            >
              {currentEmbedSrc ? (
                <iframe
                  src={currentEmbedSrc}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
                  allowFullScreen
                  title="Live stream player"
                />
              ) : (
                <div
                  className="w-full h-full relative [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:border-none [&_iframe]:outline-none [&>div]:w-full [&>div]:h-full [&>div]:relative"
                  dangerouslySetInnerHTML={{ __html: getEmbedHTML(streamStatus.embedCode) }}
                />
              )}
              {/* Top-left Badges overlay for public live stream */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
                <span className="bg-red-600 text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-full tracking-wider flex items-center gap-1 shadow-lg shadow-red-600/40 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Live Feed
                </span>
              </div>
            </motion.div>
          ) : streamStatus.isLive && streamStatus.embedCode?.includes('.m3u8') ? (
            /* HLS PLAYER RENDERER: plays the admin's real .m3u8 live source */
            <motion.div 
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full relative"
            >
               {/* Real-time high profile HLS broadcast pipeline */}
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted={isMuted}
                className="absolute inset-0 w-full h-full object-cover opacity-90 select-none pointer-events-auto"
              />

              {/* Aesthetic Glowing Star overlay filters */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none z-10" />

              {/* Top-left Badges overlay */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <span className="bg-red-600 text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-full tracking-wider flex items-center gap-1 shadow-lg shadow-red-600/40 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Live Now
                </span>
                <span className="bg-black/60 backdrop-blur-md border border-white/10 text-white font-semibold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                  {chatMessages.length} Messages
                </span>
              </div>

              {/* Top-right Streaming statistics */}
              <div className="absolute top-4 right-4 z-20 font-mono text-[10px] text-white/90 bg-black/55 backdrop-blur-md px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-gray-400 font-semibold uppercase">Uptime:</span>
                <span>{streamDurationFormatted}</span>
                <span className="text-purple-400">({playbackQuality} &bull; Auto)</span>
              </div>

              {/* Custom Player Overlay controls (appear on hover) */}
              <div className="absolute inset-x-0 bottom-0 z-20 p-5 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover/player:opacity-100 transition-opacity duration-300 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>

                  <button 
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <span className="text-xs font-mono font-bold tracking-widest text-purple-300 animate-pulse">
                    🔴 BROADCAST SYNC ACTIVE
                  </span>
                </div>

                <div className="flex items-center gap-2 relative">
                  {/* Quality selection */}
                  <button 
                    type="button"
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-mono hover:text-white transition-all border border-white/5 cursor-pointer"
                  >
                    Quality: {playbackQuality}
                  </button>

                  {showQualityMenu && (
                    <div className="absolute bottom-full right-12 mb-2 bg-[#05000a]/95 border border-white/10 rounded-xl p-1.5 flex flex-col gap-1 shadow-2xl z-50 min-w-[70px]">
                      {['1080p', '720p', '480p', 'Auto'].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => {
                            setPlaybackQuality(q);
                            setShowQualityMenu(false);
                            triggerAudioBeep(900, 0.05);
                          }}
                          className={`text-[9px] font-mono px-2 py-1 rounded-md text-left transition-colors cursor-pointer ${
                            playbackQuality === q ? 'bg-purple-600 font-extrabold text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  <button 
                    type="button"
                    onClick={toggleFullScreen}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                    title="Toggle Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* OFFLINE SCREEN: Beautiful themed state card */
            <motion.div 
              key="offline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full relative flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="absolute inset-0 z-0 opacity-15">
                <img 
                  src={streamStatus.thumbnail || 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg'} 
                  alt="Concert Stage Crowd background" 
                  className="w-full h-full object-cover grayscale"
                />
                <div className="absolute inset-0 bg-[#090212]" />
              </div>

              <div className="relative z-10 max-w-md space-y-5">
                <div className="w-16 h-16 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center mx-auto shadow-xl">
                  <Radio className="w-8 h-8 text-slate-500" />
                </div>

                <div className="space-y-1.5">
                  <span className={`text-[10px] font-mono uppercase tracking-[0.25em] font-semibold ${!streamStatus.isBackendOnline ? 'text-rose-500 animate-pulse' : 'text-gray-500'}`}>
                    {!streamStatus.isBackendOnline ? 'Service Unavailable ⚠️' : 'Broadcasting Service Offline'}
                  </span>
                  <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider leading-tight">
                    {!streamStatus.isBackendOnline 
                      ? 'Streaming server is currently unavailable.' 
                      : 'No Live Stream Currently'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {!streamStatus.isBackendOnline
                      ? 'The background live stream container or MediaMTX services are offline. Re-establishing link soon...'
                      : 'The media broadcast signal is inactive. Once the administrator starts live stream, the player will automatically appear.'}
                  </p>
                </div>

                {/* Show upcoming live schedule countdown timer if exists */}
                {streamStatus.scheduledAt && (
                  <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 max-w-sm mx-auto space-y-2 animate-pulse shadow-lg">
                    <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-purple-400 flex items-center justify-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Upcoming Live Schedule
                    </span>
                    <div className="text-xl md:text-2xl font-bold font-mono tracking-widest text-white">
                      {timeRemaining || 'Loading...'}
                    </div>
                    <span className="text-[9px] text-gray-500 block leading-tight font-mono">
                      KST Time: {new Date(streamStatus.scheduledAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 animate-fade-in font-sans pb-10">
      
      {/* Header Info Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-purple-400 font-mono flex items-center gap-1.5 leading-none mb-1">
            <Radio className="w-4 h-4 text-rose-500 animate-ping" /> Bangtan Live Cast Hub
          </span>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
            ARMY GALLERY REC-STUDIO
          </h2>
          <p className="text-xs text-gray-400">
            Secure self-hosted broadcast loop synced with OBS Studio settings & analytics data.
          </p>
        </div>
      </div>

      {/* Main Core Layout: Video view and Live chat sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT & CENTER SIDE: Player Stage */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Visualizer Player Stage */}
          <div 
            ref={playerContainerRef}
            className="relative aspect-video rounded-3xl border border-white/10 bg-[#090212] overflow-hidden group/player select-none shadow-2xl"
          >
            <AnimatePresence mode="wait">
              {streamStatus.isLive && streamStatus.embedCode && !streamStatus.embedCode.includes('.m3u8') ? (
                /* INJECTED IFRAME STREAM PLAYER */
                <motion.div
                  key="embedded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative"
                >
                  {currentEmbedSrc ? (
                    <iframe
                      src={currentEmbedSrc}
                      className="absolute inset-0 w-full h-full border-0 rounded-3xl"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
                      allowFullScreen
                      title="Live stream player"
                    />
                  ) : (
                    <div
                      className="w-full h-full absolute inset-0 [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:rounded-3xl [&_video]:w-full [&_video]:h-full [&_video]:absolute [&_video]:inset-0 [&>div]:w-full [&>div]:h-full [&>div]:relative"
                      dangerouslySetInnerHTML={{ __html: getEmbedHTML(streamStatus.embedCode) }}
                    />
                  )}
                  {/* Top-left overlay: LIVE badge + simple caption on the
                      screen itself (no background card, per owner) */}
                  <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none">
                    <span className="bg-red-600 text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-full tracking-wider inline-flex items-center gap-1 shadow-lg shadow-red-600/40 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      Live Feed
                    </span>
                  </div>
                  {/* Fallback shortcut: if a browser/blocker refuses the
                      embedded player, visitors can still open the source */}
                  {youtubeWatchUrl && (
                    <a
                      href={youtubeWatchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-4 right-4 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur border border-white/15 text-[11px] font-bold text-white hover:bg-red-600 transition-colors"
                    >
                      ▶ Watch on YouTube
                    </a>
                  )}
                </motion.div>
              ) : streamStatus.isLive && streamStatus.embedCode?.includes('.m3u8') ? (
                /* HLS PLAYER RENDERER: plays the admin's real .m3u8 live source */
                <motion.div 
                  key="playing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative"
                >
                   {/* Real-time high profile HLS broadcast pipeline */}
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted={isMuted}
                    className="absolute inset-0 w-full h-full object-cover opacity-90 select-none pointer-events-auto"
                  />

                  {/* Aesthetic Glowing Star overlay filters */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none z-10" />

                  {/* Top-left overlay: LIVE badge + simple caption on the screen */}
                  <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none">
                    <div className="flex items-center gap-2">
                      <span className="bg-red-600 text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-full tracking-wider flex items-center gap-1 shadow-lg shadow-red-600/40 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        Live Now
                      </span>
                      <span className="bg-black/60 backdrop-blur-md border border-white/10 text-white font-semibold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                        {chatMessages.length} Messages
                      </span>
                    </div>
                  </div>

                  {/* Top-right Streaming statistics */}
                  <div className="absolute top-4 right-4 z-20 font-mono text-[10px] text-white/90 bg-black/55 backdrop-blur-md px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-gray-400 font-semibold uppercase">Uptime:</span>
                    <span>{streamDurationFormatted}</span>
                    <span className="text-purple-400">({playbackQuality} &bull; Auto)</span>
                  </div>

                  {/* Custom Player Overlay controls (appear on hover) */}
                  <div className="absolute inset-x-0 bottom-0 z-20 p-5 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover/player:opacity-100 transition-opacity duration-300 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                      </button>

                      <button 
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      <span className="text-xs font-mono font-bold tracking-widest text-purple-300 animate-pulse">
                        🔴 BROADCAST SYNC ACTIVE
                      </span>
                    </div>

                    <div className="flex items-center gap-2 relative">
                      {/* Quality selection */}
                      <button 
                        onClick={() => setShowQualityMenu(!showQualityMenu)}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-mono hover:text-white transition-all border border-white/5 cursor-pointer"
                      >
                        Quality: {playbackQuality}
                      </button>

                      {showQualityMenu && (
                        <div className="absolute bottom-full right-12 mb-2 bg-[#05000a]/95 border border-white/10 rounded-xl p-1.5 flex flex-col gap-1 shadow-2xl z-50 min-w-[70px]">
                          {['1080p', '720p', '480p', 'Auto'].map((q) => (
                            <button
                              key={q}
                              onClick={() => {
                                setPlaybackQuality(q);
                                setShowQualityMenu(false);
                                triggerAudioBeep(900, 0.05);
                              }}
                              className={`text-[9px] font-mono px-2 py-1 rounded-md text-left transition-colors cursor-pointer ${
                                playbackQuality === q ? 'bg-purple-600 font-extrabold text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      )}

                      <button 
                        onClick={toggleFullScreen}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                        title="Toggle Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* OFFLINE SCREEN: Beautiful themed state card */
                <motion.div 
                  key="offline"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="absolute inset-0 z-0 opacity-15">
                    <img 
                      src={streamStatus.thumbnail || 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg'} 
                      alt="Concert Stage Crowd background" 
                      className="w-full h-full object-cover grayscale"
                    />
                    <div className="absolute inset-0 bg-[#090212]" />
                  </div>

                  <div className="relative z-10 max-w-md space-y-5">
                    <div className="w-16 h-16 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center mx-auto shadow-xl">
                      <Radio className="w-8 h-8 text-slate-500" />
                    </div>

<<<<<<< HEAD
{/* 
<div className="w-[650px] h-[400px] -ml-19 mt-0 overflow-hidden rounded-2xl bg-black">
  <video
    className="w-full h-full object-cover"
    src="/vr615n_yE7M2TNEz.mp4"
    controls
    autoPlay
    muted
    loop
    playsInline
  />
</div> */}
{/* LIVE OFFLINE ALERT */}
<div className="w-full flex justify-center">
  <div className="w-full max-w-[750px] min-h-[400px] flex flex-col items-center justify-center text-center  px-8 py-10">

    {/* Alert Icon */}
    

    {/* Status */}
    <p className="text-[11px] font-bold">
      Next BTS concert is in October 2, 3 at Bogotá, Colombia at Estadio Nemésio Camacho El Campín.
    </p>

    {/* Title */}
    <h2 className="text-3xl md:text-4xl font-black tracking-wide text-white mb-5">
      BTS WORLD TOUR ARIRANG 2026 
    </h2>

    {/* Divider */}
    <div className="w-24 h-[3px] bg-red-500 mb-6 shadow-[0_0_15px_rgba(239,68,68,0.8)]" />

    {/* Message */}
    <p className="text-sm md:text-base text-gray-400 leading-relaxed">
      See you in next concert
      <br />
      <span className="text-red-300 font-medium">
        We&apos;re preparing the next broadcast for ARMY. 💜
      </span>
    </p>

    {/* Standby */}
    <div className="mt-8 flex items-center gap-2 text-xs font-bold tracking-wider text-red-300">
      <spaPn className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
      BROADCAST STANDBY   </div>

  </div>
</div>



{/* <div className="w-[500px] h-[350px] -ml-20 mt-0 overflow-hidden rounded-2xl bg-black">
  <img
    src="/RES.png"
    alt="BTS Live"
    className="w-full h-full object-cover"
  />
</div> */}

{/* embaded in here */}

{/* <div className="space-y-9 -ml-25 -mt-10">
  <iframe
    width="650"
    height="450"
    src="https://player.vdocipher.com/live-v2?liveId=e723f5417691462cacc834ee213c2571"
    title="BTS WORLD TOUR ARIRANG 2026"
    className="rounded-2xl border border-purple-500/30"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerPolicy="strict-origin-when-cross-origin"
    allowFullScreen
  />
</div> */}


=======
                    <div className="space-y-1.5">
                      <span className={`text-[10px] font-mono uppercase tracking-[0.25em] font-semibold ${!streamStatus.isBackendOnline ? 'text-rose-500 animate-pulse' : 'text-gray-500'}`}>
                        {!streamStatus.isBackendOnline ? 'Service Unavailable ⚠️' : 'Broadcasting Service Offline'}
                      </span>
                      <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider leading-tight">
                        {!streamStatus.isBackendOnline 
                          ? 'Streaming server is currently unavailable.' 
                          : 'No Live Stream Currently'}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {!streamStatus.isBackendOnline
                          ? 'The background live stream container or MediaMTX services are offline. Re-establishing link soon...'
                          : 'The media broadcast signal is inactive. Once the administrator starts live stream, the player will automatically appear.'}
                      </p>
                    </div>
>>>>>>> 8b07e708b89c88a9a2c17951f58c4101b8568725

                    {/* Show upcoming live schedule countdown timer if exists */}
                    {streamStatus.scheduledAt && (
                      <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 max-w-sm mx-auto space-y-2 animate-pulse shadow-lg">
                        <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-purple-400 flex items-center justify-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Upcoming Live Schedule
                        </span>
                        <div className="text-xl md:text-2xl font-bold font-mono tracking-widest text-white">
                          {timeRemaining || 'Loading...'}
                        </div>
                        <span className="text-[9px] text-gray-500 block leading-tight font-mono">
                          KST Time: {new Date(streamStatus.scheduledAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Caption — plain text under the video, YouTube-style.
              Owner clarified 2026-11-06: this admin-written caption
              STAYS (a Batch-59 removal was reversed the same day —
              the title the owner wants gone is YouTube's own
              in-player header, which no site can remove). */}
          {(streamStatus.title || streamStatus.description) && (
            <div className="space-y-1 px-0.5">
              {streamStatus.title && (
                <h3 className="text-base md:text-lg font-bold text-white leading-snug">
                  {streamStatus.title} 💜
                </h3>
              )}
              {streamStatus.description && (
                <p className="text-xs text-gray-400 leading-relaxed">
                  {streamStatus.description}
                </p>
              )}
            </div>
          )}

          {/* Telegram Channel Backup & Live Notification Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-purple-950/40 border border-cyan-500/25 flex flex-col sm:flex-row items-center justify-between gap-3.5 shadow-lg">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200 font-sans">
              <span className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/35 text-cyan-300 flex items-center justify-center shrink-0 shadow-sm">
                <Send className="w-4 h-4 -rotate-12" />
              </span>
              <span className="font-medium">
                If the live stream is not available, please visit here:
              </span>
            </div>
            <a
              href="https://t.me/arirang_army7"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-md shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Visit Telegram Channel"
            >
              <Send className="w-3.5 h-3.5 -rotate-12" />
              <span>Join Telegram Channel 📢</span>
            </a>
          </div>

        </div>

        {/* RIGHT SIDE: Immersive Live Chat pane */}
        <div className="h-[520px] lg:h-[595px] flex flex-col rounded-3xl border border-white/10 bg-black/45 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-purple-400" />
                <Users className="w-5 h-5 text-purple-300" />
              </div>
              <div className="text-left font-sans">
                <span className="text-xs font-bold text-white block">ARMY LIVE ROOMCHAT</span>
                <span className="text-[9px] font-mono text-purple-400 block tracking-wider leading-none">Global Lounge Active</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                setSavingChatName(!savingChatName);
                triggerAudioBeep(1000, 0.05);
              }}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-[9px] font-mono text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              Ident: {chatAuthorName || 'Guest'}
            </button>
          </div>

          {/* Change Chat Name Overlay */}
          <AnimatePresence>
            {savingChatName && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-[52px] inset-x-0 bg-[#090212]/98 border-b border-white/10 p-4.5 z-30 space-y-3 shadow-xl"
              >
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">Configure Chat Handle Identity</h4>
                  <p className="text-[10px] text-gray-500">Pick some fancy ARMY pen name below to display in comments.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="Enter ARMY username"
                    value={chatAuthorName}
                    onChange={(e) => setChatAuthorName(e.target.value.replace(/[^a-zA-Z0-9_\- ]/g, ''))}
                    className="flex-grow bg-black/40 border border-purple-500/25 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500/50 placeholder:text-gray-600"
                  />
                  <button
                    onClick={() => {
                      localStorage.setItem('bts_live_chat_name', chatAuthorName.trim());
                      setSavingChatName(false);
                      triggerAudioBeep(1100, 0.1);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs text-white font-bold transition-all cursor-pointer shadow-lg shadow-purple-600/20"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scrollable chat message lines */}
          <div 
            ref={chatScrollContainerRef}
            className="flex-grow overflow-y-auto p-4 space-y-3 scrolling-touch min-h-0"
          >
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 space-y-2">
                <Sparkles className="w-5 h-5 text-purple-900/40 animate-pulse" />
                <span className="text-[10px] font-mono">No live chats yet. Be the first!</span>
              </div>
            ) : (
              chatMessages.map((msg, i) => {
                if (msg.isSystem) {
                  return (
                    <div key={msg.id || i} className="p-2.5 rounded-xl bg-purple-950/15 border border-purple-900/20 text-center font-mono text-[9px] text-purple-300 space-y-1">
                      <span className="font-extrabold flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-400" /> {msg.username}
                      </span>
                      <p className="leading-normal">{msg.text}</p>
                    </div>
                  );
                }

                return (
                  <div key={msg.id || i} className="flex gap-2.5 items-start">
                    {msg.memberEmoji ? (
                      <div className="w-7 h-7 rounded-lg bg-purple-900/10 border border-white/5 flex items-center justify-center text-[16px] leading-none shrink-0" title="Bias emoji">
                        {msg.memberEmoji}
                      </div>
                    ) : (
                      <img
                        src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(msg.username)}`}
                        alt="Avatar"
                        className="w-7 h-7 rounded-lg bg-purple-900/10 border border-white/5"
                      />
                    )}
                    <div className="flex-grow text-left text-xs bg-white/[0.015] border border-white/[0.03] p-2 rounded-2xl">
                      <div className="flex items-center gap-1.5 justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`${msg.isModerator ? 'text-pink-400 font-extrabold' : 'text-purple-300 font-bold'}`}>
                            {msg.username}
                          </span>
                          {msg.isModerator && (
                            <span className="text-[8px] bg-pink-500/15 border border-pink-500/20 text-pink-400 px-1 rounded uppercase font-mono tracking-wider font-extrabold">
                              Staff 🛡️
                            </span>
                          )}
                        </div>
                        <span className="text-[8px] font-mono text-gray-600">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      
                      <p className="text-gray-300 mt-1 leading-relaxed break-words">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>
          

          {/* Footer form */}
          <div className="p-3 pb-0 bg-black/20 border-t border-white/5 shrink-0">
            <MemberEmojiPicker value={biasEmoji} onChange={setBiasEmoji} />
          </div>
          <form 
            onSubmit={handleSendChat}
            className="p-4 pt-2.5 bg-black/20 shrink-0 flex gap-2"
          >
            <input
              type="text"
              maxLength={150}
              placeholder="Send live chat message..."
              value={newChatText}
              onChange={(e) => setNewChatText(e.target.value)}
              className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 placeholder:text-gray-600 font-sans"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 border border-purple-500/25 text-white transition-all cursor-pointer flex items-center justify-center shadow-lg shadow-purple-600/20 group"
            >
              <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </form>
        </div>
      </div>

      {/* Ad — last in the flow: video, caption, Telegram, chat, then ad */}
      <AdsterraAd type={4} />

    </div>
  );
<<<<<<< HEAD
  
  <script src="https://beavercolourfuldelinquent.com/96/b0/81/96b081c84962ad9696bc9ede738092f3.js"></script>

  
=======
>>>>>>> 8b07e708b89c88a9a2c17951f58c4101b8568725
}
