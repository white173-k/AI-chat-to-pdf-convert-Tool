import * as cheerio from 'cheerio';
import { ChatMessage, SharedConversation } from '../types.js';

export async function fetchGeminiConversation(shareUrl: string, shareId: string): Promise<SharedConversation> {
  console.log(`[Gemini Fetcher] Attempting HTTP fetch for ${shareUrl}`);

  try {
    const res = await fetch(shareUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);

      const pageTitle = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Gemini Shared Conversation';

      const turns: ChatMessage[] = [];
      $('.user-query, .model-response, [jsname], conversation-turn').each((idx, el) => {
        const txt = $(el).text().trim();
        if (txt) {
          const isUser = el.attribs['class']?.includes('user') || el.name === 'user-query';
          turns.push({
            id: `gemini-${idx}`,
            role: isUser ? 'user' : 'assistant',
            authorName: isUser ? 'User' : 'Gemini',
            content: txt,
          });
        }
      });

      if (turns.length > 0) {
        return {
          id: shareId,
          title: pageTitle.replace(' - Gemini', '').trim(),
          platform: 'gemini',
          originalUrl: shareUrl,
          messages: turns,
        };
      }
    }
  } catch (err) {
    console.log('[Gemini Fetcher] Lightweight HTTP fetch failed, trying dynamic Puppeteer fallback...');
  }

  try {
    console.log(`[Gemini Fetcher] Running dynamic Puppeteer fallback for ${shareUrl}`);
    const { getBrowser } = await import('../utils/browserPool.js');
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      );
      await page.goto(shareUrl, { waitUntil: 'networkidle2' as const, timeout: 25000 });
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const result = await page.evaluate(() => {
        const title = document.title.replace(' - Gemini', '').trim() || 'Gemini Shared Conversation';
        const messages: { role: 'user' | 'assistant'; content: string }[] = [];
        const turns = Array.from(document.querySelectorAll('conversation-turn, .conversation-turn, .turn'));

        if (turns.length > 0) {
          turns.forEach((turn) => {
            const isUser = turn.querySelector('.user-query, [data-test-id="user-query"]');
            const text = (turn as HTMLElement).innerText || turn.textContent || '';
            if (text.trim()) {
              messages.push({
                role: isUser ? 'user' : 'assistant',
                content: text.trim(),
              });
            }
          });
        }

        return { title, messages };
      });

      if (result.messages.length > 0) {
        return {
          id: shareId,
          title: result.title,
          platform: 'gemini',
          originalUrl: shareUrl,
          messages: result.messages.map((m, idx) => ({
            id: `gemini-pup-${idx}`,
            role: m.role,
            authorName: m.role === 'user' ? 'User' : 'Gemini',
            content: m.content,
          })),
        };
      }
    } finally {
      await page.close();
    }
  } catch (pupErr) {
    console.log('[Gemini Fetcher] Dynamic Puppeteer fallback failed or disabled in serverless mode');
  }

  throw new Error('Could not parse conversation content from Gemini share link. The link may be expired or private.');
}
