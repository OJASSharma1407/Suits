import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, X } from "lucide-react";

export function TopSearchBar() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get("query") || "";
  const [query, setQuery] = useState(queryParam);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut: press '/' or 'Ctrl+K' / 'Cmd+K' to focus
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
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/search?query=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="top-search-header">
      <form onSubmit={handleSubmit} className="top-search-bar">
        <SearchIcon className="top-search-icon" size={17} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by party name, advocate, judge, CNR, or keyword…"
          className="top-search-input"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="top-search-clear"
            title="Clear search"
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
        <button type="submit" className="btn btn-primary top-search-btn">
          Search
        </button>
      </form>
    </div>
  );
}
