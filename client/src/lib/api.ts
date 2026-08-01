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

const getApiBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, '');
  }
  return ''; // fallback to relative path /api for local dev proxy
};

export async function fetchPreview(
  url: string,
  customTitle?: string,
  theme: AppTheme = 'dark',
  viewMode: ViewMode = 'desktop'
): Promise<PreviewData> {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/api/preview`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, customTitle, theme, viewMode }),
    });
  } catch (networkErr: any) {
    throw new Error(
      `Backend API unreachable at '${endpoint}'. If deployed on Vercel, please set VITE_API_URL in Vercel Settings -> Environment Variables pointing to your backend URL (e.g. Render/Railway).`
    );
  }

  const text = await res.text();

  if (!res.ok) {
    if (res.status === 404 || text.includes('NOT_FOUND') || text.includes('page could not be found')) {
      throw new Error(
        `Backend API endpoint not found (404 NOT_FOUND). On Vercel, please add VITE_API_URL in Vercel Dashboard -> Settings -> Environment Variables (e.g. https://your-backend.onrender.com) and click Redeploy.`
      );
    }

    try {
      const errJson = JSON.parse(text);
      if (errJson.error) throw new Error(errJson.error);
    } catch {
      if (text && text.length < 200) throw new Error(text);
    }
    throw new Error(`Server error (${res.status}): Failed to fetch preview.`);
  }

  try {
    const data = JSON.parse(text);
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch conversation preview.');
    }
    return data;
  } catch {
    throw new Error(`Invalid response from API. Please verify VITE_API_URL environment variable.`);
  }
}

export async function generateAndDownloadPdf(
  url: string,
  customTitle?: string,
  theme: AppTheme = 'dark',
  viewMode: ViewMode = 'desktop'
): Promise<string> {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/api/convert`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, customTitle, theme, viewMode }),
    });
  } catch (networkErr: any) {
    throw new Error(
      `Backend API unreachable at '${endpoint}'. If deployed on Vercel, please set VITE_API_URL in Vercel Settings -> Environment Variables pointing to your backend URL (e.g. Render/Railway).`
    );
  }

  if (!res.ok) {
    let errorMsg = `Server returned HTTP ${res.status}: Failed to generate PDF.`;
    try {
      const text = await res.text();
      if (res.status === 404 || text.includes('NOT_FOUND') || text.includes('page could not be found')) {
        errorMsg = `Backend API endpoint not found (404 NOT_FOUND). On Vercel, please add VITE_API_URL in Vercel Dashboard -> Settings -> Environment Variables (e.g. https://your-backend.onrender.com) and click Redeploy.`;
      } else {
        try {
          const errJson = JSON.parse(text);
          if (errJson.error) errorMsg = errJson.error;
        } catch {
          if (text && text.length < 200) errorMsg = text;
        }
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
