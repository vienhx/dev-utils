import { addStep, expect, setInput, stepNames, test } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/chain');
});

test('empty chain passes input through and output is read-only', async ({ page }) => {
  await setInput(page, '{"a":1}');
  const output = page.getByTestId('output');
  await expect(output).toHaveValue('{"a":1}');
  await expect(output).toHaveAttribute('readonly', '');
  await output.press('x');
  await expect(output).toHaveValue('{"a":1}');
});

test('builds a chain with the picker and shows output live', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+k');
  await page.keyboard.type('b64 dec');
  await page.keyboard.press('Enter');
  await expect(stepNames(page)).toHaveText(['Base64 decode']);

  await addStep(page, 'pretty');
  await setInput(page, 'eyJhIjoxfQ==');
  await expect(page.getByTestId('output')).toHaveValue('{\n  "a": 1\n}');

  await page.getByTestId('step').nth(1).locator('select').selectOption('4');
  await expect(page.getByTestId('output')).toHaveValue('{\n    "a": 1\n}');
});

test('typing updates the output within 300 ms', async ({ page }) => {
  await addStep(page, 'b64 enc');
  await page.getByTestId('input').pressSequentially('abc');
  await expect(page.getByTestId('output')).toHaveValue('YWJj', { timeout: 300 });
});

test('same step can be added twice', async ({ page }) => {
  await addStep(page, 'json format');
  await addStep(page, 'json format');
  await expect(stepNames(page)).toHaveText(['JSON format', 'JSON format']);
});

test('error stops the chain and recovers when input is fixed', async ({ page }) => {
  await addStep(page, 'b64 dec');
  await addStep(page, 'json format');
  await setInput(page, '!!!');
  const statuses = page.getByTestId('status');
  await expect(statuses).toHaveText(['error', 'skipped']);
  await expect(page.getByTestId('step-error')).toContainText('invalid Base64');
  await expect(page.getByTestId('output-error')).toContainText('invalid Base64');
  await expect(page.getByTestId('output')).toHaveCount(0);

  await setInput(page, 'eyJhIjoxfQ==');
  await expect(statuses).toHaveText(['ok', 'ok']);
  await expect(page.getByTestId('step-error')).toHaveCount(0);
  await expect(page.getByTestId('output')).toHaveValue('{\n  "a": 1\n}');
});

test('binary output shows a label and hex preview', async ({ page }) => {
  await addStep(page, 'b64 dec');
  await setInput(page, '/9j/4A==');
  const binary = page.getByTestId('output-binary');
  await expect(binary).toContainText('binary, 4 bytes');
  await expect(binary).toContainText('ff d8 ff e0');
  await expect(page.getByTestId('copy')).toBeDisabled();
});

test('reorders with buttons and drag and drop', async ({ page }) => {
  await addStep(page, 'b64 dec');
  await addStep(page, 'json format');
  await setInput(page, 'eyJhIjoxfQ==');

  await page.getByTestId('move-up').nth(1).click();
  await expect(stepNames(page)).toHaveText(['JSON format', 'Base64 decode']);
  await expect(page.getByTestId('status')).toHaveText(['error', 'skipped']);

  const grip = page.getByTestId('step').nth(1).locator('.grip');
  await grip.dragTo(page.getByTestId('step').nth(0), { targetPosition: { x: 20, y: 4 } });
  await expect(stepNames(page)).toHaveText(['Base64 decode', 'JSON format']);
  await expect(page.getByTestId('output')).toHaveValue('{\n  "a": 1\n}');
});

test('disable and remove steps', async ({ page }) => {
  await addStep(page, 'b64 enc');
  await setInput(page, 'hi');
  await expect(page.getByTestId('output')).toHaveValue('aGk=');

  await page.getByTestId('step').getByLabel('Enabled').uncheck();
  await expect(page.getByTestId('status')).toHaveText(['disabled']);
  await expect(page.getByTestId('output')).toHaveValue('hi');

  await page.getByTestId('remove').click();
  await expect(page.getByTestId('step')).toHaveCount(0);
  await expect(page.getByTestId('output')).toHaveValue('hi');
});

test('peek shows the intermediate value', async ({ page }) => {
  await addStep(page, 'b64 dec');
  await addStep(page, 'json format');
  await setInput(page, 'eyJhIjoxfQ==');
  await page.getByTestId('peek-toggle').first().click();
  await expect(page.getByTestId('peek')).toHaveText('{"a":1}');
});

test('copy and swap', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await addStep(page, 'b64 enc');
  await setInput(page, 'abc');
  await expect(page.getByTestId('output')).toHaveValue('YWJj');

  await page.getByTestId('copy').click();
  await expect(page.getByTestId('toast')).toContainText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('YWJj');

  await page.getByTestId('swap').click();
  await expect(page.getByTestId('input')).toHaveValue('YWJj');
  await expect(page.getByTestId('output')).toHaveValue('WVdKag==');
});

test('reload restores chain and input and recomputes output', async ({ page }) => {
  await addStep(page, 'minify');
  await setInput(page, '{ "a": [1, 2] }');
  await expect(page.getByTestId('output')).toHaveValue('{"a":[1,2]}');
  await page.reload();
  await expect(stepNames(page)).toHaveText(['JSON compact']);
  await expect(page.getByTestId('input')).toHaveValue('{ "a": [1, 2] }');
  await expect(page.getByTestId('output')).toHaveValue('{"a":[1,2]}');
});

test('corrupt saved session starts empty without an error', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('devutils:v1:session', '{broken'));
  await page.reload();
  await expect(page.getByTestId('input')).toHaveValue('');
  await expect(page.getByTestId('step')).toHaveCount(0);
  await expect(page.getByTestId('dialog')).not.toBeVisible();
});
