import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Scale,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { predictionService } from "@/services/prediction";
import type { CasePredictionResponse, CaseComparisonItem } from "@/types/prediction";
import { toast } from "sonner";

interface CasePredictionCardProps {
  cnr: string;
  caseTitle?: string;
}

const directionalBadgeConfig = {
  supports_relief: {
    label: "Supports Relief",
    bg: "rgba(39, 174, 96, 0.12)",
    text: "#27ae60",
    border: "rgba(39, 174, 96, 0.3)",
  },
  supports_denial: {
    label: "Supports Denial",
    bg: "rgba(235, 87, 87, 0.12)",
    text: "#eb5757",
    border: "rgba(235, 87, 87, 0.3)",
  },
  neutral: {
    label: "Neutral Authority",
    bg: "rgba(242, 201, 76, 0.12)",
    text: "#d48806",
    border: "rgba(242, 201, 76, 0.3)",
  },
};

const palette = ["#27ae60", "#2f80ed", "#eb5757", "#9b51e0", "#f2994a", "#6c757d"];

export function CasePredictionCard({ cnr, caseTitle }: CasePredictionCardProps) {
  const [data, setData] = useState<CasePredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);
  const [activePrecedentIndex, setActivePrecedentIndex] = useState<number>(0);

  const fetchPrediction = async () => {
    if (!cnr) return;
    setLoading(true);
    try {
      const resp = await predictionService.getPrediction(cnr);
      setData(resp);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!cnr || refreshing) return;
    setRefreshing(true);
    try {
      const resp = await predictionService.refreshPrediction(cnr);
      if (resp) {
        setData(resp);
        toast.success("Prediction re-analyzed successfully.");
      } else {
        toast.info("Prediction analysis is currently unavailable.");
      }
    } catch {
      toast.error("Failed to refresh prediction analysis.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [cnr]);

  // If service returns 204 or is disabled, do not render any empty clutter
  if (!loading && !data) {
    return null;
  }

  return (
    <div
      id="prediction-analysis-section"
      className="card-float overflow-hidden rounded-2xl transition-all relative border"
      style={{
        background: "var(--surface)",
        borderColor: "var(--hairline)",
      }}
    >
      {/* Header Bar */}
      <div
        className="px-6 py-5 flex items-center justify-between border-b"
        style={{
          borderColor: "var(--hairline)",
          background: "var(--surface-raised)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: "var(--brass-soft)",
              border: "1px solid var(--hairline)",
            }}
          >
            <Scale size={18} style={{ color: "var(--brass-bright)" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Precedent Comparison & Outcome Signal
              </h3>
              {data && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    background: "var(--brass-soft)",
                    color: "var(--brass-bright)",
                    border: "1px solid var(--hairline)",
                  }}
                >
                  {data.matter_type} TAXONOMY
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: "var(--ink-dim)" }}>
              Deductive judicial comparison over InLegalBERT-ranked precedents
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border"
            style={{
              background: "var(--surface)",
              color: "var(--ink-dim)",
              borderColor: "var(--hairline)",
            }}
            title="Re-run judicial deduction"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            <span>{refreshing ? "Analyzing…" : "Re-Analyze"}</span>
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--brass-bright)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--ink-dim)" }}>
            Synthesizing InLegalBERT Precedent Analogy…
          </p>
        </div>
      ) : data ? (
        <div className="p-6 sm:p-8 space-y-8">
          {/* 1. Mandatory Calibration Banner */}
          {!data.outcome_distribution.calibration.is_backtested && (
            <div
              className="p-4 rounded-xl flex items-start gap-3 border text-xs"
              style={{
                background: "rgba(242, 201, 76, 0.08)",
                borderColor: "rgba(242, 201, 76, 0.25)",
                color: "var(--text-primary)",
              }}
            >
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-600 dark:text-amber-400">
                  Precedent-Weighted Analytical Signal
                </p>
                <p className="mt-0.5" style={{ color: "var(--ink-dim)" }}>
                  {data.outcome_distribution.calibration.disclaimer}
                </p>
              </div>
            </div>
          )}

          {/* 2. Primary Hero: Similarities vs. Differences Matrix */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Precedent Analogy & Distinctions ({data.comparisons.length} Key Authorities)
              </h4>
              <span className="text-xs" style={{ color: "var(--ink-faint)" }}>
                Click a precedent to compare
              </span>
            </div>

            {/* Precedent Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
              {data.comparisons.map((comp, idx) => {
                const isActive = activePrecedentIndex === idx;
                const badge = directionalBadgeConfig[comp.directional_effect] || directionalBadgeConfig.neutral;
                return (
                  <button
                    key={idx}
                    onClick={() => setActivePrecedentIndex(idx)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer whitespace-nowrap transition-all border"
                    style={{
                      background: isActive ? "var(--surface-raised)" : "transparent",
                      color: isActive ? "var(--text-primary)" : "var(--ink-dim)",
                      borderColor: isActive ? "var(--brass-bright)" : "var(--hairline)",
                      boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: badge.text }}
                    />
                    <span className="truncate max-w-[200px]">{comp.precedent_title}</span>
                    <span
                      className="px-1.5 py-0.2 rounded text-[10px]"
                      style={{ background: "rgba(0,0,0,0.05)" }}
                    >
                      {Math.round(comp.inlegalbert_score * 100)}% Match
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Precedent Detailed Card */}
            {data.comparisons[activePrecedentIndex] && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePrecedentIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="p-5 rounded-2xl border space-y-5"
                  style={{
                    background: "var(--surface-raised)",
                    borderColor: "var(--hairline)",
                  }}
                >
                  {/* Precedent Title & Directional Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h5 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {data.comparisons[activePrecedentIndex].precedent_title}
                      </h5>
                      <p className="text-xs mt-0.5" style={{ color: "var(--ink-dim)" }}>
                        InLegalBERT Semantic Congruence:{" "}
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {Math.round(data.comparisons[activePrecedentIndex].inlegalbert_score * 100)}%
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {(() => {
                        const badge =
                          directionalBadgeConfig[
                            data.comparisons[activePrecedentIndex].directional_effect
                          ] || directionalBadgeConfig.neutral;
                        return (
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold border"
                            style={{
                              background: badge.bg,
                              color: badge.text,
                              borderColor: badge.border,
                            }}
                          >
                            {badge.label}
                          </span>
                        );
                      })()}

                      {data.comparisons[activePrecedentIndex].precedent_url && (
                        <a
                          href={data.comparisons[activePrecedentIndex].precedent_url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border cursor-pointer hover:underline"
                          style={{
                            borderColor: "var(--hairline)",
                            color: "var(--brass-bright)",
                          }}
                        >
                          <span>Kanoon</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Parallels vs Distinctions Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Parallels */}
                    <div
                      className="p-4 rounded-xl border space-y-2"
                      style={{
                        background: "rgba(39, 174, 96, 0.04)",
                        borderColor: "rgba(39, 174, 96, 0.18)",
                      }}
                    >
                      <h6 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 size={14} /> Factual & Statutory Parallels
                      </h6>
                      <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                        {data.comparisons[activePrecedentIndex].similarities.map((item, sIdx) => (
                          <li key={sIdx} className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Distinctions */}
                    <div
                      className="p-4 rounded-xl border space-y-2"
                      style={{
                        background: "rgba(235, 87, 87, 0.04)",
                        borderColor: "rgba(235, 87, 87, 0.18)",
                      }}
                    >
                      <h6 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                        <XCircle size={14} /> Distinguishing Factors & Gaps
                      </h6>
                      <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                        {data.comparisons[activePrecedentIndex].differences.map((item, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-2">
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Directional Rationale Quote */}
                  <div
                    className="p-3 rounded-lg border text-xs italic"
                    style={{
                      borderColor: "var(--hairline)",
                      color: "var(--ink-dim)",
                      background: "var(--surface)",
                    }}
                  >
                    "{data.comparisons[activePrecedentIndex].effect_rationale}"
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* 3. Outcome Distribution Stacked Segment Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Precedent-Weighted Outcome Tendency
              </h4>
              <span className="text-xs font-medium" style={{ color: "var(--ink-dim)" }}>
                Sum: 100%
              </span>
            </div>

            {/* Segmented Horizontal Progress Bar */}
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-stone-200 dark:bg-stone-800">
              {data.outcome_distribution.outcomes.map((out, idx) => {
                const widthPct = Math.max(4, Math.round(out.weight * 100));
                const col = palette[idx % palette.length];
                return (
                  <div
                    key={out.label}
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: col,
                    }}
                    className="h-full transition-all relative group"
                    title={`${out.label}: ${Math.round(out.weight * 100)}%`}
                  />
                );
              })}
            </div>

            {/* Legend & Rationales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {data.outcome_distribution.outcomes.map((out, idx) => {
                const col = palette[idx % palette.length];
                return (
                  <div
                    key={out.label}
                    className="p-3 rounded-xl border text-xs space-y-1"
                    style={{
                      background: "var(--surface-raised)",
                      borderColor: "var(--hairline)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold" style={{ color: col }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: col }} />
                        <span>{out.label}</span>
                      </div>
                      <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                        {Math.round(out.weight * 100)}%
                      </span>
                    </div>
                    {out.rationale && (
                      <p className="text-[11px] leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                        {out.rationale}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Governing Legal Framework & Threshold Checklist */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Governing Doctrine */}
            <div
              className="p-5 rounded-2xl border space-y-3"
              style={{
                background: "var(--surface-raised)",
                borderColor: "var(--hairline)",
              }}
            >
              <h5 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--brass-bright)" }}>
                <FileCheck size={14} /> Controlling Judicial Doctrine
              </h5>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>
                {data.explanation.governing_doctrine}
              </p>

              {/* Critical Vulnerabilities */}
              {data.explanation.critical_vulnerabilities.length > 0 && (
                <div className="pt-2 border-t" style={{ borderColor: "var(--hairline)" }}>
                  <h6 className="text-[11px] font-semibold uppercase text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                    <ShieldAlert size={12} /> Strategic Vulnerabilities
                  </h6>
                  <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-300">
                    {data.explanation.critical_vulnerabilities.map((v, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Statutory Thresholds Checklist */}
            <div
              className="p-5 rounded-2xl border space-y-3"
              style={{
                background: "var(--surface-raised)",
                borderColor: "var(--hairline)",
              }}
            >
              <h5 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                <TrendingUp size={14} /> Statutory Threshold Checklist
              </h5>
              <div className="space-y-2">
                {data.explanation.statutory_thresholds.map((th, idx) => {
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border text-xs flex items-start gap-2.5"
                      style={{
                        borderColor: "var(--hairline)",
                        background: "var(--surface)",
                      }}
                    >
                      {th.status === "met" ? (
                        <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      ) : th.status === "not_met" ? (
                        <XCircle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <HelpCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                          {th.test}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
                          {th.note}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. Model-Generated Judicial Deduction Thought Summary (Collapsible) */}
          <div
            className="rounded-2xl border overflow-hidden transition-all"
            style={{
              borderColor: "var(--hairline)",
              background: "var(--surface-raised)",
            }}
          >
            <button
              onClick={() => setIsReasoningOpen(!isReasoningOpen)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold cursor-pointer"
              style={{ color: "var(--text-primary)" }}
            >
              <span className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: "var(--brass-bright)" }} />
                Model-Generated Judicial Deduction Summary
              </span>
              {isReasoningOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isReasoningOpen && (
              <div
                className="px-5 py-4 border-t text-xs leading-relaxed space-y-3"
                style={{
                  borderColor: "var(--hairline)",
                  color: "var(--ink-dim)",
                  background: "var(--surface)",
                }}
              >
                <p>{data.explanation.judicial_deduction_summary}</p>
                {data.reasoning_summary && (
                  <div
                    className="p-3 rounded-xl border text-[11px] space-y-1 font-mono"
                    style={{
                      background: "var(--surface-raised)",
                      borderColor: "var(--hairline)",
                    }}
                  >
                    <p className="font-bold text-stone-500">Gemini Chain-of-Thought Trace:</p>
                    <p className="whitespace-pre-wrap">{data.reasoning_summary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Footer Attribution */}
      {data && (
        <div
          className="px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] border-t gap-2"
          style={{
            borderColor: "var(--hairline)",
            background: "var(--surface-raised)",
            color: "var(--ink-faint)",
          }}
        >
          <span>{data.model_attribution}</span>
          <span>
            State Hash: {data.case_state_hash} · {data.is_cached ? "Loaded from Cache" : "Fresh Analysis"}
          </span>
        </div>
      )}
    </div>
  );
}
