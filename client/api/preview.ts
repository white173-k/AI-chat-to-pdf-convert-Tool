import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { fetchSharedConversation } from '../../server/src/services/fetcherService.js';
import { convertMarkdownToHtml } from '../../server/src/services/markdownService.js';
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

    return res.status(200).json({
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
    console.error('[Vercel API /preview Error]:', error.message || error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to fetch or parse shared conversation.',
    });
  }
}
