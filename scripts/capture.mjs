import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto(process.env.APP_URL || 'http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(200);
await page.screenshot({ path: 'artifacts/desktop-preview.png' });

async function fullPage(filename) {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 700) { await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(60); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  await page.screenshot({ path: filename, fullPage: true, type: 'jpeg', quality: 88 });
}
await fullPage('artifacts/desktop-full.jpg');
await page.getByRole('button', { name: 'Share invitation', exact: true }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: 'artifacts/share-preview.png' });
await page.getByRole('button', { name: 'Close sharing' }).click();
await page.getByRole('button', { name: 'Make it yours' }).click();
await page.screenshot({ path: 'artifacts/editor-preview.png' });
await page.getByRole('button', { name: 'Close editor' }).click();

// The static default social preview is a real image; guests get personalized PNGs.
const socialImage = await page.evaluate(async () => {
  await document.fonts.ready;
  const image = new Image(); image.src = new URL('images/garden-palace.webp', window.location.href).href; await image.decode();
  const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 630;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f7f5ef'; ctx.fillRect(0, 0, 1200, 630);
  const scale = Math.max(568 / image.width, 630 / image.height);
  ctx.save(); ctx.beginPath(); ctx.roundRect(632, 32, 536, 566, [268, 268, 0, 0]); ctx.clip();
  ctx.drawImage(image, 632 + (536 - image.width * scale) / 2, 32 + (566 - image.height * scale) * .75, image.width * scale, image.height * scale); ctx.restore();
  ctx.fillStyle = '#354637'; ctx.font = '500 13px "DM Sans Variable"'; ctx.letterSpacing = '3px'; ctx.fillText('TOGETHER WITH OUR FAMILIES', 57, 93);
  ctx.letterSpacing = '-3px'; ctx.font = '400 126px "Cormorant Garamond"'; ctx.fillText('Aanya', 52, 234);
  ctx.fillStyle = '#905d43'; ctx.font = 'italic 400 120px "Cormorant Garamond"'; ctx.fillText('&', 48, 350);
  ctx.fillStyle = '#354637'; ctx.font = '400 126px "Cormorant Garamond"'; ctx.fillText('Vihaan', 151, 350);
  ctx.letterSpacing = '0px'; ctx.fillStyle = '#905d43'; ctx.font = 'italic 400 33px "Cormorant Garamond"'; ctx.fillText('You, us & a little magic.', 57, 413);
  ctx.fillStyle = '#354637'; ctx.font = '500 15px "DM Sans Variable"'; ctx.letterSpacing = '2px'; ctx.fillText('12 DECEMBER 2026 · UDAIPUR', 57, 490);
  ctx.letterSpacing = '0px'; ctx.font = '400 32px "Cormorant Garamond"'; ctx.fillText('amarā.', 57, 575);
  return canvas.toDataURL('image/jpeg', .92).split(',')[1];
});
await writeFile('public/social-card.jpg', Buffer.from(socialImage, 'base64'));

await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: 'artifacts/mobile-preview.png' });
await fullPage('artifacts/mobile-full.jpg');
await page.getByRole('button', { name: 'Share invitation', exact: true }).click();
await page.screenshot({ path: 'artifacts/mobile-share.png' });
await page.getByRole('button', { name: 'Close sharing' }).click();
await page.setViewportSize({ width: 1440, height: 1050 });
for (const color of ['Rose', 'Nocturne']) {
  await page.getByRole('button', { name: 'Make it yours' }).click();
  await page.getByRole('button', { name: color, exact: true }).click();
  await page.getByRole('button', { name: 'Save my invitation' }).click();
  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  await page.locator('.toast').waitFor({ state: 'detached' });
  await page.screenshot({ path: `artifacts/${color.toLowerCase()}-preview.png` });
}
console.log(JSON.stringify({ browserErrors: errors, captures: 'artifacts/', socialPreview: 'public/social-card.jpg' }));
await browser.close();
if (errors.length) process.exitCode = 1;
