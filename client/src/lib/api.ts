export type ViewMode = 'desktop' | 'mobile' | 'tablet';
export type AppTheme = 'dark' | 'light';

export interface PreviewData {
  title: string;
  fileName: string;
  platform: 'chatgpt' | 'gemini' | 'claude' | 'perplexity' | 'grok' | 'deepseek' | 'copilot';
  originalUrl: string;
  messageCount: number;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    authorName?: string;
    content: string;
    html: string;
  }>;
  theme?: AppTheme;
  viewMode?: ViewMode;
}

export async function fetchPreview(
  url: string,
  customTitle?: string,
  theme: AppTheme = 'dark',
  viewMode: ViewMode = 'desktop'
): Promise<PreviewData> {
  const res = await fetch('/api/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, customTitle, theme, viewMode }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch conversation preview.');
  }

  return data;
}

export async function generateAndDownloadPdf(
  url: string,
  customTitle?: string,
  theme: AppTheme = 'dark',
  viewMode: ViewMode = 'desktop'
): Promise<string> {
  const res = await fetch('/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, customTitle, theme, viewMode }),
  });

  if (!res.ok) {
    let errorMsg = 'Failed to generate PDF.';
    try {
      const text = await res.text();
      try {
        const errJson = JSON.parse(text);
        if (errJson.error) errorMsg = errJson.error;
      } catch {
        if (text && text.length < 200) errorMsg = text;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const contentDisposition = res.headers.get('Content-Disposition');
  let filename = 'AI_Conversation_Notes.pdf';

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^;'"\n]*)['"]?/i);
    if (filenameMatch && filenameMatch[1]) {
      filename = decodeURIComponent(filenameMatch[1]);
    }
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
  a.remove();

  return filename;
}
