/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useBackend } from '../context/BackendContext';
import { 
  Smile, 
  Upload, 
  Image as ImageIcon, 
  Plus, 
  Search, 
  Share2, 
  MessageSquare, 
  Clock, 
  Sparkles, 
  User, 
  Check, 
  X,
  PlusCircle,
  Hash,
  Download,
  Eye
} from 'lucide-react';

interface StaticMeme {
  id: string;
  title: string;
  description: string;
  url: string;
  username: string;
  displayName: string;
  uploadedAt: string;
  tags: string[];
}

export default function MemesSection() {
  const { media, uploadMedia, currentUser, refreshData } = useBackend();
  
  // Search query filter
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active viewer ID for meme preview
  const [activeMemeViewerId, setActiveMemeViewerId] = useState<string | null>(null);

  // Robust Direct Image Download Helper for Memes
  const triggerMemeDownload = async (e: React.MouseEvent, url: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'meme'}.png`;
    
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
  
  // Form states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [memeTitle, setMemeTitle] = useState('');
  const [memeDesc, setMemeDesc] = useState('');
  const [memeUrl, setMemeUrl] = useState('');
  const [memeFileBase64, setMemeFileBase64] = useState<string | null>(null);
  const [memeTagsInput, setMemeTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initial fun memes data to populate when user visits
  const staticMemes: StaticMeme[] = [];

  // Merge dynamic memes uploaded on backend with our standard static memes
  const dynamicMemes = media
    .filter(item => item.category === 'Memes')
    .map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      url: item.url,
      username: item.username,
      displayName: item.displayName,
      uploadedAt: item.uploadedAt,
      tags: item.tags || []
    }));

  const allMemes = [...dynamicMemes, ...staticMemes];

  // Apply Search Filtering (using lower-case containment checks)
  const filteredMemes = allMemes.filter(meme => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      meme.title.toLowerCase().includes(q) ||
      meme.description.toLowerCase().includes(q) ||
      meme.username.toLowerCase().includes(q) ||
      meme.displayName.toLowerCase().includes(q) ||
      meme.tags.some(tag => tag.toLowerCase().includes(q))
    );
  });

  // Handle local picture upload change -> read into Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setStatusMessage({ type: 'error', text: 'Image file size must be less than 3MB for database storage.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setMemeFileBase64(reader.result as string);
        setStatusMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Meme to Backend Context
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memeTitle.trim()) {
      setStatusMessage({ type: 'error', text: 'Meme Title is strictly required.' });
      return;
    }

    const imageToUpload = memeFileBase64 || memeUrl.trim();
    if (!imageToUpload) {
      setStatusMessage({ type: 'error', text: 'Please upload a photo file or paste a direct image URL.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const parsedTags = memeTagsInput
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(t => t.length > 0);

      const payload = {
        type: 'image' as const,
        url: imageToUpload,
        title: memeTitle.trim(),
        description: memeDesc.trim(),
        category: 'Memes',
        tags: parsedTags.length > 0 ? parsedTags : ['ARMY_Meme', 'Funny']
      };

      const success = await uploadMedia(payload);
      if (success) {
        setStatusMessage({ type: 'success', text: 'Meme uploaded successfully to public boards! 🎉' });
        // Reset inputs
        setMemeTitle('');
        setMemeDesc('');
        setMemeUrl('');
        setMemeFileBase64(null);
        setMemeTagsInput('');
        
        // Auto-close form after short delay
        setTimeout(() => {
          setIsUploadOpen(false);
          setStatusMessage(null);
        }, 1500);

        // Force reload backend lists
        await refreshData();
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to upload meme. Please try again.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'General error uploading meme.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* HEADER HERO AREA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-sans font-extrabold text-white flex items-center gap-2">
            ARMY Meme Vault <Smile className="w-6 h-6 text-emerald-400 animate-bounce" />
          </h2>
          <p className="text-gray-400 text-sm font-sans mt-1">
            Laugh together! Upload, discover and spread hilarious BTS memories, funny reaction faces, and classic ARMY inside jokes.
          </p>
        </div>

        {/* Action button to expand upload form */}
        <button
          onClick={() => setIsUploadOpen(!isUploadOpen)}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-lg active:scale-95 cursor-pointer border ${
            isUploadOpen 
              ? 'bg-rose-600/25 border-rose-500/40 text-rose-300' 
              : 'bg-gradient-to-r from-emerald-650 to-teal-650 hover:from-emerald-600 hover:to-teal-500 text-white border-white/10'
          }`}
        >
          {isUploadOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isUploadOpen ? 'Cancel Upload' : 'Upload Meme Pic'}
        </button>
      </div>

      {/* UPLOAD EXPANDABLE COMPONENT FORM */}
      {isUploadOpen && (
        <form 
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl border-2 border-emerald-500/20 bg-black/60 backdrop-blur-xl animate-fade-in space-y-5"
        >
          <div className="flex items-center gap-2 text-emerald-400 border-b border-white/5 pb-3">
            <PlusCircle className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold font-mono uppercase tracking-wider">Community Meme Publisher</span>
          </div>

          {statusMessage && (
            <div className={`p-4 rounded-xl text-xs font-sans ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30' 
                : 'bg-rose-950/40 text-rose-400 border border-rose-500/30'
            }`}>
              {statusMessage.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-gray-400 uppercase">Meme Concept Title *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Jungkook when the iced americano is empty"
                  value={memeTitle}
                  onChange={(e) => setMemeTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-white placeholder:text-gray-600 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-sans outline-none outline-0"
                />
              </div>

              {/* Description input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-gray-400 uppercase">Caption or Context</label>
                <textarea 
                  rows={3}
                  placeholder="e.g. Namjoon's face in the background makes it 10x better..."
                  value={memeDesc}
                  onChange={(e) => setMemeDesc(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-white placeholder:text-gray-600 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-sans outline-none outline-0"
                />
              </div>

              {/* Tags split by commas */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-gray-400 uppercase">Tags (comma separated)</label>
                <input 
                  type="text"
                  placeholder="e.g. Suga, Funny, CatYoongi"
                  value={memeTagsInput}
                  onChange={(e) => setMemeTagsInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-white placeholder:text-gray-600 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono outline-none outline-0"
                />
              </div>
            </div>

            {/* Right column - Picture sources */}
            <div className="space-y-4 flex flex-col justify-between">
              
              <div className="space-y-4">
                {/* File Upload zone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-gray-400 uppercase">Upload Meme Image File</label>
                  <div className="relative border-2 border-dashed border-white/10 rounded-xl p-4 bg-black/20 hover:border-emerald-500/35 transition-all text-center">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-2 pointer-events-none">
                      <div className="flex justify-center"><Upload className="w-6 h-6 text-emerald-400" /></div>
                      <p className="text-xs text-gray-400 font-sans">
                        {memeFileBase64 ? '✓ Selected file successfully' : 'Drag & drop image file or browse'}
                      </p>
                      <p className="text-[10px] text-gray-600 font-sans">Local picture (.jpg, .png, .gif under 3MB)</p>
                    </div>
                  </div>
                </div>

                {/* OR Image URL link */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-500 uppercase">OR PASTE DIRECT PICTURE WEB ADDRESS URL</span>
                  </div>
                  <input 
                    type="url"
                    placeholder="https://example.com/meme-expression-suga.jpg"
                    disabled={!!memeFileBase64}
                    value={memeUrl}
                    onChange={(e) => setMemeUrl(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white placeholder:text-gray-600 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono outline-none outline-0 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Action submission trigger */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold font-mono rounded-xl transition-all shadow shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-97 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Submit Picture Meme public
              </button>
            </div>
          </div>

          {/* Upload preview image thumbnail */}
          {(memeFileBase64 || memeUrl) && (
            <div className="pt-4 border-t border-white/5 flex flex-col items-center">
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest mb-2">Live Graphic Preview</span>
              <div className="max-w-[200px] max-h-[160px] rounded-lg border border-white/10 overflow-hidden bg-black/40">
                <img 
                  src={memeFileBase64 || memeUrl} 
                  alt="Meme preview placeholder" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}
        </form>
      )}

      {/* FILTER SEARCH CRITERIA */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-black/35 p-3 rounded-xl border border-white/5">
        <div className="relative flex-grow">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input 
            type="text"
            placeholder="Search communities memes tags, bias names, funny topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 text-xs pl-9 pr-4 py-2 rounded-lg border border-white/5 text-white outline-none focus:border-emerald-500/30 placeholder:text-slate-500 font-sans"
          />
        </div>
        
        <span className="text-[10px] text-gray-500 font-mono self-center shrink-0">
          Showing {filteredMemes.length} hilarious BTS chronicles memes
        </span>
      </div>

      {/* PUBLIC MEMES LIST GRID */}
      {filteredMemes.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-white/5 bg-white/[0.01]">
          <Smile className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-mono text-sm">No BTS memes found matching your filter coordinates.</p>
          <p className="text-xs text-gray-600 font-sans mt-1">Be the first to upload this particular category!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemes.map((meme, index) => (
            <React.Fragment key={meme.id}>
              <div 
                onClick={() => setActiveMemeViewerId(meme.id)}
                className="rounded-2xl border border-white/5 bg-black/45 backdrop-blur-md overflow-hidden flex flex-col justify-between hover:border-emerald-500/30 hover:shadow-[0_10px_30px_rgba(16,185,129,0.06)] transition-all duration-300 relative group cursor-pointer"
              >
                {/* Image thumbnail display */}
                <div className="h-56 relative overflow-hidden bg-[#0a0515]/50 flex items-center justify-center">
                  <img 
                    src={meme.url} 
                    alt={meme.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback template icon if image fails to render
                      (e.target as any).src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80';
                    }}
                  />

                  {/* Hover Action Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-350 flex items-center justify-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMemeViewerId(meme.id);
                      }}
                      className="p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-black transition-all transform hover:scale-110 shadow-lg cursor-pointer"
                      title="Preview Meme"
                    >
                      <Eye className="w-4 h-4 text-black" />
                    </button>
                    <button
                      onClick={(e) => {
                        triggerMemeDownload(e, meme.url, meme.title);
                      }}
                      className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white transition-all transform hover:scale-110 shadow-lg cursor-pointer"
                      title="Download Meme"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Subtle top metadata stamp */}
                  <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent p-3 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-mono text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                      Meme Topic
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-400" /> 
                      {new Date(meme.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Caption and description area with clean spacing and NO likes/views display */}
                <div className="p-4 flex-grow flex flex-col justify-between gap-4 bg-gradient-to-b from-white/[0.02] to-black/30">
                  <div className="space-y-2">
                    <h3 className="font-sans font-extrabold text-sm text-white group-hover:text-emerald-300 transition-colors leading-snug">
                      {meme.title}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed font-sans line-clamp-3">
                      {meme.description}
                    </p>
                  </div>

                  <div className="space-y-3.5 pt-3 border-t border-white/5">
                    {/* Tags list */}
                    {meme.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {meme.tags.map((tag: string, idx) => (
                          <span 
                            key={idx} 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchQuery(tag);
                            }}
                            className="text-[9px] font-mono pr-1.5 py-0.5 text-emerald-400 hover:underline cursor-pointer flex items-center"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Publisher badge details */}
                    <div className="flex items-center justify-between text-[10px] text-gray-550 font-mono">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-gray-400 shrink-0 font-bold truncate">@{meme.username}</span>
                      </span>
                      <span className="text-[9px] text-[#22c55e]/60 bg-emerald-950/10 border border-emerald-950/20 px-1.5 py-0.5 rounded">
                        User Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ================= GORGEOUS MEME VIEWER PORTAL ================= */}
      {activeMemeViewerId && (allMemes.find(m => m.id === activeMemeViewerId)) && createPortal(
        (() => {
          const currentMeme = allMemes.find(m => m.id === activeMemeViewerId)!;
          return (
            <div 
              id="meme-magnifier-container"
              className="fixed inset-0 z-[9999] bg-black/98 backdrop-blur-md flex flex-col md:flex-row justify-between"
              onClick={() => setActiveMemeViewerId(null)}
            >
              {/* LEFT COLUMN: LARGE IMAGE VIEWPORT */}
              <div 
                className="flex-1 flex flex-col justify-between h-[60vh] md:h-full relative border-r border-white/5 bg-[#030805]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top Bar inside Viewport */}
                <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
                  <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/20 px-3 py-1 rounded-full">
                    😆 Memes Vault Preview
                  </span>
                  <button 
                    onClick={() => setActiveMemeViewerId(null)}
                    className="p-2 rounded-full bg-black/50 text-white hover:bg-emerald-500 hover:text-black transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Central Large Image */}
                <div className="flex-1 flex items-center justify-center p-6 relative">
                  <img 
                    src={currentMeme.url} 
                    alt={currentMeme.title} 
                    className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Bottom Actions inside Viewport */}
                <div className="p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Uploaded on {new Date(currentMeme.uploadedAt).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={(e) => triggerMemeDownload(e, currentMeme.url, currentMeme.title)}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-4 py-2 rounded-xl hover:bg-emerald-500 hover:text-black transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download Meme
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: DETAIL PANEL */}
              <div 
                className="w-full md:w-[380px] h-[40vh] md:h-full bg-slate-950/95 border-t md:border-t-0 border-white/5 flex flex-col justify-between overflow-y-auto font-sans p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-6">
                  {/* Header Details */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-extrabold text-white leading-snug">
                      {currentMeme.title}
                    </h2>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="p-1 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] uppercase tracking-wider">
                        Verified Meme
                      </span>
                      <span className="text-gray-400 font-mono text-[10px]">
                        ID: {currentMeme.id}
                      </span>
                    </div>
                  </div>

                  {/* Publisher Detail */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400 font-bold font-mono text-sm">
                        {currentMeme.username ? currentMeme.username.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">@{currentMeme.username || 'anonymous_army'}</div>
                        <div className="text-[10px] text-gray-550 font-mono">{currentMeme.displayName || 'ARMY Community Contributor'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold block">Caption / Context</span>
                    <p className="text-xs text-gray-300 leading-relaxed bg-white/[0.01] border border-white/5 p-3 rounded-lg font-sans">
                      {currentMeme.description}
                    </p>
                  </div>

                  {/* Tags */}
                  {currentMeme.tags && currentMeme.tags.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold block">Categories & Bias</span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentMeme.tags.map((tag: string, index: number) => (
                          <span 
                            key={index} 
                            className="text-[10px] font-mono bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded cursor-pointer transition-colors"
                            onClick={() => {
                              setSearchQuery(tag);
                              setActiveMemeViewerId(null);
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Close info */}
                <div className="pt-6 border-t border-white/5 flex flex-col gap-2">
                  <button 
                    onClick={() => setActiveMemeViewerId(null)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold border border-white/5 transition-all cursor-pointer text-center font-sans"
                  >
                    Close Viewport
                  </button>
                </div>
              </div>
            </div>
          );
        })(),
        document.body
      )}

    </div>
  );
}
