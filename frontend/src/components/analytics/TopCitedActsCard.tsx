import React, { useState } from "react";
import { Scale, BookOpen, Layers, ChevronRight, Bookmark } from "lucide-react";
import type { StatuteItem } from "@/types/analytics";

interface TopCitedActsCardProps {
  statutes: StatuteItem[];
}

export function TopCitedActsCard({ statutes }: TopCitedActsCardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedActId, setExpandedActId] = useState<string | null>(null);

  // Extract distinct categories
  const categories = ["all", ...Array.from(new Set(statutes.map((s) => s.category)))];

  const filteredStatutes = selectedCategory === "all"
    ? statutes
    : statutes.filter((s) => s.category === selectedCategory);

  const totalCitations = statutes.reduce((sum, s) => sum + s.citation_count, 0);

  return (
    <div className="card-float p-6 flex flex-col justify-between">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale size={16} style={{ color: "var(--brass)" }} />
            <h3
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--ink)", letterSpacing: "0.06em" }}
            >
              Top Cited Acts & Statutes
            </h3>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-faint)" }}>
            Aggregated across your bookmarked judgments and uploaded vault briefs
          </p>
        </div>

        <span
          className="text-[10px] font-semibold font-mono px-2.5 py-1 rounded-full self-start sm:self-auto"
          style={{ background: "var(--surface-container)", color: "var(--ink-dim)" }}
        >
          {statutes.length} Acts • {totalCitations} Citations
        </span>
      </div>

      {/* ── Category Filter Pills ─────────────────────────────── */}
      {categories.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-2.5 py-1 text-[10px] font-semibold rounded-lg whitespace-nowrap transition-all"
              style={{
                background: selectedCategory === cat ? "var(--brass)" : "var(--surface-container)",
                color: selectedCategory === cat ? "#FFFFFF" : "var(--ink-dim)",
                border: "1px solid var(--hairline)",
              }}
            >
              {cat === "all" ? "All Disciplines" : cat}
            </button>
          ))}
        </div>
      )}

      {/* ── Ranked Statutes List ─────────────────────────────── */}
      {filteredStatutes.length === 0 ? (
        <div
          className="p-8 rounded-2xl text-center flex flex-col items-center justify-center my-4"
          style={{ background: "var(--surface-container)", border: "1px dashed var(--hairline)" }}
        >
          <BookOpen size={28} className="mb-2" style={{ color: "var(--brass)" }} />
          <h4 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            No Statute Telemetry Yet
          </h4>
          <p className="text-xs max-w-sm mt-1 mb-3" style={{ color: "var(--ink-faint)" }}>
            Bookmark cases from search or upload brief PDFs to automatically map statutory frequency and section citations.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredStatutes.slice(0, 7).map((item, idx) => {
            const isExpanded = expandedActId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setExpandedActId(isExpanded ? null : item.id)}
                className="p-3 rounded-xl transition-all cursor-pointer hover:shadow-xs"
                style={{
                  background: isExpanded ? "var(--surface-container-high)" : "var(--surface-container)",
                  border: "1px solid var(--hairline)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Rank & Title */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0"
                      style={{
                        background: idx < 3 ? "var(--brass-soft)" : "rgba(0,0,0,0.04)",
                        color: idx < 3 ? "var(--brass)" : "var(--ink-faint)",
                      }}
                    >
                      {idx + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold truncate" style={{ color: "var(--ink)" }}>
                          {item.short_name}
                        </span>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: "rgba(0,0,0,0.04)", color: "var(--ink-dim)" }}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[10px] truncate mt-0.5 hidden sm:block" style={{ color: "var(--ink-faint)" }}>
                        {item.act_name}
                      </p>
                    </div>
                  </div>

                  {/* Right: Bar, Count & Percentage */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div
                      className="w-16 h-1.5 rounded-full overflow-hidden hidden md:block"
                      style={{ background: "var(--hairline)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, item.percentage)}%`, background: "var(--brass)" }}
                      />
                    </div>
                    <span className="text-xs font-semibold font-mono w-6 text-right" style={{ color: "var(--ink)" }}>
                      {item.citation_count}
                    </span>
                    <span className="text-[10px] font-medium font-mono w-9 text-right" style={{ color: "var(--ink-faint)" }}>
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Expanded Details: Top Sections & Source Judgments */}
                {isExpanded && (
                  <div className="mt-3 pt-2.5 border-t border-[var(--hairline)] flex flex-col gap-2">
                    {item.top_sections && item.top_sections.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider font-semibold" style={{ color: "var(--ink-faint)" }}>
                          Frequently Invoked Provisions:
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {item.top_sections.map((sec, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[10px] px-2 py-0.5 rounded-md font-mono font-medium"
                              style={{
                                background: "var(--surface)",
                                color: "var(--brass)",
                                border: "1px solid var(--hairline)",
                              }}
                            >
                              {sec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.sample_sources && item.sample_sources.length > 0 && (
                      <div className="text-[10px]" style={{ color: "var(--ink-dim)" }}>
                        <span className="font-semibold text-[9px] uppercase font-mono tracking-wider" style={{ color: "var(--ink-faint)" }}>
                          Cited in:
                        </span>{" "}
                        {item.sample_sources.slice(0, 2).join(" • ")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
