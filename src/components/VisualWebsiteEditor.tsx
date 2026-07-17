import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Monitor, Tablet, Smartphone, Save, Globe, RefreshCcw, 
  ChevronRight, ArrowRight, Home, Users, Music, Video, Image, Calendar, 
  Download, Newspaper, HelpCircle, Link2, Settings, AlertTriangle, 
  Trash, Plus, Eye, Check, Loader2, Upload, X, ChevronLeft, Layout,
  AppWindow, FileText, Menu, Play, Power, Layers
} from 'lucide-react';

interface VisualWebsiteEditorProps {
  draftConfig: any;
  setDraftConfig: React.Dispatch<React.SetStateAction<any>>;
  publishedConfig: any;
  setPublishedConfig: React.Dispatch<React.SetStateAction<any>>;
  onSaveDraft: () => Promise<void>;
  onPublish: () => Promise<void>;
  onResetDraft: () => void;
  savingDraft: boolean;
  publishing: boolean;
}

export default function VisualWebsiteEditor({
  draftConfig,
  setDraftConfig,
  publishedConfig,
  setPublishedConfig,
  onSaveDraft,
  onPublish,
  onResetDraft,
  savingDraft,
  publishing
}: VisualWebsiteEditorProps) {
  // Viewport mode: 'desktop' | 'tablet' | 'mobile'
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Navigation tabs inside the simulated website preview
  const [activePreviewTab, setActivePreviewTab] = useState<string>('Home');

  // Currently selected element for direct editor inspector
  // Format: { section: string, index?: number, field?: string, label: string, type: 'text' | 'image' | 'video' | 'select' | 'textarea' | 'checkbox' | 'array_item', options?: string[] }
  const [selectedElement, setSelectedElement] = useState<any | null>(null);

  const [activeInspectorCategory, setActiveInspectorCategory] = useState<string>('home');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string>('');

  // Local state helper for adding elements
  const [newItemText, setNewItemText] = useState<string>('');

  // Scroll mock preview container to highlighted section
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Generic Base64 Image Upload handler
  const handleGenericImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: string, field: string, index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadMessage('Reading file...');
    try {
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      setUploadMessage('Uploading...');
      const token = localStorage.getItem('bts_admin_token') || '';
      const filename = `visual_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}.${file.name.split('.').pop() || 'jpg'}`;

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          filename,
          base64: base64String,
          category: 'Image',
          tags: ['visual_editor', section]
        })
      });

      const data = await res.json();
      if (res.ok && data.url) {
        updateValue(section, field, data.url, index);
        setUploadMessage('Uploaded successfully! 💜');
        setTimeout(() => setUploadMessage(''), 3000);
      } else {
        setUploadMessage(`Failed: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      setUploadMessage('Failed processing file upload.');
    } finally {
      setIsUploading(false);
    }
  };

  // Safe deep update state helper
  const updateValue = (section: string, field: string | null | undefined, value: any, index?: number) => {
    setDraftConfig((prev: any) => {
      if (!prev) return prev;
      const updated = { ...prev };

      // Case 1: Updating an item in an array
      if (index !== undefined && Array.isArray(updated[section])) {
        const updatedArr = [...updated[section]];
        if (field) {
          updatedArr[index] = {
            ...updatedArr[index],
            [field]: value
          };
        } else {
          updatedArr[index] = value;
        }
        updated[section] = updatedArr;
      }
      // Case 2: Updating nested section field (e.g., config.home.heroTitle)
      else if (field) {
        updated[section] = {
          ...updated[section],
          [field]: value
        };
      } 
      // Case 3: Direct top-level assignment
      else {
        updated[section] = value;
      }

      // Automatically sync to local backup
      return updated;
    });
  };

  // Sizing styles for preview frame
  const getViewportWidth = () => {
    if (viewportMode === 'mobile') return 'max-w-[400px] h-[780px] shadow-2xl border-[12px] border-slate-900 rounded-[36px]';
    if (viewportMode === 'tablet') return 'max-w-[768px] h-[950px] shadow-2xl border-[16px] border-slate-800 rounded-[24px]';
    return 'w-full h-full border border-slate-800/40 rounded-xl';
  };

  // Helper: auto select inspect category and focus on click
  const inspectElement = (section: string, field: string | null, label: string, type: 'text' | 'image' | 'video' | 'textarea' | 'checkbox' | 'array_item', index?: number, options?: string[]) => {
    setSelectedElement({
      section,
      field,
      label,
      type,
      index,
      options
    });
    // Set appropriate sidebar tab
    if (['home', 'countdown', 'showcase', 'categories'].includes(section)) {
      setActiveInspectorCategory('home');
    } else if (['members'].includes(section)) {
      setActiveInspectorCategory('members');
    } else if (['albums', 'digitalTracks', 'audioSettings'].includes(section)) {
      setActiveInspectorCategory('music');
    } else if (['videos'].includes(section)) {
      setActiveInspectorCategory('videos');
    } else if (['gallery'].includes(section)) {
      setActiveInspectorCategory('gallery');
    } else if (['timeline'].includes(section)) {
      setActiveInspectorCategory('timeline');
    } else if (['news'].includes(section)) {
      setActiveInspectorCategory('news');
    } else if (['events'].includes(section)) {
      setActiveInspectorCategory('events');
    } else if (['votingEvents'].includes(section)) {
      setActiveInspectorCategory('voting');
    } else if (['downloads'].includes(section)) {
      setActiveInspectorCategory('downloads');
    } else if (['faqs'].includes(section)) {
      setActiveInspectorCategory('faqs');
    } else if (['disclaimer'].includes(section)) {
      setActiveInspectorCategory('disclaimer');
    } else if (['sidebar', 'footer', 'socialLinks'].includes(section)) {
      setActiveInspectorCategory('sidebar_footer');
    }
  };

  // Sane state loaders
  const homeData = draftConfig?.home || {};
  const countdownData = draftConfig?.countdown || {};
  const categoriesData = draftConfig?.categories || [];
  const showcaseData = draftConfig?.showcase || {};
  const membersData = draftConfig?.members || [];
  const albumsData = draftConfig?.albums || [];
  const digitalTracksData = draftConfig?.digitalTracks || [];
  const videosData = draftConfig?.videos || [];
  const galleryData = draftConfig?.gallery || [];
  const timelineData = draftConfig?.timeline || [];
  const newsData = draftConfig?.news || [];
  const eventsData = draftConfig?.events || [];
  const votingEventsData = draftConfig?.votingEvents || [];
  const downloadsData = draftConfig?.downloads || [];
  const faqsData = draftConfig?.faqs || [];
  const sidebarData = draftConfig?.sidebar || {};
  const footerData = draftConfig?.footer || {};
  const socialLinks = draftConfig?.socialLinks || {};
  const disclaimerData = draftConfig?.disclaimer || {};
  const themeData = draftConfig?.theme || {};

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col bg-[#0f071a] text-slate-100 font-sans select-none overflow-hidden rounded-xl border border-purple-500/15">
      {/* 1. TOP CONTROL BAR */}
      <div className="h-16 border-b border-purple-500/20 bg-[#160c29]/90 px-6 flex items-center justify-between shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 text-white animate-pulse shadow-md shadow-purple-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
              BANGTAN VISUAL LIVE DESIGNER
            </h1>
            <p className="text-[10px] text-purple-300 font-mono tracking-wider font-semibold">
              Wix/Shopify Style Core Editor • Real-time Instant Synchronization
            </p>
          </div>
        </div>

        {/* Device Viewport Selector */}
        <div className="hidden md:flex items-center bg-[#0d0517] p-1 rounded-xl border border-purple-500/10">
          <button 
            onClick={() => setViewportMode('desktop')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all ${viewportMode === 'desktop' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            title="Desktop Resolution Mode"
          >
            <Monitor className="w-3.5 h-3.5" /> Desktop
          </button>
          <button 
            onClick={() => setViewportMode('tablet')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all ${viewportMode === 'tablet' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            title="Tablet Preview Mode"
          >
            <Tablet className="w-3.5 h-3.5" /> Tablet
          </button>
          <button 
            onClick={() => setViewportMode('mobile')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all ${viewportMode === 'mobile' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            title="Mobile Responsiveness Frame"
          >
            <Smartphone className="w-3.5 h-3.5" /> Mobile
          </button>
        </div>

        {/* Publishing Actions */}
        <div className="flex items-center gap-2">
          {/* Discard changes */}
          <button
            onClick={onResetDraft}
            className="px-3.5 py-1.5 rounded-xl border border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-950/50 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Revert Draft to the published Live version"
          >
            <RefreshCcw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} /> Discard Edits
          </button>

          {/* Save Draft */}
          <button
            onClick={onSaveDraft}
            disabled={savingDraft || publishing}
            className="px-4 py-1.5 rounded-xl bg-purple-900/50 border border-purple-500/30 text-purple-200 hover:bg-purple-900/80 disabled:opacity-50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
          >
            {savingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" /> : <Save className="w-3.5 h-3.5 text-purple-400" />}
            Save Draft
          </button>

          {/* Publish Live */}
          <button
            onClick={onPublish}
            disabled={savingDraft || publishing}
            className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:opacity-90 disabled:opacity-50 text-xs font-black flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/20"
          >
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Globe className="w-3.5 h-3.5" />}
            Publish Live
          </button>
        </div>
      </div>

      {/* 2. BODY CONTAINER: SPLIT PANES */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-[#0c0516]">
        
        {/* LEFT WORKSPACE: SIMULATED CLONE PREVIEW */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 items-center justify-start bg-slate-950/40 relative min-w-0" ref={previewContainerRef}>
          
          {/* Quick Informational Floating banner */}
          <div className="absolute top-2 left-6 z-10 bg-purple-950/80 border border-purple-500/20 py-1.5 px-3 rounded-lg text-[10px] text-purple-300 font-semibold font-mono shadow-md backdrop-blur-md flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>💡 <b>Tip:</b> Click any visual element in the preview mockups below to edit it instantly!</span>
          </div>

          <div className="w-full flex justify-end mb-4">
            <div className="flex bg-[#160c29] p-1 rounded-lg text-[10px] font-mono font-bold tracking-wide border border-purple-500/10 gap-1">
              {['Home', 'Members', 'Music', 'Videos', 'Gallery', 'Timeline', 'News', 'Events', 'Voting'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActivePreviewTab(tab)}
                  className={`px-3 py-1 rounded ${activePreviewTab === tab ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {tab} Tab
                </button>
              ))}
            </div>
          </div>

          {/* Preview Container Frame (Simulated Browser Mockup) */}
          <div className={`w-full flex-1 transition-all duration-300 overflow-y-auto bg-[#0d071b] p-1 flex flex-col ${getViewportWidth()}`}>
            
            {/* Browser Header Bar */}
            <div className="bg-[#18112b] p-3 rounded-t-xl border-b border-purple-500/10 flex items-center justify-between shrink-0 font-mono text-[11px] text-slate-400 select-none">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/70 inline-block"></span>
                <span className="text-xs text-purple-300 font-semibold ml-2 flex items-center gap-1">
                  <AppWindow className="w-3.5 h-3.5 text-purple-400" /> btsgallery.com/{activePreviewTab.toLowerCase()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="bg-[#241a3d] px-2.5 py-0.5 rounded text-[9px] font-bold text-purple-300">PREVIEW DRAFT</span>
              </div>
            </div>

            {/* Simulated Live Web Content Block */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 bg-[#090310] relative text-slate-200 font-sans custom-preview-scroll">
              
              {/* INTERMEDIATE SHIELD/HIGHLIGHT STYLES */}
              <style>{`
                .editable-slot {
                  position: relative;
                  cursor: pointer;
                  transition: all 0.2s ease-in-out;
                }
                .editable-slot:hover {
                  outline: 2px dashed rgba(168, 85, 247, 0.7) !important;
                  outline-offset: 4px;
                  box-shadow: 0 0 15px rgba(168, 85, 247, 0.15);
                  background-color: rgba(168, 85, 247, 0.03);
                }
                .editable-slot::-webkit-scrollbar {
                  display: none;
                }
                .custom-preview-scroll::-webkit-scrollbar {
                  width: 5px;
                }
                .custom-preview-scroll::-webkit-scrollbar-track {
                  background: #090310;
                }
                .custom-preview-scroll::-webkit-scrollbar-thumb {
                  background: #2b1842;
                  border-radius: 4px;
                }
              `}</style>

              {/* SIMULATED SIDEBAR/HEADER LOGO SECTION */}
              <div 
                className="editable-slot flex items-center justify-between p-3.5 rounded-lg border border-purple-500/5 bg-[#120a21]"
                onClick={() => inspectElement('sidebar', 'logoText', 'Sidebar Logo Text', 'text')}
                title="Click to edit logo text"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-purple-400 font-semibold tracking-wider font-mono">⟭⟬⁷</span>
                  <span className="font-extrabold text-sm text-purple-100 uppercase tracking-wider font-mono">
                    {sidebarData.logoText || 'BANGTAN GALLERY'}
                  </span>
                </div>
                <div className="text-[10px] text-purple-400 font-bold flex items-center gap-1 font-mono">
                  <span>🛠️ Sidebar Logo Element</span>
                </div>
              </div>

              {/* ------------------- VIEWPORT TABS ROUTER RENDERS ------------------- */}

              {/* A. HOME TAB PREVIEW */}
              {activePreviewTab === 'Home' && (
                <div className="space-y-6">
                  {/* Hero Banner Grid block */}
                  <div 
                    className="editable-slot rounded-xl p-8 bg-cover bg-center min-h-[260px] flex flex-col justify-end text-left relative overflow-hidden group"
                    style={{ backgroundImage: `linear-gradient(to top, rgba(9,3,16,0.95), rgba(9,3,16,0.21)), url(${homeData.heroImageUrl || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80'})` }}
                    onClick={() => inspectElement('home', 'heroImageUrl', 'Hero Background Image & Cover Banner', 'image')}
                  >
                    <div className="absolute top-3 right-3 bg-purple-950/90 py-1 px-2.5 rounded border border-purple-500/20 text-[10px] font-semibold text-purple-300 font-mono tracking-wider">
                      🌌 Hero Banner Image Card
                    </div>

                    <div className="space-y-2">
                      <h2 
                        className="editable-slot text-2xl md:text-3xl font-black text-white leading-tight font-serif tracking-tight"
                        onClick={(e) => { e.stopPropagation(); inspectElement('home', 'heroTitle', 'Homepage Hero Header Title', 'text'); }}
                      >
                        {homeData.heroTitle || 'BANGTAN GALLERY'}
                      </h2>
                      <p 
                        className="editable-slot text-xs text-purple-200"
                        onClick={(e) => { e.stopPropagation(); inspectElement('home', 'heroSubtitle', 'Homepage Hero Subtitle', 'text'); }}
                      >
                        {homeData.heroSubtitle || 'The Ultimate Independent ARMY Archive'}
                      </p>
                    </div>
                  </div>

                  {/* Typing phrases view */}
                  <div 
                    className="editable-slot p-4 rounded-xl border border-purple-500/10 bg-[#160c29]/50 font-mono text-center relative"
                    onClick={() => inspectElement('home', 'typingPhrases', 'Dynamic Typing Phrases', 'textarea')}
                  >
                    <span className="text-[9px] text-fuchsia-400 font-bold block mb-1">🎭 DIGITAL DYNAMIC SLOGANS</span>
                    <span className="text-xs font-semibold text-purple-100 italic">
                      "{homeData.typingPhrases?.[0] || 'We had only seven. But we have you all now. 💜'}"
                    </span>
                  </div>

                  {/* Animated Welcome panel */}
                  <div className="p-6 bg-[#160c29] rounded-xl border border-purple-500/15 space-y-2">
                    <h3 
                      className="editable-slot text-md font-bold text-fuchsia-400 font-serif"
                      onClick={() => inspectElement('home', 'welcomeHeading', 'Welcome Header Slogan', 'text')}
                    >
                      {homeData.welcomeHeading || 'Welcome, ARMY! 💜'}
                    </h3>
                    <p 
                      className="editable-slot text-xs text-slate-300 font-sans"
                      onClick={() => inspectElement('home', 'welcomeMessage', 'Welcome Description text', 'textarea')}
                    >
                      {homeData.welcomeMessage || 'Explore the complete histories, albums, and wallpapers of the worlds biggest group BTS! Please save or write custom content directly.'}
                    </p>
                  </div>

                  {/* Countdown Highlight */}
                  <div 
                    className="editable-slot p-6 bg-gradient-to-br from-indigo-950/40 to-purple-950/40 rounded-xl border border-indigo-500/20 text-center relative"
                    onClick={() => inspectElement('countdown', 'title', 'Countdown Headline Title', 'text')}
                  >
                    <span className="text-[9px] text-indigo-400 font-bold font-mono tracking-widest block uppercase mb-1">🌍 TOUR CORNER COUNTDOWN</span>
                    <h4 className="text-sm font-bold text-white mb-2">{countdownData.title || 'Official World Tour Countdown'}</h4>
                    <p className="text-xs text-indigo-200 mb-4">{countdownData.subtitle || 'Real-time daily coordinates'}</p>
                    <div className="inline-flex gap-3 text-center justify-center mb-4">
                      {['34', '12', '45', '19'].map((digit, i) => (
                        <div key={i} className="bg-indigo-950/70 border border-indigo-500/30 w-11 h-11 p-1 rounded-lg flex flex-col justify-center">
                          <span className="text-xs font-black text-white font-mono leading-none">{digit}</span>
                          <span className="text-[7px] text-indigo-300 font-mono mt-0.5">{['days', 'hrs', 'mins', 'secs'][i]}</span>
                        </div>
                      ))}
                    </div>
                    {/* Countdown button */}
                    <div className="flex justify-center">
                      <span 
                        className="editable-slot bg-indigo-600 px-4 py-1.5 rounded-lg text-[10px] font-black tracking-wide text-white flex items-center gap-1 cursor-pointer hover:bg-indigo-500"
                        onClick={(e) => { e.stopPropagation(); inspectElement('countdown', 'buttonText', 'Countdown CTA Button Text', 'text'); }}
                      >
                        {countdownData.buttonText || 'Official Tickets Inquiry'}
                      </span>
                    </div>
                  </div>

                  {/* 3D Showcase Media Showcase Banner */}
                  <div className="p-6 bg-[#160c29] rounded-xl border border-purple-500/10 text-center space-y-2">
                    <span className="text-[9px] text-purple-400 font-bold font-mono tracking-widest block uppercase">🔮 Interactive Media Showcase Section</span>
                    <h4 
                      className="editable-slot text-sm font-black text-white"
                      onClick={() => inspectElement('showcase', 'title', '3D Media Showcase Headline', 'text')}
                    >
                      {showcaseData.title || '3D Media Showcase Gallery'}
                    </h4>
                    <p 
                      className="editable-slot text-xs text-slate-400 max-w-md mx-auto"
                      onClick={() => inspectElement('showcase', 'subtitle', 'Showcase Subtitle caption', 'text')}
                    >
                      {showcaseData.subtitle || 'Experience amazing high quality visual interactive media walls'}
                    </p>
                  </div>
                </div>
              )}

              {/* B. MEMBERS TAB PREVIEW */}
              {activePreviewTab === 'Members' && (
                <div className="space-y-4">
                  <div className="text-center font-mono space-y-1 mb-4">
                    <span className="text-[9px] text-purple-400 font-bold tracking-widest uppercase">💜 BTS Member Profiles CMS</span>
                    <h3 className="text-sm font-bold text-white">Interactive Members Portal</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {membersData.slice(0, 4).map((member: any, idx: number) => (
                      <div 
                        key={member.id || idx}
                        className="editable-slot border border-purple-500/15 bg-purple-950/10 rounded-xl overflow-hidden shadow-md"
                        onClick={() => inspectElement('members', null, `Member Card: ${member.name}`, 'array_item', idx)}
                      >
                        <div className="h-28 bg-cover bg-center" style={{ backgroundImage: `url(${member.profileUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80'})` }} />
                        <div className="p-3">
                          <span className="text-purple-400 font-extrabold text-xs block font-mono">{member.emoji} {member.name}</span>
                          <span className="text-[9px] text-slate-400 block line-clamp-1">{member.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* C. MUSIC TAB PREVIEW */}
              {activePreviewTab === 'Music' && (
                <div className="space-y-6">
                  <div className="text-center mb-2">
                    <span className="text-[9px] text-pink-400 font-black font-mono tracking-widest block uppercase">💿 Curated Discography & Album Playlists</span>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-purple-300 font-mono border-b border-purple-500/20 pb-1 flex items-center justify-between">
                      <span>Albums Catalog ({albumsData.length} items)</span>
                      <span className="text-[9px] text-pink-400">Click card below to edit</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      {albumsData.slice(0, 4).map((album: any, idx: number) => (
                        <div 
                          key={album.id || idx}
                          className="editable-slot p-2.5 rounded-xl border border-purple-500/10 bg-[#160c29]/40 flex gap-2.5 items-center"
                          onClick={() => inspectElement('albums', null, `Album Profile: ${album.title}`, 'array_item', idx)}
                        >
                          <img 
                            src={album.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'} 
                            alt={album.title} 
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div className="min-w-0">
                            <span className="text-white text-xs font-bold block truncate">{album.title}</span>
                            <span className="text-[9px] text-slate-400 block truncate">{album.releasedIn || album.date || 'Album'}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <h4 className="text-xs font-bold text-fuchsia-300 font-mono border-b border-purple-500/20 pb-1 mt-6">
                      Digital Standalone Audio Tracks ({digitalTracksData.length} items)
                    </h4>

                    <div className="space-y-2">
                      {digitalTracksData.slice(0, 3).map((track: any, idx: number) => (
                        <div 
                          key={track.id || idx}
                          className="editable-slot p-2 rounded-lg bg-[#110820] border border-purple-500/5 flex items-center justify-between"
                          onClick={() => inspectElement('digitalTracks', null, `Digital Track: ${track.title}`, 'array_item', idx)}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Play className="w-3.5 h-3.5 text-purple-400" />
                            <div className="min-w-0">
                              <span className="text-white text-xs font-bold block truncate">{track.title}</span>
                              <span className="text-[9px] text-slate-400 block truncate">{track.album || 'Single'} • {track.artist || 'BTS'}</span>
                            </div>
                          </div>
                          <span className="text-[9px] text-purple-400 font-mono font-bold">{track.duration || '03:45'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* D. VIDEOS TAB PREVIEW */}
              {activePreviewTab === 'Videos' && (
                <div className="space-y-4">
                  <div className="text-center font-mono space-y-1 mb-2">
                    <span className="text-[9px] text-red-500 font-bold tracking-widest uppercase">🎥 YouTube Streams & MVs CLONE</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videosData.slice(0, 4).map((vid: any, idx: number) => (
                      <div 
                        key={vid.id || idx}
                        className="editable-slot border border-purple-500/10 bg-[#160c29]/20 rounded-xl overflow-hidden shadow-sm"
                        onClick={() => inspectElement('videos', null, `Video Frame: ${vid.title}`, 'array_item', idx)}
                      >
                        <div className="relative aspect-video bg-cover bg-center" style={{ backgroundImage: `url(${vid.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80'})` }}>
                          <span className="absolute bottom-2 right-2 bg-slate-950/80 px-1.5 py-0.5 rounded text-[8px] text-slate-200 font-mono">YouTube</span>
                        </div>
                        <div className="p-3">
                          <span className="text-white text-xs font-bold block line-clamp-1">{vid.title}</span>
                          <span className="text-[9px] text-purple-400 font-mono tracking-wider font-semibold block">{vid.category || 'MV'} • {vid.date || 'BTS MV'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* E. GALLERY TAB PREVIEW */}
              {activePreviewTab === 'Gallery' && (
                <div className="space-y-4">
                  <div className="text-center mb-2">
                    <span className="text-[9px] text-pink-400 font-bold font-mono tracking-widest block uppercase">🎨 Gallery Photos & Wallpapers Grid</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {galleryData.slice(0, 6).map((imgJson: any, idx: number) => (
                      <div 
                        key={imgJson.id || idx}
                        className="editable-slot aspect-square rounded-lg overflow-hidden bg-cover bg-center border border-purple-500/10"
                        style={{ backgroundImage: `url(${imgJson.url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80'})` }}
                        onClick={() => inspectElement('gallery', null, `Gallery Art: ${imgJson.title}`, 'array_item', idx)}
                        title={imgJson.title}
                      >
                        <div className="w-full h-full bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-all p-1 text-center">
                          <span className="text-[8px] text-white font-bold leading-tight font-mono truncate">{imgJson.category || 'Photo'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* F. TIMELINE TAB PREVIEW */}
              {activePreviewTab === 'Timeline' && (
                <div className="space-y-4">
                  <div className="text-center font-mono space-y-1 mb-2">
                    <span className="text-[9px] text-orange-400 font-bold tracking-widest uppercase">⏱️ BTS Career Milestone Chronology</span>
                  </div>

                  <div className="space-y-4 relative border-l-2 border-purple-500/20 pl-4 ml-2">
                    {timelineData.slice(0, 3).map((item: any, idx: number) => (
                      <div 
                        key={idx}
                        className="editable-slot bg-[#160c29]/30 border border-purple-500/10 rounded-xl p-3 relative"
                        onClick={() => inspectElement('timeline', null, `Milestone Milestone: ${item.title}`, 'array_item', idx)}
                      >
                        <span className="absolute -left-[24px] top-3.5 w-2 h-2 rounded-full border-2 border-purple-500 bg-black" />
                        <span className="text-[9px] text-orange-400 font-black font-mono tracking-wider block">{item.year} ({item.date})</span>
                        <h4 className="text-xs font-bold text-white uppercase">{item.title}</h4>
                        <p className="text-[10px] text-slate-300 line-clamp-2 mt-1">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* G. NEWS TAB PREVIEW */}
              {activePreviewTab === 'News' && (
                <div className="space-y-4">
                  <div className="text-center mb-2">
                    <span className="text-[9px] text-yellow-500 font-bold font-mono tracking-widest block uppercase">📰 Press Archives & Sourced Articles</span>
                  </div>

                  <div className="space-y-3">
                    {newsData.slice(0, 3).map((article: any, idx: number) => (
                      <div 
                        key={article.id || idx}
                        className="editable-slot flex gap-3 p-3 bg-[#160c29]/40 rounded-xl border border-purple-500/10 items-center min-w-0"
                        onClick={() => inspectElement('news', null, `News Article: ${article.title}`, 'array_item', idx)}
                      >
                        <img 
                          src={article.imageUrl || 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=400&q=80'} 
                          alt={article.title} 
                          className="w-16 h-16 rounded object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 space-y-1">
                          <span className="text-[8px] text-yellow-500 font-bold tracking-wide font-mono block translate-y-0.5">{article.source || 'Bangtan News'} • {article.date || 'Today'}</span>
                          <span className="text-white text-xs font-bold block line-clamp-1 uppercase leading-tight">{article.title}</span>
                          <p className="text-[9px] text-slate-400 block line-clamp-1 leading-snug">{article.summary}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* H. EVENTS TAB PREVIEW */}
              {activePreviewTab === 'Events' && (
                <div className="space-y-4">
                  <div className="text-center font-mono space-y-1 mb-2">
                    <span className="text-[9px] text-purple-400 font-bold tracking-widest uppercase">📅 FESTA Event Coordinates & Schedules</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {eventsData.slice(0, 4).map((event: any, idx: number) => (
                      <div 
                        key={event.id || idx}
                        className="editable-slot p-3 rounded-xl border border-purple-500/10 bg-[#160c29]/20 font-sans"
                        onClick={() => inspectElement('events', null, `Festa Event: ${event.title}`, 'array_item', idx)}
                      >
                        <span className="text-[8px] font-bold text-purple-400 block font-mono uppercase mb-0.5">{event.type || 'FESTA'}</span>
                        <h4 className="text-xs font-bold text-slate-100 truncate">{event.title}</h4>
                        <span className="text-[10px] text-slate-300 font-mono block mt-1">{event.date} • {event.time || 'All Day'}</span>
                        <span className="text-[9px] text-purple-300 font-medium tracking-wide block mt-0.5 italic">{event.location}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* I. VOTING TAB PREVIEW */}
              {activePreviewTab === 'Voting' && (
                <div className="space-y-4">
                  <div className="text-center font-mono space-y-1 mb-2">
                    <span className="text-[9px] text-purple-400 font-bold tracking-widest uppercase">🗳️ Voting Events CMS Portal</span>
                  </div>

                  <div className="space-y-4">
                    {votingEventsData.slice(0, 2).map((event: any, idx: number) => (
                      <div 
                        key={event.id || idx}
                        className="editable-slot flex gap-3 p-3 rounded-xl border border-purple-500/10 bg-[#160c29]/40 items-center min-w-0"
                        onClick={() => inspectElement('votingEvents', null, `Voting Coordinates: ${event.title}`, 'array_item', idx)}
                      >
                        <img 
                          src={event.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'} 
                          alt={event.title} 
                          className="w-16 h-16 rounded object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <span className="text-[#a855f7] font-bold text-[9px] font-mono tracking-wider block uppercase">{event.platform || 'Mwave'} Portal</span>
                          <h4 className="text-xs font-bold text-white uppercase tracking-tight truncate">{event.title}</h4>
                          <span className="text-[9px] text-slate-400 font-mono block">Status: {event.active ? '🟢 ACTIVE' : '🔴 CLOSED'} • Total Votes: {event.totalVotes || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------- FOOTER SYSTEM PREVIEW AND CLONE ------------------- */}
              <div 
                className="editable-slot p-6 border-t border-purple-500/15 bg-[#120a21]/50 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-12 text-slate-400"
                onClick={() => inspectElement('footer', 'description', 'Footer Main Bio Text', 'textarea')}
                title="Click to edit Footer specifications"
              >
                <div className="space-y-2 max-w-sm">
                  <span className="text-purple-400 font-extrabold text-xs block font-mono">⟭⟬⁷ {sidebarData.logoText || 'BANGTAN GALLERY'}</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {footerData.description || 'The ultimate independent fan coordinates created by ARMY to track BTS. Enjoy music sheets, media players.'}
                  </p>
                  <span 
                    className="editable-slot text-[9px] block text-slate-500 mt-2 hover:text-white"
                    onClick={(e) => { e.stopPropagation(); inspectElement('footer', 'copyright', 'Footer Copyright label', 'text'); }}
                  >
                    {footerData.copyright || `© ${new Date().getFullYear()} Bangtan Gallery. Crafted for BTS.`}
                  </span>
                </div>

                <div className="space-y-1.5 font-mono text-[10px]">
                  <span className="text-[8px] text-fuchsia-400 font-black block">💜 GLOBAL COORDINATES</span>
                  <div className="flex gap-2">
                    <span className="text-slate-400 hover:text-white">Insta</span>
                    <span className="text-slate-400 hover:text-white">Weverse</span>
                    <span className="text-slate-400 hover:text-white">YouTube</span>
                  </div>
                  <span 
                    className="editable-slot bg-purple-900/35 border border-purple-500/20 px-2.5 py-0.5 block rounded text-[9px] text-[#ec4899] font-black cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); inspectElement('footer', 'kofiUrl', 'Ko-fi Support Donation URL link', 'text'); }}
                  >
                    💖 Support Site on Ko-fi
                  </span>
                </div>
              </div>

              {/* ------------------- BOTTOM DISCLAIMER POPUP PREVIEW ------------------- */}
              {disclaimerData.enabled && (
                <div 
                  className="editable-slot p-4 rounded-xl border border-amber-500/20 bg-amber-950/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mt-4 text-amber-300"
                  onClick={() => inspectElement('disclaimer', 'text', 'Disclaimer main text body description', 'textarea')}
                  title="Click to edit public top disclaimer modal banner"
                >
                  <div className="space-y-1 flex-1">
                    <span className="text-[9px] text-amber-400 font-black font-mono uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-500 animate-bounce" /> {disclaimerData.title || 'Legal Disclaimer'}
                    </span>
                    <p className="text-[10px] text-amber-200/90 leading-snug">
                      {disclaimerData.text || 'This website coordinates content exclusively for educational, fandom archival tracking and entertainment media purposes.'}
                    </p>
                  </div>
                  <span className="bg-amber-600 font-black text-[9px] text-white px-3 py-1 rounded cursor-pointer shrink-0">
                    {disclaimerData.agreeText || 'I Understand & Enter'}
                  </span>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* RIGHT WORKSPACE: CONTEXTUAL INSPECTOR PANEL */}
        <div className="w-[380px] bg-[#11091f] border-l border-purple-500/20 flex flex-col shrink-0 overflow-y-auto overflow-x-hidden p-5 space-y-6">
          
          <div className="border-b border-purple-500/15 pb-4 space-y-2">
            <span className="text-[10px] font-bold text-purple-300 font-mono tracking-widest uppercase flex items-center gap-1">
              <Layers className="w-4 h-4 text-purple-400" /> CMS QUICK SECTIONS SELECT
            </span>
            <select
              value={activeInspectorCategory}
              onChange={(e) => {
                setActiveInspectorCategory(e.target.value);
                setSelectedElement(null);
                // Also map preview tab automatically for convenience!
                if (e.target.value === 'home') setActivePreviewTab('Home');
                else if (e.target.value === 'members') setActivePreviewTab('Members');
                else if (e.target.value === 'music') setActivePreviewTab('Music');
                else if (e.target.value === 'videos') setActivePreviewTab('Videos');
                else if (e.target.value === 'gallery') setActivePreviewTab('Gallery');
                else if (e.target.value === 'timeline') setActivePreviewTab('Timeline');
                else if (e.target.value === 'news') setActivePreviewTab('News');
                else if (e.target.value === 'events') setActivePreviewTab('Events');
                else if (e.target.value === 'voting') setActivePreviewTab('Voting');
              }}
              className="w-full bg-[#1c1233] border border-purple-500/25 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-purple-500"
            >
              <option value="home">Homepage Contents & Hero</option>
              <option value="members">Members Bios Profile Cards</option>
              <option value="music">Music Albums & Playlists</option>
              <option value="videos">YouTube Streams & Clips</option>
              <option value="gallery">Gallery Artwork Photo Wall</option>
              <option value="timeline">Career Milestone Year Log</option>
              <option value="news">Press Release News Feed</option>
              <option value="events">Festa Celebrations Schedule</option>
              <option value="voting">🗳️ Voting Center Platform Portal</option>
              <option value="downloads">HD Media Download Packs</option>
              <option value="faqs">FAQ Center Questions</option>
              <option value="sidebar_footer">Sidebar Footer & Socials links</option>
              <option value="disclaimer">Legal Disclaimer Warning Popup</option>
            </select>
          </div>

          {/* DYNAMIC FIELD INSPECTOR (IF ELEMENT HIGHLIGHTED) */}
          {selectedElement ? (
            <div className="bg-[#180e2b] border border-purple-500/25 p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-purple-500/15 pb-2">
                <span className="text-[10px] text-fuchsia-400 font-bold font-mono tracking-wider uppercase">
                  ✏️ EDITING FIELD PROPERTIES
                </span>
                <button 
                  onClick={() => setSelectedElement(null)} 
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Close inspector"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5Packed">
                <span className="text-xs font-bold text-slate-200 block">{selectedElement.label}</span>
                <span className="text-[9px] font-mono text-slate-400 block uppercase">
                  DB Key: {selectedElement.section}{selectedElement.index !== undefined ? `[${selectedElement.index}]` : ''}.{selectedElement.field || '(Direct value)'}
                </span>
              </div>

              {/* Input rendering based on edit type */}
              {selectedElement.type === 'text' && (
                <input
                  type="text"
                  value={
                    selectedElement.index !== undefined 
                      ? (selectedElement.field ? (draftConfig[selectedElement.section]?.[selectedElement.index]?.[selectedElement.field] || '') : (draftConfig[selectedElement.section]?.[selectedElement.index] || ''))
                      : (selectedElement.field ? (draftConfig[selectedElement.section]?.[selectedElement.field] || '') : (draftConfig[selectedElement.section] || ''))
                  }
                  onChange={(e) => updateValue(selectedElement.section, selectedElement.field, e.target.value, selectedElement.index)}
                  className="w-full bg-[#0d071b] border border-purple-500/20 px-3 py-2 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
                />
              )}

              {selectedElement.type === 'textarea' && (
                <textarea
                  rows={4}
                  value={
                    selectedElement.index !== undefined 
                      ? (selectedElement.field ? (draftConfig[selectedElement.section]?.[selectedElement.index]?.[selectedElement.field] || '') : (draftConfig[selectedElement.section]?.[selectedElement.index] || ''))
                      : (selectedElement.field ? (draftConfig[selectedElement.section]?.[selectedElement.field] || '') : (draftConfig[selectedElement.section] || ''))
                  }
                  onChange={(e) => updateValue(selectedElement.section, selectedElement.field, e.target.value, selectedElement.index)}
                  className="w-full bg-[#0d071b] border border-purple-500/20 px-3 py-2 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-purple-500 font-sans"
                />
              )}

              {selectedElement.type === 'image' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={
                      selectedElement.index !== undefined 
                        ? (selectedElement.field ? (draftConfig[selectedElement.section]?.[selectedElement.index]?.[selectedElement.field] || '') : (draftConfig[selectedElement.section]?.[selectedElement.index] || ''))
                        : (selectedElement.field ? (draftConfig[selectedElement.section]?.[selectedElement.field] || '') : (draftConfig[selectedElement.section] || ''))
                    }
                    onChange={(e) => updateValue(selectedElement.section, selectedElement.field, e.target.value, selectedElement.index)}
                    placeholder="Enter image asset URL address"
                    className="w-full bg-[#0d071b] border border-purple-500/20 px-3 py-2 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
                  />
                  
                  {/* File upload connector */}
                  <div className="relative">
                    <button className="w-full bg-purple-900/50 hover:bg-purple-900/80 border border-purple-500/35 py-1.5 rounded-xl text-[11px] font-bold text-white flex items-center justify-center gap-1.5 transition-all">
                      <Upload className="w-3.5 h-3.5" /> Upload File From Storage
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleGenericImageUpload(e, selectedElement.section, selectedElement.field || '', selectedElement.index)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  {isUploading && <span className="text-[10px] text-fuchsia-400 font-mono animate-pulse block text-center mt-1">{uploadMessage}</span>}
                </div>
              )}

              {/* For multi-values or lists like slogan tags */}
              {selectedElement.field === 'typingPhrases' && (
                <div className="space-y-2.5 mt-2">
                  <span className="text-[10px] text-fuchsia-300 font-bold font-mono">ALL SLOGANS LIST</span>
                  {(() => {
                    const phrases = Array.isArray(draftConfig.home?.typingPhrases) ? [...draftConfig.home.typingPhrases] : [];
                    return phrases.map((ph: string, pIdx: number) => (
                      <div key={pIdx} className="flex gap-2">
                        <input
                          type="text"
                          value={ph}
                          onChange={(e) => {
                            const updatedPhrases = [...phrases];
                            updatedPhrases[pIdx] = e.target.value;
                            updateValue('home', 'typingPhrases', updatedPhrases);
                          }}
                          className="flex-1 bg-[#0d071b] border border-purple-500/20 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none"
                        />
                        <button 
                          onClick={() => {
                            const updatedPhrases = phrases.filter((_, idx) => idx !== pIdx);
                            updateValue('home', 'typingPhrases', updatedPhrases);
                          }}
                          className="p-2 border border-red-500/20 rounded-xl bg-red-950/20 hover:bg-red-950/50 text-red-400 transition-all"
                          title="Remove slogan"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ));
                  })()}
                  <button
                    onClick={() => {
                      const phrases = Array.isArray(draftConfig.home?.typingPhrases) ? [...draftConfig.home.typingPhrases] : [];
                      phrases.push('Speak yourself. Stand Proud. 💜');
                      updateValue('home', 'typingPhrases', phrases);
                    }}
                    className="w-full border border-purple-500/20 py-1 rounded text-[10px] font-bold text-purple-300 hover:bg-purple-950/30 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3 h-3" /> Insert New Phrase
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#180e2b]/50 border border-purple-500/10 p-4 rounded-xl text-center space-y-2 py-6">
              <Sparkles className="w-6 h-6 text-fuchsia-400 mx-auto animate-pulse" />
              <span className="text-xs font-bold text-white block">No element selected</span>
              <p className="text-[10px] text-slate-400">
                Click any layout element directly in the visual live website preview on the left to show its customizable editor fields immediately!
              </p>
            </div>
          )}

          {/* DETAILED ROOT SCHEMA CONFIG EXPANDERS BY SECTION LIST */}
          <div className="space-y-4">
            <span className="text-[10px] text-slate-400 block font-bold font-mono tracking-widest uppercase mb-1 border-t border-purple-500/10 pt-4">
              🗂️ MANUAL SECTION EDITORS
            </span>

            {/* EXPANDED SYSTEM A: HOME PAGE */}
            {activeInspectorCategory === 'home' && (
              <div className="space-y-4 bg-[#140b24] p-3.5 rounded-xl border border-purple-500/10">
                <span className="text-[11px] font-mono text-fuchsia-400 font-extrabold block mb-2 uppercase tracking-wide">Homepage Visual Elements</span>
                
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] text-purple-300 font-bold uppercase font-mono tracking-wide">Hero Headline Title</label>
                    <input
                      type="text"
                      value={homeData.heroTitle || ''}
                      onChange={(e) => updateValue('home', 'heroTitle', e.target.value)}
                      className="w-full bg-[#0d071b] border border-purple-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-purple-300 font-bold uppercase font-mono tracking-wide">Hero Subtitle</label>
                    <input
                      type="text"
                      value={homeData.heroSubtitle || ''}
                      onChange={(e) => updateValue('home', 'heroSubtitle', e.target.value)}
                      className="w-full bg-[#0d071b] border border-purple-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-purple-300 font-bold uppercase font-mono tracking-wide">Welcome Heading Header</label>
                    <input
                      type="text"
                      value={homeData.welcomeHeading || ''}
                      onChange={(e) => updateValue('home', 'welcomeHeading', e.target.value)}
                      className="w-full bg-[#0d071b] border border-purple-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-purple-300 font-bold uppercase font-mono tracking-wide">Welcome Detail Paragraph</label>
                    <textarea
                      rows={3}
                      value={homeData.welcomeMessage || ''}
                      onChange={(e) => updateValue('home', 'welcomeMessage', e.target.value)}
                      className="w-full bg-[#0d071b] border border-purple-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-purple-300 font-bold uppercase font-mono tracking-wide">Hero Banner Background Image URL</label>
                    <input
                      type="text"
                      value={homeData.heroImageUrl || ''}
                      onChange={(e) => updateValue('home', 'heroImageUrl', e.target.value)}
                      className="w-full bg-[#0d071b] border border-purple-500/20 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* EXPANDED SYSTEM B: MEMBERS */}
            {activeInspectorCategory === 'members' && (
              <div className="space-y-4">
                {membersData.map((member: any, mIdx: number) => (
                  <div key={member.id || mIdx} className="bg-[#140b24] p-3 rounded-xl border border-purple-500/10 space-y-3">
                    <div className="flex justify-between items-center border-b border-purple-500/10 pb-1.5">
                      <span className="text-xs font-extrabold text-white font-mono">{member.emoji} {member.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono">Index #{mIdx}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="space-y-0.5">
                        <label className="text-[9px] text-purple-300 uppercase font-mono tracking-wide">Full Display Name</label>
                        <input
                          type="text"
                          value={member.name || ''}
                          onChange={(e) => updateValue('members', 'name', e.target.value, mIdx)}
                          className="w-full bg-[#0d071b] border border-purple-500/20 px-2 py-1 rounded text-xs text-white"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] text-purple-300 uppercase font-mono tracking-wide">Representative Emoji</label>
                        <input
                          type="text"
                          value={member.emoji || ''}
                          onChange={(e) => updateValue('members', 'emoji', e.target.value, mIdx)}
                          className="w-full bg-[#0d071b] border border-purple-500/20 px-2 py-1 rounded text-xs text-white"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] text-purple-300 uppercase font-mono tracking-wide">Official Band Role</label>
                        <input
                          type="text"
                          value={member.role || ''}
                          onChange={(e) => updateValue('members', 'role', e.target.value, mIdx)}
                          className="w-full bg-[#0d071b] border border-purple-500/20 px-2 py-1 rounded text-xs text-white"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] text-purple-300 uppercase font-mono tracking-wide">Bio Description Narrative</label>
                        <textarea
                          rows={3}
                          value={member.bio || ''}
                          onChange={(e) => updateValue('members', 'bio', e.target.value, mIdx)}
                          className="w-full bg-[#0d071b] border border-purple-500/20 px-2 py-1 rounded text-xs text-white font-sans"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] text-purple-300 uppercase font-mono tracking-wide">Profile Image URL</label>
                        <input
                          type="text"
                          value={member.profileUrl || ''}
                          onChange={(e) => updateValue('members', 'profileUrl', e.target.value, mIdx)}
                          className="w-full bg-[#0d071b] border border-purple-500/20 px-2 py-1 rounded text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* EXPANDED SYSTEM C: GALLERY ARTWORK */}
            {activeInspectorCategory === 'gallery' && (
              <div className="space-y-4">
                <div className="bg-[#140b24] p-3 rounded-xl border border-purple-500/10 space-y-2">
                  <span className="text-[10px] text-pink-400 font-extrabold uppercase font-mono block">Insert New Art to Gallery</span>
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="Enter visual artwork headline title"
                    className="w-full bg-[#0d071b] border border-purple-500/20 px-2 py-1.5 rounded text-xs text-white"
                  />
                  <button
                    onClick={() => {
                      if (!newItemText.trim()) return;
                      const items = [...galleryData];
                      items.unshift({
                        id: `gal-${Date.now()}`,
                        category: 'BTS',
                        title: newItemText.trim(),
                        url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'
                      });
                      updateValue('gallery', null, items);
                      setNewItemText('');
                    }}
                    className="w-full bg-pink-600 hover:bg-pink-500 py-1.5 rounded text-[11px] font-black tracking-wide text-white flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Append Gallery Art
                  </button>
                </div>

                <div className="space-y-3">
                  {galleryData.map((img: any, idx: number) => (
                    <div key={img.id || idx} className="bg-[#140b24] p-2.5 rounded-xl border border-purple-500/10 flex gap-2 items-center relative min-w-0">
                      <img src={img.url} alt="" className="w-10 h-10 object-cover rounded" />
                      <div className="min-w-0 flex-1">
                        <span className="text-white text-xs font-bold block truncate">{img.title}</span>
                        <span className="text-[9px] text-pink-400 font-mono block uppercase">{img.category}</span>
                      </div>
                      <button
                        onClick={() => {
                          const items = galleryData.filter((_, gIdx) => gIdx !== idx);
                          updateValue('gallery', null, items);
                        }}
                        className="p-1.5 border border-red-500/20 bg-red-950/20 text-red-400 rounded-lg shrink-0"
                        title="Delete image"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EXPANDED SYSTEM D: TIMELINE HISTORIES */}
            {activeInspectorCategory === 'timeline' && (
              <div className="space-y-4">
                <button
                  onClick={() => {
                    const items = [...timelineData];
                    items.unshift({
                      year: '2026',
                      date: 'June 13, 2026',
                      title: 'Anniversary Live Milestone',
                      description: 'Milestone description',
                      category: 'Celebrant'
                    });
                    updateValue('timeline', null, items);
                  }}
                  className="w-full bg-purple-900 border border-purple-500/30 py-1.5 rounded text-[11px] font-bold text-white flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Append Milestone Year
                </button>

                {timelineData.map((item: any, idx: number) => (
                  <div key={idx} className="bg-[#140b24] p-3 rounded-xl border border-purple-500/10 space-y-2">
                    <div className="flex justify-between items-center bg-purple-950/30 px-2 py-1 rounded">
                      <span className="text-xs font-extrabold text-orange-400 font-mono">{item.year}</span>
                      <button
                        onClick={() => {
                          const items = timelineData.filter((_, tIdx) => tIdx !== idx);
                          updateValue('timeline', null, items);
                        }}
                        className="text-red-400"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={item.title || ''}
                        onChange={(e) => updateValue('timeline', 'title', e.target.value, idx)}
                        className="w-full bg-[#0d071b] border border-purple-500/20 px-2 py-1 rounded text-xs text-white"
                        placeholder="Title"
                      />
                      <input
                        type="text"
                        value={item.date || ''}
                        onChange={(e) => updateValue('timeline', 'date', e.target.value, idx)}
                        className="w-full bg-[#0d071b] border border-purple-500/20 px-2 py-1 rounded text-xs text-white"
                        placeholder="Date label"
                      />
                      <textarea
                        rows={2}
                        value={item.description || ''}
                        onChange={(e) => updateValue('timeline', 'description', e.target.value, idx)}
                        className="w-full bg-[#0d071b] border border-purple-500/20 px-2 py-1 rounded text-xs text-white font-sans"
                        placeholder="History description"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* EXPANDED SYSTEM E: OTHER CMS PANELS SHORTHAND (fallback overview list) */}
            {!['home', 'members', 'gallery', 'timeline'].includes(activeInspectorCategory) && (
              <div className="p-4 bg-[#140b24] rounded-xl border border-purple-500/10 text-center space-y-3">
                <FileText className="w-6 h-6 text-purple-400 mx-auto" />
                <span className="text-xs font-bold text-white block">Visual Section Loaded!</span>
                <p className="text-[10px] text-slate-400">
                  This segment supports instant reactive updates. Please click any visual layout element directly in the workspace live viewport preview on the left to show and edit its properties!
                </p>
                <div className="bg-[#1c1135] p-2.5 rounded-lg border border-purple-500/15 flex text-left font-mono text-[10px] text-purple-200">
                  <span>🚀 Tip: Full configuration schemas are synced instantly to FireStore. Your changes are live as soon as you press <b>Publish Live</b> at the top bar!</span>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
