import { useState } from 'react';
import { X } from 'lucide-react';

// Batch 79 — Announcement Bar: a slim notice strip above the
// header on every public page, controlled from Admin Panel →
// Dashboard. Stored as plain fields on the site config
// (announcementEnabled/Text/Link/LinkText/Color/Version).
// A visitor can dismiss it; the dismissal is keyed to the
// announcement's version number, so saving a NEW announcement
// in the panel shows the bar to everyone again. With the switch
// off or the text empty, this renders nothing at all.

const DISMISS_KEY = 'bg_announce_dismissed';
const BACKGROUNDS: Record<string, string> = {
  purple: 'linear-gradient(90deg,#7e22ce,#c026d3,#db2777)',
  pink: 'linear-gradient(90deg,#db2777,#f43f5e)',
  red: 'linear-gradient(90deg,#9f1239,#e11d48)'
};

export default function AnnouncementBar({ config }: { config: any }) {
  const [hidden, setHidden] = useState(false);

  if (!config || config.announcementEnabled !== true) return null;
  const text = String(config.announcementText || '').trim();
  if (!text) return null;

  const version = Number(config.announcementVersion || 1);
  let dismissed = false;
  try {
    dismissed = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10) >= version;
  } catch {
    dismissed = false;
  }
  if (hidden || dismissed) return null;

  const link = String(config.announcementLink || '').trim();
  const linkText = String(config.announcementLinkText || '').trim() || 'View';
  const background = BACKGROUNDS[String(config.announcementColor || 'purple')] || BACKGROUNDS.purple;
  const external =
    link.startsWith('http') && !link.includes('bangtangallery.online');

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(version));
    } catch {
      /* storage unavailable — the bar will simply reappear next visit */
    }
    setHidden(true);
  };

  return (
    <div
      className="relative z-30 w-full text-white"
      style={{ background }}
      role="region"
      aria-label="Announcement"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 px-8 py-2">
        <span className="text-[12px] leading-none shrink-0">📣</span>
        <p className="text-[12px] sm:text-[13px] font-bold leading-snug text-center truncate">
          {text}
        </p>
        {link && (
          <a
            href={link}
            {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
            className="shrink-0 text-[12px] sm:text-[13px] font-black underline underline-offset-2 decoration-white/70 hover:decoration-white whitespace-nowrap"
          >
            {linkText} →
          </a>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
