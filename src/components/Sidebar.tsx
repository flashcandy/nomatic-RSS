import React from 'react';
import { 
  Rss, 
  Inbox, 
  Star, 
  Bookmark, 
  Clock, 
  History,
  Tag as TagIcon, 
  Folder, 
  Plus, 
  Settings, 
  Download, 
  Upload, 
  Sparkles, 
  Layers, 
  Tv, 
  Headphones, 
  Check, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Globe,
  Sliders,
  Database
} from 'lucide-react';
import { FeedSource, FeedCategory, FeedTag, ReaderSettings } from '../types';
import { getThemeClasses } from '../utils/themeStyles';

interface SidebarProps {
  feeds: FeedSource[];
  categories: FeedCategory[];
  tags: FeedTag[];
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  selectedCategory: string | null;
  onSelectCategory: (catId: string | null) => void;
  selectedTag: string | null;
  onSelectTag: (tagId: string | null) => void;
  selectedFeedId: string | null;
  onSelectFeed: (feedId: string | null) => void;
  settings: ReaderSettings;
  isOpen: boolean;
  onClose: () => void;
  onOpenAddFeed: () => void;
  onOpenCategoryManager: () => void;
  onOpenTagManager: () => void;
  onDeleteFeed: (feedId: string) => void;
  onExportOpml: () => void;
  onImportOpml: (e: React.ChangeEvent<HTMLInputElement>) => void;
  unreadCount: number;
  historyCount: number;
  favoriteCount: number;
  readLaterCount: number;
  isOnline: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  feeds,
  categories,
  tags,
  selectedFilter,
  onSelectFilter,
  selectedCategory,
  onSelectCategory,
  selectedTag,
  onSelectTag,
  selectedFeedId,
  onSelectFeed,
  settings,
  isOpen,
  onClose,
  onOpenAddFeed,
  onOpenCategoryManager,
  onOpenTagManager,
  onDeleteFeed,
  onExportOpml,
  onImportOpml,
  unreadCount,
  historyCount,
  favoriteCount,
  readLaterCount,
  isOnline,
}) => {
  const t = getThemeClasses(settings.theme);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const mainViews = [
    { id: 'all', label: 'All Articles', icon: <Inbox className="h-4 w-4" />, count: feeds.reduce((a, b) => a + (b.itemCount || 0), 0) },
    { id: 'unread', label: 'Unread Feeds', icon: <Rss className="h-4 w-4 text-sky-400" />, count: unreadCount },
    { id: 'history', label: 'Reading History', icon: <History className="h-4 w-4 text-emerald-400" />, count: historyCount },
    { id: 'favorites', label: 'Favorites', icon: <Star className="h-4 w-4 text-amber-400 fill-amber-400/20" />, count: favoriteCount },
    { id: 'readLater', label: 'Read Later', icon: <Bookmark className="h-4 w-4 text-purple-400 fill-purple-400/20" />, count: readLaterCount },
    { id: 'media-video', label: 'Video Releases', icon: <Tv className="h-4 w-4 text-rose-400" />, count: undefined },
    { id: 'media-audio', label: 'Audio & Sounds', icon: <Headphones className="h-4 w-4 text-emerald-400" />, count: undefined },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 z-40 lg:z-10 flex h-full lg:h-[calc(100vh-4rem)] w-72 flex-col border-r transition-all duration-300 ease-in-out ${t.sidebarBg} ${t.border} ${
          isOpen ? 'left-0 shadow-2xl' : '-left-72 lg:left-0'
        }`}
      >
        {/* Top Header on mobile */}
        <div className="flex items-center justify-between p-4 border-b border-inherit lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg p-0.5 bg-gradient-to-tr from-pink-500 to-indigo-600 shadow-sm">
              <img src="/icon.svg" alt="" className="h-full w-full rounded-md object-contain" />
            </div>
            <span className="font-extrabold text-white text-base">nomatic RSS</span>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-1.5 ${t.textSecondary} hover:${t.textPrimary}`}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin">
          {/* Main Feed Filters */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Feeds & Streams
            </div>
            {mainViews.map((view) => {
              const isActive = selectedFilter === view.id && selectedCategory === null && selectedTag === null && selectedFeedId === null;
              return (
                <button
                  key={view.id}
                  onClick={() => {
                    onSelectFilter(view.id);
                    onSelectCategory(null);
                    onSelectTag(null);
                    onSelectFeed(null);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                    isActive ? t.activeNav : `${t.textSecondary} hover:${t.textPrimary} ${t.cardHover}`
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {view.icon}
                    <span>{view.label}</span>
                  </div>
                  {view.count !== undefined && view.count > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {view.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Categories Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Categories
              </span>
              <button
                onClick={onOpenCategoryManager}
                className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                Manage
              </button>
            </div>

            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const catFeeds = feeds.filter((f) => f.category === cat.id);
              const totalItems = catFeeds.reduce((sum, f) => sum + (f.itemCount || 0), 0);

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onSelectCategory(cat.id);
                    onSelectFilter('all');
                    onSelectTag(null);
                    onSelectFeed(null);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                    isActive ? t.activeNav : `${t.textSecondary} hover:${t.textPrimary} ${t.cardHover}`
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {totalItems}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tag Management System Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-1.5">
                <TagIcon className="h-3 w-3 text-slate-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Tags & Topics
                </span>
              </div>
              <button
                onClick={onOpenTagManager}
                className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                Manage
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 px-2 pt-1">
              {tags.map((tag) => {
                const isActive = selectedTag === tag.name || selectedTag === tag.id;
                return (
                  <button
                    key={tag.id}
                    onClick={() => {
                      onSelectTag(isActive ? null : tag.name);
                      onSelectFilter('all');
                      onSelectCategory(null);
                      onSelectFeed(null);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60'
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span>#{tag.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subscribed Sources Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Sources ({feeds.length})
              </span>
              <button
                onClick={onOpenAddFeed}
                className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>

            {feeds.map((feed) => {
              const isActive = selectedFeedId === feed.id;
              return (
                <div
                  key={feed.id}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs transition ${
                    isActive ? t.activeNav : `${t.textSecondary} hover:${t.textPrimary} ${t.cardHover}`
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectFeed(feed.id);
                      onSelectFilter('all');
                      onSelectCategory(null);
                      onSelectTag(null);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className="flex flex-1 items-center gap-2.5 truncate text-left"
                  >
                    {feed.icon ? (
                      <img
                        src={feed.icon}
                        alt=""
                        className="h-4 w-4 rounded-sm shrink-0 object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: feed.color || '#6366f1' }}
                      />
                    )}
                    <span className="truncate font-medium">{feed.title}</span>
                  </button>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    {!feed.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remove subscription to ${feed.title}?`)) {
                            onDeleteFeed(feed.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 transition"
                        title="Unsubscribe"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions & Offline Status */}
        <div className={`border-t p-3 space-y-2 text-xs ${t.border}`}>
          {/* OPML Import / Export */}
          <div className="flex items-center gap-2">
            <button
              onClick={onExportOpml}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-1.5 text-[11px] font-medium transition ${t.border} ${t.cardBg} ${t.textSecondary} hover:${t.textPrimary}`}
              title="Export subscriptions to OPML"
            >
              <Download className="h-3 w-3" />
              <span>Export OPML</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-1.5 text-[11px] font-medium transition ${t.border} ${t.cardBg} ${t.textSecondary} hover:${t.textPrimary}`}
              title="Import OPML feed subscriptions"
            >
              <Upload className="h-3 w-3" />
              <span>Import OPML</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".opml,.xml"
              onChange={onImportOpml}
              className="hidden"
            />
          </div>

          {/* Connectivity & Offline Status Bar */}
          <div className="flex items-center justify-between rounded-xl bg-slate-900/60 p-2 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-[11px] text-slate-300 font-medium">
                {isOnline ? 'Online Sync Active' : 'Offline Mode (Cached)'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              IndexedDB
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
