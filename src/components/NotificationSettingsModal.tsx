import React from 'react';
import { 
  X, 
  Bell, 
  Volume2, 
  VolumeX, 
  Clock, 
  Check, 
  AlertCircle, 
  Send,
  Trash2
} from 'lucide-react';
import { NotificationSettings } from '../types';
import { soundFx } from '../utils/sound';

interface NotificationSettingsModalProps {
  settings: NotificationSettings;
  permission: NotificationPermission;
  onUpdateSettings: (settings: Partial<NotificationSettings>) => void;
  onRequestPermission: () => Promise<NotificationPermission>;
  onSendTestNotification: () => void;
  notificationHistory: Array<{ id: string; title: string; body: string; timestamp: number; url?: string }>;
  onClearHistory: () => void;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  settings,
  permission,
  onUpdateSettings,
  onRequestPermission,
  onSendTestNotification,
  notificationHistory,
  onClearHistory,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-100 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Push & Feed Alerts</h2>
              <p className="text-xs text-slate-400">Instant updates for new subscribed releases</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Permission Status Box */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-slate-800/60 p-4 border border-slate-700/60">
            <div>
              <span className="text-xs font-bold text-slate-200">Browser Push Permission</span>
              <p className="text-[11px] text-slate-400">
                Current status: <strong className="uppercase text-indigo-300">{permission}</strong>
              </p>
            </div>

            {permission !== 'granted' ? (
              <button
                onClick={onRequestPermission}
                className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-indigo-500 transition"
              >
                Enable Alerts
              </button>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <Check className="h-3.5 w-3.5" />
                Active
              </span>
            )}
          </div>

          {/* Sound & Sync Options */}
          <div className="space-y-3 rounded-2xl bg-slate-800/40 p-4 border border-slate-700/60 text-xs">
            {/* Sound Chimes */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-indigo-400" />
                <span className="font-medium text-slate-200">Play chime on new updates</span>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                className="h-4 w-4 rounded bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            {/* Background Check Interval */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-400" />
                <span className="font-medium text-slate-200">Auto-check frequency</span>
              </div>
              <select
                value={settings.checkIntervalMinutes}
                onChange={(e) => onUpdateSettings({ checkIntervalMinutes: Number(e.target.value) })}
                className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs text-white border border-slate-700 focus:outline-none"
              >
                <option value={1}>Every 1 minute</option>
                <option value={5}>Every 5 minutes</option>
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
              </select>
            </div>
          </div>

          {/* Test Notification Trigger */}
          <button
            onClick={() => {
              soundFx.playNotificationChime();
              onSendTestNotification();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
          >
            <Send className="h-3.5 w-3.5 text-indigo-400" />
            <span>Send Test Push Notification</span>
          </button>

          {/* Notification History Log */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Alert History ({notificationHistory.length})</span>
              {notificationHistory.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="text-[10px] text-slate-500 hover:text-rose-400 transition"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {notificationHistory.length === 0 ? (
                <p className="text-xs text-slate-500 py-2 text-center">No recent notifications</p>
              ) : (
                notificationHistory.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl bg-slate-800/60 p-2.5 text-xs border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{n.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {n.body && <p className="text-[11px] text-slate-400 mt-0.5">{n.body}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
