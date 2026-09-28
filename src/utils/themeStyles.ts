import { ReaderTheme, ReaderFont, ReaderFontSize, ReaderLineHeight } from '../types';

export function getThemeClasses(theme: ReaderTheme) {
  switch (theme) {
    case 'oled':
      return {
        bg: 'bg-black',
        cardBg: 'bg-[#080808]',
        cardHover: 'hover:bg-[#121212]',
        sidebarBg: 'bg-[#040404]',
        headerBg: 'bg-black/90 backdrop-blur-xl',
        border: 'border-zinc-800',
        textPrimary: 'text-white',
        textSecondary: 'text-zinc-400',
        textMuted: 'text-zinc-500',
        accent: 'text-sky-400',
        accentBg: 'bg-sky-500',
        accentBorder: 'border-sky-500',
        accentHover: 'hover:bg-sky-600',
        badge: 'bg-zinc-900 text-zinc-300 border-zinc-800',
        activeNav: 'bg-sky-950/70 text-sky-300 border-l-2 border-sky-400',
        glow: 'shadow-[0_0_25px_rgba(56,189,248,0.15)]',
      };

    case 'emerald':
      return {
        bg: 'bg-[#031510]',
        cardBg: 'bg-[#07241c]',
        cardHover: 'hover:bg-[#0c3328]',
        sidebarBg: 'bg-[#041a14]',
        headerBg: 'bg-[#031510]/90 backdrop-blur-xl',
        border: 'border-emerald-900/60',
        textPrimary: 'text-emerald-50',
        textSecondary: 'text-emerald-300/70',
        textMuted: 'text-emerald-500/60',
        accent: 'text-emerald-400',
        accentBg: 'bg-emerald-600',
        accentBorder: 'border-emerald-500',
        accentHover: 'hover:bg-emerald-700',
        badge: 'bg-[#0b3327] text-emerald-300 border-emerald-800/60',
        activeNav: 'bg-emerald-900/50 text-emerald-300 border-l-2 border-emerald-400',
        glow: 'shadow-[0_0_25px_rgba(16,185,129,0.15)]',
      };

    case 'sepia':
      return {
        bg: 'bg-[#181310]',
        cardBg: 'bg-[#241c17]',
        cardHover: 'hover:bg-[#2f251f]',
        sidebarBg: 'bg-[#1d1713]',
        headerBg: 'bg-[#181310]/90 backdrop-blur-xl',
        border: 'border-amber-950/60',
        textPrimary: 'text-amber-50',
        textSecondary: 'text-amber-200/70',
        textMuted: 'text-amber-600/60',
        accent: 'text-amber-400',
        accentBg: 'bg-amber-600',
        accentBorder: 'border-amber-500',
        accentHover: 'hover:bg-amber-700',
        badge: 'bg-[#31251e] text-amber-200 border-amber-900/50',
        activeNav: 'bg-amber-950/60 text-amber-300 border-l-2 border-amber-400',
        glow: 'shadow-[0_0_25px_rgba(245,158,11,0.15)]',
      };

    case 'amber':
      return {
        bg: 'bg-[#120f08]',
        cardBg: 'bg-[#1e190d]',
        cardHover: 'hover:bg-[#282112]',
        sidebarBg: 'bg-[#17130a]',
        headerBg: 'bg-[#120f08]/90 backdrop-blur-xl',
        border: 'border-amber-900/40',
        textPrimary: 'text-amber-100',
        textSecondary: 'text-amber-300/70',
        textMuted: 'text-amber-500/50',
        accent: 'text-amber-400',
        accentBg: 'bg-amber-500',
        accentBorder: 'border-amber-400',
        accentHover: 'hover:bg-amber-600',
        badge: 'bg-[#2c2413] text-amber-300 border-amber-800/40',
        activeNav: 'bg-amber-950/70 text-amber-300 border-l-2 border-amber-400',
        glow: 'shadow-[0_0_25px_rgba(245,158,11,0.2)]',
      };

    case 'crimson':
      return {
        bg: 'bg-[#14060b]',
        cardBg: 'bg-[#220a13]',
        cardHover: 'hover:bg-[#2f0e1a]',
        sidebarBg: 'bg-[#19070e]',
        headerBg: 'bg-[#14060b]/90 backdrop-blur-xl',
        border: 'border-rose-950/60',
        textPrimary: 'text-rose-50',
        textSecondary: 'text-rose-200/70',
        textMuted: 'text-rose-400/50',
        accent: 'text-rose-400',
        accentBg: 'bg-rose-600',
        accentBorder: 'border-rose-500',
        accentHover: 'hover:bg-rose-700',
        badge: 'bg-[#310e1c] text-rose-200 border-rose-900/50',
        activeNav: 'bg-rose-950/70 text-rose-300 border-l-2 border-rose-400',
        glow: 'shadow-[0_0_25px_rgba(244,63,94,0.2)]',
      };

    case 'slate':
      return {
        bg: 'bg-slate-950',
        cardBg: 'bg-slate-900',
        cardHover: 'hover:bg-slate-800/80',
        sidebarBg: 'bg-slate-900/90',
        headerBg: 'bg-slate-950/90 backdrop-blur-xl',
        border: 'border-slate-800',
        textPrimary: 'text-slate-100',
        textSecondary: 'text-slate-400',
        textMuted: 'text-slate-500',
        accent: 'text-indigo-400',
        accentBg: 'bg-indigo-600',
        accentBorder: 'border-indigo-500',
        accentHover: 'hover:bg-indigo-700',
        badge: 'bg-slate-800 text-slate-300 border-slate-700',
        activeNav: 'bg-indigo-950/50 text-indigo-300 border-l-2 border-indigo-400',
        glow: 'shadow-[0_0_25px_rgba(99,102,241,0.15)]',
      };

    case 'light':
      return {
        bg: 'bg-slate-50',
        cardBg: 'bg-white',
        cardHover: 'hover:bg-slate-50',
        sidebarBg: 'bg-white',
        headerBg: 'bg-white/90 backdrop-blur-xl',
        border: 'border-slate-200',
        textPrimary: 'text-slate-900',
        textSecondary: 'text-slate-600',
        textMuted: 'text-slate-400',
        accent: 'text-indigo-600',
        accentBg: 'bg-indigo-600',
        accentBorder: 'border-indigo-600',
        accentHover: 'hover:bg-indigo-700',
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
        activeNav: 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600 font-semibold',
        glow: 'shadow-lg',
      };

    case 'midnight':
    default:
      return {
        bg: 'bg-[#090d16]',
        cardBg: 'bg-[#0f1626]',
        cardHover: 'hover:bg-[#151f36]',
        sidebarBg: 'bg-[#0c121f]',
        headerBg: 'bg-[#090d16]/90 backdrop-blur-xl',
        border: 'border-slate-800/80',
        textPrimary: 'text-slate-100',
        textSecondary: 'text-slate-300',
        textMuted: 'text-slate-500',
        accent: 'text-indigo-400',
        accentBg: 'bg-indigo-600',
        accentBorder: 'border-indigo-500',
        accentHover: 'hover:bg-indigo-500',
        badge: 'bg-[#151f38] text-slate-200 border-slate-700/60',
        activeNav: 'bg-indigo-950/60 text-indigo-300 border-l-2 border-indigo-500',
        glow: 'shadow-[0_0_25px_rgba(99,102,241,0.18)]',
      };
  }
}

export function getFontFamilyClass(font: ReaderFont) {
  switch (font) {
    case 'serif':
      return 'font-serif';
    case 'mono':
      return 'font-mono';
    case 'atkinson':
      return 'font-sans'; // Using configured Atkinson in head
    case 'sans':
    case 'inter':
    default:
      return 'font-sans';
  }
}

export function getFontSizeClass(size: ReaderFontSize) {
  switch (size) {
    case 'sm':
      return 'text-sm';
    case 'lg':
      return 'text-lg';
    case 'xl':
      return 'text-xl';
    case 'base':
    default:
      return 'text-base';
  }
}

export function getLineHeightClass(lh: ReaderLineHeight) {
  switch (lh) {
    case 'compact':
      return 'leading-snug';
    case 'relaxed':
      return 'leading-relaxed';
    case 'loose':
      return 'leading-loose';
    case 'normal':
    default:
      return 'leading-normal';
  }
}
