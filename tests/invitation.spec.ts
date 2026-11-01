import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';

test('the invitation renders cleanly and its navigation, guest details and map work', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Aanya&Vihaan');
  await page.getByRole('button', { name: 'Explore the celebration' }).click();
  await expect(page.getByRole('heading', { name: 'A weekend to remember.' })).toBeInViewport();
  await page.getByText('When should I arrive?', { exact: true }).click();
  await expect(page.getByText('We recommend arriving in Udaipur', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Find your way here' })).toHaveAttribute('href', /query=The%20Oberoi%20Udaivilas%2C%20Udaipur%2C%20India/);
  const loadedImages = await page.locator('main img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0));
  expect(loadedImages).toBe(true);
  expect(errors).toEqual([]);
});

test('a personalized invitation survives reload and opens identically for another guest', async ({ page, browser }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Make it yours' }).click();
  await page.getByLabel('Your first name', { exact: true }).fill('Míra');
  await page.getByLabel('Their first name').fill('Arjun');
  await page.getByLabel('Wedding date').fill('2027-02-14');
  await page.getByLabel('Venue', { exact: true }).fill('Taj Lake Palace');
  await page.getByLabel('Your one-liner').fill('A love like no other.');
  await page.getByRole('button', { name: 'Rose', exact: true }).click();
  await page.getByRole('button', { name: 'Save my invitation' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Míra&Arjun');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Míra&Arjun');
  await expect(page.locator('.app')).toHaveClass(/colorway-rose/);
  await page.getByRole('button', { name: 'Share invitation', exact: true }).click();
  const url = await page.getByLabel('Your personal invitation link').inputValue();
  const whatsapp = await page.getByRole('link', { name: 'WhatsApp' }).getAttribute('href');
  expect(new URL(whatsapp!).searchParams.get('text')).toContain('Míra & Arjun');
  expect(new URL(whatsapp!).searchParams.get('text')).toContain(url);
  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();
  await guest.goto(url);
  await expect(guest.getByRole('heading', { level: 1 })).toHaveText('Míra&Arjun');
  await expect(guest.locator('.hero-tagline')).toHaveText('A love like no other.');
  await expect(guest.locator('.hero-date')).toHaveText('Sunday, 14 February 2027');
  await expect(guest.locator('.venue-name')).toHaveText('Taj Lake Palace');
  await expect(guest.locator('.app')).toHaveClass(/colorway-rose/);
  await guestContext.close();
});

test('the copy action and native share contain the complete invitation URL', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => { (window as unknown as { shared: ShareData }).shared = data; } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Share invitation', exact: true }).click();
  const url = await page.getByLabel('Your personal invitation link').inputValue();
  await page.getByRole('button', { name: 'Copy invitation link' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(url);
  await page.getByRole('button', { name: 'More options' }).click();
  expect(await page.evaluate(() => (window as unknown as { shared: ShareData }).shared.url)).toBe(url);
  await expect(page.getByRole('link', { name: 'Email', exact: true })).toHaveAttribute('href', /mailto:\?subject=Aanya/);
});

test('the portrait invitation card is a real 1080 by 1350 PNG', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Share invitation', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download invitation card' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('Aanya-Vihaan-invitation.png');
  const bytes = await readFile((await download.path())!);
  expect(bytes.subarray(1, 4).toString()).toBe('PNG');
  expect(bytes.readUInt32BE(16)).toBe(1080);
  expect(bytes.readUInt32BE(20)).toBe(1350);
  expect(bytes.length).toBeGreaterThan(100000);
  await download.saveAs('artifacts/invitation-card.png');
});

test('calendar download carries the ceremony time in UTC and escaped event details', async ({ page }) => {
  await page.goto('/');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save the wedding date' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('a-beautiful-beginning.ics');
  const calendar = (await readFile((await download.path())!, 'utf8')).replace(/\r\n /g, '');
  expect(calendar).toContain('DTSTART:20261212T103000Z');
  expect(calendar).toContain('DTEND:20261212T133000Z');
  expect(calendar).toContain('SUMMARY:Aanya & Vihaan — The wedding');
  expect(calendar).toContain('LOCATION:The Oberoi Udaivilas\\, Udaipur\\, India');
  expect(calendar).toContain('END:VCALENDAR');
});

test('the editor traps focus, Escape discards changes, and focus returns to its trigger', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Make it yours' });
  await trigger.click();
  await expect(page.getByLabel('Your first name', { exact: true })).toBeFocused();
  await page.getByLabel('Your first name', { exact: true }).fill('Unsaved');
  for (let i = 0; i < 20; i++) await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog[open]'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Aanya&Vihaan');
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`layout is contained and the editor is usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Make it yours' }).click();
    await page.getByLabel('Your first name', { exact: true }).fill('Alexandria');
    await page.getByLabel('Their first name').fill('Christopher');
    await page.getByRole('button', { name: 'Nocturne', exact: true }).click();
    await page.getByRole('button', { name: 'Save my invitation' }).click();
    await expect(page.locator('.app')).toHaveClass(/colorway-nocturne/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const nameBox = await page.locator('.name-second').evaluate(el => ({ text: el.scrollWidth, box: el.getBoundingClientRect().width }));
    expect(nameBox.text).toBeLessThanOrEqual(nameBox.box + 2);
    await page.getByRole('button', { name: 'Share invitation', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Download invitation card' })).toBeVisible();
    expect(await page.evaluate(() => { const d = document.querySelector('.share-dialog')!; return d.scrollWidth <= d.clientWidth; })).toBe(true);
  });
}

test('an invalid invitation link fails safely without breaking the page', async ({ page }) => {
  await page.goto('/#invite=not-a-valid-invitation');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Aanya&Vihaan');
  await expect(page.getByRole('status')).toContainText('incomplete');
});

test('all three palettes and both dialogs pass the WCAG AA automated checks', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const color of ['Sage', 'Rose', 'Nocturne']) {
    await page.getByRole('button', { name: 'Make it yours' }).click();
    await page.getByRole('button', { name: color, exact: true }).click();
    await page.getByRole('button', { name: 'Save my invitation' }).click();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations, `${color} palette`).toEqual([]);
  }
  await page.getByRole('button', { name: 'Share invitation', exact: true }).click();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Close sharing' }).click();
  await page.getByRole('button', { name: 'Make it yours' }).click();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});
