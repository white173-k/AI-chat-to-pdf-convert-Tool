import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { fetchSharedConversation } from '../services/fetcherService.js';
import { convertMarkdownToHtml } from '../services/markdownService.js';
import { renderPdfHtmlTemplate } from '../templates/pdfTemplate.js';
import { generatePdfFromHtml } from '../services/pdfService.js';
import { formatAutoTitle, sanitizeFileName } from '../services/titleService.js';

const router = Router();

const RequestSchema = z.object({
  url: z.string().min(1, 'Share link URL is required'),
  customTitle: z.string().optional(),
  theme: z.enum(['dark', 'light']).optional().default('dark'),
  viewMode: z.enum(['desktop', 'mobile', 'tablet']).optional().default('desktop'),
});

// Endpoint: Live Preview
router.post('/preview', async (req: Request, res: Response) => {
  try {
    const parsed = RequestSchema.parse(req.body);
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

    res.json({
      success: true,
      title: finalTitle,
      fileName: sanitizeFileName(finalTitle),
      platform: conversation.platform,
      originalUrl: conversation.originalUrl,
      messageCount: conversation.messages.length,
      messages: processedMessages,
      theme: parsed.theme,
      viewMode: parsed.viewMode,
    });
  } catch (error: any) {
    console.error('[API /preview Error]:', error.message || error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to fetch or parse shared conversation.',
    });
  }
});

// Endpoint: Generate & Stream Downloadable PDF
router.post('/convert', async (req: Request, res: Response) => {
  try {
    const parsed = RequestSchema.parse(req.body);
    console.log(`[API /convert] URL: ${parsed.url} | Theme: ${parsed.theme} | View: ${parsed.viewMode}`);

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
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('[API /convert Error]:', error.message || error);
    res.status(400).json({
      success: false,
      error: error.message || 'An error occurred while generating the PDF.',
    });
  }
});

export default router;
