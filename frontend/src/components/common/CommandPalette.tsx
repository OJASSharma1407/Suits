import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Command } from "lucide-react";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (isOpen) setQuery("");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?query=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const quickLinks = [
    { label: "Dashboard", path: "/dashboard", shortcut: "G D" },
    { label: "Search Cases", path: "/search", shortcut: "G S" },
    { label: "Bookmarks", path: "/bookmarks", shortcut: "G B" },
    { label: "History", path: "/history", shortcut: "G H" },
    { label: "Analytics", path: "/analytics", shortcut: "G A" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] backdrop-blur-sm animate-fade-in"
        style={{ background: "rgba(0, 0, 0, 0.45)" }}
        onClick={() => setIsOpen(false)}
      />

      {/* Panel */}
      <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[14vh] px-4 pointer-events-none">
        <div
          className="w-full max-w-xl rounded-2xl overflow-hidden pointer-events-auto animate-spring-in"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border-strong)",
            boxShadow: "0 24px 80px -12px rgba(0, 0, 0, 0.35), 0 8px 32px rgba(0, 0, 0, 0.15)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <form
            onSubmit={handleSearch}
            className="relative flex items-center border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <Search
              className="absolute left-4"
              size={18}
              style={{ color: "var(--text-muted)" }}
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cases or navigate…"
              className="w-full pl-11 pr-14 py-4 text-base outline-none bg-transparent"
              style={{ color: "var(--text-primary)" }}
            />
            <kbd
              className="absolute right-4 flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                background: "var(--surface-container)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              <span>Esc</span>
            </kbd>
          </form>

          <div className="max-h-72 overflow-y-auto p-2">
            {/* Search action */}
            {query.trim() && (
              <div className="px-1 mb-1">
                <button
                  onClick={handleSearch as any}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-left transition-colors"
                  style={{ color: "var(--text-primary)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-container)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Search size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  <span>
                    Search cases for <strong>"{query}"</strong>
                  </span>
                  <kbd
                    className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      background: "var(--surface-container)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    ↵
                  </kbd>
                </button>
              </div>
            )}

            {/* Quick navigation */}
            {!query.trim() && (
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest px-3 py-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Quick Navigation
                </p>
                {quickLinks.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => handleNavigate(link.path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-left transition-colors"
                    style={{ color: "var(--text-primary)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-container)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Command size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    <span className="flex-1">{link.label}</span>
                    <kbd
                      className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                      style={{
                        background: "var(--surface-container)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {link.shortcut}
                    </kbd>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div
            className="flex items-center justify-between px-4 py-2.5 border-t"
            style={{ borderColor: "var(--border)", background: "var(--surface-container)" }}
          >
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Type to search · navigate with ↑↓ · confirm with ↵
            </span>
            <div className="flex items-center gap-1">
              <kbd
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  background: "var(--card)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                ⌘K
              </kbd>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>to close</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
