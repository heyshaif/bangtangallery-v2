import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { Sparkles, Heart } from 'lucide-react';

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Elegant intro timeline setting up total loader sequence duration
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      id="preloader-container"
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ 
        opacity: 0,
        scale: 1.05,
        filter: 'blur(10px)',
        transition: { duration: 0.7, ease: [0.43, 0.13, 0.23, 0.96] }
      }}
      className="fixed inset-0 z-[9999] bg-[#05000a] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Subtle aurora background glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/15 blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-rose-950/10 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Symmetrical glowing doors and stars */}
      <div className="relative flex flex-col items-center select-none">
        <div className="relative flex items-center justify-center gap-10 md:gap-14 mb-8">
          
          {/* Left Door - BTS Trapezoid */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0.4, x: -60, rotateY: 45 }}
            animate={{ 
              opacity: 1, 
              scaleY: 1, 
              x: 0, 
              rotateY: 0,
              transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
            }}
            className="w-10 h-32 md:w-14 md:h-44 bg-gradient-to-b from-purple-500 via-fuchsia-600 to-indigo-600 shadow-[0_0_40px_rgba(168,85,247,0.3)] border-r border-white/10"
            style={{ 
              transformOrigin: 'right center', 
              perspective: 1000,
              clipPath: 'polygon(0% 15%, 100% 0%, 100% 100%, 0% 85%)'
            }}
          />

          {/* Right Door - BTS Trapezoid */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0.4, x: 60, rotateY: -45 }}
            animate={{ 
              opacity: 1, 
              scaleY: 1, 
              x: 0, 
              rotateY: 0,
              transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
            }}
            className="w-10 h-32 md:w-14 md:h-44 bg-gradient-to-b from-purple-500 via-fuchsia-600 to-indigo-600 shadow-[0_0_40px_rgba(168,85,247,0.3)] border-l border-white/10"
            style={{ 
              transformOrigin: 'left center', 
              perspective: 1000,
              clipPath: 'polygon(0% 0%, 100% 15%, 100% 85%, 0% 100%)'
            }}
          />

          {/* Glowing superscript 7 placed elegantly over the doors */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, transition: { delay: 1, duration: 0.6 } }}
            className="absolute top-0 right-[-24px] md:right-[-32px] text-purple-400 font-sans font-black text-3xl md:text-4xl drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]"
          >
            ⁷
          </motion.div>
        </div>

        {/* Glowing lines crossing */}
        <motion.div 
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 180, opacity: 0.6, transition: { delay: 0.6, duration: 1 } }}
          className="h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent mb-6"
        />

        {/* Brand/Logo reveal */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.8, duration: 0.8 } }}
          className="text-center"
        >
          <h2 className="font-sans font-black text-sm min-[380px]:text-base sm:text-lg md:text-2xl lg:text-3xl tracking-[0.1em] sm:tracking-[0.2em] text-white uppercase flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap">
            BANGTAN <span className="text-purple-400 animate-pulse shrink-0">⟭⟬⁷</span> GALLERY
          </h2>
          <p className="text-[10px] font-mono mt-2.5 text-purple-300 uppercase tracking-[0.4em] font-medium flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400 animate-spin" style={{ animationDuration: '4s' }} />
            Premium Fan Experience &apos;26
          </p>
        </motion.div>

        {/* Micro progress node */}
        <div className="absolute -bottom-16">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 140 }}
            transition={{ duration: 2.2, ease: 'easeInOut' }}
            className="h-1 bg-gradient-to-r from-purple-600 via-rose-500 to-fuchsia-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"
          />
          <div className="flex justify-between text-[8px] font-mono text-purple-400 uppercase mt-1.5 tracking-widest">
            <span>connecting</span>
            <Heart className="w-2.5 h-2.5 text-purple-500 fill-purple-500 animate-pulse" />
            <span>k-universe</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

