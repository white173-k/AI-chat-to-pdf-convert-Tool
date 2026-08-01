import { validateAndClassifyUrl } from './urlValidator';
import { fetchChatGPTConversation } from './chatgptFetcher';
import { fetchGeminiConversation } from './geminiFetcher';
import { SharedConversation } from '../types';

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
