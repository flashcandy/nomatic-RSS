import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Volume2, 
  Headphones, 
  X,
  FastForward,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { FeedItem } from '../types';

interface MediaPlayerProps {
  item: FeedItem | null;
  isPlaying: boolean;
  isPaused: boolean;
  currentSentence?: string;
  isTTS: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  playbackRate: number;
  onSpeedChange: (rate: number) => void;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  item,
  isPlaying,
  isPaused,
  currentSentence,
  isTTS,
  onPlayPause,
  onStop,
  playbackRate,
  onSpeedChange,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const speeds = [0.8, 1.0, 1.25, 1.5, 2.0];

  if (!item && !isPlaying && !isPaused) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-40 max-w-md sm:w-96 animate-in slide-in-from-bottom-3 duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/95 p-3 sm:p-3.5 shadow-2xl backdrop-blur-2xl text-slate-100">
        {/* Glow Accent Top Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="flex items-center justify-between gap-2.5">
          {/* Article Info & Icon */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md">
              <Headphones className="h-4 w-4 animate-pulse" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[8px] sm:text-[9px] font-bold text-indigo-300 border border-indigo-500/30 shrink-0">
                  {isTTS ? 'TTS NARRATION' : 'AUDIO STREAM'}
                </span>
                <span className="text-[10px] text-slate-400 truncate">{item?.feedTitle}</span>
              </div>
              <p className="font-semibold text-xs text-white truncate mt-0.5">
                {item?.title || 'Playing Audio'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Speed Selector */}
            <button
              onClick={() => {
                const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
                onSpeedChange(speeds[nextIdx]);
              }}
              className="rounded-lg border border-slate-700 px-1.5 py-1 text-[10px] sm:text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Playback Speed"
            >
              {playbackRate}x
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={onPlayPause}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition active:scale-95"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
            </button>

            {/* Stop / Close Button */}
            <button
              onClick={onStop}
              className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 transition"
              title="Stop playback"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Realtime TTS Sentence Subtitle */}
        {currentSentence && isPlaying && !isCollapsed && (
          <div className="mt-2 rounded-lg bg-black/50 p-2 text-[10px] sm:text-[11px] text-indigo-200 border border-indigo-500/20 leading-snug truncate">
            <span className="font-bold text-indigo-400 mr-1">Speaking:</span>
            {currentSentence}
          </div>
        )}
      </div>
    </div>
  );
};
