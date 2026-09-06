import {
  doc,
  getDoc as fbGetDoc,
  setDoc as fbSetDoc,
  updateDoc as fbUpdateDoc,
  collection,
  getDocs as fbGetDocs,
  addDoc as fbAddDoc,
  deleteDoc as fbDeleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from './firebase';
import bcrypt from 'bcryptjs';
import { MEMBERS, ALBUMS, VIDEOS, GALLERY_ITEMS, TIMELINE_EVENTS, NEWS_ARTICLES, DOWNLOADS, FAN_ARTS, EVENTS, FAQS } from './data/btsData';

// Helper to check if string is base64 data URI
function isBase64DataUri(str: string): boolean {
  return typeof str === 'string' && str.startsWith('data:');
}

// Helper to convert base64 data URI to a blob
async function base64ToBlob(base64DataUri: string): Promise<Blob> {
  const res = await fetch(base64DataUri);
  return await res.blob();
}

// Robust LocalStorage Fallback Cache
function saveToLocalCache(collectionName: string, docId: string, data: any) {
  try {
    const key = `fs_cache_${collectionName}_${docId}`;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save to local cache:', err);
  }
}

function getFromLocalCache(collectionName: string, docId: string): any {
  try {
    const key = `fs_cache_${collectionName}_${docId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    return null;
  }
}

function saveCollectionToLocalCache(collectionName: string, items: any[]) {
  try {
    const key = `fs_col_cache_${collectionName}`;
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save collection to local cache:', err);
  }
}

function getCollectionFromLocalCache(collectionName: string): any[] | null {
  try {
    const key = `fs_col_cache_${collectionName}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    return null;
  }
}

function updateCollectionCacheWithItem(collectionName: string, docId: string, itemData: any, isDelete = false) {
  const list = getCollectionFromLocalCache(collectionName) || [];
  const index = list.findIndex((x: any) => x.id === docId);
  if (isDelete) {
    if (index !== -1) {
      list.splice(index, 1);
    }
  } else {
    const updatedItem = { id: docId, ...itemData };
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedItem };
    } else {
      list.unshift(updatedItem);
    }
  }
  saveCollectionToLocalCache(collectionName, list);
}

// Custom Safe wrappers for Firestore SDK to seamlessly handle offline states
async function getDoc(ref: any) {
  const path = ref.path;
  const parts = path.split('/');
  const collectionName = parts[0];
  const docId = parts[1];

  try {
    const snap = await fbGetDoc(ref);
    if (snap.exists()) {
      saveToLocalCache(collectionName, docId, snap.data());
    }
    return snap;
  } catch (error: any) {
    console.warn('[OFFLINE SAFE] getDoc failed, attempting cache:', error);
    const cachedData = getFromLocalCache(collectionName, docId);
    return {
      exists: () => cachedData !== null,
      data: () => cachedData,
      id: docId,
      ref: ref
    } as any;
  }
}

async function getDocs(ref: any) {
  const path = ref.path || (ref.type === 'query' ? ref._query?.path?.segments?.join('/') : null) || '';
  const collectionName = path.split('/')[0] || '';

  try {
    const snapshot = await fbGetDocs(ref);
    const list: any[] = [];
    snapshot.forEach(docSnap => {
      const item = docSnap.data();
      list.push({ id: docSnap.id, ...(item as any) });
      saveToLocalCache(collectionName, docSnap.id, item);
    });
    if (collectionName) {
      saveCollectionToLocalCache(collectionName, list);
    }
    return snapshot;
  } catch (error: any) {
    console.warn('[OFFLINE SAFE] getDocs failed, attempting cache:', error);
    const cachedList = getCollectionFromLocalCache(collectionName) || [];
    return {
      size: cachedList.length,
      empty: cachedList.length === 0,
      docs: cachedList.map(item => ({
        id: item.id || 'mock_id',
        data: () => item,
        exists: () => true
      })),
      forEach: (callback: any) => {
        cachedList.forEach((item) => {
          callback({
            id: item.id || 'mock_id',
            data: () => item,
            exists: () => true
          });
        });
      }
    } as any;
  }
}

async function setDoc(ref: any, data: any, options?: any) {
  const path = ref.path;
  const parts = path.split('/');
  const collectionName = parts[0];
  const docId = parts[1];

  if (options?.merge) {
    const existing = getFromLocalCache(collectionName, docId) || {};
    const merged = { ...existing, ...data };
    saveToLocalCache(collectionName, docId, merged);
    updateCollectionCacheWithItem(collectionName, docId, merged);
  } else {
    saveToLocalCache(collectionName, docId, data);
    updateCollectionCacheWithItem(collectionName, docId, data);
  }

  try {
    return await fbSetDoc(ref, data, options);
  } catch (error: any) {
    console.warn('[OFFLINE SAFE] setDoc failed, updated cache only:', error);
    return;
  }
}

async function updateDoc(ref: any, data: any) {
  const path = ref.path;
  const parts = path.split('/');
  const collectionName = parts[0];
  const docId = parts[1];

  const existing = getFromLocalCache(collectionName, docId) || {};
  const merged = { ...existing, ...data };
  saveToLocalCache(collectionName, docId, merged);
  updateCollectionCacheWithItem(collectionName, docId, merged);

  try {
    return await fbUpdateDoc(ref, data);
  } catch (error: any) {
    console.warn('[OFFLINE SAFE] updateDoc failed, updated cache only:', error);
    return;
  }
}

async function deleteDoc(ref: any) {
  const path = ref.path;
  const parts = path.split('/');
  const collectionName = parts[0];
  const docId = parts[1];

  try {
    const key = `fs_cache_${collectionName}_${docId}`;
    localStorage.removeItem(key);
  } catch (e) {}
  updateCollectionCacheWithItem(collectionName, docId, null, true);

  try {
    return await fbDeleteDoc(ref);
  } catch (error: any) {
    console.warn('[OFFLINE SAFE] deleteDoc failed, updated cache only:', error);
    return;
  }
}

async function addDoc(ref: any, data: any) {
  const path = ref.path || '';
  const collectionName = path.split('/')[0] || '';
  const docId = 'auto_' + Math.random().toString(36).substr(2, 9);

  saveToLocalCache(collectionName, docId, data);
  updateCollectionCacheWithItem(collectionName, docId, data);

  try {
    return await fbAddDoc(ref, data);
  } catch (error: any) {
    console.warn('[OFFLINE SAFE] addDoc failed, updated cache only:', error);
    return { id: docId } as any;
  }
}

// Seeding Default Configurations
const defaultHome = {
  heroTitle: 'BANGTAN GALLERY',
  heroSubtitle: 'The Ultimate Independent ARMY Archive',
  typingPhrases: [
    'We had only seven. But we have you all now. 💜',
    'Living without passion is like being dead. 🐰',
    'Speak yourself. Find your name. Find your voice. 🐨',
    'I purple you for an eternity. Borahae! 🐯'
  ],
  welcomeHeading: 'Welcome, ARMY! 💜',
  welcomeMessage: 'Explore the complete histories, albums, and wallpapers of the worlds biggest group BTS!'
};

const defaultSeo = {
  metaTitle: 'BANGTAN GALLERY - The Ultimate Independent ARMY Archive',
  metaDescription: 'Read biographies, listen to songs, watch and download wallpapers from BTS anniversary archives.',
  keywords: 'BTS, ARMY, Bangtan, Jungkook, Jimin, RM, Jin, Suga, V, J-Hope',
  openGraphImage: 'https://i.pinimg.com/736x/9b/88/35/9b88358c4e29a985bf622f9eeeb67125.jpg',
  faviconUrl: 'https://img.icons8.com/color/48/bts-logo.png'
};

const defaultTheme = {
  accentColor: 'purple',
  fonts: {
    primary: 'Inter',
    display: 'Space Grotesk',
    mono: 'JetBrains Mono'
  }
};

const defaultWebsiteConfig = {
  home: defaultHome,
  seo: defaultSeo,
  theme: defaultTheme,
  members: MEMBERS,
  albums: ALBUMS,
  videos: VIDEOS,
  gallery: GALLERY_ITEMS,
  timeline: TIMELINE_EVENTS,
  news: NEWS_ARTICLES,
  downloads: DOWNLOADS,
  faqs: FAQS,
  events: EVENTS,
  spotifyEmbeds: [
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
  ]
};

// Ensure Firestore collections are initialized
let isSeedingCompleted = false;
async function ensureSeeded() {
  if (isSeedingCompleted) return;
  isSeedingCompleted = true;

  // Pre-seed local cache defaults to guarantee offline capability immediately
  try {
    if (!localStorage.getItem('fs_cache_config_published')) {
      saveToLocalCache('config', 'published', defaultWebsiteConfig);
    }
    if (!localStorage.getItem('fs_cache_config_draft')) {
      saveToLocalCache('config', 'draft', defaultWebsiteConfig);
    }
    if (!localStorage.getItem('fs_cache_config_admin')) {
      saveToLocalCache('config', 'admin', {
        adminEmail: 'tgarirangarmy7@gmail.com',
        adminPassword: bcrypt.hashSync('army7seven', 10),
        adminSecurityQuestion: 'What is the official fan base name of BTS?',
        adminSecurityAnswer: bcrypt.hashSync('army', 10),
        adminBackupCode: 'ARMY-7777-SEVEN',
        temporaryPassDisabled: false,
        adminMedia: [
          { id: 'm-seed-1', name: 'BTS Proof Album Cover.jpg', type: 'image', size: '142 KB', url: 'https://i.pinimg.com/736x/50/bb/88/50bb8896a2895bdd08e5a38a80665963.jpg', isDeleted: false, uploadDate: new Date().toISOString() },
          { id: 'm-seed-2', name: 'BTS Festa Concert Crowd.png', type: 'image', size: '2.4 MB', url: 'https://i.pinimg.com/736x/50/bb/88/50bb8896a2895bdd08e5a38a80665963.jpg', isDeleted: false, uploadDate: new Date().toISOString() },
          { id: 'm-seed-3', name: 'Group Profile HD Wallpaper.jpg', type: 'image', size: '1.8 MB', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80', isDeleted: false, uploadDate: new Date().toISOString() }
        ],
        activityLogs: []
      });
    }
    if (!localStorage.getItem('fs_cache_config_liveStream')) {
      saveToLocalCache('config', 'liveStream', {
        isStreaming: false,
        title: 'BTS WORLD TOUR ARIRANG IN LOS ANGELES 2026',
        category: 'Festa',
        url: '',
        streamKey: 'live_army_7777',
        viewers: 0
      });
    }
    if (!localStorage.getItem('fs_cache_config_stats')) {
      saveToLocalCache('config', 'stats', {
        total_views: 0,
        shares: 0,
        downloads: 0
      });
    }
    if (!localStorage.getItem('fs_col_cache_voting_submissions')) {
      const seedSubs = [
        {
          id: 'vsub-seed-1',
          title: 'Mnet M Countdown Milestone',
          platform: 'Mnet Plus App',
          coverUrl: 'https://i.pinimg.com/736x/50/bb/88/50bb8896a2895bdd08e5a38a80665963.jpg',
          voteNowUrl: 'https://mnetplus.world',
          description: 'Vote for BTS on M Countdown weekly ranking to support their promotion anniversary! Follow official guides to cast daily tickets.',
          startDate: '2026-06-01',
          endDate: '2026-07-31',
          caption: '#MCOUNTDOWN_BTS_WIN',
          additionalInfo: 'Please create multiple accounts to secure votes.',
          submittedBy: 'ARMY_Jane',
          submittedAt: new Date().toISOString(),
          status: 'pending'
        },
        {
          id: 'vsub-seed-2',
          title: 'Seoul Music Awards Main Prize',
          platform: 'SMA Official App',
          coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
          voteNowUrl: 'https://seoulmusicawards.com',
          description: 'Support BTS for the SMA Main Category (Bonsang). Cast tickets daily through the official mobile app.',
          startDate: '2026-05-15',
          endDate: '2026-08-15',
          caption: '#SMA_BTS_BONSANG',
          additionalInfo: 'Redeem coupons daily via voting sponsors.',
          submittedBy: 'purple_wave',
          submittedAt: new Date().toISOString(),
          status: 'approved'
        }
      ];
      saveCollectionToLocalCache('voting_submissions', seedSubs);
    }
  } catch (e) {
    console.warn('[OFFLINE PRE-SEED] Could not initialize local caches:', e);
  }

  try {
    console.log('[FIREBASE CONTROLLER] Starting seeding check...');
    
    // Step 1: Published website config
    try {
      const publishedRef = doc(db, 'config', 'published');
      const publishedSnap = await getDoc(publishedRef);
      if (publishedSnap.exists()) {
        saveToLocalCache('config', 'published', publishedSnap.data());
      } else {
        console.log('[FIREBASE CONTROLLER] Seeding initial published website configuration...');
        await setDoc(publishedRef, defaultWebsiteConfig);
        saveToLocalCache('config', 'published', defaultWebsiteConfig);
      }
    } catch (e) {
      console.error('[FIREBASE CONTROLLER] Error during published config seeding:', e);
    }

    // Step 2: Draft website config
    try {
      const draftRef = doc(db, 'config', 'draft');
      const draftSnap = await getDoc(draftRef);
      if (draftSnap.exists()) {
        saveToLocalCache('config', 'draft', draftSnap.data());
      } else {
        console.log('[FIREBASE CONTROLLER] Seeding initial draft website configuration...');
        await setDoc(draftRef, defaultWebsiteConfig);
        saveToLocalCache('config', 'draft', defaultWebsiteConfig);
      }
    } catch (e) {
      console.error('[FIREBASE CONTROLLER] Error during draft config seeding:', e);
    }

    // Step 3: Admin config
    try {
      const adminRef = doc(db, 'config', 'admin');
      const adminSnap = await getDoc(adminRef);
      if (adminSnap.exists()) {
        saveToLocalCache('config', 'admin', adminSnap.data());
      } else {
        console.log('[FIREBASE CONTROLLER] Seeding initial admin settings...');
        const adminData = {
          adminEmail: 'tgarirangarmy7@gmail.com',
          adminPassword: bcrypt.hashSync('army7seven', 10),
          adminSecurityQuestion: 'What is the official fan base name of BTS?',
          adminSecurityAnswer: bcrypt.hashSync('army', 10),
          adminBackupCode: 'ARMY-7777-SEVEN',
          temporaryPassDisabled: false,
          adminMedia: [
            { id: 'm-seed-1', name: 'BTS Proof Album Cover.jpg', type: 'image', size: '142 KB', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80', isDeleted: false, uploadDate: new Date().toISOString() },
            { id: 'm-seed-2', name: 'BTS Festa Concert Crowd.png', type: 'image', size: '2.4 MB', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80', isDeleted: false, uploadDate: new Date().toISOString() },
            { id: 'm-seed-3', name: 'Group Profile HD Wallpaper.jpg', type: 'image', size: '1.8 MB', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80', isDeleted: false, uploadDate: new Date().toISOString() }
          ],
          activityLogs: []
        };
        await setDoc(adminRef, adminData);
        saveToLocalCache('config', 'admin', adminData);
      }
    } catch (e) {
      console.error('[FIREBASE CONTROLLER] Error during admin config seeding:', e);
    }

    // Step 4: Live stream config
    try {
      const liveRef = doc(db, 'config', 'liveStream');
      const liveSnap = await getDoc(liveRef);
      if (liveSnap.exists()) {
        saveToLocalCache('config', 'liveStream', liveSnap.data());
      } else {
        const liveData = {
          isStreaming: false,
          title: 'BTS WORLD TOUR IN LOS ANGELES DAY 💜',
          category: 'Festa',
          url: '',
          streamKey: 'live_army_7777',
          viewers: 0
        };
        await setDoc(liveRef, liveData);
        saveToLocalCache('config', 'liveStream', liveData);
      }
    } catch (e) {
      console.error('[FIREBASE CONTROLLER] Error during live config seeding:', e);
    }

    // Step 5: Stats config
    try {
      const statsRef = doc(db, 'config', 'stats');
      const statsSnap = await getDoc(statsRef);
      if (statsSnap.exists() && statsSnap.data()?.total_views !== 12450) {
        saveToLocalCache('config', 'stats', statsSnap.data());
      } else {
        const statsData = {
          total_views: 0,
          shares: 0,
          downloads: 0
        };
        await setDoc(statsRef, statsData);
        saveToLocalCache('config', 'stats', statsData);
      }
    } catch (e) {
      console.error('[FIREBASE CONTROLLER] Error during stats config seeding:', e);
    }

    // Step 6: Voting submissions check
    try {
      const votingSubSnap = await getDocs(collection(db, 'voting_submissions'));
      const list: any[] = [];
      votingSubSnap.forEach(snap => list.push(snap.data()));
      if (list.length > 0) {
        saveCollectionToLocalCache('voting_submissions', list);
      } else {
        console.log('[FIREBASE CONTROLLER] Seeding initial voting submissions...');
        const seedSubs = [
          {
            id: 'vsub-seed-1',
            title: 'Mnet M Countdown Milestone',
            platform: 'Mnet Plus App',
            coverUrl: 'https://i.pinimg.com/1200x/e5/66/57/e56657c26946cf06b7b242f79b955af1.jpg',
            voteNowUrl: 'https://mnetplus.world',
            description: 'Vote for BTS on M Countdown weekly ranking to support their promotion anniversary! Follow official guides to cast daily tickets.',
            startDate: '2026-06-01',
            endDate: '2026-07-31',
            caption: '#MCOUNTDOWN_BTS_WIN',
            additionalInfo: 'Please create multiple accounts to secure votes.',
            submittedBy: 'ARMY_Jane',
            submittedAt: new Date().toISOString(),
            status: 'pending'
          },
          {
            id: 'vsub-seed-2',
            title: 'Seoul Music Awards Main Prize',
            platform: 'SMA Official App',
            coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
            voteNowUrl: 'https://seoulmusicawards.com',
            description: 'Support BTS for the SMA Main Category (Bonsang). Cast tickets daily through the official mobile app.',
            startDate: '2026-05-15',
            endDate: '2026-08-15',
            caption: '#SMA_BTS_BONSANG',
            additionalInfo: 'Redeem coupons daily via voting sponsors.',
            submittedBy: 'purple_wave',
            submittedAt: new Date().toISOString(),
            status: 'approved'
          }
        ];
        for (const item of seedSubs) {
          await setDoc(doc(db, 'voting_submissions', item.id), item);
        }
        saveCollectionToLocalCache('voting_submissions', seedSubs);
      }
    } catch (e) {
      console.error('[FIREBASE CONTROLLER] Error reading or seeding voting_submissions:', e);
    }

    isSeedingCompleted = true;
    console.log('[FIREBASE CONTROLLER] Seeding check completed successfully.');
  } catch (err) {
    console.error('[FIREBASE CONTROLLER] General error during seeding:', err);
  }
}

// Log admin action to firestore
async function logAdminActivity(action: string, details: string) {
  try {
    const adminRef = doc(db, 'config', 'admin');
    const adminSnap = await getDoc(adminRef);
    if (adminSnap.exists()) {
      const data = adminSnap.data();
      const logs = data.activityLogs || [];
      const newLog = {
        id: `log_${Date.now()}`,
        action,
        details,
        timestamp: new Date().toISOString(),
        ip: 'Client-Side Serverless',
        browser: navigator.userAgent
      };
      await updateDoc(adminRef, {
        activityLogs: [newLog, ...logs].slice(0, 100) // Keep last 100 logs
      });
    }
  } catch (e) {
    console.error('Failed to log admin activity', e);
  }
}

export async function handleApiRequest(urlStr: string, method: string, body: any): Promise<any> {
  await ensureSeeded();

  try {
    const url = new URL(urlStr, window.location.origin);
    const path = url.pathname;

    // Direct Firebase Authentication protection for all admin-only paths
    const isVotingSubmissionsPublic = path === '/api/voting/submissions' && url.searchParams.get('submittedBy') !== null;

    const isAdminPath = 
      path.startsWith('/api/admin/') ||
      path === '/api/config/draft' ||
      path === '/api/config/publish' ||
      path === '/api/music/submissions' ||
      path.startsWith('/api/music/submissions/') ||
      (path === '/api/voting/submissions' && !isVotingSubmissionsPublic) ||
      path.startsWith('/api/voting/submissions/') ||
      path === '/api/video/submissions' ||
      path.startsWith('/api/video/submissions/');

    if (isAdminPath && path !== '/api/admin/login') {
      if (!auth.currentUser) {
        console.error(`[ROUTE PROTECTION] Denied unauthenticated request: ${method} ${path}`);
        throw new Error('Unauthorized administrative access attempt.');
      }
    }

  // 1. GET Config Draft
  if (path === '/api/config/draft' && method === 'GET') {
    try {
      const draftSnap = await getDoc(doc(db, 'config', 'draft'));
      if (draftSnap.exists()) {
        const data = draftSnap.data();
        saveToLocalCache('config', 'draft', data);
        return data;
      }
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Serving config draft from local cache or default');
      return getFromLocalCache('config', 'draft') || defaultWebsiteConfig;
    }
    return defaultWebsiteConfig;
  }

  // 2. GET Config Published
  if (path === '/api/config/published' && method === 'GET') {
    try {
      const pubSnap = await getDoc(doc(db, 'config', 'published'));
      if (pubSnap.exists()) {
        const data = pubSnap.data();
        saveToLocalCache('config', 'published', data);
        return data;
      }
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Serving config published from local cache or default');
      return getFromLocalCache('config', 'published') || defaultWebsiteConfig;
    }
    return defaultWebsiteConfig;
  }

  // 3. POST Config Draft Update
  if (path === '/api/config/draft' && method === 'POST') {
    try {
      await setDoc(doc(db, 'config', 'draft'), body, { merge: true });
      saveToLocalCache('config', 'draft', { ...(getFromLocalCache('config', 'draft') || defaultWebsiteConfig), ...body });
      await logAdminActivity('Edit Content Draft', 'Saved draft changes of website settings in Firestore');
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Saving draft to local cache only');
      saveToLocalCache('config', 'draft', { ...(getFromLocalCache('config', 'draft') || defaultWebsiteConfig), ...body });
    }
    return { success: true, message: 'Draft saved successfully.' };
  }

  // 4. POST Config Publish (Draft -> Published)
  if (path === '/api/config/publish' && method === 'POST') {
    let draftData = getFromLocalCache('config', 'draft') || defaultWebsiteConfig;
    try {
      const draftSnap = await getDoc(doc(db, 'config', 'draft'));
      if (draftSnap.exists()) {
        draftData = draftSnap.data();
      }
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Could not get draft from Firestore, using cached draft');
    }

    try {
      await setDoc(doc(db, 'config', 'published'), draftData);
      saveToLocalCache('config', 'published', draftData);
      
      // Add general notification about publication
      const notiId = 'publish_' + Date.now();
      const newNoti = {
        id: notiId,
        type: 'festa',
        user: 'System Admin',
        content: 'FESTA Content Updates and Visual Tweaks have been published! 💜',
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, 'notifications', notiId), newNoti);
      
      await logAdminActivity('Publish Content', 'Published draft content to live website successfully');
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Publishing to local cache only');
      saveToLocalCache('config', 'published', draftData);
      // Add local notification
      const localNotis = getCollectionFromLocalCache('notifications') || [];
      const notiId = 'publish_' + Date.now();
      const newNoti = {
        id: notiId,
        type: 'festa',
        user: 'System Admin',
        content: 'FESTA Content Updates and Visual Tweaks have been published! 💜',
        timestamp: new Date().toISOString()
      };
      saveCollectionToLocalCache('notifications', [newNoti, ...localNotis]);
    }
    return { success: true, message: 'Published successfully.' };
  }

  // 5. GET Stats
  if (path === '/api/stats' && method === 'GET') {
    let statsData = { total_views: 0, shares: 0, downloads: 0 };
    try {
      const statsSnap = await getDoc(doc(db, 'config', 'stats'));
      if (statsSnap.exists()) {
        statsData = statsSnap.data() as any;
        saveToLocalCache('config', 'stats', statsData);
      }
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Loading stats from local cache');
      statsData = getFromLocalCache('config', 'stats') || { total_views: 0, shares: 0, downloads: 0 };
    }
    
    // Estimate active users with a random offset to look live and live-polling
    const activeUsers = Math.floor(Math.random() * 8) + 12; // 12-20 live ARMYs
    
    let registeredUsersCount = 0;
    try {
      const registeredUsersSnap = await getDocs(collection(db, 'users'));
      registeredUsersCount = registeredUsersSnap.size || 0;
      saveToLocalCache('stats', 'registeredUsersCount', registeredUsersCount);
    } catch (e) {
      registeredUsersCount = getFromLocalCache('stats', 'registeredUsersCount') || 0;
    }

    let postsCount = 0;
    try {
      const mediaSnap = await getDocs(collection(db, 'media'));
      postsCount = mediaSnap.size || 0;
      saveToLocalCache('stats', 'postsCount', postsCount);
    } catch (e) {
      postsCount = getFromLocalCache('stats', 'postsCount') || 0;
    }

    return {
      activeUsers,
      visitors: statsData.total_views || 0,
      registeredUsers: registeredUsersCount,
      videos: 42,
      images: 68,
      memes: 29,
      posts: postsCount,
      comments: 114,
      likes: statsData.shares || 0,
      shares: statsData.shares || 0,
      totalViews: statsData.total_views || 0
    };
  }

  // 6. POST Stats Increments
  if (path === '/api/stats/view' && method === 'POST') {
    let statsData = getFromLocalCache('config', 'stats') || { total_views: 0, shares: 0, downloads: 0 };
    statsData.total_views = (statsData.total_views || 0) + 1;
    saveToLocalCache('config', 'stats', statsData);

    try {
      const statsRef = doc(db, 'config', 'stats');
      const snap = await getDoc(statsRef);
      if (snap.exists()) {
        const cur = snap.data();
        await updateDoc(statsRef, { total_views: (cur.total_views || 0) + 1 });
      }
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] view count incremented in cache only');
    }
    return { success: true };
  }

  if (path === '/api/stats/heartbeat' && method === 'POST') {
    return { success: true };
  }

  if (path === '/api/stats/download' && method === 'POST') {
    let statsData = getFromLocalCache('config', 'stats') || { total_views: 0, shares: 0, downloads: 0 };
    const nextDl = (statsData.downloads || 0) + 1;
    statsData.downloads = nextDl;
    saveToLocalCache('config', 'stats', statsData);

    try {
      const statsRef = doc(db, 'config', 'stats');
      const snap = await getDoc(statsRef);
      if (snap.exists()) {
        const cur = snap.data();
        const liveDl = (cur.downloads || 0) + 1;
        await updateDoc(statsRef, { downloads: liveDl });
        return { success: true, downloadCount: liveDl };
      }
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] download count incremented in cache only');
    }
    return { success: true, downloadCount: nextDl };
  }

  // 7. GET Media wall items
  if (path === '/api/media' && method === 'GET') {
    try {
      const mediaSnap = await getDocs(collection(db, 'media'));
      const items: any[] = [];
      mediaSnap.forEach(docSnap => {
        items.push(docSnap.data());
      });
      saveCollectionToLocalCache('media', items);
      // Sort by uploadedAt desc
      items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      return items;
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Loading media from local cache');
      const items = getCollectionFromLocalCache('media') || [];
      items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      return items;
    }
  }

  // 8. POST Media Upload (Supports File Upload to Firebase Storage!)
  if (path === '/api/media/upload' && method === 'POST') {
    let imageUrl = body.url || '';
    const uploadData = body.fileData || body.base64 || body.url;
    if (uploadData && isBase64DataUri(uploadData)) {
      try {
        const fileBlob = await base64ToBlob(uploadData);
        const fileName = `media_${Date.now()}_upload`;
        const storageRef = ref(storage, `media/${fileName}`);
        const snap = await uploadBytes(storageRef, fileBlob);
        imageUrl = await getDownloadURL(snap.ref);
      } catch (e) {
        console.error('Firebase Storage Upload failed:', e);
        imageUrl = uploadData; // Fallback to base64 data URI
      }
    }

    const mediaId = 'm_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    const newMediaItem = {
      id: mediaId,
      type: body.type || 'image',
      url: imageUrl,
      title: body.title || 'Untitled Upload',
      description: body.description || '',
      username: body.username || 'guest',
      displayName: body.displayName || 'Guest ARMY',
      category: body.category || 'Festa',
      tags: body.tags || [],
      uploadedAt: new Date().toISOString(),
      likes: [],
      comments: [],
      sharesCount: 0,
      saves: [],
      bookmarks: [],
      reports: 0
    };

    const cachedMedia = getCollectionFromLocalCache('media') || [];
    saveCollectionToLocalCache('media', [newMediaItem, ...cachedMedia]);

    try {
      await setDoc(doc(db, 'media', mediaId), newMediaItem);
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Uploaded media saved locally only');
    }
    return { success: true, item: newMediaItem };
  }

  // 9. POST Media Interact
  if (path === '/api/media/interact' && method === 'POST') {
    const action = body.action;
    const sid = body.sessionId;

    const cachedMedia = getCollectionFromLocalCache('media') || [];
    const cachedItemIdx = cachedMedia.findIndex((m: any) => m.id === body.id);
    if (cachedItemIdx >= 0) {
      const item = cachedMedia[cachedItemIdx];
      if (action === 'like') {
        const likes = Array.isArray(item.likes) ? [...item.likes] : [];
        const idx = likes.indexOf(sid);
        if (idx >= 0) likes.splice(idx, 1);
        else likes.push(sid);
        item.likes = likes;
      } else if (action === 'save') {
        const saves = Array.isArray(item.saves) ? [...item.saves] : [];
        const idx = saves.indexOf(sid);
        if (idx >= 0) saves.splice(idx, 1);
        else saves.push(sid);
        item.saves = saves;
      } else if (action === 'bookmark') {
        const bms = Array.isArray(item.bookmarks) ? [...item.bookmarks] : [];
        const idx = bms.indexOf(sid);
        if (idx >= 0) bms.splice(idx, 1);
        else bms.push(sid);
        item.bookmarks = bms;
      } else if (action === 'share') {
        item.sharesCount = (item.sharesCount || 0) + 1;
      } else if (action === 'report') {
        item.reports = (item.reports || 0) + 1;
      }
      saveCollectionToLocalCache('media', cachedMedia);
    }

    try {
      const mediaRef = doc(db, 'media', body.id);
      const snap = await getDoc(mediaRef);
      if (snap.exists()) {
        const item = snap.data();
        const updates: any = {};

        if (action === 'like') {
          const likes = Array.isArray(item.likes) ? [...item.likes] : [];
          const idx = likes.indexOf(sid);
          if (idx >= 0) likes.splice(idx, 1);
          else likes.push(sid);
          updates.likes = likes;
        } else if (action === 'save') {
          const saves = Array.isArray(item.saves) ? [...item.saves] : [];
          const idx = saves.indexOf(sid);
          if (idx >= 0) saves.splice(idx, 1);
          else saves.push(sid);
          updates.saves = saves;
        } else if (action === 'bookmark') {
          const bms = Array.isArray(item.bookmarks) ? [...item.bookmarks] : [];
          const idx = bms.indexOf(sid);
          if (idx >= 0) bms.splice(idx, 1);
          else bms.push(sid);
          updates.bookmarks = bms;
        } else if (action === 'share') {
          updates.sharesCount = (item.sharesCount || 0) + 1;
        } else if (action === 'report') {
          updates.reports = (item.reports || 0) + 1;
        }

        await updateDoc(mediaRef, updates);
      }
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Interaction updated locally only');
    }
    return { success: true };
  }

  // 10. POST Media Comment
  if (path === '/api/media/comment' && method === 'POST') {
    const newComment = {
      id: 'c_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
      username: body.username || 'guest',
      displayName: body.displayName || 'Guest ARMY 💜',
      content: body.content,
      timestamp: new Date().toISOString()
    };

    const cachedMedia = getCollectionFromLocalCache('media') || [];
    const cachedItemIdx = cachedMedia.findIndex((m: any) => m.id === body.mediaId);
    if (cachedItemIdx >= 0) {
      const item = cachedMedia[cachedItemIdx];
      const comments = Array.isArray(item.comments) ? [...item.comments] : [];
      comments.push(newComment);
      item.comments = comments;
      saveCollectionToLocalCache('media', cachedMedia);
    }

    try {
      const mediaRef = doc(db, 'media', body.mediaId);
      const snap = await getDoc(mediaRef);
      if (snap.exists()) {
        const item = snap.data();
        const comments = Array.isArray(item.comments) ? [...item.comments] : [];
        comments.push(newComment);
        await updateDoc(mediaRef, { comments });
        return { success: true, comment: newComment };
      }
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Comment saved locally only');
    }
    return { success: true, comment: newComment };
  }

  // 10b. GET News Comments
  if (path === '/api/news/comments' && method === 'GET') {
    const articleId = url.searchParams.get('articleId') || '';
    let items: any[] = [];
    try {
      const snap = await getDocs(collection(db, 'news_comments'));
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.articleId === articleId) {
          items.push(data);
        }
      });
      saveCollectionToLocalCache(`news_comments_${articleId}`, items);
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Loading news comments from cache');
      items = getCollectionFromLocalCache(`news_comments_${articleId}`) || [];
    }
    // Sort oldest first for readable thread conversation flow
    items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return items;
  }

  // 10c. POST News Comment or Reply
  if (path === '/api/news/comments' && method === 'POST') {
    const commentId = 'nc_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    const newComment = {
      id: commentId,
      articleId: body.articleId,
      username: (body.username || 'guest').trim().replace(/[^a-zA-Z0-9_]/g, ''),
      displayName: body.displayName || body.username || 'Guest ARMY 💜',
      content: body.content,
      timestamp: new Date().toISOString(),
      parentId: body.parentId || null
    };

    const cachedItems = getCollectionFromLocalCache(`news_comments_${body.articleId}`) || [];
    saveCollectionToLocalCache(`news_comments_${body.articleId}`, [...cachedItems, newComment]);

    try {
      await setDoc(doc(db, 'news_comments', commentId), newComment);
      await logAdminActivity('New News Comment', `User @${newComment.username} commented on article ID: ${body.articleId}`);
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] News comment saved locally only');
    }

    return { success: true, comment: newComment };
  }

  // 11. GET Notifications list
  if (path === '/api/notifications' && method === 'GET') {
    try {
      const notiSnap = await getDocs(collection(db, 'notifications'));
      const items: any[] = [];
      notiSnap.forEach(docSnap => {
        items.push(docSnap.data());
      });
      saveCollectionToLocalCache('notifications', items);
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return items.slice(0, 50); // Keep last 50 only
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Loading notifications from cache');
      const items = getCollectionFromLocalCache('notifications') || [];
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return items.slice(0, 50);
    }
  }

  // 12. GET Search query
  if (path === '/api/search' && method === 'GET') {
    const q = (url.searchParams.get('q') || '').toLowerCase().trim();
    if (!q) return { suggestions: [], results: [] };

    let allMedia: any[] = [];
    try {
      const mediaSnap = await getDocs(collection(db, 'media'));
      mediaSnap.forEach(docSnap => {
        allMedia.push(docSnap.data());
      });
      saveCollectionToLocalCache('media', allMedia);
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Loading search results from media cache');
      allMedia = getCollectionFromLocalCache('media') || [];
    }

    const suggestions = allMedia
      .filter(item => (item.title || '').toLowerCase().includes(q) || (item.category || '').toLowerCase().includes(q))
      .slice(0, 5)
      .map(item => item.title);

    const results = allMedia.filter(item => {
      return (item.title || '').toLowerCase().includes(q) ||
             (item.description || '').toLowerCase().includes(q) ||
             (item.category || '').toLowerCase().includes(q) ||
             (item.username || '').toLowerCase().includes(q) ||
             (item.displayName || '').toLowerCase().includes(q) ||
             (item.tags || []).some((t: string) => t.toLowerCase().includes(q));
    });

    return { suggestions, results };
  }

  // 13. POST User Handle registration
  if (path === '/api/users/register' && method === 'POST') {
    const usernameKey = body.username.toLowerCase();
    saveToLocalCache('users', usernameKey, {
      username: usernameKey,
      displayName: body.displayName,
      avatarUrl: body.avatarUrl || ''
    });

    try {
      const uRef = doc(db, 'users', usernameKey);
      await setDoc(uRef, {
        username: usernameKey,
        displayName: body.displayName,
        avatarUrl: body.avatarUrl || ''
      });
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] User handle registered locally only');
    }
    return { success: true };
  }

  // 14. GET and POST feedbacks
  if (path === '/api/feedbacks') {
    if (method === 'GET') {
      try {
        const fbSnap = await getDocs(collection(db, 'feedbacks'));
        const items: any[] = [];
        fbSnap.forEach(docSnap => {
          items.push(docSnap.data());
        });
        saveCollectionToLocalCache('feedbacks', items);
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return items.length > 0 ? items : [
          { id: 'fb1', name: 'ARMY_Borahae97', emojiRating: '🥰', starRating: 5, comment: 'This is the most gorgeous fan-site I have ever seen! The premium purple theme is stunning and I love reading the lyrics tabs. Happy Festa!', date: '6/10/2026' },
          { id: 'fb2', name: 'JooniesNamjooning', emojiRating: '🐨', starRating: 5, comment: 'I love RM biography detail here. Very complete, accurate, and intellectual. High-production web craft!', date: '6/8/2026' }
        ];
      } catch (e) {
        console.warn('[OFFLINE FALLBACK] Loading feedbacks from cache');
        const items = getCollectionFromLocalCache('feedbacks') || [
          { id: 'fb1', name: 'ARMY_Borahae97', emojiRating: '🥰', starRating: 5, comment: 'This is the most gorgeous fan-site I have ever seen! The premium purple theme is stunning and I love reading the lyrics tabs. Happy Festa!', date: '6/10/2026' },
          { id: 'fb2', name: 'JooniesNamjooning', emojiRating: '🐨', starRating: 5, comment: 'I love RM biography detail here. Very complete, accurate, and intellectual. High-production web craft!', date: '6/8/2026' }
        ];
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return items;
      }
    }
    if (method === 'POST') {
      const fbId = 'fb_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      const newItem = {
        id: fbId,
        name: body.name,
        emojiRating: body.emojiRating,
        starRating: body.starRating,
        comment: body.comment,
        date: new Date().toLocaleDateString('en-US')
      };
      
      const cachedFeedbacks = getCollectionFromLocalCache('feedbacks') || [];
      saveCollectionToLocalCache('feedbacks', [newItem, ...cachedFeedbacks]);

      try {
        await setDoc(doc(db, 'feedbacks', fbId), newItem);
      } catch (e) {
        console.warn('[OFFLINE FALLBACK] Feedback saved locally only');
      }
      return { success: true, item: newItem };
    }
  }

  // 15. GET and POST Fan Arts
  if (path === '/api/fan-arts') {
    if (method === 'GET') {
      try {
        const artSnap = await getDocs(collection(db, 'fan_arts'));
        const items: any[] = [];
        artSnap.forEach(docSnap => {
          items.push(docSnap.data());
        });
        saveCollectionToLocalCache('fan_arts', items);
        return items.length > 0 ? items : [
          { id: 'art-1', title: 'Golden Hour Jungkook', artist: 'ArtisticARMY_99', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=600&q=80', likes: 245 },
          { id: 'art-2', title: 'Moon Jin Oil Painting', artist: 'PurpleCanvas', imageUrl: 'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?auto=format&fit=crop&w=600&q=80', likes: 189 }
        ];
      } catch (e) {
        console.warn('[OFFLINE FALLBACK] Loading fan arts from cache');
        const items = getCollectionFromLocalCache('fan_arts') || [
          { id: 'art-1', title: 'Golden Hour Jungkook', artist: 'ArtisticARMY_99', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=600&q=80', likes: 245 },
          { id: 'art-2', title: 'Moon Jin Oil Painting', artist: 'PurpleCanvas', imageUrl: 'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?auto=format&fit=crop&w=600&q=80', likes: 189 }
        ];
        return items;
      }
    }
  }

  if (path.startsWith('/api/fan-arts/like/')) {
    const artId = path.split('/').pop() || '';
    const cachedArts = getCollectionFromLocalCache('fan_arts') || [];
    const cachedIdx = cachedArts.findIndex((a: any) => a.id === artId);
    let updatedLikes = 13;
    if (cachedIdx >= 0) {
      cachedArts[cachedIdx].likes = (cachedArts[cachedIdx].likes || 0) + 1;
      updatedLikes = cachedArts[cachedIdx].likes;
      saveCollectionToLocalCache('fan_arts', cachedArts);
    }

    try {
      const artRef = doc(db, 'fan_arts', artId);
      const snap = await getDoc(artRef);
      if (snap.exists()) {
        const current = snap.data();
        updatedLikes = (current.likes || 0) + 1;
        await updateDoc(artRef, { likes: updatedLikes });
      } else {
        await setDoc(artRef, {
          id: artId,
          title: 'User Liked Artwork',
          artist: 'Creative ARMY',
          imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=600&q=80',
          likes: updatedLikes
        });
      }
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Fan art liked locally only');
    }
    return { success: true, likes: updatedLikes };
  }

  // 16. POST Spotify Resolve
  if (path === '/api/spotify/resolve' && method === 'POST') {
    try {
      const spotifyUrl = body.url;
      // Fetch open Spotify oembed endpoint directly from client (completely serverless and CORS free)
      const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`);
      if (res.ok) {
        const sData = await res.json();
        return {
          success: true,
          title: sData.title || 'Spotify Track',
          thumbnail: sData.thumbnail_url || 'https://img.icons8.com/color/120/spotify.png',
          iframe: sData.html || ''
        };
      }
    } catch (e) {
      console.warn('CORS or offline fallback on client-side Spotify resolver:', e);
    }
    // Fallback if Spotify request blocked by CORS
    return {
      success: true,
      title: 'Resolved Spotify Song',
      thumbnail: 'https://img.icons8.com/color/120/spotify.png',
      iframe: `<iframe src="https://open.spotify.com/embed/track/${body.url.split('/').pop()?.split('?')[0]}" width="100%" height="80" frameBorder="0" allow="encrypted-media"></iframe>`
    };
  }

  // 17. Contact Submission Messages
  if (path === '/api/contact' || path === '/api/admin/contact') {
    if (method === 'POST') {
      const id = 'cm_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      const newContact = {
        id,
        name: body.name,
        email: body.email,
        subject: body.subject || 'Festa Query',
        message: body.message,
        createdAt: new Date().toISOString(),
        status: 'Unread',
        ip: 'Serverless client',
        browser: navigator.userAgent,
        country: 'Global'
      };
      
      const cachedMsgs = getCollectionFromLocalCache('contact_messages') || [];
      saveCollectionToLocalCache('contact_messages', [newContact, ...cachedMsgs]);

      try {
        await setDoc(doc(db, 'contact_messages', id), newContact);
      } catch (e) {
        console.warn('[OFFLINE FALLBACK] Contact message saved locally only');
      }
      return { success: true, message: 'Message sent securely!' };
    }
    if (method === 'GET') {
      try {
        const snap = await getDocs(collection(db, 'contact_messages'));
        const list: any[] = [];
        snap.forEach(docSnap => {
          list.push(docSnap.data());
        });
        saveCollectionToLocalCache('contact_messages', list);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return list;
      } catch (e) {
        console.warn('[OFFLINE FALLBACK] Loading contact messages from cache');
        const list = getCollectionFromLocalCache('contact_messages') || [];
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return list;
      }
    }
  }

  if (path.startsWith('/api/admin/contact/') && path.endsWith('/status')) {
    const id = path.split('/')[4];
    
    const cachedMsgs = getCollectionFromLocalCache('contact_messages') || [];
    const idx = cachedMsgs.findIndex((m: any) => m.id === id);
    if (idx >= 0) {
      cachedMsgs[idx].status = body.status;
      saveCollectionToLocalCache('contact_messages', cachedMsgs);
    }

    try {
      await updateDoc(doc(db, 'contact_messages', id), { status: body.status });
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Contact status updated locally only');
    }
    return { success: true };
  }

  if (path.startsWith('/api/admin/contact/') && method === 'DELETE') {
    const id = path.split('/')[4];
    
    const cachedMsgs = getCollectionFromLocalCache('contact_messages') || [];
    const filtered = cachedMsgs.filter((m: any) => m.id !== id);
    saveCollectionToLocalCache('contact_messages', filtered);

    try {
      await deleteDoc(doc(db, 'contact_messages', id));
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Contact message deleted locally only');
    }
    return { success: true };
  }

  // 18. User Submissions: Music, Videos, and Voting Suggestions
  if (path === '/api/music/submit' && method === 'POST') {
    const subId = 'msub_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    const newItem = {
      ...body,
      id: subId,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    const cachedMusicSubs = getCollectionFromLocalCache('music_submissions') || [];
    saveCollectionToLocalCache('music_submissions', [newItem, ...cachedMusicSubs]);

    try {
      await setDoc(doc(db, 'music_submissions', subId), newItem);
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Music submission saved locally only');
    }
    return { success: true, item: newItem };
  }

  if (path === '/api/video/submit' && method === 'POST') {
    const subId = 'vsub_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    const newItem = {
      ...body,
      id: subId,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    const cachedVideoSubs = getCollectionFromLocalCache('video_submissions') || [];
    saveCollectionToLocalCache('video_submissions', [newItem, ...cachedVideoSubs]);

    try {
      await setDoc(doc(db, 'video_submissions', subId), newItem);
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Video submission saved locally only');
    }
    return { success: true, item: newItem };
  }

  // GET Music Submissions
  if (path === '/api/music/submissions' && method === 'GET') {
    try {
      const subSnap = await getDocs(collection(db, 'music_submissions'));
      const items: any[] = [];
      subSnap.forEach(docSnap => {
        items.push(docSnap.data());
      });
      saveCollectionToLocalCache('music_submissions', items);
      // Sort by submittedAt desc
      items.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      return { success: true, submissions: items };
    } catch (e) {
      console.warn('[OFFLINE FALLBACK] Loading music submissions from cache');
      const items = getCollectionFromLocalCache('music_submissions') || [];
      items.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      return { success: true, submissions: items };
    }
  }

  // Approve Music Submission
  if (path.startsWith('/api/music/submissions/') && path.endsWith('/approve')) {
    const id = path.split('/')[4];
    const subRef = doc(db, 'music_submissions', id);
    try {
      const snap = await getDoc(subRef);
      if (snap.exists()) {
        await updateDoc(subRef, { status: 'approved' });

        const subData = snap.data();
        const track = {
          id: 'track_' + Date.now(),
          title: subData.title,
          artist: subData.artist,
          audioUrl: subData.audioUrl || '',
          spotifyUrl: subData.spotifyUrl || '',
          description: subData.description || '',
          genre: subData.genre || '2026',
          tags: subData.tags || ['spotify', 'shared'],
          coverUrl: subData.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
          submittedBy: subData.submittedBy || 'guest',
          displayName: subData.displayName || 'Guest ARMY',
          isPinned: false,
          isSpotlight: false,
          plays: 0,
          createdAt: new Date().toISOString()
        };

        // Add to draft and published configurations under digitalTracks array
        const draftRef = doc(db, 'config', 'draft');
        const draftSnap = await getDoc(draftRef);
        if (draftSnap.exists()) {
          const draftData = draftSnap.data();
          const digitalTracks = draftData.digitalTracks || [];
          await updateDoc(draftRef, { digitalTracks: [...digitalTracks, track] });
        }

        const pubRef = doc(db, 'config', 'published');
        const pubSnap = await getDoc(pubRef);
        if (pubSnap.exists()) {
          const pubData = pubSnap.data();
          const digitalTracks = pubData.digitalTracks || [];
          await updateDoc(pubRef, { digitalTracks: [...digitalTracks, track] });
        }

        await logAdminActivity('Approve Music Track', `Approved user-submitted song: ${track.title} by ${track.artist}`);
        return { success: true };
      }
    } catch (e) {
      console.error('Failed to approve music submission', e);
    }
    return { success: false, error: 'Track submission approval failed' };
  }

  // Reject Music Submission
  if (path.startsWith('/api/music/submissions/') && path.endsWith('/reject')) {
    const id = path.split('/')[4];
    try {
      const subRef = doc(db, 'music_submissions', id);
      await updateDoc(subRef, { status: 'rejected' });
      await logAdminActivity('Reject Music Track', `Rejected user-submitted song ID: ${id}`);
      return { success: true };
    } catch (e) {
      console.error('Failed to reject music submission', e);
    }
    return { success: false, error: 'Track submission rejection failed' };
  }

  // Delete Music Submission
  if (path.startsWith('/api/music/submissions/') && method === 'DELETE') {
    const id = path.split('/')[4];
    await deleteDoc(doc(db, 'music_submissions', id));
    await logAdminActivity('Delete Music Submission', `Deleted song submission ID: ${id}`);
    return { success: true };
  }

  // Music Pin / Spotlight actions
  if (path === '/api/music/user-action' && method === 'POST') {
    const { action, trackId } = body;
    const updateTracksState = async (configRef: any) => {
      const snap = await getDoc(configRef);
      if (snap.exists()) {
        const data = snap.data() as any;
        const digitalTracks = data.digitalTracks || [];
        const updated = digitalTracks.map((track: any) => {
          if (track.id === trackId) {
            if (action === 'pin') return { ...track, isPinned: true };
            if (action === 'unpin') return { ...track, isPinned: false };
            if (action === 'spotlight') return { ...track, isSpotlight: true };
            if (action === 'unspotlight') return { ...track, isSpotlight: false };
          } else {
            // For spotlight action, only one track can be spotlighted at a time
            if (action === 'spotlight') return { ...track, isSpotlight: false };
          }
          return track;
        });
        await updateDoc(configRef, { digitalTracks: updated });
      }
    };

    await updateTracksState(doc(db, 'config', 'draft'));
    await updateTracksState(doc(db, 'config', 'published'));
    await logAdminActivity('Music Tracks Action', `Performed ${action} action on track ID: ${trackId}`);
    return { success: true };
  }

  // Voting Submissions endpoints
  if (path === '/api/voting/submissions') {
    if (method === 'GET') {
      const submittedBy = url.searchParams.get('submittedBy');
      const snap = await getDocs(collection(db, 'voting_submissions'));
      const list: any[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data());
      });
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      
      if (submittedBy) {
        const filtered = list.filter(item => item.submittedBy === submittedBy);
        return { success: true, submissions: filtered };
      }
      return { success: true, submissions: list };
    }
  }

  if (path === '/api/voting/submit') {
    if (method === 'POST') {
      const id = 'vsub_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      const newSubmission = {
        ...body,
        id,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      };
      await setDoc(doc(db, 'voting_submissions', id), newSubmission);
      return { success: true, item: newSubmission };
    }
  }

  if (path.startsWith('/api/voting/submit/')) {
    const id = path.split('/').pop() || '';
    if (method === 'PUT' || method === 'POST') {
      await setDoc(doc(db, 'voting_submissions', id), body, { merge: true });
      return { success: true };
    }
    if (method === 'DELETE') {
      await deleteDoc(doc(db, 'voting_submissions', id));
      return { success: true };
    }
  }

  if (path.startsWith('/api/voting/submissions/') && path.endsWith('/approve')) {
    const id = path.split('/')[4];
    const subRef = doc(db, 'voting_submissions', id);
    const subSnap = await getDoc(subRef);
    if (subSnap.exists()) {
      await updateDoc(subRef, { status: 'approved' });

      const campaign = {
        id: 'camp_' + Date.now(),
        title: body.title || subSnap.data().title,
        description: body.description || subSnap.data().description,
        coverUrl: body.coverUrl || subSnap.data().coverUrl,
        voteNowUrl: body.voteNowUrl || subSnap.data().voteNowUrl,
        platform: body.platform || subSnap.data().platform,
        startDate: body.startDate || subSnap.data().startDate,
        endDate: body.endDate || subSnap.data().endDate,
        isPinned: !!body.isPinned,
        isFeatured: !!body.isFeatured,
        caption: body.caption || subSnap.data().caption || '',
        status: 'published'
      };

      const updateCampaigns = async (configRef: any) => {
        const snap = await getDoc(configRef);
        const data = snap.exists() ? snap.data() as any : {};
        const votingEvents = data.votingEvents || [];
        await updateDoc(configRef, { votingEvents: [...votingEvents, campaign] });
      };

      await updateCampaigns(doc(db, 'config', 'draft'));
      await updateCampaigns(doc(db, 'config', 'published'));

      await logAdminActivity('Approve Voting Proposal', `Approved user-submitted voting campaign: ${campaign.title}`);
      return { success: true };
    }
    return { success: false, error: 'Submission not found' };
  }

  if (path.startsWith('/api/voting/submissions/') && path.endsWith('/reject')) {
    const id = path.split('/')[4];
    const subRef = doc(db, 'voting_submissions', id);
    await updateDoc(subRef, { status: 'rejected' });
    await logAdminActivity('Reject Voting Proposal', `Rejected user-submitted voting campaign ID: ${id}`);
    return { success: true };
  }

  if (path === '/api/config/draft' && method === 'GET') {
    const draftSnap = await getDoc(doc(db, 'config', 'draft'));
    return draftSnap.exists() ? draftSnap.data() : defaultWebsiteConfig;
  }

  // 19. Admin Security Account details (bcrypt update)
  if (path === '/api/admin/security/account' && method === 'POST') {
    const adminRef = doc(db, 'config', 'admin');
    const updatePayload: any = {};
    if (body.email) updatePayload.adminEmail = body.email;
    if (body.password) updatePayload.adminPassword = bcrypt.hashSync(body.password, 10);
    if (body.securityQuestion) updatePayload.adminSecurityQuestion = body.securityQuestion;
    if (body.securityAnswer) updatePayload.adminSecurityAnswer = bcrypt.hashSync(body.securityAnswer.toLowerCase(), 10);
    if (body.backupCode) updatePayload.adminBackupCode = body.backupCode;

    await updateDoc(adminRef, updatePayload);
    await logAdminActivity('Update Credentials', 'Modified secure administrative password and question');
    return { success: true, message: 'Admin account security credentials updated.' };
  }

  // 20. Admin Asset Media manager
  if (path === '/api/admin/media/upload' && method === 'POST') {
    let url = '';
    const uploadData = body.fileData || body.base64 || body.url;
    if (uploadData && isBase64DataUri(uploadData)) {
      try {
        const fileBlob = await base64ToBlob(uploadData);
        const fileName = `admin_${Date.now()}_${body.filename || 'media'}`;
        const storageRef = ref(storage, `admin_media/${fileName}`);
        const snap = await uploadBytes(storageRef, fileBlob);
        url = await getDownloadURL(snap.ref);
      } catch (e) {
        console.error('Storage upload for admin media failed:', e);
      }
    }

    const newMedia = {
      id: 'm_' + Date.now(),
      name: body.filename || 'Unnamed Asset',
      type: body.type || 'image',
      size: body.size || 'Unknown size',
      url,
      isDeleted: false,
      uploadDate: new Date().toISOString()
    };

    const adminRef = doc(db, 'config', 'admin');
    const adminSnap = await getDoc(adminRef);
    if (adminSnap.exists()) {
      const curMediaList = adminSnap.data().adminMedia || [];
      await updateDoc(adminRef, { adminMedia: [newMedia, ...curMediaList] });
    }

    await logAdminActivity('Upload Admin Media', `Uploaded asset ${newMedia.name} to Firebase Storage`);
    return { success: true, url, mediaItem: newMedia };
  }

  if (path === '/api/admin/media' && method === 'GET') {
    const adminSnap = await getDoc(doc(db, 'config', 'admin'));
    if (adminSnap.exists()) {
      return adminSnap.data().adminMedia || [];
    }
    return [];
  }

  if (path === '/api/admin/media/rename' && method === 'POST') {
    const { oldFilename, newFilename } = body;
    if (!oldFilename || !newFilename) {
      return { success: false, error: 'Old filename and new filename are required' };
    }
    const adminRef = doc(db, 'config', 'admin');
    const adminSnap = await getDoc(adminRef);
    if (adminSnap.exists()) {
      const curMediaList = adminSnap.data().adminMedia || [];
      const itemIndex = curMediaList.findIndex((m: any) => m.name === oldFilename);
      if (itemIndex !== -1) {
        curMediaList[itemIndex].name = newFilename;
        await updateDoc(adminRef, { adminMedia: curMediaList });
        await logAdminActivity('Rename Media', `Renamed media asset from ${oldFilename} to ${newFilename}`);
        return { success: true };
      }
      return { success: false, error: 'Media file not found' };
    }
    return { success: false, error: 'Admin settings not found' };
  }

  if (path === '/api/admin/media/replace' && method === 'POST') {
    const { filename, base64 } = body;
    if (!filename || !base64) {
      return { success: false, error: 'Filename and replacement file data are required' };
    }
    let url = '';
    if (isBase64DataUri(base64)) {
      try {
         const fileBlob = await base64ToBlob(base64);
         const fileName = `admin_${Date.now()}_${filename}`;
         const storageRef = ref(storage, `admin_media/${fileName}`);
         const snap = await uploadBytes(storageRef, fileBlob);
         url = await getDownloadURL(snap.ref);
      } catch (e: any) {
         console.error('Storage replace failed:', e);
         return { success: false, error: `Upload failed: ${e.message}` };
      }
    } else {
      return { success: false, error: 'Invalid file content format' };
    }

    const adminRef = doc(db, 'config', 'admin');
    const adminSnap = await getDoc(adminRef);
    if (adminSnap.exists()) {
      const curMediaList = adminSnap.data().adminMedia || [];
      const itemIndex = curMediaList.findIndex((m: any) => m.name === filename);
      if (itemIndex !== -1) {
        curMediaList[itemIndex].url = url;
        curMediaList[itemIndex].uploadDate = new Date().toISOString();
        await updateDoc(adminRef, { adminMedia: curMediaList });
        await logAdminActivity('Replace Media', `Replaced content for media asset: ${filename}`);
        return { success: true, url };
      }
      return { success: false, error: 'Media file to replace not found' };
    }
    return { success: false, error: 'Admin settings not found' };
  }

  if (path === '/api/admin/media/delete' && method === 'DELETE') {
    const filename = url.searchParams.get('filename');
    const force = url.searchParams.get('force') === 'true';
    if (!filename) {
      return { success: false, error: 'Filename is required' };
    }
    const adminRef = doc(db, 'config', 'admin');
    const adminSnap = await getDoc(adminRef);
    if (adminSnap.exists()) {
      const curMediaList = adminSnap.data().adminMedia || [];
      if (force) {
        const updatedList = curMediaList.filter((m: any) => m.name !== filename);
        await updateDoc(adminRef, { adminMedia: updatedList });
        await logAdminActivity('Purge Media', `Permanently deleted media asset: ${filename}`);
      } else {
        const itemIndex = curMediaList.findIndex((m: any) => m.name === filename);
        if (itemIndex !== -1) {
          curMediaList[itemIndex].isDeleted = true;
          await updateDoc(adminRef, { adminMedia: curMediaList });
          await logAdminActivity('Trash Media', `Moved media asset to trash: ${filename}`);
        } else {
          return { success: false, error: 'Media file not found' };
        }
      }
      return { success: true };
    }
    return { success: false, error: 'Admin settings not found' };
  }

  if (path === '/api/admin/media/restore' && method === 'POST') {
    const filename = url.searchParams.get('filename');
    if (!filename) {
      return { success: false, error: 'Filename is required' };
    }
    const adminRef = doc(db, 'config', 'admin');
    const adminSnap = await getDoc(adminRef);
    if (adminSnap.exists()) {
      const curMediaList = adminSnap.data().adminMedia || [];
      const itemIndex = curMediaList.findIndex((m: any) => m.name === filename);
      if (itemIndex !== -1) {
        curMediaList[itemIndex].isDeleted = false;
        await updateDoc(adminRef, { adminMedia: curMediaList });
        await logAdminActivity('Restore Media', `Restored media asset from trash: ${filename}`);
        return { success: true };
      }
      return { success: false, error: 'Media file to restore not found' };
    }
    return { success: false, error: 'Admin settings not found' };
  }

  // 21. Live stream settings
  if (path === '/api/live/status' && method === 'GET') {
    const liveSnap = await getDoc(doc(db, 'config', 'liveStream'));
    return liveSnap.exists() ? liveSnap.data() : { isStreaming: false, url: '' };
  }

  if (path === '/api/admin/live/settings' && method === 'POST') {
    await updateDoc(doc(db, 'config', 'liveStream'), body);
    await logAdminActivity('Edit Live Settings', 'Updated real-time livestream broadcasting layout settings');
    return { success: true };
  }

  if (path === '/api/admin/live/update' && method === 'POST') {
    await updateDoc(doc(db, 'config', 'liveStream'), body);
    return { success: true };
  }

  if (path === '/api/admin/live/regenerate-key' && method === 'POST') {
    const newKey = 'live_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    await updateDoc(doc(db, 'config', 'liveStream'), { streamKey: newKey });
    await logAdminActivity('Regenerate Stream Key', 'Reset private RTMP ingestion stream keys');
    return { success: true, streamKey: newKey };
  }

  if (path === '/api/admin/live/simulate_publish' && method === 'POST') {
    const action = body.action; // 'start' or 'stop'
    await updateDoc(doc(db, 'config', 'liveStream'), {
      isStreaming: action === 'start',
      viewers: action === 'start' ? Math.floor(Math.random() * 50) + 120 : 0
    });
    return { success: true };
  }

  // 22. GET and POST video actions & list
  if (path === '/api/video/submissions') {
    const subSnap = await getDocs(collection(db, 'video_submissions'));
    const items: any[] = [];
    subSnap.forEach(docSnap => {
      items.push(docSnap.data());
    });
    return { success: true, submissions: items };
  }

  if (path.startsWith('/api/video/submissions/') && path.endsWith('/approve')) {
    const id = path.split('/')[4];
    const subRef = doc(db, 'video_submissions', id);
    const snap = await getDoc(subRef);
    if (snap.exists()) {
      await updateDoc(subRef, { status: 'approved' });

      const subData = snap.data();
      const video = {
        id: 'vid_' + Date.now(),
        title: subData.title,
        url: subData.url,
        description: subData.description || 'Awesome BTS Video Shared by ARMY.',
        era: subData.era || '2026',
        category: subData.category || 'MVs & Stages',
        submittedBy: subData.submittedBy || 'guest',
        displayName: subData.displayName || 'Guest ARMY',
        thumbnailUrl: subData.thumbnailUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
        uploadedAt: new Date().toISOString()
      };

      // Add to draft and published configurations under videos array
      const draftRef = doc(db, 'config', 'draft');
      const draftSnap = await getDoc(draftRef);
      if (draftSnap.exists()) {
        const draftData = draftSnap.data();
        const videos = draftData.videos || [];
        await updateDoc(draftRef, { videos: [...videos, video] });
      }

      const pubRef = doc(db, 'config', 'published');
      const pubSnap = await getDoc(pubRef);
      if (pubSnap.exists()) {
        const pubData = pubSnap.data();
        const videos = pubData.videos || [];
        await updateDoc(pubRef, { videos: [...videos, video] });
      }

      await logAdminActivity('Approve Video', `Approved user-submitted video: ${video.title}`);
      return { success: true };
    }
    return { success: false, error: 'Video submission not found' };
  }

  if (path.startsWith('/api/video/submissions/') && path.endsWith('/reject')) {
    const id = path.split('/')[4];
    await updateDoc(doc(db, 'video_submissions', id), { status: 'rejected' });
    await logAdminActivity('Reject Video', `Rejected user-submitted video ID: ${id}`);
    return { success: true };
  }

  // 23. Admin Backups simulated via config/backups
  if (path === '/api/admin/backup/list' && method === 'GET') {
    const backupSnap = await getDoc(doc(db, 'config', 'backups'));
    return backupSnap.exists() ? (backupSnap.data().points || []) : [];
  }

  if (path === '/api/admin/backup/create' && method === 'POST') {
    const bId = 'b_' + Date.now();
    const backupSnap = doc(db, 'config', 'backups');
    const backupDoc = await getDoc(backupSnap);
    const curBackups = backupDoc.exists() ? backupDoc.data()?.points || [] : [];
    
    const draftDoc = await getDoc(doc(db, 'config', 'draft'));
    const draftData = draftDoc.exists() ? draftDoc.data() : null;

    const newPoint = {
      id: bId,
      label: body.label || `Backup_${new Date().toLocaleDateString('en-US')}_Automatic`,
      createdAt: new Date().toISOString(),
      size: draftData ? JSON.stringify(draftData).length : 240 * 1024,
      config: draftData
    };
    await setDoc(backupSnap, { points: [newPoint, ...curBackups] });
    await logAdminActivity('Create Backup', `Created Firestore backup state point: ${newPoint.label}`);
    return { success: true, point: newPoint };
  }

  if (path === '/api/admin/backup/restore' && method === 'POST') {
    const backupId = url.searchParams.get('id');
    if (!backupId) return { success: false, error: 'Backup ID is missing' };
    
    const backupSnap = await getDoc(doc(db, 'config', 'backups'));
    if (!backupSnap.exists()) return { success: false, error: 'No backups exist to restore' };
    
    const points = backupSnap.data().points || [];
    const targetPoint = points.find((p: any) => p.id === backupId);
    
    if (!targetPoint) return { success: false, error: 'Target backup point not found' };
    if (!targetPoint.config) return { success: false, error: 'Selected backup point is empty' };
    
    await setDoc(doc(db, 'config', 'draft'), targetPoint.config);
    await logAdminActivity('Restore Backup', `Restored CMS configuration from backup: ${targetPoint.label}`);
    return { success: true };
  }

  if (path === '/api/admin/backup/delete' && method === 'DELETE') {
    const backupId = url.searchParams.get('id');
    if (!backupId) return { success: false, error: 'Backup ID is missing' };
    
    const backupSnap = await getDoc(doc(db, 'config', 'backups'));
    if (backupSnap.exists()) {
      const points = backupSnap.data().points || [];
      const updatedPoints = points.filter((p: any) => p.id !== backupId);
      const targetPoint = points.find((p: any) => p.id === backupId);
      
      await setDoc(doc(db, 'config', 'backups'), { points: updatedPoints });
      await logAdminActivity('Delete Backup', `Purged backup point: ${targetPoint?.label || backupId}`);
    }
    return { success: true };
  }

  // 24. Admin Authentication validation
  if (path === '/api/admin/login' && method === 'POST') {
    const adminSnap = await getDoc(doc(db, 'config', 'admin'));
    if (!adminSnap.exists()) return { success: false, error: 'Admin config missing' };
    const adminData = adminSnap.data();

    const { email, password, securityAnswer, stage } = body;

    if (stage === 1) {
      const emailMatch = (email || '').trim().toLowerCase() === adminData.adminEmail.toLowerCase();
      const passMatch = bcrypt.compareSync(password, adminData.adminPassword);

      if (emailMatch && passMatch) {
        return { success: true, stage: 1, securityQuestion: adminData.adminSecurityQuestion };
      }
      return { success: false, error: 'Invalid admin credentials.' };
    }

    if (stage === 2) {
      const answerMatch = bcrypt.compareSync((securityAnswer || '').trim().toLowerCase(), adminData.adminSecurityAnswer);
      if (answerMatch) {
        const randomToken = 'admin_session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
        await logAdminActivity('Admin Login', 'Admin session authenticated successfully');
        return { success: true, stage: 2, token: randomToken };
      }
      return { success: false, error: 'Incorrect security verification answer.' };
    }

    return { success: false, error: 'Unknown authentication stage' };
  }

  // 25. Admin Activity Logs
  if (path === '/api/admin/activity-logs' && method === 'GET') {
    const adminSnap = await getDoc(doc(db, 'config', 'admin'));
    if (adminSnap.exists()) {
      return adminSnap.data().activityLogs || [];
    }
    return [];
  }

  // 26. Admin Security Settings (GET and PUT)
  if (path === '/api/admin/security/settings') {
    if (method === 'GET') {
      const adminSnap = await getDoc(doc(db, 'config', 'admin'));
      if (adminSnap.exists()) {
        const data = adminSnap.data();
        return {
          email: data.adminEmail,
          securityQuestion: data.adminSecurityQuestion,
          backupCode: data.adminBackupCode,
          sessions: data.sessions || []
        };
      }
      return {
        email: 'admin@festa.bts',
        securityQuestion: 'What is the official fan base name of BTS?',
        backupCode: 'ARMY-7777-SEVEN',
        sessions: []
      };
    }
    if (method === 'PUT' || method === 'POST') {
      const adminRef = doc(db, 'config', 'admin');
      const updatePayload: any = {};
      if (body.securityQuestion) updatePayload.adminSecurityQuestion = body.securityQuestion;
      if (body.securityAnswer) {
        updatePayload.adminSecurityAnswer = bcrypt.hashSync(body.securityAnswer.toLowerCase(), 10);
      }
      await updateDoc(adminRef, updatePayload);
      await logAdminActivity('Update Security Settings', 'Modified backup verification question or answer');
      return { success: true };
    }
  }

  // Default catch-all for unhandled routes
  return { success: true };
  } catch (error: any) {
    console.error(`[DIAGNOSTIC] Error in API Route: ${method} ${urlStr}`, error);
    throw error;
  }
}
