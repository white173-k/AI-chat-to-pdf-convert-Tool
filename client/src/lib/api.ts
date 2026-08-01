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
  return ''; // fallback to relative path /api
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
      `Network Error: Unable to reach backend API at '${endpoint}'. Please ensure your backend server is running and VITE_API_URL is correctly set in Vercel.`
    );
  }

  const text = await res.text();

  if (!res.ok) {
    if (res.status === 404 || text.includes('NOT_FOUND') || text.includes('page could not be found')) {
      throw new Error(
        `Backend API endpoint not found (404 NOT_FOUND). The frontend is trying to call '${endpoint}'. Please deploy your backend (e.g. on Render, Railway, or Vercel API) and set VITE_API_URL in your Vercel Environment Variables.`
      );
    }

    try {
      const errJson = JSON.parse(text);
      if (errJson.error) throw new Error(errJson.error);
    } catch {
      if (text && text.length < 200) throw new Error(text);
    }
    throw new Error(`Server returned HTTP ${res.status}: Failed to fetch preview.`);
  }

  try {
    const data = JSON.parse(text);
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch conversation preview.');
    }
    return data;
  } catch (parseErr: any) {
    throw new Error(`Invalid JSON response from server: ${text.slice(0, 100)}`);
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
      `Network Error: Unable to reach backend API at '${endpoint}'. Please ensure your backend server is running and VITE_API_URL is correctly set in Vercel.`
    );
  }

  if (!res.ok) {
    let errorMsg = `Server returned HTTP ${res.status}: Failed to generate PDF.`;
    try {
      const text = await res.text();
      if (res.status === 404 || text.includes('NOT_FOUND') || text.includes('page could not be found')) {
        errorMsg = `Backend API endpoint not found (404 NOT_FOUND). The frontend is trying to call '${endpoint}'. Please deploy your backend (e.g. on Render, Railway, or VPS) and set VITE_API_URL in your Vercel Environment Variables.`;
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
