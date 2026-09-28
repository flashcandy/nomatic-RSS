import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  Bookmark, 
  Volume2, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  Calendar,
  Tag as TagIcon, 
  Copy, 
  Check, 
  Tv, 
  Headphones, 
  Languages, 
  Mic2, 
  BookOpen, 
  Type, 
  SlidersHorizontal,
  Zap,
  Rss,
  AlertCircle,
  Info,
  Globe,
  RefreshCw,
  FileText,
  CheckCircle2,
  Loader2,
  Compass
} from 'lucide-react';
import { FeedItem, ReaderSettings, FeedTag, OpenRouterConfig } from '../types';
import { getThemeClasses, getFontFamilyClass, getFontSizeClass, getLineHeightClass } from '../utils/themeStyles';
import { soundFx } from '../utils/sound';
import { getArticleDateInfo } from '../utils/dateUtils';
import { extractArticleContent, ExtractedArticle } from '../utils/articleExtractor';

interface ArticleDetailModalProps {
  item: FeedItem | null;
  settings: ReaderSettings;
  tags: FeedTag[];
  openRouterConfig: OpenRouterConfig;
  onClose: () => void;
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  onToggleReadLater: (id: string, e?: React.MouseEvent) => void;
  onPlayAudio: (item: FeedItem, e?: React.MouseEvent) => void;
  onAddTagToItem: (itemId: string, tag: string) => void;
  onRemoveTagFromItem: (itemId: string, tag: string) => void;
  onOpenSpeedReader: (item: FeedItem) => void;
  onOpenOpenRouterModal: () => void;
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  item,
  settings,
  tags,
  openRouterConfig,
  onClose,
  onToggleFavorite,
  onToggleReadLater,
  onPlayAudio,
  onAddTagToItem,
  onRemoveTagFromItem,
  onOpenSpeedReader,
  onOpenOpenRouterModal,
}) => {
  if (!item) return null;

  const t = getThemeClasses(settings.theme);
  const fontCls = getFontFamilyClass(settings.fontFamily);
  const sizeCls = getFontSizeClass(settings.fontSize);
  const lhCls = getLineHeightClass(settings.lineHeight);

  const [activeTab, setActiveTab] = useState<'reader' | 'webview' | 'ai-insights' | 'podcast-script' | 'translator'>('reader');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  // Full Article In-App Extractor State
  const [extractedArticle, setExtractedArticle] = useState<{
    title?: string;
    author?: string;
    leadImageUrl?: string;
    contentHtml?: string;
    textContent?: string;
    wordCount?: number;
    readingTimeMinutes?: number;
    sourceUrl?: string;
  } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [showOriginalSnippet, setShowOriginalSnippet] = useState(false);

  const [aiResult, setAiResult] = useState<{
    summary?: string;
    keyTakeaways?: string[];
    sentiment?: string;
    keyConcepts?: string[];
    podcastScript?: string;
    translatedText?: string;
  } | null>(null);

  const [selectedLang, setSelectedLang] = useState('Spanish');
  const [newTagInput, setNewTagInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [bionicEnabled, setBionicEnabled] = useState(settings.bionicReading);

  // Reset extraction state when article changes & auto-extract if snippet is short
  useEffect(() => {
    setExtractedArticle(null);
    setExtractionError(null);
    setShowOriginalSnippet(false);
    setAiResult(null);
    setAiError(null);
    setImgError(false);
    setActiveTab('reader');

    // Auto extract full article if description is short or just a teaser
    const textLen = (item.content || item.description || '').length;
    if (item.link && textLen < 500) {
      extractFullArticle();
    }
  }, [item.id]);

  const extractFullArticle = async () => {
    if (!item?.link) return;
    setIsExtracting(true);
    setExtractionError(null);
    try {
      const article = await extractArticleContent(item.link);
      if (article && article.contentHtml) {
        setExtractedArticle(article);
        setShowOriginalSnippet(false);
      } else {
        setExtractionError('Could not extract complete article text. Viewing RSS summary.');
      }
    } catch (e: any) {
      setExtractionError(e.message || 'Failed to extract full web article.');
    } finally {
      setIsExtracting(false);
    }
  };

  const renderBionicText = (htmlText: string) => {
    if (!bionicEnabled) {
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: htmlText }} 
          className="prose-clean space-y-4 leading-relaxed [&_p]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-1.5 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-300 [&_img]:rounded-2xl [&_img]:max-w-full [&_img]:h-auto [&_img]:my-4 [&_img]:shadow-lg" 
        />
      );
    }

    const temp = document.createElement('div');
    temp.innerHTML = htmlText;
    const text = temp.textContent || temp.innerText || '';

    const words = text.split(/\s+/).map((word, i) => {
      const mid = Math.ceil(word.length / 2);
      const boldPart = word.slice(0, mid);
      const rest = word.slice(mid);
      return (
        <span key={i} className="inline-block mr-1">
          <strong className="font-bold text-white">{boldPart}</strong>
          <span>{rest}</span>
        </span>
      );
    });

    return <div className="leading-relaxed">{words}</div>;
  };

  const handleCopy = () => {
    if (item.link) {
      navigator.clipboard.writeText(item.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const runAiAnalysis = async (mode: 'summary' | 'eli5' | 'podcast' | 'translate') => {
    setAiLoading(true);
    setAiError(null);
    const contentToAnalyze = extractedArticle?.textContent || item.content || item.description;
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          content: contentToAnalyze,
          mode,
          apiKey: openRouterConfig.apiKey,
          model: openRouterConfig.model || 'google/gemini-2.0-flash-exp:free',
          targetLang: selectedLang,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (mode === 'summary' || mode === 'eli5') {
          setAiResult((prev) => ({
            ...prev,
            summary: data.data?.summary || data.rawText || data.summary,
            keyTakeaways: data.data?.keyTakeaways || data.keyTakeaways,
            sentiment: data.data?.sentiment || data.sentiment,
            keyConcepts: data.data?.keyConcepts || data.keyConcepts,
          }));
        } else if (mode === 'podcast') {
          setAiResult((prev) => ({
            ...prev,
            podcastScript: data.rawText || data.summary,
          }));
        } else if (mode === 'translate') {
          setAiResult((prev) => ({
            ...prev,
            translatedText: data.rawText || data.summary,
          }));
        }
      } else {
        setAiError(data.error || 'Failed to complete AI feed analysis. Please check your API key.');
      }
    } catch (e: any) {
      console.error('AI fetch error:', e);
      setAiError(e.message || 'Network error connecting to AI analysis service.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagInput.trim()) {
      onAddTagToItem(item.id, newTagInput.trim());
      setNewTagInput('');
    }
  };

  const displayHeroImage = extractedArticle?.leadImageUrl || item.imageUrl;
  const hasValidImage = !!displayHeroImage && !imgError;
  const activeContentHtml = (!showOriginalSnippet && extractedArticle?.contentHtml)
    ? extractedArticle.contentHtml
    : (item.content || item.description || '<p>No content available.</p>');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-1 sm:p-4 lg:p-6 animate-in fade-in duration-200">
      <div
        className={`relative flex h-full max-h-[96vh] w-full max-w-4xl flex-col rounded-3xl border shadow-2xl backdrop-blur-2xl transition-all duration-300 ${t.cardBg} ${t.border} overflow-hidden`}
      >
        {/* Modal Top Action Toolbar */}
        <div className="flex items-center justify-between border-b px-4 sm:px-6 py-3 bg-slate-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs shrink-0">
              <BookOpen className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <span className="font-bold text-xs sm:text-sm text-slate-100 truncate block">
                {item.feedTitle}
              </span>
              <span className="text-[10px] text-slate-400 truncate block">
                In-App Reader • {extractedArticle ? 'Full Web Story Loaded' : 'RSS Stream'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Audio TTS Speak */}
            <button
              onClick={(e) => onPlayAudio(item, e)}
              className="flex items-center gap-1 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition active:scale-95"
              title="Listen to story with Text-to-Speech"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Listen</span>
            </button>

            {/* RSVP Speed Reader */}
            <button
              onClick={() => onOpenSpeedReader(item)}
              className="flex items-center gap-1 rounded-xl border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition active:scale-95"
              title="Speed read RSVP"
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Speed Read</span>
            </button>

            {/* Favorite */}
            <button
              onClick={(e) => onToggleFavorite(item.id, e)}
              className={`rounded-xl border p-1.5 transition active:scale-95 ${
                item.isFavorite
                  ? 'border-amber-500/50 bg-amber-500/20 text-amber-400'
                  : 'border-slate-700 text-slate-400 hover:text-amber-400'
              }`}
              title="Add to Favorites"
            >
              <Star className={`h-4 w-4 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Read Later */}
            <button
              onClick={(e) => onToggleReadLater(item.id, e)}
              className={`rounded-xl border p-1.5 transition active:scale-95 ${
                item.isReadLater
                  ? 'border-purple-500/50 bg-purple-500/20 text-purple-400'
                  : 'border-slate-700 text-slate-400 hover:text-purple-400'
              }`}
              title="Bookmark for later"
            >
              <Bookmark className={`h-4 w-4 ${item.isReadLater ? 'fill-purple-400' : ''}`} />
            </button>

            {/* Bionic Reading Toggle */}
            <button
              onClick={() => setBionicEnabled(!bionicEnabled)}
              className={`rounded-xl border p-1.5 transition active:scale-95 ${
                bionicEnabled
                  ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400 font-bold'
                  : 'border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Toggle Bionic Reading (highlight first letters)"
            >
              <Type className="h-4 w-4" />
            </button>

            {/* Copy Article Link */}
            <button
              onClick={handleCopy}
              className="rounded-xl border border-slate-700 p-1.5 text-slate-400 hover:text-white transition active:scale-95"
              title="Copy original story link"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-700 p-1.5 text-slate-400 hover:text-rose-400 transition"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex items-center gap-1.5 sm:gap-2 border-b px-3 sm:px-6 py-2 bg-slate-900/40 overflow-x-auto ${t.border}`}>
          {/* Reader View */}
          <button
            onClick={() => setActiveTab('reader')}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold shrink-0 transition ${
              activeTab === 'reader'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Reader View</span>
          </button>

          {/* In-App Web View */}
          {item.link && (
            <button
              onClick={() => setActiveTab('webview')}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold shrink-0 transition ${
                activeTab === 'webview'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-sky-400 hover:text-sky-300 bg-sky-500/10'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>In-App Web View</span>
            </button>
          )}

          {/* AI Summary */}
          <button
            onClick={() => {
              setActiveTab('ai-insights');
              if (!aiResult?.summary) runAiAnalysis('summary');
            }}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold shrink-0 transition ${
              activeTab === 'ai-insights'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-purple-300 hover:text-purple-200 bg-purple-500/10'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-300" />
            <span>AI Summary</span>
          </button>

          {/* Podcast Script */}
          <button
            onClick={() => {
              setActiveTab('podcast-script');
              if (!aiResult?.podcastScript) runAiAnalysis('podcast');
            }}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold shrink-0 transition ${
              activeTab === 'podcast-script'
                ? 'bg-pink-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic2 className="h-3.5 w-3.5" />
            <span>Podcast Script</span>
          </button>

          {/* Translate */}
          <button
            onClick={() => {
              setActiveTab('translator');
              if (!aiResult?.translatedText) runAiAnalysis('translate');
            }}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold shrink-0 transition ${
              activeTab === 'translator'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Languages className="h-3.5 w-3.5" />
            <span>Translate</span>
          </button>
        </div>

        {/* Scrollable Reader Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 scrollbar-thin">
          {activeTab === 'reader' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Full Article Extraction Status Banner */}
              {extractedArticle ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-emerald-950/40 p-3.5 border border-emerald-500/30 text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white">Full In-App Article Extracted:</span>
                      <span className="ml-1 text-emerald-200">
                        {extractedArticle.wordCount} words • {extractedArticle.readingTimeMinutes} min read
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowOriginalSnippet(!showOriginalSnippet)}
                      className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/30 transition"
                    >
                      {showOriginalSnippet ? 'Show Full Web Story' : 'Show RSS Snippet'}
                    </button>
                    <button
                      onClick={extractFullArticle}
                      disabled={isExtracting}
                      className="rounded-lg border border-slate-700 p-1 text-slate-300 hover:text-white"
                      title="Re-extract article text"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isExtracting ? 'animate-spin text-emerald-400' : ''}`} />
                    </button>
                  </div>
                </div>
              ) : isExtracting ? (
                <div className="flex items-center gap-3 rounded-2xl bg-indigo-950/40 p-3.5 border border-indigo-500/30 text-xs text-indigo-300">
                  <Loader2 className="h-4 w-4 text-indigo-400 animate-spin shrink-0" />
                  <span>Extracting full complete article text from web link...</span>
                </div>
              ) : (
                item.link && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900/90 p-3.5 border border-slate-800 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span>Viewing RSS feed summary. Want the entire web story?</span>
                    </div>
                    <button
                      onClick={extractFullArticle}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:opacity-95 transition active:scale-95"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Extract Full Article</span>
                    </button>
                  </div>
                )
              )}

              {/* Extraction Error Notice if any */}
              {extractionError && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-amber-950/30 p-3 border border-amber-500/30 text-xs text-amber-300">
                  <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-200">Notice:</span> {extractionError}
                  </div>
                </div>
              )}

              {/* Media Enclosure: Video or Image */}
              {item.videoUrl ? (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-xl">
                  <video
                    src={item.videoUrl}
                    controls
                    poster={displayHeroImage}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : hasValidImage ? (
                <div className="relative h-52 sm:h-80 w-full overflow-hidden rounded-2xl border border-slate-800 shadow-xl">
                  <img
                    src={displayHeroImage}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    onError={() => setImgError(true)}
                  />
                </div>
              ) : null}

              {/* Title */}
              <h1 className={`font-extrabold text-xl sm:text-3xl lg:text-4xl tracking-tight leading-tight ${t.textPrimary} ${fontCls}`}>
                {extractedArticle?.title || item.title}
              </h1>

              {/* Author & Uploaded Date metadata */}
              {(() => {
                const dateInfo = getArticleDateInfo(item.pubDate, item.timestamp);
                const displayAuthor = extractedArticle?.author || item.author || item.feedTitle;
                return (
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pb-4 border-b border-inherit">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-200">By {displayAuthor}</span>
                      <span className="text-slate-600">•</span>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-indigo-300 font-medium border border-indigo-500/20"
                        title={`Raw Date: ${dateInfo.raw}\nISO: ${dateInfo.iso}`}
                      >
                        <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Uploaded {dateInfo.formattedDate}</span>
                        <span className="text-indigo-400/70">({dateInfo.relative})</span>
                      </span>
                      <span className="hidden sm:inline text-slate-500">•</span>
                      <span className="hidden sm:inline text-slate-400">
                        {dateInfo.formattedDateTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-indigo-400 font-semibold uppercase tracking-wider text-[10px]">
                        {item.category || 'Software'}
                      </span>
                      {item.cachedOffline && (
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400 font-semibold uppercase tracking-wider text-[10px] border border-emerald-500/20">
                          Cached Offline
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Tag Management bar on article */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <TagIcon className="h-3 w-3" />
                  <span>Assigned Tags:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 border border-slate-700"
                    >
                      #{tag}
                      <button
                        onClick={() => onRemoveTagFromItem(item.id, tag)}
                        className="text-slate-400 hover:text-rose-400 text-[10px]"
                        title="Remove tag"
                      >
                        ✕
                      </button>
                    </span>
                  ))}

                  {/* Add Tag Inline Form */}
                  <form onSubmit={handleAddTag} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      placeholder="+ Add tag..."
                      className="w-24 rounded-lg bg-slate-800/80 px-2 py-1 text-xs text-slate-100 placeholder:text-slate-500 border border-slate-700 focus:w-32 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </form>
                </div>
              </div>

              {/* Clean Article Content */}
              <div className={`space-y-4 ${t.textSecondary} ${sizeCls} ${lhCls} ${fontCls}`}>
                {renderBionicText(activeContentHtml)}
              </div>
            </div>
          )}

          {/* In-App Web View Tab */}
          {activeTab === 'webview' && item.link && (
            <div className="space-y-4 max-w-4xl mx-auto h-full flex flex-col">
              <div className="flex items-center justify-between rounded-2xl bg-slate-900/90 p-3 border border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <Globe className="h-4 w-4 text-sky-400 shrink-0" />
                  <span className="font-mono text-xs text-sky-300 truncate">{item.link}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-xl bg-sky-600 px-3 py-1.5 font-bold text-white shadow hover:bg-sky-500 transition"
                  >
                    <span>Open External</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Embedded Web View */}
              <div className="relative flex-1 min-h-[500px] w-full rounded-2xl border border-slate-800 bg-white overflow-hidden shadow-2xl">
                <iframe
                  src={item.link}
                  title={item.title}
                  className="h-full w-full border-0"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            </div>
          )}

          {activeTab === 'ai-insights' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-900/30 to-purple-900/30 p-4 border border-purple-500/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-purple-500 text-white shadow-lg shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-white">AI Feed Intelligence</h3>
                    <p className="text-[11px] text-slate-400 truncate">
                      Model: {openRouterConfig.model || 'google/gemini-2.0-flash-exp:free'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => runAiAnalysis('summary')}
                    disabled={aiLoading}
                    className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-purple-500 disabled:opacity-50 transition active:scale-95"
                  >
                    {aiLoading ? 'Analyzing...' : 'Refresh AI'}
                  </button>
                  <button
                    onClick={onOpenOpenRouterModal}
                    className="rounded-xl border border-slate-700 p-1.5 text-slate-400 hover:text-white"
                    title="Change Model / Key"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Error Alert Banner */}
              {aiError && (
                <div className="flex items-start gap-3 rounded-2xl bg-rose-950/40 p-4 border border-rose-500/40 text-xs text-rose-200 animate-in fade-in">
                  <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div>
                      <span className="font-bold text-rose-100">AI Request Notice</span>
                      <p className="text-rose-300/90 mt-0.5 leading-relaxed">{aiError}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={onOpenOpenRouterModal}
                        className="rounded-xl bg-rose-500/20 px-3 py-1 font-semibold text-rose-200 border border-rose-500/30 hover:bg-rose-500/30 transition"
                      >
                        Open AI Key Settings
                      </button>
                      <button
                        onClick={() => runAiAnalysis('summary')}
                        className="rounded-xl bg-slate-800 px-3 py-1 font-semibold text-slate-200 hover:bg-slate-700 transition"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {aiLoading ? (
                <div className="flex h-48 flex-col items-center justify-center space-y-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                  <p className="text-xs text-slate-400">Synthesizing feed takeaways with AI...</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Executive Summary */}
                  <div className="rounded-2xl bg-slate-900/80 p-5 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      Executive Summary
                    </h4>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {aiResult?.summary || item.aiSummary || 'Click Refresh AI to generate real-time AI summary.'}
                    </p>
                  </div>

                  {/* Key Takeaways */}
                  {(aiResult?.keyTakeaways || item.aiKeyTakeaways) && (
                    <div className="rounded-2xl bg-slate-900/80 p-5 border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                        Key Takeaways
                      </h4>
                      <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside">
                        {(aiResult?.keyTakeaways || item.aiKeyTakeaways)?.map((point, idx) => (
                          <li key={idx} className="leading-relaxed">{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Quick Action button: ELI5 */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => runAiAnalysis('eli5')}
                      className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition"
                    >
                      👶 Explain Like I'm 5 (ELI5)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'podcast-script' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="flex items-center justify-between rounded-2xl bg-pink-950/30 p-4 border border-pink-500/30">
                <div className="flex items-center gap-3">
                  <Mic2 className="h-5 w-5 text-pink-400 shrink-0" />
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-white">2-Host Podcast Script Generator</h3>
                    <p className="text-[11px] text-slate-400">Transforms story into dialogue</p>
                  </div>
                </div>
                <button
                  onClick={() => runAiAnalysis('podcast')}
                  disabled={aiLoading}
                  className="rounded-xl bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-pink-500"
                >
                  {aiLoading ? 'Writing...' : 'Generate'}
                </button>
              </div>

              {aiError && (
                <div className="flex items-start gap-3 rounded-2xl bg-rose-950/40 p-4 border border-rose-500/40 text-xs text-rose-200">
                  <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <span className="font-bold text-rose-100">AI Notice</span>
                    <p className="text-rose-300/90 leading-relaxed">{aiError}</p>
                    <button
                      onClick={onOpenOpenRouterModal}
                      className="rounded-lg bg-rose-500/20 px-2.5 py-1 text-[11px] font-semibold text-rose-200 border border-rose-500/30 hover:bg-rose-500/30 transition"
                    >
                      Open AI Settings
                    </button>
                  </div>
                </div>
              )}

              {aiLoading ? (
                <div className="flex h-48 flex-col items-center justify-center space-y-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
                  <p className="text-xs text-slate-400">Creating audio script...</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-900/90 p-5 border border-slate-800 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">
                  {aiResult?.podcastScript || 'Click Generate to turn this RSS article into a spoken podcast dialogue.'}
                </div>
              )}
            </div>
          )}

          {activeTab === 'translator' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cyan-950/30 p-4 border border-cyan-500/30">
                <div className="flex items-center gap-3">
                  <Languages className="h-5 w-5 text-cyan-400 shrink-0" />
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-white">Feed Translator</h3>
                    <p className="text-[11px] text-slate-400">Translate article into 10+ languages</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs text-white border border-slate-700 focus:outline-none"
                  >
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="French">French (Français)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="Japanese">Japanese (日本語)</option>
                    <option value="Chinese">Chinese (中文)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="Portuguese">Portuguese (Português)</option>
                  </select>

                  <button
                    onClick={() => runAiAnalysis('translate')}
                    disabled={aiLoading}
                    className="rounded-xl bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-cyan-500"
                  >
                    {aiLoading ? 'Translating...' : 'Translate'}
                  </button>
                </div>
              </div>

              {aiError && (
                <div className="flex items-start gap-3 rounded-2xl bg-rose-950/40 p-4 border border-rose-500/40 text-xs text-rose-200">
                  <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <span className="font-bold text-rose-100">AI Notice</span>
                    <p className="text-rose-300/90 leading-relaxed">{aiError}</p>
                    <button
                      onClick={onOpenOpenRouterModal}
                      className="rounded-lg bg-rose-500/20 px-2.5 py-1 text-[11px] font-semibold text-rose-200 border border-rose-500/30 hover:bg-rose-500/30 transition"
                    >
                      Open AI Settings
                    </button>
                  </div>
                </div>
              )}

              {aiLoading ? (
                <div className="flex h-48 flex-col items-center justify-center space-y-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                  <p className="text-xs text-slate-400">Translating text...</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-900/90 p-5 border border-slate-800 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
                  {aiResult?.translatedText || 'Select language and click Translate to convert this RSS feed.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
