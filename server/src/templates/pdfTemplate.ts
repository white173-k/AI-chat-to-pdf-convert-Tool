import { SharedConversation, ChatMessage, AppTheme, ViewMode } from '../types.js';

export function renderPdfHtmlTemplate(
  conversation: SharedConversation,
  processedMessages: (ChatMessage & { html: string })[],
  generatedDateString: string,
  theme: AppTheme = 'dark',
  viewMode: ViewMode = 'desktop'
): string {
  const platformLabel = conversation.platform === 'chatgpt' ? 'ChatGPT' : 'Google Gemini';
  const isLight = theme === 'light';
  const isMobile = viewMode === 'mobile';

  // Highlight.js stylesheet choice
  const hljsStyle = isLight
    ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css'
    : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';

  const tocItems = processedMessages
    .filter((m) => m.role === 'assistant')
    .map((m, index) => {
      const headingMatch = m.html.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
      const label = headingMatch
        ? headingMatch[1].replace(/<[^>]+>/g, '').trim()
        : `Section ${index + 1}: ${m.content.slice(0, 45).replace(/\n/g, ' ')}...`;
      return `<li><a href="#msg-${m.id}">${label}</a></li>`;
    })
    .join('');

  const messagesHtml = processedMessages
    .map((msg, index) => {
      const isUser = msg.role === 'user';
      const roleLabel = isUser ? 'User Prompt' : `${platformLabel} Response`;
      const badgeClass = isUser ? 'badge-user' : 'badge-assistant';

      return `
        <div class="message-card ${isUser ? 'card-user' : 'card-assistant'}" id="msg-${msg.id}">
          <div class="message-header">
            <span class="role-badge ${badgeClass}">${roleLabel}</span>
            <span class="message-number">#${index + 1}</span>
          </div>
          <div class="markdown-body">
            ${msg.html}
          </div>
        </div>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${conversation.title}</title>
  
  <link rel="stylesheet" href="${hljsStyle}">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --bg-color: ${isLight ? '#ffffff' : '#0d1117'};
      --card-bg-assistant: ${isLight ? '#ffffff' : '#161b22'};
      --card-bg-user: ${isLight ? '#f6f8fa' : '#1c2128'};
      --text-main: ${isLight ? '#1f2328' : '#e6edf3'};
      --text-muted: ${isLight ? '#656d76' : '#8b949e'};
      --border-color: ${isLight ? '#d0d7de' : '#30363d'};
      --accent-blue: ${isLight ? '#0969da' : '#58a6ff'};
      --accent-cyan: ${isLight ? '#0550ae' : '#79c0ff'};
      --accent-green: ${isLight ? '#1a7f37' : '#3fb950'};
      --accent-purple: ${isLight ? '#8250df' : '#bc8cff'};
      --code-bg: ${isLight ? '#f6f8fa' : '#0d1117'};
      --header-text: ${isLight ? '#000000' : '#ffffff'};
    }

    @page {
      size: A4;
      margin: ${isMobile ? '10mm 8mm 12mm 8mm' : '18mm 15mm 20mm 15mm'};
    }

    body {
      background-color: var(--bg-color);
      color: var(--text-main);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: ${isMobile ? '12px' : '13.5px'};
      line-height: ${isMobile ? '1.55' : '1.65'};
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .document-cover {
      border-bottom: 2px solid var(--border-color);
      padding-bottom: ${isMobile ? '16px' : '24px'};
      margin-bottom: ${isMobile ? '20px' : '30px'};
      break-after: avoid;
    }

    .doc-meta-badge {
      display: inline-block;
      background: ${isLight ? 'rgba(9, 105, 218, 0.1)' : 'rgba(88, 166, 255, 0.15)'};
      color: var(--accent-blue);
      border: 1px solid ${isLight ? 'rgba(9, 105, 218, 0.3)' : 'rgba(88, 166, 255, 0.4)'};
      padding: 3px 8px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    .document-title {
      font-size: ${isMobile ? '20px' : '26px'};
      font-weight: 800;
      color: var(--header-text);
      line-height: 1.25;
      margin-bottom: 10px;
      letter-spacing: -0.5px;
    }

    .meta-details {
      display: flex;
      flex-wrap: wrap;
      gap: ${isMobile ? '10px' : '20px'};
      font-size: ${isMobile ? '10.5px' : '11.5px'};
      color: var(--text-muted);
    }

    .toc-section {
      background: var(--card-bg-user);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: ${isMobile ? '12px 14px' : '16px 20px'};
      margin-bottom: 24px;
      break-inside: avoid;
    }

    .toc-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--accent-cyan);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .toc-list {
      list-style-type: none;
      display: grid;
      grid-template-columns: 1fr;
      gap: 5px;
    }

    .toc-list a {
      color: var(--text-main);
      text-decoration: none;
      font-size: 11.5px;
    }

    .message-card {
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: ${isMobile ? '14px' : '20px'};
      margin-bottom: ${isMobile ? '16px' : '24px'};
      break-inside: avoid;
    }

    .card-user {
      background-color: var(--card-bg-user);
      border-left: 4px solid var(--accent-blue);
    }

    .card-assistant {
      background-color: var(--card-bg-assistant);
      border-left: 4px solid var(--accent-green);
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--border-color);
    }

    .role-badge {
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
    }

    .badge-user {
      background-color: ${isLight ? 'rgba(9, 105, 218, 0.15)' : 'rgba(88, 166, 255, 0.2)'};
      color: var(--accent-blue);
    }

    .badge-assistant {
      background-color: ${isLight ? 'rgba(26, 127, 55, 0.15)' : 'rgba(63, 185, 80, 0.2)'};
      color: var(--accent-green);
    }

    .message-number {
      font-size: 10.5px;
      color: var(--text-muted);
      font-family: 'Fira Code', monospace;
    }

    .markdown-body {
      font-size: ${isMobile ? '12px' : '13.5px'};
      color: var(--text-main);
    }

    .markdown-body p { margin-bottom: 10px; }
    .markdown-body p:last-child { margin-bottom: 0; }

    .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 {
      color: var(--header-text);
      font-weight: 700;
      margin-top: 16px;
      margin-bottom: 8px;
      break-after: avoid;
    }

    .markdown-body h1 { font-size: ${isMobile ? '16px' : '18px'}; color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; }
    .markdown-body h2 { font-size: ${isMobile ? '14.5px' : '16px'}; color: var(--accent-cyan); }
    .markdown-body h3 { font-size: ${isMobile ? '13px' : '14.5px'}; color: var(--accent-purple); }

    .markdown-body ul, .markdown-body ol {
      margin-left: 18px;
      margin-bottom: 10px;
    }

    .markdown-body blockquote {
      border-left: 3px solid var(--accent-blue);
      background: ${isLight ? 'rgba(9, 105, 218, 0.05)' : 'rgba(88, 166, 255, 0.05)'};
      padding: 8px 12px;
      border-radius: 0 6px 6px 0;
      margin: 10px 0;
      font-style: italic;
    }

    .markdown-body pre {
      background-color: var(--code-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px;
      margin: 12px 0;
      overflow-x: auto;
      break-inside: avoid;
    }

    .markdown-body code {
      font-family: 'Fira Code', Consolas, Monaco, monospace;
      font-size: 11.5px;
    }

    .markdown-body p code, .markdown-body li code {
      background-color: ${isLight ? 'rgba(175, 184, 193, 0.2)' : 'rgba(110, 118, 129, 0.2)'};
      color: var(--accent-green);
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 11.5px;
    }

    .markdown-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      break-inside: avoid;
    }

    .markdown-body th, .markdown-body td {
      border: 1px solid var(--border-color);
      padding: 6px 10px;
      text-align: left;
      font-size: 11.5px;
    }

    .markdown-body th {
      background-color: var(--card-bg-user);
      color: var(--header-text);
      font-weight: 600;
    }

    .markdown-body img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      margin: 10px 0;
    }
  </style>
</head>
<body>

  <div class="document-cover">
    <div class="doc-meta-badge">${platformLabel} Conversation • ${viewMode.toUpperCase()} LAYOUT</div>
    <h1 class="document-title">${conversation.title}</h1>
    <div class="meta-details">
      <div>📅 Generated: ${generatedDateString}</div>
      <div>💬 Messages: ${processedMessages.length}</div>
      <div>🎨 Theme: ${theme.toUpperCase()}</div>
      <div>🔗 Original Link: ${conversation.originalUrl}</div>
    </div>
  </div>

  ${
    tocItems && processedMessages.length > 4
      ? `
  <div class="toc-section">
    <div class="toc-title">Table of Contents</div>
    <ul class="toc-list">
      ${tocItems}
    </ul>
  </div>
  `
      : ''
  }

  <div class="conversation-container">
    ${messagesHtml}
  </div>

</body>
</html>
  `;
}
