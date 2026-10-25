import React, { useState } from "react";
import {
  Search,
  ArrowLeftRight,
  Scale,
  Copy,
  Check,
  AlertTriangle,
  X,
  Gavel,
  MessageSquare,
  HelpCircle,
  FileText,
  Send,
  Loader2,
  Bookmark,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { eraTransitionService } from "@/services/eraTransition";
import type {
  StatuteConcordancePair,
  TransitionQuestionResponse,
} from "@/types/era_transition";

const CURATED_QUESTIONS = [
  "Can police take custody after the first 15 days under Section 187 BNSS?",
  "What happens to FIRs registered for offences committed before 1 July 2024?",
  "Is a Section 65B certificate required for electronic evidence under Section 63 BSA?",
  "Does Section 479 BNSS undertrial relief apply retrospectively to pending cases?",
  "What is the procedure and 14-day limit for preliminary inquiry under BNSS 173(3)?",
  "How are search and seizure proceedings affected by mandatory videography under BNSS 105?",
  "What are the newly introduced community service penalties under Section 4 BNS?",
  "How does Section 8 of the General Clauses Act bridge landmark Supreme Court rulings to BNS/BNSS?",
];

const buildPleadingText = (pair: StatuteConcordancePair): string => {
  const landmark = pair.landmark_precedents[0];
  return (
    `It is respectfully submitted before this Hon'ble Court that while the instant proceeding is styled ` +
    `under ${pair.new_code} Section ${pair.new_section}, the governing constitutional and statutory principle is squarely ` +
    `settled by the Hon'ble Supreme Court in ${landmark?.title || "landmark precedent"} [${landmark?.citation || "Binding Precedent"}]. ` +
    `By operation of Section 8 of the General Clauses Act, 1897, where any Central Act repeals and re-enacts with or ` +
    `without modification any provision of a former enactment, references to the repealed provision shall be construed ` +
    `as references to the provision so re-enacted. Furthermore, ${pair.new_code} Section ${pair.new_section} maintains ` +
    `pari materia identity with erstwhile ${pair.old_code} Section ${pair.old_section}. Consequently, the ratio decidendi ` +
    `in ${landmark?.title || ""}—mandating that ${landmark?.ratio || pair.doctrine_summary}—remains binding under ` +
    `Article 141 of the Constitution of India and strictly governs the adjudication of this matter.`
  );
};

export const EraTransitionExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"matrix" | "qa">("matrix");
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<StatuteConcordancePair[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Tab state within cards (id -> "overview" | "precedents" | "pleading")
  const [cardActiveTabs, setCardActiveTabs] = useState<Record<string, "overview" | "precedents" | "pleading">>({});

  // Q&A State
  const [qaQuestion, setQaQuestion] = useState<string>("");
  const [qaLoading, setQaLoading] = useState<boolean>(false);
  const [qaResponse, setQaResponse] = useState<TransitionQuestionResponse | null>(null);
  const [copiedPleading, setCopiedPleading] = useState<boolean>(false);

  const getCardTab = (id: string): "overview" | "precedents" | "pleading" => {
    return cardActiveTabs[id] || "overview";
  };

  const setCardTab = (id: string, tab: "overview" | "precedents" | "pleading") => {
    setCardActiveTabs((prev) => ({ ...prev, [id]: tab }));
  };

  const doSearch = async (q: string) => {
    setLoading(true);
    try {
      const resp = await eraTransitionService.lookupConcordance(q, 48);
      if (resp && Array.isArray(resp.pairs)) {
        setResults(resp.pairs);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasSearched(true);
    doSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    setHasSearched(false);
    setResults([]);
  };


  const handleCopyArgument = (pair: StatuteConcordancePair) => {
    const text = buildPleadingText(pair);
    navigator.clipboard.writeText(text);
    setCopiedId(pair.id);
    toast.success(`Copied Section 8 transposition argument for Section ${pair.new_section} ${pair.new_code}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleAskQuestion = async (customQ?: string) => {
    const qToAsk = (customQ || qaQuestion).trim();
    if (!qToAsk) {
      toast.error("Please enter a legal transition question");
      return;
    }
    if (customQ) {
      setQaQuestion(customQ);
    }
    setQaLoading(true);
    setQaResponse(null);
    try {
      const resp = await eraTransitionService.askTransitionQuestion(qToAsk);
      if (resp) {
        setQaResponse(resp);
      } else {
        toast.error("Failed to generate transition answer. Please try again.");
      }
    } catch {
      toast.error("Network error while consulting transition advisor.");
    } finally {
      setQaLoading(false);
    }
  };

  const handleCopyQAPleading = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedPleading(true);
    toast.success("Court pleading submission copied to clipboard!");
    setTimeout(() => setCopiedPleading(false), 2500);
  };

  const getDeltaBadgeStyle = (deltaType?: string) => {
    switch (deltaType) {
      case "SUBSTANTIAL_CHANGE":
        return {
          bg: "rgba(239, 68, 68, 0.12)",
          color: "#f87171",
          border: "rgba(239, 68, 68, 0.25)",
          label: "Substantial Change",
        };
      case "PROCEDURE_MODIFIED":
        return {
          bg: "rgba(59, 130, 246, 0.12)",
          color: "#60a5fa",
          border: "rgba(59, 130, 246, 0.25)",
          label: "Procedure Modified",
        };
      case "NEW_PROVISO_ADDED":
        return {
          bg: "rgba(245, 158, 11, 0.12)",
          color: "#fbbf24",
          border: "rgba(245, 158, 11, 0.25)",
          label: "New Proviso Added",
        };
      case "DIRECT_SUBSTITUTION":
      default:
        return {
          bg: "rgba(16, 185, 129, 0.12)",
          color: "#34d399",
          border: "rgba(16, 185, 129, 0.25)",
          label: "Direct Substitution",
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-4">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
              style={{
                background: "var(--brass-soft)",
                color: "var(--brass-bright)",
                border: "1px solid var(--hairline)",
              }}
            >
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <h1
                className="text-2xl font-medium tracking-tight"
                style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}
              >
                Law Transition Intelligence
              </h1>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs (Segmented Glass Pill) */}
        <div
          className="p-1 rounded-xl border flex items-center gap-1 self-start md:self-auto"
          style={{ background: "var(--surface)", borderColor: "var(--hairline)" }}
        >
          <button
            onClick={() => setActiveTab("matrix")}
            className="relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-2 select-none"
          >
            {activeTab === "matrix" && (
              <motion.div
                layoutId="transition-main-tab-pill"
                className="absolute inset-0 rounded-lg"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
                style={{
                  background: "var(--brass)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            )}
            <span
              className="relative z-10 flex items-center gap-1.5"
              style={{
                color: activeTab === "matrix" ? "var(--on-primary)" : "var(--ink-dim)",
                fontWeight: activeTab === "matrix" ? 600 : 400,
              }}
            >
              <Scale size={14} />
              <span>Concordance Explorer</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab("qa")}
            className="relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-2 select-none"
          >
            {activeTab === "qa" && (
              <motion.div
                layoutId="transition-main-tab-pill"
                className="absolute inset-0 rounded-lg"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
                style={{
                  background: "var(--brass)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            )}
            <span
              className="relative z-10 flex items-center gap-1.5"
              style={{
                color: activeTab === "qa" ? "var(--on-primary)" : "var(--ink-dim)",
                fontWeight: activeTab === "qa" ? 600 : 400,
              }}
            >
              <MessageSquare size={14} />
              <span>Transition Advisor</span>
            </span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: STATUTORY CONCORDANCE EXPLORER                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "matrix" && (
        <div className="space-y-5">
          {/* Search Bar & Category Controls Container */}
          <div
            className="p-3 sm:p-4 rounded-2xl border space-y-3"
            style={{
              background: "var(--surface-raised)",
              borderColor: "var(--hairline)",
            }}
          >
            {/* Unified Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--ink-faint)" }}
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search any section (e.g. IPC 420, CrPC 482, IEA 65B, BNSS 105) or doctrine (cheating, cruelty, anticipatory bail, remand)..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm transition-all outline-none"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--hairline)",
                    color: "var(--ink)",
                  }}
                />
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-sm font-medium shrink-0 disabled:opacity-50 cursor-pointer rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                style={{
                  background: "var(--brass)",
                  color: "var(--on-primary)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Searching…</span>
                  </>
                ) : (
                  <>
                    <Search size={15} />
                    <span>Search</span>
                  </>
                )}
              </button>
            </form>
          </div>



          {/* ── Results Area ── */}
          {loading ? (
            <div className="p-12 text-center rounded-2xl border space-y-4" style={{ background: "var(--surface)", borderColor: "var(--hairline)" }}>
              <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center animate-spin" style={{ color: "var(--brass)" }}>
                <Loader2 size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                  Resolving Statutory Concordance & Precedents…
                </h3>
                <p className="text-xs" style={{ color: "var(--ink-dim)" }}>
                  Applying Section 8 General Clauses Act matching & InLegalBERT doctrine vectors
                </p>
              </div>
            </div>
          ) : !hasSearched ? null : results.length === 0 ? (
            <div
              className="p-12 text-center rounded-2xl border border-dashed space-y-3"
              style={{ borderColor: "var(--hairline)", background: "var(--surface)" }}
            >
              <div
                className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center shadow-inner"
                style={{ background: "var(--brass-soft)", color: "var(--brass-bright)" }}
              >
                <Scale size={22} />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-medium" style={{ color: "var(--ink)" }}>
                  No statutory concordance matches found
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  Try entering another section number (e.g. 420, 498A, 302, 438, 154, 65B) or concept such as anticipatory bail, remand, or custodial confession.
                </p>
              </div>
            </div>
          ) : results.length === 1 ? (
            /* ───────────────────────────────────────────────────────────── */
            /* SPOTLIGHT HERO VIEW (1 Result: Elegantly Fills the Canvas)    */
            /* ───────────────────────────────────────────────────────────── */
            <SpotlightConcordanceCard
              pair={results[0]}
              activeTab={getCardTab(results[0].id)}
              onSelectTab={(tab) => setCardTab(results[0].id, tab)}
              isCopied={copiedId === results[0].id}
              onCopyArgument={() => handleCopyArgument(results[0])}
              getDeltaBadgeStyle={getDeltaBadgeStyle}
            />
          ) : (
            /* ───────────────────────────────────────────────────────────── */
            /* MULTI-RESULT GRID VIEW (2+ Results: Clean, Balanced Grid)     */
            /* ───────────────────────────────────────────────────────────── */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
              {results.map((pair) => (
                <GridConcordanceCard
                  key={pair.id}
                  pair={pair}
                  activeTab={getCardTab(pair.id)}
                  onSelectTab={(tab) => setCardTab(pair.id, tab)}
                  isCopied={copiedId === pair.id}
                  onCopyArgument={() => handleCopyArgument(pair)}
                  getDeltaBadgeStyle={getDeltaBadgeStyle}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: AI TRANSITION ADVISOR (Q&A)                            */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "qa" && (
        <div className="space-y-6">
          {/* Question Asking Box */}
          <div
            className="p-5 sm:p-6 rounded-2xl border space-y-4"
            style={{
              background: "var(--surface-raised)",
              borderColor: "var(--hairline)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "var(--brass-soft)", color: "var(--brass-bright)" }}
              >
                <HelpCircle size={18} />
              </div>
              <div className="space-y-0.5 flex-1">
                <h2 className="text-base font-semibold" style={{ color: "var(--ink)" }}>
                  Transition Advisor
                </h2>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={qaQuestion}
                onChange={(e) => setQaQuestion(e.target.value)}
                placeholder="Ask your question (e.g. Can police take custody after the first 15 days under Section 187 BNSS? What happened to Section 377 IPC in BNS? How do we prove electronic evidence without a Section 65B certificate?)..."
                rows={3}
                className="w-full p-3.5 pr-28 rounded-xl text-sm outline-none resize-none transition-all"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--hairline)",
                  color: "var(--ink)",
                }}
              />
              <button
                type="button"
                onClick={() => handleAskQuestion()}
                disabled={qaLoading || !qaQuestion.trim()}
                className="absolute right-3 bottom-3.5 px-4 py-2 text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 cursor-pointer rounded-lg shadow-xs"
                style={{
                  background: "var(--brass)",
                  color: "var(--on-primary)",
                }}
              >
                {qaLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Analyzing…</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Ask Advisor</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Suggested Questions */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                {CURATED_QUESTIONS.map((cq, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAskQuestion(cq)}
                    className="text-left px-3 py-1.5 rounded-lg text-xs transition-all hover:bg-muted/40 cursor-pointer"
                    style={{
                      background: "var(--surface)",
                      color: "var(--ink-dim)",
                      border: "1px solid var(--hairline-soft)",
                    }}
                  >
                    💬 {cq}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Q&A Loading State */}
          {qaLoading && (
            <div
              className="p-12 text-center rounded-2xl border border-dashed space-y-3 animate-pulse"
              style={{ borderColor: "var(--brass)", background: "var(--surface)" }}
            >
              <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center animate-spin text-amber-500">
                <Loader2 size={24} />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                Synthesizing Supreme Court Doctrine & Statutory Concordance…
              </h3>
              <p className="text-xs text-muted-foreground">
                Analyzing Article 20(1) retroactivity, Section 8 General Clauses Act, and BNSS procedural applicability.
              </p>
            </div>
          )}

          {/* Q&A Response Card */}
          {qaResponse && !qaLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl border space-y-5"
              style={{
                background: "var(--surface-raised)",
                borderColor: "var(--hairline)",
              }}
            >
              {/* Question Header */}
              <div className="space-y-1 pb-3 border-b border-border/40">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-semibold block">
                  Authoritative Legal Opinion:
                </span>
                <h3 className="text-base font-semibold" style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}>
                  {qaResponse.question}
                </h3>
              </div>

              {/* Authoritative Answer */}
              <div className="space-y-2">
                <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "var(--brass-bright)" }}>
                  <Scale size={14} />
                  <span>Statutory & Judicial Analysis:</span>
                </span>
                <div
                  className="text-sm leading-relaxed whitespace-pre-line p-4 rounded-xl"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--hairline)",
                    color: "var(--ink)",
                  }}
                >
                  {qaResponse.answer}
                </div>
              </div>

              {/* Governing Principles */}
              {qaResponse.governing_principles.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "var(--ink)" }}>
                    <Bookmark size={13} style={{ color: "var(--brass)" }} />
                    <span>Constitutional & Statutory Doctrines:</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {qaResponse.governing_principles.map((pr, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-3 rounded-xl text-xs flex items-start gap-2.5"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--hairline)",
                          color: "var(--ink-dim)",
                        }}
                      >
                        <ShieldCheck size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{pr}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Procedural Warnings */}
              {qaResponse.procedural_warnings.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold flex items-center gap-1.5 text-rose-400">
                    <AlertTriangle size={13} />
                    <span>Litigator Strategic Objections & Warnings:</span>
                  </span>
                  <div className="space-y-2">
                    {qaResponse.procedural_warnings.map((wr, wIdx) => (
                      <div
                        key={wIdx}
                        className="p-3.5 rounded-xl text-xs space-y-1"
                        style={{
                          background: "rgba(239, 68, 68, 0.08)",
                          border: "1px solid rgba(239, 68, 68, 0.22)",
                          color: "var(--ink)",
                        }}
                      >
                        <span className="font-semibold text-rose-400 block text-[11px] uppercase tracking-wider">
                          ⚠️ Strategic Court Action:
                        </span>
                        <span className="leading-relaxed text-rose-100/90">{wr}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Court-Ready Pleading Snippet */}
              {qaResponse.draft_pleading_snippet && (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "var(--brass-bright)" }}>
                      <FileText size={14} />
                      <span>Court-Ready Pleading Paragraph (Section 8 GCA Bridge):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyQAPleading(qaResponse.draft_pleading_snippet!)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all"
                      style={{
                        background: copiedPleading ? "var(--seal-disposed)" : "var(--brass-soft)",
                        color: copiedPleading ? "#ffffff" : "var(--brass-bright)",
                        border: "1px solid var(--hairline)",
                      }}
                    >
                      {copiedPleading ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedPleading ? "Copied Pleading" : "Copy for Petition"}</span>
                    </button>
                  </div>
                  <div
                    className="p-4 rounded-xl text-xs leading-relaxed font-serif"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--hairline)",
                      color: "var(--ink)",
                    }}
                  >
                    {qaResponse.draft_pleading_snippet}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: SPOTLIGHT CONCORDANCE CARD (For 1 Result)
// ─────────────────────────────────────────────────────────────────────────────
interface SpotlightProps {
  pair: StatuteConcordancePair;
  activeTab: "overview" | "precedents" | "pleading";
  onSelectTab: (tab: "overview" | "precedents" | "pleading") => void;
  isCopied: boolean;
  onCopyArgument: () => void;
  getDeltaBadgeStyle: (type?: string) => { bg: string; color: string; border: string; label: string };
}

const SpotlightConcordanceCard: React.FC<SpotlightProps> = ({
  pair,
  activeTab,
  onSelectTab,
  isCopied,
  onCopyArgument,
  getDeltaBadgeStyle,
}) => {
  const primaryDelta = pair.statutory_deltas[0];
  const deltaBadge = getDeltaBadgeStyle(primaryDelta?.delta_type);
  const isSameTitle =
    pair.old_title.trim().toLowerCase() === pair.new_title.trim().toLowerCase();

  return (
    <div
      className="p-5 sm:p-7 rounded-2xl border space-y-6 shadow-sm transition-all"
      style={{
        background: "var(--surface)",
        borderColor: "var(--hairline)",
      }}
    >
      {/* ── Top Bar: Badges & Quick Action ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border/30">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider font-semibold"
            style={{
              background:
                pair.category === "PROCEDURAL"
                  ? "rgba(59, 130, 246, 0.12)"
                  : pair.category === "SUBSTANTIVE"
                  ? "rgba(16, 185, 129, 0.12)"
                  : "rgba(168, 85, 247, 0.12)",
              color:
                pair.category === "PROCEDURAL"
                  ? "#60a5fa"
                  : pair.category === "SUBSTANTIVE"
                  ? "#34d399"
                  : "#c084fc",
              border: "1px solid var(--hairline)",
            }}
          >
            {pair.category} Concordance
          </span>

          <span
            className="px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider font-semibold"
            style={{
              background: deltaBadge.bg,
              color: deltaBadge.color,
              border: `1px solid ${deltaBadge.border}`,
            }}
          >
            {deltaBadge.label}
          </span>

          {pair.similarity_score && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded text-amber-500 bg-amber-500/10 border border-amber-500/20">
              InLegalBERT: {(pair.similarity_score * 100).toFixed(0)}% Match
            </span>
          )}
        </div>

        {/* Global Quick Copy Button */}
        <button
          onClick={onCopyArgument}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-medium text-xs transition-all cursor-pointer shadow-xs"
          style={{
            background: isCopied ? "var(--seal-disposed)" : "var(--brass-soft)",
            color: isCopied ? "#ffffff" : "var(--brass-bright)",
            border: "1px solid var(--hairline)",
          }}
          title="Copy Section 8 General Clauses Act court pleading"
        >
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
          <span>{isCopied ? "Copied Pleading" : "Copy Court Pleading"}</span>
        </button>
      </div>

      {/* ── Hero Statutory Transformation Bridge ── */}
      <div
        className="p-5 sm:p-6 rounded-2xl grid grid-cols-1 md:grid-cols-11 items-center gap-4 relative overflow-hidden"
        style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--hairline)",
        }}
      >
        {/* Unified Statutory Meaning (Shown once when titles match) */}
        {isSameTitle && (
          <div
            className="md:col-span-11 p-3.5 rounded-xl text-center border space-y-0.5"
            style={{
              background: "var(--surface)",
              borderColor: "var(--hairline)",
            }}
          >
            <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground block font-semibold">
              Subject Matter & Statutory Meaning
            </span>
            <div
              className="text-base sm:text-lg font-semibold"
              style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}
            >
              {pair.new_title || pair.old_title}
            </div>
          </div>
        )}

        {/* Left: Former Provision (Repealed Law) */}
        <div className="md:col-span-5 space-y-2 p-3 sm:p-4 rounded-xl" style={{ background: "var(--surface)" }}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono tracking-wider uppercase font-semibold text-amber-500/90">
              Repealed Enactment
            </span>
            <span
              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded"
              style={{ background: "var(--surface-raised)", color: "var(--ink)" }}
            >
              {pair.old_code}
            </span>
          </div>
          <div
            className="text-xl sm:text-2xl font-bold tracking-tight text-amber-500"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Section {pair.old_section}
          </div>
          {!isSameTitle && (
            <div className="text-xs text-muted-foreground line-clamp-2" title={pair.old_title}>
              {pair.old_title}
            </div>
          )}
        </div>

        {/* Middle: Transform Connector */}
        <div className="md:col-span-1 flex flex-col items-center justify-center py-2 md:py-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-md shrink-0"
            style={{
              background: "var(--brass-soft)",
              color: "var(--brass-bright)",
              border: "1px solid var(--hairline)",
            }}
          >
            <ArrowRight size={18} className="hidden md:block" />
            <ArrowLeftRight size={18} className="block md:hidden" />
          </div>
          <span className="text-[10px] font-mono mt-1 text-muted-foreground hidden md:block">
            Re-enacted
          </span>
        </div>

        {/* Right: Current Provision (Enacted Sanhita) */}
        <div className="md:col-span-5 space-y-2 p-3 sm:p-4 rounded-xl" style={{ background: "var(--surface)" }}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono tracking-wider uppercase font-semibold text-emerald-400">
              Current Enacted Law (2024)
            </span>
            <span
              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded"
              style={{ background: "var(--surface-raised)", color: "var(--ink)" }}
            >
              {pair.new_code}
            </span>
          </div>
          <div
            className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-400"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Section {pair.new_section}
          </div>
          {!isSameTitle && (
            <div className="text-xs text-muted-foreground line-clamp-2" title={pair.new_title}>
              {pair.new_title}
            </div>
          )}
        </div>
      </div>

      {/* ── Segmented Dossier Tabs (Cleaner than stacking dense paragraphs) ── */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <div
            className="p-1 rounded-xl border flex items-center justify-center gap-1 w-full sm:w-auto inline-flex overflow-x-auto scrollbar-none"
            style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}
          >
            {[
              { id: "overview", label: "Doctrine & Operational Deltas", icon: <Info size={14} /> },
              { id: "precedents", label: `Landmark Precedents (${pair.landmark_precedents.length})`, icon: <Gavel size={14} /> },
              { id: "pleading", label: "Court Pleading Paragraph", icon: <FileText size={14} /> },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id as any)}
                  className="relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-2 select-none whitespace-nowrap"
                >
                  {isSelected && (
                    <motion.div
                      layoutId={`spotlight-tab-pill-${pair.id}`}
                      className="absolute inset-0 rounded-lg z-0"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      style={{
                        background: "var(--surface)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      }}
                    />
                  )}
                  <span
                    className="relative z-10 flex items-center gap-1.5"
                    style={{
                      color: isSelected ? "var(--ink)" : "var(--ink-dim)",
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    <span style={{ color: isSelected ? "var(--brass-bright)" : "var(--ink-faint)" }}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab Panels ── */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-4"
            >
              {/* Concept Doctrine */}
              <div
                className="p-4 sm:p-5 rounded-2xl border space-y-2"
                style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}
              >
                <div className="flex items-center gap-2">
                  <Scale size={15} style={{ color: "var(--brass-bright)" }} />
                  <h3 className="text-sm font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                    {pair.concept_doctrine}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  {pair.doctrine_summary}
                </p>
              </div>

              {/* Litigator Warning & Operational Deltas */}
              {pair.statutory_deltas.length > 0 && (
                <div className="space-y-3">
                  {pair.statutory_deltas.map((delta, dIdx) => (
                    <div
                      key={dIdx}
                      className="p-4 sm:p-5 rounded-2xl border space-y-2.5"
                      style={{
                        background: "rgba(245, 158, 11, 0.05)",
                        borderColor: "rgba(245, 158, 11, 0.25)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-amber-500">
                          {delta.provision_name}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {delta.delta_type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                        {delta.details}
                      </p>
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-xs">
                        <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <strong className="text-amber-400 block text-[11px] uppercase tracking-wider">
                            Litigator Strategic Warning:
                          </strong>
                          <span className="text-amber-200/90 leading-relaxed">
                            {delta.litigator_warning}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "precedents" && (
            <motion.div
              key="precedents"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-3"
            >
              {pair.landmark_precedents.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed text-xs text-muted-foreground">
                  No landmark precedents specifically mapped for this section. Standard Section 8 GCA pari materia rules apply.
                </div>
              ) : (
                pair.landmark_precedents.map((prec, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-4 sm:p-5 rounded-2xl border space-y-2"
                    style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Gavel size={15} style={{ color: "var(--brass-bright)" }} />
                        <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                          {prec.title}
                        </span>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted/40 text-muted-foreground border border-border/40">
                        {prec.citation}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-amber-500/90">
                      Court: {prec.court} · Binding Law Under Article 141
                    </div>
                    {prec.ratio && (
                      <div className="p-3 rounded-xl bg-muted/30 border border-border/40 text-xs italic leading-relaxed text-muted-foreground">
                        “{prec.ratio}”
                      </div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === "pleading" && (
            <motion.div
              key="pleading"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-3"
            >
              <div
                className="p-5 sm:p-6 rounded-2xl border space-y-3"
                style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText size={15} style={{ color: "var(--brass-bright)" }} />
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink)" }}>
                      Transposed Pleading Paragraph (Section 8 GCA)
                    </span>
                  </div>
                  <button
                    onClick={onCopyArgument}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all shadow-xs"
                    style={{
                      background: isCopied ? "var(--seal-disposed)" : "var(--brass)",
                      color: isCopied ? "#ffffff" : "var(--on-primary)",
                    }}
                  >
                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{isCopied ? "Copied" : "Copy Paragraph"}</span>
                  </button>
                </div>
                <div
                  className="p-4 rounded-xl text-xs sm:text-sm leading-relaxed font-serif"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--hairline)",
                    color: "var(--ink)",
                  }}
                >
                  {buildPleadingText(pair)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: GRID CONCORDANCE CARD (For 2+ Results: Compact & Uncluttered)
// ─────────────────────────────────────────────────────────────────────────────
interface GridProps {
  pair: StatuteConcordancePair;
  activeTab: "overview" | "precedents" | "pleading";
  onSelectTab: (tab: "overview" | "precedents" | "pleading") => void;
  isCopied: boolean;
  onCopyArgument: () => void;
  getDeltaBadgeStyle: (type?: string) => { bg: string; color: string; border: string; label: string };
}

const GridConcordanceCard: React.FC<GridProps> = ({
  pair,
  activeTab,
  onSelectTab,
  isCopied,
  onCopyArgument,
  getDeltaBadgeStyle,
}) => {
  const primaryDelta = pair.statutory_deltas[0];
  const deltaBadge = getDeltaBadgeStyle(primaryDelta?.delta_type);
  const isSameTitle =
    pair.old_title.trim().toLowerCase() === pair.new_title.trim().toLowerCase();

  return (
    <div
      className="p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all shadow-xs hover:border-[var(--hairline-strong)]"
      style={{
        background: "var(--surface)",
        borderColor: "var(--hairline)",
      }}
    >
      <div className="space-y-4">
        {/* Card Header: Category & Transformation */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold"
            style={{
              background:
                pair.category === "PROCEDURAL"
                  ? "rgba(59, 130, 246, 0.12)"
                  : pair.category === "SUBSTANTIVE"
                  ? "rgba(16, 185, 129, 0.12)"
                  : "rgba(168, 85, 247, 0.12)",
              color:
                pair.category === "PROCEDURAL"
                  ? "#60a5fa"
                  : pair.category === "SUBSTANTIVE"
                  ? "#34d399"
                  : "#c084fc",
              border: "1px solid var(--hairline)",
            }}
          >
            {pair.category}
          </span>

          <span
            className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold"
            style={{
              background: deltaBadge.bg,
              color: deltaBadge.color,
              border: `1px solid ${deltaBadge.border}`,
            }}
          >
            {deltaBadge.label}
          </span>
        </div>

        {/* Compact Side-by-Side Transition Bar */}
        <div
          className="p-3.5 rounded-xl space-y-2"
          style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--hairline)",
          }}
        >
          {isSameTitle && (
            <div className="text-center text-xs font-semibold text-[var(--ink)] pb-1.5 border-b border-border/30 line-clamp-2">
              {pair.new_title || pair.old_title}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-0.5">
              <span className="text-[10px] font-mono text-muted-foreground block">{pair.old_code}</span>
              <div
                className="text-base font-bold text-amber-500 break-words leading-snug"
                style={{ fontFamily: "var(--font-display)" }}
                title={`Section ${pair.old_section}`}
              >
                Section {pair.old_section}
              </div>
              {!isSameTitle && (
                <div className="text-[11px] text-muted-foreground line-clamp-2" title={pair.old_title}>
                  {pair.old_title}
                </div>
              )}
            </div>

            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-xs"
              style={{
                background: "var(--brass-soft)",
                color: "var(--brass-bright)",
                border: "1px solid var(--hairline)",
              }}
            >
              <ArrowRight size={13} />
            </div>

            <div className="flex-1 min-w-0 space-y-0.5 text-right">
              <span className="text-[10px] font-mono text-muted-foreground block">{pair.new_code}</span>
              <div
                className="text-base font-bold text-emerald-400 break-words leading-snug"
                style={{ fontFamily: "var(--font-display)" }}
                title={`Section ${pair.new_section}`}
              >
                Section {pair.new_section}
              </div>
              {!isSameTitle && (
                <div className="text-[11px] text-muted-foreground line-clamp-2" title={pair.new_title}>
                  {pair.new_title}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Doctrine Summary */}
        <div className="space-y-1">
          <h4 className="text-xs font-semibold" style={{ color: "var(--ink)" }}>
            {pair.concept_doctrine}
          </h4>
          <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: "var(--ink-dim)" }}>
            {pair.doctrine_summary}
          </p>
        </div>

        {/* Mini Tab Switcher */}
        <div
          className="p-1 rounded-lg border flex items-center gap-1 text-[11px]"
          style={{ background: "var(--surface-raised)", borderColor: "var(--hairline-soft)" }}
        >
          <button
            type="button"
            onClick={() => onSelectTab("overview")}
            className={`flex-1 py-1 rounded text-center font-medium transition-all cursor-pointer ${
              activeTab === "overview" ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs" : "text-muted-foreground"
            }`}
          >
            Deltas ({pair.statutory_deltas.length})
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("precedents")}
            className={`flex-1 py-1 rounded text-center font-medium transition-all cursor-pointer ${
              activeTab === "precedents" ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs" : "text-muted-foreground"
            }`}
          >
            Precedents ({pair.landmark_precedents.length})
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("pleading")}
            className={`flex-1 py-1 rounded text-center font-medium transition-all cursor-pointer ${
              activeTab === "pleading" ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs" : "text-muted-foreground"
            }`}
          >
            Pleading
          </button>
        </div>

        {/* Mini Content Panel */}
        <div className="min-h-[72px]">
          {activeTab === "overview" && (
            <div className="text-xs space-y-1.5">
              {primaryDelta ? (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200/90">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-400 text-[11px] mb-0.5">
                    <AlertTriangle size={12} />
                    <span>{primaryDelta.provision_name}</span>
                  </div>
                  <p className="line-clamp-2 text-[11px]">{primaryDelta.litigator_warning}</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">Direct statutory transposition under Section 8 GCA.</p>
              )}
            </div>
          )}

          {activeTab === "precedents" && (
            <div className="text-xs space-y-1">
              {pair.landmark_precedents.length > 0 ? (
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                  <div className="font-semibold text-xs text-[var(--ink)] truncate">
                    {pair.landmark_precedents[0].title}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {pair.landmark_precedents[0].citation}
                  </div>
                  {pair.landmark_precedents[0].ratio && (
                    <p className="text-[11px] line-clamp-1 italic text-muted-foreground mt-0.5">
                      “{pair.landmark_precedents[0].ratio}”
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">No specific landmark precedents mapped.</p>
              )}
            </div>
          )}

          {activeTab === "pleading" && (
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 font-serif text-[11px] line-clamp-3 leading-relaxed text-muted-foreground">
              {buildPleadingText(pair)}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs">
        <span className="text-[11px] text-muted-foreground">Section 8 GCA Continuity</span>
        <button
          onClick={onCopyArgument}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer shadow-xs"
          style={{
            background: isCopied ? "var(--seal-disposed)" : "var(--brass-soft)",
            color: isCopied ? "#ffffff" : "var(--brass-bright)",
            border: "1px solid var(--hairline)",
          }}
        >
          {isCopied ? <Check size={13} /> : <Copy size={13} />}
          <span>{isCopied ? "Copied" : "Copy Pleading"}</span>
        </button>
      </div>
    </div>
  );
};
