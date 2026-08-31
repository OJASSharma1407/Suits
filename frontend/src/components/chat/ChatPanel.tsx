import React, { useRef, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
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
  /** Optional handler to clear or start a new chat */
  onClearChat?: () => void;
}

export function ChatPanel({
  messages,
  onSendMessage,
  isLoading,
  streamingMessage,
  suggestedQuestions = [],
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPromptsOpen, setIsPromptsOpen] = useState(false);

  // Auto-scroll whenever messages or streaming content changes with smooth frame batching
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages, streamingMessage, isLoading]);

  const handleSelectQuestion = (question: string) => {
    setIsPromptsOpen(false);
    onSendMessage(question);
  };

  return (
    <div
      className="flex flex-col h-full rounded-2xl border overflow-hidden"
      style={{
        borderColor: "var(--border)",
        background: "var(--bg)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-4 space-y-4"
        ref={scrollRef}
        style={{ overscrollBehavior: "contain" }}
      >
        {messages.length === 0 && !streamingMessage ? (
          <div className="h-full flex flex-col items-center justify-center p-3 sm:p-4 w-full">
            <div className="w-full max-w-md my-auto">
              <SuggestedQuestions
                onSelect={handleSelectQuestion}
                customQuestions={suggestedQuestions}
                variant="list"
              />
            </div>
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
                  className="px-4 py-3 rounded-2xl rounded-tl-xs text-sm"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <div className="flex gap-1.5 items-center">
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: "var(--brass)", animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: "var(--brass)", animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: "var(--brass)", animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Persistent Prompt Toolbar & Input Section */}
      <div
        className="p-3 border-t space-y-2"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        {/* Quick Legal Prompt Drawer (When toggled via '+' button) */}
        {isPromptsOpen && (
          <div
            className="p-3 rounded-2xl border animate-in fade-in slide-in-from-bottom-2 space-y-2.5 max-h-60 overflow-y-auto"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: "var(--hairline-soft)" }}>
              <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5" style={{ color: "var(--ink-faint)" }}>
                <Sparkles size={11} style={{ color: "var(--brass)" }} /> Legal Research Prompts
              </span>
              <button
                type="button"
                onClick={() => setIsPromptsOpen(false)}
                className="text-[11px] font-medium hover:underline cursor-pointer"
                style={{ color: "var(--ink-dim)" }}
              >
                Close
              </button>
            </div>
            <SuggestedQuestions
              onSelect={handleSelectQuestion}
              customQuestions={suggestedQuestions}
              variant="list"
            />
          </div>
        )}

        {/* Input Box with Multi-Line Support and '+' Prompt Menu */}
        <ChatInput
          onSend={onSendMessage}
          disabled={isLoading || !!streamingMessage}
          onTogglePrompts={() => setIsPromptsOpen(!isPromptsOpen)}
          isPromptsOpen={isPromptsOpen}
        />
      </div>
    </div>
  );
}
