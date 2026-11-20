/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export type PremiumThemeId = 'dark-black-red' | 'purple-galaxy' | 'ocean-blue' | 'emerald-green' | 'crystal-glass';
export type FontStyleId = 'Poppins' | 'Inter' | 'Roboto' | 'Montserrat' | 'Nunito' | 'Oswald' | 'Bebas Neue' | 'Playfair Display' | 'Orbitron' | 'Space Grotesk';

export interface ThemeConfig {
  activeTheme: PremiumThemeId;
  activeFont: FontStyleId;
  isDarkMode: boolean;
  isCompactMode: boolean;
  roundedCornerIntensity: 'none' | 'sm' | 'md' | 'lg' | 'full';
  animationSpeedMultiplier: '0.25' | '0.5' | '1' | '1.5' | '2';
  isBlurGlassEnabled: boolean;
  accentColor: string; // hex
  iconStyle: 'solid' | 'stroke';
  cardDensity: 'dense' | 'comfortable' | 'loose';
}

interface ThemeContextType {
  config: ThemeConfig;
  updateConfig: (updater: Partial<ThemeConfig> | ((prev: ThemeConfig) => ThemeConfig)) => void;
  resetTheme: () => void;
}

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  activeTheme: 'purple-galaxy',
  activeFont: 'Space Grotesk',
  isDarkMode: true,
  isCompactMode: false,
  roundedCornerIntensity: 'md',
  animationSpeedMultiplier: '1',
  isBlurGlassEnabled: true,
  accentColor: '#a855f7', // purple-500 default
  iconStyle: 'stroke',
  cardDensity: 'comfortable',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme presets map with detailed properties
export const THEME_PRESETS: Record<PremiumThemeId, {
  name: string;
  defaultFont: FontStyleId;
  primary: string;
  secondary: string;
  bgDark: string;
  bgLight: string;
  cardDark: string;
  cardLight: string;
  borderDark: string;
  borderLight: string;
  accent: string;
}> = {
  'dark-black-red': {
    name: 'Dark Black & Red',
    defaultFont: 'Oswald',
    primary: '#dc2626', // red-600
    secondary: '#ef4444', // red-500
    bgDark: '#080202', // pure deep red black
    bgLight: '#fef2f2', // light pinkish white
    cardDark: 'rgba(23, 10, 10, 0.85)',
    cardLight: 'rgba(255, 244, 244, 0.9)',
    borderDark: 'rgba(220, 38, 38, 0.25)',
    borderLight: 'rgba(220, 38, 38, 0.15)',
    accent: '#dc2626',
  },
  'purple-galaxy': {
    name: 'Purple Galaxy',
    defaultFont: 'Space Grotesk',
    primary: '#a855f7', // purple-500
    secondary: '#d946ef', // fuchsia-500
    bgDark: '#05000a', // deep space purple
    bgLight: '#faf8fd', // pale lavender white
    cardDark: 'rgba(13, 7, 26, 0.6)',
    cardLight: 'rgba(255, 255, 255, 0.85)',
    borderDark: 'rgba(168, 85, 247, 0.2)',
    borderLight: 'rgba(168, 85, 247, 0.15)',
    accent: '#a855f7',
  },
  'ocean-blue': {
    name: 'Ocean Blue',
    defaultFont: 'Poppins',
    primary: '#06b6d4', // cyan-500
    secondary: '#3b82f6', // blue-500
    bgDark: '#010915', // deep navy ocean abyss
    bgLight: '#f0f6ff', // light icy blue white
    cardDark: 'rgba(15, 23, 42, 0.8)',
    cardLight: 'rgba(255, 255, 255, 0.9)',
    borderDark: 'rgba(6, 182, 212, 0.25)',
    borderLight: 'rgba(6, 182, 212, 0.15)',
    accent: '#06b6d4',
  },
  'emerald-green': {
    name: 'Emerald Green',
    defaultFont: 'Montserrat',
    primary: '#10b981', // emerald-500
    secondary: '#34d399', // emerald-400
    bgDark: '#020f06', // dark jungle green
    bgLight: '#f0fdf4', // light mint moss white
    cardDark: 'rgba(4, 25, 12, 0.8)',
    cardLight: 'rgba(255, 255, 255, 0.9)',
    borderDark: 'rgba(16, 185, 129, 0.25)',
    borderLight: 'rgba(16, 185, 129, 0.15)',
    accent: '#10b981',
  },
  'crystal-glass': {
    name: 'Crystal Glass Ultra',
    defaultFont: 'Space Grotesk',
    primary: '#c084fc', // light transparent purple
    secondary: '#e879f9', // light fuchsia
    bgDark: 'linear-gradient(135deg, #0d061a 0%, #030107 50%, #150526 100%)', // premium dark gradient background with purple accents
    bgLight: 'linear-gradient(135deg, #fdfaff 0%, #f7f0ff 100%)', // soft transparent purple gradient light mode
    cardDark: 'rgba(255, 255, 255, 0.04)', // extreme glassmorphism transparent
    cardLight: 'rgba(255, 255, 255, 0.45)', // soft light frosted glass
    borderDark: 'rgba(255, 255, 255, 0.08)', // subtle white reflection border
    borderLight: 'rgba(168, 85, 247, 0.12)',
    accent: '#c084fc', // beautiful custom ultra purple/indigo glass accent
  }
};

const FONT_MAP: Record<FontStyleId, { family: string; importUrl: string }> = {
  'Poppins': {
    family: "'Poppins', sans-serif",
    importUrl: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;900&display=swap"
  },
  'Inter': {
    family: "'Inter', sans-serif",
    importUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap"
  },
  'Roboto': {
    family: "'Roboto', sans-serif",
    importUrl: "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap"
  },
  'Montserrat': {
    family: "'Montserrat', sans-serif",
    importUrl: "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;900&display=swap"
  },
  'Nunito': {
    family: "'Nunito', sans-serif",
    importUrl: "https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;900&display=swap"
  },
  'Oswald': {
    family: "'Oswald', sans-serif",
    importUrl: "https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;700&display=swap"
  },
  'Bebas Neue': {
    family: "'Bebas Neue', sans-serif",
    importUrl: "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap"
  },
  'Playfair Display': {
    family: "'Playfair Display', serif",
    importUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap"
  },
  'Orbitron': {
    family: "'Orbitron', monospace",
    importUrl: "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&display=swap"
  },
  'Space Grotesk': {
    family: "'Space Grotesk', sans-serif",
    importUrl: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
  }
};

export function ThemeCustomProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('bts_custom_theme_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // safeguard fallback values
        return { ...DEFAULT_THEME_CONFIG, ...parsed };
      } catch (e) {
        // use default
      }
    }
    return DEFAULT_THEME_CONFIG;
  });

  const updateConfig = (updater: Partial<ThemeConfig> | ((prev: ThemeConfig) => ThemeConfig)) => {
    setConfig(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      
      // If the user changed the activeTheme, automatically sync default font & default accent of that theme!
      if (updater && 'activeTheme' in updater && updater.activeTheme && updater.activeTheme !== prev.activeTheme) {
        const preset = THEME_PRESETS[updater.activeTheme];
        next.activeFont = preset.defaultFont;
        next.accentColor = preset.accent;
      }

      localStorage.setItem('bts_custom_theme_config', JSON.stringify(next));
      return next;
    });
  };

  const resetTheme = () => {
    setConfig(DEFAULT_THEME_CONFIG);
    localStorage.setItem('bts_custom_theme_config', JSON.stringify(DEFAULT_THEME_CONFIG));
  };

  // Inject active styles dynamically inside indices
  useEffect(() => {
    // 1. Setup fonts import URLs in document head dynamically
    const fontId = 'dynamic-theme-font-link';
    let linkElement = document.getElementById(fontId) as HTMLLinkElement;
    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.id = fontId;
      linkElement.rel = 'stylesheet';
      document.head.appendChild(linkElement);
    }
    const fontStyleObj = FONT_MAP[config.activeFont];
    linkElement.href = fontStyleObj.importUrl;

    // 2. Compute variables override styles block
    const themePreset = THEME_PRESETS[config.activeTheme];
    const isDark = config.isDarkMode;
    
    const bgColor = isDark ? themePreset.bgDark : themePreset.bgLight;
    const cardColor = isDark ? themePreset.cardDark : themePreset.cardLight;
    const borderColor = isDark ? themePreset.borderDark : themePreset.borderLight;
    const textColor = isDark ? '#f8fafc' : '#000000';
    const subTextColor = isDark ? '#94a3b8' : '#1a1a1a';
    const accent = config.accentColor;

    // Radius
    let borderRad = '12px';
    if (config.roundedCornerIntensity === 'none') borderRad = '0px';
    if (config.roundedCornerIntensity === 'sm') borderRad = '4px';
    if (config.roundedCornerIntensity === 'md') borderRad = '12px';
    if (config.roundedCornerIntensity === 'lg') borderRad = '24px';
    if (config.roundedCornerIntensity === 'full') borderRad = '9999px';

    // Animation Speed multiplier
    const speedMult = config.animationSpeedMultiplier;

    // Glass filter blur
    const glassBlur = config.isBlurGlassEnabled ? '20px' : '0px';

    // Card Paddings density
    let cardPad = '1.25rem';
    if (config.cardDensity === 'dense') cardPad = '0.75rem';
    if (config.cardDensity === 'loose') cardPad = '2rem';

    // Inject class styles & variable definitions in a custom <style> element
    const styleId = 'dynamic-theme-styles-block';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.innerHTML = `
      :root {
        --theme-font: ${fontStyleObj.family};
        --theme-bg: ${bgColor};
        --theme-card-bg: ${cardColor};
        --theme-border: ${borderColor};
        --theme-text: ${textColor};
        --theme-subtext: ${subTextColor};
        --theme-accent: ${accent};
        --theme-radius: ${borderRad};
        --theme-speed: ${speedMult};
        --theme-blur: ${glassBlur};
        --theme-padding: ${cardPad};
      }

      * {
        font-family: var(--theme-font) !important;
        transition-property: background-color, border-color, text-decoration-color, fill, stroke !important;
        transition-duration: calc(250ms * var(--theme-speed)) !important;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
      }

      body {
        background: var(--theme-bg) !important;
        background-attachment: fixed !important;
        color: var(--theme-text) !important;
      }

      /* Custom Crystal Glass overrides */
      ${config.activeTheme === 'crystal-glass' ? `
        /* High blur frosted panel styling */
        .glass-panel,
        .bg-purple-950\\/20,
        .bg-purple-950\\/10,
        .bg-black\\/20,
        .bg-black\\/40,
        .bg-black\\/50,
        .bg-white\\/\\[0\\.01\\],
        .bg-white\\/\\[0\\.02\\],
        .bg-white\\/\\[0\\.03\\] {
          background: ${isDark ? 'rgba(15, 7, 30, 0.45)' : 'rgba(255, 255, 255, 0.45)'} !important;
          backdrop-filter: blur(35px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(35px) saturate(180%) !important;
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(120, 119, 198, 0.2)'} !important;
          box-shadow: 0 8px 32px 0 ${isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(31, 38, 135, 0.08)'} !important;
        }
        
        /* Floating crystal reflection look */
        .glass-card-hover:hover,
        .group:hover .glass-panel {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 12px 40px 0 rgba(168, 85, 247, 0.2) !important;
          border-color: rgba(255, 255, 255, 0.18) !important;
        }

        /* Glass Sidebar / Nav panel */
        .glass-sidebar {
          background: rgba(10, 5, 20, 0.4) !important;
          backdrop-filter: blur(25px) !important;
          border-right: 1px solid rgba(255, 255, 255, 0.06) !important;
        }
        
        /* Glass Button custom styling */
        .glass-btn {
          background: rgba(168, 85, 247, 0.15) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #f3e8ff !important;
        }
        .glass-btn:hover {
          background: rgba(168, 85, 247, 0.25) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
      ` : ''}

      /* Primary helper classes overrides corresponding to direct selector injections */
      .bg-purple-950\\/20,
      .bg-purple-950\\/10,
      .bg-black\\/20,
      .bg-black\\/40,
      .bg-black\\/50,
      .bg-white\\/\\[0\\.01\\],
      .bg-white\\/\\[0\\.02\\],
      .bg-white\\/\\[0\\.03\\],
      .glass-panel {
        background-color: var(--theme-card-bg) !important;
        backdrop-filter: blur(var(--theme-blur)) !important;
        -webkit-backdrop-filter: blur(var(--theme-blur)) !important;
      }

      .border-white\\/5,
      .border-white\\/10,
      .border-purple-500\\/35,
      .border-purple-500\\/50,
      .border-purple-500\\/20,
      .border-purple-500\\/30 {
        border-color: var(--theme-border) !important;
      }

      /* Rounded corners */
      .rounded-3xl, .rounded-2xl, .rounded-xl, .rounded-lg {
        border-radius: var(--theme-radius) !important;
      }

      .p-4, .p-5, .p-6, .p-8 {
        padding: var(--theme-padding) !important;
      }

      /* Compact Mode */
      ${config.isCompactMode ? `
        .py-4\\.5 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
        .py-8 { padding-top: 1rem !important; padding-bottom: 1rem !important; }
        .space-y-6 > * + * { margin-top: 0.75rem !important; }
        .space-y-10 > * + * { margin-top: 1.5rem !important; }
        h1, h2 { font-size: 1.25rem !important; line-height: 1.5rem !important; }
        p { font-size: 0.75rem !important; }
        .gap-8 { gap: 1rem !important; }
        .py-4 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
      ` : ''}

      /* Primary accent colors on text, borders and buttons helper variables */
      .text-purple-300, .text-purple-400, .text-slate-100 {
        color: var(--theme-text) !important;
      }
      
      .text-slate-400, .text-gray-400, .text-slate-300 {
        color: var(--theme-subtext) !important;
      }

      .bg-purple-600 {
        background-color: var(--theme-accent) !important;
        color: #ffffff !important;
      }

      .text-purple-600, .text-fuchsia-500, .text-purple-500 {
        color: var(--theme-accent) !important;
      }

      /* Scrollbar theme colorization mapping */
      ::-webkit-scrollbar-track {
        background: var(--theme-bg);
      }
      ::-webkit-scrollbar-thumb {
        background: var(--theme-border);
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: var(--theme-accent);
      }
    `;

    // 3. Switch global body class for dark/light selectors natively
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }

  }, [config]);

  return (
    <ThemeContext.Provider value={{ config, updateConfig, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeCustom() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeCustom must be used within a ThemeCustomProvider');
  }
  return context;
}
