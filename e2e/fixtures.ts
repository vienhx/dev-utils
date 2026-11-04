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

/** Appends a step through the picker, as a keyboard user would. */
export async function addStep(page: Page, query: string): Promise<void> {
  await page.getByTestId('add-step').click();
  await page.getByTestId('picker-input').fill(query);
  await page.keyboard.press('Enter');
}

export function stepNames(page: Page) {
  return page.getByTestId('step').locator('h3');
}

export async function setInput(page: Page, value: string): Promise<void> {
  await page.getByTestId('input').fill(value);
}

/** Saves the current chain as a template with Save as; an existing name is replaced. */
export async function saveTemplate(page: Page, name: string): Promise<void> {
  await page.getByTestId('save-as').click();
  const dialog = page.getByTestId('dialog');
  await dialog.locator('input').fill(name);
  await dialog.locator('input').press('Enter');
}

export function templateLinks(page: Page) {
  return page.getByTestId('sidebar').getByTestId('template-row').locator('.link');
}

export async function openTemplateMenu(page: Page, name: string): Promise<void> {
  const row = page.getByTestId('template-row').filter({ hasText: name });
  await row.hover();
  await row.getByRole('button', { name: `Actions for ${name}` }).click();
}
