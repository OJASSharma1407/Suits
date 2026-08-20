import React, { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, X } from "lucide-react";

interface SearchBarProps {
  initialValue?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  initialValue = "",
  onSearch,
  placeholder = "Search by party name, advocate, judge, CNR, or keyword...",
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with initialValue when updated externally
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Global shortcut: press '/' or 'Ctrl+K' / 'Cmd+K' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInputActive =
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if ((e.key === "/" && !isInputActive) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  const handleClear = () => {
    setValue("");
    inputRef.current?.focus();
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full flex items-center group">
      <SearchIcon
        size={19}
        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 transition-colors group-focus-within:text-[var(--primary)]"
        style={{ color: "var(--text-muted)" }}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full block py-4 text-sm outline-none transition-all box-border focus:ring-2 focus:ring-black/10"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
          borderRadius: "var(--radius-button)", // Pill shape
          paddingLeft: "46px",
          paddingRight: "160px",
          boxShadow: "var(--shadow-card)",
        }}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-full hover:bg-[var(--surface-container)] transition-colors cursor-pointer"
            style={{ color: "var(--text-muted)" }}
            title="Clear search (Esc)"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        ) : (
          <div
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium opacity-60 pointer-events-none"
            style={{
              background: "var(--surface-container)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            <span className="text-[10px]">Press</span>
            <kbd className="font-mono font-semibold px-1 rounded bg-[var(--card)] border border-[var(--border)]">/</kbd>
          </div>
        )}
        <button
          type="submit"
          className="btn-primary"
          style={{ padding: "8px 22px", fontSize: "13px" }}
        >
          Search
        </button>
      </div>
    </form>
  );
}
