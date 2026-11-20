/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud, Music, Video, Play, Pause, Volume2, VolumeX,
  Trash2, RefreshCw, CheckCircle2, AlertTriangle, Film, Sparkles,
  ExternalLink, Disc, Sliders, Check, FileAudio, FileVideo, RotateCcw
} from 'lucide-react';
import {
  uploadAudioWithProgress,
  uploadVideoWithProgress,
  extractAudioMetadata,
  extractVideoMetadata,
  formatFileSize,
  formatDuration,
  resolvePlayableMediaUrl,
  UploadProgress
} from '../utils/mediaStore';
import { getYoutubeEmbedUrl, getYoutubeVideoId } from './youtubeUtils';
import { parseTelegramPost, isTelegramPostUrl } from '../utils/telegramEmbed';
import TelegramPostEmbed from './TelegramPostEmbed';

// -------------------------------------------------------------
// 1. ADMIN AUDIO UPLOAD & LIVE PREVIEW PLAYER (MUSIC MANAGEMENT)
// -------------------------------------------------------------

export interface AdminAudioUploadManagerProps {
  audioUrl: string;
  duration?: string;
  filename?: string;
  fileSize?: string;
  coverUrl?: string;
  spotifyUrl?: string;
  title?: string;
  artist?: string;
  onAudioChange: (data: {
    audioUrl: string;
    duration: string;
    filename?: string;
    fileSize?: string;
  }) => void;
  onCoverChange?: (coverUrl: string) => void;
  onSpotifyChange?: (url: string) => void;
  showToast?: (msg: string, type: 'info' | 'success' | 'error') => void;
}

export function AdminAudioUploadManager({
  audioUrl,
  duration,
  filename,
  fileSize,
  coverUrl,
  spotifyUrl,
  title,
  artist,
  onAudioChange,
  onCoverChange,
  onSpotifyChange,
  showToast
}: AdminAudioUploadManagerProps) {
  const [playableUrl, setPlayableUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [loadedDuration, setLoadedDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasPlaybackError, setHasPlaybackError] = useState<boolean>(false);
  const [audioLoadedSuccessfully, setAudioLoadedSuccessfully] = useState<boolean>(false);

  // Upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [currentFilename, setCurrentFilename] = useState<string>(filename || '');
  const [currentFileSize, setCurrentFileSize] = useState<string>(fileSize || '');

  // Cover upload state
  const [isUploadingCover, setIsUploadingCover] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Parse existing duration string into seconds (e.g. "3:45" -> 225)
  const parseDurationStringToSec = (durStr?: string): number => {
    if (!durStr) return 0;
    const parts = durStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    if (parts.length === 3) {
      return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
    }
    return 0;
  };

  // Resolve playable URL when audioUrl prop changes
  useEffect(() => {
    let isCancelled = false;
    setHasPlaybackError(false);
    setAudioLoadedSuccessfully(false);
    setIsPlaying(false);
    setCurrentTime(0);

    if (!audioUrl) {
      setPlayableUrl('');
      setLoadedDuration(0);
      return;
    }

    resolvePlayableMediaUrl(audioUrl).then((resolved) => {
      if (isCancelled) return;
      const finalUrl = resolved || audioUrl;
      setPlayableUrl(finalUrl);

      // Guess filename from URL if not provided
      if (!currentFilename) {
        const parts = audioUrl.split('/');
        const lastPart = parts[parts.length - 1] || 'audio_track.mp3';
        setCurrentFilename(lastPart.replace(/%20/g, ' '));
      }

      // Initialize initial duration fallback from prop
      if (duration && !loadedDuration) {
        setLoadedDuration(parseDurationStringToSec(duration));
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [audioUrl]);

  // Audio element listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        setLoadedDuration(audio.duration);
      }
    };

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        setLoadedDuration(audio.duration);
        setHasPlaybackError(false);
        setAudioLoadedSuccessfully(true);

        const newFormattedDuration = formatDuration(audio.duration);
        if (newFormattedDuration !== duration) {
          onAudioChange({
            audioUrl: audioUrl,
            duration: newFormattedDuration,
            filename: currentFilename,
            fileSize: currentFileSize
          });
        }
      }
    };

    const onCanPlay = () => {
      setHasPlaybackError(false);
      setAudioLoadedSuccessfully(true);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onError = () => {
      // If error occurs, check if it's a typed local path like /audio/...
      setIsPlaying(false);
      setHasPlaybackError(true);
      setAudioLoadedSuccessfully(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [audioUrl, currentFilename, currentFileSize, duration]);

  // Play / Pause toggle
  const togglePlay = () => {
    if (!audioRef.current || !playableUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setHasPlaybackError(false);
      }).catch((err) => {
        console.warn('Playback play failed:', err);
        setIsPlaying(false);
        setHasPlaybackError(true);
        showToast?.('Unable to play audio. The file might be missing or corrupt.', 'error');
      });
    }
  };

  // Seek handler
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetSec = parseFloat(e.target.value);
    setCurrentTime(targetSec);
    if (audioRef.current) {
      audioRef.current.currentTime = targetSec;
    }
  };

  // Volume slider handler
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current.muted = nextMuted;
  };

  // Handle actual audio file upload
  const handleFileSelected = async (file: File) => {
    if (!file) return;

    // Validate format
    const validExtensions = /\.(mp3|wav|m4a|aac|flac|ogg)$/i;
    const isAudioType = file.type.startsWith('audio/') || validExtensions.test(file.name);

    if (!isAudioType) {
      showToast?.('Invalid file type! Please select an MP3, WAV, M4A, AAC, or FLAC audio file.', 'error');
      return;
    }

    setIsUploading(true);
    setHasPlaybackError(false);
    setCurrentFilename(file.name);
    setCurrentFileSize(formatFileSize(file.size));

    try {
      showToast?.(`Reading & uploading "${file.name}"... 🎵`, 'info');

      const result = await uploadAudioWithProgress(file, (p) => {
        setUploadProgress(p);
      });

      // Update parent data
      onAudioChange({
        audioUrl: result.url,
        duration: result.formattedDuration,
        filename: result.filename,
        fileSize: result.formattedSize
      });

      setPlayableUrl(result.url);
      setLoadedDuration(result.duration);
      setAudioLoadedSuccessfully(true);
      showToast?.(`"${file.name}" uploaded successfully! Real duration: ${result.formattedDuration} 🎧`, 'success');
    } catch (err: any) {
      console.error('Audio upload error:', err);
      showToast?.(`Audio upload failed: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(null), 3000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove audio
  const handleRemoveAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setLoadedDuration(0);
    setPlayableUrl('');
    setCurrentFilename('');
    setCurrentFileSize('');
    setHasPlaybackError(false);
    setAudioLoadedSuccessfully(false);

    onAudioChange({
      audioUrl: '',
      duration: '0:00',
      filename: '',
      fileSize: ''
    });

    showToast?.('Audio track removed.', 'info');
  };

  // Cover image upload
  const handleCoverSelected = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast?.('Please upload an image file (PNG, JPG, WEBP).', 'error');
      return;
    }

    setIsUploadingCover(true);
    showToast?.('Uploading cover artwork... 🖼️', 'info');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        try {
          const res = await fetch('/api/admin/media/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              base64,
              category: 'Image'
            })
          });

          if (res.ok) {
            const data = await res.json();
            const newCover = data.url || base64;
            onCoverChange?.(newCover);
            showToast?.('Cover image updated! ✨', 'success');
          } else {
            // Local fallback
            onCoverChange?.(base64);
            showToast?.('Cover image saved locally! ✨', 'success');
          }
        } catch {
          onCoverChange?.(base64);
          showToast?.('Cover image saved locally! ✨', 'success');
        } finally {
          setIsUploadingCover(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingCover(false);
      showToast?.('Failed reading cover image file.', 'error');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const effectiveDuration = loadedDuration || parseDurationStringToSec(duration) || 0;
  const isSuspiciousLocalPath = audioUrl?.startsWith('/audio/') && !audioLoadedSuccessfully && !isUploading;

  return (
    <div className="space-y-4">
      {/* Hidden audio element for actual preview playback */}
      {playableUrl && (
        <audio
          ref={audioRef}
          src={playableUrl}
          preload="metadata"
        />
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3,audio/mpeg,audio/wav,audio/x-wav,audio/m4a,audio/x-m4a,audio/aac,audio/flac,audio/ogg"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
        }}
        className="hidden"
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) handleCoverSelected(e.target.files[0]);
        }}
        className="hidden"
      />

      {/* SECTION 1: COVER ARTWORK & TRACK IDENTITY */}
      <div className="p-4 border border-purple-500/15 rounded-2xl bg-purple-950/20 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>🖼️</span> Track Cover Artwork & Visuals
          </span>
          {coverUrl && (
            <span className="text-[10px] text-cyan-300 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Cover Linked
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Cover Preview Box */}
          <div className="relative w-24 h-24 rounded-xl bg-black/60 border border-purple-500/20 overflow-hidden shrink-0 flex items-center justify-center group shadow-lg">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt="Track Cover Preview"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="text-center p-2 text-slate-500">
                <Music className="w-6 h-6 mx-auto mb-1 opacity-40 text-purple-400" />
                <span className="text-[9px] font-mono block">No Cover</span>
              </div>
            )}
            {isUploadingCover && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Cover Controls */}
          <div className="flex-grow space-y-2 w-full">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono block">Cover Image URL</label>
              <input
                type="text"
                value={coverUrl || ''}
                onChange={(e) => onCoverChange?.(e.target.value)}
                placeholder="Paste direct image URL or upload from device..."
                className="w-full px-3 py-1.5 bg-[#090515] border border-purple-500/20 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploadingCover}
                className="px-3 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-500/30 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer select-none"
              >
                <UploadCloud className="w-3.5 h-3.5 text-cyan-300" />
                <span>Upload Cover Image</span>
              </button>
              {coverUrl && (
                <button
                  type="button"
                  onClick={() => onCoverChange?.('')}
                  className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/20 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                >
                  Clear Cover
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: AUDIO UPLOAD & DRAG/DROP ZONE */}
      <div className="p-4 border border-purple-500/20 rounded-2xl bg-purple-950/25 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
            <Music className="w-4 h-4 text-pink-400" />
            Audio File Upload & Storage (MP3, WAV, M4A, AAC, FLAC)
          </span>
          {audioUrl && (
            <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Audio Ready
            </span>
          )}
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-pink-400 bg-pink-950/30 scale-[1.01]'
              : 'border-purple-500/30 hover:border-pink-500/50 bg-black/40 hover:bg-black/60'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-pink-950/50 border border-pink-500/30 flex items-center justify-center text-pink-300 group-hover:scale-110 transition-transform">
              {isUploading ? (
                <RefreshCw className="w-6 h-6 animate-spin text-pink-400" />
              ) : (
                <UploadCloud className="w-6 h-6 text-pink-400" />
              )}
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-white">
                {isUploading ? 'Uploading & Processing Audio...' : 'Click to Browse or Drag & Drop Audio File'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Supports actual <strong className="text-pink-300">.mp3, .wav, .m4a, .aac, .flac</strong> files from your device
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Upload Progress Bar */}
        {uploadProgress && (
          <div className="p-3 bg-black/60 border border-purple-500/25 rounded-xl space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-purple-300 flex items-center gap-1.5 font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-400" />
                {uploadProgress.status}
              </span>
              <span className="text-pink-400 font-bold">{uploadProgress.progress}%</span>
            </div>

            {/* Progress line */}
            <div className="w-full h-2 rounded-full bg-purple-950/50 overflow-hidden border border-purple-500/20">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>

            {/* Transfer Stats (Size, Speed, ETA) */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 pt-0.5">
              <span>Transferred: <strong className="text-white">{formatFileSize(uploadProgress.loadedBytes)}</strong> / {formatFileSize(uploadProgress.totalBytes)}</span>
              <span>Speed: <strong className="text-cyan-300">{uploadProgress.speedFormatted}</strong></span>
              <span>ETA: <strong className="text-purple-300">{uploadProgress.etaFormatted}</strong></span>
            </div>
          </div>
        )}

        {/* Suspicious local path warning (e.g. /audio/2.0_Official_MV.mp3 where file doesn't exist on disk) */}
        {isSuspiciousLocalPath && (
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-mono font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Unverified Audio Path Detected</span>
            </div>
            <p className="text-[11px] text-amber-200/80 leading-relaxed font-sans">
              The path <code className="px-1.5 py-0.5 bg-black/50 rounded text-amber-300 font-mono">{audioUrl}</code> cannot be resolved from storage (duration shows 0:00 / 0:00). Please click <strong>Browse Audio</strong> above to select and upload the actual MP3/WAV file from your device.
            </p>
          </div>
        )}

        {/* Uploaded File Info Card & Replace/Remove Controls */}
        {audioUrl && (
          <div className="p-3 bg-black/60 border border-purple-500/20 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-pink-950/60 border border-pink-500/25 flex items-center justify-center shrink-0">
                <FileAudio className="w-4.5 h-4.5 text-pink-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-mono font-bold text-white truncate max-w-xs sm:max-w-md">
                  {currentFilename || 'Uploaded Audio Track'}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  {currentFileSize && <span>Size: <strong className="text-slate-300">{currentFileSize}</strong></span>}
                  <span>Duration: <strong className="text-pink-300">{duration || formatDuration(effectiveDuration)}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/30 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer select-none"
                title="Replace with another audio file"
              >
                <RotateCcw className="w-3 h-3 text-purple-300" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={handleRemoveAudio}
                className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-500/30 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer select-none"
                title="Remove audio track"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        )}

        {/* Direct Audio URL/Path manual input */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-mono block">
            Direct Audio URL / Cloudflare Storage Stream Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={audioUrl || ''}
              onChange={(e) => {
                onAudioChange({
                  audioUrl: e.target.value,
                  duration: duration || '0:00',
                  filename: currentFilename,
                  fileSize: currentFileSize
                });
              }}
              placeholder="e.g. https://.../song.mp3 or r2://..."
              className="flex-grow px-3 py-1.5 bg-[#090515] border border-purple-500/20 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-pink-400"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-pink-900/60 hover:bg-pink-800 text-pink-200 border border-pink-500/30 rounded-lg text-xs font-mono flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Browse...</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: REAL AUDIO PREVIEW PLAYER WITH SEEK, DURATION & VOLUME */}
      {audioUrl && (
        <div className="p-4 border border-pink-500/25 rounded-2xl bg-gradient-to-b from-purple-950/30 to-black/60 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-pink-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              Live Audio Preview Player
            </span>
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
              {isPlaying && (
                <div className="flex items-end gap-0.5 h-3 mr-2">
                  <span className="w-0.5 h-full bg-pink-400 animate-bounce" />
                  <span className="w-0.5 h-2 bg-purple-400 animate-bounce delay-75" />
                  <span className="w-0.5 h-3 bg-cyan-400 animate-bounce delay-150" />
                </div>
              )}
              <span>{hasPlaybackError ? '⚠️ Error Loading Source' : (audioLoadedSuccessfully ? '✓ Ready to Play' : 'Loading Audio Metadata...')}</span>
            </div>
          </div>

          {/* Player controls row */}
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              disabled={!playableUrl || hasPlaybackError}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-lg ${
                hasPlaybackError
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-pink-600/30 hover:scale-105 active:scale-95'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            {/* Time / Duration & Scrubber Slider */}
            <div className="flex-grow space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-pink-300 font-bold">{formatDuration(currentTime)}</span>
                <span className="text-slate-400">
                  {effectiveDuration > 0 ? formatDuration(effectiveDuration) : (duration || '0:00')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={effectiveDuration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                disabled={!effectiveDuration || hasPlaybackError}
                className="w-full h-1.5 bg-purple-950/60 rounded-lg appearance-none cursor-pointer accent-pink-500 focus:outline-none"
              />
            </div>

            {/* Volume & Mute Controls */}
            <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-purple-500/20">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-purple-300" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-purple-950/60 rounded appearance-none cursor-pointer accent-purple-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: SPOTIFY EMBED LINK */}
      <div className="space-y-1.5 pt-1">
        <label className="text-xs text-purple-300 font-mono font-bold block uppercase flex items-center justify-between">
          <span>Spotify Track / Album Embed Link</span>
          {spotifyUrl && <span className="text-[10px] text-emerald-400 font-mono">✓ Spotify Linked</span>}
        </label>
        <input
          type="text"
          value={spotifyUrl || ''}
          onChange={(e) => onSpotifyChange?.(e.target.value)}
          placeholder="e.g. https://open.spotify.com/track/4sakGGkY36Q9aDsmV5q5vS"
          className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-green-500"
        />
        {spotifyUrl && (
          <p className="text-[10px] text-slate-400 font-mono">
            Users who prefer Spotify will see the interactive streaming widget alongside your uploaded track.
          </p>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. ADMIN CONCERT REPLAY VIDEO MANAGER (OPTION A & OPTION B)
// -------------------------------------------------------------

export interface AdminConcertVideoManagerProps {
  videoUrl: string;
  coverUrl?: string;
  videoPosterUrl?: string;
  videoQuality?: string;
  duration?: string;
  fileSize?: string;
  title?: string;
  published?: boolean;
  onVideoChange: (data: {
    videoUrl: string;
    coverUrl?: string;
    videoPosterUrl?: string;
    videoQuality?: string;
    duration?: string;
    fileSize?: string;
    title?: string;
  }) => void;
  onPublishToggle?: (published: boolean) => void;
  showToast?: (msg: string, type: 'info' | 'success' | 'error') => void;
}

export function AdminConcertVideoManager({
  videoUrl,
  coverUrl,
  videoPosterUrl,
  videoQuality = '1080p',
  duration,
  fileSize,
  title,
  published = true,
  onVideoChange,
  onPublishToggle,
  showToast
}: AdminConcertVideoManagerProps) {
  // Mode selection: 'file' (Option A: Direct Video Upload up to 2-3 GB) vs 'youtube' (Option B: YouTube Embed)
  const isInitiallyYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be') || isTelegramPostUrl(videoUrl);
  const telegramPost = parseTelegramPost(videoUrl);
  const [uploadMode, setUploadMode] = useState<'file' | 'youtube'>(isInitiallyYouTube ? 'youtube' : 'file');

  // Video playback & preview state
  const [playableVideoUrl, setPlayableVideoUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [loadedDuration, setLoadedDuration] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // High-capacity upload progress state (supporting up to 2-3 GB)
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);

  // Poster frame preview
  const [posterPreview, setPosterPreview] = useState<string>(videoPosterUrl || coverUrl || '');

  // YouTube embed state
  const [ytInputUrl, setYtInputUrl] = useState<string>(isInitiallyYouTube ? videoUrl : '');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync playable video URL
  useEffect(() => {
    let isCancelled = false;

    if (!videoUrl) {
      setPlayableVideoUrl('');
      return;
    }

    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      setPlayableVideoUrl(videoUrl);
      setUploadMode('youtube');
      return;
    }

    resolvePlayableMediaUrl(videoUrl).then((resolved) => {
      if (isCancelled) return;
      setPlayableVideoUrl(resolved || videoUrl);
    });

    return () => {
      isCancelled = true;
    };
  }, [videoUrl]);

  // Handle direct video upload (Option A, supports 2-3 GB)
  const handleVideoFileSelected = async (file: File) => {
    if (!file) return;

    const validVideoExts = /\.(mp4|webm|mov|m4v|mkv)$/i;
    const isVideo = file.type.startsWith('video/') || validVideoExts.test(file.name);

    if (!isVideo) {
      showToast?.('Invalid video file! Please select an MP4, WebM, or MOV video.', 'error');
      return;
    }

    // Check size note for user
    const sizeInGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
    showToast?.(`Preparing high-capacity upload (${sizeInGB} GB): ${file.name}... 🎬`, 'info');

    setIsUploading(true);
    setLastUploadedFile(file);

    try {
      const result = await uploadVideoWithProgress(file, (p) => {
        setUploadProgress(p);
      });

      // Update poster and parent state
      if (result.posterUrl) {
        setPosterPreview(result.posterUrl);
      }

      onVideoChange({
        videoUrl: result.url,
        coverUrl: coverUrl || result.posterUrl,
        videoPosterUrl: result.posterUrl,
        videoQuality: result.quality,
        duration: result.formattedDuration,
        fileSize: result.formattedSize,
        title: title || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
      });

      setPlayableVideoUrl(result.url);
      setLoadedDuration(result.duration);
      showToast?.(`Concert video "${file.name}" uploaded successfully! Quality: ${result.quality} (${result.formattedDuration}) 🚀`, 'success');
    } catch (err: any) {
      console.error('Video upload failed:', err);
      showToast?.(`Video upload failed: ${err.message || 'Storage error'}`, 'error');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Retry upload if stopped
  const handleRetryUpload = () => {
    if (lastUploadedFile) {
      handleVideoFileSelected(lastUploadedFile);
    }
  };

  // Handle YouTube embed URL input (Option B)
  const handleYouTubeUrlChange = (url: string) => {
    setYtInputUrl(url);

    // Telegram public post link: keep the original t.me link as the
    // video URL — the website plays it via Telegram's official embed.
    if (parseTelegramPost(url)) {
      onVideoChange({
        videoUrl: url,
        coverUrl,
        videoPosterUrl,
        videoQuality,
        duration,
        fileSize,
        title
      });
      showToast?.('Telegram video linked — it will play on the website via Telegram\'s official embed 📢💜', 'success');
      return;
    }

    const ytid = getYoutubeVideoId(url);

    if (ytid) {
      const embedUrl = `https://www.youtube.com/embed/${ytid}`;
      const defaultYtThumb = `https://img.youtube.com/vi/${ytid}/maxresdefault.jpg`;
      setPosterPreview(defaultYtThumb);

      onVideoChange({
        videoUrl: embedUrl,
        coverUrl: coverUrl || defaultYtThumb,
        videoPosterUrl: defaultYtThumb,
        videoQuality: '1080p',
        title: title || `BTS Concert Stage Live (${ytid})`
      });

      showToast?.('YouTube concert stage parsed and thumbnail retrieved! 🎥', 'success');
    } else {
      onVideoChange({
        videoUrl: url,
        coverUrl,
        videoPosterUrl,
        videoQuality,
        duration,
        fileSize,
        title
      });
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleVideoFileSelected(e.dataTransfer.files[0]);
    }
  };

  const isYouTubeEmbed = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be');

  return (
    <div className="space-y-5">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/mov,video/*"
        onChange={(e) => {
          if (e.target.files?.[0]) handleVideoFileSelected(e.target.files[0]);
        }}
        className="hidden"
      />

      {/* DUAL OPTION SELECTOR TABS */}
      <div className="p-1.5 rounded-2xl bg-black/60 border border-purple-500/20 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setUploadMode('file')}
          className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            uploadMode === 'file'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Option A: Direct Video Upload (2–3 GB)</span>
        </button>

        <button
          type="button"
          onClick={() => setUploadMode('youtube')}
          className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            uploadMode === 'youtube'
              ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Option B: YouTube Embed Link</span>
        </button>
      </div>

      {/* OPTION A: DIRECT VIDEO UPLOAD SYSTEM */}
      {uploadMode === 'file' && (
        <div className="p-4 border border-purple-500/20 rounded-2xl bg-purple-950/20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Video className="w-4 h-4 text-cyan-400" />
              Direct High-Definition Video Master (Up to 2–3 GB)
            </span>
            {fileSize && (
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                Size: {fileSize}
              </span>
            )}
          </div>

          {/* Drag & Drop Upload Card */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
                : 'border-purple-500/30 hover:border-cyan-500/50 bg-black/40 hover:bg-black/60'
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-2.5">
              <div className="w-14 h-14 rounded-full bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                {isUploading ? (
                  <RefreshCw className="w-7 h-7 animate-spin text-cyan-400" />
                ) : (
                  <UploadCloud className="w-7 h-7 text-cyan-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-white">
                  {isUploading ? 'Streaming High-Capacity Video...' : 'Click to Browse or Drag & Drop Concert Video'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  Supports MP4, WebM, and MOV up to <strong className="text-cyan-300">2–3 GB</strong> with Cloudflare R2 cloud storage
                </p>
              </div>
            </div>
          </div>

          {/* Upload Progress with Speed, ETA, and Chunk Info */}
          {uploadProgress && (
            <div className="p-3.5 bg-black/70 border border-cyan-500/30 rounded-xl space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-300 flex items-center gap-1.5 font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  {uploadProgress.status}
                </span>
                <span className="text-cyan-400 font-bold">{uploadProgress.progress}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 rounded-full bg-cyan-950/50 overflow-hidden border border-cyan-500/20">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>

              {/* Stats & Retry */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 pt-0.5">
                <span>Transferred: <strong className="text-white">{formatFileSize(uploadProgress.loadedBytes)}</strong> / {formatFileSize(uploadProgress.totalBytes)}</span>
                <span>Speed: <strong className="text-cyan-300">{uploadProgress.speedFormatted}</strong></span>
                <span>ETA: <strong className="text-purple-300">{uploadProgress.etaFormatted}</strong></span>
                {uploadProgress.error && (
                  <button
                    type="button"
                    onClick={handleRetryUpload}
                    className="px-2 py-0.5 bg-rose-900/60 text-rose-200 border border-rose-500/30 rounded cursor-pointer"
                  >
                    Retry Upload
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Direct Stream / R2 URL input */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-mono block">
              Cloudflare R2 Storage URL / Stream Address
            </label>
            <input
              type="text"
              value={videoUrl || ''}
              onChange={(e) => {
                onVideoChange({
                  videoUrl: e.target.value,
                  coverUrl,
                  videoPosterUrl,
                  videoQuality,
                  duration,
                  fileSize,
                  title
                });
              }}
              placeholder="e.g. r2://bangtan-concerts/2026/concert.mp4 or https://..."
              className="w-full px-3 py-2 bg-[#090515] border border-purple-500/20 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      )}

      {/* OPTION B: YOUTUBE EMBED SYSTEM */}
      {uploadMode === 'youtube' && (
        <div className="p-4 border border-purple-500/20 rounded-2xl bg-purple-950/20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <Film className="w-4 h-4 text-red-500" />
              Video Embed (YouTube / Telegram) & Metadata
            </span>
            {(videoUrl?.includes('embed') || telegramPost) && (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Embedded
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-mono block">
              Paste YouTube URL, Embed Code, or a Telegram Post Link
            </label>
            <input
              type="text"
              value={ytInputUrl}
              onChange={(e) => handleYouTubeUrlChange(e.target.value)}
              placeholder="e.g. https://www.youtube.com/watch?v=... or https://t.me/yourchannel/123"
              className="w-full px-3 py-2 bg-[#090515] border border-purple-500/20 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-red-500"
            />
            <p className="text-[10px] text-slate-400 font-sans">
              YouTube links are converted to an embed automatically. A public Telegram post link (t.me/channel/123) also works — the video plays right on the website through Telegram's official embed, no re-upload needed.
            </p>
          </div>
        </div>
      )}

      {/* CONCERT VIDEO LIVE PREVIEW PLAYER */}
      {videoUrl && (
        <div className="p-4 border border-purple-500/30 rounded-2xl bg-black/70 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-400" />
              Concert Replay Video Preview
            </span>
            <div className="flex items-center gap-2">
              {videoQuality && (
                <span className="px-2 py-0.5 rounded bg-purple-600/30 border border-purple-400/40 text-purple-300 text-[10px] font-mono font-bold">
                  {videoQuality} Quality
                </span>
              )}
              {duration && (
                <span className="text-[10px] font-mono text-slate-400">
                  {duration}
                </span>
              )}
            </div>
          </div>

          {/* Interactive Player Frame */}
          <div className={`relative ${telegramPost ? '' : 'aspect-video'} rounded-xl bg-black border border-purple-500/20 overflow-hidden shadow-xl`}>
            {telegramPost ? (
              <TelegramPostEmbed
                channel={telegramPost.channel}
                postId={telegramPost.postId}
                originalUrl={videoUrl}
              />
            ) : isYouTubeEmbed ? (
              <iframe
                src={getYoutubeEmbedUrl(videoUrl)}
                title="Concert Preview Player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                className="w-full h-full absolute inset-0 border-0"
              />
            ) : playableVideoUrl ? (
              <video
                ref={videoRef}
                src={playableVideoUrl}
                poster={posterPreview || coverUrl}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                No video stream ready to preview.
              </div>
            )}
          </div>

          {/* Auto-extracted poster & cover thumbnail row */}
          {posterPreview && (
            <div className="flex items-center gap-3 p-2 bg-purple-950/20 rounded-xl border border-purple-500/15">
              <img
                src={posterPreview}
                alt="Concert Poster Frame"
                className="w-16 h-10 object-cover rounded-lg border border-purple-500/30 shrink-0"
              />
              <div className="text-[10px] font-mono text-slate-400 flex-grow min-w-0">
                <span className="text-white font-bold block truncate">Concert Poster Frame Captured</span>
                <span>Auto-generated from video at 1.0s or retrieved from stream.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PUBLISHING STATUS BADGE & TOGGLE */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20">
        <div>
          <span className="text-xs font-mono font-bold text-white block">
            Concert Archive Visibility
          </span>
          <span className="text-[10px] text-slate-400 font-sans">
            {published ? 'This concert is published and visible on the website.' : 'This concert is saved as a draft (hidden from public).'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
            published
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}>
            {published ? '🟢 Published Live' : '🟡 Draft Only'}
          </span>
          {onPublishToggle && (
            <button
              type="button"
              onClick={() => onPublishToggle(!published)}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-200 rounded-lg border border-white/10 cursor-pointer transition-colors"
            >
              Toggle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
