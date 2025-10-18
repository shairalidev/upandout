import { Router } from 'express';
import Joi from 'joi';

// ✅ Now using Meta API instead of BrightData/CDP scrapers
import {
  fetchReelsByHashtagsMeta as fetchReelsByHashtags,
  fetchImagesByHashtagsMeta as fetchImagesByHashtagsCDP,
} from '../services/instagram/metaService.js';

import {
  ensureModels,
  upsertItemWithMedia,
  findItemById,
  findItems,
} from '../services/storage/db.js';

import { enrichAndClassify } from '../services/ai/enrichService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/items/search
 * Example:
 *   /api/items/search?hashtags=placesindallas,coffeedallas&minViews=6000&limit=10
 *
 * Flow:
 *  - Fetch reels (via Meta API)
 *  - Filter by minViews
 *  - Enrich + save to DB
 *  - Return latest items (optionally filtered by groups/experiences)
 */
router.get('/search', async (req, res) => {
  try {
    await ensureModels();

    const hashtags = (req.query.hashtags || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const minViews = Number(req.query.minViews ?? 6000);
    const limit = Math.min(Number(req.query.limit ?? 20), 50);

    const groups = (req.query.groups || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const experiences = (req.query.experiences || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // 1️⃣ Fetch reels from Meta API
    const reels = hashtags.length
      ? await fetchReelsByHashtags(hashtags, limit * 2)
      : [];

    const filtered = reels
      .filter(r => (r.views == null ? true : (r.views || 0) >= minViews))
      .slice(0, limit);

    // 2️⃣ Enrich + Upsert to DB
    for (const reel of filtered) {
      const enriched = await enrichAndClassify({
        caption: reel.caption || '',
        comments: reel.comments || '',
        likes: reel.likes || 0,
        views: reel.views || 0,
        timestamp: reel.timestamp || null,
        city: 'Dallas',
      });

      await upsertItemWithMedia({
        sourcePostId: reel.id,
        source: 'instagram',
        hashtags: reel.hashtags || [],
        likes: reel.likes || 0,
        views: reel.views || 0,
        caption: reel.caption || '',
        timestamp: reel.timestamp || null,
        // AI fields
        placeName: enriched.placeName,
        address: enriched.address,
        imageUrl: reel.imageUrl || enriched.imageUrl || null,
        atmosphere: enriched.atmosphere,
        loudness: enriched.loudness,
        lighting: enriched.lighting,
        recurringEntertainment: enriched.recurringEntertainment,
        priceRange: enriched.priceRange,
        reviewSummary: enriched.reviewSummary,
        yelpStars: enriched.yelpStars,
        groups: enriched.groups,
        experiences: enriched.experiences,
      });
    }

    // 3️⃣ Return recent items
    const list = await findItems({ limit, groups, experiences });
    res.json({ count: list.length, items: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

/**
 * POST /api/items/ingest (auth required)
 * Body:
 * {
 *   "hashtags": ["placesindallas","coffeedallas"],
 *   "minViews": 6000,
 *   "limit": 20,
 *   "city": "Dallas"
 * }
 */
const ingestSchema = Joi.object({
  hashtags: Joi.array().items(Joi.string().min(1)).min(1).required(),
  minViews: Joi.number().integer().min(0).default(6000),
  limit: Joi.number().integer().min(1).max(50).default(20),
  city: Joi.string().default('Dallas'),
});

router.post('/ingest', requireAuth, async (req, res) => {
  try {
    await ensureModels();
    const { error, value } = ingestSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { hashtags, minViews, limit, city } = value;

    const reels = await fetchReelsByHashtags(hashtags, limit * 2);
    const filtered = reels
      .filter(r => (r.views == null ? true : (r.views || 0) >= minViews))
      .slice(0, limit);

    const ingested = [];

    for (const reel of filtered) {
      const enriched = await enrichAndClassify({
        caption: reel.caption || '',
        comments: reel.comments || '',
        likes: reel.likes || 0,
        views: reel.views || 0,
        timestamp: reel.timestamp || null,
        city,
      });

      const saved = await upsertItemWithMedia({
        sourcePostId: reel.id,
        source: 'instagram',
        hashtags: reel.hashtags || [],
        likes: reel.likes || 0,
        views: reel.views || 0,
        caption: reel.caption || '',
        timestamp: reel.timestamp || null,
        placeName: enriched.placeName,
        address: enriched.address,
        imageUrl: reel.imageUrl || enriched.imageUrl || null,
        atmosphere: enriched.atmosphere,
        loudness: enriched.loudness,
        lighting: enriched.lighting,
        recurringEntertainment: enriched.recurringEntertainment,
        priceRange: enriched.priceRange,
        reviewSummary: enriched.reviewSummary,
        yelpStars: enriched.yelpStars,
        groups: enriched.groups,
        experiences: enriched.experiences,
      });

      ingested.push(saved);
    }

    res.status(201).json({ ingestedCount: ingested.length, items: ingested });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ingestion failed', details: err.message });
  }
});

/**
 * GET /api/items/images
 * Example:
 *   /api/items/images?hashtags=coffeedallas,placesindallas&limit=24
 */
router.get('/images', async (req, res) => {
  try {
    const hashtags = (req.query.hashtags || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (!hashtags.length) {
      return res
        .status(400)
        .json({ error: 'Provide ?hashtags=coffeedallas,placesindallas' });
    }

    const limit = Math.min(Number(req.query.limit ?? 24), 60);
    const images = await fetchImagesByHashtagsCDP(hashtags, limit);

    res.json({ count: images.length, images });
  } catch (err) {
    console.error('images route error', err);
    res.status(500).json({
      error: 'Images fetch failed',
      details: String(err?.message || err),
    });
  }
});

/**
 * GET /api/items/:id  → Fetch single item (secondary page)
 */
router.get('/:id', async (req, res) => {
  try {
    await ensureModels();
    const item = await findItemById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Lookup failed', details: err.message });
  }
});

export default router;
