import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, LayoutDashboard, Bookmark, Clock, BarChart3, Settings, User } from "lucide-react";

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

  const navItems = [
    { name: "Go to Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Search Cases", path: "/search", icon: Search },
    { name: "View Bookmarks", path: "/bookmarks", icon: Bookmark },
    { name: "View History", path: "/history", icon: Clock },
    { name: "View Analytics", path: "/analytics", icon: BarChart3 },
    { name: "Profile", path: "/profile", icon: User },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const filteredNav = navItems.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

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

            {filteredNav.length > 0 && (
              <div className="px-2 py-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">
                  Navigation
                </div>
                {filteredNav.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-xl hover:bg-gray-100 transition-colors text-left"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <item.icon size={16} style={{ color: "var(--text-muted)" }} />
                    {item.name}
                  </button>
                ))}
              </div>
            )}

            {!query.trim() && filteredNav.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">
                No commands found.
              </div>
            )}
          </div>
          
          <div className="px-4 py-2 bg-gray-50 border-t text-[10px] text-gray-400 flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <span>Use ↑↓ to navigate</span>
            <span>esc to close</span>
          </div>
        </div>
      </div>
    </>
  );
}
