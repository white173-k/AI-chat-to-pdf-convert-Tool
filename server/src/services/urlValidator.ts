import { SupportedPlatform } from '../types';

export interface ValidatedUrl {
  url: string;
  platform: SupportedPlatform;
  isSupported: boolean;
  shareId: string;
}

export function validateAndClassifyUrl(rawUrl: string): ValidatedUrl {
  let urlObj: URL;
  try {
    const formattedUrl = rawUrl.trim().startsWith('http') ? rawUrl.trim() : `https://${rawUrl.trim()}`;
    urlObj = new URL(formattedUrl);
  } catch {
    throw new Error('Invalid URL format. Please paste a valid web link.');
  }

  const hostname = urlObj.hostname.toLowerCase();
  const pathname = urlObj.pathname;

  if (hostname.includes('chatgpt.com') || hostname.includes('openai.com')) {
    if (pathname.includes('/share/')) {
      const parts = pathname.split('/share/')[1]?.split('/')[0] || '';
      if (!parts) {
        throw new Error('Invalid ChatGPT share link. Missing share ID.');
      }
      return { url: urlObj.toString(), platform: 'chatgpt', isSupported: true, shareId: parts };
    }
    throw new Error('ChatGPT link must be a shared conversation URL (e.g. https://chatgpt.com/share/...)');
  }

  if (hostname.includes('gemini.google.com') || hostname.includes('bard.google.com') || hostname.includes('g.co')) {
    if (pathname.includes('/share/') || (hostname.includes('g.co') && pathname.includes('/gemini/share/'))) {
      const shareId = pathname.split('/share/')[1]?.split('/')[0] || '';
      return { url: urlObj.toString(), platform: 'gemini', isSupported: true, shareId };
    }
    throw new Error('Gemini link must be a shared conversation URL (e.g. https://gemini.google.com/share/...)');
  }

  if (hostname.includes('claude.ai')) {
    return { url: urlObj.toString(), platform: 'claude', isSupported: false, shareId: '' };
  }
  if (hostname.includes('perplexity.ai')) {
    return { url: urlObj.toString(), platform: 'perplexity', isSupported: false, shareId: '' };
  }
  if (hostname.includes('grok.com') || hostname.includes('x.ai')) {
    return { url: urlObj.toString(), platform: 'grok', isSupported: false, shareId: '' };
  }
  if (hostname.includes('deepseek.com')) {
    return { url: urlObj.toString(), platform: 'deepseek', isSupported: false, shareId: '' };
  }
  if (hostname.includes('copilot.microsoft.com') || hostname.includes('bing.com')) {
    return { url: urlObj.toString(), platform: 'copilot', isSupported: false, shareId: '' };
  }

  throw new Error(`Unsupported platform: ${hostname}. Currently supported: ChatGPT and Google Gemini.`);
}
