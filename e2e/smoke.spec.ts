import { readFileSync } from 'node:fs';
import { expect, test, trackCspViolations } from './fixtures';

type HeaderRule = { source: string; headers: { key: string; value: string }[] };
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as { headers: HeaderRule[] };

test('serves the security headers from vercel.json', async ({ request }) => {
  const res = await request.get('/');
  expect(res.status()).toBe(200);
  const csp = res.headers()['content-security-policy'];
  expect(csp).toContain("default-src 'none'");
  expect(csp).toContain("connect-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  for (const h of vercel.headers[0]!.headers) {
    expect(res.headers()[h.key.toLowerCase()], h.key).toBe(h.value);
  }
  const asset = await request.get('/favicon.svg');
  expect(asset.headers()['content-security-policy']).toBe(csp);
});

test('loads with zero CSP violations', async ({ page, pageErrors }) => {
  const violations = await trackCspViolations(page);
  await page.goto('/');
  await expect(page.getByTestId('input')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(await violations()).toEqual([]);
  expect(pageErrors).toEqual([]);
});
