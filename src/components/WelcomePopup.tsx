/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Shield, Heart, HelpCircle, LogOut } from 'lucide-react';

interface WelcomePopupProps {
  onAccept: () => void;
}

export default function WelcomePopup({ onAccept }: WelcomePopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    // Check if user has already accepted the disclaimer
    const choice = localStorage.getItem('bts_welcome_popup_choice');
    if (!choice) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000); // 1 second delay requested
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptChoice = () => {
    localStorage.setItem('bts_welcome_popup_choice', 'accepted');
    setIsOpen(false);
    onAccept();
  };

  const handleDeclineChoice = () => {
    setDeclined(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <AnimatePresence mode="wait">
        {!declined ? (
          <motion.div
            key="welcome-form"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="relative w-full max-w-lg rounded-3xl border border-purple-500/30 bg-black/80 p-8 shadow-[0_0_50px_rgba(168,85,247,0.3)] text-center space-y-6 overflow-hidden md:p-10"
          >
            {/* Ambient Purple/Cyan Background Glow Elements */}
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

            {/* Glowing Border Decorator */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-cyan-400 opacity-60" />

            {/* Icon Header Grid */}
            <div className="relative mx-auto w-20 h-20 rounded-full bg-purple-950/40 border border-purple-500/40 flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.4)] animate-pulse">
              <Sparkles className="w-10 h-10 text-purple-300" />
              {/* Little moving particles */}
              <div className="absolute -top-2 left-6 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
              <div className="absolute -bottom-1 right-5 w-1 h-1 bg-purple-400 rounded-full animate-bounce" />
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-sans font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-200 to-cyan-300 drop-shadow-sm tracking-tight flex items-center justify-center gap-2">
                💜 Welcome to Bangtan Gallery
              </h1>
              <p className="text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase">
                The Ultimate Digital Home for ARMY Worldwide
              </p>
            </div>

            {/* Core Message Text */}
            <div className="text-gray-300 text-sm leading-relaxed space-y-3 bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-left max-h-[220px] overflow-y-auto custom-scrollbar">
              <p className="font-semibold text-purple-200 text-center border-b border-white/5 pb-2 mb-2 flex items-center justify-center gap-1.5 text-xs font-mono uppercase tracking-wider">
                <Shield className="w-4 h-4 text-purple-400" /> ARMY Pledge of Entry
              </p>
              <p>
                By entering <strong>BANGTAN GALLERY</strong>, you become part of our sacred global ARMY network. Please commit to upholding our community values:
              </p>
              <ul className="space-y-2.5 text-xs text-gray-400 list-disc list-inside pl-1 pt-1">
                <li>
                  <strong className="text-purple-300">Apobangpo (ARMY Forever, BTS Forever)</strong>: Let’s support all seven members of BTS with pure trust and love.
                </li>
                <li>
                  <strong className="text-purple-300">Community Respect</strong>: Strictly no hate speech, shipping wars, toxicity, or commercial exploitation. Maintain standard positive vibes.
                </li>
                <li>
                  <strong className="text-purple-300">Borahae Spirit</strong>: We trust and love each other for a very long time. Spread purple light! 💜
                </li>
              </ul>
              <p className="text-xs text-gray-500 text-center italic pt-2">
                * Choice is saved locally. Clear browser data to re-prompt.
              </p>
            </div>

            {/* Options Panel */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={handleDeclineChoice}
                className="px-5 py-3 rounded-xl border border-white/10 bg-white/[0.02] text-xs font-mono font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all outline-none"
              >
                No, Decline
              </button>
              <button
                onClick={handleAcceptChoice}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-mono font-bold text-white hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] border border-purple-400/20"
              >
                💜 Yes, Borahae!
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="decline-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md rounded-2xl border border-red-500/20 bg-black/90 p-8 shadow-2xl text-center space-y-5"
          >
            <div className="absolute top-0 inset-x-0 h-[2px] bg-red-500/50" />
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <LogOut className="w-8 h-8 text-red-400" />
            </div>

            <h3 className="text-xl font-bold text-white font-sans">Guidelines Not Accepted</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              We hope to welcome you to the galaxy of BTS digital art, music, and downloads another time! To access the BANGTAN GALLERY, accepting the ARMY community pledge is required.
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => setDeclined(false)}
                className="w-full py-2.5 font-mono text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              >
                Return to Pledge
              </button>
              <button
                onClick={() => {
                  window.location.href = 'https://www.youtube.com/@BTS';
                }}
                className="w-full py-2 bg-transparent text-gray-400 hover:text-white text-xs font-mono transition-colors"
              >
                Visit Official BTS YouTube
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
