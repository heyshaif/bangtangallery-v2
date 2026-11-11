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
      // Batch 77: tapping anywhere skips the intro immediately.
      onPointerDown={() => onCompleteRef.current()}
      className="fixed inset-0 z-[9999] bg-[#05000a] flex flex-col items-center justify-center overflow-hidden cursor-pointer"
    >
      {/* Subtle aurora background glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/15 blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-rose-950/10 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Symmetrical glowing doors and stars */}
      <div className="relative flex flex-col items-center select-none">
        {/* Batch 146 (owner's own spec): the site PNG logo
            (public/images/bts-logo-cut.png — a transparent cut-out
            of the owner's bts-logo.png) split into two halves that
            slide in from the far left and right and JOIN in the
            middle like doors closing; the 7 pops in once joined. */}
        <div className="relative w-[168px] md:w-[208px] aspect-[367/403] mb-8">
          {/* Left half of the logo */}
          <div className="absolute left-0 top-0 w-1/2 h-full overflow-hidden">
            <motion.img
              src="/images/bts-logo-cut.png"
              alt=""
              initial={{ x: -170, opacity: 0 }}
              animate={{ x: 0, opacity: 1, transition: { duration: 1.05, ease: [0.16, 1, 0.3, 1] } }}
              className="absolute left-0 top-0 w-[168px] md:w-[208px] max-w-none h-full object-cover"
              draggable={false}
            />
          </div>
          {/* Right half of the logo */}
          <div className="absolute right-0 top-0 w-1/2 h-full overflow-hidden">
            <motion.img
              src="/images/bts-logo-cut.png"
              alt=""
              initial={{ x: 170, opacity: 0 }}
              animate={{ x: 0, opacity: 1, transition: { duration: 1.05, ease: [0.16, 1, 0.3, 1] } }}
              className="absolute right-0 top-0 w-[168px] md:w-[208px] max-w-none h-full object-cover"
              draggable={false}
            />
          </div>

          {/* Glowing superscript 7, popping in once the halves join */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, transition: { delay: 1.05, duration: 0.5 } }}
            className="absolute -top-1 -right-6 md:-right-8 text-purple-400 font-sans font-black text-3xl md:text-4xl drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]"
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

