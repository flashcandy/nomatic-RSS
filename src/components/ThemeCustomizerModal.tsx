import React from 'react';
import { 
  X, 
  SlidersHorizontal, 
  Moon, 
  Sun, 
  Type, 
  AlignLeft, 
  Layout, 
  Check, 
  Sparkles, 
  Palette,
  Eye
} from 'lucide-react';
import { ReaderSettings, ReaderTheme, ReaderFont, ReaderFontSize, ReaderLineHeight, ViewMode } from '../types';

interface ThemeCustomizerModalProps {
  settings: ReaderSettings;
  onUpdateSettings: (settings: Partial<ReaderSettings>) => void;
  onClose: () => void;
}

const THEMES: Array<{
  id: ReaderTheme;
  name: string;
  bgHex: string;
  accentHex: string;
  desc: string;
}> = [
  { id: 'oled', name: 'OLED Pitch Black', bgHex: '#000000', accentHex: '#38bdf8', desc: '100% black pixels, max battery saving' },
  { id: 'midnight', name: 'Midnight Obsidian', bgHex: '#090d16', accentHex: '#6366f1', desc: 'Deep cosmic navy with electric violet' },
  { id: 'slate', name: 'Slate Modern', bgHex: '#0f172a', accentHex: '#818cf8', desc: 'Clean charcoal tech aesthetic' },
  { id: 'emerald', name: 'Forest Emerald', bgHex: '#031510', accentHex: '#10b981', desc: 'Deep botanical pine & jade tones' },
  { id: 'sepia', name: 'Espresso Sepia', bgHex: '#181310', accentHex: '#f59e0b', desc: 'Warm coffee editorial reading' },
  { id: 'amber', name: 'Solarized Amber', bgHex: '#120f08', accentHex: '#fbbf24', desc: 'Vintage warm amber glow' },
  { id: 'crimson', name: 'Luxury Crimson', bgHex: '#14060b', accentHex: '#f43f5e', desc: 'Royal burgundy & velvet rose' },
  { id: 'light', name: 'Studio Editorial Light', bgHex: '#f8fafc', accentHex: '#4f46e5', desc: 'Crisp high-contrast daylight' },
];

const FONTS: Array<{ id: ReaderFont; name: string; sample: string }> = [
  { id: 'inter', name: 'Inter UI (Clean Sans)', sample: 'Clean modern digital clarity' },
  { id: 'serif', name: 'Newsreader / Editorial Serif', sample: 'Rich bookish long-form prose' },
  { id: 'mono', name: 'JetBrains Mono', sample: 'Fixed-width developer code' },
  { id: 'atkinson', name: 'Atkinson Hyperlegible', sample: 'Maximum reading accessibility' },
];

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-100 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 text-white shadow-md">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Themes & Typography Studio</h2>
              <p className="text-xs text-slate-400">Personalize dark mode, fonts and layout</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Dark Mode & Color Theme Palette */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Color Themes ({THEMES.length})
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {THEMES.map((th) => {
                const isSelected = settings.theme === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => onUpdateSettings({ theme: th.id })}
                    className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500 shadow-md'
                        : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80'
                    }`}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-white/20 shadow"
                      style={{ backgroundColor: th.bgHex }}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: th.accentHex }}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white truncate">{th.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-400 truncate block mt-0.5">{th.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Typography Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Reading Typography
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FONTS.map((fn) => {
                const isSelected = settings.fontFamily === fn.id;
                return (
                  <button
                    key={fn.id}
                    onClick={() => onUpdateSettings({ fontFamily: fn.id })}
                    className={`flex flex-col rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="font-bold text-xs text-white">{fn.name}</span>
                    <span className="text-[11px] text-slate-400 mt-1 italic">{fn.sample}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Size & Line Height Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Font Size</label>
              <div className="flex rounded-xl bg-slate-800/60 p-1 border border-slate-700/60">
                {(['sm', 'base', 'lg', 'xl'] as ReaderFontSize[]).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => onUpdateSettings({ fontSize: sz })}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition uppercase ${
                      settings.fontSize === sz ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Line Height</label>
              <div className="flex rounded-xl bg-slate-800/60 p-1 border border-slate-700/60">
                {(['compact', 'normal', 'relaxed', 'loose'] as ReaderLineHeight[]).map((lh) => (
                  <button
                    key={lh}
                    onClick={() => onUpdateSettings({ lineHeight: lh })}
                    className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold transition capitalize ${
                      settings.lineHeight === lh ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lh.slice(0, 4)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            {/* Auto-mark as read */}
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-white">Auto-mark as read on swipe</span>
                <p className="text-[11px] text-slate-400">Mark story read automatically when scrolling past</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoMarkAsRead}
                onChange={(e) => onUpdateSettings({ autoMarkAsRead: e.target.checked })}
                className="h-4 w-4 rounded bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            {/* Bionic Reading */}
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-white">Bionic Reading Mode</span>
                <p className="text-[11px] text-slate-400">Bold first half of words to guide eye flow faster</p>
              </div>
              <input
                type="checkbox"
                checked={settings.bionicReading}
                onChange={(e) => onUpdateSettings({ bionicReading: e.target.checked })}
                className="h-4 w-4 rounded bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
