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
  Users,
  History,
  Compass,
  ArrowRight,
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
  onReadDocument,
}: AISummaryCardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [copied, setCopied] = useState(false);

  // Merge direct props with aiData and caseData
  const summary = aiData?.executive_summary || propSummary;
  const plainLanguage = aiData?.plain_language_summary || aiData?.litigant_friendly_explanation || propPlainLanguage;
  const issues = (aiData?.primary_issues && aiData.primary_issues.length > 0) ? aiData.primary_issues : (propIssues || []);
  const reasoning = aiData?.court_reasoning || propReasoning;
  const ratioDecidendi = aiData?.ratio_decidendi || propRatioDecidendi;
  const directions = (aiData?.court_directions && aiData.court_directions.length > 0) ? aiData.court_directions : (propDirections || []);
  const statutesCited = (aiData?.statutes_cited && aiData.statutes_cited.length > 0) ? aiData.statutes_cited : (propStatutesCited || caseData?.acts_and_sections || []);
  const caseLaws = aiData?.case_laws_referenced || [];
  const petArguments = aiData?.petitioner_arguments || [];
  const respArguments = aiData?.respondent_arguments || [];
  const complianceDirs = aiData?.compliance_directions || [];
  const implications = aiData?.implications || [];
  const risks = aiData?.risks || [];

  // Case metadata helpers
  const caseTitle = caseData?.case_title || aiData?.case_number || "Court Case Summary";
  const courtName = caseData?.court?.court_name || aiData?.court_name || "Court Record";
  const caseNo = caseData?.case_number || caseData?.filing_number || aiData?.case_number || "N/A";
  const cnr = caseData?.cnr || aiData?.cnr || "";
  const orderDate = aiData?.order_date || caseData?.decision_date || caseData?.next_hearing_date || "Current Record";
  const statusLabel = aiData?.disposition_status || caseData?.case_status_label || caseData?.case_status || "Pending Adjudication";
  const judges = (aiData?.judge_names && aiData.judge_names.length > 0) ? aiData.judge_names : (caseData?.judges || []);

  const petCounsel = (aiData?.counsel_petitioner && aiData.counsel_petitioner.length > 0)
    ? aiData.counsel_petitioner
    : (caseData?.parties?.petitioner_advocates || []);
  const respCounsel = (aiData?.counsel_respondent && aiData.counsel_respondent.length > 0)
    ? aiData.counsel_respondent
    : (caseData?.parties?.respondent_advocates || []);

  const pets = (caseData?.parties?.petitioners && caseData.parties.petitioners.length > 0)
    ? caseData.parties.petitioners
    : (aiData?.petitioners?.map((p) => (typeof p === "string" ? p : p.name)) || []);
  const resps = (caseData?.parties?.respondents && caseData.parties.respondents.length > 0)
    ? caseData.parties.respondents
    : (aiData?.respondents?.map((r) => (typeof r === "string" ? r : r.name)) || []);

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
      issues.length > 0 && `## 3. LEGAL ISSUES IDENTIFIED\n${issues.map((iss, i) => `${i + 1}. ${iss}`).join("\n")}`,
      petArguments.length > 0 && `**Petitioner Arguments:**\n${petArguments.map((a) => `- ${a}`).join("\n")}`,
      respArguments.length > 0 && `**Respondent Arguments:**\n${respArguments.map((a) => `- ${a}`).join("\n")}`,
      "",
      ratioDecidendi && `## 4. RATIO DECIDENDI (BINDING LEGAL PRINCIPLE)\n> "${ratioDecidendi}"`,
      reasoning && `\n**Court Reasoning:**\n${reasoning}`,
      "",
      directions.length > 0 && `## 5. BENCH DIRECTIONS & OPERATIVE ORDERS\n${directions.map((d, i) => `${i + 1}. ${d}`).join("\n")}`,
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
    <div className="card-float p-6 sm:p-8 space-y-6 relative overflow-hidden animate-spring-in">
      {/* Top Accent Indicator */}
      <div
        className="absolute top-0 left-0 w-1.5 h-full"
        style={{ background: "var(--primary)" }}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--surface-container)", color: "var(--primary)", border: "1px solid var(--border)" }}
          >
            <Sparkles size={19} />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Summary
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              End-to-end case intelligence covering procedural history, facts, legal questions, and ratio & reasoning.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Full Brief View Toggle */}
          <button
            onClick={() => setActiveTab(activeTab === "all" ? "overview" : "all")}
            className="btn-ghost flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all"
            style={{
              border: "1px solid var(--border)",
              padding: "8px 16px",
              borderRadius: "var(--radius-button)",
              background: activeTab === "all" ? "var(--primary)" : "var(--surface)",
              color: activeTab === "all" ? "var(--on-primary)" : "var(--text-primary)",
            }}
            title="Toggle Full Comprehensive Brief View"
          >
            <Layers size={14} style={{ color: activeTab === "all" ? "var(--on-primary)" : "var(--primary)" }} />
            <span>{activeTab === "all" ? "Section View" : "Full Brief View"}</span>
          </button>

          {/* Copy Full Brief */}
          <button
            onClick={copyFullBrief}
            className="btn-ghost flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all"
            style={{
              border: "1px solid var(--border)",
              padding: "8px 18px",
              borderRadius: "var(--radius-button)",
              background: copied ? "rgba(22, 163, 74, 0.08)" : "var(--card)",
              color: copied ? "var(--success)" : "var(--text-primary)",
              borderColor: copied ? "rgba(22, 163, 74, 0.3)" : "var(--border)",
            }}
            title="Copy Complete Case Summary"
          >
            {copied ? (
              <>
                <Check size={14} className="text-green-600 animate-in fade-in" />
                <span className="font-semibold text-green-600">Full Summary Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Full Brief</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metadata Overview Banner */}
      <div
        className="p-5 rounded-2xl border space-y-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {caseTitle}
          </h4>
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase"
            style={{ background: "var(--surface-container-high)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
          >
            {statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <div>
            <span className="block font-medium uppercase tracking-wider text-[10px]" style={{ color: "var(--text-muted)" }}>
              Court & Case No.
            </span>
            <span className="font-semibold mt-0.5 block" style={{ color: "var(--text-primary)" }}>
              {courtName} • {caseNo}
            </span>
          </div>

          <div>
            <span className="block font-medium uppercase tracking-wider text-[10px]" style={{ color: "var(--text-muted)" }}>
              CNR Number
            </span>
            <span className="font-mono font-semibold mt-0.5 block" style={{ color: "var(--text-primary)" }}>
              {cnr || "Unavailable"}
            </span>
          </div>

          <div>
            <span className="block font-medium uppercase tracking-wider text-[10px]" style={{ color: "var(--text-muted)" }}>
              Order / Hearing Date
            </span>
            <span className="font-semibold mt-0.5 block" style={{ color: "var(--text-primary)" }}>
              {orderDate}
            </span>
          </div>

          <div>
            <span className="block font-medium uppercase tracking-wider text-[10px]" style={{ color: "var(--text-muted)" }}>
              Bench / Judges
            </span>
            <span className="font-semibold mt-0.5 block truncate" style={{ color: "var(--text-primary)" }}>
              {judges.length > 0 ? judges.join(", ") : "Hon'ble Court Bench"}
            </span>
          </div>
        </div>
      </div>

      {/* Redesigned Premium Segmented Tab Switcher */}
      <div
        className="p-1.5 rounded-2xl border w-full"
        style={{
          background: "var(--surface-container)",
          borderColor: "var(--border)",
        }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 sm:gap-1.5 w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="relative px-2.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none flex items-center justify-center gap-1.5 outline-none text-center"
                style={{
                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="summary-active-pill"
                    className="absolute inset-0 rounded-xl z-0"
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 32,
                    }}
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      boxShadow:
                        "0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
                    }}
                  />
                )}
                <span
                  className="relative z-10 flex items-center justify-center gap-1.5 transition-colors truncate"
                  style={{
                    color: isActive ? "var(--primary)" : "var(--text-secondary)",
                    fontWeight: isActive ? 600 : 500,
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
        <div className="space-y-6">
          {/* Executive Synthesis */}
          {summary && (
            <div className="card-float p-6 space-y-3" style={{ background: "var(--card)" }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: "var(--primary)" }} />
                <h4 className="text-xs uppercase font-bold tracking-wider" style={{ color: "var(--text-primary)" }}>
                  Executive Case Synopsis
                </h4>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                {summary}
              </p>
            </div>
          )}

          {/* Binding Ratio Callout */}
          {ratioDecidendi && (
            <div
              className="p-5 rounded-2xl border space-y-2"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border-strong)",
              }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-flex items-center gap-1"
                style={{ background: "var(--primary)", color: "var(--on-primary)" }}
              >
                <Scale size={11} /> Binding Legal Principle (Ratio Decidendi)
              </span>
              <blockquote className="text-sm font-medium leading-relaxed italic p-3 rounded-xl border-l-4" style={{ borderColor: "var(--primary)", background: "var(--card)", color: "var(--text-primary)" }}>
                "{ratioDecidendi}"
              </blockquote>
            </div>
          )}

          {/* Plain Language Client Takeaway */}
          {plainLanguage && (
            <div
              className="p-5 rounded-2xl border space-y-2 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(247, 243, 242, 0.85) 0%, rgba(255, 255, 255, 0.95) 100%)",
                borderColor: "var(--border)",
              }}
            >
              <h4 className="text-xs uppercase font-bold tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                <Sparkles size={13} style={{ color: "var(--primary)" }} /> Non-Technical Takeaway (Plain Language)
              </h4>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {plainLanguage}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Procedural History Matrix Table */}
      {(activeTab === "procedural" || activeTab === "all") && (
        <div className="space-y-4">
          <h4 className="text-xs uppercase font-bold tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
            <History size={14} style={{ color: "var(--primary)" }} /> Procedural & Case History Matrix
          </h4>

          <div className="w-full overflow-x-auto card-float">
            <table className="w-full text-left text-sm whitespace-normal">
              <thead className="border-b text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text-muted)" }}>
                <tr>
                  <th className="p-3.5 w-1/4">Event / Parameter</th>
                  <th className="p-3.5 w-3/4">Details & Records</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs sm:text-sm" style={{ borderColor: "var(--border)" }}>
                <tr>
                  <td className="p-3.5 font-semibold" style={{ color: "var(--text-primary)", background: "var(--surface)" }}>Petition / Action Filed</td>
                  <td className="p-3.5" style={{ color: "var(--text-secondary)" }}>
                    {pets.length > 0 ? pets.join(", ") : "Petitioners"} filed petition under {statutesCited.length > 0 ? statutesCited[0] : "Article 226 of the Constitution"} challenging actions and decisions of the respondents.
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-semibold" style={{ color: "var(--text-primary)", background: "var(--surface)" }}>Respondents</td>
                  <td className="p-3.5" style={{ color: "var(--text-secondary)" }}>
                    {resps.length > 0 ? resps.join(", ") : "Respondent Authority"}
                  </td>
                </tr>
                {petCounsel.length > 0 && (
                  <tr>
                    <td className="p-3.5 font-semibold" style={{ color: "var(--text-primary)", background: "var(--surface)" }}>Counsel for Petitioners</td>
                    <td className="p-3.5 font-medium" style={{ color: "var(--text-primary)" }}>
                      {petCounsel.join(", ")}
                    </td>
                  </tr>
                )}
                {respCounsel.length > 0 && (
                  <tr>
                    <td className="p-3.5 font-semibold" style={{ color: "var(--text-primary)", background: "var(--surface)" }}>Counsel for Respondents</td>
                    <td className="p-3.5 font-medium" style={{ color: "var(--text-primary)" }}>
                      {respCounsel.join(", ")}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="p-3.5 font-semibold" style={{ color: "var(--text-primary)", background: "var(--surface)" }}>Hearing & Order</td>
                  <td className="p-3.5" style={{ color: "var(--text-secondary)" }}>
                    {aiData?.order_nature || "Court Proceeding"} recorded on {orderDate}. {aiData?.outcome || "Case records and arguments heard by the Bench."}
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-semibold" style={{ color: "var(--text-primary)", background: "var(--surface)" }}>Disposition</td>
                  <td className="p-3.5 font-semibold" style={{ color: "var(--primary)" }}>
                    {statusLabel}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Key Facts & Dispute Breakdown */}
      {(activeTab === "facts" || activeTab === "all") && (
        <div className="space-y-4">
          <h4 className="text-xs uppercase font-bold tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
            <BookOpen size={14} style={{ color: "var(--primary)" }} /> Key Facts & Dispute Dynamics
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parties & Role */}
            <div className="card-float p-5 space-y-2.5" style={{ background: "var(--card)" }}>
              <h5 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                <Users size={13} style={{ color: "var(--primary)" }} /> Parties Involved
              </h5>
              <div className="text-xs space-y-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <p>
                  <strong className="text-black font-semibold">Petitioners:</strong> {pets.join(", ") || "Petitioning entities seeking legal redress."}
                </p>
                <p>
                  <strong className="text-black font-semibold">Respondents:</strong> {resps.join(", ") || "Respondent government/statutory authorities."}
                </p>
              </div>
            </div>

            {/* Nature of the Dispute */}
            <div className="card-float p-5 space-y-2.5" style={{ background: "var(--card)" }}>
              <h5 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                <Scale size={13} style={{ color: "var(--primary)" }} /> Nature of Dispute
              </h5>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {summary || "The controversy pertains to regulatory compliance, administrative jurisdiction, and enforcement of statutory obligations."}
              </p>
            </div>

            {/* Relief Sought / Arguments */}
            <div className="card-float p-5 space-y-2.5" style={{ background: "var(--card)" }}>
              <h5 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                <Gavel size={13} style={{ color: "var(--primary)" }} /> Relief Sought & Claims
              </h5>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Petitioners sought judicial intervention and quashing/modification of contested orders or enforcement notices issued by the authorities.
              </p>
            </div>

            {/* Legal Landscape */}
            <div className="card-float p-5 space-y-2.5" style={{ background: "var(--card)" }}>
              <h5 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                <ShieldAlert size={13} style={{ color: "var(--primary)" }} /> Statutory Landscape
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {statutesCited.length > 0 ? (
                  statutesCited.map((st, i) => (
                    <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface-container)] border border-[var(--border)] font-medium">
                      {st}
                    </span>
                  ))
                ) : (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Governed by constitutional and specialized statutory frameworks.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Legal Issues */}
      {(activeTab === "issues" || activeTab === "all") && (
        <div className="space-y-4">
          <h4 className="text-xs uppercase font-bold tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
            <HelpCircle size={14} style={{ color: "var(--primary)" }} /> Primary Legal Issues & Submissions
          </h4>

          {issues.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {issues.map((issue, i) => (
                <div key={i} className="card-float p-4 flex items-start gap-3.5 text-sm" style={{ background: "var(--card)" }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5 font-mono" style={{ background: "var(--surface-container)", color: "var(--primary)", border: "1px solid var(--border)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="space-y-1">
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{issue}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs card-float p-4" style={{ color: "var(--text-muted)" }}>
              No explicit legal issues itemized in the immediate brief.
            </p>
          )}

          {(petArguments.length > 0 || respArguments.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {petArguments.length > 0 && (
                <div className="card-float p-5 space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                    Petitioners' Submissions
                  </h5>
                  <ul className="list-disc list-inside text-xs space-y-1.5" style={{ color: "var(--text-secondary)" }}>
                    {petArguments.map((arg, i) => (
                      <li key={i}>{arg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {respArguments.length > 0 && (
                <div className="card-float p-5 space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                    Respondents' Submissions
                  </h5>
                  <ul className="list-disc list-inside text-xs space-y-1.5" style={{ color: "var(--text-secondary)" }}>
                    {respArguments.map((arg, i) => (
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
          <h4 className="text-xs uppercase font-bold tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
            <Scale size={14} style={{ color: "var(--primary)" }} /> Bench Findings, Ratio Decidendi & Orders
          </h4>

          {ratioDecidendi && (
            <div className="p-6 rounded-2xl border space-y-3" style={{ background: "var(--card)", borderColor: "var(--border-strong)", boxShadow: "var(--shadow-card)" }}>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--primary)] text-white inline-flex items-center gap-1">
                <Scale size={11} /> Binding Legal Holding
              </span>
              <blockquote className="text-base font-serif font-medium leading-relaxed italic p-4 rounded-xl border-l-4" style={{ borderColor: "var(--primary)", background: "var(--surface-container)", color: "var(--text-primary)" }}>
                "{ratioDecidendi}"
              </blockquote>
            </div>
          )}

          {reasoning && (
            <div className="card-float p-6 space-y-3" style={{ background: "var(--surface)" }}>
              <h5 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                Substantive Court Reasoning
              </h5>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                {reasoning}
              </p>
            </div>
          )}

          {directions.length > 0 && (
            <div className="space-y-2.5">
              <h5 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                Bench Directions / Operative Orders ({directions.length})
              </h5>
              <div className="grid grid-cols-1 gap-2">
                {directions.map((dir, i) => (
                  <div key={i} className="card-float p-4 flex items-start gap-2.5 text-sm" style={{ background: "var(--card)" }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(22, 163, 74, 0.1)", color: "var(--success)" }}>
                      <ChevronRight size={13} />
                    </div>
                    <span style={{ color: "var(--text-primary)" }}>{dir}</span>
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
