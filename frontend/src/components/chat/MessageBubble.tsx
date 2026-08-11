import React from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
  /** When true, shows a blinking cursor at the end (streaming in progress) */
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] px-4 py-3 text-sm ${
          isUser ? "rounded-2xl rounded-tr-sm" : "rounded-2xl rounded-tl-sm"
        }`}
        style={{
          background: isUser ? "var(--primary)" : "var(--surface-container)",
          color: isUser ? "var(--on-primary)" : "var(--text-primary)",
        }}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.message}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-a:text-blue-600">
            <ReactMarkdown>{message.message}</ReactMarkdown>
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
            className={`text-[10px] mt-1.5 text-right ${isUser ? "opacity-70" : "opacity-50"}`}
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
