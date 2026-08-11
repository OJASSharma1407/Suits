import React, { useRef, useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { SuggestedQuestions } from "./SuggestedQuestions";
import type { ChatMessage } from "@/types/chat";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  /** Partial text being streamed right now — shown as a live assistant bubble */
  streamingMessage?: string;
  /** AI-generated follow-up questions shown after a response completes */
  suggestedQuestions?: string[];
}

export function ChatPanel({
  messages,
  onSendMessage,
  isLoading,
  streamingMessage,
  suggestedQuestions,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll whenever messages or streaming content changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingMessage, isLoading]);

  const lastMessage = messages[messages.length - 1];
  const showSuggested =
    suggestedQuestions &&
    suggestedQuestions.length > 0 &&
    !isLoading &&
    !streamingMessage &&
    lastMessage?.role === "assistant";

  return (
    <div
      className="flex flex-col h-full rounded-2xl border overflow-hidden bg-white"
      style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}
    >
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && !streamingMessage ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <h3
              className="text-lg font-semibold tracking-tight mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              AI Research Assistant
            </h3>
            <p
              className="text-sm max-w-sm mb-8 leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Ask questions about this case, legal precedents, or request summaries of court orders.
            </p>
            <SuggestedQuestions onSelect={onSendMessage} />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Live streaming bubble — appears token-by-token */}
            {streamingMessage && (
              <MessageBubble
                key="__streaming__"
                message={{
                  id: "__streaming__",
                  role: "assistant",
                  message: streamingMessage,
                  created_at: new Date().toISOString(),
                }}
                isStreaming
              />
            )}

            {/* Typing indicator shown only before any tokens arrive */}
            {isLoading && !streamingMessage && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm"
                  style={{
                    background: "var(--surface-container)",
                    color: "var(--text-primary)",
                  }}
                >
                  <div className="flex gap-1.5 items-center">
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: "var(--primary)", animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: "var(--primary)", animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: "var(--primary)", animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* AI-generated follow-up questions */}
            {showSuggested && (
              <div className="pt-2 space-y-2">
                <p
                  className="text-[11px] font-medium uppercase tracking-wider px-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Follow-up questions
                </p>
                {suggestedQuestions!.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => onSendMessage(q)}
                    className="w-full text-left text-sm px-3 py-2 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-sm"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t" style={{ borderColor: "var(--border)" }}>
        <ChatInput onSend={onSendMessage} disabled={isLoading || !!streamingMessage} />
      </div>
    </div>
  );
}
