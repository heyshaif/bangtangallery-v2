import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Hls from 'hls.js';
import AdsterraAd from './AdsterraAd';
import {
  Radio, Eye, Copy, RefreshCw, Sparkles, Lock, Calendar, Timer, Check, AlertCircle,
  Play, Pause, Volume2, VolumeX, Maximize2, Shield, Send, Info, Users, BarChart3, Clock, Flame
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getYoutubeEmbedUrl } from './youtubeUtils';

interface ChatMessage {
  id: string;
  username: string;
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

export default function LiveStreamSection({ playerOnly = false }: { playerOnly?: boolean }) {
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

  // Public Stream states
  const [streamStatus, setStreamStatus] = useState({
    isLive: false,
    isBackendOnline: true,
    title: 'Loading Stream...',
    description: '',
    embedCode: '',
    thumbnail: '',
    viewerCount: 0,
    peakViewers: 0,
    totalViews: 0,
    watchTime: 0,
    streamDuration: 0,
    startedAt: null as string | null,
    scheduledAt: null as string | null
  });
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatText, setNewChatText] = useState('');
  const [chatAuthorName, setChatAuthorName] = useState(() => {
    return localStorage.getItem('bts_live_chat_name') || '';
  });
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

    let hls: Hls | null = null;
    const streamSource = '/live/stream.m3u8';

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
  }, [streamStatus.isLive, isPlaying]);

  // Load public status
  const fetchPublicData = async () => {
    try {
      const res = await fetch('/api/live/status');
      if (res.ok) {
        const data = await res.json();
        setStreamStatus(data);
      }
    } catch (e) {
      console.error('Failed to poll stream updates', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Subscribe to real-time live chat messages via Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'live_chat'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((snapshotDoc) => {
        const data = snapshotDoc.data();
        messages.push({
          id: data.id || snapshotDoc.id,
          username: data.username || 'Anonymous',
          text: data.text || '',
          timestamp: data.timestamp || new Date().toISOString(),
          isModerator: !!data.isModerator,
          isSystem: !!data.isSystem,
          avatarUrl: data.avatarUrl || ''
        });
      });
      // Sort messages ascending by timestamp to ensure correct timeline
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setChatMessages(messages);
    }, (error) => {
      console.error('Firestore chat subscription failed:', error);
    });

    return () => unsubscribe();
  }, []);

  // Poll current live status every 3.5s
  useEffect(() => {
    fetchPublicData();
    const interval = setInterval(fetchPublicData, 3500);
    return () => clearInterval(interval);
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

  // Administrator Action: Simulate Broadcaster (Go Live or End Stream via Webhook triggers)
  const handleSimulateBroadcaster = async (action: 'connect' | 'disconnect') => {
    setSimulatingBroadcaster(true);
    try {
      const token = localStorage.getItem('bts_admin_token') || '';
      const res = await fetch('/api/admin/live/simulate_publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        const data = await res.json();
        setAdminSettings(data.settings);
        setStreamStatus(data.settings);
        triggerAudioBeep(action === 'connect' ? 1046.50 : 440, 0.5);
      }
    } catch {
      alert('Connection simulation error.');
    } finally {
      setSimulatingBroadcaster(false);
    }
  };

  // Client Action: Send chat message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;

    const initialText = newChatText;
    setNewChatText(''); // optimistic clear
    try {
      const userName = chatAuthorName.trim() || 'ARMY_' + Math.floor(Math.random() * 8999 + 1000);
      const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      
      const messagePayload = {
        id: msgId,
        username: userName,
        text: initialText,
        timestamp: new Date().toISOString(),
        isModerator: isAdmin,
        isSystem: false,
        avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(userName)}`
      };

      // Direct write to firestore collection 'live_chat' using random custom safe doc ID
      await setDoc(doc(db, 'live_chat', msgId), messagePayload);
      triggerAudioBeep(1000, 0.05);
    } catch (err) {
      console.error('Failed to send live chat message to Firestore:', err);
      setNewChatText(initialText); // restore on fail
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
    if (!codeOrUrl) return '';
    const trimmed = codeOrUrl.trim();
    
    if (trimmed.startsWith('<iframe') || trimmed.includes('<script')) {
      return trimmed;
    }

    let srcUrl = trimmed;
    // Auto-convert standard YouTube links to their embeddable counterpart
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      srcUrl = getYoutubeEmbedUrl(trimmed);
    } else if (trimmed.includes('twitch.tv')) {
      const channelMatch = trimmed.match(/twitch\.tv\/([a-zA-Z0-9_\-]+)/);
      if (channelMatch && channelMatch[1] && !trimmed.includes('player.twitch.tv')) {
        const hostname = window.location.hostname;
        srcUrl = `https://player.twitch.tv/?channel=${channelMatch[1]}&parent=${hostname}&autoplay=true`;
      }
    }

    // Wrap in a secure, fully responsive iframe
    return `<iframe src="${srcUrl}" width="100%" height="100%" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 24px;"></iframe>`;
  };

  if (playerOnly) {
    return (
      <div 
        ref={playerContainerRef}
        className="fixed inset-0 w-full h-full bg-[#05000a] overflow-hidden select-none"
      >
        <AnimatePresence mode="wait">
          {streamStatus.embedCode ? (
            /* INJECTED IFRAME STREAM PLAYER */
            <motion.div
              key="embedded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full relative"
            >
              <div 
                className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:border-none [&_iframe]:outline-none"
                dangerouslySetInnerHTML={{ __html: getEmbedHTML(streamStatus.embedCode) }}
              />
              {/* Top-left Badges overlay for public live stream */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
                <span className="bg-red-650 text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-full tracking-wider flex items-center gap-1 shadow-lg shadow-red-650/40 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Live Feed
                </span>
              </div>
            </motion.div>
          ) : streamStatus.isLive ? (
            /* LIVE PLAYER RENDERER: Playing beautiful simulated HLS feed */
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
                <span className="bg-red-650 text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-full tracking-wider flex items-center gap-1 shadow-lg shadow-red-650/40 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Live Now
                </span>
                <span className="bg-black/60 backdrop-blur-md border border-white/10 text-white font-semibold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  {streamStatus.viewerCount?.toLocaleString() || '2,531'} Watching
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
                  src={streamStatus.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'} 
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
    <div className="w-full space-y-8 animate-fade-in font-sans pb-16">
      
      {/* Header Info Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-purple-400 font-mono flex items-center gap-1.5 leading-none mb-1">
            <Radio className="w-4 h-4 text-rose-500 animate-ping" /> Bangtan Live Cast Hub
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
           BTS WORLD TOUR ARIRANG 2026  LIVE STREM...
          </h2>
          <p className="text-xs text-gray-400">
             BTS WORLD TOUR ARIRANG 2026  LIVE STREM LOS ANGELES DAY -3
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
              {streamStatus.embedCode ? (
                /* INJECTED IFRAME STREAM PLAYER */
                <motion.div
                  key="embedded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative"
                >
                  <div 
                    className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:rounded-3xl"
                    dangerouslySetInnerHTML={{ __html: getEmbedHTML(streamStatus.embedCode) }}
                  />
                  {/* Top-left Badges overlay for public live stream */}
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
                    <span className="bg-red-650 text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-full tracking-wider flex items-center gap-1 shadow-lg shadow-red-650/40 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      Live Feed
                    </span>
                  </div>
                </motion.div>
              ) : streamStatus.isLive ? (
                /* LIVE PLAYER RENDERER: Playing beautiful simulated HLS feed */
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
                    <span className="bg-red-650 text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-full tracking-wider flex items-center gap-1 shadow-lg shadow-red-650/40 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      Live Now
                    </span>
                    <span className="bg-black/60 backdrop-blur-md border border-white/10 text-white font-semibold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      {streamStatus.viewerCount?.toLocaleString() || '2,531'} Watching
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
                      src={streamStatus.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'} 
                      alt="Concert Stage Crowd background" 
                      className="w-full h-full object-cover grayscale"
                    />
                    <div className="absolute inset-0 bg-[#090212]" />
                  </div>

                  <div className="relative z-10 max-w-md space-y-5">
                    <div className="w-16 h-16 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center mx-auto shadow-xl">
                      <Radio className="w-8 h-8 text-slate-500" />
                    </div>


{/* <div className="w-[500px] h-[350px] -ml-20 mt-0 overflow-hidden rounded-2xl bg-black">
  <img
    src="/RES.png"
    alt="BTS Live"
    className="w-full h-full object-cover"
  />
</div> */}

{/* embaded in here */}
<div className="space-y-9 -ml-25 -mt-15">
  <iframe
    width="650"
    height="450"
    src="https://player.vdocipher.com/live-v2?liveId=eef6b9c57bd74954800dbe3063e83856"
    title="BTS WORLD TOUR ARIRANG 2026"
    className="rounded-2xl border border-purple-500/30"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerPolicy="strict-origin-when-cross-origin"
    allowFullScreen
  />
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

          {/* Under-player Metatags Information */}
          <div className="p-6 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-md flex flex-col sm:flex-row gap-5 items-start justify-between">
            <div className="space-y-2 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                {streamStatus.isLive && (
                  <span className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    🔴 Active Broadcast
                  </span>
                )}
                <span className="bg-white/5 border border-white/10 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded">
                  RTMP v5.0
                </span>
                <span className="bg-purple-955/20 border border-purple-500/10 text-purple-400 text-[10px] font-mono px-2 py-0.5 rounded">
                  Borahae-Core Protocol
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white tracking-widest uppercase font-sans">
                {streamStatus.title}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                {streamStatus.description}
              </p>
            </div>

            {/* Quick Live stats block */}
            <div className="grid grid-cols-2 gap-3 min-w-[170px] font-mono text-[10px] text-gray-400 self-center sm:self-start bg-black/25 p-3.5 rounded-2xl border border-white/5">
              <div>
                <span className="text-gray-500 uppercase block"></span>
                <span className="text-xs text-white font-bold block mt-0.5">👁 {streamStatus.totalViews?.toLocaleString() || ''}</span>
              </div>

              <div>
                <span className="text-gray-500 uppercase block"></span>
                <span className="text-xs text-purple-400 font-bold block mt-0.5">🔥 {streamStatus.peakViewers || ''}</span>
              </div>
              
              <div className="col-span-2 border-t border-white/5 pt-2 mt-1">
                <span className="text-gray-500 uppercase block"></span>
                <span className="text-xs text-emerald-400 font-bold block mt-0.5">⚡ {Math.max(1, Math.ceil(streamStatus.watchTime / 60))} Hrs Total</span>
              </div>
            </div>
          </div>
          <AdsterraAd type={4} />

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
                    <img
                      src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(msg.username)}`}
                      alt="Avatar"
                      className="w-7 h-7 rounded-lg bg-purple-900/10 border border-white/5"
                    />
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
          <form 
            onSubmit={handleSendChat}
            className="p-4 border-t border-white/5 bg-black/20 shrink-0 flex gap-2"
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

    </div>
    
  );
  <script src="https://beavercolourfuldelinquent.com/96/b0/81/96b081c84962ad9696bc9ede738092f3.js"></script>

  
}


