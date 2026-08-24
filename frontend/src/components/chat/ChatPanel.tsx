import React, { useRef, useEffect, useState } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
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
  onClearChat,
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
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && !streamingMessage ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: "var(--surface-container)", color: "var(--primary)" }}
            >
              <Sparkles size={22} />
            </div>
            <h3
              className="text-base sm:text-lg font-semibold tracking-tight mb-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              Assistant
            </h3>
            <p
              className="text-xs sm:text-sm max-w-sm mb-6 leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Ask legal questions, extract binding ratio, analyze cited precedents, or explore court directives.
            </p>
            <SuggestedQuestions
              onSelect={handleSelectQuestion}
              customQuestions={suggestedQuestions}
              variant="list"
            />
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
                    background: "var(--card)",
                    border: "1px solid var(--border)",
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
          </>
        )}
      </div>

      {/* Persistent Prompt Toolbar & Expandable Tray */}
      <div
        className="p-3 border-t space-y-2"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        {/* Horizontal Quick Prompt Chips (Always available throughout the conversation) */}
        {isPromptsOpen && (
          <div className="p-2.5 rounded-xl border animate-in fade-in slide-in-from-bottom-2 space-y-2" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <Sparkles size={11} style={{ color: "var(--primary)" }} /> Legal Research Prompts
              </span>
              <button
                onClick={() => setIsPromptsOpen(false)}
                className="text-[10px] hover:underline cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
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

        {/* Compact Horizontal Prompt Strip */}
        <div className="flex items-center gap-2 overflow-hidden">
          <SuggestedQuestions
            onSelect={handleSelectQuestion}
            customQuestions={suggestedQuestions}
            variant="chips"
          />
        </div>

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
