/**
 * Telegram public-post embed support.
 *
 * Telegram only offers inline playback for posts from PUBLIC channels /
 * groups, through its official widget (telegram.org/js/telegram-widget.js
 * with data-telegram-post="<channel>/<postId>"). There is no direct file
 * URL for a Telegram video without the Bot API, so the official widget is
 * the supported way to play a Telegram video inside the website.
 *
 * Accepts links like:
 *   https://t.me/arirang_army7/123
 *   https://t.me/s/arirang_army7/123   (preview-style link)
 *   telegram.me/arirang_army7/123?single
 * Private links (t.me/c/...), invite links (t.me/+...) and joinchat
 * links cannot be embedded and return null.
 */
export interface TelegramPostRef {
  channel: string;
  postId: string;
}

const NON_POST_CHANNELS = new Set(['joinchat', 'c', 's', 'share', 'proxy', 'addstickers', 'addemoji']);

export function parseTelegramPost(url: string | undefined | null): TelegramPostRef | null {
  if (!url) return null;
  const m = String(url).trim().match(/(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/(?:s\/)?([A-Za-z0-9_]{3,})\/(\d+)/i);
  if (!m) return null;
  const channel = m[1];
  if (NON_POST_CHANNELS.has(channel.toLowerCase())) return null;
  return { channel, postId: m[2] };
}

export function isTelegramPostUrl(url: string | undefined | null): boolean {
  return parseTelegramPost(url) !== null;
}
