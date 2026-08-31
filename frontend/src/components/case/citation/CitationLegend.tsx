import React from "react";

export function CitationLegend() {
  return (
    <div
      className="p-3.5 rounded-xl border text-xs select-none transition-all"
      style={{
        background: "var(--surface)",
        borderColor: "var(--hairline)",
        color: "var(--ink)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {/* Target Case (Concentric ring) */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-[#E5A93C] flex items-center justify-center p-[2px]">
            <div className="w-full h-full rounded-full bg-[#E5A93C]" />
          </div>
          <span className="font-medium text-[11.5px] truncate" style={{ color: "var(--ink)" }}>
            Current Case (Active)
          </span>
        </div>

        {/* Supreme Court (Blue) */}
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded-full flex-shrink-0 border"
            style={{
              background: "#3B82F6",
              borderColor: "#60A5FA",
            }}
          />
          <span className="font-medium text-[11.5px] truncate" style={{ color: "var(--ink)" }}>
            Supreme Court (SC)
          </span>
        </div>

        {/* High Court (Green) */}
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded-full flex-shrink-0 border"
            style={{
              background: "#10B981",
              borderColor: "#34D399",
            }}
          />
          <span className="font-medium text-[11.5px] truncate" style={{ color: "var(--ink)" }}>
            High Court (HC)
          </span>
        </div>

        {/* Statutes (Purple) */}
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded-full flex-shrink-0 border"
            style={{
              background: "#8B5CF6",
              borderColor: "#A78BFA",
            }}
          />
          <span className="font-medium text-[11.5px] truncate" style={{ color: "var(--ink)" }}>
            Statute / Act (ACT)
          </span>
        </div>

        {/* Subsequent Citing (Slate) */}
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded-full flex-shrink-0 border"
            style={{
              background: "#6B7280",
              borderColor: "#9CA3AF",
            }}
          />
          <span className="font-medium text-[11.5px] truncate" style={{ color: "var(--ink)" }}>
            Subsequent Case (CASE)
          </span>
        </div>
      </div>
    </div>
  );
}
