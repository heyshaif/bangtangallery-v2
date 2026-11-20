import { getYoutubeEmbedUrl } from '../components/youtubeUtils';

/**
 * Decodes HTML entities (e.g. &lt;iframe...&gt;) in case the user pasted
 * from a rich text editor or formatted code block.
 */
export function decodeHTMLEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&amp;/gi, '&');
}

/**
 * Extracts the primary media/stream URL from embed code or raw URL
 */
export function getStreamSourceUrl(codeOrUrl: string): string | null {
  if (!codeOrUrl) return null;
  const decoded = decodeHTMLEntities(codeOrUrl).trim();
  if (!decoded) return null;

  // If it's an iframe, extract src
  const srcMatch = decoded.match(/src=["']([^"']+)["']/i);
  if (srcMatch && srcMatch[1]) {
    return srcMatch[1];
  }

  // If it's already a URL
  if (/^https?:\/\//i.test(decoded)) {
    return decoded;
  }

  return null;
}

/**
 * Detects the stream type for clean badge display
 */
export function getEmbedTypeLabel(codeOrUrl: string): string {
  if (!codeOrUrl) return '';
  const decoded = decodeHTMLEntities(codeOrUrl).trim();

  if (decoded.includes('youtube.com/embed/live_stream') || decoded.includes('channel=UC3IZKseVpdzPSBaWxBxundA')) {
    return '🔴 YouTube Live Broadcast';
  }
  if (decoded.includes('youtube.com') || decoded.includes('youtu.be')) {
    return '▶ YouTube Video Stream';
  }
  if (decoded.includes('player.vdocipher.com') || decoded.includes('vdocipher')) {
    return '💜 VdoCipher Secure Live';
  }
  if (decoded.includes('twitch.tv')) {
    return '🟣 Twitch Interactive Stream';
  }
  if (decoded.includes('kick.com')) {
    return '🟢 Kick Stream';
  }
  if (decoded.includes('vdo.ninja') || decoded.includes('obs.ninja')) {
    return '🎥 OBS Studio WebRTC';
  }
  if (/\.m3u8($|\?)/i.test(decoded)) {
    return '📡 HLS Live Stream (.m3u8)';
  }
  if (/\.(mp4|webm|ogg|mov)($|\?)/i.test(decoded)) {
    return '📼 HTML5 Video File';
  }
  if (/<iframe\b/i.test(decoded)) {
    return '🎬 Custom Iframe Embed';
  }
  return '🌐 Universal Stream Player';
}

/**
 * Resolves a stream source to a single plain iframe src when the source
 * is URL-based (YouTube, Twitch, Kick, Facebook, Vimeo, a direct embed
 * URL, or a pasted iframe embed code). Returns null for raw script
 * widgets / custom HTML, which must go through the innerHTML path.
 * Rendering a real React <iframe> for the URL cases is more reliable
 * than injected markup: no HTML parsing surprises, and the browser
 * treats it exactly like a hand-written embed.
 */
export function resolveEmbedSrc(codeOrUrl: string): string | null {
  if (!codeOrUrl) return null;
  const html = getStreamEmbedHTML(codeOrUrl);
  if (!html || /<script/i.test(html)) return null;
  const m = html.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  return m && m[1] ? m[1] : null;
}

/**
 * Universal Embed Generator for ANY arbitrary live stream or video embed.
 * Handles:
 * - Any raw <iframe> embed code (OBS Studio, VDO.Ninja, Twitch, YouTube, Kick, Facebook, Vimeo, custom CDNs)
 * - HTML-encoded iframes (&lt;iframe ...&gt;)
 * - Nested or wrapped iframes (<div><iframe ...></iframe></div>)
 * - Direct video URLs (.mp4, .webm, .ogg, .mov)
 * - HLS streams (.m3u8)
 * - Platform URLs (YouTube, Twitch, Kick, Facebook, Vimeo)
 * - Custom streaming URLs (auto-wrapped in a responsive iframe with all required permissions)
 */
export function getStreamEmbedHTML(codeOrUrl: string): string {
  if (!codeOrUrl) return '';
  let trimmed = decodeHTMLEntities(codeOrUrl).trim();
  if (!trimmed) return '';

  // 1. Check if the input contains an <iframe> tag (regardless of wrapper tags, casing, or attributes)
  if (/<iframe\b/i.test(trimmed)) {
    let processed = trimmed;

    // Ensure closing </iframe> tag exists if omitted
    if (!/<\/iframe>/i.test(processed)) {
      processed += '</iframe>';
    }

    // Check if it's twitch embed and needs current hostname in parent
    const hostname = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
    if (processed.includes('player.twitch.tv')) {
      if (!processed.includes('&parent=')) {
        processed = processed.replace(/(src=["'][^"']*)(["'])/i, `$1&parent=${hostname}$2`);
      } else if (!processed.includes(`parent=${hostname}`)) {
        processed = processed.replace(/(src=["'][^"']*)(["'])/i, `$1&parent=${hostname}$2`);
      }
    }

    // Replace <iframe ...> to ensure responsive absolute filling and all modern streaming permissions
    processed = processed.replace(/<iframe\b([^>]*)>/gi, (_match, attrs) => {
      // Strip fixed width, height, inline style, and frameborder
      let cleanAttrs = attrs
        .replace(/\bwidth=["'][^"']*["']/gi, '')
        .replace(/\bheight=["'][^"']*["']/gi, '')
        .replace(/\bstyle=["'][^"']*["']/gi, '')
        .replace(/\bframeborder=["'][^"']*["']/gi, '');

      // Combine existing allow with all essential streaming permissions
      const streamPermissions = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share; camera; microphone; display-capture';
      if (/allow=["'][^"']*["']/i.test(cleanAttrs)) {
        cleanAttrs = cleanAttrs.replace(/allow=["']([^"']*)["']/i, (_m: string, existing: string) => {
          return `allow="${existing}; ${streamPermissions}"`;
        });
      } else {
        cleanAttrs += ` allow="${streamPermissions}"`;
      }

      if (!/allowfullscreen/i.test(cleanAttrs)) {
        cleanAttrs += ' allowfullscreen="true"';
      }

      return `<iframe ${cleanAttrs.trim()} width="100%" height="100%" style="position: absolute; top: 0; left: 0; width: 100% !important; height: 100% !important; border: 0 !important; outline: none !important;">`;
    });

    return processed;
  }

  // 2. Direct video file (mp4, webm, ogg, mov)
  if (/\.(mp4|webm|ogg|mov)($|\?)/i.test(trimmed)) {
    return `<video src="${trimmed}" controls autoplay playsinline style="position: absolute; top: 0; left: 0; width: 100% !important; height: 100% !important; object-fit: contain; background: #000; border: none;"></video>`;
  }

  // 3. Raw script tags (custom video embed widgets)
  if (trimmed.includes('<script')) {
    return trimmed;
  }

  // 4. Raw URL provided: detect provider or use universal embed
  let srcUrl = trimmed;

  // 4a. YouTube URL (watch, shorts, /live/, youtu.be, embed, channel, handle)
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    srcUrl = getYoutubeEmbedUrl(trimmed);
    if (!srcUrl.includes('?')) {
      srcUrl += '?rel=0&enablejsapi=1';
    }
  }
  // 4b. Twitch channel or stream URL
  else if (trimmed.includes('twitch.tv')) {
    const channelMatch = trimmed.match(/twitch\.tv\/([a-zA-Z0-9_\-]+)/);
    if (channelMatch && channelMatch[1] && !trimmed.includes('player.twitch.tv')) {
      const hostname = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
      srcUrl = `https://player.twitch.tv/?channel=${channelMatch[1]}&parent=${hostname}&autoplay=true`;
    }
  }
  // 4c. Kick channel URL
  else if (trimmed.includes('kick.com')) {
    const kickMatch = trimmed.match(/kick\.com\/([a-zA-Z0-9_\-]+)/);
    if (kickMatch && kickMatch[1] && !trimmed.includes('player.kick.com')) {
      srcUrl = `https://player.kick.com/${kickMatch[1]}`;
    }
  }
  // 4d. Facebook video URL
  else if (trimmed.includes('facebook.com') && !trimmed.includes('plugins/video.php')) {
    srcUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmed)}&show_text=false&autoplay=true`;
  }
  // 4e. Vimeo video URL
  else if (trimmed.includes('vimeo.com') && !trimmed.includes('player.vimeo.com')) {
    const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/);
    if (vimeoMatch && vimeoMatch[3]) {
      srcUrl = `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`;
    }
  }

  // Universal responsive iframe container for ANY arbitrary stream URL
  return `<iframe src="${srcUrl}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share; camera; microphone; display-capture" allowfullscreen="true" style="position: absolute; top: 0; left: 0; width: 100% !important; height: 100% !important; border: 0 !important; outline: none !important;"></iframe>`;
}
