export type SupportedPlatform =
  | 'chatgpt'
  | 'gemini'
  | 'claude'
  | 'perplexity'
  | 'grok'
  | 'deepseek'
  | 'copilot';

export type ViewMode = 'desktop' | 'mobile' | 'tablet';
export type AppTheme = 'dark' | 'light';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  authorName?: string;
  content: string;
  htmlContent?: string;
  timestamp?: string;
}

export interface SharedConversation {
  id: string;
  title: string;
  platform: SupportedPlatform;
  originalUrl: string;
  createdAt?: string;
  messages: ChatMessage[];
  modelName?: string;
}

export interface PreviewResponse {
  title: string;
  platform: SupportedPlatform;
  messageCount: number;
  messages: ChatMessage[];
  modelName?: string;
  viewMode?: ViewMode;
  theme?: AppTheme;
}

export interface ConvertRequest {
  url: string;
  theme?: AppTheme;
  viewMode?: ViewMode;
  customTitle?: string;
}
