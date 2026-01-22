import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import * as readline from 'readline';

interface ScreenshotConfig {
  name: string;
  path: string;
  waitFor?: string; // CSS selector to wait for before taking screenshot
  delay?: number; // Additional delay in ms
}

const pages: ScreenshotConfig[] = [
  { name: 'landing', path: '/', waitFor: '.new-landing-page', delay: 1000 },
  { name: 'feed', path: '/feed', waitFor: '.masonry-grid', delay: 2000 },
  { name: 'scout', path: '/scout', waitFor: '[role="main"]', delay: 2000 },
  { name: 'bites', path: '/bites', waitFor: '.masonry-grid', delay: 2000 },
  { name: 'trims', path: '/trims', waitFor: '[role="main"]', delay: 2000 },
  { name: 'plate', path: '/plate', waitFor: '[role="main"]', delay: 1000 },
  { name: 'dash', path: '/dash', waitFor: '[role="main"]', delay: 1000 },
];

const viewports = {
  desktop: { width: 1920, height: 1080, name: 'desktop' },
  mobile: { width: 375, height: 667, name: 'mobile' },
};

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = join(process.cwd(), 'screenshots');

async function captureScreenshot(
  page: Page,
  config: ScreenshotConfig,
  viewport: typeof viewports.desktop,
  browser: any
) {
  const url = `${BASE_URL}${config.path}`;
  console.log(`📸 Capturing ${config.name} (${viewport.name})...`);

  try {
    // For persistent context, we need to set viewport differently
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for specific element if specified
    if (config.waitFor) {
      await page.waitForSelector(config.waitFor, { timeout: 10000 }).catch(() => {
        console.warn(`⚠️  Selector ${config.waitFor} not found, continuing anyway...`);
      });
    }

    // Additional delay if specified
    if (config.delay) {
      await page.waitForTimeout(config.delay);
    }

    // Take screenshot
    const screenshotPath = join(
      SCREENSHOTS_DIR,
      `${config.name}-${viewport.name}.png`
    );
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    console.log(`✅ Saved: ${screenshotPath}`);
  } catch (error) {
    console.error(`❌ Error capturing ${config.name} (${viewport.name}):`, error);
  }
}

async function main() {
  console.log('🚀 Starting screenshot capture...\n');

  // Create screenshots directory
  await mkdir(SCREENSHOTS_DIR, { recursive: true });

  let browser: BrowserContext | null = null;

  try {
    // Launch browser with persistent context to maintain login
    console.log('🌐 Launching browser with your session...');
    const userDataDir = join(process.cwd(), '.playwright-session');
    
    browser = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // Visible browser so you can see the progress
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = browser.pages()[0] || await browser.newPage();

    // Test if dev server is running and wait for login if needed
    try {
      await page.goto(BASE_URL, { timeout: 10000 });
      console.log('✅ Dev server is running');
      console.log('📋 Browser opened. Please log in if needed.');
      console.log('⏸️  Press ENTER when ready to start capturing screenshots...\n');
      
      // Wait for user input
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      await new Promise<void>((resolve) => {
        rl.on('line', () => {
          rl.close();
          resolve();
        });
      });
      
      console.log('✅ Starting screenshot capture...\n');
    } catch (error) {
      console.error('❌ Dev server is not running!');
      console.error('Please start the dev server with: npm run dev');
      process.exit(1);
    }

    // Capture screenshots for each page in both viewports
    for (const pageConfig of pages) {
      for (const viewport of Object.values(viewports)) {
        await captureScreenshot(page, pageConfig, viewport, browser);
      }
      console.log(''); // Empty line between pages
    }

    await browser.close();

    console.log('✨ All screenshots captured successfully!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

main();
