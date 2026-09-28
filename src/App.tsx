import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  FeedItem, 
  FeedSource, 
  FeedCategory, 
  FeedTag, 
  ReaderSettings, 
  NotificationSettings, 
  OpenRouterConfig 
} from './types';
import { 
  loadInitialData, 
  saveFeeds, 
  saveItems, 
  saveCategories, 
  saveTags, 
  saveSettings, 
  saveNotificationSettings, 
  saveOpenRouterConfig,
  exportOpml
} from './utils/storage';
import { fetchAndParseFeed, parseFeedXmlString } from './utils/rssParser';
import { getThemeClasses } from './utils/themeStyles';
import { soundFx } from './utils/sound';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useNotifications } from './hooks/useNotifications';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FeedCard } from './components/FeedCard';
import { SwipeDeckView } from './components/SwipeDeckView';
import { ArticleDetailModal } from './components/ArticleDetailModal';
import { MediaPlayer } from './components/MediaPlayer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AddFeedModal } from './components/AddFeedModal';
import { TagManagerModal } from './components/TagManagerModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { OpenRouterSettingsModal } from './components/OpenRouterSettingsModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { SpeedReaderModal } from './components/SpeedReaderModal';
import { 
  Rss, 
  Inbox, 
  Star, 
  Bookmark, 
  Sparkles, 
  Plus, 
  Tv, 
  Headphones, 
  RefreshCw, 
  SlidersHorizontal,
  WifiOff,
  History,
  Trash2,
  RotateCcw
} from 'lucide-react';

export default function App() {
  const initial = useMemo(() => loadInitialData(), []);

  // Main Persistent State
  const [feeds, setFeeds] = useState<FeedSource[]>(initial.feeds);
  const [items, setItems] = useState<FeedItem[]>(initial.items);
  const [categories, setCategories] = useState<FeedCategory[]>(initial.categories);
  const [tags, setTags] = useState<FeedTag[]>(initial.tags);
  const [settings, setSettings] = useState<ReaderSettings>(initial.settings);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(initial.notifSettings);
  const [openRouterConfig, setOpenRouterConfig] = useState<OpenRouterConfig>(initial.openRouterConfig);

  // Active UI Navigation & Filters
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [swipeDeckIndex, setSwipeDeckIndex] = useState<number>(0);

  // Active Modals
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeArticle, setActiveArticle] = useState<FeedItem | null>(null);
  const [speedReaderItem, setSpeedReaderItem] = useState<FeedItem | null>(null);
  const [showAddFeedModal, setShowAddFeedModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showOpenRouterModal, setShowOpenRouterModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Syncing state
  const [isSyncing, setIsSyncing] = useState(false);

  // Connectivity & Custom Hooks
  const isOnline = useOnlineStatus();
  const { speak, pause, resume, stop, isSpeaking, isPaused, currentSentence, currentArticle } = useSpeechSynthesis();
  const {
    permission: notifPermission,
    requestPermission: requestNotifPermission,
    sendNotification,
    notifyNewItems,
    notificationHistory,
    clearHistory: clearNotifHistory,
  } = useNotifications(notifSettings);

  const t = getThemeClasses(settings.theme);

  // Synchronize state changes to localStorage
  useEffect(() => {
    saveFeeds(feeds);
  }, [feeds]);

  useEffect(() => {
    saveItems(items);
  }, [items]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveTags(tags);
  }, [tags]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveNotificationSettings(notifSettings);
  }, [notifSettings]);

  useEffect(() => {
    saveOpenRouterConfig(openRouterConfig);
  }, [openRouterConfig]);

  // Periodic background feed sync
  useEffect(() => {
    if (!notifSettings.enabled && !notifSettings.checkIntervalMinutes) return;

    const intervalMs = (notifSettings.checkIntervalMinutes || 5) * 60 * 1000;
    const interval = setInterval(() => {
      refreshAllFeeds(false);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [notifSettings.checkIntervalMinutes, feeds]);

  // Refresh All Subscribed Feeds
  const refreshAllFeeds = useCallback(
    async (showFeedback = true) => {
      if (!isOnline) return;
      setIsSyncing(true);

      const updatedFeeds = [...feeds];
      let newItemsFound: FeedItem[] = [];

      for (let i = 0; i < updatedFeeds.length; i++) {
        const feed = updatedFeeds[i];
        try {
          const result = await fetchAndParseFeed(feed.url, feed.category, feed.customTags);
          updatedFeeds[i] = {
            ...feed,
            lastFetched: Date.now(),
            syncStatus: 'success',
            itemCount: result.items.length,
          };

          // Find items that don't already exist
          const existingGuids = new Set(items.map((it) => it.guid));
          const trulyNew = result.items.filter((it) => !existingGuids.has(it.guid));
          if (trulyNew.length > 0) {
            newItemsFound = [...newItemsFound, ...trulyNew];
          }
        } catch (e) {
          updatedFeeds[i] = { ...feed, syncStatus: 'error' };
        }
      }

      setFeeds(updatedFeeds);

      if (newItemsFound.length > 0) {
        setItems((prev) => [...newItemsFound, ...prev]);
        notifyNewItems(newItemsFound);
      }

      setIsSyncing(false);
      if (showFeedback && newItemsFound.length === 0) {
        soundFx.playPop();
      }
    },
    [feeds, isOnline, items, notifyNewItems]
  );

  // Filter and Search Articles
  const filteredItems = useMemo(() => {
    const matched = items.filter((item) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesAuthor = item.author?.toLowerCase().includes(q);
        const matchesFeed = item.feedTitle.toLowerCase().includes(q);
        const matchesTags = item.tags?.some((tg) => tg.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesAuthor && !matchesFeed && !matchesTags) {
          return false;
        }
      }

      // 2. Feed Source filter
      if (selectedFeedId && item.feedId !== selectedFeedId) {
        return false;
      }

      // 3. Category filter
      if (selectedCategory && item.category !== selectedCategory) {
        return false;
      }

      // 4. Tag filter
      if (selectedTag) {
        const hasTag = item.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
        if (!hasTag) return false;
      }

      // 5. Main navigation views
      if (selectedFilter === 'unread' && item.isRead) return false;
      if (selectedFilter === 'history' && !item.isRead) return false;
      if (selectedFilter === 'favorites' && !item.isFavorite) return false;
      if (selectedFilter === 'readLater' && !item.isReadLater) return false;
      if (selectedFilter === 'media-video' && item.mediaType !== 'video' && !item.videoUrl) return false;
      if (selectedFilter === 'media-audio' && item.mediaType !== 'audio' && !item.audioUrl) return false;

      return true;
    });

    // If viewing reading history, sort by most recently read first
    if (selectedFilter === 'history') {
      return [...matched].sort((a, b) => {
        const timeA = a.readAt || a.timestamp;
        const timeB = b.readAt || b.timestamp;
        return timeB - timeA;
      });
    }

    return matched;
  }, [items, searchQuery, selectedFeedId, selectedCategory, selectedTag, selectedFilter]);

  // Counts for Badges
  const unreadCount = useMemo(() => items.filter((it) => !it.isRead).length, [items]);
  const historyCount = useMemo(() => items.filter((it) => it.isRead).length, [items]);
  const favoriteCount = useMemo(() => items.filter((it) => it.isFavorite).length, [items]);
  const readLaterCount = useMemo(() => items.filter((it) => it.isReadLater).length, [items]);

  // Actions
  const handleOpenArticle = (item: FeedItem) => {
    setActiveArticle(item);
    // Mark as read and record readAt timestamp
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, isRead: true, readAt: it.readAt || Date.now() } : it))
    );
  };

  const handleClearHistory = () => {
    if (historyCount === 0) return;
    if (window.confirm(`Clear Reading History?\n\nThis will reset ${historyCount} previously read articles back to unread status.`)) {
      setItems((prev) => prev.map((it) => (it.isRead ? { ...it, isRead: false, readAt: undefined } : it)));
      soundFx.playPop();
    }
  };

  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const nextState = !it.isFavorite;
          if (nextState) {
            confetti({
              particleCount: 25,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#fbbf24', '#f59e0b', '#6366f1'],
            });
          }
          return { ...it, isFavorite: nextState };
        }
        return it;
      })
    );
  };

  const handleToggleReadLater = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isReadLater: !it.isReadLater } : it))
    );
  };

  const handleToggleRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isRead: !it.isRead, readAt: !it.isRead ? Date.now() : undefined } : it))
    );
  };

  const handleMarkAllAsRead = () => {
    soundFx.playPop();
    const now = Date.now();
    setItems((prev) => prev.map((it) => ({ ...it, isRead: true, readAt: it.readAt || now })));
  };

  const handlePlayAudio = (item: FeedItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isSpeaking && currentArticle?.id === item.id) {
      if (isPaused) resume();
      else pause();
    } else {
      speak(item, settings.ttsRate, settings.ttsVoiceIndex);
    }
  };

  const handleAddFeed = async (feedUrl: string, categoryId: string, customTags: string[]) => {
    const result = await fetchAndParseFeed(feedUrl, categoryId, customTags);
    
    // Check if feed already exists
    const existingIdx = feeds.findIndex((f) => f.url === feedUrl);
    if (existingIdx >= 0) {
      setFeeds((prev) => {
        const next = [...prev];
        next[existingIdx] = result.feed;
        return next;
      });
    } else {
      setFeeds((prev) => [result.feed, ...prev]);
    }

    // Merge new items avoiding duplicate guids
    const existingGuids = new Set(items.map((it) => it.guid));
    const newItems = result.items.filter((it) => !existingGuids.has(it.guid));
    setItems((prev) => [...newItems, ...prev]);

    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleDeleteFeed = (feedId: string) => {
    setFeeds((prev) => prev.filter((f) => f.id !== feedId));
    setItems((prev) => prev.filter((it) => it.feedId !== feedId));
    if (selectedFeedId === feedId) setSelectedFeedId(null);
  };

  const handleAddTagToItem = (itemId: string, tagName: string) => {
    const formatted = tagName.toLowerCase().trim();
    if (!formatted) return;

    // Check if tag exists in system
    if (!tags.some((t) => t.name.toLowerCase() === formatted)) {
      setTags((prev) => [...prev, { id: `tag-${Date.now()}`, name: formatted, color: '#818cf8' }]);
    }

    setItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId && !it.tags.includes(formatted)) {
          return { ...it, tags: [...it.tags, formatted] };
        }
        return it;
      })
    );
  };

  const handleRemoveTagFromItem = (itemId: string, tagName: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          return { ...it, tags: it.tags.filter((t) => t !== tagName) };
        }
        return it;
      })
    );
  };

  // OPML Export & Import
  const handleExportOpml = () => {
    const xml = exportOpml(feeds);
    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-rss-subscriptions-${new Date().toISOString().slice(0, 10)}.opml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportOpml = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/xml');
        const outlines = doc.querySelectorAll('outline[xmlUrl], outline[xmlurl]');

        let importedCount = 0;
        for (const outline of Array.from(outlines)) {
          const url = outline.getAttribute('xmlUrl') || outline.getAttribute('xmlurl');
          const title = outline.getAttribute('title') || outline.getAttribute('text') || 'Imported Feed';
          const cat = outline.getAttribute('category') || 'software';

          if (url && !feeds.some((f) => f.url === url)) {
            try {
              await handleAddFeed(url, cat, ['imported']);
              importedCount++;
            } catch (err) {}
          }
        }

        alert(`Successfully imported ${importedCount} RSS feeds from OPML file!`);
      } catch (err) {
        alert('Invalid OPML file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${t.bg} ${t.textPrimary}`}>
      {/* Top Header */}
      <Header
        settings={settings}
        onUpdateSettings={(up) => setSettings((prev) => ({ ...prev, ...up }))}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddFeed={() => setShowAddFeedModal(true)}
        onOpenThemeCustomizer={() => setShowThemeModal(true)}
        onOpenOpenRouterModal={() => setShowOpenRouterModal(true)}
        onOpenNotificationsModal={() => setShowNotifModal(true)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onRefreshAllFeeds={() => refreshAllFeeds(true)}
        onMarkAllAsRead={handleMarkAllAsRead}
        isSyncing={isSyncing}
        unreadCount={unreadCount}
        favoriteCount={favoriteCount}
        readLaterCount={readLaterCount}
        hasAudioPlaying={isSpeaking}
        onOpenTagManager={() => setShowTagModal(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex w-full">
        {/* Left Navigation Sidebar */}
        <Sidebar
          feeds={feeds}
          categories={categories}
          tags={tags}
          selectedFilter={selectedFilter}
          onSelectFilter={setSelectedFilter}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          selectedFeedId={selectedFeedId}
          onSelectFeed={setSelectedFeedId}
          settings={settings}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenAddFeed={() => setShowAddFeedModal(true)}
          onOpenCategoryManager={() => setShowCategoryModal(true)}
          onOpenTagManager={() => setShowTagModal(true)}
          onDeleteFeed={handleDeleteFeed}
          onExportOpml={handleExportOpml}
          onImportOpml={handleImportOpml}
          unreadCount={unreadCount}
          historyCount={historyCount}
          favoriteCount={favoriteCount}
          readLaterCount={readLaterCount}
          isOnline={isOnline}
        />

        {/* Content Stream View */}
        <main className="flex-1 min-w-0 pb-20">
          {/* Active Filter Bar / Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-8 pt-6 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="font-extrabold text-xl lg:text-2xl tracking-tight text-white capitalize flex items-center gap-2">
                {selectedFilter === 'history' && <History className="h-6 w-6 text-emerald-400 shrink-0" />}
                {selectedTag
                  ? `#${selectedTag}`
                  : selectedCategory
                  ? categories.find((c) => c.id === selectedCategory)?.name || 'Category'
                  : selectedFeedId
                  ? feeds.find((f) => f.id === selectedFeedId)?.title || 'Feed Stream'
                  : selectedFilter === 'favorites'
                  ? 'Favorite Bookmarks'
                  : selectedFilter === 'readLater'
                  ? 'Read Later Queue'
                  : selectedFilter === 'unread'
                  ? 'Unread Stories'
                  : selectedFilter === 'history'
                  ? 'Reading History'
                  : selectedFilter === 'media-video'
                  ? 'Video Releases & Streams'
                  : selectedFilter === 'media-audio'
                  ? 'Audio Releases & Podcasts'
                  : 'All Feeds & Releases'}
              </h1>
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-300 border border-slate-700">
                {filteredItems.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Clear History Button in History Tab */}
              {selectedFilter === 'history' && historyCount > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition active:scale-95"
                  title="Clear reading history and reset to unread"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear History</span>
                </button>
              )}

              {/* Quick Switch to Swipe Deck view */}
              {settings.viewMode !== 'swipe-deck' && filteredItems.length > 0 && (
                <button
                  onClick={() => setSettings((prev) => ({ ...prev, viewMode: 'swipe-deck' }))}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 transition"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Swipe Deck Mode</span>
                </button>
              )}
            </div>
          </div>

          {/* Swipe Deck Mode OR Grid / Card / Magazine Mode */}
          {settings.viewMode === 'swipe-deck' ? (
            <SwipeDeckView
              items={filteredItems}
              settings={settings}
              tags={tags}
              currentIndex={swipeDeckIndex}
              onIndexChange={setSwipeDeckIndex}
              onToggleFavorite={handleToggleFavorite}
              onToggleReadLater={handleToggleReadLater}
              onToggleRead={handleToggleRead}
              onPlayAudio={handlePlayAudio}
              onOpenArticleDetail={handleOpenArticle}
              onOpenSpeedReader={setSpeedReaderItem}
              onOpenAIModal={(item) => {
                handleOpenArticle(item);
              }}
              onClose={() => setSettings((prev) => ({ ...prev, viewMode: 'cards' }))}
            />
          ) : (
            <div className="px-4 lg:px-8 py-4 pb-28 sm:pb-12">
              {filteredItems.length === 0 ? (
                <div className="flex h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-400 mb-3">
                    {selectedFilter === 'history' ? <History className="h-6 w-6 text-emerald-400" /> : <Inbox className="h-6 w-6" />}
                  </div>
                  <h3 className="font-bold text-base text-white">
                    {selectedFilter === 'history' ? 'No reading history yet' : 'No stories found'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    {selectedFilter === 'history'
                      ? 'Articles and stories you open or mark as read will appear here so you can revisit them anytime.'
                      : searchQuery
                      ? `No articles match "${searchQuery}". Try a different keyword or reset tags.`
                      : 'You are all caught up! Subscribe to new RSS feeds or reset filters.'}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                      setSelectedTag(null);
                      setSelectedFilter('all');
                      setSelectedFeedId(null);
                    }}
                    className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div
                  className={`grid gap-4 ${
                    settings.viewMode === 'compact'
                      ? 'grid-cols-1'
                      : settings.viewMode === 'magazine'
                      ? 'grid-cols-1'
                      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                  }`}
                >
                  {filteredItems.map((item) => (
                    <FeedCard
                      key={item.id}
                      item={item}
                      settings={settings}
                      tags={tags}
                      onSelectArticle={handleOpenArticle}
                      onToggleFavorite={handleToggleFavorite}
                      onToggleReadLater={handleToggleReadLater}
                      onToggleRead={handleToggleRead}
                      onPlayAudio={handlePlayAudio}
                      onQuickAIInsight={(item) => handleOpenArticle(item)}
                      onTagClick={(tag) => setSelectedTag(tag)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Global Media Player for Audio / Podcasts / Text-to-Speech */}
      <MediaPlayer
        item={currentArticle}
        isPlaying={isSpeaking && !isPaused}
        isPaused={isPaused}
        currentSentence={currentSentence}
        isTTS={true}
        onPlayPause={() => {
          if (isPaused) resume();
          else pause();
        }}
        onStop={stop}
        playbackRate={settings.ttsRate}
        onSpeedChange={(rate) => setSettings((prev) => ({ ...prev, ttsRate: rate }))}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentFilter={selectedFilter}
        onSelectFilter={(filter) => {
          setSelectedFilter(filter);
          setSelectedCategory(null);
          setSelectedTag(null);
          setSelectedFeedId(null);
        }}
        settings={settings}
        onUpdateSettings={(up) => setSettings((prev) => ({ ...prev, ...up }))}
        onOpenAddFeed={() => setShowAddFeedModal(true)}
        onOpenTagManager={() => setShowTagModal(true)}
        onOpenThemeCustomizer={() => setShowThemeModal(true)}
        unreadCount={items.filter((i) => !i.isRead).length}
        favoriteCount={items.filter((i) => i.isFavorite).length}
      />

      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-2xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xl animate-in slide-in-from-bottom-2">
          <WifiOff className="h-4 w-4" />
          <span>Offline Mode — Full offline cached reading active</span>
        </div>
      )}

      {/* Modals */}
      {activeArticle && (
        <ArticleDetailModal
          item={activeArticle}
          settings={settings}
          tags={tags}
          openRouterConfig={openRouterConfig}
          onClose={() => setActiveArticle(null)}
          onToggleFavorite={handleToggleFavorite}
          onToggleReadLater={handleToggleReadLater}
          onPlayAudio={handlePlayAudio}
          onAddTagToItem={handleAddTagToItem}
          onRemoveTagFromItem={handleRemoveTagFromItem}
          onOpenSpeedReader={(item) => setSpeedReaderItem(item)}
          onOpenOpenRouterModal={() => setShowOpenRouterModal(true)}
        />
      )}

      {speedReaderItem && (
        <SpeedReaderModal
          item={speedReaderItem}
          onClose={() => setSpeedReaderItem(null)}
        />
      )}

      {showAddFeedModal && (
        <AddFeedModal
          categories={categories}
          tags={tags}
          onClose={() => setShowAddFeedModal(false)}
          onFeedAdded={handleAddFeed}
        />
      )}

      {showTagModal && (
        <TagManagerModal
          tags={tags}
          items={items}
          onClose={() => setShowTagModal(false)}
          onAddTag={(name, color) => {
            setTags((prev) => [...prev, { id: `tag-${Date.now()}`, name, color }]);
          }}
          onUpdateTag={(id, name, color) => {
            setTags((prev) =>
              prev.map((tg) => (tg.id === id ? { ...tg, name, color } : tg))
            );
          }}
          onDeleteTag={(id) => {
            setTags((prev) => prev.filter((tg) => tg.id !== id));
          }}
          onFilterByTag={(tagName) => {
            setSelectedTag(tagName);
            setSelectedFilter('all');
            setSelectedCategory(null);
          }}
        />
      )}

      {showCategoryModal && (
        <CategoryManagerModal
          categories={categories}
          onClose={() => setShowCategoryModal(false)}
          onAddCategory={(name, color) => {
            setCategories((prev) => [
              ...prev,
              { id: `cat-${Date.now()}`, name, color, icon: 'Folder' },
            ]);
          }}
          onDeleteCategory={(id) => {
            setCategories((prev) => prev.filter((c) => c.id !== id));
          }}
        />
      )}

      {showThemeModal && (
        <ThemeCustomizerModal
          settings={settings}
          onUpdateSettings={(up) => setSettings((prev) => ({ ...prev, ...up }))}
          onClose={() => setShowThemeModal(false)}
        />
      )}

      {showOpenRouterModal && (
        <OpenRouterSettingsModal
          config={openRouterConfig}
          onSaveConfig={setOpenRouterConfig}
          onClose={() => setShowOpenRouterModal(false)}
        />
      )}

      {showNotifModal && (
        <NotificationSettingsModal
          settings={notifSettings}
          permission={notifPermission}
          onUpdateSettings={(up) => setNotifSettings((prev) => ({ ...prev, ...up }))}
          onRequestPermission={requestNotifPermission}
          onSendTestNotification={() => {
            sendNotification('nomatic RSS Notification Test', {
              body: 'Push alerts & background updates are configured and functioning properly!',
            });
          }}
          notificationHistory={notificationHistory}
          onClearHistory={clearNotifHistory}
          onClose={() => setShowNotifModal(false)}
        />
      )}
    </div>
  );
}
