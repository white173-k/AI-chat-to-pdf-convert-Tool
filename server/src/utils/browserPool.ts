import puppeteer, { Browser } from 'puppeteer';
import fs from 'fs';

let browserInstance: Browser | null = null;

function findSystemChrome(): string | undefined {
  const possiblePaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean) as string[];

  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      return path;
    }
  }
  return undefined;
}

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    console.log('[Puppeteer] Launching headless browser...');
    const executablePath = findSystemChrome();
    if (executablePath) {
      console.log(`[Puppeteer] Using browser binary at: ${executablePath}`);
    }

    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    });
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance && browserInstance.connected) {
    await browserInstance.close();
    browserInstance = null;
  }
}
