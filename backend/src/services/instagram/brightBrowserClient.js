import { chromium } from 'playwright';

export async function withBrowser(fn) {
  const host = process.env.BRD_CDP_HOST || 'brd.superproxy.io';
  const port = String(process.env.BRD_CDP_PORT || '9222');
  const user = encodeURIComponent(process.env.BRD_CDP_USERNAME || '');
  const pass = encodeURIComponent(process.env.BRD_CDP_PASSWORD || '');

  // Use basic-auth in the authority part (this is what Bright Data expects)
  const ws = `wss://${user}:${pass}@${host}:${port}`;

  const browser = await chromium.connectOverCDP(ws);
  try {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
      locale: 'en-US',
    });
    const page = await ctx.newPage();
    return await fn({ browser, ctx, page });
  } finally {
    await browser.close();
  }
}
