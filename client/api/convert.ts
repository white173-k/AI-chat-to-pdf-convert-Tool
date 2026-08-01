import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { fetchSharedConversation } from '../../server/src/services/fetcherService.js';
import { convertMarkdownToHtml } from '../../server/src/services/markdownService.js';
import { renderPdfHtmlTemplate } from '../../server/src/templates/pdfTemplate.js';
import { generatePdfFromHtml } from '../../server/src/services/pdfService.js';
import { formatAutoTitle, sanitizeFileName } from '../../server/src/services/titleService.js';

const RequestSchema = z.object({
  url: z.string().min(1, 'Share link URL is required'),
  customTitle: z.string().optional(),
  theme: z.enum(['dark', 'light']).optional().default('dark'),
  viewMode: z.enum(['desktop', 'mobile', 'tablet']).optional().default('desktop'),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const parsed = RequestSchema.parse(req.body);
    console.log(`[Vercel API /convert] URL: ${parsed.url} | Theme: ${parsed.theme} | View: ${parsed.viewMode}`);

    const conversation = await fetchSharedConversation(parsed.url);

    const processedMessages = await Promise.all(
      conversation.messages.map(async (msg) => ({
        ...msg,
        html: await convertMarkdownToHtml(msg.content),
      }))
    );

    const firstUserMsg = conversation.messages.find((m) => m.role === 'user')?.content;
    const finalTitle = parsed.customTitle || formatAutoTitle(conversation.title, firstUserMsg);
    conversation.title = finalTitle;

    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const fullHtml = renderPdfHtmlTemplate(
      conversation,
      processedMessages,
      formattedDate,
      parsed.theme,
      parsed.viewMode
    );

    const pdfBuffer = await generatePdfFromHtml(fullHtml, finalTitle, parsed.viewMode);
    const fileName = sanitizeFileName(finalTitle);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error('[Vercel API /convert Error]:', error.message || error);
    return res.status(400).json({
      success: false,
      error: error.message || 'An error occurred while generating the PDF.',
    });
  }
}
