"use client";

import { isValidElement, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

/** Recursively flatten React children into plain text (for copy-to-clipboard). */
function extractText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement(node)) {
    return extractText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const raw = extractText(children).replace(/\n$/, "");

  let language = "";
  if (isValidElement(children)) {
    const cls = (children.props as { className?: string }).className ?? "";
    language = cls.replace("language-", "");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable — non-fatal
    }
  }

  return (
    <div className="group/code relative my-3 overflow-hidden rounded-xl border border-white/[0.1] bg-[#05050c]/90 shadow-[0_0_24px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-3.5 py-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-[#deff9a]"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-[#deff9a]" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy Code
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 text-[12.5px] leading-relaxed text-zinc-300 [scrollbar-width:thin]">
        {children}
      </pre>
    </div>
  );
}

type ChatMarkdownProps = {
  content: string;
};

/** Dark-neon themed Markdown renderer for assistant chat bubbles. */
export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-zinc-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-3 text-base font-semibold text-white first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-3 text-[15px] font-semibold text-white first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-2.5 text-sm font-semibold text-[#deff9a] first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="my-1.5">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          em: ({ children }) => <em className="text-zinc-200">{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#deff9a] underline decoration-[#deff9a]/40 underline-offset-2 hover:decoration-[#deff9a]"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="my-2 space-y-1 pl-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-[#deff9a]/70">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="relative pl-4 before:absolute before:left-0 before:top-[0.55em] before:h-1 before:w-1 before:rounded-full before:bg-[#deff9a]/70 [ol_&]:pl-0 [ol_&]:before:hidden">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-[#deff9a]/40 bg-[#deff9a]/[0.04] py-1 pl-3 text-zinc-400">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-white/[0.08]" />,
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          code: ({ className, children }) => {
            // Block code is wrapped by our CodeBlock via `pre` — keep it bare here.
            if (className?.includes("language-")) {
              return <code className={className}>{children}</code>;
            }
            return (
              <code className="rounded-md border border-white/[0.08] bg-white/[0.05] px-1.5 py-0.5 font-mono text-[12px] text-[#deff9a]">
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-left text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-white/[0.08] bg-white/[0.03] text-zinc-400">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-medium">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-t border-white/[0.04] px-3 py-2 text-zinc-300">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
