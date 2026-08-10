import React, { useRef, useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { SuggestedQuestions } from "./SuggestedQuestions";
import type { ChatMessage } from "@/types/chat";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export function ChatPanel({ messages, onSendMessage, isLoading }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full rounded-2xl border overflow-hidden bg-white" style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <h3 className="text-lg font-semibold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
              AI Research Assistant
            </h3>
            <p className="text-sm max-w-sm mb-8 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Ask questions about this case, legal precedents, or request summaries of court orders.
            </p>
            <SuggestedQuestions onSelect={onSendMessage} />
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm" style={{ background: "var(--surface-container)", color: "var(--text-primary)" }}>
              <div className="flex gap-1.5 items-center">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--primary)", animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--primary)", animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--primary)", animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t" style={{ borderColor: "var(--border)" }}>
        <ChatInput onSend={onSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
