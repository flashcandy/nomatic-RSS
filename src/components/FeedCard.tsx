import React, { useState } from 'react';
import { 
  Star, 
  Bookmark, 
  Volume2, 
  Tv, 
  Headphones, 
  Sparkles, 
  ExternalLink, 
  Clock, 
  Calendar,
  Tag as TagIcon, 
  Check, 
  Share2,
  Play,
  Rss
} from 'lucide-react';
import { FeedItem, ReaderSettings, FeedTag } from '../types';
import { getThemeClasses, getFontFamilyClass } from '../utils/themeStyles';
import { soundFx } from '../utils/sound';
import { getArticleDateInfo, getRelativeTime } from '../utils/dateUtils';

interface FeedCardProps {
  item: FeedItem;
  settings: ReaderSettings;
  tags: FeedTag[];
  onSelectArticle: (item: FeedItem) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onToggleReadLater: (id: string, e: React.MouseEvent) => void;
  onToggleRead: (id: string, e: React.MouseEvent) => void;
  onPlayAudio: (item: FeedItem, e: React.MouseEvent) => void;
  onQuickAIInsight: (item: FeedItem, e: React.MouseEvent) => void;
  onTagClick?: (tagName: string, e: React.MouseEvent) => void;
}

export const FeedCard: React.FC<FeedCardProps> = ({
  item,
  settings,
  tags,
  onSelectArticle,
  onToggleFavorite,
  onToggleReadLater,
  onToggleRead,
  onPlayAudio,
  onQuickAIInsight,
  onTagClick,
}) => {
  const t = getThemeClasses(settings.theme);
  const fontCls = getFontFamilyClass(settings.fontFamily);
  const [imgError, setImgError] = useState(false);
  const [feedIconError, setFeedIconError] = useState(false);

  const isCompact = settings.viewMode === 'compact';
  const isMagazine = settings.viewMode === 'magazine';
  const hasValidImage = !!item.imageUrl && !imgError;
  const dateInfo = getArticleDateInfo(item.pubDate, item.timestamp);

  if (isCompact) {
    return (
      <div
        onClick={() => onSelectArticle(item)}
        className={`group relative flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all duration-200 cursor-pointer ${
          t.cardBg
        } ${t.cardHover} ${t.border} ${
          item.isRead ? 'opacity-70' : 'opacity-100'
        } shadow-sm`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Read status toggle dot */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleRead(item.id, e);
            }}
            className="shrink-0 p-1 text-slate-500 hover:text-indigo-400 transition"
            title={item.isRead ? 'Mark as unread' : 'Mark as read'}
          >
            <span
              className={`block h-2.5 w-2.5 rounded-full transition ${
                item.isRead ? 'border border-slate-600 bg-transparent' : 'bg-indigo-500 ring-2 ring-indigo-500/30'
              }`}
            />
          </button>

          {/* Thumbnail preview with fallback protection */}
          {hasValidImage ? (
            <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-900 border border-white/5">
              <img
                src={item.imageUrl}
                alt=""
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                loading="lazy"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 text-indigo-400 border border-slate-700/50">
              <Rss className="h-5 w-5" />
            </div>
          )}

          {/* Title & metadata with Upload Date */}
          <div className="min-w-0 flex-1">
            <h3
              className={`truncate font-semibold text-xs sm:text-sm transition ${
                item.isRead ? t.textSecondary : t.textPrimary
              } group-hover:${t.accent} ${fontCls}`}
            >
              {item.title}
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 text-[11px] text-slate-400 truncate">
              <span className="truncate font-medium text-indigo-400">{item.feedTitle}</span>
              <span>•</span>
              <span className="flex items-center gap-1 shrink-0 text-slate-300 font-medium" title={`Uploaded: ${dateInfo.formattedDateTime}`}>
                <Calendar className="h-3 w-3 text-indigo-400" />
                {dateInfo.relative}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:flex items-center gap-1 shrink-0">
                <Clock className="h-3 w-3" />
                {item.readingTimeMinutes}m read
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              soundFx.playPop();
              onToggleFavorite(item.id, e);
            }}
            className={`p-2 rounded-xl transition ${
              item.isFavorite
                ? 'text-amber-400 bg-amber-400/10'
                : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800/60'
            }`}
            title="Favorite"
          >
            <Star className={`h-4 w-4 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              soundFx.playPop();
              onToggleReadLater(item.id, e);
            }}
            className={`p-2 rounded-xl transition ${
              item.isReadLater
                ? 'text-purple-400 bg-purple-400/10'
                : 'text-slate-500 hover:text-purple-400 hover:bg-slate-800/60'
            }`}
            title="Read Later"
          >
            <Bookmark className={`h-4 w-4 ${item.isReadLater ? 'fill-purple-400' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <article
      onClick={() => onSelectArticle(item)}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border transition-all duration-300 cursor-pointer ${
        t.cardBg
      } ${t.cardHover} ${t.border} ${
        item.isRead ? 'opacity-80' : 'opacity-100'
      } ${isMagazine ? 'md:grid md:grid-cols-12 md:gap-6' : ''} shadow-md hover:shadow-xl hover:-translate-y-0.5`}
    >
      {/* Top / Left Media Enclosure */}
      {hasValidImage && (
        <div
          className={`relative isolate overflow-hidden bg-slate-950 ${
            isMagazine ? 'md:col-span-5 h-48 md:h-full min-h-[180px]' : 'h-48 sm:h-52 w-full'
          }`}
        >
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
          {/* Contrast scrim overlay to keep badges completely legible */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/30 pointer-events-none" />

          {/* Top Media Type Badge */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-xl bg-slate-950/80 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md border border-white/15 shadow-sm">
            {item.mediaType === 'video' ? (
              <>
                <Tv className="h-3 w-3 text-rose-400 shrink-0" />
                <span>VIDEO</span>
              </>
            ) : item.mediaType === 'audio' ? (
              <>
                <Headphones className="h-3 w-3 text-emerald-400 shrink-0" />
                <span>AUDIO</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                <span>RELEASE</span>
              </>
            )}
          </div>

          {/* Bottom Feed Source Chip */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-xl bg-slate-950/85 px-2.5 py-1 text-[11px] font-semibold text-slate-100 backdrop-blur-md border border-white/15 max-w-[85%] shadow-sm">
            {item.feedIcon && !feedIconError ? (
              <img
                src={item.feedIcon}
                alt=""
                className="h-3.5 w-3.5 object-contain shrink-0 rounded-sm"
                onError={() => setFeedIconError(true)}
              />
            ) : (
              <Rss className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            )}
            <span className="truncate">{item.feedTitle}</span>
          </div>
        </div>
      )}

      {/* Fallback Banner if no image */}
      {!hasValidImage && (
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <div className="flex items-center gap-2 rounded-xl bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-indigo-300 border border-slate-700/60">
            {item.feedIcon && !feedIconError ? (
              <img
                src={item.feedIcon}
                alt=""
                className="h-3.5 w-3.5 object-contain shrink-0"
                onError={() => setFeedIconError(true)}
              />
            ) : (
              <Rss className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            )}
            <span className="truncate max-w-[180px]">{item.feedTitle}</span>
          </div>
          <span className="rounded-lg bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
            {item.category || 'Software'}
          </span>
        </div>
      )}

      {/* Article Content Details */}
      <div className={`flex flex-1 flex-col justify-between p-4 sm:p-5 ${isMagazine ? 'md:col-span-7' : ''}`}>
        <div className="space-y-2.5">
          {/* Header metadata row */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[10px]">
                {item.category || 'Software'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-300 font-medium" title={`Uploaded: ${dateInfo.formattedDateTime}`}>
                <Calendar className="h-3 w-3 text-indigo-400/80" />
                <span>{dateInfo.relative}</span>
              </span>
              <span className="hidden xs:inline">•</span>
              <span className="hidden xs:flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.readingTimeMinutes} min read
              </span>
            </div>

            {/* Offline cache & Read history badges */}
            <div className="flex items-center gap-1.5 shrink-0">
              {item.isRead && (
                <span 
                  className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1"
                  title={item.readAt ? `Read ${getRelativeTime(new Date(item.readAt))}` : 'Marked as read'}
                >
                  <Check className="h-2.5 w-2.5 text-emerald-400" />
                  <span>{item.readAt ? `Read ${getRelativeTime(new Date(item.readAt))}` : 'Read'}</span>
                </span>
              )}
              {item.cachedOffline && (
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400 border border-emerald-500/20">
                  OFFLINE READY
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h2
            className={`font-bold text-base sm:text-lg tracking-tight leading-snug transition-colors line-clamp-2 ${
              item.isRead ? t.textSecondary : t.textPrimary
            } group-hover:${t.accent} ${fontCls}`}
          >
            {item.title}
          </h2>

          {/* Description snippet */}
          <p className={`text-xs sm:text-sm line-clamp-3 leading-relaxed ${t.textSecondary}`}>
            {item.description || 'Click to read full article content...'}
          </p>

          {/* Tag Badges */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.tags.slice(0, 4).map((tag) => {
                const tagMeta = tags.find((tg) => tg.name.toLowerCase() === tag.toLowerCase());
                const color = tagMeta?.color || '#818cf8';
                return (
                  <button
                    key={tag}
                    onClick={(e) => {
                      if (onTagClick) {
                        e.stopPropagation();
                        onTagClick(tag, e);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 hover:bg-slate-700/80 border border-slate-700/50 transition active:scale-95"
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                    #{tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Actions Row */}
        <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {/* Play Audio / TTS Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlayAudio(item, e);
              }}
              className="flex items-center gap-1 rounded-xl bg-indigo-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-400 hover:bg-indigo-500/20 transition border border-indigo-500/20 active:scale-95"
              title="Listen with Text-to-Speech"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Listen</span>
            </button>

            {/* AI Summary Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAIInsight(item, e);
              }}
              className="flex items-center gap-1 rounded-xl bg-purple-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-purple-300 hover:bg-purple-500/20 transition border border-purple-500/20 active:scale-95"
              title="AI 3-Bullet Summary & Insights"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span className="hidden xs:inline">AI</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* Mark as Read / Unread */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleRead(item.id, e);
              }}
              className={`p-2 rounded-xl transition active:scale-95 ${
                item.isRead ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-slate-300'
              }`}
              title={item.isRead ? 'Mark unread' : 'Mark read'}
            >
              <Check className="h-4 w-4" />
            </button>

            {/* Favorite / Bookmark Star */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundFx.playPop();
                onToggleFavorite(item.id, e);
              }}
              className={`p-2 rounded-xl transition active:scale-95 ${
                item.isFavorite
                  ? 'text-amber-400 bg-amber-400/10'
                  : 'text-slate-500 hover:text-amber-400'
              }`}
              title="Favorite"
            >
              <Star className={`h-4 w-4 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Read Later */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundFx.playPop();
                onToggleReadLater(item.id, e);
              }}
              className={`p-2 rounded-xl transition active:scale-95 ${
                item.isReadLater
                  ? 'text-purple-400 bg-purple-400/10'
                  : 'text-slate-500 hover:text-purple-400'
              }`}
              title="Read Later"
            >
              <Bookmark className={`h-4 w-4 ${item.isReadLater ? 'fill-purple-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
