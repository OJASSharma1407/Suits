import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Scale,
  BookOpen,
  Copy,
  Check,
  RefreshCw,
  FileText,
  Sparkles,
  Layers,
  HelpCircle,
  Gavel,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  History,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { CaseDetails, OrderAI } from "@/types/case";
import { caseService } from "@/services/cases";

interface OrderIntelligenceCardProps {
  caseData?: CaseDetails | null;
  selectedFilename?: string | null;
  aiData?: OrderAI | null;
  onReadDocument?: (filename?: string) => void;
}

type TabType = "headnote" | "overview" | "procedural" | "issues" | "ratio" | "compliance";

export function OrderIntelligenceCard({
  caseData,
  selectedFilename,
  aiData: initialAiData,
  onReadDocument,
}: OrderIntelligenceCardProps) {
  const [data, setData] = useState<OrderAI | null>(initialAiData || null);
  const [activeTab, setActiveTab] = useState<TabType>("headnote");
  const [readingSize, setReadingSize] = useState<"standard" | "large" | "xl">("large");
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedHeadnote, setCopiedHeadnote] = useState<boolean>(false);
  const [copiedBrief, setCopiedBrief] = useState<boolean>(false);
  const [showObiter, setShowObiter] = useState<boolean>(false);

  const cnr = caseData?.cnr || "";
  const targetFile =
    selectedFilename ||
    caseData?.orders?.find((o) => !o.is_stub && o.filename)?.filename ||
    caseData?.orders?.[0]?.filename ||
    "";

  // Sync when parent passes updated aiData (e.g. after user clicks "Load Summary" in nav bar)
  useEffect(() => {
    if (initialAiData) {
      setData(initialAiData);
    }
  }, [initialAiData]);

  const handleGenerate = async (force: boolean = false) => {
    if (!cnr || !targetFile) return;
    setLoading(true);
    try {
      const aiData = await caseService.getOrderAI(cnr, targetFile);
      setData(aiData);
      toast.success(force ? "Order intelligence refreshed." : "Order intelligence generated.");
    } catch {
      toast.error("Unable to generate intelligence for this order.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Data extraction (supports both camelCase and snake_case) ────────────────
  const rawAi = (data || {}) as any;
  const catchwords: string[] = rawAi.catchwords || [];
  const heldPoints: string[] = rawAi.held_points || rawAi.heldPoints || [];
  const operativeDisposition: string =
    rawAi.operative_disposition || rawAi.operativeDisposition || rawAi.outcome || rawAi.disposition_status || "Disposed";
  const ratioDecidendi: string = rawAi.ratio_decidendi || rawAi.ratioDecidendi || "";
  const executiveSummary: string = rawAi.executive_summary || rawAi.executiveSummary || "";
  const courtReasoning: string = rawAi.court_reasoning || rawAi.courtReasoning || "";
  const primaryIssues: string[] = rawAi.primary_issues || rawAi.primaryIssues || [];
  const courtDirections: string[] = rawAi.court_directions || rawAi.courtDirections || [];
  const statutesCited: string[] =
    (rawAi.statutes_cited || rawAi.statutesCited || []).length > 0
      ? rawAi.statutes_cited || rawAi.statutesCited
      : caseData?.acts_and_sections || [];
  const caseLaws: string[] = rawAi.case_laws_referenced || rawAi.caseLawsReferenced || [];
  const petArguments: string[] = rawAi.petitioner_arguments || rawAi.petitionerArguments || [];
  const respArguments: string[] = rawAi.respondent_arguments || rawAi.respondentArguments || [];
  const precedentCitator: any[] = rawAi.precedent_citator_table || rawAi.precedentCitatorTable || [];
  const obiterDicta: string[] = rawAi.obiter_dicta || rawAi.obiterDicta || [];
  const plainLanguage: string = rawAi.plain_language_summary || rawAi.plainLanguageSummary || "";
  const litigantAdvice: string = rawAi.litigant_friendly_explanation || rawAi.litigantFriendlyExplanation || "";
  const risks: string[] = rawAi.risks || [];
  const complianceDirections: string[] = rawAi.compliance_directions || rawAi.complianceDirections || [];

  // Case metadata
  const caseTitle = caseData?.case_title || rawAi.case_number || rawAi.caseNumber || rawAi.filename || "Court Document Summary";
  const courtName = caseData?.court?.court_name || rawAi.court_name || rawAi.courtName || "Legal Record";
  const caseNo = caseData?.case_number || caseData?.filing_number || rawAi.case_number || rawAi.caseNumber || "N/A";
  const orderDate = rawAi.order_date || rawAi.orderDate || caseData?.decision_date || caseData?.next_hearing_date || "Current Record";
  const statusLabel = rawAi.disposition_status || rawAi.dispositionStatus || caseData?.case_status_label || caseData?.case_status || "Pending Adjudication";
  const judges =
    (rawAi.judge_names || rawAi.judgeNames || []).length > 0
      ? rawAi.judge_names || rawAi.judgeNames
      : caseData?.judges || [];

  const petCounsel =
    (rawAi.counsel_petitioner || rawAi.counselPetitioner || []).length > 0
      ? rawAi.counsel_petitioner || rawAi.counselPetitioner
      : caseData?.parties?.petitioner_advocates || [];
  const respCounsel =
    (rawAi.counsel_respondent || rawAi.counselRespondent || []).length > 0
      ? rawAi.counsel_respondent || rawAi.counselRespondent
      : caseData?.parties?.respondent_advocates || [];

  const rawPets = rawAi.petitioners || [];
  const rawResps = rawAi.respondents || [];
  const pets =
    caseData?.parties?.petitioners && caseData.parties.petitioners.length > 0
      ? caseData.parties.petitioners
      : rawPets.map((p: any) => (typeof p === "string" ? p : p?.name || JSON.stringify(p)));
  const resps =
    caseData?.parties?.respondents && caseData.parties.respondents.length > 0
      ? caseData.parties.respondents
      : rawResps.map((r: any) => (typeof r === "string" ? r : r?.name || JSON.stringify(r)));

  // ─── Copy helpers ────────────────────────────────────────────────────────────
  const getTreatmentBadgeStyle = (treatment: string): React.CSSProperties => {
    switch (treatment.toUpperCase()) {
      case "OVERRULED":
        return { background: "rgba(220, 38, 38, 0.12)", color: "#f87171", border: "1px solid rgba(220, 38, 38, 0.3)" };
      case "FOLLOWED":
      case "RELIED ON":
        return { background: "rgba(34, 197, 94, 0.12)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.3)" };
      case "DISTINGUISHED":
        return { background: "rgba(245, 158, 11, 0.12)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.3)" };
      default:
        return { background: "rgba(96, 165, 250, 0.12)", color: "#93c5fd", border: "1px solid rgba(96, 165, 250, 0.3)" };
    }
  };

  const copyHeadnote = () => {
    if (!data) return;
    const lines = [
      `=== SUITS LAW REPORT: EDITORIAL HEADNOTE ===`,
      `CNR: ${cnr}`,
      `Order: ${targetFile}`,
      `Operative Disposition: ${operativeDisposition}`,
      ``,
      catchwords.length > 0 ? `CATCHWORDS:\n${catchwords.join(" — ")}` : "",
      heldPoints.length > 0 ? `\nHELD:\n${heldPoints.map((pt, i) => `${i + 1}. ${pt}`).join("\n")}` : "",
      ratioDecidendi ? `\nRATIO DECIDENDI:\n"${ratioDecidendi}"` : "",
      precedentCitator.length > 0
        ? `\nPRECEDENTS TREATED:\n${precedentCitator.map((p: any) => `• [${p.treatment}] ${p.precedent_name} — ${p.bench_commentary}`).join("\n")}`
        : "",
      `\n[Source: SUITS AI Court Intelligence · Publisher-Grade Standard]`,
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(lines);
    setCopiedHeadnote(true);
    toast.success("Editorial headnote copied!");
    setTimeout(() => setCopiedHeadnote(false), 2200);
  };

  const copyFullBrief = () => {
    if (!data) return;
    const text = [
      `# ${caseTitle}`,
      `**Court & Case No.:** ${courtName} | ${caseNo} (CNR: ${cnr})`,
      `**Order Date:** ${orderDate} | **Status:** ${statusLabel}`,
      judges.length > 0 && `**Bench:** ${judges.join(", ")}`,
      ``,
      `## EXECUTIVE SUMMARY`,
      executiveSummary || "—",
      ``,
      primaryIssues.length > 0 && `## LEGAL ISSUES\n${primaryIssues.map((iss, i) => `${i + 1}. ${iss}`).join("\n")}`,
      ratioDecidendi && `\n## RATIO DECIDENDI\n"${ratioDecidendi}"`,
      courtReasoning && `\n## COURT REASONING\n${courtReasoning}`,
      courtDirections.length > 0 && `\n## COURT DIRECTIONS\n${courtDirections.map((d, i) => `${i + 1}. ${d}`).join("\n")}`,
      statutesCited.length > 0 && `\n**Statutes:** ${statutesCited.join(", ")}`,
      caseLaws.length > 0 && `**Precedents:** ${caseLaws.join(", ")}`,
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopiedBrief(true);
    toast.success("Full brief copied to clipboard!");
    setTimeout(() => setCopiedBrief(false), 2200);
  };

  // ─── Empty / On-Demand State ────────────────────────────────────────────────
  if (!data && !loading) {
    return (
      <div
        id="order-intelligence-section"
        className="card-float p-6 sm:p-8 space-y-4 relative overflow-hidden"
        style={{ borderRadius: "var(--radius-md)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--brass-soft)", color: "var(--brass-bright)", border: "1px solid var(--hairline)" }}
            >
              <Scale size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                Order Intelligence & Editorial Headnote
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--ink-faint)" }}>
                Executive summary, legal issues, ratio decidendi, and publisher-grade headnote — one unified pass.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleGenerate(false)}
            disabled={!targetFile}
            className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all disabled:opacity-40"
            style={{
              background: "var(--brass-soft)",
              color: "var(--brass-bright)",
              border: "1px solid var(--hairline)",
              padding: "8px 18px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <Sparkles size={14} />
            <span>Generate Case Intelligence</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── Loading Skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        id="order-intelligence-section"
        className="card-float p-6 sm:p-8 space-y-4 animate-pulse"
        style={{ borderRadius: "var(--radius-md)" }}
      >
        <div className="flex items-center justify-between">
          <div className="h-5 w-64 rounded-lg" style={{ background: "var(--surface-raised)" }} />
          <div className="h-8 w-24 rounded-lg" style={{ background: "var(--surface-raised)" }} />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 rounded" style={{ background: "var(--surface-raised)", width: i === 2 ? "80%" : "100%" }} />
          ))}
          <div className="h-24 w-full rounded-xl mt-2" style={{ background: "var(--surface-raised)" }} />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "headnote", label: "Editorial Headnote", icon: <BookOpen size={15} /> },
    { id: "overview", label: "Executive Brief", icon: <FileText size={15} /> },
    { id: "procedural", label: "Procedural History", icon: <History size={15} /> },
    { id: "issues", label: "Legal Issues", icon: <HelpCircle size={15} /> },
    { id: "ratio", label: "Ratio & Reasoning", icon: <Scale size={15} /> },
    { id: "compliance", label: "Plain Language & Risks", icon: <ShieldAlert size={15} /> },
  ];

  // Dynamic typography scale based on user-selected reading size preference
  const bodyTextSize =
    readingSize === "xl"
      ? "text-lg sm:text-xl leading-relaxed"
      : readingSize === "large"
      ? "text-base sm:text-lg leading-relaxed"
      : "text-sm sm:text-base leading-relaxed";

  const quoteTextSize =
    readingSize === "xl"
      ? "text-xl sm:text-2xl font-serif italic leading-relaxed"
      : readingSize === "large"
      ? "text-lg sm:text-xl font-serif italic leading-relaxed"
      : "text-base sm:text-lg font-serif italic leading-relaxed";

  const subheadTextSize =
    readingSize === "xl"
      ? "text-xs sm:text-sm font-bold uppercase tracking-wider"
      : "text-xs font-bold uppercase tracking-wider";

  const tableCellSize =
    readingSize === "xl"
      ? "text-base sm:text-lg"
      : readingSize === "large"
      ? "text-sm sm:text-base"
      : "text-xs sm:text-sm";

  return (
    <div
      id="order-intelligence-section"
      className="card-float p-6 sm:p-8 space-y-6 relative overflow-hidden"
      style={{ borderRadius: "var(--radius-md)" }}
    >
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b"
        style={{ borderColor: "var(--hairline-soft)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--brass-soft)", color: "var(--brass-bright)", border: "1px solid var(--hairline)" }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-xl font-semibold tracking-tight" style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}>
              Case Intelligence & Analysis
            </h3>
            <p className="text-sm mt-0.5" style={{ color: "var(--ink-faint)" }}>
              Editorial headnote, procedural history, legal issues, ratio decidendi, and plain language synthesis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Reading Text Size Controls */}
          <div
            className="flex items-center rounded-lg border p-1 gap-1"
            style={{ borderColor: "var(--hairline)", background: "var(--surface)" }}
            title="Adjust reading text size"
          >
            <span className="text-[11px] uppercase font-bold px-1.5 font-mono" style={{ color: "var(--ink-faint)" }}>
              Text Size
            </span>
            <button
              onClick={() => setReadingSize("standard")}
              className="px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all"
              style={{
                background: readingSize === "standard" ? "var(--brass-soft)" : "transparent",
                color: readingSize === "standard" ? "var(--brass-bright)" : "var(--ink-dim)",
              }}
              title="Standard text size"
            >
              A
            </button>
            <button
              onClick={() => setReadingSize("large")}
              className="px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all"
              style={{
                background: readingSize === "large" ? "var(--brass-soft)" : "transparent",
                color: readingSize === "large" ? "var(--brass-bright)" : "var(--ink-dim)",
              }}
              title="Large text size (Recommended)"
            >
              A+
            </button>
            <button
              onClick={() => setReadingSize("xl")}
              className="px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all"
              style={{
                background: readingSize === "xl" ? "var(--brass-soft)" : "transparent",
                color: readingSize === "xl" ? "var(--brass-bright)" : "var(--ink-dim)",
              }}
              title="Extra Large text size"
            >
              A++
            </button>
          </div>

          {onReadDocument && (
            <button
              onClick={() => onReadDocument(targetFile)}
              className="btn btn-ghost flex items-center gap-1.5 text-xs sm:text-sm font-medium cursor-pointer transition-all"
              style={{ border: "1px solid var(--hairline)", padding: "7px 14px", color: "var(--ink-dim)" }}
              title="Open in document reader"
            >
              <FileText size={14} style={{ color: "var(--brass)" }} />
              <span>Read Order</span>
            </button>
          )}

          <button
            onClick={copyHeadnote}
            className="btn btn-ghost flex items-center gap-1.5 text-xs sm:text-sm font-semibold cursor-pointer transition-all"
            style={{
              border: "1px solid var(--hairline)",
              padding: "7px 14px",
              background: copiedHeadnote ? "var(--brass-soft)" : "transparent",
              color: copiedHeadnote ? "var(--brass-bright)" : "var(--ink-dim)",
            }}
            title="Copy editorial headnote"
          >
            {copiedHeadnote ? <Check size={14} /> : <Copy size={14} style={{ color: "var(--ink-faint)" }} />}
            <span>{copiedHeadnote ? "Copied!" : "Copy Headnote"}</span>
          </button>

          <button
            onClick={copyFullBrief}
            className="btn btn-ghost flex items-center gap-1.5 text-xs sm:text-sm font-semibold cursor-pointer transition-all"
            style={{
              border: "1px solid var(--hairline)",
              padding: "7px 14px",
              background: copiedBrief ? "var(--brass-soft)" : "transparent",
              color: copiedBrief ? "var(--brass-bright)" : "var(--ink-dim)",
            }}
            title="Copy full brief"
          >
            {copiedBrief ? <Check size={14} /> : <Copy size={14} style={{ color: "var(--ink-faint)" }} />}
            <span>{copiedBrief ? "Brief Copied!" : "Copy Full Brief"}</span>
          </button>

          <button
            onClick={() => handleGenerate(true)}
            disabled={loading}
            className="p-2 rounded-lg transition-all disabled:opacity-40 cursor-pointer"
            style={{ color: "var(--ink-faint)", border: "1px solid var(--hairline)" }}
            title="Regenerate intelligence"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} style={{ color: loading ? "var(--brass)" : undefined }} />
          </button>
        </div>
      </div>

      {/* ── Metadata Banner ───────────────────────────────────────────────────── */}
      <div className="p-5 rounded-xl border space-y-4" style={{ background: "var(--surface)", borderColor: "var(--hairline)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-base sm:text-lg font-semibold tracking-tight" style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}>
            {caseTitle}
          </h4>
          {operativeDisposition && operativeDisposition.length <= 40 ? (
            <span
              className="text-xs font-semibold px-3 py-1 rounded uppercase tracking-wider"
              style={{
                background: "var(--surface-container)",
                color: "var(--ink-dim)",
                border: "1px solid var(--hairline)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {operativeDisposition}
            </span>
          ) : null}
        </div>

        {operativeDisposition && operativeDisposition.length > 40 && (
          <div
            className="p-4 rounded-lg border leading-relaxed space-y-1.5"
            style={{
              background: "var(--surface-raised)",
              borderColor: "var(--hairline)",
            }}
          >
            <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--brass-bright)", fontFamily: "var(--font-mono)" }}>
              <Scale size={13} />
              <span>Operative Holding & Order Disposition</span>
            </div>
            <p className={bodyTextSize} style={{ color: "var(--ink)" }}>
              {operativeDisposition}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t" style={{ borderColor: "var(--hairline-soft)" }}>
          <div>
            <span className="block font-bold uppercase tracking-wider text-xs" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
              Court & Case No.
            </span>
            <span className="font-semibold mt-1 block text-sm sm:text-base" style={{ color: "var(--ink)" }}>
              {courtName} • {caseNo}
            </span>
          </div>
          <div>
            <span className="block font-bold uppercase tracking-wider text-xs" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
              CNR Number
            </span>
            <span className="font-mono font-semibold mt-1 block text-sm sm:text-base" style={{ color: "var(--ink)" }}>
              {cnr || "Unavailable"}
            </span>
          </div>
          <div>
            <span className="block font-bold uppercase tracking-wider text-xs" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
              Order / Date
            </span>
            <span className="font-semibold mt-1 block text-sm sm:text-base" style={{ color: "var(--ink)" }}>
              {orderDate}
            </span>
          </div>
          <div>
            <span className="block font-bold uppercase tracking-wider text-xs" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
              Bench / Judges
            </span>
            <span className="font-semibold mt-1 block text-sm sm:text-base truncate" style={{ color: "var(--ink)" }}>
              {judges.length > 0 ? judges.join(", ") : "Hon'ble Court Bench"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tab Switcher (Segmented Pill) ────────────────────────────────────── */}
      <div className="p-1 rounded-lg border w-full" style={{ background: "var(--surface)", borderColor: "var(--hairline)" }}>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative px-3 py-2.5 rounded-md text-xs sm:text-sm font-medium transition-all cursor-pointer select-none flex items-center justify-center gap-1.5 outline-none text-center"
              >
                {isActive && (
                  <motion.div
                    layoutId="intelligence-active-pill"
                    className="absolute inset-0 rounded-md z-0"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}
                  />
                )}
                <span
                  className="relative z-10 flex items-center justify-center gap-1.5 truncate"
                  style={{ color: isActive ? "var(--ink)" : "var(--ink-faint)", fontWeight: isActive ? 600 : 400 }}
                >
                  <span className="flex-shrink-0">{tab.icon}</span>
                  <span className="truncate hidden sm:block">{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* ── TAB 1: EDITORIAL HEADNOTE ─────────────────────────────────────── */}
        {activeTab === "headnote" && (
          <motion.div
            key="headnote"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {/* Catchwords */}
            {catchwords.length > 0 && (
              <div className="space-y-2.5">
                <div className={`${subheadTextSize} flex items-center gap-1.5`} style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
                  <Layers size={14} style={{ color: "var(--brass)" }} />
                  <span>Subject & Catchwords</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {catchwords.map((cw, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium"
                      style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)", color: "var(--ink)" }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: "var(--brass)" }} />
                      {cw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Held Points */}
            <div className="space-y-3.5">
              <div
                className={`${subheadTextSize} flex items-center gap-2`}
                style={{ color: "var(--brass-bright)", fontFamily: "var(--font-mono)" }}
              >
                <BookOpen size={15} />
                <span>Held (Judicial Holdings of Law)</span>
              </div>
              <div className="space-y-3">
                {heldPoints.length > 0 ? (
                  heldPoints.map((pt, idx) => (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-xl border flex items-start gap-3.5"
                      style={{ background: "var(--surface)", borderColor: "var(--hairline)", color: "var(--ink)" }}
                    >
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 font-mono"
                        style={{ background: "var(--brass-soft)", color: "var(--brass-bright)", border: "1px solid var(--hairline)" }}
                      >
                        {idx + 1}
                      </span>
                      <p className={`flex-1 ${bodyTextSize}`}>{pt}</p>
                    </div>
                  ))
                ) : (
                  <div
                    className={`p-5 sm:p-6 rounded-xl border leading-relaxed ${bodyTextSize}`}
                    style={{ background: "var(--surface)", borderColor: "var(--hairline)", color: "var(--ink)" }}
                  >
                    {ratioDecidendi || "Judicial ratio not explicitly separated in order text."}
                  </div>
                )}
              </div>
            </div>

            {/* Ratio Decidendi */}
            {ratioDecidendi && (
              <div
                className="p-5 sm:p-6 rounded-lg border space-y-3"
                style={{ background: "var(--surface)", borderColor: "var(--hairline)" }}
              >
                <span
                  className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded inline-flex items-center gap-1.5"
                  style={{ background: "var(--brass-soft)", color: "var(--brass-bright)", border: "1px solid var(--hairline)", fontFamily: "var(--font-mono)" }}
                >
                  <Scale size={13} /> Binding Legal Principle (Ratio Decidendi)
                </span>
                <blockquote
                  className={`${quoteTextSize} p-4 sm:p-5 rounded border-l-4 font-serif`}
                  style={{ borderColor: "var(--brass)", background: "var(--surface-raised)", color: "var(--ink)" }}
                >
                  "{ratioDecidendi}"
                </blockquote>
              </div>
            )}

            {/* Precedent Citator Table */}
            {precedentCitator.length > 0 && (
              <div className="space-y-3">
                <div className={`${subheadTextSize} flex items-center gap-1.5`} style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
                  <Layers size={14} style={{ color: "var(--brass)" }} />
                  <span>Precedent Citator & Judicial Treatment</span>
                </div>
                <div className="w-full overflow-x-auto card-float" style={{ borderRadius: "var(--radius-md)" }}>
                  <table className="w-full text-left whitespace-normal">
                    <thead
                      className="border-b text-xs font-bold uppercase tracking-wider"
                      style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)", color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}
                    >
                      <tr>
                        <th className="p-4 w-2/5">Precedent Cited</th>
                        <th className="p-4 w-1/5">Treatment</th>
                        <th className="p-4">Bench Commentary</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${tableCellSize}`} style={{ borderColor: "var(--hairline-soft)" }}>
                      {precedentCitator.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-4 font-semibold" style={{ color: "var(--ink)", background: "var(--surface)" }}>{item.precedent_name}</td>
                          <td className="p-4" style={{ background: "var(--surface)" }}>
                            <span
                              className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={getTreatmentBadgeStyle(item.treatment || "REFERRED")}
                            >
                              {item.treatment}
                            </span>
                          </td>
                          <td className="p-4 leading-relaxed" style={{ color: "var(--ink-dim)" }}>{item.bench_commentary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Obiter Dicta Accordion */}
            {obiterDicta.length > 0 && (
              <div>
                <button
                  onClick={() => setShowObiter(!showObiter)}
                  className="flex items-center justify-between w-full p-4 rounded-xl border text-sm font-medium transition-all cursor-pointer"
                  style={{ background: "var(--surface)", borderColor: "var(--hairline)", color: "var(--ink-dim)" }}
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle size={15} style={{ color: "var(--brass)" }} />
                    <span className="font-semibold">Obiter Dicta & Passing Observations ({obiterDicta.length})</span>
                  </span>
                  {showObiter ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showObiter && (
                  <div className="mt-2 space-y-2.5 p-4 rounded-xl border" style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)", color: "var(--ink)" }}>
                    {obiterDicta.map((ob, idx) => (
                      <p key={idx} className={`${bodyTextSize} pl-3 border-l-2`} style={{ borderColor: "var(--hairline)" }}>
                        {ob}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB 2: EXECUTIVE BRIEF ────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {executiveSummary && (
              <div className="card-float p-6 sm:p-7 space-y-3" style={{ background: "var(--surface)", borderRadius: "var(--radius-md)" }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--brass)" }} />
                  <h4 className={subheadTextSize} style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                    Executive Case Synopsis
                  </h4>
                </div>
                <p className={`${bodyTextSize} whitespace-pre-line`} style={{ color: "var(--ink)" }}>
                  {executiveSummary}
                </p>
              </div>
            )}

            {ratioDecidendi && (
              <div className="p-5 sm:p-6 rounded-lg border space-y-3" style={{ background: "var(--surface)", borderColor: "var(--hairline)" }}>
                <span
                  className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded inline-flex items-center gap-1.5"
                  style={{ background: "var(--brass-soft)", color: "var(--brass-bright)", border: "1px solid var(--hairline)", fontFamily: "var(--font-mono)" }}
                >
                  <Scale size={13} /> Binding Legal Principle (Ratio Decidendi)
                </span>
                <blockquote
                  className={`${quoteTextSize} p-4 sm:p-5 rounded border-l-4 font-serif`}
                  style={{ borderColor: "var(--brass)", background: "var(--surface-raised)", color: "var(--ink)" }}
                >
                  "{ratioDecidendi}"
                </blockquote>
              </div>
            )}

            {plainLanguage && (
              <div
                className="p-6 rounded-lg border space-y-3 relative overflow-hidden"
                style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}
              >
                <h4 className={`${subheadTextSize} flex items-center gap-2`} style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                  <Sparkles size={15} style={{ color: "var(--brass)" }} /> Non-Technical Takeaway (Plain Language)
                </h4>
                <p className={bodyTextSize} style={{ color: "var(--ink)" }}>
                  {plainLanguage}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB 3: PROCEDURAL HISTORY ─────────────────────────────────────── */}
        {activeTab === "procedural" && (
          <motion.div
            key="procedural"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            <h4 className={`${subheadTextSize} flex items-center gap-2`} style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
              <History size={15} style={{ color: "var(--brass)" }} /> Procedural & Case History Matrix
            </h4>

            <div className="w-full overflow-x-auto card-float" style={{ borderRadius: "var(--radius-md)" }}>
              <table className="w-full text-left whitespace-normal">
                <thead
                  className="border-b text-xs font-bold uppercase tracking-wider"
                  style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)", color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}
                >
                  <tr>
                    <th className="p-4 w-1/4">Event / Parameter</th>
                    <th className="p-4 w-3/4">Details & Records</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${tableCellSize}`} style={{ borderColor: "var(--hairline-soft)" }}>
                  <tr>
                    <td className="p-4 font-semibold" style={{ color: "var(--ink)", background: "var(--surface)" }}>Petition / Action Filed</td>
                    <td className="p-4 leading-relaxed" style={{ color: "var(--ink)" }}>
                      {pets.length > 0 ? pets.join(", ") : "Petitioners"} filed petition under{" "}
                      {statutesCited.length > 0 ? statutesCited[0] : "applicable law"} against the respondents.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold" style={{ color: "var(--ink)", background: "var(--surface)" }}>Respondents</td>
                    <td className="p-4 leading-relaxed" style={{ color: "var(--ink)" }}>{resps.length > 0 ? resps.join(", ") : "Respondent Authority"}</td>
                  </tr>
                  {petCounsel.length > 0 && (
                    <tr>
                      <td className="p-4 font-semibold" style={{ color: "var(--ink)", background: "var(--surface)" }}>Counsel for Petitioners</td>
                      <td className="p-4 font-medium" style={{ color: "var(--ink)" }}>{petCounsel.join(", ")}</td>
                    </tr>
                  )}
                  {respCounsel.length > 0 && (
                    <tr>
                      <td className="p-4 font-semibold" style={{ color: "var(--ink)", background: "var(--surface)" }}>Counsel for Respondents</td>
                      <td className="p-4 font-medium" style={{ color: "var(--ink)" }}>{respCounsel.join(", ")}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="p-4 font-semibold" style={{ color: "var(--ink)", background: "var(--surface)" }}>Hearing & Order</td>
                    <td className="p-4 leading-relaxed" style={{ color: "var(--ink)" }}>
                      {(data as any).order_nature || "Court Proceeding"} recorded on {orderDate}. {(data as any).outcome || "Case arguments heard by the Bench."}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold" style={{ color: "var(--ink)", background: "var(--surface)" }}>Disposition</td>
                    <td className="p-4 font-semibold leading-relaxed" style={{ color: "var(--brass)" }}>{operativeDisposition}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Statutory Landscape */}
            {statutesCited.length > 0 && (
              <div className="space-y-2.5">
                <h5 className={`${subheadTextSize} flex items-center gap-2`} style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                  <ShieldAlert size={14} style={{ color: "var(--brass)" }} /> Statutory Landscape
                </h5>
                <div className="flex flex-wrap gap-2.5">
                  {statutesCited.map((st, i) => (
                    <span
                      key={i}
                      className="text-xs sm:text-sm font-mono px-3.5 py-1.5 rounded-lg font-medium"
                      style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)", color: "var(--ink)" }}
                    >
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB 4: LEGAL ISSUES ───────────────────────────────────────────── */}
        {activeTab === "issues" && (
          <motion.div
            key="issues"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            <h4 className={`${subheadTextSize} flex items-center gap-2`} style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
              <HelpCircle size={15} style={{ color: "var(--brass)" }} /> Primary Legal Issues & Submissions
            </h4>

            {primaryIssues.length > 0 ? (
              <div className="grid grid-cols-1 gap-3.5">
                {primaryIssues.map((issue, i) => (
                  <div
                    key={i}
                    className="card-float p-5 sm:p-6 flex items-start gap-4"
                    style={{ background: "var(--surface)", borderRadius: "var(--radius-md)" }}
                  >
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 font-mono"
                      style={{ background: "var(--brass-soft)", color: "var(--brass-bright)", border: "1px solid var(--hairline)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className={`font-medium ${bodyTextSize}`} style={{ color: "var(--ink)" }}>{issue}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`card-float p-5 ${bodyTextSize}`} style={{ color: "var(--ink-faint)" }}>
                No explicit legal issues itemized in the current order.
              </p>
            )}

            {(petArguments.length > 0 || respArguments.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {petArguments.length > 0 && (
                  <div className="card-float p-5 sm:p-6 space-y-3" style={{ background: "var(--surface)", borderRadius: "var(--radius-md)" }}>
                    <h5 className={`${subheadTextSize} flex items-center gap-2`} style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                      <Users size={14} style={{ color: "var(--brass)" }} /> Petitioners' Submissions
                    </h5>
                    <ul className={`list-disc list-inside space-y-2.5 ${bodyTextSize}`} style={{ color: "var(--ink-dim)" }}>
                      {petArguments.map((arg, i) => <li key={i}>{arg}</li>)}
                    </ul>
                  </div>
                )}
                {respArguments.length > 0 && (
                  <div className="card-float p-5 sm:p-6 space-y-3" style={{ background: "var(--surface)", borderRadius: "var(--radius-md)" }}>
                    <h5 className={`${subheadTextSize} flex items-center gap-2`} style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                      <Users size={14} style={{ color: "var(--brass)" }} /> Respondents' Submissions
                    </h5>
                    <ul className={`list-disc list-inside space-y-2.5 ${bodyTextSize}`} style={{ color: "var(--ink-dim)" }}>
                      {respArguments.map((arg, i) => <li key={i}>{arg}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB 5: RATIO & REASONING ──────────────────────────────────────── */}
        {activeTab === "ratio" && (
          <motion.div
            key="ratio"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            <h4 className={`${subheadTextSize} flex items-center gap-2`} style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
              <Scale size={15} style={{ color: "var(--brass)" }} /> Bench Findings, Ratio Decidendi & Orders
            </h4>

            {ratioDecidendi && (
              <div className="p-5 sm:p-6 rounded-lg border space-y-3" style={{ background: "var(--surface)", borderColor: "var(--hairline)" }}>
                <span
                  className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded inline-flex items-center gap-1.5"
                  style={{ background: "var(--brass-soft)", color: "var(--brass-bright)", border: "1px solid var(--hairline)", fontFamily: "var(--font-mono)" }}
                >
                  <Scale size={13} /> Binding Legal Holding
                </span>
                <blockquote
                  className={`${quoteTextSize} p-4 sm:p-5 rounded border-l-4 font-serif`}
                  style={{ borderColor: "var(--brass)", background: "var(--surface-raised)", color: "var(--ink)" }}
                >
                  "{ratioDecidendi}"
                </blockquote>
              </div>
            )}

            {courtReasoning && (
              <div className="card-float p-6 sm:p-7 space-y-3" style={{ background: "var(--surface)", borderRadius: "var(--radius-md)" }}>
                <h5 className={subheadTextSize} style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                  Substantive Court Reasoning
                </h5>
                <p className={`${bodyTextSize} whitespace-pre-line`} style={{ color: "var(--ink)" }}>
                  {courtReasoning}
                </p>
              </div>
            )}

            {courtDirections.length > 0 && (
              <div className="space-y-3">
                <h5 className={subheadTextSize} style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                  Bench Directions / Operative Orders ({courtDirections.length})
                </h5>
                <div className="grid grid-cols-1 gap-2.5">
                  {courtDirections.map((dir, i) => (
                    <div
                      key={i}
                      className={`card-float p-4 sm:p-5 flex items-start gap-3.5 ${bodyTextSize}`}
                      style={{ background: "var(--surface)", borderRadius: "var(--radius-md)" }}
                    >
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-1"
                        style={{ background: "var(--brass-soft)", color: "var(--brass-bright)" }}
                      >
                        <ChevronRight size={14} />
                      </div>
                      <span style={{ color: "var(--ink)" }}>{dir}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {caseLaws.length > 0 && (
              <div className="space-y-2.5">
                <h5 className={subheadTextSize} style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                  Precedents Referenced
                </h5>
                <div className="flex flex-wrap gap-2.5">
                  {caseLaws.map((cl, i) => (
                    <span
                      key={i}
                      className="text-xs sm:text-sm px-3.5 py-1.5 rounded-lg font-medium"
                      style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)", color: "var(--ink)" }}
                    >
                      {cl}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB 6: PLAIN LANGUAGE & RISKS ────────────────────────────────── */}
        {activeTab === "compliance" && (
          <motion.div
            key="compliance"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {plainLanguage && (
              <div className="p-6 rounded-lg border space-y-3" style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}>
                <h5 className={`${subheadTextSize} flex items-center gap-2`} style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                  <Sparkles size={15} style={{ color: "var(--brass)" }} /> Plain Language Meaning for Litigant
                </h5>
                <p className={bodyTextSize} style={{ color: "var(--ink)" }}>{plainLanguage}</p>
              </div>
            )}

            {litigantAdvice && (
              <div className="p-6 rounded-lg border space-y-3" style={{ background: "var(--surface)", borderColor: "var(--hairline)" }}>
                <h5 className={subheadTextSize} style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                  Practical Next Action Steps
                </h5>
                <p className={bodyTextSize} style={{ color: "var(--ink)" }}>{litigantAdvice}</p>
              </div>
            )}

            {complianceDirections.length > 0 && (
              <div className="space-y-3">
                <h5 className={subheadTextSize} style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                  Compliance Milestones & Deadlines
                </h5>
                <div className="grid grid-cols-1 gap-2.5">
                  {complianceDirections.map((step, i) => (
                    <div
                      key={i}
                      className={`card-float p-4 sm:p-5 flex items-start gap-3.5 ${bodyTextSize}`}
                      style={{ background: "var(--surface)", borderRadius: "var(--radius-md)" }}
                    >
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-1"
                        style={{ background: "var(--brass-soft)", color: "var(--brass-bright)" }}
                      >
                        <ChevronRight size={14} />
                      </div>
                      <span style={{ color: "var(--ink)" }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {risks.length > 0 && (
              <div className="p-6 rounded-lg border space-y-3" style={{ background: "var(--surface)", borderColor: "var(--hairline)" }}>
                <h5 className={`${subheadTextSize} flex items-center gap-2`} style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                  <ShieldAlert size={15} style={{ color: "var(--brass)" }} /> Legal Exposure & Risk Factors
                </h5>
                <ul className={`list-disc list-inside space-y-2.5 ${bodyTextSize}`} style={{ color: "var(--ink)" }}>
                  {risks.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {!plainLanguage && !litigantAdvice && complianceDirections.length === 0 && risks.length === 0 && (
              <p className={`card-float p-5 ${bodyTextSize}`} style={{ color: "var(--ink-faint)" }}>
                Plain language interpretation and compliance data are not available for this order.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
