/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import ComebackPosterStudio from './ComebackPosterStudio';
import BirthdayCakeStudio from './BirthdayCakeStudio';
import { roundRectPath } from '../utils/roundRectPath';
import { motion, AnimatePresence } from 'motion/react';
import AdsterraAd from './AdsterraAd';
import { 
  Sparkles, Upload, Download, Copy, Share2, ZoomIn, ZoomOut, Maximize2, 
  RefreshCw, Layers, Sliders, Type, Check, Trash2, Heart, Music, 
  Ticket, Calendar, ArrowRight, BookOpen, User, Palette, PhoneCall,
  RotateCw, Crop, Image as ImageIcon, Undo2, Star, Sparkle, Grid
} from 'lucide-react';

interface GeneratePicStudioProps {
  onBack?: () => void;
  accentColor?: string;
}

const BIASES = [
  { name: 'RM', emoji: '🐨', role: 'Leader & Main Rapper', color: 'from-amber-400 to-amber-700' },
  { name: 'Jin', emoji: '🐹', role: 'Sub Vocalist & Visual', color: 'from-pink-400 to-pink-700' },
  { name: 'SUGA', emoji: '🐱', role: 'Lead Rapper & Producer', color: 'from-blue-400 to-blue-700' },
  { name: 'j-hope', emoji: '🐿️', role: 'Main Dancer & Rapper', color: 'from-emerald-400 to-emerald-700' },
  { name: 'Jimin', emoji: '🐥', role: 'Main Dancer & Lead Vocalist', color: 'from-cyan-400 to-cyan-700' },
  { name: 'V', emoji: '🐯', role: 'Lead Dancer & Vocalist', color: 'from-indigo-400 to-indigo-700' },
  { name: 'Jung Kook', emoji: '🐰', role: 'Main Vocalist & Center', color: 'from-rose-400 to-rose-700' }
];

// All 17 requested design types + backward compatible aliases
const DESIGN_TYPES = [
  { value: 'BTS Poster', label: '🖼️ BTS Poster', ratio: '3:4', w: 1200, h: 1600 },
  { value: 'Profile Picture / Avatar Maker', label: '👤 Profile Avatar', ratio: '1:1', w: 1080, h: 1080 },
  { value: 'Instagram Post', label: '📸 Instagram Post', ratio: '1:1', w: 1080, h: 1080 },
  { value: 'Instagram Story', label: '💫 Instagram Story', ratio: '9:16', w: 1080, h: 1920 },
  { value: 'Mobile Wallpaper', label: '📱 Mobile Wallpaper', ratio: '9:16', w: 1080, h: 1920 },
  { value: 'Desktop Wallpaper', label: '💻 Desktop Wallpaper', ratio: '16:9', w: 1920, h: 1080 },
  { value: 'Fan Card', label: '💳 Fan Card', ratio: '3:4', w: 800, h: 1066 },
  { value: 'Photocard', label: '⭐ Photocard', ratio: '3:4', w: 800, h: 1100 },
  { value: 'Polaroid', label: '🎞️ Polaroid', ratio: '3:4', w: 800, h: 1000 },
  { value: 'Magazine Cover', label: '📰 Magazine Cover', ratio: '3:4', w: 1200, h: 1600 },
  { value: 'Concert Ticket', label: '🎟️ Concert Ticket', ratio: '16:9', w: 1600, h: 900 },
  { value: 'Birthday Card', label: '🎂 Birthday Card', ratio: '4:3', w: 1200, h: 900 },
  { value: 'Collage Maker', label: '🧩 Collage Maker', ratio: '1:1', w: 1200, h: 1200 },
  { value: 'Banner', label: '⚡ Banner', ratio: '16:9', w: 1600, h: 900 },
  { value: 'Quote Card', label: '📜 Quote Card', ratio: '1:1', w: 1080, h: 1080 },
  { value: 'YouTube Thumbnail', label: '▶️ YouTube Thumbnail', ratio: '16:9', w: 1280, h: 720 },
  { value: 'Pinterest-Inspired Moodboard', label: '📌 Moodboard', ratio: '3:4', w: 1200, h: 1600 },
  // Backward compatibility
  { value: 'HD Poster', label: '🖼️ HD Poster', ratio: '3:4', w: 1200, h: 1600 },
  { value: 'Wallpaper', label: '📱 Wallpaper', ratio: '9:16', w: 1080, h: 1920 }
];

const BTS_QUOTES = [
  { text: "No matter who you are, speak yourself.", author: "RM", category: "Inspiration" },
  { text: "Your presence can give happiness to many.", author: "Jin", category: "Love" },
  { text: "Even if you are not perfect, you are limited edition.", author: "Jin", category: "Self Love" },
  { text: "Remember to love yourself first.", author: "Jung Kook", category: "Self Love" },
  { text: "Maybe I made a mistake yesterday, but yesterday’s me is still me.", author: "RM", category: "Growth" },
  { text: "There is no failure. Only lessons to grow wider.", author: "j-hope", category: "Growth" },
  { text: "Go on your path, even if you live for a day.", author: "Jimin", category: "Inspiration" },
  { text: "We are all in different places but we are in the same purple light.", author: "V", category: "ARMY" },
  { text: "Loss is a starting point, a catalyst for finding yourself.", author: "SUGA", category: "Growth" },
  { text: "If you can't fly, then run. Today we will survive.", author: "BTS", category: "Strength" }
];

// Presets specified in requirement 6
const THEMES = [
  { value: 'Purple Galaxy', label: '🌌 Purple Galaxy', primary: '#7C3AED', secondary: '#EC4899', bg: '#070110', accent: '#A78BFA' },
  { value: 'ARIRANG Tour', label: '✈️ ARIRANG Tour', primary: '#EF4444', secondary: '#6B21A8', bg: '#0b0214', accent: '#F472B6' },
  { value: 'FESTA Celebration', label: '🎈 FESTA Celebration', primary: '#8B5CF6', secondary: '#F59E0B', bg: '#08020f', accent: '#FCD34D' },
  { value: 'Cyberpunk Neon', label: '🚨 Cyberpunk Neon', primary: '#EC4899', secondary: '#06B6D4', bg: '#020005', accent: '#22D3EE' },
  { value: 'Golden Luxury', label: '👑 Golden Luxury', primary: '#D97706', secondary: '#1F2937', bg: '#0c0a09', accent: '#FBBF24' },
  { value: 'Dreamy Lilac', label: '☁️ Dreamy Lilac', primary: '#A78BFA', secondary: '#60A5FA', bg: '#0a0915', accent: '#C084FC' },
  { value: 'Minimalist', label: '📐 Minimalist', primary: '#64748B', secondary: '#94A3B8', bg: '#0f172a', accent: '#CBD5E1' },
  { value: 'Vintage Magazine', label: '📰 Vintage Magazine', primary: '#B45309', secondary: '#78350F', bg: '#1c1511', accent: '#FDE68A' },
  { value: 'Black-and-White Editorial', label: '🖤 B&W Editorial', primary: '#E2E8F0', secondary: '#475569', bg: '#050505', accent: '#FFFFFF' },
  // Backward compatibility aliases
  { value: 'FESTA', label: '🎈 FESTA', primary: '#8B5CF6', secondary: '#F59E0B', bg: '#08020f', accent: '#FCD34D' },
  { value: 'Neon', label: '🚨 Neon', primary: '#EC4899', secondary: '#06B6D4', bg: '#020005', accent: '#F472B6' },
  { value: 'Luxury', label: '👑 Luxury', primary: '#D97706', secondary: '#1F2937', bg: '#0c0a09', accent: '#FBBF24' },
  { value: 'Minimal', label: '📐 Minimal', primary: '#64748B', secondary: '#F8FAFC', bg: '#0f172a', accent: '#CBD5E1' },
  { value: 'Dreamy', label: '☁️ Dreamy', primary: '#A78BFA', secondary: '#60A5FA', bg: '#0a0915', accent: '#C084FC' }
];

const OVERLAYS = [
  { value: 'None', label: '🧼 Clean Template' },
  { value: 'Stardust Sparkles', label: '⭐ Stardust Sparkles' },
  { value: 'Golden Glitter', label: '✨ Golden Glitter Dust' },
  { value: 'Neon Scanlines', label: '👾 Retro Digital Grid' },
  { value: 'Vintage Film', label: '🎞️ Vintage Film Grain' },
  { value: 'Romantic Hearts', label: '💖 Floating Hearts' },
  { value: 'Prismatic Flare', label: '🌈 Prismatic Flare' }
];

// Pinterest-Inspired Design Inspirations (Requirement 3)
const DESIGN_INSPIRATIONS = [
  {
    id: 'insp-1',
    title: 'ARIRANG World Tour Stadium Poster',
    category: 'BTS Poster',
    designType: 'BTS Poster',
    theme: 'ARIRANG Tour',
    overlay: 'Stardust Sparkles',
    cropShape: 'Arch',
    filter: 'Borahae Purple',
    description: 'Dynamic arena concert typography with glowing crimson-violet gradients and stardust embers.',
    previewImg: 'https://commons.wikimedia.org/wiki/Special:FilePath/BTS_in_concert_at_Wembley_Stadium,_2_June_2019_01.jpg?width=1280'
  },
  {
    id: 'insp-2',
    title: 'Borahae Purple Neon PFP Avatar',
    category: 'Profile Picture / Avatar Maker',
    designType: 'Profile Picture / Avatar Maker',
    theme: 'Purple Galaxy',
    overlay: 'Golden Glitter',
    cropShape: 'Circle',
    filter: 'Borahae Purple',
    description: 'Circular avatar border with purple neon glow, ⟭⟬ logo stamp, and star particles.',
    previewImg: 'https://commons.wikimedia.org/wiki/Special:FilePath/ARMY_at_BTS_Love_Yourself_Speak_Yourself_concert_at_Wembley_Stadium,_1_June_2019.jpg?width=1280'
  },
  {
    id: 'insp-3',
    title: 'Retro FESTA Polaroid Collage',
    category: 'Polaroid',
    designType: 'Polaroid',
    theme: 'FESTA Celebration',
    overlay: 'Vintage Film',
    cropShape: 'Square',
    filter: 'Vintage Film',
    description: 'Aesthetic retro polaroid with vintage film grain, anniversary balloon hues, and lyric stamps.',
    previewImg: 'https://commons.wikimedia.org/wiki/Special:FilePath/BTS_win_first_Daesang_(Grand_Prize)_at_Melon_Music_Awards,_19_November_2016_02.png?width=1280'
  },
  {
    id: 'insp-4',
    title: 'Golden Luxury Editorial Magazine',
    category: 'Magazine Cover',
    designType: 'Magazine Cover',
    theme: 'Golden Luxury',
    overlay: 'Golden Glitter',
    cropShape: 'Arch',
    filter: 'Golden Glow',
    description: 'Vogue-inspired editorial layout with gold foil borders, serif typography, and studio lighting.',
    previewImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Jung_Kook_of_BTS%2C_February_12%2C_2026_%281%29.png/1280px-Jung_Kook_of_BTS%2C_February_12%2C_2026_%281%29.png'
  },
  {
    id: 'insp-5',
    title: 'Cyberpunk Neon Concert Ticket',
    category: 'Concert Ticket',
    designType: 'Concert Ticket',
    theme: 'Cyberpunk Neon',
    overlay: 'Neon Scanlines',
    cropShape: 'Rounded-Square',
    filter: 'Cyberpunk Neon',
    description: 'Holographic stadium ticket with digital barcode, futuristic scanlines, and neon cyan accents.',
    previewImg: 'https://commons.wikimedia.org/wiki/Special:FilePath/BTS_performing_Fire_during_the_Speak_Yourself_tour_in_Brazil,_25_May_2019_01.jpg?width=1280'
  },
  {
    id: 'insp-6',
    title: 'Lilac Dream Aesthetic Moodboard',
    category: 'Pinterest-Inspired Moodboard',
    designType: 'Pinterest-Inspired Moodboard',
    theme: 'Dreamy Lilac',
    overlay: 'Romantic Hearts',
    cropShape: 'Rounded-Square',
    filter: 'Soft Dream',
    description: 'Pinterest-inspired soft pastel lilac moodboard with dreamy clouds and floating pastel hearts.',
    previewImg: 'https://commons.wikimedia.org/wiki/Special:FilePath/BTS_and_ARMY_during_the_BTS_Live_Trilogy_Episode_III_The_Wings_Tour_in_Anaheim,_2_April_2017.jpg?width=1280'
  }
];

export default function GeneratePicStudio({ onBack, accentColor = 'purple' }: GeneratePicStudioProps) {
  // Main view tabs: 'avatar' (Profile Maker) | 'editor' (Template Maker with BTS Logo) | 'inspiration'
  const [activeStudioTab, setActiveStudioTab] = useState<'avatar' | 'editor' | 'inspiration' | 'poster' | 'cake'>('avatar');

  // Form states - Default to Profile Picture / Avatar Maker with BTS branding
  const [name, setName] = useState('ARMY 7');
  const [selectedBias, setSelectedBias] = useState('Jung Kook');
  const [designType, setDesignType] = useState('Profile Picture / Avatar Maker');
  const [selectedTheme, setSelectedTheme] = useState('Purple Galaxy');
  const [customText, setCustomText] = useState('Proud ARMY Forever 💜');
  const [activeOverlay, setActiveOverlay] = useState('Stardust Sparkles');

  // User Photo Upload & Adjustments with Real-Time Timers
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Upload Progress & Processing Duration Timers
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadElapsedTime, setUploadElapsedTime] = useState(0);
  const [uploadEstimatedDuration, setUploadEstimatedDuration] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState('');
  const [uploadStatusText, setUploadStatusText] = useState('');
  const uploadTimerRef = useRef<any>(null);
  const uploadStartRef = useRef<number>(0);

  // Photo transformations
  const [photoZoom, setPhotoZoom] = useState(1.0);
  const [photoPanX, setPhotoPanX] = useState(0);
  const [photoPanY, setPhotoPanY] = useState(0);
  const [photoRotate, setPhotoRotate] = useState(0);
  const [photoCropShape, setPhotoCropShape] = useState<'Circle' | 'Rounded-Square' | 'Square' | 'Arch' | 'Heart'>('Circle');
  const [photoFilter, setPhotoFilter] = useState<'Normal' | 'Borahae Purple' | 'Golden Glow' | 'Cyberpunk Neon' | 'Vintage Film' | 'B&W Editorial'>('Normal');
  const [showPhotoControls, setShowPhotoControls] = useState(true);

  // Profile Picture Tool Special States
  const [avatarShape, setAvatarShape] = useState<'circle' | 'square' | 'rounded'>('circle');
  const [avatarPurpleGlow, setAvatarPurpleGlow] = useState(true);
  const [avatarBorderWidth, setAvatarBorderWidth] = useState(4);
  const [avatarBadge, setAvatarBadge] = useState<'purple-heart' | 'bts-logo' | 'army-bomb' | 'crown' | 'star' | 'blossom' | 'music'>('bts-logo');
  const [avatarUsername, setAvatarUsername] = useState('@army_bts7');

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
    };
  }, []);

  // Preset BTS sample avatars for instant preview
  const BTS_SAMPLE_PRESETS = [
    { label: 'Jung Kook 🐰', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Jeon_Jung-kook_performing_%22Baepsae%22_during_Speak_Yourself_tour_at_Soldier_Field,_Chicago,_11_May_2019_01.jpg?width=1024', bias: 'Jung Kook' },
    { label: 'V 🐯', url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/BTS%27s_V_20251004_04.jpg', bias: 'V' },
    { label: 'Jimin 🐥', url: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Jimin_on_the_way_to_SBS_Radio%2C_31_March_2023_%282%29.jpg', bias: 'Jimin' },
    { label: 'RM 🐨', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/RM_at_W_Korea_Love_Your_W%2C_November_2023.jpg/1280px-RM_at_W_Korea_Love_Your_W%2C_November_2023.jpg', bias: 'RM' }
  ];

  // Engine control states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerated, setIsGenerated] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [showCompare, setShowCompare] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [exportResolution, setExportResolution] = useState<'1x' | '2x'>('1x');

  // Canvas Refs
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasDataUrl, setCanvasDataUrl] = useState<string>('');

  // Generate unique membership ID
  const [membershipId, setMembershipId] = useState('BTS-ARMY-7777');

  useEffect(() => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    setMembershipId(`ARMY-${rand}-77`);
  }, [selectedTheme]);

  // Handle Drag Over
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      alert("Please upload a valid image file (JPG, JPEG, PNG, or WEBP).");
      return;
    }

    const sizeStr = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      : (file.size / 1024).toFixed(1) + ' KB';

    setUploadFileName(file.name);
    setUploadFileSize(sizeStr);
    setIsUploadingPhoto(true);
    setUploadProgress(12);
    setUploadStatusText('Reading photo buffer and analyzing dimensions...');
    
    uploadStartRef.current = Date.now();
    setUploadElapsedTime(0);
    const estDuration = Math.max(1.2, Math.min(3.0, (file.size / (400 * 1024)) * 0.7 + 1.1));
    setUploadEstimatedDuration(estDuration);

    if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
    uploadTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - uploadStartRef.current) / 1000;
      setUploadElapsedTime(elapsed);
    }, 100);

    const reader = new FileReader();
    reader.onload = (event) => {
      const resultData = event.target?.result as string;

      setTimeout(() => {
        setUploadProgress(48);
        setUploadStatusText('Mapping BTS frame contours and color curves...');
      }, 350);

      setTimeout(() => {
        setUploadProgress(82);
        setUploadStatusText('Rendering multi-size avatar monitors & canvas layers...');
      }, 700);

      setTimeout(() => {
        setUploadProgress(100);
        setUploadStatusText('Upload & processing complete!');
        if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
        const finalElapsed = (Date.now() - uploadStartRef.current) / 1000;
        setUploadElapsedTime(finalElapsed);
        setUploadedImage(resultData);
        setIsUploadingPhoto(false);
        showFeedback(`✨ Photo uploaded & processed in ${finalElapsed.toFixed(1)}s! Live preview active 💜`);
      }, 1050);
    };

    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const triggerAvatarFileSelect = () => {
    avatarFileInputRef.current?.click();
  };

  // ── AUTO DESIGN (owner feature, 2026-11-05) ──────────────────────
  // "Pic dilei auto design": the visitor gives ONE photo and the
  // studio designs the big poster by itself, AI-style — it reads the
  // photo's colors, picks the matching theme/filter/overlay, frames
  // the photo and renders the poster ready to download. It designs
  // the visitor's OWN photo; it does not generate or alter faces.
  const autoDesignPendingRef = useRef(false);

  const runAutoDesign = (src: string) => {
    const img = new Image();
    img.onload = () => {
      try {
        const S = 48;
        const c = document.createElement('canvas');
        c.width = S; c.height = S;
        const cx = c.getContext('2d');
        if (!cx) return;
        cx.drawImage(img, 0, 0, S, S);
        const d = cx.getImageData(0, 0, S, S).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 16) {
          r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
        }
        r /= n; g /= n; b /= n;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        const L = (mx + mn) / 510;
        const Sat = mx === mn ? 0 : (mx - mn) / (255 - Math.abs(mx + mn - 255) || 1);
        let H = 0;
        if (mx !== mn) {
          if (mx === r) H = ((g - b) / (mx - mn)) % 6;
          else if (mx === g) H = (b - r) / (mx - mn) + 2;
          else H = (r - g) / (mx - mn) + 4;
          H *= 60; if (H < 0) H += 360;
        }

        let theme = 'Purple Galaxy';
        let filter: typeof photoFilter = 'Borahae Purple';
        let overlay = 'Stardust Sparkles';
        if (Sat < 0.12) { theme = 'Black-and-White Editorial'; filter = 'B&W Editorial'; overlay = 'None'; }
        else if (H >= 15 && H < 45) { theme = 'Golden Luxury'; filter = 'Golden Glow'; overlay = 'Golden Glitter'; }
        else if (H >= 45 && H < 70) { theme = 'FESTA Celebration'; filter = 'Normal'; overlay = 'Golden Glitter'; }
        else if ((H >= 340 && H <= 360) || H < 15) { theme = 'ARIRANG Tour'; filter = 'Normal'; overlay = 'Stardust Sparkles'; }
        else if (H >= 160 && H < 250) {
          if (L < 0.35) { theme = 'Cyberpunk Neon'; filter = 'Cyberpunk Neon'; overlay = 'Neon Scanlines'; }
          else { theme = 'Dreamy Lilac'; filter = 'Normal'; overlay = 'Prismatic Flare'; }
        } else if (H >= 70 && H < 160) { theme = 'Dreamy Lilac'; filter = 'Normal'; overlay = 'Romantic Hearts'; }
        // violet / magenta / purple family keeps the brand default above.

        setDesignType('BTS Poster');
        setActiveStudioTab('editor');
        setSelectedTheme(theme);
        setPhotoFilter(filter);
        setActiveOverlay(overlay);
        setPhotoCropShape('Arch');
        setPhotoZoom(1.0);
        setPhotoPanX(0);
        setPhotoPanY(0);
        setPhotoRotate(0);
        showFeedback(`🤖✨ Auto Design ready! The "${theme}" theme was matched to your photo's colors — you can download it now 💜`);
      } catch {
        showFeedback('Auto Design holo na — manually theme select kore nao 💜');
      }
    };
    img.src = src;
  };

  const handleAutoDesign = () => {
    if (uploadedImage) {
      runAutoDesign(uploadedImage);
    } else {
      autoDesignPendingRef.current = true;
      setActiveStudioTab('editor');
      setDesignType('BTS Poster');
      triggerFileSelect();
    }
  };

  // When the photo chosen from the Auto Design button finishes
  // uploading, design it immediately.
  useEffect(() => {
    if (autoDesignPendingRef.current && uploadedImage) {
      autoDesignPendingRef.current = false;
      runAutoDesign(uploadedImage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedImage]);

  // Reset photo adjustments
  const handleResetAdjustments = () => {
    setPhotoZoom(1.0);
    setPhotoPanX(0);
    setPhotoPanY(0);
    setPhotoRotate(0);
    setPhotoFilter('Normal');
    showFeedback("Reset photo transformations to defaults.");
  };

  // Apply Pinterest Inspiration
  const applyInspiration = (insp: typeof DESIGN_INSPIRATIONS[0]) => {
    setDesignType(insp.designType);
    setSelectedTheme(insp.theme);
    setActiveOverlay(insp.overlay);
    setPhotoCropShape(insp.cropShape as any);
    setPhotoFilter(insp.filter as any);
    setActiveStudioTab('editor');
    showFeedback(`Applied "${insp.title}" layout, colors, and typography!`);
  };

  const handleGenerateClick = () => {
    if (!uploadedImage) {
      // No ready-made design anymore (Batch 34): a photo comes first —
      // picking one auto-designs it via the pending auto-design flow.
      autoDesignPendingRef.current = true;
      setActiveStudioTab('editor');
      setDesignType('BTS Poster');
      triggerFileSelect();
      showFeedback("Select a photo first — your design is created automatically as soon as you add one 💜");
      return;
    }
    setIsGenerating(true);
    setGenerationProgress(10);

    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            renderArtwork();
            setIsGenerating(false);
            setIsGenerated(true);
            showFeedback("✨ High-Definition Design Rendered! Ready to download.");
          }, 250);
          return 100;
        }
        return prev + 20;
      });
    }, 100);
  };

  const renderArtwork = () => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Owner decision (2026-11-05, Batch 34): the ready-made poster design
    // (BTS shield logo + texts, shown when no photo was uploaded) is REMOVED.
    // A design is created only from the visitor's own uploaded photo —
    // no photo means no poster; the preview shows the upload prompt instead.
    if (!uploadedImage) {
      if (canvasDataUrl) setCanvasDataUrl('');
      return;
    }

    // Get selected design params
    const activeDesign = DESIGN_TYPES.find(d => d.value === designType) || DESIGN_TYPES[0];
    const activeTheme = THEMES.find(t => t.value === selectedTheme) || THEMES[0];
    const activeBiasObj = BIASES.find(b => b.name === selectedBias) || BIASES[0];

    // Set canvas dimensions
    const mult = exportResolution === '2x' ? 2 : 1;
    canvas.width = activeDesign.w * mult;
    canvas.height = activeDesign.h * mult;

    const W = canvas.width;
    const H = canvas.height;

    // 1. Draw Base Deep Background
    ctx.fillStyle = activeTheme.bg;
    ctx.fillRect(0, 0, W, H);

    // 2. Draw Premium Styled Gradients and Spotlights
    const radialGrad = ctx.createRadialGradient(W / 2, H / 2, 50 * mult, W / 2, H / 2, Math.max(W, H) / 1.1);
    radialGrad.addColorStop(0, activeTheme.primary + '66');
    radialGrad.addColorStop(0.5, activeTheme.secondary + '26');
    radialGrad.addColorStop(1, '#000000');
    ctx.fillStyle = radialGrad;
    ctx.fillRect(0, 0, W, H);

    // Grid lines for Cyberpunk / Neon
    if (selectedTheme === 'Cyberpunk Neon' || selectedTheme === 'Neon') {
      ctx.strokeStyle = activeTheme.primary + '18';
      ctx.lineWidth = 2 * mult;
      for (let i = 0; i < H; i += 40 * mult) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(W, i);
        ctx.stroke();
      }
    }

    // 3. Draw Galaxy Particles & Cosmos sparkles
    if (selectedTheme === 'Purple Galaxy' || selectedTheme === 'ARIRANG Tour' || selectedTheme === 'FESTA Celebration' || selectedTheme === 'Dreamy Lilac') {
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 90; i++) {
        const px = Math.random() * W;
        const py = Math.random() * H;
        const size = (Math.random() * 2.8 + 0.5) * mult;
        const opacity = Math.random() * 0.7 + 0.2;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    }

    // 4. Subtle Outer Framing Borders
    const pad = 24 * mult;
    ctx.strokeStyle = activeTheme.primary + '33';
    ctx.lineWidth = 2 * mult;
    ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);

    // Golden corners for Luxury
    if (selectedTheme === 'Golden Luxury' || selectedTheme === 'Luxury') {
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 4 * mult;
      const tLen = 30 * mult;
      ctx.beginPath(); ctx.moveTo(pad, pad + tLen); ctx.lineTo(pad, pad); ctx.lineTo(pad + tLen, pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W - pad, pad + tLen); ctx.lineTo(W - pad, pad); ctx.lineTo(W - pad - tLen, pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, H - pad - tLen); ctx.lineTo(pad, H - pad); ctx.lineTo(pad + tLen, H - pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W - pad, H - pad - tLen); ctx.lineTo(W - pad, H - pad); ctx.lineTo(W - pad - tLen, H - pad); ctx.stroke();
    }

    // 5. Draw Ticket barcode for ticket / fan card
    if (designType === 'Concert Ticket' || designType === 'Fan Card' || selectedTheme === 'ARIRANG Tour') {
      ctx.fillStyle = activeTheme.accent + '44';
      const barcodeW = 140 * mult;
      const barcodeH = 45 * mult;
      const bx = W - pad - barcodeW - 20 * mult;
      const by = H - pad - barcodeH - 20 * mult;
      
      for (let x = 0; x < barcodeW; x += 6 * mult) {
        const lineW = Math.random() > 0.5 ? 3 * mult : 1.5 * mult;
        ctx.fillRect(bx + x, by, lineW, barcodeH);
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${11 * mult}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(membershipId, bx + barcodeW / 2, by + barcodeH + 16 * mult);
    }

    // 6. DRAW UPLOADED USER PHOTO WITH CROPPING, ZOOM, ROTATION & FILTERS
    if (uploadedImage) {
      const img = new Image();
      img.onload = () => {
        ctx.save();

        const isAvatarMaker = designType === 'Profile Picture / Avatar Maker' || activeStudioTab === 'avatar';
        const effectiveShape = isAvatarMaker 
          ? (avatarShape === 'circle' ? 'Circle' : avatarShape === 'square' ? 'Square' : 'Rounded-Square')
          : photoCropShape;

        const cx = W / 2 + photoPanX * mult;
        const cy = (isAvatarMaker ? H * 0.46 : H * 0.42) + photoPanY * mult;

        // Apply Glow if enabled
        if (isAvatarMaker && avatarPurpleGlow) {
          ctx.shadowColor = '#A855F7';
          ctx.shadowBlur = 40 * mult;
        } else {
          ctx.shadowColor = activeTheme.accent;
          ctx.shadowBlur = 25 * mult;
        }

        // Draw Crop Shape Path
        ctx.beginPath();
        if (effectiveShape === 'Circle') {
          const radius = (isAvatarMaker ? Math.min(W, H) * 0.32 : Math.min(W, H) * 0.24);
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        } else if (effectiveShape === 'Rounded-Square') {
          const sz = (isAvatarMaker ? Math.min(W, H) * 0.6 : Math.min(W, H) * 0.48);
          roundRectPath(ctx, cx - sz / 2, cy - sz / 2, sz, sz, 30 * mult);
        } else if (effectiveShape === 'Square') {
          const sz = (isAvatarMaker ? Math.min(W, H) * 0.6 : Math.min(W, H) * 0.48);
          ctx.rect(cx - sz / 2, cy - sz / 2, sz, sz);
        } else if (effectiveShape === 'Arch') {
          const frameWidth = W * 0.6;
          const frameHeight = H * 0.48;
          const rx = cx - frameWidth / 2;
          const ry = cy - frameHeight / 2;
          ctx.moveTo(rx, ry + frameHeight);
          ctx.lineTo(rx, ry + frameWidth * 0.5);
          ctx.arc(rx + frameWidth * 0.5, ry + frameWidth * 0.5, frameWidth * 0.5, Math.PI, 0, false);
          ctx.lineTo(rx + frameWidth, ry + frameHeight);
          ctx.closePath();
        } else {
          // Heart shape
          const sz = Math.min(W, H) * 0.28;
          ctx.moveTo(cx, cy + sz / 2);
          ctx.bezierCurveTo(cx, cy, cx - sz, cy, cx - sz, cy - sz / 2);
          ctx.bezierCurveTo(cx - sz, cy - sz, cx, cy - sz * 0.8, cx, cy - sz * 0.3);
          ctx.bezierCurveTo(cx, cy - sz * 0.8, cx + sz, cy - sz, cx + sz, cy - sz / 2);
          ctx.bezierCurveTo(cx + sz, cy, cx, cy, cx, cy + sz / 2);
        }
        ctx.clip();

        // Transformation: Pan, Zoom, Rotate
        ctx.translate(cx, cy);
        ctx.rotate((photoRotate * Math.PI) / 180);
        ctx.scale(photoZoom, photoZoom);

        // Calculate aspect fill
        const targetDim = Math.max(W, H) * 0.6;
        const scale = Math.max(targetDim / img.width, targetDim / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;

        // Apply selected Color Filter
        if (photoFilter === 'Borahae Purple') {
          ctx.filter = 'contrast(115%) saturate(130%) hue-rotate(270deg)';
        } else if (photoFilter === 'Golden Glow') {
          ctx.filter = 'sepia(40%) saturate(140%) brightness(105%)';
        } else if (photoFilter === 'Cyberpunk Neon') {
          ctx.filter = 'contrast(130%) saturate(160%) hue-rotate(180deg)';
        } else if (photoFilter === 'Vintage Film') {
          ctx.filter = 'sepia(30%) contrast(110%) brightness(95%)';
        } else if (photoFilter === 'B&W Editorial') {
          ctx.filter = 'grayscale(100%) contrast(125%)';
        }

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // Draw Outer Border on the cropped shape
        ctx.save();
        ctx.strokeStyle = isAvatarMaker && avatarPurpleGlow ? '#C084FC' : activeTheme.accent;
        ctx.lineWidth = (isAvatarMaker ? avatarBorderWidth : 4) * mult;
        if (effectiveShape === 'Circle') {
          const radius = (isAvatarMaker ? Math.min(W, H) * 0.32 : Math.min(W, H) * 0.24);
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.stroke();
        } else if (effectiveShape === 'Rounded-Square') {
          const sz = (isAvatarMaker ? Math.min(W, H) * 0.6 : Math.min(W, H) * 0.48);
          ctx.beginPath();
          roundRectPath(ctx, cx - sz / 2, cy - sz / 2, sz, sz, 30 * mult);
          ctx.stroke();
        } else if (effectiveShape === 'Square') {
          const sz = (isAvatarMaker ? Math.min(W, H) * 0.6 : Math.min(W, H) * 0.48);
          ctx.beginPath();
          ctx.rect(cx - sz / 2, cy - sz / 2, sz, sz);
          ctx.stroke();
        }
        ctx.restore();

        // Draw Badge for Avatar Maker
        if (isAvatarMaker) {
          drawAvatarBadgeStamp(ctx, cx, cy, mult);
        }

        drawTypography(ctx, W, H, activeTheme, activeBiasObj, mult);
      };
      img.src = uploadedImage;
    }
  };

  const drawAvatarBadgeStamp = (ctx: CanvasRenderingContext2D, cx: number, cy: number, mult: number) => {
    ctx.save();
    const bx = cx + 130 * mult;
    const by = cy + 130 * mult;
    ctx.fillStyle = '#9333EA';
    ctx.beginPath();
    ctx.arc(bx, by, 22 * mult, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5 * mult;
    ctx.stroke();

    ctx.font = `${18 * mult}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let badgeEmoji = '💜';
    if (avatarBadge === 'bts-logo') badgeEmoji = '⟭⟬';
    else if (avatarBadge === 'army-bomb') badgeEmoji = '💣';
    else if (avatarBadge === 'crown') badgeEmoji = '👑';
    else if (avatarBadge === 'star') badgeEmoji = '⭐';
    else if (avatarBadge === 'blossom') badgeEmoji = '🌸';
    else if (avatarBadge === 'music') badgeEmoji = '🎶';
    ctx.fillText(badgeEmoji, bx, by);
    ctx.restore();
  };

  const drawOverlayEffect = (ctx: CanvasRenderingContext2D, W: number, H: number, activeTheme: any, mult: number) => {
    if (activeOverlay === 'Neon Scanlines') {
      ctx.save();
      ctx.strokeStyle = activeTheme.accent + '22';
      ctx.lineWidth = 1 * mult;
      for (let i = 0; i < H; i += 8 * mult) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(W, i);
        ctx.stroke();
      }
      ctx.restore();
    } else if (activeOverlay === 'Vintage Film') {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let i = 0; i < 1500; i++) {
        ctx.fillRect(Math.random() * W, Math.random() * H, 1 * mult, 1 * mult);
      }
      ctx.restore();
    } else if (activeOverlay === 'Romantic Hearts') {
      ctx.save();
      ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
      for (let i = 0; i < 20; i++) {
        const hx = (i * 59 + 17) % W;
        const hy = (i * 37 + 43) % H;
        const sz = ((i % 3) * 4 + 8) * mult;
        ctx.font = `${sz}px sans-serif`;
        ctx.fillText('💜', hx, hy);
      }
      ctx.restore();
    }
  };

  const drawTypography = (ctx: CanvasRenderingContext2D, W: number, H: number, activeTheme: any, biasObj: any, mult: number) => {
    drawOverlayEffect(ctx, W, H, activeTheme, mult);

    ctx.textAlign = 'center';
    ctx.shadowBlur = 0;

    const isAvatarMaker = designType === 'Profile Picture / Avatar Maker' || activeStudioTab === 'avatar';

    if (isAvatarMaker) {
      // Profile Picture specific typography & bottom banner
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${32 * mult}px sans-serif`;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 10 * mult;
      ctx.fillText((avatarUsername || `@${name.toLowerCase()}`), W / 2, H * 0.86);

      ctx.fillStyle = activeTheme.accent;
      ctx.font = `bold ${18 * mult}px sans-serif`;
      ctx.fillText(`💜 ${selectedBias} Official Avatar 💜`, W / 2, H * 0.92);
    } else {
      // Subtitle / Header stamp
      ctx.fillStyle = activeTheme.accent;
      ctx.font = `bold ${12 * mult}px monospace`;
      ctx.fillText('BANGTAN PORTAL STUDIO', W / 2, H * 0.12);

      // Divider line
      ctx.strokeStyle = activeTheme.primary + '55';
      ctx.lineWidth = 1 * mult;
      ctx.beginPath();
      ctx.moveTo(W * 0.35, H * 0.14);
      ctx.lineTo(W * 0.65, H * 0.14);
      ctx.stroke();

      // User's customized Name in elegant uppercase
      ctx.font = `bold ${48 * mult}px sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = activeTheme.primary;
      ctx.shadowBlur = 10 * mult;
      ctx.fillText(name.toUpperCase(), W / 2, H * 0.72);
      ctx.shadowBlur = 0;

      // TEAM BIAS tag
      ctx.fillStyle = activeTheme.accent;
      ctx.font = `bold ${22 * mult}px sans-serif`;
      ctx.fillText(`💜 TEAM ${selectedBias.toUpperCase()} 💜`, W / 2, H * 0.78);

      // Custom Text bubble/tag
      if (customText) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${16 * mult}px monospace`;
        ctx.fillText(`"${customText}"`, W / 2, H * 0.86);
      }

      // Design layout footer stamp
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = `${10 * mult}px sans-serif`;
      ctx.fillText(`PRODUCED BY SHAIYIN • ${selectedTheme} ${designType} EDITION`, W / 2, H - 35 * mult);
    }

    const dataUrl = outputCanvasRef.current?.toDataURL(`image/${exportFormat === 'jpeg' ? 'jpeg' : exportFormat}`) || '';
    setCanvasDataUrl(dataUrl);
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 5000);
  };

  // Re-render when parameters change
  useEffect(() => {
    renderArtwork();
  }, [
    name, selectedBias, designType, selectedTheme, customText, uploadedImage, activeOverlay,
    photoZoom, photoPanX, photoPanY, photoRotate, photoCropShape, photoFilter,
    avatarShape, avatarPurpleGlow, avatarBorderWidth, avatarBadge, avatarUsername,
    exportResolution, exportFormat
  ]);

  const handleDownload = (format: 'png' | 'jpeg' | 'webp' = exportFormat) => {
    if (!canvasDataUrl) {
      alert("Upload a photo first — your design is created from your photo!");
      return;
    }
    const link = document.createElement('a');
    link.download = `BTS_${selectedBias.replace(' ', '_')}_${designType.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${format}`;
    link.href = outputCanvasRef.current?.toDataURL(`image/${format === 'jpeg' ? 'jpeg' : format}`) || '';
    link.click();
    showFeedback(`Downloaded high-resolution ${format.toUpperCase()} successfully! 💜`);
  };

  const handleCopyImageUrl = () => {
    if (!canvasDataUrl) return;
    navigator.clipboard.writeText(canvasDataUrl).then(() => {
      showFeedback("Copied base64 image data to clipboard!");
    });
  };

  const handleShare = () => {
    if (navigator.share && canvasDataUrl) {
      navigator.share({
        title: 'My Custom BTS Poster',
        text: `Check out this customized ${selectedBias} poster I made on the Bangtan Fan Portal!`,
        url: window.location.href
      }).then(() => {
        showFeedback("Shared design successfully!");
      }).catch(() => {
        handleCopyImageUrl();
      });
    } else {
      handleCopyImageUrl();
    }
  };

  return (
    <div className="w-full space-y-8 animate-fade-in font-sans">
      {/* Upper header banner segment */}
      <div className="rounded-3xl border border-purple-500/15 bg-gradient-to-r from-purple-950/30 via-[#0d071a] to-fuchsia-950/20 p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5">
          <div className="w-full">
            <div className="flex items-center gap-2">
              <span className="p-1 px-3 rounded-full bg-purple-500/10 text-purple-300 font-mono text-[9px] font-bold uppercase tracking-widest border border-purple-500/20">
                ✨ ADVANCED DESIGN STUDIO
              </span>
              <span className="p-1 px-3 rounded-full bg-pink-500/10 text-pink-300 font-mono text-[9px] font-bold uppercase tracking-widest border border-pink-500/20 animate-pulse">
                17 DESIGN TYPES
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-sans font-black text-white mt-2 tracking-tight">
              Generate Pic Studio: Photo &amp; Design Maker
            </h1>
            <p className="text-gray-400 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Upload your own photo, crop and adjust filters, transform into 17 BTS design formats, create profile picture avatars, or browse Pinterest-inspired BTS aesthetics!
            </p>
          </div>

          <div className="flex items-center gap-2 w-full">
            {/* Tab switchers */}
            <div className="flex bg-black/60 p-1 rounded-xl border border-purple-500/20 text-xs font-mono overflow-x-auto max-w-full">
              <button
                onClick={() => {
                  setDesignType('Profile Picture / Avatar Maker');
                  setActiveStudioTab('avatar');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center whitespace-nowrap shrink-0 gap-1.5 ${
                  activeStudioTab === 'avatar' ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>👤 1. Profile Maker</span>
                <span className="text-[8px] bg-purple-400/20 text-purple-200 px-1 rounded uppercase font-bold">Featured</span>
              </button>
              <button
                onClick={() => {
                  if (designType === 'Profile Picture / Avatar Maker') {
                    setDesignType('BTS Poster');
                  }
                  setActiveStudioTab('editor');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center whitespace-nowrap shrink-0 gap-1 ${
                  activeStudioTab === 'editor' ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>⟭⟬ 2. BTS Template Maker</span>
              </button>
              <button
                onClick={() => setActiveStudioTab('inspiration')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center whitespace-nowrap shrink-0 gap-1 ${
                  activeStudioTab === 'inspiration' ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>📌 3. Inspiration</span>
              </button>
              <button
                onClick={() => setActiveStudioTab('poster')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center whitespace-nowrap shrink-0 gap-1 ${
                  activeStudioTab === 'poster' ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🎉 4. Comeback Poster</span>
              </button>
              <button
                onClick={() => setActiveStudioTab('cake')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center whitespace-nowrap shrink-0 gap-1 ${
                  activeStudioTab === 'cake' ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🎂 5. Birthday Cake</span>
              </button>
            </div>

            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-mono text-xs cursor-pointer hover:text-white transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                Back
              </button>
            )}
          </div>
          <div className="w-full">
            <button
              onClick={handleAutoDesign}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-sans font-black text-sm tracking-wide shadow-lg shadow-fuchsia-900/40 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4.5 h-4.5" />
              <span>Click to upload photo</span>
            </button>
            <p className="text-center text-[10px] text-purple-300/70 font-mono mt-1.5">Give it one photo — it reads the colors and sets the theme, filter and frame for you ✨</p>
          </div>

        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-200 font-sans text-xs flex items-center gap-2 animate-bounce shadow-lg">
          <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* COMEBACK POSTER TAB — simple auto-compose poster maker */}
      {activeStudioTab === 'poster' && (
        <div className="rounded-3xl border border-purple-500/15 bg-black/50 p-6 md:p-8 space-y-6">
          <div className="pb-3 border-b border-white/10">
            <h2 className="text-xl font-sans font-black text-white flex items-center gap-2">🎉 Create Your Comeback Poster</h2>
            <p className="text-gray-400 text-xs mt-1">Pick a size, style it your way — colors, background photo, even draw on it — then Generate & Download. No design skills needed!</p>
          </div>
          <ComebackPosterStudio />
        </div>
      )}

      {/* BIRTHDAY CAKE TAB — decorate-a-cake studio */}
      {activeStudioTab === 'cake' && (
        <div className="rounded-3xl border border-purple-500/15 bg-black/50 p-6 md:p-8 space-y-6">
          <div className="pb-3 border-b border-white/10">
            <h2 className="text-xl font-sans font-black text-white flex items-center gap-2">🎂 Decorate a Birthday Cake</h2>
            <p className="text-gray-400 text-xs mt-1">For a member's birthday or your own — shape it, color it, add candles and stickers, write your wish, and download your cake!</p>
          </div>
          <BirthdayCakeStudio />
        </div>
      )}

      {/* PINTEREST-INSPIRED INSPIRATION GALLERY TAB (Requirement 3) */}
      {activeStudioTab === 'inspiration' && (
        <div className="rounded-3xl border border-purple-500/15 bg-black/50 p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-white/10">
            <div>
              <h2 className="text-xl font-sans font-black text-white flex items-center gap-2">
                📌 Pinterest-Inspired Design Inspiration Gallery
              </h2>
              <p className="text-gray-400 text-xs mt-1">
                Select an aesthetic BTS layout below to instantly apply its colors, typography, frame style, and decorative elements to your photo.
              </p>
            </div>
            <button
              onClick={() => setActiveStudioTab('editor')}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold rounded-lg transition-all cursor-pointer"
            >
              Back to Studio Editor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DESIGN_INSPIRATIONS.map((insp) => (
              <div 
                key={insp.id}
                className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-purple-500/40 hover:bg-purple-950/15 transition-all space-y-3 flex flex-col justify-between group shadow-xl"
              >
                <div className="space-y-3">
                  <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-black/60 relative border border-white/10">
                    <img 
                      src={insp.previewImg} 
                      alt={insp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-purple-600 text-white">
                        {insp.category}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white leading-snug">{insp.title}</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{insp.description}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-purple-400">Theme: {insp.theme}</span>
                  <button
                    type="button"
                    onClick={() => applyInspiration(insp)}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs font-mono font-bold rounded-lg cursor-pointer transition-all shadow-md shadow-purple-600/30 flex items-center gap-1"
                  >
                    <span>Apply to My Photo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DEDICATED PROFILE PICTURE / AVATAR MAKER VIEW (Requirement 4) */}
      {activeStudioTab === 'avatar' && (
        <div className="rounded-3xl border border-purple-500/20 bg-black/60 p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-purple-500/15">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-mono text-[9px] font-bold uppercase tracking-wider border border-purple-500/30">
                👤 Dedicated Avatar Maker
              </span>
              <h2 className="text-xl md:text-2xl font-sans font-black text-white mt-1">
                BTS Profile Picture / Avatar Studio
              </h2>
              <p className="text-gray-400 text-xs mt-0.5">
                Upload your selfie or photo, choose circular or rounded crops, apply purple neon glow, and preview in live avatar sizes.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDesignType('Profile Picture / Avatar Maker');
                  setActiveStudioTab('editor');
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-600/30"
              >
                Open in Main Canvas
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Controls */}
            <div className="lg:col-span-6 space-y-5">

              {/* Direct Photo Uploader for Avatar Maker */}
              <div className="space-y-2 p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-300 font-mono flex items-center gap-1.5 uppercase">
                    <Upload className="w-3.5 h-3.5 text-cyan-400" /> 1. Upload Photo / Selfie
                  </label>
                  {uploadedImage && (
                    <button 
                      onClick={() => setUploadedImage(null)}
                      className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-0.5 font-mono cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>

                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerAvatarFileSelect}
                  className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors text-xs ${
                    dragActive
                      ? 'border-fuchsia-500 bg-fuchsia-950/20 text-fuchsia-300'
                      : uploadedImage
                        ? 'border-emerald-500/40 bg-emerald-950/10 text-emerald-300'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 text-gray-400 hover:bg-white/[0.04]'
                  }`}
                >
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept="image/jpeg, image/jpg, image/png, image/webp"
                    className="hidden"
                  />
                  
                  {uploadedImage ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-emerald-500 shadow-md">
                        <img src={uploadedImage} alt="Uploaded avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-white text-[11px]">Photo Attached ({uploadFileSize || 'Ready'})</p>
                        <p className="text-[9px] text-gray-400 font-mono">Live multi-size previews active • Click to replace</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 py-1">
                      <p className="font-bold text-gray-200 text-xs">Drop Selfie or Click to Upload</p>
                      <p className="text-[10px] text-gray-400 font-mono">JPG, PNG, WEBP • Auto-centered for avatar</p>
                    </div>
                  )}
                </div>

                {/* Real-time Upload Progress & Elapsed / Processing Duration Timers */}
                {isUploadingPhoto && (
                  <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-500/30 space-y-2 font-mono text-xs animate-pulse">
                    <div className="flex items-center justify-between text-purple-200">
                      <span className="font-bold flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-400" />
                        Uploading Photo: {uploadProgress}%
                      </span>
                      <span className="text-[10px] text-slate-300 font-mono">{uploadFileSize}</span>
                    </div>

                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-purple-500/20">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-purple-300 font-mono pt-0.5">
                      <span className="flex items-center gap-1">
                        ⏱️ Elapsed: <span className="text-white font-bold">{uploadElapsedTime.toFixed(1)}s</span>
                      </span>
                      <span className="flex items-center gap-1 text-pink-300">
                        ⚡ Est. Processing: <span className="text-white font-bold">~{uploadEstimatedDuration.toFixed(1)}s</span>
                      </span>
                    </div>

                    <p className="text-[9px] text-slate-400 italic text-center pt-0.5">{uploadStatusText}</p>
                  </div>
                )}

                {/* Instant BTS Presets */}
                <div className="pt-1">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1.5 uppercase">Or quick-try BTS Sample Photo:</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BTS_SAMPLE_PRESETS.map((p) => (
                      <button
                        key={p.bias}
                        type="button"
                        onClick={() => {
                          setUploadedImage(p.url);
                          setSelectedBias(p.bias);
                          setUploadFileSize('1.2 MB');
                          showFeedback(`Loaded ${p.bias} sample photo!`);
                        }}
                        className="py-1 px-1.5 rounded-lg border border-purple-500/20 bg-purple-950/30 hover:bg-purple-800/40 text-[10px] font-mono text-purple-200 hover:text-white transition-all cursor-pointer text-center truncate"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Crop Shape Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-300 font-mono block uppercase">2. Avatar Crop Shape</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'circle', label: '⭕ Circular Crop' },
                    { id: 'rounded', label: '🔲 Rounded Square' },
                    { id: 'square', label: '⏹️ Square Crop' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setAvatarShape(s.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                        avatarShape === s.id ? 'bg-purple-600 text-white border-purple-400 shadow-md' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Purple Glow & Border Controls */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/15 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white font-mono uppercase">3. Borahae Purple Neon Glow</label>
                  <input
                    type="checkbox"
                    checked={avatarPurpleGlow}
                    onChange={(e) => setAvatarPurpleGlow(e.target.checked)}
                    className="w-4 h-4 rounded border-purple-500 bg-[#090515] checked:bg-purple-600 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-purple-300">
                    <span>Border Thickness</span>
                    <span>{avatarBorderWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={avatarBorderWidth}
                    onChange={(e) => setAvatarBorderWidth(parseInt(e.target.value))}
                    className="w-full accent-purple-600 bg-purple-950/40 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
              </div>

              {/* Badge Stamp & Username */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-purple-300 font-mono block uppercase">4. BTS Badges &amp; Stickers</label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {[
                      { id: 'purple-heart', label: '💜 Heart' },
                      { id: 'bts-logo', label: '⟭⟬ Logo' },
                      { id: 'army-bomb', label: '💣 Bomb' },
                      { id: 'crown', label: '👑 Crown' },
                      { id: 'star', label: '⭐ Star' },
                      { id: 'blossom', label: '🌸 Blossom' },
                      { id: 'music', label: '🎶 Music' }
                    ].map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setAvatarBadge(b.id as any)}
                        className={`p-2 rounded-xl border text-center text-xs font-mono font-bold transition-all cursor-pointer truncate ${
                          avatarBadge === b.id ? 'bg-purple-600 text-white border-purple-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-purple-300 font-mono block uppercase">5. Profile Handle</label>
                    <input
                      type="text"
                      value={avatarUsername}
                      onChange={(e) => setAvatarUsername(e.target.value)}
                      placeholder="e.g. @army_bts7"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-purple-300 font-mono block uppercase">6. Member Bias</label>
                    <select
                      value={selectedBias}
                      onChange={(e) => setSelectedBias(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                    >
                      {BIASES.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.emoji} {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Live Multi-Size Avatar Previews */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-black/80 border border-purple-500/20 space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-purple-500/10">
                  <span className="text-xs font-mono font-bold text-purple-300 uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live Multi-Size Avatar Preview Monitor
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">1:1 Square (1080×1080)</span>
                </div>

                <div className="flex flex-wrap items-end justify-center gap-6 py-6">
                  {/* Large 150px Avatar Preview */}
                  <div className="text-center space-y-2">
                    <div className={`w-[150px] h-[150px] overflow-hidden bg-black/60 relative ${
                      avatarShape === 'circle' ? 'rounded-full' : avatarShape === 'rounded' ? 'rounded-2xl' : 'rounded-none'
                    } ${avatarPurpleGlow ? 'shadow-[0_0_30px_rgba(168,85,247,0.7)]' : ''} border border-purple-400/50`}>
                      <img 
                        src={uploadedImage || 'https://commons.wikimedia.org/wiki/Special:FilePath/BTS_Love_Yourself_-_Speak_Yourself_tour_at_Rose_Bowl,_Pasadena_(California),_4_May_2019_01.jpg?width=1280'} 
                        alt="150px avatar" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 bg-purple-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs border border-white shadow-md">
                        {avatarBadge === 'bts-logo' ? '⟭⟬' : avatarBadge === 'army-bomb' ? '💣' : avatarBadge === 'crown' ? '👑' : avatarBadge === 'star' ? '⭐' : avatarBadge === 'blossom' ? '🌸' : avatarBadge === 'music' ? '🎶' : '💜'}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 block font-bold">150px Large Profile</span>
                  </div>

                  {/* Medium 96px Badge Preview */}
                  <div className="text-center space-y-2">
                    <div className={`w-[96px] h-[96px] overflow-hidden bg-black/60 relative ${
                      avatarShape === 'circle' ? 'rounded-full' : avatarShape === 'rounded' ? 'rounded-xl' : 'rounded-none'
                    } ${avatarPurpleGlow ? 'shadow-[0_0_20px_rgba(168,85,247,0.6)]' : ''} border border-purple-400/50`}>
                      <img 
                        src={uploadedImage || 'https://commons.wikimedia.org/wiki/Special:FilePath/BTS_Love_Yourself_-_Speak_Yourself_tour_at_Rose_Bowl,_Pasadena_(California),_4_May_2019_01.jpg?width=1280'} 
                        alt="96px avatar" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 right-1 bg-purple-700 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-white shadow-md">
                        {avatarBadge === 'bts-logo' ? '⟭⟬' : avatarBadge === 'army-bomb' ? '💣' : avatarBadge === 'crown' ? '👑' : '💜'}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 block font-bold">96px Medium Badge</span>
                  </div>

                  {/* Small 48px Chat/Comment Preview */}
                  <div className="text-center space-y-2">
                    <div className={`w-[48px] h-[48px] overflow-hidden bg-black/60 relative ${
                      avatarShape === 'circle' ? 'rounded-full' : avatarShape === 'rounded' ? 'rounded-lg' : 'rounded-none'
                    } ${avatarPurpleGlow ? 'shadow-[0_0_15px_rgba(168,85,247,0.5)]' : ''} border border-purple-400/50`}>
                      <img 
                        src={uploadedImage || 'https://commons.wikimedia.org/wiki/Special:FilePath/BTS_Love_Yourself_-_Speak_Yourself_tour_at_Rose_Bowl,_Pasadena_(California),_4_May_2019_01.jpg?width=1280'} 
                        alt="48px avatar" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 block font-bold">48px Chat</span>
                  </div>
                </div>

                <div className="bg-purple-950/30 p-3 rounded-xl border border-purple-500/15 text-center">
                  <p className="text-xs font-bold text-white font-sans">{avatarUsername}</p>
                  <p className="text-[10px] font-mono text-purple-300">💜 Official {selectedBias} ARMY Avatar 💜</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-purple-500/10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5 text-[10px] font-mono">
                    <button
                      onClick={() => handleDownload('png')}
                      className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> PNG
                    </button>
                    <button
                      onClick={() => handleDownload('jpeg')}
                      className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> JPG
                    </button>
                    <button
                      onClick={() => handleDownload('webp')}
                      className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> WEBP
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDesignType('Profile Picture / Avatar Maker');
                      setActiveStudioTab('editor');
                    }}
                    className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-purple-500/20 text-purple-200 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Full Canvas Editor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Ad Placement Preserved */}
                <div className="flex justify-center items-center pt-2">
                  <AdsterraAd type={8} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN STUDIO EDITOR WORKSPACE */}
      {activeStudioTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Parameters configuration Form (Col span 5) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 md:p-6 space-y-5">
              <h2 className="text-base font-sans font-extrabold text-white flex items-center gap-2 pb-3 border-b border-white/5 uppercase tracking-widest text-xs font-mono">
                <Sliders className="w-4 h-4 text-purple-400" /> Configuration Parameters
              </h2>

              {/* Upload image form & Photo Controls (Requirement 1) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 font-mono flex items-center gap-1.5 justify-between">
                  <span className="flex items-center gap-1.5 text-purple-300 font-bold">
                    <Upload className="w-3.5 h-3.5 text-cyan-400" /> Upload Your Own Photo (JPG, PNG, WEBP)
                  </span>
                  {uploadedImage && (
                    <button 
                      onClick={() => setUploadedImage(null)}
                      className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-0.5 font-mono capitalize cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </label>

                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors text-xs ${
                    dragActive
                      ? 'border-fuchsia-500 bg-fuchsia-950/20 text-fuchsia-300'
                      : uploadedImage
                        ? 'border-emerald-500/40 bg-emerald-950/10 text-emerald-300'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 text-gray-400 hover:bg-white/[0.04]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept="image/jpeg, image/jpg, image/png, image/webp"
                    className="hidden"
                  />
                  
                  {uploadedImage ? (
                    <div className="space-y-1 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-emerald-500 shadow-lg">
                        <img src={uploadedImage} alt="Uploaded preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <p className="font-bold text-white uppercase text-[10px] tracking-wide mt-1">Photo Attached ({uploadFileSize || 'Ready'})</p>
                      <p className="text-[9px] text-gray-500 font-mono">Instant live preview active • Click to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-1 py-1.5">
                      <p className="font-bold text-gray-300">Drag &amp; Drop or Click to Upload</p>
                      <p className="text-[10px] text-gray-500 font-mono">Supports JPG, PNG, WEBP • Crop, zoom &amp; rotate</p>
                    </div>
                  )}
                </div>

                {/* Real-time Upload Progress & Elapsed / Processing Duration Timers */}
                {isUploadingPhoto && (
                  <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-500/30 space-y-2 font-mono text-xs animate-pulse">
                    <div className="flex items-center justify-between text-purple-200">
                      <span className="font-bold flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-400" />
                        Uploading Photo: {uploadProgress}%
                      </span>
                      <span className="text-[10px] text-slate-300 font-mono">{uploadFileSize}</span>
                    </div>

                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-purple-500/20">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-purple-300 font-mono pt-0.5">
                      <span className="flex items-center gap-1">
                        ⏱️ Elapsed: <span className="text-white font-bold">{uploadElapsedTime.toFixed(1)}s</span>
                      </span>
                      <span className="flex items-center gap-1 text-pink-300">
                        ⚡ Est. Processing: <span className="text-white font-bold">~{uploadEstimatedDuration.toFixed(1)}s</span>
                      </span>
                    </div>

                    <p className="text-[9px] text-slate-400 italic text-center pt-0.5">{uploadStatusText}</p>
                  </div>
                )}

                {/* Quick-try BTS Sample Photo Presets */}
                <div className="pt-1">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1 uppercase">Or quick-try BTS Sample Photo:</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BTS_SAMPLE_PRESETS.map((p) => (
                      <button
                        key={p.bias}
                        type="button"
                        onClick={() => {
                          setUploadedImage(p.url);
                          setSelectedBias(p.bias);
                          setUploadFileSize('1.2 MB');
                          showFeedback(`Loaded ${p.bias} sample photo!`);
                        }}
                        className="py-1 px-1.5 rounded-lg border border-purple-500/20 bg-purple-950/30 hover:bg-purple-800/40 text-[10px] font-mono text-purple-200 hover:text-white transition-all cursor-pointer text-center truncate"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo Adjustment Controls (Requirement 1 & 5) */}
                {uploadedImage && (
                  <div className="p-4 rounded-xl bg-purple-950/25 border border-purple-500/20 space-y-3 font-sans animate-fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-purple-500/10">
                      <span className="text-[11px] font-mono font-bold text-purple-300 uppercase flex items-center gap-1">
                        <Crop className="w-3.5 h-3.5 text-purple-400" /> Photo Adjustments
                      </span>
                      <button
                        type="button"
                        onClick={handleResetAdjustments}
                        className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Undo2 className="w-3 h-3" /> Reset
                      </button>
                    </div>

                    {/* Zoom & Rotation */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>Zoom: {Math.round(photoZoom * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2.5"
                          step="0.05"
                          value={photoZoom}
                          onChange={(e) => setPhotoZoom(parseFloat(e.target.value))}
                          className="w-full accent-purple-600 bg-black/40 rounded h-1.5 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>Rotate: {photoRotate}°</span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="5"
                          value={photoRotate}
                          onChange={(e) => setPhotoRotate(parseInt(e.target.value))}
                          className="w-full accent-purple-600 bg-black/40 rounded h-1.5 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Pan X and Pan Y */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>Pan X: {photoPanX}px</span>
                        </div>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={photoPanX}
                          onChange={(e) => setPhotoPanX(parseInt(e.target.value))}
                          className="w-full accent-purple-600 bg-black/40 rounded h-1.5 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>Pan Y: {photoPanY}px</span>
                        </div>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={photoPanY}
                          onChange={(e) => setPhotoPanY(parseInt(e.target.value))}
                          className="w-full accent-purple-600 bg-black/40 rounded h-1.5 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Crop Shape Selector */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-mono text-purple-300 block uppercase">Frame Shape</span>
                      <div className="grid grid-cols-5 gap-1.5 text-[10px] font-mono">
                        {['Circle', 'Rounded-Square', 'Square', 'Arch', 'Heart'].map((sh) => (
                          <button
                            key={sh}
                            type="button"
                            onClick={() => setPhotoCropShape(sh as any)}
                            className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                              photoCropShape === sh ? 'bg-purple-600 text-white border-purple-400 font-bold' : 'bg-black/30 border-white/5 text-slate-400 hover:text-white'
                            }`}
                          >
                            {sh}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Photo Filter Tone */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-mono text-purple-300 block uppercase">Photo Filter / Tone</span>
                      <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                        {['Normal', 'Borahae Purple', 'Golden Glow', 'Cyberpunk Neon', 'Vintage Film', 'B&W Editorial'].map((flt) => (
                          <button
                            key={flt}
                            type="button"
                            onClick={() => setPhotoFilter(flt as any)}
                            className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer truncate ${
                              photoFilter === flt ? 'bg-purple-600 text-white border-purple-400 font-bold' : 'bg-black/30 border-white/5 text-slate-400 hover:text-white'
                            }`}
                          >
                            {flt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Choose Design Type (All 17 Design Formats - Requirement 2) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-400 font-mono flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-pink-400" /> Choose Design Type (17 Available)
                  </label>
                  <span className="text-[9px] font-mono text-purple-300 font-bold">
                    {designType}
                  </span>
                </div>
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {DESIGN_TYPES.map((dt) => {
                    const isSelected = designType === dt.value;
                    return (
                      <button
                        key={dt.value}
                        onClick={() => setDesignType(dt.value)}
                        className={`p-2.5 rounded-xl border font-sans text-left text-xs transition-all cursor-pointer flex justify-between items-center ${
                          isSelected
                            ? 'bg-pink-950/30 border-pink-500/50 text-pink-200 font-bold shadow-md shadow-pink-600/15'
                            : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white hover:border-white/15'
                        }`}
                      >
                        <span className="truncate">{dt.label}</span>
                        <span className="text-[8px] font-mono text-gray-500 bg-white/[0.04] px-1 rounded border border-white/5 shrink-0 ml-1">{dt.ratio}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 font-mono flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-400" /> Name / Title
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={25}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-sans text-sm focus:border-purple-500/50 outline-none transition-colors"
                  placeholder="Enter BTS or Your Name"
                />
              </div>

              {/* Select Bias */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 font-mono flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" /> Select Your Bias
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-4 gap-1.5">
                  {BIASES.map((b) => {
                    const isSelected = selectedBias === b.name;
                    return (
                      <button
                        key={b.name}
                        onClick={() => setSelectedBias(b.name)}
                        className={`py-1.5 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 group ${
                          isSelected 
                            ? 'bg-purple-950/40 border-purple-500/50 text-white shadow-md' 
                            : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white hover:border-white/20'
                        }`}
                        title={b.role}
                      >
                        <span className="text-base text-gray-100 group-hover:scale-110 transition-transform select-none">{b.emoji}</span>
                        <span className="text-[10px] font-sans font-bold block leading-none">{b.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Theme Presets (Requirement 6) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 font-mono flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-emerald-400" /> Editable Theme Presets
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {THEMES.map((theme) => {
                    const isSelected = selectedTheme === theme.value;
                    return (
                      <button
                        key={theme.value}
                        onClick={() => setSelectedTheme(theme.value)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300 font-bold'
                            : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                        }`}
                      >
                        <span 
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20"
                          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
                        />
                        <span className="text-xs truncate">{theme.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 font-mono flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Custom Text / Message (Optional)
                </label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  maxLength={45}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-sans text-sm focus:border-purple-500/50 outline-none transition-colors"
                  placeholder="e.g. Proud ARMY Forever 💜"
                />
              </div>

              {/* Design Filters / Overlays */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 font-mono flex items-center gap-1.5">
                  <Sparkle className="w-3.5 h-3.5 text-pink-400" /> Choose Design Overlay
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {OVERLAYS.map((over) => {
                    const isSelected = activeOverlay === over.value;
                    return (
                      <button
                        key={over.value}
                        onClick={() => setActiveOverlay(over.value)}
                        className={`px-3 py-2 rounded-xl border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-pink-950/20 border-pink-500/40 text-pink-300 font-bold'
                            : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                        }`}
                      >
                        <span className="text-xs truncate">{over.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Large Generate Button */}
              <button
                onClick={handleGenerateClick}
                disabled={isGenerating}
                className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-red-650 via-purple-650 to-fuchsia-600 hover:from-red-500 hover:to-fuchsia-500 text-white text-sm font-sans font-black uppercase tracking-widest shadow-[0_10px_25px_rgba(236,72,153,0.2)] flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Processing Layers...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
                    <span>✨ Update &amp; Render Design</span>
                  </>
                )}
              </button>

              {/* Progress bar inside form */}
              {isGenerating && (
                <div className="space-y-1 bg-black/30 p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-mono text-pink-400">
                    <span>DESIGN ENGINE RENDER</span>
                    <span>{generationProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 transition-all duration-150"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Side: Render Preview / Output (Col span 7) */}
          <div className="lg:col-span-7 flex flex-col justify-start space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 md:p-6 flex flex-col h-full justify-between gap-6 relative">
              
              {/* Header toolbar */}
              <div className="flex flex-wrap justify-between items-center border-b border-white/5 pb-3 gap-2">
                <span className="text-xs font-mono font-bold text-gray-300 flex items-center gap-1.5 uppercase">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Live Preview Monitor
                </span>

                {/* Resolution & Scale toolbar */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white/5 rounded-xl border border-white/5 p-0.5 text-[9px] font-mono">
                    <button
                      onClick={() => setExportResolution('1x')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${exportResolution === '1x' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400'}`}
                    >
                      1x HD
                    </button>
                    <button
                      onClick={() => setExportResolution('2x')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${exportResolution === '2x' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400'}`}
                    >
                      2x Ultra
                    </button>
                  </div>

                  <div className="flex items-center gap-1 bg-white/5 rounded-xl border border-white/5 p-1">
                    <button
                      onClick={() => setCurrentZoom(z => Math.max(0.6, z - 0.1))}
                      className="p-1 text-gray-400 hover:text-white cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-[9px] font-mono font-bold text-gray-300 w-8 text-center">{Math.round(currentZoom * 100)}%</span>
                    <button
                      onClick={() => setCurrentZoom(z => Math.min(1.4, z + 0.1))}
                      className="p-1 text-gray-400 hover:text-white cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ARTWORK CANVAS PORTION */}
              <div className="flex-grow flex items-center justify-center p-2 relative min-h-[350px] md:min-h-[500px]">
                <div className="absolute w-72 h-72 bg-gradient-to-tr from-purple-500/10 to-pink-500/15 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative select-none max-w-full overflow-hidden flex flex-col items-center">
                  <canvas 
                    ref={outputCanvasRef} 
                    className="hidden" 
                  />

                  {canvasDataUrl ? (
                    <motion.div
                      style={{ scale: currentZoom }}
                      className="relative max-w-full rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)] border border-white/10"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: currentZoom, opacity: 1 }}
                      transition={{ type: 'spring', damping: 20 }}
                    >
                      <img 
                        src={canvasDataUrl} 
                        alt="Generated BTS Art" 
                        className="max-h-[500px] md:max-h-[640px] aspect-auto object-contain rounded-2xl select-none"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-black/10 pointer-events-none mix-blend-overlay animate-pulse" />
                    </motion.div>
                  ) : (
                    <div
                      onClick={triggerFileSelect}
                      className="text-center space-y-3 p-8 border border-dashed border-purple-500/30 bg-white/[0.01] rounded-2xl max-w-sm cursor-pointer"
                    >
                      <Upload className="w-10 h-10 text-purple-400 mx-auto animate-bounce" />
                      <h3 className="font-sans font-bold text-white text-sm">Click to upload photo</h3>
                      <button
                        onClick={(e) => { e.stopPropagation(); triggerFileSelect(); }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold cursor-pointer active:scale-95 transition-all"
                      >
                        Upload Photo
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Downloader toolbar with format selections (Requirement 5) */}
              <div className="border-t border-white/5 pt-4 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  
                  <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 self-start">
                    <button
                      onClick={() => handleDownload('png')}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-950/30 hover:bg-purple-900/40 text-purple-300 font-bold hover:text-white font-mono text-[10px] transition-all cursor-pointer flex items-center gap-1"
                      title="Download Lossless PNG"
                    >
                      <Download className="w-3.5 h-3.5" /> PNG
                    </button>
                    <button
                      onClick={() => handleDownload('jpeg')}
                      className="px-2.5 py-1.5 rounded-lg bg-pink-950/30 hover:bg-pink-900/40 text-pink-300 font-bold hover:text-white font-mono text-[10px] transition-all cursor-pointer flex items-center gap-1"
                      title="Download Compact JPG"
                    >
                      <Download className="w-3.5 h-3.5" /> JPG
                    </button>
                    <button
                      onClick={() => handleDownload('webp')}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 font-bold hover:text-white font-mono text-[10px] transition-all cursor-pointer flex items-center gap-1"
                      title="Download High-Efficiency WEBP"
                    >
                      <Download className="w-3.5 h-3.5" /> WEBP
                    </button>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={handleCopyImageUrl}
                      className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-mono font-bold text-xs rounded-xl flex items-center gap-1.5 border border-white/5 transition-all text-[11px] cursor-pointer"
                      title="Copy local preview base64 buffer"
                    >
                      <Copy className="w-4 h-4" /> Copy Image
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-2.5 bg-gradient-to-r from-purple-650 to-fuchsia-650 text-white rounded-xl flex items-center gap-1.5 hover:shadow-lg transition-all text-xs font-bold font-sans cursor-pointer active:scale-95"
                      title="Share Artwork"
                    >
                      <Share2 className="w-4 h-4" /> Share Design
                    </button>
                  </div>

                </div>

                {/* 300x250 Adsterra Banner Slot (Key: 4967cbfcaa28634ee789c79453e4abbb) - Preserved */}
                <div className="flex justify-center items-center my-3">
                  <AdsterraAd type={8} />
                </div>
              </div>

              {/* BTS Inspiring Quotes Card */}
              {canvasDataUrl && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 border border-purple-500/10 rounded-2xl p-4 bg-[#070110]/80 backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1 bg-purple-500/10 text-purple-400 rounded-lg text-xs">💜</span>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">ARMY Lyric &amp; Inspiring Quotes</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {BTS_QUOTES.slice(0, 6).map((q, idx) => (
                      <div key={idx} className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col justify-between gap-1.5">
                        <p className="text-xs text-gray-300 italic">"{q.text}"</p>
                        <div className="flex items-center justify-between pt-1 border-t border-white/[0.03]">
                          <span className="text-[10px] font-bold text-purple-400">― {q.author}</span>
                          <button 
                            onClick={() => {
                              setCustomText(q.text);
                              showFeedback(`Stamped quote by ${q.author} onto draft!`);
                            }}
                            className="px-2 py-0.5 bg-purple-950/40 hover:bg-purple-900/40 text-[9px] text-purple-300 rounded font-bold cursor-pointer"
                          >
                            Stamp draft
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* Preset Inspirations bottom section (Requirement 6) */}
      <div className="rounded-3xl border border-white/5 bg-[#070110]/95 p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-sans font-black text-white flex items-center gap-2">
            💜 High-Resolution Fan Presets
          </h2>
          <p className="text-gray-400 text-xs mt-0.5 font-sans">
            Quickly trigger beautiful pre-conceptualized models with the press of a button.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => {
              setName("BTS");
              setSelectedBias("Jung Kook");
              setDesignType("Concert Ticket");
              setSelectedTheme("ARIRANG Tour");
              setCustomText("Seating Block A • Golden VIP");
              setActiveOverlay("Stardust Sparkles");
              showFeedback("Loaded 'ARIRANG Bulletproof VIP Ticket' preset!");
            }}
            className="p-4 rounded-2xl border border-white/10 bg-white/[0.01] hover:border-purple-500/30 hover:bg-purple-950/5 transition-all cursor-pointer group space-y-2 text-left"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">🎟️ Concert VIP Ticket</span>
              <span className="text-[9px] font-mono text-slate-500 bg-white/5 p-1 rounded">16:9</span>
            </div>
            <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
              Arirang world tour theme ticket styled with custom stadium seats, golden barcodes, and luxury vibes.
            </p>
          </div>

          <div 
            onClick={() => {
              setName("ARMY FOREVER");
              setSelectedBias("V");
              setDesignType("Mobile Wallpaper");
              setSelectedTheme("Purple Galaxy");
              setCustomText("Inner Child Cosmic Light 🌌");
              showFeedback("Loaded 'V Purple Galaxy Phone Wallpaper' preset!");
            }}
            className="p-4 rounded-2xl border border-white/10 bg-white/[0.01] hover:border-pink-500/30 hover:bg-pink-950/5 transition-all cursor-pointer group space-y-2 text-left"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white group-hover:text-pink-400 transition-colors">📱 Mobile Wallpaper</span>
              <span className="text-[9px] font-mono text-slate-500 bg-white/5 p-1 rounded">9:16</span>
            </div>
            <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
              Portrait layout decorated by stardust clouds, purple galaxy nebula particles, and clean lettering.
            </p>
          </div>

          <div 
            onClick={() => {
              setName("Siam Shaif");
              setSelectedBias("SUGA");
              setDesignType("Magazine Cover");
              setSelectedTheme("Golden Luxury");
              setCustomText("Special Agust D Edition");
              showFeedback("Loaded 'Suga Golden Luxury Magazine Cover' preset!");
            }}
            className="p-4 rounded-2xl border border-white/10 bg-white/[0.01] hover:border-amber-500/30 hover:bg-amber-950/5 transition-all cursor-pointer group space-y-2 text-left"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">📰 Golden Magazine Cover</span>
              <span className="text-[9px] font-mono text-slate-500 bg-white/5 p-1 rounded">3:4</span>
            </div>
            <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
              Stately design highlighted by fine royal-gold corners, metallic layouts, and refined typography.
            </p>
          </div>
        </div>
      </div>

      {/* 300x250 Adsterra Banner Slot (Key: 4967cbfcaa28634ee789c79453e4abbb) - Preserved */}
      <AdsterraAd type={8} />
    </div>
  );
}
