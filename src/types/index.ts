export interface MediaEnclosure {
  url: string;
  type: string;
  length?: number;
  thumbnail?: string;
  duration?: number;
}

export interface FeedItem {
  id: string;
  guid: string;
  title: string;
  link: string;
  pubDate: string;
  isoDate?: string;
  timestamp: number;
  description: string;
  content: string;
  author?: string;
  enclosure?: MediaEnclosure;
  mediaType?: 'video' | 'audio' | 'image' | 'article';
  mediaUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  category?: string;
  tags: string[];
  feedId: string;
  feedTitle: string;
  feedIcon?: string;
  isFavorite: boolean;
  isReadLater: boolean;
  isRead: boolean;
  readAt?: number;
  readingTimeMinutes: number;
  wordCount: number;
  aiSummary?: string;
  aiKeyTakeaways?: string[];
  aiSentiment?: 'positive' | 'neutral' | 'negative' | 'analytical';
  aiPodcastScript?: { speaker: string; text: string }[];
  cachedOffline?: boolean;
}

export interface FeedSource {
  id: string;
  title: string;
  url: string;
  link?: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string;
  lastFetched?: number;
  itemCount?: number;
  unreadCount?: number;
  isDefault?: boolean;
  customTags?: string[];
  syncStatus?: 'idle' | 'syncing' | 'error' | 'success';
  errorMessage?: string;
}

export interface FeedCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

export interface FeedTag {
  id: string;
  name: string;
  color: string;
}

export type ReaderTheme = 'oled' | 'midnight' | 'slate' | 'emerald' | 'sepia' | 'light' | 'amber' | 'crimson';
export type ReaderFont = 'inter' | 'serif' | 'mono' | 'atkinson' | 'sans';
export type ReaderFontSize = 'sm' | 'base' | 'lg' | 'xl';
export type ReaderLineHeight = 'compact' | 'normal' | 'relaxed' | 'loose';
export type ViewMode = 'swipe-deck' | 'magazine' | 'cards' | 'compact' | 'split-reader';

export interface ReaderSettings {
  theme: ReaderTheme;
  fontFamily: ReaderFont;
  fontSize: ReaderFontSize;
  lineHeight: ReaderLineHeight;
  viewMode: ViewMode;
  autoMarkAsRead: boolean;
  openLinksInNewTab: boolean;
  ttsVoiceIndex: number;
  ttsRate: number;
  enableSwipeHaptics: boolean;
  bionicReading: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  browserPermission: NotificationPermission;
  checkIntervalMinutes: number;
  soundEnabled: boolean;
  unreadBadge: boolean;
}

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  customInstructions?: string;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  item: FeedItem | null;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  isTTS: boolean;
  ttsUtterance?: SpeechSynthesisUtterance | null;
}
