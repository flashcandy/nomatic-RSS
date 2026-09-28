import { useState, useEffect, useCallback, useRef } from 'react';
import { NotificationSettings, FeedItem } from '../types';
import { soundFx } from '../utils/sound';

export function useNotifications(settings: NotificationSettings) {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default';
  });

  const [notificationHistory, setNotificationHistory] = useState<Array<{
    id: string;
    title: string;
    body: string;
    timestamp: number;
    url?: string;
  }>>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return 'denied';
    }
  }, []);

  const sendNotification = useCallback(
    (title: string, options?: { body?: string; icon?: string; url?: string; sound?: boolean }) => {
      if (typeof window === 'undefined') return;

      const record = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title,
        body: options?.body || '',
        timestamp: Date.now(),
        url: options?.url,
      };

      setNotificationHistory((prev) => [record, ...prev].slice(0, 50));

      if (options?.sound !== false && settings.soundEnabled) {
        soundFx.playNotificationChime();
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const n = new Notification(title, {
            body: options?.body,
            icon: options?.icon || '/icon.svg',
            badge: '/icon.svg',
          });
          if (options?.url) {
            n.onclick = () => {
              window.focus();
              window.open(options.url, '_blank');
            };
          }
        } catch (e) {
          console.warn('Could not trigger native notification:', e);
        }
      }
    },
    [settings.soundEnabled]
  );

  const notifyNewItems = useCallback(
    (newItems: FeedItem[]) => {
      if (!newItems.length) return;
      if (newItems.length === 1) {
        const item = newItems[0];
        sendNotification(`New Article: ${item.feedTitle}`, {
          body: item.title,
          icon: item.feedIcon || item.imageUrl || '/icon.svg',
          url: item.link,
        });
      } else {
        sendNotification(`${newItems.length} New Feed Updates`, {
          body: `${newItems[0].title} and ${newItems.length - 1} other stories ready to read.`,
          icon: '/icon.svg',
        });
      }
    },
    [sendNotification]
  );

  return {
    permission,
    requestPermission,
    sendNotification,
    notifyNewItems,
    notificationHistory,
    clearHistory: () => setNotificationHistory([]),
  };
}
