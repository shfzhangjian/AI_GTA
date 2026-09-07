import { chromium, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const target = process.env.PREVIEW_URL ?? 'http://127.0.0.1:5173/';
const browser = await launchBrowser();

try {
  await checkViewport('desktop', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await checkViewport('mobile', { ...devices['Pixel 7'], deviceScaleFactor: 1 });
} finally {
  await browser.close();
}

async function launchBrowser() {
  try {
    return await chromium.launch();
  } catch (error) {
    const edgePath =
      process.env.PLAYWRIGHT_EDGE_PATH ??
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    if (!existsSync(edgePath)) {
      throw error;
    }
    return chromium.launch({ executablePath: edgePath });
  }
}

async function checkViewport(name, viewport) {
  const context = await browser.newContext(viewport);
  const page = await context.newPage();
  await page.goto(target, { waitUntil: 'networkidle' });
  await page.locator('#game-canvas').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);

  const before = await canvasStats(page);
  if (before.nonTransparent < 5000 || before.uniqueColors < 80) {
    throw new Error(`${name} canvas appears blank before play: ${JSON.stringify(before)}`);
  }

  await page.locator('#start-button').click();
  await page.waitForTimeout(1200);

  const canvasBox = await page.locator('#game-canvas').boundingBox();
  await page.mouse.move(canvasBox.x + canvasBox.width * 0.22, canvasBox.y + canvasBox.height * 0.52);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + canvasBox.width * 0.77, canvasBox.y + canvasBox.height * 0.54, {
    steps: 8,
  });
  await page.waitForTimeout(500);

  const aiming = await canvasStats(page);
  if (aiming.nonTransparent < 5000 || aiming.uniqueColors < 80) {
    throw new Error(`${name} canvas appears blank while aiming: ${JSON.stringify(aiming)}`);
  }

  await page.screenshot({ path: `artifacts/${name}-aim.png`, fullPage: true });
  await page.mouse.up();
  await page.waitForTimeout(300);
  await page.keyboard.press('Space');
  await page.waitForTimeout(600);

  const after = await canvasStats(page);
  if (after.nonTransparent < 5000 || after.uniqueColors < 80) {
    throw new Error(`${name} canvas appears blank after play: ${JSON.stringify(after)}`);
  }

  await page.screenshot({ path: `artifacts/${name}.png`, fullPage: true });
  await context.close();
}

async function canvasStats(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('#game-canvas');
    const probe = document.createElement('canvas');
    const width = Math.min(240, canvas.width);
    const height = Math.min(160, canvas.height);
    probe.width = width;
    probe.height = height;
    const ctx = probe.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(canvas, 0, 0, width, height);
    const data = ctx.getImageData(0, 0, width, height).data;
    const colors = new Set();
    let nonTransparent = 0;
    for (let i = 0; i < data.length; i += 16) {
      const alpha = data[i + 3];
      if (alpha > 0) {
        nonTransparent += 1;
        colors.add(`${data[i] >> 3},${data[i + 1] >> 3},${data[i + 2] >> 3}`);
      }
    }
    return {
      width: canvas.width,
      height: canvas.height,
      uniqueColors: colors.size,
      nonTransparent,
    };
  });
}
