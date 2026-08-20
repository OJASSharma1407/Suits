import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Sparkles, Plus, CornerDownLeft } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  onTogglePrompts?: () => void;
  isPromptsOpen?: boolean;
}

export function ChatInput({
  onSend,
  disabled,
  onTogglePrompts,
  isPromptsOpen,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dynamic auto-grow from 40px to 180px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 40), 180)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-end gap-2 p-2 rounded-2xl border transition-all focus-within:ring-2 focus-within:border-[var(--primary)]"
        style={{
          borderColor: "var(--border-strong)",
          background: "var(--card)",
          boxShadow: "var(--shadow-ambient)",
        }}
      >
        {/* Quick Prompts '+' Button */}
        {onTogglePrompts && (
          <button
            type="button"
            onClick={onTogglePrompts}
            className="p-2.5 rounded-xl flex-shrink-0 transition-colors cursor-pointer flex items-center justify-center"
            style={{
              background: isPromptsOpen ? "var(--surface-container-high)" : "var(--surface-container)",
              color: isPromptsOpen ? "var(--primary)" : "var(--text-secondary)",
            }}
            title="Toggle Quick Legal Prompts"
          >
            {isPromptsOpen ? <Sparkles size={16} /> : <Plus size={16} />}
          </button>
        )}

        {/* Multi-line auto-expand textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask a legal question, analyze citations, or request ratio..."
          className="flex-1 max-h-[180px] min-h-[40px] py-2 px-2 text-xs sm:text-sm resize-none outline-none bg-transparent leading-relaxed"
          style={{ color: "var(--text-primary)" }}
          rows={1}
        />

        {/* Submit Send Button */}
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="p-2.5 rounded-xl flex-shrink-0 transition-opacity disabled:opacity-40 cursor-pointer flex items-center justify-center"
          style={{ background: "var(--primary)", color: "var(--on-primary)" }}
          title="Send (Enter ↵)"
        >
          <ArrowUp size={16} />
        </button>
      </form>

      {/* Micro-hint */}
      <div className="flex items-center justify-between px-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
        <span className="flex items-center gap-1">
          <CornerDownLeft size={10} /> <strong>Enter</strong> to send • <strong>Shift+Enter</strong> for new line
        </span>
        {onTogglePrompts && (
          <button
            type="button"
            onClick={onTogglePrompts}
            className="hover:underline flex items-center gap-1 cursor-pointer"
            style={{ color: "var(--text-secondary)" }}
          >
            <Sparkles size={10} style={{ color: "var(--primary)" }} />
            {isPromptsOpen ? "Hide Prompts" : "Quick Prompts"}
          </button>
        )}
      </div>
    </div>
  );
}
