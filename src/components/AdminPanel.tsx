import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Home, Users, Music, Video, Image, Calendar, Download, 
  Newspaper, Search, Palette, Settings, Lock, Inbox, Eye, Save, Award, 
  ArrowRight, Clock, Plus, Trash, Edit, Check, Loader2, LogOut, Heart, 
  Info, Globe, RefreshCw, Send, CheckCircle2, ShieldCheck, Mail, AlertTriangle, 
  FileText, Database, Server, Smartphone, BookOpen, ChevronRight, Minimize2, Maximize2,
  Radio, Copy, HelpCircle, Link2, Volume2, VolumeX, Disc, Play, Compass, Grid, Vote,
  UploadCloud, X, Pin, Menu, Code
} from 'lucide-react';
import { Sparkles } from './CustomSparkles';
import { useBackend } from '../context/BackendContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { getYoutubeEmbedUrl, getYoutubeVideoId } from './youtubeUtils';
import VisualWebsiteEditor from './VisualWebsiteEditor';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const ERA_YEARS = ['All', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];

const resolveMediaUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  if (url.includes('/api/media/serve/')) {
    const parts = url.split('/api/media/serve/');
    const mediaId = parts[parts.length - 1];
    const isProduction = window.location.hostname === 'bangtangallery.online' || 
                         window.location.hostname === 'www.bangtangallery.online';
    const isLocalOrSandbox = window.location.hostname.includes('run.app') ||
                             window.location.hostname.includes('aistudio') ||
                             window.location.hostname.includes('localhost') ||
                             window.location.hostname.includes('127.0.0.1');
    const base = (isProduction || isLocalOrSandbox) ? window.location.origin : 'https://api.bangtangallery.online';
    return `${base}/api/media/serve/${mediaId}`;
  }
  return url;
};

interface SmartImageInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

function SmartImageInput({ label, value, onChange, placeholder = "Enter image URL", className = "" }: SmartImageInputProps) {
  const [imageValidState, setImageValidState] = useState<'idle' | 'success' | 'pinterest_url'>('idle');
  const [uploadingState, setUploadingState] = useState<'idle' | 'reading' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [hasError, setHasError] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputId = React.useId();
  
  useEffect(() => {
    setHasError(false);
    if (!value) {
      setImageValidState('idle');
      return;
    }
    
    // Check for common webpage instead of raw image formats
    const lowerVal = value.trim().toLowerCase();
    
    // Pinterest Pin checks
    if (lowerVal.includes('pinterest.com/pin') || lowerVal.includes('pin.it/')) {
      setImageValidState('pinterest_url');
      return;
    }
    
    // If it is a direct URL or path, treat as ready
    if (lowerVal.startsWith('http://') || lowerVal.startsWith('https://') || lowerVal.startsWith('/')) {
      setImageValidState('success');
    } else {
      setImageValidState('idle');
    }
  }, [value]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndUploadFile(e.dataTransfer.files[0]);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Scale down to max 1200px for robust performance
          const MAX_SIZE = 1200;
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // High compression quality (0.75) for amazing visuals with tiny data footprint
            const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
            resolve(dataUrl);
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = () => resolve('');
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const processAndUploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadingState('error');
      setUploadMessage('Only image uploads (.png, .jpeg, .jpg, .webp, .gif) are supported 💜');
      return;
    }
    
    setUploadingState('reading');
    setUploadMessage('Processing image file...');
    
    try {
      let finalBase64 = '';
      const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
      const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
      
      if (isGif || isSvg || file.size < 1024 * 1024) {
        setUploadMessage('Reading file elements...');
        finalBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      } else {
        setUploadMessage('Optimizing photo memory...');
        finalBase64 = await compressImage(file);
        if (!finalBase64) {
          throw new Error('Image optimizer failed');
        }
      }

      setUploadingState('uploading');
      setUploadMessage('Uploading image asset... 📡');

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': (window as any).btsAdminToken || localStorage.getItem('bts_admin_token') || ''
        },
        body: JSON.stringify({
          filename: file.name,
          base64: finalBase64,
          type: file.type || 'image/jpeg',
          size: `${Math.round(file.size / 1024)} KB`,
          category: 'General'
        })
      });

      if (res.ok) {
        const uploadedFile = await res.json();
        let finalUrl = uploadedFile.url;
        if (finalUrl && finalUrl.includes('/api/media/serve/')) {
          const parts = finalUrl.split('/api/media/serve/');
          const mediaId = parts[parts.length - 1];
          finalUrl = `/api/media/serve/${mediaId}`;
        }
        if (finalUrl && finalUrl.startsWith('/')) {
          const isProductionEnv = window.location.hostname === 'bangtangallery.online' || 
                                   window.location.hostname === 'www.bangtangallery.online' ||
                                   window.location.hostname.endsWith('netlify.app');
          const isSandboxEnv = !isProductionEnv;
          const baseUrl = (import.meta as any).env?.VITE_API_URL || 'https://api.bangtangallery.online';
          if (!isSandboxEnv || (import.meta as any).env?.VITE_API_URL) {
            const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            finalUrl = cleanBase + finalUrl;
          } else {
            finalUrl = window.location.origin + finalUrl;
          }
        }
        onChange(finalUrl);
        setUploadingState('success');
        setUploadMessage('Upload complete! 🎉');
      } else {
        let errMsg = 'Server upload reject';
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errData = await res.json();
            errMsg = errData.error || errMsg;
          } else {
            const txt = await res.text();
            if (txt && !txt.trim().startsWith('<html')) {
              errMsg = txt;
            }
          }
        } catch {
          errMsg = res.statusText || 'Server error';
        }
        setUploadingState('error');
        setUploadMessage(`Upload failed: ${errMsg}`);
      }
    } catch (err: any) {
      setUploadingState('error');
      setUploadMessage(`Upload erred: ${err.message}`);
    }
  };

  return (
    <div className={`space-y-3 font-sans p-3 border border-purple-500/10 rounded-xl bg-purple-950/10 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-mono text-purple-300 uppercase block font-bold tracking-wider">{label}</label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[10px] text-rose-400 hover:text-rose-200 flex items-center gap-0.5 cursor-pointer font-mono uppercase bg-rose-950/20 px-1.5 py-0.5 rounded border border-rose-500/10 transition-colors"
          >
            <Trash className="w-3 h-3" /> Clear Image
          </button>
        )}
      </div>

      {value ? (
        <div className="flex flex-col sm:flex-row gap-3 items-center p-3 rounded-lg border border-purple-500/25 bg-[#07030e] relative">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-purple-500/30 bg-black/50 shrink-0 select-none">
            <img 
              src={resolveMediaUrl(value)} 
              alt="Uploaded Preview" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
              onError={() => setHasError(true)}
            />
          </div>
          
          <div className="flex-1 min-w-0 w-full font-sans">
            <div className="text-[10px] font-mono leading-tight">
              {hasError ? (
                <span className="text-rose-400 block font-bold">⚠️ Failed to Load Image (Check Link Validity)</span>
              ) : (
                <span className="text-emerald-400 block font-bold">🟢 Image Active & Linked Successfully</span>
              )}
            </div>
            <div className="mt-1 text-[11px] text-slate-300 font-mono break-all line-clamp-2 bg-black/40 p-1.5 rounded border border-purple-500/5 select-text" title={value}>
              {value}
            </div>
          </div>

          <div className="flex flex-row sm:flex-col gap-1.5 shrink-0 w-full sm:w-auto">
            <label className="flex-1 text-center sm:flex-none text-[9px] px-2.5 py-1.5 bg-purple-600 hover:bg-purple-550 border border-purple-500/20 text-white rounded font-bold cursor-pointer transition-colors whitespace-nowrap uppercase">
              📁 Replace File
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processAndUploadFile(file);
                }}
              />
            </label>
          </div>
        </div>
      ) : (
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById(fileInputId)?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
            dragActive 
              ? 'border-purple-400 bg-purple-950/30' 
              : 'border-purple-500/20 bg-purple-950/5 hover:border-purple-500/45 hover:bg-purple-950/10'
          }`}
        >
          <input
            type="file"
            id={fileInputId}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processAndUploadFile(file);
            }}
          />
          <UploadCloud className="w-8 h-8 text-purple-400 animate-pulse" />
          <div className="text-xs text-slate-200">
            <span className="font-extrabold text-purple-400 underline cursor-pointer">Choose an Image File</span> or drag & drop here
          </div>
          <span className="text-[9px] text-slate-500 font-mono">Supports JPG, PNG, WEBP, GIF, SVG (Optimized)</span>
        </div>
      )}

      <div className="flex gap-2 font-sans">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[9px] font-mono text-purple-400 uppercase font-black">
            URL
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-8 pl-[35px] pr-8 bg-[#090412] border border-purple-500/10 text-xs text-white rounded-lg focus:outline-none focus:border-purple-500/40 font-mono"
          />
          {value && (
            <div className="absolute right-2 top-2">
              {imageValidState === 'success' && <span className="text-emerald-400 text-[10px] font-bold">🟢</span>}
              {imageValidState === 'pinterest_url' && <span className="text-rose-400 text-[10px] font-bold">⚠️</span>}
            </div>
          )}
        </div>
        
        <label className="h-8 px-2.5 flex items-center justify-center bg-purple-950/30 hover:bg-purple-950 text-[10px] text-purple-300 hover:text-purple-100 border border-purple-500/15 hover:border-purple-500/30 border-dashed rounded-lg cursor-pointer transition-all font-mono uppercase font-semibold text-center whitespace-nowrap shrink-0">
          📁 Choose File
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processAndUploadFile(file);
            }}
          />
        </label>
      </div>

      {uploadingState !== 'idle' && (
        <div className="mt-1 bg-black/30 p-1.5 rounded border border-purple-500/10">
          {uploadingState === 'reading' && <span className="text-[10px] text-yellow-400 font-mono animate-pulse font-bold">⏳ {uploadMessage}</span>}
          {uploadingState === 'uploading' && <span className="text-[10px] text-cyan-400 font-mono animate-pulse font-bold">📡 {uploadMessage}</span>}
          {uploadingState === 'success' && <span className="text-[10px] text-emerald-400 font-mono font-bold">🏆 Upload successful! 💜</span>}
          {uploadingState === 'error' && <span className="text-[10px] text-rose-400 font-mono font-bold">❌ {uploadMessage}</span>}
        </div>
      )}

      {imageValidState === 'pinterest_url' && (
        <p className="text-[10px] text-rose-300 leading-normal bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/20 font-sans">
          ⚠️ <b>Pinterest page URL detected!</b> Paste the direct image link itself instead.
          To get the proper url: Right-click the Pinterest photo and select <b>"Copy Image Address"</b>, then paste that here. It usually ends with <code className="text-purple-300 font-mono">.jpg</code> or <code className="text-purple-300 font-mono">.png</code>.
        </p>
      )}
    </div>
  );
}

interface AdminPanelProps {
  onClose: () => void;
  publicThemeConfig: any;
  onThemeConfigChange: (newTheme: any) => void;
  onPublishSuccess: () => void;
}

export default function AdminPanel({ onClose, publicThemeConfig, onThemeConfigChange, onPublishSuccess }: AdminPanelProps) {
  const { notifications, stats } = useBackend();
  const audioContext = useAudioPlayer();

  // Authentication states
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isTemporarySession, setIsTemporarySession] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Set up Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
          localStorage.setItem('bts_admin_token', idToken);
          (window as any).btsAdminToken = idToken;
        } catch (e) {
          console.error('Failed to get user ID token:', e);
        }
      } else {
        setIsLoggedIn(false);
        setToken('');
        localStorage.removeItem('bts_admin_token');
        delete (window as any).btsAdminToken;
      }
      setIsCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);
  
  // CMS state files
  const [draftConfig, setDraftConfig] = useState<any>(null);
  const [publishedConfig, setPublishedConfig] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const confirmAction = (message: string, onConfirm: () => void) => {
    setDeleteConfirm({ message, onConfirm });
  };
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  
  // Secondary views
  const [activeAdminTab, setActiveAdminTab] = useState('VisualBuilder');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState('Home'); // Preview shell inner navigation
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [cmsMessage, setCmsMessage] = useState({ text: '', type: 'success' }); // msg toast
  
  // Contact logs
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [contactFilter, setContactFilter] = useState<'All' | 'Unread' | 'Read' | 'Replied'>('All');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Editor specific interactive forms
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
  const [editingSongIndex, setEditingSongIndex] = useState<number | null>(null);
  const [editingVideoIndex, setEditingVideoIndex] = useState<number | null>(null);
  const [videosAdminTab, setVideosAdminTab] = useState<'catalog' | 'submissions'>('catalog');
  const [videoSubmissions, setVideoSubmissions] = useState<any[]>([]);
  const [isLoadingVideoSubs, setIsLoadingVideoSubs] = useState(false);
  const [editingEventIndex, setEditingEventIndex] = useState<number | null>(null);
  const [editingDownloadIndex, setEditingDownloadIndex] = useState<number | null>(null);
  const [editingNewsIndex, setEditingNewsIndex] = useState<number | null>(null);
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [editingGalleryIndex, setEditingGalleryIndex] = useState<number | null>(null);
  const [editingShowcaseIndex, setEditingShowcaseIndex] = useState<number | null>(null);
  const [editingTrendingIndex, setEditingTrendingIndex] = useState<number | null>(null);
  const [editingTimelineIndex, setEditingTimelineIndex] = useState<number | null>(null);
  
  // Spotify embeds dynamic CRUD state
  const [editingSpotifyEmbedId, setEditingSpotifyEmbedId] = useState<string | null>(null);
  const [spotifyEmbedForm, setSpotifyEmbedForm] = useState<{
    title: string;
    badge: string;
    url: string;
    color: string;
  }>({
    title: '',
    badge: '',
    url: '',
    color: 'purple'
  });
  const [showAddSpotifyForm, setShowAddSpotifyForm] = useState(false);
  
  // Voting CMS States
  const [votingSubTab, setVotingSubTab] = useState<'events' | 'proposals'>('events');
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [isApprovingProposal, setIsApprovingProposal] = useState(false);
  const [editingProposalIndex, setEditingProposalIndex] = useState<number | null>(null);
  const [editingProposalData, setEditingProposalData] = useState<any>(null);
  const [editingVotingEventIndex, setEditingVotingEventIndex] = useState<number | null>(null);

  // New item template states (for creations)
  const [newPhrase, setNewPhrase] = useState('');
  const [newFact, setNewFact] = useState('');
  const [newSolo, setNewSolo] = useState('');
  const [newDisco, setNewDisco] = useState('');
  const [newQuote, setNewQuote] = useState('');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newVideoId, setNewVideoId] = useState('');
  const [newTimelineYear, setNewTimelineYear] = useState('');
  const [newTimelineEvent, setNewTimelineEvent] = useState('');

  // Account & Security Settings states
  const [adminEmail, setAdminEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [confirmAdminEmail, setConfirmAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  
  // Account settings visibility toggle after login
  const [showCredentialInputs, setShowCredentialInputs] = useState(false);

  // New CMS Form & Preview states
  const [cmsEditing, setCmsEditing] = useState<{
    tab: 'Gallery' | 'Events' | 'Music' | 'Videos' | 'News' | 'Downloads' | 'Home';
    index: number;
    data: any;
  } | null>(null);
  const [cmsShowPreview, setCmsShowPreview] = useState(false);
  
  // Login history & Activity Logs states
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Security setup recovery question state
  const [securityQuestion, setSecurityQuestion] = useState('What is the official fan base name of BTS?');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [backupCode, setBackupCode] = useState('ARMY-7777-SEVEN');
  const [isSavingSecuritySetup, setIsSavingSecuritySetup] = useState(false);

  // Forgot password modal state on Login
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMethod, setForgotMethod] = useState<'security-question' | 'backup-code'>('security-question');
  const [forgotQuestion, setForgotQuestion] = useState('');
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [forgotBackupCode, setForgotBackupCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Media Manager states
  const [adminMediaFiles, setAdminMediaFiles] = useState<any[]>([]);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all');
  const [newMediaFilename, setNewMediaFilename] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaViewTrash, setMediaViewTrash] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mediaCategory, setMediaCategory] = useState('Image');
  const [mediaTags, setMediaTags] = useState('');
  const [previewingFile, setPreviewingFile] = useState<any>(null);
  const [renamingFile, setRenamingFile] = useState<any>(null);
  const [renamingName, setRenamingName] = useState('');

  // Backups System states
  const [backupsList, setBackupsList] = useState<any[]>([]);
  const [backupLabel, setBackupLabel] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackupId, setIsRestoringBackupId] = useState<string | null>(null);

  // Game Audio CMS & Sound Management states
  const [isUploadingSound, setIsUploadingSound] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [newCoverTitle, setNewCoverTitle] = useState('');
  const [musicSubTab, setMusicSubTab] = useState<'albums' | 'digitalTracks' | 'playlists' | 'liveStream' | 'spotlight' | 'eras'>('digitalTracks');

  // Live stream control states inside AdminPanel
  const [liveSettings, setLiveSettings] = useState<any>(null);
  const [liveTitle, setLiveTitle] = useState('');
  const [liveDescription, setLiveDescription] = useState('');
  const [liveEmbedCode, setLiveEmbedCode] = useState('');
  const [liveThumbnail, setLiveThumbnail] = useState('');
  const [liveScheduledAt, setLiveScheduledAt] = useState('');
  const [isSavingLiveDetails, setIsSavingLiveDetails] = useState(false);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedWhipUrl, setCopiedWhipUrl] = useState(false);
  const [copiedPlayerEmbed, setCopiedPlayerEmbed] = useState(false);
  const [copiedInteractiveEmbed, setCopiedInteractiveEmbed] = useState(false);
  const [isSimulatingStream, setIsSimulatingStream] = useState(false);
  const [isRegeneratingKey, setIsRegeneratingKey] = useState(false);
  const [isLoadingLiveSettings, setIsLoadingLiveSettings] = useState(false);
  const [isUploadingLiveThumbnail, setIsUploadingLiveThumbnail] = useState(false);

  const fetchLiveSettingsInAdmin = async () => {
    setIsLoadingLiveSettings(true);
    try {
      const res = await fetch('/api/admin/live/settings', {
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setLiveSettings(data.settings);
        setLiveTitle(data.settings.title || '');
        setLiveDescription(data.settings.description || '');
        setLiveEmbedCode(data.settings.embedCode || '');
        setLiveThumbnail(data.settings.thumbnail || '');
        setLiveScheduledAt(data.settings.scheduledAt ? data.settings.scheduledAt.substring(0, 16) : '');
        setTelemetry(data.telemetry || null);
        setIsBackendOnline(data.isBackendOnline !== false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLiveSettings(false);
    }
  };

  const handleSaveLiveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLiveDetails(true);
    try {
      const res = await fetch('/api/admin/live/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          title: liveTitle,
          description: liveDescription,
          embedCode: liveEmbedCode,
          thumbnail: liveThumbnail,
          scheduledAt: liveScheduledAt
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLiveSettings(data.settings);
        showToast('📺 Live Stream broadcast title, details & scheduled calendar updated successfully!', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update live stream settings.', 'error');
      }
    } catch {
      showToast('Connection failed when saving live stream settings.', 'error');
    } finally {
      setIsSavingLiveDetails(false);
    }
  };

  const handleDeleteStream = async () => {
    if (!confirm('DANGER: This will delete the current broadcast metadata, title, and reset stream counters. This action is irreversible. Proceed?')) return;
    try {
      const res = await fetch('/api/admin/live/delete', {
        method: 'POST',
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setLiveSettings(data.settings);
        setLiveTitle(data.settings.title || '');
        setLiveDescription(data.settings.description || '');
        setLiveEmbedCode(data.settings.embedCode || '');
        setLiveThumbnail(data.settings.thumbnail || '');
        setLiveScheduledAt('');
        showToast('🗑️ Live stream configurations successfully cleared and deleted!', 'success');
      } else {
        showToast('Failed to delete live stream.', 'error');
      }
    } catch {
      showToast('Connection failed when contacting the stream coordinator.', 'error');
    }
  };

  const handleArchiveStream = async () => {
    if (!confirm('This will freeze the current session statistics (Duration, Peak Viewers, Watchtime), save them to your secure history archives, and reset current broadcast parameters. Continue?')) return;
    try {
      const res = await fetch('/api/admin/live/archive', {
        method: 'POST',
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setLiveSettings(data.settings);
        showToast('📦 Completed stream session successfully archived to historical archives!', 'success');
      } else {
        showToast('Failed to archive live stream.', 'error');
      }
    } catch {
      showToast('Connection error during archive compilation.', 'error');
    }
  };

  const handleLiveThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }

    setIsUploadingLiveThumbnail(true);
    showToast('Uploading broadcast cover thumbnail... 📡', 'info');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const res = await fetch('/api/admin/media/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-token': token
            },
            body: JSON.stringify({
              filename: `live_cover_${Date.now()}.${file.name.split('.').pop()}`,
              name: file.name,
              type: 'image',
              size: `${Math.round(file.size / 1024)} KB`,
              base64: base64String,
              category: 'LiveCover'
            })
          });

          if (res.ok) {
            const data = await res.json();
            // Server responds with uploaded media object
            const url = data.url || `/uploads/${data.filename || data.name}`;
            setLiveThumbnail(url);
            showToast('✓ Broadcast cover thumbnail uploaded successfully!', 'success');
          } else {
            showToast('Failed to upload thumbnail.', 'error');
          }
        } catch {
          showToast('Failed uploading thumbnail file.', 'error');
        } finally {
          setIsUploadingLiveThumbnail(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsUploadingLiveThumbnail(false);
    }
  };

  useEffect(() => {
    if (activeAdminTab === 'LiveStreaming' && isLoggedIn && token) {
      fetchLiveSettingsInAdmin();
    }
  }, [activeAdminTab, isLoggedIn, token]);

  const handleAdminStreamToggle = async (action: 'connect' | 'disconnect') => {
    setIsSimulatingStream(true);
    try {
      const res = await fetch('/api/admin/live/simulate_publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        const data = await res.json();
        setLiveSettings(data.settings);
        showToast(
          action === 'connect' 
            ? '🚀 RTSP/RTMP Live Stream Publisher Simulated Successfully!' 
            : '🛑 Live Stream disconnected. Studio status updated.',
          'success'
        );
      }
    } catch {
      showToast('Error communicating with broadcast server.', 'error');
    } finally {
      setIsSimulatingStream(false);
    }
  };

  const handleRegenerateStreamKey = async () => {
    if (!confirm('Are you absolutely sure? This will terminate any currently connected broadcast sessions.')) return;
    setIsRegeneratingKey(true);
    try {
      const res = await fetch('/api/admin/live/regenerate-key', {
        method: 'POST',
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setLiveSettings(data.settings);
        showToast('🔑 New randomized private stream key generated!', 'success');
      }
    } catch {
      showToast('Failed to regenerate stream key.', 'error');
    } finally {
      setIsRegeneratingKey(false);
    }
  };

  const copyLiveFieldToClipboard = (text: string, type: 'url' | 'key' | 'whip') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else if (type === 'whip') {
        setCopiedWhipUrl(true);
        setTimeout(() => setCopiedWhipUrl(false), 2000);
      } else {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      }
      showToast('Copied parameters to clipboard!', 'success');
    });
  };

  // Auto-logout: 30 minutes activity timer
  useEffect(() => {
    if (!isLoggedIn) return;
    
    let logoutTimer: any;
    const resetTimer = () => {
      clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => {
        handleLogout();
        showToast('Auto logged out due to 30 minutes of inactivity.', 'error');
      }, 30 * 60 * 1000); // 30 minutes
    };

    // Listeners for activity
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(logoutTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
    };
  }, [isLoggedIn]);

  // Load configs on login/mount + periodic refresh to sync user-submitted music!
  useEffect(() => {
    if (isLoggedIn) {
      if (token) {
        (window as any).btsAdminToken = token;
      }
      fetchConfigs();
      fetchContacts();
      fetchSecuritySettings();
      fetchActivityLogs();
      fetchMediaFiles();
      fetchBackupsList();

      const configInterval = setInterval(() => {
        if (!cmsEditing) {
          fetchConfigs();
        }
      }, 7000); // sync every 7 seconds

      return () => clearInterval(configInterval);
    }
  }, [isLoggedIn, token, cmsEditing]);

  const fetchProposalsList = async () => {
    setIsLoadingProposals(true);
    try {
      const res = await fetch('/api/voting/submissions', {
        headers: {
          'x-admin-token': localStorage.getItem('bts_admin_token') || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProposals(data.submissions || []);
        }
      }
    } catch (err) {
      console.error('Error fetching admin proposals:', err);
    } finally {
      setIsLoadingProposals(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && (activeAdminTab === 'VotingCenter' || activeAdminTab === 'Dashboard')) {
      fetchProposalsList();
    }
  }, [isLoggedIn, activeAdminTab]);

  const fetchVideoSubmissions = async () => {
    setIsLoadingVideoSubs(true);
    try {
      const res = await fetch('/api/video/submissions', {
        headers: {
          'x-admin-token': localStorage.getItem('bts_admin_token') || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setVideoSubmissions(data.submissions || []);
        }
      }
    } catch (err) {
      console.error('Error fetching video submissions:', err);
    } finally {
      setIsLoadingVideoSubs(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && (activeAdminTab === 'Videos' || videosAdminTab === 'submissions')) {
      fetchVideoSubmissions();
    }
  }, [isLoggedIn, activeAdminTab, videosAdminTab]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setCmsMessage({ text, type });
    setTimeout(() => {
      setCmsMessage(prev => prev.text === text ? { text: '', type: 'success' } : prev);
    }, 4500);
  };

  const sanitizeConfig = (config: any) => {
    if (!config) return config;
    const arrKeys = ['showcase', 'trending', 'timeline', 'faqs', 'gallery', 'events', 'downloads', 'news', 'members', 'albums', 'videos', 'votingEvents', 'votingSubmissions', 'newsRelatedTopics', 'weversePosts'];
    const sanitized = { ...config };
    for (const key of arrKeys) {
      if (sanitized[key]) {
        if (!Array.isArray(sanitized[key])) {
          if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
            if (Array.isArray(sanitized[key]['null'])) {
              sanitized[key] = sanitized[key]['null'];
            } else {
              // Try to find if there's any array among values or just fallback
              const values = Object.values(sanitized[key]);
              const foundArray = values.find(v => Array.isArray(v));
              if (foundArray) {
                sanitized[key] = foundArray;
              } else {
                sanitized[key] = [];
              }
            }
          } else {
            sanitized[key] = [];
          }
        }
      } else {
        sanitized[key] = [];
      }
    }
    return sanitized;
  };

  const fetchConfigs = async () => {
    setIsLoadingConfig(true);
    try {
      const [draftRes, pubRes] = await Promise.all([
        fetch('/api/config/draft'),
        fetch('/api/config/published')
      ]);
      
      if (draftRes.ok) {
        const dJson = await draftRes.json();
        setDraftConfig(sanitizeConfig(dJson));
      }
      if (pubRes.ok) {
        const pJson = await pubRes.json();
        setPublishedConfig(sanitizeConfig(pJson));
      }
    } catch (err) {
      showToast('Error synchronizing CMS configs from server.', 'error');
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const fetchContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const res = await fetch('/api/admin/contact', {
        headers: { 'x-admin-token': token || localStorage.getItem('bts_admin_token') || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (err) {
      console.error('Failed contact fetch');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const fetchSecuritySettings = async () => {
    try {
      const res = await fetch('/api/admin/security/settings', {
        headers: { 'x-admin-token': token || localStorage.getItem('bts_admin_token') || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminEmail(data.email);
        setSecurityQuestion(data.securityQuestion);
        setBackupCode(data.backupCode);
        setLoginHistory(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed security setting fetch');
    }
  };

  const fetchActivityLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/activity-logs', {
        headers: { 'x-admin-token': token || localStorage.getItem('bts_admin_token') || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data);
      }
    } catch (err) {
      console.error('Failed activity info load');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchMediaFiles = async () => {
    try {
      const res = await fetch('/api/admin/media');
      if (res.ok) {
        const data = await res.json();
        setAdminMediaFiles(data);
      }
    } catch (err) {
      console.warn('Failed media directory listings load');
    }
  };

  const fetchBackupsList = async () => {
    try {
      const res = await fetch('/api/admin/backup/list', {
        headers: { 'x-admin-token': token || localStorage.getItem('bts_admin_token') || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setBackupsList(data);
      }
    } catch (err) {
      console.warn('Failed restoring snap backup files list');
    }
  };

  const handleQueryForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotEmail.trim()) {
      showToast('Please type your administrator email first.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/admin/forgot-password/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setForgotQuestion(data.question);
        showToast('Security question loaded! Please complete verification.', 'info');
      } else {
        showToast(data.error || 'Failed pulling recovery config.', 'error');
      }
    } catch (e) {
      showToast('Offline mode or connection failed.', 'error');
    }
  };

  const handleResetForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotNewPassword.trim() || forgotNewPassword.trim().length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }
    const payload: any = {
      email: forgotEmail.trim(),
      method: forgotMethod,
      newPassword: forgotNewPassword.trim()
    };
    if (forgotMethod === 'security-question') {
      payload.answer = forgotAnswer.trim();
    } else {
      payload.backupCode = forgotBackupCode.trim().toUpperCase();
    }

    setIsResettingPassword(true);
    try {
      const res = await fetch('/api/admin/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Password reset successful! Please log in now.', 'success');
        setShowForgotPassword(false);
        setPassword('');
        setForgotAnswer('');
        setForgotBackupCode('');
        setForgotNewPassword('');
      } else {
        showToast(data.error || 'Failed to authenticate reset ownership.', 'error');
      }
    } catch (err) {
      showToast('Connection failed during recovery dispatch.', 'error');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      const email = (username || '').trim();
      if (!email || !email.includes('@')) {
        throw new Error('Invalid email or password.');
      }
      
      // Authenticate with Firebase Authentication directly
      await signInWithEmailAndPassword(auth, email, password);
      showToast('Welcome back, Commander! Access granted.', 'success');
    } catch (err: any) {
      console.error('Firebase Auth Login Failed:', err);
      setLoginError('Invalid email or password.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Firebase Auth SignOut Failed:', e);
    }
    localStorage.removeItem('bts_admin_token');
    localStorage.removeItem('bts_temp_session');
    delete (window as any).btsAdminToken;
    setToken('');
    setIsLoggedIn(false);
    setIsTemporarySession(false);
    setUsername('');
    setPassword('');
    setActiveAdminTab('Dashboard');
    showToast('Session terminated successfully.', 'info');
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const res = await fetch('/api/config/draft', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
        },
        body: JSON.stringify(draftConfig)
      });
      
      if (res.ok) {
        showToast('Draft version saved securely to database store! 💜', 'success');
      } else {
        let errorMsg = 'Failed saving draft to database.';
        try {
          const errData = await res.json();
          if (errData && errData.error) errorMsg += ` Reason: ${errData.error}`;
        } catch (_) {}
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed saving draft to database.', 'error');
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      // 1. Save draft first
      const saveRes = await fetch('/api/config/draft', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
        },
        body: JSON.stringify(draftConfig)
      });
      if (!saveRes.ok) {
        let errorMsg = 'Failed saving draft before publishing.';
        try {
          const errData = await saveRes.json();
          if (errData && errData.error) errorMsg += ` (${errData.error})`;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      // 2. Publish
      const publishRes = await fetch('/api/config/publish', {
        method: 'POST',
        headers: { 'x-admin-token': token || localStorage.getItem('bts_admin_token') || '' }
      });
      
      if (publishRes.ok) {
        showToast('🚀 WEBPAGE PUBLISHED INSANTLY! Public cache cleared successfully.', 'success');
        onPublishSuccess();
        // Reload published config
        const pubRep = await fetch('/api/config/published');
        if (pubRep.ok) {
          setPublishedConfig(sanitizeConfig(await pubRep.json()));
        }
      } else {
        let errorMsg = 'Error syncing changes from draft to publish channel.';
        try {
          const errData = await publishRes.json();
          if (errData && errData.error) errorMsg += ` Reason: ${errData.error}`;
        } catch (_) {}
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      showToast(err.message || 'Error syncing changes from draft to publish channel.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleResetDraft = () => {
    if (!publishedConfig) return;
    if (window.confirm('Are you sure you want to discard your unsaved edits? This restores the draft back to the current published state.')) {
      setDraftConfig(JSON.parse(JSON.stringify(publishedConfig)));
      showToast('Draft changes discarded. Reverted to live version.', 'info');
    }
  };

  const handleUpdateContactStatus = async (id: string, nextStatus: 'Read' | 'Replied') => {
    try {
      const res = await fetch(`/api/admin/contact/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setContacts(prev => prev.map(c => c.id === id ? { ...c, status: nextStatus } : c));
        showToast('Message status updated successfully.', 'success');
      }
    } catch (err) {
      showToast('Failed status switch.', 'error');
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm('Delete this contact message permanently?')) return;
    try {
      const res = await fetch(`/api/admin/contact/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        setContacts(prev => prev.filter(c => c.id !== id));
        showToast('Message deleted permanently.', 'success');
      }
    } catch (err) {
      showToast('Failed message deletion.', 'error');
    }
  };

  const handleUpdateAccountDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Current administrative password required to make credential updates.', 'error');
      return;
    }
    
    // Validate email inputs match if specified
    if (newAdminEmail.trim() && newAdminEmail.trim() !== confirmAdminEmail.trim()) {
      showToast('Specified email addresses do not match.', 'error');
      return;
    }

    // Validate password inputs match if specified
    if (newAdminPassword && newAdminPassword !== confirmAdminPassword) {
      showToast('Specified passwords do not match.', 'error');
      return;
    }

    if (newAdminPassword && newAdminPassword.length < 6) {
      showToast('New passwords must contain at least 6 characters.', 'error');
      return;
    }

    setIsUpdatingAccount(true);
    try {
      const res = await fetch('/api/admin/security/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
        },
        body: JSON.stringify({
          currentPassword,
          newEmail: newAdminEmail.trim() || undefined,
          newPassword: newAdminPassword || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('CREDENTIALS SUCCESSFULLY CHANGED! For security reasons, you have been logged out on all devices. Please re-login.', 'success');
        localStorage.removeItem('bts_admin_token');
        setToken('');
        setIsLoggedIn(false);
        setCurrentPassword('');
        setNewAdminEmail('');
        setConfirmAdminEmail('');
        setNewAdminPassword('');
        setConfirmAdminPassword('');
      } else {
        showToast(data.error || 'Account modification rejected by server.', 'error');
      }
    } catch (err) {
      showToast('Error syncing account credentials with server.', 'error');
    } finally {
      setIsUpdatingAccount(false);
    }
  };

  const handleSaveRecoverySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSecuritySetup(true);
    try {
      const res = await fetch('/api/admin/security/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
        },
        body: JSON.stringify({
          securityQuestion,
          securityAnswer: securityAnswer.trim() || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Security Question configuration updated and encrypted successfully! 🔒', 'success');
        setSecurityAnswer('');
        if (data.backupCode) {
          setBackupCode(data.backupCode);
        }
        fetchSecuritySettings();
        fetchActivityLogs();
      } else {
        showToast(data.error || 'Failed updating security questions.', 'error');
      }
    } catch (e) {
      showToast('Error saving security question settings.', 'error');
    } finally {
      setIsSavingSecuritySetup(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!window.confirm('Terminate this session immediately? The corresponding device will be forced to log in again.')) return;
    try {
      const res = await fetch(`/api/admin/security/session/${sessionId}/revoke`, {
        method: 'POST',
        headers: { 'x-admin-token': token || localStorage.getItem('bts_admin_token') || '' }
      });
      if (res.ok) {
        showToast('Session revoked immediately.', 'success');
        fetchSecuritySettings();
        fetchActivityLogs();
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed session revocation.', 'error');
      }
    } catch (err) {
      showToast('Failed session revocation connection.', 'error');
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!window.confirm('Are you absolutely sure you want to terminate all active administrative logins across all devices? You will be logged out of this device too.')) return;
    try {
      await fetch('/api/admin/logout-all', {
        method: 'POST',
        headers: { 'x-admin-token': token || localStorage.getItem('bts_admin_token') || '' }
      });
    } catch (e) {}
    localStorage.removeItem('bts_admin_token');
    setToken('');
    setIsLoggedIn(false);
    showToast('Logged out of all sessions successfully.', 'info');
  };

  // Media managers handlers
  const handleUploadMediaFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaFilename.trim() || !newMediaUrl.trim()) {
      showToast('Filename and Media Asset url are both required.', 'error');
      return;
    }
    setIsUploadingMedia(true);
    try {
      const tagsArray = mediaTags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
        },
        body: JSON.stringify({
          filename: newMediaFilename.trim(),
          url: newMediaUrl.trim(),
          category: mediaCategory,
          tags: tagsArray
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('New media asset linked and logged to central portal successfully!', 'success');
        setNewMediaFilename('');
        setNewMediaUrl('');
        setMediaTags('');
        fetchMediaFiles();
        fetchActivityLogs();
      } else {
        showToast(data.error || 'Media link rejected.', 'error');
      }
    } catch (e) {
      showToast('Connection error linking media.', 'error');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleMultipleFilesUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setIsUploadingMedia(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Skip if file size exceeds 20MB limit
      if (file.size > 20 * 1024 * 1024) {
        showToast(`File "${file.name}" is too large (max 20MB).`, 'error');
        continue;
      }

      // Convert to Base64
      try {
        const base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        // Determine category based on file suffix
        const suffix = file.name.split('.').pop()?.toLowerCase() || '';
        let detectedCategory = 'Image';
        if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(suffix)) detectedCategory = 'Audio';
        else if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(suffix)) detectedCategory = 'Video';
        else if (suffix === 'gif') detectedCategory = 'GIF';
        else if (suffix === 'pdf') detectedCategory = 'PDF';
        else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(suffix)) detectedCategory = 'ZIP';
        else if (['png', 'jpeg', 'jpg', 'webp'].includes(suffix)) {
          detectedCategory = mediaCategory || 'Image';
        }

        const tagsArray = mediaTags.split(',').map(t => t.trim()).filter(Boolean);

        const res = await fetch('/api/admin/media/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
          },
          body: JSON.stringify({
            filename: file.name,
            base64: base64String,
            category: detectedCategory,
            tags: tagsArray
          })
        });

        if (res.ok) {
          successCount++;
        } else {
          const errData = await res.json();
          showToast(`Failed uploading ${file.name}: ${errData.error}`, 'error');
        }
      } catch (err: any) {
        showToast(`Failed to parse file "${file.name}": ${err.message}`, 'error');
      }
    }

    if (successCount > 0) {
      showToast(`Successfully uploaded ${successCount} media files! 💜`, 'success');
      setMediaTags('');
      fetchMediaFiles();
      fetchActivityLogs();
    }
    setIsUploadingMedia(false);
  };

  const handleSoundUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingSound(fieldName);
    try {
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
        },
        body: JSON.stringify({
          filename: `game_${fieldName}_${Date.now()}.${file.name.split('.').pop() || 'mp3'}`,
          base64: base64String,
          category: 'Audio',
          tags: ['game_audio', fieldName]
        })
      });

      const data = await res.json();
      if (res.ok && data.url) {
        showToast(`Selected Sound uploaded and replaced successfully!`, 'success');
        updateDraft('audioSettings', fieldName, data.url);
      } else {
        showToast(`Upload failed: ${data.error || 'Server error'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Upload failed: ${err.message}`, 'error');
    } finally {
      setIsUploadingSound(null);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
        },
        body: JSON.stringify({
          filename: `cover_${Date.now()}.${file.name.split('.').pop() || 'jpg'}`,
          base64: base64String,
          category: 'Image',
          tags: ['cover_art', 'artwork_library']
        })
      });

      const data = await res.json();
      if (res.ok && data.url) {
        const titleStr = newCoverTitle.trim() || `Cover Art - ${file.name.split('.')[0]}`;
        const newImg = {
          id: `cover-${Date.now()}`,
          title: titleStr,
          coverUrl: data.url
        };
        const currentList = Array.isArray(draftConfig.audioSettings?.coverImages) ? [...draftConfig.audioSettings.coverImages] : [];
        currentList.push(newImg);
        updateDraft('audioSettings', 'coverImages', currentList);
        setNewCoverTitle('');
        showToast('Custom cover artwork uploaded and stored successfully! 🎨', 'success');
      } else {
        showToast(`Upload failed: ${data.error || 'Server error'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Upload failed: ${err.message}`, 'error');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const testPlaySoundUrl = (url: string) => {
    if (!url) {
      showToast('No audio template URL to test playback.', 'error');
      return;
    }
    try {
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.play().then(() => {
        showToast('Sound feedback sample triggered successfully!', 'success');
      }).catch(err => {
        showToast(`Sound blocked or invalid source URL: ${err.message}`, 'error');
      });
    } catch (err: any) {
      showToast(`Sound trigger failed: ${err.message}`, 'error');
    }
  };

  const handleAudioSettingsSave = async (publishLive: boolean) => {
    const updatedConfig = { 
      ...draftConfig,
      audioSettings: draftConfig.audioSettings
    };
    
    setDraftConfig(updatedConfig);
    
    try {
      const saveRes = await fetch('/api/config/draft', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
        },
        body: JSON.stringify(updatedConfig)
      });
      
      if (!saveRes.ok) throw new Error('Save draft failed');
      
      if (publishLive) {
        const publishRes = await fetch('/api/config/publish', {
          method: 'POST',
          headers: { 'x-admin-token': token || localStorage.getItem('bts_admin_token') || '' }
        });
        
        if (publishRes.ok) {
          showToast('🚀 Audio CMS changes published live instantly!', 'success');
          const pubRep = await fetch('/api/config/published');
          if (pubRep.ok) {
            setPublishedConfig(sanitizeConfig(await pubRep.json()));
          }
        } else {
          showToast('Draft saved, but failed publishing to public.', 'info');
        }
      } else {
        showToast('📁 Audio config saved to Drafts successfully! 💜', 'success');
      }
    } catch (err) {
      showToast('CMS sync failed.', 'error');
    }
  };

  const handleRenameMediaFile = async (oldFilename: string, newFilename: string) => {
    if (!newFilename.trim()) return;
    try {
      const res = await fetch('/api/admin/media/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
        },
        body: JSON.stringify({ oldFilename, newFilename })
      });
      if (res.ok) {
        showToast(`File renamed successfully!`, 'success');
        setRenamingFile(null);
        fetchMediaFiles();
        fetchActivityLogs();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed renaming file.', 'error');
      }
    } catch (e) {
      showToast('Connection error renaming file.', 'error');
    }
  };

  const handleReplaceMediaFile = async (filename: string, file: File) => {
    setIsUploadingMedia(true);
    try {
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/admin/media/replace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
        },
        body: JSON.stringify({ filename, base64: base64String })
      });

      if (res.ok) {
        showToast(`File "${filename}" replaced successfully!`, 'success');
        fetchMediaFiles();
        fetchActivityLogs();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed replacing asset.', 'error');
      }
    } catch (err: any) {
      showToast(`Error replacing asset: ${err.message}`, 'error');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleDeleteMediaFile = async (filename: string, force: boolean) => {
    const promptMsg = force 
      ? `Delete "${filename}" permanently? This cannot be undone.` 
      : `Move "${filename}" to trash folder? You can restore it later.`;
    if (!window.confirm(promptMsg)) return;

    try {
      const res = await fetch(`/api/admin/media/delete?filename=${encodeURIComponent(filename)}&force=${force}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token || localStorage.getItem('bts_admin_token') || '' }
      });
      if (res.ok) {
        showToast(force ? 'Deleted permanently.' : 'Moved to trash directory index.', 'info');
        fetchMediaFiles();
        fetchActivityLogs();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed deleting media.', 'error');
      }
    } catch (e) {
      showToast('Failed communication for media delete.', 'error');
    }
  };

  const handleRestoreMediaFile = async (filename: string) => {
    try {
      const res = await fetch(`/api/admin/media/restore?filename=${encodeURIComponent(filename)}`, {
        method: 'POST',
        headers: { 'x-admin-token': token || localStorage.getItem('bts_admin_token') || '' }
      });
      if (res.ok) {
        showToast(`Successfully restored "${filename}" back from trash.`, 'success');
        fetchMediaFiles();
        fetchActivityLogs();
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed restoring media asset.', 'error');
      }
    } catch (err) {
      showToast('Failed media restore connection.', 'error');
    }
  };

  // Backups system handlers
  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupLabel.trim()) {
      showToast('Please specify a title/label for this system backup.', 'error');
      return;
    }
    setIsCreatingBackup(true);
    try {
      const res = await fetch('/api/admin/backup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
        },
        body: JSON.stringify({ label: backupLabel.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`System Backup point "${data.point.label}" successfully captured! 🧬`, 'success');
        setBackupLabel('');
        fetchBackupsList();
        fetchActivityLogs();
      } else {
        showToast(data.error || 'Failed to trigger snapshot backups.', 'error');
      }
    } catch (e) {
      showToast('Connection failed during database capture.', 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (id: string) => {
    const confirmation = window.confirm('DANGER! You are about to initiate database restoration. This will overwrite all of your current draft changes stream with the snapshot data. Continue?');
    if (!confirmation) return;

    setIsRestoringBackupId(id);
    try {
      const res = await fetch(`/api/admin/backup/restore?id=${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { 'x-admin-token': token || localStorage.getItem('bts_admin_token') || '' }
      });
      const data = await res.json();
      if (res.ok) {
        showToast('CMS RESTORE COMPLETELY SUCCESSFUL! Reloading draft configurations...', 'success');
        fetchConfigs();
        fetchActivityLogs();
      } else {
        showToast(data.error || 'Database restoration rejected.', 'error');
      }
    } catch (e) {
      showToast('Failed communication for database rollback.', 'error');
    } finally {
      setIsRestoringBackupId(null);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    if (!window.confirm('Delete this backup snapshot file permanently from Cloud Run/Durable container?')) return;
    try {
      const res = await fetch(`/api/admin/backup/delete?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token || localStorage.getItem('bts_admin_token') || '' }
      });
      if (res.ok) {
        showToast('Backup point purged successfully.', 'info');
        fetchBackupsList();
        fetchActivityLogs();
      } else {
        const d = await res.json();
        showToast(d.error || 'Purges rejected.', 'error');
      }
    } catch (err) {
      showToast('Failed communication to delete snapshot.', 'error');
    }
  };

  // Helper update schema shorthand
  const updateDraft = (section: string, field: string | null | undefined, value: any) => {
    setDraftConfig((prev: any) => {
      if (!field) {
        return {
          ...prev,
          [section]: value
        };
      }
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };
    });
  };

  const updateDraftArray = (arrayKey: string, index: number, field: string, value: any) => {
    setDraftConfig((prev: any) => {
      const updatedArr = [...prev[arrayKey]];
      updatedArr[index] = {
        ...updatedArr[index],
        [field]: value
      };
      return {
        ...prev,
        [arrayKey]: updatedArr
      };
    });
  };

  const saveDraftConfigToServer = async (newConfig: any) => {
    try {
      await fetch('/api/config/draft', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
        },
        body: JSON.stringify(newConfig)
      });
    } catch (err) {
      console.error('Silent draft auto-save failed:', err);
    }
  };

  const saveAndPublishConfig = async (newConfig: any) => {
    try {
      // 1. Save to draft on server
      const saveRes = await fetch('/api/config/draft', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
        },
        body: JSON.stringify(newConfig)
      });
      if (!saveRes.ok) {
        showToast('Error saving draft. Please verify connection.', 'error');
        return;
      }
      
      // 2. Publish live
      const publishRes = await fetch('/api/config/publish', {
        method: 'POST',
        headers: {
          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
        }
      });
      if (publishRes.ok) {
        showToast('Deleted item completely and changes published live instantly! 💜🎉', 'success');
        const pubRep = await fetch('/api/config/published');
        if (pubRep.ok) {
          const pubJson = await pubRep.json();
          setPublishedConfig(sanitizeConfig(pubJson));
        }
        if (typeof onPublishSuccess === 'function') {
          onPublishSuccess();
        }
      } else {
        showToast('Draft updated but live sync failed.', 'info');
      }
    } catch (err) {
      console.error('Save and publish failed:', err);
      showToast('Connection error during deletion sync.', 'error');
    }
  };

  const deleteDraftArrayItem = async (arrayKey: string, index: number) => {
    const array = Array.isArray(draftConfig[arrayKey]) ? [...draftConfig[arrayKey]] : [];
    const itemLabel = array[index] && (array[index].title || array[index].name || array[index].filename) 
      ? `"${array[index].title || array[index].name || array[index].filename}"`
      : `this item`;
      
    confirmAction(`Are you sure you want to permanently delete ${itemLabel} from ${arrayKey}?`, async () => {
      array.splice(index, 1);
      const updated = {
        ...draftConfig,
        [arrayKey]: array
      };
      setDraftConfig(updated);
      await saveAndPublishConfig(updated);
    });
  };

  const deleteMemberContentItem = async (subArrayKey: string, itemIndex: number) => {
    if (editingMemberIndex === null) return;
    const subLabel = subArrayKey === 'videoIds' ? 'video' : subArrayKey === 'funFacts' ? 'fun fact' : subArrayKey === 'soloActivities' ? 'solo work' : subArrayKey === 'gallery' ? 'moment image' : 'timeline event';
    
    confirmAction(`Are you sure you want to permanently delete this ${subLabel}?`, async () => {
      const member = draftConfig.members[editingMemberIndex];
      const subArray = Array.isArray(member[subArrayKey]) ? [...member[subArrayKey]] : [];
      subArray.splice(itemIndex, 1);
      
      const updatedMembers = [...draftConfig.members];
      updatedMembers[editingMemberIndex] = {
        ...updatedMembers[editingMemberIndex],
        [subArrayKey]: subArray
      };
      
      const updated = {
        ...draftConfig,
        members: updatedMembers
      };
      
      setDraftConfig(updated);
      await saveAndPublishConfig(updated);
    });
  };

  const moveDraftArrayItem = (arrayKey: string, index: number, direction: 'up' | 'down') => {
    const arr = Array.isArray(draftConfig[arrayKey]) ? [...draftConfig[arrayKey]] : [];
    if (direction === 'up' && index > 0) {
      const temp = arr[index];
      arr[index] = arr[index - 1];
      arr[index - 1] = temp;
    } else if (direction === 'down' && index < arr.length - 1) {
      const temp = arr[index];
      arr[index] = arr[index + 1];
      arr[index + 1] = temp;
    }
    const updated = {
      ...draftConfig,
      [arrayKey]: arr
    };
    setDraftConfig(updated);
    saveDraftConfigToServer(updated);
    showToast('Reordered item successfully and saved to draft! 💜', 'info');
  };

  const handleSetFeaturedVideo = async (videoId: string) => {
    try {
      const res = await fetch('/api/video/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set-featured',
          videoId,
          adminToken: token || localStorage.getItem('bts_admin_token') || ''
        })
      });
      if (res.ok) {
        showToast('Video featured spotlight pinned! 📌', 'success');
        fetchConfigs();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update featured video pin.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error toggling featured video pin.', 'error');
    }
  };

  const handleCmsSave = async (publishLive: boolean = false) => {
    if (!cmsEditing) return;
    const { tab, index, data } = cmsEditing;
    
    let arrayKey = '';
    if (tab === 'Gallery') arrayKey = 'gallery';
    else if (tab === 'Events') arrayKey = 'events';
    else if (tab === 'Music') arrayKey = 'albums';
    else if (tab === 'DigitalTracks') arrayKey = 'digitalTracks';
    else if (tab === 'Videos') arrayKey = 'videos';
    else if (tab === 'News') arrayKey = 'news';
    else if (tab === 'Downloads') arrayKey = 'downloads';
    
    // Fetch super fresh draft configuration from server right before saving any edits 
    // to safeguard user-submitted data from being overwritten
    let freshDraft = { ...draftConfig };
    try {
      const res = await fetch('/api/config/draft', {
        headers: {
          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
        }
      });
      if (res.ok) {
        freshDraft = await res.json();
      }
    } catch (e) {
      console.warn('Could not fetch fresh draft before merging, using on-screen fallback:', e);
    }
    
    let updatedConfig = { ...freshDraft };
    
    if (tab === 'Home') {
      updatedConfig.home = data;
    } else if (tab === 'AudioControl') {
      updatedConfig.audioSettings = data;
    } else if (tab === 'Countdown') {
      updatedConfig.countdown = data;
    } else if (tab === 'Showcase') {
      updatedConfig.countdown = updatedConfig.countdown || {};
      updatedConfig.showcase = data.showcase;
      updatedConfig.trending = data.trending;
    } else if (tab === 'Timeline') {
      const arr = Array.isArray(updatedConfig.timeline) ? [...updatedConfig.timeline] : [];
      if (index === -1) {
        arr.push(data);
      } else {
        arr[index] = data;
      }
      updatedConfig.timeline = arr;
    } else if (tab === 'FAQ') {
      const arr = Array.isArray(updatedConfig.faqs) ? [...updatedConfig.faqs] : [];
      if (index === -1) {
        arr.push(data);
      } else {
        arr[index] = data;
      }
      updatedConfig.faqs = arr;
    } else if (tab === 'SidebarFooter') {
      updatedConfig.sidebar = data.sidebar;
      updatedConfig.footer = data.footer;
    } else if (tab === 'Spotlight') {
      updatedConfig.monthlySpotlight = data;
    } else if (tab === 'Eras') {
      const arr = Array.isArray(updatedConfig.eras) ? [...updatedConfig.eras] : [];
      if (index === -1) {
        arr.push(data);
      } else {
        arr[index] = data;
      }
      updatedConfig.eras = arr;
    } else if (arrayKey) {
      const arr = Array.isArray(updatedConfig[arrayKey]) ? [...updatedConfig[arrayKey]] : [];
      const itemData = { ...data };
      if (arrayKey === 'news') {
        const getSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        itemData.slug = getSlug(itemData.title || '');
      }
      if (index === -1) {
        arr.push(itemData);
      } else {
        arr[index] = itemData;
      }
      updatedConfig[arrayKey] = arr;
    }
    
    setDraftConfig(updatedConfig);
    
    try {
      const saveRes = await fetch('/api/config/draft', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
        },
        body: JSON.stringify(updatedConfig)
      });
      
      if (!saveRes.ok) {
        throw new Error('Draft save failed');
      }
      
      if (publishLive) {
        const publishRes = await fetch('/api/config/publish', {
          method: 'POST',
          headers: { 'x-admin-token': token || localStorage.getItem('bts_admin_token') || '' }
        });
        
        if (publishRes.ok) {
          showToast(`🚀 ${tab} Item Published Internally & Live Instantly!`, 'success');
          const pubRep = await fetch('/api/config/published');
          if (pubRep.ok) {
            setPublishedConfig(sanitizeConfig(await pubRep.json()));
          }
          onPublishSuccess();
        } else {
          showToast('Draft saved, but failed publishing to public cloud.', 'info');
        }
      } else {
        showToast(`📁 ${tab} Item Draft Saved Safely! 💜`, 'success');
      }
      
      setCmsEditing(null);
      setCmsShowPreview(false);
    } catch (err) {
      showToast('CMS sync failed. Connection error.', 'error');
    }
  };

  const addDraftArrayItem = (arrayKey: string, defaultItem: any) => {
    setDraftConfig((prev: any) => ({
      ...prev,
      [arrayKey]: [...prev[arrayKey], defaultItem]
    }));
    showToast(`Added a new element to list. Use forms to customize.`, 'info');
  };

  // Wait for Firebase Auth initialization to avoid screen flash
  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 z-50 bg-[#06020c] flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Login shell wrapper
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 bg-[#06020c] flex items-center justify-center p-4 font-sans text-stone-100 overflow-hidden select-none bts-admin-dashboard">
        {/* Animated background purple and pink ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] rounded-full bg-purple-900/10 blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] rounded-full bg-pink-900/10 blur-[130px] animate-pulse pointer-events-none" style={{ animationDuration: '6s' }} />
        
        <div className="absolute top-6 left-6">
          <button 
            onClick={onClose}
            className="text-xs font-semibold px-4 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05] hover:text-white hover:border-purple-500/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            ← Exit to Public Website
          </button>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-purple-500/15 bg-slate-900/40 backdrop-blur-3xl p-8 sm:p-10 shadow-2xl relative space-y-8 select-text">
          <div className="text-center space-y-3">
            <span className="text-5xl text-purple-400 font-black block drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] select-none">⟭⟬⁷</span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-widest text-white uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 drop-shadow-sm select-none">
              BANGTAN PORTAL
            </h2>
            <div className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
              <p className="text-[10px] font-sans text-purple-300 uppercase tracking-widest font-extrabold leading-none">
                Authorized Admin Gateway
              </p>
            </div>
          </div>

          {!showForgotPassword ? (
            <>
              <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-purple-300 uppercase block font-bold">Administrator ID</label>
                  <input
                    type="text"
                    required
                    autoComplete="new-password"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-purple-500/10 bg-purple-950/10 hover:border-purple-500/20 focus:border-purple-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all text-white placeholder-purple-900"
                    placeholder="Enter admin ID"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <label className="text-purple-300 uppercase font-bold">Secure Password</label>
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowForgotPassword(true);
                        setForgotEmail(username);
                      }}
                      className="text-[10px] text-purple-400 hover:text-purple-350 underline uppercase cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-purple-500/10 bg-purple-950/10 hover:border-purple-500/20 focus:border-purple-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all text-white placeholder-purple-900"
                    placeholder="••••••••"
                  />
                </div>

                {loginError && (
                  <div className="p-3 text-xs rounded-lg bg-red-950/40 border border-red-500/25 text-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-50 text-white font-bold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Unlocking Archives...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Request Secure Access</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-purple-950/20 border border-purple-500/20 p-4 rounded-xl text-xs space-y-1.5">
                <span className="text-purple-300 font-bold font-mono block uppercase">🔒 Account Recovery Portal</span>
                <p className="text-stone-400">Verifying administrative ownership through dual backup query vectors.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-purple-300 block uppercase font-bold">Admin ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="flex-grow px-3 py-2 bg-purple-950/20 border border-purple-500/15 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                      placeholder="Enter admin ID"
                    />
                    <button
                      type="button"
                      onClick={() => handleQueryForgotPassword()}
                      className="px-3 py-2 bg-purple-800 hover:bg-purple-700 text-white text-xs font-mono rounded-lg transition-all"
                    >
                      Query Question
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-purple-300 block uppercase font-bold">Verification Vector</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotMethod('security-question')}
                      className={`py-1.5 text-xs font-semibold rounded-lg font-mono ${
                        forgotMethod === 'security-question' ? 'bg-purple-600 text-white' : 'bg-purple-950/40 text-purple-400 border border-purple-500/10'
                      }`}
                    >
                      Security Question
                    </button>
                    <button
                      type="button"
                      onClick={() => setForgotMethod('backup-code')}
                      className={`py-1.5 text-xs font-semibold rounded-lg font-mono ${
                        forgotMethod === 'backup-code' ? 'bg-purple-600 text-white' : 'bg-purple-950/40 text-purple-400 border border-purple-500/10'
                      }`}
                    >
                      Backup File Code
                    </button>
                  </div>
                </div>

                <form onSubmit={handleResetForgotPassword} className="space-y-3 pt-2">
                  {forgotMethod === 'security-question' ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-purple-300 block uppercase font-bold">Recovery Question</label>
                      <div className="p-2.5 bg-black/40 border border-purple-500/5 rounded text-xs text-purple-200">
                        {forgotQuestion || 'Click "Query Question" above to load security setup.'}
                      </div>

                      <label className="text-xs font-mono text-purple-300 block uppercase font-bold mt-2">Your Security Answer</label>
                      <input
                        type="text"
                        required
                        value={forgotAnswer}
                        onChange={(e) => setForgotAnswer(e.target.value)}
                        className="w-full px-3 py-2 bg-purple-950/20 border border-purple-500/15 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500 animate-fade-in"
                        placeholder="Type answer to security question"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-xs font-mono text-purple-300 block uppercase font-bold">16-Character Backup Code</label>
                      <input
                        type="text"
                        required
                        value={forgotBackupCode}
                        onChange={(e) => setForgotBackupCode(e.target.value)}
                        className="w-full px-3 py-2 bg-purple-950/20 border border-purple-500/15 rounded-lg text-xs text-white font-mono uppercase focus:outline-none focus:border-purple-500"
                        placeholder="ARMY-XXXX-XXXX-XXXX"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-purple-300 block uppercase font-bold">Assign New Master Password</label>
                    <input
                      type="password"
                      required
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-purple-950/20 border border-purple-500/15 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                      placeholder="Minimum 6 characters"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="flex-grow py-2.5 border border-purple-500/20 text-purple-400 hover:bg-purple-950/30 text-xs font-bold font-sans uppercase rounded-xl transition-all"
                    >
                      Back to Login
                    </button>
                    <button
                      type="submit"
                      disabled={isResettingPassword}
                      className="flex-grow py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold font-sans uppercase rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      {isResettingPassword && <Loader2 className="w-3 animate-spin"/>}
                      <span>Reset & Unlock</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <p className="text-[10px] text-center text-slate-500 leading-normal font-mono">
            Auto-session termination enabled. TLS encrypted routing protocol.
          </p>
        </div>
      </div>
    );
  }

  // Loading schema fallback
  if (!draftConfig) {
    return (
      <div className="fixed inset-0 z-50 bg-[#06020c] flex flex-col items-center justify-center space-y-4 text-stone-200">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        <p className="font-mono text-xs text-purple-400 uppercase tracking-widest">Hydrating Administrative CMS Configs...</p>
      </div>
    );
  }

  // Search filtered contact messages
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(contactSearch.toLowerCase()) || 
                          c.email?.toLowerCase().includes(contactSearch.toLowerCase()) || 
                          c.message?.toLowerCase().includes(contactSearch.toLowerCase()) ||
                          c.subject?.toLowerCase().includes(contactSearch.toLowerCase());
    
    if (contactFilter === 'All') return matchesSearch;
    return c.status === contactFilter && matchesSearch;
  });

  if (isLoggedIn && isTemporarySession) {
    return (
      <div className="fixed inset-0 z-50 bg-[#06020c] flex items-center justify-center p-4 font-sans text-stone-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(88,28,135,0.18)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="w-full max-w-lg rounded-3xl border border-purple-500/35 bg-[#0d071b]/95 backdrop-blur-xl p-8 shadow-2xl relative space-y-6">
          
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-purple-600 to-fuchsia-600 rounded-t-3xl" />

          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/45 border border-purple-500/35 flex items-center justify-center mx-auto mb-2 text-purple-400">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
              Owner Security Setup
            </h3>
            <p className="text-xs text-stone-400 leading-normal max-w-sm mx-auto">
              You are signed in with <b>Default or Temporary Credentials</b>. Before proceeding, you must configure your permanent custom owner credentials.
            </p>
          </div>

          <div className="bg-purple-950/20 border border-purple-500/15 p-4 rounded-2xl text-[11px] text-purple-300 leading-relaxed space-y-1">
            <span className="font-bold block uppercase tracking-wide">⚠️ Permanency Enforcement:</span>
            <p className="text-xs text-stone-400">
              Upon successful creation of your new administrator email and password, all default/temporary credentials will become permanently disabled.
            </p>
          </div>

          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newAdminEmail.trim() || !newAdminPassword) {
                showToast('Please specify both a new email and password.', 'error');
                return;
              }
              if (newAdminEmail.trim() !== confirmAdminEmail.trim()) {
                showToast('New email addresses do not match.', 'error');
                return;
              }
              if (newAdminPassword !== confirmAdminPassword) {
                showToast('New passwords do not match.', 'error');
                return;
              }
              if (newAdminPassword.length < 6) {
                showToast('New password must match or exceed 6 characters.', 'error');
                return;
              }

              setIsUpdatingAccount(true);
              try {
                const res = await fetch('/api/admin/security/account', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                  },
                  body: JSON.stringify({
                    currentPassword: localStorage.getItem('bts_temp_input_pass') || 'army7seven',
                    newEmail: newAdminEmail.trim(),
                    newPassword: newAdminPassword
                  })
                });
                const data = await res.json();
                if (res.ok) {
                   showToast('CREDENTIALS SUCCESSFULLY CHANGED! Temporary credentials disabled. Please log in with your new credentials.', 'success');
                   localStorage.removeItem('bts_admin_token');
                   localStorage.removeItem('bts_temp_session');
                   localStorage.removeItem('bts_temp_input_pass');
                   setToken('');
                   setIsLoggedIn(false);
                   setIsTemporarySession(false);
                   setNewAdminEmail('');
                   setConfirmAdminEmail('');
                   setNewAdminPassword('');
                   setConfirmAdminPassword('');
                   setUsername('');
                   setPassword('');
                } else {
                  showToast(data.error || 'Server rejected updates. Verify validity.', 'error');
                }
              } catch (err) {
                showToast('Network sync error during credential updates.', 'error');
              } finally {
                setIsUpdatingAccount(false);
              }
            }}
            className="space-y-4"
            autoComplete="off"
          >
            {/* EMAIL FIELDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-purple-300 font-bold block">New Email Identity</label>
                <input
                  type="email"
                  required
                  autoComplete="new-password"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="e.g. yourname@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-500/20 bg-purple-950/10 focus:border-purple-500 text-xs focus:ring-1 focus:ring-purple-500 text-white outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-purple-300 font-bold block">Confirm New Email</label>
                <input
                  type="email"
                  required
                  autoComplete="new-password"
                  value={confirmAdminEmail}
                  onChange={(e) => setConfirmAdminEmail(e.target.value)}
                  placeholder="Repeat new email identity"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-500/20 bg-purple-950/10 focus:border-purple-500 text-xs focus:ring-1 focus:ring-purple-500 text-white outline-none"
                />
              </div>
            </div>

            {/* PASSWORD FIELDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-purple-300 font-bold block">New Secure Password</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-500/20 bg-purple-950/10 focus:border-purple-500 text-xs focus:ring-1 focus:ring-purple-500 text-white outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-purple-300 font-bold block">Confirm Password</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmAdminPassword}
                  onChange={(e) => setConfirmAdminPassword(e.target.value)}
                  placeholder="Repeat secure password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-500/20 bg-purple-950/10 focus:border-purple-500 text-xs focus:ring-1 focus:ring-purple-500 text-white outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 text-xs rounded-xl border border-purple-500/10 hover:bg-white/5 font-mono text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                &larr; Log Out / Exit
              </button>
              
              <button
                type="submit"
                disabled={isUpdatingAccount}
                className="flex-grow py-2.5 text-xs rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/30"
              >
                {isUpdatingAccount ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating Credentials...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Save Setup & Finalize
                  </>
                )}
              </button>
            </div>
          </form>
          
        </div>
      </div>
    );
  }

  return (
    <div id="admin-management-portal" className="bts-admin-dashboard fixed inset-0 z-50 bg-[#110724] flex flex-col h-full text-slate-200 font-sans text-sm select-none">
      <style>{`
        #admin-management-portal {
          background: radial-gradient(circle at 50% 50%, #1a0833 0%, #0d041c 100%) !important;
        }
        #admin-management-portal main {
          background: transparent !important;
        }
        #admin-management-portal input[type="text"],
        #admin-management-portal input[type="password"],
        #admin-management-portal input[type="number"],
        #admin-management-portal input[type="email"],
        #admin-management-portal input[type="url"],
        #admin-management-portal select,
        #admin-management-portal textarea {
          padding-top: 0.75rem !important;
          padding-bottom: 0.75rem !important;
          padding-left: 1rem !important;
          padding-right: 1rem !important;
          font-size: 0.95rem !important;
          line-height: 1.5 !important;
          border-radius: 0.75rem !important;
          background-color: rgba(22, 10, 42, 0.75) !important;
          border: 1px solid rgba(168, 85, 247, 0.25) !important;
          color: #f1eefc !important;
          min-height: 2.85rem;
          transition: all 0.2s ease-in-out !important;
        }
        #admin-management-portal input:focus,
        #admin-management-portal select:focus,
        #admin-management-portal textarea:focus {
          border-color: rgba(168, 85, 247, 0.7) !important;
          box-shadow: 0 0 12px rgba(168, 85, 247, 0.2) !important;
          background-color: rgba(30, 15, 58, 0.9) !important;
          outline: none !important;
        }
        #admin-management-portal input::placeholder,
        #admin-management-portal textarea::placeholder {
          color: rgba(216, 180, 254, 0.45) !important;
          font-size: 0.9rem !important;
        }
        #admin-management-portal textarea {
          min-height: 6.5rem !important;
        }
        @media (max-width: 1024px) {
          #admin-management-portal main .grid:not(.no-responsive-stack) {
            grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
            gap: 1.25rem !important;
          }
        }
      `}</style>
      {/* CMS STATUS BAR TOASTS */}
      {cmsMessage.text && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border flex items-center gap-3 animate-fade-in shadow-2xl ${
          cmsMessage.type === 'error' ? 'bg-red-950/95 border-red-500/50 text-red-100' :
          cmsMessage.type === 'info' ? 'bg-indigo-950/95 border-indigo-500/50 text-indigo-100' :
          'bg-emerald-950/95 border-emerald-500/50 text-emerald-100'
        }`}>
          {cmsMessage.type === 'error' ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-xs font-semibold font-sans">{cmsMessage.text}</span>
        </div>
      )}

      {/* Header bar structure */}
      <header className="h-16 border-b border-purple-500/15 bg-[#120625] px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Navigation Toggle */}
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-2 rounded-xl border border-purple-500/15 bg-purple-950/20 text-purple-300 hover:text-white hover:bg-purple-950/40 flex items-center justify-center transition-all cursor-pointer"
            title="Toggle Sidebar Navigation"
          >
            {mobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-xl text-purple-400 font-black">⟭⟬⁷</span>
            <span className="font-extrabold tracking-wider text-white font-sans uppercase text-xs sm:text-sm">BTS ADMIN</span>
            <span className="text-[9px] font-mono bg-purple-500/20 text-purple-200 border border-purple-500/30 px-1.5 py-0.5 rounded-full font-bold">
              CMS
            </span>
          </div>

          <div className="h-4 w-px bg-purple-500/10 hidden lg:block" />
          
          <div className="hidden lg:flex items-center gap-2 text-xs font-sans text-purple-300/60 uppercase tracking-widest font-black">
            Central Management Dashboard
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Go to Website Homepage */}
          <button
            onClick={onClose}
            className="h-9 px-2.5 sm:px-3 gap-1.5 rounded-lg border border-purple-500/20 bg-purple-950/40 hover:bg-purple-950/70 hover:border-purple-500/50 text-purple-300 text-xs font-sans transition-all flex items-center cursor-pointer font-semibold"
            title="Return to the Interactive Website Homepage"
          >
            <Home className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Home Page</span>
          </button>

          {/* Reset button drafts */}
          <button
            onClick={handleResetDraft}
            className="h-9 px-2.5 sm:px-3 gap-1.5 rounded-lg border border-red-500/10 hover:border-red-500/30 bg-red-950/10 hover:bg-red-950/20 text-red-400 text-xs font-mono transition-all flex items-center cursor-pointer"
            title="Discard current unsaved edits and sync back to live version."
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Draft</span>
          </button>

          {/* Save Draft button */}
          <button
            onClick={handleSaveDraft}
            disabled={savingDraft}
            className="h-9 px-2.5 sm:px-4 gap-1.5 rounded-lg border border-purple-500/25 bg-purple-950/25 hover:bg-purple-950/45 text-purple-300 text-xs font-bold font-sans transition-all flex items-center cursor-pointer"
          >
            {savingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">Save Draft</span>
          </button>

          {/* Publish Draft changes */}
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="h-9 px-2.5 sm:px-4 gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs font-extrabold tracking-wide uppercase transition-all flex items-center justify-center shadow-[0_4px_15px_rgba(147,51,234,0.3)] hover:shadow-[0_4px_25px_rgba(168,85,247,0.5)] cursor-pointer"
          >
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">Publish Live</span>
          </button>

          <div className="h-6 w-px bg-purple-500/10 ml-1 hidden sm:block" />

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="h-9 w-9 rounded-lg border border-purple-500/15 text-slate-400 hover:text-white hover:bg-purple-950/20 flex items-center justify-center transition-all cursor-pointer ml-1 shrink-0"
            title="Log out of Secure Admin Section"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Split Screen container */}
      <div className="flex-grow flex overflow-hidden relative">
        
        {/* BACKDROP FOR MOBILE SIDEBAR */}
        {mobileSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-30 bg-black/75 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        
        {/* SIDEBAR NAVIGATION tabs - Redesigned ultra-spacious with modern indicator glows */}
        <aside className={`
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:relative top-16 lg:top-0 bottom-0 left-0 z-40 w-64 shrink-0 border-r border-purple-500/10 bg-[#160b2d]/98 lg:bg-[#0c051a]/70 backdrop-blur-2xl flex flex-col justify-between overflow-y-auto transition-all duration-300 select-none h-[calc(100vh-64px)] lg:h-auto
        `}>
          <div className="p-4 space-y-4">
            <span className="text-[10px] uppercase font-sans tracking-widest text-purple-400 font-extrabold px-3 py-1 font-black block border-b border-purple-500/10">
              ⚡ CMS Control Tower
            </span>

            <div className="space-y-1">
              {[
                { id: 'VisualBuilder', label: '✨ Visual Page Editor', icon: <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" /> },
                { id: 'Dashboard', label: 'Dashboard Logs', icon: <LayoutDashboard className="w-4 h-4" /> },
                { id: 'Support', label: 'Support Inbox', icon: <Mail className="w-4 h-4 text-emerald-400" /> },
                { id: 'Media', label: 'Media Files Manager', icon: <Image className="w-4 h-4 text-blue-400" /> },
                { id: 'Backups', label: 'CMS Data Backups', icon: <Database className="w-4 h-4 text-emerald-400" /> },
                { id: 'Links', label: 'Links Management', icon: <Link2 className="w-4 h-4 text-sky-400" /> },
                { id: 'Home', label: 'Home Feed Banner', icon: <Home className="w-4 h-4 text-purple-400" /> },
                { id: 'Countdown', label: 'Tour Countdown', icon: <Calendar className="w-4 h-4 text-rose-500" /> },
                { id: 'Showcase', label: '3D Media Showcase', icon: <Sparkles className="w-4 h-4 text-cyan-400" /> },
                { id: 'WeversePosts', label: 'Weverse Posts CMS', icon: <Smartphone className="w-4 h-4 text-fuchsia-400" /> },
                { id: 'Timeline', label: 'Career Timeline', icon: <Clock className="w-4 h-4 text-orange-400" /> },
                { id: 'FAQ', label: 'FAQs CMS', icon: <HelpCircle className="w-4 h-4 text-amber-400" /> },
                { id: 'VotingCenter', label: '🗳️ Voting Center CMS', icon: <Vote className="w-4 h-4 text-purple-400 animate-pulse" /> },
                { id: 'SidebarFooter', label: 'Sidebar & Footer', icon: <Settings className="w-4 h-4 text-emerald-500" /> },
                { id: 'Disclaimer', label: 'Disclaimer CMS', icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> },
                { id: 'Members', label: 'Members Bios', icon: <Users className="w-4 h-4" /> },
                { id: 'Music', label: 'Music Playlists', icon: <Music className="w-4 h-4 text-[#ec4899]" /> },
                { id: 'AudioControl', label: 'Audio & Sound CMS', icon: <Volume2 className="w-4 h-4 text-emerald-400" /> },
                { id: 'Videos', label: 'YouTube Streams', icon: <Video className="w-4 h-4 text-red-400" /> },
                { id: 'Gallery', label: 'Gallery Albums', icon: <Image className="w-4 h-4 text-pink-400" /> },
                { id: 'Events', label: 'Festa Events', icon: <Calendar className="w-4 h-4" /> },
                { id: 'Downloads', label: 'HD Downloads', icon: <Download className="w-4 h-4" /> },
                { id: 'News', label: 'News Feed Articles', icon: <Newspaper className="w-4 h-4 text-[#eab308]" /> },
                { id: 'SEO', label: 'SEO tags', icon: <Globe className="w-4 h-4" /> },
                { id: 'Theme', label: 'Theme Studio', icon: <Palette className="w-4 h-4 text-rose-500" /> },
                { id: 'LiveStreaming', label: 'Live Streaming', icon: <Radio className="w-4 h-4 text-rose-400" /> },
                { id: 'Security', label: 'Account & Security', icon: <Lock className="w-4 h-4 text-gray-400" /> }
              ].map(tab => {
                const isActive = activeAdminTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveAdminTab(tab.id);
                      setMobileSidebarOpen(false); // Auto-close on mobile selection!
                    }}
                    className={`w-full flex items-center h-10 px-4 rounded-xl text-xs font-semibold text-left transition-all duration-200 group relative ${
                      isActive 
                        ? 'bg-purple-600/15 text-purple-200 font-extrabold border-l-[3px] border-purple-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] bg-[#1d0e3e]/85 pl-3' 
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.02]/30 pl-4 hover:translate-x-1'
                    } cursor-pointer`}
                  >
                    <span className="mr-3 shrink-0 transition-transform duration-200 group-hover:scale-110">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clean human footer display, removing AI-slop telemetry rows */}
          <div className="p-4 border-t border-purple-500/10 text-center text-[10px] font-semibold text-slate-500 tracking-wider">
            💜 BTS Admin Desk • 2026
          </div>
        </aside>

        {/* WORKSPACE AREA: LEFT EDITOR & RIGHT LIVE PREVIEW */}
        <div className="flex-grow flex overflow-hidden">
          {!draftConfig ? (
            <div className="flex-grow flex flex-col items-center justify-center bg-[#070212] text-white p-8">
              <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                <h3 className="text-lg font-bold font-sans">Syncing CMS Cloud Database</h3>
                <p className="text-xs text-purple-300/70 font-mono leading-relaxed">
                  Establishing secure tunnel to Cloud Run container and pulling real-time configurations...
                </p>
              </div>
            </div>
          ) : activeAdminTab === 'VisualBuilder' ? (
            <VisualWebsiteEditor
              draftConfig={draftConfig}
              setDraftConfig={setDraftConfig}
              publishedConfig={publishedConfig}
              setPublishedConfig={setPublishedConfig}
              onSaveDraft={handleSaveDraft}
              onPublish={handlePublish}
              onResetDraft={handleResetDraft}
              savingDraft={savingDraft}
              publishing={publishing}
            />
          ) : (
            <>
              {/* EDITOR LEFT COLUMN PANEL - redesigned with beautiful gradients and responsive spacing */}
              <main className="w-full lg:w-1/2 flex flex-col border-r border-purple-500/10 bg-gradient-to-b from-[#0a0518] to-[#040109] h-full overflow-y-auto p-5 sm:p-8 space-y-8 select-text">
            
            {/* TAB CONTENT: DASHBOARD */}
            {activeAdminTab === 'Dashboard' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight font-sans">Central Administration Dashboard</h3>
                  <p className="text-sm text-purple-300/80 mt-1">Real-time content metrics, active database counts, and system activity records.</p>
                </div>

                {/* Stat Grid - Redesigned for premium open spacing */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[
                    { label: 'Cumulative Page Views', value: stats?.totalViews || 0, icon: <Eye className="w-5 h-5 text-purple-400" /> },
                    { label: 'Digital Downloads', value: stats?.totalDownloads || 0, icon: <Download className="w-5 h-5 text-indigo-400" /> },
                    { label: 'Songs Catalogue', value: (((draftConfig?.albums || []).reduce((acc: number, item: any) => acc + (item.tracks?.length || 0), 0)) + (draftConfig?.digitalTracks?.length || 0)), icon: <Music className="w-5 h-5 text-pink-400" /> },
                    { label: 'YouTube Video Embeds', value: (draftConfig?.videos || []).length, icon: <Video className="w-5 h-5 text-rose-400" /> },
                    { label: 'Festa Events & Milestones', value: (draftConfig?.events || []).length, icon: <Calendar className="w-5 h-5 text-amber-500" /> },
                    { label: 'HD Device Wallpapers', value: (draftConfig?.downloads || []).length, icon: <Download className="w-5 h-5 text-emerald-400" /> },
                    { label: 'Live Support Queries', value: contacts.length, icon: <Inbox className="w-5 h-5 text-fuchsia-400" /> }
                  ].map((stat, idx) => (
                    <div key={idx} className="p-6 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:border-purple-500/20 hover:bg-white/[0.03] transition-all duration-300 shadow-lg hover:-translate-y-0.5 group">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-bold">{stat.label}</span>
                        <div className="p-2 rounded-xl bg-purple-500/5 border border-purple-500/15 group-hover:bg-purple-500/10 transition-colors">
                          {stat.icon}
                        </div>
                      </div>
                      <div className="text-3xl font-black text-white font-sans tracking-tight">{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Audit Logs and Activity details - Premium glassmorphism layout */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Left: Recent activity Notifications log */}
                  <div className="border border-white/[0.04] bg-white/[0.01] rounded-2xl p-6 space-y-4 shadow-xl">
                    <span className="text-xs font-mono font-extrabold text-purple-300 uppercase tracking-widest block pb-2 border-b border-purple-500/10">
                      📣 Recent Fan Activities ({notifications.length} events)
                    </span>
                    
                    <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                      {notifications.map((noti) => (
                        <div key={noti.id} className="flex gap-3 text-xs border-b border-white/[0.02] pb-3 last:border-0 last:pb-0 font-sans items-start">
                          <span className="text-purple-400 font-extrabold text-sm select-none">⟭⟬</span>
                          <div className="flex-grow space-y-0.5 min-w-0">
                            <p className="text-slate-350 leading-relaxed font-sans text-xs">
                              <span className="text-white font-bold">{noti.user}</span> {noti.content}
                            </p>
                            <span className="text-[10px] font-mono font-medium text-slate-500 block">
                              {new Date(noti.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Master Security Operations Audit Feed */}
                  <div className="border border-white/[0.04] bg-white/[0.01] rounded-2xl p-6 space-y-4 shadow-xl">
                    <div className="flex justify-between items-center pb-2 border-b border-purple-500/10">
                      <span className="text-xs font-mono font-extrabold text-red-400 uppercase tracking-widest block">
                        🔒 Operational Security Logs ({activityLogs.length} logs)
                      </span>
                      <button 
                        onClick={fetchActivityLogs}
                        className="text-[10px] font-mono text-purple-400 hover:text-white transition-all bg-purple-950/25 border border-purple-500/10 px-2 py-1 rounded-md"
                      >
                        Refresh Log
                      </button>
                    </div>
                    
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1 font-mono text-xs text-slate-300">
                      {activityLogs.map((log, lidx) => (
                        <div key={lidx} className="p-3 bg-black/30 rounded-xl border border-white/[0.03] space-y-1">
                          <div className="flex justify-between text-slate-400 font-bold text-[10px]">
                            <span>👤 {log.email}</span>
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-purple-300 leading-normal"><span className="text-white font-extrabold">[{log.action.toUpperCase()}]</span> {log.details}</p>
                          <div className="text-[9px] text-slate-500 flex justify-between pt-1 border-t border-white/[0.01]">
                            <span>IP: {log.ip}</span>
                            <span>{log.device}</span>
                          </div>
                        </div>
                      ))}

                      {activityLogs.length === 0 && (
                        <span className="text-xs text-slate-500 block text-center py-10 font-sans">No security operations logged yet.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: CONTACT MESSAGES */}
            {activeAdminTab === 'Support' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase font-sans">Support Form Communiques</h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">Every message submitted from Contact Form appears here instantly. Copies are dispatched to tgarirangarmy7@gmail.com.</p>
                  </div>
                  <button 
                    onClick={fetchContacts}
                    className="p-2 gap-1 px-3 border border-purple-500/15 bg-purple-950/20 text-xs font-mono text-purple-400 rounded-lg hover:bg-purple-950/40 transition-all flex items-center cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reload
                  </button>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      placeholder="Search senders, emails, messages..."
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-purple-500/10 bg-purple-950/15 text-xs text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <select
                    value={contactFilter}
                    onChange={(e: any) => setContactFilter(e.target.value)}
                    className="border border-purple-500/15 bg-purple-950/20 text-xs text-purple-300 rounded-lg px-3 focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Unread">Unread</option>
                    <option value="Read">Read</option>
                    <option value="Replied">Replied</option>
                  </select>
                </div>

                {isLoadingContacts ? (
                  <div className="py-20 text-center text-slate-500 font-mono text-xs">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" /> Loading submissions...
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="py-20 text-center text-slate-500 font-mono text-xs border border-dashed border-purple-500/10 rounded-xl bg-purple-950/5">
                    No matching support tickets located.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredContacts.map((contact) => (
                      <div key={contact.id} className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/10 relative space-y-3 font-sans">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-white text-sm block">{contact.name}</span>
                            <span className="text-[11px] font-mono text-slate-400">{contact.email}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              contact.status === 'Unread' ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/20' :
                              contact.status === 'Read' ? 'bg-amber-950 text-amber-300 border border-amber-500/20' :
                              'bg-emerald-950 text-emerald-300 border border-emerald-500/20'
                            }`}>
                              {contact.status || 'Unread'}
                            </span>
                            
                            <button
                              onClick={() => handleDeleteContact(contact.id)}
                              className="p-1 px-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded transition-colors cursor-pointer"
                              title="Delete permanently"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {contact.subject && (
                          <div className="text-xs font-semibold text-purple-300">
                            Subject: {contact.subject}
                          </div>
                        )}

                        <div className="bg-[#05020a] border border-purple-950 p-3 rounded-lg text-xs leading-relaxed text-slate-300 font-sans whitespace-pre-wrap">
                          {contact.message}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-purple-950 text-[10px] font-mono text-slate-500">
                          <span>Submitted: {new Date(contact.createdAt).toLocaleString()}</span>
                          
                          <div className="flex gap-2">
                            {contact.status !== 'Read' && (
                              <button
                                onClick={() => handleUpdateContactStatus(contact.id, 'Read')}
                                className="hover:text-amber-400 font-semibold"
                              >
                                Mark Read
                              </button>
                            )}
                            {contact.status !== 'Replied' && (
                              <button
                                onClick={() => handleUpdateContactStatus(contact.id, 'Replied')}
                                className="hover:text-emerald-400 font-semibold"
                              >
                                Mark Replied
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: HOME banner section */}
            {activeAdminTab === 'Home' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase font-sans">Home Page Banner CMS</h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Customize greetings, secondary headlines and the typing phrases loop.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-purple-300 block uppercase">Main Hero Title</label>
                    <input
                      type="text"
                      value={draftConfig.home.heroTitle}
                      onChange={(e) => updateDraft('home', 'heroTitle', e.target.value)}
                      className="w-full px-4 py-2 border border-purple-500/10 bg-purple-950/20 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-purple-300 block uppercase">Sub Title Description</label>
                    <input
                      type="text"
                      value={draftConfig.home.heroSubtitle}
                      onChange={(e) => updateDraft('home', 'heroSubtitle', e.target.value)}
                      className="w-full px-4 py-2 border border-purple-500/10 bg-purple-950/20 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <SmartImageInput
                    label="Main Hero Background Image URL"
                    placeholder="e.g., https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80"
                    value={draftConfig.home.heroImageUrl || ''}
                    onChange={(val) => updateDraft('home', 'heroImageUrl', val)}
                  />

                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-mono text-purple-300 block uppercase">Welcome Banner Heading</label>
                    <input
                      type="text"
                      value={draftConfig.home.welcomeHeading}
                      onChange={(e) => updateDraft('home', 'welcomeHeading', e.target.value)}
                      className="w-full px-4 py-2 border border-purple-500/10 bg-purple-950/20 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-mono text-purple-300 block uppercase">Welcome Description Body</label>
                    <textarea
                      value={draftConfig.home.welcomeMessage}
                      onChange={(e) => updateDraft('home', 'welcomeMessage', e.target.value)}
                      rows={3}
                      className="w-full p-4 border border-purple-500/10 bg-purple-950/20 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Typing Phrases Manager */}
                  <div className="border border-purple-500/10 rounded-xl p-4 bg-purple-950/5 space-y-3 font-sans">
                    <span className="text-xs font-mono text-purple-300 block uppercase font-bold">Typed Phrases Loop</span>
                    
                    <div className="space-y-2">
                      {draftConfig.home.typingPhrases?.map((phrase: string, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={phrase}
                            onChange={(e) => {
                              const newArr = [...draftConfig.home.typingPhrases];
                              newArr[idx] = e.target.value;
                              updateDraft('home', 'typingPhrases', newArr);
                            }}
                            className="flex-grow px-3 py-1.5 rounded bg-[#0b0515] border border-purple-500/10 text-xs focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              const newArr = draftConfig.home.typingPhrases.filter((_: string, k: number) => k !== idx);
                              updateDraft('home', 'typingPhrases', newArr);
                            }}
                            className="p-1 px-2 hover:bg-red-950/40 border border-red-500/10 text-red-400 rounded text-xs cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newPhrase}
                        onChange={(e) => setNewPhrase(e.target.value)}
                        placeholder="Add new phrase to typewriter..."
                        className="flex-grow px-3 py-1.5 rounded bg-[#0b0515] border border-purple-500/10 text-xs"
                      />
                      <button
                        onClick={() => {
                          if (!newPhrase.trim()) return;
                          updateDraft('home', 'typingPhrases', [...draftConfig.home.typingPhrases, newPhrase.trim()]);
                          setNewPhrase('');
                        }}
                        className="px-3 rounded bg-purple-600 hover:bg-purple-500 text-xs text-white cursor-pointer font-bold"
                      >
                        Add Loop
                      </button>
                    </div>
                  </div>

                  {/* QUICK ACTIONS FOR HOMEPAGE HIGHLIGHTS */}
                  <div className="border border-purple-500/15 rounded-xl p-5 bg-gradient-to-r from-purple-950/25 to-fuchsia-950/15 space-y-4 font-sans shadow-lg shadow-purple-950/50">
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 uppercase">⚡ Live Homepage Highlights Editing</span>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">The sections below are actively displayed on your live website homepage. Use these direct edit buttons to configure or add new items instantly.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Edit Latest Broadcasts */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAdminTab('News');
                          showToast('Navigating to News Feed Articles... Click "Create news" to add new announcements.', 'info');
                        }}
                        className="px-4 py-3 bg-[#0c0519] hover:bg-[#150a2b] border border-purple-500/20 hover:border-purple-500/40 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-white block">📡 Edit Latest Broadcasts</span>
                          <span className="text-[10px] text-purple-300/70 block group-hover:text-purple-300">Manage news feed announcements &rarr;</span>
                        </div>
                      </button>

                      {/* Edit Featured Albums */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAdminTab('Music');
                          setMusicSubTab('albums');
                          showToast('Navigating to Discographies & Featured Albums... Click "Add Album" to publish new tracks.', 'info');
                        }}
                        className="px-4 py-3 bg-[#0c0519] hover:bg-[#150a2b] border border-purple-500/20 hover:border-purple-500/40 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-white block">💿 Edit Featured Albums</span>
                          <span className="text-[10px] text-purple-300/70 block group-hover:text-purple-300">Add & modify discography albums &rarr;</span>
                        </div>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB CONTENT: TOUR COUNTDOWN */}
            {activeAdminTab === 'Countdown' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase font-sans">ARIRANG TOUR COUNTDOWN CMS</h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Edit real-time tournament details, tour stadium locations, dates and links.</p>
                </div>

                <div className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/5 space-y-4 font-sans">
                  <span className="text-xs font-mono font-bold text-purple-300 uppercase block">🗺️ Countdown Core Settings</span>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs text-purple-300 font-mono block">Countdown Title Header</label>
                    <input
                      type="text"
                      value={draftConfig.countdown?.title || ''}
                      onChange={(e) => updateDraft('countdown', 'title', e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#0b0515] border border-purple-500/10 text-xs rounded text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-purple-300 font-mono block">Countdown Subtitle / Description</label>
                    <textarea
                      value={draftConfig.countdown?.subtitle || ''}
                      onChange={(e) => updateDraft('countdown', 'subtitle', e.target.value)}
                      rows={2}
                      className="w-full p-3 bg-[#0b0515] border border-purple-500/10 text-xs rounded text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-purple-300 font-mono block">Main Ticket Button Text</label>
                      <input
                        type="text"
                        value={draftConfig.countdown?.buttonText || ''}
                        onChange={(e) => updateDraft('countdown', 'buttonText', e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#0b0515] border border-purple-500/10 text-xs rounded text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-purple-300 font-mono block">Main Ticket Button Link</label>
                      <input
                        type="text"
                        value={draftConfig.countdown?.buttonLink || ''}
                        onChange={(e) => updateDraft('countdown', 'buttonLink', e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#0b0515] border border-purple-500/10 text-xs rounded text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 font-sans">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-purple-300 uppercase">🎪 CONCERT TOUR EVENTS ({draftConfig.countdown?.events?.length || 0})</span>
                    <button
                      onClick={() => {
                        const newEvent = {
                          id: 'c-' + Date.now(),
                          region: 'EUROPE',
                          city: 'Madrid',
                          country: 'Spain',
                          venue: 'Riyadh Air Metropolitano',
                          dateStr: 'June 26, 2026',
                          targetDate: '2026-06-26T19:30:00',
                          imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'
                        };
                        const events = [...(draftConfig.countdown?.events || []), newEvent];
                        updateDraft('countdown', 'events', events);
                        showToast('New Concert Event template added at bottom! 💜', 'success');
                      }}
                      className="px-3.5 py-1 bg-purple-600 hover:bg-purple-550 text-[10px] font-bold text-white rounded cursor-pointer"
                    >
                      + Add New Concert
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                    {draftConfig.countdown?.events?.map((evt: any, idx: number) => (
                      <div key={evt.id || idx} className="p-4 border border-purple-500/10 bg-purple-950/10 rounded-xl space-y-3">
                        <div className="flex justify-between items-center border-b border-purple-500/5 pb-2">
                          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">🎫 Concert #{idx + 1}</span>
                          <button
                            onClick={async () => {
                              if (!window.confirm('Are you sure you want to permanently delete this concert?')) return;
                              const events = draftConfig.countdown.events.filter((_: any, evIdx: number) => evIdx !== idx);
                              const updated = {
                                ...draftConfig,
                                countdown: {
                                  ...draftConfig.countdown,
                                  events
                                }
                              };
                              setDraftConfig(updated);
                              await saveAndPublishConfig(updated);
                            }}
                            className="text-red-400 hover:text-red-300 text-[10px] uppercase font-mono cursor-pointer"
                          >
                            delete
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="space-y-1">
                            <label className="text-[10px] text-purple-300 font-mono">Region</label>
                            <select
                              value={evt.region}
                              onChange={(e) => {
                                const events = [...draftConfig.countdown.events];
                                events[idx] = { ...events[idx], region: e.target.value };
                                updateDraft('countdown', 'events', events);
                              }}
                              className="w-full px-2 py-1 bg-[#0b0515] border border-purple-500/10 rounded cursor-pointer text-xs text-stone-200"
                            >
                              <option value="EUROPE">EUROPE</option>
                              <option value="NORTH AMERICA">NORTH AMERICA</option>
                              <option value="ASIA & AUSTRALIA">ASIA & AUSTRALIA</option>
                              <option value="SOUTH AMERICA">SOUTH AMERICA</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-purple-300 font-mono">City / State</label>
                            <input
                              type="text"
                              value={evt.city}
                              onChange={(e) => {
                                const events = [...draftConfig.countdown.events];
                                events[idx] = { ...events[idx], city: e.target.value };
                                updateDraft('countdown', 'events', events);
                              }}
                              className="w-full px-2 py-1 bg-[#0b0515] border border-purple-500/10 rounded text-xs text-white animate-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-purple-300 font-mono">Country</label>
                            <input
                              type="text"
                              value={evt.country}
                              onChange={(e) => {
                                const events = [...draftConfig.countdown.events];
                                events[idx] = { ...events[idx], country: e.target.value };
                                updateDraft('countdown', 'events', events);
                              }}
                              className="w-full px-2 py-1 bg-[#0b0515] border border-purple-500/10 rounded text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-purple-300 font-mono">Stadium Venue</label>
                            <input
                              type="text"
                              value={evt.venue || ''}
                              onChange={(e) => {
                                const events = [...draftConfig.countdown.events];
                                events[idx] = { ...events[idx], venue: e.target.value };
                                updateDraft('countdown', 'events', events);
                              }}
                              className="w-full px-2 py-1 bg-[#0b0514] border border-purple-500/10 rounded text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-purple-300 font-mono">Concert Dates Label</label>
                            <input
                              type="text"
                              value={evt.dateStr}
                              onChange={(e) => {
                                const events = [...draftConfig.countdown.events];
                                events[idx] = { ...events[idx], dateStr: e.target.value };
                                updateDraft('countdown', 'events', events);
                              }}
                              className="w-full px-2 py-1 bg-[#0b0515] border border-purple-500/10 rounded text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-purple-300 font-mono">ISO Target Datetime</label>
                            <input
                              type="text"
                              value={evt.targetDate || ''}
                              onChange={(e) => {
                                const events = [...draftConfig.countdown.events];
                                events[idx] = { ...events[idx], targetDate: e.target.value };
                                updateDraft('countdown', 'events', events);
                              }}
                              className="w-full px-2 py-1 bg-[#0b0515] border border-purple-500/10 rounded text-xs text-white"
                              placeholder="YYYY-MM-DDTHH:MM:SS"
                            />
                          </div>
                        </div>

                        <SmartImageInput
                          label="Concert Banner Image URL"
                          value={evt.imageUrl || ''}
                          onChange={(val) => {
                            const events = [...draftConfig.countdown.events];
                            events[idx] = { ...events[idx], imageUrl: val };
                            updateDraft('countdown', 'events', events);
                          }}
                          placeholder="Concert cover image URL / Media picker"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 3D SHOWCASE */}
            {activeAdminTab === 'Showcase' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase font-sans">3D Curved Showcase & Trending Carousel</h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Edit 3D curved gallery files, titles and side-card trending data indexes.</p>
                </div>

                {/* 3D Showcase Grid */}
                <div className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/5 space-y-3 font-sans">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-bold text-purple-300 uppercase">🌌 3D Curved Gallery Cards ({draftConfig.showcase?.length || 0})</span>
                    <button
                      onClick={() => {
                        const newItem = {
                          id: 's-' + Date.now(),
                          title: 'New Showcase Card',
                          category: 'Gallery',
                          url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80'
                        };
                        const showcaseArr = [...(draftConfig.showcase || []), newItem];
                        updateDraft('showcase', null, showcaseArr); 
                        showToast('New template tile added to 3D gallery! 💜', 'success');
                      }}
                      className="px-3 py-1 bg-purple-600 text-[10px] font-bold text-white rounded font-sans cursor-pointer"
                    >
                      + Add 3D Tile
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                    {draftConfig.showcase?.map((item: any, idx: number) => (
                      <div key={item.id || idx} className="p-3 border border-purple-500/10 bg-purple-950/10 rounded-lg space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="space-y-1 col-span-2">
                            <label className="text-[10px] font-mono text-purple-300">Tile Title</label>
                            <input 
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const arr = [...draftConfig.showcase];
                                arr[idx] = { ...arr[idx], title: e.target.value };
                                updateDraft('showcase', null, arr);
                              }}
                              className="w-full px-2.5 py-1 bg-[#0a0516] border border-purple-500/15 rounded text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-purple-300">Category Tag</label>
                            <select
                              value={item.category}
                              onChange={(e) => {
                                const arr = [...draftConfig.showcase];
                                arr[idx] = { ...arr[idx], category: e.target.value };
                                updateDraft('showcase', null, arr);
                              }}
                              className="w-full px-2 py-1 bg-[#0a0516] border border-purple-500/10 rounded cursor-pointer text-xs text-white"
                            >
                              <option value="Gallery">Gallery</option>
                              <option value="YouTube">YouTube</option>
                              <option value="Music">Music</option>
                              <option value="Fanart">Fanart</option>
                            </select>
                          </div>
                          <div className="flex items-end justify-end">
                            <button
                              onClick={() => {
                                const arr = draftConfig.showcase.filter((_: any, sIdx: number) => sIdx !== idx);
                                updateDraft('showcase', null, arr);
                                showToast('3D tile removed.', 'info');
                              }}
                              className="px-3 py-1 bg-red-950/20 text-[10px] text-red-400 hover:text-white rounded border border-red-500/15 cursor-pointer uppercase font-sans font-bold"
                            >
                              Remove Tile
                            </button>
                          </div>
                        </div>

                        <SmartImageInput 
                          label="Curved Tile Image Source"
                          value={item.url || ''}
                          onChange={(val) => {
                            const arr = [...draftConfig.showcase];
                            arr[idx] = { ...arr[idx], url: val };
                            updateDraft('showcase', null, arr);
                          }}
                          placeholder="Enter URL or Select from library"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trending Carousel Grid */}
                <div className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/5 space-y-3 font-sans">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-bold text-purple-300 uppercase">🔥 Trending Showcase Carousel ({draftConfig.trending?.length || 0})</span>
                    <button
                      onClick={() => {
                        const newItem = {
                          id: 't-' + Date.now(),
                          rank: '#' + ((draftConfig.trending?.length || 0) + 1),
                          title: 'New Trending Music Title',
                          creator: 'BTS Team',
                          views: '10M',
                          likes: '500K',
                          tag: 'Remix',
                          category: 'YouTube',
                          thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80'
                        };
                        const trendingArr = [...(draftConfig.trending || []), newItem];
                        updateDraft('trending', null, trendingArr);
                        showToast('New Trending card template added! 💜', 'success');
                      }}
                      className="px-3 py-1 bg-purple-600 text-[10px] font-bold text-white rounded font-sans cursor-pointer"
                    >
                      + Add Card
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {draftConfig.trending?.map((item: any, idx: number) => (
                      <div key={item.id || idx} className="p-3 border border-purple-500/10 bg-purple-950/10 rounded-lg space-y-3">
                        <div className="flex justify-between items-center border-b border-purple-500/10 pb-1.5">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">Card #{idx + 1} ({item.rank || '#'})</span>
                            <span className={`text-[9px] px-1 py-0.2 rounded ${item.published !== false ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' : 'bg-amber-950/40 text-amber-500 border border-amber-500/20'}`}>
                              {item.published !== false ? 'Published' : 'Unpublished'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            {/* Reordering */}
                            <button
                              onClick={() => {
                                if (idx > 0) {
                                  const arr = [...(draftConfig.trending || [])];
                                  const temp = arr[idx];
                                  arr[idx] = arr[idx - 1];
                                  arr[idx - 1] = temp;
                                  updateDraft('trending', null, arr);
                                }
                              }}
                              disabled={idx === 0}
                              className="px-1.5 py-0.5 bg-purple-900/40 text-[9px] hover:text-white rounded disabled:opacity-20 cursor-pointer"
                              title="Move Left/Up"
                            >
                              Up
                            </button>
                            <button
                              onClick={() => {
                                const arr = [...(draftConfig.trending || [])];
                                if (idx < arr.length - 1) {
                                  const temp = arr[idx];
                                  arr[idx] = arr[idx + 1];
                                  arr[idx + 1] = temp;
                                  updateDraft('trending', null, arr);
                                }
                              }}
                              disabled={idx === (draftConfig.trending?.length || 0) - 1}
                              className="px-1.5 py-0.5 bg-purple-900/40 text-[9px] hover:text-white rounded disabled:opacity-20 cursor-pointer"
                              title="Move Right/Down"
                            >
                              Down
                            </button>

                            <button
                              onClick={() => {
                                const arr = draftConfig.trending.filter((_: any, tIdx: number) => tIdx !== idx);
                                updateDraft('trending', null, arr);
                                showToast('Trending slot removed.', 'info');
                              }}
                              className="px-2 py-0.5 bg-red-950/20 text-[9px] text-red-400 hover:text-white rounded border border-red-500/15 cursor-pointer uppercase font-semibold"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                          <div className="space-y-1 col-span-2">
                            <label className="text-[10px] font-mono text-purple-300">Card Title</label>
                            <input 
                              type="text"
                              value={item.title || ''}
                              onChange={(e) => {
                                const arr = [...draftConfig.trending];
                                arr[idx] = { ...arr[idx], title: e.target.value };
                                updateDraft('trending', null, arr);
                              }}
                              className="w-full px-2 py-1 bg-[#0a0516] border border-purple-500/15 rounded text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-purple-300">Card Subtitle / Creator</label>
                            <input 
                              type="text"
                              value={item.subtitle || item.creator || ''}
                              onChange={(e) => {
                                const arr = [...draftConfig.trending];
                                arr[idx] = { ...arr[idx], subtitle: e.target.value, creator: e.target.value };
                                updateDraft('trending', null, arr);
                              }}
                              className="w-full px-2 py-1 bg-[#0a0516] border border-purple-500/15 rounded text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-purple-300">Category Label / Channel</label>
                            <input 
                              type="text"
                              value={item.categoryLabel || item.category || ''}
                              onChange={(e) => {
                                const arr = [...draftConfig.trending];
                                arr[idx] = { ...arr[idx], categoryLabel: e.target.value, category: e.target.value };
                                updateDraft('trending', null, arr);
                              }}
                              className="w-full px-2 py-1 bg-[#0a0516] border border-purple-500/15 rounded text-white"
                              placeholder="e.g. YouTube, Music, Concert"
                            />
                          </div>

                          <div className="space-y-1 col-span-2">
                            <label className="text-[10px] font-mono text-purple-300">Description</label>
                            <textarea 
                              rows={2}
                              value={item.description || ''}
                              onChange={(e) => {
                                const arr = [...draftConfig.trending];
                                arr[idx] = { ...arr[idx], description: e.target.value };
                                updateDraft('trending', null, arr);
                              }}
                              className="w-full px-2 py-1 bg-[#0a0516] border border-purple-500/15 rounded text-white text-xs leading-relaxed resize-none"
                              placeholder="Optional short subtitle summary of the creative picks."
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-purple-300">Watch Button Text</label>
                            <input 
                              type="text"
                              value={item.watchButtonText || ''}
                              onChange={(e) => {
                                const arr = [...draftConfig.trending];
                                arr[idx] = { ...arr[idx], watchButtonText: e.target.value };
                                updateDraft('trending', null, arr);
                              }}
                              className="w-full px-2 py-1 bg-[#0a0516] border border-purple-500/15 rounded text-white"
                              placeholder="e.g. Watch RM / Play"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-purple-300">Watch Button Link (Tab ID)</label>
                            <select
                              value={item.watchButtonLink || item.category || 'YouTube'}
                              onChange={(e) => {
                                const arr = [...draftConfig.trending];
                                arr[idx] = { ...arr[idx], watchButtonLink: e.target.value, category: e.target.value };
                                updateDraft('trending', null, arr);
                              }}
                              className="w-full px-2 py-1 bg-[#0a0516] border border-purple-500/10 rounded cursor-pointer text-white"
                            >
                              <option value="YouTube">YouTube</option>
                              <option value="Music">Music</option>
                              <option value="Gallery">Gallery</option>
                              <option value="Timeline">Timeline</option>
                              <option value="News">News Feed</option>
                            </select>
                          </div>

                          <div className="space-y-1 col-span-2">
                            <label className="text-[10px] font-mono text-purple-300">External URL (Overrides internal navigation)</label>
                            <input 
                              type="text"
                              value={item.externalUrl || ''}
                              onChange={(e) => {
                                const arr = [...draftConfig.trending];
                                arr[idx] = { ...arr[idx], externalUrl: e.target.value };
                                updateDraft('trending', null, arr);
                              }}
                              className="w-full px-2 py-1 bg-[#0a0516] border border-purple-500/15 rounded text-white"
                              placeholder="https://... to link directly outside website (OPTIONAL)"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-purple-300">Rank Indicator</label>
                            <input 
                              type="text"
                              value={item.rank}
                              onChange={(e) => {
                                const arr = [...draftConfig.trending];
                                arr[idx] = { ...arr[idx], rank: e.target.value };
                                updateDraft('trending', null, arr);
                              }}
                              className="w-full px-2 py-1 bg-[#0a0516] border border-purple-500/15 rounded text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-purple-300">Card Promotion Tag</label>
                            <input 
                              type="text"
                              value={item.tag}
                              onChange={(e) => {
                                const arr = [...draftConfig.trending];
                                arr[idx] = { ...arr[idx], tag: e.target.value };
                                updateDraft('trending', null, arr);
                              }}
                              className="w-full px-2 py-1 bg-[#0a0516] border border-purple-500/15 rounded text-white"
                            />
                          </div>

                          <div className="flex items-center gap-2 pt-2 select-none">
                            <input
                              type="checkbox"
                              id={`showBtn-${idx}`}
                              checked={item.showButton !== false}
                              onChange={(e) => {
                                const arr = [...draftConfig.trending];
                                arr[idx] = { ...arr[idx], showButton: e.target.checked };
                                updateDraft('trending', null, arr);
                              }}
                              className="cursor-pointer"
                            />
                            <label htmlFor={`showBtn-${idx}`} className="text-[10px] font-mono text-purple-300 cursor-pointer">
                              Show Watch Button
                            </label>
                          </div>

                          <div className="flex items-center gap-2 pt-2 select-none">
                            <input
                              type="checkbox"
                              id={`pub-${idx}`}
                              checked={item.published !== false}
                              onChange={(e) => {
                                const arr = [...draftConfig.trending];
                                arr[idx] = { ...arr[idx], published: e.target.checked };
                                updateDraft('trending', null, arr);
                              }}
                              className="cursor-pointer"
                            />
                            <label htmlFor={`pub-${idx}`} className="text-[10px] font-mono text-purple-300 cursor-pointer">
                              Publish on Home Page
                            </label>
                          </div>
                        </div>

                        <SmartImageInput 
                          label="Trending Card Image / Thumbnail"
                          value={item.thumbnail || ''}
                          onChange={(val) => {
                            const arr = [...draftConfig.trending];
                            arr[idx] = { ...arr[idx], thumbnail: val };
                            updateDraft('trending', null, arr);
                          }}
                          placeholder="Enter URL or Select from library"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: WEVERSE POSTS CMS */}
            {activeAdminTab === 'WeversePosts' && (() => {
              const defaultWeversePosts = [
                {
                  id: 'rm',
                  name: 'RM',
                  profileImg: 'https://i.pinimg.com/736x/54/2c/1f/542c1f883a3bd13ec106c26648607235.jpg',
                  postText: "  ",
                  postImg: 'https://i.pinimg.com/736x/54/2c/1f/542c1f883a3bd13ec106c26648607235.jpg',
                  weverseLink: 'https://weverse.io/bts/artist/rm',
                  emoji: '🐨'
                },
                {
                  id: 'jin',
                  name: 'Jin',
                  profileImg: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
                  postText: "ARMY, did you eat delicious food? Worldwide handsome is here to bless your feed! 🍜 Get ready for my special single.",
                  postImg: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
                  weverseLink: 'https://weverse.io/bts/artist/jin',
                  emoji: '🐹'
                },
                {
                  id: 'suga',
                  name: 'SUGA',
                  profileImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
                  postText: "Working hard in the studio today. D-DAY tour memories are still fresh in my heart. Rock on! 🎹 Let's create together.",
                  postImg: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
                  weverseLink: 'https://weverse.io/bts/artist/suga',
                  emoji: '🐱'
                },
                {
                  id: 'jhope',
                  name: 'j-hope',
                  profileImg: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=150&q=80',
                  postText: "Hope right here! ARMY, are you smiling today? Always remember I am your hope, you are my hope! ☀️ Live dance stream soon!",
                  postImg: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=600&q=80',
                  weverseLink: 'https://weverse.io/bts/artist/j-hope',
                  emoji: '🐿️'
                },
                {
                  id: 'jimin',
                  name: 'Jimin',
                  profileImg: 'https://i.pinimg.com/736x/95/ae/24/95ae248bf13dcb912809e3a34e05210f.jpg',
                  postText: "Your warm thoughts are always with me. I hope you have a beautiful night, my angels. Always stay healthy and happy! 🌸",
                  postImg: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
                  weverseLink: 'https://weverse.io/bts/artist/jimin',
                  emoji: '🐥'
                },
                {
                  id: 'v',
                  name: 'V',
                  profileImg: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
                  postText: "Yeontan says hello. Listening to classic jazz on a rainy day. Take care of your health, ARMY! 🎷 Enjoying the quiet times.",
                  postImg: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=600&q=80',
                  weverseLink: 'https://weverse.io/bts/artist/v',
                  emoji: '🐯'
                },
                {
                  id: 'jungkook',
                  name: 'Jung Kook',
                  profileImg: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80',
                  postText: "Late night singing live for you guys. ARMY, what songs are you listening to right now? Missing you all so much. 🎤",
                  postImg: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80',
                  weverseLink: 'https://weverse.io/bts/artist/jungkook',
                  emoji: '🐰'
                },
                {
                  id: 'bts',
                  name: 'BTS Group',
                  profileImg: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=150&q=80',
                  postText: "We had only seven. But we have you all now. Thank you for walking this bulletproof path with us! Borahae! ⟭⟬⁷",
                  postImg: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?auto=format&fit=crop&w=600&q=80',
                  weverseLink: 'https://weverse.io/bts/feed',
                  emoji: '💜'
                }
              ];

              const currentPosts = (draftConfig.weversePosts && Array.isArray(draftConfig.weversePosts) && draftConfig.weversePosts.length > 0)
                ? draftConfig.weversePosts
                : defaultWeversePosts;

              return (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-[#130924] p-4 rounded-xl border border-purple-500/10">
                    <div>
                      <h3 className="text-lg font-bold text-white uppercase font-sans font-black tracking-wide">Weverse Posts Management Portal</h3>
                      <p className="text-xs text-purple-300/70 mt-1">
                        Edit and publish live interactive Weverse post card details for the 7 members + BTS Group.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        updateDraft('weversePosts', null, defaultWeversePosts);
                        showToast('Weverse posts reset to premium defaults! 💜', 'success');
                      }}
                      className="px-4 py-2 bg-purple-950/45 hover:bg-purple-900 border border-purple-500/25 text-xs font-bold text-white transition-colors rounded uppercase tracking-wider font-mono cursor-pointer"
                    >
                      Reset to Defaults
                    </button>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {currentPosts.map((post: any, idx: number) => (
                      <div key={post.id || idx} className="p-5 border border-purple-500/10 bg-[#120a1c]/45 backdrop-blur-md rounded-xl space-y-4 relative flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center border-b border-purple-500/10 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                              {post.profileImg ? (
                                <img src={post.profileImg} alt={post.name} className="w-8 h-8 rounded-full object-cover border border-purple-500/30" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center text-xs text-white">
                                  {post.emoji}
                                </div>
                              )}
                              <span className="text-xs font-mono font-black text-white uppercase">
                                {post.name || 'Untitled'} ({post.id})
                              </span>
                            </div>
                            <span className="text-[10px] font-mono bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/10 text-purple-300 uppercase font-bold">
                              Slot {idx + 1}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-purple-300 uppercase font-bold block">Member/Title Name</label>
                              <input
                                type="text"
                                value={post.name || ''}
                                onChange={(e) => {
                                  const arr = [...currentPosts];
                                  arr[idx] = { ...arr[idx], name: e.target.value };
                                  updateDraft('weversePosts', null, arr);
                                }}
                                className="w-full px-2.5 py-1.5 bg-[#0a0516] border border-purple-500/15 rounded text-white font-semibold"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-purple-300 uppercase font-bold block">Emoji/Status Icon</label>
                              <input
                                type="text"
                                value={post.emoji || ''}
                                onChange={(e) => {
                                  const arr = [...currentPosts];
                                  arr[idx] = { ...arr[idx], emoji: e.target.value };
                                  updateDraft('weversePosts', null, arr);
                                }}
                                className="w-full px-2.5 py-1.5 bg-[#0a0516] border border-purple-500/15 rounded text-white"
                                placeholder="🐨"
                              />
                            </div>

                            <div className="md:col-span-2 space-y-1">
                              <SmartImageInput 
                                label="Profile Image URL"
                                value={post.profileImg || ''}
                                onChange={(val) => {
                                  const arr = [...currentPosts];
                                  arr[idx] = { ...arr[idx], profileImg: val };
                                  updateDraft('weversePosts', null, arr);
                                }}
                                placeholder="Profile portrait photo URL"
                              />
                            </div>

                            <div className="md:col-span-2 space-y-1">
                              <label className="text-[10px] font-mono text-purple-300 uppercase font-bold block">Post Text Content</label>
                              <textarea
                                value={post.postText || ''}
                                onChange={(e) => {
                                  const arr = [...currentPosts];
                                  arr[idx] = { ...arr[idx], postText: e.target.value };
                                  updateDraft('weversePosts', null, arr);
                                }}
                                rows={3}
                                className="w-full px-2.5 py-1.5 bg-[#0a0516] border border-purple-500/15 rounded text-white text-xs leading-relaxed focus:outline-none focus:border-purple-500"
                                placeholder="Enter Weverse post description..."
                              />
                            </div>

                            <div className="md:col-span-2 space-y-1">
                              <SmartImageInput 
                                label="Attachment Image URL"
                                value={post.postImg || ''}
                                onChange={(val) => {
                                  const arr = [...currentPosts];
                                  arr[idx] = { ...arr[idx], postImg: val };
                                  updateDraft('weversePosts', null, arr);
                                }}
                                placeholder="Weverse attachment post image"
                              />
                            </div>

                            <div className="md:col-span-2 space-y-1">
                              <label className="text-[10px] font-mono text-purple-300 uppercase font-bold block">Weverse Link</label>
                              <input
                                type="text"
                                value={post.weverseLink || ''}
                                onChange={(e) => {
                                  const arr = [...currentPosts];
                                  arr[idx] = { ...arr[idx], weverseLink: e.target.value };
                                  updateDraft('weversePosts', null, arr);
                                }}
                                className="w-full px-2.5 py-1.5 bg-[#0a0516] border border-purple-500/15 rounded text-white font-mono text-xs"
                                placeholder="https://weverse.io/bts/artist/..."
                              />
                            </div>

                            <div className="md:col-span-2 space-y-1">
                              <label className="text-[10px] font-mono text-purple-300 uppercase font-bold block">Post Date/Time</label>
                              <input
                                type="text"
                                value={post.customDate || ''}
                                onChange={(e) => {
                                  const arr = [...currentPosts];
                                  arr[idx] = { ...arr[idx], customDate: e.target.value };
                                  updateDraft('weversePosts', null, arr);
                                }}
                                className="w-full px-2.5 py-1.5 bg-[#0a0516] border border-purple-500/15 rounded text-white text-xs font-semibold"
                                placeholder="e.g. Jul 05, 2026 or 10 mins ago"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* TAB CONTENT: CAREER TIMELINE */}
            {activeAdminTab === 'Timeline' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase font-sans">historical career milestones</h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Manage and trace critical BTS journey milestones since 2013 debut.</p>
                </div>

                <div className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/5 space-y-3 font-sans">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-bold text-purple-300 uppercase">🕰️ Chronological Milestones ({draftConfig.timeline?.length || 0})</span>
                    <button
                      onClick={() => {
                        const newEvent = {
                          year: '2026',
                          date: 'June 13, 2026',
                          title: 'BTS 13th Anniversary festa',
                          description: 'The seven bulletproof boys return to celebrate with ARMY worldwide.',
                          category: 'Comebacks'
                        };
                        const arr = [...(draftConfig.timeline || []), newEvent];
                        updateDraft('timeline', null, arr);
                        showToast('New timeline milestone entry template created! 💜', 'success');
                      }}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-550 text-[10px] font-bold text-white rounded cursor-pointer"
                    >
                      + Add Milestone
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {draftConfig.timeline?.map((evt: any, idx: number) => (
                      <div key={idx} className="p-4 border border-purple-500/10 bg-purple-950/10 rounded-xl space-y-3 font-sans text-xs">
                        <div className="flex justify-between items-center border-b border-purple-500/5 pb-1.5">
                          <span className="text-xs font-bold text-white font-mono uppercase">📌 Milestone #{idx + 1} ({evt.year})</span>
                          <button
                            onClick={() => deleteDraftArrayItem('timeline', idx)}
                            className="text-red-400 hover:text-red-300 font-mono uppercase text-[10px] cursor-pointer"
                          >
                            delete
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-purple-300 font-mono">Occurring Year</label>
                            <input
                              type="text"
                              value={evt.year}
                              onChange={(e) => {
                                const arr = [...draftConfig.timeline];
                                arr[idx] = { ...arr[idx], year: e.target.value };
                                updateDraft('timeline', null, arr);
                              }}
                              className="w-full px-2.5 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-200"
                              placeholder="e.g. 2013"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-purple-300 font-mono">Full Milestone Date</label>
                            <input
                              type="text"
                              value={evt.date}
                              onChange={(e) => {
                                const arr = [...draftConfig.timeline];
                                arr[idx] = { ...arr[idx], date: e.target.value };
                                updateDraft('timeline', null, arr);
                              }}
                              className="w-full px-2.5 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-200"
                              placeholder="e.g. June 13, 2013"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-purple-300 font-mono">Classification Category</label>
                            <select
                              value={evt.category}
                              onChange={(e) => {
                                const arr = [...draftConfig.timeline];
                                arr[idx] = { ...arr[idx], category: e.target.value };
                                updateDraft('timeline', null, arr);
                              }}
                              className="w-full px-2.5 py-1.5 bg-[#0b0515] border border-purple-500/12 text-xs text-purple-300 rounded cursor-pointer"
                            >
                              <option value="Debut">Debut</option>
                              <option value="Albums">Albums</option>
                              <option value="Awards">Awards</option>
                              <option value="Tours">Tours</option>
                              <option value="Military">Military</option>
                              <option value="Solo Era">Solo Era</option>
                              <option value="Comebacks">Comebacks</option>
                            </select>
                          </div>

                          <div className="space-y-1 md:col-span-3">
                            <label className="text-[10px] text-purple-300 font-mono">Milestone Core Headline</label>
                            <input
                              type="text"
                              value={evt.title}
                              onChange={(e) => {
                                const arr = [...draftConfig.timeline];
                                arr[idx] = { ...arr[idx], title: e.target.value };
                                updateDraft('timeline', null, arr);
                              }}
                              className="w-full px-2.5 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-200 text-xs"
                              placeholder="e.g. Debut Showcase on M! Countdown"
                            />
                          </div>

                          <div className="space-y-1 md:col-span-3">
                            <label className="text-[10px] text-purple-300 font-mono">Visual Narrative Account</label>
                            <textarea
                              value={evt.description}
                              onChange={(e) => {
                                const arr = [...draftConfig.timeline];
                                arr[idx] = { ...arr[idx], description: e.target.value };
                                updateDraft('timeline', null, arr);
                              }}
                              rows={2}
                              className="w-full p-2.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-200 text-xs"
                              placeholder="Describe historical context details"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: FAQs CMS */}
            {activeAdminTab === 'FAQ' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase font-sans">Frequently Asked Questions directory</h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Manage help accordions, system guidelines, support steps and rules.</p>
                </div>

                <div className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/5 space-y-3 font-sans">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-bold text-purple-300 uppercase font-sans font-bold">🙋 FAQ Q&A Records ({draftConfig.faqs?.length || 0})</span>
                    <button
                      onClick={() => {
                        const newFAQ = {
                          id: 'faq-' + Date.now(),
                          question: 'What is the purpose of Bangtan Gallery?',
                          answer: 'This portal is an independent tribute site managed by ARMYs around the world.',
                          category: 'General'
                        };
                        const arr = [...(draftConfig.faqs || []), newFAQ];
                        updateDraft('faqs', null, arr);
                        showToast('New FAQ accordion card template added! 💜', 'success');
                      }}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-550 text-[10px] font-bold text-white rounded cursor-pointer"
                    >
                      + Add FAQ Accordion
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {draftConfig.faqs?.map((item: any, idx: number) => (
                      <div key={item.id || idx} className="p-3 border border-purple-500/10 bg-purple-950/10 rounded-lg space-y-2 text-xs font-sans font-sans">
                        <div className="flex justify-between items-center border-b border-purple-500/5 pb-1">
                          <span className="text-xs font-bold text-purple-300 font-mono uppercase">💡 FAQ Slot #{idx + 1}</span>
                          <button
                            onClick={async () => {
                              if (!window.confirm('Are you sure you want to permanently delete this FAQ?')) return;
                              const arr = draftConfig.faqs.filter((_: any, fIdx: number) => fIdx !== idx);
                              const updated = {
                                ...draftConfig,
                                faqs: arr
                              };
                              setDraftConfig(updated);
                              await saveAndPublishConfig(updated);
                            }}
                            className="text-red-400 hover:text-red-300 font-mono uppercase text-[10px] cursor-pointer"
                          >
                            delete
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Question text</label>
                            <input
                              type="text"
                              value={item.question}
                              onChange={(e) => {
                                const arr = [...draftConfig.faqs];
                                arr[idx] = { ...arr[idx], question: e.target.value };
                                updateDraft('faqs', null, arr);
                              }}
                              className="w-full px-2.5 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-100 placeholder-purple-900/60"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Answer body</label>
                            <textarea
                              value={item.answer}
                              onChange={(e) => {
                                const arr = [...draftConfig.faqs];
                                arr[idx] = { ...arr[idx], answer: e.target.value };
                                updateDraft('faqs', null, arr);
                              }}
                              rows={2.5}
                              className="w-full p-2.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-100 leading-relaxed text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Tab Category</label>
                            <input
                              type="text"
                              value={item.category || 'General'}
                              onChange={(e) => {
                                const arr = [...draftConfig.faqs];
                                arr[idx] = { ...arr[idx], category: e.target.value };
                                updateDraft('faqs', null, arr);
                              }}
                              className="px-2.5 py-1 bg-[#0b0512] border border-purple-500/10 rounded text-[#c084fc] font-mono w-48 text-xs"
                              placeholder="General, Support, Festa"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 🗳️ VOTING CENTER CMS */}
            {activeAdminTab === 'VotingCenter' && (
              <div className="space-y-6 text-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase font-sans flex items-center gap-2">
                      🗳️ BTS Voting Desk & Suggestion Desk CMS
                    </h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">
                      Curate official voting campaigns and manage user suggestions with one-click live publishing.
                    </p>
                  </div>

                  {/* Sub tab navigation */}
                  <div className="inline-flex gap-1 p-0.5 bg-[#0b0515] border border-purple-500/10 rounded-lg shrink-0">
                    <button
                      type="button"
                      onClick={() => setVotingSubTab('events')}
                      className={`px-3 py-1.5 rounded-md font-medium font-sans cursor-pointer transition-all ${
                        votingSubTab === 'events'
                          ? 'bg-purple-600 text-white shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      🏆 Active Campaigns ({draftConfig.votingEvents?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVotingSubTab('proposals');
                        fetchProposalsList();
                      }}
                      className={`px-3 py-1.5 rounded-md font-medium font-sans cursor-pointer transition-all flex items-center gap-1.5 ${
                        votingSubTab === 'proposals'
                          ? 'bg-purple-600 text-white shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      📨 Suggestion Inbox
                      {proposals.filter(p => p.status === 'pending').length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Sub Tab: Campaign Manager */}
                {votingSubTab === 'events' && (
                  <div className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/5 space-y-4 font-sans">
                    <div className="flex justify-between items-center border-b border-purple-500/10 pb-3">
                      <span className="text-xs font-mono font-bold text-purple-300 uppercase block font-bold">🙋 Manage Live Voting Campaigns ({draftConfig.votingEvents?.length || 0})</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newCampaign = {
                            id: 'vote-event-' + Date.now(),
                            title: 'New Voting Campaign',
                            description: 'Support BTS by voting daily on official channels.',
                            platform: 'Official Platform',
                            coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
                            voteNowUrl: 'https://bts.ibighit.com',
                            startDate: new Date().toISOString().split('T')[0],
                            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            status: 'published',
                            isPinned: false,
                            isFeatured: false,
                            order: (draftConfig.votingEvents?.length || 0) + 1
                          };
                          const updated = [...(draftConfig.votingEvents || []), newCampaign];
                          updateDraft('votingEvents', null, updated);
                          showToast('Brand new campaign card created! Customise the parameters below. 🗳️', 'success');
                        }}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-550 text-[11px] font-extrabold text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/10 active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create New Campaign
                      </button>
                    </div>

                    {(!draftConfig.votingEvents || draftConfig.votingEvents.length === 0) ? (
                      <div className="text-center py-12 rounded-lg border border-dashed border-purple-500/20 bg-purple-950/5">
                        <Vote className="w-8 h-8 text-purple-500/30 mx-auto mb-2" />
                        <p className="text-gray-400">There are no voting campaign events in the list yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {draftConfig.votingEvents.map((item: any, idx: number) => {
                          const isPinned = item.isPinned;
                          const isFeatured = item.isFeatured;
                          const isPublished = item.status === 'published';

                          return (
                            <div key={item.id || idx} className="p-4 rounded-xl border border-purple-500/10 bg-[#0d071a]/50 flex flex-col xl:flex-row gap-5 items-stretch hover:border-purple-500/25 transition-all">
                              {/* Left Thumbnail Banner Preview */}
                              <div className="relative w-full xl:w-48 h-28 xl:h-auto rounded-lg overflow-hidden bg-black/40 border border-purple-500/10 shrink-0">
                                <img src={item.coverUrl} className="w-full h-full object-cover" alt="Banner Preview" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                                  {isPinned && <span className="px-1.5 py-0.5 rounded bg-purple-600 text-[8px] font-mono font-bold text-white uppercase text-center shadow">PINNED</span>}
                                  {isFeatured && <span className="px-1.5 py-0.5 rounded bg-amber-500 text-[8px] font-mono font-bold text-black uppercase text-center shadow">FEATURED</span>}
                                  {!isPublished && <span className="px-1.5 py-0.5 rounded bg-red-600 text-[8px] font-mono font-bold text-white uppercase text-center shadow">DRAFT</span>}
                                </div>
                                <div className="absolute bottom-2 left-2 right-2 text-[9px] font-mono text-purple-300 truncate font-semibold uppercase">
                                  {item.platform}
                                </div>
                              </div>

                              {/* Middle Editor parameters */}
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                <div className="space-y-1">
                                  <label className="text-[10px] text-gray-400 uppercase font-bold block font-mono">Campaign Title</label>
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => {
                                      const arr = [...draftConfig.votingEvents];
                                      arr[idx] = { ...arr[idx], title: e.target.value };
                                      updateDraft('votingEvents', null, arr);
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-[#0b0515]/80 border border-purple-500/10 rounded text-stone-100"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] text-gray-400 uppercase font-bold block font-mono">Redirect Vote Now Link</label>
                                  <input
                                    type="url"
                                    value={item.voteNowUrl}
                                    onChange={(e) => {
                                      const arr = [...draftConfig.votingEvents];
                                      arr[idx] = { ...arr[idx], voteNowUrl: e.target.value };
                                      updateDraft('votingEvents', null, arr);
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-[#0b0515]/80 border border-purple-500/10 rounded text-stone-100 placeholder-purple-900"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] text-gray-400 uppercase font-bold block font-mono">Platform Name</label>
                                  <input
                                    type="text"
                                    value={item.platform}
                                    onChange={(e) => {
                                      const arr = [...draftConfig.votingEvents];
                                      arr[idx] = { ...arr[idx], platform: e.target.value };
                                      updateDraft('votingEvents', null, arr);
                                    }}
                                    placeholder="e.g. Mubeat, Idol Champ, FanPlus"
                                    className="w-full px-2.5 py-1.5 bg-[#0b0515]/80 border border-purple-500/10 rounded text-stone-100"
                                  />
                                </div>

                                <div className="space-y-1 md:col-span-2">
                                  <label className="text-[10px] text-gray-400 uppercase font-bold block font-mono">Banner Image cover url</label>
                                  <div className="flex gap-1.5">
                                    <input
                                      type="url"
                                      value={item.coverUrl}
                                      onChange={(e) => {
                                        const arr = [...draftConfig.votingEvents];
                                        arr[idx] = { ...arr[idx], coverUrl: e.target.value };
                                        updateDraft('votingEvents', null, arr);
                                      }}
                                      className="flex-1 px-2.5 py-1.5 bg-[#0b0515]/80 border border-purple-500/10 rounded text-stone-200"
                                    />
                                    {/* Upload custom image to admin media */}
                                    <label className="px-3 py-1.5 rounded bg-purple-600/20 text-purple-300 border border-purple-500/20 hover:text-white hover:bg-purple-600/30 text-[10px] cursor-pointer shrink-0 font-medium">
                                      Upload File
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                          if (e.target.files && e.target.files[0]) {
                                            const file = e.target.files[0];
                                            if (file.size > 4 * 1024 * 1024) {
                                              showToast('File size must be smaller than 4MB.', 'error');
                                              return;
                                            }
                                            showToast('Uploading custom cover... 📡', 'info');
                                            try {
                                              const reader = new FileReader();
                                              reader.onload = async () => {
                                                if (typeof reader.result === 'string') {
                                                  try {
                                                    const res = await fetch('/api/admin/media/upload', {
                                                      method: 'POST',
                                                      headers: {
                                                        'Content-Type': 'application/json',
                                                        'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                                                      },
                                                      body: JSON.stringify({
                                                        filename: `vote_banner_${Date.now()}.${file.name.split('.').pop() || 'jpg'}`,
                                                        base64: reader.result,
                                                        category: 'Image'
                                                      })
                                                    });
                                                    if (res.ok) {
                                                      const uploaded = await res.json();
                                                      const arr = [...draftConfig.votingEvents];
                                                      arr[idx] = { ...arr[idx], coverUrl: uploaded.url };
                                                      updateDraft('votingEvents', null, arr);
                                                      showToast('Image uploaded and linked successfully! 💜', 'success');
                                                    } else {
                                                      const errData = await res.json().catch(() => ({ error: 'Server error' }));
                                                      showToast(`Upload failed: ${errData.error || 'Check admin auth'}`, 'error');
                                                    }
                                                  } catch (err: any) {
                                                    showToast(`Upload error: ${err.message}`, 'error');
                                                  }
                                                }
                                              };
                                              reader.readAsDataURL(file);
                                            } catch (err: any) {
                                              showToast(`File reading failed: ${err.message}`, 'error');
                                            }
                                          }
                                        }}
                                      />
                                    </label>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] text-gray-400 uppercase font-bold block font-mono">Display Order Index</label>
                                  <input
                                    type="number"
                                    value={item.order || 0}
                                    onChange={(e) => {
                                      const arr = [...draftConfig.votingEvents];
                                      arr[idx] = { ...arr[idx], order: parseInt(e.target.value) || 0 };
                                      updateDraft('votingEvents', null, arr);
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-[#0b0515]/80 border border-purple-500/10 rounded text-stone-100"
                                  />
                                </div>

                                <div className="space-y-1 font-mono">
                                  <label className="text-[10px] text-gray-400 uppercase font-bold block">Start Date</label>
                                  <input
                                    type="date"
                                    value={item.startDate || ''}
                                    onChange={(e) => {
                                      const arr = [...draftConfig.votingEvents];
                                      arr[idx] = { ...arr[idx], startDate: e.target.value };
                                      updateDraft('votingEvents', null, arr);
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-[#0b0515]/80 border border-purple-500/10 rounded text-[#c084fc]"
                                  />
                                </div>

                                <div className="space-y-1 font-mono">
                                  <label className="text-[10px] text-gray-400 uppercase font-bold block">Expiration End Date</label>
                                  <input
                                    type="date"
                                    value={item.endDate || ''}
                                    onChange={(e) => {
                                      const arr = [...draftConfig.votingEvents];
                                      arr[idx] = { ...arr[idx], endDate: e.target.value };
                                      updateDraft('votingEvents', null, arr);
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-[#0b0515]/80 border border-purple-500/10 rounded text-[#c084fc]"
                                  />
                                </div>

                                <div className="space-y-1 md:col-span-3">
                                  <label className="text-[10px] text-gray-400 uppercase font-bold block font-mono">Instructional Guideline Description</label>
                                  <textarea
                                    value={item.description}
                                    onChange={(e) => {
                                      const arr = [...draftConfig.votingEvents];
                                      arr[idx] = { ...arr[idx], description: e.target.value };
                                      updateDraft('votingEvents', null, arr);
                                    }}
                                    rows={2}
                                    className="w-full p-2 bg-[#0b0515]/80 border border-purple-500/10 rounded text-stone-200 text-xs resize-none"
                                    placeholder="Enter instructions, daily voting caps, guide steps, etc."
                                  />
                                </div>
                              </div>

                              {/* Right Controls Action Bar */}
                              <div className="flex xl:flex-col justify-between xl:justify-center gap-2 xl:border-l border-purple-500/10 xl:pl-4 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const arr = [...draftConfig.votingEvents];
                                    arr[idx] = { ...arr[idx], isPinned: !arr[idx].isPinned };
                                    updateDraft('votingEvents', null, arr);
                                    showToast(arr[idx].isPinned ? 'Campaign Pinned to the top! 📌' : 'Pin cleared.', 'info');
                                  }}
                                  className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase cursor-pointer border tracking-wider transition-all flex items-center justify-center gap-1 xl:w-28 ${
                                    isPinned 
                                      ? 'bg-purple-600/30 border-purple-500 text-purple-200' 
                                      : 'bg-black/30 border-purple-500/10 text-gray-400 hover:text-white'
                                  }`}
                                >
                                  📌 {isPinned ? 'Unpin' : 'Pin'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const arr = [...draftConfig.votingEvents];
                                    arr[idx] = { ...arr[idx], isFeatured: !arr[idx].isFeatured };
                                    updateDraft('votingEvents', null, arr);
                                    showToast(arr[idx].isFeatured ? 'Campaign marked as Featured! ⭐' : 'Unfeatured.', 'info');
                                  }}
                                  className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase cursor-pointer border tracking-wider transition-all flex items-center justify-center gap-1 xl:w-28 ${
                                    isFeatured 
                                      ? 'bg-amber-600/30 border-amber-500 text-amber-200' 
                                      : 'bg-black/30 border-purple-500/10 text-gray-400 hover:text-white'
                                  }`}
                                >
                                  ⭐ {isFeatured ? 'Regular' : 'Feature'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const arr = [...draftConfig.votingEvents];
                                    arr[idx] = { ...arr[idx], status: arr[idx].status === 'published' ? 'unpublished' : 'published' };
                                    updateDraft('votingEvents', null, arr);
                                    showToast(arr[idx].status === 'published' ? 'Campaign status set to Published.' : 'Campaign status set to Unpublished.', 'info');
                                  }}
                                  className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase cursor-pointer border tracking-wider transition-all flex items-center justify-center gap-1 xl:w-28 ${
                                    isPublished 
                                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200' 
                                      : 'bg-red-600/30 border-red-500 text-red-200'
                                  }`}
                                >
                                  🌎 {isPublished ? 'Live' : 'Draft'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteDraftArrayItem('votingEvents', idx)}
                                  className="px-2.5 py-1.5 bg-red-950/20 border border-red-500/10 hover:border-red-500/30 hover:bg-red-950/30 rounded text-red-400 text-[10px] font-bold uppercase tracking-wider cursor-pointer xl:w-28 transition-all flex items-center justify-center gap-1"
                                >
                                  <Trash className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub Tab: Submissions Queue Inbox */}
                {votingSubTab === 'proposals' && (
                  <div className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/5 space-y-4 font-sans">
                    <div className="flex justify-between items-center border-b border-purple-500/10 pb-3">
                      <div>
                        <span className="text-xs font-mono font-bold text-purple-300 uppercase block font-bold">📬 User Suggestion Inbox Queue ({proposals.length} overall submissions)</span>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-normal">
                          These items are suggests from the app visitors. You can Edit details and Approve to officially register them.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={fetchProposalsList}
                        className="px-3 py-1.5 bg-black/40 hover:bg-black border border-purple-500/25 hover:border-purple-500 text-[10px] text-purple-300 rounded-lg flex items-center gap-1.5 cursor-pointer font-bold transition-all"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingProposals ? 'animate-spin' : ''}`} /> Refresh Inbox
                      </button>
                    </div>

                    {isLoadingProposals ? (
                      <div className="text-center py-12 text-purple-300 text-xs font-mono animate-pulse">
                        ⌛ Fetching active community propositions registry...
                      </div>
                    ) : proposals.length === 0 ? (
                      <div className="text-center py-12 rounded-lg border border-dashed border-purple-500/20 bg-purple-950/5">
                        <Inbox className="w-8 h-8 text-purple-500/30 mx-auto mb-2" />
                        <p className="text-gray-400">There are no user submitted proposals inside the queue.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {proposals.map((item: any, pIdx: number) => {
                          const isPending = item.status === 'pending';
                          const isApproved = item.status === 'approved';
                          const isRejected = item.status === 'rejected';

                          return (
                            <div key={item.id || pIdx} className={`p-4 rounded-xl border flex flex-col xl:flex-row gap-5 items-stretch transition-all bg-[#090412]/60 ${
                              isPending 
                                ? 'border-amber-500/20 shadow-[0_2px_15px_-5px_rgba(245,158,11,0.08)]' 
                                : isApproved 
                                ? 'border-emerald-500/10 opacity-75' 
                                : 'border-red-500/10 opacity-60'
                            }`}>
                              {/* Left Graphic preview */}
                              <div className="relative w-full xl:w-44 h-24 xl:h-auto rounded-lg overflow-hidden bg-black/40 border border-purple-500/10 shrink-0">
                                <img src={item.coverUrl} className="w-full h-full object-cover" alt="Suggest cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border uppercase text-center shadow ${
                                    isApproved 
                                      ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400' 
                                      : isRejected 
                                      ? 'bg-red-950/80 border-red-500/30 text-red-500' 
                                      : 'bg-amber-950/80 border-amber-500/30 text-amber-300 animate-pulse'
                                  }`}>
                                    {item.status}
                                  </span>
                                </div>
                              </div>

                              {/* Metadata list */}
                              <div className="flex-1 space-y-3">
                                <div>
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/15 text-[9px] font-mono font-semibold uppercase text-purple-300">
                                    🎫 Platform: {item.platform || 'Online Website'}
                                  </span>
                                  <h4 className="text-sm font-bold text-white mt-1">{item.title}</h4>
                                  <p className="text-gray-400 text-xs leading-relaxed mt-1">{item.description}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-gray-400 border-t border-purple-500/5 pt-2">
                                  <div>📌 <strong>Link:</strong> <a href={item.voteNowUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 underline hover:text-purple-300 truncate inline-block max-w-[200px]">{item.voteNowUrl}</a></div>
                                  <div>📬 <strong>Submitted By:</strong> <span className="text-slate-300 truncate max-w-[150px] inline-block">{item.submittedBy || 'guest'}</span></div>
                                  <div>🗓️ <strong>Dates:</strong> <span className="text-[#c084fc]">{item.startDate || 'flexible'}</span> to <span className="text-[#c084fc]">{item.endDate || 'ongoing'}</span></div>
                                  <div>🏷️ <strong>Hashtag:</strong> <span className="text-purple-300">{item.caption || 'none'}</span></div>
                                  {item.additionalInfo && <div className="sm:col-span-2 text-[9px] text-gray-500">💡 <strong>Extra instructions:</strong> {item.additionalInfo}</div>}
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex xl:flex-col justify-end xl:justify-center gap-2 xl:border-l border-purple-500/10 xl:pl-4 shrink-0">
                                {isPending ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingProposalIndex(pIdx);
                                        setEditingProposalData({ ...item });
                                      }}
                                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-550 text-white font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all xl:w-32 shadow-md shadow-purple-600/10"
                                    >
                                      <Check className="w-3.5 h-3.5" /> Edit & Publish
                                    </button>

                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (!window.confirm('Reject this suggestion? This changes status to rejected but preserves it in the archive.')) return;
                                        try {
                                          const res = await fetch(`/api/voting/submissions/${item.id}/reject`, {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                                            }
                                          });
                                          const data = await res.json();
                                          if (res.ok && data.success) {
                                            showToast('Submission rejected successfully.', 'info');
                                            fetchProposalsList();
                                            fetchConfigs();
                                          } else {
                                            showToast(data.error || 'Server error.', 'error');
                                          }
                                        } catch (err: any) {
                                          showToast(err.message || 'Network error.', 'error');
                                        }
                                      }}
                                      className="px-3 py-1.5 bg-red-950/20 border border-red-500/15 hover:border-red-500/40 text-red-300 font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all xl:w-32"
                                    >
                                      ✕ Reject
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-gray-500 italic text-center block xl:w-32">
                                    Resolved
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!window.confirm('Are you strictly sure you want to permanently delete this submittal files database row?')) return;
                                    try {
                                      const res = await fetch(`/api/voting/submit/${item.id}`, {
                                        method: 'DELETE',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                                        }
                                      });
                                      const data = await res.json();
                                      if (res.ok && data.success) {
                                        showToast('Submission purged from memory completely.', 'info');
                                        fetchProposalsList();
                                        fetchConfigs();
                                      } else {
                                        showToast(data.error || 'Server error.', 'error');
                                      }
                                    } catch (err: any) {
                                      showToast(err.message || 'System issues.', 'error');
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-black/40 border border-white/5 hover:border-rose-500/30 text-gray-400 hover:text-rose-400 text-[10px] rounded-lg cursor-pointer transition-all xl:w-32 flex items-center justify-center gap-1"
                                >
                                  <Trash className="w-3 h-3" /> Purge row
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Proposal Review & Approve Overlay Modal */}
                    {editingProposalData && (
                      <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-md">
                        <div className="w-full max-w-2xl bg-[#0f0720] rounded-2xl border border-purple-500/30 p-6 space-y-4 my-auto shadow-[0_0_50px_rgba(168,85,247,0.25)] scrollbar-thin">
                          <div className="flex justify-between items-center border-b border-purple-500/10 pb-3">
                            <div>
                              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                                <Vote className="w-4 h-4 text-purple-400 animate-pulse" /> Review & Approve Suggestion
                              </h4>
                              <p className="text-[10px] text-gray-400 font-sans mt-0.5">
                                Modify submitted fields if necessary to match official layout requirements.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProposalIndex(null);
                                setEditingProposalData(null);
                              }}
                              className="text-gray-400 hover:text-white font-mono text-xs cursor-pointer p-1"
                            >
                              ✕ Minimize
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                            <div className="space-y-1">
                              <label className="text-[10px] text-purple-300 font-mono font-bold block uppercase">Campaign Title</label>
                              <input
                                type="text"
                                value={editingProposalData.title}
                                onChange={(e) => setEditingProposalData({ ...editingProposalData, title: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-purple-500/10 rounded text-stone-100"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-purple-300 font-mono font-bold block uppercase">Platform Platform Category</label>
                              <input
                                type="text"
                                value={editingProposalData.platform}
                                onChange={(e) => setEditingProposalData({ ...editingProposalData, platform: e.target.value })}
                                placeholder="e.g. Mubeat, Idol Champ, FanPlus"
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-purple-500/10 rounded text-white"
                              />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[10px] text-purple-300 font-mono font-bold block uppercase">Vote Now URL Redirect</label>
                              <input
                                type="url"
                                value={editingProposalData.voteNowUrl}
                                onChange={(e) => setEditingProposalData({ ...editingProposalData, voteNowUrl: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-purple-500/10 rounded text-[#c084fc]"
                              />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[10px] text-purple-300 font-mono font-bold block uppercase">Cover Banner Image URL</label>
                              <div className="flex gap-2">
                                <input
                                  type="url"
                                  value={editingProposalData.coverUrl}
                                  onChange={(e) => setEditingProposalData({ ...editingProposalData, coverUrl: e.target.value })}
                                  className="flex-1 px-2.5 py-1.5 bg-black/60 border border-purple-500/10 rounded text-stone-200"
                                />
                                <label className="px-3 py-1.5 rounded bg-purple-600/30 text-purple-300 border border-purple-500/20 hover:text-white hover:bg-purple-600/40 text-[10px] cursor-pointer shrink-0 font-bold flex items-center">
                                  Upload
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        if (file.size > 4 * 1024 * 1024) {
                                          showToast('File size must be smaller than 4MB.', 'error');
                                          return;
                                        }
                                        showToast('Uploading custom cover... 📡', 'info');
                                        try {
                                          const reader = new FileReader();
                                          reader.onload = async () => {
                                            if (typeof reader.result === 'string') {
                                              try {
                                                const res = await fetch('/api/admin/media/upload', {
                                                  method: 'POST',
                                                  headers: {
                                                    'Content-Type': 'application/json',
                                                    'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                                                  },
                                                  body: JSON.stringify({
                                                    filename: `proposal_banner_${Date.now()}.${file.name.split('.').pop() || 'jpg'}`,
                                                    base64: reader.result,
                                                    category: 'Image'
                                                  })
                                                });
                                                if (res.ok) {
                                                  const uploaded = await res.json();
                                                  setEditingProposalData({ ...editingProposalData, coverUrl: uploaded.url });
                                                  showToast('Image uploaded and linked successfully! 💜', 'success');
                                                } else {
                                                  const errData = await res.json().catch(() => ({ error: 'Server error' }));
                                                  showToast(`Upload failed: ${errData.error || 'Check admin auth'}`, 'error');
                                                }
                                              } catch (err: any) {
                                                showToast(`Upload error: ${err.message}`, 'error');
                                              }
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        } catch (err: any) {
                                          showToast(`File reading failed: ${err.message}`, 'error');
                                        }
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>

                            <div className="space-y-1 font-mono">
                              <label className="text-[10px] text-purple-300 block uppercase font-bold">Start Date</label>
                              <input
                                type="date"
                                value={editingProposalData.startDate || ''}
                                onChange={(e) => setEditingProposalData({ ...editingProposalData, startDate: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-purple-500/10 rounded text-stone-200"
                              />
                            </div>

                            <div className="space-y-1 font-mono">
                              <label className="text-[10px] text-purple-300 block uppercase font-bold">Expiration End Date</label>
                              <input
                                type="date"
                                value={editingProposalData.endDate || ''}
                                onChange={(e) => setEditingProposalData({ ...editingProposalData, endDate: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-purple-500/10 rounded text-stone-200"
                              />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[10px] text-purple-300 font-mono font-bold block uppercase">Hashtag / Caption Text</label>
                              <input
                                type="text"
                                value={editingProposalData.caption || ''}
                                onChange={(e) => setEditingProposalData({ ...editingProposalData, caption: e.target.value })}
                                placeholder="e.g. #BTSonIdolChamp, #VoteForJimin"
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-purple-500/10 rounded text-stone-200"
                              />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[10px] text-purple-300 font-mono block uppercase font-bold">Instruction Checklist</label>
                              <textarea
                                value={editingProposalData.description}
                                onChange={(e) => setEditingProposalData({ ...editingProposalData, description: e.target.value })}
                                rows={2.5}
                                className="w-full p-2.5 bg-black/60 border border-purple-500/10 rounded text-stone-200 leading-relaxed resize-none"
                              />
                            </div>

                            {editingProposalData.additionalInfo && (
                              <div className="space-y-1 md:col-span-2 p-2 bg-purple-950/20 border border-purple-500/10 rounded">
                                <span className="text-[9px] text-purple-300 font-mono block uppercase font-bold">💡 User Submission Note</span>
                                <p className="text-[10px] text-gray-400 font-sans mt-0.5">{editingProposalData.additionalInfo}</p>
                              </div>
                            )}

                            {/* Pinned / Featured selectors */}
                            <div className="flex gap-4 md:col-span-2 p-2 bg-black/30 border border-purple-500/5 rounded font-mono">
                              <label className="flex items-center gap-2 text-[10px] text-gray-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editingProposalData.isPinned || false}
                                  onChange={(e) => setEditingProposalData({ ...editingProposalData, isPinned: e.target.checked })}
                                  className="rounded border-purple-500 text-purple-600 focus:ring-purple-500 bg-black/40"
                                />
                                PINNED TO TOP
                              </label>

                              <label className="flex items-center gap-2 text-[10px] text-gray-300 cursor-pointer w-full">
                                <input
                                  type="checkbox"
                                  checked={editingProposalData.isFeatured || false}
                                  onChange={(e) => setEditingProposalData({ ...editingProposalData, isFeatured: e.target.checked })}
                                  className="rounded border-purple-500 text-purple-600 focus:ring-purple-500 bg-black/40"
                                />
                                FEATURED CAMPAIGN
                              </label>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 border-t border-purple-500/10 pt-3">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProposalIndex(null);
                                setEditingProposalData(null);
                              }}
                              className="px-4 py-1.5 border border-purple-500/15 hover:border-purple-500/30 text-gray-300 font-bold rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              disabled={isApprovingProposal}
                              onClick={async () => {
                                setIsApprovingProposal(true);
                                try {
                                  const res = await fetch(`/api/voting/submissions/${editingProposalData.id}/approve`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                                    },
                                    body: JSON.stringify({
                                      title: editingProposalData.title,
                                      description: editingProposalData.description,
                                      coverUrl: editingProposalData.coverUrl,
                                      voteNowUrl: editingProposalData.voteNowUrl,
                                      platform: editingProposalData.platform,
                                      startDate: editingProposalData.startDate,
                                      endDate: editingProposalData.endDate,
                                      isPinned: editingProposalData.isPinned,
                                      isFeatured: editingProposalData.isFeatured,
                                      caption: editingProposalData.caption
                                    })
                                  });
                                  const data = await res.json();
                                  if (res.ok && data.success) {
                                    showToast('SUBMISSION SUCCESSFULLY APPROVED & REGISTERED LIVE! 💜🗳️', 'success');
                                    setEditingProposalIndex(null);
                                    setEditingProposalData(null);
                                    fetchProposalsList();
                                    fetchConfigs();
                                  } else {
                                    showToast(data.error || 'Server validation failed.', 'error');
                                  }
                                } catch (err: any) {
                                  showToast(err.message || 'Verification communication failed.', 'error');
                                } finally {
                                  setIsApprovingProposal(false);
                                }
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-550 hover:to-fuchsia-550 text-white font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/10"
                            >
                              {isApprovingProposal ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Approve & Publish Campaign Live
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeAdminTab === 'SidebarFooter' && (
              <div className="space-y-6 text-xs">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase font-sans">Sidebar menu links & Footer settings</h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Toggle live drawer menus and manage footer copyright texts dynamically.</p>
                </div>

                {/* Sidebar configuration */}
                <div className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/5 space-y-4 font-sans max-w-full">
                  <span className="text-xs font-mono font-bold text-purple-300 uppercase block font-bold">🧭 Left Sidebar Portal Links Visibility Toggle</span>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { id: 'showHome', label: '🏠 Homepage Feed' },
                      { id: 'showMembers', label: '👥 Member Profiles' },
                      { id: 'showMusic', label: '🎵 Music Section' },
                      { id: 'showVideos', label: '🎥 YouTube Streams' },
                      { id: 'showGallery', label: '🖼️ Gallery Catalog' },
                      { id: 'showTimeline', label: '🕰️ Timeline Milestones' },
                      { id: 'showNews', label: '📰 News Feed' },
                      { id: 'showEvents', label: '🎪 Tour Events' },
                      { id: 'showDownloads', label: '📥 Wallpapers (HD)' },
                      { id: 'showFAQ', label: '❓ FAQ accordions' }
                    ].map((tog) => {
                      const isVis = draftConfig.sidebar?.[tog.id] !== false;
                      return (
                        <button
                          key={tog.id}
                          onClick={() => {
                            const sidebarObj = { ...(draftConfig.sidebar || {}) };
                            sidebarObj[tog.id] = !isVis;
                            updateDraft('sidebar', null, sidebarObj);
                            showToast(`Menu toggle changed: ${tog.label}`, 'success');
                          }}
                          className={`p-3 rounded-lg border transition-all text-xs font-semibold flex items-center justify-between gap-1 cursor-pointer ${
                            isVis 
                              ? 'bg-purple-900/20 border-purple-500 text-white font-bold' 
                              : 'bg-[#0b0515] border-purple-500/5 text-slate-500'
                          }`}
                        >
                          <span>{tog.label}</span>
                          <span className={`w-2.5 h-2.5 rounded-full ${isVis ? 'bg-purple-400 animate-pulse' : 'bg-slate-700'}`} />
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] text-purple-300 font-mono block">Sidebar Brand Logo Header</label>
                      <input
                        type="text"
                        value={draftConfig.sidebar?.logoText || 'BANGTAN GALLERY'}
                        onChange={(e) => {
                          const sidebarObj = { ...(draftConfig.sidebar || {}), logoText: e.target.value };
                          updateDraft('sidebar', null, sidebarObj);
                        }}
                        className="w-full px-3 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-200"
                      />
                    </div>

                    <SmartImageInput 
                      label="Sidebar Brand banner background"
                      value={draftConfig.sidebar?.bannerImg || ''}
                      onChange={(val) => {
                        const sidebarObj = { ...(draftConfig.sidebar || {}), bannerImg: val };
                        updateDraft('sidebar', null, sidebarObj);
                      }}
                      placeholder="Enter brand URL or Select"
                    />
                  </div>
                </div>

                {/* Footer configuration */}
                <div className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/5 space-y-3 font-sans text-xs">
                  <span className="text-xs font-mono font-bold text-purple-300 uppercase block font-bold">Bottom Footer details</span>

                  <div className="space-y-1">
                    <label className="text-[10px] text-purple-300 font-mono block">Footer Copy Disclaimer / Credit Line</label>
                    <input
                      type="text"
                      value={draftConfig.footer?.copyright || ''}
                      onChange={(e) => {
                        const footerObj = { ...(draftConfig.footer || {}), copyright: e.target.value };
                        updateDraft('footer', null, footerObj);
                      }}
                      className="w-full px-3 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-200"
                    />
                  </div>

                  <div className="space-y-1 font-sans mt-2">
                    <label className="text-[10px] text-purple-300 font-mono block">Footer Brand Description Statement</label>
                    <textarea
                      value={draftConfig.footer?.description || ''}
                      onChange={(e) => {
                        const footerObj = { ...(draftConfig.footer || {}), description: e.target.value };
                        updateDraft('footer', null, footerObj);
                      }}
                      rows={2}
                      className="w-full p-2.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-200 text-xs"
                    />
                  </div>

                  <div className="space-y-1 font-sans mt-2">
                    <label className="text-[10px] text-purple-300 font-mono block">☕ Ko-fi / Buy Me a Coffee Support URL Link</label>
                    <input
                      type="text"
                      value={draftConfig.footer?.kofiUrl || ''}
                      onChange={(e) => {
                        const footerObj = { ...(draftConfig.footer || {}), kofiUrl: e.target.value };
                        updateDraft('footer', null, footerObj);
                      }}
                      placeholder="Enter Ko-fi (or any support page) link e.g. https://ko-fi.com/username"
                      className="w-full px-3 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-200 text-xs"
                    />
                    <p className="text-[10px] text-purple-400 font-sans">This links the floating coffee bean button on the bottom right of the page to your support page.</p>
                  </div>
                </div>

                {/* Social media links configuration */}
                <div className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/5 space-y-3 font-sans text-xs">
                  <span className="text-xs font-mono font-bold text-cyan-300 uppercase block font-bold">Social Media & Developer URL Links</span>
                  <p className="text-[10px] text-cyan-400 font-sans">Modify official streams and developer contact paths visible in the sidebar navigation drawers.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-purple-300 font-mono block">Instagram Link</label>
                      <input
                        type="text"
                        placeholder="https://instagram.com/..."
                        value={draftConfig.socialLinks?.instagram || ''}
                        onChange={(e) => {
                          const socialObj = { ...(draftConfig.socialLinks || {}), instagram: e.target.value };
                          updateDraft('socialLinks', null, socialObj);
                        }}
                        className="w-full px-3 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-purple-300 font-mono block">X / Twitter Link</label>
                      <input
                        type="text"
                        placeholder="https://twitter.com/..."
                        value={draftConfig.socialLinks?.twitter || ''}
                        onChange={(e) => {
                          const socialObj = { ...(draftConfig.socialLinks || {}), twitter: e.target.value };
                          updateDraft('socialLinks', null, socialObj);
                        }}
                        className="w-full px-3 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-purple-300 font-mono block">YouTube Channel Link</label>
                      <input
                        type="text"
                        placeholder="https://youtube.com/..."
                        value={draftConfig.socialLinks?.youtube || ''}
                        onChange={(e) => {
                          const socialObj = { ...(draftConfig.socialLinks || {}), youtube: e.target.value };
                          updateDraft('socialLinks', null, socialObj);
                        }}
                        className="w-full px-3 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-purple-300 font-mono block">Facebook Page Link</label>
                      <input
                        type="text"
                        placeholder="https://facebook.com/..."
                        value={draftConfig.socialLinks?.facebook || ''}
                        onChange={(e) => {
                          const socialObj = { ...(draftConfig.socialLinks || {}), facebook: e.target.value };
                          updateDraft('socialLinks', null, socialObj);
                        }}
                        className="w-full px-3 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-200"
                      />
                    </div>
                     <div className="space-y-1">
                      <label className="text-[10px] text-purple-300 font-mono block">📌 Pinterest Link</label>
                      <input
                        type="text"
                        placeholder="https://www.pinterest.com/hey_shaif/"
                        value={draftConfig.socialLinks?.pinterest || ''}
                        onChange={(e) => {
                          const socialObj = { ...(draftConfig.socialLinks || {}), pinterest: e.target.value };
                          updateDraft('socialLinks', null, socialObj);
                        }}
                        className="w-full px-3 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-purple-300 font-mono block">Telegram Group Link</label>
                      <input
                        type="text"
                        placeholder="https://t.me/..."
                        value={draftConfig.socialLinks?.telegram || ''}
                        onChange={(e) => {
                          const socialObj = { ...(draftConfig.socialLinks || {}), telegram: e.target.value };
                          updateDraft('socialLinks', null, socialObj);
                        }}
                        className="w-full px-3 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-purple-300 font-mono block">Weverse Link</label>
                      <input
                        type="text"
                        placeholder="https://weverse.io/..."
                        value={draftConfig.socialLinks?.weverse || ''}
                        onChange={(e) => {
                          const socialObj = { ...(draftConfig.socialLinks || {}), weverse: e.target.value };
                          updateDraft('socialLinks', null, socialObj);
                        }}
                        className="w-full px-3 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-purple-300 font-mono block">Github (Developer Link)</label>
                      <input
                        type="text"
                        placeholder="https://github.com/..."
                        value={draftConfig.socialLinks?.github || ''}
                        onChange={(e) => {
                          const socialObj = { ...(draftConfig.socialLinks || {}), github: e.target.value };
                          updateDraft('socialLinks', null, socialObj);
                        }}
                        className="w-full px-3 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-purple-300 font-mono block">LinkedIn (Developer Link)</label>
                      <input
                        type="text"
                        placeholder="https://linkedin.com/in/..."
                        value={draftConfig.socialLinks?.linkedin || ''}
                        onChange={(e) => {
                          const socialObj = { ...(draftConfig.socialLinks || {}), linkedin: e.target.value };
                          updateDraft('socialLinks', null, socialObj);
                        }}
                        className="w-full px-3 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-purple-300 font-mono block">Creator Email Address</label>
                      <input
                        type="text"
                        placeholder="developer@gmail.com"
                        value={draftConfig.socialLinks?.email || ''}
                        onChange={(e) => {
                          const socialObj = { ...(draftConfig.socialLinks || {}), email: e.target.value };
                          updateDraft('socialLinks', null, socialObj);
                        }}
                        className="w-full px-3 py-1.5 bg-[#0b0515] border border-purple-500/10 rounded text-stone-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeAdminTab === 'Disclaimer' && (
              <div className="space-y-6 text-xs">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase font-sans">⚠️ Disclaimer Popup Management</h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Customize, preview, and deploy high-conversion informational disclaimer alerts. Changes sync live instantly upon publish.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Form Settings */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="p-5 border border-purple-500/10 rounded-2xl bg-[#090312]/80 space-y-5 font-sans">
                      <div className="flex items-center justify-between pb-3 border-b border-purple-500/10">
                        <span className="text-xs font-mono font-bold text-purple-300 uppercase block">⚙️ Banner Configuration</span>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={!!draftConfig.disclaimer?.enabled}
                            onChange={(e) => {
                              updateDraft('disclaimer', 'enabled', e.target.checked);
                            }}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white" />
                          <span className="ml-2 text-xs font-medium text-slate-300 font-mono">
                            {draftConfig.disclaimer?.enabled ? '🔵 ENABLED' : '🔴 DISABLED'}
                          </span>
                        </label>
                      </div>

                      {/* Header Title and Icon / Emoji */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] text-purple-300 font-mono block">Disclaimer Banner Title</label>
                          <input
                            type="text"
                            placeholder="⚠️ Disclaimer"
                            value={draftConfig.disclaimer?.title || ''}
                            onChange={(e) => {
                              updateDraft('disclaimer', 'title', e.target.value);
                            }}
                            className="w-full px-3 py-2 bg-[#05000a] border border-purple-500/15 rounded-lg text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-purple-300 font-mono block">Header Icon / Emoji</label>
                          <input
                            type="text"
                            placeholder="⚠️"
                            value={draftConfig.disclaimer?.icon || ''}
                            onChange={(e) => {
                              updateDraft('disclaimer', 'icon', e.target.value);
                            }}
                            className="w-full px-3 py-2 bg-[#05000a] border border-purple-500/15 rounded-lg text-white text-center font-mono"
                          />
                        </div>
                      </div>

                      {/* Duration and Position */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-purple-300 font-mono block">Dismiss Duration (Seconds)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="5"
                              max="8"
                              step="1"
                              value={draftConfig.disclaimer?.duration || 6}
                              onChange={(e) => {
                                updateDraft('disclaimer', 'duration', parseInt(e.target.value, 10));
                              }}
                              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <span className="text-white font-mono font-bold shrink-0 bg-[#05000a] border border-purple-500/10 px-2 py-1 rounded">
                              {draftConfig.disclaimer?.duration || 6}s
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-purple-300 font-mono block">Popup Placement Position</label>
                          <select
                            value={draftConfig.disclaimer?.position || 'bottom-right'}
                            onChange={(e) => {
                              updateDraft('disclaimer', 'position', e.target.value);
                            }}
                            className="w-full px-3 py-2 bg-[#05000a] border border-purple-500/15 rounded-lg text-white font-sans text-xs"
                          >
                            <option value="bottom-right">Bottom Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="top-right">Top Right</option>
                            <option value="top-left">Top Left</option>
                            <option value="center">Centered overlay modal</option>
                          </select>
                        </div>
                      </div>

                      {/* Message Content Textarea */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-purple-300 font-mono block">Disclaimer Banner Message Content Text</label>
                        <textarea
                          rows={6}
                          placeholder="Some parts of the content..."
                          value={draftConfig.disclaimer?.message || ''}
                          onChange={(e) => {
                            updateDraft('disclaimer', 'message', e.target.value);
                          }}
                          className="w-full px-3 py-2 bg-[#05000a] border border-purple-500/15 rounded-lg text-white font-sans text-xs leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Real-time Layout Mockup and Quick Controls */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="p-5 border border-purple-500/10 rounded-2xl bg-[#090312]/80 space-y-4 font-sans flex flex-col justify-between h-full">
                      <div>
                        <span className="text-xs font-mono font-bold text-purple-300 uppercase block pb-3 border-b border-purple-500/10">📱 Interactive Mockup Preview</span>
                        <p className="text-[11px] text-slate-400 mt-2">See how the banner looks based on your draft configurations before saving and publishing live.</p>

                        <div className="mt-4 p-4 rounded-xl border border-purple-500/20 bg-slate-950/90 text-white shadow-xl relative overflow-hidden">
                          <div className="flex items-center gap-2 pb-2 border-b border-purple-500/10">
                            <span className="text-base">{draftConfig.disclaimer?.icon || '⚠️'}</span>
                            <span className="text-xs font-bold text-purple-300">{draftConfig.disclaimer?.title || 'Disclaimer'}</span>
                          </div>
                          <div className="py-3 text-[10px] text-slate-300 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto">
                            {draftConfig.disclaimer?.message || 'No message configured.'}
                          </div>
                          <div className="pt-2 border-t border-purple-500/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>Auto-dismissing in {draftConfig.disclaimer?.duration || 6}s</span>
                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/20">Got it 💜</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-500 font-mono mt-3 text-center">
                          📍 Position: <span className="text-purple-300 uppercase">{draftConfig.disclaimer?.position || 'bottom-right'}</span>
                        </p>
                      </div>

                      <div className="space-y-2 mt-4 pt-4 border-t border-purple-500/10">
                        <button
                          type="button"
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('bts-preview-disclaimer', { detail: draftConfig.disclaimer }));
                          }}
                          className="w-full h-10 px-4 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/35 hover:border-purple-500/50 text-purple-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-95"
                        >
                          <Eye className="w-4 h-4 text-purple-400" />
                          <span>Preview Live Popup</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleSaveDraft}
                            disabled={savingDraft}
                            className="h-10 rounded-lg border border-purple-500/25 bg-purple-950/25 hover:bg-purple-950/45 text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {savingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            <span>Save Changes</span>
                          </button>

                          <button
                            type="button"
                            onClick={handlePublish}
                            disabled={publishing}
                            className="h-10 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs font-extrabold tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/25 cursor-pointer disabled:opacity-50"
                          >
                            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                            <span>Publish Live</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: LINKS MANAGEMENT */}
            {activeAdminTab === 'Links' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase font-sans">Links Management CMS</h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Control every singular outbound hub-coordinate, support buttons, external files, and redirection targets mapped on the website without utilizing VS Code.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card 1: Official Social Platforms */}
                  <div className="p-5 border border-purple-500/10 rounded-2xl bg-purple-950/5 space-y-4 font-sans text-xs">
                    <div className="flex items-center gap-2 pb-2 border-b border-purple-500/10">
                      <Globe className="w-4 h-4 text-sky-400" />
                      <span className="font-bold text-white uppercase tracking-wider">Social Platforms & Redirection Links</span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-purple-300 font-mono block">YouTube Channel Link</label>
                        <input
                          type="text"
                          placeholder="https://youtube.com/..."
                          value={draftConfig.socialLinks?.youtube || ''}
                          onChange={(e) => {
                            const socialObj = { ...(draftConfig.socialLinks || {}), youtube: e.target.value };
                            updateDraft('socialLinks', null, socialObj);
                          }}
                          className="w-full px-3 py-2 bg-[#0b0515] border border-purple-500/10 rounded-lg text-stone-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-purple-300 font-mono block">Instagram Link</label>
                        <input
                          type="text"
                          placeholder="https://instagram.com/..."
                          value={draftConfig.socialLinks?.instagram || ''}
                          onChange={(e) => {
                            const socialObj = { ...(draftConfig.socialLinks || {}), instagram: e.target.value };
                            updateDraft('socialLinks', null, socialObj);
                          }}
                          className="w-full px-3 py-2 bg-[#0b0515] border border-purple-500/10 rounded-lg text-stone-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-purple-300 font-mono block">Facebook Page Link</label>
                        <input
                          type="text"
                          placeholder="https://facebook.com/..."
                          value={draftConfig.socialLinks?.facebook || ''}
                          onChange={(e) => {
                            const socialObj = { ...(draftConfig.socialLinks || {}), facebook: e.target.value };
                            updateDraft('socialLinks', null, socialObj);
                          }}
                          className="w-full px-3 py-2 bg-[#0b0515] border border-purple-500/10 rounded-lg text-stone-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-purple-300 font-mono block">X / Twitter Link</label>
                        <input
                          type="text"
                          placeholder="https://twitter.com/..."
                          value={draftConfig.socialLinks?.twitter || ''}
                          onChange={(e) => {
                            const socialObj = { ...(draftConfig.socialLinks || {}), twitter: e.target.value };
                            updateDraft('socialLinks', null, socialObj);
                          }}
                          className="w-full px-3 py-2 bg-[#0b0515] border border-purple-500/10 rounded-lg text-stone-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-purple-300 font-mono block">Telegram Group Link</label>
                        <input
                          type="text"
                          placeholder="https://t.me/..."
                          value={draftConfig.socialLinks?.telegram || ''}
                          onChange={(e) => {
                            const socialObj = { ...(draftConfig.socialLinks || {}), telegram: e.target.value };
                            updateDraft('socialLinks', null, socialObj);
                          }}
                          className="w-full px-3 py-2 bg-[#0b0515] border border-purple-500/10 rounded-lg text-stone-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Support, Buttons, Download & Navigation Redirect Targets */}
                  <div className="p-5 border border-purple-500/10 rounded-2xl bg-purple-950/5 space-y-4 font-sans text-xs">
                    <div className="flex items-center gap-2 pb-2 border-b border-purple-500/10">
                      <Settings className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white uppercase tracking-wider">Button, Footer, & Redirection Targets</span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-purple-300 font-mono block">Kofi Button (Kofi-me links & Support Widget)</label>
                        <input
                          type="text"
                          placeholder="https://ko-fi.com/..."
                          value={draftConfig.footer?.kofiUrl !== undefined ? draftConfig.footer.kofiUrl : ''}
                          onChange={(e) => {
                            const footerObj = { ...(draftConfig.footer || {}), kofiUrl: e.target.value };
                            updateDraft('footer', null, footerObj);
                          }}
                          className="w-full px-3 py-2 bg-[#0b0515] border border-purple-500/10 rounded-lg text-stone-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-purple-300 font-mono block">Weverse Redirection</label>
                        <input
                          type="text"
                          placeholder="https://weverse.io/..."
                          value={draftConfig.socialLinks?.weverse || ''}
                          onChange={(e) => {
                            const socialObj = { ...(draftConfig.socialLinks || {}), weverse: e.target.value };
                            updateDraft('socialLinks', null, socialObj);
                          }}
                          className="w-full px-3 py-2 bg-[#0b0515] border border-purple-500/10 rounded-lg text-stone-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-purple-300 font-mono block">GitHub Redirection Target</label>
                        <input
                          type="text"
                          placeholder="https://github.com/..."
                          value={draftConfig.socialLinks?.github || ''}
                          onChange={(e) => {
                            const socialObj = { ...(draftConfig.socialLinks || {}), github: e.target.value };
                            updateDraft('socialLinks', null, socialObj);
                          }}
                          className="w-full px-3 py-2 bg-[#0b0515] border border-purple-500/10 rounded-lg text-stone-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-purple-300 font-mono block">LinkedIn Redirection Target</label>
                        <input
                          type="text"
                          placeholder="https://linkedin.com/in/..."
                          value={draftConfig.socialLinks?.linkedin || ''}
                          onChange={(e) => {
                            const socialObj = { ...(draftConfig.socialLinks || {}), linkedin: e.target.value };
                            updateDraft('socialLinks', null, socialObj);
                          }}
                          className="w-full px-3 py-2 bg-[#0b0515] border border-purple-500/10 rounded-lg text-stone-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-purple-300 font-mono block">Redirection Contact / Email</label>
                        <input
                          type="text"
                          placeholder="developer@gmail.com"
                          value={draftConfig.socialLinks?.email || ''}
                          onChange={(e) => {
                            const socialObj = { ...(draftConfig.socialLinks || {}), email: e.target.value };
                            updateDraft('socialLinks', null, socialObj);
                          }}
                          className="w-full px-3 py-2 bg-[#0b0515] border border-purple-500/10 rounded-lg text-stone-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Draft/Publish Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-500/10">
                  <button 
                    onClick={handleSaveDraft}
                    className="px-4 py-2 bg-purple-950/40 border border-purple-500/25 hover:border-purple-500/50 text-[10px] font-mono rounded-xl text-purple-200 transition-all cursor-pointer"
                  >
                    💾 Save Links Draft
                  </button>
                  <button 
                    onClick={handlePublish}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-[10px] font-mono rounded-xl text-white font-bold transition-all cursor-pointer"
                  >
                    🚀 Publish Live Instantly
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: MEMBERS */}
            {activeAdminTab === 'Members' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase font-sans">Member Bios & Facts CRM</h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Edit biographical data, fact indexes, and official solo activities lists for BTS members.</p>
                </div>

                {editingMemberIndex === null ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {draftConfig.members?.map((m: any, idx: number) => (
                      <div key={m.id} className="p-4 border border-purple-500/10 bg-purple-950/10 rounded-xl flex items-center gap-3">
                        <img src={m.portraitUrl} alt={m.name} className="w-12 h-12 rounded-full border border-purple-500/25 object-cover" referrerPolicy="no-referrer" />
                        <div className="flex-grow">
                          <span className="text-xs font-mono text-purple-400">{m.emoji} member</span>
                          <span className="font-bold text-white block text-sm">{m.name}</span>
                          <span className="text-[10px] text-slate-400 block line-clamp-1">{m.fullName}</span>
                        </div>
                        <button
                          onClick={() => setEditingMemberIndex(idx)}
                          className="p-1 px-3.5 border border-purple-500/20 text-xs font-bold text-purple-300 rounded hover:bg-purple-950/40 transition-all cursor-pointer font-sans"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Editor Form header */}
                    <div className="flex justify-between items-center bg-[#0d071a]/55 p-3 rounded-lg border border-purple-500/10">
                      <span className="text-sm font-bold text-white">Editing Profile: {draftConfig.members[editingMemberIndex].name}</span>
                      <button
                        onClick={() => {
                          setEditingMemberIndex(null);
                          setNewFact('');
                          setNewSolo('');
                          setNewDisco('');
                          setNewQuote('');
                        }}
                        className="text-xs font-mono block text-purple-400 hover:underline cursor-pointer"
                      >
                        &larr; Back to List
                      </button>
                    </div>

                    {/* Member Form Fields */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono text-purple-300 uppercase block">Name</label>
                          <input
                            type="text"
                            value={draftConfig.members[editingMemberIndex].name}
                            onChange={(e) => updateDraftArray('members', editingMemberIndex, 'name', e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#0a0513] border border-purple-500/10 text-xs font-bold text-white rounded-lg focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono text-purple-300 uppercase block">Emoji Icon</label>
                          <input
                            type="text"
                            value={draftConfig.members[editingMemberIndex].emoji}
                            onChange={(e) => updateDraftArray('members', editingMemberIndex, 'emoji', e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#0a0513] border border-purple-500/10 text-xs text-white rounded-lg focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-purple-300 uppercase block">Full Korean Name / Hangul</label>
                        <input
                          type="text"
                          value={draftConfig.members[editingMemberIndex].fullName}
                          onChange={(e) => updateDraftArray('members', editingMemberIndex, 'fullName', e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#0a0513] border border-purple-500/10 text-xs text-white rounded-lg focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-purple-300 uppercase block">Short Biography text</label>
                        <textarea
                          value={draftConfig.members[editingMemberIndex].biography}
                          onChange={(e) => updateDraftArray('members', editingMemberIndex, 'biography', e.target.value)}
                          rows={4}
                          className="w-full p-3 bg-[#0a0513] border border-purple-500/10 text-xs leading-relaxed text-stone-300 rounded-lg focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <SmartImageInput
                          label="Portrait Photo URL"
                          value={draftConfig.members[editingMemberIndex].portraitUrl}
                          onChange={(val) => updateDraftArray('members', editingMemberIndex, 'portraitUrl', val)}
                        />
                        <SmartImageInput
                          label="Banner Hero URL"
                          value={draftConfig.members[editingMemberIndex].bannerUrl}
                          onChange={(val) => updateDraftArray('members', editingMemberIndex, 'bannerUrl', val)}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-purple-300 uppercase block">MBTI Type</label>
                          <input
                            type="text"
                            value={draftConfig.members[editingMemberIndex].mbti}
                            onChange={(e) => updateDraftArray('members', editingMemberIndex, 'mbti', e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#0a0513] border border-purple-500/10 text-xs text-slate-300 rounded-lg focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-purple-300 uppercase block">Age</label>
                          <input
                            type="number"
                            value={draftConfig.members[editingMemberIndex].age}
                            onChange={(e) => updateDraftArray('members', editingMemberIndex, 'age', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 bg-[#0a0513] border border-purple-500/10 text-xs text-slate-300 rounded-lg focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-purple-300 uppercase block">Birthday String</label>
                          <input
                            type="text"
                            value={draftConfig.members[editingMemberIndex].birthday}
                            onChange={(e) => updateDraftArray('members', editingMemberIndex, 'birthday', e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#0a0513] border border-purple-500/10 text-xs text-slate-300 rounded-lg focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Extended Profile Fields */}
                      <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-purple-300 uppercase block">Height</label>
                          <input
                            type="text"
                            value={draftConfig.members[editingMemberIndex].height || ''}
                            onChange={(e) => updateDraftArray('members', editingMemberIndex, 'height', e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#0a0513] border border-purple-500/10 text-xs text-slate-300 rounded-lg focus:outline-none font-sans"
                            placeholder="e.g. 181 cm (5'11'')"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-purple-300 uppercase block">Blood Group</label>
                          <input
                            type="text"
                            value={draftConfig.members[editingMemberIndex].bloodGroup || ''}
                            onChange={(e) => updateDraftArray('members', editingMemberIndex, 'bloodGroup', e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#0a0513] border border-purple-500/10 text-xs text-slate-300 rounded-lg focus:outline-none font-sans"
                            placeholder="e.g. A"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-purple-300 uppercase block">Position (Comma separated)</label>
                          <input
                            type="text"
                            value={Array.isArray(draftConfig.members[editingMemberIndex].position) ? draftConfig.members[editingMemberIndex].position.join(', ') : (draftConfig.members[editingMemberIndex].position || '')}
                            onChange={(e) => updateDraftArray('members', editingMemberIndex, 'position', e.target.value.split(',').map((s: string) => s.trim()))}
                            className="w-full px-3 py-1.5 bg-[#0a0513] border border-purple-500/10 text-xs text-slate-300 rounded-lg focus:outline-none font-sans"
                            placeholder="e.g. Leader, Main Rapper"
                          />
                        </div>
                      </div>

                      {/* DEDICATED SECTION: Member Social & Information Management */}
                      <div className="border border-purple-500/20 bg-[#0d071a]/50 rounded-xl p-5 space-y-6">
                        <div className="border-b border-purple-500/15 pb-3">
                          <h4 className="text-sm font-sans font-black text-purple-200 tracking-wider uppercase flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                            Member Social & Information Management
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Manage official social channels and specialized detailed parameters for this profile page.
                          </p>
                        </div>

                        {/* SUB-SECTION: SOCIAL MEDIA MANAGEMENT */}
                        <div className="space-y-3">
                          <span className="text-[11px] font-mono text-purple-400 uppercase tracking-widest font-bold block">
                            🌐 Social Media Channels
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-slate-400 block">Instagram Link URL</label>
                              <input
                                type="url"
                                value={draftConfig.members[editingMemberIndex].instagramUrl || ''}
                                onChange={(e) => updateDraftArray('members', editingMemberIndex, 'instagramUrl', e.target.value)}
                                className="w-full px-3 py-1.5 bg-black/45 border border-purple-500/10 text-xs text-white rounded-md focus:outline-none focus:border-purple-500 font-mono"
                                placeholder="https://instagram.com/..."
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-slate-400 block">Facebook Link URL</label>
                              <input
                                type="url"
                                value={draftConfig.members[editingMemberIndex].facebookUrl || ''}
                                onChange={(e) => updateDraftArray('members', editingMemberIndex, 'facebookUrl', e.target.value)}
                                className="w-full px-3 py-1.5 bg-black/45 border border-purple-500/10 text-xs text-white rounded-md focus:outline-none focus:border-purple-500 font-mono"
                                placeholder="https://facebook.com/..."
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-slate-400 block">YouTube Link URL</label>
                              <input
                                type="url"
                                value={draftConfig.members[editingMemberIndex].youtubeUrl || ''}
                                onChange={(e) => updateDraftArray('members', editingMemberIndex, 'youtubeUrl', e.target.value)}
                                className="w-full px-3 py-1.5 bg-black/45 border border-purple-500/10 text-xs text-white rounded-md focus:outline-none focus:border-purple-500 font-mono"
                                placeholder="https://youtube.com/..."
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-slate-400 block">TikTok Link URL</label>
                              <input
                                type="url"
                                value={draftConfig.members[editingMemberIndex].tiktokUrl || ''}
                                onChange={(e) => updateDraftArray('members', editingMemberIndex, 'tiktokUrl', e.target.value)}
                                className="w-full px-3 py-1.5 bg-black/45 border border-purple-500/10 text-xs text-white rounded-md focus:outline-none focus:border-purple-500 font-mono"
                                placeholder="https://tiktok.com/@..."
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-slate-400 block">Spotify Link URL</label>
                              <input
                                type="url"
                                value={draftConfig.members[editingMemberIndex].spotifyUrl || ''}
                                onChange={(e) => updateDraftArray('members', editingMemberIndex, 'spotifyUrl', e.target.value)}
                                className="w-full px-3 py-1.5 bg-black/45 border border-purple-500/10 text-xs text-white rounded-md focus:outline-none focus:border-purple-500 font-mono"
                                placeholder="https://open.spotify.com/artist/..."
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-slate-400 block">Weverse Link URL</label>
                              <input
                                type="url"
                                value={draftConfig.members[editingMemberIndex].weverseUrl || ''}
                                onChange={(e) => updateDraftArray('members', editingMemberIndex, 'weverseUrl', e.target.value)}
                                className="w-full px-3 py-1.5 bg-black/45 border border-purple-500/10 text-xs text-white rounded-md focus:outline-none focus:border-purple-500 font-mono"
                                placeholder="https://weverse.io/bts/..."
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-slate-400 block">X (Twitter) Link URL</label>
                              <input
                                type="url"
                                value={draftConfig.members[editingMemberIndex].twitterUrl || ''}
                                onChange={(e) => updateDraftArray('members', editingMemberIndex, 'twitterUrl', e.target.value)}
                                className="w-full px-3 py-1.5 bg-black/45 border border-purple-500/10 text-xs text-white rounded-md focus:outline-none focus:border-purple-500 font-mono"
                                placeholder="https://x.com/..."
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-slate-400 block">Official Website Link URL</label>
                              <input
                                type="url"
                                value={draftConfig.members[editingMemberIndex].websiteUrl || ''}
                                onChange={(e) => updateDraftArray('members', editingMemberIndex, 'websiteUrl', e.target.value)}
                                className="w-full px-3 py-1.5 bg-black/45 border border-purple-500/10 text-xs text-white rounded-md focus:outline-none focus:border-purple-500 font-mono"
                                placeholder="https://ibighit.com/bts/..."
                              />
                            </div>
                          </div>
                        </div>

                        {/* SUB-SECTION: DETAILED MEMBER PROFILE & OVERVIEWS */}
                        <div className="space-y-4 pt-2 border-t border-purple-500/10">
                          <span className="text-[11px] font-mono text-purple-400 uppercase tracking-widest font-bold block">
                            📝 Introduction & Additional Overviews
                          </span>
                          
                          <div className="space-y-3 text-xs">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono text-slate-400 block">Introduction Text (Short quote/hook banner)</label>
                              <input
                                type="text"
                                value={draftConfig.members[editingMemberIndex].introductionText || ''}
                                onChange={(e) => updateDraftArray('members', editingMemberIndex, 'introductionText', e.target.value)}
                                className="w-full px-3 py-2 bg-black/45 border border-purple-500/10 text-xs text-stone-200 rounded-md focus:outline-none focus:border-purple-500"
                                placeholder="e.g. Life is a journey that we never prepare for..."
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono text-slate-400 block">Extended Description overview (Details append)</label>
                              <textarea
                                value={draftConfig.members[editingMemberIndex].description || ''}
                                onChange={(e) => updateDraftArray('members', editingMemberIndex, 'description', e.target.value)}
                                rows={3}
                                className="w-full p-3 bg-black/45 border border-purple-500/10 text-xs leading-relaxed text-stone-300 rounded-md focus:outline-none focus:border-purple-500"
                                placeholder="Write additional background facts, career segments and insights for this member profile..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Fun facts list */}
                      <div className="border border-purple-500/10 rounded-xl p-4 bg-[#0a0513]/40 space-y-3 font-sans">
                        <span className="text-xs font-mono text-purple-300 font-bold block uppercase">Fun Facts Index</span>
                        <div className="space-y-2">
                          {draftConfig.members[editingMemberIndex].funFacts?.map((fact: string, fIdx: number) => (
                            <div key={fIdx} className="flex gap-2">
                              <input
                                type="text"
                                value={fact}
                                onChange={(e) => {
                                  const arr = [...draftConfig.members[editingMemberIndex].funFacts];
                                  arr[fIdx] = e.target.value;
                                  updateDraftArray('members', editingMemberIndex, 'funFacts', arr);
                                }}
                                className="flex-grow px-3 py-1 rounded bg-black/40 border border-purple-500/5 text-xs focus:outline-none"
                              />
                              <button
                                onClick={() => deleteMemberContentItem('funFacts', fIdx)}
                                className="text-red-400 text-xs hover:underline cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <input
                            type="text"
                            value={newFact}
                            onChange={(e) => setNewFact(e.target.value)}
                            placeholder="Add trivia..."
                            className="flex-grow px-3 py-1 bg-black/40 text-xs rounded border border-purple-500/10"
                          />
                          <button
                            onClick={() => {
                              if (!newFact.trim()) return;
                              const facts = [...(draftConfig.members[editingMemberIndex].funFacts || []), newFact.trim()];
                              updateDraftArray('members', editingMemberIndex, 'funFacts', facts);
                              setNewFact('');
                            }}
                            className="px-3 rounded bg-purple-600 text-white font-bold text-xs cursor-pointer"
                          >
                            Add Fact
                          </button>
                        </div>
                      </div>

                      {/* Member Solo Activities */}
                      <div className="border border-purple-500/10 rounded-xl p-4 bg-[#0a0513]/40 space-y-3 font-sans">
                        <span className="text-xs font-mono text-pink-400 font-bold block uppercase">🌟 Solo Career & Releases (Member Highlights)</span>
                        <div className="space-y-2">
                          {draftConfig.members[editingMemberIndex].soloActivities?.map((act: string, sIdx: number) => (
                            <div key={sIdx} className="flex gap-2">
                              <input
                                type="text"
                                value={act}
                                onChange={(e) => {
                                  const arr = [...draftConfig.members[editingMemberIndex].soloActivities];
                                  arr[sIdx] = e.target.value;
                                  updateDraftArray('members', editingMemberIndex, 'soloActivities', arr);
                                }}
                                className="flex-grow px-3 py-1 rounded bg-black/40 border border-purple-500/5 text-xs focus:outline-none text-white font-sans"
                              />
                              <button
                                onClick={() => deleteMemberContentItem('soloActivities', sIdx)}
                                className="text-red-400 text-xs hover:underline cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <input
                            type="text"
                            value={newSolo}
                            onChange={(e) => setNewSolo(e.target.value)}
                            placeholder="Add solo work..."
                            className="flex-grow px-3 py-1 bg-black/40 text-xs text-white rounded border border-purple-500/10"
                          />
                          <button
                            onClick={() => {
                              if (!newSolo.trim()) return;
                              const items = [...(draftConfig.members[editingMemberIndex].soloActivities || []), newSolo.trim()];
                              updateDraftArray('members', editingMemberIndex, 'soloActivities', items);
                              setNewSolo('');
                            }}
                            className="px-3 rounded bg-purple-600 text-white font-bold text-xs cursor-pointer select-none"
                          >
                            Add Work
                          </button>
                        </div>
                      </div>

                      {/* Aesthetic Moments / Member Gallery with instant upload support */}
                      <div className="border border-purple-500/10 rounded-xl p-4 bg-[#0a0513]/40 space-y-3 font-sans">
                        <span className="text-xs font-mono text-cyan-400 font-bold block uppercase">📸 Aesthetic Moments / Member Gallery</span>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {draftConfig.members[editingMemberIndex].gallery?.map((imgUrl: string, idx: number) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-purple-500/10 bg-black/40 group">
                              <img src={imgUrl} alt="Moment Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button
                                onClick={() => deleteMemberContentItem('gallery', idx)}
                                className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded text-[10px] uppercase font-mono font-bold hover:bg-red-700 pointer-events-auto select-none"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 items-end pt-2">
                          <div className="flex-grow space-y-1">
                            <input
                              type="text"
                              value={newGalleryUrl}
                              onChange={(e) => setNewGalleryUrl(e.target.value)}
                              placeholder="Paste moment image URL..."
                              className="w-full px-3 py-2 bg-black/40 text-xs text-white rounded border border-purple-500/10 font-mono"
                            />
                          </div>
                          
                          <div className="relative shrink-0 font-sans">
                            <input 
                              type="file"
                              id="member-gallery-upload-field"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                showToast(`Uploading profile image asset... 📡`, 'info');
                                try {
                                  const reader = new FileReader();
                                  reader.onload = async (event) => {
                                    try {
                                      const res = await fetch('/api/admin/media/upload', {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                                        },
                                        body: JSON.stringify({
                                          filename: file.name,
                                          base64: event.target?.result as string,
                                          category: 'Image'
                                        })
                                      });
                                      if (res.ok) {
                                        const uploaded = await res.json();
                                        setNewGalleryUrl(uploaded.url);
                                        showToast('Uploaded asset! Ready to add.', 'success');
                                      } else {
                                        showToast('Asset upload failed', 'error');
                                      }
                                    } catch (err) {
                                      showToast('Request failed', 'error');
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                } catch (err) {
                                  showToast('File read failed', 'error');
                                }
                              }}
                              className="sr-only"
                            />
                            <label
                              htmlFor="member-gallery-upload-field"
                              className="px-3 py-2 bg-purple-900/60 border border-purple-500/30 text-white text-xs font-mono rounded-lg cursor-pointer hover:bg-purple-800 transition-all block select-none"
                            >
                              Upload Asset...
                            </label>
                          </div>

                          <button
                            onClick={() => {
                              if (!newGalleryUrl.trim()) return;
                              const gallery = [...(draftConfig.members[editingMemberIndex].gallery || []), newGalleryUrl.trim()];
                              updateDraftArray('members', editingMemberIndex, 'gallery', gallery);
                              setNewGalleryUrl('');
                            }}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer h-[34px] font-sans select-none"
                          >
                            Add to Gallery
                          </button>
                        </div>
                      </div>

                      {/* YouTube Video Spotlight / Member Videos */}
                      <div className="border border-purple-500/10 rounded-xl p-4 bg-[#0a0513]/40 space-y-3 font-sans">
                        <span className="text-xs font-mono text-yellow-400 font-bold block uppercase">🎥 Member Video Spotlight & Solo Videos</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {draftConfig.members[editingMemberIndex].videoIds?.map((vidCode: string, idx: number) => (
                            <div key={idx} className="p-3 bg-black/40 border border-purple-500/5 rounded-lg flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] text-yellow-400 font-mono font-bold shrink-0">#{idx + 1}</span>
                                <span className="text-xs text-stone-300 font-mono truncate">{vidCode}</span>
                              </div>
                              <button
                                onClick={() => deleteMemberContentItem('videoIds', idx)}
                                className="text-red-400 text-[10px] hover:underline cursor-pointer font-mono uppercase"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <input
                            type="text"
                            value={newVideoId}
                            onChange={(e) => setNewVideoId(e.target.value)}
                            placeholder="Paste YouTube Video ID (e.g. CuklIb9d3fI)"
                            className="flex-grow px-3 py-1 bg-black/40 text-xs text-white rounded border border-purple-500/10 font-mono focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              if (!newVideoId.trim()) return;
                              let finalCode = newVideoId.trim();
                              if (finalCode.includes('youtube.com/watch?v=')) {
                                finalCode = finalCode.split('v=')[1]?.split('&')[0] || finalCode;
                              } else if (finalCode.includes('youtu.be/')) {
                                finalCode = finalCode.split('youtu.be/')[1]?.split('?')[0] || finalCode;
                              }
                              const videoIds = [...(draftConfig.members[editingMemberIndex].videoIds || []), finalCode];
                              updateDraftArray('members', editingMemberIndex, 'videoIds', videoIds);
                              setNewVideoId('');
                            }}
                            className="px-4 rounded bg-rose-600 text-white font-bold text-xs cursor-pointer select-none"
                          >
                            Add Video Video ID
                          </button>
                        </div>
                      </div>

                      {/* Member Timeline Events */}
                      <div className="border border-purple-500/10 rounded-xl p-4 bg-[#0a0513]/40 space-y-3 font-sans">
                        <span className="text-xs font-mono text-purple-400 font-bold block uppercase">📅 Member Personal Chronology & Timeline</span>
                        <div className="space-y-2">
                          {draftConfig.members[editingMemberIndex].timeline?.map((evt: any, idx: number) => (
                            <div key={idx} className="p-3 bg-black/40 border border-purple-500/5 rounded-lg flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <span className="px-2 py-0.5 bg-purple-950/40 text-purple-300 font-mono rounded text-[10px] border border-purple-500/20 font-bold">{evt.year}</span>
                                <p className="text-xs text-stone-200 mt-1 font-sans">{evt.event}</p>
                              </div>
                              <button
                                onClick={() => deleteMemberContentItem('timeline', idx)}
                                className="text-red-400 text-xs hover:underline cursor-pointer shrink-0 font-mono"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                          <input
                            type="text"
                            value={newTimelineYear}
                            onChange={(e) => setNewTimelineYear(e.target.value)}
                            placeholder="Year (e.g. 2026)"
                            className="px-3 py-1 bg-black/40 text-xs text-white rounded border border-purple-500/10 font-mono focus:outline-none"
                          />
                          <input
                            type="text"
                            value={newTimelineEvent}
                            onChange={(e) => setNewTimelineEvent(e.target.value)}
                            placeholder="Milestone Event detail..."
                            className="sm:col-span-2 px-3 py-1 bg-black/40 text-xs text-white rounded border border-purple-500/10 focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => {
                            if (!newTimelineYear.trim() || !newTimelineEvent.trim()) return;
                            const evts = [...(draftConfig.members[editingMemberIndex].timeline || []), {
                              year: newTimelineYear.trim(),
                              event: newTimelineEvent.trim()
                            }];
                            updateDraftArray('members', editingMemberIndex, 'timeline', evts);
                            setNewTimelineYear('');
                            setNewTimelineEvent('');
                          }}
                          className="w-full py-1.5 rounded bg-purple-600 text-white font-bold text-xs cursor-pointer text-center font-sans tracking-wide select-none"
                        >
                          Add Timeline Milestone event
                        </button>
                      </div>

                      {/* Save Members Profile controls */}
                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-500/10">
                        <button 
                          type="button"
                          onClick={() => {
                            setEditingMemberIndex(null);
                            showToast('Selected member profile editing draft preserved! 💜', 'info');
                          }}
                          className="px-4 py-2 bg-purple-950/25 border border-purple-500/15 text-xs font-mono rounded-xl text-purple-300 transition-all cursor-pointer"
                        >
                          &larr; Back to List
                        </button>
                        <button 
                          type="button"
                          onClick={async () => {
                            setSavingDraft(true);
                            try {
                              const res = await fetch('/api/config/draft', {
                                method: 'POST',
                                headers: { 
                                  'Content-Type': 'application/json',
                                  'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                                },
                                body: JSON.stringify(draftConfig)
                              });
                              
                              if (res.ok) {
                                // Trigger live publish instantly
                                const publishRes = await fetch('/api/config/publish', {
                                  method: 'POST',
                                  headers: {
                                    'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                                  }
                                });
                                
                                if (publishRes.ok) {
                                  showToast('Member profile saved and changes published live instantly! 💜🎉', 'success');
                                  const pubRep = await fetch('/api/config/published');
                                  if (pubRep.ok) {
                                    setPublishedConfig(sanitizeConfig(await pubRep.json()));
                                  }
                                } else {
                                  showToast('Draft version saved successfully, but live compilation failed.', 'info');
                                }
                                setEditingMemberIndex(null);
                              } else {
                                throw new Error();
                              }
                            } catch (err) {
                              showToast('Failed saving member bio changes.', 'error');
                            } finally {
                              setSavingDraft(false);
                            }
                          }}
                          className="px-5 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-mono rounded-xl text-white font-bold transition-all cursor-pointer"
                        >
                          💾 Save Member Bio & Publish Live
                        </button>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )}

            {activeAdminTab === 'Music' && (
              <div className="space-y-6">
                {cmsEditing && cmsEditing.tab === 'DigitalTracks' ? (
                  <div className="p-6 border border-purple-500/20 bg-black/40 rounded-2xl space-y-5 font-sans text-stone-200" id="digital-track-edit-form">
                    <div className="flex justify-between items-center pb-3 border-b border-purple-500/10">
                      <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                        {cmsEditing.index === -1 ? '✨ Add Digital CMS Track' : '✏️ Edit Digital CMS Track'}
                      </h4>
                      <button 
                        onClick={() => { setCmsEditing(null); }}
                        className="text-xs text-slate-400 hover:text-white cursor-pointer select-none"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        
                        {/* Auto resolver assistant row */}
                        <div className="p-3.5 bg-purple-950/20 border border-purple-500/15 rounded-xl space-y-2">
                          <span className="text-[10px] font-mono font-bold text-pink-400 block uppercase">🚀 Auto-Resolve Spotify Link</span>
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              id="spotify-resolve-url-input"
                              placeholder="Paste Spotify Link (track/album) e.g. https://open.spotify.com/track/..."
                              className="flex-grow px-2 py-1.5 bg-[#090515] border border-purple-500/15 rounded-lg text-xxs text-white font-mono"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                const el = document.getElementById('spotify-resolve-url-input') as HTMLInputElement;
                                if (!el || !el.value.trim()) {
                                  showToast('Please paste a Spotify URL.', 'info');
                                  return;
                                }
                                showToast('Resolving Spotify metadata... 📡', 'info');
                                try {
                                  const res = await fetch('/api/spotify/resolve', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                                    },
                                    body: JSON.stringify({ url: el.value.trim() })
                                  });
                                  if (res.ok) {
                                    const metadata = await res.json();
                                    setCmsEditing({
                                      ...cmsEditing,
                                      data: {
                                        ...cmsEditing.data,
                                        title: metadata.title,
                                        artist: metadata.artist,
                                        album: metadata.album,
                                        coverUrl: metadata.coverUrl,
                                        duration: metadata.duration,
                                        spotifyUrl: metadata.spotifyUrl,
                                        youtubeUrl: metadata.youtubeUrl,
                                        externalUrl: metadata.spotifyUrl
                                      }
                                    });
                                    showToast('Metadata auto-resolved! 💜🎨', 'success');
                                  } else {
                                    showToast('Resolution offline. Check URL structure.', 'error');
                                  }
                                } catch {
                                  showToast('Network error resolving link.', 'error');
                                }
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg text-xxs font-mono font-bold cursor-pointer transition-all select-none"
                            >
                              ✨ Auto Fill
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Track Title</label>
                          <input 
                            type="text"
                            value={cmsEditing.data.title || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, title: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                            placeholder="e.g. Dynamite"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Artist Name</label>
                            <input 
                              type="text"
                              value={cmsEditing.data.artist || ''}
                              onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, artist: e.target.value }})}
                              className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                              placeholder="e.g. BTS"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Publish Status</label>
                            <select 
                              value={cmsEditing.data.published === false ? 'false' : 'true'}
                              onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, published: e.target.value === 'true' }})}
                              className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                            >
                              <option value="true">Published (Visible on site)</option>
                              <option value="false">Unpublished (Draft, hidden)</option>
                            </select>
                          </div>
                        </div>

                        {/* Custom Cover upload & text link */}
                        <div className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/15 space-y-3">
                          <span className="text-xs font-mono font-bold text-cyan-400 block uppercase">🖼️ Cover Image Artwork</span>
                          <div className="flex gap-2 items-end">
                            <div className="flex-grow space-y-1">
                              <label className="text-[10px] text-slate-400 block font-mono">Image URL address</label>
                              <input 
                                type="text"
                                value={cmsEditing.data.coverUrl || ''}
                                onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, coverUrl: e.target.value }})}
                                className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white font-mono"
                                placeholder="Paste image cover URL or upload file..."
                              />
                            </div>
                            <div className="relative shrink-0">
                              <input 
                                type="file"
                                id="track-cover-field-upload"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  showToast(`Uploading cover image... 📡`, 'info');
                                  try {
                                    const reader = new FileReader();
                                    reader.onload = async (event) => {
                                      try {
                                        const res = await fetch('/api/admin/media/upload', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                                          },
                                          body: JSON.stringify({
                                            filename: file.name,
                                            base64: event.target?.result as string,
                                            category: 'Image'
                                          })
                                        });
                                        if (res.ok) {
                                          const uploaded = await res.json();
                                          setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, coverUrl: uploaded.url } });
                                          showToast('Cover uploaded successfully! 🎉', 'success');
                                        } else {
                                          showToast('Upload failed', 'error');
                                        }
                                      } catch (err) {
                                        showToast('Upload request failed', 'error');
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  } catch (err) {
                                    showToast('File read failed', 'error');
                                  }
                                }}
                                className="sr-only"
                              />
                              <label
                                htmlFor="track-cover-field-upload"
                                className="px-3 py-2 bg-purple-900/60 border border-purple-500/30 text-white text-xs font-mono rounded-lg cursor-pointer hover:bg-purple-800 transition-all flex items-center gap-1 block select-none"
                              >
                                Upload...
                              </label>
                            </div>
                          </div>
                        </div>

                      </div>

                      <div className="space-y-4">
                        {/* Audio track custom direct player file upload */}
                        <div className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/15 space-y-3">
                          <span className="text-xs font-mono font-bold text-pink-400 block uppercase">📁 Direct Audio File Upload (MP3/WAV/M4A)</span>
                          <div className="space-y-1.5">
                            <input 
                              type="file"
                              id="track-audio-field-upload"
                              accept="audio/mp3,audio/mpeg,audio/wav,audio/aac,audio/m4a"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                showToast(`Uploading direct audio stream: ${file.name}... 📡`, 'info');
                                try {
                                  const reader = new FileReader();
                                  reader.onload = async (event) => {
                                    try {
                                      const res = await fetch('/api/admin/media/upload', {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                                        },
                                        body: JSON.stringify({
                                          filename: file.name,
                                          base64: event.target?.result as string,
                                          category: 'Audio'
                                        })
                                      });
                                      if (res.ok) {
                                        const uploaded = await res.json();
                                        setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, audioUrl: uploaded.url } });
                                        showToast('Audio track uploaded completely! 🎧', 'success');
                                      } else {
                                        showToast('Audio upload failed', 'error');
                                      }
                                    } catch (err) {
                                      showToast('Audio upload request failed', 'error');
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                } catch (err) {
                                  showToast('File read failed', 'error');
                                }
                              }}
                              className="sr-only"
                            />
                            <div className="flex items-center gap-3">
                              <label
                                htmlFor="track-audio-field-upload"
                                className="px-4 py-2 bg-pink-900/60 border border-pink-500/30 text-white text-xs font-mono rounded-lg cursor-pointer hover:bg-pink-850 transition-all flex items-center gap-1 select-none"
                              >
                                {cmsEditing.data.audioUrl ? 'Change Audio File...' : 'Choose MP3/WAV/M4A...'}
                              </label>
                              {cmsEditing.data.audioUrl && (
                                <span className="text-xxs text-emerald-400 font-mono truncate max-w-xs block">
                                  ✓ Uploaded Audio file
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Spotify link */}
                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Spotify Track / Album / Playlist Link</label>
                          <input 
                            type="text"
                            value={cmsEditing.data.spotifyUrl || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, spotifyUrl: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white font-mono"
                            placeholder="e.g. https://open.spotify.com/track/..."
                          />
                        </div>

                        {/* Genre/Era Category Year selection */}
                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase font-mono font-bold">Era Coordinates Year</label>
                          <select 
                            value={cmsEditing.data.genre || '2020'}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, genre: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white text-stone-200"
                          >
                            <option value="2013">Era 2013</option>
                            <option value="2014">Era 2014</option>
                            <option value="2015">Era 2015</option>
                            <option value="2016">Era 2016</option>
                            <option value="2017">Era 2017</option>
                            <option value="2018">Era 2018</option>
                            <option value="2019">Era 2019</option>
                            <option value="2020">Era 2020</option>
                            <option value="2021">Era 2021</option>
                            <option value="2022">Era 2022</option>
                            <option value="2023">Era 2023</option>
                            <option value="2024">Era 2024</option>
                            <option value="2025">Era 2025</option>
                            <option value="2026">Era 2026</option>
                          </select>
                        </div>

                        {/* Lyrics content box */}
                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase font-mono">Singalong Lyrics / Transcripts</label>
                          <textarea 
                            value={cmsEditing.data.lyrics || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, lyrics: e.target.value }})}
                            rows={3.5}
                            className="w-full p-2.5 bg-[#090515] border border-purple-500/15 rounded-lg text-xs font-mono text-stone-200"
                            placeholder="Optional track lyrics text block..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-500/10">
                      <button 
                        onClick={() => handleCmsSave(false)}
                        className="px-4 py-2 bg-purple-950/40 border border-purple-500/25 hover:border-purple-500/50 text-xs font-mono rounded-xl text-purple-200 transition-all cursor-pointer select-none"
                      >
                        💾 Save Draft
                      </button>
                      <button 
                        onClick={() => handleCmsSave(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-mono rounded-xl text-white font-bold transition-all cursor-pointer select-none"
                      >
                        🚀 Publish Live Instantly
                      </button>
                    </div>
                  </div>
                ) : cmsEditing && cmsEditing.tab === 'Music' ? (
                  <div className="p-6 border border-purple-500/20 bg-black/40 rounded-2xl space-y-5 font-sans text-stone-200">
                    <div className="flex justify-between items-center pb-3 border-b border-purple-500/10">
                      <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                        {cmsEditing.index === -1 ? '✨ Add Music Track / Album' : '✏️ Edit Music Track / Album'}
                      </h4>
                      <button 
                        onClick={() => { setCmsEditing(null); setCmsShowPreview(false); }}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Track / Album Title</label>
                          <input 
                            type="text"
                            value={cmsEditing.data.title}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, title: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white animate-none"
                            placeholder="e.g. Dynamite / BE"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Release Year</label>
                            <input 
                              type="text"
                              value={cmsEditing.data.year || ''}
                              onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, year: e.target.value }})}
                              className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                              placeholder="e.g. 2020"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Artist / Unit</label>
                            <input 
                              type="text"
                              value={cmsEditing.data.artist || 'BTS'}
                              onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, artist: e.target.value }})}
                              className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                              placeholder="e.g. BTS"
                            />
                          </div>
                        </div>

                        <SmartImageInput
                          label="Cover Artwork URL"
                          value={cmsEditing.data.coverUrl}
                          onChange={(val) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, coverUrl: val }})}
                          placeholder="Paste cover URL"
                        />

                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Spotify Embed Code or Link</label>
                          <input 
                            type="text"
                            value={cmsEditing.data.spotifyUrl || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, spotifyUrl: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white font-mono"
                            placeholder="e.g. https://open.spotify.com/album/..."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Brief Summary Detail</label>
                          <textarea 
                            value={cmsEditing.data.description || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, description: e.target.value }})}
                            rows={2}
                            className="w-full p-2.5 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                            placeholder="Describe track accolades or highlights..."
                          />
                        </div>

                        {/* 🎵 Tracks List Management */}
                        <div className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-pink-400 uppercase">🎵 Tracklist Manager ({cmsEditing.data.tracks?.length || 0})</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newTrackItem = {
                                  id: 'track-' + Date.now(),
                                  title: 'New Song Track',
                                  duration: '3:30',
                                  audioUrl: '',
                                  hidden: false,
                                  artist: cmsEditing.data.artist || 'BTS',
                                  albumName: cmsEditing.data.title || '',
                                  coverUrl: cmsEditing.data.coverUrl || '',
                                  description: '',
                                  genre: 'Pop / K-Pop',
                                  releaseDate: cmsEditing.data.year || '',
                                  spotifyUrl: '',
                                  youtubeUrl: '',
                                  appleMusicUrl: '',
                                  soundCloudUrl: '',
                                  customExternalUrl: ''
                                };
                                const list = [...(cmsEditing.data.tracks || []), newTrackItem];
                                setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                showToast('New track draft added! 💜', 'success');
                              }}
                              className="px-2 py-1 bg-purple-900/40 hover:bg-purple-800 text-[10px] font-mono text-purple-300 hover:text-white rounded border border-purple-500/30 flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Add Song
                            </button>
                          </div>

                          <div className="space-y-4 max-h-120 overflow-y-auto pr-1">
                            {(!cmsEditing.data.tracks || cmsEditing.data.tracks.length === 0) ? (
                              <p className="text-[10px] text-slate-500 font-sans italic text-center py-4">No tracks listed yet in this album catalog.</p>
                            ) : (
                              cmsEditing.data.tracks.map((track: any, trackIdx: number) => (
                                <div key={track.id || trackIdx} className="p-3.5 border border-purple-500/15 rounded-xl bg-[#0a0513]/70 space-y-3 relative">
                                  
                                  {/* Title & Duration Header Row */}
                                  <div className="flex gap-2 items-center">
                                    <div className="flex-grow space-y-1">
                                      <input
                                        type="text"
                                        placeholder="Song Title"
                                        value={track.title}
                                        onChange={(e) => {
                                          const list = [...cmsEditing.data.tracks];
                                          list[trackIdx] = { ...list[trackIdx], title: e.target.value };
                                          setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                        }}
                                        className="w-full bg-transparent border-0 border-b border-purple-500/20 font-bold text-[#faf5ff] text-xs focus:outline-none focus:border-purple-400 p-0"
                                      />
                                    </div>
                                    <div className="w-16">
                                      <input
                                        type="text"
                                        placeholder="3:45"
                                        value={track.duration || ''}
                                        onChange={(e) => {
                                          const list = [...cmsEditing.data.tracks];
                                          list[trackIdx] = { ...list[trackIdx], duration: e.target.value };
                                          setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                        }}
                                        className="w-full bg-transparent border-0 border-b border-purple-500/20 text-right text-[11px] text-slate-450 focus:outline-none focus:border-purple-400 font-mono p-0"
                                      />
                                    </div>
                                  </div>

                                  {/* Direct Audio Row (Input + Uploader) */}
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex-grow">
                                      <input
                                        type="text"
                                        placeholder="Direct Audio link (MP3 / WAV)"
                                        value={track.audioUrl || ''}
                                        onChange={(e) => {
                                          const list = [...cmsEditing.data.tracks];
                                          list[trackIdx] = { ...list[trackIdx], audioUrl: e.target.value };
                                          setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                        }}
                                        className="w-full px-2 py-1 bg-black/50 text-[10px] text-purple-300 font-mono border border-purple-500/10 rounded focus:outline-none focus:border-purple-400"
                                      />
                                    </div>

                                    {/* Direct device upload input button */}
                                    <div className="relative shrink-0">
                                      <input
                                        type="file"
                                        id={`track-uploader-${trackIdx}`}
                                        accept="audio/mp3,audio/wav,audio/aac,audio/flac,audio/mpeg,audio/*"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          showToast(`Preparing file upload for ${file.name}... 📡`, 'info');
                                          try {
                                            const reader = new FileReader();
                                            reader.onload = async (event) => {
                                              try {
                                                const base64 = event.target?.result as string;
                                                const res = await fetch('/api/admin/media/upload', {
                                                  method: 'POST',
                                                  headers: {
                                                    'Content-Type': 'application/json',
                                                    'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                                                  },
                                                  body: JSON.stringify({
                                                    filename: file.name,
                                                    name: file.name,
                                                    type: file.type || 'audio/mpeg',
                                                    size: `${Math.round(file.size / 1024)} KB`,
                                                    base64: base64,
                                                    category: 'Music'
                                                  })
                                                });
                                                if (res.ok) {
                                                  const uploadedFile = await res.json();
                                                  const list = [...cmsEditing.data.tracks];
                                                  list[trackIdx] = { ...list[trackIdx], audioUrl: uploadedFile.url };
                                                  setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                                  showToast('Audio file uploaded and linked successfully! 💜', 'success');
                                                } else {
                                                  const errData = await res.json();
                                                  showToast(`Upload failed: ${errData.error || 'Server error'}`, 'error');
                                                }
                                              } catch (err: any) {
                                                showToast(`Upload processing erred: ${err.message}`, 'error');
                                              }
                                            };
                                            reader.readAsDataURL(file);
                                          } catch (err: any) {
                                            showToast(`File reading errored: ${err.message}`, 'error');
                                          }
                                        }}
                                        className="hidden"
                                      />
                                      <label
                                        htmlFor={`track-uploader-${trackIdx}`}
                                        className="p-1 px-2.5 bg-purple-950/40 hover:bg-purple-900 border border-purple-500/20 rounded cursor-pointer text-[10px] font-mono text-purple-300 hover:text-white flex items-center justify-center h-full transition-all"
                                      >
                                        Upload Sound
                                      </label>
                                    </div>
                                  </div>

                                  {/* Song Cover Section & Release Date & Artist Mapping */}
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-b border-purple-500/5 py-2.5 my-1 bg-black/25 p-2 rounded-lg">
                                    <div>
                                      <label className="text-[9px] font-mono text-purple-400 block uppercase mb-0.5">Artist Name</label>
                                      <input
                                        type="text"
                                        placeholder="Artist Profile"
                                        value={track.artist || ''}
                                        onChange={(e) => {
                                          const list = [...cmsEditing.data.tracks];
                                          list[trackIdx] = { ...list[trackIdx], artist: e.target.value };
                                          setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                        }}
                                        className="w-full px-2 py-1 bg-black/60 text-[10px] text-pink-300 border border-purple-500/5 rounded focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-mono text-purple-400 block uppercase mb-0.5">Album Name</label>
                                      <input
                                        type="text"
                                        placeholder="Album Title"
                                        value={track.albumName || ''}
                                        onChange={(e) => {
                                          const list = [...cmsEditing.data.tracks];
                                          list[trackIdx] = { ...list[trackIdx], albumName: e.target.value };
                                          setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                        }}
                                        className="w-full px-2 py-1 bg-black/60 text-[10px] text-pink-300 border border-purple-500/5 rounded focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-mono text-purple-400 block uppercase mb-0.5">Genre Style</label>
                                      <input
                                        type="text"
                                        placeholder="K-Pop / Synth"
                                        value={track.genre || ''}
                                        onChange={(e) => {
                                          const list = [...cmsEditing.data.tracks];
                                          list[trackIdx] = { ...list[trackIdx], genre: e.target.value };
                                          setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                        }}
                                        className="w-full px-2 py-1 bg-black/60 text-[10px] text-pink-300 border border-purple-500/5 rounded focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  {/* Custom Song cover upload / url */}
                                  <div className="flex gap-2 items-end bg-black/10 p-2 rounded-lg border border-purple-500/5">
                                    <div className="flex-grow">
                                      <label className="text-[9px] font-mono text-purple-400 block uppercase mb-0.5">Release Date</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. June 13, 2013"
                                        value={track.releaseDate || ''}
                                        onChange={(e) => {
                                          const list = [...cmsEditing.data.tracks];
                                          list[trackIdx] = { ...list[trackIdx], releaseDate: e.target.value };
                                          setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                        }}
                                        className="w-full px-1.5 py-0.5 bg-black/50 text-[10px] text-slate-300 border border-purple-500/5 rounded focus:outline-none"
                                      />
                                    </div>
                                    <div className="flex-grow">
                                      <label className="text-[9px] font-mono text-purple-400 block uppercase mb-0.5">Song Cover Artwork</label>
                                      <input
                                        type="text"
                                        placeholder="Cover URL"
                                        value={track.coverUrl || ''}
                                        onChange={(e) => {
                                          const list = [...cmsEditing.data.tracks];
                                          list[trackIdx] = { ...list[trackIdx], coverUrl: e.target.value };
                                          setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                        }}
                                        className="w-full px-1.5 py-0.5 bg-black/50 text-[10px] text-slate-300 border border-purple-500/5 rounded focus:outline-none font-mono"
                                      />
                                    </div>
                                    <div className="relative shrink-0">
                                      <input
                                        type="file"
                                        id={`track-cover-${trackIdx}`}
                                        accept="image/*"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          showToast(`Uploading cover image ${file.name}... 📡`, 'info');
                                          try {
                                            const reader = new FileReader();
                                            reader.onload = async (event) => {
                                              try {
                                                const base64 = event.target?.result as string;
                                                const res = await fetch('/api/admin/media/upload', {
                                                  method: 'POST',
                                                  headers: {
                                                    'Content-Type': 'application/json',
                                                    'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                                                  },
                                                  body: JSON.stringify({
                                                    filename: file.name,
                                                    name: file.name,
                                                    type: file.type || 'image/jpeg',
                                                    size: `${Math.round(file.size / 1024)} KB`,
                                                    base64: base64,
                                                    category: 'Music'
                                                  })
                                                });
                                                if (res.ok) {
                                                  const uploadedFile = await res.json();
                                                  const list = [...cmsEditing.data.tracks];
                                                  list[trackIdx] = { ...list[trackIdx], coverUrl: uploadedFile.url };
                                                  setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                                  showToast('Song cover image uploaded and synced! 💜', 'success');
                                                } else {
                                                  const errData = await res.json();
                                                  showToast(`Upload failed: ${errData.error || 'Server error'}`, 'error');
                                                }
                                              } catch (err: any) {
                                                showToast(`Upload processing erred: ${err.message}`, 'error');
                                              }
                                            };
                                            reader.readAsDataURL(file);
                                          } catch (err: any) {
                                            showToast(`File reading errored: ${err.message}`, 'error');
                                          }
                                        }}
                                        className="hidden"
                                      />
                                      <label
                                        htmlFor={`track-cover-${trackIdx}`}
                                        className="px-2 py-1 bg-purple-950/40 hover:bg-purple-900 border border-purple-500/20 rounded cursor-pointer text-[9px] font-mono text-purple-350 hover:text-white flex items-center justify-center transition-all"
                                      >
                                        Upload Cover
                                      </label>
                                    </div>
                                  </div>

                                  {/* Streaming Links Row */}
                                  <div className="p-2.5 bg-black/40 rounded-lg space-y-2 border border-purple-500/5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-[9px] font-mono text-emerald-400 block uppercase mb-0.5">Spotify Link</label>
                                        <input
                                          type="text"
                                          placeholder="https://open.spotify.com/track/..."
                                          value={track.spotifyUrl || ''}
                                          onChange={(e) => {
                                            const list = [...cmsEditing.data.tracks];
                                            list[trackIdx] = { ...list[trackIdx], spotifyUrl: e.target.value };
                                            setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                          }}
                                          className="w-full px-2 py-0.5 bg-black/60 text-[10px] text-emerald-300 rounded border border-purple-500/5 focus:outline-none font-mono"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[9px] font-mono text-rose-400 block uppercase mb-0.5">YouTube Link</label>
                                        <input
                                          type="text"
                                          placeholder="https://youtube.com/watch?v=..."
                                          value={track.youtubeUrl || ''}
                                          onChange={(e) => {
                                            const list = [...cmsEditing.data.tracks];
                                            list[trackIdx] = { ...list[trackIdx], youtubeUrl: e.target.value };
                                            setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                          }}
                                          className="w-full px-2 py-0.5 bg-black/60 text-[10px] text-rose-300 rounded border border-purple-500/5 focus:outline-none font-mono"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      <div>
                                        <label className="text-[9px] font-mono text-pink-400 block uppercase mb-0.5">Apple Music</label>
                                        <input
                                          type="text"
                                          placeholder="https://music.apple.com/..."
                                          value={track.appleMusicUrl || ''}
                                          onChange={(e) => {
                                            const list = [...cmsEditing.data.tracks];
                                            list[trackIdx] = { ...list[trackIdx], appleMusicUrl: e.target.value };
                                            setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                          }}
                                          className="w-full px-2 py-0.5 bg-black/60 text-[10px] text-pink-300 rounded border border-purple-500/5 focus:outline-none font-mono"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[9px] font-mono text-orange-400 block uppercase mb-0.5">SoundCloud</label>
                                        <input
                                          type="text"
                                          placeholder="https://soundcloud.com/..."
                                          value={track.soundCloudUrl || ''}
                                          onChange={(e) => {
                                            const list = [...cmsEditing.data.tracks];
                                            list[trackIdx] = { ...list[trackIdx], soundCloudUrl: e.target.value };
                                            setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                          }}
                                          className="w-full px-2 py-0.5 bg-black/60 text-[10px] text-orange-300 rounded border border-purple-500/5 focus:outline-none font-mono"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[9px] font-mono text-purple-400 block uppercase mb-0.5">Custom Link</label>
                                        <input
                                          type="text"
                                          placeholder="Any custom external link"
                                          value={track.customExternalUrl || ''}
                                          onChange={(e) => {
                                            const list = [...cmsEditing.data.tracks];
                                            list[trackIdx] = { ...list[trackIdx], customExternalUrl: e.target.value };
                                            setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                          }}
                                          className="w-full px-2 py-0.5 bg-black/60 text-[10px] text-purple-300 rounded border border-purple-500/5 focus:outline-none font-mono"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-mono text-slate-400 block uppercase mb-0.5">Song Description / Lyrics / Note</label>
                                      <textarea
                                        placeholder="Describe track history, milestones, or lyrical themes..."
                                        value={track.description || ''}
                                        onChange={(e) => {
                                          const list = [...cmsEditing.data.tracks];
                                          list[trackIdx] = { ...list[trackIdx], description: e.target.value };
                                          setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                        }}
                                        rows={2}
                                        className="w-full px-2 py-1 bg-black/60 text-[10px] text-slate-305 rounded border border-purple-500/5 focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  {/* Interaction Action Controls Footer Row */}
                                  <div className="flex items-center justify-between pt-1 border-t border-purple-500/5 text-[10px]">
                                    <div className="flex items-center gap-1.55">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const list = [...cmsEditing.data.tracks];
                                          list[trackIdx] = { ...list[trackIdx], hidden: !list[trackIdx].hidden };
                                          setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                        }}
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                                          track.hidden 
                                            ? 'bg-slate-900 border-slate-700 text-slate-500' 
                                            : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                                        }`}
                                      >
                                        {track.hidden ? '● Hidden (Unpublished)' : '● Visible (Published)'}
                                      </button>
                                      <span className="text-slate-600">|</span>
                                      <span className="text-slate-500 font-mono">Move:</span>
                                      <button
                                        type="button"
                                        disabled={trackIdx === 0}
                                        onClick={() => {
                                          const list = [...cmsEditing.data.tracks];
                                          if (trackIdx > 0) {
                                            [list[trackIdx - 1], list[trackIdx]] = [list[trackIdx], list[trackIdx - 1]];
                                            setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                          }
                                        }}
                                        className="text-purple-400 hover:text-white disabled:opacity-30 p-0.5 font-bold"
                                      >
                                        ▲
                                      </button>
                                      <button
                                        type="button"
                                        disabled={trackIdx === cmsEditing.data.tracks.length - 1}
                                        onClick={() => {
                                          const list = [...cmsEditing.data.tracks];
                                          if (trackIdx < list.length - 1) {
                                            [list[trackIdx + 1], list[trackIdx]] = [list[trackIdx], list[trackIdx + 1]];
                                            setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                          }
                                        }}
                                        className="text-purple-400 hover:text-white disabled:opacity-30 p-0.5 font-bold"
                                      >
                                        ▼
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const list = cmsEditing.data.tracks.filter((_: any, tIdx: number) => tIdx !== trackIdx);
                                        setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tracks: list } });
                                        showToast('Track removed from draft.', 'info');
                                      }}
                                      className="text-red-400 hover:text-red-350 font-mono font-bold text-[9px] hover:underline"
                                    >
                                      Delete Track
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Music preview card visualization */}
                      <div className="p-4 bg-purple-950/5 border border-purple-500/10 rounded-xl space-y-3 flex flex-col justify-center">
                        <span className="text-[10px] font-mono uppercase text-purple-400 block font-bold">🖥️ Music Card Live Preview</span>
                        <div className="p-4 bg-[#0c051a] border border-purple-500/10 rounded-xl max-w-sm mx-auto w-full flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-purple-500/20 shrink-0 relative group">
                            <img 
                              src={cmsEditing.data.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'} 
                              alt="Cover" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'; }}
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <span className="text-[9px] font-mono text-purple-300 block uppercase font-bold">{cmsEditing.data.artist || 'BTS'} • {cmsEditing.data.year || '2026'}</span>
                            <h5 className="text-xs font-bold text-white truncate my-0.5">{cmsEditing.data.title || 'Untitled Track'}</h5>
                            <p className="text-[9px] text-slate-400 line-clamp-2 leading-relaxed">{cmsEditing.data.description || 'Enjoy premium stream outputs.'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-500/10">
                      <button 
                        onClick={() => handleCmsSave(false)}
                        className="px-4 py-2 bg-purple-950/40 border border-purple-500/25 hover:border-purple-500/50 text-xs font-mono rounded-xl text-purple-200 transition-all cursor-pointer"
                      >
                        💾 Save Draft
                      </button>
                      <button 
                        onClick={() => handleCmsSave(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-mono rounded-xl text-white font-bold transition-all cursor-pointer"
                      >
                        🚀 Publish Live Instantly
                      </button>
                    </div>
                  </div>
                ) : cmsEditing && cmsEditing.tab === 'Spotlight' ? (
                  <div className="p-6 border border-purple-500/20 bg-[#070311] rounded-2xl space-y-5 font-sans text-stone-200">
                    <div className="flex justify-between items-center pb-3 border-b border-purple-500/10">
                      <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                        ✏️ Edit Monthly Spotlight Content
                      </h4>
                      <button 
                        onClick={() => { setCmsEditing(null); setCmsShowPreview(false); }}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Spotlight Hero Title</label>
                          <input 
                            type="text"
                            value={cmsEditing.data.title || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, title: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                            placeholder="e.g. Yet To Come (The Most Beautiful Moment)"
                          />
                        </div>

                        <SmartImageInput
                          label="Large Spotlight Cover Artwork URL"
                          value={cmsEditing.data.coverUrl || ''}
                          onChange={(val) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, coverUrl: val }})}
                          placeholder="Paste background art URL"
                        />

                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Featured Song Title</label>
                          <input 
                            type="text"
                            value={cmsEditing.data.songTitle || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, songTitle: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                            placeholder="e.g. Yet To Come"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Featured Song Stream URL (MP3)</label>
                          <input 
                            type="text"
                            value={cmsEditing.data.songAudioUrl || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, songAudioUrl: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                            placeholder="e.g. https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-350 font-mono font-bold block uppercase">Featured Album Title</label>
                          <input 
                            type="text"
                            value={cmsEditing.data.albumTitle || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, albumTitle: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                            placeholder="e.g. Proof Anthology"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Performance Stage Video URL (YouTube)</label>
                          <input 
                            type="text"
                            value={cmsEditing.data.performanceUrl || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, performanceUrl: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                            placeholder="e.g. https://www.youtube.com/watch?v=..."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Spotify Playlist / Album URL</label>
                          <input 
                            type="text"
                            value={cmsEditing.data.spotifyUrl || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, spotifyUrl: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                            placeholder="https://open.spotify.com/..."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Detailed Spotlight Narrative</label>
                          <textarea 
                            value={cmsEditing.data.description || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, description: e.target.value }})}
                            rows={4}
                            className="w-full p-2.5 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                            placeholder="Write a custom description of the song/era highlight..."
                          />
                        </div>
                      </div>

                      {/* Right column preview */}
                      <div className="p-5 bg-purple-950/10 rounded-2xl flex flex-col justify-center space-y-4">
                        <span className="text-2xs font-mono uppercase tracking-widest text-pink-400 font-bold">🖥️ Digital Billboard Preview</span>
                        <div className="p-4 bg-black rounded-xl border border-white/5 space-y-3">
                          <img 
                            src={cmsEditing.data.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400'} 
                            alt="Preview" 
                            className="w-24 h-24 rounded-lg object-cover border border-purple-500/20"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400'; }}
                          />
                          <h4 className="text-base font-bold text-white">{cmsEditing.data.title || 'Untitled Spotlight'}</h4>
                          <p className="text-xs text-slate-400">{cmsEditing.data.description || 'No description yet.'}</p>
                          <div className="text-xxs font-mono text-purple-300">
                            🎤 Featured Song: {cmsEditing.data.songTitle || 'Not selected'} • 💿 Album: {cmsEditing.data.albumTitle || 'Not selected'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-500/10">
                      <button 
                        onClick={() => handleCmsSave(false)}
                        className="px-4 py-2 bg-purple-950/40 border border-purple-500/25 hover:border-purple-500/50 text-xs font-mono rounded-xl text-purple-200 transition-all font-bold"
                      >
                        💾 Save Draft
                      </button>
                      <button 
                        onClick={() => handleCmsSave(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-mono rounded-xl text-white font-bold transition-all"
                      >
                        🚀 Publish Live Instantly
                      </button>
                    </div>
                  </div>
                ) : cmsEditing && cmsEditing.tab === 'Eras' ? (
                  <div className="p-6 border border-purple-500/20 bg-[#070311] rounded-2xl space-y-5 font-sans text-stone-200">
                    <div className="flex justify-between items-center pb-3 border-b border-purple-500/10">
                      <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                        {cmsEditing.index === -1 ? '✨ Create BTS Era Definition' : '✏️ Edit BTS Era Definition'}
                      </h4>
                      <button 
                        onClick={() => { setCmsEditing(null); setCmsShowPreview(false); }}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Era Year Selection</label>
                          <select 
                            value={cmsEditing.data.year || '2020'}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, year: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                          >
                            {ERA_YEARS.slice(1).map(y => (
                              <option key={y} value={y}>{y} Era</option>
                            ))}
                          </select>
                        </div>

                        <SmartImageInput
                          label="Era Album Cover Artwork URL"
                          value={cmsEditing.data.coverUrl || ''}
                          onChange={(val) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, coverUrl: val }})}
                          placeholder="Paste cover URL"
                        />

                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Era Narrative Milestone Highlights</label>
                          <textarea 
                            value={cmsEditing.data.description || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, description: e.target.value }})}
                            rows={5}
                            className="w-full p-2.5 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                            placeholder="Write chronological descriptions of album releases, billboard wins, and milestones during this era..."
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-purple-950/10 border border-purple-500/10 rounded-2xl flex flex-col justify-center items-center">
                        <span className="text-[10px] font-mono uppercase text-pink-400 font-bold block mb-3">🖥️ Milestone Banner Mockup</span>
                        <div className="p-5 rounded-2xl bg-[#090515] border border-purple-500/20 max-w-sm flex gap-4">
                          <img 
                            src={cmsEditing.data.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'} 
                            alt="Mock Cover" 
                            className="w-16 h-16 rounded-xl object-cover shrink-0 border border-purple-500/20"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'; }}
                          />
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-purple-300 block uppercase font-bold">Era Selection</span>
                            <h4 className="text-sm font-bold text-white">The {cmsEditing.data.year || '2555'} Chronicles</h4>
                            <p className="text-[10px] text-slate-400 line-clamp-3 leading-relaxed">{cmsEditing.data.description || 'Welcome to this year.'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-500/10">
                      <button 
                        onClick={() => handleCmsSave(false)}
                        className="px-4 py-2 bg-purple-950/40 border border-purple-500/25 hover:border-purple-500/50 text-xs font-mono rounded-xl text-purple-200 transition-all font-bold"
                      >
                        💾 Save Draft
                      </button>
                      <button 
                        onClick={() => handleCmsSave(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-mono rounded-xl text-white font-bold transition-all"
                      >
                        🚀 Publish Live Instantly
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Sub-tab Navigation */}
                    <div className="flex flex-wrap border-b border-purple-500/10 mb-6 pb-2 gap-4">
                      <button
                        onClick={() => setMusicSubTab('digitalTracks')}
                        className={`text-xs font-bold uppercase transition-all pb-2 border-b-2 cursor-pointer select-none ${
                          musicSubTab === 'digitalTracks'
                            ? 'text-pink-400 border-pink-400 font-mono font-bold'
                            : 'text-slate-400 border-transparent hover:text-slate-200'
                        }`}
                      >
                        🎵 Digital Track Listing CMS
                      </button>
                      <button
                        onClick={() => setMusicSubTab('albums')}
                        className={`text-xs font-bold uppercase transition-all pb-2 border-b-2 cursor-pointer select-none ${
                          musicSubTab === 'albums'
                            ? 'text-pink-400 border-pink-400 font-mono font-bold'
                            : 'text-slate-400 border-transparent hover:text-slate-200'
                        }`}
                      >
                        💿 Discographies & Featured Albums
                      </button>
                      <button
                        onClick={() => setMusicSubTab('playlists')}
                        className={`text-xs font-bold uppercase transition-all pb-2 border-b-2 cursor-pointer select-none ${
                          musicSubTab === 'playlists'
                            ? 'text-pink-400 border-pink-400 font-mono font-bold'
                            : 'text-slate-400 border-transparent hover:text-slate-200'
                        }`}
                      >
                        📁 Playlist Collections CMS
                      </button>
                      <button
                        onClick={() => setMusicSubTab('liveStream')}
                        className={`text-xs font-bold uppercase transition-all pb-2 border-b-2 cursor-pointer select-none ${
                          musicSubTab === 'liveStream'
                            ? 'text-pink-400 border-pink-400 font-mono font-bold'
                            : 'text-slate-400 border-transparent hover:text-slate-200'
                        }`}
                      >
                        📡 Live FM Broadcasting
                      </button>
                      <button
                        onClick={() => setMusicSubTab('spotlight')}
                        className={`text-xs font-bold uppercase transition-all pb-2 border-b-2 cursor-pointer select-none ${
                          musicSubTab === 'spotlight'
                            ? 'text-pink-400 border-pink-400 font-mono font-bold'
                            : 'text-slate-400 border-transparent hover:text-slate-200'
                        }`}
                      >
                        ⭐️ Spotlight CMS
                      </button>
                      <button
                        onClick={() => setMusicSubTab('eras')}
                        className={`text-xs font-bold uppercase transition-all pb-2 border-b-2 cursor-pointer select-none ${
                          musicSubTab === 'eras'
                            ? 'text-pink-400 border-pink-400 font-mono font-bold'
                            : 'text-slate-400 border-transparent hover:text-slate-200'
                        }`}
                      >
                        ⏳ BTS Chronicles Eras CMS
                      </button>
                    </div>

                    {musicSubTab === 'albums' && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-white uppercase font-sans">Music Library & Covers</h3>
                            <p className="text-xs text-slate-400 font-sans mt-0.5">Update sound stream details, Spotify playlist embeds, or direct cover images.</p>
                          </div>
                          <button
                            onClick={() => setCmsEditing({
                              tab: 'Music',
                              index: -1,
                              data: {
                                id: 'album-' + Date.now(),
                                title: 'New Album Track',
                                year: new Date().getFullYear().toString(),
                                artist: 'BTS',
                                coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
                                description: 'Bespoke independent music record listing.',
                                spotifyUrl: '',
                                tracks: []
                              }
                            })}
                            className="p-1 px-3 border border-purple-500/25 bg-purple-950/20 text-xs text-purple-400 rounded hover:bg-purple-950/40 transition-all font-mono font-bold flex items-center gap-1 cursor-pointer select-none"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Album
                          </button>
                        </div>

                        {/* Spotify Dynamic Embedded Players Controller */}
                        <div className="p-5 border border-purple-500/15 rounded-2xl bg-[#120a1c]/65 space-y-5 shadow-lg">
                          <div className="flex justify-between items-center border-b border-purple-500/10 pb-3">
                            <div>
                              <h4 className="text-xs font-bold text-purple-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                                🎵 Manage Spotify Home Embed Players
                              </h4>
                              <p className="text-[10px] text-slate-400 mt-1">
                                Customize and reorder the Spotify music embeds shown on the home page.
                              </p>
                            </div>
                            {!showAddSpotifyForm && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSpotifyEmbedId(null);
                                  setSpotifyEmbedForm({ title: '', badge: '', url: '', color: 'purple' });
                                  setShowAddSpotifyForm(true);
                                }}
                                className="px-3 py-1 bg-purple-950/40 hover:bg-purple-900/45 border border-purple-500/20 text-xs font-mono font-bold text-purple-300 rounded-lg transition-all flex items-center gap-1 cursor-pointer select-none"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Player
                              </button>
                            )}
                          </div>

                          {/* Add / Edit Form */}
                          {showAddSpotifyForm && (
                            <div className="p-4 border border-purple-500/10 bg-[#090515]/80 rounded-xl space-y-4">
                              <h5 className="text-[11px] font-bold font-mono uppercase tracking-wider text-purple-400 flex items-center gap-1">
                                {editingSpotifyEmbedId ? '📝 Edit Spotify Player' : '➕ Add New Spotify Player'}
                              </h5>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-mono text-purple-200 uppercase tracking-wider">Player Title</label>
                                  <input
                                    type="text"
                                    value={spotifyEmbedForm.title}
                                    onChange={(e) => setSpotifyEmbedForm({ ...spotifyEmbedForm, title: e.target.value })}
                                    placeholder="e.g., Feature Album"
                                    className="w-full px-3 py-2 bg-black/40 border border-purple-500/15 rounded-lg text-xs text-white focus:outline-none focus:border-purple-400"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-mono text-purple-200 uppercase tracking-wider">Badge Text</label>
                                  <input
                                    type="text"
                                    value={spotifyEmbedForm.badge}
                                    onChange={(e) => setSpotifyEmbedForm({ ...spotifyEmbedForm, badge: e.target.value })}
                                    placeholder="e.g., Spotify Spotlight"
                                    className="w-full px-3 py-2 bg-black/40 border border-purple-500/15 rounded-lg text-xs text-white focus:outline-none focus:border-purple-400"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] font-mono text-purple-200 uppercase tracking-wider">Spotify URL / Share Link / Iframe Code</label>
                                <input
                                  type="text"
                                  value={spotifyEmbedForm.url}
                                  onChange={(e) => setSpotifyEmbedForm({ ...spotifyEmbedForm, url: e.target.value })}
                                  placeholder="Paste Spotify Link or Iframe Code (e.g., https://open.spotify.com/album/...)"
                                  className="w-full px-3 py-2 bg-black/40 border border-purple-500/15 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] font-mono text-purple-200 uppercase tracking-wider">Accent Color Theme</label>
                                <select
                                  value={spotifyEmbedForm.color}
                                  onChange={(e) => setSpotifyEmbedForm({ ...spotifyEmbedForm, color: e.target.value })}
                                  className="w-full px-3 py-2 bg-black/40 border border-purple-500/15 rounded-lg text-xs text-white focus:outline-none focus:border-purple-400"
                                >
                                  <option value="purple">💜 Purple</option>
                                  <option value="pink">💖 Pink</option>
                                  <option value="indigo">💙 Indigo</option>
                                  <option value="rose">🌹 Rose</option>
                                  <option value="teal">🟢 Teal</option>
                                  <option value="emerald">💚 Emerald</option>
                                  <option value="cyan">💎 Cyan</option>
                                  <option value="amber">💛 Amber</option>
                                  <option value="fuchsia">💝 Fuchsia</option>
                                </select>
                              </div>

                              <div className="flex justify-end gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAddSpotifyForm(false);
                                    setEditingSpotifyEmbedId(null);
                                    setSpotifyEmbedForm({ title: '', badge: '', url: '', color: 'purple' });
                                  }}
                                  className="px-3 py-1.5 bg-black/45 hover:bg-black/60 border border-white/5 text-slate-300 text-xs rounded-lg font-mono transition-all cursor-pointer select-none"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentEmbeds = Array.isArray(draftConfig.spotifyEmbeds) ? draftConfig.spotifyEmbeds : [
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
                                    
                                    if (!spotifyEmbedForm.title || !spotifyEmbedForm.url) {
                                      showToast('Please fill in both Player Title and URL. 💜', 'error');
                                      return;
                                    }

                                    let updatedList = [];
                                    if (editingSpotifyEmbedId) {
                                      // Editing existing
                                      updatedList = currentEmbeds.map((item: any) => {
                                        if (item.id === editingSpotifyEmbedId) {
                                          return {
                                            ...item,
                                            title: spotifyEmbedForm.title,
                                            badge: spotifyEmbedForm.badge,
                                            url: spotifyEmbedForm.url,
                                            color: spotifyEmbedForm.color
                                          };
                                        }
                                        return item;
                                      });
                                    } else {
                                      // Adding new
                                      const newEmbed = {
                                        id: 'embed-' + Date.now(),
                                        title: spotifyEmbedForm.title,
                                        badge: spotifyEmbedForm.badge,
                                        url: spotifyEmbedForm.url,
                                        color: spotifyEmbedForm.color,
                                        order: currentEmbeds.length
                                      };
                                      updatedList = [...currentEmbeds, newEmbed];
                                    }

                                    const updated = {
                                      ...draftConfig,
                                      spotifyEmbeds: updatedList
                                    };
                                    setDraftConfig(updated);
                                    saveDraftConfigToServer(updated);

                                    // Clear state
                                    setEditingSpotifyEmbedId(null);
                                    setSpotifyEmbedForm({ title: '', badge: '', url: '', color: 'purple' });
                                    setShowAddSpotifyForm(false);
                                    showToast('Spotify Player saved to drafts successfully! 💜', 'success');
                                  }}
                                  className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/20 text-purple-300 text-xs rounded-lg font-mono font-bold transition-all cursor-pointer select-none"
                                >
                                  Save Player
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Players List */}
                          <div className="space-y-3">
                            {(() => {
                              const currentEmbeds = Array.isArray(draftConfig.spotifyEmbeds) ? draftConfig.spotifyEmbeds : [
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

                              if (currentEmbeds.length === 0) {
                                return (
                                  <div className="text-center py-6 border border-dashed border-purple-500/10 rounded-xl bg-purple-950/5">
                                    <p className="text-xs text-slate-500 font-mono">No Spotify Players configured. Home page will hide this section.</p>
                                  </div>
                                );
                              }

                              return currentEmbeds.map((item: any, idx: number) => {
                                const colorColor = item.color === 'pink' ? 'border-pink-500/20 bg-pink-950/5 text-pink-400' :
                                                   item.color === 'indigo' ? 'border-indigo-500/20 bg-indigo-950/5 text-indigo-400' :
                                                   item.color === 'rose' ? 'border-rose-500/20 bg-rose-950/5 text-rose-400' :
                                                   item.color === 'teal' ? 'border-teal-500/20 bg-teal-950/5 text-teal-400' :
                                                   item.color === 'emerald' ? 'border-emerald-500/20 bg-emerald-950/5 text-emerald-400' :
                                                   item.color === 'cyan' ? 'border-cyan-500/20 bg-cyan-950/5 text-cyan-400' :
                                                   item.color === 'amber' ? 'border-amber-500/20 bg-amber-950/5 text-amber-400' :
                                                   item.color === 'fuchsia' ? 'border-fuchsia-500/20 bg-fuchsia-950/5 text-fuchsia-400' :
                                                   'border-purple-500/20 bg-purple-950/5 text-purple-400';
                                
                                return (
                                  <div key={item.id} className={`p-4 border rounded-xl flex items-center justify-between gap-4 font-sans ${colorColor}`}>
                                    <div className="flex items-center gap-3 flex-grow min-w-0">
                                      <div className="p-2 bg-black/40 rounded-lg shrink-0">
                                        <Music className="w-5 h-5 text-purple-400 animate-pulse" />
                                      </div>
                                      <div className="min-w-0 flex-grow">
                                        <div className="flex items-center gap-2">
                                          <h5 className="text-xs font-bold text-white truncate">{item.title}</h5>
                                          {item.badge && (
                                            <span className="text-[8px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded border border-white/5 uppercase">
                                              {item.badge}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-mono mt-1 truncate max-w-md">{item.url}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                      {/* Order Controls */}
                                      <div className="flex flex-col gap-0.5">
                                        <button
                                          type="button"
                                          onClick={() => moveDraftArrayItem('spotifyEmbeds', idx, 'up')}
                                          disabled={idx === 0}
                                          className="text-[10px] text-slate-400 hover:text-white disabled:opacity-30 p-1 cursor-pointer"
                                          title="Move Up"
                                        >
                                          ▲
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => moveDraftArrayItem('spotifyEmbeds', idx, 'down')}
                                          disabled={idx === currentEmbeds.length - 1}
                                          className="text-[10px] text-slate-400 hover:text-white disabled:opacity-30 p-1 cursor-pointer"
                                          title="Move Down"
                                        >
                                          ▼
                                        </button>
                                      </div>

                                      {/* Action buttons */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingSpotifyEmbedId(item.id);
                                          setSpotifyEmbedForm({
                                            title: item.title || '',
                                            badge: item.badge || '',
                                            url: item.url || '',
                                            color: item.color || 'purple'
                                          });
                                          setShowAddSpotifyForm(true);
                                        }}
                                        className="p-1.5 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/20 text-purple-300 rounded hover:text-white cursor-pointer select-none"
                                        title="Edit Player"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (confirm(`Are you sure you want to delete "${item.title}" player?`)) {
                                            const updatedList = currentEmbeds.filter((embed: any) => embed.id !== item.id).map((embed: any, o: number) => ({
                                              ...embed,
                                              order: o
                                            }));
                                            const updated = {
                                              ...draftConfig,
                                              spotifyEmbeds: updatedList
                                            };
                                            setDraftConfig(updated);
                                            saveDraftConfigToServer(updated);
                                            showToast('Spotify Player deleted successfully from drafts! 💜', 'success');
                                          }
                                        }}
                                        className="p-1.5 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/20 text-rose-300 rounded hover:text-white cursor-pointer select-none"
                                        title="Delete Player"
                                      >
                                        <Trash className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {draftConfig.albums?.map((album: any, idx: number) => (
                            <div key={album.id} className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/10 flex items-center justify-between gap-4 font-sans group relative">
                              <div className="flex items-center gap-3 flex-grow min-w-0">
                                <img src={album.coverUrl} alt={album.title} className="w-12 h-12 rounded-lg object-cover border border-purple-500/10 shrink-0" referrerPolicy="no-referrer" />
                                <div className="min-w-0 flex-grow">
                                  <h5 className="text-xs font-bold text-white truncate">{album.title}</h5>
                                  <p className="text-[10px] text-purple-400 font-mono mt-0.5">Year: {album.year || '2026'} • Artist: {album.artist || 'BTS'}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-1">
                                  <button 
                                    onClick={() => moveDraftArrayItem('albums', idx, 'up')}
                                    disabled={idx === 0}
                                    className="text-[10px] text-purple-400 hover:text-white disabled:opacity-30 cursor-pointer p-0.5 animate-none border-0 select-none"
                                  >
                                    ▲
                                  </button>
                                  <button 
                                    onClick={() => moveDraftArrayItem('albums', idx, 'down')}
                                    disabled={idx === draftConfig.albums.length - 1}
                                    className="text-[10px] text-purple-400 hover:text-white disabled:opacity-30 cursor-pointer p-0.5 animate-none border-0 select-none"
                                  >
                                    ▼
                                  </button>
                                </div>

                                <button 
                                  onClick={() => setCmsEditing({ tab: 'Music', index: idx, data: { ...album } })}
                                  className="p-1.5 bg-purple-900/40 hover:bg-purple-800 text-purple-200 hover:text-white border border-purple-500/25 rounded cursor-pointer text-xs select-none"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => deleteDraftArrayItem('albums', idx)}
                                  className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-white border border-red-500/25 rounded cursor-pointer text-xs select-none"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {musicSubTab === 'digitalTracks' && (
                      <div className="space-y-4 font-sans animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-white uppercase font-sans">Digital Track Listing CMS</h3>
                            <p className="text-xs text-slate-400 font-sans mt-0.5">Manage global song titles, direct streaming audio uploads, and official Spotify tracking links.</p>
                          </div>
                          <button
                            onClick={() => setCmsEditing({
                              tab: 'DigitalTracks',
                              index: -1,
                              data: {
                                id: 'dt-' + Date.now(),
                                title: 'New Track',
                                artist: 'BTS',
                                album: 'Digital Single',
                                coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
                                audioUrl: '',
                                duration: '3:30',
                                spotifyUrl: '',
                                youtubeUrl: '',
                                externalUrl: '',
                                published: true,
                                genre: '2020',
                                order: (draftConfig.digitalTracks?.length || 0) + 1
                              }
                            })}
                            className="p-1 px-3 border border-purple-500/25 bg-purple-950/20 text-xs text-purple-400 rounded hover:bg-purple-950/40 transition-all font-mono font-bold flex items-center gap-1 cursor-pointer select-none"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add New Track
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(draftConfig.digitalTracks || []).map((track: any, idx: number) => (
                            <div key={track.id} className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/10 flex items-center justify-between gap-4 font-sans group relative">
                              <div className="flex items-center gap-3 flex-grow min-w-0">
                                <img src={track.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'} alt={track.title} className="w-12 h-12 rounded-lg object-cover border border-purple-500/10 shrink-0" referrerPolicy="no-referrer" />
                                <div className="min-w-0 flex-grow">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                    <h5 className="text-xs font-bold text-white truncate">{track.title}</h5>
                                    {track.published === false ? (
                                      <span className="shrink-0 px-1.5 py-0.5 text-[8px] font-mono leading-none bg-red-950/40 border border-red-500/30 rounded text-red-400 uppercase font-bold">Draft</span>
                                    ) : (
                                      <span className="shrink-0 px-1.5 py-0.5 text-[8px] font-mono leading-none bg-purple-950/40 border border-purple-500/30 rounded text-purple-400 uppercase font-bold">Live</span>
                                    )}
                                    {track.isSpotlight && (
                                      <span className="shrink-0 px-1.5 py-0.5 text-[8px] font-mono leading-none bg-amber-500 text-black font-bold rounded uppercase">🌟 Spotlight</span>
                                    )}
                                    {track.isPinned && (
                                      <span className="shrink-0 px-1.5 py-0.5 text-[8px] font-mono leading-none bg-indigo-600 text-white font-bold rounded uppercase">📌 Pinned</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-purple-400 font-mono mt-0.5">Artist: {track.artist || 'BTS'} • Album: {track.album || ''}</p>
                                  {track.audioUrl ? (
                                    <p className="text-[9px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">🎵 Direct Audio Uploaded</p>
                                  ) : (
                                    <p className="text-[9px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">🔗 Spotify Remote Link</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Spotlight and Pin controls */}
                                <div className="flex flex-col gap-1 shrink-0">
                                  <button 
                                    onClick={async () => {
                                      const isCurrentlyPinned = !!track.isPinned;
                                      const action = isCurrentlyPinned ? 'unpin' : 'pin';
                                      try {
                                        const res = await fetch('/api/music/user-action', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ action, trackId: track.id, adminToken: token || localStorage.getItem('bts_admin_token') })
                                        });
                                        if (res.ok) {
                                          showToast(isCurrentlyPinned ? 'Track unpinned.' : 'Track pinned! 📌', 'success');
                                          fetchConfigs();
                                        } else {
                                          showToast('Failed to change pin state.', 'error');
                                        }
                                      } catch (err) {
                                        showToast('Network error toggling pin.', 'error');
                                      }
                                    }}
                                    className={`px-1.5 py-0.5 text-[9px] font-mono rounded-md cursor-pointer border select-none text-center ${
                                      track.isPinned 
                                        ? 'bg-purple-600/35 border-purple-500 text-purple-200' 
                                        : 'bg-black/40 border-purple-500/10 text-slate-400 hover:text-white hover:bg-black/60'
                                    }`}
                                  >
                                    📌 {track.isPinned ? 'Unpin' : 'Pin'}
                                  </button>

                                  <button 
                                    onClick={async () => {
                                      const isCurrentlySpotlight = !!track.isSpotlight;
                                      const action = isCurrentlySpotlight ? 'unspotlight' : 'spotlight';
                                      try {
                                        const res = await fetch('/api/music/user-action', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ action, trackId: track.id, adminToken: token || localStorage.getItem('bts_admin_token') })
                                        });
                                        if (res.ok) {
                                          showToast(isCurrentlySpotlight ? 'Spotlight cleared.' : 'Track set as exclusive Spotlight! 🌟', 'success');
                                          fetchConfigs();
                                        } else {
                                          showToast('Failed to change spotlight state.', 'error');
                                        }
                                      } catch (err) {
                                        showToast('Network error toggling spotlight.', 'error');
                                      }
                                    }}
                                    className={`px-1.5 py-0.5 text-[9px] font-mono rounded-md cursor-pointer border select-none text-center ${
                                      track.isSpotlight 
                                        ? 'bg-amber-500/25 border-amber-500 text-amber-200 animate-pulse font-bold' 
                                        : 'bg-black/40 border-purple-500/10 text-slate-400 hover:text-white hover:bg-black/60'
                                    }`}
                                  >
                                    🌟 {track.isSpotlight ? 'Active' : 'Spotlight'}
                                  </button>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <button 
                                    onClick={() => moveDraftArrayItem('digitalTracks', idx, 'up')}
                                    disabled={idx === 0}
                                    className="text-[10px] text-purple-400 hover:text-white disabled:opacity-30 cursor-pointer p-0.5 animate-none border-0 select-none"
                                  >
                                    ▲
                                  </button>
                                  <button 
                                    onClick={() => moveDraftArrayItem('digitalTracks', idx, 'down')}
                                    disabled={idx === (draftConfig.digitalTracks?.length || 0) - 1}
                                    className="text-[10px] text-purple-400 hover:text-white disabled:opacity-30 cursor-pointer p-0.5 animate-none border-0 select-none"
                                  >
                                    ▼
                                  </button>
                                </div>

                                <button 
                                  onClick={() => setCmsEditing({ tab: 'DigitalTracks', index: idx, data: { ...track } })}
                                  className="p-1.5 bg-purple-900/40 hover:bg-purple-800 text-[#d4d4d8] hover:text-white border border-purple-500/25 rounded cursor-pointer text-xs select-none"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => deleteDraftArrayItem('digitalTracks', idx)}
                                  className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-white border border-red-500/25 rounded cursor-pointer text-xs select-none"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {(draftConfig.digitalTracks || []).length === 0 && (
                          <div className="text-center py-12 p-6 border border-dashed border-purple-500/10 rounded-xl bg-purple-950/5">
                            <Music className="w-8 h-8 text-purple-600 mx-auto animate-pulse mb-2" />
                            <p className="text-xs text-slate-400 font-sans">No tracks added yet. Click "Add New Track" above to seed your first CMS track!</p>
                          </div>
                        )}
                      </div>
                    )}

                    {musicSubTab === 'liveStream' && (
                      <div className="space-y-6 animate-fadeIn font-sans">
                        <div>
                          <h3 className="text-lg font-bold text-white uppercase font-sans">📺 Global Live FM Streaming Settings</h3>
                          <p className="text-xs text-slate-400 font-sans mt-0.5">Configure live broadcast toggles, titles, streaming audio, and banner cards instantly.</p>
                        </div>

                        <div className="p-6 border border-purple-500/10 rounded-2xl bg-purple-950/10 space-y-4 max-w-3xl">
                          <div className="flex items-center justify-between pb-3 border-b border-purple-500/10">
                            <span className="text-xs font-mono font-bold text-pink-400 uppercase">Stream Broadcaster Controls</span>
                            <div className="flex items-center gap-2">
                              {draftConfig.liveStream?.isLive ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                              ) : null}
                              <button
                                onClick={() => {
                                  const updated = { 
                                    ...draftConfig.liveStream, 
                                    isLive: !draftConfig.liveStream?.isLive 
                                  };
                                  setDraftConfig({ ...draftConfig, liveStream: updated });
                                  showToast(updated.isLive ? 'Live broadcast toggled ON! 📡' : 'Broadcast toggled OFFLINE.', 'info');
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all select-none cursor-pointer ${
                                  draftConfig.liveStream?.isLive 
                                    ? 'bg-red-600 hover:bg-red-500 text-white' 
                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                }`}
                              >
                                {draftConfig.liveStream?.isLive ? '✓ BROADCAST IS LIVE' : 'GO LIVE ON AIR'}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Broadcast Title</label>
                                <input 
                                  type="text"
                                  value={draftConfig.liveStream?.title || ''}
                                  onChange={(e) => setDraftConfig({ 
                                    ...draftConfig, 
                                    liveStream: { ...draftConfig.liveStream, title: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                                  placeholder="e.g. BTS PROOF Live Stage"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Cover Image Thumbnail URL</label>
                                <input 
                                  type="text"
                                  value={draftConfig.liveStream?.coverUrl || ''}
                                  onChange={(e) => setDraftConfig({ 
                                    ...draftConfig, 
                                    liveStream: { ...draftConfig.liveStream, coverUrl: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white font-mono"
                                  placeholder="Image link..."
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Streaming Audio Path / MP3 URL</label>
                              <input 
                                type="text"
                                value={draftConfig.liveStream?.audioUrl || ''}
                                onChange={(e) => setDraftConfig({ 
                                  ...draftConfig, 
                                  liveStream: { ...draftConfig.liveStream, audioUrl: e.target.value }
                                })}
                                className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white font-mono"
                                placeholder="Clean Audio MP3 file URL..."
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Broadcaster description</label>
                              <textarea 
                                value={draftConfig.liveStream?.description || ''}
                                onChange={(e) => setDraftConfig({ 
                                  ...draftConfig, 
                                  liveStream: { ...draftConfig.liveStream, description: e.target.value }
                                })}
                                rows={3}
                                className="w-full p-3 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                                placeholder="Detailed stream description for fans..."
                              />
                            </div>
                          </div>

                          <div className="pt-2 flex justify-end gap-3">
                            <button
                              onClick={async () => {
                                showToast('Publishing live stream changes... 📡', 'info');
                                try {
                                  // 1. Save draft configuration to server first
                                  const draftRes = await fetch('/api/config/draft', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                                    },
                                    body: JSON.stringify(draftConfig)
                                  });
                                  if (!draftRes.ok) throw new Error('Save draft failed');

                                  // 2. Trigger live compile and clearance of cache
                                  const res = await fetch('/api/config/publish', {
                                    method: 'POST',
                                    headers: {
                                      'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                                    }
                                  });
                                  if (res.ok) {
                                    showToast('Live Radio Stream updated on live site instantly! 📻💜', 'success');
                                    const pubRep = await fetch('/api/config/published');
                                    if (pubRep.ok) {
                                      setPublishedConfig(sanitizeConfig(await pubRep.json()));
                                    }
                                  } else {
                                    showToast('Draft version saved successfully, but live publishing failed.', 'info');
                                  }
                                } catch {
                                  showToast('Network error publishing settings.', 'error');
                                }
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl text-xs font-mono font-bold text-white shadow-lg transition-all cursor-pointer"
                            >
                              Publish Live Stream Settings Live
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {musicSubTab === 'playlists' && (
                      <div className="space-y-6 animate-fadeIn font-sans">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-white uppercase font-sans">📁 Playlist Collections CMS</h3>
                            <p className="text-xs text-slate-400 font-sans mt-0.5">Group independent CMS tracks into curated, fan-friendly collections.</p>
                          </div>
                          <button
                            onClick={() => {
                              const newPl = {
                                id: 'p-' + Date.now(),
                                title: 'New Playlist Collection',
                                description: 'Festa archives compilation.',
                                coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
                                trackIds: []
                              };
                              const updated = [...(draftConfig.playlists || []), newPl];
                              setDraftConfig({ ...draftConfig, playlists: updated });
                            }}
                            className="p-1 px-3 border border-purple-500/25 bg-purple-950/20 text-xs text-purple-400 rounded hover:bg-purple-950/40 transition-all font-mono font-bold flex items-center gap-1 cursor-pointer select-none"
                          >
                            <Plus className="w-3.5 h-3.5" /> Create Playlist Collection
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {(draftConfig.playlists || []).map((pl: any, plIdx: number) => (
                            <div key={pl.id} className="p-5 border border-purple-500/10 rounded-2xl bg-purple-950/10 space-y-4">
                              <div className="flex gap-4 items-center">
                                <img src={pl.coverUrl} className="w-14 h-14 rounded-lg object-cover border border-purple-500/10 shrink-0" alt="Pl" />
                                <div className="flex-grow min-w-0 space-y-1">
                                  <input 
                                    type="text" 
                                    value={pl.title}
                                    onChange={(e) => {
                                      const copy = [...draftConfig.playlists];
                                      copy[plIdx].title = e.target.value;
                                      setDraftConfig({ ...draftConfig, playlists: copy });
                                    }}
                                    className="w-full bg-black/40 border border-purple-500/10 text-xs font-bold text-white rounded px-2 py-1 focus:border-purple-400 focus:outline-none"
                                  />
                                  <input 
                                    type="text" 
                                    value={pl.description}
                                    onChange={(e) => {
                                      const copy = [...draftConfig.playlists];
                                      copy[plIdx].description = e.target.value;
                                      setDraftConfig({ ...draftConfig, playlists: copy });
                                    }}
                                    className="w-full bg-black/40 border border-purple-500/10 text-[10px] text-slate-300 rounded px-2 py-1 focus:border-purple-400"
                                    placeholder="Brief description..."
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] uppercase font-mono text-purple-300 block font-bold">Select Tracks for this Playlist:</label>
                                <div className="max-h-32 overflow-y-auto space-y-1.5 p-2.5 bg-black/30 rounded-xl border border-white/5">
                                  {(draftConfig.digitalTracks || []).map((track: any) => {
                                    const isChecked = Array.isArray(pl.trackIds) && pl.trackIds.includes(track.id);
                                    return (
                                      <label key={track.id} className="flex items-center gap-2 text-xxs text-slate-300 hover:text-white cursor-pointer select-none">
                                        <input 
                                          type="checkbox" 
                                          checked={isChecked}
                                          onChange={() => {
                                            const copy = [...draftConfig.playlists];
                                            let ids = Array.isArray(copy[plIdx].trackIds) ? [...copy[plIdx].trackIds] : [];
                                            if (isChecked) {
                                              ids = ids.filter((id: string) => id !== track.id);
                                            } else {
                                              ids.push(track.id);
                                            }
                                            copy[plIdx].trackIds = ids;
                                            copy[plIdx].tracksCount = ids.length;
                                            setDraftConfig({ ...draftConfig, playlists: copy });
                                          }}
                                          className="rounded text-purple-600 border-purple-500/20"
                                        />
                                        <span>{track.title} <strong className="text-purple-400 font-mono font-bold">({track.artist})</strong></span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="flex justify-between items-center bg-black/20 p-2 rounded-xl border border-white/5">
                                <input 
                                  type="text" 
                                  value={pl.coverUrl}
                                  onChange={(e) => {
                                    const copy = [...draftConfig.playlists];
                                    copy[plIdx].coverUrl = e.target.value;
                                    setDraftConfig({ ...draftConfig, playlists: copy });
                                  }}
                                  className="bg-transparent border-0 font-mono text-[9px] text-slate-500 w-[180px] shrink-0 overflow-ellipsis"
                                  placeholder="Cover image url..."
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const filtered = draftConfig.playlists.filter((p: any) => p.id !== pl.id);
                                    setDraftConfig({ ...draftConfig, playlists: filtered });
                                    showToast('Playlist collection container removed.', 'info');
                                  }}
                                  className="text-xxs font-mono text-red-400 hover:text-white cursor-pointer hover:bg-red-900/10 px-2 py-1 rounded"
                                >
                                  Delete Collection
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {musicSubTab === 'submissions' && (
                      <div className="space-y-4 animate-fadeIn font-sans text-sans">
                        <div>
                          <h3 className="text-lg font-bold text-white uppercase font-sans">🌌 Community User Submissions</h3>
                          <p className="text-xs text-slate-400 font-sans mt-0.5">Moderate songs submitted by site visitors. Play them to preview, and Approve to clone them into the global listing instantly.</p>
                        </div>

                        <div className="space-y-4">
                          {(!draftConfig.musicSubmissions || draftConfig.musicSubmissions.length === 0) ? (
                            <div className="text-center py-12 border border-dashed border-purple-500/10 rounded-2xl bg-purple-950/5">
                              <Compass className="w-8 h-8 text-neutral-600 mx-auto animate-pulse mb-2" />
                              <p className="text-xs text-slate-500 font-mono">No new user song pitches/submissions found for review. Beautifully quiet!</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {draftConfig.musicSubmissions.map((sub: any) => (
                                <div key={sub.id} className="p-4 border border-purple-500/10 rounded-2xl bg-[#090515]/70 hover:bg-[#120822]/40 transition-all space-y-3">
                                  <div className="flex gap-3.5 items-start">
                                    <img src={sub.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'} className="w-12 h-12 object-cover rounded-lg border border-purple-500/15 shrink-0" alt="cover" />
                                    <div className="min-w-0 flex-grow">
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-bold text-white truncate leading-tight">{sub.title}</h4>
                                        <span className={`shrink-0 px-1 py-0.5 rounded text-[8px] font-mono leading-none font-bold uppercase ${
                                          sub.status === 'approved' 
                                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                            : sub.status === 'rejected'
                                            ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                                            : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-500'
                                        }`}>
                                          {sub.status || 'Pending'}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-purple-400 font-mono mt-0.5">By: {sub.artist} (User: {sub.displayName || 'Guest'})</p>
                                      <p className="text-[10px] text-slate-350 italic line-clamp-1 mt-0.5">"{sub.description || 'Pitched song'}"</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between gap-3 bg-black/30 p-2 rounded-xl border border-white/5">
                                    
                                    {/* Play preview handler */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const customTrackObj = {
                                          id: sub.id,
                                          title: sub.title,
                                          artist: sub.artist || 'ARMY Sub',
                                          duration: sub.duration || '3:30',
                                          audioUrl: sub.audioUrl || '',
                                          album: 'User Music Submission',
                                          coverUrl: sub.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'
                                        };
                                        const customAlbumObj = {
                                          id: 'album-sub-temp',
                                          title: 'User Music Pitch Preview',
                                          artist: 'ARMY archives',
                                          year: '2026',
                                          coverUrl: sub.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
                                          tracks: [customTrackObj]
                                        };
                                        // Play direct track globally inside preview player
                                        audioContext.playTrack(customTrackObj, customAlbumObj, true);
                                        showToast('Playing user submission preview... 🎧', 'info');
                                      }}
                                      className="px-2.5 py-1 rounded bg-purple-500/10 text-purple-400 hover:text-white hover:bg-purple-600 text-xxs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 block"
                                    >
                                      <Play className="w-3 h-3 fill-current" /> Play Preview
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCmsEditing({
                                          tab: 'DigitalTracks',
                                          index: -1,
                                          data: {
                                            id: 'dt-' + Date.now(),
                                            title: sub.title || '',
                                            artist: sub.artist || 'BTS',
                                            album: sub.albumName || 'ARMY Archives',
                                            coverUrl: sub.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
                                            audioUrl: sub.audioUrl || '',
                                            duration: sub.duration || '3:30',
                                            spotifyUrl: sub.spotifyUrl || '',
                                            youtubeUrl: sub.youtubeUrl || '',
                                            externalUrl: sub.spotifyUrl || sub.youtubeUrl || '',
                                            published: true,
                                            lyrics: sub.lyrics || '',
                                            description: sub.description || '',
                                            genre: sub.genre || '2020',
                                            tags: sub.tags || [],
                                            order: (draftConfig.digitalTracks?.length || 0) + 1
                                          }
                                        });
                                        showToast('Copied submission data to Track CMS Editor! 💜✏️', 'info');
                                      }}
                                      className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 hover:text-white hover:bg-blue-600 text-xxs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 block"
                                    >
                                      ✏️ Edit Before Publish
                                    </button>

                                    {sub.status === 'pending' && (
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            showToast('Approving song track... 💜', 'info');
                                            try {
                                              const res = await fetch(`/api/music/submissions/${sub.id}/approve`, {
                                                method: 'POST',
                                                headers: {
                                                  'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                                                }
                                              });
                                              if (res.ok) {
                                                showToast('Track approved and published successfully live! 💜🎉', 'success');
                                                onPublishSuccess();
                                                // Trigger config update pulls
                                                const pullRes = await fetch('/api/config/draft');
                                                if (pullRes.ok) {
                                                  const data = await pullRes.json();
                                                  setDraftConfig(data);
                                                }
                                              }
                                            } catch {
                                              showToast('Approval request failed.', 'error');
                                            }
                                          }}
                                          className="p-1 px-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xxs font-mono font-bold cursor-pointer"
                                        >
                                          Approve [Publish Live]
                                        </button>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            try {
                                              const res = await fetch(`/api/music/submissions/${sub.id}/reject`, {
                                                method: 'POST',
                                                headers: {
                                                  'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                                                }
                                              });
                                              if (res.ok) {
                                                showToast('Submission marked rejected.', 'info');
                                                onPublishSuccess();
                                                // refresh draft config
                                                const pullRes = await fetch('/api/config/draft');
                                                if (pullRes.ok) {
                                                  const data = await pullRes.json();
                                                  setDraftConfig(data);
                                                }
                                              }
                                            } catch {
                                              showToast('Reject failed.', 'error');
                                            }
                                          }}
                                          className="p-1 px-2.5 rounded bg-red-950 hover:bg-red-900 border border-red-500/20 text-red-400 hover:text-white text-xxs font-mono font-bold cursor-pointer"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    )}

                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (!window.confirm('Are you sure you want to delete this submission completely?')) return;
                                        try {
                                          const res = await fetch(`/api/music/submissions/${sub.id}`, {
                                            method: 'DELETE',
                                            headers: {
                                              'x-admin-token': token || localStorage.getItem('bts_admin_token') || ''
                                            }
                                          });
                                          if (res.ok) {
                                            showToast('Submission deleted completely.', 'info');
                                            onPublishSuccess();
                                            // refresh draft config
                                            const pullRes = await fetch('/api/config/draft');
                                            if (pullRes.ok) {
                                              const data = await pullRes.json();
                                              setDraftConfig(data);
                                            }
                                          }
                                        } catch {
                                          showToast('Delete failed.', 'error');
                                        }
                                      }}
                                      className="text-[10px] text-slate-500 hover:text-rose-400 font-mono font-bold p-1 cursor-pointer hover:underline"
                                    >
                                      Delete
                                    </button>

                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {musicSubTab === 'spotlight' && (
                      <div className="space-y-6 animate-fadeIn font-sans">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-white uppercase font-sans">✨ Monthly Spotlight Controller</h3>
                            <p className="text-xs text-slate-400 font-sans mt-0.5">Completely manage the premium banner highlight card on the front home. Change titles, streams, Spotify details and descriptions instantly.</p>
                          </div>
                          <button
                            onClick={() => setCmsEditing({
                              tab: 'Spotlight',
                              index: 0,
                              data: draftConfig.monthlySpotlight || {
                                title: 'Yet To Come (The Most Beautiful Moment)',
                                coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
                                description: 'Our beautiful moment is yet to come...',
                                songTitle: 'Yet To Come',
                                albumTitle: 'Proof Anthology',
                                performanceUrl: 'https://www.youtube.com/watch?v=kXpOEzNZ8hQ',
                                songAudioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                                spotifyUrl: 'https://open.spotify.com/album/6ge6UorC2gS90at9676v79'
                              }
                            })}
                            className="p-1 px-3 border border-purple-500/25 bg-purple-950/20 text-xs text-purple-400 rounded hover:bg-purple-950/40 transition-all font-mono font-bold flex items-center gap-1 cursor-pointer select-none"
                          >
                            ✏️ Edit Spotlight Details
                          </button>
                        </div>

                        {draftConfig.monthlySpotlight ? (
                          <div className="p-5 border border-purple-500/10 rounded-2xl bg-gradient-to-r from-[#150a2f] to-[#080313] flex flex-col md:flex-row gap-6 items-center">
                            <img src={draftConfig.monthlySpotlight.coverUrl} className="w-32 h-32 rounded-xl object-cover border border-purple-500/20 shadow-2xl" alt="Spotlight" />
                            <div className="space-y-2 flex-grow">
                              <h4 className="text-lg font-extrabold text-white">{draftConfig.monthlySpotlight.title}</h4>
                              <p className="text-xs text-slate-350 leading-relaxed max-w-xl">{draftConfig.monthlySpotlight.description}</p>
                              <div className="flex flex-wrap gap-2 pt-1">
                                <span className="bg-purple-900/30 px-2 py-0.5 rounded text-[10px] font-mono text-purple-300">Track: {draftConfig.monthlySpotlight.songTitle}</span>
                                <span className="bg-purple-900/30 px-2 py-0.5 rounded text-[10px] font-mono text-purple-300">Album: {draftConfig.monthlySpotlight.albumTitle}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 border border-dashed border-purple-500/10 rounded-2xl bg-purple-950/5 text-center">
                            <p className="text-xs text-slate-400 font-mono">No customized Spotlight loaded. Using default template values.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {musicSubTab === 'eras' && (
                      <div className="space-y-6 animate-fadeIn font-sans">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-white uppercase font-sans">⏳ BTS Era Timeline Chronicles Management</h3>
                            <p className="text-xs text-slate-400 font-sans mt-0.5">Describe chronological milestones, wins, and custom description banners for each year from 2013-2026.</p>
                          </div>
                          <button
                            onClick={() => setCmsEditing({
                              tab: 'Eras',
                              index: -1,
                              data: {
                                year: '2020',
                                description: '',
                                coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'
                              }
                            })}
                            className="p-1 px-3 border border-purple-500/25 bg-purple-950/20 text-xs text-purple-400 rounded hover:bg-purple-950/40 transition-all font-mono font-bold flex items-center gap-1 cursor-pointer select-none"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Era Milestone
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(draftConfig.eras || []).map((era: any, idx: number) => (
                            <div key={era.year || idx} className="p-4 border border-purple-500/10 rounded-2xl bg-purple-950/10 flex items-center justify-between gap-4">
                              <div className="flex gap-3 items-center min-w-0 flex-grow">
                                <img src={era.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'} className="w-12 h-12 rounded-lg object-cover border border-purple-500/10 shrink-0" alt="era" />
                                <div className="min-w-0 flex-grow">
                                  <h4 className="text-xs font-extrabold text-white font-sans uppercase">The {era.year} Chronicles</h4>
                                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{era.description || 'Custom milestones described.'}</p>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setCmsEditing({ tab: 'Eras', index: idx, data: { ...era } })}
                                  className="p-1 px-2.5 bg-purple-900/40 text-purple-200 hover:text-white rounded border border-purple-500/20 text-xs cursor-pointer select-none"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteDraftArrayItem('eras', idx)}
                                  className="p-1 px-2.5 bg-red-950/40 text-red-400 hover:text-white rounded border border-red-500/20 text-xs cursor-pointer select-none"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT: VIDEOS */}
            {activeAdminTab === 'Videos' && (
              <div className="space-y-6 animate-fade-in">
                {cmsEditing && cmsEditing.tab === 'Videos' ? (
                  <div className="p-6 border border-purple-500/20 bg-black/40 rounded-2xl space-y-5 font-sans text-stone-200">
                    <div className="flex justify-between items-center pb-3 border-b border-purple-500/10">
                      <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                        {cmsEditing.index === -1 ? '✨ Add New Video Record' : '✏️ Edit Video Record'}
                      </h4>
                      <button 
                        onClick={() => { setCmsEditing(null); setCmsShowPreview(false); }}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Video Title</label>
                          <input 
                            type="text"
                            value={cmsEditing.data.title || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, title: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white focus:outline-none"
                            placeholder="e.g. BTS Yet To Come Special Performance"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">YouTube URL / Iframe Embed Code</label>
                          <input 
                            type="text"
                            value={cmsEditing.data.url || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, url: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-purple-300 font-mono"
                            placeholder="e.g. https://www.youtube.com/watch?v=gdZLi9oWNZg or full <iframe> code"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Publish Date</label>
                            <input 
                              type="text"
                              value={cmsEditing.data.uploadedAt || ''}
                              onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, uploadedAt: e.target.value }})}
                              className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                              placeholder="e.g. Jun 13, 2026"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Category</label>
                            <input 
                              type="text"
                              value={cmsEditing.data.category || ''}
                              onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, category: e.target.value }})}
                              className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                              placeholder="e.g. MV / Stage / Live"
                            />
                          </div>
                        </div>

                        <SmartImageInput
                          label="Custom Video Thumbnail URL (Optional/Leave Blank for Autoplay Fallback)"
                          value={cmsEditing.data.imageUrl || ''}
                          onChange={(val) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, imageUrl: val }})}
                          placeholder="Paste image address, or leave empty to autoguide from youtube thumbnail"
                        />

                        {/* PublishCheckbox */}
                        <div className="flex items-center gap-2 pt-1">
                          <input 
                            type="checkbox"
                            id="video-published"
                            checked={cmsEditing.data.published !== false}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, published: e.target.checked }})}
                            className="w-4 h-4 rounded border-purple-500/20 bg-[#090515] focus:ring-0 checked:bg-purple-600 focus:outline-none cursor-pointer"
                          />
                          <label htmlFor="video-published" className="text-xs text-purple-300 font-mono font-bold uppercase select-none cursor-pointer">
                            Publish Video Feed (Show in Home Page and Video cinema)
                          </label>
                        </div>
                      </div>

                      {/* Video Live Preview inside admin */}
                      <div className="p-4 bg-purple-950/5 border border-purple-500/10 rounded-xl space-y-3 flex flex-col justify-center">
                        <span className="text-[10px] font-mono uppercase text-purple-450 block font-bold">🖥️ Video Player Live Preview</span>
                        <div className="bg-[#0c051a] rounded-xl overflow-hidden border border-purple-500/20 w-full flex flex-col justify-between shadow-lg">
                          <div className="aspect-video relative bg-black flex items-center justify-center">
                            {cmsEditing.data.url ? (
                              <iframe 
                                src={`${getYoutubeEmbedUrl(cmsEditing.data.url)}?autoplay=0&muted=1`} 
                                title="Preview"
                                className="absolute inset-0 w-full h-full"
                                allowFullScreen
                              />
                            ) : (
                              <span className="text-xs text-gray-500 uppercase font-mono">No video URL entered</span>
                            )}
                          </div>
                          <div className="p-4 space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold uppercase">{cmsEditing.data.category || 'MV'}</span>
                              <span className="text-purple-300">{cmsEditing.data.uploadedAt || 'Release Date'}</span>
                            </div>
                            <h5 className="text-xs font-bold text-white truncate">{cmsEditing.data.title || 'Draft Video Title'}</h5>
                            <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{cmsEditing.data.description || 'Write details about this video release.'}</p>
                            <div className="text-[9px] font-mono flex items-center gap-1.5 mt-2">
                              <span className={`w-2 h-2 rounded-full ${cmsEditing.data.published !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <span className={cmsEditing.data.published !== false ? 'text-emerald-400' : 'text-red-400'}>
                                {cmsEditing.data.published !== false ? 'PUBLISHED (LIVE)' : 'UNPUBLISHED (HIDDEN)'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Video Description</label>
                      <textarea 
                        value={cmsEditing.data.description || ''}
                        onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, description: e.target.value }})}
                        rows={3}
                        className="w-full p-2.5 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white focus:outline-none"
                        placeholder="Write dynamic descriptions about this release..."
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-500/10">
                      <button 
                        onClick={() => handleCmsSave(false)}
                        className="px-4 py-2 bg-purple-950/40 border border-purple-500/25 hover:border-purple-500/50 text-xs font-mono rounded-xl text-purple-200 transition-all cursor-pointer font-bold"
                      >
                        💾 Save Draft
                      </button>
                      <button 
                        onClick={() => handleCmsSave(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-mono rounded-xl text-white font-bold transition-all cursor-pointer font-bold"
                      >
                        🚀 Publish Live Instantly
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Sub Tab selection switcher */}
                    <div className="flex bg-black/45 p-1 rounded-xl border border-white/5 gap-1.5 max-w-md mb-6">
                      <button
                        type="button"
                        onClick={() => setVideosAdminTab('catalog')}
                        className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                          videosAdminTab === 'catalog'
                            ? 'bg-purple-600/30 text-purple-200 border border-purple-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        📂 Manage Stream Catalog
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVideosAdminTab('submissions');
                          fetchVideoSubmissions();
                        }}
                        className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          videosAdminTab === 'submissions'
                            ? 'bg-purple-600/30 text-purple-200 border border-purple-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        📬 Submissions Queue Inbox
                        {videoSubmissions.length > 0 && (
                          <span className="px-1.5 py-0.2 bg-purple-500 text-white rounded-full text-[9px] animate-pulse">
                            {videoSubmissions.length}
                          </span>
                        )}
                      </button>
                    </div>

                    {videosAdminTab === 'catalog' ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-white uppercase font-sans">YouTube & Video Stream Portal</h3>
                            <p className="text-xs text-slate-400 font-sans mt-0.5">Control feed video clips, embed codes, and configure release dates showing on Home and streams.</p>
                          </div>
                          <button
                            onClick={() => setCmsEditing({
                              tab: 'Videos',
                              index: -1,
                              data: {
                                id: 'vid-' + Date.now(),
                                title: 'BTS (방탄소년단) "Yet To Come" Special Hall Performance',
                                description: 'The spectacular visual comeback track of BTS inside the grand hall.',
                                url: 'https://www.youtube.com/watch?v=gdZLi9oWNZg',
                                category: 'MV',
                                uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                                published: true
                              }
                            })}
                            className="p-1 px-3 border border-purple-500/25 bg-purple-950/20 text-xs text-purple-400 rounded hover:bg-purple-950/40 font-mono font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Create Video
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {draftConfig.videos?.map((vid: any, idx: number) => {
                            const videoId = getYoutubeVideoId(vid.url || '');
                            const displayThumb = vid.imageUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300');
                            const isPinned = draftConfig?.featuredVideoId === vid.id;
                            
                            return (
                              <div key={vid.id} className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/10 flex items-center justify-between gap-4 font-sans/95 font-sans">
                                <div className="min-w-0 flex-grow flex items-center gap-3">
                                  <img src={displayThumb} alt={vid.title} className="w-12 h-12 rounded object-cover shrink-0 border border-purple-500/15" />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 uppercase font-bold">{vid.category || 'MV'}</span>
                                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${vid.published !== false ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-500'}`}>
                                        {vid.published !== false ? 'Live' : 'Hidden'}
                                      </span>
                                      {isPinned && (
                                        <span className="text-[9px] font-sans px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-extrabold uppercase animate-pulse flex items-center gap-0.5">
                                          📌 SPOTLIGHT
                                        </span>
                                      )}
                                    </div>
                                    <h5 className="text-xs font-bold text-white truncate mt-1.5">{vid.title}</h5>
                                    <p className="text-[10px] text-slate-400 font-mono">{vid.uploadedAt || vid.date || 'No release date'}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="flex flex-col gap-1.5">
                                    <button 
                                      onClick={() => moveDraftArrayItem('videos', idx, 'up')}
                                      disabled={idx === 0}
                                      className="text-[10px] text-purple-400 hover:text-white disabled:opacity-30 cursor-pointer p-0.5"
                                    >
                                      ▲
                                    </button>
                                    <button 
                                      onClick={() => moveDraftArrayItem('videos', idx, 'down')}
                                      disabled={idx === draftConfig.videos.length - 1}
                                      className="text-[10px] text-purple-400 hover:text-white disabled:opacity-30 cursor-pointer p-0.5"
                                    >
                                      ▼
                                    </button>
                                  </div>

                                  <button 
                                    onClick={() => handleSetFeaturedVideo(vid.id)}
                                    className={`p-1.5 border rounded-lg cursor-pointer text-xs font-semibold font-sans transition-all flex items-center justify-center gap-1 ${
                                      isPinned 
                                        ? 'bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]' 
                                        : 'bg-white/5 border-purple-500/10 text-purple-300 hover:bg-purple-900/30 hover:text-white hover:border-purple-500/30'
                                    }`}
                                    title={isPinned ? "Currently Spotlighted / Pinned Video" : "Pin as Spotlighted / Pinned Video"}
                                  >
                                    <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current text-amber-400 rotate-12 animate-bounce' : 'text-purple-400'}`} style={{ animationDuration: '3s' }} />
                                    <span>{isPinned ? 'Spotlighted' : 'Pin'}</span>
                                  </button>

                                  <button 
                                    onClick={() => setCmsEditing({ tab: 'Videos', index: idx, data: { ...vid } })}
                                    className="p-1.5 bg-purple-900/40 hover:bg-purple-800 text-purple-200 hover:text-white border border-purple-500/25 rounded cursor-pointer text-xs font-semibold font-sans"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => deleteDraftArrayItem('videos', idx)}
                                    className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-white border border-red-500/25 rounded cursor-pointer text-xs font-semibold font-sans"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      // SUBMISSION REVIEW QUEUE INBOX CONTROLS
                      <div className="space-y-4 animate-fadeIn font-sans font-sans">
                        <div>
                          <h3 className="text-lg font-bold text-white uppercase font-sans">📬 Community Video Curation Inbox</h3>
                          <p className="text-xs text-slate-400 font-sans mt-0.5">Evaluate global ARMY video submissions. Confirm video data and approve them into the selected chronological Era timeline instantly.</p>
                        </div>

                        {isLoadingVideoSubs ? (
                          <div className="text-center py-6 font-mono text-xs text-purple-400">
                            Loading sub queue...
                          </div>
                        ) : videoSubmissions.length === 0 ? (
                          <div className="text-center py-12 border border-dashed border-purple-500/10 rounded-2xl bg-purple-950/5">
                            <Compass className="w-8 h-8 text-neutral-600 mx-auto animate-pulse mb-2" />
                            <p className="text-xs text-slate-500 font-mono">No pending community video pitches inside curation queue. Nicely done! 💜</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {videoSubmissions.map((sub: any) => {
                              const ytId = getYoutubeVideoId(sub.youtubeUrl || '');
                              const subThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1542208998-f6dbbb27a72f?w=300';
                              
                              return (
                                <div key={sub.id} className="p-4 border border-purple-500/10 rounded-2xl bg-[#090515]/75 hover:bg-[#120822]/40 transition-all space-y-3 flex flex-col justify-between font-sans">
                                  <div className="flex gap-3.5 items-start">
                                    <div className="w-14 h-14 bg-black/60 rounded-lg overflow-hidden border border-purple-500/15 shrink-0 flex items-center justify-center relative">
                                      {sub.youtubeUrl ? (
                                        <img src={subThumb} className="w-full h-full object-cover" alt="youtube preview" />
                                      ) : (
                                        <Video className="w-6 h-6 text-purple-450" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-grow font-sans">
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-bold text-white truncate leading-tight">{sub.title}</h4>
                                        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] font-mono leading-none font-bold uppercase ${
                                          sub.youtubeUrl ? 'bg-red-500/10 text-red-400 border border-red-550/20' : 'bg-blue-500/10 text-blue-400 border border-blue-550/20'
                                        }`}>
                                          {sub.youtubeUrl ? 'YouTube' : 'Native'}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-purple-300 font-mono mt-1">Era Section: {sub.era} Chronicles</p>
                                      {sub.description && (
                                        <p className="text-[10px] text-slate-400 italic line-clamp-2 mt-1">"{sub.description}"</p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 justify-end">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          const res = await fetch(`/api/video/submissions/${sub.id}/reject`, {
                                            method: 'POST',
                                            headers: { 'x-admin-token': localStorage.getItem('bts_admin_token') || '' }
                                          });
                                          if (res.ok) {
                                            showToast('Community pitch rejected and cleared successfully.', 'info');
                                            fetchVideoSubmissions();
                                          }
                                        } catch (err) {
                                          showToast('System validation error.', 'error');
                                        }
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg bg-red-950/40 text-red-400 hover:text-white hover:bg-red-900 border border-red-500/25 text-xxs font-mono font-bold transition-all cursor-pointer font-sans"
                                    >
                                      Reject Pitches
                                    </button>

                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          const res = await fetch(`/api/video/submissions/${sub.id}/approve`, {
                                            method: 'POST',
                                            headers: { 'x-admin-token': localStorage.getItem('bts_admin_token') || '' }
                                          });
                                          if (res.ok) {
                                            showToast('🎉 Pitch approved and pushed to selected Era Chronicle Live! 💜', 'success');
                                            fetchVideoSubmissions();
                                            fetchConfigs();
                                          } else {
                                            showToast('Approval rejected by host database.', 'error');
                                          }
                                        } catch (err) {
                                          showToast('Validation timeout.', 'error');
                                        }
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:text-white hover:bg-emerald-600 border border-emerald-500/25 text-xxs font-mono font-bold transition-all cursor-pointer font-sans"
                                    >
                                      Approve and Publish
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT: GALLERY */}
            {activeAdminTab === 'Gallery' && (
              <div className="space-y-6">
                {cmsEditing && cmsEditing.tab === 'Gallery' ? (
                  <div className="p-6 border border-purple-500/20 bg-black/40 rounded-2xl space-y-5 font-sans text-stone-200">
                    <div className="flex justify-between items-center pb-3 border-b border-purple-500/10">
                      <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                        {cmsEditing.index === -1 ? '✨ Add Gallery Image Asset' : '✏️ Edit Gallery Image Asset'}
                      </h4>
                      <button 
                        onClick={() => { setCmsEditing(null); setCmsShowPreview(false); }}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <SmartImageInput
                          label="Image URL / Address"
                          value={cmsEditing.data.url}
                          onChange={(val) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, url: val }})}
                          placeholder="Enter image URL or select from Media Manager"
                        />

                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Image Title / Caption</label>
                          <input 
                            type="text"
                            value={cmsEditing.data.title}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, title: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                            placeholder="e.g. Festa Red Carpet"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Category</label>
                            <select 
                              value={cmsEditing.data.category}
                              onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, category: e.target.value }})}
                              className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white shadow-none"
                            >
                              {['BTS', 'RM', 'Jin', 'SUGA', 'j-hope', 'Jimin', 'V', 'Jung Kook', 'Concert', 'Festa', 'Fan Art'].map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Display Order (Sorting)</label>
                            <input 
                              type="number"
                              value={cmsEditing.data.displayOrder || 0}
                              onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, displayOrder: parseInt(e.target.value) || 0 }})}
                              className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white font-mono"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Description Caption (Optional)</label>
                          <textarea 
                            value={cmsEditing.data.description || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, description: e.target.value }})}
                            rows={2}
                            className="w-full p-2.5 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                            placeholder="Add brief picture description details..."
                          />
                        </div>
                      </div>

                      {/* Side preview tab visualizer */}
                      <div className="p-4 bg-purple-950/5 border border-purple-500/10 rounded-xl space-y-3 flex flex-col justify-center">
                        <span className="text-[10px] font-mono uppercase text-purple-400 block font-bold">🖥️ CMS Real-Time Rendering Preview</span>
                        <div className="border border-white/5 bg-black/40 rounded-lg overflow-hidden flex-grow flex flex-col justify-between aspect-video relative max-w-sm mx-auto">
                          <img 
                            src={cmsEditing.data.url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400'} 
                            alt="Preview"
                            className="w-full h-full object-cover rounded-t-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400';
                            }}
                          />
                          <div className="p-3 bg-[#0d071b] space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-fuchsia-500/15 text-fuchsia-300 block uppercase">
                                {cmsEditing.data.category || 'BTS'}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500 font-bold">Order: {cmsEditing.data.displayOrder || 0}</span>
                            </div>
                            <h5 className="text-xs font-bold text-white truncate">{cmsEditing.data.title || 'Untitled Asset'}</h5>
                            {cmsEditing.data.description && (
                              <p className="text-[10px] text-slate-400 line-clamp-1">{cmsEditing.data.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-500/10">
                      <button 
                        onClick={() => handleCmsSave(false)}
                        className="px-4 py-2 bg-purple-950/40 border border-purple-500/25 hover:border-purple-500/50 hover:bg-purple-900/40 text-xs font-mono rounded-xl text-purple-200 hover:text-white cursor-pointer transition-all"
                      >
                        💾 Save Draft
                      </button>
                      <button 
                        onClick={() => handleCmsSave(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-xs font-mono rounded-xl text-white font-bold cursor-pointer transition-all"
                      >
                        🚀 Publish Live Instantly
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white uppercase font-sans">Photo Gallery Collection</h3>
                        <p className="text-xs text-slate-400 font-sans mt-0.5">Create graphic presets, organize folders, or remove images from the media grid.</p>
                      </div>
                      <button
                        onClick={() => setCmsEditing({
                          tab: 'Gallery',
                          index: -1,
                          data: {
                            id: 'gallery-' + Date.now(),
                            url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
                            title: 'New Festa Concept',
                            category: 'BTS',
                            description: '',
                            displayOrder: 0
                          }
                        })}
                        className="p-1 px-3 border border-purple-500/25 bg-purple-950/20 text-xs text-purple-400 rounded hover:bg-purple-950/40 font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Image
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {draftConfig.gallery?.map((img: any, idx: number) => (
                        <div key={img.id} className="p-3 border border-purple-500/10 rounded-xl bg-purple-950/10 flex flex-col justify-between space-y-3 font-sans relative group">
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-purple-500/5 bg-black/40">
                            <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-black/80 py-2 px-3 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setCmsEditing({ tab: 'Gallery', index: idx, data: { ...img } })}
                                className="text-[10px] text-purple-300 hover:text-white font-black cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteDraftArrayItem('gallery', idx)}
                                className="text-[10px] text-red-400 hover:text-red-300 font-black cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-purple-300 font-bold border border-purple-500/20 uppercase">
                              {img.category}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h5 className="text-xs font-bold text-white truncate">{img.title}</h5>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                              <span>Order: {img.displayOrder || 0}</span>
                              <div className="flex gap-1.5">
                                <button 
                                  onClick={() => moveDraftArrayItem('gallery', idx, 'up')}
                                  disabled={idx === 0}
                                  className="text-[11px] text-purple-400 hover:text-white disabled:opacity-30 cursor-pointer"
                                >
                                  ▲
                                </button>
                                <button 
                                  onClick={() => moveDraftArrayItem('gallery', idx, 'down')}
                                  disabled={idx === draftConfig.gallery.length - 1}
                                  className="text-[11px] text-purple-400 hover:text-white disabled:opacity-30 cursor-pointer"
                                >
                                  ▼
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT: EVENTS */}
            {activeAdminTab === 'Events' && (
              <div className="space-y-6">
                {cmsEditing && cmsEditing.tab === 'Events' ? (
                  <div className="p-6 border border-purple-500/20 bg-black/40 rounded-2xl space-y-5 font-sans text-stone-200">
                    <div className="flex justify-between items-center pb-3 border-b border-purple-500/10">
                      <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                        {cmsEditing.index === -1 ? '✨ Add Festa Milestone Event' : '✏️ Edit Feast Milestone Event'}
                      </h4>
                      <button 
                        onClick={() => { setCmsEditing(null); setCmsShowPreview(false); }}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Event Name / Key Theme</label>
                          <input 
                            type="text"
                            value={cmsEditing.data.title}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, title: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                            placeholder="e.g. 13th Anniversary Celebration"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Event Date (e.g. June 13, 2026)</label>
                            <input 
                              type="text"
                              value={cmsEditing.data.date}
                              onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, date: e.target.value }})}
                              className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                              placeholder="e.g. June 13, 2026"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Venue / Physical Location</label>
                            <input 
                              type="text"
                              value={cmsEditing.data.location}
                              onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, location: e.target.value }})}
                              className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                              placeholder="e.g. Seoul Main Stadium"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Event Type</label>
                            <select
                              value={cmsEditing.data.type || 'Upcoming'}
                              onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, type: e.target.value }})}
                              className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                            >
                              <option value="Upcoming">Upcoming</option>
                              <option value="Past">Past</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Event Time (e.g. 18:00 KST)</label>
                            <input 
                              type="text"
                              value={cmsEditing.data.time || '18:00 KST'}
                              onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, time: e.target.value }})}
                              className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                              placeholder="e.g. 18:00 KST"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">D-Day Countdown ISO Target</label>
                          <input 
                            type="text"
                            value={cmsEditing.data.countdownTarget || cmsEditing.data.dDayTarget || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, countdownTarget: e.target.value, dDayTarget: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white font-mono"
                            placeholder="e.g. 2026-06-13T18:00:00+09:00"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Festa Event Description</label>
                          <textarea 
                            value={cmsEditing.data.details || cmsEditing.data.description || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, details: e.target.value, description: e.target.value }})}
                            rows={3}
                            className="w-full p-2.5 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                            placeholder="Write event schedule rundown..."
                          />
                        </div>
                      </div>

                      {/* Event Live Preview Display Card */}
                      <div className="p-4 bg-purple-950/5 border border-purple-500/10 rounded-xl space-y-3 flex flex-col justify-center">
                        <span className="text-[10px] font-mono uppercase text-purple-400 block font-bold">🖥️ FESTA Event Live Preview Card</span>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-[#120822] to-[#04010a] border border-purple-500/20 max-w-sm mx-auto w-full space-y-3.5">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-purple-400/25 text-purple-200 block uppercase w-max">FESTA MAIN SCHEDULE</span>
                              <h5 className="text-sm font-black text-white mt-1">{cmsEditing.data.title || 'Celebrating 13 Years'}</h5>
                            </div>
                            <span className="text-xs font-mono text-purple-400 font-bold shrink-0">{cmsEditing.data.date || '2026-06-13'}</span>
                          </div>

                          <div className="text-[10px] text-stone-300 leading-relaxed bg-black/45 p-2.5 rounded-lg border border-purple-950">
                            <strong>📍 Venue:</strong> {cmsEditing.data.location || 'Seoul Main Stadium'}
                            <p className="mt-1.5 text-stone-400">{cmsEditing.data.details || cmsEditing.data.description || 'Welcome to the ultimate milestone coordination page.'}</p>
                          </div>

                          <div className="bg-purple-950/20 py-2 px-3 border border-purple-500/10 rounded-lg text-center font-mono space-y-0.5">
                            <span className="text-[9px] text-[#93c5fd] font-bold uppercase block">Countdown Active Objective</span>
                            <span className="text-xs text-white tracking-widest font-bold">00d : 00h : 00m : 00s</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-500/10">
                      <button 
                        onClick={() => handleCmsSave(false)}
                        className="px-4 py-2 bg-purple-950/40 border border-purple-500/25 hover:border-purple-500/50 text-xs font-mono rounded-xl text-purple-200 transition-all cursor-pointer"
                      >
                        💾 Save Draft
                      </button>
                      <button 
                        onClick={() => handleCmsSave(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-mono rounded-xl text-white font-bold transition-all cursor-pointer"
                      >
                        🚀 Publish Live Instantly
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white uppercase font-sans">Festa Anniversary Events & Counting Target</h3>
                        <p className="text-xs text-slate-400 font-sans mt-0.5">Control timeline milestone clocks, schedule events, and update the 13 June countdown date tracker.</p>
                      </div>
                      <button
                        onClick={() => setCmsEditing({
                          tab: 'Events',
                          index: -1,
                          data: {
                            id: 'evt-' + Date.now(),
                            title: 'New Festa Coordinate',
                            type: 'Upcoming',
                            date: 'June 13, 2026',
                            time: '18:00 KST',
                            location: 'Seoul Main Stadium',
                            details: 'Celebrating 13 Years with BTS.',
                            description: 'Celebrating 13 Years with BTS.',
                            countdownTarget: '2026-06-13T18:00:00+09:00',
                            dDayTarget: '2026-06-13T18:00:00+09:00'
                          }
                        })}
                        className="p-1 px-3 border border-purple-500/25 bg-purple-950/20 text-xs text-purple-400 rounded hover:bg-purple-950/40 font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Event
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {draftConfig.events?.map((evt: any, idx: number) => (
                        <div key={evt.id} className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/10 flex items-center justify-between gap-4 font-sans">
                          <div className="min-w-0 flex-grow">
                            <span className="text-[9px] font-mono p-1 rounded bg-[#1e152f] text-purple-300 uppercase font-bold border border-purple-500/10">{evt.date}</span>
                            <h5 className="text-sm font-bold text-white truncate mt-2">{evt.title}</h5>
                            <p className="text-xs text-slate-400 truncate mt-0.5">📍 {evt.location}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-1">
                              <button 
                                onClick={() => moveDraftArrayItem('events', idx, 'up')}
                                disabled={idx === 0}
                                className="text-[10px] text-purple-400 hover:text-white disabled:opacity-30 cursor-pointer p-0.5"
                              >
                                ▲
                              </button>
                              <button 
                                onClick={() => moveDraftArrayItem('events', idx, 'down')}
                                disabled={idx === draftConfig.events.length - 1}
                                className="text-[10px] text-purple-400 hover:text-white disabled:opacity-30 cursor-pointer p-0.5"
                              >
                                ▼
                              </button>
                            </div>

                             <button 
                              onClick={() => setCmsEditing({ 
                                tab: 'Events', 
                                index: idx, 
                                data: { 
                                  type: evt.type || 'Upcoming',
                                  time: evt.time || '18:00 KST',
                                  details: evt.details || evt.description || '',
                                  countdownTarget: evt.countdownTarget || evt.dDayTarget || '',
                                  ...evt 
                                } 
                              })}
                              className="p-1.5 bg-purple-900/40 hover:bg-purple-800 text-purple-200 hover:text-white border border-purple-500/25 rounded cursor-pointer text-xs"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => deleteDraftArrayItem('events', idx)}
                              className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-white border border-red-500/25 rounded cursor-pointer text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT: DOWNLOADS */}
            {activeAdminTab === 'Downloads' && (
              <div className="space-y-6">
                {cmsEditing && cmsEditing.tab === 'Downloads' ? (
                  <div className="p-6 border border-purple-500/20 bg-black/40 rounded-2xl space-y-5 font-sans text-stone-200">
                    <div className="flex justify-between items-center pb-3 border-b border-purple-500/10">
                      <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                        {cmsEditing.index === -1 ? '✨ Add Wallpaper / Download File' : '✏️ Edit Wallpaper / Download File'}
                      </h4>
                      <button 
                        onClick={() => { setCmsEditing(null); setCmsShowPreview(false); }}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Wallpaper Title</label>
                          <input 
                            type="text"
                            value={cmsEditing.data.title}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, title: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                            placeholder="e.g. FESTA 2026 Group Shot"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs text-purple-300 font-mono font-bold block uppercase">File Size</label>
                            <input 
                              type="text"
                              value={cmsEditing.data.size}
                              onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, size: e.target.value }})}
                              className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                              placeholder="e.g. 4.5 MB"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Device Class</label>
                            <select 
                              value={cmsEditing.data.category}
                              onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, category: e.target.value }})}
                              className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white pb-3 pt-2"
                            >
                              {['Mobile', 'Desktop', 'Tablet', 'PDF Booklet'].map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <SmartImageInput
                          label="File URL or Image Link"
                          value={cmsEditing.data.url}
                          onChange={(val) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, url: val }})}
                          placeholder="Paste direct wallpaper download link"
                        />
                      </div>

                      {/* Download preview panel */}
                      <div className="p-4 bg-purple-950/5 border border-purple-500/10 rounded-xl space-y-3 flex flex-col justify-center">
                        <span className="text-[10px] font-mono uppercase text-purple-400 block font-bold">🖥️ Wallpaper Live Screen Preview</span>
                        <div className="p-4 bg-[#0d071a] border border-purple-500/10 rounded-xl max-w-sm mx-auto w-full flex items-center gap-3">
                          <div className="w-12 h-16 rounded overflow-hidden border border-purple-500/20 bg-slate-900 shrink-0">
                            <img 
                              src={cmsEditing.data.url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300'} 
                              alt="Wallpaper" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0 flex-grow">
                            <h5 className="text-xs font-bold text-white truncate">{cmsEditing.data.title || 'Exclusive Wallpaper'}</h5>
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Format: {cmsEditing.data.category || 'Mobile'} • Size: {cmsEditing.data.size || '4.5 MB'}</p>
                            <span className="text-[9px] text-[#22c55e] font-mono font-bold block mt-1">Ready for Fast Link Download</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-500/10">
                      <button 
                        onClick={() => handleCmsSave(false)}
                        className="px-4 py-2 bg-purple-950/40 border border-purple-500/25 hover:border-purple-500/50 text-xs font-mono rounded-xl text-purple-200 transition-all cursor-pointer"
                      >
                        💾 Save Draft
                      </button>
                      <button 
                        onClick={() => handleCmsSave(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-mono rounded-xl text-white font-bold transition-all cursor-pointer"
                      >
                        🚀 Publish Live Instantly
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white uppercase font-sans">Downloads Wallpapers Store</h3>
                        <p className="text-xs text-slate-400 font-sans mt-0.5">Configure device background files, size formats, and file access paths.</p>
                      </div>
                      <button
                        onClick={() => setCmsEditing({
                          tab: 'Downloads',
                          index: -1,
                          data: {
                            id: 'dl-' + Date.now(),
                            title: 'Exclusive Wallpaper',
                            category: 'Mobile',
                            size: '4.5 MB',
                            url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200'
                          }
                        })}
                        className="p-1 px-3 border border-purple-500/25 bg-purple-950/20 text-xs text-purple-400 rounded hover:bg-purple-950/40 font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Wallpaper File
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {draftConfig.downloads?.map((item: any, idx: number) => (
                        <div key={item.id} className="p-3 border border-purple-500/10 rounded-xl bg-purple-950/10 flex items-center justify-between gap-4 font-sans justify-between">
                          <div className="flex items-center gap-3 shrink min-w-0 flex-grow">
                            <img src={item.url} alt={item.title} className="w-10 h-14 rounded object-cover border border-purple-500/10 shrink-0" />
                            <div className="min-w-0 flex-grow">
                              <h5 className="text-xs font-bold text-stone-200 truncate">{item.title}</h5>
                              <p className="text-[10px] text-purple-400 font-mono mt-0.5">{item.category} • {item.size}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-1.5">
                              <button 
                                onClick={() => moveDraftArrayItem('downloads', idx, 'up')}
                                disabled={idx === 0}
                                className="text-[10px] text-purple-400 hover:text-white disabled:opacity-30 cursor-pointer p-0.5"
                              >
                                ▲
                              </button>
                              <button 
                                onClick={() => moveDraftArrayItem('downloads', idx, 'down')}
                                disabled={idx === draftConfig.downloads.length - 1}
                                className="text-[10px] text-purple-400 hover:text-white disabled:opacity-30 cursor-pointer p-0.5"
                              >
                                ▼
                              </button>
                            </div>

                            <button 
                              onClick={() => setCmsEditing({ tab: 'Downloads', index: idx, data: { ...item } })}
                              className="p-1.5 bg-purple-900/40 hover:bg-purple-800 text-purple-200 hover:text-white border border-purple-500/25 rounded cursor-pointer text-xs"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => deleteDraftArrayItem('downloads', idx)}
                              className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-white border border-red-500/25 rounded cursor-pointer text-xs"
                            >
                              Delete
                            </button>
                          </div>
                      </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT: NEWS */}
            {activeAdminTab === 'News' && (
              <div className="space-y-6">
                {cmsEditing && cmsEditing.tab === 'News' ? (
                  <div className="p-6 border border-purple-500/20 bg-black/40 rounded-2xl space-y-5 font-sans text-stone-200">
                    <div className="flex justify-between items-center pb-3 border-b border-purple-500/10">
                      <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                        {cmsEditing.index === -1 ? '✨ Draft News Announcement' : '✏️ Edit News Article'}
                      </h4>
                      <button 
                        onClick={() => { setCmsEditing(null); setCmsShowPreview(false); }}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Article Title</label>
                          <input 
                            type="text"
                            value={cmsEditing.data.title || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, title: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                            placeholder="e.g. FESTA Official Timeline Released"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Publish Date</label>
                            <input 
                              type="text"
                              value={cmsEditing.data.date || ''}
                              onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, date: e.target.value }})}
                              className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white font-mono"
                              placeholder="e.g. Jun 13, 2026"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Tag / Category</label>
                            <input 
                              type="text"
                              value={cmsEditing.data.category || ''}
                              onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, category: e.target.value }})}
                              className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white"
                              placeholder="e.g. Announcement"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">News Article Link (Read More Link)</label>
                          <input 
                            type="text"
                            value={cmsEditing.data.link || ''}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, link: e.target.value }})}
                            className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-purple-300 font-mono"
                            placeholder="e.g. https://weverse.io/news/12345"
                          />
                        </div>

                        <SmartImageInput
                          label="Featured Image URL"
                          value={cmsEditing.data.imageUrl || ''}
                          onChange={(val) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, imageUrl: val }})}
                          placeholder="Paste header image URL link"
                        />

                        {/* News Publish Status Checklist */}
                        <div className="flex items-center gap-2 pt-1">
                          <input 
                            type="checkbox"
                            id="news-published"
                            checked={cmsEditing.data.published !== false}
                            onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, published: e.target.checked }})}
                            className="w-4 h-4 rounded border-purple-500/20 bg-[#090515] focus:ring-0 checked:bg-purple-600 focus:outline-none cursor-pointer"
                          />
                          <label htmlFor="news-published" className="text-xs text-purple-300 font-mono font-bold uppercase select-none cursor-pointer">
                            Publish News Item (Show in Live Home Feed)
                          </label>
                        </div>
                      </div>

                      {/* News Card Live Preview */}
                      <div className="p-4 bg-purple-950/5 border border-purple-500/10 rounded-xl space-y-3 flex flex-col justify-center">
                        <span className="text-[10px] font-mono uppercase text-purple-400 block font-bold">🖥️ News Card Live Preview</span>
                        <div className="bg-[#0c051a] rounded-xl overflow-hidden border border-purple-500/20 max-w-sm mx-auto w-full flex flex-col justify-between">
                          <img 
                            src={cmsEditing.data.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'} 
                            alt="News" 
                            className="w-full aspect-video object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="p-4 space-y-2">
                            <div className="flex justify-between items-center text-[9px] font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase font-bold">{cmsEditing.data.category || 'Announcement'}</span>
                              <span className="text-[#94a3b8]">{cmsEditing.data.date || 'Jun 13, 2026'}</span>
                            </div>
                            <h5 className="text-xs font-bold text-white leading-snug line-clamp-2">{cmsEditing.data.title || 'Draft Article Title'}</h5>
                            <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{cmsEditing.data.summary || 'Write awesome content context.'}</p>
                            {cmsEditing.data.link && (
                              <div className="text-[9px] font-mono text-purple-400 font-bold block truncate">
                                🔗 {cmsEditing.data.link}
                              </div>
                            )}
                            <div className="text-[9px] font-mono flex items-center gap-1.5 mt-2 pt-1 border-t border-purple-500/10">
                              <span className={`w-2 h-2 rounded-full ${cmsEditing.data.published !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <span className={cmsEditing.data.published !== false ? 'text-emerald-400' : 'text-red-400'}>
                                {cmsEditing.data.published !== false ? 'PUBLISHED (LIVE)' : 'UNPUBLISHED (HIDDEN)'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Article Summary snippet</label>
                      <textarea 
                        value={cmsEditing.data.summary || ''}
                        onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, summary: e.target.value }})}
                        rows={3}
                        className="w-full p-2.5 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white focus:outline-none"
                        placeholder="Write brief hook statement..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Auto-Generated Slug</label>
                        <input 
                          type="text"
                          value={cmsEditing.data.slug || cmsEditing.data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || ''}
                          readOnly
                          className="w-full px-3 py-2 bg-[#05020a] border border-purple-500/10 rounded-lg text-xs text-purple-400 font-mono focus:outline-none"
                          placeholder="auto-generated-slug-from-title"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Article Tags (Comma separated)</label>
                        <input 
                          type="text"
                          value={cmsEditing.data.tags ? (Array.isArray(cmsEditing.data.tags) ? cmsEditing.data.tags.join(', ') : cmsEditing.data.tags) : ''}
                          onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, tags: e.target.value.split(',').map((t: string) => t.trim()) }})}
                          className="w-full px-3 py-2 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white focus:outline-none"
                          placeholder="e.g. BTS, V, Celine, Fashion"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-purple-300 font-mono font-bold block uppercase">SEO Meta Description (for search engines & sharing previews)</label>
                      <textarea 
                        value={cmsEditing.data.seoDescription || ''}
                        onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, seoDescription: e.target.value }})}
                        rows={2}
                        className="w-full p-2.5 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white focus:outline-none"
                        placeholder="Write a highly optimized description for search previews (e.g. Google, Twitter, Facebook)"
                      />
                    </div>

                    <SmartImageInput
                      label="Wide Banner Featured Image URL (Optional)"
                      value={cmsEditing.data.featuredImage || ''}
                      onChange={(val) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, featuredImage: val }})}
                      placeholder="Paste wide banner image URL link"
                    />

                    {/* News Gallery Segment */}
                    <div className="space-y-3 p-4 border border-purple-500/10 rounded-xl bg-purple-950/5 mt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-mono font-bold text-purple-300 uppercase block">Article Image Gallery (2–10 Images)</h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">Upload or paste URLs for images to show inside the article gallery.</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 bg-purple-950 px-2 py-0.5 rounded font-bold">
                          {cmsEditing.data.gallery?.length || 0} / 10
                        </span>
                      </div>

                      <div className="space-y-3">
                        {(cmsEditing.data.gallery || []).map((imgUrl: string, gIdx: number) => (
                          <div key={gIdx} className="flex items-start gap-3 bg-black/20 p-3 rounded-lg border border-purple-500/5">
                            <div className="flex-grow">
                              <SmartImageInput
                                label={`Gallery Image #${gIdx + 1}`}
                                value={imgUrl || ''}
                                onChange={(val) => {
                                  const nextGallery = [...(cmsEditing.data.gallery || [])];
                                  nextGallery[gIdx] = val;
                                  setCmsEditing({
                                    ...cmsEditing,
                                    data: { ...cmsEditing.data, gallery: nextGallery }
                                  });
                                }}
                                placeholder="Paste gallery image URL link"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const nextGallery = (cmsEditing.data.gallery || []).filter((_: any, i: number) => i !== gIdx);
                                setCmsEditing({
                                  ...cmsEditing,
                                  data: { ...cmsEditing.data, gallery: nextGallery }
                                });
                              }}
                              className="mt-6 p-1 bg-red-950/50 hover:bg-red-900 border border-red-500/20 rounded text-red-400 hover:text-white text-[10px] font-bold cursor-pointer font-mono shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>

                      {(!cmsEditing.data.gallery || cmsEditing.data.gallery.length < 10) && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextGallery = [...(cmsEditing.data.gallery || []), ''];
                            setCmsEditing({
                              ...cmsEditing,
                              data: { ...cmsEditing.data, gallery: nextGallery }
                            });
                          }}
                          className="w-full py-2 bg-purple-900/30 hover:bg-purple-800/40 border border-purple-500/20 rounded-xl text-purple-300 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Gallery Image ({2 - (cmsEditing.data.gallery?.length || 0) > 0 ? `need ${2 - (cmsEditing.data.gallery?.length || 0)} more` : `${10 - (cmsEditing.data.gallery?.length || 0)} slots left`})
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Full Article Content (Markdown or HTML supported)</label>
                      <textarea 
                        value={cmsEditing.data.content || ''}
                        onChange={(e) => setCmsEditing({ ...cmsEditing, data: { ...cmsEditing.data, content: e.target.value }})}
                        rows={8}
                        className="w-full p-2.5 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white focus:outline-none font-sans leading-relaxed"
                        placeholder="Write full article body content details..."
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-500/10">
                      <button 
                        onClick={() => handleCmsSave(false)}
                        className="px-4 py-2 bg-purple-950/40 border border-purple-500/25 hover:border-purple-500/50 text-xs font-mono rounded-xl text-purple-200 transition-all cursor-pointer font-bold"
                      >
                        💾 Save Draft
                      </button>
                      <button 
                        onClick={() => handleCmsSave(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-mono rounded-xl text-white font-bold transition-all cursor-pointer font-bold"
                      >
                        🚀 Publish Live Instantly
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white uppercase font-sans">News Feed Articles</h3>
                        <p className="text-xs text-slate-400 font-sans mt-0.5">Write news feeds, specify dates, titles, and tags loop.</p>
                      </div>
                      <button
                        onClick={() => setCmsEditing({
                          tab: 'News',
                          index: -1,
                          data: {
                            id: 'news-' + Date.now(),
                            title: 'Upcoming FESTA Updates',
                            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                            category: 'Announcement',
                            summary: 'BTS official staff welcomes general registration for community feedback arrays.',
                            imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600',
                            link: '',
                            published: true
                          }
                        })}
                        className="p-1 px-3 border border-purple-500/25 bg-purple-950/20 text-xs text-purple-400 rounded hover:bg-purple-950/40 font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create news
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {draftConfig.news?.map((n: any, idx: number) => (
                        <div key={n.id} className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/10 flex items-center justify-between gap-4 font-sans">
                          <div className="min-w-0 flex-grow flex items-center gap-3">
                            <img src={n.imageUrl} alt={n.title} className="w-12 h-12 rounded object-cover shrink-0 border border-purple-500/15" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 uppercase font-bold">{n.category}</span>
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${n.published !== false ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-500'}`}>
                                  {n.published !== false ? 'Live' : 'Hidden'}
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-white truncate mt-1.5">{n.title}</h5>
                              <p className="text-[10px] text-slate-400 font-mono">{n.date}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-1.5">
                              <button 
                                onClick={() => moveDraftArrayItem('news', idx, 'up')}
                                disabled={idx === 0}
                                className="text-[10px] text-purple-400 hover:text-white disabled:opacity-30 cursor-pointer p-0.5"
                              >
                                ▲
                              </button>
                              <button 
                                onClick={() => moveDraftArrayItem('news', idx, 'down')}
                                disabled={idx === draftConfig.news.length - 1}
                                className="text-[10px] text-purple-400 hover:text-white disabled:opacity-30 cursor-pointer p-0.5"
                              >
                                ▼
                              </button>
                            </div>

                            <button 
                              onClick={() => setCmsEditing({ tab: 'News', index: idx, data: { ...n } })}
                              className="p-1.5 bg-purple-900/40 hover:bg-purple-800 text-purple-200 hover:text-white border border-purple-500/25 rounded cursor-pointer text-xs font-semibold"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => deleteDraftArrayItem('news', idx)}
                              className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-white border border-red-500/25 rounded cursor-pointer text-xs font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Related Topics Manager */}
                    <div className="mt-8 p-5 border border-purple-500/10 rounded-xl bg-purple-950/5 space-y-4 font-sans">
                      <div>
                        <h4 className="text-xs font-mono font-bold text-purple-300 uppercase block">🔗 Related News Topics / Links</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Edit side-menu trending links displayed inside the Gazette portal (supports custom titles, hashtags, or external URLs like https://bangtangallery.online/faq).</p>
                      </div>

                      <div className="space-y-2">
                        {(draftConfig.newsRelatedTopics && draftConfig.newsRelatedTopics.length > 0 ? draftConfig.newsRelatedTopics : [
                          "2026 Reunion Tour Planning",
                          "Exclusive Photoshoots",
                          "FESTA Multi-City Exhibitions",
                          "https://bangtangallery.online/faq"
                        ]).map((topic: string, idx: number) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={topic || ''}
                              onChange={(e) => {
                                const defaultTopics = [
                                  "2026 Reunion Tour Planning",
                                  "Exclusive Photoshoots",
                                  "FESTA Multi-City Exhibitions",
                                  "https://bangtangallery.online/faq"
                                ];
                                const nextTopics = [...(draftConfig.newsRelatedTopics && draftConfig.newsRelatedTopics.length > 0 ? draftConfig.newsRelatedTopics : defaultTopics)];
                                nextTopics[idx] = e.target.value;
                                updateDraft('newsRelatedTopics', null, nextTopics);
                              }}
                              placeholder="e.g. 2026 Reunion Tour Planning"
                              className="flex-grow px-3 py-1.5 bg-[#090515] border border-purple-500/15 rounded-lg text-xs text-white font-mono font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const defaultTopics = [
                                  "2026 Reunion Tour Planning",
                                  "Exclusive Photoshoots",
                                  "FESTA Multi-City Exhibitions",
                                  "https://bangtangallery.online/faq"
                                ];
                                const nextTopics = (draftConfig.newsRelatedTopics && draftConfig.newsRelatedTopics.length > 0 ? draftConfig.newsRelatedTopics : defaultTopics).filter((_: any, i: number) => i !== idx);
                                updateDraft('newsRelatedTopics', null, nextTopics);
                              }}
                              className="p-1 px-2.5 bg-red-950/50 hover:bg-red-900 border border-red-500/20 text-red-400 hover:text-white rounded text-xs font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const defaultTopics = [
                            "2026 Reunion Tour Planning",
                            "Exclusive Photoshoots",
                            "FESTA Multi-City Exhibitions",
                            "https://bangtangallery.online/faq"
                          ];
                          const currentTopics = draftConfig.newsRelatedTopics && draftConfig.newsRelatedTopics.length > 0 ? draftConfig.newsRelatedTopics : defaultTopics;
                          updateDraft('newsRelatedTopics', null, [...currentTopics, '']);
                        }}
                        className="py-1.5 px-3 border border-purple-500/25 bg-purple-950/20 text-xs text-purple-300 rounded hover:bg-purple-950/40 font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Topic Link
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT: SEO */}
            {activeAdminTab === 'SEO' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase font-sans">SEO Meta tag Optimizations</h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Control browser headers, Open Graph images, key index tags and automatically refresh client sitemaps.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-mono text-purple-300 block uppercase font-bold">Meta Header Title</label>
                    <input
                      type="text"
                      value={draftConfig.seo.metaTitle}
                      onChange={(e) => updateDraft('seo', 'metaTitle', e.target.value)}
                      className="w-full px-4 py-2 border border-purple-500/10 bg-purple-950/20 rounded-lg text-xs text-white p-2.5 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-mono text-purple-300 block uppercase font-bold">Meta Description</label>
                    <textarea
                      value={draftConfig.seo.metaDescription}
                      onChange={(e) => updateDraft('seo', 'metaDescription', e.target.value)}
                      rows={3}
                      className="w-full p-4 border border-purple-500/10 bg-purple-950/20 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-mono text-purple-300 block uppercase font-bold">Search Keywords List</label>
                    <input
                      type="text"
                      value={draftConfig.seo.keywords}
                      onChange={(e) => updateDraft('seo', 'keywords', e.target.value)}
                      className="w-full px-4 py-2 border border-purple-500/10 bg-purple-950/20 rounded-lg text-xs text-white p-2.5 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-mono text-purple-300 block uppercase font-bold">Open Graph Preview Banner Image URL</label>
                    <input
                      type="text"
                      value={draftConfig.seo.openGraphImage}
                      onChange={(e) => updateDraft('seo', 'openGraphImage', e.target.value)}
                      className="w-full px-4 py-2 border border-purple-500/10 bg-purple-950/20 rounded-lg text-xs text-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <SmartImageInput
                      label="Browser Tab Icon (Favicon Image URL)"
                      value={draftConfig.seo.faviconUrl || ''}
                      onChange={(val) => updateDraft('seo', 'faviconUrl', val)}
                      placeholder="Enter SVG, PNG, or ICO image URL for your browser tab logo"
                    />
                    <p className="text-[10px] text-slate-400 font-sans mt-1">This icon sets the official Bangtan App app logo/icon in the browser address bar and tabs.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: THEME */}
            {activeAdminTab === 'Theme' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase font-sans">Website Accent Styling & Presets</h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Instantly flip the colors and palette parameters of the entire layout.</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <label className="text-xs font-mono text-purple-300 uppercase block font-bold">Public Accent Primary Color</label>
                    <div className="grid grid-cols-5 gap-2 font-sans text-xs">
                      {[
                        { id: 'purple', label: '💜 BTS Purple', class: 'bg-purple-600' },
                        { id: 'crimson', label: '🌹 Crimson', class: 'bg-rose-600' },
                        { id: 'indigo', label: '💙 Indigo', class: 'bg-indigo-600' },
                        { id: 'amber', label: '👑 Amber', class: 'bg-amber-600' },
                        { id: 'violet', label: '🍇 Violet', class: 'bg-violet-600' }
                      ].map((color) => {
                        const isSel = draftConfig.theme.accentColor === color.id;
                        return (
                          <button
                            key={color.id}
                            onClick={() => {
                              updateDraft('theme', 'accentColor', color.id);
                              onThemeConfigChange({ ...draftConfig.theme, accentColor: color.id });
                            }}
                            className={`p-3.5 rounded-lg text-white font-bold flex flex-col items-center justify-center gap-1.5 border transition-all ${
                              isSel ? 'border-white scale-105 shadow-xl' : 'border-purple-500/10 hover:border-purple-500/30'
                            } bg-[#0b0515]/70 cursor-pointer`}
                          >
                            <span className={`w-4 h-4 rounded-full ${color.class} block`} />
                            <span>{color.label.split(' ')[1] || color.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-mono text-purple-300 block uppercase font-bold">Festa Background Style preset</label>
                    <select
                      value={draftConfig.theme.bgStyle}
                      onChange={(e) => updateDraft('theme', 'bgStyle', e.target.value)}
                      className="w-full px-4 py-2 border border-purple-500/10 bg-purple-950/20 rounded-lg text-xs text-purple-300 focus:outline-none cursor-pointer"
                    >
                      <option value="aurora">🌌 Aurora Nebulae Starfield</option>
                      <option value="space">🖤 Immersive Deep Space</option>
                      <option value="festa">🔮 Cosmic Festival Glow</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: AUDIO & SOUND CMS */}
            {activeAdminTab === 'AudioControl' && (
              <div className="space-y-8 font-sans">
                {/* Header Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/10 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-emerald-400" /> Audio & Sound CMS
                    </h3>
                    <p className="text-[11px] text-slate-400">Manage game background music, interactive sound effects templates, and cover thumbnail libraries.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAudioSettingsSave(false)}
                      className="px-4 py-2 text-xs font-mono font-bold bg-[#140b2a] hover:bg-[#1a0f37] border border-purple-500/30 text-purple-300 rounded-lg transition-all cursor-pointer"
                    >
                      📁 Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAudioSettingsSave(true)}
                      className="px-4 py-2 text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg hover:shadow-emerald-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      🚀 Publish Live Instantly
                    </button>
                  </div>
                </div>

                {/* 1. AUDIO SETTINGS BLOCK */}
                <div className="bg-[#0b0515]/90 border border-purple-500/10 rounded-2xl p-6 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider text-purple-300 border-b border-white/5 pb-2">
                      1. General Audio Settings & Preferences
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">Configure global behavior parameters for audio streaming and local sound generation.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Checkbox settings */}
                    <div className="space-y-4">
                      {/* BGM Enabled toggler */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/10 border border-purple-500/5 hover:border-purple-500/15">
                        <div>
                          <div className="text-xs font-bold text-slate-200">Continuous Background Music</div>
                          <div className="text-[10px] text-slate-400">Play continuous background music when user registers/visits play board.</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={draftConfig.audioSettings?.bgmEnabled !== false}
                          onChange={(e) => updateDraft('audioSettings', 'bgmEnabled', e.target.checked)}
                          className="w-4 h-4 rounded border-purple-500 text-purple-600 bg-purple-950/20 focus:ring-purple-500 focus:ring-opacity-25 cursor-pointer"
                        />
                      </div>

                      {/* Game Sounds Enabled toggler */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/10 border border-purple-500/5 hover:border-purple-500/15">
                        <div>
                          <div className="text-xs font-bold text-slate-200">Interactive Game Sound Effects</div>
                          <div className="text-[10px] text-slate-400">Trigger click audio, award pings, level notifications, and action effects.</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={draftConfig.audioSettings?.gameSoundsEnabled !== false}
                          onChange={(e) => updateDraft('audioSettings', 'gameSoundsEnabled', e.target.checked)}
                          className="w-4 h-4 rounded border-purple-500 text-purple-600 bg-purple-950/20 focus:ring-purple-500 focus:ring-opacity-25 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Autoplay toggler */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/10 border border-purple-500/5 hover:border-purple-500/15">
                        <div>
                          <div className="text-xs font-bold text-slate-200">Autoplay Background Stream</div>
                          <div className="text-[10px] text-slate-400">Automatically stream background media upon screen entry.</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={draftConfig.audioSettings?.autoPlay !== false}
                          onChange={(e) => updateDraft('audioSettings', 'autoPlay', e.target.checked)}
                          className="w-4 h-4 rounded border-purple-500 text-purple-600 bg-purple-950/20 focus:ring-purple-500 focus:ring-opacity-25 cursor-pointer"
                        />
                      </div>

                      {/* Loop toggler */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/10 border border-purple-500/5 hover:border-purple-500/15">
                        <div>
                          <div className="text-xs font-bold text-slate-200">Loop Audio Background Music</div>
                          <div className="text-[10px] text-slate-400">Seamlessly loop background tracking indefinitely.</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={draftConfig.audioSettings?.loop !== false}
                          onChange={(e) => updateDraft('audioSettings', 'loop', e.target.checked)}
                          className="w-4 h-4 rounded border-purple-500 text-purple-600 bg-purple-950/20 focus:ring-purple-500 focus:ring-opacity-25 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Volume Slider */}
                  <div className="p-4 rounded-xl bg-purple-950/10 border border-purple-500/5 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-200">DEFAULT SOUND STAGE VOLUME</span>
                      <span className="font-mono text-purple-400">{draftConfig.audioSettings?.defaultVolume ?? 50}%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={draftConfig.audioSettings?.defaultVolume ?? 50}
                        onChange={(e) => updateDraft('audioSettings', 'defaultVolume', parseInt(e.target.value))}
                        className="w-full accentuate-purple accent-purple-600 bg-purple-950/40 rounded-lg appearance-none h-1.5 cursor-pointer animate-none"
                      />
                      <Volume2 className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
                    </div>
                    <p className="text-[9px] text-slate-400 font-mono">Control baseline attenuation level for game screens and interactive clips.</p>
                  </div>
                </div>

                {/* 2. GAME SOUND CONTROL BLOCK */}
                <div className="bg-[#0b0515]/90 border border-purple-500/10 rounded-2xl p-6 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider text-purple-300 border-b border-white/5 pb-2">
                      2. Sound Effect Templates & Background Tracks
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">Replace, upload, preview, or delete sound file streams utilized during game challenges.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { key: 'bgmMusicUrl', label: '🎧 Game Background Music', desc: 'Continuous loop music streamed when the game board loads', defaultUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
                      { key: 'clickSoundUrl', label: '🔘 Button Click Audio', desc: 'Sound triggered instantly when gamers click options or buttons', defaultUrl: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav' },
                      { key: 'notificationSoundUrl', label: '🔔 Interface Notification Ping', desc: 'Sound played on notifications, level accomplishments, or unlocks', defaultUrl: 'https://assets.mixkit.co/active_storage/sfx/911/911-84.wav' },
                      { key: 'rewardSoundUrl', label: '🏆 Target Reward Award', desc: 'Success sound triggered when gamers gain points or solve puzzles', defaultUrl: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav' },
                      { key: 'effectSoundUrl', label: '✨ Game Event Magic Sound', desc: 'Standard action effect playback for Guessing/lyrics games', defaultUrl: 'https://assets.mixkit.co/active_storage/sfx/1005/1005-84.wav' },
                    ].map((snd) => {
                      const currentVal = draftConfig.audioSettings?.[snd.key] || '';
                      return (
                        <div key={snd.key} className="p-4 rounded-xl bg-purple-900/5 border border-purple-500/10 space-y-3 hover:border-purple-500/25 transition-all">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div>
                              <div className="text-xs font-bold text-slate-100 uppercase tracking-wide">{snd.label}</div>
                              <div className="text-[10px] text-slate-400 leading-relaxed">{snd.desc}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => testPlaySoundUrl(currentVal || snd.defaultUrl)}
                                className="px-3 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-md text-[10px] font-mono text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                🔔 Play Test
                              </button>
                              <button
                                type="button"
                                onClick={() => updateDraft('audioSettings', snd.key, '')}
                                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-md text-[10px] font-mono text-rose-300 cursor-pointer transition-colors"
                              >
                                Delete Sound
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={currentVal}
                              onChange={(e) => updateDraft('audioSettings', snd.key, e.target.value)}
                              placeholder={`Or paste custom ${snd.key} url template...`}
                              className="w-full px-3.5 py-2 border border-purple-500/15 bg-[#090513] rounded-lg text-xs font-mono text-green-300 focus:outline-none"
                            />
                            <div className="relative shrink-0">
                              <input
                                type="file"
                                id={`file-${snd.key}`}
                                onChange={(e) => handleSoundUpload(e, snd.key)}
                                accept="audio/*"
                                className="sr-only"
                                disabled={isUploadingSound === snd.key}
                              />
                              <label
                                htmlFor={`file-${snd.key}`}
                                className={`px-4 py-2 border border-purple-500/20 bg-[#160d2e] text-purple-300 text-xs font-mono font-bold rounded-lg cursor-pointer hover:bg-purple-950/40 transition-all flex items-center gap-1.5 ${
                                  isUploadingSound === snd.key ? 'opacity-50 pointer-events-none' : ''
                                }`}
                              >
                                {isUploadingSound === snd.key ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                                  </>
                                ) : (
                                  <>📁 Replace Sound</>
                                )}
                              </label>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. COVER IMAGE MANAGEMENT BLOCK */}
                <div className="bg-[#0b0515]/90 border border-purple-500/10 rounded-2xl p-6 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider text-purple-300 border-b border-white/5 pb-2">
                      3. Dynamic Album Cover Artwork Library
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">Upload, replace, delete, or manage cover artwork and thumbnails. Every uploaded cover image automatically appears in the public Music Section.</p>
                  </div>

                  {/* Add Cover Artwork Form */}
                  <div className="p-4 rounded-xl bg-purple-950/10 border border-purple-500/10 space-y-3.5">
                    <div className="text-xs font-bold text-white uppercase tracking-wider block">🎨 Upload Custom Album Cover Artwork</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-purple-300 block font-bold">ARTWORK TITLE / CAPTION</label>
                        <input
                          type="text"
                          value={newCoverTitle}
                          onChange={(e) => setNewCoverTitle(e.target.value)}
                          placeholder="e.g. BTS Love Yourself Tears Aesthetic"
                          className="w-full px-3 py-1.5 border border-purple-500/15 bg-[#090513] rounded-lg text-xs text-white placeholder-slate-500"
                        />
                      </div>
                      <div className="flex items-end gap-3">
                        <div className="relative w-full">
                          <input
                            type="file"
                            id="cover-upload-input"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            className="sr-only"
                            disabled={isUploadingCover}
                          />
                          <label
                            htmlFor="cover-upload-input"
                            className={`w-full h-9 border border-dashed border-purple-500/30 bg-[#160d2e] text-purple-300 text-xs font-mono font-bold rounded-lg cursor-pointer hover:bg-purple-950/40 transition-all flex items-center justify-center gap-1.5 ${
                              isUploadingCover ? 'opacity-50 pointer-events-none' : ''
                            }`}
                          >
                            {isUploadingCover ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading Cover...
                              </>
                            ) : (
                              <>📁 Select & Upload Cover Image</>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Library Grid */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-purple-300 uppercase block font-bold">Currently Configured Gallery Assets ({draftConfig.audioSettings?.coverImages?.length || 0})</label>
                    {draftConfig.audioSettings?.coverImages && draftConfig.audioSettings.coverImages.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {draftConfig.audioSettings.coverImages.map((img: any, idx: number) => (
                          <div key={img.id || idx} className="group relative overflow-hidden bg-black/45 border border-purple-500/15 rounded-xl p-2 transition-all hover:border-purple-500/35 animate-none">
                            <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-white/5">
                              <img 
                                src={img.coverUrl} 
                                alt={img.title} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'; }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const currentList = draftConfig.audioSettings.coverImages.filter((c: any, i: number) => i !== idx);
                                  updateDraft('audioSettings', 'coverImages', currentList);
                                  showToast('Cover Artwork deleted from Library successfully!', 'info');
                                }}
                                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/75 hover:bg-rose-600 text-white transition-all cursor-pointer shadow-lg flex items-center justify-center"
                                title="Remove Artwork"
                              >
                                <Trash className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="mt-2 min-w-0">
                              <p className="text-[10px] font-bold text-slate-100 truncate">{img.title || 'Artwork Cover'}</p>
                              <p className="text-[8px] font-mono text-slate-400 truncate mt-0.5">{img.coverUrl?.slice(0, 30)}...</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 bg-purple-950/5 border border-dashed border-purple-500/10 rounded-xl text-center text-xs font-mono text-slate-500">
                        No custom cover artworks in libraries yet. Upload one above!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: MEDIA MANAGER */}
            {activeAdminTab === 'Media' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-[#090515] p-4 rounded-xl border border-purple-500/10">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">📁 Central Media Stream Files</h3>
                    <p className="text-[11px] text-[#a78bfa] leading-relaxed">Publish and reference binary assets (images, wallpapers, gifs, pdfs, audio loops) inside the page contents.</p>
                  </div>
                  <button 
                    onClick={() => setMediaViewTrash(!mediaViewTrash)}
                    className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                      mediaViewTrash 
                        ? 'bg-red-950/40 text-red-400 border-red-500/30' 
                        : 'bg-purple-950/20 text-purple-400 border-purple-500/20 hover:bg-purple-950/40'
                    }`}
                  >
                    {mediaViewTrash ? '📁 View Active Library' : '🗑️ View Trash Folder'}
                  </button>
                </div>

                {/* ADVANCED MULTIPLE UPLOAD / DRAG & DROPZONE */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-sans">
                  {/* Local drag and drop Zone */}
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) handleMultipleFilesUpload(e.dataTransfer.files); }}
                    className={`col-span-2 p-6 border-2 border-dashed rounded-xl text-center transition-all flex flex-col items-center justify-center min-h-[160px] relative ${
                      isDragging 
                        ? 'border-purple-400 bg-purple-950/35 scale-[1.01]' 
                        : 'border-purple-500/25 bg-purple-950/5 hover:bg-purple-950/10'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="multi-uploader" 
                      multiple 
                      className="hidden" 
                      onChange={(e) => { if (e.target.files) handleMultipleFilesUpload(e.target.files); }}
                    />
                    <label htmlFor="multi-uploader" className="cursor-pointer space-y-2 select-none">
                      <div className="w-10 h-10 rounded-full bg-purple-950/40 flex items-center justify-center text-purple-300 mx-auto">
                        <Plus className="w-5 h-5 animate-bounce"/>
                      </div>
                      <div className="text-xs text-white font-bold">Drag & Drop Multiple Files here or <span className="text-purple-400 underline decoration-purple-400">Browse Files</span></div>
                      <div className="text-[10px] text-zinc-500 font-mono">Supports Images, Mp3s, MP4, PDFs, GIFs, ZIPs up to 20MB</div>
                    </label>
                  </div>

                  {/* Remote URL entry box */}
                  <div className="p-4 bg-purple-950/10 border border-purple-500/10 rounded-xl flex flex-col justify-between">
                    <span className="text-xs font-mono font-bold text-purple-300 uppercase block">🔗 Remote Media Linker</span>
                    <form onSubmit={handleUploadMediaFile} className="space-y-2 mt-2">
                      <div className="space-y-1">
                        <input 
                          type="text"
                          required
                          value={newMediaFilename}
                          onChange={(e) => setNewMediaFilename(e.target.value)}
                          placeholder="Filename (eg. group_festa)"
                          className="w-full px-3 py-1.5 bg-[#0e0a1f] border border-purple-500/15 rounded text-xs text-stone-200 animate-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <input 
                          type="url"
                          required
                          value={newMediaUrl}
                          onChange={(e) => setNewMediaUrl(e.target.value)}
                          placeholder="Pasted remote image link address"
                          className="w-full px-3 py-1.5 bg-[#0e0a1f] border border-purple-500/15 rounded text-xs text-stone-200 placeholder-purple-900/60"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isUploadingMedia}
                        className="w-full py-1.5 bg-purple-600 hover:bg-purple-550 text-white rounded text-xs font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {isUploadingMedia ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>Link Asset URL</span>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Categories and Pre-Upload Options (Tags/Categories) */}
                <div className="p-3 border border-purple-500/10 rounded-lg bg-purple-950/10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-purple-300 uppercase font-bold block">Assigned Categories for uploads</label>
                    <select
                      value={mediaCategory}
                      onChange={(e) => setMediaCategory(e.target.value)}
                      className="px-3 py-1.5 bg-[#0a0516] border border-purple-500/15 rounded text-purple-300 font-sans cursor-pointer w-full"
                    >
                      <option value="Image">🖼️ Upload Image</option>
                      <option value="Video">🎥 Upload Video</option>
                      <option value="Audio">🎵 Upload Audio</option>
                      <option value="GIF">🌸 Upload GIF</option>
                      <option value="PDF">📄 Upload PDF Document</option>
                      <option value="ZIP">📦 Upload ZIP Archive</option>
                      <option value="Thumbnail">🎴 Upload Thumbnail</option>
                      <option value="Banner">🏷️ Upload Banner</option>
                      <option value="Background">🗺️ Upload Background</option>
                      <option value="Hero Image">🌌 Upload Hero Image</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-purple-300 uppercase font-bold block">Add Search Tags during upload (comma-separated)</label>
                    <input 
                      type="text"
                      value={mediaTags}
                      onChange={(e) => setMediaTags(e.target.value)}
                      placeholder="e.g. festa, jungkook, wallpaper, high-res"
                      className="w-full px-3 py-1.5 bg-[#0e0a1f] border border-purple-500/15 rounded text-xs text-[#a78bfa] placeholder-purple-905"
                    />
                  </div>
                </div>

                {/* Inline Media player and previewer */}
                {previewingFile && (
                  <div className="p-4 bg-purple-950/20 border-2 border-purple-500/30 rounded-xl relative">
                    <button 
                      onClick={() => setPreviewingFile(null)}
                      className="absolute top-2 right-2 text-xs text-purple-300 hover:text-white font-mono bg-black/40 px-2.5 py-1 rounded"
                    >
                      Close [x]
                    </button>
                    <span className="text-[10px] font-mono font-bold text-purple-300 block uppercase mb-1">🎭 Direct media previewer</span>
                    <span className="text-xs text-white block truncate font-mono mb-2">{previewingFile.filename || previewingFile.name}</span>
                    
                    <div className="flex items-center justify-center bg-black/60 rounded-lg p-2 min-h-[140px] max-h-[300px] overflow-hidden">
                      {['jpg', 'png', 'jpeg', 'webp', 'gif'].includes(previewingFile.filename?.split('.').pop()?.toLowerCase() || '') ? (
                        <img src={resolveMediaUrl(previewingFile.url)} referrerPolicy="no-referrer" className="max-h-[280px] object-contain rounded" alt="Preview" />
                      ) : ['mp3', 'wav', 'ogg', 'm4a'].includes(previewingFile.filename?.split('.').pop()?.toLowerCase() || '') ? (
                        <div className="w-full py-4 px-2 space-y-2">
                          <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white mx-auto animate-pulse">
                            <Music className="w-4 h-4"/>
                          </div>
                          <audio controls src={resolveMediaUrl(previewingFile.url)} className="w-full mx-auto" />
                        </div>
                      ) : ['mp4', 'webm', 'mov'].includes(previewingFile.filename?.split('.').pop()?.toLowerCase() || '') ? (
                        <video controls src={resolveMediaUrl(previewingFile.url)} className="max-h-[280px] rounded" />
                      ) : (
                        <div className="text-center font-mono text-xs text-slate-400 p-4">
                          📄 No inline preview for target document ({(previewingFile.filename || previewingFile.name).split('.').pop()}).
                          <a href={resolveMediaUrl(previewingFile.url)} target="_blank" rel="noreferrer" className="text-purple-400 block underline mt-1">Download & Open file</a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Search & filters */}
                <div className="flex gap-2.5 font-sans">
                  <div className="flex-grow relative">
                    <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-2.5" />
                    <input 
                      type="text"
                      value={mediaSearch}
                      onChange={(e) => setMediaSearch(e.target.value)}
                      placeholder="Search files by username metadata tags, details..."
                      className="w-full pl-9 pr-4 py-2 bg-[#090312] border border-purple-500/10 focus:border-purple-500 rounded-lg text-xs"
                    />
                  </div>
                  <select
                    value={mediaTypeFilter}
                    onChange={(e) => setMediaTypeFilter(e.target.value)}
                    className="px-3 py-2 bg-purple-950/20 border border-purple-500/10 rounded-lg text-xs text-purple-300 font-mono cursor-pointer"
                  >
                    <option value="all">📂 All extensions</option>
                    <option value="image">🖼️ Images (png, jpg, webp, gif)</option>
                    <option value="audio">🎵 Audios (mp3, wav)</option>
                    <option value="document">📄 Zips & PDF docs</option>
                  </select>
                </div>

                {/* Media grid list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {adminMediaFiles
                    .filter(f => !!f.isDeleted === !!mediaViewTrash)
                    .filter(f => {
                      const searchStr = mediaSearch.toLowerCase().trim();
                      if (!searchStr) return true;
                      
                      const matchesName = (f.filename || f.name || '').toLowerCase().includes(searchStr);
                      const matchesCat = (f.category || '').toLowerCase().includes(searchStr);
                      const matchesTags = Array.isArray(f.tags) && f.tags.some((t: string) => t.toLowerCase().includes(searchStr));
                      return matchesName || matchesCat || matchesTags;
                    })
                    .filter(f => {
                      if (mediaTypeFilter === 'all') return true;
                      const suffix = (f.filename || f.name || '').split('.').pop()?.toLowerCase() || '';
                      if (mediaTypeFilter === 'image') return ['jpg', 'png', 'gif', 'jpeg', 'webp'].includes(suffix);
                      if (mediaTypeFilter === 'audio') return ['mp3', 'wav', 'ogg', 'm4a'].includes(suffix);
                      if (mediaTypeFilter === 'document') return ['zip', 'pdf', 'rar', 'tar', 'gz'].includes(suffix);
                      return true;
                    })
                    .map((item, idx) => {
                      const isImg = ['jpg', 'png', 'jpeg', 'webp', 'gif'].includes((item.filename || item.name || '').split('.').pop()?.toLowerCase() || '');
                      const itemTags = Array.isArray(item.tags) ? item.tags : [];
                      
                      return (
                        <div key={item.id_str || item.filename || idx} className="p-3 border border-purple-500/10 rounded-xl bg-purple-950/10 flex gap-3 text-xs items-start font-sans">
                          {isImg ? (
                            <img 
                              src={item.url} 
                              referrerPolicy="no-referrer" 
                              className="w-16 h-16 rounded object-cover border border-purple-500/20 shrink-0 cursor-pointer hover:opacity-85" 
                              onClick={() => setPreviewingFile(item)}
                              alt="" 
                            />
                          ) : (
                            <div 
                              onClick={() => setPreviewingFile(item)}
                              className="w-16 h-16 rounded bg-purple-950/40 border border-purple-500/10 flex flex-col items-center justify-center text-purple-400 shrink-0 select-none cursor-pointer hover:bg-purple-950/60"
                            >
                              <span className="text-[10px] uppercase font-bold font-mono">{(item.filename || item.name || '').split('.').pop() || 'file'}</span>
                            </div>
                          )}

                          <div className="flex-grow min-w-0 space-y-1">
                            {renamingFile === item.filename ? (
                              <div className="flex gap-1.5 items-center">
                                <input 
                                  type="text"
                                  value={renamingName}
                                  onChange={(e) => setRenamingName(e.target.value)}
                                  className="px-2 py-0.5 bg-[#090515] border border-purple-500/30 text-xs rounded text-white font-mono flex-grow"
                                />
                                <button 
                                  onClick={() => handleRenameMediaFile(item.filename, renamingName)}
                                  className="p-1 bg-emerald-600 rounded text-white cursor-pointer"
                                >
                                  ✓
                                </button>
                                <button 
                                  onClick={() => setRenamingFile(null)}
                                  className="p-1 bg-red-650 rounded text-slate-400 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <span className="font-mono text-xs text-white block truncate font-bold">{item.filename || item.name}</span>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-550/10 border border-purple-500/15 text-purple-300">
                                {item.category || 'General'}
                              </span>
                              <span className="text-[9px] text-fuchsia-400 font-mono">
                                {item.size}
                              </span>
                            </div>

                            {itemTags.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {itemTags.map((tag: string, tIdx: number) => (
                                  <span key={tIdx} className="text-[8px] font-mono bg-zinc-900 px-1 py-0.1 text-slate-400 rounded">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-3 pt-1.5 border-t border-purple-500/5">
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(item.url);
                                  showToast('Asset link copied successfully! 💜', 'success');
                                }}
                                className="text-[10px] font-mono text-cyan-400 hover:text-white underline cursor-pointer"
                              >
                                {`Copy URL`}
                              </button>

                              <button 
                                onClick={() => setPreviewingFile(item)}
                                className="text-[10px] font-mono text-fuchsia-400 hover:text-white underline cursor-pointer"
                              >
                                Preview
                              </button>

                              <button 
                                onClick={() => { setRenamingFile(item.filename); setRenamingName(item.filename); }}
                                className="text-[10px] font-mono text-amber-500 hover:text-amber-300 underline cursor-pointer"
                              >
                                Rename
                              </button>

                              {/* Replace file input */}
                              <label className="text-[10px] font-mono text-green-400 hover:text-white underline cursor-pointer">
                                Replace
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  onChange={(e) => { if (e.target.files) handleReplaceMediaFile(item.filename, e.target.files[0]); }}
                                />
                              </label>
                              
                              {!mediaViewTrash ? (
                                <button 
                                  onClick={() => handleDeleteMediaFile(item.filename, false)}
                                  className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer text-center ml-auto font-mono"
                                >
                                  {`[Trash]`}
                                </button>
                              ) : (
                                <div className="flex gap-2 ml-auto">
                                  <button 
                                    onClick={() => handleRestoreMediaFile(item.filename)}
                                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono cursor-pointer"
                                  >
                                    Restore
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteMediaFile(item.filename, true)}
                                    className="text-[10px] text-red-500 hover:text-red-400 font-bold font-mono cursor-pointer"
                                  >
                                    Purge
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {adminMediaFiles.filter(f => !!f.isDeleted === !!mediaViewTrash).length === 0 && (
                    <div className="col-span-2 p-8 border border-dashed border-purple-500/10 rounded-xl text-center text-xs text-slate-500 font-mono">
                      📭 No matching files indexed in this folder view.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: CMS DATA BACKUPS */}
            {activeAdminTab === 'Backups' && (
              <div className="space-y-6">
                <div className="bg-[#090515] p-4 rounded-xl border border-purple-500/10">
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">🧬 One-Click Snapshot system Backup</h3>
                  <p className="text-[11px] text-[#a78bfa] leading-relaxed mt-1">Capture direct server snapshots of content configurations, download registries, news files, and support logs. Roll back anytime instantly.</p>
                </div>

                {/* Create Backup */}
                <form onSubmit={handleCreateBackup} className="bg-purple-950/10 border border-purple-500/10 p-4 rounded-xl space-y-3">
                  <span className="text-xs font-mono font-bold text-purple-300 uppercase block">➕ Capture System Snapshot</span>
                  <div className="grid grid-cols-1 gap-2">
                    <label className="text-[10px] font-mono text-slate-400 block uppercase">Backup Label / Context Title</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        required
                        value={backupLabel}
                        onChange={(e) => setBackupLabel(e.target.value)}
                        placeholder="Before changing Festa events or members biographies"
                        className="flex-grow px-3 py-1.5 bg-[#0e0a1f] border border-purple-500/15 rounded text-xs text-white"
                      />
                      <button
                        type="submit"
                        disabled={isCreatingBackup}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold font-mono uppercase text-white rounded transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {isCreatingBackup ? <Loader2 className="w-3 animate-spin"/> : <Database className="w-3.5 h-3.5"/>}
                        <span>Capture State</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Backups table */}
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase block">📦 Archived Backups historical snaps</span>
                  
                  {backupsList.map((snap) => (
                    <div key={snap.id} className="p-4 border border-purple-500/10 rounded-xl bg-purple-950/10 flex justify-between items-center text-xs">
                      <div className="space-y-1 font-sans">
                        <span className="text-sm font-bold text-white block">🧬 {snap.label}</span>
                        <span className="text-[10px] font-mono text-[#c084fc] block">Timestamp: {new Date(snap.createdAt).toLocaleString()}</span>
                        <span className="text-[9px] text-[#22c55e] block font-mono">Secure ID: {snap.id} | Size: {(snap.size / 1024).toFixed(2)} KB</span>
                      </div>

                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => handleRestoreBackup(snap.id)}
                          disabled={isRestoringBackupId !== null}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-505 hover:shadow-[0_0_10px_rgba(168,85,247,0.3)] disabled:opacity-55 text-white font-mono text-xs font-bold rounded cursor-pointer"
                        >
                          {isRestoringBackupId === snap.id ? 'Restoring ...' : 'Roll Back Restore'}
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(snap.id)}
                          className="p-1 px-1.5 text-red-400 hover:text-red-300 font-bold font-mono hover:bg-red-950/30 rounded border border-red-500/10"
                        >
                          Purge
                        </button>
                      </div>
                    </div>
                  ))}

                  {backupsList.length === 0 && (
                    <div className="p-8 border border-dashed border-purple-500/10 rounded-xl text-center text-xs text-slate-500 font-mono">
                      No backups exist. Use the button above to spark the first capture!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: LIVE STREAMING CONTROL */}
            {activeAdminTab === 'LiveStreaming' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase font-sans">Live Broadcast Control Room</h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Manage live streams, simulate OBS Studio stream connectivity, rotate security keys, and monitor real-time viewer engagement matrices.</p>
                </div>

                {isLoadingLiveSettings ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    <span className="text-xs text-slate-400 font-mono">Loading real-stream telemetry...</span>
                  </div>
                ) : liveSettings ? (
                  <div className="space-y-6 animate-fade-in">
                    {!isBackendOnline && (
                      <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
                        <span>⚠️</span>
                        <span>Streaming server is currently unavailable.</span>
                      </div>
                    )}

                    {/* Status & Simulation Banner */}
                    <div className="bg-purple-950/20 border border-purple-500/20 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1 text-left">
                        <span className="text-[10px] font-mono tracking-widest text-purple-400 font-bold block uppercase">Live Broadcast Status</span>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-mono font-bold flex items-center gap-2 ${liveSettings.isLive ? 'text-rose-500' : 'text-slate-500'}`}>
                            <span className={`w-3 h-3 rounded-full ${liveSettings.isLive ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`} />
                            {liveSettings.isLive ? '🔴 LIVE NOW' : '⚫ OFFLINE'}
                          </span>
                          {liveSettings.isLive && (
                            <span className="text-xs font-mono text-fuchsia-300">
                              ⚡ Active Watchers: {liveSettings.viewerCount?.toLocaleString() || '0'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isSimulatingStream}
                          onClick={() => handleAdminStreamToggle(liveSettings.isLive ? 'disconnect' : 'connect')}
                          className={`px-4 py-2 text-xs font-bold font-mono transition-all uppercase flex items-center gap-1.5 cursor-pointer shadow-lg rounded-xl ${
                            liveSettings.isLive 
                              ? 'bg-rose-950/40 border border-rose-500/30 text-rose-450 hover:bg-rose-900/35 hover:text-rose-355' 
                              : 'bg-emerald-950/45 border border-emerald-500/35 text-emerald-400 hover:bg-emerald-900/35 hover:text-emerald-355 shadow-emerald-500/10'
                          }`}
                        >
                          <Radio className="w-3.5 h-3.5" />
                          {liveSettings.isLive ? '🔴 Stop Live Stream' : '🟢 Start Live Stream'}
                        </button>
                      </div>
                    </div>

                    {/* Real-time Broadcast Telemetry */}
                    {telemetry && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#0a0518] p-5 border border-purple-500/15 rounded-2xl">
                        <div className="space-y-1 text-left">
                          <span className="text-[10px] text-slate-500 uppercase font-mono block">Media Source Ingest</span>
                          <span className={`text-xs font-mono font-bold block ${telemetry.isConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {telemetry.isConnected ? `Connected (${telemetry.protocol})` : 'Disconnected'}
                          </span>
                        </div>
                        <div className="space-y-1 text-left">
                          <span className="text-[10px] text-slate-500 uppercase font-mono block">Ingest Resolution</span>
                          <span className="text-xs font-mono font-bold text-white block">
                            {telemetry.isConnected ? telemetry.resolution : 'N/A'}
                          </span>
                        </div>
                        <div className="space-y-1 text-left">
                          <span className="text-[10px] text-slate-500 uppercase font-mono block">Real-time Bitrate</span>
                          <span className="text-xs font-mono font-bold text-fuchsia-400 block">
                            {telemetry.isConnected && telemetry.bitrate > 0 ? `${telemetry.bitrate} kbps` : 'N/A'}
                          </span>
                        </div>
                        <div className="space-y-1 text-left">
                          <span className="text-[10px] text-slate-500 uppercase font-mono block">Signal Health</span>
                          <span className={`text-xs font-mono font-bold block ${telemetry.isConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>
                            {telemetry.isConnected ? 'Excellent 🛡️' : 'N/A'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Server setup configuration parameters */}
                    <div className="bg-[#090515] p-6 border border-purple-500/10 rounded-2xl space-y-5">
                      <span className="text-sm font-bold text-white uppercase block tracking-wider">🖥️ OBS Studio Configuration Parameters</span>
                      <p className="text-xs text-slate-400 font-sans">To broadcast via OBS or another encoder, configure your broadcast software using the parameters below:</p>

                      <div className="space-y-4">
                        {/* WHIP URL field */}
                        <div className="space-y-1.5 text-left">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-purple-300 font-bold uppercase tracking-wider block">WebRTC WHIP Stream URL</span>
                            <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-mono">
                              ⭐ Recommended: Instant Playback
                            </span>
                          </div>
                          <div className="flex gap-1.5 bg-black/40 border border-purple-500/15 rounded-xl p-1.5 focus-within:border-purple-500/50 transition-colors">
                            <input
                              type="text"
                              readOnly
                              value={liveSettings.whipUrl || ''}
                              className="flex-grow bg-transparent border-none text-slate-300 outline-none font-mono text-xs px-2"
                            />
                            <button
                              type="button"
                              onClick={() => copyLiveFieldToClipboard(liveSettings.whipUrl || '', 'whip')}
                              className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Copy WHIP URL"
                            >
                              {copiedWhipUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
                            </button>
                          </div>
                          <span className="text-[9px] text-slate-500 block leading-tight">
                            We recommend WebRTC for instant browser stream support! In OBS Studio, use stream service type &quot;WHIP&quot; and paste this URL directly. No stream key needed.
                          </span>
                        </div>

                        {/* RTMP Server URL field */}
                        <div className="space-y-1.5 text-left">
                          <span className="font-mono text-[10px] text-purple-300 font-bold uppercase tracking-wider block">RTMP Server Gateway URL</span>
                          <div className="flex gap-1.5 bg-black/40 border border-purple-500/15 rounded-xl p-1.5 focus-within:border-purple-500/50 transition-colors">
                            <input
                              type="text"
                              readOnly
                              value={liveSettings.rtmpUrl}
                              className="flex-grow bg-transparent border-none text-white outline-none font-mono text-xs px-2"
                            />
                            <button
                              type="button"
                              onClick={() => copyLiveFieldToClipboard(liveSettings.rtmpUrl, 'url')}
                              className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Copy RTMP URL"
                            >
                              {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
                            </button>
                          </div>
                        </div>

                        {/* Stream Key Field */}
                        <div className="space-y-1.5 text-left">
                          <span className="font-mono text-[10px] text-purple-300 font-bold uppercase tracking-wider block">Stream Key 🔒 (For RTMP Encoders only)</span>
                          <div className="flex gap-1.5 bg-black/40 border border-purple-500/15 rounded-xl p-1.5 focus-within:border-purple-500/50 transition-colors">
                            <input
                              type={showStreamKey ? "text" : "password"}
                              readOnly
                              value={liveSettings.streamKey}
                              className={`flex-grow bg-transparent border-none text-white outline-none font-mono text-xs px-2 ${!showStreamKey && 'tracking-widest'}`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowStreamKey(!showStreamKey)}
                              className="px-2.5 text-[10px] text-purple-300 hover:text-white font-mono bg-purple-950/20 hover:bg-purple-900/35 border border-purple-500/15 rounded-lg transition-colors cursor-pointer"
                            >
                              {showStreamKey ? 'Hide' : 'Show'}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyLiveFieldToClipboard(liveSettings.streamKey, 'key')}
                              className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Copy Stream Key"
                            >
                              {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
                            </button>
                          </div>
                        </div>

                        {/* Actions line */}
                        <div className="flex items-center justify-between pt-2 border-t border-purple-500/10">
                          <span className="text-[10px] text-slate-500 font-sans">Need to regenerate standard key? Old stream sessions will be invalidated immediately.</span>
                          <button
                            type="button"
                            disabled={isRegeneratingKey}
                            onClick={handleRegenerateStreamKey}
                            className="px-3.5 py-1.5 bg-purple-950/20 hover:bg-purple-900/35 text-purple-300 border border-purple-500/20 text-xs font-mono rounded cursor-pointer transition-all"
                          >
                            {isRegeneratingKey ? 'Regenerating stream key...' : '🔑 Regenerate Playback-Key'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Stats Summary Panel */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-purple-950/5 border border-purple-500/10 p-4 rounded-xl text-left">
                        <span className="text-[10px] text-slate-500 uppercase font-mono block">Watchers Peak Rate</span>
                        <span className="text-sm font-semibold text-purple-300 block mt-1">🔥 {liveSettings.peakViewers || '0'} max peak</span>
                      </div>
                      <div className="bg-purple-950/5 border border-purple-500/10 p-4 rounded-xl text-left">
                        <span className="text-[10px] text-slate-500 uppercase font-mono block">Watch Time Metrics</span>
                        <span className="text-sm font-semibold text-emerald-400 block mt-1">⚡ {Math.max(1, Math.ceil(liveSettings.watchTime / 60))} Hrs total</span>
                      </div>
                    </div>

                    {/* Main Website Integration / Embed Snippet Generator */}
                    <div className="bg-[#090515] p-6 border border-purple-500/10 rounded-2xl space-y-4 text-left">
                      <div className="flex items-center gap-2">
                        <Code className="w-5 h-5 text-purple-400" />
                        <span className="text-sm font-bold text-white uppercase block tracking-wider font-sans">🌐 External Website Embed Code Generator</span>
                      </div>
                      <p className="text-xs text-slate-400 font-sans">
                        Easily embed your live broadcast onto your main external website. Choose one of our two optimized iframe embed methods below, click copy, and paste it anywhere inside your HTML structure.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-sans">
                        {/* Option 1: Direct Video Feed Only */}
                        <div className="p-4 bg-black/40 border border-purple-500/15 rounded-xl flex flex-col justify-between space-y-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono text-purple-400 block uppercase font-bold tracking-widest">Option A: Player-Only Feed</span>
                            <span className="text-[11px] text-stone-300 block font-semibold">Direct live feed with no chat, headers or border margins. Perfect for custom grid designs.</span>
                          </div>
                          
                          <div className="space-y-2">
                            <textarea
                              readOnly
                              rows={3}
                              className="w-full p-2 bg-black text-[10px] font-mono border border-white/5 rounded text-slate-450 select-all"
                              value={`<iframe src="${window.location.origin}/embed-player" width="100%" height="450px" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);"></iframe>`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`<iframe src="${window.location.origin}/embed-player" width="100%" height="450px" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);"></iframe>`);
                                setCopiedPlayerEmbed(true);
                                setTimeout(() => setCopiedPlayerEmbed(false), 2000);
                              }}
                              className="w-full py-1.5 bg-purple-600/25 hover:bg-purple-600/40 text-purple-300 border border-purple-500/20 text-xs font-mono font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-1"
                            >
                              {copiedPlayerEmbed ? '✓ Copied to Clipboard!' : '📋 Copy Embed Code'}
                            </button>
                          </div>
                        </div>

                        {/* Option 2: Full Station with Live Chat */}
                        <div className="p-4 bg-black/40 border border-purple-500/15 rounded-xl flex flex-col justify-between space-y-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono text-purple-400 block uppercase font-bold tracking-widest">Option B: Interactive Broadcast Station</span>
                            <span className="text-[11px] text-stone-300 block font-semibold">Full immersive workspace featuring the video player, live chat sidebar, and caption.</span>
                          </div>
                          
                          <div className="space-y-2">
                            <textarea
                              readOnly
                              rows={3}
                              className="w-full p-2 bg-black text-[10px] font-mono border border-white/5 rounded text-slate-450 select-all"
                              value={`<iframe src="${window.location.origin}/?embed=true" width="100%" height="600px" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);"></iframe>`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`<iframe src="${window.location.origin}/?embed=true" width="100%" height="600px" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);"></iframe>`);
                                setCopiedInteractiveEmbed(true);
                                setTimeout(() => setCopiedInteractiveEmbed(false), 2000);
                              }}
                              className="w-full py-1.5 bg-purple-600/25 hover:bg-purple-600/40 text-purple-300 border border-purple-500/20 text-xs font-mono font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-1"
                            >
                              {copiedInteractiveEmbed ? '✓ Copied to Clipboard!' : '📋 Copy Embed Code'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Live Stream Caption & Iframe Embed Settings */}
                    <form onSubmit={handleSaveLiveDetails} className="bg-[#090515] p-6 border border-purple-500/10 rounded-2xl space-y-5">
                      <div className="flex items-center gap-2 text-left">
                        <Radio className="w-5 h-5 text-purple-400 animate-pulse animate-duration-1000" />
                        <span className="text-sm font-bold text-white uppercase block tracking-wider">📺 Broadcast Caption & Iframe Embed Integration</span>
                      </div>
                      <p className="text-xs text-slate-400 font-sans text-left">
                        Manage the displayed caption title, caption description, and inject custom iframe embed code (such as YouTube Live embeds or external feeds) directly to the public live stream stage.
                      </p>

                      <div className="space-y-4 font-sans text-stone-200">
                        <div className="space-y-1.5 text-left">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Caption Title</label>
                          <input 
                            type="text"
                            required
                            value={liveTitle}
                            onChange={(e) => setLiveTitle(e.target.value)}
                            className="w-full px-3 py-2.5 bg-black/40 border border-purple-500/15 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500/50"
                            placeholder="Enter display caption title..."
                          />
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Caption Description</label>
                          <textarea 
                            rows={3}
                            value={liveDescription}
                            onChange={(e) => setLiveDescription(e.target.value)}
                            className="w-full px-3 py-2.5 bg-black/40 border border-purple-500/15 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500/50"
                            placeholder="Optional. Enter details or information text to show beneath the stream..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Thumbnail Cover input and upload */}
                          <div className="space-y-1.5 text-left">
                            <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Cover Thumbnail Image URL</label>
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                value={liveThumbnail}
                                onChange={(e) => setLiveThumbnail(e.target.value)}
                                className="flex-grow px-3 py-2 bg-black/40 border border-purple-500/15 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500/50 font-mono text-[11px]"
                                placeholder="Paste custom image URL..."
                              />
                              <label className="px-3.5 py-2 bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center select-none shrink-0">
                                {isUploadingLiveThumbnail ? 'Uploading...' : 'Upload File'}
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={handleLiveThumbnailUpload} 
                                  disabled={isUploadingLiveThumbnail}
                                />
                              </label>
                            </div>
                          </div>

                          {/* Scheduled broadcast time */}
                          <div className="space-y-1.5 text-left">
                            <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Schedule Broadcast (Optional Calendar)</label>
                            <input 
                              type="datetime-local"
                              value={liveScheduledAt}
                              onChange={(e) => setLiveScheduledAt(e.target.value)}
                              className="w-full px-3 py-2 bg-black/40 border border-purple-500/15 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500/50 font-mono [color-scheme:dark]"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Iframe Embed Code / Custom Stream Iframe (HTML)</label>
                          <textarea 
                            rows={4}
                            value={liveEmbedCode}
                            onChange={(e) => setLiveEmbedCode(e.target.value)}
                            className="w-full px-3 py-2.5 bg-black/40 border border-purple-500/15 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-purple-500/50"
                            placeholder='e.g., <iframe width="560" height="315" src="https://www.youtube.com/embed/..." frameborder="0" allowfullscreen></iframe>'
                          />
                          <p className="text-[10px] text-slate-500 leading-tight">
                            Note: If you provide an iframe code (like from YouTube Live), we will render your embed player on the stream page. Leave this blank to default back to the beautiful standard self-hosted stream player.
                          </p>
                        </div>

                        {/* Real-time Interactive Live Preview */}
                        {liveEmbedCode.trim() && (
                          <div className="space-y-2 border border-purple-500/20 bg-black/60 p-4 rounded-xl text-left animate-fade-in">
                            <span className="text-[10px] text-purple-400 font-mono font-bold uppercase tracking-widest block flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              Interactive Embed Preview (Unsaved Draft)
                            </span>
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                              {(() => {
                                const trimmed = liveEmbedCode.trim();
                                const htmlContent = (trimmed.startsWith('<iframe') || trimmed.includes('<script'))
                                  ? trimmed
                                  : `<iframe src="${trimmed}" width="100%" height="100%" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"></iframe>`;
                                return (
                                  <div 
                                    className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:absolute [&_iframe]:inset-0"
                                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                                  />
                                );
                              })()}
                            </div>
                            <p className="text-[9px] text-slate-400 leading-normal">
                              Verify that your live embed player renders correctly above. Click <strong>Save Caption & Embed Settings</strong> below to publish this stream to the public page and embed endpoints.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-purple-500/10 flex justify-end">
                        <button
                          type="submit"
                          disabled={isSavingLiveDetails}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold font-mono tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-purple-600/20 cursor-pointer"
                        >
                          {isSavingLiveDetails ? 'Saving Changes...' : 'Save Caption & Embed Settings'}
                        </button>
                      </div>
                    </form>

                    {/* DANGER ZONE / BROADCAST LIFECYCLE MANAGEMENT */}
                    <div className="bg-[#090515] p-6 border border-purple-500/10 rounded-2xl space-y-4 text-left">
                      <div className="flex items-center gap-2">
                        <Trash className="w-5 h-5 text-rose-500" />
                        <span className="text-sm font-bold text-white uppercase block tracking-wider font-sans">🛑 Broadcast Session Lifecycle Management</span>
                      </div>
                      <p className="text-xs text-slate-400 font-sans">
                        Control the lifecycle state of your streams. Clear and delete existing configurations to start fresh, or archive completed live statistics to save your performance records in the stream archives database.
                      </p>

                      <div className="flex flex-wrap gap-3 pt-1">
                        <button
                          type="button"
                          onClick={handleArchiveStream}
                          className="px-4 py-2 bg-purple-600/15 hover:bg-purple-600/30 text-purple-300 border border-purple-500/20 text-xs font-mono font-bold rounded-xl cursor-pointer transition-all"
                        >
                          📦 Archive Current Stream Session
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteStream}
                          className="px-4 py-2 bg-rose-600/15 hover:bg-rose-600/30 text-rose-350 border border-rose-500/20 text-xs font-mono font-bold rounded-xl cursor-pointer transition-all"
                        >
                          🗑️ Delete & Reset Broadcast Details
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 border border-dashed border-purple-500/10 rounded-xl text-center text-xs text-slate-500 font-mono">
                    Stream settings telemetry could not be resolved.
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: SECURITY SETTINGS */}
            {activeAdminTab === 'Security' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase font-sans">Security Credentials & Sessions Control</h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Control access credentials, recovery security questions, and monitor currently active administrative sessions.</p>
                </div>

                {/* Account & master password change */}
                <div className="bg-purple-950/5 border border-purple-500/10 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-purple-400 animate-pulse" />
                    <span className="text-sm font-black font-sans text-white uppercase tracking-wider">Change Admin Credentials Group</span>
                  </div>

                  {!showCredentialInputs ? (
                    <div className="p-5 bg-black/40 border border-purple-500/10 rounded-xl flex items-center justify-between">
                      <div className="space-y-1 pr-4">
                        <p className="text-xs font-bold text-purple-200">🔒 Account Credentials Control Locked</p>
                        <p className="text-[11px] text-slate-450 leading-relaxed max-w-xl">
                          For security and prevention of screen-capture leaks of credentials, administrative password parameters are fully hidden on the dashboard after logging in.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCredentialInputs(true)}
                        className="p-1 px-3 bg-purple-900/60 hover:bg-purple-800 border border-purple-500/25 text-xs text-white rounded-lg font-mono font-bold transition-all shrink-0 cursor-pointer"
                      >
                        Reveal Fields
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateAccountDetails} className="space-y-4 font-sans text-stone-200">
                      <div className="max-w-md mx-auto space-y-3 p-4 bg-purple-950/10 border border-purple-500/5 rounded-xl">
                        <span className="text-xs font-mono font-bold text-purple-300 uppercase block text-center">Assign New Master Password</span>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-slate-400">New Secure Password</label>
                          <input 
                            type="password"
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            className="w-full px-3 py-1.5 bg-black/40 border border-purple-500/15 rounded text-xs text-white"
                            placeholder="••••••••••••••"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-slate-400">Confirm Secure Password</label>
                          <input 
                            type="password"
                            value={confirmAdminPassword}
                            onChange={(e) => setConfirmAdminPassword(e.target.value)}
                            className="w-full px-3 py-1.5 bg-black/40 border border-purple-500/15 rounded text-xs text-white"
                            placeholder="••••••••••••••"
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-purple-500/10 flex items-center justify-between">
                        <div className="w-3/5 space-y-1">
                          <label className="text-[11px] font-mono text-[#f43f5e] font-bold block uppercase">Master Passcode Authorization</label>
                          <input 
                            type="password"
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-3 py-1.5 bg-black/40 border border-red-500/30 rounded text-xs text-white"
                            placeholder="Confirm current password to authorize changes"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowCredentialInputs(false)}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-xs font-mono rounded-xl transition-all cursor-pointer"
                          >
                            Hide Setup
                          </button>
                          <button
                            type="submit"
                            disabled={isUpdatingAccount}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-55 text-white text-xs font-bold font-mono tracking-wider uppercase rounded-xl transition-all"
                          >
                            {isUpdatingAccount ? 'Updating state...' : 'Save credentials changes'}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>

                {/* Security question configuration settings */}
                <form onSubmit={handleSaveRecoverySetup} className="bg-[#090515] p-5 rounded-2xl border border-purple-500/10 space-y-4 font-sans">
                  <span className="text-sm font-bold text-white uppercase block">🔒 Recovery Questions Configuration Setup</span>
                  <p className="text-xs text-slate-400">This configures verification questions requested during password recovery attempts if administrative password parameters are lost.</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Custom Security Question</label>
                      <input 
                        type="text"
                        required
                        value={securityQuestion}
                        onChange={(e) => setSecurityQuestion(e.target.value)}
                        className="w-full px-3 py-2 bg-purple-950/20 border border-purple-500/15 rounded-lg text-xs text-white focus:outline-none"
                        placeholder="What is the official debut date of BTS?"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-purple-300 font-mono font-bold block uppercase">Secret Answer Passcode</label>
                      <input 
                        type="password"
                        required
                        value={securityAnswer}
                        onChange={(e) => setSecurityAnswer(e.target.value)}
                        className="w-full px-3 py-2 bg-purple-950/20 border border-purple-500/15 rounded-lg text-xs text-white focus:outline-none"
                        placeholder="Type answer to question (leave blank or fill to change)"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-black/40 rounded-xl flex items-center justify-between text-xs font-mono">
                    <div className="space-y-1">
                      <span className="text-purple-300 uppercase font-bold block">🔑 System 16-Character Backup Recovery Code:</span>
                      <span className="text-slate-400 block leading-relaxed">Save this code securely. In extreme recovery conditions, bypass questions with this key.</span>
                    </div>
                    <span className="p-2 border border-purple-500/30 bg-purple-950/20 text-fuchsia-400 rounded font-black font-mono tracking-widest text-sm bg-black px-4">{backupCode}</span>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSavingSecuritySetup}
                      className="px-4 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-55 text-white text-xs font-bold font-mono uppercase rounded-xl transition-all"
                    >
                      {isSavingSecuritySetup ? 'Encrypting setups...' : 'Update Recovery configs'}
                    </button>
                  </div>
                </form>

                {/* Login session history details */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-white uppercase block">📊 Active Administrative session logins</span>
                    <button
                      type="button"
                      onClick={handleLogoutAllDevices}
                      className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-950 text-red-400 font-mono text-xs rounded border border-red-500/25 transition-colors cursor-pointer"
                    >
                      Terminate All Authorized Sessions
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-purple-500/15">
                    <table className="w-full text-xs font-sans text-slate-300">
                      <thead>
                        <tr className="bg-purple-950/20 text-[10px] font-mono text-[#a78bfa] uppercase text-left">
                          <th className="p-3">Country / IP Address</th>
                          <th className="p-3">Device / Browser</th>
                          <th className="p-3">Active Duration</th>
                          <th className="p-3 text-right">Action Terminate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-500/10">
                        {loginHistory.map((session) => (
                          <tr key={session.id} className={`${session.isActive ? 'bg-purple-950/5' : 'opacity-40 bg-black/20'}`}>
                            <td className="p-3 space-y-0.5">
                              <span className="font-bold text-white block">{session.country}</span>
                              <span className="font-mono text-[11px] text-fuchsia-400 block">{session.ip}</span>
                            </td>
                            <td className="p-3 space-y-0.5">
                              <span className="text-stone-300 font-medium block">{session.device}</span>
                              <span className="text-[10px] text-slate-500 font-mono block truncate max-w-xs">{session.userAgent}</span>
                            </td>
                            <td className="p-3 space-y-0.5">
                              <span className="text-slate-400 block font-mono">Logged: {new Date(session.loginTime).toLocaleTimeString()}</span>
                              <span className="text-[10px] text-emerald-400 block font-mono">{session.isActive ? 'Active Session' : 'Revoked'}</span>
                            </td>
                            <td className="p-3 text-right">
                              {session.isActive ? (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeSession(session.id)}
                                  className="text-[11px] font-mono text-red-400 hover:text-red-300 underline"
                                >
                                  Kill Token
                                </button>
                              ) : (
                                <span className="text-slate-500 text-[11px] font-mono">Revoked</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </main>

          {/* VIRTUAL DEVICE RIGHT PANEL LIVE DRAFT PREVIEW COLUMN - Responsive, premium layout */}
          <section className="hidden lg:flex lg:w-1/2 bg-[#020106] h-full flex-col relative border-l border-purple-500/10 select-none">
            
            {/* Header top address bar mockup */}
            <div className="h-11 bg-[#090515] border-b border-purple-500/10 px-4 flex items-center justify-between shrink-0 font-sans text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              </div>
              
              <div className="w-3/5 bg-black/60 border border-purple-500/5 rounded-md px-3 py-1 text-[10px] text-purple-300/80 font-mono text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>localhost:3000/?draft_preview=true</span>
              </div>

              <div className="text-[10px] font-mono text-slate-500 border border-purple-500/10 px-2 py-0.5 rounded uppercase">
                Interactive Preview
              </div>
            </div>

            {/* Simulated Desktop client browser view section */}
            <div className="flex-grow overflow-y-auto bg-black p-6 relative font-sans space-y-10 selection:bg-purple-600 selection:text-white">
              
              {/* Virtual App Header bar */}
              <div id="preview-menu-mock" className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-white font-black hover:text-purple-300 text-xs tracking-wider uppercase">
                  ⟭⟬⁷ {draftConfig.home.heroTitle || 'BANGTAN GALLERY'}
                </span>
                
                {/* Simulated inner active page */}
                <div className="flex gap-3 text-[10px] text-slate-400 font-mono">
                  {['Home', 'Members', 'Music', 'Videos', 'Gallery', 'Events', 'news'].map(p => (
                    <span 
                      key={p} 
                      onClick={() => setPreviewTab(p)}
                      className={`hover:text-white transition-colors cursor-pointer capitalize ${
                        previewTab === p ? 'text-purple-400 font-bold border-b border-purple-400 pb-0.5' : ''
                      }`}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* VIEW TARGET: HOME */}
              {previewTab === 'Home' && (
                <div className="space-y-6">
                  {/* HERO HEADER */}
                  <div 
                    className="relative p-8 pb-10 rounded-2xl border border-purple-500/10 text-center space-y-4 overflow-hidden bg-gradient-to-br from-[#120521] to-[#04010a]"
                    style={draftConfig.home.heroImageUrl ? {
                      backgroundImage: `linear-gradient(to bottom, rgba(18, 5, 33, 0.85), rgba(4, 1, 10, 0.95)), url(${draftConfig.home.heroImageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    } : {}}
                  >
                    <span className="relative z-10 text-[9px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-0.5 rounded-full select-none inline-block">
                      DRAFT VERSION PREVIEW
                    </span>
                    <h1 className="relative z-10 text-3xl font-black text-white uppercase tracking-tight">
                      {draftConfig.home.heroTitle}
                    </h1>
                    <p className="relative z-10 text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                      {draftConfig.home.heroSubtitle}
                    </p>

                    {/* Simulating static typewriter phrase loop */}
                    <div className="relative z-10 pt-2 text-xs font-mono text-purple-300 h-6">
                      &gt; {draftConfig.home.typingPhrases?.[0] || 'Looking for passion...'}
                    </div>
                  </div>

                  {/* WELCOME SECTION */}
                  <div className="p-5 border border-purple-500/10 bg-purple-950/10 rounded-xl space-y-2">
                    <h2 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                      <span>💜</span> {draftConfig.home.welcomeHeading}
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {draftConfig.home.welcomeMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* VIEW TARGET: MEMBERS */}
              {previewTab === 'Members' && (
                <div className="space-y-5">
                  <span className="text-xs font-mono uppercase text-purple-400">Members Showcase Profiles</span>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {draftConfig.members?.map((m: any) => (
                      <div key={m.id} className="p-4 border border-white/5 bg-[#0a0515]/60 hover:border-purple-500/10 rounded-xl flex items-start gap-4">
                        <img src={m.portraitUrl} alt={m.name} className="w-14 h-14 rounded-full border border-purple-500/20 object-cover shrink-0" referrerPolicy="no-referrer" />
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-white">{m.name}</span>
                            <span className="text-xs">{m.emoji}</span>
                            <span className="text-[10px] text-purple-400 font-mono tracking-widest uppercase">({m.mbti})</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {m.biography}
                          </p>

                          {m.funFacts && m.funFacts.length > 0 && (
                            <div className="pt-2 border-t border-white/5 space-y-1">
                              <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest block font-bold">Featured Fact</span>
                              <p className="text-[10px] text-[#e9d5ff] leading-relaxed font-mono italic">
                                &quot;{m.funFacts[0]}&quot;
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW TARGET: MUSIC */}
              {previewTab === 'Music' && (
                <div className="space-y-5">
                  <span className="text-xs font-mono uppercase text-[#ec4899]">BTS Discography & Albums</span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {draftConfig.albums?.map((b: any) => (
                      <div key={b.id} className="p-3 border border-purple-500/5 bg-purple-950/10 rounded-xl space-y-2 text-center text-xs">
                        <img src={b.coverUrl} alt={b.title} className="w-24 h-24 rounded mx-auto object-cover border border-purple-500/15" />
                        <div>
                          <span className="font-bold text-white block truncate">{b.title}</span>
                          <span className="text-[10px] font-mono text-slate-400">{b.year} Studio</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW TARGET: VIDEOS */}
              {previewTab === 'Videos' && (
                <div className="space-y-5">
                  <span className="text-xs font-mono uppercase text-red-400">YouTube Stream Showcase</span>
                  
                  <div className="space-y-4">
                    {draftConfig.videos?.map((v: any) => (
                      <div key={v.id} className="p-3 border border-white/5 bg-[#0b0515]/60 rounded-xl space-y-2">
                        <div className="aspect-video bg-black/80 rounded border border-purple-500/10 flex items-center justify-center text-slate-500 text-xs">
                          [ YouTube Video Frame Embed placeholder: {v.url} ]
                        </div>
                        <div className="space-y-1">
                          <span className="font-sans font-bold text-white text-xs block">{v.title}</span>
                          <p className="text-[11px] text-slate-400 line-clamp-1 leading-normal">{v.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW TARGET: GALLERY */}
              {previewTab === 'Gallery' && (
                <div className="space-y-5">
                  <span className="text-xs font-mono uppercase text-purple-400">Photo Masonry Grid</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {draftConfig.gallery?.map((g: any) => (
                      <div key={g.id} className="rounded-lg overflow-hidden border border-purple-500/5 bg-[#0a0515] relative group">
                        <img src={g.url} alt={g.title} className="w-full aspect-square object-cover" />
                        <div className="p-2 bg-black/95 text-[10px] text-slate-350 flex justify-between items-center font-mono select-none">
                          <span className="truncate">{g.title}</span>
                          <span className="text-purple-300 shrink-0">{g.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW TARGET: EVENTS */}
              {previewTab === 'Events' && (
                <div className="space-y-5">
                  <span className="text-xs font-mono uppercase text-yellow-400">Milestones & Countdowns</span>
                  
                  <div className="space-y-3 font-mono text-xs">
                    {draftConfig.events?.map((e: any) => (
                      <div key={e.id} className="p-3 border border-yellow-500/10 bg-yellow-950/10 rounded-xl space-y-1.5">
                        <div className="flex justify-between font-bold text-white uppercase text-[10px]">
                          <span>{e.title}</span>
                          <span className="text-yellow-400">{e.date}</span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-slate-400 font-sans">
                          Location: {e.location || 'Seoul Stadium'}
                        </p>
                        <div className="bg-black/40 text-[9px] text-slate-400 rounded-md p-1.5 uppercase font-mono text-center">
                          Countdown Target: <span className="text-purple-300 font-bold">{e.dDayTarget}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW TARGET: NEWS */}
              {previewTab === 'news' && (
                <div className="space-y-4">
                  <span className="text-xs font-mono uppercase text-[#eab308]">Live news articles</span>
                  
                  {draftConfig.news?.map((item: any) => (
                     <div key={item.id} className="p-3.5 border border-[#eab308]/15 bg-yellow-950/5 rounded-xl space-y-1.5 font-sans">
                       <div className="flex justify-between items-center text-[10px] font-mono text-amber-500">
                         <span>{item.category}</span>
                         <span>{item.date}</span>
                       </div>
                       <h4 className="font-bold text-white text-xs">{item.title}</h4>
                       <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{item.summary}</p>
                     </div>
                  ))}
                </div>
              )}

            </div>
          </section>
          </>
          )}

        </div>

      </div>

      {deleteConfirm && (
        <div id="custom-delete-confirm-modal" className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-[#180e2d]/95 border border-purple-500/30 rounded-2xl p-6 shadow-2xl space-y-4 font-sans text-center">
            <div className="mx-auto w-12 h-12 bg-red-950/40 border border-red-500/20 rounded-full flex items-center justify-center text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Confirm Removal</h3>
              <p className="text-xs text-purple-200/70 leading-relaxed font-sans">{deleteConfirm.message}</p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-purple-950/40 hover:bg-purple-900 border border-purple-500/20 text-purple-300 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteConfirm.onConfirm();
                  setDeleteConfirm(null);
                }}
                className="px-4 py-2 bg-red-650 hover:bg-red-600 font-bold text-white rounded-lg text-xs font-sans cursor-pointer transition-all hover:shadow hover:shadow-red-600/20"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
