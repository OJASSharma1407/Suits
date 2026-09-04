import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Sparkles, Plus } from "lucide-react";

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

  // Dynamic auto-grow from 38px to 160px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 38), 160)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "38px";
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
    <div className="w-full relative">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl border transition-all duration-200 focus-within:ring-2 focus-within:ring-[var(--brass-soft)] focus-within:border-[var(--brass)]"
        style={{
          borderColor: "var(--border)",
          background: "var(--card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Quick Prompts '+' Button */}
        {onTogglePrompts && (
          <button
            type="button"
            onClick={onTogglePrompts}
            className="w-9 h-9 rounded-xl flex-shrink-0 transition-colors cursor-pointer flex items-center justify-center self-end"
            style={{
              background: isPromptsOpen ? "var(--brass-soft)" : "var(--surface-container)",
              color: isPromptsOpen ? "var(--brass-bright)" : "var(--ink-dim)",
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
          placeholder="Ask a legal question, analyze citations, or dictate pleadings (Hold Alt to speak)..."
          className="flex-1 max-h-[160px] min-h-[38px] py-2 px-1.5 text-xs sm:text-[13.5px] resize-none outline-none bg-transparent leading-relaxed"
          style={{ color: "var(--ink)" }}
          rows={1}
        />

        {/* Submit Send Button */}
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="w-9 h-9 rounded-xl flex-shrink-0 transition-all disabled:opacity-35 cursor-pointer flex items-center justify-center self-end active:scale-95"
          style={{ background: "var(--brass)", color: "#FFFFFF" }}
          title="Send"
        >
          <ArrowUp size={16} />
        </button>
      </form>
    </div>
  );
}
