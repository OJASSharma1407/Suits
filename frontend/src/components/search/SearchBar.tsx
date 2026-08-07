import React, { useState } from "react";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full flex items-center">
      <SearchIcon
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10"
        style={{ color: "var(--text-muted)" }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full block py-4 text-sm outline-none transition-all box-border"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
          borderRadius: "var(--radius-button)", // Pill shape
          paddingLeft: "44px",
          paddingRight: "120px",
          boxShadow: "var(--shadow-card)",
        }}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-full hover:bg-[var(--surface-container)] transition-colors cursor-pointer"
            style={{ color: "var(--text-muted)" }}
            title="Clear search"
          >
            <X size={15} />
          </button>
        )}
        <button
          type="submit"
          className="btn-primary"
          style={{ padding: "8px 20px" }}
        >
          Search
        </button>
      </div>
    </form>
  );
}
