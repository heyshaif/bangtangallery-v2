/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useThemeCustom, THEME_PRESETS, PremiumThemeId, FontStyleId } from '../context/ThemeContext';
import { 
  X, Palette, RefreshCw, Type, Eye, Check, Sliders, Sun, Moon, Sparkles, AlertCircle, Heart
} from 'lucide-react';
import { motion } from 'motion/react';

interface ThemePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const FONTS_LIST: { id: FontStyleId; name: string; category: string }[] = [
  { id: 'Poppins', name: 'Poppins', category: 'Geometric Sans' },
  { id: 'Inter', name: 'Inter', category: 'Swiss Neogrotesque' },
  { id: 'Space Grotesk', name: 'Space Grotesk', category: 'Futuristic' },
  { id: 'Roboto', name: 'Roboto', category: 'Modern Standard' },
  { id: 'Montserrat', name: 'Montserrat', category: 'High-contrast Display' },
  { id: 'Nunito', name: 'Nunito', category: 'Soft Rounded' },
  { id: 'Oswald', name: 'Oswald', category: 'Bold Condensed' },
  { id: 'Bebas Neue', name: 'Bebas Neue', category: 'Condensed Impact' },
  { id: 'Playfair Display', name: 'Playfair Display', category: 'Elegant Editorial' },
  { id: 'Orbitron', name: 'Orbitron', category: 'Cyber / Technical' },
];

export default function ThemeCustomizerPanel({ isOpen, onClose }: ThemePanelProps) {
  const { config, updateConfig, resetTheme } = useThemeCustom();
  const [copied, setCopied] = useState(false);

  const hexColorsPreset = [
    '#a855f7', // Purple
    '#dc2626', // Crimson Red
    '#06b6d4', // Cyan
    '#10b981', // Emerald Mint
    '#3b82f6', // Vivid Blue
    '#f59e0b', // Amber Orange
    '#ec4899', // Hot Pink
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end font-sans">
      
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />

      {/* Floating control card drawer */}
      <motion.div 
        initial={{ x: '100%', filter: 'blur(10px)' }}
        animate={{ x: 0, filter: 'blur(0px)' }}
        exit={{ x: '100%', filter: 'blur(10px)' }}
        transition={{ duration: 0.45, ease: [0.19, 1, 0.22, 1] }}
        className="relative w-full max-w-md bg-slate-900/98 text-slate-100 h-full shadow-2xl flex flex-col z-10 border-l border-white/10"
      >
        
        {/* Header toolbar */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/45">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400 animate-pulse" />
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-white uppercase flex items-center gap-1.5">
                Theme Studio <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Instant Visual Engine &bull; UI/UX</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetTheme}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-[10px] font-mono flex items-center gap-1 cursor-pointer"
              title="Reset configuration state"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrolling controls body */}
        <div className="flex-grow overflow-y-auto p-4 md:p-5 space-y-6 scrollbar-thin">
          
          {/* Section 1: Choose Active Premium Themes */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
              1. Premium Theme Canvas ({Object.keys(THEME_PRESETS).length})
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(THEME_PRESETS) as PremiumThemeId[]).map((themeId) => {
                const preset = THEME_PRESETS[themeId];
                const isActive = config.activeTheme === themeId;
                
                // Visual swatch helpers
                let swatchBgClass = 'bg-purple-950/40 border-purple-500/20';
                if (themeId === 'dark-black-red') swatchBgClass = 'bg-rose-950/20 border-rose-500/10';
                if (themeId === 'ocean-blue') swatchBgClass = 'bg-cyan-950/20 border-cyan-500/10';
                if (themeId === 'emerald-green') swatchBgClass = 'bg-emerald-950/20 border-emerald-500/10';

                return (
                  <button
                    key={themeId}
                    onClick={() => updateConfig({ activeTheme: themeId })}
                    className={`p-3 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between h-[84px] cursor-pointer ${
                      isActive 
                        ? 'border-purple-500 bg-purple-950/30 text-white shadow-lg' 
                        : 'border-white/5 bg-white/5 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold leading-none">{preset.name}</h4>
                      <p className="text-[9px] text-slate-400 font-mono mt-1">{preset.defaultFont}</p>
                    </div>

                    {/* Color Swatch Dots at bottom */}
                    <div className="flex gap-1 items-center mt-1">
                      <span className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ background: preset.primary }} />
                      <span className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ background: preset.secondary }} />
                      <span className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ background: preset.bgDark }} />
                    </div>

                    {isActive && (
                      <span className="absolute top-2 right-2 bg-purple-600 text-white p-0.5 rounded-full">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Section 2: Choose Google Web Font family with preview */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
              2. System Typography Font Selector
            </label>
            <p className="text-[10px] text-slate-400">Changed dynamically throughout titles, menus, comments, buttons & panels instantly.</p>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-white/5 p-2 rounded-xl bg-slate-950/40 scrollbar-thin">
              {FONTS_LIST.map((font) => {
                const isSelected = config.activeFont === font.id;
                return (
                  <button
                    key={font.id}
                    onClick={() => updateConfig({ activeFont: font.id })}
                    className={`p-2 py-2.5 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-white/2 border-white/5 hover:bg-white/5 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-bold truncate" style={{ fontFamily: font.id }}>
                        {font.name}
                      </h4>
                      <p className="text-[8px] text-slate-400 font-mono mt-0.5 truncate">{font.category}</p>
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-purple-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Section 3: Color Schemes Toggle, Compact mode and card padding */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
              3. Visual Mode & Layout Density
            </label>

            {/* Dark & Light toggle selection */}
            <div className="flex items-center justify-between border border-white/5 bg-slate-950/20 p-3 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  {config.isDarkMode ? <Moon className="w-3.5 h-3.5 text-purple-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                  Visual Color Scheme
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5">Toggle between gorgeous dark and premium clean white paper light mode.</p>
              </div>
              <button
                onClick={() => updateConfig({ isDarkMode: !config.isDarkMode })}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-mono transition-colors cursor-pointer"
              >
                {config.isDarkMode ? 'DARK MODE' : 'LIGHT MODE'}
              </button>
            </div>

            {/* Compact mode toggle */}
            <div className="flex items-center justify-between border border-white/5 bg-slate-950/20 p-3 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-slate-100">
                  Enable Compact Layout Mode
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5">Reduces page padding margins, line sizes and title scales for dense viewports.</p>
              </div>
              <input
                type="checkbox"
                checked={config.isCompactMode}
                onChange={(e) => updateConfig({ isCompactMode: e.target.checked })}
                className="w-4 h-4 cursor-pointer accent-purple-500 shrink-0"
              />
            </div>

            {/* Blur Glass state toggle */}
            <div className="flex items-center justify-between border border-white/5 bg-slate-950/20 p-3 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-slate-100">
                  Glassmorphism Blur Filter
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5">Applies beautiful real-time frosted glass backdrop blur overlay to cards.</p>
              </div>
              <input
                type="checkbox"
                checked={config.isBlurGlassEnabled}
                onChange={(e) => updateConfig({ isBlurGlassEnabled: e.target.checked })}
                className="w-4 h-4 cursor-pointer accent-purple-500 shrink-0"
              />
            </div>

            {/* Card Density */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 block font-bold">CARD CONTENT DENSITY</span>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-950/40 p-1 rounded-xl">
                {(['dense', 'comfortable', 'loose'] as const).map((density) => (
                  <button
                    key={density}
                    onClick={() => updateConfig({ cardDensity: density })}
                    className={`py-1.5 rounded-lg text-[10px] font-mono font-bold capitalize transition-all cursor-pointer ${
                      config.cardDensity === density
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {density}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Section 4: Advanced Customizer options (Rounded corners, animation duration multipliers) */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
              4. Premium Detailing Engine
            </label>

            {/* Custom Accent Color picker and Dots */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-400 block font-bold">ACCENT INTEGRATOR COLOR ({config.accentColor})</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.accentColor}
                  onChange={(e) => updateConfig({ accentColor: e.target.value })}
                  className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer outline-none"
                />
                
                {/* Hot Dots */}
                <div className="flex gap-1.5">
                  {hexColorsPreset.map((colorValue) => (
                    <button
                      key={colorValue}
                      onClick={() => updateConfig({ accentColor: colorValue })}
                      className="w-4.5 h-4.5 rounded-full border border-white/20 transition-transform active:scale-95 cursor-pointer relative"
                      style={{ backgroundColor: colorValue }}
                    >
                      {config.accentColor.toLowerCase() === colorValue.toLowerCase() && (
                        <span className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Rounded Corner intensity scales */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 block font-bold">BORDER RADIUS INTENSITY</span>
              <div className="grid grid-cols-5 gap-1 bg-slate-950/40 p-1 rounded-xl">
                {(['none', 'sm', 'md', 'lg', 'full'] as const).map((rad) => (
                  <button
                    key={rad}
                    onClick={() => updateConfig({ roundedCornerIntensity: rad })}
                    className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                      config.roundedCornerIntensity === rad
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {rad}
                  </button>
                ))}
              </div>
            </div>

            {/* Animation speed multiplier */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 block font-bold">ANIMATION TRANSITION SPEED</span>
              <div className="grid grid-cols-5 gap-1 bg-slate-950/40 p-1 rounded-xl">
                {(['0.25', '0.5', '1', '1.5', '2'] as const).map((speed) => (
                  <button
                    key={speed}
                    onClick={() => updateConfig({ animationSpeedMultiplier: speed })}
                    className={`py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                      config.animationSpeedMultiplier === speed
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
              <p className="text-[8px] text-slate-500 font-mono">Control ease-out speed variables across navigation, hover tabs, and canvas overlays.</p>
            </div>
          </div>

          {/* Info notification */}
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-[10px] text-slate-400 flex gap-2">
            <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
            <p>All customized states are saved securely inside index Local Storage variables and automatically loaded during your subsequent visits.</p>
          </div>

        </div>

        {/* Footer info lockups */}
        <div className="p-4 bg-slate-950/60 border-t border-white/10 text-center flex items-center justify-center gap-1">
          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
            Crafted with passion for <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> Bangtan Portal
          </span>
        </div>
      </motion.div>
    </div>
  );
}
