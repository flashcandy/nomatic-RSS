import React, { useState } from 'react';
import { X, Folder, Plus, Trash2, Edit3, Check } from 'lucide-react';
import { FeedCategory } from '../types';

interface CategoryManagerModalProps {
  categories: FeedCategory[];
  onClose: () => void;
  onAddCategory: (name: string, color: string) => void;
  onDeleteCategory: (id: string) => void;
}

const COLORS = ['#6366f1', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899', '#10b981', '#06b6d4'];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  categories,
  onClose,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddCategory(name.trim(), color);
      setName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-3xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
              <Folder className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Manage Categories</h2>
              <p className="text-xs text-slate-400">Organize your feed streams</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Add Form */}
        <form onSubmit={handleAdd} className="mt-5 space-y-3 rounded-2xl bg-slate-800/60 p-4 border border-slate-700/60">
          <label className="text-xs font-bold text-slate-300">New Category</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Science, Crypto, Gaming"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
            >
              Add
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`h-5 w-5 rounded-full ${color === c ? 'ring-2 ring-white scale-110' : 'opacity-70'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </form>

        {/* Categories List */}
        <div className="mt-6 space-y-2 max-h-56 overflow-y-auto">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-xl bg-slate-800/60 p-2.5 border border-slate-700/60"
            >
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="font-semibold text-xs text-white">{cat.name}</span>
              </div>

              {categories.length > 1 && (
                <button
                  onClick={() => onDeleteCategory(cat.id)}
                  className="p-1 text-slate-400 hover:text-rose-400 transition"
                  title="Delete category"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
