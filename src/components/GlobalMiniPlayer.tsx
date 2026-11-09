import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import {
  Play, Pause, SkipForward, SkipBack, Music, Volume2, VolumeX,
  Sparkles, X, ChevronDown, ChevronUp, Shuffle, RotateCcw, Maximize2, FileText,
  Heart, GripHorizontal
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useDragControls } from 'motion/react';

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

interface GlobalMiniPlayerProps {
  onNavigateToMusic: () => void;
  activeTab?: string;
}

export default function GlobalMiniPlayer({ onNavigateToMusic, activeTab }: GlobalMiniPlayerProps) {
  const {
    currentTrack,
    currentAlbum,
    isPlaying,
    playbackProgress,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    isRepeat,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    playbackError,
    openLyrics,
  } = useAudioPlayer();

  // Local Storage states for player presentation choice
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('bts_player_is_open');
    return saved !== null ? saved === 'true' : true;
  });

  // Force open if on Music page
  useEffect(() => {
    if (activeTab === 'Music') {
      setIsOpen(true);
    }
  }, [activeTab]);

  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    const saved = localStorage.getItem('bts_player_is_minimized');
    return saved !== null ? saved === 'true' : false;
  });

  const [showVolumeTip, setShowVolumeTip] = useState(false);

  // ---- Batch 104: favorites + full-screen + free dragging ----
  // Favorites share the Music page's localStorage key
  // (bts_music_favorites, track ids) and its change event, so
  // the heart here and the hearts on the track rows always agree.
  const [favIds, setFavIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('bts_music_favorites') || '[]'); } catch { return []; }
  });
  useEffect(() => {
    const reload = () => {
      try { setFavIds(JSON.parse(localStorage.getItem('bts_music_favorites') || '[]')); } catch { /* noop */ }
    };
    window.addEventListener('bts-favorites-changed', reload);
    return () => window.removeEventListener('bts-favorites-changed', reload);
  }, []);
  const isFav = !!currentTrack && favIds.includes(currentTrack.id);
  const toggleFav = () => {
    if (!currentTrack) return;
    const next = favIds.includes(currentTrack.id)
      ? favIds.filter((id) => id !== currentTrack.id)
      : [...favIds, currentTrack.id];
    setFavIds(next);
    try { localStorage.setItem('bts_music_favorites', JSON.stringify(next)); } catch { /* noop */ }
    window.dispatchEvent(new Event('bts-favorites-changed'));
  };

  const [fsOpen, setFsOpen] = useState(false);
  useEffect(() => {
    if (!fsOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFsOpen(false); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [fsOpen]);

  // Dragging: ONLY from the header strip (dragControls), so the
  // buttons and sliders never fight the drag. The offset is
  // remembered across visits; double-clicking the strip resets.
  const dragControls = useDragControls();
  const [savedPos] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem('bts_player_pos') || 'null');
      if (p && typeof p.x === 'number' && typeof p.y === 'number') return p;
    } catch { /* noop */ }
    return { x: 0, y: 0 };
  });
  const posX = useMotionValue(savedPos.x);
  const posY = useMotionValue(savedPos.y);
  const [dragBounds] = useState(() => ({
    left: -(Math.max(0, window.innerWidth / 2 - 48)),
    right: Math.max(0, window.innerWidth / 2 - 48),
    top: -(Math.max(0, window.innerHeight - 220)),
    bottom: 16,
  }));
  const savePos = () => {
    try { localStorage.setItem('bts_player_pos', JSON.stringify({ x: posX.get(), y: posY.get() })); } catch { /* noop */ }
  };
  const resetPos = () => {
    posX.set(0);
    posY.set(0);
    try { localStorage.removeItem('bts_player_pos'); } catch { /* noop */ }
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('bts_player_is_open', String(isOpen));
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem('bts_player_is_minimized', String(isMinimized));
  }, [isMinimized]);

  // Expand player when track starts playing
  useEffect(() => {
    if (currentTrack && isPlaying) {
      setIsOpen(true);
      setIsMinimized(false);
    }
  }, [currentTrack?.id, isPlaying]);

  // Batch 114: closed + nothing playing -> the reopen button
  // fades away after 8 idle seconds. Any tap or key press, a
  // track change, or pressing play brings it back and restarts
  // the countdown.
  const [fabHidden, setFabHidden] = useState(false);
  useEffect(() => {
    if (isOpen || isPlaying) {
      setFabHidden(false);
      return;
    }
    setFabHidden(false);
    let t = window.setTimeout(() => setFabHidden(true), 8000);
    const revive = () => {
      setFabHidden(false);
      window.clearTimeout(t);
      t = window.setTimeout(() => setFabHidden(true), 8000);
    };
    window.addEventListener('pointerdown', revive);
    window.addEventListener('keydown', revive);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('pointerdown', revive);
      window.removeEventListener('keydown', revive);
    };
  }, [isOpen, isPlaying, currentTrack?.id]);

  if (!currentTrack) return null;

  const isSpotify = !currentTrack.audioUrl && !!currentTrack.spotifyUrl;
  const spotifyEmbedUrl = isSpotify ? getEmbeddedPlayerUrl(currentTrack.spotifyUrl) : null;

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(100, (clickX / width) * 100));
    seek(percentage);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setVolume(parseFloat(e.target.value));
  };

  // 1. IF FULLY CLOSED: Show a small glowing float icon in the corner
  if (!isOpen) {
    return (
      <motion.button
        id="reopen-player-fab"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: fabHidden ? 0 : 1, opacity: fabHidden ? 0 : 1 }}
        style={{ pointerEvents: fabHidden ? 'none' : 'auto' }}
        whileHover={{ scale: 1.1, rotate: 10 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 z-50 p-4 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-2xl flex items-center justify-center border border-purple-400/40 cursor-pointer group transition-all duration-500 left-1/2 -translate-x-1/2"
        title="Reopen Background Audio Player 🎵"
      >
        <div className="absolute inset-0 rounded-full bg-purple-500/30 animate-ping pointer-events-none" />
        <Music className={`w-5 h-5 ${isPlaying ? 'animate-bounce' : ''}`} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-sans text-xs font-bold whitespace-nowrap ml-0 group-hover:ml-2">
          ARMY Player
        </span>
      </motion.button>
    );
  }

  return (
    <>
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={dragBounds}
      dragElastic={0.05}
      dragMomentum={false}
      onDragEnd={savePos}
      style={{ x: posX, y: posY }}
      className="fixed bottom-6 z-50 select-none left-0 right-0 mx-auto w-[calc(100%-2rem)] max-w-[420px]"
    >
      <div className="glass-panel border border-purple-500/35 bg-[#080212]/95 backdrop-blur-2xl rounded-2xl p-4 shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col gap-3.5 relative overflow-hidden">
        
        {/* Color overlay strip mimicking real-time track slider */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/[0.04] overflow-hidden rounded-t-2xl">
          <div 
            className="cute-progress-fill h-full rounded-full transition-all duration-150"
            style={{ width: `${playbackProgress}%` }}
          />
        </div>

        {/* ================= HEADER ACTIONS ROW ================= */}
        <div
          className="flex items-center justify-between pointer-events-auto cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={(e) => { if (!(e.target as HTMLElement).closest('button')) dragControls.start(e); }}
          onDoubleClick={resetPos}
          title="Drag to move the player • Double-click to reset its position"
        >
          <div className="flex items-center gap-1.5 cursor-pointer max-w-[240px]" onClick={onNavigateToMusic}>
            <GripHorizontal className="w-4 h-4 text-purple-400/70 shrink-0" />
            <span className="text-[10px] font-mono font-bold text-purple-400 tracking-widest flex items-center gap-1">
              BACKGROUND SYNTH <Sparkles className="w-2.5 h-2.5 animate-pulse text-fuchsia-400" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Batch 104: Favorite — same list as the Music page */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleFav(); }}
              className="p-1.5 rounded-lg transition-all cursor-pointer hover:bg-pink-500/15"
              title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-pink-500 text-pink-500' : 'text-slate-300'}`} />
            </button>

            {/* Batch 104: Full-screen Now Playing */}
            <button
              onClick={(e) => { e.stopPropagation(); setFsOpen(true); }}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              title="Full-screen player"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Lyrics (only when the current track has lyrics text) */}
            {currentTrack.lyrics && currentTrack.lyrics.trim() !== '' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openLyrics(currentTrack);
                }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-500/20 border border-purple-500/25 transition-all cursor-pointer"
                title="View lyrics"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wide">Lyrics</span>
              </button>
            )}

            {/* Toggle Minimize/Maximize Mode */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              title={isMinimized ? 'Expand Audio controls' : 'Minimize Audio controls'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Instant Close/Hide Player */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isPlaying) {
                  togglePlay();
                }
                setIsOpen(false);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer"
              title="Close Player Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= COMPACT MODE LAYOUT ================= */}
        {isMinimized && (
          <div className="flex items-center justify-between gap-3 animate-[fade-in_0.3s_ease] cursor-pointer" onClick={onNavigateToMusic}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-purple-950/20 shadow-md">
                {currentTrack.coverUrl || currentAlbum?.coverUrl ? (
                  <img 
                    src={currentTrack.coverUrl || currentAlbum?.coverUrl} 
                    alt={currentTrack.title} 
                    className={`w-full h-full object-cover ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Music className="w-4 h-4 text-purple-400 absolute inset-0 m-auto" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-slate-100 truncate tracking-wide">
                  {currentTrack.title}
                </h4>
                <p className="text-[10px] text-purple-300/80 truncate font-mono mt-0.5">
                  {currentTrack.artist || 'BTS'}
                </p>
                {playbackError && (
                  <p className="text-[10px] text-red-400 font-sans mt-0.5 leading-snug">
                    ⚠ {playbackError}
                  </p>
                )}
              </div>
            </div>

            {/* Micro compact controls */}
            <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
              <button 
                onClick={prevTrack} 
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
              
              <button 
                onClick={togglePlay} 
                className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                {isPlaying ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-white ml-0.5" />}
              </button>

              <button 
                onClick={nextTrack} 
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ================= FULL MODE LAYOUT ================= */}
        {!isMinimized && (
          <div className="flex flex-col gap-3.5 animate-[slide-down_0.3s_ease]">
            {isSpotify ? (
              /* Spotify Mode Full Layout */
              <>
                {/* Album details */}
                <div className="flex items-center gap-4 cursor-pointer" onClick={onNavigateToMusic}>
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-purple-950/20 border border-purple-500/20 shadow-xl">
                    {currentTrack.coverUrl || currentAlbum?.coverUrl ? (
                      <img 
                        src={currentTrack.coverUrl || currentAlbum?.coverUrl} 
                        alt={currentTrack.title} 
                        className={`w-full h-full object-cover transition-transform duration-500 ${isPlaying ? 'animate-[spin_12s_linear_infinite]' : ''}`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-purple-950">
                        <Music className="w-6 h-6 text-purple-400 animate-pulse" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-400/20 rounded-full px-2 py-0.5 inline-block uppercase tracking-wider mb-1 font-bold">
                      Spotify Playback
                    </span>
                    <h4 className="text-sm font-black text-slate-100 truncate tracking-wide leading-snug">
                      {currentTrack.title}
                    </h4>
                    <p className="text-xs text-slate-400 truncate mt-0.5 font-sans">
                      {currentTrack.artist || 'BTS'}
                    </p>
                  </div>
                </div>

                {/* Spotify Iframe Bed */}
                {spotifyEmbedUrl && isPlaying ? (
                  <div className="w-full h-[80px] rounded-xl overflow-hidden bg-black border border-purple-500/15">
                    <iframe
                      src={spotifyEmbedUrl}
                      width="100%"
                      height="80"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="w-full h-full"
                      title={`Spotify Player - ${currentTrack.title}`}
                    ></iframe>
                  </div>
                ) : (
                  <div className="w-full h-[80px] rounded-xl border border-dashed border-purple-500/20 bg-purple-950/10 flex flex-col items-center justify-center text-center p-3">
                    <p className="text-xs text-purple-400 font-mono font-bold">Spotify Playback Stopped</p>
                    <p className="text-[10px] text-slate-400 mt-1">Tap the Play button below to load Spotify stream</p>
                  </div>
                )}

                {/* Compact Control Row for Queue Navigation */}
                <div className="flex items-center justify-between gap-2 bg-white/[0.02] border border-white/5 rounded-xl p-2 px-3">
                  <div />
                  {/* Prev */}
                  <button
                    onClick={(e) => { e.stopPropagation(); prevTrack(); }}
                    className="p-1 px-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title="Previous Track"
                  >
                    <SkipBack className="w-4 h-4 fill-current" />
                  </button>

                  {/* Play / Pause button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 scale-105 active:scale-95 text-white flex items-center justify-center shadow-xl transform transition-all cursor-pointer border border-purple-400/25"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-white text-white" /> : <Play className="w-4 h-4 fill-white text-white ml-0.5" />}
                  </button>

                  {/* Next */}
                  <button
                    onClick={(e) => { e.stopPropagation(); nextTrack(); }}
                    className="p-1 px-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title="Next Track"
                  >
                    <SkipForward className="w-4 h-4 fill-current" />
                  </button>
                  <div />
                </div>
              </>
            ) : (
              /* Custom Audio Mode Full Layout */
              <>
                {/* Album details */}
                <div className="flex items-center gap-4 cursor-pointer" onClick={onNavigateToMusic}>
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-purple-950/20 border border-purple-500/20 shadow-xl">
                    {currentAlbum?.coverUrl ? (
                      <img 
                        src={currentAlbum.coverUrl} 
                        alt={currentAlbum.title} 
                        className={`w-full h-full object-cover transition-transform duration-500 ${isPlaying ? 'animate-[spin_12s_linear_infinite]' : ''}`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Music className="w-6 h-6 text-purple-400 absolute inset-0 m-auto animate-pulse" />
                    )}
                    <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-mono font-bold text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-400/20 rounded-full px-2 py-0.5 inline-block uppercase tracking-wider mb-1">
                      {currentAlbum?.type || 'Album Song'}
                    </span>
                    <h4 className="text-sm font-black text-slate-100 truncate tracking-wide leading-snug">
                      {currentTrack.title}
                    </h4>
                    <p className="text-xs text-slate-400 truncate mt-0.5 font-sans">
                      {currentAlbum ? currentAlbum.title : 'BTS Anthology'} &bull; 2026
                    </p>
                  </div>
                </div>

                {/* SELECTION PROGRESS BAR (INTERACTIVE/SEEKABLE) */}
                <div className="flex flex-col gap-1">
                  <div 
                    onClick={handleProgressBarClick}
                    onPointerDownCapture={e => e.stopPropagation()}
                    className="h-3 w-full bg-white/[0.07] hover:bg-white/[0.12] rounded-full cursor-pointer relative group/slider transition-colors duration-150"
                  >
                    {/* Visual Fill */}
                    <div 
                      className="cute-progress-fill h-full rounded-full relative transition-all duration-150"
                      style={{ width: `${playbackProgress}%` }}
                    >
                      {/* Seeker knob */}
                      <div className="cute-knob absolute right-0 top-1/2 w-4 h-4 rounded-full bg-white shadow-md border-2 border-pink-500 flex items-center justify-center"><Heart className="w-2.5 h-2.5 text-pink-500 fill-pink-500" /></div>
                    </div>
                  </div>

                  {/* Timestamp label indicators */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 select-none">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* CORE INTERACTIVE ACCESS SYSTEM */}
                <div className="flex items-center justify-between gap-2 bg-white/[0.02] border border-white/5 rounded-xl p-2 px-3">
                  {/* Shuffle button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isShuffle ? 'text-purple-400 bg-purple-950/20' : 'text-slate-400 hover:text-white'}`}
                    title="Shuffle Tracks"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                  </button>

                  {/* Prev */}
                  <button
                    onClick={(e) => { e.stopPropagation(); prevTrack(); }}
                    className="p-1 px-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title="Previous Track"
                  >
                    <SkipBack className="w-4 h-4 fill-current" />
                  </button>

                  {/* Play / Pause button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 scale-105 active:scale-95 text-white flex items-center justify-center shadow-xl transform transition-all cursor-pointer border border-purple-400/25"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-white text-white" /> : <Play className="w-4 h-4 fill-white text-white ml-0.5" />}
                  </button>

                  {/* Next */}
                  <button
                    onClick={(e) => { e.stopPropagation(); nextTrack(); }}
                    className="p-1 px-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title="Next Track"
                  >
                    <SkipForward className="w-4 h-4 fill-current" />
                  </button>

                  {/* Repeat button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleRepeat(); }}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer relative ${isRepeat !== 'none' ? 'text-purple-400 bg-purple-950/20' : 'text-slate-400 hover:text-white'}`}
                    title={`Repeat State: ${isRepeat}`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {isRepeat === 'one' && <span className="absolute bottom-1 right-1 text-[7px] font-mono font-bold bg-fuchsia-500 text-white rounded-full leading-none p-0.5">1</span>}
                  </button>
                </div>

                {/* INTEGRATED VOLUME CONTROL DECK */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                    className="p-1 text-slate-400 hover:text-purple-400 cursor-pointer"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    onPointerDownCapture={e => e.stopPropagation()}
                    className="w-full h-1 bg-white/10 accent-purple-500 rounded-lg appearance-none cursor-pointer hover:bg-white/15 transition-all"
                    title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                  />

                  <span className="text-[10px] font-mono text-slate-400 min-w-8 text-right select-none">
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mini custom transition slide styling sheets */}
      <style>{`
        @keyframes slide-down {
          0% {
            max-height: 0;
            opacity: 0;
            transform: scaleY(0.95);
          }
          100% {
            max-height: 300px;
            opacity: 1;
            transform: scaleY(1);
          }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </motion.div>

    {/* ============ Batch 104: FULL-SCREEN NOW PLAYING ============ */}
    {fsOpen && (
      <div className="fixed inset-0 z-[10004] overflow-hidden bg-[#070212]">
        {(currentTrack.coverUrl || currentAlbum?.coverUrl) && (
          <img
            src={currentTrack.coverUrl || currentAlbum?.coverUrl}
            alt=""
            aria-hidden
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover blur-3xl scale-125 opacity-35 pointer-events-none"
          />
        )}
        <div className="absolute inset-0 bg-black/55 pointer-events-none" />
        <div className="relative flex flex-col h-full max-w-xl w-full mx-auto px-6 py-5 gap-5">
          <div className="flex items-center justify-between shrink-0">
            <button
              onClick={() => setFsOpen(false)}
              className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Exit full screen"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-purple-300 uppercase">Now Playing</span>
            <button
              onClick={toggleFav}
              className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-pink-500/15 transition-all cursor-pointer"
              title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-pink-500 text-pink-500' : 'text-white'}`} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-5 min-h-0">
            <div className="relative w-60 h-60 sm:w-72 sm:h-72 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 shrink-0 bg-purple-950/30">
              {currentTrack.coverUrl || currentAlbum?.coverUrl ? (
                <img
                  src={currentTrack.coverUrl || currentAlbum?.coverUrl}
                  alt={currentTrack.title}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover ${isPlaying ? 'animate-[spin_24s_linear_infinite]' : ''}`}
                />
              ) : (
                <Music className="w-16 h-16 text-purple-400 absolute inset-0 m-auto" />
              )}
            </div>
            <div className="text-center min-w-0 w-full">
              <h3 className="text-2xl font-black text-white truncate">{currentTrack.title}</h3>
              <p className="text-sm text-purple-200/80 truncate mt-1">
                {currentTrack.artist || 'BTS'}{currentAlbum ? ` • ${currentAlbum.title}` : ''}
              </p>
              {playbackError && <p className="text-xs text-red-400 mt-2">⚠ {playbackError}</p>}
            </div>
          </div>

          {isSpotify ? (
            spotifyEmbedUrl && isPlaying ? (
              <div className="w-full h-[80px] rounded-xl overflow-hidden bg-black border border-purple-500/15 shrink-0">
                <iframe
                  src={spotifyEmbedUrl}
                  width="100%"
                  height="80"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="w-full h-full"
                  title={`Spotify Player - ${currentTrack.title}`}
                ></iframe>
              </div>
            ) : (
              <div className="w-full h-[80px] rounded-xl border border-dashed border-purple-500/20 bg-purple-950/10 flex flex-col items-center justify-center text-center p-3 shrink-0">
                <p className="text-xs text-purple-400 font-mono font-bold">Spotify Playback Stopped</p>
                <p className="text-[10px] text-slate-400 mt-1">Tap the Play button below to load Spotify stream</p>
              </div>
            )
          ) : (
            <div className="flex flex-col gap-1 shrink-0">
              <div
                onClick={handleProgressBarClick}
                className="h-3.5 w-full bg-white/[0.08] hover:bg-white/[0.14] rounded-full cursor-pointer relative group/slider transition-colors"
              >
                <div
                  className="cute-progress-fill h-full rounded-full relative transition-all duration-150"
                  style={{ width: `${playbackProgress}%` }}
                >
                  <div className="cute-knob absolute right-0 top-1/2 w-5 h-5 rounded-full bg-white shadow-md border-2 border-pink-500 flex items-center justify-center"><Heart className="w-3 h-3 text-pink-500 fill-pink-500" /></div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 select-none">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 shrink-0 px-1">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${isShuffle ? 'text-purple-300 bg-purple-500/20' : 'text-slate-300 hover:text-white'}`}
              title="Shuffle Tracks"
            >
              <Shuffle className="w-5 h-5" />
            </button>
            <button
              onClick={prevTrack}
              className="p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Previous Track"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 active:scale-95 text-white flex items-center justify-center shadow-2xl transition-all cursor-pointer border border-purple-400/25"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-7 h-7 fill-white text-white" /> : <Play className="w-7 h-7 fill-white text-white ml-1" />}
            </button>
            <button
              onClick={nextTrack}
              className="p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Next Track"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>
            <button
              onClick={toggleRepeat}
              className={`p-2 rounded-lg transition-colors cursor-pointer relative ${isRepeat !== 'none' ? 'text-purple-300 bg-purple-500/20' : 'text-slate-300 hover:text-white'}`}
              title={`Repeat State: ${isRepeat}`}
            >
              <RotateCcw className="w-5 h-5" />
              {isRepeat === 'one' && <span className="absolute bottom-0.5 right-0.5 text-[7px] font-mono font-bold bg-fuchsia-500 text-white rounded-full leading-none p-0.5">1</span>}
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={toggleMute}
              className="p-1 text-slate-300 hover:text-purple-300 cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-white/10 accent-purple-500 rounded-lg appearance-none cursor-pointer"
              title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
            <span className="text-[10px] font-mono text-slate-300 min-w-8 text-right select-none">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
            {currentTrack.lyrics && currentTrack.lyrics.trim() !== '' && (
              <button
                onClick={() => { setFsOpen(false); openLyrics(currentTrack); }}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-purple-200 hover:text-white hover:bg-purple-500/20 border border-purple-500/25 transition-all cursor-pointer shrink-0"
                title="View lyrics"
              >
                <FileText className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wide">Lyrics</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
