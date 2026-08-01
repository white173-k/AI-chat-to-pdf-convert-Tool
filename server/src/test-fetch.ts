import { fetchChatGPTConversation } from './services/chatgptFetcher.js';
import { closeBrowser } from './utils/browserPool.js';

async function test() {
  const url = 'https://chatgpt.com/share/6a6e1d9f-05d8-83e8-9b0c-a861d7e51da4';
  const shareId = '6a6e1d9f-05d8-83e8-9b0c-a861d7e51da4';

  console.log('Testing fetch for URL:', url);
  try {
    const result = await fetchChatGPTConversation(url, shareId);
    console.log('====================================');
    console.log('SUCCESS!');
    console.log('Title:', result.title);
    console.log('Messages count:', result.messages.length);
    console.log('First message role:', result.messages[0]?.role);
    console.log('First message snippet:', result.messages[0]?.content.slice(0, 150));
    console.log('Second message role:', result.messages[1]?.role);
    console.log('Second message snippet:', result.messages[1]?.content.slice(0, 150));
    console.log('====================================');
  } catch (err: any) {
    console.error('FETCH ERROR:', err.message || err);
  } finally {
    await closeBrowser();
  }
}

test();
