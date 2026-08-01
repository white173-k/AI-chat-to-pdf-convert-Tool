import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

// ── Inline Types ──────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  authorName?: string;
  content: string;
  timestamp?: string;
}

interface SharedConversation {
  id: string;
  title: string;
  platform: string;
  originalUrl: string;
  messages: ChatMessage[];
  modelName?: string;
}

// ── Inline URL Validator ──────────────────────────────────────
function validateAndClassifyUrl(rawUrl: string) {
  let urlObj: URL;
  try {
    const formatted = rawUrl.trim().startsWith('http') ? rawUrl.trim() : `https://${rawUrl.trim()}`;
    urlObj = new URL(formatted);
  } catch { throw new Error('Invalid URL format.'); }

  const hostname = urlObj.hostname.toLowerCase();
  const pathname = urlObj.pathname;

  if (hostname.includes('chatgpt.com') || hostname.includes('openai.com')) {
    if (pathname.includes('/share/')) {
      const shareId = pathname.split('/share/')[1]?.split('/')[0] || '';
      if (!shareId) throw new Error('Invalid ChatGPT share link.');
      return { url: urlObj.toString(), platform: 'chatgpt' as const, shareId };
    }
    throw new Error('ChatGPT link must be a shared conversation URL.');
  }
  if (hostname.includes('gemini.google.com') || hostname.includes('g.co')) {
    if (pathname.includes('/share/')) {
      const shareId = pathname.split('/share/')[1]?.split('/')[0] || '';
      return { url: urlObj.toString(), platform: 'gemini' as const, shareId };
    }
    throw new Error('Gemini link must be a shared conversation URL.');
  }
  throw new Error(`Unsupported platform: ${hostname}. Supported: ChatGPT, Google Gemini.`);
}

// ── Inline ChatGPT Fetcher (HTTP-only, no Puppeteer) ──────────
function parseMappingData(data: any, shareId: string, shareUrl: string): SharedConversation | null {
  if (!data?.mapping) return null;
  const title = data.title || 'ChatGPT Shared Conversation';
  const msgs: ChatMessage[] = [];
  const nodes = Object.values(data.mapping) as any[];
  const valid = nodes.filter((n) => n.message?.content?.parts?.length);
  valid.sort((a, b) => (a.message.create_time || 0) - (b.message.create_time || 0));
  for (const node of valid) {
    const m = node.message;
    const role = m.author?.role === 'user' ? 'user' : 'assistant';
    const content = (m.content.parts || []).map((p: any) => typeof p === 'string' ? p : JSON.stringify(p)).join('\n');
    if (content.trim()) msgs.push({ id: m.id || String(Math.random()), role, authorName: role === 'user' ? 'User' : 'ChatGPT', content, timestamp: m.create_time ? new Date(m.create_time * 1000).toISOString() : undefined });
  }
  return msgs.length > 0 ? { id: shareId, title, platform: 'chatgpt', originalUrl: shareUrl, messages: msgs, modelName: data.model || 'ChatGPT' } : null;
}

async function fetchChatGPT(url: string, shareId: string): Promise<SharedConversation> {
  // Try backend API
  try {
    const r = await fetch(`https://chatgpt.com/backend-api/share/${shareId}`, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Accept: 'application/json' } });
    if (r.ok) { const j = await r.json(); const p = parseMappingData(j, shareId, url); if (p) return p; }
  } catch {}
  // Try HTML scrape
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
    if (r.ok) {
      const html = await r.text();
      const $ = cheerio.load(html);
      const nxt = $('#__NEXT_DATA__').html();
      if (nxt) { try { const d = JSON.parse(nxt); const p = parseMappingData(d?.props?.pageProps?.serverResponse?.data, shareId, url); if (p) return p; } catch {} }
      for (const s of $('script').toArray()) {
        const t = $(s).html() || '';
        if (t.includes('mapping') && t.includes('serverResponse')) {
          try { const m = t.match(/\{"serverResponse":.*?\}(?=\s*;|\s*<\/script>|$)/s); if (m) { const d = JSON.parse(m[0]); const p = parseMappingData(d?.serverResponse?.data, shareId, url); if (p) return p; } } catch {}
        }
      }
    }
  } catch {}
  throw new Error('Could not fetch ChatGPT conversation. The link may be private or expired.');
}

async function fetchGemini(url: string, shareId: string): Promise<SharedConversation> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
    if (r.ok) {
      const html = await r.text();
      const $ = cheerio.load(html);
      const title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Gemini Conversation';
      const turns: ChatMessage[] = [];
      $('.user-query, .model-response, [jsname], conversation-turn').each((i, el) => {
        const txt = $(el).text().trim();
        if (txt) { const isUser = el.attribs['class']?.includes('user') || el.name === 'user-query'; turns.push({ id: `g-${i}`, role: isUser ? 'user' : 'assistant', authorName: isUser ? 'User' : 'Gemini', content: txt }); }
      });
      if (turns.length > 0) return { id: shareId, title: title.replace(' - Gemini', '').trim(), platform: 'gemini', originalUrl: url, messages: turns };
    }
  } catch {}
  throw new Error('Could not fetch Gemini conversation. The link may be expired or private.');
}

// ── Inline Markdown Converter ─────────────────────────────────
async function md2html(md: string): Promise<string> {
  try {
    const result = await unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkRehype, { allowDangerousHtml: true }).use(rehypeHighlight).use(rehypeKatex).use(rehypeStringify, { allowDangerousHtml: true }).process(md);
    return String(result);
  } catch { return md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>'); }
}

// ── Inline Title Helpers ──────────────────────────────────────
function sanitizeFileName(raw: string): string { let c = raw.replace(/[^\w\s-]/gi, '').trim().replace(/\s+/g, ' '); if (!c) c = 'AI Conversation Notes'; if (!c.toLowerCase().endsWith('.pdf')) c += '.pdf'; return c; }
function formatAutoTitle(title?: string, firstMsg?: string): string {
  if (title && title !== 'ChatGPT Shared Conversation' && title !== 'Gemini Shared Conversation') return title;
  if (firstMsg) { const l = firstMsg.split('\n')[0].trim(); const s = l.split('.')[0]; return (s.length > 5 && s.length <= 60) ? s : l.substring(0, 50).trim() + '...'; }
  return 'AI Conversation Revision Notes';
}

// ── Request Schema ────────────────────────────────────────────
const RequestSchema = z.object({
  url: z.string().min(1, 'Share link URL is required'),
  customTitle: z.string().optional(),
  theme: z.enum(['dark', 'light']).optional().default('dark'),
  viewMode: z.enum(['desktop', 'mobile', 'tablet']).optional().default('desktop'),
});

// ── Vercel Handler ────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const parsed = RequestSchema.parse(req.body);
    const { url, platform, shareId } = validateAndClassifyUrl(parsed.url);
    const conversation = platform === 'chatgpt' ? await fetchChatGPT(url, shareId) : await fetchGemini(url, shareId);

    const processedMessages = await Promise.all(conversation.messages.map(async (msg) => ({ ...msg, html: await md2html(msg.content) })));
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
    console.error('[/api/preview]:', error.message || error);
    return res.status(400).json({ success: false, error: error.message || 'Failed to process conversation.' });
  }
}
