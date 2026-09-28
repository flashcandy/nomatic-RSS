import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Sliders, 
  CheckCircle2,
  FastForward
} from 'lucide-react';
import { FeedItem } from '../types';

interface SpeedReaderModalProps {
  item: FeedItem | null;
  onClose: () => void;
}

export const SpeedReaderModal: React.FC<SpeedReaderModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(350);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const temp = document.createElement('div');
    temp.innerHTML = item.content || item.description;
    const cleanText = `${item.title}. ${temp.textContent || temp.innerText}`;
    const parsed = cleanText.split(/\s+/).filter(Boolean);
    setWords(parsed);
    setCurrentIndex(0);
    setIsPlaying(true);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [item]);

  useEffect(() => {
    if (isPlaying) {
      const msPerWord = (60 / wpm) * 1000;
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev < words.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return prev;
          }
        });
      }, msPerWord);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, wpm, words.length]);

  const currentWord = words[currentIndex] || '';
  const midPoint = Math.floor(currentWord.length / 2);
  const leftPart = currentWord.slice(0, midPoint);
  const focusChar = currentWord.slice(midPoint, midPoint + 1);
  const rightPart = currentWord.slice(midPoint + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="relative flex h-full max-h-[80vh] w-full max-w-2xl flex-col items-center justify-between rounded-3xl border border-indigo-500/40 bg-slate-950 p-6 sm:p-10 shadow-2xl text-white">
        {/* Top Header */}
        <div className="flex w-full items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-400" />
            <span className="font-bold text-sm text-indigo-300">RSVP Rapid Speed Reader</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-slate-400">
              {currentIndex + 1} / {words.length} words ({Math.round(((currentIndex + 1) / (words.length || 1)) * 100)}%)
            </span>
            <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Focal Center RSVP Display */}
        <div className="relative flex flex-col items-center justify-center my-auto py-12">
          {/* Target Focus Reticle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-48 border-y-2 border-indigo-500/30 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-1 bg-rose-500/30 pointer-events-none" />

          {/* Render RSVP Word */}
          <div className="font-mono text-4xl sm:text-6xl font-bold tracking-tight text-slate-100 flex items-center justify-center">
            <span className="text-slate-400 text-right min-w-[120px]">{leftPart}</span>
            <span className="text-rose-400 font-extrabold px-0.5">{focusChar}</span>
            <span className="text-slate-200 text-left min-w-[120px]">{rightPart}</span>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="flex w-full flex-col gap-4 border-t border-slate-800 pt-6">
          {/* Scrubber Progress */}
          <input
            type="range"
            min={0}
            max={Math.max(0, words.length - 1)}
            value={currentIndex}
            onChange={(e) => setCurrentIndex(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />

          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Speed WPM selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Speed:</span>
              {[250, 350, 450, 600].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setWpm(speed)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    wpm === speed ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {speed} WPM
                </button>
              ))}
            </div>

            {/* Play/Pause & Reset Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentIndex(0)}
                className="rounded-xl border border-slate-700 p-2 text-slate-400 hover:text-white transition"
                title="Restart"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition active:scale-95"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
