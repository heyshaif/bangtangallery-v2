import React, { useState, useEffect, useRef } from 'react';
import AdsterraAd from './AdsterraAd';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Download, Send, Share2,
  Calendar, MapPin, Sparkles, ArrowLeft, ArrowRight, Check, Copy, Film, ExternalLink,
  ShieldCheck, AlertCircle
} from 'lucide-react';
import { ConcertReplay } from '../types';
import { DEFAULT_CONCERTS } from '../data/btsData';
import { resolvePlayableMediaUrl } from '../utils/mediaStore';
import { parseTelegramPost } from '../utils/telegramEmbed';
import TelegramPostEmbed from './TelegramPostEmbed';
import TourSetlists, { TourSetlistEntry } from './TourSetlists';

interface RecentConcertReplayProps {
  concerts?: ConcertReplay[];
  /** Batch 90: tour setlist boxes, rendered after the bottom ad. */
  setlists?: TourSetlistEntry[];
  initialSlug?: string | null;
  onSelectConcert?: (concert: ConcertReplay | null) => void;
  /** When true the section is a standalone nav page (no top rule/offset). */
  standalone?: boolean;
  /**
   * When true (used inside the Videos page), NO concert cards render at
   * all — the block is only a single "WATCH CONCERT REPLY" button that
   * takes the visitor to the Concert page, where the concerts play.
   */
  linkMode?: boolean;
}

export default function RecentConcertReplay({
  concerts,
  setlists,
  initialSlug,
  onSelectConcert,
  standalone = false,
  linkMode = false
}: RecentConcertReplayProps) {
  const displayConcerts: ConcertReplay[] = (concerts && concerts.length > 0)
    ? concerts.filter(c => c.published !== false)
    : DEFAULT_CONCERTS;

  // Concert page filter tabs (Batch 90): All / Concert / Weverse /
  // Others. A replay's group comes from its category, location and
  // title (Weverse wins first, then anything concert-like, and
  // everything else falls into Others).
  const [concertFilter, setConcertFilter] = useState<'all' | 'concert' | 'weverse' | 'others'>('all');
  const concertGroupOf = (c: ConcertReplay): 'concert' | 'weverse' | 'others' => {
    const hay = `${c.category || ''} ${c.location || ''} ${c.title || ''}`.toLowerCase();
    if (hay.includes('weverse')) return 'weverse';
    if (hay.includes('concert')) return 'concert';
    return 'others';
  };
  const groupCounts = {
    all: displayConcerts.length,
    concert: displayConcerts.filter((c) => concertGroupOf(c) === 'concert').length,
    weverse: displayConcerts.filter((c) => concertGroupOf(c) === 'weverse').length,
    others: displayConcerts.filter((c) => concertGroupOf(c) === 'others').length
  };
  const visibleConcerts = concertFilter === 'all'
    ? displayConcerts
    : displayConcerts.filter((c) => concertGroupOf(c) === concertFilter);

  const [selectedConcert, setSelectedConcert] = useState<ConcertReplay | null>(() => {
    if (initialSlug) {
      const match = displayConcerts.find(c => c.slug === initialSlug || c.id === initialSlug);
      return match || null;
    }
    return null;
  });

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [playableVideoUrl, setPlayableVideoUrl] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerBoxRef = useRef<HTMLDivElement>(null);

  // Sync when initialSlug changes
  useEffect(() => {
    if (initialSlug) {
      const match = displayConcerts.find(c => c.slug === initialSlug || c.id === initialSlug);
      if (match) setSelectedConcert(match);
    }
  }, [initialSlug, displayConcerts]);

  // Resolve playable video URL (blob URLs, mediaStore IDs, R2 streams)
  useEffect(() => {
    let isCancelled = false;
    if (selectedConcert?.videoUrl) {
      resolvePlayableMediaUrl(selectedConcert.videoUrl).then((resolved) => {
        if (!isCancelled) {
          setPlayableVideoUrl(resolved || selectedConcert.videoUrl);
        }
      });
    } else {
      setPlayableVideoUrl('');
    }
    return () => {
      isCancelled = true;
    };
  }, [selectedConcert]);

  // Telegram post links play through Telegram's official embed widget
  // (the only supported way to play a Telegram-hosted video in-page).
  const telegramPost = parseTelegramPost(playableVideoUrl || selectedConcert?.videoUrl || '');

  // Videos-page mode: one button leads to the dedicated Concert page
  // (App's routing listens for popstate, so pushing the path + dispatching
  // the event switches the tab).
  const goToConcertPage = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/arirang_concert_reply');
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // When a concert is opened, update URL hash or history state for shareability & SEO
  const handleOpenConcert = (concert: ConcertReplay) => {
    if (linkMode) {
      goToConcertPage();
      return;
    }
    setSelectedConcert(concert);
    if (onSelectConcert) onSelectConcert(concert);
    if (typeof window !== 'undefined') {
      window.history.pushState({ replaySlug: concert.slug }, '', `#/replay/${concert.slug}`);
      document.title = concert.seoTitle || `${concert.title} - Concert Replay | BANGTAN GALLERY`;
    }
  };

  const handleClosePlayer = () => {
    setSelectedConcert(null);
    if (onSelectConcert) onSelectConcert(null);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', window.location.pathname);
      document.title = 'BANGTAN GALLERY - BTS Live Lounge & Concert Replays';
    }
  };

  const toggleFullscreen = () => {
    if (!playerBoxRef.current) return;
    if (!document.fullscreenElement) {
      playerBoxRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleCopyShareLink = (concert: ConcertReplay) => {
    const shareUrl = `${window.location.origin}/#/replay/${concert.slug}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }).catch(() => {});
  };

  // Resolve a stored video URL to a real embed src. The player used
  // to inject an <iframe> string through dangerouslySetInnerHTML,
  // which left the player box BLACK for admin-added YouTube links
  // (the injected frame never painted). A real React iframe — the
  // same pattern the Live Stream player uses — always loads.
  const resolveEmbedSrc = (url: string): string => {
    if (!url) return '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let vidId = '';
      if (url.includes('youtu.be/')) {
        vidId = url.split('youtu.be/')[1].split(/[?&]/)[0];
      } else if (url.includes('watch?v=')) {
        vidId = url.split('watch?v=')[1].split('&')[0];
      } else if (url.includes('embed/')) {
        vidId = url.split('embed/')[1].split('?')[0];
      } else if (url.includes('shorts/')) {
        vidId = url.split('shorts/')[1].split('?')[0];
      } else if (url.includes('live/')) {
        vidId = url.split('live/')[1].split('?')[0];
      }
      if (vidId) return `https://www.youtube.com/embed/${vidId}?autoplay=1&rel=0&modestbranding=1`;
      return '';
    }
    if (url.includes('vimeo.com')) {
      const m = url.match(/vimeo\.com\/(\d+)/);
      if (m) return `https://player.vimeo.com/video/${m[1]}?autoplay=1`;
    }
    // VdoCipher or other ready-made player URLs pass through as-is.
    if (url.includes('vdocipher.com') || url.includes('player.')) {
      return url;
    }
    return '';
  };

  // Videos-page mode: NO concert cards here at all (owner: "card shoriye
  // shudu button") — just the one button that opens the Concert page.
  if (linkMode) {
    return (
      <section className="w-full mt-1 pt-1 font-sans animate-fade-in flex justify-center">
        <button
          type="button"
          onClick={goToConcertPage}
          className="w-full sm:w-auto sm:min-w-[320px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-mono text-xs sm:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition-all cursor-pointer hover:scale-[1.01] active:scale-95"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Watch Concert Reply</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    );
  }

  return (
    <section className={standalone
      ? "w-full font-sans animate-fade-in"
      : "w-full mt-12 pt-10 border-t border-purple-500/15 font-sans animate-fade-in"}>
      
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-purple-400 font-bold">
              Exclusive Stage Archive
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight font-sans">
            RECENT LIVE
          </h2>
          <p className="text-xs sm:text-sm text-purple-300/80 font-sans mt-1">
            Relive your favorite BTS concert moments.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-end">
          <span className="px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/20 text-[10px] font-mono text-purple-300 font-bold flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-purple-400" />
            <span>{displayConcerts.length} Full Concerts Available</span>
          </span>
        </div>
      </div>

      {/* Filter tabs (Batch 90) — Concert page only (standalone):
          All / Concert / Weverse / Others, each with its count. */}
      {standalone && (
        <div className="flex flex-wrap gap-2 -mt-3 mb-8">
          {([
            ['all', 'All'],
            ['concert', 'Concert'],
            ['weverse', 'Weverse'],
            ['others', 'Others']
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setConcertFilter(key)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                concertFilter === key
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-lg shadow-purple-500/25'
                  : 'bg-black/40 text-gray-300 border-white/10 hover:border-purple-400/40 hover:text-white'
              }`}
            >
              {label} <span className="opacity-75 font-mono">({groupCounts[key]})</span>
            </button>
          ))}
        </div>
      )}

      {/* INDIVIDUAL CONCERT PLAYER VIEW (MODAL / INLINE THEATER) */}
      <AnimatePresence>
        {selectedConcert && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-12 rounded-3xl border border-purple-500/30 bg-[#0c0418]/95 backdrop-blur-2xl p-5 sm:p-7 shadow-2xl relative overflow-hidden"
          >
            {/* Top Navigation & Close */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-purple-500/15">
              <button
                type="button"
                onClick={handleClosePlayer}
                className="px-3.5 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/25 text-xs text-purple-200 font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> &larr; Back to Concert List
              </button>

              <div className="flex items-center gap-2">
                {selectedConcert.videoQuality && (
                  <span className="px-2.5 py-1 rounded-md bg-purple-600/30 border border-purple-400/40 text-purple-300 text-[10px] font-mono font-extrabold uppercase">
                    {selectedConcert.videoQuality} Quality
                  </span>
                )}
                {selectedConcert.partNumber && (
                  <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[10px] font-mono">
                    {selectedConcert.partNumber}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleCopyShareLink(selectedConcert)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Copy shareable link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">{copiedLink ? 'Link Copied!' : 'Share'}</span>
                </button>
              </div>
            </div>

            {/* Video Player Box */}
            <div
              ref={playerBoxRef}
              className={`relative ${telegramPost ? '' : 'aspect-video'} rounded-2xl bg-black border border-purple-500/20 overflow-hidden shadow-2xl group/theatre mb-6`}
            >
              {(() => {
                const targetUrl = playableVideoUrl || selectedConcert.videoUrl;
                if (telegramPost) {
                  return (
                    <TelegramPostEmbed
                      channel={telegramPost.channel}
                      postId={telegramPost.postId}
                      originalUrl={targetUrl}
                    />
                  );
                }
                const embedSrc = resolveEmbedSrc(targetUrl);
                if (embedSrc) {
                  return (
                    <iframe
                      key={embedSrc}
                      src={embedSrc}
                      title={selectedConcert.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                      className="w-full h-full absolute inset-0 border-0"
                    />
                  );
                }

                const isDirectStream = targetUrl.startsWith('blob:') ||
                  targetUrl.startsWith('data:') ||
                  targetUrl.includes('/api/media/serve/') ||
                  /\.(mp4|webm|mov|m4v|ogg)(?:\?.*)?$/i.test(targetUrl) ||
                  (!targetUrl.includes('youtube.com') && !targetUrl.includes('youtu.be') && !targetUrl.includes('vdocipher.com'));

                if (isDirectStream) {
                  return (
                    <video
                      ref={videoRef}
                      src={targetUrl}
                      poster={selectedConcert.videoPosterUrl || selectedConcert.coverUrl}
                      controls
                      playsInline
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  );
                }

                return (
                  <iframe
                    src={targetUrl}
                    title={selectedConcert.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="w-full h-full absolute inset-0 border-0"
                  />
                );
              })()}
            </div>

            {/* Concert Details & Actions */}
            <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-xs text-purple-300 font-mono">
                  {selectedConcert.location && (
                    <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                      <MapPin className="w-3 h-3 text-rose-400" /> {selectedConcert.location}
                    </span>
                  )}
                  {selectedConcert.date && (
                    <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                      <Calendar className="w-3 h-3 text-purple-400" /> {selectedConcert.date}
                    </span>
                  )}
                  {selectedConcert.category && (
                    <span className="bg-purple-950/40 text-purple-300 px-2.5 py-1 rounded-md border border-purple-500/20">
                      {selectedConcert.category}
                    </span>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                  {selectedConcert.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {selectedConcert.fullDescription || selectedConcert.shortDescription}
                </p>

                {selectedConcert.tags && selectedConcert.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {selectedConcert.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-950/30 border border-purple-500/15 text-purple-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons: DOWNLOAD TO TELEGRAM & Social Sharing */}
              <div className="flex flex-col gap-3 w-full lg:w-auto shrink-0 font-sans">
                {selectedConcert.downloadEnabled !== false && selectedConcert.telegramDownloadUrl && (
                  <a
                    href={selectedConcert.telegramDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full lg:min-w-[220px] px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer text-center"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>{selectedConcert.downloadText || 'DOWNLOAD'} (TELEGRAM)</span>
                    <Send className="w-3.5 h-3.5 -rotate-12 shrink-0 opacity-80" />
                  </a>
                )}

                {/* Social Share Toolbar */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold text-center">
                    Share Concert Replay
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    {/* Share to X */}
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Watching BTS ${selectedConcert.title} Concert Replay! 💜 #BTS #ARMY`)}&url=${encodeURIComponent(`${window.location.origin}/#/replay/${selectedConcert.slug}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-sky-950/40 border border-white/5 hover:border-sky-500/30 text-slate-300 hover:text-sky-400 text-[10px] font-mono transition-all"
                      title="Share to X (Twitter)"
                    >
                      X (Twitter)
                    </a>
                    {/* Share to Telegram */}
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/#/replay/${selectedConcert.slug}`)}&text=${encodeURIComponent(`BTS ${selectedConcert.title} Concert Replay 💜`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-cyan-950/40 border border-white/5 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-400 text-[10px] font-mono transition-all"
                      title="Share to Telegram"
                    >
                      Telegram
                    </a>
                    {/* Share to WhatsApp */}
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`BTS ${selectedConcert.title} Concert Replay: ${window.location.origin}/#/replay/${selectedConcert.slug}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-950/40 border border-white/5 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 text-[10px] font-mono transition-all"
                      title="Share to WhatsApp"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* CONCERT CARDS GRID - 2 col mobile, 3 col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {visibleConcerts.map((concert) => (
          <div
            key={concert.id}
            onClick={linkMode ? goToConcertPage : undefined}
            className={`group rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0a0314]/90 hover:border-purple-500/40 backdrop-blur-xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-[0_12px_35px_rgba(168,85,247,0.2)] hover:-translate-y-1 ${linkMode ? 'cursor-pointer' : ''}`}
          >
            {/* Top Cover Image Area */}
            <div className="relative aspect-[16/10] overflow-hidden bg-black/60">
              <img
                src={concert.coverUrl}
                alt={concert.coverAltText || concert.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0314] via-transparent to-black/30" />

              {/* Quality & Part badges */}
              <div className="absolute top-2 left-2 sm:top-3.5 sm:left-3.5 flex items-center gap-1 sm:gap-1.5 z-10">
                {concert.videoQuality && (
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-purple-600/90 text-white font-mono font-extrabold text-[8px] sm:text-[9px] uppercase tracking-wider shadow-md">
                    {concert.videoQuality}
                  </span>
                )}
                {concert.partNumber && (
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-slate-200 font-mono text-[8px] sm:text-[9px]">
                    {concert.partNumber}
                  </span>
                )}
              </div>

              {concert.isFeatured && (
                <div className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 z-10">
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-500/90 text-black font-mono font-black text-[8px] sm:text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Sparkles className="w-2.5 h-2.5" /> Featured
                  </span>
                </div>
              )}
            </div>

            {/* Concert Content Details */}
            <div className="p-3 sm:p-6 flex-grow flex flex-col justify-between space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] sm:text-[10px] font-mono text-purple-400">
                  {concert.location && (
                    <span className="flex items-center gap-1 min-w-0">
                      <MapPin className="w-3 h-3 text-rose-400 shrink-0" /> <span className="truncate">{concert.location}</span>
                    </span>
                  )}
                  {concert.date && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span>{concert.date}</span>
                    </>
                  )}
                </div>

                <h3 className="text-[13px] leading-snug sm:text-lg font-black text-white uppercase tracking-tight line-clamp-2 group-hover:text-purple-300 transition-colors">
                  {concert.title}
                </h3>

                <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-2 sm:line-clamp-3 leading-relaxed font-sans">
                  {concert.shortDescription}
                </p>
              </div>

              {/* Action Buttons: WATCH NOW and DOWNLOAD (hidden in linkMode —
                  the Videos page shows one shared button under the grid) */}
              {!linkMode && (
              <div className="pt-2 sm:pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5">
                {concert.watchNowEnabled !== false && (
                  <button
                    type="button"
                    onClick={() => handleOpenConcert(concert)}
                    className="w-full sm:flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{concert.watchNowText || 'WATCH NOW'}</span>
                  </button>
                )}

                {concert.downloadEnabled !== false && concert.telegramDownloadUrl && (
                  <a
                    href={concert.telegramDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-white/5 hover:bg-cyan-950/40 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
                    title={`Download ${concert.title} via Telegram`}
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{concert.downloadText || 'DOWNLOAD'}</span>
                    <Send className="w-3 h-3 text-cyan-400 -rotate-12" />
                  </a>
                )}
              </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {standalone && visibleConcerts.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-8">No replays in this group yet 💜</p>
      )}

      {/* Small ad at the very bottom of the Concert page (owner
          request) — the compact 320x50 banner from the site's
          existing ad codes, deliberately NOT a big format. */}
      <div className="mt-10 flex justify-center">
        <AdsterraAd type={7} />
      </div>

      {/* Tour setlists & surprise songs (Batch 90) — AFTER the ad,
          per the owner's placement. Only on the standalone
          Concert page, not in the Videos-page link block. */}
      {standalone && <TourSetlists items={setlists} />}

    </section>
  );
}
