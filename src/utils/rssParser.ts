import { FeedItem, FeedSource } from '../types';
import { extractTagsFromText } from '../data/defaultFeeds';
import { parseArticleDate } from './dateUtils';
import { getApiUrl } from './apiUrl';

export async function fetchAndParseFeed(
  rawFeedUrl: string,
  categoryId: string = 'software',
  customTags: string[] = [],
  existingFeedId?: string
): Promise<{ feed: FeedSource; items: FeedItem[] }> {
  let feedUrl = rawFeedUrl.trim();

  // Normalize Bluesky Profile URLs and Handles to their real-time RSS endpoint
  if (feedUrl.includes('bsky.app/profile/') && !feedUrl.endsWith('/rss')) {
    feedUrl = feedUrl.replace(/\/+$/, '') + '/rss';
  } else if (/^@?[a-zA-Z0-9_\-\.]+\.bsky\.social$/i.test(feedUrl)) {
    const handle = feedUrl.replace(/^@/, '');
    feedUrl = `https://bsky.app/profile/${handle}/rss`;
  }

  let xmlText = '';

  // 1. Try our backend proxy first (handles CORS flawlessly and bypasses browser cache)
  try {
    const proxyUrl = getApiUrl(`/api/rss/fetch?url=${encodeURIComponent(feedUrl)}&_t=${Date.now()}`);
    const res = await fetch(proxyUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    if (res.ok) {
      xmlText = await res.text();
    }
  } catch (e) {
    console.warn('Backend proxy fetch failed, trying direct/corsproxy fallback...', e);
  }

  // 2. If proxy failed (e.g. offline or pure client), try direct or AllOrigins public proxy
  if (!xmlText) {
    try {
      const res = await fetch(feedUrl, { cache: 'no-store' });
      if (res.ok) {
        xmlText = await res.text();
      }
    } catch (e) {
      // Try AllOrigins proxy
      try {
        const fallbackRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}&_t=${Date.now()}`, {
          cache: 'no-store'
        });
        if (fallbackRes.ok) {
          xmlText = await fallbackRes.text();
        }
      } catch (err2) {
        throw new Error(`Could not fetch RSS feed from ${feedUrl}. Check URL or network connection.`);
      }
    }
  }

  if (!xmlText) {
    throw new Error('Empty response received from feed.');
  }

  return parseFeedXmlString(xmlText, feedUrl, categoryId, customTags, existingFeedId);
}

export function parseFeedXmlString(
  xmlText: string,
  feedUrl: string,
  categoryId: string = 'software',
  customTags: string[] = [],
  existingFeedId?: string
): { feed: FeedSource; items: FeedItem[] } {
  // Check if it's JSON Feed format
  if (xmlText.trim().startsWith('{')) {
    try {
      const json = JSON.parse(xmlText);
      return parseJsonFeed(json, feedUrl, categoryId, customTags, existingFeedId);
    } catch (e) {
      // Continue to XML parser
    }
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Check for parser errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error(`Invalid XML format in RSS feed: ${parseError.textContent?.slice(0, 100)}`);
  }

  // Check if RSS or Atom
  const isAtom = !!xmlDoc.querySelector('feed');
  const feedId = existingFeedId || `feed-${feedUrl.replace(/[^a-zA-Z0-9]/g, '').slice(0, 40)}`;

  if (isAtom) {
    return parseAtomFeed(xmlDoc, feedUrl, feedId, categoryId, customTags);
  } else {
    return parseRss2Feed(xmlDoc, feedUrl, feedId, categoryId, customTags);
  }
}

function parseRss2Feed(
  xmlDoc: Document,
  feedUrl: string,
  feedId: string,
  categoryId: string,
  customTags: string[]
): { feed: FeedSource; items: FeedItem[] } {
  const channel = xmlDoc.querySelector('channel') || xmlDoc.documentElement;
  const feedTitle = channel.querySelector('title')?.textContent?.trim() || 'Untitled RSS Feed';
  const feedLink = channel.querySelector('link')?.textContent?.trim() || feedUrl;
  const feedDesc = channel.querySelector('description')?.textContent?.trim() || '';
  const feedIcon = channel.querySelector('image > url')?.textContent?.trim() || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(feedLink)}&sz=128`;

  const feed: FeedSource = {
    id: feedId,
    title: feedTitle,
    url: feedUrl,
    link: feedLink,
    description: feedDesc,
    category: categoryId,
    icon: feedIcon,
    color: getRandomColor(),
    lastFetched: Date.now(),
    customTags: customTags,
    syncStatus: 'success',
  };

  const itemNodes = xmlDoc.querySelectorAll('item');
  const items: FeedItem[] = [];

  itemNodes.forEach((node, idx) => {
    const title = node.querySelector('title')?.textContent?.trim() || 'Untitled Article';
    const link = node.querySelector('link')?.textContent?.trim() || '';
    const guid = node.querySelector('guid')?.textContent?.trim() || link || `item-${feedId}-${idx}`;
    
    // Check multiple RSS/Dublin Core date fields: pubDate, dc:date, date, published
    const pubDateStr = 
      node.querySelector('pubDate')?.textContent?.trim() ||
      node.getElementsByTagNameNS('*', 'date')[0]?.textContent?.trim() ||
      node.querySelector('date')?.textContent?.trim() ||
      node.querySelector('published')?.textContent?.trim() ||
      new Date().toUTCString();

    const parsedDateObj = parseArticleDate(pubDateStr);
    const validTimestamp = parsedDateObj.getTime() || Date.now() - idx * 60000;
    
    // Description and Content
    const descRaw = node.querySelector('description')?.textContent?.trim() || '';
    const contentEncoded = node.getElementsByTagNameNS('*', 'encoded')[0]?.textContent?.trim() || '';
    const fullHtml = contentEncoded || descRaw;

    // Enclosure & Media Content
    const enclosureNode = node.querySelector('enclosure');
    let mediaUrl = enclosureNode?.getAttribute('url') || '';
    let mediaTypeStr = enclosureNode?.getAttribute('type') || '';
    
    // Check media:content or media:thumbnail
    const mediaContent = node.getElementsByTagNameNS('*', 'content')[0];
    const mediaThumbnail = node.getElementsByTagNameNS('*', 'thumbnail')[0];

    if (!mediaUrl && mediaContent) {
      mediaUrl = mediaContent.getAttribute('url') || '';
      if (!mediaTypeStr) mediaTypeStr = mediaContent.getAttribute('type') || '';
    }
    if (!mediaUrl && mediaThumbnail) {
      mediaUrl = mediaThumbnail.getAttribute('url') || '';
    }

    // Clean plain text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fullHtml;
    const cleanText = tempDiv.textContent || tempDiv.innerText || '';

    // Extract image if no mediaUrl yet
    if (!mediaUrl) {
      const imgInHtml = tempDiv.querySelector('img')?.getAttribute('src');
      if (imgInHtml) {
        mediaUrl = imgInHtml;
      }
    }

    // Extract YouTube or video embed if present
    let videoUrl = '';
    let audioUrl = '';
    let itemMediaType: 'video' | 'audio' | 'image' | 'article' = 'article';

    if (mediaTypeStr.startsWith('video/') || link.includes('youtube.com') || link.includes('youtu.be') || mediaUrl.match(/\.(mp4|webm|mov)$/i)) {
      itemMediaType = 'video';
      videoUrl = mediaUrl || link;
    } else if (mediaTypeStr.startsWith('audio/') || mediaUrl.match(/\.(mp3|ogg|wav|m4a|aac)$/i)) {
      itemMediaType = 'audio';
      audioUrl = mediaUrl;
    } else if (mediaUrl) {
      itemMediaType = 'image';
    }

    const autoTags = extractTagsFromText(title, cleanText);
    const combinedTags = Array.from(new Set([...customTags, ...autoTags]));

    const wordCount = (title + ' ' + cleanText).split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 180));

    items.push({
      id: `item-${feedId}-${idx}-${guid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`,
      guid: guid,
      title: title,
      link: link,
      pubDate: pubDateStr,
      isoDate: parsedDateObj.toISOString(),
      timestamp: validTimestamp,
      description: cleanText.slice(0, 350) + (cleanText.length > 350 ? '...' : ''),
      content: fullHtml || cleanText,
      author: node.querySelector('author')?.textContent || node.getElementsByTagNameNS('*', 'creator')[0]?.textContent || feedTitle,
      enclosure: mediaUrl ? { url: mediaUrl, type: mediaTypeStr || 'image/jpeg' } : undefined,
      imageUrl: itemMediaType === 'image' || mediaUrl ? mediaUrl : undefined,
      videoUrl: videoUrl || undefined,
      audioUrl: audioUrl || undefined,
      mediaType: itemMediaType,
      category: categoryId,
      tags: combinedTags,
      feedId: feed.id,
      feedTitle: feed.title,
      feedIcon: feed.icon,
      isFavorite: false,
      isReadLater: false,
      isRead: false,
      readingTimeMinutes: readingTime,
      wordCount: wordCount,
      cachedOffline: true,
    });
  });

  feed.itemCount = items.length;
  feed.unreadCount = items.length;

  return { feed, items };
}

function parseAtomFeed(
  xmlDoc: Document,
  feedUrl: string,
  feedId: string,
  categoryId: string,
  customTags: string[]
): { feed: FeedSource; items: FeedItem[] } {
  const feedNode = xmlDoc.querySelector('feed') || xmlDoc.documentElement;
  const feedTitle = feedNode.querySelector('title')?.textContent?.trim() || 'Atom Feed';
  const feedLink = feedNode.querySelector('link[rel="alternate"]')?.getAttribute('href') || feedNode.querySelector('link')?.getAttribute('href') || feedUrl;
  const feedDesc = feedNode.querySelector('subtitle')?.textContent?.trim() || '';
  const feedIcon = feedNode.querySelector('icon')?.textContent?.trim() || feedNode.querySelector('logo')?.textContent?.trim() || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(feedLink)}&sz=128`;

  const feed: FeedSource = {
    id: feedId,
    title: feedTitle,
    url: feedUrl,
    link: feedLink,
    description: feedDesc,
    category: categoryId,
    icon: feedIcon,
    color: getRandomColor(),
    lastFetched: Date.now(),
    customTags: customTags,
    syncStatus: 'success',
  };

  const entryNodes = xmlDoc.querySelectorAll('entry');
  const items: FeedItem[] = [];

  entryNodes.forEach((node, idx) => {
    const title = node.querySelector('title')?.textContent?.trim() || 'Untitled Entry';
    const link = node.querySelector('link[rel="alternate"]')?.getAttribute('href') || node.querySelector('link')?.getAttribute('href') || '';
    const guid = node.querySelector('id')?.textContent?.trim() || link || `entry-${feedId}-${idx}`;
    const pubDateStr = 
      node.querySelector('published')?.textContent?.trim() ||
      node.querySelector('updated')?.textContent?.trim() ||
      node.querySelector('issued')?.textContent?.trim() ||
      node.querySelector('created')?.textContent?.trim() ||
      new Date().toISOString();
    
    const parsedDateObj = parseArticleDate(pubDateStr);
    const validTimestamp = parsedDateObj.getTime() || Date.now() - idx * 60000;
    
    const contentNode = node.querySelector('content') || node.querySelector('summary');
    const fullHtml = contentNode?.textContent?.trim() || '';

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fullHtml;
    const cleanText = tempDiv.textContent || tempDiv.innerText || '';
    const imgInHtml = tempDiv.querySelector('img')?.getAttribute('src') || '';

    const autoTags = extractTagsFromText(title, cleanText);
    const combinedTags = Array.from(new Set([...customTags, ...autoTags]));

    const wordCount = (title + ' ' + cleanText).split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 180));

    items.push({
      id: `item-${feedId}-${idx}-${guid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`,
      guid: guid,
      title: title,
      link: link,
      pubDate: pubDateStr,
      isoDate: parsedDateObj.toISOString(),
      timestamp: validTimestamp,
      description: cleanText.slice(0, 350) + (cleanText.length > 350 ? '...' : ''),
      content: fullHtml || cleanText,
      author: node.querySelector('author > name')?.textContent || feedTitle,
      imageUrl: imgInHtml || undefined,
      mediaType: imgInHtml ? 'image' : 'article',
      category: categoryId,
      tags: combinedTags,
      feedId: feed.id,
      feedTitle: feed.title,
      feedIcon: feed.icon,
      isFavorite: false,
      isReadLater: false,
      isRead: false,
      readingTimeMinutes: readingTime,
      wordCount: wordCount,
      cachedOffline: true,
    });
  });

  feed.itemCount = items.length;
  feed.unreadCount = items.length;

  return { feed, items };
}

function parseJsonFeed(
  json: any,
  feedUrl: string,
  categoryId: string,
  customTags: string[],
  existingFeedId?: string
): { feed: FeedSource; items: FeedItem[] } {
  const feedId = existingFeedId || `feed-json-${feedUrl.replace(/[^a-zA-Z0-9]/g, '').slice(0, 30)}`;
  const feed: FeedSource = {
    id: feedId,
    title: json.title || 'JSON Feed',
    url: feedUrl,
    link: json.home_page_url || feedUrl,
    description: json.description || '',
    icon: json.icon || json.favicon || '',
    category: categoryId,
    color: getRandomColor(),
    lastFetched: Date.now(),
    customTags: customTags,
    syncStatus: 'success',
  };

  const items: FeedItem[] = (json.items || []).map((item: any, idx: number) => {
    const title = item.title || 'Untitled';
    const link = item.url || '';
    const fullHtml = item.content_html || item.content_text || '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fullHtml;
    const cleanText = tempDiv.textContent || tempDiv.innerText || '';
    const imageUrl = item.image || item.banner_image || tempDiv.querySelector('img')?.getAttribute('src');

    const autoTags = extractTagsFromText(title, cleanText);
    const combinedTags = Array.from(new Set([...customTags, ...autoTags]));
    const wordCount = (title + ' ' + cleanText).split(/\s+/).filter(Boolean).length;

    const pubDateStr = item.date_published || item.date_modified || new Date().toISOString();
    const parsedDateObj = parseArticleDate(pubDateStr);

    return {
      id: `item-${feedId}-${idx}-${(item.id || idx).toString().replace(/[^a-zA-Z0-9]/g, '')}`,
      guid: item.id || link,
      title: title,
      link: link,
      pubDate: pubDateStr,
      isoDate: parsedDateObj.toISOString(),
      timestamp: parsedDateObj.getTime() || Date.now() - idx * 60000,
      description: cleanText.slice(0, 350),
      content: fullHtml,
      author: item.author?.name || feed.title,
      imageUrl: imageUrl,
      mediaType: imageUrl ? 'image' : 'article',
      category: categoryId,
      tags: combinedTags,
      feedId: feed.id,
      feedTitle: feed.title,
      feedIcon: feed.icon,
      isFavorite: false,
      isReadLater: false,
      isRead: false,
      readingTimeMinutes: Math.max(1, Math.ceil(wordCount / 180)),
      wordCount: wordCount,
      cachedOffline: true,
    };
  });

  feed.itemCount = items.length;
  feed.unreadCount = items.length;

  return { feed, items };
}

function getRandomColor(): string {
  const colors = ['#6366f1', '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#14b8a6'];
  return colors[Math.floor(Math.random() * colors.length)];
}
