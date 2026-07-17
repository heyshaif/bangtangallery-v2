/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Album, Track } from '../types';
import { ALBUMS } from '../data/btsData';

export interface QueueItem {
  track: Track;
  album: Album;
}

interface AudioPlayerContextType {
  currentTrack: Track | null;
  currentAlbum: Album | null;
  isPlaying: boolean;
  playbackProgress: number; // 0 to 100
  currentTime: number; // in seconds
  duration: number; // in seconds
  volume: number; // 0 to 1
  isMuted: boolean;
  isShuffle: boolean;
  isRepeat: 'none' | 'one' | 'all';
  queue: QueueItem[];
  currentIndex: number;
  playTrack: (track: Track, album: Album, startPlaying?: boolean) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (percent: number) => void;
  seekSeconds: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: Track, album: Album) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  startPlayingFirstTime: () => void;
  setWholeQueue: (items: QueueItem[], index: number) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

// A list of reliable educational instrumental streams wrapping securely
const AUDIO_URLS = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
];

// Flat list of all tracks to build initial default queue
const ALL_TRACKS: QueueItem[] = ALBUMS.flatMap(album => 
  album.tracks.map(track => ({ track, album }))
);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<'none' | 'one' | 'all'>('all');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio element
  useEffect(() => {
    audioRef.current = new Audio();
    
    // Attempt local storage volume recovery
    const savedVol = localStorage.getItem('bts_player_volume');
    if (savedVol !== null) {
      const parsed = parseFloat(savedVol);
      setVolumeState(parsed);
      if (audioRef.current) audioRef.current.volume = parsed;
    } else {
      if (audioRef.current) audioRef.current.volume = 0.75;
    }

    // Load initial queue
    fetch('/api/config/published')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        if (data) {
          const customTracks: QueueItem[] = Array.isArray(data.albums)
            ? data.albums.flatMap((album: any) => {
                const tracksList = Array.isArray(album.tracks) ? album.tracks : [];
                const visibleTracks = tracksList.filter((t: any) => !t.hidden);
                return visibleTracks.map((track: any) => ({
                  track: {
                    id: track.id || `track-${track.title || Date.now()}`,
                    title: track.title || 'Untitled Track',
                    artist: track.artist || album.artist || 'BTS',
                    duration: track.duration || '3:30',
                    audioUrl: track.audioUrl || ''
                  },
                  album: {
                    id: album.id || `album-${album.title || Date.now()}`,
                    title: album.title || 'Custom Album',
                    artist: album.artist || 'BTS',
                    year: album.year || '2026',
                    coverUrl: album.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'
                  }
                }));
              })
            : [];

          const customDigitalTracks: QueueItem[] = Array.isArray(data.digitalTracks)
            ? data.digitalTracks.map((track: any) => ({
                track: {
                  id: track.id || `track-${track.title || Date.now()}`,
                  title: track.title || 'Untitled Track',
                  artist: track.artist || 'BTS',
                  duration: track.duration || '3:30',
                  audioUrl: track.audioUrl || ''
                },
                album: {
                  id: track.id + '-album_wrapper',
                  title: track.album || 'Digital Archive',
                  artist: track.artist || 'BTS',
                  year: track.genre || '2026',
                  coverUrl: track.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'
                }
              }))
            : [];

          const merged = [...customDigitalTracks, ...customTracks];
          if (merged.length > 0) {
            setQueue(merged);
            return;
          }
        }
        setQueue(ALL_TRACKS);
      })
      .catch(() => {
        setQueue(ALL_TRACKS);
      });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Update audio source when track changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    let audioUrl = currentTrack.audioUrl || '';

    // Convert absolute api/media/serve paths from any external host to a relative path
    if (audioUrl.includes('/api/media/serve/')) {
      const idx = audioUrl.indexOf('/api/media/serve/');
      const isProduction = window.location.hostname === 'bangtangallery.online' || 
                           window.location.hostname === 'www.bangtangallery.online';
      const isLocalOrSandbox = window.location.hostname.includes('run.app') ||
                               window.location.hostname.includes('aistudio') ||
                               window.location.hostname.includes('localhost') ||
                               window.location.hostname.includes('127.0.0.1');
      if (!isProduction && !isLocalOrSandbox) {
        audioUrl = 'https://api.bangtangallery.online' + audioUrl.slice(idx);
      } else {
        audioUrl = audioUrl.slice(idx);
      }
    }

    if (!audioUrl) {
      // Clear audio player source for non-custom audio (e.g. Spotify embeds)
      audioRef.current.pause();
      audioRef.current.src = '';
      setDuration(0);
      setCurrentTime(0);
      setPlaybackProgress(0);
      return;
    }

    // Check if it's a YouTube URL and extract ID for audio streaming proxy
    if (audioUrl) {
      const getYoutubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
      };
      const ytId = getYoutubeId(audioUrl);
      if (ytId) {
        audioUrl = `/api/youtube/stream/${ytId}`;
      }
    }

    const contextIsPlaying = isPlaying;
    audioRef.current.src = audioUrl;
    audioRef.current.load();

    if (contextIsPlaying) {
      audioRef.current.play().catch(err => {
        console.log('Autoplay blocked initially or source changed', err);
        setIsPlaying(false);
      });
    }

    // Set duration from track meta as fallback first
    const parts = (currentTrack?.duration || '').split(':');
    if (parts.length === 2) {
      const secs = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      setDuration(secs);
    }
  }, [currentTrack]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!audio.duration) return;
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration);
      setPlaybackProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (isRepeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        nextTrack();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [queue, currentIndex, isShuffle, isRepeat]);

  // Play controls
  const playTrack = (track: Track, album: Album, startPlaying: boolean = true) => {
    setCurrentTrack(track);
    setCurrentAlbum(album);
    
    // Find index in queue or insert it
    const findIndex = queue.findIndex(item => item.track.title === track.title);
    if (findIndex !== -1) {
      setCurrentIndex(findIndex);
    } else {
      const newItem: QueueItem = { track, album };
      setQueue(prev => [...prev, newItem]);
      setCurrentIndex(queue.length);
    }

    if (startPlaying) {
      setIsPlaying(true);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(() => {
            setIsPlaying(false);
          });
        }
      }, 50);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    // If no track is currently loaded, pick the first track
    if (!currentTrack && queue.length > 0) {
      playTrack(queue[0].track, queue[0].album, true);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Failed to trigger audio playback', err);
      });
    }
  };

  const nextTrack = () => {
    if (queue.length === 0) return;

    let nextIdx = currentIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (nextIdx >= queue.length) {
      if (isRepeat === 'all') {
        nextIdx = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    if (queue[nextIdx]) {
      setCurrentIndex(nextIdx);
      setCurrentTrack(queue[nextIdx].track);
      setCurrentAlbum(queue[nextIdx].album);
      setIsPlaying(true);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(() => setIsPlaying(false));
        }
      }, 50);
    }
  };

  const prevTrack = () => {
    if (queue.length === 0) return;

    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) {
      if (isRepeat === 'all') {
        prevIdx = queue.length - 1;
      } else {
        prevIdx = 0;
      }
    }

    if (queue[prevIdx]) {
      setCurrentIndex(prevIdx);
      setCurrentTrack(queue[prevIdx].track);
      setCurrentAlbum(queue[prevIdx].album);
      setIsPlaying(true);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(() => setIsPlaying(false));
        }
      }, 50);
    }
  };

  const seek = (percent: number) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    const targetTime = (percent / 100) * audioRef.current.duration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
    setPlaybackProgress(percent);
  };

  const seekSeconds = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = seconds;
    setCurrentTime(seconds);
  };

  const setVolume = (vol: number) => {
    const val = Math.max(0, Math.min(1, vol));
    setVolumeState(val);
    localStorage.setItem('bts_player_volume', String(val));
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (isMuted && val > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current.muted = nextMuted;
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  const toggleRepeat = () => {
    setIsRepeat(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  };

  const addToQueue = (track: Track, album: Album) => {
    setQueue(prev => {
      if (prev.some(item => item.track.title === track.title)) return prev;
      return [...prev, { track, album }];
    });
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => {
      const cloned = [...prev];
      cloned.splice(index, 1);
      
      // Adjust currentIndex if removed item was earlier or current
      if (index === currentIndex) {
        // Stop playback or move
        setTimeout(() => {
          if (cloned.length > 0) {
            const nextIdx = index >= cloned.length ? 0 : index;
            setCurrentIndex(nextIdx);
            setCurrentTrack(cloned[nextIdx].track);
            setCurrentAlbum(cloned[nextIdx].album);
          } else {
            setCurrentTrack(null);
            setCurrentAlbum(null);
            setIsPlaying(false);
            setCurrentIndex(-1);
          }
        }, 10);
      } else if (index < currentIndex) {
        setCurrentIndex(currentIndex - 1);
      }

      return cloned;
    });
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(-1);
    setCurrentTrack(null);
    setCurrentAlbum(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };

  const setWholeQueue = (items: QueueItem[], index: number) => {
    setQueue(items);
    setCurrentIndex(index);
    if (items[index]) {
      setCurrentTrack(items[index].track);
      setCurrentAlbum(items[index].album);
      setIsPlaying(true);
      
      // If the track is a custom audio track, play it
      if (items[index].track.audioUrl) {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
        }, 50);
      } else {
        // Pause and clear custom audio source for Spotify tracks
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
      }
    }
  };

  // Triggers immediate playback when clicking on the Music section
  const startPlayingFirstTime = () => {
    if (isPlaying) return; // already active, keep playing!
    
    if (currentTrack) {
      // already has a loaded track, keep it paused
    } else if (queue.length > 0) {
      // Pick first track of the queue ("Yet To Come" from Proof)
      const first = queue[0];
      playTrack(first.track, first.album, false);
    } else if (ALL_TRACKS.length > 0) {
      setQueue(ALL_TRACKS);
      const first = ALL_TRACKS[0];
      playTrack(first.track, first.album, false);
    }
  };

  return (
    <AudioPlayerContext.Provider
      value={{
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
        queue,
        currentIndex,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seek,
        seekSeconds,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        addToQueue,
        removeFromQueue,
        clearQueue,
        startPlayingFirstTime,
        setWholeQueue,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}
