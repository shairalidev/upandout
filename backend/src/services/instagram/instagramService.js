// src/services/instagram/instagramService.js
import { withBrowser } from './brightBrowserClient.js';

const wait = (ms) => new Promise(r => setTimeout(r, ms));

function parseHashtags(text = '') {
  return Array.from(new Set((text.match(/#\w+/g) || []).map(h => h.slice(1).toLowerCase())));
}

function normalizeTile(href, imgSrc, imgAlt) {
  const id =
    (href || '').split('/reel/')[1]?.split('/')[0] ||
    (href || '').replace(/\W+/g, '');
  return {
    id,
    caption: imgAlt || '',
    comments: '',
    likes: null,
    views: null,
    timestamp: null,
    imageUrl: imgSrc || null,
    hashtags: parseHashtags(imgAlt || '')
  };
}

// Try to clear cookie/consent popups quickly if visible (best-effort, non-fatal)
async function dismissCookieBanner(page) {
  try {
    // variants seen on IG (change over time)
    const selectors = [
      'button:has-text("Only allow essential cookies")',
      'button:has-text("Allow all cookies")',
      'button:has-text("Accept")',
      'button[aria-label="Accept all"]',
    ];
    for (const sel of selectors) {
      const btn = await page.$(sel);
      if (btn) { await btn.click().catch(() => {}); await wait(500); break; }
    }
  } catch {}
}

/**
 * Open ONE page, do ONE navigation to hashtag reels grid, scroll to gather tiles.
 * Exported so both images-only and reels fetchers can reuse it.
 */
export async function scrapeHashtagReelsSingleNav(ctx, hashtag, need = 20) {
  const page = await ctx.newPage();
  try {
    const url = `https://www.instagram.com/explore/tags/${encodeURIComponent(hashtag)}/reels/`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    await dismissCookieBanner(page);
    await wait(1800);

    const results = new Map();

    for (let i = 0; i < 10 && results.size < need; i++) {
      const tiles = await page.$$eval('a[href^="/reel/"]', els =>
        els.map(el => {
          const href = el.getAttribute('href') || '';
          const img = el.querySelector('img');
          return { href, imgSrc: img?.src || null, imgAlt: img?.alt || '' };
        })
      );

      for (const t of tiles) {
        const n = {
          id:
            (t.href || '').split('/reel/')[1]?.split('/')[0] ||
            (t.href || '').replace(/\W+/g, ''),
          caption: t.imgAlt || '',
          comments: '',
          likes: null,
          views: null,
          timestamp: null,
          imageUrl: t.imgSrc || null,
          hashtags: (t.imgAlt || '').match(/#\w+/g)?.map(h => h.slice(1).toLowerCase()) || []
        };
        if (n.id && !results.has(n.id)) results.set(n.id, n);
        if (results.size >= need) break;
      }

      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.5));
      await wait(900);
    }

    return Array.from(results.values()).slice(0, need);
  } finally {
    await page.close();
  }
}

/**
 * IMAGES ONLY, READ-ONLY: open a fresh CDP session PER hashtag (1 goto -> scrape -> close).
 * Used by GET /api/items/images — no DB writes, no AI.
 */
export async function fetchImagesByHashtagsCDP(hashtags = [], limit = 24) {
  const bucket = [];
  const perTag = Math.max(6, Math.ceil(limit / Math.max(1, hashtags.length)));

  for (const tag of hashtags) {
    try {
      const items = await withBrowser(async ({ ctx }) => {
        return await scrapeHashtagReelsSingleNav(ctx, tag, perTag + 8);
      });

      for (const it of items) {
        if (!it?.imageUrl) continue;
        bucket.push({
          id: it.id,
          imageUrl: it.imageUrl,
          caption: it.caption || '',
          hashtags: it.hashtags || []
        });
      }
    } catch (e) {
      console.warn(`CDP per-tag session failed for #${tag}:`, String(e));
    }
    if (bucket.length >= limit) break;
  }

  // de-dup and cap
  const out = [];
  const seen = new Set();
  for (const it of bucket) {
    const key = it.id || it.imageUrl;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(it);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * FULL reels fetch (for /search and /ingest).
 * Uses **one session per hashtag** to avoid navigation limits, then returns normalized reels.
 * We still might not get views/likes from tiles; AI handles enrichment later.
 */
export async function fetchReelsByHashtagsCDP(hashtags = [], limit = 20) {
  const bucket = [];
  const perTag = Math.max(5, Math.ceil(limit / Math.max(1, hashtags.length)));

  for (const tag of hashtags) {
    try {
      const items = await withBrowser(async ({ ctx }) => {
        return await scrapeHashtagReelsSingleNav(ctx, tag, perTag + 5);
      });
      bucket.push(...items);
    } catch (e) {
      console.warn(`Hashtag ${tag} failed:`, String(e));
    }
  }

  // De-dup by id, cap to limit
  const out = [];
  const seen = new Set();
  for (const it of bucket) {
    if (it.id && !seen.has(it.id)) {
      seen.add(it.id);
      out.push({
        id: it.id,
        caption: it.caption || '',
        comments: '',
        likes: it.likes || 0,
        views: it.views || 0,      // may be null; routes already tolerant
        timestamp: it.timestamp || null,
        imageUrl: it.imageUrl || null,
        hashtags: it.hashtags || []
      });
    }
    if (out.length >= limit) break;
  }
  return out;
}
