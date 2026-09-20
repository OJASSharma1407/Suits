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
  Users,
  Shield,
  BookOpen,
  ArrowUpRight,
  BookMarked,
  Minus,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { predictionService } from "@/services/prediction";
import { caseService } from "@/services/cases";
import type { CasePredictionResponse, OutcomeWeight } from "@/types/prediction";
import type { SimilarCaseItem, SimilarCasesResponse } from "@/types/similar-case";

interface PrecedentsPredictionCardProps {
  cnr: string;
  caseTitle?: string;
  onReadDocument?: (node: { tid?: string | null; title: string; court?: string | null; node_type: string }) => void;
}

type PrecedentFilter = "all" | "binding" | "petitioner" | "respondent";

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

const directionalBadgeConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  supports_relief: {
    label: "Supports Petitioner",
    bg: "rgba(39, 174, 96, 0.12)",
    text: "#27ae60",
    border: "rgba(39, 174, 96, 0.3)",
  },
  supports_denial: {
    label: "Supports Respondent",
    bg: "rgba(235, 87, 87, 0.12)",
    text: "#eb5757",
    border: "rgba(235, 87, 87, 0.3)",
  },
  neutral: {
    label: "Neutral Precedent",
    bg: "rgba(242, 201, 76, 0.12)",
    text: "#d48806",
    border: "rgba(242, 201, 76, 0.3)",
  },
};

const outcomePalette = ["#27ae60", "#2f80ed", "#eb5757", "#9b51e0", "#f2994a", "#6c757d"];

// Circular Animated Score Ring
function ScoreRing({ score, size = 50 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circ = 2 * Math.PI * radius;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayed(score), 80);
    return () => clearTimeout(t);
  }, [score]);

  const fill = circ * (displayed / 100);
  const color =
    score >= 85 ? "var(--seal-disposed)" : score >= 70 ? "var(--brass)" : "var(--seal-pending)";

  return (
    <div style={{ width: size, height: size, flexShrink: 0, position: "relative" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--hairline)" strokeWidth={3.5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={3.5}
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
          fontSize: 11,
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

function StrategicPill({ alignment }: { alignment?: string }) {
  if (alignment === "Supports Petitioner" || alignment === "supports_relief") {
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
  if (alignment === "Supports Respondent" || alignment === "supports_denial") {
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

export function PrecedentsPredictionCard({
  cnr,
  caseTitle = "Active Matter",
  onReadDocument,
}: PrecedentsPredictionCardProps) {
  // Precedents state (InLegalBERT + Kanoon loaded on mount)
  const [precedentsData, setPrecedentsData] = useState<SimilarCasesResponse | null>(null);
  const [loadingPrecedents, setLoadingPrecedents] = useState<boolean>(true);
  const [filter, setFilter] = useState<PrecedentFilter>("all");
  const [expandedCases, setExpandedCases] = useState<Record<number, boolean>>({});

  // Prediction state (On-demand / cached)
  const [predictionData, setPredictionData] = useState<CasePredictionResponse | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState<boolean>(false);
  const [activePrecedentIndex, setActivePrecedentIndex] = useState<number>(0);
  const [isReasoningOpen, setIsReasoningOpen] = useState<boolean>(false);

  // 1. Fetch Similar Cases on mount
  useEffect(() => {
    let isMounted = true;
    const loadPrecedents = async () => {
      if (!cnr) return;
      setLoadingPrecedents(true);
      try {
        const res = await caseService.getSimilarCases(cnr);
        if (isMounted) setPrecedentsData(res);
      } catch {
        if (isMounted) setPrecedentsData(null);
      } finally {
        if (isMounted) setLoadingPrecedents(false);
      }
    };

    loadPrecedents();
    return () => {
      isMounted = false;
    };
  }, [cnr]);

  // 2. Fetch Prediction on demand
  const handleRunPrediction = async (force: boolean = false) => {
    if (!cnr || loadingPrediction) return;
    setLoadingPrediction(true);
    try {
      const resp = force
        ? await predictionService.refreshPrediction(cnr)
        : await predictionService.getPrediction(cnr);
      if (resp) {
        setPredictionData(resp);
        toast.success(force ? "Prediction re-analyzed." : "Judicial outcome predicted.");
      } else {
        toast.info("Prediction analysis currently unavailable for this matter.");
      }
    } catch {
      toast.error("Failed to run judicial prediction analysis.");
    } finally {
      setLoadingPrediction(false);
    }
  };

  const cases: SimilarCaseItem[] = precedentsData?.cases || [];
  const comparisons = predictionData?.comparisons || [];

  const outcomesList: OutcomeWeight[] = Array.isArray(predictionData?.outcome_distribution)
    ? (predictionData.outcome_distribution as any)
    : (predictionData?.outcome_distribution?.outcomes || []);

  const calibration = predictionData?.outcome_distribution?.calibration;
  const isBacktested = calibration?.is_backtested ?? false;
  const disclaimer =
    calibration?.disclaimer ||
    "Precedent-weighted analytical signal derived from retrieved similar judgments.";

  const toggleExpand = (idx: number) => {
    setExpandedCases((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getPrecedentDirection = (title: string): string => {
    if (!comparisons.length || !title) return "neutral";
    const cleanTitle = title.toLowerCase().trim();
    const matched = comparisons.find(
      (c) =>
        c?.precedent_title &&
        (c.precedent_title.toLowerCase().trim() === cleanTitle ||
          c.precedent_title.toLowerCase().includes(cleanTitle) ||
          cleanTitle.includes(c.precedent_title.toLowerCase().trim()))
    );
    return matched?.directional_effect || "neutral";
  };

  // Filter cases
  const filteredCases = cases.filter((c) => {
    if (filter === "binding") return c.court_tier === "sc" || c.precedent_type === "Binding Precedent";
    if (filter === "petitioner") {
      const dir = getPrecedentDirection(c.case_title);
      return dir === "supports_relief" || c.strategic_alignment === "Supports Petitioner";
    }
    if (filter === "respondent") {
      const dir = getPrecedentDirection(c.case_title);
      return dir === "supports_denial" || c.strategic_alignment === "Supports Respondent";
    }
    return true;
  });

  return (
    <div
      id="precedents-prediction-section"
      className="card-float overflow-hidden rounded-2xl transition-all relative border space-y-6 p-6 sm:p-8"
      style={{
        background: "var(--surface)",
        borderColor: "var(--hairline)",
        borderRadius: "var(--radius-md)",
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4"
        style={{ borderColor: "var(--hairline-soft)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--brass-soft)", color: "var(--brass-bright)", border: "1px solid var(--hairline)" }}
          >
            <Scale size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-medium tracking-tight" style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}>
                Precedents & Judicial Prediction
              </h3>
              {predictionData?.matter_type && (
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider font-mono"
                  style={{ background: "var(--surface-raised)", color: "var(--brass)", border: "1px solid var(--hairline)" }}
                >
                  {predictionData.matter_type}
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--ink-faint)" }}>
              Citation topology, InLegalBERT semantic analogy, and predictive judicial outcome deduction.
            </p>
          </div>
        </div>

        {/* Prediction Trigger Button */}
        <div className="flex items-center gap-2">
          {!predictionData ? (
            <button
              onClick={() => handleRunPrediction(false)}
              disabled={loadingPrediction}
              className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all disabled:opacity-40"
              style={{
                background: "var(--brass-soft)",
                color: "var(--brass-bright)",
                border: "1px solid var(--hairline)",
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {loadingPrediction ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>{loadingPrediction ? "Analyzing Model…" : "Run Judicial Prediction"}</span>
            </button>
          ) : (
            <button
              onClick={() => handleRunPrediction(true)}
              disabled={loadingPrediction}
              className="btn btn-ghost flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-all"
              style={{ border: "1px solid var(--hairline)", padding: "6px 13px", color: "var(--ink-dim)" }}
              title="Refresh prediction model"
            >
              <RefreshCw size={12} className={loadingPrediction ? "animate-spin" : ""} style={{ color: loadingPrediction ? "var(--brass)" : undefined }} />
              <span>{loadingPrediction ? "Re-Analyzing…" : "Refresh Prediction"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── SECTION 1: PREDICTION ANALYTICS (When predictionData is present) ─── */}
      {predictionData && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Disclaimer Banner */}
          {!isBacktested && (
            <div
              className="p-3.5 rounded-lg flex items-start gap-3 border text-xs"
              style={{
                background: "rgba(242, 201, 76, 0.08)",
                borderColor: "rgba(242, 201, 76, 0.25)",
                color: "var(--ink)",
              }}
            >
              <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-600 dark:text-amber-400">
                  Precedent-Weighted Analytical Signal
                </p>
                <p className="mt-0.5" style={{ color: "var(--ink-dim)" }}>
                  {disclaimer}
                </p>
              </div>
            </div>
          )}

          {/* Outcome Tendency Segment Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                <TrendingUp size={13} style={{ color: "var(--brass)" }} /> Precedent-Weighted Outcome Tendency
              </h4>
              <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
                Based on {comparisons.length} governing authorities
              </span>
            </div>

            {/* Segmented Horizontal Progress Bar */}
            <div className="w-full h-3.5 rounded-full overflow-hidden flex" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
              {outcomesList.map((out, idx) => {
                const widthPct = Math.max(4, Math.round((out.weight || 0) * 100));
                const col = outcomePalette[idx % outcomePalette.length];
                return (
                  <div
                    key={idx}
                    style={{ width: `${widthPct}%`, backgroundColor: col }}
                    className="h-full transition-all"
                    title={`${out.label}: ${Math.round((out.weight || 0) * 100)}%`}
                  />
                );
              })}
            </div>

            {/* Outcome cards with detailed rationale */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {outcomesList.map((out, idx) => {
                const col = outcomePalette[idx % outcomePalette.length];
                const pct = Math.round((out.weight || 0) * 100);
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg border text-xs space-y-1.5"
                    style={{ background: "var(--surface)", borderColor: "var(--hairline)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold" style={{ color: col }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: col }} />
                        <span>{out.label}</span>
                      </div>
                      <span className="font-bold font-mono" style={{ color: "var(--ink)" }}>
                        {pct}%
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

          {/* Interactive Precedent Comparisons Selector */}
          {comparisons.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                  <Layers size={13} style={{ color: "var(--brass)" }} /> Precedent Analogy & Distinctions ({comparisons.length} Authorities)
                </h4>
                <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
                  Select authority to compare
                </span>
              </div>

              {/* Precedent Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {comparisons.map((comp, idx) => {
                  const isActive = activePrecedentIndex === idx;
                  const badge = directionalBadgeConfig[comp.directional_effect] || directionalBadgeConfig.neutral;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActivePrecedentIndex(idx)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap transition-all border"
                      style={{
                        background: isActive ? "var(--surface-raised)" : "transparent",
                        color: isActive ? "var(--ink)" : "var(--ink-dim)",
                        borderColor: isActive ? "var(--brass)" : "var(--hairline)",
                      }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: badge.text }} />
                      <span className="truncate max-w-[180px]">{comp.precedent_title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--surface)", border: "1px solid var(--hairline)" }}>
                        {Math.round(comp.inlegalbert_score * 100)}%
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Precedent Comparison Drawer */}
              {comparisons[activePrecedentIndex] && (
                <div
                  className="p-5 rounded-lg border space-y-4"
                  style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h5 className="text-sm font-semibold" style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}>
                        {comparisons[activePrecedentIndex].precedent_title}
                      </h5>
                      <p className="text-xs mt-0.5" style={{ color: "var(--ink-dim)" }}>
                        InLegalBERT Semantic Congruence:{" "}
                        <span className="font-semibold" style={{ color: "var(--seal-disposed)", fontFamily: "var(--font-mono)" }}>
                          {Math.round(comparisons[activePrecedentIndex].inlegalbert_score * 100)}%
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {(() => {
                        const badge =
                          directionalBadgeConfig[comparisons[activePrecedentIndex].directional_effect] || directionalBadgeConfig.neutral;
                        return (
                          <span
                            className="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                            style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
                          >
                            {badge.label}
                          </span>
                        );
                      })()}

                      {comparisons[activePrecedentIndex].precedent_url && (
                        <a
                          href={comparisons[activePrecedentIndex].precedent_url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border hover:underline"
                          style={{ borderColor: "var(--hairline)", color: "var(--brass-bright)" }}
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
                      className="p-4 rounded-lg border space-y-2"
                      style={{ background: "rgba(39, 174, 96, 0.04)", borderColor: "rgba(39, 174, 96, 0.2)" }}
                    >
                      <h6 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "#27ae60" }}>
                        <CheckCircle2 size={13} /> Factual & Statutory Parallels
                      </h6>
                      <ul className="space-y-1.5 text-xs" style={{ color: "var(--ink-dim)" }}>
                        {comparisons[activePrecedentIndex].similarities.map((item, sIdx) => (
                          <li key={sIdx} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Distinctions */}
                    <div
                      className="p-4 rounded-lg border space-y-2"
                      style={{ background: "rgba(235, 87, 87, 0.04)", borderColor: "rgba(235, 87, 87, 0.2)" }}
                    >
                      <h6 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "#eb5757" }}>
                        <XCircle size={13} /> Distinguishing Factors & Gaps
                      </h6>
                      <ul className="space-y-1.5 text-xs" style={{ color: "var(--ink-dim)" }}>
                        {comparisons[activePrecedentIndex].differences.map((item, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-1.5">
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Directional Rationale Quote */}
                  {comparisons[activePrecedentIndex].effect_rationale && (
                    <div
                      className="p-3 rounded-lg border text-xs italic"
                      style={{ borderColor: "var(--hairline)", color: "var(--ink-dim)", background: "var(--surface)" }}
                    >
                      "{comparisons[activePrecedentIndex].effect_rationale}"
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Governing Legal Framework & Threshold Checklist */}
          {predictionData.explanation && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Governing Doctrine */}
              <div className="p-5 rounded-lg border space-y-3" style={{ background: "var(--surface)", borderColor: "var(--hairline)" }}>
                <h5 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                  <FileCheck size={13} style={{ color: "var(--brass)" }} /> Controlling Judicial Doctrine
                </h5>
                <p className="text-xs leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  {predictionData.explanation.governing_doctrine}
                </p>

                {/* Critical Vulnerabilities */}
                {predictionData.explanation.critical_vulnerabilities?.length > 0 && (
                  <div className="pt-2 border-t space-y-1.5" style={{ borderColor: "var(--hairline)" }}>
                    <h6 className="text-[11px] font-semibold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <ShieldAlert size={12} /> Strategic Vulnerabilities
                    </h6>
                    <ul className="space-y-1 text-xs" style={{ color: "var(--ink-dim)" }}>
                      {predictionData.explanation.critical_vulnerabilities.map((v, i) => (
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
              {predictionData.explanation.statutory_thresholds?.length > 0 && (
                <div className="p-5 rounded-lg border space-y-3" style={{ background: "var(--surface)", borderColor: "var(--hairline)" }}>
                  <h5 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                    <TrendingUp size={13} style={{ color: "var(--brass)" }} /> Statutory Threshold Checklist
                  </h5>
                  <div className="space-y-2">
                    {predictionData.explanation.statutory_thresholds.map((th, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border text-xs flex items-start gap-2.5"
                        style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}
                      >
                        {th.status === "met" ? (
                          <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                        ) : th.status === "not_met" ? (
                          <XCircle size={15} className="text-rose-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <HelpCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-semibold" style={{ color: "var(--ink)" }}>{th.test}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-dim)" }}>{th.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reasoning Summary Toggle */}
          {predictionData.explanation?.reasoning && (
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--hairline)", background: "var(--surface)" }}>
              <button
                onClick={() => setIsReasoningOpen(!isReasoningOpen)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold transition-colors text-left"
                style={{ color: "var(--ink)" }}
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={13} style={{ color: "var(--brass)" }} />
                  <span>Model-Generated Judicial Deduction Reasoning</span>
                </div>
                {isReasoningOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {isReasoningOpen && (
                <div className="p-4 border-t text-xs leading-relaxed whitespace-pre-line" style={{ borderColor: "var(--hairline)", color: "var(--ink-dim)" }}>
                  {predictionData.explanation.reasoning}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ── SECTION 2: SIMILAR PRECEDENTS LIST (InLegalBERT + Kanoon) ────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h4 className="text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
              <BookOpen size={13} style={{ color: "var(--brass)" }} /> Retrieved Precedents ({cases.length})
            </h4>
            {precedentsData?.summary?.binding_count ? (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: "rgba(231, 185, 95, 0.15)", color: "var(--seal-pending)", border: "1px solid rgba(231, 185, 95, 0.3)" }}
              >
                {precedentsData.summary.binding_count} Binding SC
              </span>
            ) : null}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "all", label: "All Precedents" },
              { id: "binding", label: "Binding (SC)" },
              { id: "petitioner", label: "Favors Petitioner" },
              { id: "respondent", label: "Favors Respondent" },
            ].map((f) => {
              const isActive = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as PrecedentFilter)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
                  style={{
                    background: isActive ? "var(--surface-raised)" : "transparent",
                    color: isActive ? "var(--ink)" : "var(--ink-faint)",
                    border: isActive ? "1px solid var(--brass)" : "1px solid var(--hairline)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading skeleton for precedents */}
        {loadingPrecedents && (
          <div className="space-y-3 animate-pulse">
            <div className="h-24 rounded-lg" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }} />
            <div className="h-24 rounded-lg" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }} />
          </div>
        )}

        {/* Empty state */}
        {!loadingPrecedents && filteredCases.length === 0 && (
          <div className="p-8 text-center rounded-lg border text-xs" style={{ borderColor: "var(--hairline)", background: "var(--surface)", color: "var(--ink-faint)" }}>
            No precedent cases matched this filter criteria.
          </div>
        )}

        {/* Precedents Card List */}
        {!loadingPrecedents && (
          <div className="space-y-3">
            {filteredCases.map((cand, idx) => {
              const tier = cand.court_tier || "hc";
              const tierStyle = courtTierColor[tier] || courtTierColor.hc;
              const isExpanded = !!expandedCases[idx];
              const alignment = cand.strategic_alignment || getPrecedentDirection(cand.case_title);

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.25 }}
                  className="group relative cursor-pointer rounded-lg border transition-all"
                  style={{
                    background: "var(--surface)",
                    borderColor: isExpanded ? "var(--brass)" : "var(--hairline)",
                    padding: "16px 18px",
                  }}
                  onClick={() => toggleExpand(idx)}
                >
                  {/* Top Row: ScoreRing + Info */}
                  <div className="flex items-start gap-3.5">
                    <ScoreRing score={cand.similarity_score} size={50} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        {/* Court Tier Badge */}
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase"
                          style={{ background: tierStyle.bg, color: tierStyle.text, border: `1px solid ${tierStyle.border}` }}
                        >
                          {cand.court_tier === "sc" && <Scale size={9} className="mr-1" />}
                          {courtTierLabel[cand.court_tier] || cand.court_tier}
                        </span>

                        {/* Binding Badge */}
                        {(cand.court_tier === "sc" || cand.precedent_type === "Binding Precedent") && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold"
                            style={{ background: "rgba(231, 185, 95, 0.15)", color: "var(--seal-pending)", border: "1px solid rgba(231, 185, 95, 0.3)" }}
                          >
                            <BookMarked size={9} className="mr-1" />
                            Binding
                          </span>
                        )}

                        <StrategicPill alignment={alignment} />

                        {cand.decision_year && (
                          <span className="text-[11px] font-mono ml-auto" style={{ color: "var(--ink-faint)" }}>
                            {cand.decision_year}
                          </span>
                        )}
                      </div>

                      <h4
                        className="text-sm font-semibold leading-snug line-clamp-2 transition-colors"
                        style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}
                      >
                        {cand.case_title}
                      </h4>

                      <p className="text-[11px] mt-1" style={{ color: "var(--ink-dim)", fontFamily: "var(--font-mono)" }}>
                        {cand.court_name}
                      </p>
                    </div>
                  </div>

                  {/* Core Ratio Preview */}
                  {cand.key_ratio && (
                    <div className="mt-3 pt-3 border-t text-xs leading-relaxed" style={{ borderColor: "var(--hairline-soft)", color: "var(--ink-dim)" }}>
                      <span className="font-semibold" style={{ color: "var(--ink)" }}>Core Ratio: </span>
                      {cand.key_ratio}
                    </div>
                  )}

                  {/* Expandable Details Drawer */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 pt-3 border-t space-y-3"
                        style={{ borderColor: "var(--hairline-soft)" }}
                      >
                        {cand.legal_nexus && (
                          <div className="text-xs space-y-1">
                            <span className="font-semibold uppercase tracking-wider text-[10.5px]" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
                              Procedural & Legal Nexus
                            </span>
                            <p className="leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                              {cand.legal_nexus}
                            </p>
                          </div>
                        )}

                        {cand.shared_statutes && cand.shared_statutes.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="font-semibold uppercase tracking-wider text-[10.5px]" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
                              Shared Statutory Provisions
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {cand.shared_statutes.map((st, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2 py-0.5 rounded text-[11px] font-mono font-medium"
                                  style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)", color: "var(--ink)" }}
                                >
                                  {st}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {onReadDocument && cand.tid && (
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onReadDocument({
                                  tid: cand.tid,
                                  title: cand.case_title,
                                  court: cand.court_name,
                                  node_type: "precedent",
                                });
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
                              style={{ color: "var(--brass-bright)" }}
                            >
                              <span>Read Full Judgment</span>
                              <ArrowUpRight size={13} />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
