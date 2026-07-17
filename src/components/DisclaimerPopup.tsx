import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, AlertTriangle, Info, Sparkles, X } from 'lucide-react';

interface DisclaimerConfig {
  enabled: boolean;
  title: string;
  message: string;
  duration: number;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  icon: string;
}

interface DisclaimerPopupProps {
  isOpen: boolean;
  config: DisclaimerConfig;
  onClose: () => void;
  isPreview?: boolean;
}

const positionClasses: Record<string, string> = {
  'bottom-right': 'sm:bottom-6 sm:right-6 bottom-4 left-4 right-4 sm:left-auto sm:top-auto',
  'bottom-left': 'sm:bottom-6 sm:left-6 bottom-4 left-4 right-4 sm:right-auto sm:top-auto',
  'top-right': 'sm:top-6 sm:right-6 top-4 left-4 right-4 sm:left-auto sm:bottom-auto',
  'top-left': 'sm:top-6 sm:left-6 top-4 left-4 right-4 sm:right-auto sm:bottom-auto',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
};

export const DisclaimerPopup: React.FC<DisclaimerPopupProps> = ({
  isOpen,
  config,
  onClose,
  isPreview = false
}) => {
  const [progress, setProgress] = useState(100);
  const durationSec = config?.duration || 6;

  // Track progress bar & auto-dismissal
  useEffect(() => {
    if (!isOpen) return;

    setProgress(100);
    const intervalTime = 50; // Update progress bar every 50ms
    const totalSteps = (durationSec * 1000) / intervalTime;
    let currentStep = 0;

    const progressInterval = setInterval(() => {
      currentStep++;
      const newProgress = Math.max(0, 100 - (currentStep / totalSteps) * 100);
      setProgress(newProgress);
    }, intervalTime);

    const dismissTimeout = setTimeout(() => {
      onClose();
    }, durationSec * 1000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(dismissTimeout);
    };
  }, [isOpen, durationSec, onClose]);

  if (!isOpen || !config) return null;

  const isCenter = config.position === 'center';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background backdrop blur for centered popup */}
          {isCenter && (
            <motion.div
              initial={{ anonymity: 0, opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] transition-all"
              onClick={onClose}
              id="disclaimer-backdrop"
            />
          )}

          <motion.div
            initial={
              isCenter
                ? { opacity: 0, scale: 0.9, x: '-50%', y: '-40%' }
                : { opacity: 0, y: 30, scale: 0.95 }
            }
            animate={
              isCenter
                ? { opacity: 1, scale: 1, x: '-50%', y: '-50%' }
                : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              isCenter
                ? { opacity: 0, scale: 0.9, x: '-50%', y: '-45%' }
                : { opacity: 0, y: 20, scale: 0.95 }
            }
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className={`fixed z-[9999] max-w-md w-[calc(100%-2rem)] sm:w-96 rounded-xl border border-purple-500/25 bg-slate-950/85 backdrop-blur-xl text-white shadow-[0_8px_32px_0_rgba(168,85,247,0.2)] flex flex-col overflow-hidden ${positionClasses[config.position] || positionClasses['bottom-right']}`}
            id="disclaimer-popup-container"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/10 bg-purple-950/10">
              <div className="flex items-center gap-2">
                <span className="text-lg" id="disclaimer-icon">
                  {config.icon || '⚠️'}
                </span>
                <h4 className="text-sm font-bold tracking-wide uppercase text-purple-300 font-sans" id="disclaimer-title-text">
                  {config.title || 'Disclaimer'}
                </h4>
              </div>
              
              <div className="flex items-center gap-2">
                {isPreview && (
                  <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/20 animate-pulse">
                    PREVIEW
                  </span>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer select-none"
                  title="Close"
                  id="disclaimer-close-btn"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Message Container */}
            <div className="p-4 flex-1 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto select-none scrollbar-thin scrollbar-thumb-purple-900" id="disclaimer-message-text">
              {config.message}
            </div>

            {/* Bottom Actions & Timer Progress */}
            <div className="px-4 py-2 bg-slate-950/95 border-t border-purple-500/10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Auto-dismissing in {durationSec}s</span>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/20 hover:border-purple-500/40 transition-all font-sans font-semibold cursor-pointer active:scale-95"
                id="disclaimer-ack-btn"
              >
                Got it 💜
              </button>
            </div>

            {/* Dynamic Progress Indicator */}
            <div className="w-full h-1 bg-slate-900">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500 transition-all duration-75"
                style={{ width: `${progress}%` }}
                id="disclaimer-progress-bar"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
