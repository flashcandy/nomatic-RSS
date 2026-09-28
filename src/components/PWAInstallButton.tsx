import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Sparkles, X, Smartphone, ArrowRight, Heart, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already installed standalone app, hide button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`group relative flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 p-[1px] font-medium text-white shadow-lg shadow-pink-500/20 transition-all duration-300 hover:shadow-pink-500/40 active:scale-95 ${
          compact ? 'text-xs' : 'text-xs'
        }`}
        title="Install nomatic RSS as standalone app"
      >
        <span className="flex items-center gap-1.5 rounded-[11px] bg-slate-900/90 px-3 py-1.5 backdrop-blur-md transition group-hover:bg-slate-900/60">
          <img src="/icon.svg" alt="nomatic RSS" className="h-4 w-4 rounded-md object-contain shrink-0" />
          <span className="font-bold text-slate-100 hidden sm:inline">Install App</span>
          <span className="font-bold text-slate-100 sm:hidden">Install</span>
        </span>
      </button>

      {/* PWA Install Modal / Guide Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-100">
            {/* Header with Lovable Logo */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl p-1 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-600 shadow-xl shadow-pink-500/30">
                  <img src="/icon.svg" alt="nomatic RSS" className="h-full w-full rounded-xl object-contain drop-shadow" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-base text-white">nomatic RSS</h3>
                    <span className="rounded-full bg-pink-500/20 px-2 py-0.5 text-[10px] font-bold text-pink-400 border border-pink-500/30">
                      PWA
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Ultra Reader & Media Hub</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Feature Highlights */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-2xl bg-slate-800/60 p-2.5 border border-slate-700/50">
                <Zap className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                <span className="font-semibold text-slate-200 text-[11px]">Instant Offline</span>
              </div>
              <div className="rounded-2xl bg-slate-800/60 p-2.5 border border-slate-700/50">
                <Sparkles className="h-4 w-4 text-purple-400 mx-auto mb-1" />
                <span className="font-semibold text-slate-200 text-[11px]">Swipe Deck</span>
              </div>
              <div className="rounded-2xl bg-slate-800/60 p-2.5 border border-slate-700/50">
                <ShieldCheck className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                <span className="font-semibold text-slate-200 text-[11px]">Push Alerts</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-4 space-y-2.5 text-xs text-slate-300">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-800/60 p-3 border border-slate-700/50">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-500 text-[11px] font-bold text-white">1</span>
                    <p>Tap the <strong className="text-white">Share</strong> button in the Safari bottom toolbar.</p>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-800/60 p-3 border border-slate-700/50">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500 text-[11px] font-bold text-white">2</span>
                    <p>Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong>.</p>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-800/60 p-3 border border-slate-700/50">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[11px] font-bold text-white">3</span>
                    <p>Tap <strong className="text-white">Add</strong> in the top-right corner to launch nomatic RSS anytime!</p>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl bg-slate-800/60 p-3.5 border border-slate-700/50">
                  <p className="text-slate-300 leading-relaxed">
                    Install <strong className="text-white">nomatic RSS</strong> on your desktop, Android, or iOS device for full-screen reading, zero browser bars, push notifications, and high-speed offline caching.
                  </p>
                </div>
              )}
            </div>

            {/* Action button */}
            <div className="mt-5 flex gap-2">
              {isInstallable ? (
                <button
                  onClick={async () => {
                    await install();
                    setShowModal(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 py-3 text-xs font-bold text-white shadow-xl shadow-pink-500/25 hover:opacity-95 transition active:scale-98"
                >
                  <Download className="h-4 w-4" />
                  <span>Install App Now</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-2xl bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                >
                  Got It
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

