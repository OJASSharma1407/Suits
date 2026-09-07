import React, { useState } from "react";
import { Scale, BookOpen, Award, FileText, Layers } from "lucide-react";
import type { StatuteItem } from "@/types/analytics";

interface TopCitedActsCardProps {
  statutes: StatuteItem[];
}

const CATEGORY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  "Criminal Procedure": { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.28)" },
  "Criminal Law": { color: "#EF4444", bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.28)" },
  "Constitutional Law": { color: "#38BDF8", bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.28)" },
  "Commercial & Arbitration": { color: "#10B981", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.28)" },
  "Commercial": { color: "#10B981", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.28)" },
  "Civil Procedure": { color: "#6366F1", bg: "rgba(99, 102, 241, 0.12)", border: "rgba(99, 102, 241, 0.28)" },
  "Corporate Law": { color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.12)", border: "rgba(139, 92, 246, 0.28)" },
};

function getCategoryStyle(cat: string, idx = 0) {
  if (CATEGORY_STYLES[cat]) return CATEGORY_STYLES[cat];
  const colors = ["#C4A06D", "#38BDF8", "#F59E0B", "#10B981", "#8B5CF6"];
  const color = colors[idx % colors.length];
  return { color, bg: `${color}18`, border: `${color}35` };
}

export function TopCitedActsCard({ statutes }: TopCitedActsCardProps) {
  const [expandedActId, setExpandedActId] = useState<string | null>(null);

  const totalCitations = statutes.reduce((sum, s) => sum + s.citation_count, 0);

  // Group by category/discipline
  const categoryMap = new Map<string, number>();
  statutes.forEach((s) => {
    categoryMap.set(s.category, (categoryMap.get(s.category) || 0) + s.citation_count);
  });

  const categoriesData = Array.from(categoryMap.entries())
    .map(([category, count]) => ({
      category,
      count,
      percentage: totalCitations > 0 ? Number(((count / totalCitations) * 100).toFixed(0)) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const topAct = statutes.length > 0
    ? [...statutes].sort((a, b) => b.citation_count - a.citation_count)[0]
    : null;

  const topCategory = categoriesData[0] || null;

  return (
    <div className="card-float p-6 flex flex-col justify-between">
      <div>
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

        {/* ── Key Statutory Intelligence Strip ─────────────── */}
        {statutes.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div
              className="p-2.5 rounded-xl flex flex-col justify-center transition-all"
              style={{ background: "var(--surface-container)", border: "1px solid var(--hairline)" }}
            >
              <div className="flex items-center gap-1">
                <Award size={11} style={{ color: "var(--brass)" }} />
                <span className="text-[9px] uppercase font-mono tracking-wider font-semibold" style={{ color: "var(--ink-faint)" }}>
                  Leading Statute
                </span>
              </div>
              <span className="text-xs font-bold truncate mt-1" style={{ color: "var(--ink)" }}>
                {topAct?.short_name || "N/A"}
              </span>
              <span className="text-[10px] font-mono mt-0.5" style={{ color: "var(--brass)" }}>
                {topAct ? `${topAct.citation_count} Citations • ${topAct.percentage}%` : "No data"}
              </span>
            </div>

            <div
              className="p-2.5 rounded-xl flex flex-col justify-center transition-all"
              style={{ background: "var(--surface-container)", border: "1px solid var(--hairline)" }}
            >
              <div className="flex items-center gap-1">
                <FileText size={11} style={{ color: "#38BDF8" }} />
                <span className="text-[9px] uppercase font-mono tracking-wider font-semibold" style={{ color: "var(--ink-faint)" }}>
                  Total Citations
                </span>
              </div>
              <span className="text-xs font-bold font-mono mt-1" style={{ color: "#38BDF8" }}>
                {totalCitations} Citations
              </span>
              <span className="text-[10px] font-mono mt-0.5" style={{ color: "var(--ink-dim)" }}>
                Across {statutes.length} Key Enactments
              </span>
            </div>

            <div
              className="p-2.5 rounded-xl flex flex-col justify-center transition-all"
              style={{ background: "var(--surface-container)", border: "1px solid var(--hairline)" }}
            >
              <div className="flex items-center gap-1">
                <Layers size={11} style={{ color: "var(--seal-disposed)" }} />
                <span className="text-[9px] uppercase font-mono tracking-wider font-semibold" style={{ color: "var(--ink-faint)" }}>
                  Top Discipline
                </span>
              </div>
              <span className="text-xs font-bold truncate mt-1" style={{ color: "var(--seal-disposed)" }}>
                {topCategory?.category || "General Law"}
              </span>
              <span className="text-[10px] font-mono mt-0.5" style={{ color: "var(--ink-dim)" }}>
                {topCategory ? `${topCategory.percentage}% of Citations` : `${categoriesData.length} Disciplines`}
              </span>
            </div>
          </div>
        )}

        {/* ── Ranked Statutes List ─────────────────────────────── */}
        {statutes.length === 0 ? (
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
            {statutes.slice(0, 6).map((item, idx) => {
              const isExpanded = expandedActId === item.id;
              const style = getCategoryStyle(item.category, idx);

              return (
                <div
                  key={item.id}
                  onClick={() => setExpandedActId(isExpanded ? null : item.id)}
                  className="p-3 rounded-xl transition-all cursor-pointer hover:shadow-xs group"
                  style={{
                    background: isExpanded ? "var(--surface-container-high)" : "var(--surface-container)",
                    border: isExpanded ? `1px solid ${style.color}70` : "1px solid var(--hairline)",
                    boxShadow: isExpanded ? `0 2px 14px ${style.color}15` : "none",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Rank & Title */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0"
                        style={{
                          background: idx === 0 ? "var(--brass-soft)" : "rgba(255,255,255,0.04)",
                          color: idx === 0 ? "var(--brass)" : "var(--ink-faint)",
                          border: `1px solid ${idx === 0 ? "var(--brass)" : "var(--hairline)"}`,
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
                            style={{
                              background: style.bg,
                              color: style.color,
                              border: `1px solid ${style.border}`,
                            }}
                          >
                            {item.category}
                          </span>
                          {/* Top sections preview tags */}
                          {item.top_sections && item.top_sections.length > 0 && !isExpanded && (
                            <div className="hidden sm:flex items-center gap-1">
                              {item.top_sections.slice(0, 2).map((sec, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="text-[9px] px-1.5 py-0.2 rounded font-mono"
                                  style={{
                                    color: "var(--ink-faint)",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid var(--hairline)",
                                  }}
                                >
                                  {sec}
                                </span>
                              ))}
                            </div>
                          )}
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
                          style={{ width: `${Math.min(100, item.percentage)}%`, background: style.color }}
                        />
                      </div>
                      <span className="text-xs font-bold font-mono w-6 text-right" style={{ color: style.color }}>
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
                                  color: style.color,
                                  border: `1px solid ${style.border}`,
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

      {/* ── Statutory Discipline Spectrum Footer ───────────────── */}
      {statutes.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-[var(--hairline)]">
          <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
            <span className="uppercase tracking-wider font-semibold" style={{ color: "var(--ink-faint)" }}>
              Statutory Discipline Spectrum
            </span>
            <span style={{ color: "var(--ink-dim)" }}>
              {categoriesData.length} Disciplines Active
            </span>
          </div>

          {/* Multi-segment stacked spectrum bar */}
          <div
            className="w-full h-2 rounded-full overflow-hidden flex gap-0.5 p-0.5"
            style={{ background: "var(--surface-container)" }}
          >
            {categoriesData.map((cat, i) => {
              const style = getCategoryStyle(cat.category, i);
              return (
                <div
                  key={i}
                  className="h-full rounded-sm transition-all duration-500"
                  style={{ width: `${cat.percentage}%`, background: style.color }}
                  title={`${cat.category}: ${cat.count} citations (${cat.percentage}%)`}
                />
              );
            })}
          </div>

          {/* Spectrum Legend Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2 mt-2 text-[10px]">
            {categoriesData.slice(0, 4).map((cat, i) => {
              const style = getCategoryStyle(cat.category, i);
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: style.color }} />
                  <span style={{ color: "var(--ink-dim)" }}>
                    {cat.category} ({cat.percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
