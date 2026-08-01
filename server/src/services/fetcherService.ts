import { validateAndClassifyUrl } from './urlValidator.js';
import { fetchChatGPTConversation } from './chatgptFetcher.js';
import { fetchGeminiConversation } from './geminiFetcher.js';
import { SharedConversation } from '../types.js';

export async function fetchSharedConversation(rawUrl: string): Promise<SharedConversation> {
  const validated = validateAndClassifyUrl(rawUrl);

  if (!validated.isSupported) {
    throw new Error(
      `Platform '${validated.platform}' is currently marked for future release. Currently active platforms: ChatGPT, Google Gemini.`
    );
  }

  switch (validated.platform) {
    case 'chatgpt':
      return await fetchChatGPTConversation(validated.url, validated.shareId);
    case 'gemini':
      return await fetchGeminiConversation(validated.url, validated.shareId);
    default:
      throw new Error(`Fetcher not implemented for platform: ${validated.platform}`);
  }
}
