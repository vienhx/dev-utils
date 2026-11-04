import { test as base, expect, type Page } from '@playwright/test';

/** Records CSP violations reported by the page, from before any app script runs. */
export async function trackCspViolations(page: Page): Promise<() => Promise<string[]>> {
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: string[] };
    w.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      w.__csp.push(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });
  const console: string[] = [];
  page.on('console', (m) => {
    if (/Content Security Policy/i.test(m.text())) console.push(m.text());
  });
  return async () => [
    ...(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)),
    ...console,
  ];
}

export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await use(errors);
    expect(errors, 'uncaught page errors').toEqual([]);
  },
});

export { expect };
