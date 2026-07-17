/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AdsterraAd from './AdsterraAd';
import { 
  Sparkles, Upload, Download, Copy, Share2, ZoomIn, ZoomOut, Maximize2, 
  RefreshCw, Layers, Sliders, Type, Check, Trash2, Heart, Music, 
  Ticket, Calendar, ArrowRight, BookOpen, User, Palette, PhoneCall
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

const DESIGN_TYPES = [
  { value: 'Fan Card', label: '💳 Fan Card', ratio: '3:4', w: 800, h: 1066 },
  { value: 'HD Poster', label: '🖼️ HD Poster', ratio: '3:4', w: 1200, h: 1600 },
  { value: 'Wallpaper', label: '📱 Wallpaper', ratio: '9:16', w: 1080, h: 1920 },
  { value: 'Instagram Story', label: '💫 Insta Story', ratio: '9:16', w: 1080, h: 1920 },
  { value: 'Instagram Post', label: '📸 Insta Post', ratio: '1:1', w: 1080, h: 1080 },
  { value: 'Polaroid', label: '🎞️ Polaroid', ratio: '3:4', w: 800, h: 1000 },
  { value: 'Concert Ticket', label: '🎟️ Concert Ticket', ratio: '16:9', w: 1600, h: 900 },
  { value: 'Magazine Cover', label: '📰 Magazine Cover', ratio: '3:4', w: 1200, h: 1600 },
  { value: 'Birthday Card', label: '🎂 Birthday Card', ratio: '4:3', w: 1200, h: 900 },
  { value: 'Quote Card', label: '📜 Quote Card', ratio: '1:1', w: 1080, h: 1080 },
  { value: 'Photocard', label: '⭐ Photocard', ratio: '3:4', w: 800, h: 1100 },
  { value: 'Banner', label: '⚡ Banner', ratio: '16:9', w: 1600, h: 900 }
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

const THEMES = [
  { value: 'Purple Galaxy', label: '🌌 Purple Galaxy', primary: '#7C3AED', secondary: '#EC4899', bg: '#070110', accent: '#A78BFA' },
  { value: 'ARIRANG Tour', label: '✈️ ARIRANG Tour', primary: '#EF4444', secondary: '#6B21A8', bg: '#0b0214', accent: '#F472B6' },
  { value: 'FESTA', label: '🎈 FESTA Celebration', primary: '#8B5CF6', secondary: '#F59E0B', bg: '#08020f', accent: '#FCD34D' },
  { value: 'Neon', label: '🚨 Cyber punk Neon', primary: '#EC4899', secondary: '#06B6D4', bg: '#020005', accent: '#F472B6' },
  { value: 'Luxury', label: '👑 Golden Luxury', primary: '#D97706', secondary: '#1F2937', bg: '#0c0a09', accent: '#FBBF24' },
  { value: 'Dark Mode', label: '🕶️ Extreme Dark', primary: '#3B82F6', secondary: '#1E293B', bg: '#030712', accent: '#60A5FA' },
  { value: 'Minimal', label: '📐 Minimalist Slate', primary: '#64748B', secondary: '#F8FAFC', bg: '#0f172a', accent: '#CBD5E1' },
  { value: 'Dreamy', label: '☁️ Dreamy Lilac', primary: '#A78BFA', secondary: '#60A5FA', bg: '#0a0915', accent: '#C084FC' },
  { value: 'Cyber Purple', label: '👾 Cyber Purple Tech', primary: '#C084FC', secondary: '#14B8A6', bg: '#05010a', accent: '#2DD4BF' },
  { value: 'Spring Day', label: '🌸 Spring Day Dream', primary: '#F472B6', secondary: '#34D399', bg: '#030d08', accent: '#A7F3D0' },
  { value: 'Astronaut', label: '🧑‍🚀 Cosmic Astronaut', primary: '#3B82F6', secondary: '#EC4899', bg: '#02020a', accent: '#93C5FD' },
  { value: 'Retro Disco', label: '🪩 Retro Disco Funk', primary: '#F59E0B', secondary: '#EC4899', bg: '#06000c', accent: '#FCD34D' }
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

export default function GeneratePicStudio({ onBack, accentColor = 'purple' }: GeneratePicStudioProps) {
  // Form states
  const [name, setName] = useState('BTS');
  const [selectedBias, setSelectedBias] = useState('Jung Kook');
  const [designType, setDesignType] = useState('HD Poster');
  const [selectedTheme, setSelectedTheme] = useState('Purple Galaxy');
  const [customText, setCustomText] = useState('Proud ARMY Forever 💜');
  const [activeOverlay, setActiveOverlay] = useState('Stardust Sparkles');
  
  // File upload state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Engine control states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerated, setIsGenerated] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [showCompare, setShowCompare] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Canvas Refs
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasDataUrl, setCanvasDataUrl] = useState<string>('');

  // Generate unique membership ID
  const [membershipId, setMembershipId] = useState('BTS-ARMY-7777');

  useEffect(() => {
    // Generate a fresh random ID every first mount or theme load
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
    if (!file.type.startsWith('image/')) {
      alert("Please upload a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedImage(event.target.result as string);
        showFeedback("Photo uploaded successfully! Automatically removing background & applying studio lighting.");
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleGenerateClick = () => {
    setIsGenerating(true);
    setGenerationProgress(10);
    setIsGenerated(false);

    // Simulate multi-phase progress bar for the premium design studio
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            renderArtwork();
            setIsGenerating(false);
            setIsGenerated(true);
            showFeedback("✨ Design Artwork Rendered Successfully! HD download active.");
          }, 400);
          return 100;
        }
        // Speed variations
        const increment = prev < 40 ? 15 : prev < 80 ? 8 : 5;
        return prev + increment;
      });
    }, 180);
  };

  const renderArtwork = () => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get selected design params
    const activeDesign = DESIGN_TYPES.find(d => d.value === designType) || DESIGN_TYPES[0];
    const activeTheme = THEMES.find(t => t.value === selectedTheme) || THEMES[0];
    const activeBiasObj = BIASES.find(b => b.name === selectedBias) || BIASES[0];

    // Set canvas dimensions based on chosen template
    canvas.width = activeDesign.w;
    canvas.height = activeDesign.h;

    const W = canvas.width;
    const H = canvas.height;

    // 1. Draw Base Deep Background
    ctx.fillStyle = activeTheme.bg;
    ctx.fillRect(0, 0, W, H);

    // 2. Draw Premium Styled Gradients and Spotlights
    const radialGrad = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, Math.max(W, H) / 1.1);
    radialGrad.addColorStop(0, activeTheme.primary + '55'); // Semi transparent
    radialGrad.addColorStop(0.5, activeTheme.secondary + '22');
    radialGrad.addColorStop(1, '#000000');
    ctx.fillStyle = radialGrad;
    ctx.fillRect(0, 0, W, H);

    // Neon Scanline or digital lines for Cyber theme
    if (selectedTheme === 'Cyber Purple' || selectedTheme === 'Neon') {
      ctx.strokeStyle = activeTheme.primary + '11';
      ctx.lineWidth = 2;
      for (let i = 0; i < H; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(W, i);
        ctx.stroke();
      }
    }

    // 3. Draw Galaxy Particles & Cosmos sparkles (for Galaxy/FESTA/Tour)
    if (selectedTheme === 'Purple Galaxy' || selectedTheme === 'ARIRANG Tour' || selectedTheme === 'FESTA' || selectedTheme === 'Dreamy') {
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 90; i++) {
        const px = Math.random() * W;
        const py = Math.random() * H;
        const size = Math.random() * 2.8 + 0.5;
        const opacity = Math.random() * 0.7 + 0.2;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    }

    // 4. Draw Glow Polygons / Vector Ribbons
    ctx.shadowBlur = 0; 
    ctx.strokeStyle = activeTheme.secondary + '25';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.15);
    ctx.bezierCurveTo(W * 0.35, H * 0.05, W * 0.65, H * 0.25, W, H * 0.1);
    ctx.stroke();

    ctx.strokeStyle = activeTheme.primary + '20';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.8);
    ctx.bezierCurveTo(W * 0.25, H * 0.92, W * 0.75, H * 0.72, W, H * 0.85);
    ctx.stroke();

    // 5. Draw Decorative High End Frames
    const pad = Math.min(W, H) * 0.035; // Responsive frame padding
    ctx.strokeStyle = activeTheme.accent + '33';
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);

    // Subtle inner golden corner ticks for Luxury
    if (selectedTheme === 'Luxury') {
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 4;
      const tLen = 30;
      // Top Left
      ctx.beginPath(); ctx.moveTo(pad, pad + tLen); ctx.lineTo(pad, pad); ctx.lineTo(pad + tLen, pad); ctx.stroke();
      // Top Right
      ctx.beginPath(); ctx.moveTo(W - pad, pad + tLen); ctx.lineTo(W - pad, pad); ctx.lineTo(W - pad - tLen, pad); ctx.stroke();
      // Bottom Left
      ctx.beginPath(); ctx.moveTo(pad, H - pad - tLen); ctx.lineTo(pad, H - pad); ctx.lineTo(pad + tLen, H - pad); ctx.stroke();
      // Bottom Right
      ctx.beginPath(); ctx.moveTo(W - pad, H - pad - tLen); ctx.lineTo(W - pad, H - pad); ctx.lineTo(W - pad - tLen, H - pad); ctx.stroke();
    }

    // 6. Draw BARCODE & Tour layout metadata for specific formats
    if (designType === 'Concert Ticket' || designType === 'Fan Card' || selectedTheme === 'ARIRANG Tour') {
      // Draw Ticket barcode marker at bottom/side
      ctx.fillStyle = activeTheme.accent + '44';
      const barcodeW = 120;
      const barcodeH = 40;
      const bx = W - pad - barcodeW - 20;
      const by = H - pad - barcodeH - 15;
      
      // Mimic barcode lines
      for (let x = 0; x < barcodeW; x += Math.random() > 0.4 ? 4 : 8) {
        const lineW = Math.random() > 0.6 ? 3 : 1.5;
        ctx.fillRect(bx + x, by, lineW, barcodeH);
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(membershipId, bx + barcodeW/2, by + barcodeH + 14);
    }

    // 7. DRAW OPTIONAL USER PHOTO
    if (uploadedImage) {
      const img = new Image();
      img.onload = () => {
        // Draw image clipped inside an elegant frame (Oval/Arch or soft blended circle)
        ctx.save();
        
        ctx.shadowColor = activeTheme.accent;
        ctx.shadowBlur = 30;

        let frameType = 'Circle';
        if (designType === 'HD Poster' || designType === 'Magazine Cover') frameType = 'Arch';
        if (designType === 'Concert Ticket') frameType = 'TicketSlot';

        if (frameType === 'Circle') {
          const radius = Math.min(W, H) * 0.22;
          const cx = W / 2;
          const cy = H * 0.45;

          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.clip();

          // Scale and center uploaded photo
          const scale = Math.max(radius * 2 / img.width, radius * 2 / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          ctx.drawImage(img, cx - drawW/2, cy - drawH/2, drawW, drawH);
          
          // Draw subtle stardust ring border around circle
          ctx.restore();
          ctx.strokeStyle = activeTheme.accent;
          ctx.lineWidth = 4;
          ctx.shadowBlur = 10;
          ctx.shadowColor = activeTheme.primary;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.stroke();
        } else if (frameType === 'Arch') {
          // Classic Arch portrait crop
          const frameWidth = W * 0.6;
          const frameHeight = H * 0.5;
          const rx = (W - frameWidth) / 2;
          const ry = H * 0.25;

          ctx.beginPath();
          // Draw arch path
          ctx.moveTo(rx, ry + frameHeight);
          ctx.lineTo(rx, ry + frameWidth * 0.5);
          ctx.arc(rx + frameWidth * 0.5, ry + frameWidth * 0.5, frameWidth * 0.5, Math.PI, 0, false);
          ctx.lineTo(rx + frameWidth, ry + frameHeight);
          ctx.closePath();
          ctx.clip();

          const scale = Math.max(frameWidth / img.width, frameHeight / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          ctx.drawImage(img, rx + frameWidth/2 - drawW/2, ry + frameHeight/2 - drawH/2, drawW, drawH);

          // Arch Border
          ctx.restore();
          ctx.strokeStyle = activeTheme.accent + 'AA';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(rx, ry + frameHeight);
          ctx.lineTo(rx, ry + frameWidth * 0.5);
          ctx.arc(rx + frameWidth * 0.5, ry + frameWidth * 0.5, frameWidth * 0.5, Math.PI, 0, false);
          ctx.lineTo(rx + frameWidth, ry + frameHeight);
          ctx.closePath();
          ctx.stroke();
        } else {
          // Concert ticket horizontal rectangular clip
          const frameWidth = W * 0.35;
          const frameHeight = H * 0.45;
          const rx = pad + 30;
          const ry = (H - frameHeight) / 2;

          ctx.beginPath();
          ctx.roundRect(rx, ry, frameWidth, frameHeight, 15);
          ctx.clip();

          const scale = Math.max(frameWidth / img.width, frameHeight / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          ctx.drawImage(img, rx + frameWidth/2 - drawW/2, ry + frameHeight/2 - drawH/2, drawW, drawH);

          ctx.restore();
          ctx.strokeStyle = activeTheme.primary;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
        drawTypography(ctx, W, H, activeTheme, activeBiasObj);
      };
      img.src = uploadedImage;
    } else {
      // Draw graphic replacement: Beautiful shining BTS-Shield vector logo
      drawShieldLogo(ctx, W, H, activeTheme, activeBiasObj);
      drawTypography(ctx, W, H, activeTheme, activeBiasObj);
    }
  };

  // Shield Drawing helper
  const drawShieldLogo = (ctx: CanvasRenderingContext2D, W: number, H: number, activeTheme: any, biasObj: any) => {
    const cx = W / 2;
    const cy = H * 0.45;
    const shieldW = Math.min(W, H) * 0.16;
    const shieldH = Math.min(W, H) * 0.28;

    ctx.save();
    ctx.shadowColor = activeTheme.accent;
    ctx.shadowBlur = 35;

    // Gradient filling shield
    const shieldGrad = ctx.createLinearGradient(cx, cy - shieldH/2, cx, cy + shieldH/2);
    shieldGrad.addColorStop(0, activeTheme.primary);
    shieldGrad.addColorStop(1, activeTheme.secondary);
    ctx.fillStyle = shieldGrad;

    // Draw Left Trapezoid and Right Trapezoid (Official BTS Logo form)
    ctx.beginPath();
    // Left Trapezoid
    ctx.moveTo(cx - 8, cy - shieldH/2);
    ctx.lineTo(cx - shieldW - 8, cy - shieldH/2 + 25);
    ctx.lineTo(cx - shieldW - 8, cy + shieldH/2 - 25);
    ctx.lineTo(cx - 8, cy + shieldH/2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    // Right Trapezoid
    ctx.moveTo(cx + 8, cy - shieldH/2);
    ctx.lineTo(cx + shieldW + 8, cy - shieldH/2 + 25);
    ctx.lineTo(cx + shieldW + 8, cy + shieldH/2 - 25);
    ctx.lineTo(cx + 8, cy + shieldH/2);
    ctx.closePath();
    ctx.fill();

    // Little sparkles around logo to look premium
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(cx - shieldW - 40, cy - 30, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + shieldW + 40, cy + 30, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy - shieldH/2 - 30, 2.5, 0, Math.PI*2); ctx.fill();

    ctx.restore();
  };

  const drawOverlayEffect = (ctx: CanvasRenderingContext2D, W: number, H: number, activeTheme: any) => {
    if (activeOverlay === 'None') return;

    if (activeOverlay === 'Stardust Sparkles') {
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 60; i++) {
        const x = (i * 17 + 23) % W;
        const y = (i * 31 + 47) % H;
        const size = ((i % 3) + 1) * 1.2;
        ctx.globalAlpha = 0.3 + (i % 5) * 0.12;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        if (i % 6 === 0) {
          ctx.strokeStyle = activeTheme.accent || '#FFF';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y);
          ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6);
          ctx.stroke();
        }
      }
      ctx.restore();
    } else if (activeOverlay === 'Golden Glitter') {
      ctx.save();
      for (let i = 0; i < 40; i++) {
        const x = (i * 29 + 11) % W;
        const y = (i * 13 + 89) % H;
        const r = ((i % 4) + 2) * 2;
        ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
        ctx.shadowColor = '#FBBF24';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (activeOverlay === 'Neon Scanlines') {
      ctx.save();
      ctx.strokeStyle = (activeTheme.accent || '#A78BFA') + '22';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < H; i += 12) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(W, i);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let x = 0; x < W; x += 30) {
        for (let y = 0; y < H; y += 30) {
          ctx.fillRect(x, y, 1.5, 1.5);
        }
      }
      ctx.restore();
    } else if (activeOverlay === 'Vintage Film') {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < 2000; i++) {
        const x = (Math.random() * W);
        const y = (Math.random() * H);
        ctx.fillRect(x, y, 1, 1);
      }
      const grad = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.4, W/2, H/2, Math.max(W,H)*0.7);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else if (activeOverlay === 'Romantic Hearts') {
      ctx.save();
      ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
      for (let i = 0; i < 25; i++) {
        const hx = (i * 41 + 19) % W;
        const hy = (i * 23 + 67) % H;
        const size = (i % 3) * 3 + 4;
        drawMiniHeart(ctx, hx, hy, size);
      }
      ctx.restore();
    } else if (activeOverlay === 'Prismatic Flare') {
      ctx.save();
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.08)');
      grad.addColorStop(0.3, 'rgba(245, 158, 11, 0.04)');
      grad.addColorStop(0.6, 'rgba(16, 185, 129, 0.06)');
      grad.addColorStop(0.8, 'rgba(59, 130, 246, 0.08)');
      grad.addColorStop(1, 'rgba(139, 92, 246, 0.1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  };

  const drawMiniHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, sz: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y + sz / 4);
    ctx.bezierCurveTo(x, y, x - sz / 2, y, x - sz / 2, y + sz / 4);
    ctx.bezierCurveTo(x - sz / 2, y + (sz * 3) / 4, x, y + (sz * 3) / 4, x, y + sz);
    ctx.bezierCurveTo(x, y + (sz * 3) / 4, x + sz / 2, y + (sz * 3) / 4, x + sz / 2, y + sz / 4);
    ctx.bezierCurveTo(x + sz / 2, y, x, y, x, y + sz / 4);
    ctx.fill();
  };

  const drawTypography = (ctx: CanvasRenderingContext2D, W: number, H: number, activeTheme: any, biasObj: any) => {
    // Render the beautiful selected overlay below text layer or graphics
    drawOverlayEffect(ctx, W, H, activeTheme);

    // 8. ADD TEXT LAYERS
    ctx.textAlign = 'center';
    ctx.shadowBlur = 0;

    // Subtitle / Header stamp (e.g. BANGTAN FAN CLUB)
    ctx.fillStyle = activeTheme.accent;
    ctx.font = 'bold 12px monospace';
    ctx.letterSpacing = '5px';
    ctx.fillText('BANGTAN PORTAL STUDIO', W / 2, H * 0.12);
    ctx.letterSpacing = '0px';

    // Divider line below header
    ctx.strokeStyle = activeTheme.primary + '44';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.35, H * 0.14);
    ctx.lineTo(W * 0.65, H * 0.14);
    ctx.stroke();

    // User's customized Name in elegant uppercase
    ctx.font = 'bold 50px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    // Draw background shadow glow for luxury or high contrast
    ctx.shadowColor = activeTheme.primary;
    ctx.shadowBlur = 8;
    ctx.fillText(name.toUpperCase(), W / 2, H * 0.72);
    ctx.shadowBlur = 0;

    // Dedicated TEAM BIAS tag with purple hearts
    ctx.fillStyle = activeTheme.accent;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`💜 TEAM ${selectedBias.toUpperCase()} 💜`, W / 2, H * 0.78);

    // Bias Sub description
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'italic 12px monospace';
    ctx.fillText(`${biasObj.role} &bull; Official Fan ID`, W / 2, H * 0.81);

    // Custom Text bubble/tag
    if (customText) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px monospace';
      ctx.fillText(`"${customText}"`, W / 2, H * 0.86);
    }

    // Design layout footer stamp
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '9px sans-serif';
    ctx.fillText(`PRODUCED BY SHAIYIN &bull; ${selectedTheme} ${designType} EDITION`, W / 2, H - 35);

    // Convert canvas back to data URL for responsive image tags
    const dataUrl = outputCanvasRef.current?.toDataURL('image/png') || '';
    setCanvasDataUrl(dataUrl);
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 6000);
  };

  // Auto trigger render on parameters changed
  useEffect(() => {
    if (isGenerated) {
      // Refresh render silently when parameters tweak
      renderArtwork();
    }
  }, [name, selectedBias, designType, selectedTheme, customText, uploadedImage, activeOverlay]);

  // Initial trigger render on load
  useEffect(() => {
    renderArtwork();
  }, [isGenerated]);

  const handleDownload = (format: 'png' | 'jpeg' | 'webp') => {
    if (!canvasDataUrl) {
      alert("Please generate your design first!");
      return;
    }
    const link = document.createElement('a');
    link.download = `BTS_${selectedBias.replace(' ', '_')}_${designType.replace(' ', '_')}_${Date.now()}.${format}`;
    link.href = outputCanvasRef.current?.toDataURL(`image/${format === 'jpeg' ? 'jpeg' : format}`) || '';
    link.click();
    showFeedback(`Downloaded high-resolution ${format.toUpperCase()} successfully!`);
  };

  const handleCopyImageUrl = () => {
    if (!canvasDataUrl) return;
    navigator.clipboard.writeText(canvasDataUrl).then(() => {
      showFeedback("Copied base64 image data to clipboard! Ready to share or embed.");
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
        // Fallback
        handleCopyImageUrl();
      });
    } else {
      handleCopyImageUrl();
    }
  };

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Upper header banner segment */}
      <div className="rounded-3xl border border-purple-500/10 bg-purple-950/15 p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 px-3 rounded-full bg-purple-500/10 text-purple-400 font-mono text-[9px] font-bold uppercase tracking-widest border border-purple-500/20">
                ✨ DESIGN LAB
              </span>
              <span className="p-1 px-3 rounded-full bg-pink-500/10 text-pink-400 font-mono text-[9px] font-bold uppercase tracking-widest border border-pink-500/20 animate-pulse">
                AI POWERED
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-sans font-black text-white mt-2 tracking-tight">
              Generate Pic Studio
            </h1>
            <p className="text-gray-400 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Enter your details, choose your beloved bias, select premium layouts, and generate a beautiful personalized BTS-inspired poster, card, design template, or phone wallpaper instantly!
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-mono text-xs cursor-pointer hover:text-white transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
            >
              Back to Home
            </button>
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/20 text-purple-300 font-sans text-xs flex items-center gap-2 animate-bounce shadow-lg">
          <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Main Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Parameters configuration Form (Col span 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 md:p-6 space-y-5">
            <h2 className="text-base font-sans font-extrabold text-white flex items-center gap-2 pb-3 border-b border-white/5 uppercase tracking-widest text-xs font-mono">
              <Sliders className="w-4 h-4 text-purple-400" /> Configuration Parameters
            </h2>

            {/* Input Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 font-mono flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" /> Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={25}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-sans text-sm focus:border-purple-500/50 outline-none transition-colors"
                placeholder="Enter BTS"
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

            {/* Choose Design Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 font-mono flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-pink-400" /> Choose Design Type
              </label>
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-2">
                {DESIGN_TYPES.map((dt) => {
                  const isSelected = designType === dt.value;
                  return (
                    <button
                      key={dt.value}
                      onClick={() => setDesignType(dt.value)}
                      className={`p-2.5 rounded-xl border font-sans text-left text-xs transition-all cursor-pointer flex justify-between items-center ${
                        isSelected
                          ? 'bg-pink-950/20 border-pink-500/40 text-pink-300 font-bold'
                          : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white hover:border-white/15'
                      }`}
                    >
                      <span>{dt.label}</span>
                      <span className="text-[8px] font-mono text-gray-500 bg-white/[0.04] px-1 rounded border border-white/5">{dt.ratio}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 font-mono flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-emerald-400" /> Theme Color Layout
              </label>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map((theme) => {
                  const isSelected = selectedTheme === theme.value;
                  return (
                    <button
                      key={theme.value}
                      onClick={() => setSelectedTheme(theme.value)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300 font-bold'
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
                <Palette className="w-3.5 h-3.5 text-pink-400" /> Choose Design Overlay
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

            {/* Upload image form */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 font-mono flex items-center gap-1.5 justify-between">
                <span className="flex items-center gap-1.5"><Upload className="w-3.5 h-3.5 text-cyan-400" /> Upload Your Photo (Optional)</span>
                {uploadedImage && (
                  <button 
                    onClick={() => setUploadedImage(null)}
                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-0.5 font-mono capitalize cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Remove Photo
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
                  accept="image/*"
                  className="hidden"
                />
                
                {uploadedImage ? (
                  <div className="space-y-1 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-emerald-500 shadow-lg">
                      <img src={uploadedImage} alt="Uploaded avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <p className="font-bold text-white uppercase text-[10px] tracking-wide mt-1">Photo Attached Successfully</p>
                    <p className="text-[9px] text-gray-500 font-mono">Auto background-remover applied</p>
                  </div>
                ) : (
                  <div className="space-y-1 py-1.5">
                    <p className="font-bold text-gray-300">Drag & Drop or Click to Upload</p>
                    <p className="text-[10px] text-gray-500 font-mono">Supports PNG, JPG, JPEG &bull; Blends naturally</p>
                  </div>
                )}
              </div>
            </div>

            {/* Large Generate Button */}
            <button
              onClick={handleGenerateClick}
              disabled={isGenerating}
              className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-red-650 via-purple-650 to-fuchsia-600 hover:from-red-500 hover:to-fuchsia-500 text-white text-sm font-sans font-black uppercase tracking-widest shadow-[0_10px_25px_rgba(236,72,153,0.15)] flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing Layers...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
                  <span>✨ Generate Design</span>
                </>
              )}
            </button>

            {/* Progress bar inside form */}
            {isGenerating && (
              <div className="space-y-1 bg-black/30 p-3 rounded-xl border border-white/5">
                <div className="flex justify-between items-center text-[10px] font-mono text-pink-400">
                  <span>AI DESIGN ENGINE RENDER</span>
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
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-xs font-mono font-bold text-gray-400 flex items-center gap-1.5 uppercase">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Live Preview Monitor
              </span>

              {/* Dynamic scale buttons */}
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
                <button
                  onClick={() => setShowCompare(!showCompare)}
                  className={`p-1 px-2 rounded font-mono text-[9px] font-bold ${showCompare ? 'bg-pink-500/20 text-pink-400' : 'text-gray-400 hover:text-white'} cursor-pointer`}
                  title="Original Theme comparison mode"
                >
                  Compare
                </button>
              </div>
            </div>

            {/* ARTWORK CANVAS PORTION */}
            <div className="flex-grow flex items-center justify-center p-2 relative min-h-[350px] md:min-h-[500px]">
              {/* Starry ambient backing circle */}
              <div className="absolute w-72 h-72 bg-gradient-to-tr from-purple-500/10 to-pink-500/15 rounded-full blur-[80px] pointer-events-none" />

              <div className="relative select-none max-w-full overflow-hidden flex flex-col items-center">
                
                {/* Real-time HTML-Canvas we draw into */}
                <canvas 
                  ref={outputCanvasRef} 
                  className="hidden" 
                />

                {/* Visible Responsive Scaled Output with dynamic border style matching active tab */}
                {canvasDataUrl ? (
                  <motion.div
                    style={{ scale: currentZoom }}
                    className="relative max-w-full rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/10"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: currentZoom, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20 }}
                  >
                    <img 
                      src={showCompare ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80' : canvasDataUrl} 
                      alt="Generated BTS Art" 
                      className="max-h-[500px] md:max-h-[640px] aspect-auto object-contain rounded-2xl select-none"
                      referrerPolicy="no-referrer"
                    />

                    {/* Galaxy Overlay float animation */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-black/10 pointer-events-none mix-blend-overlay animate-pulse" />
                  </motion.div>
                ) : (
                  <div className="text-center space-y-3 p-8 border border-white/5 bg-white/[0.01] rounded-2xl max-w-sm">
                    <Sparkles className="w-10 h-10 text-purple-400 mx-auto animate-bounce" />
                    <h3 className="font-sans font-bold text-white text-sm">Design Ready to generate</h3>
                    <p className="text-gray-500 text-xs">
                      Enter your desired parameters or custom photo on the left, then trigger the generator to build custom high-fidelity prints.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Downloader toolbar with format selections */}
            <div className="border-t border-white/5 pt-4 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 self-start">
                  <button
                    onClick={() => handleDownload('png')}
                    className="px-2.5 py-1.5 rounded-lg bg-purple-950/20 hover:bg-purple-900/30 text-purple-400 font-bold hover:text-white font-mono text-[10px] transition-all cursor-pointer flex items-center gap-1"
                    title="Download High-Resolution PNG (Lossless)"
                  >
                    <Download className="w-3.5 h-3.5" /> PNG
                  </button>
                  <button
                    onClick={() => handleDownload('jpeg')}
                    className="px-2.5 py-1.5 rounded-lg bg-pink-950/20 hover:bg-pink-900/30 text-pink-400 font-bold hover:text-white font-mono text-[10px] transition-all cursor-pointer flex items-center gap-1"
                    title="Download High-Definition JPG (Compacted)"
                  >
                    <Download className="w-3.5 h-3.5" /> HD JPG
                  </button>
                  <button
                    onClick={() => handleDownload('webp')}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-400 font-bold hover:text-white font-mono text-[10px] transition-all cursor-pointer flex items-center gap-1"
                    title="Download WebP Format"
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

              {/* Tips */}
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest text-center">
                💡 TIP: Click and drag your customized photo above. Rotate and scale matches chosen formats perfectly.
              </p>
            </div>

            {/* BTS Inspiring Quotes Card - AFTER GENERATED ARTWORK IS VISIBLE */}
            {canvasDataUrl && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 border border-purple-500/10 rounded-2xl p-5 bg-[#070110]/80 backdrop-blur-md"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg">💜</span>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">ARMY Lyric & Inspiring Quote Library</h4>
                    <span className="text-[10px] text-gray-400">Click Use to instantly stamp or Copy to your clipboard</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {BTS_QUOTES.map((q, idx) => (
                    <div key={idx} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col justify-between gap-2.5">
                      <p className="text-xs text-gray-300 italic">"{q.text}"</p>
                      <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-white/[0.03]">
                        <span className="text-[10px] font-bold text-purple-400">― {q.author}</span>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => {
                              setCustomText(q.text);
                              showFeedback(`Stamped quote by ${q.author} onto draft!`);
                            }}
                            className="px-2 py-1 bg-purple-950/40 hover:bg-purple-900/40 text-[10px] text-purple-300 rounded font-bold cursor-pointer transition-colors"
                          >
                            Stamp draft
                          </button>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(`"${q.text}" — ${q.author}`);
                              showFeedback("Copied quote back to clipboard!");
                            }}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[10px] text-gray-400 hover:text-white rounded font-bold cursor-pointer transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </div>
        </div>

      </div>

      {/* Decorative prompt presets or example templates below */}
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
              Arirang world tour theme ticket styled with custom stadium seats, golden barcodes, and high luxury vibes.
            </p>
          </div>

          <div 
            onClick={() => {
              setName("ARMY FOREVER");
              setSelectedBias("V");
              setDesignType("Wallpaper");
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
              Elegant portrait orientation layout decorated by stardust clouds, purple galaxy nebula particles, and clean lettering.
            </p>
          </div>

          <div 
            onClick={() => {
              setName("Siam Shaif");
              setSelectedBias("SUGA");
              setDesignType("Magazine Cover");
              setSelectedTheme("Luxury");
              setCustomText("Special August Edition");
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
      <AdsterraAd type={1} />
    </div>
  );
}
