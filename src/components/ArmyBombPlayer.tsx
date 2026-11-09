import { useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';

/**
 * ARMY Bomb background player (owner feature, 2026-11-05).
 * A floating ARMY Bomb lightstick (the owner's real product photos,
 * background-removed PNGs, both states the exact same canvas size)
 * sits at the bottom-left of the public site. Tapping it plays the
 * owner's supplied "Body to Body" edit audio in the background
 * (looped) and the bomb switches to its lit purple photo with a
 * silhouette glow + expanding light rings. Tapping again turns the
 * song and the light off. No text label anywhere — just the bomb,
 * per the owner's instruction.
 * It never fights the main music player: starting the bomb pauses
 * the main player, and starting a track stops the bomb.
 */
const BOMB_AUDIO_SRC = '/audio/army-bomb-body-to-body.mp3';

export default function ArmyBombPlayer() {
  const { isPlaying, togglePlay, currentTrack } = useAudioPlayer();
  const [bombOn, setBombOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Idle fade (owner rule, 2026-11-06): while the bomb is OFF it
  // stays fully visible for 5 seconds, then fades to 40% opacity.
  // Any touch brings it back to full and restarts the 5 seconds.
  // While the bomb is ON (song playing) it NEVER fades.
  const [dimmed, setDimmed] = useState(false);
  const [lastTouch, setLastTouch] = useState(0);

  useEffect(() => {
    if (bombOn) {
      setDimmed(false);
      return;
    }
    setDimmed(false);
    const t = setTimeout(() => setDimmed(true), 5000);
    return () => clearTimeout(t);
  }, [bombOn, lastTouch]);

  const stopBomb = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setBombOn(false);
  };

  const toggleBomb = async () => {
    if (bombOn) {
      stopBomb();
      return;
    }
    // Main player yields to the bomb.
    if (isPlaying) togglePlay();
    if (!audioRef.current) {
      const a = new Audio(BOMB_AUDIO_SRC);
      a.loop = true;
      a.preload = 'auto';
      audioRef.current = a;
    }
    try {
      await audioRef.current.play();
      setBombOn(true);
    } catch {
      setBombOn(false);
    }
  };

  // A track starting in the main player turns the bomb off.
  useEffect(() => {
    if (isPlaying && bombOn) stopBomb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // Preload the lit bomb so toggling feels instant.
  useEffect(() => {
    const im = new Image();
    im.src = '/images/army-bomb-on.png';
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div
      onPointerDown={() => setLastTouch(Date.now())}
      onPointerEnter={() => setLastTouch(Date.now())}
      className={`fixed left-2 md:left-4 z-50 select-none transition-opacity duration-1000 ${
        dimmed ? 'opacity-40' : 'opacity-100'
      } ${
        currentTrack ? 'bottom-32 md:bottom-36' : 'bottom-4 md:bottom-6'
      }`}
    >
      <button
        type="button"
        onClick={toggleBomb}
        title={bombOn ? 'ARMY Bomb OFF (stop the song)' : 'ARMY Bomb ON (play Body to Body)'}
        aria-pressed={bombOn}
        aria-label={bombOn ? 'Turn ARMY Bomb off' : 'Turn ARMY Bomb on'}
        className="relative block cursor-pointer focus:outline-none transition-transform hover:scale-[1.04] active:scale-95"
      >
        {/* ambient aura + expanding light rings while lit */}
        {bombOn && (
          <>
            <span className="absolute top-[4%] left-1/2 -translate-x-1/2 w-[86%] aspect-square rounded-full bg-fuchsia-500/25 blur-2xl animate-pulse pointer-events-none" />
            <span className="bomb-ring absolute top-[4%] left-1/2 -translate-x-1/2 w-[86%] aspect-square rounded-full border-2 border-purple-300/50 pointer-events-none" />
            <span className="bomb-ring-2 absolute top-[4%] left-1/2 -translate-x-1/2 w-[86%] aspect-square rounded-full border-2 border-pink-300/40 pointer-events-none" />
          </>
        )}
        <img
          src={bombOn ? '/images/army-bomb-on.png' : '/images/army-bomb-off.png'}
          alt="ARMY Bomb"
          draggable={false}
          className={`relative h-12 md:h-14 w-auto ${bombOn ? 'bomb-img-on' : ''}`}
        />
      </button>
    </div>
  );
}
