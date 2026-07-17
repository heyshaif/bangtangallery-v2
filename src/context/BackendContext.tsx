import React, { createContext, useContext, useState, useEffect } from 'react';

// Client interface representing our live stats
export interface LiveStats {
  activeUsers: number;
  visitors: number;
  registeredUsers: number;
  videos: number;
  images: number;
  memes: number;
  posts: number;
  comments: number;
  likes: number;
  shares: number;
  totalViews: number;
}

export interface Comment {
  id: string;
  username: string;
  displayName: string;
  content: string;
  timestamp: string;
  replies?: Comment[];
}

export interface MediaItem {
  id: string;
  type: 'youtube' | 'facebook' | 'instagram' | 'x' | 'image';
  url: string;
  title: string;
  description: string;
  username: string;
  displayName: string;
  category: string;
  tags: string[];
  uploadedAt: string;
  likes: string[]; // List of sessionUids who liked
  comments: Comment[];
  sharesCount: number;
  saves: string[];
  bookmarks: string[];
  reports: number;
}

export interface AppNotification {
  id: string;
  type: 'like' | 'comment' | 'reply' | 'share' | 'follower' | 'mention';
  user: string;
  content: string;
  targetId?: string;
  timestamp: string;
}

interface BackendContextProps {
  currentUser: { username: string; displayName: string; avatarUrl: string } | null;
  registerUser: (username: string, displayName: string, avatarUrl?: string) => Promise<boolean>;
  stats: LiveStats;
  media: MediaItem[];
  notifications: AppNotification[];
  refreshData: () => Promise<void>;
  uploadMedia: (mediaData: Omit<MediaItem, 'id' | 'uploadedAt' | 'likes' | 'comments' | 'sharesCount' | 'saves' | 'bookmarks' | 'reports'> & { fileData?: string }) => Promise<boolean>;
  interactWithMedia: (id: string, action: 'like' | 'share' | 'save' | 'bookmark' | 'report') => Promise<void>;
  submitComment: (mediaId: string, content: string, commentId?: string) => Promise<void>;
  searchQuery: (q: string) => Promise<{ suggestions: any[]; results: MediaItem[] }>;
  sessionId: string;
}

const BackendContext = createContext<BackendContextProps | undefined>(undefined);

// Helper to generate a random session ID
const getOrGenerateSessionId = () => {
  let sid = sessionStorage.getItem('bts_session_id');
  if (!sid) {
    sid = 'sid_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    sessionStorage.setItem('bts_session_id', sid);
  }
  return sid;
};

// Default static fallbacks if backend is slow
const defaultStats: LiveStats = {
  activeUsers: 0,
  visitors: 0,
  registeredUsers: 0,
  videos: 0,
  images: 0,
  memes: 0,
  posts: 0,
  comments: 0,
  likes: 0,
  shares: 0,
  totalViews: 0
};

export function BackendProvider({ children }: { children: React.ReactNode }) {
  const [sessionId] = useState(getOrGenerateSessionId);
  const [currentUser, setCurrentUser] = useState<{ username: string; displayName: string; avatarUrl: string } | null>(() => {
    const saved = localStorage.getItem('bts_active_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [stats, setStats] = useState<LiveStats>(defaultStats);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Function to register nickname
  const registerUser = async (username: string, displayName: string, avatarUrl: string = '') => {
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, displayName, avatarUrl }),
      });
      if (res.ok) {
        const u = { username, displayName, avatarUrl };
        localStorage.setItem('bts_active_user', JSON.stringify(u));
        setCurrentUser(u);
        await refreshData();
        return true;
      }
    } catch (e) {
      console.error('Registration failed:', e);
    }
    return false;
  };

  // Bulk data fetch
  const refreshData = async () => {
    try {
      // Async requests
      const [statsRes, mediaRes, notiRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/media'),
        fetch('/api/notifications')
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
      if (mediaRes.ok) {
        const m = await mediaRes.json();
        setMedia(m);
      }
      if (notiRes.ok) {
        const n = await notiRes.json();
        setNotifications(n);
      }
    } catch (e) {
      console.warn('Backend server connection issue or polling offline. Self-recovering.');
    }
  };

  // Upload an image or video link
  const uploadMedia = async (mediaData: any) => {
    try {
      const uploaderUsername = mediaData.username || currentUser?.username || 'guest';
      const uploaderDisplayName = mediaData.displayName || currentUser?.displayName || 'Guest ARMY';
      const payload = {
        ...mediaData,
        username: uploaderUsername,
        displayName: uploaderDisplayName
      };
      
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        await refreshData();
        return true;
      }
    } catch (err) {
      console.error('Image upload failed', err);
    }
    return false;
  };

  // Interaction dispatcher
  const interactWithMedia = async (id: string, action: 'like' | 'share' | 'save' | 'bookmark' | 'report') => {
    try {
      const res = await fetch('/api/media/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action,
          sessionId,
          displayName: currentUser?.displayName || 'ARMY User'
        })
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error('Failed interaction post', err);
    }
  };

  // Submit comments
  const submitComment = async (mediaId: string, content: string, commentId?: string) => {
    try {
      const res = await fetch('/api/media/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId,
          commentId,
          username: currentUser?.username || 'guest',
          displayName: currentUser?.displayName || 'Guest ARMY 💜',
          content
        })
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error('Failed submitting comment', err);
    }
  };

  // Query search API
  const searchQuery = async (q: string) => {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Search request failed', err);
    }
    return { suggestions: [], results: [] };
  };

  // Unique session view tracking (runs once on mount)
  useEffect(() => {
    const recordUniqueView = async () => {
      try {
        await fetch('/api/stats/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
        await refreshData();
      } catch (e) {
        // Safe backend fallback log
      }
    };
    recordUniqueView();
  }, [sessionId]);

  // Periodic statistics polling & heartbeats
  useEffect(() => {
    const triggerHeartbeat = async () => {
      try {
        await fetch('/api/stats/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
      } catch (e) {
        // backend is offline during start
      }
    };

    triggerHeartbeat();
    
    // Stats reload & Heartbeat loop (every 7 seconds)
    const interval = setInterval(() => {
      triggerHeartbeat();
      refreshData();
    }, 7000);

    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <BackendContext.Provider
      value={{
        currentUser,
        registerUser,
        stats,
        media,
        notifications,
        refreshData,
        uploadMedia,
        interactWithMedia,
        submitComment,
        searchQuery,
        sessionId
      }}
    >
      {children}
    </BackendContext.Provider>
  );
}

export function useBackend() {
  const context = useContext(BackendContext);
  if (context === undefined) {
    throw new Error('useBackend must be used within a BackendProvider');
  }
  return context;
}
