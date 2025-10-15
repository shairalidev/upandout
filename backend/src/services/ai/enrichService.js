import OpenAI from 'openai';
import { keywordClassify } from './classifyService.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYS = `You are a Dallas local discovery assistant. 
Given a short Instagram caption/comments, infer the likely PLACE NAME and ADDRESS (if findable),
and summarize vibe (atmosphere, loudness, lighting, recurring entertainment), price range,
and quick review summary (Yelp/Google). If unsure, say "Unknown" for that field.
Return concise, factual results.`;

export async function enrichAndClassify({ caption, comments, likes, views, timestamp, city }) {
  // Basic fallback classification (works even with no OpenAI key)
  const basic = keywordClassify(`${caption} ${comments}`);

  if (!process.env.OPENAI_API_KEY) {
    return {
      placeName: 'Unknown',
      address: `${city} (Unknown exact address)`,
      imageUrl: null,
      atmosphere: 'Casual/Chill',
      loudness: 'Moderate',
      lighting: 'Dim/Balanced',
      recurringEntertainment: 'Unknown',
      priceRange: '$$ (estimate)',
      reviewSummary: 'Reviews suggest a popular spot based on social traction.',
      yelpStars: null,
      groups: basic.groups,
      experiences: basic.experiences
    };
  }

  const user = `
Caption: ${caption}
Top Comments: ${comments}
Social Proof: ${likes} likes, ${views} views. Timestamp: ${timestamp}
City Focus: ${city}

Tasks:
1) Guess Place Name and Address (Dallas, TX area).
2) Atmosphere (quiet/loud), Lighting (dim/bright), Recurring Entertainment (if any).
3) Price Range (e.g., $, $$, $$$).
4) Yelp/Google quick review vibe (and stars if findable).
5) Suggest a representative image URL (official site, Google Maps, Yelp, or Instagram thumbnail).
Return JSON with keys: placeName, address, imageUrl, atmosphere, loudness, lighting, recurringEntertainment, priceRange, reviewSummary, yelpStars.
  `.trim();

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYS },
      { role: 'user', content: user }
    ],
    temperature: 0.3
  });

  let parsed = {};
  try {
    const text = resp.choices?.[0]?.message?.content || '{}';
    parsed = JSON.parse(text);
  } catch {
    parsed = {};
  }

  return {
    placeName: parsed.placeName || 'Unknown',
    address: parsed.address || `${city} (Unknown exact address)`,
    imageUrl: parsed.imageUrl || null,
    atmosphere: parsed.atmosphere || 'Unknown',
    loudness: parsed.loudness || 'Unknown',
    lighting: parsed.lighting || 'Unknown',
    recurringEntertainment: parsed.recurringEntertainment || 'Unknown',
    priceRange: parsed.priceRange || 'Unknown',
    reviewSummary: parsed.reviewSummary || 'Summary unavailable',
    yelpStars: parsed.yelpStars ?? null,
    groups: basic.groups,
    experiences: basic.experiences
  };
}
