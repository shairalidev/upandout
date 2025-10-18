import axios from "axios";

const API = `https://graph.facebook.com/${process.env.META_API_VERSION || "v24.0"}`;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const IG_USER_ID = process.env.META_IG_USER_ID;

// Simple delay between requests
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Cache helper
const cache = new Map();
const getCache = (k) => {
  const hit = cache.get(k);
  if (!hit || Date.now() > hit.exp) return null;
  return hit.val;
};
const setCache = (k, v, ttl = 10 * 60 * 1000) => cache.set(k, { val: v, exp: Date.now() + ttl });

// ✅ STEP 1: Get hashtag ID
async function getHashtagId(tag) {
  const key = `hashtag:${tag}`;
  const cached = getCache(key);
  if (cached) return cached;

  const url = `${API}/ig_hashtag_search?user_id=${IG_USER_ID}&q=${encodeURIComponent(
    tag
  )}&access_token=${ACCESS_TOKEN}`;

  try {
    const { data } = await axios.get(url);
    const id = data?.data?.[0]?.id || null;
    if (id) setCache(key, id);
    return id;
  } catch (err) {
    console.warn(`⚠️ Could not get hashtag ID for #${tag}:`, err.response?.data || err.message);
    return null;
  }
}

// ✅ STEP 2: Get media for hashtag OR fallback to own account
async function getMediaForHashtag({ tag, limit = 10 }) {
  // Always use your own media when in dev mode
  const url = `${API}/${IG_USER_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=${limit}&access_token=${ACCESS_TOKEN}`;
  try {
    const { data } = await axios.get(url);
    const items = data?.data || [];

    return items.map((m) => ({
      id: m.id,
      caption: m.caption || "",
      imageUrl: m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url,
      permalink: m.permalink,
      hashtags:
        (m.caption || "").match(/#\w+/g)?.map((h) => h.slice(1).toLowerCase()) || [],
      timestamp: m.timestamp,
    }));
  } catch (err) {
    console.error("❌ Error fetching user media:", err.response?.data || err.message);
    return [];
  }
}


// ✅ STEP 3: Fetch multiple hashtags
export async function fetchImagesByHashtagsMeta(hashtags = [], limit = 20) {
  const bucket = [];
  const perTag = Math.ceil(limit / (hashtags.length || 1));

  for (const tag of hashtags) {
    try {
      const items = await getMediaForHashtag({ tag, limit: perTag });
      bucket.push(...items);
      await sleep(300);
    } catch (e) {
      console.warn(`⚠️ Error fetching #${tag}:`, e.message);
    }
  }

  const seen = new Set();
  const unique = bucket.filter((m) => {
    const key = m.id || m.imageUrl;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, limit);
}

// ✅ STEP 4: Normalized reels-like output
export async function fetchReelsByHashtagsMeta(hashtags = [], limit = 20) {
  const items = await fetchImagesByHashtagsMeta(hashtags, limit);
  return items.map((it) => ({
    id: it.id,
    caption: it.caption,
    imageUrl: it.imageUrl,
    hashtags: it.hashtags,
    permalink: it.permalink,
    timestamp: it.timestamp,
  }));
}
