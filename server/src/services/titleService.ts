export function sanitizeFileName(rawTitle: string): string {
  let cleaned = rawTitle
    .replace(/[^\w\s-]/gi, '')
    .trim()
    .replace(/\s+/g, ' ');

  if (!cleaned) {
    cleaned = 'AI Conversation Notes';
  }

  // Ensure it has .pdf suffix
  if (!cleaned.toLowerCase().endsWith('.pdf')) {
    cleaned = `${cleaned}.pdf`;
  }

  return cleaned;
}

export function formatAutoTitle(conversationTitle?: string, firstUserMessage?: string): string {
  if (conversationTitle && conversationTitle !== 'ChatGPT Shared Conversation' && conversationTitle !== 'Gemini Shared Conversation') {
    return conversationTitle;
  }

  if (firstUserMessage) {
    // Truncate to first 60 chars or first sentence
    const firstLine = firstUserMessage.split('\n')[0].trim();
    const sentence = firstLine.split('.')[0];
    if (sentence.length > 5 && sentence.length <= 60) {
      return sentence;
    }
    return firstLine.substring(0, 50).trim() + '...';
  }

  return 'AI Conversation Revision Notes';
}
