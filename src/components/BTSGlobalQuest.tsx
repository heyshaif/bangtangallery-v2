import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AdsterraAd from './AdsterraAd';
import { Gamepad2, ArrowLeft, Sparkles, Send, Bell, Heart, Volume2 } from 'lucide-react';

interface BTSGlobalQuestProps {
  config?: any;
  targetUsername?: string | null;
  onExitProfile?: () => void;
}

export default function BTSGlobalQuest({ config, targetUsername, onExitProfile }: BTSGlobalQuestProps = {}) {
  // Emojis for the interactive loading indicator
  const emojis = ['😔', '⏳', '🥹', '💜', '😊'];
  const [emojiIndex, setEmojiIndex] = useState(0);

  // Rotate the emojis continuously
  useEffect(() => {
    const interval = setInterval(() => {
      setEmojiIndex((prev) => (prev + 1) % emojis.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [emojis.length]);

  return (
    <div id="coming-soon-container" className="relative min-h-[85vh] flex flex-col items-center justify-center bg-gradient-to-b from-[#090214] via-[#15072e] to-[#04010a] text-white px-4 py-12 md:py-16 overflow-hidden rounded-3xl border border-purple-500/10 shadow-[0_0_60px_rgba(0,0,0,0.85)]">
      
      {/* Premium glowing background mesh nodes */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#d8b4fe]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Futuristic Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.12),transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-60" />

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 opacity-20"
            style={{
              width: `${Math.random() * 6 + 4}px`,
              height: `${Math.random() * 6 + 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -60, 0],
              x: [0, Math.random() * 30 - 15, 0],
              opacity: [0.15, 0.6, 0.15],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 6 + Math.random() * 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Main Glassmorphism Card */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-xl bg-black/45 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 md:p-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center gap-6 md:gap-8"
      >
        {/* Soft center glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Custom styled BTS-inspired modern doors element in the middle */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: [1, 1.04, 1], opacity: 1 }}
          transition={{ 
            scale: { repeat: Infinity, duration: 5, ease: "easeInOut" },
            opacity: { duration: 0.6 }
          }}
          className="relative flex items-center justify-center w-28 h-28 md:w-32 md:h-32 mb-1"
        >
          {/* Glowing neon orbits surrounding the central symbol */}
          <div className="absolute inset-0 rounded-full border border-purple-500/15 animate-spin duration-[18000ms]" />
          <div className="absolute -inset-3 rounded-full border border-dashed border-indigo-500/10 animate-spin duration-[24000ms] reverse" />

          {/* Aesthetic Geometric Door Representation (Custom, non-copyright design representing opening doors/windows of hope) */}
          <div className="flex gap-2.5 items-center justify-center filter drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            {/* Left Door */}
            <div 
              className="w-7 h-16 bg-gradient-to-b from-purple-300 via-purple-500 to-indigo-600 rounded-sm"
              style={{
                clipPath: 'polygon(0% 12%, 100% 0%, 100% 100%, 0% 88%)'
              }}
            />
            {/* Right Door */}
            <div 
              className="w-7 h-16 bg-gradient-to-b from-purple-300 via-purple-500 to-indigo-600 rounded-sm"
              style={{
                clipPath: 'polygon(0% 0%, 100% 12%, 100% 88%, 0% 100%)'
              }}
            />
          </div>
        </motion.div>

        {/* Content Section */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/25 px-3.5 py-1 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.15)]"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-purple-300">ARMY Entertainment</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-2xl md:text-3xl font-sans font-extrabold tracking-tight"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-indigo-300 drop-shadow-[0_2px_15px_rgba(168,85,247,0.45)]">
              🎮 Play Game - Coming Soon
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-sm md:text-base text-purple-100/80 max-w-sm mx-auto leading-relaxed"
          >
            We're building something exciting for ARMY. Please wait a little longer! 💜
          </motion.p>
        </div>

        {/* Smooth, Animated Emoji Loader Loop */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col items-center gap-4 bg-purple-950/20 border border-purple-500/10 rounded-2xl p-5 w-full max-w-sm shadow-inner"
        >
          {/* Horizontal Indicator Chain */}
          <div className="flex items-center justify-center gap-2.5 bg-black/30 border border-white/5 rounded-full px-4 py-1.5">
            {emojis.map((emoji, index) => (
              <React.Fragment key={index}>
                <span 
                  className={`text-sm transition-all duration-300 ${
                    emojiIndex === index 
                      ? 'scale-135 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.9)] opacity-100 font-bold' 
                      : 'opacity-30 grayscale-[30%] scale-90'
                  }`}
                >
                  {emoji}
                </span>
                {index < emojis.length - 1 && (
                  <span className="text-purple-500/20 font-sans text-[10px]">➔</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Active bouncing main emoji */}
          <div className="h-20 flex items-center justify-center relative w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={emojiIndex}
                initial={{ opacity: 0, scale: 0.5, y: 15 }}
                animate={{ opacity: 1, scale: 1.2, y: [0, -10, 0] }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ 
                  opacity: { duration: 0.25 },
                  scale: { duration: 0.25 },
                  y: { repeat: Infinity, duration: 1.1, ease: "easeInOut" }
                }}
                className="text-5xl md:text-6xl select-none filter drop-shadow-[0_0_22px_rgba(168,85,247,0.65)]"
              >
                {emojis[emojiIndex]}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* "Follow for More Updates" section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="w-full max-w-sm space-y-3"
        >
          <div className="flex items-center justify-center gap-2 text-purple-300/80 font-sans font-medium text-xs uppercase tracking-wider">
            <Bell className="w-3.5 h-3.5 text-purple-400 animate-bounce" />
            <span>📢 Follow for More Updates</span>
          </div>

          <a
            href="https://t.me/arirang_army7"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 via-purple-700 to-[#0088cc] hover:from-purple-500 hover:to-[#22a4e3] text-white font-sans font-bold py-3.5 px-6 rounded-xl shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_25px_rgba(0,136,204,0.5)] transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-sm group"
          >
            <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            Join Our Telegram 💜
          </a>
        </motion.div>

        {/* Action Button: Back to Home */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="w-full max-w-xs pt-2 border-t border-white/5"
        >
          <button
            onClick={onExitProfile}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-purple-200 hover:text-white font-sans font-semibold py-3 px-5 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all duration-200 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
        </motion.div>

        <AdsterraAd type={8} />
      </motion.div>
    </div>
  );
}
