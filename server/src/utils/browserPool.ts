import puppeteer from 'puppeteer';
import puppeteerCore, { Browser } from 'puppeteer-core';
import fs from 'fs';

let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    console.log('[Puppeteer] Launching browser instance...');

    // 1. Check if running inside Vercel or AWS Lambda Serverless environment
    if (process.env.VERCEL || process.env.AWS_EXECUTION_ENV) {
      try {
        console.log('[Puppeteer] Serverless environment detected. Loading @sparticuz/chromium...');
        const chromium = (await import('@sparticuz/chromium')).default;
        const executablePath = await chromium.executablePath();

        browserInstance = (await puppeteerCore.launch({
          executablePath,
          args: chromium.args,
          headless: chromium.headless === 'shell' ? 'shell' : true,
          defaultViewport: chromium.defaultViewport,
        })) as unknown as Browser;

        return browserInstance;
      } catch (err: any) {
        console.error('[Puppeteer] Error launching @sparticuz/chromium in serverless mode:', err);
      }
    }

    // 2. Local / VPS / Dedicated Server environment fallback
    const possiblePaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
    ].filter(Boolean) as string[];

    let executablePath: string | undefined = undefined;
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        executablePath = path;
        break;
      }
    }

    if (executablePath) {
      console.log(`[Puppeteer] Using local browser binary at: ${executablePath}`);
    }

    browserInstance = (await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    })) as unknown as Browser;
  }

  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance && browserInstance.connected) {
    await browserInstance.close();
    browserInstance = null;
  }
}
