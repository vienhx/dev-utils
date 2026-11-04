import type { Page } from '@playwright/test';
import { addStep, expect, setInput, test } from './fixtures';

async function columns(page: Page) {
  const box = async (sel: string) => (await page.locator(sel).boundingBox())!;
  const input = await box('[data-testid=input]');
  const chain = await box('[data-testid=add-step]');
  const output = await box('[data-testid=output]');
  return { input, chain, output };
}

async function hasHorizontalScroll(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
}

async function fill(page: Page) {
  await addStep(page, 'b64 dec');
  await addStep(page, 'json format');
  await setInput(page, 'eyJhIjoxLCJsb25nIjoi' + 'QUFB'.repeat(200) + 'In0=');
  await page.getByTestId('peek-toggle').first().click();
}

test('three columns at 1440 px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/chain');
  await fill(page);
  const { input, chain, output } = await columns(page);
  expect(input.x).toBeLessThan(chain.x);
  expect(chain.x).toBeLessThan(output.x);
  expect(Math.abs(input.y - output.y)).toBeLessThan(2);
  expect(await hasHorizontalScroll(page)).toBe(false);
});

test('stacked at 1100 px with the sidebar expanded', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.goto('/#/chain');
  await fill(page);
  const { input, chain, output } = await columns(page);
  expect(input.y).toBeLessThan(chain.y);
  expect(chain.y).toBeLessThan(output.y);
  expect(await hasHorizontalScroll(page)).toBe(false);
});

test('stacked with no horizontal scroll at 375 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/#/chain');
  await fill(page);
  const { input, chain, output } = await columns(page);
  expect(input.y).toBeLessThan(chain.y);
  expect(chain.y).toBeLessThan(output.y);
  expect(await hasHorizontalScroll(page)).toBe(false);
  await expect(page.getByTestId('sidebar')).toBeHidden();
});

test('mobile drawer opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/#/chain');
  const drawer = page.getByTestId('drawer');
  const menu = page.getByTestId('menu-button');

  await menu.click();
  await expect(drawer).toBeVisible();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');

  await menu.click();
  await expect(drawer).toBeVisible();
  await page.mouse.click(360, 400);
  await expect(drawer).toBeHidden();
  await expect(page).toHaveURL(/#\/chain$/);

  await menu.click();
  await drawer.getByRole('link', { name: 'Chain' }).click();
  await expect(drawer).toBeHidden();
});

test('mobile drawer picks a template and closes', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/#/chain');
  await addStep(page, 'pretty');
  await page.getByTestId('save-as').click();
  await page.getByTestId('dialog').locator('input').fill('Phone');
  await page.getByTestId('dialog').locator('input').press('Enter');
  await page.getByTestId('remove').click();

  await page.getByTestId('menu-button').click();
  await page.getByTestId('drawer').getByRole('link', { name: 'Phone' }).click();
  await expect(page.getByTestId('drawer')).toBeHidden();
  await expect(page.getByTestId('step')).toHaveCount(1);
});

test('desktop rail collapse persists across reload', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/chain');
  const before = (await page.getByTestId('content').boundingBox())!;
  await page.getByTestId('collapse').click();
  await expect(page.getByTestId('sidebar')).toHaveClass(/rail/);
  const after = (await page.getByTestId('content').boundingBox())!;
  expect(after.width).toBeGreaterThan(before.width);
  const rail = (await page.locator('aside').boundingBox())!;
  expect(rail.width).toBe(56);

  await page.reload();
  await expect(page.getByTestId('sidebar')).toHaveClass(/rail/);
  await page.getByTestId('collapse').click();
  await page.reload();
  await expect(page.getByTestId('sidebar')).not.toHaveClass(/rail/);
});
