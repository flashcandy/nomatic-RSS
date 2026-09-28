import { FeedItem, FeedSource, FeedCategory, FeedTag, ReaderSettings, NotificationSettings, OpenRouterConfig } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_TAGS, parseAlternativeToXml } from '../data/defaultFeeds';

const FEEDS_KEY = 'aura_rss_feeds_v2';
const ITEMS_KEY = 'aura_rss_items_v2';
const CATEGORIES_KEY = 'aura_rss_categories_v2';
const TAGS_KEY = 'aura_rss_tags_v2';
const SETTINGS_KEY = 'aura_rss_settings_v2';
const NOTIF_SETTINGS_KEY = 'aura_rss_notifications_v2';
const OPENROUTER_KEY = 'aura_rss_openrouter_v2';

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'midnight',
  fontFamily: 'inter',
  fontSize: 'base',
  lineHeight: 'normal',
  viewMode: 'cards',
  autoMarkAsRead: false,
  openLinksInNewTab: true,
  ttsVoiceIndex: 0,
  ttsRate: 1.0,
  enableSwipeHaptics: true,
  bionicReading: false,
};

export const DEFAULT_NOTIF_SETTINGS: NotificationSettings = {
  enabled: false,
  browserPermission: 'default',
  checkIntervalMinutes: 5,
  soundEnabled: true,
  unreadBadge: true,
};

export const DEFAULT_OPENROUTER_CONFIG: OpenRouterConfig = {
  provider: 'google',
  apiKey: '',
  model: 'gemini-2.5-flash',
  customInstructions: '',
};

export function loadInitialData(): {
  feeds: FeedSource[];
  items: FeedItem[];
  categories: FeedCategory[];
  tags: FeedTag[];
  settings: ReaderSettings;
  notifSettings: NotificationSettings;
  openRouterConfig: OpenRouterConfig;
} {
  let feeds: FeedSource[] = [];
  let items: FeedItem[] = [];
  let categories: FeedCategory[] = DEFAULT_CATEGORIES;
  let tags: FeedTag[] = DEFAULT_TAGS;
  let settings: ReaderSettings = DEFAULT_SETTINGS;
  let notifSettings: NotificationSettings = DEFAULT_NOTIF_SETTINGS;
  let openRouterConfig: OpenRouterConfig = DEFAULT_OPENROUTER_CONFIG;

  try {
    const savedFeeds = localStorage.getItem(FEEDS_KEY);
    const savedItems = localStorage.getItem(ITEMS_KEY);
    const savedCats = localStorage.getItem(CATEGORIES_KEY);
    const savedTags = localStorage.getItem(TAGS_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    const savedNotifs = localStorage.getItem(NOTIF_SETTINGS_KEY);
    const savedAI = localStorage.getItem(OPENROUTER_KEY);

    if (savedFeeds) feeds = JSON.parse(savedFeeds);
    if (savedItems) items = JSON.parse(savedItems);
    if (savedCats) categories = JSON.parse(savedCats);
    if (savedTags) tags = JSON.parse(savedTags);
    if (savedSettings) settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
    if (savedNotifs) notifSettings = { ...DEFAULT_NOTIF_SETTINGS, ...JSON.parse(savedNotifs) };
    if (savedAI) openRouterConfig = { ...DEFAULT_OPENROUTER_CONFIG, ...JSON.parse(savedAI) };
  } catch (e) {
    console.error('Failed to parse localStorage data:', e);
  }

  // If initial load or feeds empty, initialize with AlternativeTo.net feed!
  if (!feeds.length || !items.length) {
    const initial = parseAlternativeToXml();
    feeds = [initial.feed];
    items = initial.items;
    saveFeeds(feeds);
    saveItems(items);
  }

  return { feeds, items, categories, tags, settings, notifSettings, openRouterConfig };
}

export function saveFeeds(feeds: FeedSource[]) {
  try {
    localStorage.setItem(FEEDS_KEY, JSON.stringify(feeds));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

export function saveItems(items: FeedItem[]) {
  try {
    // Keep max 500 items cached in localStorage to avoid storage quota overflow
    const trimmed = items.slice(0, 500);
    localStorage.setItem(ITEMS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('LocalStorage save error for items:', e);
  }
}

export function saveCategories(categories: FeedCategory[]) {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

export function saveTags(tags: FeedTag[]) {
  try {
    localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

export function saveSettings(settings: ReaderSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

export function saveNotificationSettings(settings: NotificationSettings) {
  try {
    localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

export function saveOpenRouterConfig(config: OpenRouterConfig) {
  try {
    localStorage.setItem(OPENROUTER_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

export function exportOpml(feeds: FeedSource[]): string {
  const outlines = feeds
    .map(
      (f) =>
        `    <outline text="${escapeXml(f.title)}" title="${escapeXml(f.title)}" type="rss" xmlUrl="${escapeXml(f.url)}" htmlUrl="${escapeXml(f.link || f.url)}" category="${escapeXml(f.category)}" />`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>nomatic RSS Subscriptions Export</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>
${outlines}
  </body>
</opml>`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
