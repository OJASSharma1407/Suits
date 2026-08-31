import React from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

interface CitationGraphControlsProps {
  activeFilter: string;
  onFilterChange: (f: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export function CitationGraphControls({
  activeFilter,
  onFilterChange,
  onZoomIn,
  onZoomOut,
  onResetView,
}: CitationGraphControlsProps) {
  const filterOptions = [
    { id: "all", label: "All Network" },
    { id: "sc", label: "Supreme Court" },
    { id: "hc", label: "High Courts" },
    { id: "statute", label: "Statutes & Acts" },
    { id: "citing", label: "Subsequent Cases" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
        {filterOptions.map((opt) => {
          const isActive = activeFilter === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onFilterChange(opt.id)}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer"
              style={{
                background: isActive ? "var(--brass)" : "var(--surface)",
                color: isActive ? "var(--on-primary)" : "var(--ink-dim)",
                border: `1px solid ${isActive ? "var(--brass-bright)" : "var(--hairline)"}`,
                boxShadow: isActive ? "var(--shadow-card)" : "none",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Viewport Zoom Controls */}
      <div
        className="flex items-center gap-1 p-1 rounded-lg border backdrop-blur-md"
        style={{
          background: "var(--glass-bg)",
          borderColor: "var(--hairline)",
        }}
      >
        <button
          onClick={onZoomIn}
          title="Zoom In"
          className="p-1.5 rounded hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          style={{ color: "var(--ink)" }}
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-1.5 rounded hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          style={{ color: "var(--ink)" }}
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={onResetView}
          title="Reset & Center View"
          className="p-1.5 rounded hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          style={{ color: "var(--ink)" }}
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </div>
  );
}
