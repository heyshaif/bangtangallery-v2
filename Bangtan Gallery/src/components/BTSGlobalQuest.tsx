import AdsterraAd from './AdsterraAd';
import { Send } from 'lucide-react';

interface BTSGlobalQuestProps {
  config?: any;
  targetUsername?: string | null;
  onExitProfile?: () => void;
}

/**
 * Play Game page footer strip (Batch 84 — owner redesign).
 *
 * The old "Coming Soon" hero (logo orb, emoji loader stage, big
 * poster Telegram button, Back to Home) took up a whole section
 * under the Music Quiz. The owner asked for just a small strip:
 * one coming-soon line, a SMALL Telegram button, and the ad —
 * the AdsterraAd slot below is unchanged, exactly as ordered.
 */
export default function BTSGlobalQuest(_props: BTSGlobalQuestProps = {}) {
  return (
    <div
      id="coming-soon-container"
      className="relative flex flex-col items-center bg-[#0a0518] text-white px-4 py-4 overflow-hidden rounded-3xl border border-purple-500/10"
    >
      <div className="w-full flex flex-wrap items-center justify-center sm:justify-between gap-3">
        <p className="text-sm text-purple-100/85 text-center sm:text-left">
          🎮 More updates coming soon — stay tuned! 💜
        </p>
        <a
          href="https://t.me/arirang_army7"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-[#0088cc] hover:from-purple-500 hover:to-[#22a4e3] text-white font-sans font-bold text-xs shadow-md shadow-purple-500/20 transition-all shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          Join Our Telegram
        </a>
      </div>

      <AdsterraAd type={8} />
    </div>
  );
}
