import axios from 'axios';

const base = 'https://api.brightdata.com';

export async function runCollector({ collectorId, payload }) {
  // NOTE: Bright Data has multiple modes (Collector/Discoveries). Adjust as needed.
  // Here we assume a collector that accepts hashtags and returns recent reels JSON.
  const apiKey = process.env.BRIGHTDATA_API_KEY;
  if (!apiKey || !collectorId) {
    console.warn('Bright Data not fully configured — returning mock data');
    return { status: 'mock' };
  }

  // Example flow (pseudocode-ish; update per your collector’s API spec)
  // 1) Trigger collector
  const start = await axios.post(
    `${base}/dca/trigger?collector=${collectorId}`,
    payload || {},
    { headers: { Authorization: apiKey } }
  );

  const { id: jobId } = start.data;
  // 2) Poll for results
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 1500));
    const res = await axios.get(`${base}/dca/get_result?collector=${collectorId}&id=${jobId}`, {
      headers: { Authorization: apiKey },
    });
    if (Array.isArray(res.data) && res.data.length) {
      return res.data; // should be an array of posts
    }
  }

  return [];
}
