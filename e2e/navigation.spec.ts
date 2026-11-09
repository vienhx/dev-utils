import { addStep, expect, saveTemplate, stepNames, templateLinks, test } from './fixtures';

test('root URL shows Chain at #/chain with Chain highlighted', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/#\/chain$/);
  await expect(page.getByTestId('sidebar').locator('[aria-current="page"]')).toHaveText('Chain');
});

test('unknown route redirects to #/chain', async ({ page }) => {
  await page.goto('/#/does-not-exist');
  await expect(page).toHaveURL(/#\/chain$/);
  await expect(page.getByRole('heading', { name: 'Chain', level: 1 })).toBeVisible();
});

test('clicking Chain in the sidebar opens it', async ({ page }) => {
  await page.goto('/#/nope');
  await page.getByTestId('sidebar').getByRole('link', { name: 'Chain' }).click();
  await expect(page).toHaveURL(/#\/chain$/);
});

test('back and forward follow hash history', async ({ page }) => {
  await page.goto('/#/chain');
  await page.evaluate(() => (location.hash = '#/chain?x=1'));
  await page.evaluate(() => (location.hash = '#/chain?x=2'));
  await page.goBack();
  await expect(page).toHaveURL(/x=1$/);
  await page.goForward();
  await expect(page).toHaveURL(/x=2$/);
});

test('collapsed template section persists across reload', async ({ page }) => {
  await page.goto('/#/chain');
  await addStep(page, 'pretty');
  await saveTemplate(page, 'A');
  const toggle = page.getByTestId('section-toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(templateLinks(page)).toBeHidden();
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(templateLinks(page)).toBeHidden();
});

test('keyboard: tab to a template and open it with Enter', async ({ page }) => {
  await page.goto('/#/chain');
  await addStep(page, 'pretty');
  await saveTemplate(page, 'Kbd');
  await page.getByTestId('remove').click();
  await page.getByTestId('collapse').focus();
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(() => document.activeElement?.textContent === 'Kbd')) break;
  }
  await expect(page.locator(':focus')).toHaveText('Kbd');
  await page.keyboard.press('Enter');
  await expect(stepNames(page)).toHaveText(['JSON format']);
});

test('rail flyout lists templates on hover and focus', async ({ page }) => {
  await page.goto('/#/chain');
  await addStep(page, 'pretty');
  await saveTemplate(page, 'Flyout');
  await page.getByTestId('remove').click();

  const collapse = page.getByTestId('collapse');
  await expect(collapse).toHaveAttribute('aria-expanded', 'true');
  await collapse.click();
  await expect(collapse).toHaveAttribute('aria-expanded', 'false');

  const flyout = page.getByTestId('flyout');
  await expect(flyout).toBeHidden();
  await page.getByRole('link', { name: 'Chain' }).focus();
  await expect(flyout).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(flyout).toBeHidden();

  await page.getByRole('link', { name: 'Chain' }).hover();
  await flyout.getByRole('link', { name: 'Flyout' }).click();
  await expect(stepNames(page)).toHaveText(['JSON format']);
});

const repoCases: {
  name: string;
  width: number;
  collapse?: boolean;
  drawer?: boolean;
  label: string;
}[] = [
  { name: 'expanded sidebar', width: 1440, label: 'GitHub' },
  { name: 'collapsed rail', width: 1440, collapse: true, label: 'GitHub repository' },
  { name: 'mobile drawer', width: 375, drawer: true, label: 'GitHub' },
];

for (const tc of repoCases) {
  test(`source repository link in the ${tc.name}`, async ({ page }) => {
    await page.setViewportSize({ width: tc.width, height: 800 });
    await page.goto('/#/chain');
    if (tc.collapse) await page.getByTestId('collapse').click();
    if (tc.drawer) await page.getByTestId('menu-button').click();

    const link = page.getByTestId('sidebar').getByRole('link', { name: tc.label, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://github.com/vienhx/dev-utils');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
}
