import React, { useState } from 'react';
import { 
  X, 
  Rss, 
  Plus, 
  Check, 
  Sparkles, 
  Globe, 
  Layers, 
  Tag as TagIcon, 
  AlertCircle,
  FolderPlus
} from 'lucide-react';
import { FeedCategory, FeedTag } from '../types';
import { PRESET_FEED_CATALOG } from '../data/defaultFeeds';
import { fetchAndParseFeed } from '../utils/rssParser';

interface AddFeedModalProps {
  categories: FeedCategory[];
  tags: FeedTag[];
  onClose: () => void;
  onFeedAdded: (feedUrl: string, categoryId: string, customTags: string[]) => Promise<void>;
}

export const AddFeedModal: React.FC<AddFeedModalProps> = ({
  categories,
  tags,
  onClose,
  onFeedAdded,
}) => {
  const [feedUrl, setFeedUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || 'software');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagInput.trim() && !selectedTags.includes(newTagInput.trim())) {
      setSelectedTags([...selectedTags, newTagInput.trim().toLowerCase()]);
      setNewTagInput('');
    }
  };

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedUrl.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await onFeedAdded(feedUrl.trim(), selectedCategory, selectedTags);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch or parse RSS feed. Ensure the URL is valid.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAddPreset = async (presetUrl: string, presetCategory: string) => {
    setFeedUrl(presetUrl);
    setSelectedCategory(presetCategory);
    setIsLoading(true);
    setError(null);
    try {
      await onFeedAdded(presetUrl, presetCategory, selectedTags);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Could not subscribe to preset feed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-100 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md">
              <Rss className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Subscribe to RSS Feed</h2>
              <p className="text-xs text-slate-400">Add any RSS, Atom, or JSON Feed URL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/20">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-300 border border-emerald-500/20">
            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
            <p>Feed successfully subscribed and cached!</p>
          </div>
        )}

        {/* Manual URL Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              RSS Feed / Stream URL <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="url"
                required
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder="https://example.com/feed.xml"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Assign Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-medium transition ${
                    selectedCategory === cat.id
                      ? 'border-indigo-500 bg-indigo-500/20 text-white font-semibold'
                      : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Add Tags & Topics</label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tg) => {
                const isSelected = selectedTags.includes(tg.name.toLowerCase());
                return (
                  <button
                    type="button"
                    key={tg.id}
                    onClick={() => toggleTag(tg.name.toLowerCase())}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    #{tg.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !feedUrl.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 transition disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Parsing & Validating Feed...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Subscribe & Sync Feed
              </span>
            )}
          </button>
        </form>

        {/* Curated Presets Section */}
        <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Popular Recommended Feeds</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {PRESET_FEED_CATALOG.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between rounded-xl bg-slate-800/50 p-2.5 border border-slate-700/60 hover:border-slate-600 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: preset.color }} />
                    <span className="font-semibold text-xs text-white truncate">{preset.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{preset.description}</p>
                </div>

                <button
                  onClick={() => handleQuickAddPreset(preset.url, preset.category)}
                  disabled={isLoading}
                  className="rounded-lg bg-indigo-500/20 px-2.5 py-1 text-[11px] font-bold text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition shrink-0"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
