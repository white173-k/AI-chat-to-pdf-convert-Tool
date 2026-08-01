import { getBrowser } from '../utils/browserPool';
import { ChatMessage, SharedConversation } from '../types';

export async function fetchChatGPTConversation(shareUrl: string, shareId: string): Promise<SharedConversation> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    console.log(`[ChatGPT Fetcher] Navigating to ${shareUrl}`);
    await page.goto(shareUrl, { waitUntil: 'domcontentloaded' as const, timeout: 35000 });

    await new Promise((resolve) => setTimeout(resolve, 3500));

    const pageTitle = await page.title();
    if (pageTitle.includes('Attention Required!') || pageTitle.includes('Just a moment...')) {
      throw new Error('Cloudflare anti-bot verification was triggered by ChatGPT. Please try again in a few moments.');
    }

    const extractedData = await page.evaluate(async (sId) => {
      const w = window as any;

      if (w.__NEXT_DATA__?.props?.pageProps?.serverResponse?.data) {
        return { source: 'nextjs', data: w.__NEXT_DATA__.props.pageProps.serverResponse.data };
      }

      if (w.__remixContext?.state?.loaderData) {
        for (const key of Object.keys(w.__remixContext.state.loaderData)) {
          const loader = w.__remixContext.state.loaderData[key];
          if (loader?.serverResponse?.data) {
            return { source: 'remix', data: loader.serverResponse.data };
          }
          if (loader?.sharedConversationResponse) {
            return { source: 'remix-shared', data: loader.sharedConversationResponse };
          }
        }
      }

      const scripts = Array.from(document.querySelectorAll('script'));
      for (const s of scripts) {
        const text = s.textContent || '';
        if (text.includes('mapping') && (text.includes('serverResponse') || text.includes('sharedConversationResponse'))) {
          try {
            const match = text.match(/\{"serverResponse":.*?\}(?=\s*;|\s*<\/script>|$)/s);
            if (match) {
              const parsed = JSON.parse(match[0]);
              if (parsed?.serverResponse?.data) {
                return { source: 'script-match', data: parsed.serverResponse.data };
              }
            }
          } catch (e) {}
        }
      }

      return null;
    }, shareId);

    if (extractedData && extractedData.data) {
      const data = extractedData.data;
      const title = data.title || 'ChatGPT Shared Conversation';
      const mapping = data.mapping || {};
      const messages: ChatMessage[] = [];

      const nodeList = Object.values(mapping) as any[];
      const validNodes = nodeList.filter(
        (node) => node.message && node.message.content?.parts?.length
      );

      validNodes.sort((a, b) => (a.message.create_time || 0) - (b.message.create_time || 0));

      for (const node of validNodes) {
        const msg = node.message;
        const role = msg.author?.role === 'user' ? 'user' : 'assistant';
        const parts = msg.content?.parts || [];
        const content = parts
          .map((p: any) => (typeof p === 'string' ? p : JSON.stringify(p)))
          .join('\n');

        if (content.trim()) {
          messages.push({
            id: msg.id || Math.random().toString(),
            role,
            authorName: role === 'user' ? 'User' : 'ChatGPT',
            content,
            timestamp: msg.create_time ? new Date(msg.create_time * 1000).toISOString() : undefined,
          });
        }
      }

      if (messages.length > 0) {
        return {
          id: shareId,
          title,
          platform: 'chatgpt',
          originalUrl: shareUrl,
          messages,
          modelName: data.model || 'ChatGPT',
        };
      }
    }

    console.log('[ChatGPT Fetcher] Falling back to DOM parsing...');
    const domResult = await page.evaluate(() => {
      const titleEl = document.querySelector('h1') || document.querySelector('title');
      const title = titleEl ? titleEl.textContent?.replace(' - ChatGPT', '').trim() || 'ChatGPT Shared Conversation' : 'ChatGPT Shared Conversation';

      const articles = Array.from(document.querySelectorAll('article, [data-message-author-role], .conversation-turn'));
      const messages: { role: 'user' | 'assistant'; content: string }[] = [];

      articles.forEach((art) => {
        const roleAttr = art.getAttribute('data-message-author-role');
        const isUser = roleAttr === 'user' || art.querySelector('[data-message-author-role="user"]');
        const role: 'user' | 'assistant' = isUser ? 'user' : 'assistant';

        const markdownContainer = art.querySelector('.markdown') || art;
        const text = (markdownContainer as HTMLElement).innerText || art.textContent || '';

        if (text.trim()) {
          messages.push({ role, content: text.trim() });
        }
      });

      return { title, messages };
    });

    if (domResult.messages.length > 0) {
      return {
        id: shareId,
        title: domResult.title,
        platform: 'chatgpt',
        originalUrl: shareUrl,
        messages: domResult.messages.map((m, idx) => ({
          id: `dom-${idx}`,
          role: m.role,
          authorName: m.role === 'user' ? 'User' : 'ChatGPT',
          content: m.content,
        })),
      };
    }

    throw new Error('Could not parse conversation from shared ChatGPT link. The conversation may be private or deleted.');
  } finally {
    await page.close();
  }
}
