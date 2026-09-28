import React from 'react';
import { 
  Rss, 
  Tv2, 
  Star, 
  Bookmark, 
  Tag as TagIcon, 
  Plus, 
  SlidersHorizontal,
  Sparkles,
  Inbox
} from 'lucide-react';
import { ReaderSettings, ViewMode } from '../types';
import { getThemeClasses } from '../utils/themeStyles';

interface MobileBottomNavProps {
  currentFilter: string;
  onSelectFilter: (filter: string) => void;
  settings: ReaderSettings;
  onUpdateSettings: (settings: Partial<ReaderSettings>) => void;
  onOpenAddFeed: () => void;
  onOpenTagManager: () => void;
  onOpenThemeCustomizer: () => void;
  unreadCount: number;
  favoriteCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentFilter,
  onSelectFilter,
  settings,
  onUpdateSettings,
  onOpenAddFeed,
  onOpenTagManager,
  onOpenThemeCustomizer,
  unreadCount,
  favoriteCount,
}) => {
  const t = getThemeClasses(settings.theme);
  const isSwipeMode = settings.viewMode === 'swipe-deck';

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t px-2 lg:hidden backdrop-blur-2xl transition-colors duration-300 ${t.headerBg} ${t.border}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* All Feeds / Stream */}
      <button
        onClick={() => {
          if (isSwipeMode) onUpdateSettings({ viewMode: 'cards' });
          onSelectFilter('all');
        }}
        className={`relative flex flex-col items-center justify-center py-1 px-2.5 transition active:scale-95 ${
          !isSwipeMode && currentFilter === 'all'
            ? `${t.accent} font-bold`
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Inbox className="h-5 w-5" />
        <span className="text-[10px] mt-0.5 tracking-tight font-medium">All Feeds</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-2 flex h-2 w-2 rounded-full bg-sky-400" />
        )}
      </button>

      {/* Swipe Deck Reel Mode */}
      <button
        onClick={() => onUpdateSettings({ viewMode: 'swipe-deck' })}
        className={`relative flex flex-col items-center justify-center py-1 px-2.5 transition active:scale-95 ${
          isSwipeMode
            ? `${t.accent} font-bold`
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <Tv2 className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight font-medium">Swipe Deck</span>
      </button>

      {/* Add Feed Quick Center Action */}
      <button
        onClick={onOpenAddFeed}
        className="relative -top-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/30 active:scale-90 transition"
        title="Add New RSS Feed"
      >
        <Plus className="h-6 w-6 stroke-[2.5]" />
      </button>

      {/* Favorites */}
      <button
        onClick={() => {
          if (isSwipeMode) onUpdateSettings({ viewMode: 'cards' });
          onSelectFilter('favorites');
        }}
        className={`relative flex flex-col items-center justify-center py-1 px-2.5 transition active:scale-95 ${
          !isSwipeMode && currentFilter === 'favorites'
            ? 'text-amber-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Star className={`h-5 w-5 ${currentFilter === 'favorites' && !isSwipeMode ? 'fill-amber-400' : ''}`} />
        <span className="text-[10px] mt-0.5 tracking-tight font-medium">Favorites</span>
        {favoriteCount > 0 && (
          <span className="absolute top-1 right-2 flex h-2 w-2 rounded-full bg-amber-400" />
        )}
      </button>

      {/* Tags & Topics Manager */}
      <button
        onClick={onOpenTagManager}
        className="flex flex-col items-center justify-center py-1 px-2.5 text-slate-400 hover:text-slate-200 transition active:scale-95"
      >
        <TagIcon className="h-5 w-5" />
        <span className="text-[10px] mt-0.5 tracking-tight font-medium">Tags</span>
      </button>

      {/* Customize / Theme */}
      <button
        onClick={onOpenThemeCustomizer}
        className="flex flex-col items-center justify-center py-1 px-2.5 text-slate-400 hover:text-slate-200 transition active:scale-95"
      >
        <SlidersHorizontal className="h-5 w-5" />
        <span className="text-[10px] mt-0.5 tracking-tight font-medium">Theme</span>
      </button>
    </nav>
  );
};
