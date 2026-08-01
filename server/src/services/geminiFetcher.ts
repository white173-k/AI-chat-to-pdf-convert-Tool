import * as cheerio from 'cheerio';
import { getBrowser } from '../utils/browserPool.js';
import { ChatMessage, SharedConversation } from '../types.js';

export async function fetchGeminiConversation(shareUrl: string, shareId: string): Promise<SharedConversation> {
  console.log(`[Gemini Fetcher] Attempting HTTP fetch for ${shareUrl}`);

  // 1. Try lightweight HTTP GET request
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

      // Extract title from meta or title tag
      const pageTitle = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Gemini Shared Conversation';

      // Look for AF_initDataCallback script blocks
      let extractedMessages: ChatMessage[] = [];

      $('script').each((_, script) => {
        const text = $(script).html() || '';
        if (text.includes('AF_initDataCallback')) {
          // Attempt regex extraction of text sequences
          const matches = text.match(/"([^"]{10,})"/g);
          if (matches && matches.length > 5) {
            // Check if there are distinct prompt-response strings
          }
        }
      });

      // Also check simple element text if SSR rendered
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
    console.log('[Gemini Fetcher] Lightweight HTTP fetch failed, switching to Puppeteer...');
  }

  // 2. Puppeteer Fallback (renders full client-side JS DOM)
  console.log(`[Gemini Fetcher] Running Puppeteer fallback for ${shareUrl}`);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    await page.goto(shareUrl, { waitUntil: 'networkidle2' as const, timeout: 35000 });
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const result = await page.evaluate(() => {
      const title = document.title.replace(' - Gemini', '').trim() || 'Gemini Shared Conversation';

      // Scrape conversation turns in DOM
      const messages: { role: 'user' | 'assistant'; content: string }[] = [];

      // Query Gemini UI containers
      const userQueries = Array.from(document.querySelectorAll('.user-query, [data-test-id="user-query"], .query-text'));
      const responses = Array.from(document.querySelectorAll('.model-response-text, message-content, .markdown'));

      // If specific queries found
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
      } else {
        // Fallback: Pair user queries & model responses
        const maxLen = Math.max(userQueries.length, responses.length);
        for (let i = 0; i < maxLen; i++) {
          if (userQueries[i]) {
            messages.push({ role: 'user', content: (userQueries[i] as HTMLElement).innerText.trim() });
          }
          if (responses[i]) {
            messages.push({ role: 'assistant', content: (responses[i] as HTMLElement).innerText.trim() });
          }
        }
      }

      // If still empty, grab all structured paragraphs/articles
      if (messages.length === 0) {
        const main = document.querySelector('main') || document.body;
        const paragraphs = Array.from(main.querySelectorAll('p, pre, h1, h2, h3'));
        let combined = paragraphs.map((p) => (p as HTMLElement).innerText.trim()).filter(Boolean).join('\n\n');
        if (combined) {
          messages.push({ role: 'assistant', content: combined });
        }
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

    throw new Error('Could not parse conversation content from Gemini share link. The link may be expired or private.');
  } finally {
    await page.close();
  }
}
