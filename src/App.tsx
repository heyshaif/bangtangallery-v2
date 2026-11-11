/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Component, type ReactNode } from 'react';
import { UserPreferences, Member, Album, Video, GalleryItem, TimelineEvent, NewsArticle } from './types';
import { MEMBERS, ALBUMS, VIDEOS, GALLERY_ITEMS, TIMELINE_EVENTS, NEWS_ARTICLES, DOWNLOADS, FAN_ARTS, EVENTS, FAQS } from './data/btsData';

// Component imports
import AuroraBackground from './components/AuroraBackground';
import TourCountdownCarousel from './components/TourCountdownCarousel';
import ThemeCustomizerPanel from './components/ThemeCustomizerPanel';
import { ThemeCustomProvider } from './context/ThemeContext';
import WelcomePopup from './components/WelcomePopup';
import AdsterraAd from './components/AdsterraAd';

// Lazy-loaded tab sections: each page's code is downloaded only when the
// visitor opens that tab, which keeps the first load fast and lag-free.
const MemberProfileDetail = React.lazy(() => import('./components/MemberProfileDetail'));
const MusicSection = React.lazy(() => import('./components/MusicSection'));
const YouTubeClone = React.lazy(() => import('./components/YouTubeClone'));
const GallerySection = React.lazy(() => import('./components/GallerySection'));
const TimelineSection = React.lazy(() => import('./components/TimelineSection'));
const NewsSection = React.lazy(() => import('./components/NewsSection'));
const DownloadsSection = React.lazy(() => import('./components/DownloadsSection'));
const EventsSection = React.lazy(() => import('./components/EventsSection'));
const FAQSection = React.lazy(() => import('./components/FAQSection'));
const DictionarySection = React.lazy(() => import('./components/DictionarySection'));
const PrivacyPolicy = React.lazy(() => import('./components/PrivacyPolicy')); // Batch 120
const ContactSection = React.lazy(() => import('./components/ContactSection'));
const FeedbackSection = React.lazy(() => import('./components/FeedbackSection'));
const SettingsSection = React.lazy(() => import('./components/SettingsSection'));
const GamesHub = React.lazy(() => import('./components/GamesHub'));
const LiveStreamSection = React.lazy(() => import('./components/LiveStreamSection'));
const VotingCenterSection = React.lazy(() => import('./components/VotingCenterSection'));
const RecentConcertReplay = React.lazy(() => import('./components/RecentConcertReplay'));

// New Premium Landing Page Components
import Preloader from './components/Preloader';
import InteractiveMediaWall from './components/InteractiveMediaWall';
import SupportersWall from './components/SupportersWall';
import BTSQuotesCarousel from './components/BTSQuotesCarousel';
import TrendingCarousel from './components/TrendingCarousel';
import InteractiveCategories from './components/InteractiveCategories';
import HomeFeed from './components/HomeFeed';
const GeneratePicStudio = React.lazy(() => import('./components/GeneratePicStudio'));
import { DisclaimerPopup } from './components/DisclaimerPopup';
import { motion, AnimatePresence } from 'motion/react';

// Lucide Icons
import {
  Home, Users, UserRound, Music, Video as VideoIcon, Image as ImageIcon, Clock, BookOpen, Gift, Calendar, Download,
  Heart, HelpCircle, Mail, Settings as SettingsIcon, Menu, X, Search, Globe, Cloud, Sun, Moon,
  CheckCircle, Palette, MessageSquareHeart, Flame, ArrowUp, Zap, UserCheck, Smile, Gamepad2,
  Instagram, Twitter, Youtube, Coffee, Github, Linkedin, Facebook, Send, MoreHorizontal, Pin, Wand2, Lock,
  Radio, Vote, Disc, Ticket, BookMarked
} from 'lucide-react';
import { AudioPlayerProvider, useAudioPlayer } from './context/AudioPlayerContext';
import GlobalMiniPlayer from './components/GlobalMiniPlayer';
import LyricsViewer from './components/LyricsViewer';
import BirthdayCountdown from './components/BirthdayCountdown';
import BirthdayWish from './components/BirthdayWish';
import InstallApp from './components/InstallApp';
import DaysWithBTS from './components/DaysWithBTS';
import ArmyWorldMap from './components/ArmyWorldMap';
import ConcertMode from './components/ConcertMode';
import AnnouncementBar from './components/AnnouncementBar';
import ArmyBombPlayer from './components/ArmyBombPlayer';
import ProfilePanel from './components/ProfilePanel';
import { getProfile, PROFILE_EVENT } from './utils/profile';

const getSpotifyEmbedUrl = (input: string): string | null => {
  if (!input) return null;
  let url = input.trim();
  // Extract src attribute if a full iframe tag was pasted
  if (url.startsWith('<iframe') || url.includes('src=')) {
    const match = url.match(/src=["']([^"']+)["']/);
    if (match && match[1]) {
      url = match[1];
    }
  }
  if (url.includes('/embed/')) return url;
  return url.replace('open.spotify.com/', 'open.spotify.com/embed/');
};

const DEFAULT_SPOTIFY_EMBEDS = [
  {
    id: 'embed-1',
    title: 'Feature Album',
    badge: 'Spotify Spotlight',
    url: 'https://open.spotify.com/embed/artist/3Nrfpe0tUJi4K4DXYWgMUX?utm_source=generator&si=924699b6fe4b4990',
    color: 'purple',
    order: 0
  },
  {
    id: 'embed-2',
    title: 'Top Album',
    badge: 'ARMY Favorites',
    url: 'https://open.spotify.com/embed/album/6al2VdKbb6FIz9d7lU7WRB?utm_source=generator&si=9b24661928a24909',
    color: 'pink',
    order: 1
  }
];

// Safety net: if any single section ever throws while rendering, show a
// small retry card instead of unmounting the whole app into a black page.
class SectionErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.error('Section failed to render:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-slate-300">This section couldn't load.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Tap to retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AppContent() {
  const audioPlayer = useAudioPlayer();
  
  // Dynamic Web Publisher Configuration (Admin CMS Integration)
  const [publishedConfig, setPublishedConfig] = useState<any>(null);
  // The Admin Panel is NOT part of the public website anymore. It ships
  // as a separate app (admin.html — bangtangallery.online/admin) that
  // connects to the same Firebase backend. The hidden 3-tap copyright
  // entry and the /admin + #admin triggers that used to open it here
  // have been removed.

  const sanitizeConfig = (config: any) => {
    if (!config) return config;
    const arrKeys = ['showcase', 'trending', 'timeline', 'faqs', 'gallery', 'events', 'downloads', 'news', 'members', 'albums', 'videos', 'digitalTracks', 'playlists', 'musicSubmissions', 'eras', 'votingEvents', 'votingSubmissions', 'newsRelatedTopics', 'spotifyEmbeds'];
    const sanitized = { ...config };
    for (const key of arrKeys) {
      if (sanitized[key]) {
        if (!Array.isArray(sanitized[key])) {
          if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
            if (Array.isArray(sanitized[key]['null'])) {
              sanitized[key] = sanitized[key]['null'];
            } else {
              const values = Object.values(sanitized[key]);
              const foundArray = values.find(v => Array.isArray(v));
              if (foundArray) {
                sanitized[key] = foundArray;
              } else {
                sanitized[key] = values;
              }
            }
          } else {
            sanitized[key] = [];
          }
        }
      } else {
        sanitized[key] = [];
      }

      // Restore client defaults if empty
      if (sanitized[key].length === 0) {
        if (key === 'members') sanitized[key] = MEMBERS;
        else if (key === 'albums') sanitized[key] = ALBUMS;
        else if (key === 'videos') sanitized[key] = VIDEOS;
        else if (key === 'gallery') sanitized[key] = GALLERY_ITEMS;
        else if (key === 'timeline') sanitized[key] = TIMELINE_EVENTS;
        else if (key === 'news') sanitized[key] = NEWS_ARTICLES;
        else if (key === 'downloads') sanitized[key] = DOWNLOADS;
        else if (key === 'events') sanitized[key] = EVENTS;
        else if (key === 'faqs') sanitized[key] = FAQS;
        else if (key === 'spotifyEmbeds') sanitized[key] = DEFAULT_SPOTIFY_EMBEDS;
      }
    }
    return sanitized;
  };

  const fetchPublishedConfig = () => {
    fetch('/api/config/published')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then(data => {
        const cleanData = sanitizeConfig(data);
        setPublishedConfig(cleanData);
        if (cleanData.theme?.accentColor) {
          setPreferences((prev: any) => ({
            ...prev,
            accentColor: cleanData.theme.accentColor
          }));
        }
      })
      .catch((err) => {
        console.warn('Failed to load published portal config, falling back to offline defaults.', err);
      });
  };

  useEffect(() => {
    fetchPublishedConfig();
    const interval = setInterval(fetchPublishedConfig, 60000); // Batch 148: was 4s — the controller cache serves 5-min TTL anyway, so fast polling only wasted cycles
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Update browser tab Title and Favicon dynamically based on CMS config
  useEffect(() => {
    if (publishedConfig?.seo) {
      if (publishedConfig.seo.metaTitle) {
        document.title = publishedConfig.seo.metaTitle;
      }
      if (publishedConfig.seo.faviconUrl) {
        let link: HTMLLinkElement | null = document.querySelector("link[id='app-favicon']");
        if (!link) {
          link = document.querySelector("link[rel~='icon']");
        }
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          link.id = 'app-favicon';
          document.head.appendChild(link);
        }
        link.href = publishedConfig.seo.faviconUrl;
      }
    }
  }, [publishedConfig]);

  // Check if we are in embed mode
  const checkIsEmbedMode = () => {
    return window.location.search.includes('embed=') || 
           window.location.search.includes('live=') ||
           window.location.pathname.includes('/embed') ||
           window.location.pathname.includes('/live-embed') ||
           window.location.hash.includes('embed') ||
           (window.self !== window.top && !window.location.hostname.includes('ais-dev-') && !window.location.hostname.includes('ais-pre-'));
  };

  const checkIsPlayerOnlyEmbed = () => {
    return window.location.search.includes('embed=player') || 
           window.location.search.includes('player=true') ||
           window.location.pathname.includes('/embed-player') ||
           window.location.pathname.includes('/player-embed');
  };

  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<string>(() => checkIsEmbedMode() ? 'Live Stream' : 'Home');
  // Batch 122: remember the tab a visitor was on before opening
  // the Privacy Policy, so its Back button returns there (the FAQ
  // page is the fallback — that is where the Privacy link lives).
  const prevTabRef = React.useRef<string>('FAQ');
  React.useEffect(() => {
    if (activeTab !== 'Privacy Policy') prevTabRef.current = activeTab;
  }, [activeTab]);
  // Visitor profile (Batch 94): header button + panel; the tick
  // re-renders the header avatar whenever the profile changes.
  const [profileOpen, setProfileOpen] = useState(false);
  const [, setProfileTick] = useState(0);
  useEffect(() => {
    const bump = () => setProfileTick((t) => t + 1);
    window.addEventListener(PROFILE_EVENT, bump);
    return () => window.removeEventListener(PROFILE_EVENT, bump);
  }, []);
  const [concertModeOpen, setConcertModeOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  // Routing-bound sub-states
  const [selectedNewsSlug, setSelectedNewsSlug] = useState<string | null>(null);
  const [initialGalleryCategory, setInitialGalleryCategory] = useState<string>('All');
  const [targetUsername, setTargetUsername] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  // Batch 77: the intro (flash) screen shows only ONCE PER DAY per
  // visitor; the day stamp is written when it completes or is skipped.
  const [introLoading, setIntroLoading] = useState(() => {
    if (checkIsEmbedMode()) return false;
    try {
      return localStorage.getItem('bg_preloader_day') !== new Date().toDateString();
    } catch {
      return true;
    }
  });
  const completeIntro = () => {
    try {
      localStorage.setItem('bg_preloader_day', new Date().toDateString());
    } catch {
      /* storage unavailable — intro will simply show again next visit */
    }
    setIntroLoading(false);
  };

  // Global search keywords & suggestions states
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Time & Weather States
  const [currentTime, setCurrentTime] = useState('');

  const [seoulTemp, setSeoulTemp] = useState('22.4°C');
  const [seoulWeather, setSeoulWeather] = useState('Nebula Breezes');

  // Typing effect on Hero
  const [typedText, setTypedText] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const typingPhrases = publishedConfig?.home?.typingPhrases || [
    'We had only seven. But we have you all now. 💜',
    'Living without passion is like being dead. 🐰',
    'Speak yourself. Find your name. Find your voice. 🐨',
    'I purple you for an eternity. Borahae! 🐯'
  ];
  const [phraseIdx, setPhraseIdx] = useState(0);

  // User personalization variables stored locally
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('bts_gallery_preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      theme: 'arirang', // Batch 113: ARIRANG is the default for new visitors (owner's choice); a saved preference always wins
      accentColor: 'purple',
      animationsEnabled: true,
      fontSize: 'base',
      language: 'EN'
    };
  });

  const [isAmbientActive, setIsAmbientActive] = useState<boolean>(() => {
    return localStorage.getItem('bts_ambient_bg_active') !== 'false';
  });

  // Disclaimer popup states and events
  const [disclaimerActive, setDisclaimerActive] = useState(false);
  const [previewDisclaimer, setPreviewDisclaimer] = useState<any>(null);

  // Auto trigger disclaimer when publishedConfig successfully loads.
  // Owner rule (Batch 86, supersedes the old every-visit rule): a new
  // visitor MUST see the disclaimer; after that it shows only ONCE
  // PER DAY per visitor (localStorage day stamp, same pattern as the
  // Batch 77 preloader gate). The stamp is written when the popup
  // closes (Got it / × / auto-dismiss), so a visitor who has not
  // actually seen it keeps getting it. The admin preview event below
  // is NOT gated — previews always show.
  const disclaimerShownRef = useRef(false);
  useEffect(() => {
    if (publishedConfig?.disclaimer?.enabled && !disclaimerShownRef.current) {
      let seenToday = false;
      try {
        const now = new Date();
        const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        seenToday = localStorage.getItem('bg_disclaimer_day') === today;
      } catch {
        /* storage unavailable — show it (must-show wins) */
      }
      if (seenToday) return;
      disclaimerShownRef.current = true;
      setDisclaimerActive(true);
    }
  }, [publishedConfig]);

  // Handle preview and live update trigger
  useEffect(() => {
    const handlePreview = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setPreviewDisclaimer(customEvent.detail);
        setDisclaimerActive(true);
      }
    };
    window.addEventListener('bts-preview-disclaimer', handlePreview);
    return () => {
      window.removeEventListener('bts-preview-disclaimer', handlePreview);
    };
  }, []);

  // Bidirectional routing and popstate sync
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const parts = path.split('/').filter(Boolean);
      
      if (parts.length === 0 || parts[0] === 'home') {
        setActiveTab('Home');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(null);
      } else if (parts[0] === 'news') {
        setActiveTab('News');
        setSelectedMember(null);
        if (parts.length > 1) {
          setSelectedNewsSlug(parts[1]);
        } else {
          setSelectedNewsSlug(null);
        }
        setTargetUsername(null);
      } else if (parts[0] === 'gallery') {
        setActiveTab('Gallery');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        if (parts.length > 1) {
          const memberSlug = parts[1].toLowerCase();
          const membersMap: Record<string, string> = {
            'rm': 'RM', 'namjoon': 'RM',
            'jin': 'Jin', 'seokjin': 'Jin',
            'suga': 'SUGA', 'yoongi': 'SUGA', 'agust-d': 'SUGA',
            'j-hope': 'j-hope', 'hobi': 'j-hope', 'hoseok': 'j-hope',
            'jimin': 'Jimin',
            'v': 'V', 'taehyung': 'V', 'tae': 'V',
            'jungkook': 'Jung Kook', 'jk': 'Jung Kook',
            'concert': 'Concert', 'festa': 'Festa'
          };
          setInitialGalleryCategory(membersMap[memberSlug] || 'All');
        } else {
          setInitialGalleryCategory('All');
        }
        setTargetUsername(null);
      } else if (parts[0] === 'music') {
        setActiveTab('Music');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(null);
      } else if (parts[0] === 'videos') {
        setActiveTab('Videos');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(null);
      } else if (parts[0] === 'arirang_concert_reply' || parts[0] === 'concert' || parts[0] === 'concerts' || parts[0] === 'concert-replay') {
        setActiveTab('Concert');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(null);
      } else if (parts[0] === 'community') {
        setActiveTab('Voting Center');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(null);
      } else if (parts[0] === 'events') {
        setActiveTab('Events');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(null);
      } else if (parts[0] === 'timeline') {
        setActiveTab('Timeline');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(null);
      } else if (parts[0] === 'memes') {
        // The standalone Memes page was removed: memes now live in the
        // Gallery under its 'Memes' category filter.
        setActiveTab('Gallery');
        setInitialGalleryCategory('Memes');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(null);
      } else if (parts[0] === 'download' || parts[0] === 'downloads') {
        setActiveTab('Downloads');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(null);
      } else if (parts[0] === 'faq' || parts[0] === 'faqs') {
        setActiveTab('FAQ');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(null);
      } else if (parts[0] === 'privacy') {
        setActiveTab('Privacy Policy');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(null);
      } else if (parts[0] === 'dictionary') {
        setActiveTab('ARMY Dictionary');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(null);
      } else if (parts[0] === 'contact') {
        setActiveTab('Contact');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(null);
      } else if (parts[0] === 'feedback') {
        setActiveTab('Feedback');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(null);
      } else if (parts[0] === 'setting' || parts[0] === 'settings') {
        setActiveTab('Settings');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(null);
      } else if (parts[0] === 'profile' && parts.length > 1) {
        setActiveTab('Play Game');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(parts[1]);
      } else if (parts[0] === 'game') {
        setActiveTab('Play Game');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(null);
      } else if (parts[0] === 'livestream' || parts[0] === 'live-stream' || parts[0] === 'live') {
        setActiveTab('Live Stream');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(null);
      } else if (parts[0] === 'generatepic' || parts[0] === 'generate-pic' || parts[0] === 'generate') {
        setActiveTab('Generate Pic');
        setSelectedMember(null);
        setSelectedNewsSlug(null);
        setTargetUsername(null);
      } else if (parts[0] === 'members') {
        setActiveTab('Members');
        setSelectedNewsSlug(null);
        setTargetUsername(null);
        if (parts.length > 1) {
          const rawSlug = decodeURIComponent(parts[1] || '').toLowerCase().trim();
          const cleanSlug = rawSlug.replace(/[\s-_%20]+/g, '');
          const found = (publishedConfig?.members || MEMBERS).find((m: any) => {
            const mName = (m.name || '').toLowerCase();
            const mId = (m.id || '').toLowerCase();
            const mCleanName = mName.replace(/[\s-_]+/g, '');
            const mCleanId = mId.replace(/[\s-_]+/g, '');
            return (
              mName === rawSlug ||
              mId === rawSlug ||
              mCleanName === cleanSlug ||
              mCleanId === cleanSlug ||
              (cleanSlug === 'jungkook' && (mId === 'jungkook' || mCleanName === 'jungkook')) ||
              (cleanSlug === 'jk' && mId === 'jungkook')
            );
          });
          if (found) {
            setSelectedMember(found);
          } else {
            setSelectedMember(null);
          }
        } else {
          setSelectedMember(null);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState(); // run initial sync on load
    return () => window.removeEventListener('popstate', handlePopState);
  }, [publishedConfig]);

  // Push state to browser window location bar on state changes
  useEffect(() => {
    let targetPath = '/';
    
    if (activeTab === 'Home') {
      targetPath = '/';
    } else if (activeTab === 'News') {
      if (selectedNewsSlug) {
        targetPath = `/news/${selectedNewsSlug}`;
      } else {
        targetPath = '/news';
      }
    } else if (activeTab === 'Gallery') {
      if (initialGalleryCategory && initialGalleryCategory !== 'All') {
        targetPath = `/gallery/${initialGalleryCategory.toLowerCase()}`;
      } else {
        targetPath = '/gallery';
      }
    } else if (activeTab === 'Music') {
      targetPath = '/music';
    } else if (activeTab === 'Videos') {
      targetPath = '/videos';
    } else if (activeTab === 'Concert') {
      targetPath = '/arirang_concert_reply';
    } else if (activeTab === 'Live Stream') {
      targetPath = '/livestream';
    } else if (activeTab === 'Generate Pic') {
      targetPath = '/GeneratePic';
    } else if (activeTab === 'Voting Center') {
      targetPath = '/community';
    } else if (activeTab === 'Events') {
      targetPath = '/events';
    } else if (activeTab === 'Timeline') {
      targetPath = '/timeline';
    } else if (activeTab === 'Downloads') {
      targetPath = '/download';
    } else if (activeTab === 'FAQ') {
      targetPath = '/faq';
    } else if (activeTab === 'ARMY Dictionary') {
      targetPath = '/dictionary';
    } else if (activeTab === 'Privacy Policy') {
      targetPath = '/privacy';
    } else if (activeTab === 'Contact') {
      targetPath = '/contact';
    } else if (activeTab === 'Feedback') {
      targetPath = '/feedback';
    } else if (activeTab === 'Settings') {
      targetPath = '/setting';
    } else if (activeTab === 'Members') {
      if (selectedMember) {
        const slug = (selectedMember.id || selectedMember.name.replace(/\s+/g, '')).toLowerCase();
        targetPath = `/members/${slug}`;
      } else {
        targetPath = '/members';
      }
    } else if (activeTab === 'Play Game') {
      if (targetUsername) {
        targetPath = `/profile/${targetUsername}`;
      } else {
        targetPath = '/game';
      }
    }
    
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  }, [activeTab, selectedNewsSlug, initialGalleryCategory, selectedMember, targetUsername]);

  const handleDisclaimerClose = () => {
    setDisclaimerActive(false);
    if (previewDisclaimer) {
      setPreviewDisclaimer(null);
    } else {
      // Batch 86: the real disclaimer was seen — stamp the day so it
      // does not show again until tomorrow.
      try {
        const now = new Date();
        localStorage.setItem(
          'bg_disclaimer_day',
          `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
        );
      } catch {
        /* noop */
      }
    }
  };

  const toggleDarkMode = () => {
    // Icon-only theme switch cycles: Dark -> Light -> ARIRANG -> Dark
    const newTheme: UserPreferences['theme'] =
      preferences.theme === 'dark' ? 'light' : preferences.theme === 'light' ? 'arirang' : 'dark';
    const newPrefs = { ...preferences, theme: newTheme };
    handlePreferencesChange(newPrefs);
  };

  // Save changes
  const handlePreferencesChange = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem('bts_gallery_preferences', JSON.stringify(newPrefs));
  };

  // Site Default Theme (Batch 137): the owner can set a default
  // theme for everyone from Admin Panel -> Theme Studio. The
  // published config carries defaultTheme + a version that
  // bumps on every owner change; a NEWER version is applied
  // ONCE (so an owner change reaches every visitor), after
  // which the visitor's own theme switch wins again. New
  // visitors with no saved preference simply follow it too.
  useEffect(() => {
    const dt = (publishedConfig as any)?.defaultTheme;
    const dv = Number((publishedConfig as any)?.defaultThemeVersion || 0);
    if (!publishedConfig || !dv || !['dark', 'light', 'arirang'].includes(dt)) return;
    let seen = 0;
    try {
      seen = Number(localStorage.getItem('bg_default_theme_version') || 0);
    } catch { /* noop */ }
    if (dv <= seen) return;
    try {
      localStorage.setItem('bg_default_theme_version', String(dv));
    } catch { /* noop */ }
    if (preferences.theme !== dt) {
      handlePreferencesChange({ ...preferences, theme: dt as UserPreferences['theme'] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishedConfig]);

  // Weather & ticking clock effects
  useEffect(() => {
    const interval = setInterval(() => {
      // Formatted KST for Seoul matching 2026
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true,
        timeZone: 'Asia/Seoul',
        timeZoneName: 'short'
      });
      setCurrentTime(formatter.format(new Date()));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Simulating random charming weather conditions for Seoul (KST timezone)
  useEffect(() => {
    const weatherConditions = ['Clear Stardust', 'Purple Clouds', 'Golden Sunbeams', 'Acoustic Raindrops'];
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * weatherConditions.length);
      setSeoulWeather(weatherConditions[idx]);
      const temp = (Math.random() * 5 + 18).toFixed(1);
      setSeoulTemp(`${temp}°C`);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Typing Hero message loop
  useEffect(() => {
    const currentPhrase = typingPhrases[phraseIdx];
    if (typingIndex < currentPhrase.length) {
      const timeout = setTimeout(() => {
        setTypedText(currentPhrase.slice(0, typingIndex + 1));
        setTypingIndex(prev => prev + 1);
      }, 75);
      return () => clearTimeout(timeout);
    } else {
      // Pause at end, then advance phrase
      const timeout = setTimeout(() => {
        setTypingIndex(0);
        setPhraseIdx(prev => (prev + 1) % typingPhrases.length);
        setTypedText('');
      }, 3500);
      return () => clearTimeout(timeout);
    }
  }, [typingIndex, phraseIdx]);

  // Click outside listener for search suggestion panels.
  // IMPORTANT: this must not hide the panel before a suggestion's own click
  // lands. The mobile drawer search lives outside the desktop container ref,
  // and a document 'mousedown' fires before the item's 'click' — so on phones
  // tapping a result used to close the panel and swallow the tap entirely
  // (search looked broken). Any element inside a [data-search-root] (either
  // search box, or the panel itself) counts as "inside".
  useEffect(() => {
    const clickListener = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest && target.closest('[data-search-root]')) {
        return;
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener('mousedown', clickListener);
    return () => document.removeEventListener('mousedown', clickListener);
  }, []);

  // Global index search suggestions builder
  const getSearchSuggestions = () => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return [];

    const matches: { title: string; subtitle: string; tab: string; payload?: any; newsSlug?: string; galleryCategory?: string }[] = [];
    const cfg: any = publishedConfig || {};

    // Search members profile
    (cfg.members || MEMBERS).forEach((m: any) => {
      if (m.name.toLowerCase().includes(q) || (m.fullName || '').toLowerCase().includes(q)) {
        matches.push({ title: `${m.emoji || '👤'} ${m.name}`, subtitle: `Member Bio Profile`, tab: 'Members', payload: m });
      }
    });

    // Search albums & tracks (published config first, static catalogue as fallback)
    (cfg.albums && cfg.albums.length > 0 ? cfg.albums : ALBUMS).forEach((a: any) => {
      if ((a.title || '').toLowerCase().includes(q)) {
        matches.push({ title: `💿 ${a.title}`, subtitle: `Music Album Details`, tab: 'Music', payload: a });
      }
      (a.tracks || []).forEach((t: any) => {
        if ((t.title || '').toLowerCase().includes(q)) {
          matches.push({ title: `🎵 ${t.title}`, subtitle: `Song Track in ${a.title}`, tab: 'Music', payload: a });
        }
      });
    });

    // Search uploaded digital tracks
    (cfg.digitalTracks || []).forEach((t: any) => {
      const name = t.title || t.name || '';
      if (name.toLowerCase().includes(q)) {
        matches.push({ title: `🎵 ${name}`, subtitle: `Music Track`, tab: 'Music' });
      }
    });

    // Search site videos by title
    (cfg.videos || []).forEach((v: any) => {
      const title = v.title || '';
      if (title.toLowerCase().includes(q)) {
        matches.push({ title: `🎥 ${title}`, subtitle: `Video — watch in Videos`, tab: 'Videos' });
      }
    });

    // Search concert replays by title / location
    (cfg.concerts || []).forEach((c: any) => {
      const title = c.title || '';
      if (title.toLowerCase().includes(q) || (c.location || '').toLowerCase().includes(q)) {
        matches.push({ title: `🎤 ${title}`, subtitle: `Concert Replay`, tab: 'Concert' });
      }
    });

    // Search gallery photos by title / category
    (cfg.gallery || []).forEach((g: any) => {
      const title = g.title || '';
      if (title.toLowerCase().includes(q) || (g.category || '').toLowerCase() === q) {
        matches.push({ title: `🖼️ ${title || g.category}`, subtitle: `Gallery Photo — ${g.category || 'BTS'}`, tab: 'Gallery', galleryCategory: g.category });
      }
    });

    // Search events
    (cfg.events || []).forEach((ev: any) => {
      const title = ev.title || ev.name || '';
      if (title.toLowerCase().includes(q)) {
        matches.push({ title: `📅 ${title}`, subtitle: `Event`, tab: 'Events' });
      }
    });

    // Search timeline entries
    (cfg.timeline || []).forEach((t: any) => {
      const title = t.title || '';
      if (title.toLowerCase().includes(q)) {
        matches.push({ title: `🕰️ ${title}`, subtitle: `Timeline — ${t.year || t.date || ''}`, tab: 'Timeline' });
      }
    });

    // Search FAQs by question text
    (cfg.faqs || []).forEach((f: any) => {
      const question = f.question || '';
      if (question.toLowerCase().includes(q)) {
        matches.push({ title: `❓ ${question}`, subtitle: `FAQ`, tab: 'FAQ' });
      }
    });

    // Search downloads by name
    (cfg.downloads || []).forEach((d: any) => {
      const name = d.name || d.title || '';
      if (name.toLowerCase().includes(q)) {
        matches.push({ title: `📥 ${name}`, subtitle: `Download`, tab: 'Downloads' });
      }
    });

    // Search news (published first; a hit opens that exact article)
    (cfg.news && cfg.news.length > 0 ? cfg.news : NEWS_ARTICLES).forEach((n: any) => {
      if ((n.title || '').toLowerCase().includes(q) || (n.summary || '').toLowerCase().includes(q)) {
        matches.push({ title: `📰 ${n.title}`, subtitle: `ARMY News & Schedules`, tab: 'News', newsSlug: n.slug || n.id });
      }
    });

    // Match exact and related keywords to direct navigation links (resolving keyword link searches)
    const keywordsMap = [
      { keywords: ['home', 'portal', 'main', 'index', 'welcome', 'lounge'], tab: 'Home', title: '🏠 Welcome Home Portal', subtitle: 'BTS Fan Lounge Entrance' },
      { keywords: ['members', 'profiles', 'bts septet', 'rm', 'jin', 'suga', 'j-hope', 'jimin', 'v', 'jungkook', 'names', 'agust', 'hobi', 'rap', 'vocals'], tab: 'Members', title: '👥 BTS Members Profile Directory', subtitle: 'HD portraits, vital bios, quotes & MBTIs' },
      { keywords: ['music', 'songs', 'albums', 'tracks', 'discography', 'spotify', 'lyrics', 'player', 'proof', 'be', 'golden'], tab: 'Music', title: '💿 Music Discography', subtitle: 'Listen, view tracks, lyrics & streaming lists' },
      { keywords: ['video', 'videos', 'mv', 'youtube', 'clips', 'clips player', 'media', 'theatre', 'watch'], tab: 'Videos', title: '🎥 Video & MV Cinema Portal', subtitle: 'Interactive video portal, embed links & review logs' },
      { keywords: ['concert', 'concerts', 'replay', 'arirang concert', 'stage replay', 'full concert'], tab: 'Concert', title: '🎤 Concert Replay Archive', subtitle: 'Full concert replays — watch & download via Telegram' },
      { keywords: ['gallery', 'photos', 'images', 'artworks', 'visuals', 'pictures', 'stage'], tab: 'Gallery', title: '🖼️ HD Photo Gallery', subtitle: 'Beautiful conceptual photos and stage pictures' },
      { keywords: ['timeline', 'history', 'debut', 'anniversary dates', 'milestones', 'chronology', 'years'], tab: 'Timeline', title: '🕰️ Bangtan Chronicles Timeline', subtitle: 'Trace historical BTS events from 2013' },
      { keywords: ['news', 'articles', 'schedules', 'updates', 'hybe official', 'notices'], tab: 'News', title: '📰 News & Official Schedules', subtitle: 'BTS current notices, albums timeline' },
      { keywords: ['memes', 'meme', 'upload memes', 'funny', 'pictures', 'laughter'], tab: 'Gallery', title: '😆 ARMY Meme & Photo Vault', subtitle: 'Discover and upload community memes in Gallery' },
      { keywords: ['festa', 'anniversary', 'june 13', 'festa countdown', 'celebration', 'events', 'concerts', 'tours', 'world tour', 'tickets', 'locations'], tab: 'Events', title: '📅 Events & Tour Hub', subtitle: 'Concerts schedules, tickers, maps & notices' },
      { keywords: ['download', 'downloads', 'wallpapers', 'assets', 'saves', 'cards'], tab: 'Downloads', title: '📥 Downloads & Wallpapers Room', subtitle: 'Grab high resolution screens & sheets' },
      { keywords: ['faq', 'questions', 'support help', 'rules', 'frequently', 'answers'], tab: 'FAQ', title: '❓ Help FAQ Accordions', subtitle: 'Answers to essential ARMY portal guidelines' },
      { keywords: ['dictionary', 'borahae', 'apobangpo', 'words', 'nickname', 'meaning', 'slang', 'ot7', 'bias'], tab: 'ARMY Dictionary', title: '📖 ARMY Dictionary', subtitle: 'Fandom words, nicknames & iconic lines explained' },
      { keywords: ['contact', 'mail', 'support', 'office address', 'email', 'form'], tab: 'Contact', title: '✉️ Support Office Contact', subtitle: 'Reach out to our global team' },
      { keywords: ['feedback', 'rating', 'star reviews', 'write review', 'guestbook'], tab: 'Feedback', title: '💬 Portal Guestbook Feedback', subtitle: 'Leave custom star reviews & messages' },
      { keywords: ['settings', 'themes', 'preferences', 'text size', 'dark', 'light', 'fontsize'], tab: 'Settings', title: '⚙️ Experience Portal Settings', subtitle: 'Configure ambient modes, colors & sizes' }
    ];

    keywordsMap.forEach(item => {
      const matchesKeyword = item.keywords.some(kw => kw.includes(q) || q.includes(kw));
      if (matchesKeyword) {
        matches.push({ title: item.title, subtitle: item.subtitle, tab: item.tab });
      }
    });

    return matches.slice(0, 8);
  };

  const handlesSuggestionClick = (sug: any) => {
    setGlobalSearchQuery('');
    setShowSearchSuggestions(false);
    if (sug.tab === 'Members' && sug.payload) {
      setSelectedMember(sug.payload);
      setActiveTab('Members');
    } else if (sug.tab === 'News' && sug.newsSlug) {
      setSelectedMember(null);
      setSelectedNewsSlug(sug.newsSlug);
      setActiveTab('News');
    } else if (sug.tab === 'Gallery' && sug.galleryCategory) {
      setSelectedMember(null);
      setInitialGalleryCategory(sug.galleryCategory);
      setActiveTab('Gallery');
    } else {
      setSelectedMember(null);
      setActiveTab(sug.tab);
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pressing Enter / the keyboard Search key jumps to the best match inside
  // the site (never a page reload, never an outside web search).
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const suggestions = getSearchSuggestions();
    if (suggestions.length > 0) {
      handlesSuggestionClick(suggestions[0]);
    }
  };

  const handleQuickAccess = (tabName: string) => {
    setSelectedMember(null);
    setActiveTab(tabName);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleNewsClick = (article: any) => {
    setSelectedNewsSlug(article.slug || article.id);
    setActiveTab('News');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Nav categories matching headers & sidebar
  const navItems = [
    { name: 'Home', icon: <Home className="w-4 h-4 theme-icon" /> },
    { name: 'Voting Center', icon: <Vote className="w-4 h-4 theme-icon" /> },
    { name: 'Live Stream', icon: <Radio className="w-4 h-4 theme-icon" /> },
    { name: 'Members', icon: <Users className="w-4 h-4 theme-icon" /> },
    { name: 'Generate Pic', icon: <Wand2 className="w-4 h-4 theme-icon" /> },
    { name: 'Music', icon: <Music className="w-4 h-4 theme-icon" /> },
    { name: 'Videos', icon: <VideoIcon className="w-4 h-4 theme-icon" /> },
    { name: 'Concert', icon: <Ticket className="w-4 h-4 theme-icon" /> },
    { name: 'Gallery', icon: <ImageIcon className="w-4 h-4 theme-icon" /> },
    { name: 'Timeline', icon: <Clock className="w-4 h-4 theme-icon" /> },
    { name: 'News', icon: <BookOpen className="w-4 h-4 theme-icon" /> },
    { name: 'ARMY Dictionary', icon: <BookMarked className="w-4 h-4 theme-icon" /> },
    { name: 'Events', icon: <Calendar className="w-4 h-4 theme-icon" /> },
    { name: 'Downloads', icon: <Download className="w-4 h-4 theme-icon" /> },
    { name: 'Play Game', icon: <Gamepad2 className="w-4 h-4 theme-icon" /> },
    { name: 'FAQ', icon: <HelpCircle className="w-4 h-4 theme-icon" /> },
    { name: 'Contact', icon: <Mail className="w-4 h-4 theme-icon" /> },
    { name: 'Feedback', icon: <MessageSquareHeart className="w-4 h-4 theme-icon" /> },
    { name: 'Settings', icon: <SettingsIcon className="w-4 h-4 theme-icon" /> }
  ].filter(item => {
    const settings = publishedConfig?.sidebar;
    if (!settings) return true;
    if (item.name === 'Home') return settings.showHome !== false;
    if (item.name === 'Members') return settings.showMembers !== false;
    if (item.name === 'Music') return settings.showMusic !== false;
    if (item.name === 'Videos') return settings.showVideos !== false;
    if (item.name === 'Gallery') return settings.showGallery !== false;
    if (item.name === 'Timeline') return settings.showTimeline !== false;
    if (item.name === 'News') return settings.showNews !== false;
    if (item.name === 'Events') return settings.showEvents !== false;
    if (item.name === 'Downloads') return settings.showDownloads !== false;
    if (item.name === 'FAQ') return settings.showFAQ !== false;
    return true;
  });

  // Helper to determine accent background color
  const getAccentColorClass = () => {
    switch (preferences.accentColor) {
      case 'crimson': return 'text-rose-500 border-rose-500 bg-rose-500/10 focus:ring-rose-500';
      case 'indigo': return 'text-indigo-500 border-indigo-500 bg-indigo-500/10 focus:ring-indigo-500';
      case 'amber': return 'text-amber-500 border-amber-500 bg-amber-500/10 focus:ring-amber-500';
      case 'violet': return 'text-violet-500 border-violet-500 bg-violet-500/10 focus:ring-violet-500';
      default: return 'text-purple-500 border-purple-500 bg-purple-500/10 focus:ring-purple-500';
    }
  };

  const getAccentBgClass = () => {
    switch (preferences.accentColor) {
      case 'crimson': return 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30';
      case 'indigo': return 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30';
      case 'amber': return 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/30';
      case 'violet': return 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/30';
      default: return 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30';
    }
  };

  const getAccentTextClass = () => {
    switch (preferences.accentColor) {
      case 'crimson': return 'text-rose-400';
      case 'indigo': return 'text-indigo-400';
      case 'amber': return 'text-amber-400';
      case 'violet': return 'text-violet-400';
      default: return 'text-purple-400';
    }
  };

  const getFontSizeClass = () => {
    switch (preferences.fontSize) {
      case 'sm': return 'text-xs';
      case 'lg': return 'text-base';
      case 'xl': return 'text-lg';
      default: return 'text-sm';
    }
  };

  const searchSuggestions = getSearchSuggestions();

  const isEmbedMode = checkIsEmbedMode();
  const isPlayerOnly = checkIsPlayerOnlyEmbed();

  if (isPlayerOnly) {
    return <LiveStreamSection playerOnly={true} config={publishedConfig?.liveStream} />;
  }

  if (isEmbedMode) {
    return (
      <div className="min-h-screen bg-[#05000a] text-slate-100 font-sans p-2 md:p-4 flex flex-col justify-start">
        <LiveStreamSection playerOnly={false} config={publishedConfig?.liveStream} />
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {introLoading && <Preloader onComplete={completeIntro} />}
      </AnimatePresence>

      <div className={`min-h-screen selection:bg-purple-500/30 flex flex-col font-sans ${getFontSizeClass()} ${
        preferences.theme === 'light' ? 'light bg-[#faf8fd] text-slate-900' : preferences.theme === 'arirang' ? 'arirang bg-[#0a0206] text-slate-100' : 'bg-[#05000a] text-slate-100'
      }`}>
      
      {/* Aurora Particle Canvas Background */}
      <AuroraBackground theme={preferences.theme} isAmbientActive={isAmbientActive} />

      {/* Dynamic Disclaimer Popup */}
      <DisclaimerPopup
        isOpen={disclaimerActive}
        config={previewDisclaimer || publishedConfig?.disclaimer}
        onClose={handleDisclaimerClose}
        isPreview={!!previewDisclaimer}
      />

      {/* Announcement Bar (Batch 79) — above the header, all pages */}
      <AnnouncementBar config={publishedConfig} />

      {/* Header Sticky Navigation bar */}
      <header className={`sticky top-0 z-40 ${
        preferences.theme === 'light' 
          ? 'bg-white/70 border-slate-200/60 text-slate-800 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]' 
          : 'bg-[#05000a]/75 border-white/5 text-slate-100 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]'
      } backdrop-blur-xl border-b transition-all duration-300`}>
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          
          {/* Logo brand and subtitle */}
          <div
            onClick={() => handleQuickAccess('Home')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none group shrink-0"
          >
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden border-2 border-purple-500/70 shadow-lg shadow-purple-500/30 group-hover:border-purple-400 transition-all duration-300 shrink-0">
              <img
                src="/images/bts-logo.png"
                alt="BTS — Bangtan Gallery logo"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-sans font-black text-xs min-[380px]:text-sm md:text-base tracking-widest uppercase transition-colors flex items-center gap-1 sm:gap-1.5 whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400">
                {publishedConfig?.sidebar?.logoText || 'BANGTAN GALLERY'}
              </h1>
              <p className={`text-[8px] font-mono uppercase tracking-[0.2em] leading-none hidden md:block mt-1 ${preferences.theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Premium Fan Experience &bull; 2026
              </p>
              <div className="md:hidden flex items-center gap-1 mt-0.5 select-none text-[8px] font-mono uppercase text-purple-400 leading-none">
                <Clock className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                <span>{currentTime || '12:00:00 PM'}</span>
                <span className="text-slate-500">•</span>
                <span className="relative flex h-1 w-1 shrink-0">
                                    <span className="relative inline-flex rounded-full h-1 w-1 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400">Live</span>
              </div>
            </div>
          </div>

          {/* Desktop Search sug Bar & Socials Group */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Active Database Live Syncing status next to search bar on desktop */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/20 border border-emerald-500/15 rounded-full font-mono text-[9px] text-emerald-400 select-none">
              <span className="relative flex h-1.5 w-1.5">
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>Syncing Live</span>
            </div>

            {/* Just Time (Seoul Time) on left of search bar on desktop */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/20 border border-purple-500/15 rounded-full font-mono text-[10px] text-purple-300 select-none">
              <Clock className="w-3 h-3 text-purple-400" />
              <span>{currentTime || '12:00:00 PM'}</span>
            </div>

            {/* Elegant Search Input */}
            <div ref={searchContainerRef} data-search-root className="relative w-48 xl:w-60 hidden md:block">
              <form onSubmit={handleSearchSubmit}>
                <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 opacity-60">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Search..."
                  enterKeyHint="search"
                  value={globalSearchQuery}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value);
                    setShowSearchSuggestions(true);
                  }}
                  onFocus={() => setShowSearchSuggestions(true)}
                  className={`w-full bg-white/5 border rounded-full py-1.5 pl-9 pr-4 text-xs outline-none transition-all ${
                    preferences.theme === 'light'
                      ? 'border-slate-300/60 text-slate-800 focus:border-purple-500 focus:bg-white'
                      : 'border-white/10 text-white focus:border-purple-500/50'
                  }`}
                />
              </form>
              {showSearchSuggestions && globalSearchQuery.trim() && (
                <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border p-2.5 space-y-1.5 z-50 animate-fade-in shadow-2xl ${
                  preferences.theme === 'light'
                    ? 'border-slate-200 bg-white/95 text-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.1)]'
                    : 'border-white/10 bg-[#05000a]/95 text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)]'
                } backdrop-blur-xl`}>
                  {searchSuggestions.length === 0 && (
                    <p className="text-[11px] text-slate-400 px-2 py-1.5 leading-relaxed">
                      No results for “{globalSearchQuery.trim()}” in the site. Try a member name, song, video or concert title.
                    </p>
                  )}
                  {searchSuggestions.map((sug, i) => (
                    <div
                      key={i}
                      onClick={() => handlesSuggestionClick(sug)}
                      className={`p-2 rounded-xl border border-transparent transition-all cursor-pointer flex justify-between items-center ${
                        preferences.theme === 'light'
                          ? 'hover:bg-slate-100 hover:border-slate-200'
                          : 'hover:bg-purple-900/40 hover:border-white/10'
                      }`}
                    >
                      <div>
                        <h4 className="text-xs font-semibold leading-tight">{sug.title}</h4>
                        <p className="text-[10px] text-purple-400 font-mono mt-0.5">{sug.subtitle}</p>
                      </div>
                      <span className="text-[9px] font-mono text-purple-400 uppercase border border-purple-400/20 px-1.5 py-0.5 rounded-full">
                        Go
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Premium Social Links (Telegram, YouTube, Instagram) */}
            <div className="hidden sm:flex items-center gap-1.5 border-r border-slate-500/20 pr-2">
              <a
                href={publishedConfig?.socialLinks?.telegramChannel || publishedConfig?.socialLinks?.telegram || "https://t.me/arirang_army7"}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  preferences.theme === 'light'
                    ? 'bg-slate-100 hover:bg-rose-50 theme-icon'
                    : 'bg-white/5 hover:bg-rose-950/40 theme-icon border border-white/5'
                }`}
                title="Telegram Channel (Broadcasts)"
              >
                <Send className="w-3.5 h-3.5" />
              </a>
              <a
                href={publishedConfig?.socialLinks?.telegramCommunity || publishedConfig?.socialLinks?.telegramChat || "https://t.me/arirang_army7chat"}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  preferences.theme === 'light'
                    ? 'bg-slate-100 hover:bg-rose-50 theme-icon'
                    : 'bg-white/5 hover:bg-rose-950/40 theme-icon border border-white/5'
                }`}
                title="Telegram Community Chat (ARMY Group)"
              >
                <MessageSquareHeart className="w-3.5 h-3.5" />
              </a>
              <a
                href={publishedConfig?.socialLinks?.twitter || "https://x.com/arirang_army_7"}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  preferences.theme === 'light'
                    ? 'bg-slate-100 hover:bg-rose-50 theme-icon'
                    : 'bg-white/5 hover:bg-rose-950/40 theme-icon border border-white/5'
                }`}
                title="X (Twitter) Official"
              >
                <Twitter className="w-3.5 h-3.5" />
              </a>
              <a
                href={publishedConfig?.socialLinks?.kofi || publishedConfig?.footer?.kofiUrl || "https://ko-fi.com/bangtangallery"}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  preferences.theme === 'light'
                    ? 'bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-500'
                    : 'bg-white/5 hover:bg-rose-950/40 theme-icon border border-white/5'
                }`}
                title="Support on Ko-fi"
              >
                <Coffee className="w-3.5 h-3.5" />
              </a>
              <a
                href={publishedConfig?.socialLinks?.instagram || "https://instagram.com/arirang_army_7"}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  preferences.theme === 'light'
                    ? 'bg-slate-100 hover:bg-rose-50 theme-icon'
                    : 'bg-white/5 hover:bg-rose-950/40 theme-icon border border-white/5'
                }`}
                title="Instagram Official"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Visitor profile (Batch 94) */}
            {(() => {
              const p = getProfile();
              return (
                <button
                  onClick={() => setProfileOpen(true)}
                  className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-md shadow-purple-900/30 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                  title={p ? `My Profile — ${p.name}` : 'Create your ARMY profile'}
                >
                  {p?.photo ? (
                    <img src={p.photo} alt="" className="w-full h-full object-cover" />
                  ) : p ? (
                    <span className="text-sm leading-none">{p.emoji}</span>
                  ) : (
                    <UserRound className="w-4 h-4" />
                  )}
                </button>
              );
            })()}

            {/* Theme Toggle (icon only): Dark -> Light -> ARIRANG -> Dark */}
            <button
              onClick={toggleDarkMode}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                preferences.theme === 'light'
                  ? 'bg-slate-100 hover:bg-red-50 text-purple-600'
                  : preferences.theme === 'arirang'
                    ? 'bg-red-950/50 hover:bg-red-900/40 text-red-400 border border-red-500/25'
                    : 'bg-white/5 hover:bg-purple-950/40 text-purple-400 border border-white/5'
              }`}
              title={
                preferences.theme === 'light'
                  ? 'Switch to ARIRANG Theme'
                  : preferences.theme === 'arirang'
                    ? 'Switch to Dark Theme'
                    : 'Switch to Light Theme'
              }
            >
              {preferences.theme === 'light' ? (
                <Flame className="w-4 h-4 text-red-500" />
              ) : preferences.theme === 'arirang' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>

            {/* Theme Studio Trigger (Desktop settings toggle) */}
            <button
              onClick={() => setIsThemeOpen(true)}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-red-500 via-purple-650 to-fuchsia-600 text-white shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1"
              title="Open Theme Studio Customizer Panel"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Theme Studio</span>
            </button>

            {/* Mobile menu drawer trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors cursor-pointer block lg:hidden ${
                preferences.theme === 'light'
                  ? 'hover:bg-slate-100 text-slate-600'
                  : 'hover:bg-white/5 text-purple-300'
              }`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Main Body container */}
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 flex-grow flex flex-col lg:flex-row gap-8 pt-3 pb-8 lg:py-8">
        
        {/* Left PERSISTENT Desktop Sidebar (Column span 1) */}
        <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-4">
          <div className="sticky top-24 p-5 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl flex flex-col gap-6 shadow-2xl relative">


            <nav className="flex flex-col gap-1.5 bg-transparent">
              {navItems.map(item => {
                const isActive = activeTab === item.name;
                
                // Immersive UI Active status class builder
                let dotColor = 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]';
                switch (preferences.accentColor) {
                  case 'crimson':
                    dotColor = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]';
                    break;
                  case 'indigo':
                    dotColor = 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]';
                    break;
                  case 'amber':
                    dotColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]';
                    break;
                  case 'violet':
                    dotColor = 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]';
                    break;
                  default:
                    dotColor = 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]';
                }

                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setSelectedMember(null);
                      setActiveTab(item.name);
                      if (item.name === 'Music') {
                        audioPlayer.startPlayingFirstTime();
                      }
                    }}
                    className="flex items-center h-10 px-4 rounded-lg font-medium transition-all text-left cursor-pointer group relative overflow-hidden"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeSidebarIndicator"
                        className={`absolute inset-0 border-l-2 ${
                          preferences.accentColor === 'crimson' ? 'bg-rose-600/20 border-rose-500' :
                          preferences.accentColor === 'indigo' ? 'bg-indigo-600/20 border-indigo-500' :
                          preferences.accentColor === 'amber' ? 'bg-amber-600/20 border-amber-500' :
                          preferences.accentColor === 'violet' ? 'bg-violet-600/20 border-violet-500' :
                          'bg-purple-600/20 border-purple-500'
                        } rounded-r-lg z-0`}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className={`relative z-10 font-sans text-sm flex items-center gap-2.5 transition-colors duration-200 ${
                      isActive ? 'font-semibold text-white' : 'text-slate-400 group-hover:text-white'
                    }`}>
                      {isActive ? (
                        <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0 animate-pulse`} style={{ content: '""' }} />
                      ) : (
                        <span className="text-slate-500 group-hover:text-slate-300 transition-colors shrink-0">{item.icon}</span>
                      )}
                      <span>{item.name}</span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-white/10 pt-4 mt-2 space-y-4">
              <div>
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500 block mb-2 text-center">
                  Official Socials
                </span>
                <div className="flex flex-wrap items-center gap-1.5 justify-center max-w-[190px] mx-auto">
                  <a
                    href={publishedConfig?.socialLinks?.telegramChannel || publishedConfig?.socialLinks?.telegram || "https://t.me/arirang_army7"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/30 flex items-center justify-center theme-icon transition-all group cursor-pointer"
                    title="Telegram Channel (Broadcasts)"
                  >
                    <Send className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </a>
                  <a
                    href={publishedConfig?.socialLinks?.telegramCommunity || publishedConfig?.socialLinks?.telegramChat || "https://t.me/arirang_army7chat"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/30 flex items-center justify-center theme-icon transition-all group cursor-pointer"
                    title="Telegram Community Chat (ARMY Group)"
                  >
                    <MessageSquareHeart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </a>
                  <a
                    href={publishedConfig?.socialLinks?.twitter || "https://x.com/arirang_army_7"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/30 flex items-center justify-center theme-icon transition-all group cursor-pointer"
                    title="X (Twitter) Official"
                  >
                    <Twitter className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </a>
                  <a
                    href={publishedConfig?.socialLinks?.kofi || publishedConfig?.footer?.kofiUrl || "https://ko-fi.com/bangtangallery"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/30 flex items-center justify-center theme-icon transition-all group cursor-pointer"
                    title="Support on Ko-fi"
                  >
                    <Coffee className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </a>
                  <a
                    href={publishedConfig?.socialLinks?.instagram || "https://instagram.com/arirang_army_7"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/30 flex items-center justify-center theme-icon transition-all group cursor-pointer"
                    title="Instagram Official"
                  >
                    <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </a>
                  <a
                    href={publishedConfig?.socialLinks?.youtube || "https://www.youtube.com/user/BANGTANTV"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/30 flex items-center justify-center theme-icon transition-all group cursor-pointer"
                    title="YouTube Official"
                  >
                    <Youtube className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </a>
                  <a
                    href={publishedConfig?.socialLinks?.facebook || "https://www.facebook.com/bangtan.official"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/30 flex items-center justify-center theme-icon transition-all group cursor-pointer"
                    title="Facebook Official"
                  >
                    <Facebook className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </a>
                  <a
                    href={publishedConfig?.socialLinks?.weverse || "https://weverse.io/bts/feed"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/30 flex items-center justify-center theme-icon transition-all group cursor-pointer"
                    title="Weverse Official"
                  >
                    <MoreHorizontal className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile menu drawer Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%', filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: '100%', filter: 'blur(8px)' }}
              transition={{ duration: 0.42, ease: [0.19, 1, 0.22, 1] }}
              className={`fixed inset-0 z-50 ${
                preferences.theme === 'light'
                  ? 'bg-white/95 text-slate-850 border-slate-200/50'
                  : 'bg-[#05000a]/98 text-white border-white/10'
              } backdrop-blur-xl flex flex-col p-6 block lg:hidden border-l shadow-2xl`}
            >
              <div className={`flex items-center justify-between border-b pb-4 mb-4 ${
                preferences.theme === 'light' ? 'border-slate-200' : 'border-white/10'
              }`}>
                <span className={`font-sans font-black text-base tracking-widest flex items-center gap-1.5 uppercase ${
                  preferences.theme === 'light' ? 'text-slate-800' : 'text-white'
                }`}>
                  Bangtan Portal
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-2 rounded-lg border transition-all ${
                    preferences.theme === 'light' 
                      ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200' 
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            {/* Mobile Instant search filter */}
            <div className="relative mb-6" data-search-root>
              <form onSubmit={handleSearchSubmit}>
                <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search portal index..."
                  enterKeyHint="search"
                  value={globalSearchQuery}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value);
                    setShowSearchSuggestions(true);
                  }}
                  onFocus={() => setShowSearchSuggestions(true)}
                  className={`w-full text-xs pl-10 pr-4 py-3 rounded-xl border outline-none transition-all ${
                    preferences.theme === 'light'
                      ? 'bg-slate-100 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-purple-500'
                      : 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50'
                  }`}
                />
              </form>
              {showSearchSuggestions && globalSearchQuery.trim() && (
                <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border p-2.5 space-y-1.5 z-50 shadow-2xl ${
                  preferences.theme === 'light'
                    ? 'border-slate-200 bg-white text-slate-800'
                    : 'border-white/10 bg-[#05000a] text-white'
                }`}>
                  {searchSuggestions.length === 0 && (
                    <p className="text-[11px] text-slate-400 px-2 py-1.5 leading-relaxed">
                      No results for “{globalSearchQuery.trim()}” in the site. Try a member name, song, video or concert title.
                    </p>
                  )}
                  {searchSuggestions.map((sug, i) => (
                    <div
                      key={i}
                      onClick={() => handlesSuggestionClick(sug)}
                      className={`p-2 rounded text-xs cursor-pointer flex justify-between items-center border border-transparent transition-all ${
                        preferences.theme === 'light'
                          ? 'hover:bg-slate-100 hover:border-slate-200 text-slate-700'
                          : 'hover:bg-purple-900/30 hover:border-white/5 text-white'
                      }`}
                    >
                      <span>{sug.title}</span>
                      <span className="text-[10px] text-purple-500 font-mono">{sug.tab}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile List menu */}
            <div className="flex-grow overflow-y-auto space-y-1.5 flex flex-col pr-1">
              {navItems.map(item => {
                const isActive = activeTab === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setSelectedMember(null);
                      setActiveTab(item.name);
                      setMobileMenuOpen(false);
                      if (item.name === 'Music') {
                        audioPlayer.startPlayingFirstTime();
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left cursor-pointer transition-all ${
                      isActive 
                        ? `${getAccentBgClass()} text-white font-bold shadow-lg` 
                        : preferences.theme === 'light'
                          ? 'text-slate-650 hover:text-slate-900 hover:bg-slate-100'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="text-sm font-sans">{item.name}</span>
                  </button>
                );
              })}

              <div className="border-t border-white/10 pt-4 mt-4 space-y-4">
                <div>
                  <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500 block mb-2 text-center">
                    Official Socials
                  </span>
                  <div className="flex flex-wrap items-center gap-2 justify-center max-w-[260px] mx-auto">
                    <a
                      href={publishedConfig?.socialLinks?.telegramChannel || publishedConfig?.socialLinks?.telegram || "https://t.me/arirang_army7"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 flex items-center justify-center theme-icon transition-all cursor-pointer"
                      title="Telegram Channel (Broadcasts)"
                    >
                      <Send className="w-4.5 h-4.5" />
                    </a>
                    <a
                      href={publishedConfig?.socialLinks?.telegramCommunity || publishedConfig?.socialLinks?.telegramChat || "https://t.me/arirang_army7chat"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 flex items-center justify-center theme-icon transition-all cursor-pointer"
                      title="Telegram Community Chat (ARMY Group)"
                    >
                      <MessageSquareHeart className="w-4.5 h-4.5" />
                    </a>
                    <a
                      href={publishedConfig?.socialLinks?.twitter || "https://x.com/arirang_army_7"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 flex items-center justify-center theme-icon transition-all cursor-pointer"
                      title="X (Twitter) Official"
                    >
                      <Twitter className="w-4.5 h-4.5" />
                    </a>
                    <a
                      href={publishedConfig?.socialLinks?.kofi || publishedConfig?.footer?.kofiUrl || "https://ko-fi.com/bangtangallery"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 flex items-center justify-center theme-icon transition-all cursor-pointer"
                      title="Support on Ko-fi"
                    >
                      <Coffee className="w-4.5 h-4.5" />
                    </a>
                    <a
                      href={publishedConfig?.socialLinks?.instagram || "https://instagram.com/arirang_army_7"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 flex items-center justify-center theme-icon transition-all cursor-pointer"
                      title="Instagram Official"
                    >
                      <Instagram className="w-4.5 h-4.5" />
                    </a>
                    <a
                      href={publishedConfig?.socialLinks?.youtube || "https://www.youtube.com/user/BANGTANTV"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 flex items-center justify-center theme-icon transition-all cursor-pointer"
                      title="YouTube Official"
                    >
                      <Youtube className="w-4.5 h-4.5" />
                    </a>
                    <a
                      href={publishedConfig?.socialLinks?.facebook || "https://www.facebook.com/bangtan.official"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 flex items-center justify-center theme-icon transition-all cursor-pointer"
                      title="Facebook Official"
                    >
                      <Facebook className="w-4.5 h-4.5" />
                    </a>
                    <a
                      href={publishedConfig?.socialLinks?.weverse || "https://weverse.io/bts/feed"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 flex items-center justify-center theme-icon transition-all cursor-pointer"
                      title="Weverse Official"
                    >
                      <MoreHorizontal className="w-4.5 h-4.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Main View Area */}
        <main className="flex-grow min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (selectedMember ? `-${selectedMember.id}` : '')}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: [0.19, 1, 0.22, 1] }}
              className="outline-none"
            >
              <SectionErrorBoundary key={activeTab}>
              <React.Suspense fallback={
                <div className="py-24 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
                  <p className="text-[11px] font-mono uppercase tracking-widest text-purple-300/70">Loading…</p>
                </div>
              }>
              
              {/* VIEW: HOME VIEW */}
              {activeTab === 'Home' && !selectedMember && (
                <div className="space-y-12 font-sans">
                  
                  {/* Premium Apple + HYBE + Soompi + Billboard styled Redesigned Hero Grid */}
                  {(() => {
                    const newsList = publishedConfig?.news && publishedConfig.news.length > 0 ? publishedConfig.news : NEWS_ARTICLES;
                    const activeNews = (newsList || []).filter((item: any) => item.published !== false);
                    const displayNews = activeNews.length > 0 ? activeNews : newsList;

                    // Fallbacks for empty news just in case
                    const fallbackFeatured = {
                      id: 'featured-default',
                      title: 'Welcome to the Ultimate BTS Premium Fan Portal',
                      summary: 'Discover active schedules, exclusive comebacks, real-time voting trends, and digital artwork curated directly for the global ARMY.',
                      category: 'Announcement',
                      imageUrl: publishedConfig?.home?.heroImageUrl || "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg",
                      date: '2026-07-05',
                      slug: 'welcome'
                    };

                    const featuredArticle = displayNews[0] || fallbackFeatured;
                    // Batch 145 (owner): the Home "Latest Updates" rail
                    // shows exactly 3 — the owner's Admin Panel picks
                    // (config homeLatestIds, in pick order, the hero
                    // article excluded) when any are set, otherwise
                    // the newest 3 after the featured article.
                    const pickedIds: string[] = Array.isArray((publishedConfig as any)?.homeLatestIds) ? (publishedConfig as any).homeLatestIds : [];
                    const pickedLatest = pickedIds
                      .map((id: string) => displayNews.find((n: any) => n.id === id))
                      .filter((n: any) => n && n.id !== featuredArticle.id)
                      .slice(0, 3);
                    const latestNewsList = pickedLatest.length > 0 ? pickedLatest : displayNews.slice(1, 4);

                    return (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          
                          {/* Left Block: Featured News — Batch 145 Magazine
                              "A" style (owner-approved demos): a slim
                              "Today's Cover Story" kicker strip, a CLEAN
                              photo (category chip only, no text overlay,
                              so no face is ever covered), then the big
                              headline BELOW the photo at full width,
                              the summary, and the date + Read More /
                              Watch Live row. Latest Updates rail sits
                              beside it exactly as before. */}
                          <div className={`${latestNewsList.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
                            <div className="flex items-center gap-2.5">
                              <span className="w-2 h-6 rounded-sm bg-rose-600 shrink-0" />
                              <span className="text-sm sm:text-base font-black uppercase tracking-[0.18em] text-rose-500">
                                Today&rsquo;s Cover Story
                              </span>
                            </div>

                            <div
                              onClick={() => handleNewsClick(featuredArticle)}
                              className="on-media relative rounded-3xl overflow-hidden shadow-2xl aspect-[16/9] sm:aspect-[21/10] group/feat border border-white/10 cursor-pointer"
                            >
                              <img
                                src={featuredArticle.imageUrl || "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg"}
                                alt={featuredArticle.title}
                                className="w-full h-full object-cover object-[50%_22%] scale-100 group-hover/feat:scale-105 transition-transform duration-[2000ms]"
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute top-4 left-4 px-2.5 py-1 bg-rose-600 text-white rounded-md text-[9px] font-bold uppercase tracking-widest shadow-lg">
                                {featuredArticle.category || 'FEATURED'}
                              </span>
                            </div>

                            <div className="space-y-3 px-0.5">
                              <h2
                                onClick={() => handleNewsClick(featuredArticle)}
                                className="text-xl sm:text-2xl lg:text-[34px] font-extrabold tracking-tight leading-[1.15] cursor-pointer hover:text-purple-400 transition-colors"
                              >
                                {featuredArticle.title}
                              </h2>

                              <p className="text-sm text-slate-400 font-sans line-clamp-2 max-w-3xl leading-relaxed">
                                {featuredArticle.summary}
                              </p>

                              {/* Batch 147 (owner): on mobile the date takes
                                  its own line and the two buttons sit SMALL
                                  and side by side beneath it (never one per
                                  line); from sm up everything stays on one
                                  row at the original size. */}
                              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                <span className="text-slate-400 text-[11px] font-mono mr-1 w-full sm:w-auto">{featuredArticle.date}</span>
                                <div className="flex items-center gap-2 flex-nowrap">
                                <button
                                  onClick={() => handleNewsClick(featuredArticle)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 bg-white text-black border border-slate-200 hover:bg-purple-600 hover:text-white hover:border-purple-600 rounded-full font-bold text-[10px] sm:text-[11px] uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer whitespace-nowrap"
                                >
                                  Read More &rarr;
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickAccess('Live Stream');
                                  }}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-full font-bold text-[10px] sm:text-[11px] uppercase tracking-wider transition-all duration-300 shadow-lg shadow-rose-600/30 hover:scale-105 cursor-pointer whitespace-nowrap"
                                >
                                  <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-white"></span>
                                  </span>
                                  <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white animate-pulse" />
                                  <span>Watch Live</span>
                                </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right Block: 4 Latest News (Col Span 1).
                              Owner rule: this block exists ONLY when there
                              are 2+ published news articles (i.e. something
                              beyond the featured one). With a single article
                              it disappears completely — no empty "No
                              additional articles" box — and it comes back
                              on its own as soon as a 2nd article is
                              published. Applies to mobile and desktop. */}
                          {latestNewsList.length > 0 && (
                          <div className={`rounded-3xl p-6 flex flex-col justify-between border ${
                            preferences.theme === 'light'
                              ? 'bg-white border-slate-200/60 shadow-[0_8px_32px_rgba(31,38,135,0.03)]'
                              : 'bg-[#04000a]/70 border-white/5 shadow-2xl'
                          } backdrop-blur-xl`}>
                            <div>
                              {/* Header for list */}
                              <div className="flex justify-between items-center pb-3 border-b border-slate-500/10 mb-4">
                                <h3 className={`text-sm font-black uppercase tracking-wider ${
                                  preferences.theme === 'light' ? 'text-slate-800' : 'text-slate-100'
                                }`}>
                                  Latest Updates
                                </h3>
                                <button 
                                  onClick={() => handleQuickAccess('News')}
                                  className="text-[9px] uppercase tracking-wider font-mono text-purple-400 hover:underline"
                                >
                                  View All &rarr;
                                </button>
                              </div>

                              {/* News items list mapping */}
                              <div className="space-y-4">
                                {latestNewsList.length > 0 ? (
                                  latestNewsList.map((item: any) => (
                                    <div 
                                      key={item.id}
                                      onClick={() => handleNewsClick(item)}
                                      className="group/item cursor-pointer flex gap-3 py-1.5 items-center border-b last:border-0 border-slate-500/10 transition-colors"
                                    >
                                      {item.imageUrl && (
                                        <img 
                                          src={item.imageUrl} 
                                          alt={item.title} 
                                          className="w-14 h-14 shrink-0 rounded-xl object-cover border border-white/10 scale-95 group-hover/item:scale-100 transition-transform duration-300" 
                                          referrerPolicy="no-referrer"
                                        />
                                      )}
                                      <div className="flex-grow min-w-0">
                                        <span className="text-[8px] font-extrabold uppercase tracking-widest text-purple-400 block mb-0.5">
                                          {item.category}
                                        </span>
                                        <h4 className={`text-xs font-semibold tracking-tight line-clamp-2 leading-tight transition-colors group-hover/item:text-purple-400 ${
                                          preferences.theme === 'light' ? 'text-slate-800' : 'text-slate-200'
                                        }`}>
                                          {item.title}
                                        </h4>
                                        <span className="text-[9px] font-mono text-slate-400 block mt-1">
                                          {item.date}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center py-8 text-xs text-slate-400 font-mono">
                                    No additional articles published.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          )}

                        </div>

                      </div>
                    );
                  })()}

                  {/* circular 7-Members Ripple showcase */}
                  <section className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-1.5 group cursor-pointer" onClick={() => handleQuickAccess('Members')}>
                          Meet BTS Members <UserCheck className="w-5 h-5 text-purple-400" />
                        </h2>
                        <p className="text-gray-400 text-xs">Click circular portrait vectors below to open their deep biographies.</p>
                      </div>
                      <button onClick={() => handleQuickAccess('Members')} className="text-xs font-mono text-purple-400 hover:underline">See Profiles &rarr;</button>
                    </div>

                    <div className="flex flex-wrap md:flex-nowrap justify-around gap-4 p-6 rounded-2xl border border-white/5 bg-black/45 backdrop-blur-md">
                      {(publishedConfig?.members || MEMBERS).map(m => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedMember(m);
                            setActiveTab('Members');
                          }}
                          className="flex flex-col items-center gap-2 cursor-pointer group"
                        >
                          <div className="relative">
                            {/* Ripple glowing layer on hover */}
                            <div className="absolute inset-0 rounded-full bg-purple-500/0 outline-none group-hover:scale-110 group-hover:bg-purple-600/35 transition-all duration-300" />
                            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500 to-rose-500 opacity-0 group-hover:opacity-70 blur-md transition-all duration-300" />
                            <img
                              src={m.portraitUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg'}
                              alt={m.name}
                              className="relative w-14 h-14 md:w-20 md:h-20 rounded-full object-cover border-2 border-white/10 group-hover:border-purple-400 transition-colors shadow-lg"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="font-sans font-bold text-xs text-gray-300 group-hover:text-purple-300 transition-colors">
                            {m.name} {m.emoji}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Next-birthday mini countdown (Batch 74) — the small
                        notice in the space under the member portraits */}
                    <BirthdayCountdown />
                  </section>

                  {/* Golden Quotes & Lyrics - APPEARS AFTER MEMBER SECTION */}
                  <div className="w-full">
                    <BTSQuotesCarousel items={publishedConfig?.homeQuotes} />
                  </div>

                  {/* Wide banner ad (Batch 96) — owner-requested
                      placement: the existing 468×60 banner unit
                      (type 5, the same one running inside news
                      articles), between Quotes and Tour. No
                      existing ad was changed — one added instance
                      of the same component. */}
                  <div className="w-full flex justify-center">
                    <AdsterraAd type={5} />
                  </div>

                  {/* Tour Countdown Carousel with daily live starlight ticks */}
                  <div className="w-full">
                    <TourCountdownCarousel config={publishedConfig?.countdown} />
                  </div>

                  {/* Spotify Embedded Players placed right after Tour Countdown */}
                  {(() => {
                    const spotifyEmbedsList = [...(publishedConfig?.spotifyEmbeds || DEFAULT_SPOTIFY_EMBEDS)].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
                    if (spotifyEmbedsList.length === 0) return null;
                    return (
                      <div className={`w-full mt-10 grid grid-cols-1 ${spotifyEmbedsList.length > 1 ? 'lg:grid-cols-2' : ''} gap-6`}>
                        {spotifyEmbedsList.map((embed: any) => {
                          const colorClass = embed.color === 'pink' ? 'text-pink-400' :
                                             embed.color === 'indigo' ? 'text-indigo-400' :
                                             embed.color === 'rose' ? 'text-rose-400' :
                                             embed.color === 'teal' ? 'text-teal-400' :
                                             embed.color === 'emerald' ? 'text-emerald-400' :
                                             embed.color === 'cyan' ? 'text-cyan-400' :
                                             embed.color === 'amber' ? 'text-amber-400' :
                                             embed.color === 'fuchsia' ? 'text-fuchsia-400' :
                                             'text-purple-400';
                          const badgeClass = embed.color === 'pink' ? 'text-pink-400 bg-pink-950/40 border-pink-500/10' :
                                             embed.color === 'indigo' ? 'text-indigo-400 bg-indigo-950/40 border-indigo-500/10' :
                                             embed.color === 'rose' ? 'text-rose-400 bg-rose-950/40 border-rose-500/10' :
                                             embed.color === 'teal' ? 'text-teal-400 bg-teal-950/40 border-teal-500/10' :
                                             embed.color === 'emerald' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/10' :
                                             embed.color === 'cyan' ? 'text-cyan-400 bg-cyan-950/40 border-cyan-500/10' :
                                             embed.color === 'amber' ? 'text-amber-400 bg-amber-950/40 border-amber-500/10' :
                                             embed.color === 'fuchsia' ? 'text-fuchsia-400 bg-fuchsia-950/40 border-fuchsia-500/10' :
                                             'text-purple-400 bg-purple-950/40 border-purple-500/10';
                          
                          return (
                            <div key={embed.id} className="w-full p-6 rounded-2xl border border-white/5 bg-black/45 flex flex-col justify-between space-y-4">
                              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <h3 className={`font-sans font-bold text-white text-sm flex items-center gap-1.5 uppercase tracking-widest ${colorClass}`}>
                                  {embed.color === 'pink' ? <Disc className="w-4 h-4 text-pink-400 animate-pulse" /> : <Music className={`w-4 h-4 ${colorClass} animate-pulse`} />} {embed.title || 'Spotify Player'}
                                </h3>
                                {embed.badge && (
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold uppercase ${badgeClass}`}>
                                    {embed.badge}
                                  </span>
                                )}
                              </div>
                              <div className="w-full rounded-xl overflow-hidden bg-black/20">
                                {getSpotifyEmbedUrl(embed.url) ? (
                                  <iframe
                                    src={getSpotifyEmbedUrl(embed.url) || undefined}
                                    width="100%"
                                    height="352"
                                    frameBorder="0"
                                    allowFullScreen={true}
                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                    loading="lazy"
                                    className="border-0 rounded-xl"
                                    title={`Spotify Embed - ${embed.title}`}
                                  ></iframe>
                                ) : (
                                  <div className="p-4 text-xs text-center text-zinc-500 font-mono">
                                    No Spotify stream configured
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Curated Interactive Curved 3D Media Wall - Displays Weverse Posts */}
                  <div className="w-full">
                    <InteractiveMediaWall config={publishedConfig?.weversePosts} feed={publishedConfig?.weverseFeed} members={publishedConfig?.members} onTileClick={handleQuickAccess} />
                  </div>

                  {/* Trending Showcase Snapping Carousel */}
                  <div className="w-full">
                    <TrendingCarousel
                      config={(() => {
                        // Auto-fed Trending Showcase (owner choice,
                        // 2026-11-06): cards are built ONLY from the
                        // concerts and videos the owner has added —
                        // nothing built-in, nothing invented.
                        const items: any[] = [];
                        const concerts = Array.isArray(publishedConfig?.concerts) ? publishedConfig.concerts : [];
                        concerts.forEach((c: any, i: number) => {
                          if (!c || !c.title) return;
                          items.push({
                            id: `trend-concert-${c.id || i}`,
                            rank: `#${items.length + 1}`,
                            title: c.title,
                            tag: 'Concert',
                            thumbnail: c.coverUrl || '/images/og-cover-2.jpg',
                            category: 'Concert',
                            categoryLabel: 'Concert Replay',
                            subtitle: c.date || '',
                            watchButtonLink: 'Concert',
                            published: true
                          });
                        });
                        const videos = Array.isArray(publishedConfig?.videos) ? publishedConfig.videos : [];
                        videos.forEach((v: any, i: number) => {
                          if (!v || !v.title || !v.videoId) return;
                          items.push({
                            id: `trend-video-${v.id || v.videoId || i}`,
                            rank: `#${items.length + 1}`,
                            title: v.title,
                            tag: v.category || 'Video',
                            thumbnail: `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`,
                            category: 'Videos',
                            categoryLabel: v.category || 'Video',
                            subtitle: v.uploaderName || v.channel || '',
                            watchButtonLink: 'Videos',
                            published: true
                          });
                        });
                        return items.slice(0, 10);
                      })()}
                      onNavigate={handleQuickAccess}
                    />
                  </div>

                  {/* Curated Mixed Multiplatform Feed */}
                  <div className="w-full">
                    <HomeFeed config={publishedConfig} />
                  </div>

                  {/* Days With BTS counter (Batch 89) — slim + transparent,
                      placed just before the Supporters Wall per the owner */}
                  <div className="w-full mt-10">
                    <DaysWithBTS />
                  </div>

                  {/* Live Supporters Wall & Comunidad Section placed last before footer */}
                  <div className="w-full mt-10">
                    <SupportersWall />
                  </div>

                  {/* ARMY World Map (Batch 91) — right after the
                      Supporters Wall, per the owner */}
                  <div className="w-full">
                    <ArmyWorldMap />
                  </div>

                  {/* Install-the-app card (Batch 75) — renders only when
                      the browser offers an install or on iOS */}
                  <div className="w-full mt-6">
                    <InstallApp variant="card" />
                  </div>

                  {/* Adsterra Type 8 Ad above footer on Home Page */}
                  <div className="w-full py-4 flex justify-center border-t border-white/5">
                    <AdsterraAd type={8} />
                  </div>

                </div>
              )}

          {/* VIEW: MEMBERS LIST AND INDIVIDUAL BIOGRAPHIES */}
          {activeTab === 'Members' && (
            <div className="space-y-8 animate-fade-in font-sans">
              {!selectedMember ? (
                <>
                  <div className="border-b border-white/5 pb-6">
                    <h2 className="text-2xl md:text-3xl font-sans font-extrabold text-white">
                      Meet BTS Septet (Seven Members)
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Select any member profile to explore HD portraits, vital stats, complete biography, quotes and career journeys.
                    </p>
                  </div>

                  {/* Members Profiles Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {(publishedConfig?.members || MEMBERS).map(member => (
                      <div
                        key={member.id}
                        onClick={() => setSelectedMember(member)}
                        className="group relative rounded-2xl border border-white/5 bg-black/55 overflow-hidden hover:border-purple-500/35 transition-all duration-300 hover:shadow-[0_10px_25px_-10px_rgba(168,85,247,0.2)] cursor-pointer"
                      >
                        {/* Card cover (owner's per-member cover image) with the
                            portrait avatar overlapping its bottom edge */}
                        <div className="relative">
                          <div className="h-36 overflow-hidden relative">
                            <img
                              src={member.cardCoverUrl || member.bannerUrl}
                              alt={`${member.name} cover`}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                          </div>
                          <img
                            src={member.portraitUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg'}
                            alt={member.name}
                            className="absolute -bottom-8 left-4 w-16 h-16 rounded-full object-cover border-2 border-purple-400/60 shadow-lg shadow-black/60 bg-black"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="p-4 pt-10 space-y-3.5">
                          <div className="text-white">
                            <div className="flex items-center gap-1 ml-0.5">
                              <span className="text-2xl font-sans font-extrabold">{member.name}</span>
                              <span className="text-xl">{member.emoji}</span>
                            </div>
                            <span className="text-[10px] font-mono text-purple-300 uppercase tracking-wider">{member.fullName}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {member.position.slice(0, 2).map((pos, idx) => (
                              <span key={idx} className="text-[9px] font-mono px-2 py-0.5 rounded border border-purple-500/20 bg-purple-950/20 text-purple-300">
                                {pos}
                              </span>
                            ))}
                          </div>
                          
                          <p className="text-xs text-gray-400 leading-relaxed font-sans line-clamp-2">
                            {member.biography}
                          </p>

                          <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-purple-400">
                            <span>MBTI: {member.mbti}</span>
                            <span className="group-hover:underline">Detailed Bio &rarr;</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* Detail sub component */
                <MemberProfileDetail
                  member={(publishedConfig?.members || MEMBERS).find((m: any) => m.id === selectedMember?.id) || selectedMember}
                  onBack={() => setSelectedMember(null)}
                  weverseFeed={Array.isArray(publishedConfig?.weverseFeed) ? publishedConfig.weverseFeed : []}
                />
              )}
            </div>
          )}

          {/* VIEW: MUSIC SECTION */}
          {activeTab === 'Music' && <MusicSection config={publishedConfig} />}

          {/* VIEW: LIVE STREAM */}
          {activeTab === 'Live Stream' && <LiveStreamSection config={publishedConfig?.liveStream} />}

          {/* VIEW: GENERATE PIC STUDIO SECTION */}
          {activeTab === 'Generate Pic' && (
            <GeneratePicStudio 
              onBack={() => setActiveTab('Home')} 
              accentColor={preferences.accentColor} 
            />
          )}

          {/* VIEW: VIDEO SECTION CLONE */}
          {activeTab === 'Videos' && <YouTubeClone config={publishedConfig} />}

          {/* VIEW: CONCERT REPLAY (own nav page, share link /arirang_concert_reply) */}
          {activeTab === 'Concert' && (
            <div className="space-y-4">
              {/* Slim twin buttons (Batch 99): Concert Mode + a
                  Setlists jump link to the surprise-songs section */}
              <div className="flex gap-2.5 w-full max-w-2xl mx-auto px-1">
                <button
                  onClick={() => setConcertModeOpen(true)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-purple-900/40 hover:opacity-90 cursor-pointer whitespace-nowrap"
                >
                  ✨ Enter Concert Mode 💜
                </button>
                <button
                  onClick={() => document.getElementById('tour-setlists')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-fuchsia-400/40 text-fuchsia-200 text-xs sm:text-sm font-extrabold hover:bg-fuchsia-500/15 cursor-pointer whitespace-nowrap"
                >
                  🎤 Setlists ↓
                </button>
              </div>
              <RecentConcertReplay concerts={publishedConfig?.concerts} setlists={publishedConfig?.tourSetlists} videos={publishedConfig?.videos} standalone />
            </div>
          )}

          {/* VIEW: PHOTO GALLERY MASONRY */}
          {activeTab === 'Gallery' && <GallerySection items={publishedConfig?.gallery} initialCategory={initialGalleryCategory} />}

          {/* VIEW: TIMELINE MILESTONES */}
          {activeTab === 'Timeline' && <TimelineSection items={publishedConfig?.timeline} />}

          {/* VIEW: LATEST NEWS */}
          {activeTab === 'News' && (
            <NewsSection 
              items={publishedConfig?.news} 
              selectedArticleIdOrSlug={selectedNewsSlug}
              onSelectArticle={setSelectedNewsSlug}
              relatedTopics={publishedConfig?.newsRelatedTopics}
            />
          )}

          {/* VIEW: EVENTS AND COORDINATES */}
          {activeTab === 'Events' && <EventsSection items={publishedConfig?.events} concerts={publishedConfig?.concerts} />}

          {/* VIEW: DOWNLOADS BASE */}
          {activeTab === 'Downloads' && <DownloadsSection items={publishedConfig?.downloads} />}

          {/* VIEW: BTS GLOBAL QUEST */}
          {activeTab === 'Play Game' && (
            <div className="space-y-6">
              {/* Games Hub (Batch 112): a menu of game tabs first, a
                  one-time username + country popup before the first
                  game, and a Back button inside every game. The
                  Quest strip (with its ads) lives on the hub menu. */}
              <GamesHub
                tracks={publishedConfig?.digitalTracks || []}
                quizEnabled={publishedConfig?.quizEnabled !== false}
                audioEnabled={publishedConfig?.quizAudioEnabled !== false}
                lyricsEnabled={publishedConfig?.quizLyricsEnabled !== false}
                config={publishedConfig}
                targetUsername={targetUsername}
                onOpenProfile={() => setProfileOpen(true)}
                onExitProfile={() => {
                  setTargetUsername(null);
                  setActiveTab('Home');
                }}
                onCloseQuiz={() => setActiveTab('Music')}
              />
            </div>
          )}

          {/* VIEW: FAQ DIRECTORY */}
          {activeTab === 'FAQ' && <FAQSection items={publishedConfig?.faqs} onOpenPrivacy={() => setActiveTab('Privacy Policy')} />}

          {/* VIEW: ARMY DICTIONARY (Batch 92) */}
          {activeTab === 'ARMY Dictionary' && <DictionarySection items={publishedConfig?.dictionaryEntries} audioUrl={publishedConfig?.fanChantAudioUrl} />}
          {activeTab === 'Privacy Policy' && <PrivacyPolicy onBack={() => setActiveTab(prevTabRef.current || 'FAQ')} />}

          {/* VIEW: VOTING CENTER */}
          {activeTab === 'Voting Center' && (
            <VotingCenterSection 
              votingEvents={publishedConfig?.votingEvents} 
              onRefresh={fetchPublishedConfig} 
            />
          )}

          {/* VIEW: CONTACT TRANSMITTER */}
          {activeTab === 'Contact' && <ContactSection config={publishedConfig} />}

          {/* VIEW: FEEDBACK INTERACTION */}
          {activeTab === 'Feedback' && <FeedbackSection />}

          {/* VIEW: GLOBAL SETTINGS PANEL */}
          {activeTab === 'Settings' && (
            <SettingsSection
              preferences={preferences}
              onPreferencesChange={handlePreferencesChange}
            />
          )}



              </React.Suspense>
              </SectionErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Footer System */}
      <footer className="mt-20 border-t border-white/10 bg-black/45 backdrop-blur-xl py-12 text-sm text-slate-400 font-sans">
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <h3 className="text-white font-sans font-black flex items-center gap-2 uppercase text-base shrink-0 select-none">
              <span className="text-purple-400">⟭⟬⁷</span> {publishedConfig?.sidebar?.logoText || 'BANGTAN GALLERY'}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
              {publishedConfig?.footer?.description || 'The ultimate independent fan coordinates created by ARMY to track BTS. Enjoy music sheets, media players and 13 June anniversary countdown animations.'}
            </p>

            {/* Permanent & Official Social Links */}
            <div className="pt-2">
              <span className="text-[10px] font-mono uppercase text-purple-300 font-bold block mb-2 tracking-wider">
                Official Communities & Channels
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={publishedConfig?.socialLinks?.telegramChannel || publishedConfig?.socialLinks?.telegram || "https://t.me/arirang_army7"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/30 theme-icon flex items-center justify-center transition-all cursor-pointer shadow-sm"
                  title="Telegram Channel (Broadcasts)"
                >
                  <Send className="w-3.5 h-3.5" />
                </a>
                <a
                  href={publishedConfig?.socialLinks?.telegramCommunity || publishedConfig?.socialLinks?.telegramChat || "https://t.me/arirang_army7chat"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/30 theme-icon flex items-center justify-center transition-all cursor-pointer shadow-sm"
                  title="Telegram Community Chat (ARMY Group)"
                >
                  <MessageSquareHeart className="w-3.5 h-3.5" />
                </a>
                <a
                  href={publishedConfig?.socialLinks?.twitter || "https://x.com/arirang_army_7"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/30 theme-icon flex items-center justify-center transition-all cursor-pointer shadow-sm"
                  title="X (Twitter) Official"
                >
                  <Twitter className="w-3.5 h-3.5" />
                </a>
                <a
                  href={publishedConfig?.socialLinks?.kofi || publishedConfig?.footer?.kofiUrl || "https://ko-fi.com/bangtangallery"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-rose-950/50 border border-white/5 hover:border-rose-500/40 theme-icon flex items-center justify-center transition-all cursor-pointer shadow-sm"
                  title="Support on Ko-fi"
                >
                  <Coffee className="w-3.5 h-3.5" />
                </a>
                <a
                  href={publishedConfig?.socialLinks?.youtube || "https://www.youtube.com/user/BANGTANTV"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/30 theme-icon flex items-center justify-center transition-all cursor-pointer shadow-sm"
                  title="YouTube Official"
                >
                  <Youtube className="w-3.5 h-3.5" />
                </a>
                <a
                  href={publishedConfig?.socialLinks?.instagram || "https://instagram.com/arirang_army_7"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/30 theme-icon flex items-center justify-center transition-all cursor-pointer shadow-sm"
                  title="Instagram Official"
                >
                  <Instagram className="w-3.5 h-3.5" />
                </a>
                <a
                  href={publishedConfig?.socialLinks?.facebook || "https://www.facebook.com/bangtan.official"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/30 theme-icon flex items-center justify-center transition-all cursor-pointer shadow-sm"
                  title="Facebook Official"
                >
                  <Facebook className="w-3.5 h-3.5" />
                </a>
                <a
                  href={publishedConfig?.socialLinks?.weverse || "https://weverse.io/bts/feed"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/30 theme-icon flex items-center justify-center transition-all cursor-pointer shadow-sm"
                  title="Weverse Official"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            <h4 className="text-purple-300 font-mono text-xs uppercase font-bold tracking-wider">Quick Navigation</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['Home', 'Members', 'Music', 'Videos', 'Gallery', 'Timeline', 'News', 'Events'].map(link => (
                <span
                  key={link}
                  onClick={() => handleQuickAccess(link)}
                  className="hover:text-purple-300 transition-colors cursor-pointer"
                >
                  {link}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3.5">
            <h4 className="text-purple-300 font-mono text-xs uppercase font-bold tracking-wider">Resources</h4>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <span onClick={() => handleQuickAccess('FAQ')} className="hover:text-purple-300 transition-colors cursor-pointer">Help FAQ Accordion</span>
              <span onClick={() => handleQuickAccess('Downloads')} className="hover:text-purple-300 transition-colors cursor-pointer">Device Wallpapers (HD)</span>
              <span onClick={() => handleQuickAccess('Contact')} className="hover:text-purple-300 transition-colors cursor-pointer">Feedback support team</span>
            </div>
          </div>

          <div className="space-y-3.5 font-sans">
            <h4 className="text-purple-300 font-mono text-xs uppercase font-bold tracking-wider">Fan Disclaimer</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              This website is an independent tribute site. Any trademarks, audio embeds, trademarks, or visual imagery belong to HYBE, BIGHIT Music, or official artists. No infringement is intended.
            </p>
            <div className="pt-2 text-xs border-t border-white/5 flex justify-between items-center text-gray-500">
              <div className="flex items-center gap-1.5">
                <span>Borahae! ARMY 💜</span>
              </div>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                id="back-to-top-btn"
                className="hover:text-purple-300 font-mono text-[10px] flex items-center gap-1 cursor-pointer bg-white/5 px-2 py-1 rounded"
              >
                Top <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 pt-8 mt-8 border-t border-white/10 text-center text-xs text-slate-500 font-mono flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="cursor-default select-none">
            {publishedConfig?.footer?.copyright || `© ${new Date().getFullYear()} Bangtan Gallery. Crafted for BTS and ARMY.`}
          </span>
          <span className="flex items-center gap-1.5">BTS 13 Winters & Springs</span>
        </div>
      </footer>

      {/* Persistent Mini Controller for Background Audio Playback */}
      <GlobalMiniPlayer 
        onNavigateToMusic={() => {
          setSelectedMember(null);
          setActiveTab('Music');
        }}
        activeTab={activeTab}
      />

      {/* Synced lyrics overlay (opens from the player bar or a track's Lyrics button) */}
      <LyricsViewer />
      <BirthdayWish />
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
      <ConcertMode open={concertModeOpen} onClose={() => setConcertModeOpen(false)} />

      {/* Immediacy blocker Welcome popup prompt */}
      <WelcomePopup onAccept={() => {}} />

      {/* Styled Floating Customizer Drawer */}
      <AnimatePresence>
        {isThemeOpen && (
          <ThemeCustomizerPanel isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
        )}
      </AnimatePresence>

      {/* Floating ARMY Bomb background player (bottom-left) */}
      <ArmyBombPlayer />

      {/* Floating Ko-fi Me CTA Button (permanently active on bottom-right corner) */}
      {(() => {
        const kofiUrl = publishedConfig?.socialLinks?.kofi || publishedConfig?.footer?.kofiUrl || "https://ko-fi.com/bangtangallery";
        if (!kofiUrl || kofiUrl.trim() === "") return null;
        return (
          <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 pointer-events-auto">
            <a
              href={kofiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-gradient-to-r from-[#ff5e5b] to-[#ea3834] text-white flex items-center justify-center shadow-[0_8px_30px_rgba(255,94,91,0.4)] hover:shadow-[0_8px_40px_rgba(236,72,153,0.5)] border border-white/10 hover:border-white/25 transition-all hover:scale-110 active:scale-95 cursor-pointer group"
              title="Support on Ko-fi"
            >
              <Coffee className="w-5 h-5 text-white animate-bounce" style={{ animationDuration: '2.5s' }} />
            </a>
          </div>
        );
      })()}


    </div>
    </>
  );
}

import { BackendProvider } from './context/BackendContext';

export default function App() {
  return (
    <BackendProvider>
      <ThemeCustomProvider>
        <AudioPlayerProvider>
          <AppContent />
        </AudioPlayerProvider>
      </ThemeCustomProvider>
    </BackendProvider>
  );
}
