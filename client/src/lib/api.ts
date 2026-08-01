import html2pdf from 'html2pdf.js';

export type ViewMode = 'desktop' | 'mobile' | 'tablet';
export type AppTheme = 'dark' | 'light';

export interface PreviewData {
  success?: boolean;
  error?: string;
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

export interface ConvertData extends PreviewData {
  pdfHtml?: string;
}

export async function fetchPreview(
  url: string,
  customTitle?: string,
  theme: AppTheme = 'dark',
  viewMode: ViewMode = 'desktop'
): Promise<PreviewData> {
  const endpoint = '/api/preview';

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, customTitle, theme, viewMode }),
    });
  } catch (networkErr: any) {
    throw new Error(`Failed to connect to Vercel API endpoint (${endpoint}). Please try again.`);
  }

  const text = await res.text();

  if (!res.ok) {
    if (res.status === 404 || text.includes('NOT_FOUND') || text.includes('page could not be found')) {
      throw new Error(`Vercel API Route /api/preview was not found (404 NOT_FOUND). Please verify Vercel build configuration.`);
    }

    try {
      const errJson = JSON.parse(text);
      if (errJson.error) throw new Error(errJson.error);
    } catch {
      if (text && text.length < 200) throw new Error(text);
    }
    throw new Error(`Server error (${res.status}): Failed to fetch conversation preview.`);
  }

  try {
    const data = JSON.parse(text);
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch conversation preview.');
    }
    return data;
  } catch {
    throw new Error('Invalid JSON response received from Vercel API.');
  }
}

export async function generateAndDownloadPdf(
  url: string,
  customTitle?: string,
  theme: AppTheme = 'dark',
  viewMode: ViewMode = 'desktop'
): Promise<string> {
  const endpoint = '/api/convert';

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, customTitle, theme, viewMode }),
    });
  } catch (networkErr: any) {
    throw new Error(`Failed to connect to Vercel API endpoint (${endpoint}). Please try again.`);
  }

  const text = await res.text();

  if (!res.ok) {
    let errorMsg = `Server returned HTTP ${res.status}: Failed to generate PDF.`;
    try {
      const errJson = JSON.parse(text);
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      if (text && text.length < 200) errorMsg = text;
    }
    throw new Error(errorMsg);
  }

  let data: ConvertData;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response received from Vercel API during PDF generation.');
  }

  if (!data.success || !data.pdfHtml) {
    throw new Error(data.error || 'Failed to generate PDF template.');
  }

  // Render client-side vector PDF using html2pdf
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.innerHTML = data.pdfHtml;
  document.body.appendChild(container);

  const fileName = data.fileName ? (data.fileName.endsWith('.pdf') ? data.fileName : `${data.fileName}.pdf`) : 'AI_Conversation_Notes.pdf';

  const marginTuple: [number, number, number, number] = [10, 10, 15, 10];

  const opt = {
    margin: marginTuple,
    filename: fileName,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
  };

  try {
    await html2pdf().set(opt).from(container).save();
  } finally {
    document.body.removeChild(container);
  }

  return fileName;
}
