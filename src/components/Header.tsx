import React from 'react';
import { 
  Search, 
  Plus, 
  SlidersHorizontal, 
  Bell, 
  Sparkles, 
  Layers, 
  LayoutGrid, 
  List, 
  Tv2, 
  RefreshCw, 
  Menu,
  CheckCheck
} from 'lucide-react';
import { ReaderSettings, ViewMode } from '../types';
import { getThemeClasses } from '../utils/themeStyles';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  settings: ReaderSettings;
  onUpdateSettings: (settings: Partial<ReaderSettings>) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAddFeed: () => void;
  onOpenThemeCustomizer: () => void;
  onOpenOpenRouterModal: () => void;
  onOpenNotificationsModal: () => void;
  onToggleSidebar: () => void;
  onRefreshAllFeeds: () => void;
  onMarkAllAsRead: () => void;
  isSyncing: boolean;
  unreadCount: number;
  favoriteCount: number;
  readLaterCount: number;
  hasAudioPlaying: boolean;
  onOpenTagManager: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  searchQuery,
  onSearchChange,
  onOpenAddFeed,
  onOpenThemeCustomizer,
  onOpenOpenRouterModal,
  onOpenNotificationsModal,
  onToggleSidebar,
  onRefreshAllFeeds,
  onMarkAllAsRead,
  isSyncing,
  unreadCount,
}) => {
  const t = getThemeClasses(settings.theme);

  const viewModes: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'swipe-deck', label: 'Deck', icon: <Tv2 className="h-4 w-4" /> },
    { mode: 'cards', label: 'Grid', icon: <LayoutGrid className="h-4 w-4" /> },
    { mode: 'magazine', label: 'Magazine', icon: <Layers className="h-4 w-4" /> },
    { mode: 'compact', label: 'Compact', icon: <List className="h-4 w-4" /> },
  ];

  return (
    <header className={`sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b px-3 sm:px-6 transition-colors duration-300 ${t.headerBg} ${t.border}`}>
      {/* Left: Mobile Menu & Logo */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border ${t.border} ${t.cardBg} ${t.textSecondary} hover:${t.textPrimary} transition lg:hidden active:scale-95`}
          aria-label="Toggle Navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl p-0.5 bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 shadow-md shadow-pink-500/25 shrink-0">
            <img src="/icon.svg" alt="nomatic RSS logo" className="h-full w-full rounded-[10px] object-contain" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
            </span>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-sm sm:text-base bg-gradient-to-r from-pink-200 via-white to-indigo-200 bg-clip-text text-transparent">
                nomatic RSS
              </span>
              <span className="rounded-full bg-pink-500/20 px-1.5 py-0.2 text-[9px] font-bold text-pink-400 border border-pink-500/30">
                PRO
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle: Universal Search Bar */}
      <div className="flex flex-1 max-w-xs sm:max-w-md mx-2 sm:mx-4">
        <div className="relative w-full">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${t.textMuted}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search articles, tags..."
            className={`w-full rounded-xl border py-1.5 sm:py-2 pl-8 sm:pl-9 pr-3 text-xs sm:text-sm transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500/40 ${t.border} ${t.cardBg} ${t.textPrimary} placeholder:${t.textMuted}`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions & Tools */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Desktop View Mode Selector */}
        <div className={`hidden md:flex items-center rounded-xl border p-0.5 ${t.border} ${t.cardBg}`}>
          {viewModes.map((vm) => (
            <button
              key={vm.mode}
              onClick={() => onUpdateSettings({ viewMode: vm.mode })}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition ${
                settings.viewMode === vm.mode
                  ? `${t.accentBg} text-white shadow-sm font-semibold`
                  : `${t.textSecondary} hover:${t.textPrimary}`
              }`}
              title={vm.label}
            >
              {vm.icon}
              <span className="hidden xl:inline">{vm.label}</span>
            </button>
          ))}
        </div>

        {/* Sync Feeds */}
        <button
          onClick={onRefreshAllFeeds}
          disabled={isSyncing}
          className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border ${t.border} ${t.cardBg} ${t.textSecondary} hover:${t.textPrimary} transition active:scale-95 disabled:opacity-50`}
          title="Sync All Feeds"
        >
          <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>

        {/* Mark All As Read */}
        <button
          onClick={onMarkAllAsRead}
          className={`hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border ${t.border} ${t.cardBg} ${t.textSecondary} hover:text-emerald-400 hover:border-emerald-500/40 transition active:scale-95`}
          title="Mark All As Read"
        >
          <CheckCheck className="h-4 w-4" />
        </button>

        {/* AI Intelligence Hub */}
        <button
          onClick={onOpenOpenRouterModal}
          className="relative flex items-center gap-1 rounded-xl border border-purple-500/40 bg-purple-500/10 px-2 sm:px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition active:scale-95 shadow-sm"
          title="AI Insights"
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
          <span className="hidden sm:inline">AI</span>
        </button>

        {/* Add RSS Feed Button (Desktop) */}
        <button
          onClick={onOpenAddFeed}
          className="hidden sm:flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-400 transition active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Add Feed</span>
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotificationsModal}
          className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border ${t.border} ${t.cardBg} ${t.textSecondary} hover:${t.textPrimary} transition active:scale-95`}
          title="Push Alerts"
        >
          <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Theme Customizer */}
        <button
          onClick={onOpenThemeCustomizer}
          className={`hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border ${t.border} ${t.cardBg} ${t.textSecondary} hover:${t.textPrimary} transition active:scale-95`}
          title="Custom Themes"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>

        {/* PWA Install */}
        <div className="hidden sm:block">
          <PWAInstallButton compact />
        </div>
      </div>
    </header>
  );
};
