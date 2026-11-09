/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Member {
  id: string; // e.g. "rm", "jin"
  name: string;
  fullName: string;
  portraitUrl: string;
  bannerUrl: string;
  cardCoverUrl?: string;
  biography: string;
  birthday: string;
  age: number;
  height: string;
  bloodGroup: string;
  mbti: string;
  position: string[];
  emoji: string;
  funFacts: string[];
  soloActivities: string[];
  discography: string[];
  awards: string[];
  gallery: string[];
  videoIds: string[]; // Youtube Video IDs
  quotes: string[];
  timeline: {
    year: string;
    event: string;
  }[];
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  spotifyUrl?: string;
  weverseUrl?: string;
  weversePicUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  introductionText?: string;
  description?: string;
}

export interface Track {
  id?: string;
  title: string;
  duration: string;
  lyrics?: string;
  audioUrl?: string;
  hidden?: boolean;
  artist?: string;
  albumName?: string;
  coverUrl?: string;
  description?: string;
  genre?: string;
  releaseDate?: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  appleMusicUrl?: string;
  soundCloudUrl?: string;
  customExternalUrl?: string;
  isSpotlight?: boolean;
  isPinned?: boolean;
}

export interface Album {
  id: string;
  title: string;
  type: 'album' | 'single' | 'solo' | 'group_song';
  coverUrl: string;
  releaseDate: string;
  description: string;
  tracks: Track[];
  spotifyEmbed: string; // Embed source url
  appleMusicEmbed: string; // Embed source url
  youtubeEmbed: string; // Embed video url
  relatedVideos: { title: string; videoId: string }[];
  gallery: string[];
}

export interface Video {
  id: string;
  videoId: string; // Youtube standard 11 charter code
  title: string;
  description: string;
  playlist: string;
  category: 'MV' | 'Live Performance' | 'Variety' | 'Festa' | 'Documentary';
  uploadedAt: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  title: string;
  category: 'BTS' | 'RM' | 'Jin' | 'SUGA' | 'j-hope' | 'Jimin' | 'V' | 'Jung Kook' | 'Concert' | 'Festa' | 'Fan Art' | 'Memes';
}

export interface TimelineEvent {
  year: string;
  date: string;
  title: string;
  description: string;
  category: 'Debut' | 'Albums' | 'Awards' | 'Tours' | 'Military' | 'Solo Era' | 'Comebacks';
}

export interface ArticleLink {
  id?: string;
  label: string;
  url: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  category: 'Announcement' | 'Comeback' | 'Schedule' | 'Award' | 'Festa';
  imageUrl: string;
  slug?: string;
  tags?: string[];
  seoDescription?: string;
  featuredImage?: string;
  published?: boolean;
  gallery?: string[];
  links?: ArticleLink[];
}

export interface DownloadItem {
  id: string;
  name: string;
  type: 'Wallpaper' | 'Icon' | 'Photo' | 'Logo' | 'PDF' | 'ZIP';
  url: string;
  size: string;
}

export interface FanArt {
  id: string;
  imageUrl: string;
  title: string;
  artist: string;
  likes: number;
  userLiked?: boolean;
}

export interface BTSEvent {
  id: string;
  title: string;
  type: 'Upcoming' | 'Past';
  date: string; // ISO or human format
  time: string;
  location: string;
  details: string;
  countdownTarget?: string; // For calculations
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system' | 'arirang';
  accentColor: 'indigo' | 'purple' | 'crimson' | 'violet' | 'amber';
  animationsEnabled: boolean;
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  language: 'EN' | 'KR' | 'JP';
}

export interface VotingEvent {
  id: string;
  title: string;
  description: string;
  platform: string;
  coverUrl: string;
  voteNowUrl: string;
  startDate: string;
  endDate: string;
  status: 'published' | 'unpublished';
  isPinned?: boolean;
  isFeatured?: boolean;
  order?: number;
}

export interface VotingSubmission {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  voteNowUrl: string;
  platform: string;
  startDate: string;
  endDate: string;
  caption?: string;
  additionalInfo?: string;
  submittedBy: string;
  submittedAt: string;
  editedAt?: string;
  status: 'pending' | 'approved' | 'rejected';
  isPinned?: boolean;
  isFeatured?: boolean;
}

export interface SpotifyEmbed {
  id: string;
  title: string;
  badge: string;
  url: string;
  color: string;
  order: number;
}

export interface ConcertReplay {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription?: string;
  partNumber?: string;
  location?: string;
  date?: string;
  category?: string;
  tags?: string[];
  coverUrl: string;
  coverAltText?: string;
  videoUrl: string;
  videoStorageRef?: string;
  videoFileName?: string;
  videoFileSize?: string;
  videoDuration?: string;
  videoQuality?: '4K' | '1080p' | '720p';
  watchNowEnabled?: boolean;
  watchNowText?: string;
  videoPosterUrl?: string;
  downloadEnabled?: boolean;
  downloadText?: string;
  telegramDownloadUrl: string;
  seoTitle?: string;
  seoDescription?: string;
  socialShareImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCardImage?: string;
  published: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
}

export interface MusicSubmission {
  id: string;
  youtubeUrl: string;
  title: string;
  thumbnailUrl: string;
  artist?: string;
  album?: string;
  submittedBy?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface VideoSubmission {
  id: string;
  youtubeUrl: string;
  title: string;
  thumbnailUrl: string;
  category?: string;
  description?: string;
  submittedBy?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

