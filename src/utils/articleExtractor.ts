import { getApiUrl } from './apiUrl';

export interface ExtractedArticle {
  title?: string;
  author?: string;
  leadImageUrl?: string;
  contentHtml?: string;
  textContent?: string;
  wordCount?: number;
  readingTimeMinutes?: number;
  sourceUrl?: string;
}

/**
 * Extracts full article content from a web URL.
 * Combines server-side readability extractor with client-side DOMParser fallbacks.
 */
export async function extractArticleContent(articleUrl: string): Promise<ExtractedArticle> {
  if (!articleUrl || !articleUrl.startsWith('http')) {
    throw new Error('Invalid article URL provided.');
  }

  // 1. Try server-side extractor first
  try {
    const res = await fetch(getApiUrl(`/api/article/extract?url=${encodeURIComponent(articleUrl)}`), {
      headers: {
        'Accept': 'application/json',
      },
    });

    const contentType = res.headers.get('content-type') || '';
    const rawText = await res.text();

    if (rawText.trim().startsWith('{')) {
      try {
        const data = JSON.parse(rawText);
        if (data.success && data.article && data.article.contentHtml) {
          return data.article;
        }
        if (data.error) {
          console.warn('Backend extraction notice:', data.error);
        }
      } catch (jsonErr) {
        console.warn('Failed to parse backend JSON, falling back to client-side extraction...');
      }
    }
  } catch (e) {
    console.warn('Backend extraction endpoint unreachable, trying client fallback...', e);
  }

  // 2. Fallback: Fetch raw HTML via /api/rss/fetch proxy or CORS proxy, then parse via DOMParser
  let rawHtml = '';
  try {
    const proxyRes = await fetch(getApiUrl(`/api/rss/fetch?url=${encodeURIComponent(articleUrl)}`));
    if (proxyRes.ok) {
      rawHtml = await proxyRes.text();
    }
  } catch (err) {
    // Try public fallback
  }

  if (!rawHtml || !rawHtml.includes('<')) {
    try {
      const fallbackRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(articleUrl)}`);
      if (fallbackRes.ok) {
        rawHtml = await fallbackRes.text();
      }
    } catch (e) {
      // ignore
    }
  }

  if (!rawHtml || !rawHtml.includes('<')) {
    throw new Error('Could not fetch article webpage. The website may restrict external automated access.');
  }

  // Parse HTML client-side
  return parseArticleHtmlClient(rawHtml, articleUrl);
}

/**
 * Client-side Readability & Clean DOM Parser
 */
export function parseArticleHtmlClient(htmlText: string, articleUrl: string): ExtractedArticle {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');

  // Remove scripts, styles, iframes, ads, cookies, nav, footers
  const toRemove = doc.querySelectorAll('script, style, noscript, iframe, svg, nav, header, footer, form, .ads, .advertisement, .social-share, .cookie-banner, .newsletter-signup, .related-posts, .comments, aside, .sidebar');
  toRemove.forEach((el) => el.remove());

  const title = 
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    doc.querySelector('title')?.textContent?.trim() ||
    'Article';

  const author = 
    doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
    doc.querySelector('meta[property="article:author"]')?.getAttribute('content') ||
    doc.querySelector('.author, .byline, [rel="author"]')?.textContent?.trim();

  const leadImageUrl = 
    doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');

  // Candidate selectors for article content
  const candidates = [
    'article',
    '[itemprop="articleBody"]',
    '.article-body',
    '.article-content',
    '.post-content',
    '.entry-content',
    '.content-article',
    '.story-body',
    '.story-content',
    'main',
    '#article-body',
    '#story-content'
  ];

  let contentEl: Element | null = null;
  for (const selector of candidates) {
    const el = doc.querySelector(selector);
    if (el && (el.textContent || '').trim().length > 250) {
      contentEl = el;
      break;
    }
  }

  if (!contentEl) {
    // Find container with the most paragraph elements
    const sections = Array.from(doc.querySelectorAll('div, section'));
    let maxPCount = 0;
    sections.forEach((sec) => {
      const pCount = sec.querySelectorAll('p').length;
      if (pCount > maxPCount && (sec.textContent || '').trim().length > 250) {
        maxPCount = pCount;
        contentEl = sec;
      }
    });
  }

  if (!contentEl) {
    contentEl = doc.body;
  }

  // Resolve relative links and images into absolute URLs
  try {
    const baseUrl = new URL(articleUrl);

    contentEl.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('srcset')?.split(' ')[0];
      if (src) {
        try {
          img.setAttribute('src', new URL(src, baseUrl.origin).href);
          img.removeAttribute('srcset');
          img.removeAttribute('data-src');
          img.className = 'rounded-2xl max-w-full h-auto my-4 shadow-md';
        } catch (e) {}
      }
    });

    contentEl.querySelectorAll('a').forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        try {
          link.setAttribute('href', new URL(href, baseUrl.origin).href);
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
          link.className = 'text-indigo-400 underline hover:text-indigo-300';
        } catch (e) {}
      }
    });
  } catch (e) {}

  const contentHtml = contentEl.innerHTML || '';
  const textContent = (contentEl.textContent || '').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 220));

  return {
    title,
    author: author || undefined,
    leadImageUrl: leadImageUrl || undefined,
    contentHtml,
    textContent,
    wordCount,
    readingTimeMinutes,
    sourceUrl: articleUrl,
  };
}
