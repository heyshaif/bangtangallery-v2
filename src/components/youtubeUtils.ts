export function getYoutubeEmbedUrl(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  
  // 1. Check if it's a full iframe tag
  if (trimmed.startsWith('<iframe') || trimmed.includes('<iframe')) {
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      return getYoutubeEmbedUrl(srcMatch[1]);
    }
  }

  // 1b. Detect YouTube Channel Live URL (e.g. youtube.com/channel/CHANNEL_ID/live or youtube.com/channel/CHANNEL_ID)
  const channelMatch = trimmed.match(/youtube\.com\/channel\/([a-zA-Z0-9_\-]+)/i);
  if (channelMatch && channelMatch[1]) {
    return `https://www.youtube.com/embed/live_stream?channel=${channelMatch[1]}`;
  }

  // 1c. Detect YouTube Handle Live URL (e.g. youtube.com/@BANGTANTV/live)
  const handleMatch = trimmed.match(/youtube\.com\/@([a-zA-Z0-9_\-]+)/i);
  if (handleMatch && handleMatch[1]) {
    if (handleMatch[1].toLowerCase() === 'bangtantv') {
      return `https://www.youtube.com/embed/live_stream?channel=UC3IZKseVpdzPSBaWxBxundA`;
    }
    return `https://www.youtube.com/embed?listType=user_uploads&list=${handleMatch[1]}`;
  }

  // 1d. Detect YouTube Live URL (e.g. youtube.com/live/VIDEO_ID)
  if (trimmed.includes('youtube.com/live/') || trimmed.includes('/live/')) {
    const liveMatch = trimmed.match(/\/live\/([a-zA-Z0-9_\-]+)/);
    const videoId = liveMatch ? liveMatch[1] : '';
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
  }

  // 2. Detect YouTube Playlist
  if (trimmed.includes('list=')) {
    const listMatch = trimmed.match(/[&?]list=([a-zA-Z0-9_\-]+)/);
    const playlistId = listMatch ? listMatch[1] : '';
    if (playlistId) {
      return `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
    }
  }

  // 3. Detect YouTube Shorts
  if (trimmed.includes('youtube.com/shorts/') || trimmed.includes('/shorts/')) {
    const shortsIdMatch = trimmed.match(/\/shorts\/([a-zA-Z0-9_\-]+)/);
    const videoId = shortsIdMatch ? shortsIdMatch[1] : '';
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  // 4. Check if it's already an embed URL
  if (trimmed.includes('youtube.com/embed/')) {
    return trimmed;
  }
  
  // 5. Check if it's a short youtube link
  if (trimmed.includes('youtu.be/')) {
    const parts = trimmed.split('youtu.be/');
    const idWithParams = parts[parts.length - 1];
    const id = idWithParams.split('?')[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  
  // 6. Check if it's a watch url
  if (trimmed.includes('watch?v=')) {
    const parts = trimmed.split('watch?v=');
    const idWithParams = parts[parts.length - 1];
    const id = idWithParams.split('&')[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  
  // 7. If it's a pure video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return `https://www.youtube.com/embed/${trimmed}`;
  }
  
  return trimmed;
}

export function getYoutubeVideoId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  
  // 1. If it's a full iframe
  if (trimmed.startsWith('<iframe')) {
    const srcMatch = trimmed.match(/src="([^"]+)"/);
    if (srcMatch && srcMatch[1]) {
      return getYoutubeVideoId(srcMatch[1]);
    }
  }

  // 1b. Playlist support (use playlistId as base)
  if (trimmed.includes('list=')) {
    const listMatch = trimmed.match(/[&?]list=([a-zA-Z0-9_\-]+)/);
    if (listMatch) return listMatch[1];
  }

  // 1c. Shorts support
  if (trimmed.includes('/shorts/')) {
    const shortsMatch = trimmed.match(/\/shorts\/([a-zA-Z0-9_\-]+)/);
    if (shortsMatch) return shortsMatch[1];
  }
  
  // 2. From embed URL
  if (trimmed.includes('youtube.com/embed/')) {
    const parts = trimmed.split('youtube.com/embed/');
    return parts[parts.length - 1].split('?')[0];
  }
  
  // 3. Short URL
  if (trimmed.includes('youtu.be/')) {
    return trimmed.split('youtu.be/')[1].split('?')[0];
  }
  
  // 4. Watch URL
  if (trimmed.includes('watch?v=')) {
    return trimmed.split('watch?v=')[1].split('&')[0];
  }
  
  // 5. Pure ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  
  return '';
}
