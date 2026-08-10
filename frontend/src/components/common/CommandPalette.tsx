import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

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
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?query=${encodeURIComponent(query)}`);
      setIsOpen(false);
      setQuery("");
    }
  };


  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
        <div
          className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
          style={{ border: "1px solid var(--border)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSearch} className="relative border-b" style={{ borderColor: "var(--border)" }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search SUITS or type a command..."
              className="w-full pl-11 pr-4 py-4 text-base outline-none bg-transparent"
              style={{ color: "var(--text-primary)" }}
            />
          </form>

          <div className="max-h-80 overflow-y-auto p-2">
            {query.trim() && (
              <div className="px-2 py-1.5 mb-2">
                <button
                  onClick={() => {
                    navigate(`/search?query=${encodeURIComponent(query)}`);
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-xl hover:bg-gray-100 transition-colors text-left"
                  style={{ color: "var(--text-primary)" }}
                >
                  <Search size={16} style={{ color: "var(--text-muted)" }} />
                  <span>
                    Search cases for <strong>"{query}"</strong>
                  </span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
