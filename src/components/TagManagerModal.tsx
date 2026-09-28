import React, { useState } from 'react';
import { 
  X, 
  Tag as TagIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Palette,
  Hash
} from 'lucide-react';
import { FeedTag, FeedItem } from '../types';

interface TagManagerModalProps {
  tags: FeedTag[];
  items: FeedItem[];
  onClose: () => void;
  onAddTag: (name: string, color: string) => void;
  onUpdateTag: (id: string, name: string, color: string) => void;
  onDeleteTag: (id: string) => void;
  onFilterByTag: (tagName: string) => void;
}

const PALETTE = [
  '#38bdf8', '#c084fc', '#34d399', '#fbbf24', '#f472b6', 
  '#ef4444', '#818cf8', '#2dd4bf', '#f97316', '#a855f7',
  '#ec4899', '#10b981', '#6366f1', '#14b8a6', '#eab308'
];

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  tags,
  items,
  onClose,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
  onFilterByTag,
}) => {
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim()) {
      onAddTag(newTagName.trim().toLowerCase(), selectedColor);
      setNewTagName('');
    }
  };

  const startEdit = (tag: FeedTag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const saveEdit = (id: string) => {
    if (editName.trim()) {
      onUpdateTag(id, editName.trim().toLowerCase(), editColor);
      setEditingId(null);
    }
  };

  // Count items for each tag
  const getTagCount = (tagName: string) => {
    return items.filter((item) =>
      item.tags?.some((t) => t.toLowerCase() === tagName.toLowerCase())
    ).length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-100 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-md">
              <TagIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Tag Management System</h2>
              <p className="text-xs text-slate-400">Organize and color-code topics across feeds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Create New Tag Form */}
        <form onSubmit={handleCreate} className="mt-5 space-y-3 rounded-2xl bg-slate-800/60 p-4 border border-slate-700/60">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5 text-indigo-400" />
            <span>Create New Tag</span>
          </label>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g. artificial-intelligence, macos, rust"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2 pl-9 pr-3 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={!newTagName.trim()}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              Add Tag
            </button>
          </div>

          {/* Color Swatches */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
            {PALETTE.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setSelectedColor(c)}
                className={`h-5 w-5 rounded-full shrink-0 transition-transform ${
                  selectedColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110 opacity-70'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </form>

        {/* Existing Tags List */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Configured Tags ({tags.length})</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {tags.map((tag) => {
              const count = getTagCount(tag.name);
              const isEditing = editingId === tag.id;

              if (isEditing) {
                return (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-slate-800 p-2.5 border border-indigo-500/50"
                  >
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs text-white border border-slate-700 flex-1 focus:outline-none"
                    />
                    <div className="flex items-center gap-1">
                      {PALETTE.slice(0, 5).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          className={`h-4 w-4 rounded-full ${editColor === c ? 'ring-2 ring-white' : ''}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => saveEdit(tag.id)}
                      className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={tag.id}
                  className="group flex items-center justify-between rounded-xl bg-slate-800/60 p-2.5 border border-slate-700/60 hover:border-slate-600 transition"
                >
                  <div
                    onClick={() => {
                      onFilterByTag(tag.name);
                      onClose();
                    }}
                    className="flex items-center gap-2.5 cursor-pointer flex-1"
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="font-semibold text-xs text-white">#{tag.name}</span>
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400 font-mono">
                      {count} items
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(tag)}
                      className="p-1 text-slate-400 hover:text-white transition"
                      title="Edit tag"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete tag #${tag.name}?`)) {
                          onDeleteTag(tag.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 transition"
                      title="Delete tag"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
