import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Scale,
  ExternalLink,
  BookOpen,
  FileText,
  Shield,
  Users,
  Minus,
  ChevronRight,
  Sparkles,
  Clock,
  BarChart2,
  ArrowUpRight,
  BookMarked,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { caseService } from "@/services/cases";
import type { SimilarCaseItem, SimilarCasesResponse } from "@/types/similar-case";

interface SimilarCasesCardProps {
  cnr: string;
  caseTitle: string;
  onReadDocument?: (node: { tid?: string | null; title: string; court?: string | null; node_type: string }) => void;
}

type FilterType = "all" | "binding" | "petitioner" | "respondent";

const courtTierLabel: Record<string, string> = {
  sc: "Supreme Court",
  hc: "High Court",
  tribunal: "Tribunal",
  district: "District Court",
};

const courtTierColor: Record<string, { bg: string; text: string; border: string }> = {
  sc: {
    bg: "rgba(231, 185, 95, 0.13)",
    text: "var(--seal-pending)",
    border: "rgba(231, 185, 95, 0.3)",
  },
  hc: {
    bg: "rgba(62, 124, 166, 0.1)",
    text: "var(--brass)",
    border: "rgba(62, 124, 166, 0.25)",
  },
  tribunal: {
    bg: "rgba(123, 94, 167, 0.1)",
    text: "var(--seal-reserved)",
    border: "rgba(123, 94, 167, 0.25)",
  },
  district: {
    bg: "rgba(92, 100, 114, 0.1)",
    text: "var(--seal-transferred)",
    border: "rgba(92, 100, 114, 0.25)",
  },
};

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circ = 2 * Math.PI * radius;
  const [displayed, setDisplayed] = React.useState(0);

  React.useEffect(() => {
    // Small delay so the animation is visible after mount
    const t = setTimeout(() => setDisplayed(score), 80);
    return () => clearTimeout(t);
  }, [score]);

  const fill = circ * (displayed / 100);
  const color =
    score >= 85 ? "var(--seal-disposed)" : score >= 70 ? "var(--brass)" : "var(--seal-pending)";

  return (
    <div style={{ width: size, height: size, flexShrink: 0, position: "relative" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--hairline)" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.22, 0.61, 0.36, 1)" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size < 48 ? 10 : 12,
          fontWeight: 700,
          color,
          fontFamily: "var(--font-mono)",
        }}
      >
        {score}%
      </div>
    </div>
  );
}

function StrategicPill({ alignment }: { alignment: string }) {
  if (alignment === "Supports Petitioner") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
        style={{ background: "rgba(63, 122, 84, 0.12)", color: "var(--seal-disposed)", border: "1px solid rgba(63, 122, 84, 0.25)" }}
      >
        <Users size={9} />
        Favors Petitioner
      </span>
    );
  }
  if (alignment === "Supports Respondent") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
        style={{ background: "rgba(192, 57, 43, 0.1)", color: "#C0392B", border: "1px solid rgba(192, 57, 43, 0.2)" }}
      >
        <Shield size={9} />
        Favors Respondent
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: "var(--surface-raised)", color: "var(--ink-faint)", border: "1px solid var(--hairline)" }}
    >
      <Minus size={9} />
      Neutral
    </span>
  );
}

function PrecedentCard({
  item,
  idx,
  onReadDocument,
}: {
  item: SimilarCaseItem;
  idx: number;
  onReadDocument?: SimilarCasesCardProps["onReadDocument"];
}) {
  const [expanded, setExpanded] = useState(false);
  const tierStyle = courtTierColor[item.court_tier] ?? courtTierColor.hc;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07, duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
      className="group relative cursor-pointer"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-md)",
        padding: "16px 18px",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--brass)";
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-hover)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--hairline)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <ScoreRing score={item.similarity_score} size={52} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {/* Court tier badge */}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase"
              style={{ background: tierStyle.bg, color: tierStyle.text, border: `1px solid ${tierStyle.border}` }}
            >
              {item.court_tier === "sc" && <Scale size={9} className="mr-1" />}
              {courtTierLabel[item.court_tier] ?? item.court_tier}
            </span>
            {/* Precedent type */}
            {item.precedent_type === "Binding Precedent" && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold"
                style={{ background: "rgba(231, 185, 95, 0.15)", color: "var(--seal-pending)", border: "1px solid rgba(231, 185, 95, 0.3)" }}
              >
                <BookMarked size={9} className="mr-1" />
                Binding
              </span>
            )}
            <StrategicPill alignment={item.strategic_alignment} />
          </div>

          <h4
            className="text-sm font-semibold leading-snug line-clamp-2"
            style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}
          >
            {item.case_title}
          </h4>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[11px]" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
              {item.court_name}
            </span>
            {item.decision_date && (
              <span
                className="inline-flex items-center gap-1 text-[10px]"
                style={{ color: "var(--ink-faint)" }}
              >
                <Clock size={9} />
                {item.decision_date}
              </span>
            )}
          </div>
        </div>

        {/* Expand chevron */}
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: "var(--ink-faint)", flexShrink: 0 }}
        >
          <ChevronRight size={16} />
        </motion.div>
      </div>

      {/* Nexus preview (always visible) */}
      <p
        className="mt-3 text-xs leading-relaxed line-clamp-2"
        style={{ color: "var(--ink-dim)" }}
      >
        {item.legal_nexus}
      </p>

      {/* Expanded section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="mt-4 pt-4 space-y-3"
              style={{ borderTop: "1px solid var(--hairline-soft)" }}
            >
              {/* Key Ratio */}
              {item.key_ratio && (
                <div>
                  <div
                    className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    <BookOpen size={10} />
                    Ratio Decidendi
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                    {item.key_ratio}
                  </p>
                </div>
              )}

              {/* Shared Statutes */}
              {item.shared_statutes && item.shared_statutes.length > 0 && (
                <div>
                  <div
                    className="flex items-center gap-1.5 mb-2 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    <FileText size={10} />
                    Shared Statutes
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.shared_statutes.map((s, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded"
                        style={{
                          background: "var(--brass-soft)",
                          color: "var(--brass-bright)",
                          border: "1px solid rgba(62,124,166,0.2)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Distinguishing factors */}
              {item.distinguishing_factors && (
                <div
                  className="p-3 rounded-lg text-xs"
                  style={{
                    background: "rgba(150, 114, 26, 0.07)",
                    border: "1px solid rgba(150, 114, 26, 0.18)",
                    color: "var(--seal-pending)",
                  }}
                >
                  <span className="font-semibold">⚠ Note: </span>
                  {item.distinguishing_factors}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                {onReadDocument && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReadDocument({
                        tid: item.tid,
                        title: item.case_title,
                        court: item.court_name,
                        node_type: "cited",
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    style={{
                      background: "var(--brass-soft)",
                      color: "var(--brass-bright)",
                      border: "1px solid rgba(62,124,166,0.2)",
                    }}
                  >
                    <BookOpen size={12} />
                    Read Judgment
                  </button>
                )}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: "var(--surface-raised)",
                      color: "var(--ink-dim)",
                      border: "1px solid var(--hairline)",
                    }}
                  >
                    <ExternalLink size={12} />
                    Kanoon Source
                  </a>
                )}
                {item.tid && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(
                        `TID:${item.tid} – ${item.case_title}`
                      );
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    style={{
                      background: "var(--surface-raised)",
                      color: "var(--ink-faint)",
                      border: "1px solid var(--hairline)",
                    }}
                    title="Copy citation reference"
                  >
                    <ArrowUpRight size={12} />
                    Copy Ref
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const FILTER_LABELS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All Precedents" },
  { key: "binding", label: "Binding Only" },
  { key: "petitioner", label: "Petitioner Favorable" },
  { key: "respondent", label: "Respondent Favorable" },
];

export function SimilarCasesCard({ cnr, caseTitle, onReadDocument }: SimilarCasesCardProps) {
  const [data, setData] = useState<SimilarCasesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    caseService
      .getSimilarCases(cnr)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not retrieve similar cases at this time.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [cnr]);

  const filtered = (data?.cases ?? []).filter((c) => {
    if (filter === "binding") return c.precedent_type === "Binding Precedent";
    if (filter === "petitioner") return c.strategic_alignment === "Supports Petitioner";
    if (filter === "respondent") return c.strategic_alignment === "Supports Respondent";
    return true;
  });

  return (
    <div
      className="card-float p-0 overflow-hidden"
      style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--hairline)" }}
    >
      {/* Header */}
      <div
        className="px-6 py-5 flex items-start justify-between gap-4"
        style={{
          background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-raised) 100%)",
          borderBottom: "1px solid var(--hairline-soft)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--brass-soft)", color: "var(--brass-bright)", border: "1px solid rgba(62,124,166,0.2)" }}
          >
            <Scale size={19} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}>
              Similar Cases &amp; Precedents
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--ink-faint)" }}>
              Hybrid RAG · Citation Graph + Semantic Embeddings
            </p>
          </div>
        </div>

        {data && !loading && (
          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-lg font-bold" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                {data.summary.total_found}
              </div>
              <div className="text-[10px]" style={{ color: "var(--ink-faint)" }}>
                Precedents
              </div>
            </div>
            <div style={{ width: 1, height: 32, background: "var(--hairline)" }} />
            <div>
              <div className="text-lg font-bold" style={{ color: "var(--seal-pending)", fontFamily: "var(--font-mono)" }}>
                {data.summary.binding_count}
              </div>
              <div className="text-[10px]" style={{ color: "var(--ink-faint)" }}>
                Binding
              </div>
            </div>
            <div style={{ width: 1, height: 32, background: "var(--hairline)" }} />
            <div>
              <div className="text-lg font-bold" style={{ color: "var(--brass)", fontFamily: "var(--font-mono)" }}>
                {data.summary.avg_similarity_score}%
              </div>
              <div className="text-[10px]" style={{ color: "var(--ink-faint)" }}>
                Avg Match
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shared statutes strip */}
      {data && data.summary.primary_shared_statutes.length > 0 && (
        <div
          className="px-6 py-3 flex items-center gap-2 flex-wrap"
          style={{ background: "var(--surface-raised)", borderBottom: "1px solid var(--hairline-soft)" }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--ink-faint)" }}>
            Key Statutes:
          </span>
          {data.summary.primary_shared_statutes.map((s, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded"
              style={{
                background: "var(--brass-soft)",
                color: "var(--brass-bright)",
                border: "1px solid rgba(62,124,166,0.2)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {s}
            </span>
          ))}
          {data.summary.execution_time_ms > 0 && (
            <span
              className="ml-auto text-[10px] flex items-center gap-1"
              style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}
            >
              <BarChart2 size={9} />
              {(data.summary.execution_time_ms / 1000).toFixed(1)}s
              {data.is_cached && " · cached"}
            </span>
          )}
        </div>
      )}

      {/* Filter chips */}
      {!loading && !error && data && data.cases.length > 0 && (
        <div
          className="px-6 py-3 flex items-center gap-2"
          style={{ borderBottom: "1px solid var(--hairline-soft)" }}
        >
          {FILTER_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
              style={
                filter === key
                  ? {
                      background: "var(--brass-soft)",
                      color: "var(--brass-bright)",
                      border: "1px solid rgba(62,124,166,0.3)",
                    }
                  : {
                      background: "transparent",
                      color: "var(--ink-dim)",
                      border: "1px solid var(--hairline)",
                    }
              }
            >
              {label}
              {key !== "all" && (
                <span className="ml-1.5 opacity-70">
                  (
                  {key === "binding"
                    ? data.cases.filter((c) => c.precedent_type === "Binding Precedent").length
                    : key === "petitioner"
                    ? data.cases.filter((c) => c.strategic_alignment === "Supports Petitioner").length
                    : data.cases.filter((c) => c.strategic_alignment === "Supports Respondent").length}
                  )
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="p-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "var(--brass-soft)" }}
            >
              <Loader2 size={22} className="animate-spin" style={{ color: "var(--brass-bright)" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--ink-dim)" }}>
              Searching precedent database…
            </p>
            <p className="text-xs" style={{ color: "var(--ink-faint)" }}>
              Hybrid RAG · Kanoon citations + Gemini semantic search
            </p>
          </div>
        )}

        {!loading && error && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{ background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.18)" }}
          >
            <AlertCircle size={18} style={{ color: "#C0392B", flexShrink: 0 }} />
            <p className="text-sm" style={{ color: "#C0392B" }}>
              {error}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Scale size={32} style={{ color: "var(--hairline)", strokeWidth: 1.2 }} />
            <p className="text-sm" style={{ color: "var(--ink-faint)" }}>
              {filter !== "all"
                ? "No cases match this filter. Try 'All Precedents'."
                : "No similar precedents found for this case."}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((item, idx) => (
              <PrecedentCard
                key={item.tid ?? item.case_title}
                item={item}
                idx={idx}
                onReadDocument={onReadDocument}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {data && !loading && (
        <div
          className="px-6 py-3 flex items-center gap-2"
          style={{ borderTop: "1px solid var(--hairline-soft)", background: "var(--surface-raised)" }}
        >
          <Sparkles size={11} style={{ color: "var(--ink-faint)" }} />
          <p className="text-[10px]" style={{ color: "var(--ink-faint)" }}>
            Powered by Gemini Semantic Embeddings · Indian Kanoon Citation Graph · Hybrid Reciprocal Rank Fusion
          </p>
        </div>
      )}
    </div>
  );
}
