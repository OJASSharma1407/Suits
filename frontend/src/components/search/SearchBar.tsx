import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface SearchBarProps {
  initialValue?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function SearchBar({
  initialValue = "",
  onSearch,
  placeholder = 'Try "Murmu vs Chowdhury" or a CNR number…',
  isLoading = false,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Global shortcut: '/' or Ctrl+K to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInputActive =
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (
        (e.key === "/" && !isInputActive) ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
      ) {
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
    <form onSubmit={handleSubmit} className="search-bar" style={{ marginBottom: 18 }}>
      {/* Search icon */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        style={{ width: 16, height: 16, color: "var(--ink-faint)", flexShrink: 0 }}
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          color: "var(--ink)",
          fontFamily: "var(--font-sans)",
          fontSize: "14.5px",
          padding: "11px 0",
          outline: "none",
        }}
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            color: "var(--ink-faint)",
            display: "flex",
            alignItems: "center",
            borderRadius: "var(--radius-sm)",
            flexShrink: 0,
          }}
          title="Clear search"
          aria-label="Clear search"
        >
          <X size={15} />
        </button>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary"
        style={{
          marginRight: 2,
          flexShrink: 0,
          minWidth: "82px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
      >
        {isLoading ? (
          <span
            className="loader"
            style={{
              ["--loader-size" as string]: "15px",
              ["--loader-thickness" as string]: "2.5px",
              ["--loader-color" as string]: "#ffffff",
              display: "inline-block",
            }}
          />
        ) : (
          "Search"
        )}
      </button>
    </form>
  );
}
