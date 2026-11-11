import { useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

interface TelegramPostEmbedProps {
  channel: string;
  postId: string;
  originalUrl: string;
}

/**
 * Renders a public Telegram post (with its video) using Telegram's
 * official embed widget. The widget script replaces itself with an
 * iframe that streams the video inline on the page. A plain link to
 * the post is always shown underneath, so if the widget is blocked
 * (private channel, network filter) the visitor still has a way to
 * watch — the section never dead-ends.
 */
export default function TelegramPostEmbed({ channel, postId, originalUrl }: TelegramPostEmbedProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = '';
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js';
    script.setAttribute('data-telegram-post', `${channel}/${postId}`);
    script.setAttribute('data-width', '100%');
    script.setAttribute('data-color', 'B26BFF');
    script.setAttribute('data-dark', '1');
    host.appendChild(script);
    return () => {
      host.innerHTML = '';
    };
  }, [channel, postId]);

  return (
    <div className="w-full bg-[#0d0817] px-3 py-4 sm:px-5">
      <div ref={hostRef} className="mx-auto w-full max-w-[560px] min-h-[300px]" />
      <p className="mx-auto mt-3 flex max-w-[560px] flex-wrap items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
        <Send className="h-3.5 w-3.5 text-sky-400" />
        <span>Video hosted on Telegram — press play inside the post above. If Telegram shows “Media is too big”, the file is larger than Telegram allows its web player to stream (a Telegram limit, not a site problem) — then</span>
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-sky-300 underline decoration-sky-500/40 underline-offset-2 hover:text-sky-200"
        >
          watch it on Telegram ↗
        </a>
      </p>
    </div>
  );
}
