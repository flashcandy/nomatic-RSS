import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Star, 
  Bookmark, 
  Volume2, 
  Share2, 
  ExternalLink, 
  Sparkles, 
  Check, 
  Tv, 
  Headphones, 
  Zap, 
  Eye, 
  X,
  Play,
  Pause,
  Rss,
  Calendar
} from 'lucide-react';
import { FeedItem, ReaderSettings, FeedTag } from '../types';
import { getThemeClasses, getFontFamilyClass, getFontSizeClass, getLineHeightClass } from '../utils/themeStyles';
import { soundFx } from '../utils/sound';
import { getArticleDateInfo } from '../utils/dateUtils';

interface SwipeDeckViewProps {
  items: FeedItem[];
  settings: ReaderSettings;
  tags: FeedTag[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onToggleReadLater: (id: string, e: React.MouseEvent) => void;
  onToggleRead: (id: string, e: React.MouseEvent) => void;
  onPlayAudio: (item: FeedItem) => void;
  onOpenArticleDetail: (item: FeedItem) => void;
  onOpenSpeedReader: (item: FeedItem) => void;
  onOpenAIModal: (item: FeedItem) => void;
  onClose?: () => void;
}

export const SwipeDeckView: React.FC<SwipeDeckViewProps> = ({
  items,
  settings,
  tags,
  currentIndex,
  onIndexChange,
  onToggleFavorite,
  onToggleReadLater,
  onToggleRead,
  onPlayAudio,
  onOpenArticleDetail,
  onOpenSpeedReader,
  onOpenAIModal,
  onClose,
}) => {
  const t = getThemeClasses(settings.theme);
  const fontCls = getFontFamilyClass(settings.fontFamily);
  const sizeCls = getFontSizeClass(settings.fontSize);
  const lhCls = getLineHeightClass(settings.lineHeight);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [feedIconError, setFeedIconError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentItem = items[currentIndex] || items[0];

  // Auto-mark as read when swiping if setting enabled
  useEffect(() => {
    if (currentItem && settings.autoMarkAsRead && !currentItem.isRead) {
      onToggleRead(currentItem.id, { stopPropagation: () => {} } as any);
    }
    setImgError(false);
    setFeedIconError(false);
  }, [currentIndex, currentItem, settings.autoMarkAsRead]);

  // Keyboard navigation for desktop: Arrow Up/Down, J/K, Spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) return;

      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 's') {
        if (currentItem) onToggleFavorite(currentItem.id, e as any);
      } else if (e.key === 'b') {
        if (currentItem) onToggleReadLater(currentItem.id, e as any);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, items.length, currentItem]);

  const goToNext = () => {
    if (currentIndex < items.length - 1) {
      soundFx.playSwipeDeck();
      onIndexChange(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      soundFx.playSwipeDeck();
      onIndexChange(currentIndex - 1);
    }
  };

  // Touch Swipe handlers for mobile view
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY - touchEndY;

    // Minimum swipe threshold: 45px
    if (diff > 45) {
      // Swiped UP -> Go to Next Feed
      goToNext();
    } else if (diff < -45) {
      // Swiped DOWN -> Go to Previous Feed
      goToPrev();
    }
    setTouchStartY(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 60) {
      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  if (!currentItem) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-slate-400">
        <p>No articles available in this stream.</p>
      </div>
    );
  }

  const hasVideo = currentItem.mediaType === 'video' || !!currentItem.videoUrl;
  const hasValidImage = !!currentItem.imageUrl && !imgError;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      className={`relative flex min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-4.5rem)] w-full flex-col justify-between overflow-hidden select-none pb-16 lg:pb-0 ${t.bg} ${t.textPrimary}`}
    >
      {/* Top Floating Progress Bar - Solid Z-index to prevent overlapping */}
      <div className="sticky top-0 left-0 right-0 z-20 flex items-center justify-between bg-slate-950/90 px-3 sm:px-6 py-2.5 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-slate-300">
            Deck • {currentIndex + 1} / {items.length}
          </span>
        </div>

        {/* Story Progress Bar */}
        <div className="flex items-center gap-1 max-w-[160px] sm:max-w-[240px] flex-1 mx-3">
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[11px] font-mono text-slate-400">
            Swipe Up ↕ or [J/K]
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:text-white transition"
              title="Close Deck View"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Reel Card Canvas */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-3 sm:p-6 lg:p-8 overflow-y-auto">
        <div
          className={`relative flex w-full max-w-2xl flex-col rounded-3xl border shadow-2xl backdrop-blur-2xl transition-all duration-300 overflow-hidden ${t.cardBg} ${t.border}`}
        >
          {/* Media Enclosure: Video or Image */}
          {hasVideo && currentItem.videoUrl ? (
            <div className="relative aspect-video w-full bg-black">
              <video
                ref={videoRef}
                src={currentItem.videoUrl}
                controls
                playsInline
                poster={currentItem.imageUrl}
                className="h-full w-full object-contain"
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
              />
              <div className="absolute top-3 left-3 z-10 rounded-xl bg-rose-600/90 px-2.5 py-1 text-[10px] font-bold text-white shadow backdrop-blur-md">
                IN-APP VIDEO
              </div>
            </div>
          ) : hasValidImage ? (
            <div className="relative isolate h-56 sm:h-72 w-full overflow-hidden bg-slate-950">
              <img
                src={currentItem.imageUrl}
                alt={currentItem.title}
                className="h-full w-full object-cover transition duration-700 hover:scale-105"
                onError={() => setImgError(true)}
              />
              {/* Anti-Overlap Scrim Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 pointer-events-none" />

              {/* Feed Badge Top-Left */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-xl bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md border border-white/15 shadow-sm">
                {currentItem.feedIcon && !feedIconError ? (
                  <img
                    src={currentItem.feedIcon}
                    alt=""
                    className="h-4 w-4 object-contain shrink-0"
                    onError={() => setFeedIconError(true)}
                  />
                ) : (
                  <Rss className="h-4 w-4 text-indigo-400 shrink-0" />
                )}
                <span className="truncate max-w-[200px]">{currentItem.feedTitle}</span>
              </div>

              {/* Category, Upload Date & Read Time Badge Bottom-Left */}
              <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="rounded-xl bg-indigo-600/90 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md shadow-sm uppercase">
                  {currentItem.category || 'RELEASE'}
                </span>
                {(() => {
                  const dInfo = getArticleDateInfo(currentItem.pubDate, currentItem.timestamp);
                  return (
                    <span 
                      className="rounded-xl bg-slate-950/80 px-2.5 py-1 text-[10px] font-medium text-slate-200 backdrop-blur-md border border-white/15 inline-flex items-center gap-1"
                      title={`Uploaded: ${dInfo.formattedDateTime}`}
                    >
                      <Calendar className="h-3 w-3 text-indigo-400" />
                      <span>{dInfo.relative}</span>
                    </span>
                  );
                })()}
                <span className="rounded-xl bg-slate-950/80 px-2.5 py-1 text-[10px] font-medium text-slate-200 backdrop-blur-md border border-white/15">
                  {currentItem.readingTimeMinutes} min read
                </span>
              </div>
            </div>
          ) : (
            /* Fallback Header if no media image */
            <div className="flex items-center justify-between p-5 pb-0">
              <div className="flex items-center gap-2 rounded-xl bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-indigo-300 border border-slate-700/60">
                <Rss className="h-4 w-4 text-indigo-400 shrink-0" />
                <span className="truncate">{currentItem.feedTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const dInfo = getArticleDateInfo(currentItem.pubDate, currentItem.timestamp);
                  return (
                    <span 
                      className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 border border-slate-700/60 inline-flex items-center gap-1"
                      title={`Uploaded: ${dInfo.formattedDateTime}`}
                    >
                      <Calendar className="h-3 w-3 text-indigo-400" />
                      <span>{dInfo.relative}</span>
                    </span>
                  );
                })()}
                <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  {currentItem.category || 'Software'}
                </span>
              </div>
            </div>
          )}

          {/* Article Story Body */}
          <div className="p-5 sm:p-7 space-y-4">
            {/* Title */}
            <h1
              className={`font-bold text-lg sm:text-2xl tracking-tight leading-snug cursor-pointer transition ${fontCls} hover:${t.accent}`}
              onClick={() => onOpenArticleDetail(currentItem)}
            >
              {currentItem.title}
            </h1>

            {/* Description / Story Snippet */}
            <p className={`text-xs sm:text-sm leading-relaxed ${t.textSecondary} ${sizeCls} ${lhCls}`}>
              {currentItem.description}
            </p>

            {/* Tags Row */}
            {currentItem.tags && currentItem.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentItem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-800/90 px-2.5 py-1 text-xs font-medium text-slate-300 border border-slate-700/60"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* AI Summary Highlight Box */}
            {currentItem.aiSummary && (
              <div className="rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-pink-950/40 p-3.5 sm:p-4 border border-indigo-500/30">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span>Executive AI Summary</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{currentItem.aiSummary}</p>
              </div>
            )}

            {/* Action Bar inside Deck Card */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4 border-t border-inherit">
              <div className="flex items-center gap-2">
                {/* Full Article Reader */}
                <button
                  onClick={() => onOpenArticleDetail(currentItem)}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition active:scale-95"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Read Story</span>
                </button>

                {/* Speed Reader RSVP */}
                <button
                  onClick={() => onOpenSpeedReader(currentItem)}
                  className="flex items-center gap-1 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition active:scale-95"
                  title="Speed Read at 350 WPM"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">RSVP Read</span>
                </button>

                {/* Text-To-Speech Listen */}
                <button
                  onClick={() => onPlayAudio(currentItem)}
                  className="flex items-center gap-1 rounded-xl border border-purple-500/30 bg-purple-500/10 px-2.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition active:scale-95"
                  title="Listen with TTS"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Listen</span>
                </button>
              </div>

              {/* Right Side Quick Toggles */}
              <div className="flex items-center gap-1.5">
                {/* AI Analysis */}
                <button
                  onClick={() => onOpenAIModal(currentItem)}
                  className="rounded-xl border border-purple-500/40 bg-purple-500/10 p-2 text-purple-300 hover:bg-purple-500/20 transition active:scale-95"
                  title="AI Insights"
                >
                  <Sparkles className="h-4 w-4" />
                </button>

                {/* Favorite */}
                <button
                  onClick={(e) => {
                    soundFx.playPop();
                    onToggleFavorite(currentItem.id, e);
                  }}
                  className={`rounded-xl p-2 transition active:scale-95 ${
                    currentItem.isFavorite
                      ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                      : 'border border-slate-700 text-slate-400 hover:text-amber-400'
                  }`}
                  title="Favorite"
                >
                  <Star className={`h-4 w-4 ${currentItem.isFavorite ? 'fill-amber-400' : ''}`} />
                </button>

                {/* Read Later */}
                <button
                  onClick={(e) => {
                    soundFx.playPop();
                    onToggleReadLater(currentItem.id, e);
                  }}
                  className={`rounded-xl p-2 transition active:scale-95 ${
                    currentItem.isReadLater
                      ? 'bg-purple-400/20 text-purple-400 border border-purple-400/40'
                      : 'border border-slate-700 text-slate-400 hover:text-purple-400'
                  }`}
                  title="Read Later"
                >
                  <Bookmark className={`h-4 w-4 ${currentItem.isReadLater ? 'fill-purple-400' : ''}`} />
                </button>

                {/* External Link */}
                {currentItem.link && (
                  <a
                    href={currentItem.link}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-700 p-2 text-slate-400 hover:text-white transition"
                    title="Open in Browser"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Swipe Controls for Desktop */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-3">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/80 text-white shadow-xl backdrop-blur-xl transition hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          title="Previous Story (Up Arrow / K)"
        >
          <ChevronUp className="h-6 w-6" />
        </button>

        <button
          onClick={goToNext}
          disabled={currentIndex === items.length - 1}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 backdrop-blur-xl transition hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          title="Next Story (Down Arrow / J / Space)"
        >
          <ChevronDown className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Swipe Navigation Floating Pill */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-gradient-to-t from-black/90 to-transparent">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 rounded-xl bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 disabled:opacity-30"
        >
          <ChevronUp className="h-4 w-4" />
          <span>Prev</span>
        </button>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
          <span>Swipe Up For Next</span>
        </div>

        <button
          onClick={goToNext}
          disabled={currentIndex === items.length - 1}
          className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow disabled:opacity-30"
        >
          <span>Next</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
