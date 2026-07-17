import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBackend, MediaItem, Comment } from '../context/BackendContext';
import { GALLERY_ITEMS } from '../data/btsData';
import { 
  Search, Download, Share2, ZoomIn, ChevronLeft, ChevronRight, X, 
  Sparkles, CheckCircle2, Heart, MessageSquare, Plus, UploadCloud, 
  Send, Bookmark, AlertCircle, Eye, CornerDownRight, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function GallerySection({ items, initialCategory = 'All' }: { items?: any[], initialCategory?: string }) {
  const { 
    media, 
    uploadMedia, 
    interactWithMedia, 
    submitComment, 
    sessionId, 
    currentUser, 
    registerUser 
  } = useBackend();

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);
  
  // Viewer and feedback states
  const [activeViewerId, setActiveViewerId] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Robust Direct Image Download Helper
  const triggerDownload = async (e: React.MouseEvent, url: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'artwork'}.png`;
    
    // 1. If it's base64 data
    if (url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // 2. Try fetching the file to force save-as behavior
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
        return;
      }
    } catch (err) {
      console.warn("CORS fetch blocked direct download, falling back to simple link trigger:", err);
    }

    // 3. Fallback: Open in new tab/window for direct download
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Upload modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [imageTitle, setImageTitle] = useState('');
  const [imageDesc, setImageDesc] = useState('');
  const [imageCategory, setImageCategory] = useState('BTS');
  const [imageTags, setImageTags] = useState('');
  const [imageFileBase64, setImageFileBase64] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  
  // Nickname validation for uploaders not yet registered
  const [customUsername, setCustomUsername] = useState(currentUser?.username || '');
  const [customDisplayName, setCustomDisplayName] = useState(currentUser?.displayName || '');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setCustomUsername(currentUser.username);
      setCustomDisplayName(currentUser.displayName);
    }
  }, [currentUser]);

  // Categories list
  const categoriesList = [
    'All', 'BTS', 'RM', 'Jin', 'SUGA', 'j-hope', 'Jimin', 'V', 'Jung Kook', 'Concert', 'Festa', 'Fan Art'
  ];

  // Map static default images (GALLERY_ITEMS) into the uniform MediaItem schema so interaction fits cleanly
  const [localInteractions, setLocalInteractions] = useState<Record<string, { likes: string[], comments: Comment[] }>>({});

  // Sync back unified items
  const getUnifiedItems = (): any[] => {
    // 1. Get database uploaded images
    const dbImages = media
      .filter((m: MediaItem) => m.type === 'image')
      .map((m: MediaItem) => ({
        id: m.id,
        url: m.url,
        title: m.title,
        description: m.description,
        category: m.category,
        tags: m.tags,
        username: m.username,
        displayName: m.displayName,
        uploadedAt: m.uploadedAt,
        likes: m.likes || [],
        comments: m.comments || [],
        sharesCount: m.sharesCount || 0,
        saves: m.saves || [],
        bookmarks: m.bookmarks || [],
        reports: m.reports || 0,
        isCustom: true
      }));

    // 2. Map static images as compatible cards
    const staticImages = ((items && items.length > 0) ? items : GALLERY_ITEMS).map((item, idx) => {
      const interaction = localInteractions[item.id] || { likes: [], comments: [] };
      return {
        id: item.id,
        url: item.url,
        title: item.title,
        description: `Official concept shoot and visual frame of ${item.category} anthology.`,
        category: item.category,
        tags: ['BTS', item.category, 'ConceptCard', 'HD'],
        username: 'hybe_admin',
        displayName: 'HYBE official',
        uploadedAt: new Date(2025, 5, 13).toISOString(),
        likes: interaction.likes,
        comments: interaction.comments,
        sharesCount: 154 + idx,
        saves: [],
        bookmarks: [],
        reports: 0,
        isCustom: false
      };
    });

    const combined = [...dbImages, ...staticImages];

    // Sort: Newly uploaded pictures (user or admin) should always be at the very top.
    // We sort strictly by uploadedAt in descending order (newest first).
    return combined.sort((a, b) => {
      const aTime = new Date(a.uploadedAt).getTime() || 0;
      const bTime = new Date(b.uploadedAt).getTime() || 0;
      return bTime - aTime;
    });
  };

  const unifiedItems = getUnifiedItems();

  // Filter items matching layout criteria
  const filteredItems = unifiedItems.filter(item => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      item.title.toLowerCase().includes(q) || 
      item.category.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      item.tags.some((t: string) => t.toLowerCase().includes(q)) ||
      item.displayName.toLowerCase().includes(q);
    
    if (selectedCategory === 'All') return matchesSearch;
    return item.category === selectedCategory && matchesSearch;
  });

  // Active viewing item finder
  const currentItemIndex = unifiedItems.findIndex(item => item.id === activeViewerId);
  const currentItem = currentItemIndex !== -1 ? unifiedItems[currentItemIndex] : null;

  // Grab related images adjacent mapping (same category, excluding the main image)
  const relatedImages = currentItem 
    ? unifiedItems
        .filter(item => item.category === currentItem.category && item.id !== currentItem.id)
        .slice(0, 4)
    : [];

  // Drag and Drop files handlers
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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
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

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image uploads (.png, .jpeg, .jpg, .webp, .gif) are supported 💜');
      return;
    }

    setUploadError('Optimizing image...');
    try {
      const compressed = await compressImage(file);
      if (!compressed) {
        throw new Error('Image compression collapsed');
      }
      setImageFileBase64(compressed);
      setUploadError('');
    } catch (err) {
      setUploadError('Error compressing local file.');
    }
  };

  // Submit media image with robust parameter validation
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess(false);

    // Required fields check
    const activeUsername = currentUser?.username || customUsername.trim().toLowerCase();
    const activeDisplayName = currentUser?.displayName || customDisplayName.trim();

    if (!activeUsername) {
      setUploadError('Validation failed: Username is a required parameter.');
      return;
    }
    if (!activeDisplayName) {
      setUploadError('Validation failed: Display Name is a required parameter.');
      return;
    }
    if (!imageTitle.trim()) {
      setUploadError('Validation failed: Image Title is required.');
      return;
    }
    if (!imageDesc.trim()) {
      setUploadError('Validation failed: Description is required.');
      return;
    }
    if (!imageFileBase64) {
      setUploadError('Validation failed: Please choose or drop an image file first.');
      return;
    }

    // Process Tags
    const tagsArray = imageTags
      .split(',')
      .map(t => t.trim().replace('#', ''))
      .filter(t => t.length > 0);

    // Auto register if user specified nicknames
    if (!currentUser && activeUsername && activeDisplayName) {
      await registerUser(activeUsername, activeDisplayName);
    }

    // Upload payload
    const ok = await uploadMedia({
      type: 'image',
      url: imageFileBase64,
      title: imageTitle.trim(),
      description: imageDesc.trim(),
      category: imageCategory,
      tags: tagsArray.length > 0 ? tagsArray : ['ARMY', imageCategory],
      username: activeUsername,
      displayName: activeDisplayName
    });

    if (ok) {
      setUploadSuccess(true);
      setImageTitle('');
      setImageDesc('');
      setImageTags('');
      setImageFileBase64('');
      
      // Auto-switch filter to All so they immediately see their new upload
      setSelectedCategory('All');
      
      // Auto-close modal after 1.5 seconds to show success state clearly and return to the main gallery
      setTimeout(() => {
        setIsUploadOpen(false);
        setUploadSuccess(false);
      }, 1500);
    } else {
      setUploadError('Server side processing error. Try again.');
    }
  };

  // Engagement triggers
  const handleLike = async (id: string, isCustom: boolean) => {
    if (isCustom) {
      await interactWithMedia(id, 'like');
    } else {
      // Local interaction state for static images
      setLocalInteractions(prev => {
        const current = prev[id] || { likes: [], comments: [] };
        const hasLiked = current.likes.includes(sessionId);
        const nextLikes = hasLiked 
          ? current.likes.filter(x => x !== sessionId)
          : [...current.likes, sessionId];
        return {
          ...prev,
          [id]: { ...current, likes: nextLikes }
        };
      });
    }
  };

  const handleShareCopy = (url: string, id: string, isCustom: boolean) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
      
      if (isCustom) {
        interactWithMedia(id, 'share');
      }
    });
  };

  // Post comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeViewerId) return;

    if (currentItem?.isCustom) {
      await submitComment(activeViewerId, commentText.trim());
      setCommentText('');
    } else {
      // Static image comment simulate
      const commentObj: Comment = {
        id: 'static-cmt-' + Date.now(),
        username: currentUser?.username || 'guest_army',
        displayName: currentUser?.displayName || 'ARMY 💜',
        content: commentText.trim(),
        timestamp: new Date().toISOString(),
        replies: []
      };

      setLocalInteractions(prev => {
        const current = prev[activeViewerId] || { likes: [], comments: [] };
        return {
          ...prev,
          [activeViewerId]: {
            ...current,
            comments: [commentObj, ...current.comments]
          }
        };
      });
      setCommentText('');
    }
  };

  // Reply Comment dispatcher
  const handleReplySubmit = async (parentId: string) => {
    if (!replyText.trim() || !activeViewerId) return;

    if (currentItem?.isCustom) {
      await submitComment(activeViewerId, replyText.trim(), parentId);
      setReplyText('');
      setReplyingToCommentId(null);
    } else {
      // Local replies sync
      setLocalInteractions(prev => {
        const current = prev[activeViewerId] || { likes: [], comments: [] };
        const updatedComments = current.comments.map(c => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), {
                id: 'static-rep-' + Date.now(),
                username: currentUser?.username || 'guest_army',
                displayName: currentUser?.displayName || 'ARMY 💜',
                content: replyText.trim(),
                timestamp: new Date().toISOString()
              }]
            };
          }
          return c;
        });

        return {
          ...prev,
          [activeViewerId]: { ...current, comments: updatedComments }
        };
      });
      setReplyText('');
      setReplyingToCommentId(null);
    }
  };

  const navigateViewer = (direction: 'next' | 'prev') => {
    if (!activeViewerId) return;
    const count = unifiedItems.length;
    let nextIdx = direction === 'next' ? currentItemIndex + 1 : currentItemIndex - 1;

    if (nextIdx >= count) nextIdx = 0;
    if (nextIdx < 0) nextIdx = count - 1;

    setActiveViewerId(unifiedItems[nextIdx].id);
    setReplyingToCommentId(null);
    setCommentText('');
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[10px] font-mono text-purple-400 tracking-wider uppercase flex items-center gap-1 mb-1">
            🖼️ HD CONCEPT SPACE <Sparkles className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20" />
          </span>
          <h2 className="text-2xl md:text-3xl font-sans font-black text-white uppercase tracking-wider">
            Bangtan Photo Sandbox
          </h2>
          <p className="text-gray-400 text-xs max-w-xl">
            Explore authentic HD editorial shoots. Users can upload images directly, review tags, comment replies, and copy share coordinates.
          </p>
        </div>

        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative flex-grow md:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search title, category, artist, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-purple-500/20 focus:border-purple-500/50 text-white outline-none placeholder:text-gray-500 transition-all"
            />
          </div>

          <button
            id="register-media-upload-btn"
            onClick={() => {
              setUploadError('');
              setIsUploadOpen(true);
            }}
            className="p-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-sans text-xs font-bold leading-tight flex items-center gap-2 shadow-lg shadow-purple-500/10 cursor-pointer transition-all"
          >
            <UploadCloud className="w-4 h-4" /> Upload Photo / Artwork
          </button>
        </div>
      </div>

      {/* FILTER BUTTONS ROW */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-purple-950 scrollbar-track-transparent">
        {categoriesList.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-[11px] font-mono font-bold px-4 py-2 rounded-full border transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                : 'bg-white/[0.01] border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* MASONRY IMAGE GRID */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-white/5 bg-white/[0.01]">
          <p className="text-gray-400 font-mono text-xs">No conceptual photo matches for your query. Try resetting filters.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
          {filteredItems.map(item => {
            const userLiked = item.likes.includes(sessionId);
            return (
              <div
                key={item.id}
                onClick={() => setActiveViewerId(item.id)}
                className="break-inside-avoid relative rounded-2xl overflow-hidden border border-white/5 bg-black hover:border-purple-500/40 transition-all duration-300 group cursor-pointer shadow-lg hover:shadow-purple-500/5 flex flex-col"
              >
                {/* Wallpaper wrapper with Hover Actions */}
                <div className="relative overflow-hidden w-full h-auto">
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveViewerId(item.id);
                      }}
                      className="p-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white transition-all transform hover:scale-110 shadow-lg shadow-purple-600/30 cursor-pointer"
                      title="Preview Image"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        triggerDownload(e, item.url, item.title);
                      }}
                      className="p-2 rounded-full bg-slate-850 hover:bg-slate-750 text-white transition-all transform hover:scale-110 shadow-lg cursor-pointer"
                      title="Download Image"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info Card margin element */}
                <div className="p-4 bg-gradient-to-b from-[#0c0517] to-[#040108] border-t border-white/5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 border border-purple-400/20 bg-purple-950/40 text-purple-300 rounded uppercase">
                      {item.category}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      @{item.username}
                    </span>
                  </div>

                  <h3 className="font-sans font-bold text-xs text-white line-clamp-1">
                    {item.title}
                  </h3>

                  {/* Micro Interaction Counters */}
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-2 border-t border-white/5 mt-1 pointer-events-none">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-purple-400" />
                      {item.comments.length} Comments
                    </span>
                    <span className="text-[9px] text-[#8b5cf6]">Secure Node</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= GORGEOUS MAGNIFIER LIGHTBOX VIEWPORT ================= */}
      <AnimatePresence>
        {activeViewerId && currentItem && createPortal(
          <div 
            id="gallery-magnifier-container"
            className="fixed inset-0 z-[9999] bg-[#04000a]/98 backdrop-blur-md flex flex-col lg:flex-row justify-between animate-fade-in"
          >
            {/* LEFT / CENTRAL COLUMN: LARGE VISUAL AND RELATED CARDS */}
            <div className="flex-1 flex flex-col justify-between h-[50vh] lg:h-full relative overflow-y-auto border-r border-white/5">
              
              {/* Image viewport - Raised/positioned higher on mobile and desktop */}
              <div className="flex-1 flex items-start justify-center p-4 pt-6 sm:pt-10 lg:pt-16 relative min-h-[280px]">
                {/* Slide controllers */}
                <button
                  onClick={() => navigateViewer('prev')}
                  className="absolute left-4 p-3 rounded-full bg-black/50 hover:bg-black/80 border border-white/5 text-gray-300 hover:text-white transition-all cursor-pointer z-20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <img
                  src={currentItem.url}
                  alt={currentItem.title}
                  className="max-w-full max-h-[42vh] lg:max-h-[70vh] rounded-xl object-contain shadow-[0_0_80px_rgba(168,85,247,0.25)] animate-zoom-in"
                  referrerPolicy="no-referrer"
                />

                <button
                  onClick={() => navigateViewer('next')}
                  className="absolute right-4 p-3 rounded-full bg-black/50 hover:bg-black/80 border border-white/5 text-gray-300 hover:text-white transition-all cursor-pointer z-20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Related Uploaded Images displayed right next/below of active magnifier (Strict user spec) */}
              <div className="p-4 bg-black/40 border-t border-white/5 z-10">
                <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest block mb-2.5">
                  📁 Related Conceptual Frames in category "{currentItem.category}"
                </span>
                {relatedImages.length === 0 ? (
                  <p className="text-[10px] text-gray-500 font-mono italic">No adjacent conceptual content uploaded in this category yet.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {relatedImages.map(item => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setActiveViewerId(item.id);
                          setReplyingToCommentId(null);
                        }}
                        className="h-14 rounded-lg overflow-hidden border border-white/5 hover:border-purple-500/50 transition-all cursor-pointer bg-black/85 relative group"
                      >
                        <img src={item.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDEBAR COLUMN: PROFILE BIO, DETAILED COMMENTS AND NESTED REPLIES */}
            <div className="w-full lg:w-[480px] h-[50vh] lg:h-full bg-[#080214] flex flex-col justify-between overflow-hidden relative z-20">
              
              {/* Header Profile Title section */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-900/30 border border-purple-500/35 flex items-center justify-center font-sans font-bold text-white text-xs select-none shadow">
                    {currentItem.displayName.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-100 truncate">{currentItem.title}</h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Uploaded by <span className="text-purple-400">@{currentItem.username}</span> ({currentItem.displayName})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveViewerId(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-rose-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Description & Engagement Actions */}
              <div className="p-5 border-b border-white/5 bg-black/10 flex flex-col gap-3 shrink-0">
                <p className="text-xs text-gray-300 leading-relaxed max-h-20 overflow-y-auto">
                  {currentItem.description}
                </p>

                {/* Render Tags */}
                <div className="flex flex-wrap gap-1">
                  {currentItem.tags.map((tag: string) => (
                    <span key={tag} className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white/[0.02] border border-white/5 text-gray-400 flex items-center gap-0.5">
                      <Tag className="w-2.5 h-2.5 text-purple-400" /> {tag}
                    </span>
                  ))}
                </div>

                {/* Instant Actions Row */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5 mt-1">
                  <button
                    onClick={() => handleShareCopy(currentItem.url, currentItem.id, currentItem.isCustom)}
                    className="p-2 px-3 rounded-xl bg-white/5 text-xs font-bold text-gray-300 hover:bg-white/10 flex items-center gap-1.5 transition-all cursor-pointer relative"
                  >
                    <Share2 className="w-3.5 h-3.5" /> 
                    {copiedNotification ? 'Copied' : 'Copy Link'}
                  </button>

                  <button
                    onClick={(e) => triggerDownload(e, currentItem.url, currentItem.title)}
                    className="p-2 px-3 rounded-xl bg-purple-950/30 text-purple-300 border border-purple-500/20 text-xs font-bold hover:bg-purple-900/35 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>

              {/* COMMENTS AND REPLIES FEED CONTAINER */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <span className="text-[10px] font-mono tracking-widest text-slate-400 block uppercase border-b border-white/5 pb-2">
                  💬 Public Engagement Guestbook ({currentItem.comments.length} primary chats)
                </span>

                {currentItem.comments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[11px] text-gray-500 font-mono">No discussions yet. Be the first to start the chat 💜</p>
                  </div>
                ) : (
                  <div className="space-y-4 font-sans">
                    {currentItem.comments.map((comment: Comment) => (
                      <div key={comment.id} className="space-y-2 group">
                        {/* Parent comment */}
                        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-300 uppercase select-none shrink-0">
                            {comment.displayName.slice(0, 1)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-200">
                                {comment.displayName}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">
                                {new Date(comment.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                              {comment.content}
                            </p>
                            
                            {/* Reply button */}
                            <button
                              onClick={() => {
                                setReplyingToCommentId(comment.id);
                                setReplyText('');
                              }}
                              className="text-[10px] text-purple-400 font-mono hover:text-purple-300 mt-2 block cursor-pointer"
                            >
                              Reply to thread
                            </button>
                          </div>
                        </div>

                        {/* Nesting comments/replies container */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="pl-6 space-y-2">
                            {comment.replies.map((reply: Comment) => (
                              <div key={reply.id} className="p-2.5 rounded-xl bg-purple-950/15 border border-purple-950/20 flex gap-2">
                                <CornerDownRight className="w-4 h-4 text-purple-500/60 shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-purple-300">
                                      {reply.displayName}
                                    </span>
                                    <span className="text-[9px] text-slate-600 font-mono">
                                      {new Date(reply.timestamp).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-300 mt-0.5 leading-normal">
                                    {reply.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Expand reply form */}
                        {replyingToCommentId === comment.id && (
                          <div className="pl-6 flex gap-2">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={`Reply to @${comment.username}...`}
                              className="flex-1 bg-black/60 text-xs px-3 py-1.5 rounded-lg border border-purple-500/20 focus:border-purple-500/50 outline-none text-white"
                            />
                            <button
                              onClick={() => handleReplySubmit(comment.id)}
                              className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setReplyingToCommentId(null)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Input primary message bar */}
              <form onSubmit={handleCommentSubmit} className="p-4 bg-black/40 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your love for thisconceptual artwork..."
                  className="flex-grow bg-black/60 text-xs px-4 py-3 rounded-xl border border-purple-500/20 focus:border-purple-500/50 outline-none text-white placeholder:text-gray-600"
                />
                <button
                  type="submit"
                  className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md shadow-purple-500/5"
                  title="Post comment"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* ================= GORGEOUS STRICT VALIDATION UPLOAD ARTWORK DIALOG ================= */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel border border-purple-500/30 bg-[#070112] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative mt-2 mb-8 sm:mt-8 sm:mb-12"
            >
              {/* Box header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
                    📤 Upload Photo / Artwork from Gallery
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Select concept photos, concert captures, or fan art from your device's photo gallery!</p>
                </div>
                <button
                  onClick={() => {
                    setIsUploadOpen(false);
                    setUploadSuccess(false);
                    setUploadError('');
                  }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Upload file + form layout */}
              <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Upload feedback errors */}
                {uploadError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0" /> {uploadError}
                  </div>
                )}
                
                {uploadSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-bounce">
                    <CheckCircle2 className="w-4.5 h-4.5 shrink-0" /> Image uploaded and published in sandbox! 💜
                  </div>
                )}

                {/* FILE ATTACHMENT BOX */}
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('image-file-input')?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                    dragActive ? 'border-purple-500 bg-purple-950/20' : 'border-white/10 bg-white/[0.01] hover:border-purple-500/30'
                  }`}
                >
                  <input
                    type="file"
                    id="image-file-input"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />

                  {imageFileBase64 ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/5">
                      <img src={imageFileBase64} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFileBase64('');
                        }}
                        className="absolute top-1 right-1 p-0.5 bg-black/60 hover:bg-black rounded-full text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-purple-400 animate-pulse" />
                      <p className="text-xs text-slate-200 font-bold">Tap to choose a photo from your device's own photo gallery/files</p>
                      <p className="text-[10px] text-gray-500 font-mono">Supports JPG, PNG, WEBP, GIF (Max: 8MB)</p>
                    </>
                  )}
                </div>

                {/* CUSTOM NICKNAME INPUTS: ONLY SHOWN IF NOT GUEST REGISTERED */}
                {!currentUser && (
                  <div className="grid grid-cols-2 gap-3 bg-purple-950/10 border border-purple-900/20 rounded-xl p-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-purple-400 uppercase">Username (No spacing) *</label>
                      <input
                        type="text"
                        placeholder="e.g. jungkook_stan"
                        value={customUsername}
                        onChange={(e) => setCustomUsername(e.target.value)}
                        className="w-full bg-black/55 rounded-lg border border-white/5 text-xs px-3 py-2 text-white outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-purple-400 uppercase">Display Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Hobi Lover 💜"
                        value={customDisplayName}
                        onChange={(e) => setCustomDisplayName(e.target.value)}
                        className="w-full bg-black/55 rounded-lg border border-white/5 text-xs px-3 py-2 text-white outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </div>
                )}

                {/* MAIN PARAMETERS */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Image Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. RM Indigo Studio Vibe"
                      value={imageTitle}
                      onChange={(e) => setImageTitle(e.target.value)}
                      className="w-full bg-black/45 rounded-lg border border-white/5 text-xs px-3.5 py-2.5 text-white outline-none focus:border-purple-500/50 placeholder:text-gray-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Category *</label>
                      <select
                        value={imageCategory}
                        onChange={(e) => setImageCategory(e.target.value)}
                        className="w-full bg-[#05010a] rounded-lg border border-[#211438] text-xs px-3.5 py-2.5 text-slate-200 outline-none focus:border-purple-500/50 cursor-pointer"
                      >
                        {categoriesList.filter(c => c !== 'All').map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Tags (comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. stage, concert, hobi, RM"
                        value={imageTags}
                        onChange={(e) => setImageTags(e.target.value)}
                        className="w-full bg-black/45 rounded-lg border border-white/5 text-xs px-3.5 py-2.5 text-white outline-none focus:border-purple-500/50 placeholder:text-gray-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Description *</label>
                    <textarea
                      rows={3}
                      placeholder="Discuss the frame composition, editorial shoot dates, or art direction motivation..."
                      value={imageDesc}
                      onChange={(e) => setImageDesc(e.target.value)}
                      className="w-full bg-black/45 rounded-lg border border-white/5 text-xs px-3.5 py-2.5 text-white outline-none focus:border-purple-500/50 resize-none placeholder:text-gray-600"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadOpen(false);
                      setUploadSuccess(false);
                      setUploadError('');
                    }}
                    className="p-2.5 px-4 rounded-xl bg-white/5 text-slate-300 text-xs font-semibold hover:bg-white/10 cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="p-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-sans text-xs font-bold shadow-lg shadow-purple-500/10 cursor-pointer transition-all"
                  >
                    Publish Automatically
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
