import React, { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-end gap-2 p-2 rounded-2xl border bg-white transition-shadow focus-within:ring-2"
      style={{
        borderColor: "var(--border-strong)",
        boxShadow: "var(--shadow-ambient)",
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Ask a legal question..."
        className="flex-1 max-h-[150px] min-h-[44px] py-3 px-3 text-sm resize-none outline-none bg-transparent"
        style={{ color: "var(--text-primary)" }}
        rows={1}
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="p-3 rounded-xl flex-shrink-0 transition-opacity disabled:opacity-50 cursor-pointer flex items-center justify-center"
        style={{ background: "var(--primary)", color: "var(--on-primary)" }}
      >
        <ArrowUp size={16} />
      </button>
    </form>
  );
}
