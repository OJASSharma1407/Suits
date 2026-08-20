import React from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "@/types/chat";
import { renderTextWithCitations } from "./CitationChip";

interface MessageBubbleProps {
  message: ChatMessage;
  /** When true, shows a blinking cursor at the end (streaming in progress) */
  isStreaming?: boolean;
}

function processChildren(children: React.ReactNode): React.ReactNode {
  if (typeof children === "string") {
    return renderTextWithCitations(children);
  }
  if (Array.isArray(children)) {
    return React.Children.map(children, (child) => {
      if (typeof child === "string") {
        return renderTextWithCitations(child);
      }
      return child;
    });
  }
  return children;
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}>
      <div
        className={`max-w-[92%] sm:max-w-[85%] px-4 py-3 text-sm ${
          isUser ? "rounded-2xl rounded-tr-sm" : "rounded-2xl rounded-tl-sm"
        } transition-shadow shadow-xs`}
        style={{
          background: isUser ? "var(--primary)" : "var(--card)",
          color: isUser ? "var(--on-primary)" : "var(--text-primary)",
          border: isUser ? "none" : "1px solid var(--border)",
        }}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.message}</p>
        ) : (
          <div className="prose prose-sm max-w-none text-xs sm:text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-2.5 last:mb-0 leading-relaxed">
                    {processChildren(children)}
                  </p>
                ),
                li: ({ children }) => (
                  <li className="mb-1 last:mb-0">
                    {processChildren(children)}
                  </li>
                ),
                table: ({ children }) => (
                  <div
                    className="overflow-x-auto my-3 -mx-1 sm:mx-0 rounded-xl border shadow-xs"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                  >
                    <table className="w-full text-left text-xs divide-y divide-[var(--border)]">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ background: "var(--surface-container)", color: "var(--text-muted)" }}
                  >
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-2 font-semibold whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 whitespace-normal leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {processChildren(children)}
                  </td>
                ),
                blockquote: ({ children }) => (
                  <blockquote
                    className="border-l-4 pl-3 py-1 my-2.5 italic rounded-r-lg text-xs"
                    style={{ borderColor: "var(--primary)", background: "var(--surface-container)", color: "var(--text-primary)" }}
                  >
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code
                    className="px-1.5 py-0.5 rounded font-mono text-[11px]"
                    style={{ background: "var(--surface-container)", color: "var(--text-primary)" }}
                  >
                    {children}
                  </code>
                ),
              }}
            >
              {message.message}
            </ReactMarkdown>
            {isStreaming && (
              <span
                className="inline-block w-[2px] h-[1em] ml-0.5 align-text-bottom animate-pulse rounded-sm"
                style={{ background: "var(--primary)" }}
                aria-label="AI is typing"
              />
            )}
          </div>
        )}
        {!isStreaming && (
          <div
            className={`text-[10px] mt-1.5 text-right ${isUser ? "opacity-75" : "opacity-50"}`}
          >
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  );
}
