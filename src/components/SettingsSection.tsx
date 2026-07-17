/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserPreferences } from '../types';
import { ToggleLeft, ToggleRight, Check, RotateCcw, Palette, Settings, Type, Languages, Moon } from 'lucide-react';
import AdminContactDashboard from './AdminContactDashboard';

interface SettingsSectionProps {
  preferences: UserPreferences;
  onPreferencesChange: (newPrefs: UserPreferences) => void;
}

export default function SettingsSection({ preferences, onPreferencesChange }: SettingsSectionProps) {
  
  const handleThemeChange = (theme: 'dark' | 'light' | 'system') => {
    onPreferencesChange({ ...preferences, theme });
  };

  const handleAccentChange = (accentColor: 'indigo' | 'purple' | 'crimson' | 'violet' | 'amber') => {
    onPreferencesChange({ ...preferences, accentColor });
  };

  const handleAnimationToggle = () => {
    onPreferencesChange({ ...preferences, animationsEnabled: !preferences.animationsEnabled });
  };

  const handleFontSizeChange = (fontSize: 'sm' | 'base' | 'lg' | 'xl') => {
    onPreferencesChange({ ...preferences, fontSize });
  };

  const handleLanguageChange = (language: 'EN' | 'KR' | 'JP') => {
    onPreferencesChange({ ...preferences, language });
  };

  const handleReset = () => {
    const defaults: UserPreferences = {
      theme: 'dark',
      accentColor: 'purple',
      animationsEnabled: true,
      fontSize: 'base',
      language: 'EN'
    };
    onPreferencesChange(defaults);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in font-sans">
      <div className="flex justify-between items-center border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-sans font-extrabold text-white">
            Personalization & Audio Settings
          </h2>
          <p className="text-gray-400 text-sm">
            Customize accent colors, theme variables, particle densities and localized text parameters.
          </p>
        </div>

        <button
          onClick={handleReset}
          id="reset-preferences-btn"
          className="flex items-center gap-1 text-xs font-mono font-medium px-3.5 py-2 rounded-lg border border-white/10 hover:border-purple-500/30 text-gray-400 hover:text-purple-300 transition-all bg-white/[0.01] hover:bg-white/[0.03] cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Theme styling */}
        <div className="p-5 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-mono font-bold text-purple-300 flex items-center gap-2 border-b border-white/5 pb-2 uppercase tracking-wider">
            <Moon className="w-4 h-4 text-purple-400" /> Color Theme Preset
          </h3>

          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { id: 'dark', label: 'Theme Dark' },
              { id: 'light', label: 'Theme Light (Slight)' },
              { id: 'system', label: 'Sync System' }
            ].map(thm => (
              <button
                key={thm.id}
                onClick={() => handleThemeChange(thm.id as any)}
                className={`p-3 rounded-lg border font-mono font-bold transition-all text-center cursor-pointer ${
                  preferences.theme === thm.id
                    ? 'border-purple-500 bg-purple-950/20 text-purple-200'
                    : 'border-white/5 bg-white/[0.01] text-gray-400 hover:text-white'
                }`}
              >
                {thm.label}
              </button>
            ))}
          </div>
        </div>

        {/* Card: Accent selection */}
        <div className="p-5 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-mono font-bold text-purple-300 flex items-center gap-2 border-b border-white/5 pb-2 uppercase tracking-wider">
            <Palette className="w-4 h-4 text-purple-400" /> Color Accent Highlight
          </h3>

          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { id: 'purple', bg: 'bg-purple-600', text: 'Royal Violet' },
              { id: 'crimson', bg: 'bg-rose-600', text: 'Crimson Red' },
              { id: 'indigo', bg: 'bg-indigo-600', text: 'Indigo Blue' },
              { id: 'amber', bg: 'bg-amber-500', text: 'ARMY Gold' },
            ].map(acc => (
              <button
                key={acc.id}
                onClick={() => handleAccentChange(acc.id as any)}
                id={`accent-btn-${acc.id}`}
                className={`px-3 py-2.5 rounded-lg border flex items-center gap-2 transition-all cursor-pointer ${
                  preferences.accentColor === acc.id
                    ? 'border-purple-500 bg-purple-950/20 text-purple-200'
                    : 'border-white/5 bg-white/[0.01] text-gray-400 hover:text-white'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${acc.bg}`} />
                <span className="font-mono">{acc.text}</span>
                {preferences.accentColor === acc.id && <Check className="w-3.5 h-3.5 ml-1 text-purple-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Card: Animation settings */}
        <div className="p-5 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-mono font-bold text-purple-300 flex items-center gap-2 border-b border-white/5 pb-2 uppercase tracking-wider">
            <Settings className="w-4 h-4 text-purple-400" /> UI Animations
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-200 block font-sans">Active Motion Transitions</span>
              <span className="text-xs text-gray-500 block leading-snug">Disable viewport transitions if performance locks.</span>
            </div>

            <button
              onClick={handleAnimationToggle}
              id="animations-toggle-btn"
              className="text-purple-400 focus:outline-none cursor-pointer"
            >
              {preferences.animationsEnabled ? (
                <ToggleRight className="w-10 h-10 text-purple-400" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Card: Font Size controls */}
        <div className="p-5 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-mono font-bold text-purple-300 flex items-center gap-2 border-b border-white/5 pb-2 uppercase tracking-wider">
            <Type className="w-4 h-4 text-purple-400" /> Typography Scale
          </h3>

          <div className="grid grid-cols-4 gap-1.5 text-xs text-center font-mono">
            {[
              { id: 'sm', text: 'Compact' },
              { id: 'base', text: 'Standard' },
              { id: 'lg', text: 'Medium' },
              { id: 'xl', text: 'Large' }
            ].map(sz => (
              <button
                key={sz.id}
                onClick={() => handleFontSizeChange(sz.id as any)}
                className={`py-2 rounded border cursor-pointer ${
                  preferences.fontSize === sz.id
                    ? 'border-purple-500 bg-purple-950/20 text-purple-200 font-bold'
                    : 'border-white/5 bg-white/[0.01] text-gray-400 hover:text-white'
                }`}
              >
                {sz.text}
              </button>
            ))}
          </div>
        </div>

        {/* Card: Localization Language selection */}
        <div className="p-5 rounded-2xl border border-white/5 bg-[#0d071a]/40 backdrop-blur-md space-y-4 md:col-span-2">
          <h3 className="text-sm font-mono font-bold text-purple-300 flex items-center gap-2 border-b border-white/5 pb-2 uppercase tracking-wider">
            <Languages className="w-4 h-4 text-purple-400" /> Site Localization (Language)
          </h3>

          <div className="flex gap-4">
            {[
              { id: 'EN', sub: 'English (Verified)' },
              { id: 'KR', sub: '한국어 (BETA - Romanized)' },
              { id: 'JP', sub: '日本語 (BETA - Translating)' }
            ].map(lan => (
              <button
                key={lan.id}
                onClick={() => handleLanguageChange(lan.id as any)}
                className={`p-4 rounded-xl border flex-grow text-left transition-colors cursor-pointer ${
                  preferences.language === lan.id
                    ? 'border-purple-500 bg-purple-950/25'
                    : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03]'
                }`}
              >
                <div className="font-mono text-sm font-bold text-white">{lan.id}</div>
                <div className="text-[10px] text-gray-500 mt-1">{lan.sub}</div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Admin CRM Support Messages Center Log Dashboard */}
      <AdminContactDashboard />
    </div>
  );
}
