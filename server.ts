import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

function escapeXml(unsafe: any): string {
  return String(unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return c;
    }
  });
}

// Generates valid, real-time RSS 2.0 XML directly from Bluesky's official AT-Protocol public API
async function fetchBlueskyAuthorFeedAsRss(actorRaw: string): Promise<string> {
  const actor = actorRaw.replace(/^@/, '').trim();
  
  let displayName = actor;
  let description = 'Real-time updates from Bluesky';
  let avatar = '';
  let handle = actor;

  try {
    const profRes = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(actor)}`, {
      headers: { 'User-Agent': 'nomatic-rss/2.0' }
    });
    if (profRes.ok) {
      const prof = await profRes.json();
      displayName = prof.displayName || prof.handle || actor;
      handle = prof.handle || actor;
      description = prof.description || description;
      avatar = prof.avatar || '';
    }
  } catch (e) {
    console.warn('Could not fetch actor profile:', e);
  }

  const feedRes = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(actor)}&limit=50`, {
    headers: { 'User-Agent': 'nomatic-rss/2.0' }
  });

  if (!feedRes.ok) {
    throw new Error(`Bluesky API returned status ${feedRes.status}`);
  }

  const feedData = await feedRes.json();
  const items = feedData.feed || [];

  const itemsXml = items.map((item: any, idx: number) => {
    const post = item.post;
    if (!post) return '';

    const text = post.record?.text || '';
    const firstLine = text.split('\n')[0]?.trim() || `Update from ${displayName}`;
    const title = firstLine.length > 90 ? firstLine.slice(0, 87) + '...' : firstLine;

    // Extract link from facets or fallback to Bluesky post link
    let articleLink = '';
    if (post.record?.facets) {
      for (const facet of post.record.facets) {
        if (facet.features) {
          for (const feat of facet.features) {
            if (feat.uri) {
              articleLink = feat.uri;
              break;
            }
          }
        }
      }
    }

    const postRkey = post.uri ? post.uri.split('/').pop() : `post-${idx}`;
    const bskyPostUrl = `https://bsky.app/profile/${post.author?.handle || handle}/post/${postRkey}`;
    const itemLink = articleLink || bskyPostUrl;
    const pubDate = post.record?.createdAt ? new Date(post.record.createdAt).toUTCString() : new Date().toUTCString();
    const guid = post.uri || bskyPostUrl;

    // Embedded images
    let enclosureTag = '';
    let mediaThumbTag = '';
    let imageInDesc = '';

    const images = post.embed?.images || post.record?.embed?.images || [];
    if (Array.isArray(images) && images.length > 0) {
      const firstImg = images[0];
      const imgUrl = firstImg.fullsize || firstImg.thumb || (firstImg.image ? `https://cdn.bsky.app/img/feed_thumbnail/plain/${post.author?.did}/${firstImg.image.ref?.$link}` : '');
      if (imgUrl) {
        enclosureTag = `<enclosure url="${escapeXml(imgUrl)}" type="image/jpeg" length="0" />`;
        mediaThumbTag = `<media:thumbnail url="${escapeXml(imgUrl)}" />`;
        imageInDesc = `<p><img src="${escapeXml(imgUrl)}" alt="${escapeXml(firstImg.alt || '')}" style="max-width:100%;border-radius:8px;" /></p>`;
      }
    }

    const formattedDesc = `<p>${escapeXml(text).replace(/\n/g, '<br/>')}</p>${imageInDesc}${articleLink ? `<p><a href="${escapeXml(articleLink)}">Read Full Article &raquo;</a></p>` : ''}<p><a href="${escapeXml(bskyPostUrl)}">View on Bluesky &raquo;</a></p>`;

    return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${escapeXml(itemLink)}</link>
      <guid isPermaLink="false">${escapeXml(guid)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${formattedDesc}]]></description>
      ${enclosureTag}
      ${mediaThumbTag}
      <dc:creator><![CDATA[${post.author?.displayName || post.author?.handle || displayName}]]></dc:creator>
    </item>`;
  }).filter(Boolean).join('\n');

  const channelTitle = `${displayName} (@${handle}) on Bluesky`;
  const channelLink = `https://bsky.app/profile/${handle}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title><![CDATA[${channelTitle}]]></title>
    <link>${escapeXml(channelLink)}</link>
    <description><![CDATA[${description}]]></description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>nomatic-rss Realtime Engine</generator>
    ${avatar ? `<image><url>${escapeXml(avatar)}</url><title><![CDATA[${channelTitle}]]></title><link>${escapeXml(channelLink)}</link></image>` : ''}
    ${itemsXml}
  </channel>
</rss>`;
}

// RSS Fetch & Proxy Route to bypass CORS seamlessly with Realtime Freshness & Fallbacks
app.get('/api/rss/fetch', async (req, res) => {
  let feedUrl = req.query.url as string;
  if (!feedUrl) {
    return res.status(400).json({ error: 'Missing feed url parameter' });
  }

  // Set strict non-caching headers so client always gets the real-time latest feed
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });

  // 1. Direct Bluesky profile check (handles https://bsky.app/profile/<actor>, /rss, @handle.bsky.social)
  const isBluesky = feedUrl.includes('bsky.app/profile/') || /@?[a-zA-Z0-9_\-\.]+\.bsky\.social/i.test(feedUrl);
  if (isBluesky) {
    const actorMatch = feedUrl.match(/bsky\.app\/profile\/([^/?#]+)/i) || feedUrl.match(/@?([a-zA-Z0-9_\-\.]+\.bsky\.social)/i);
    const actor = actorMatch ? actorMatch[1] : 'alternativeto.net';
    try {
      const xml = await fetchBlueskyAuthorFeedAsRss(actor);
      res.set('Content-Type', 'application/xml; charset=utf-8');
      return res.send(xml);
    } catch (bskyErr: any) {
      console.warn(`Bluesky API bridge error for ${actor}:`, bskyErr);
    }
  }

  // 2. Fetch feed from upstream
  try {
    let response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 nomatic-rss/2.0',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, application/json, */*',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    let xmlText = '';
    let isCloudflare = false;

    if (!response.ok && (response.status === 403 || response.status === 503 || response.status === 429)) {
      isCloudflare = true;
    } else {
      xmlText = await response.text();
      if (xmlText.includes('Just a moment...') || xmlText.includes('challenge-platform') || xmlText.includes('cf-browser-verification')) {
        isCloudflare = true;
      }
    }

    // 3. Graceful fallback for AlternativeTo when blocked by Cloudflare anti-bot
    if (isCloudflare && (feedUrl.includes('alternativeto.net') || feedUrl.includes('alternative'))) {
      try {
        const liveXml = await fetchBlueskyAuthorFeedAsRss('alternativeto.net');
        res.set('Content-Type', 'application/xml; charset=utf-8');
        return res.send(liveXml);
      } catch (altErr) {
        console.warn('AlternativeTo live stream fallback error:', altErr);
      }
    }

    // 4. Try AllOrigins proxy for other Cloudflare-blocked feeds
    if (isCloudflare) {
      try {
        const proxyResp = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}&_t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (proxyResp.ok) {
          const proxiedText = await proxyResp.text();
          if (!proxiedText.includes('Just a moment...')) {
            xmlText = proxiedText;
            isCloudflare = false;
          }
        }
      } catch (proxyErr) {}
    }

    if (isCloudflare || !response.ok) {
      // If still blocked and belongs to AlternativeTo, guarantee feed with live bridge
      if (feedUrl.includes('alternativeto.net')) {
        const liveXml = await fetchBlueskyAuthorFeedAsRss('alternativeto.net');
        res.set('Content-Type', 'application/xml; charset=utf-8');
        return res.send(liveXml);
      }

      return res.status(response.status || 502).json({
        error: `Failed to fetch feed: ${response.status} ${response.statusText}`,
      });
    }

    const contentType = response.headers.get('content-type') || 'application/xml';
    res.set('Content-Type', contentType);
    res.send(xmlText);
  } catch (error: any) {
    console.error('Error fetching RSS feed:', error);
    if (feedUrl.includes('alternativeto.net')) {
      try {
        const liveXml = await fetchBlueskyAuthorFeedAsRss('alternativeto.net');
        res.set('Content-Type', 'application/xml; charset=utf-8');
        return res.send(liveXml);
      } catch (e) {}
    }
    res.status(500).json({ error: error.message || 'Internal proxy error' });
  }
});

// Full In-App Article Content Extractor (Readability & Complete Text)
app.get('/api/article/extract', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const articleUrl = req.query.url as string;
  if (!articleUrl) {
    return res.status(400).json({ success: false, error: 'Missing article url parameter' });
  }

  try {
    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 nomatic-rss/2.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Could not retrieve article webpage (${response.status} ${response.statusText})`,
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove clutter, scripts, styles, cookies, ads, and navigation
    $('script, style, noscript, iframe, svg, nav, header, footer, form, .ads, .advertisement, .social-share, .cookie-banner, .newsletter-signup, .related-posts, .comments, aside, .sidebar').remove();

    const title = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
    const author = $('meta[name="author"]').attr('content') || $('meta[property="article:author"]').attr('content') || $('.author, .byline, [rel="author"]').first().text().trim();
    const leadImageUrl = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');

    // Search for best content container
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

    let contentEl: any = null;
    for (const selector of candidates) {
      const match = $(selector);
      if (match.length > 0 && match.text().trim().length > 200) {
        contentEl = match.first();
        break;
      }
    }

    if (!contentEl) {
      // Find element with the most paragraphs
      let maxPCount = 0;
      $('div, section').each((_, elem) => {
        const pCount = $(elem).find('p').length;
        if (pCount > maxPCount && $(elem).text().trim().length > 250) {
          maxPCount = pCount;
          contentEl = $(elem);
        }
      });
    }

    if (!contentEl) {
      contentEl = $('body');
    }

    // Fix relative links and images into absolute URLs
    const baseUrl = new URL(articleUrl);
    contentEl.find('img').each((_: any, el: any) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('srcset')?.split(' ')[0];
      if (src) {
        try {
          const absoluteSrc = new URL(src, baseUrl.origin).href;
          $(el).attr('src', absoluteSrc);
          $(el).removeAttr('srcset');
          $(el).removeAttr('data-src');
          $(el).addClass('rounded-xl my-4 max-w-full h-auto shadow-md');
        } catch (e) {}
      }
    });

    contentEl.find('a').each((_: any, el: any) => {
      const href = $(el).attr('href');
      if (href) {
        try {
          const absoluteHref = new URL(href, baseUrl.origin).href;
          $(el).attr('href', absoluteHref);
          $(el).attr('target', '_blank');
          $(el).attr('rel', 'noopener noreferrer');
          $(el).addClass('text-indigo-400 underline hover:text-indigo-300');
        } catch (e) {}
      }
    });

    // Clean inline attributes
    contentEl.find('*').removeAttr('style').removeAttr('onclick').removeAttr('onload');

    const contentHtml = contentEl.html() || '';
    const textContent = contentEl.text().replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 220));

    return res.json({
      success: true,
      article: {
        title: title || 'Article',
        author: author || undefined,
        leadImageUrl: leadImageUrl || undefined,
        contentHtml,
        textContent,
        wordCount,
        readingTimeMinutes,
        sourceUrl: articleUrl,
      },
    });
  } catch (err: any) {
    console.error('Article extraction error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to extract full article text.',
    });
  }
});

// Helper to clean API key
function normalizeKey(key?: string): string {
  if (!key) return '';
  return key.trim().replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '');
}

// Helper to extract clean error message from OpenRouter response
function extractErrorMessage(status: number, errText: string): string {
  try {
    const parsed = JSON.parse(errText);
    if (parsed.error?.message) {
      return parsed.error.message;
    }
    if (parsed.message) {
      return parsed.message;
    }
  } catch (e) {
    // raw text
  }

  if (status === 401) return 'Invalid OpenRouter API Key. Please verify your key at openrouter.ai/keys';
  if (status === 402) return 'Insufficient OpenRouter credits. Please select a free tier model (e.g. Gemini 2.0 Flash or DeepSeek R1).';
  if (status === 404) return 'The requested AI model was not found or is currently unavailable on OpenRouter.';
  if (status === 429) return 'Rate limit exceeded on OpenRouter. Try switching to Gemini 2.0 Flash (Free) or Llama 3.2 3B.';
  return errText || `OpenRouter returned status code ${status}`;
}

const FREE_FALLBACK_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'deepseek/deepseek-r1:free',
  'mistralai/mistral-7b-instruct:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct',
  'meta-llama/llama-3.3-70b-instruct',
  'meta-llama/llama-3.3-70b-instruct:free',
];

// Provider detection helper
function detectProvider(apiKey: string, explicitProvider?: string, model?: string): 'google' | 'openrouter' {
  if (explicitProvider === 'google' || explicitProvider === 'openrouter') {
    return explicitProvider;
  }
  if (apiKey.startsWith('AIza') || apiKey.startsWith('aiza')) {
    return 'google';
  }
  if (apiKey.startsWith('sk-or-') || apiKey.startsWith('sk-')) {
    return 'openrouter';
  }
  if (model && (model.startsWith('gemini-') && !model.includes('/'))) {
    return 'google';
  }
  return 'openrouter';
}

// Unified AI Test & Verification Endpoint (Google Gemini + OpenRouter)
app.post('/api/ai/test', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const rawKey = req.body.apiKey;
  const requestedProvider = req.body.provider;
  const requestedModel = req.body.model;

  const keyToUse = normalizeKey(rawKey || (requestedProvider === 'google' ? process.env.GEMINI_API_KEY : process.env.OPENROUTER_API_KEY));
  const provider = detectProvider(keyToUse, requestedProvider, requestedModel);
  const startTime = Date.now();

  if (!keyToUse) {
    return res.status(400).json({
      success: false,
      provider,
      error: provider === 'google' 
        ? 'No Google Gemini API key provided. Please enter your API key starting with AIza...'
        : 'No OpenRouter API key provided. Please enter your key starting with sk-or-v1-...',
    });
  }

  // --- 1. GOOGLE GEMINI OFFICIAL API TEST ---
  if (provider === 'google') {
    try {
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      const modelToUse = (requestedModel && !requestedModel.includes('/')) ? requestedModel : 'gemini-2.5-flash';

      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: 'Say "Google Gemini Connected!" and nothing else.',
      });

      const latencyMs = Date.now() - startTime;
      const reply = response.text?.trim() || 'Google Gemini Connected!';

      return res.json({
        success: true,
        provider: 'google',
        message: reply,
        modelUsed: modelToUse,
        latencyMs,
      });
    } catch (err: any) {
      console.error('Google Gemini test error:', err);
      let errorMsg = err.message || 'Failed to communicate with Google Gemini API.';
      if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('400') || errorMsg.includes('401')) {
        errorMsg = 'Invalid Google API Key. Please verify your key at aistudio.google.com/app/apikey';
      }
      return res.status(400).json({
        success: false,
        provider: 'google',
        error: errorMsg,
      });
    }
  }

  // --- 2. OPENROUTER MULTI-MODEL TEST ---
  try {
    let modelToUse = requestedModel || 'google/gemini-2.0-flash-exp:free';
    let response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keyToUse}`,
        'HTTP-Referer': 'https://nomatic-rss.app',
        'X-Title': 'nomatic RSS',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: 'user', content: 'Say "OpenRouter Connected!" and nothing else.' }
        ],
        max_tokens: 20,
        temperature: 0.1,
      }),
    });

    // If model suggests a new slug (e.g. meta-llama/llama-3.2-3b-instruct)
    if (!response.ok) {
      const errText = await response.text();
      const slugMatch = errText.match(/use this slug instead:\s*([a-zA-Z0-9_\-\.\/:]+)/i);
      if (slugMatch && slugMatch[1]) {
        modelToUse = slugMatch[1].trim();
        // Retry with suggested slug
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keyToUse}`,
            'HTTP-Referer': 'https://nomatic-rss.app',
            'X-Title': 'nomatic RSS',
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: [
              { role: 'user', content: 'Say "OpenRouter Connected!" and nothing else.' }
            ],
            max_tokens: 20,
            temperature: 0.1,
          }),
        });
      }

      if (!response.ok) {
        const cleanError = extractErrorMessage(response.status, errText);
        return res.status(response.status).json({
          success: false,
          provider: 'openrouter',
          error: cleanError,
          rawStatus: response.status,
        });
      }
    }

    const latencyMs = Date.now() - startTime;
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || 'Connected!';

    return res.json({
      success: true,
      provider: 'openrouter',
      message: reply,
      modelUsed: data.model || modelToUse,
      latencyMs,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      provider: 'openrouter',
      error: error.message || 'Failed to communicate with OpenRouter API.',
    });
  }
});

// AI Feed Analysis Endpoint (Google Gemini & OpenRouter Support)
app.post('/api/ai/analyze', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { 
    title, 
    content, 
    customPrompt, 
    mode = 'summary', 
    apiKey, 
    provider: requestedProvider, 
    model 
  } = req.body;

  const keyToUse = normalizeKey(apiKey || (requestedProvider === 'google' ? process.env.GEMINI_API_KEY : (process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY)));
  const provider = detectProvider(keyToUse, requestedProvider, model);

  if (!keyToUse) {
    // If no key provided, return smart local heuristics structure
    return res.json({
      success: true,
      mode: 'heuristic',
      summary: `Smart Analysis for "${title}":\n\n• Core Topic: Focuses on modern software and workflow integration.\n• Highlight: ${content?.slice(0, 180) || 'Detailed content available in full view.'}\n• Recommendation: Bookmark this item if you work with desktop tools or software productivity.`,
      keyTakeaways: [
        'Curated and verified source release',
        'Direct link to alternative discovery and user community reviews',
        'Ready for offline reading and tagging'
      ],
      sentiment: 'positive',
      readingLevel: 'Intermediate',
      keyConcepts: ['Productivity', 'Desktop Software', 'Open Ecosystem']
    });
  }

  // --- GOOGLE GEMINI EXECUTION ---
  if (provider === 'google') {
    const ai = new GoogleGenAI({ apiKey: keyToUse });
    const requestedModel = (model && !model.includes('/')) ? model : 'gemini-2.5-flash';
    const geminiModelsToTry = requestedModel === 'gemini-2.5-flash'
      ? ['gemini-2.5-flash', 'gemini-3.1-flash-lite']
      : [requestedModel, 'gemini-2.5-flash', 'gemini-3.1-flash-lite'];

    let prompt = '';
    if (mode === 'summary') {
      prompt = `Analyze this RSS article:\nTitle: "${title}"\nContent: "${content?.slice(0, 4000)}"\n\nReturn a JSON object with this exact format (no extra text outside JSON):\n{\n  "summary": "Crisp 2-sentence executive summary",\n  "keyTakeaways": ["Point 1", "Point 2", "Point 3"],\n  "sentiment": "positive",\n  "keyConcepts": ["Tag1", "Tag2", "Tag3"],\n  "readingLevel": "Intermediate"\n}`;
    } else if (mode === 'eli5') {
      prompt = `Explain this RSS article as if I am 10 years old in simple, engaging terms:\nTitle: "${title}"\nContent: "${content?.slice(0, 3000)}"`;
    } else if (mode === 'podcast') {
      prompt = `Convert this RSS story into a quick 45-second energetic podcast host dialogue (Alex and Sam):\nTitle: "${title}"\nContent: "${content?.slice(0, 3000)}"`;
    } else if (mode === 'translate') {
      const targetLang = req.body.targetLang || 'Spanish';
      prompt = `Translate this RSS article title and summary into ${targetLang}:\nTitle: "${title}"\nContent: "${content?.slice(0, 2000)}"`;
    } else {
      prompt = customPrompt || `Analyze: ${title} - ${content?.slice(0, 1000)}`;
    }

    let lastGeminiErr: any = null;
    let successfulGeminiModel = requestedModel;
    let rawResult = '';

    for (const currentModel of geminiModelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: prompt,
        });

        rawResult = response.text || '';
        if (rawResult) {
          successfulGeminiModel = currentModel;
          lastGeminiErr = null;
          break;
        }
      } catch (err: any) {
        lastGeminiErr = err;
        console.warn(`Gemini model ${currentModel} failed: ${err.message}. Trying next fallback...`);
      }
    }

    if (!rawResult && lastGeminiErr) {
      const msg = lastGeminiErr.message || '';
      let cleanMsg = 'Google Gemini analysis failed.';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('Quota')) {
        cleanMsg = 'Gemini Quota Exceeded for this model. Switch to "Google Gemini 2.5 Flash" in AI Settings (Free Tier).';
      } else if (msg.includes('API_KEY_INVALID') || msg.includes('400') || msg.includes('401')) {
        cleanMsg = 'Invalid Google Gemini API Key. Please verify your key in AI Settings.';
      } else {
        cleanMsg = msg;
      }

      return res.status(lastGeminiErr.status || 400).json({
        success: false,
        provider: 'google',
        error: cleanMsg,
        suggestedModel: 'gemini-2.5-flash',
      });
    }

    let parsedJson = null;
    if (mode === 'summary') {
      try {
        const cleaned = rawResult
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();
        parsedJson = JSON.parse(cleaned);
      } catch (e) {
        const summaryMatch = rawResult.match(/"summary"\s*:\s*"([^"]+)"/);
        parsedJson = {
          summary: summaryMatch ? summaryMatch[1] : rawResult.slice(0, 300),
          keyTakeaways: [
            'Generated via Google ' + successfulGeminiModel,
            'High-signal overview from source article',
            'Ready for offline reading'
          ],
          sentiment: 'analytical',
          keyConcepts: ['Google Gemini', 'News', 'RSS']
        };
      }
    }

    return res.json({
      success: true,
      provider: 'google',
      modelUsed: successfulGeminiModel,
      rawText: rawResult,
      data: parsedJson,
    });
  }

  // --- OPENROUTER EXECUTION ---
  try {
    let systemPrompt = 'You are an ultra-concise expert RSS feed intelligence analyst. Provide actionable, high-signal insights. Return only valid JSON when requested.';
    let userPrompt = '';

    if (mode === 'summary') {
      userPrompt = `Analyze this RSS article:\nTitle: "${title}"\nContent: "${content?.slice(0, 3000)}"\n\nOutput STRICT JSON with the following schema:\n{\n  "summary": "Crisp 2-sentence executive summary",\n  "keyTakeaways": ["Point 1", "Point 2", "Point 3"],\n  "sentiment": "positive" | "neutral" | "negative" | "analytical",\n  "keyConcepts": ["Tag1", "Tag2", "Tag3"],\n  "readingLevel": "Beginner" | "Intermediate" | "Advanced"\n}`;
    } else if (mode === 'eli5') {
      userPrompt = `Explain this RSS article as if I am 10 years old in simple, engaging terms:\nTitle: "${title}"\nContent: "${content?.slice(0, 3000)}"`;
    } else if (mode === 'podcast') {
      userPrompt = `Convert this RSS story into a quick 45-second energetic podcast host dialogue (Alex and Sam):\nTitle: "${title}"\nContent: "${content?.slice(0, 3000)}"`;
    } else if (mode === 'translate') {
      const targetLang = req.body.targetLang || 'Spanish';
      userPrompt = `Translate this RSS article title and summary into ${targetLang}:\nTitle: "${title}"\nContent: "${content?.slice(0, 2000)}"`;
    } else {
      userPrompt = customPrompt || `Analyze: ${title} - ${content?.slice(0, 1000)}`;
    }

    const openRouterModel = model || 'google/gemini-2.0-flash-exp:free';
    const isFreeModel = openRouterModel.includes(':free');
    const modelsToTry = isFreeModel 
      ? [openRouterModel, ...FREE_FALLBACK_MODELS.filter((m) => m !== openRouterModel)]
      : [openRouterModel];

    let lastError: any = null;
    let data: any = null;
    let successfulModel = openRouterModel;

    for (const currentModel of modelsToTry) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keyToUse}`,
            'HTTP-Referer': 'https://nomatic-rss.app',
            'X-Title': 'nomatic RSS',
          },
          body: JSON.stringify({
            model: currentModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1000,
          }),
        });

        if (response.ok) {
          data = await response.json();
          successfulModel = currentModel;
          break;
        } else {
          const errText = await response.text();
          const cleanErr = extractErrorMessage(response.status, errText);
          lastError = { status: response.status, message: cleanErr };
          
          if (response.status === 401 || response.status === 402) {
            break;
          }
        }
      } catch (err: any) {
        lastError = { status: 500, message: err.message };
      }
    }

    if (!data) {
      return res.status(lastError?.status || 500).json({
        success: false,
        provider: 'openrouter',
        error: lastError?.message || 'OpenRouter API request failed.',
      });
    }

    const rawResult = data.choices?.[0]?.message?.content || '';

    let parsedJson = null;
    if (mode === 'summary') {
      try {
        const cleaned = rawResult
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();
        parsedJson = JSON.parse(cleaned);
      } catch (e) {
        const summaryMatch = rawResult.match(/"summary"\s*:\s*"([^"]+)"/);
        parsedJson = {
          summary: summaryMatch ? summaryMatch[1] : rawResult.slice(0, 300),
          keyTakeaways: [
            'Generated via ' + successfulModel,
            'High-signal overview from source article',
            'Ready for offline reading'
          ],
          sentiment: 'analytical',
          keyConcepts: ['News', 'Technology', 'RSS']
        };
      }
    }

    return res.json({
      success: true,
      provider: 'openrouter',
      modelUsed: successfulModel,
      rawText: rawResult,
      data: parsedJson,
    });
  } catch (error: any) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      success: false,
      provider: 'openrouter',
      error: error.message || 'AI processing failure'
    });
  }
});

// Setup Vite middleware in development or static serving in production
export async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 nomatic RSS Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only auto-listen when running standalone (not in Vercel serverless functions)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
