import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

export async function convertMarkdownToHtml(markdownText: string): Promise<string> {
  try {
    const processed = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeHighlight)
      .use(rehypeKatex)
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(markdownText);

    return String(processed);
  } catch (error) {
    console.error('[Markdown Service] Error parsing markdown, fallback to basic escaping:', error);
    // Simple fallback escaping for unparseable text
    return markdownText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');
  }
}
