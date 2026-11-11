import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

const assistantMarkdownComponents: Components = {
  a: ({ children, href }) => (
    <a
      className="underline decoration-navy/30 underline-offset-2"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-navy/20 pl-4 text-navy/80">{children}</blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = Boolean(className);

    if (isBlock) {
      return <code className="font-mono text-sm">{children}</code>;
    }

    return (
      <code className="rounded bg-navy/5 px-1 py-0.5 font-mono text-[0.9em]">{children}</code>
    );
  },
  h1: ({ children }) => <p className="mb-3 text-lg font-semibold">{children}</p>,
  h2: ({ children }) => <p className="mb-3 text-base font-semibold">{children}</p>,
  h3: ({ children }) => <p className="mb-2 text-base font-semibold">{children}</p>,
  li: ({ children }) => <li className="leading-7">{children}</li>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>,
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-2xl border border-navy/10 bg-navy/5 p-4 font-mono text-sm leading-6">
      {children}
    </pre>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>,
};

export function AgentMessageContent({
  content,
  role,
  streaming = false,
}: {
  content: string;
  role: 'user' | 'assistant';
  streaming?: boolean;
}) {
  if (role === 'user' || streaming) {
    return <div className="whitespace-pre-wrap break-words">{content}</div>;
  }

  return (
    <div className="break-words leading-7">
      <ReactMarkdown
        components={assistantMarkdownComponents}
        rehypePlugins={[rehypeSanitize]}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
