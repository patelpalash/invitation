import { chromium } from '@playwright/test';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const frames = await mkdtemp(join(tmpdir(), 'amara-motion-'));
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 934 }, deviceScaleFactor: 1 });
await page.goto(process.env.APP_URL || 'http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.reload({ waitUntil: 'commit' });
for (let frame = 0; frame < 180; frame++) {
  const start = Date.now();
  if (frame === 22) await page.evaluate(() => document.getElementById('story').scrollIntoView({ behavior: 'smooth' }));
  if (frame === 60) await page.evaluate(() => document.getElementById('celebration').scrollIntoView({ behavior: 'smooth' }));
  if (frame === 100) await page.evaluate(() => document.getElementById('details').scrollIntoView({ behavior: 'smooth' }));
  if (frame === 135) await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  if (frame === 160) await page.getByRole('button', { name: 'Share invitation', exact: true }).click();
  await page.screenshot({ path: join(frames, `frame-${String(frame).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 80 });
  const remaining = 1000 / 12 - (Date.now() - start);
  if (remaining > 0) await page.waitForTimeout(remaining);
}
await browser.close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '12', '-i', join(frames, 'frame-%04d.jpg'), '-an', '-c:v', 'libx264', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', 'artifacts/animated-preview.mp4']);
await rm(frames, { recursive: true });
console.log('Recorded 15 seconds of the real animated website: artifacts/animated-preview.mp4');
