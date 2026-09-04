import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  Copy,
  Check,
  Scale,
  FileText,
  HelpCircle,
  Gavel,
  BookOpen,
  Layers,
  ChevronRight,
  ShieldAlert,
  History,
} from "lucide-react";
import type { CaseDetails, OrderAI } from "@/types/case";

interface AISummaryCardProps {
  caseData?: CaseDetails | null;
  aiData?: OrderAI | null;
  summary?: string | null;
  plainLanguage?: string | null;
  issues?: string[];
  reasoning?: string | null;
  ratioDecidendi?: string | null;
  directions?: string[];
  statutesCited?: string[];
  onReadDocument?: (filename?: string) => void;
}

type TabType = "overview" | "procedural" | "facts" | "issues" | "ratio" | "all";

export function AISummaryCard({
  caseData,
  aiData,
  summary: propSummary,
  plainLanguage: propPlainLanguage,
  issues: propIssues,
  reasoning: propReasoning,
  ratioDecidendi: propRatioDecidendi,
  directions: propDirections,
  statutesCited: propStatutesCited,
}: AISummaryCardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [copied, setCopied] = useState(false);

  // Merge direct props with aiData and caseData (support both snake_case and camelCase)
  const rawAi = (aiData || {}) as any;
  const summary = rawAi.executive_summary || rawAi.executiveSummary || propSummary;
  const plainLanguage =
    rawAi.plain_language_summary ||
    rawAi.plainLanguageSummary ||
    rawAi.litigant_friendly_explanation ||
    rawAi.litigantFriendlyExplanation ||
    propPlainLanguage;
  const issues =
    rawAi.primary_issues && rawAi.primary_issues.length > 0
      ? rawAi.primary_issues
      : rawAi.primaryIssues && rawAi.primaryIssues.length > 0
      ? rawAi.primaryIssues
      : propIssues || [];
  const reasoning = rawAi.court_reasoning || rawAi.courtReasoning || propReasoning;
  const ratioDecidendi = rawAi.ratio_decidendi || rawAi.ratioDecidendi || propRatioDecidendi;
  const directions =
    rawAi.court_directions && rawAi.court_directions.length > 0
      ? rawAi.court_directions
      : rawAi.courtDirections && rawAi.courtDirections.length > 0
      ? rawAi.courtDirections
      : propDirections || [];
  const statutesCited =
    rawAi.statutes_cited && rawAi.statutes_cited.length > 0
      ? rawAi.statutes_cited
      : rawAi.statutesCited && rawAi.statutesCited.length > 0
      ? rawAi.statutesCited
      : propStatutesCited || caseData?.acts_and_sections || [];
  const caseLaws = rawAi.case_laws_referenced || rawAi.caseLawsReferenced || [];
  const petArguments = rawAi.petitioner_arguments || rawAi.petitionerArguments || [];
  const respArguments = rawAi.respondent_arguments || rawAi.respondentArguments || [];

  // Case metadata helpers
  const caseTitle = caseData?.case_title || rawAi.case_number || rawAi.caseNumber || rawAi.filename || "Court Document Summary";
  const courtName = caseData?.court?.court_name || rawAi.court_name || rawAi.courtName || "Legal Record";
  const caseNo = caseData?.case_number || caseData?.filing_number || rawAi.case_number || rawAi.caseNumber || "N/A";
  const cnr = caseData?.cnr || rawAi.cnr || "";
  const orderDate = rawAi.order_date || rawAi.orderDate || caseData?.decision_date || caseData?.next_hearing_date || "Current Record";
  const statusLabel = rawAi.disposition_status || rawAi.dispositionStatus || caseData?.case_status_label || caseData?.case_status || "Pending Adjudication";
  const judges =
    rawAi.judge_names && rawAi.judge_names.length > 0
      ? rawAi.judge_names
      : rawAi.judgeNames && rawAi.judgeNames.length > 0
      ? rawAi.judgeNames
      : caseData?.judges || [];

  const petCounsel =
    rawAi.counsel_petitioner && rawAi.counsel_petitioner.length > 0
      ? rawAi.counsel_petitioner
      : rawAi.counselPetitioner && rawAi.counselPetitioner.length > 0
      ? rawAi.counselPetitioner
      : caseData?.parties?.petitioner_advocates || [];
  const respCounsel =
    rawAi.counsel_respondent && rawAi.counsel_respondent.length > 0
      ? rawAi.counsel_respondent
      : rawAi.counselRespondent && rawAi.counselRespondent.length > 0
      ? rawAi.counselRespondent
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

  const copyFullBrief = () => {
    const text = [
      `# ${caseTitle}`,
      `**Court & Case No.:** ${courtName} | ${caseNo} (CNR: ${cnr})`,
      `**Order Date:** ${orderDate} | **Status:** ${statusLabel}`,
      judges.length > 0 && `**Bench:** ${judges.join(", ")}`,
      "",
      `## 1. PROCEDURAL & CASE HISTORY`,
      `| Event / Parameter | Details |`,
      `| :--- | :--- |`,
      `| **Petition / Proceeding** | ${pets.join(", ") || "Petitioners"} filed petition challenging contested administrative/statutory actions. |`,
      `| **Respondents** | ${resps.join(", ") || "Respondents"} |`,
      petCounsel.length > 0 && `| **Counsel for Petitioners** | ${petCounsel.join(", ")} |`,
      respCounsel.length > 0 && `| **Counsel for Respondents** | ${respCounsel.join(", ")} |`,
      `| **Hearing & Order Status** | ${aiData?.order_nature || "Order"} - ${statusLabel} |`,
      "",
      summary && `## 2. KEY FACTS (EXTRACTED FROM RECORD)\n${summary}`,
      plainLanguage && `**Plain Language Explanation:**\n${plainLanguage}`,
      "",
      issues.length > 0 && `## 3. LEGAL ISSUES IDENTIFIED\n${issues.map((iss: string, i: number) => `${i + 1}. ${iss}`).join("\n")}`,
      petArguments.length > 0 && `**Petitioner Arguments:**\n${petArguments.map((a: string) => `- ${a}`).join("\n")}`,
      respArguments.length > 0 && `**Respondent Arguments:**\n${respArguments.map((a: string) => `- ${a}`).join("\n")}`,
      "",
      ratioDecidendi && `## 4. RATIO DECIDENDI (BINDING LEGAL PRINCIPLE)\n> "${ratioDecidendi}"`,
      reasoning && `\n**Court Reasoning:**\n${reasoning}`,
      "",
      directions.length > 0 && `## 5. BENCH DIRECTIONS & OPERATIVE ORDERS\n${directions.map((d: string, i: number) => `${i + 1}. ${d}`).join("\n")}`,
      statutesCited.length > 0 && `**Statutes Cited:** ${statutesCited.join(", ")}`,
      caseLaws.length > 0 && `**Precedents Referenced:** ${caseLaws.join(", ")}`,
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { id: "overview" | "procedural" | "facts" | "issues" | "ratio"; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Executive Brief", icon: <FileText size={14} /> },
    { id: "procedural", label: "Procedural History", icon: <History size={14} /> },
    { id: "facts", label: "Key Facts & Dispute", icon: <BookOpen size={14} /> },
    { id: "issues", label: "Legal Issues", icon: <HelpCircle size={14} /> },
    { id: "ratio", label: "Ratio & Reasoning", icon: <Scale size={14} /> },
  ];

  return (
    <div className="card-float p-6 sm:p-8 space-y-6 relative overflow-hidden" style={{ borderRadius: "var(--radius-md)" }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--hairline-soft)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--brass-soft)", color: "var(--brass-bright)", border: "1px solid var(--hairline)" }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-lg font-medium tracking-tight" style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}>
              Case Intelligence & Analysis
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--ink-faint)" }}>
              Procedural history, key facts, legal issues, ratio decidendi, and plain language synthesis.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Full Brief View Toggle */}
          <button
            onClick={() => setActiveTab(activeTab === "all" ? "overview" : "all")}
            className="btn btn-ghost flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all"
            style={{
              border: "1px solid var(--hairline)",
              padding: "7px 14px",
              background: activeTab === "all" ? "var(--brass-soft)" : "transparent",
              color: activeTab === "all" ? "var(--brass-bright)" : "var(--ink-dim)",
            }}
            title="Toggle Full Comprehensive Brief View"
          >
            <Layers size={14} style={{ color: "var(--brass)" }} />
            <span>{activeTab === "all" ? "Section View" : "Full Brief View"}</span>
          </button>

          {/* Copy Full Brief */}
          <button
            onClick={copyFullBrief}
            className="btn btn-ghost flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all"
            style={{
              border: "1px solid var(--hairline)",
              padding: "7px 16px",
              background: copied ? "var(--brass-soft)" : "transparent",
              color: copied ? "var(--seal-disposed)" : "var(--ink)",
            }}
            title="Copy Complete Case Summary"
          >
            {copied ? (
              <>
                <Check size={14} style={{ color: "var(--seal-disposed)" }} />
                <span className="font-medium" style={{ color: "var(--seal-disposed)" }}>Brief Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} style={{ color: "var(--ink-faint)" }} />
                <span>Copy Full Brief</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metadata Overview Banner */}
      <div
        className="p-5 rounded-lg border space-y-3"
        style={{ background: "var(--surface)", borderColor: "var(--hairline)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-base font-medium" style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}>
            {caseTitle}
          </h4>
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded uppercase"
            style={{
              background: "var(--surface-container)",
              color: "var(--ink-dim)",
              border: "1px solid var(--hairline)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-2 border-t" style={{ borderColor: "var(--hairline-soft)" }}>
          <div>
            <span className="block font-medium uppercase tracking-wider text-[10.5px]" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
              Court & Case No.
            </span>
            <span className="font-medium mt-0.5 block" style={{ color: "var(--ink)" }}>
              {courtName} • {caseNo}
            </span>
          </div>

          <div>
            <span className="block font-medium uppercase tracking-wider text-[10.5px]" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
              CNR Number
            </span>
            <span className="font-mono font-medium mt-0.5 block" style={{ color: "var(--ink)" }}>
              {cnr || "Unavailable"}
            </span>
          </div>

          <div>
            <span className="block font-medium uppercase tracking-wider text-[10.5px]" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
              Order / Hearing Date
            </span>
            <span className="font-medium mt-0.5 block" style={{ color: "var(--ink)" }}>
              {orderDate}
            </span>
          </div>

          <div>
            <span className="block font-medium uppercase tracking-wider text-[10.5px]" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
              Bench / Judges
            </span>
            <span className="font-medium mt-0.5 block truncate" style={{ color: "var(--ink)" }}>
              {judges.length > 0 ? judges.join(", ") : "Hon'ble Court Bench"}
            </span>
          </div>
        </div>
      </div>

      {/* Segmented Tab Switcher */}
      <div
        className="p-1 rounded-lg border w-full"
        style={{
          background: "var(--surface)",
          borderColor: "var(--hairline)",
        }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="relative px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer select-none flex items-center justify-center gap-1.5 outline-none text-center"
                style={{
                  color: isActive ? "var(--ink)" : "var(--ink-faint)",
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="summary-active-pill"
                    className="absolute inset-0 rounded-md z-0"
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 32,
                    }}
                    style={{
                      background: "var(--surface-raised)",
                      border: "1px solid var(--hairline)",
                    }}
                  />
                )}
                <span
                  className="relative z-10 flex items-center justify-center gap-1.5 transition-colors truncate"
                  style={{
                    color: isActive ? "var(--ink)" : "var(--ink-faint)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  <span className="flex-shrink-0">{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT: Executive Brief (High-Level Overview) */}
      {(activeTab === "overview" || activeTab === "all") && (
        <div className="space-y-5">
          {/* Executive Synthesis */}
          {summary && (
            <div className="card-float p-6 space-y-3" style={{ background: "var(--surface)", borderRadius: "var(--radius-md)" }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: "var(--brass)" }} />
                <h4 className="text-xs uppercase font-semibold tracking-wider" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                  Executive Case Synopsis
                </h4>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--ink-dim)" }}>
                {summary}
              </p>
            </div>
          )}

          {/* Binding Ratio Callout */}
          {ratioDecidendi && (
            <div
              className="p-5 rounded-lg border space-y-2.5"
              style={{
                background: "var(--surface)",
                borderColor: "var(--hairline)",
              }}
            >
              <span
                className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded inline-flex items-center gap-1.5"
                style={{
                  background: "var(--brass-soft)",
                  color: "var(--brass-bright)",
                  border: "1px solid var(--hairline)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <Scale size={12} /> Binding Legal Principle (Ratio Decidendi)
              </span>
              <blockquote
                className="text-sm font-serif font-medium leading-relaxed italic p-3.5 rounded border-l-2"
                style={{
                  borderColor: "var(--brass)",
                  background: "var(--surface-raised)",
                  color: "var(--ink)",
                }}
              >
                "{ratioDecidendi}"
              </blockquote>
            </div>
          )}

          {/* Plain Language Client Takeaway - HIGH CONTRAST & READABLE IN DARK/LIGHT MODE */}
          {plainLanguage && (
            <div
              className="p-6 rounded-lg border space-y-3 relative overflow-hidden"
              style={{
                background: "var(--surface-raised)",
                borderColor: "var(--hairline)",
              }}
            >
              <h4
                className="text-xs uppercase font-semibold tracking-wider flex items-center gap-2"
                style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}
              >
                <Sparkles size={14} style={{ color: "var(--brass)" }} /> Non-Technical Takeaway (Plain Language)
              </h4>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink)" }}>
                {plainLanguage}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Procedural History Matrix Table */}
      {(activeTab === "procedural" || activeTab === "all") && (
        <div className="space-y-4">
          <h4 className="text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
            <History size={14} style={{ color: "var(--brass)" }} /> Procedural & Case History Matrix
          </h4>

          <div className="w-full overflow-x-auto card-float" style={{ borderRadius: "var(--radius-md)" }}>
            <table className="w-full text-left text-sm whitespace-normal">
              <thead className="border-b text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)", color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
                <tr>
                  <th className="p-3.5 w-1/4">Event / Parameter</th>
                  <th className="p-3.5 w-3/4">Details & Records</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs sm:text-sm" style={{ borderColor: "var(--hairline-soft)" }}>
                <tr>
                  <td className="p-3.5 font-medium" style={{ color: "var(--ink)", background: "var(--surface)" }}>Petition / Action Filed</td>
                  <td className="p-3.5" style={{ color: "var(--ink-dim)" }}>
                    {pets.length > 0 ? pets.join(", ") : "Petitioners"} filed petition under {statutesCited.length > 0 ? statutesCited[0] : "Article 226 of the Constitution"} challenging actions and decisions of the respondents.
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium" style={{ color: "var(--ink)", background: "var(--surface)" }}>Respondents</td>
                  <td className="p-3.5" style={{ color: "var(--ink-dim)" }}>
                    {resps.length > 0 ? resps.join(", ") : "Respondent Authority"}
                  </td>
                </tr>
                {petCounsel.length > 0 && (
                  <tr>
                    <td className="p-3.5 font-medium" style={{ color: "var(--ink)", background: "var(--surface)" }}>Counsel for Petitioners</td>
                    <td className="p-3.5 font-medium" style={{ color: "var(--ink)" }}>
                      {petCounsel.join(", ")}
                    </td>
                  </tr>
                )}
                {respCounsel.length > 0 && (
                  <tr>
                    <td className="p-3.5 font-medium" style={{ color: "var(--ink)", background: "var(--surface)" }}>Counsel for Respondents</td>
                    <td className="p-3.5 font-medium" style={{ color: "var(--ink)" }}>
                      {respCounsel.join(", ")}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="p-3.5 font-medium" style={{ color: "var(--ink)", background: "var(--surface)" }}>Hearing & Order</td>
                  <td className="p-3.5" style={{ color: "var(--ink-dim)" }}>
                    {aiData?.order_nature || "Court Proceeding"} recorded on {orderDate}. {aiData?.outcome || "Case records and arguments heard by the Bench."}
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium" style={{ color: "var(--ink)", background: "var(--surface)" }}>Disposition</td>
                  <td className="p-3.5 font-medium" style={{ color: "var(--brass)" }}>
                    {statusLabel}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Key Facts & Dispute Dynamics (PARTIES INVOLVED REMOVED AS REQUESTED) */}
      {(activeTab === "facts" || activeTab === "all") && (
        <div className="space-y-4">
          <h4 className="text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
            <BookOpen size={14} style={{ color: "var(--brass)" }} /> Key Facts & Dispute Dynamics
          </h4>

          <div className="space-y-4">
            {/* Nature of the Dispute (Spans full width now) */}
            <div className="card-float p-6 space-y-2.5" style={{ background: "var(--surface)", borderRadius: "var(--radius-md)" }}>
              <h5 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                <Scale size={13} style={{ color: "var(--brass)" }} /> Nature of Dispute
              </h5>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                {summary || "The controversy pertains to regulatory compliance, administrative jurisdiction, and enforcement of statutory obligations."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Relief Sought / Arguments */}
              <div className="card-float p-6 space-y-2.5" style={{ background: "var(--surface)", borderRadius: "var(--radius-md)" }}>
                <h5 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                  <Gavel size={13} style={{ color: "var(--brass)" }} /> Relief Sought & Claims
                </h5>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  Petitioners sought judicial intervention and quashing/modification of contested orders or enforcement notices issued by the authorities.
                </p>
              </div>

              {/* Legal Landscape */}
              <div className="card-float p-6 space-y-2.5" style={{ background: "var(--surface)", borderRadius: "var(--radius-md)" }}>
                <h5 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                  <ShieldAlert size={13} style={{ color: "var(--brass)" }} /> Statutory Landscape
                </h5>
                <div className="flex flex-wrap gap-2 pt-1">
                  {statutesCited.length > 0 ? (
                    statutesCited.map((st: string, i: number) => (
                      <span
                        key={i}
                        className="text-[11.5px] font-mono px-2.5 py-1 rounded font-medium"
                        style={{
                          background: "var(--surface-raised)",
                          border: "1px solid var(--hairline)",
                          color: "var(--ink)",
                        }}
                      >
                        {st}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs" style={{ color: "var(--ink-faint)" }}>Governed by constitutional and specialized statutory frameworks.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Legal Issues */}
      {(activeTab === "issues" || activeTab === "all") && (
        <div className="space-y-4">
          <h4 className="text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
            <HelpCircle size={14} style={{ color: "var(--brass)" }} /> Primary Legal Issues & Submissions
          </h4>

          {issues.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {issues.map((issue: string, i: number) => (
                <div
                  key={i}
                  className="card-float p-5 flex items-start gap-3.5 text-sm"
                  style={{ background: "var(--surface)", borderRadius: "var(--radius-md)" }}
                >
                  <span
                    className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5 font-mono"
                    style={{ background: "var(--brass-soft)", color: "var(--brass-bright)", border: "1px solid var(--hairline)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="space-y-1">
                    <p className="font-medium" style={{ color: "var(--ink)" }}>{issue}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs card-float p-4" style={{ color: "var(--ink-faint)" }}>
              No explicit legal issues itemized in the immediate brief.
            </p>
          )}

          {(petArguments.length > 0 || respArguments.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {petArguments.length > 0 && (
                <div className="card-float p-6 space-y-2.5" style={{ background: "var(--surface)", borderRadius: "var(--radius-md)" }}>
                  <h5 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                    Petitioners' Submissions
                  </h5>
                  <ul className="list-disc list-inside text-xs space-y-2" style={{ color: "var(--ink-dim)" }}>
                    {petArguments.map((arg: string, i: number) => (
                      <li key={i}>{arg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {respArguments.length > 0 && (
                <div className="card-float p-6 space-y-2.5" style={{ background: "var(--surface)", borderRadius: "var(--radius-md)" }}>
                  <h5 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                    Respondents' Submissions
                  </h5>
                  <ul className="list-disc list-inside text-xs space-y-2" style={{ color: "var(--ink-dim)" }}>
                    {respArguments.map((arg: string, i: number) => (
                      <li key={i}>{arg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Ratio Decidendi & Reasoning */}
      {(activeTab === "ratio" || activeTab === "all") && (
        <div className="space-y-5">
          <h4 className="text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
            <Scale size={14} style={{ color: "var(--brass)" }} /> Bench Findings, Ratio Decidendi & Orders
          </h4>

          {ratioDecidendi && (
            <div className="p-6 rounded-lg border space-y-3" style={{ background: "var(--surface)", borderColor: "var(--hairline)" }}>
              <span
                className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded inline-flex items-center gap-1.5"
                style={{
                  background: "var(--brass-soft)",
                  color: "var(--brass-bright)",
                  border: "1px solid var(--hairline)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <Scale size={12} /> Binding Legal Holding
              </span>
              <blockquote
                className="text-base font-serif font-medium leading-relaxed italic p-4 rounded border-l-2"
                style={{ borderColor: "var(--brass)", background: "var(--surface-raised)", color: "var(--ink)" }}
              >
                "{ratioDecidendi}"
              </blockquote>
            </div>
          )}

          {reasoning && (
            <div className="card-float p-6 space-y-3" style={{ background: "var(--surface)", borderRadius: "var(--radius-md)" }}>
              <h5 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                Substantive Court Reasoning
              </h5>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--ink-dim)" }}>
                {reasoning}
              </p>
            </div>
          )}

          {directions.length > 0 && (
            <div className="space-y-2.5">
              <h5 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                Bench Directions / Operative Orders ({directions.length})
              </h5>
              <div className="grid grid-cols-1 gap-2">
                {directions.map((dir: string, i: number) => (
                  <div
                    key={i}
                    className="card-float p-4 flex items-start gap-2.5 text-sm"
                    style={{ background: "var(--surface)", borderRadius: "var(--radius-md)" }}
                  >
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "var(--brass-soft)", color: "var(--brass-bright)" }}
                    >
                      <ChevronRight size={13} />
                    </div>
                    <span style={{ color: "var(--ink)" }}>{dir}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
