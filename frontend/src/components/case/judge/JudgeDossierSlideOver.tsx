import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Gavel,
  Scale,
  Award,
  BookOpen,
  ExternalLink,
  Shield,
  Briefcase,
  TrendingUp,
  RotateCw,
  Building,
  Info,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { judgeAnalyticsService } from "@/services/judgeAnalytics";
import type { JudgeAnalyticsDossier, LandmarkJudgment } from "@/types/judge";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";

interface JudgeDossierSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  judgeName: string | null;
  courtName?: string | null;
}

type ActiveTab = "overview" | "statutes" | "cadence" | "landmarks";

export function JudgeDossierSlideOver({
  isOpen,
  onClose,
  judgeName,
  courtName,
}: JudgeDossierSlideOverProps) {
  const [dossier, setDossier] = useState<JudgeAnalyticsDossier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  useEffect(() => {
    if (!isOpen || !judgeName) {
      setDossier(null);
      return;
    }

    let isMounted = true;
    const fetchDossier = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await judgeAnalyticsService.getJudgeAnalytics(
          judgeName,
          courtName || undefined
        );
        if (isMounted) {
          setDossier(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err?.response?.data?.message ||
              "Failed to load judicial analytics dossier. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDossier();

    return () => {
      isMounted = false;
    };
  }, [isOpen, judgeName, courtName]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !judgeName) return null;



  const content = (
    <div className="fixed inset-0 z-[1100] flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <aside
        className="relative z-10 w-full max-w-2xl lg:max-w-3xl h-full flex flex-col shadow-2xl border-l animate-slide-left overflow-hidden select-text"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        {/* Top Header Bar */}
        <div
          className="p-5 border-b flex-shrink-0 flex items-center justify-between gap-4 select-none"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold border shadow-sm"
              style={{
                background: "var(--brass-soft)",
                color: "var(--brass)",
                borderColor: "var(--brass)",
              }}
            >
              <Gavel size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10.5px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border"
                  style={{
                    background: "var(--surface-container)",
                    color: "var(--ink-faint)",
                    borderColor: "var(--hairline-soft)",
                  }}
                >
                  Judicial Intelligence Dossier
                </span>
                {dossier?.is_cached && (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    • Cached
                  </span>
                )}
              </div>
              <h2
                className="text-lg font-bold font-display truncate mt-0.5"
                style={{ color: "var(--ink)" }}
              >
                {dossier
                  ? `${dossier.salutation} ${dossier.clean_name}`
                  : judgeName}
              </h2>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg border transition-colors cursor-pointer hover:bg-[var(--surface-container)] flex-shrink-0"
            style={{ borderColor: "var(--border)", color: "var(--ink)" }}
            aria-label="Close Judge Dossier"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          className="flex items-center border-b flex-shrink-0 text-xs font-medium select-none"
          style={{
            background: "var(--surface-dim, var(--surface))",
            borderColor: "var(--border)",
          }}
        >
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === "overview"
                ? "border-[var(--brass)] font-semibold text-[var(--brass)]"
                : "border-transparent text-[var(--ink-dim)] hover:text-[var(--ink)]"
            }`}
          >
            <Scale size={13} />
            <span>Overview & Focus</span>
          </button>

          <button
            onClick={() => setActiveTab("statutes")}
            className={`flex-1 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === "statutes"
                ? "border-[var(--brass)] font-semibold text-[var(--brass)]"
                : "border-transparent text-[var(--ink-dim)] hover:text-[var(--ink)]"
            }`}
          >
            <BookOpen size={13} />
            <span>Subject Areas & Statutes</span>
          </button>

          <button
            onClick={() => setActiveTab("cadence")}
            className={`flex-1 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === "cadence"
                ? "border-[var(--brass)] font-semibold text-[var(--brass)]"
                : "border-transparent text-[var(--ink-dim)] hover:text-[var(--ink)]"
            }`}
          >
            <TrendingUp size={13} />
            <span>Disposal Cadence</span>
          </button>

          <button
            onClick={() => setActiveTab("landmarks")}
            className={`flex-1 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === "landmarks"
                ? "border-[var(--brass)] font-semibold text-[var(--brass)]"
                : "border-transparent text-[var(--ink-dim)] hover:text-[var(--ink)]"
            }`}
          >
            <Award size={13} />
            <span>Landmark Rulings ({dossier?.landmark_judgments?.length || 0})</span>
          </button>
        </div>

        {/* Panel Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="space-y-4 py-6">
              <SkeletonLoader count={1} height="120px" />
              <div className="grid grid-cols-2 gap-4">
                <SkeletonLoader count={1} height="90px" />
                <SkeletonLoader count={1} height="90px" />
              </div>
              <SkeletonLoader count={3} height="80px" />
            </div>
          )}

          {error && !loading && (
            <div
              className="p-6 rounded-xl border text-center space-y-3"
              style={{
                borderColor: "var(--danger)",
                background: "rgba(192, 57, 43, 0.05)",
              }}
            >
              <Info size={28} className="mx-auto text-[var(--danger)]" />
              <h3 className="text-sm font-bold" style={{ color: "var(--danger)" }}>
                Failed to Load Dossier
              </h3>
              <p className="text-xs" style={{ color: "var(--ink-dim)" }}>
                {error}
              </p>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  judgeAnalyticsService
                    .getJudgeAnalytics(judgeName, courtName || undefined)
                    .then(setDossier)
                    .catch((err) => setError(err.message))
                    .finally(() => setLoading(false));
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 mx-auto border cursor-pointer hover:bg-[var(--surface-container)]"
                style={{ borderColor: "var(--border)", color: "var(--ink)" }}
              >
                <RotateCw size={13} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {dossier && !loading && (
            <>
              {/* Profile Card Banner */}
              <div
                className="p-5 rounded-2xl border space-y-3 relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, var(--surface) 0%, var(--surface-container) 100%)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5"
                    style={{
                      background: dossier.is_sitting
                        ? "rgba(46, 125, 50, 0.12)"
                        : "var(--surface-container)",
                      color: dossier.is_sitting ? "#2E7D32" : "var(--ink-dim)",
                      borderColor: dossier.is_sitting
                        ? "rgba(46, 125, 50, 0.3)"
                        : "var(--border)",
                    }}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        dossier.is_sitting ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      }`}
                    />
                    {dossier.is_sitting ? "Active Sitting Judge" : "Former Jurist"}
                  </span>

                  <span
                    className="text-xs font-mono text-[11px]"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    {dossier.experience_years}+ Years Judicial Experience
                  </span>
                </div>

                <div>
                  <h3
                    className="text-xl font-bold font-display tracking-tight"
                    style={{ color: "var(--ink)" }}
                  >
                    {dossier.salutation} {dossier.clean_name}
                  </h3>
                  <p
                    className="text-xs font-medium mt-0.5 flex items-center gap-1.5"
                    style={{ color: "var(--brass)" }}
                  >
                    <Building size={13} />
                    <span>{dossier.court}</span>
                  </p>
                </div>

                <div
                  className="text-xs pt-2 border-t flex flex-wrap gap-y-1 gap-x-4 font-mono"
                  style={{
                    borderColor: "var(--hairline-soft)",
                    color: "var(--ink-dim)",
                  }}
                >
                  <span>
                    <strong>Tenure:</strong> {dossier.tenure}
                  </span>
                </div>
              </div>

              {/* 4 Core Executive Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  className="p-3.5 rounded-xl border space-y-1"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <span
                    className="text-[10.5px] font-mono font-medium uppercase tracking-wider block"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    Authored Judgments
                  </span>
                  <div
                    className="text-xl font-bold font-mono"
                    style={{ color: "var(--brass)" }}
                  >
                    {dossier.total_judgments.toLocaleString()}+
                  </div>
                  <span
                    className="text-[10px] block"
                    style={{ color: "var(--ink-dim)" }}
                  >
                    Recorded on Kanoon
                  </span>
                </div>

                <div
                  className="p-3.5 rounded-xl border space-y-1"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <span
                    className="text-[10.5px] font-mono font-medium uppercase tracking-wider block"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    Landmark Rulings
                  </span>
                  <div
                    className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400"
                  >
                    {dossier.landmark_judgments.length}
                  </div>
                  <span
                    className="text-[10px] block"
                    style={{ color: "var(--ink-dim)" }}
                  >
                    Major Precedents
                  </span>
                </div>

                <div
                  className="p-3.5 rounded-xl border space-y-1"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <span
                    className="text-[10.5px] font-mono font-medium uppercase tracking-wider block"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    Disposal Cadence
                  </span>
                  <div
                    className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1"
                  >
                    {dossier.disposal_rate.split(" ")[0]}
                  </div>
                  <span
                    className="text-[10px] block truncate"
                    style={{ color: "var(--ink-dim)" }}
                  >
                    Consistent disposal
                  </span>
                </div>

                <div
                  className="p-3.5 rounded-xl border space-y-1"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <span
                    className="text-[10.5px] font-mono font-medium uppercase tracking-wider block"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    Frequent Co-Benches
                  </span>
                  <div
                    className="text-xl font-bold font-mono"
                    style={{ color: "var(--ink)" }}
                  >
                    {dossier.bench_partners.length}
                  </div>
                  <span
                    className="text-[10px] block"
                    style={{ color: "var(--ink-dim)" }}
                  >
                    Key colleagues
                  </span>
                </div>
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Primary Focus Banner */}
                  <div
                    className="p-4 rounded-xl border space-y-2"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Shield size={16} style={{ color: "var(--brass)" }} />
                      <h4
                        className="text-xs font-bold font-mono uppercase tracking-wider"
                        style={{ color: "var(--ink)" }}
                      >
                        Primary Jurisprudential Focus
                      </h4>
                    </div>
                    <p
                      className="text-sm font-medium leading-relaxed"
                      style={{ color: "var(--ink)" }}
                    >
                      {dossier.primary_focus}
                    </p>
                  </div>

                  {/* Top 3 Subject Areas Snapshot */}
                  <div className="space-y-3">
                    <h4
                      className="text-xs font-bold font-mono uppercase tracking-wider"
                      style={{ color: "var(--ink-faint)" }}
                    >
                      Core Subject Areas Breakdown
                    </h4>
                    <div className="space-y-2.5">
                      {dossier.subject_areas.slice(0, 4).map((area, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border space-y-1.5"
                          style={{
                            background: "var(--surface)",
                            borderColor: "var(--hairline-soft)",
                          }}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold" style={{ color: "var(--ink)" }}>
                              {area.area}
                            </span>
                            <span
                              className="font-mono font-bold"
                              style={{ color: "var(--brass)" }}
                            >
                              {area.percentage}% ({area.count} cases)
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div
                            className="h-2 w-full rounded-full overflow-hidden"
                            style={{ background: "var(--surface-container)" }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${area.percentage}%`,
                                background:
                                  idx === 0
                                    ? "var(--brass)"
                                    : idx === 1
                                    ? "#B8860B"
                                    : idx === 2
                                    ? "#1B6B4A"
                                    : "#4A5568",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>


                </div>
              )}

              {/* TAB 2: SUBJECT AREAS & STATUTES */}
              {activeTab === "statutes" && (
                <div className="space-y-6">
                  {/* Detailed Subject Areas */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4
                        className="text-xs font-bold font-mono uppercase tracking-wider"
                        style={{ color: "var(--ink)" }}
                      >
                        Legal Subject Matter Distribution
                      </h4>
                      <span className="text-[11px] font-mono text-[var(--ink-faint)]">
                        Across {dossier.total_judgments} rulings
                      </span>
                    </div>

                    <div className="space-y-3">
                      {dossier.subject_areas.map((subj, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border space-y-2"
                          style={{
                            background: "var(--surface)",
                            borderColor: "var(--border)",
                          }}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Briefcase
                                size={14}
                                style={{ color: "var(--brass)" }}
                              />
                              <span
                                className="font-bold font-sans"
                                style={{ color: "var(--ink)" }}
                              >
                                {subj.area}
                              </span>
                            </div>
                            <span
                              className="font-mono font-bold text-xs"
                              style={{ color: "var(--brass)" }}
                            >
                              {subj.percentage}% • {subj.count} judgments
                            </span>
                          </div>
                          <div
                            className="h-2.5 w-full rounded-full overflow-hidden"
                            style={{ background: "var(--surface-container)" }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${subj.percentage}%`,
                                background:
                                  idx === 0
                                    ? "var(--brass)"
                                    : idx === 1
                                    ? "#B8860B"
                                    : idx === 2
                                    ? "#1B6B4A"
                                    : idx === 3
                                    ? "#9E3344"
                                    : "#4A5568",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>


                </div>
              )}

              {/* TAB 3: DISPOSAL CADENCE */}
              {activeTab === "cadence" && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h4
                      className="text-xs font-bold font-mono uppercase tracking-wider"
                      style={{ color: "var(--ink)" }}
                    >
                      Annual Judgment Disposal Cadence
                    </h4>
                    <p className="text-xs" style={{ color: "var(--ink-dim)" }}>
                      Historical volume of authored judgments and orders
                      delivered per calendar year.
                    </p>
                  </div>

                  {/* Recharts Area Chart */}
                  <div
                    className="p-4 rounded-xl border h-72 w-full"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={dossier.disposal_cadence}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="judgeCadenceGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3E7CA6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#3E7CA6" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--hairline-soft)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="year"
                          tick={{
                            fill: "var(--ink-dim)",
                            fontSize: 11,
                            fontFamily: "var(--font-mono)",
                          }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{
                            fill: "var(--ink-dim)",
                            fontSize: 11,
                            fontFamily: "var(--font-mono)",
                          }}
                          tickLine={false}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div
                                  className="p-2.5 rounded-lg border shadow-lg text-xs space-y-1"
                                  style={{
                                    background: "var(--card)",
                                    borderColor: "var(--border)",
                                  }}
                                >
                                  <div className="font-mono font-bold" style={{ color: "var(--ink)" }}>
                                    Year: {label}
                                  </div>
                                  <div
                                    className="font-mono font-semibold"
                                    style={{ color: "var(--brass)" }}
                                  >
                                    Judgments Delivered: {payload[0].value}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#3E7CA6"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#judgeCadenceGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Cadence Metrics Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div
                      className="p-3 rounded-lg border space-y-1"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--hairline-soft)",
                      }}
                    >
                      <span className="text-[10px] font-mono text-[var(--ink-faint)] uppercase">
                        Peak Productivity
                      </span>
                      <div className="text-base font-mono font-bold" style={{ color: "var(--ink)" }}>
                        {
                          dossier.disposal_cadence.reduce(
                            (max, c) => (c.count > max.count ? c : max),
                            dossier.disposal_cadence[0] || { year: 2023, count: 0 }
                          ).year
                        }{" "}
                        (
                        {
                          dossier.disposal_cadence.reduce(
                            (max, c) => (c.count > max.count ? c : max),
                            dossier.disposal_cadence[0] || { year: 2023, count: 0 }
                          ).count
                        }{" "}
                        orders)
                      </div>
                    </div>

                    <div
                      className="p-3 rounded-lg border space-y-1"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--hairline-soft)",
                      }}
                    >
                      <span className="text-[10px] font-mono text-[var(--ink-faint)] uppercase">
                        Average Cadence
                      </span>
                      <div className="text-base font-mono font-bold text-[var(--brass)]">
                        ~
                        {Math.round(
                          dossier.disposal_cadence.reduce((sum, c) => sum + c.count, 0) /
                            (dossier.disposal_cadence.length || 1)
                        )}{" "}
                        judgments/yr
                      </div>
                    </div>

                    <div
                      className="p-3 rounded-lg border space-y-1 col-span-2 sm:col-span-1"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--hairline-soft)",
                      }}
                    >
                      <span className="text-[10px] font-mono text-[var(--ink-faint)] uppercase">
                        Active Years Covered
                      </span>
                      <div className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {dossier.disposal_cadence.length} Years
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LANDMARK JUDGMENTS */}
              {activeTab === "landmarks" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4
                      className="text-xs font-bold font-mono uppercase tracking-wider"
                      style={{ color: "var(--ink)" }}
                    >
                      Landmark Authored Precedents
                    </h4>
                    <span className="text-[11px] font-mono text-[var(--ink-faint)]">
                      {dossier.landmark_judgments.length} Authorities
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {dossier.landmark_judgments.map((lm: LandmarkJudgment, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border space-y-2.5 transition-all hover:border-[var(--brass)]"
                        style={{
                          background: "var(--surface)",
                          borderColor: "var(--border)",
                        }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span
                              className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border"
                              style={{
                                background: "var(--brass-soft)",
                                color: "var(--brass)",
                                borderColor: "var(--brass)",
                              }}
                            >
                              {lm.subject}
                            </span>
                            <h5
                              className="text-sm font-bold font-display pt-1"
                              style={{ color: "var(--ink)" }}
                            >
                              {lm.title}
                            </h5>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span
                              className="text-xs font-mono font-bold block"
                              style={{ color: "var(--ink)" }}
                            >
                              {lm.citation}
                            </span>
                            <span
                              className="text-[10.5px] font-mono block text-amber-600 dark:text-amber-400"
                            >
                              {lm.bench_strength}
                            </span>
                          </div>
                        </div>

                        {/* Ratio Decidendi Quote Block */}
                        <div
                          className="p-3 rounded-lg border-l-2 text-xs leading-relaxed italic"
                          style={{
                            background: "var(--surface-container)",
                            borderColor: "var(--brass)",
                            color: "var(--ink)",
                            fontFamily: "var(--font-display)",
                          }}
                        >
                          "{lm.ratio_summary}"
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                          <span style={{ color: "var(--ink-faint)" }}>
                            Court: {lm.court || dossier.court}
                          </span>
                          {lm.tid && (
                            <a
                              href={`https://indiankanoon.org/doc/${lm.tid}/`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 hover:underline font-semibold"
                              style={{ color: "var(--brass)" }}
                            >
                              <span>Read on Kanoon</span>
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </>
          )}
        </div>

        {/* Footer info banner */}
        <div
          className="p-3 px-6 border-t flex items-center justify-between text-[10.5px] font-mono flex-shrink-0"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--ink-faint)",
          }}
        >
          <span>SUITS Judicial Analytics • Indian Kanoon Verified</span>
        </div>
      </aside>
    </div>
  );

  return createPortal(content, document.body);
}
