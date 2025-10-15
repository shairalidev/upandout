import { Router } from 'express';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();

router.get('/', (_req, res) => {
  res.json({ status: 'healthy', now: new Date().toISOString() });
});

/** Optional: CDP connectivity debug (leave it if you're testing Bright Data) */
import { chromium } from 'playwright';
router.get('/cdp', async (_req, res) => {
  try {
    const host = process.env.BRD_CDP_HOST || 'brd.superproxy.io';
    const port = String(process.env.BRD_CDP_PORT || '9222');
    const u = encodeURIComponent(process.env.BRD_CDP_USERNAME || '');
    const p = encodeURIComponent(process.env.BRD_CDP_PASSWORD || '');
    const ws = `wss://${u}:${p}@${host}:${port}`;
    const b = await chromium.connectOverCDP(ws);
    await b.close();
    res.json({ ok: true, ws });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

export default router;
