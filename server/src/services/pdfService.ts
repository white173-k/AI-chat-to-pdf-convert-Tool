import { getBrowser } from '../utils/browserPool.js';
import { ViewMode } from '../types.js';

export async function generatePdfFromHtml(
  htmlContent: string,
  documentTitle: string,
  viewMode: ViewMode = 'desktop'
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const isMobile = viewMode === 'mobile';
    const isTablet = viewMode === 'tablet';

    // 1. Set Viewport according to layout view mode
    if (isMobile) {
      await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
    } else if (isTablet) {
      await page.setViewport({ width: 768, height: 1024, isMobile: true, deviceScaleFactor: 2 });
    } else {
      await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    }

    // 2. Load HTML content
    await page.setContent(htmlContent, {
      waitUntil: 'domcontentloaded',
      timeout: 40000,
    });

    // 3. Ensure web fonts are fully loaded
    await page.evaluateHandle('document.fonts.ready');

    // 4. Emulate print media
    await page.emulateMediaType('print');

    // 5. Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: isMobile
        ? { top: '10mm', bottom: '12mm', left: '8mm', right: '8mm' }
        : { top: '18mm', bottom: '20mm', left: '15mm', right: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 8px; font-family: sans-serif; color: #6e7681; width: 100%; text-align: right; padding-right: 12mm;">
          <span>${documentTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
        </div>`,
      footerTemplate: `
        <div style="font-size: 8px; font-family: sans-serif; color: #6e7681; width: 100%; text-align: center;">
          AI Chat to PDF Generator • Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>`,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}
