import {
  addStep,
  expect,
  openTemplateMenu,
  saveTemplate,
  setInput,
  stepNames,
  templateLinks,
  test,
} from './fixtures';
import type { Page } from '@playwright/test';

async function buildB64ToJson(page: Page) {
  await addStep(page, 'b64 dec');
  await addStep(page, 'json format');
  await page.getByTestId('step').nth(1).locator('select').selectOption('4');
}

async function templateId(page: Page, name: string): Promise<string> {
  return page.evaluate((n) => {
    const list = JSON.parse(localStorage.getItem('devutils:v1:templates') ?? '[]') as {
      id: string;
      name: string;
    }[];
    return list.find((t) => t.name === n)?.id ?? '';
  }, name);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/#/chain');
});

test('save is unavailable for an empty chain', async ({ page }) => {
  await expect(page.getByTestId('save-template')).toBeDisabled();
});

test('blank name is rejected', async ({ page }) => {
  await addStep(page, 'pretty');
  await saveTemplate(page, '   ');
  await expect(page.getByTestId('dialog').getByRole('alert')).toHaveText('Enter a name.');
  await page.getByTestId('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(templateLinks(page)).toHaveCount(0);
});

test('saved templates appear under Chain, newest first, and persist', async ({ page }) => {
  await expect(page.getByTestId('sidebar')).toContainText('Saved chains appear here.');
  await buildB64ToJson(page);
  await saveTemplate(page, 'A');
  await saveTemplate(page, 'B');
  await expect(templateLinks(page)).toHaveText(['B', 'A']);
  await page.reload();
  await expect(templateLinks(page)).toHaveText(['B', 'A']);
});

test('overwrite asks for confirmation', async ({ page }) => {
  await addStep(page, 'pretty');
  await saveTemplate(page, 'Pretty');
  await addStep(page, 'minify');

  await saveTemplate(page, 'pretty');
  const dialog = page.getByTestId('dialog');
  await expect(dialog.getByRole('heading')).toHaveText('Replace template?');
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await page.getByTestId('remove').last().click();
  await page.getByTestId('remove').last().click();
  await templateLinks(page).filter({ hasText: 'Pretty' }).click();
  await expect(stepNames(page)).toHaveText(['JSON format']);

  await addStep(page, 'minify');
  await saveTemplate(page, 'pretty');
  await dialog.getByRole('button', { name: 'Replace' }).click();
  await expect(templateLinks(page)).toHaveText(['Pretty']);
  await page.getByTestId('remove').last().click();
  await templateLinks(page).first().click();
  await expect(stepNames(page)).toHaveText(['JSON format', 'JSON compact']);
});

test('open from sidebar keeps input, and Undo restores the previous chain', async ({ page }) => {
  await buildB64ToJson(page);
  await saveTemplate(page, 'B64 to JSON');
  await page.getByTestId('remove').first().click();
  await page.getByTestId('remove').first().click();
  await addStep(page, 'b64 enc');
  await setInput(page, '{"a":1}');

  await templateLinks(page).filter({ hasText: 'B64 to JSON' }).click();
  await expect(stepNames(page)).toHaveText(['Base64 decode', 'JSON format']);
  await expect(page.getByTestId('input')).toHaveValue('{"a":1}');
  await expect(page.getByTestId('output-error')).toContainText('invalid Base64');
  await expect(page).toHaveURL(/#\/chain$/);

  await page.getByTestId('toast').getByRole('button', { name: 'Undo' }).click();
  await expect(stepNames(page)).toHaveText(['Base64 encode']);
  await expect(page.getByTestId('output')).toHaveValue('eyJhIjoxfQ==');
});

test('load notice expires and the loaded chain stays', async ({ page }) => {
  await addStep(page, 'pretty');
  await saveTemplate(page, 'P');
  await templateLinks(page).first().click();
  const toast = page.getByTestId('toast').filter({ hasText: 'Loaded' });
  await expect(toast).toBeVisible();
  await page.waitForTimeout(5000);
  await expect(toast).toBeVisible();
  await expect(toast).toHaveCount(0, { timeout: 2000 });
  await expect(stepNames(page)).toHaveText(['JSON format']);
});

test('editing after load does not change the template', async ({ page }) => {
  await buildB64ToJson(page);
  await saveTemplate(page, 'B64 to JSON');
  await templateLinks(page).first().click();
  await page.getByTestId('remove').first().click();
  await expect(stepNames(page)).toHaveText(['JSON format']);
  await templateLinks(page).first().click();
  await expect(stepNames(page)).toHaveText(['Base64 decode', 'JSON format']);
});

test('rename and delete from the sidebar menu', async ({ page }) => {
  await addStep(page, 'pretty');
  await saveTemplate(page, 'B64 to JSON');
  await saveTemplate(page, 'Other');
  const dialog = page.getByTestId('dialog');

  await openTemplateMenu(page, 'B64 to JSON');
  await page.getByRole('button', { name: 'Rename' }).click();
  await dialog.locator('input').fill('other');
  await dialog.locator('input').press('Enter');
  await expect(dialog.getByRole('alert')).toHaveText('That name is already in use.');
  await dialog.locator('input').fill('Decode JSON');
  await dialog.locator('input').press('Enter');
  await expect(templateLinks(page)).toHaveText(['Other', 'Decode JSON']);

  await openTemplateMenu(page, 'Decode JSON');
  await page.getByRole('button', { name: 'Delete' }).click();
  await dialog.getByRole('button', { name: 'Delete' }).click();
  await expect(templateLinks(page)).toHaveText(['Other']);
  await page.reload();
  await expect(templateLinks(page)).toHaveText(['Other']);
});

test('?template= link loads once and cleans the URL', async ({ page }) => {
  await buildB64ToJson(page);
  await saveTemplate(page, 'B64 to JSON');
  const id = await templateId(page, 'B64 to JSON');
  await page.getByTestId('remove').first().click();

  await page.goto(`/#/chain?template=${id}`);
  await expect(stepNames(page)).toHaveText(['Base64 decode', 'JSON format']);
  await expect(page).toHaveURL(/#\/chain$/);

  await page.getByTestId('remove').first().click();
  await page.reload();
  await expect(stepNames(page)).toHaveText(['JSON format']);
  await expect(page.getByTestId('toast')).toHaveCount(0);
});

test('unknown template id shows a message and keeps the chain', async ({ page }) => {
  await addStep(page, 'minify');
  await page.goto('/#/chain?template=missing');
  await expect(page.getByTestId('toast')).toContainText('Template not found');
  await expect(stepNames(page)).toHaveText(['JSON compact']);
  await expect(page).toHaveURL(/#\/chain$/);
});

test('template with an unknown step is unavailable and others still work', async ({ page }) => {
  await addStep(page, 'pretty');
  await saveTemplate(page, 'Good');
  await page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem('devutils:v1:templates') ?? '[]');
    list.push({
      id: 'future',
      tool: 'chain',
      name: 'Future',
      savedAt: Date.now() + 1,
      steps: [{ type: 'gzip.compress', options: {}, enabled: true }],
    });
    localStorage.setItem('devutils:v1:templates', JSON.stringify(list));
  });
  await page.reload();
  const sidebar = page.getByTestId('sidebar');
  await expect(sidebar.getByText('unavailable')).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Future' })).toHaveCount(0);
  await page.goto('/#/chain?template=future');
  await expect(page.getByTestId('toast')).toContainText("can't be loaded");
  await templateLinks(page).filter({ hasText: 'Good' }).click();
  await expect(stepNames(page)).toHaveText(['JSON format']);
});

test('storage failure on save shows an error and keeps the chain', async ({ page }) => {
  await addStep(page, 'pretty');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('full', 'QuotaExceededError');
    };
  });
  await saveTemplate(page, 'X');
  await expect(page.getByTestId('toast')).toContainText("Couldn't save the template");
  await expect(stepNames(page)).toHaveText(['JSON format']);
  await expect(templateLinks(page)).toHaveCount(0);
});
