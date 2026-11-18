import React, { useState, useEffect } from 'react';
import { X, Download, Share, CheckCircle2 } from 'lucide-react';
import { installPromptStore, isStandalone, isIOS } from '../utils/installPrompt';

// Batch 75 — "Install Bangtan Gallery App" (PWA).
// variant 'card': the slim Home page card. It only appears when the
// browser actually offers an install (or on iOS, where install is a
// manual Share-menu step) and it stays away for 14 days after a
// dismiss. variant 'settings': the Settings page card, always shown
// with an honest state (installed / installable / how-to).
const DISMISS_KEY = 'bg_install_dismissed_at';
const DISMISS_DAYS = 14;

export default function InstallApp({ variant = 'card' }: { variant?: 'card' | 'settings' }) {
  const [, force] = useState(0);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      const at = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
      return Number.isFinite(at) && at > 0 && Date.now() - at < DISMISS_DAYS * 86400000;
    } catch {
      return false;
    }
  });

  useEffect(() => installPromptStore.subscribe(() => force((n) => n + 1)), []);

  const standalone = isStandalone();
  const canInstall = installPromptStore.canInstall();
  const ios = isIOS();

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
    setDismissed(true);
  };

  if (variant === 'card') {
    if (standalone || dismissed) return null;
    if (!canInstall && !ios) return null;
    return (
      <div className="w-full rounded-2xl border border-purple-500/25 bg-gradient-to-r from-purple-950/70 via-[#150826] to-pink-950/50 px-4 py-3.5 flex items-center gap-3.5 relative overflow-hidden">
        <img src="/favicon-512.png" alt="Bangtan Gallery app icon" className="w-11 h-11 rounded-xl shadow-lg shadow-purple-900/50 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-white leading-tight">Install Bangtan Gallery App 📲</p>
          <p className="text-[11px] text-purple-200/80 leading-snug">
            {ios
              ? 'Tap the Share button, then "Add to Home Screen" — opens like a real app, faster every time.'
              : 'Full-screen, faster loading, works even on slow internet. No app store needed.'}
          </p>
        </div>
        {!ios && (
          <button
            onClick={() => installPromptStore.prompt()}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-extrabold flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Install
          </button>
        )}
        {ios && <Share className="w-5 h-5 text-purple-300 shrink-0" />}
        <button
          onClick={dismiss}
          aria-label="Dismiss install banner"
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // Settings variant — always visible, honest state.
  return (
    <div className="p-5 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md space-y-3">
      <h3 className="text-sm font-mono font-bold text-purple-300 flex items-center gap-2 border-b border-white/5 pb-2 uppercase tracking-wider">
        <Download className="w-4 h-4 text-purple-400" /> Bangtan Gallery App
      </h3>
      {standalone ? (
        <p className="text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Already installed — you're using the app right now! 💜
        </p>
      ) : canInstall ? (
        <>
          <p className="text-xs text-gray-400">
            Install Bangtan Gallery on this device: full-screen, faster loading, and it opens even on a slow connection.
          </p>
          <button
            onClick={() => installPromptStore.prompt()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-extrabold flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Install App
          </button>
        </>
      ) : ios ? (
        <p className="text-xs text-gray-400 flex items-start gap-2">
          <Share className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />
          On iPhone/iPad: tap the Share button in Safari, then choose "Add to Home Screen" — the purple icon will appear on your home screen.
        </p>
      ) : (
        <p className="text-xs text-gray-400">
          Open bangtangallery.online in Chrome on your phone and tap "Install App" when it appears — the purple icon will be added to your home screen.
        </p>
      )}
    </div>
  );
}
