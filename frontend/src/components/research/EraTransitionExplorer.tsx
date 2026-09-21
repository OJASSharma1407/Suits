import React, { useState, useEffect } from "react";
import {
  Search,
  ArrowLeftRight,
  Scale,
  BookOpen,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Gavel,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { eraTransitionService } from "@/services/eraTransition";
import type { StatuteConcordancePair } from "@/types/era_transition";

const CATEGORIES = [
  { id: "ALL", label: "All Provisions" },
  { id: "PROCEDURAL", label: "CrPC ⇄ BNSS", sub: "Procedural" },
  { id: "SUBSTANTIVE", label: "IPC ⇄ BNS", sub: "Substantive" },
  { id: "EVIDENTIARY", label: "IEA ⇄ BSA", sub: "Evidentiary" },
];

export const EraTransitionExplorer: React.FC = () => {
  const [query, setQuery] = useState<string>("438");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [results, setResults] = useState<StatuteConcordancePair[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const doSearch = async (q: string) => {
    setLoading(true);
    try {
      const resp = await eraTransitionService.lookupConcordance(q || "438", 24);
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

  useEffect(() => {
    doSearch("438");
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    doSearch("");
  };

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyArgument = (pair: StatuteConcordancePair) => {
    const landmark = pair.landmark_precedents[0];
    const text =
      `It is respectfully submitted before this Hon'ble Court that while the instant proceeding is styled ` +
      `under ${pair.new_code} Section ${pair.new_section}, the governing constitutional and statutory principle is squarely ` +
      `settled by the Hon'ble Supreme Court in ${landmark?.title || "landmark precedent"} [${landmark?.citation || ""}]. ` +
      `By operation of Section 8 of the General Clauses Act, 1897, where any Central Act repeals and re-enacts with or ` +
      `without modification any provision of a former enactment, references to the repealed provision shall be construed ` +
      `as references to the provision so re-enacted. Furthermore, ${pair.new_code} Section ${pair.new_section} maintains ` +
      `pari materia identity with erstwhile ${pair.old_code} Section ${pair.old_section}. Consequently, the ratio decidendi ` +
      `in ${landmark?.title || ""}—mandating that ${landmark?.ratio || pair.doctrine_summary}—remains binding under ` +
      `Article 141 of the Constitution of India and strictly governs the adjudication of this matter.`;

    navigator.clipboard.writeText(text);
    setCopiedId(pair.id);
    toast.success(`Copied Section 8 transposition argument for Section ${pair.new_section} ${pair.new_code}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredResults = results.filter((pair) => {
    if (categoryFilter === "ALL") return true;
    return pair.category === categoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "var(--brass-soft)",
                color: "var(--brass-bright)",
                border: "1px solid var(--hairline)",
              }}
            >
              <ArrowLeftRight size={18} />
            </div>
            <h1
              className="text-2xl font-medium"
              style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}
            >
              Criminal Law Transition
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto pl-11 sm:pl-0">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono"
            style={{
              background: "var(--surface-container)",
              color: "var(--seal-disposed)",
              border: "1px solid var(--hairline)",
            }}
          >
            <Sparkles size={12} />
            Enacted 1 July 2024
          </span>
        </div>
      </div>

      {/* ── Search & Filter Section ── */}
      <div className="space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2.5">
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
              placeholder="Search by section (e.g. 438, 41A, 302, 65B) or doctrine (e.g. anticipatory bail, circumstantial evidence)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-lg text-sm transition-all outline-none"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary px-5 py-2.5 text-sm font-medium shrink-0 disabled:opacity-50"
            style={{
              background: "var(--brass)",
              color: "var(--on-primary)",
              borderRadius: "var(--radius)",
            }}
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {/* Filter Pills & Result Count */}
        <div className="flex items-center justify-between gap-4 flex-wrap pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => {
              const isSelected = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "shadow-xs"
                      : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                  }`}
                  style={{
                    background: isSelected ? "var(--brass)" : "var(--surface-container)",
                    color: isSelected ? "var(--on-primary)" : "var(--ink-dim)",
                    border: isSelected
                      ? "1px solid var(--brass)"
                      : "1px solid var(--hairline-soft)",
                  }}
                >
                  <span>{cat.label}</span>
                  {cat.sub && !isSelected && (
                    <span
                      className="text-[10px] font-normal"
                      style={{ color: "var(--ink-faint)" }}
                    >
                      ({cat.sub})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div
            className="text-xs font-mono"
            style={{ color: "var(--ink-faint)" }}
          >
            {loading ? "Loading…" : `${filteredResults.length} matching provisions`}
          </div>
        </div>
      </div>

      {/* ── Results Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="card-float p-6 h-64 animate-pulse"
              style={{
                borderRadius: "var(--radius-md)",
                background: "var(--surface-raised)",
                borderColor: "var(--hairline-soft)",
              }}
            />
          ))}
        </div>
      ) : filteredResults.length === 0 ? (
        <div
          className="p-12 text-center rounded-xl border border-dashed space-y-3"
          style={{ borderColor: "var(--hairline)", background: "var(--surface)" }}
        >
          <div
            className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
            style={{ background: "var(--brass-soft)", color: "var(--brass)" }}
          >
            <Scale size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-medium" style={{ color: "var(--ink)" }}>
              No statutory concordance matches found
            </h3>
            <p className="text-xs max-w-md mx-auto" style={{ color: "var(--ink-dim)" }}>
              Try searching for another section number (e.g. 438, 482, 420, 302) or legal concept
              like anticipatory bail, custody, or electronic records.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredResults.map((pair) => {
            const isExpanded = expandedCards[pair.id] ?? false;
            const isCopied = copiedId === pair.id;

            return (
              <div
                key={pair.id}
                className="card-float group p-6 flex flex-col justify-between gap-5 transition-all"
                style={{ borderRadius: "var(--radius-md)" }}
              >
                <div className="space-y-4">
                  {/* Top Metadata Badge Row */}
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono tracking-wide uppercase"
                      style={{
                        background: "var(--surface-container)",
                        color: "var(--ink-dim)",
                        border: "1px solid var(--hairline-soft)",
                      }}
                    >
                      {pair.category}
                    </span>

                    {pair.similarity_score && (
                      <span
                        className="text-[11px] font-mono"
                        style={{ color: "var(--brass)" }}
                      >
                        InLegalBERT: {(pair.similarity_score * 100).toFixed(0)}% match
                      </span>
                    )}
                  </div>

                  {/* Concordance Bridge Display */}
                  <div
                    className="p-4 rounded-lg flex items-center justify-between gap-4"
                    style={{
                      background: "var(--surface-container)",
                      border: "1px solid var(--hairline-soft)",
                    }}
                  >
                    {/* Erstwhile Provision */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <span
                        className="text-[10px] font-mono font-medium tracking-wider uppercase block"
                        style={{ color: "var(--ink-faint)" }}
                      >
                        {pair.old_code}
                      </span>
                      <div
                        className="text-base font-semibold leading-snug"
                        style={{ color: "var(--seal-pending)", fontFamily: "var(--font-display)" }}
                      >
                        Section {pair.old_section}
                      </div>
                      <div
                        className="text-xs line-clamp-2"
                        style={{ color: "var(--ink-dim)" }}
                        title={pair.old_title}
                      >
                        {pair.old_title}
                      </div>
                    </div>

                    {/* Bridge Icon */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: "var(--brass-soft)",
                        color: "var(--brass)",
                        border: "1px solid var(--hairline)",
                      }}
                    >
                      <ArrowLeftRight size={14} />
                    </div>

                    {/* Enacted Provision */}
                    <div className="flex-1 min-w-0 space-y-1 text-right">
                      <span
                        className="text-[10px] font-mono font-medium tracking-wider uppercase block"
                        style={{ color: "var(--ink-faint)" }}
                      >
                        {pair.new_code}
                      </span>
                      <div
                        className="text-base font-semibold leading-snug"
                        style={{ color: "var(--seal-disposed)", fontFamily: "var(--font-display)" }}
                      >
                        Section {pair.new_section}
                      </div>
                      <div
                        className="text-xs line-clamp-2"
                        style={{ color: "var(--ink-dim)" }}
                        title={pair.new_title}
                      >
                        {pair.new_title}
                      </div>
                    </div>
                  </div>

                  {/* Doctrine & Summary */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Scale size={13} style={{ color: "var(--brass)" }} />
                      <h3
                        className="text-xs font-semibold tracking-tight"
                        style={{ color: "var(--ink)" }}
                      >
                        {pair.concept_doctrine}
                      </h3>
                    </div>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--ink-dim)" }}
                    >
                      {pair.doctrine_summary}
                    </p>
                  </div>

                  {/* Governing Landmark Precedent */}
                  {pair.landmark_precedents.length > 0 && (
                    <div
                      className="p-3 rounded-lg flex items-start gap-2.5"
                      style={{
                        background: "var(--surface-raised)",
                        border: "1px solid var(--hairline-soft)",
                      }}
                    >
                      <Gavel
                        size={14}
                        className="shrink-0 mt-0.5"
                        style={{ color: "var(--brass)" }}
                      />
                      <div className="min-w-0 space-y-0.5">
                        <span
                          className="text-[10px] font-mono uppercase tracking-wider block"
                          style={{ color: "var(--ink-faint)" }}
                        >
                          Governing Landmark Precedent:
                        </span>
                        <div
                          className="text-xs font-medium"
                          style={{ color: "var(--ink)" }}
                        >
                          {pair.landmark_precedents[0].title}{" "}
                          <span
                            className="font-mono font-normal text-[11px]"
                            style={{ color: "var(--ink-faint)" }}
                          >
                            [{pair.landmark_precedents[0].citation}]
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div
                  className="pt-3.5 border-t flex items-center justify-between gap-3 text-xs"
                  style={{ borderColor: "var(--hairline-soft)" }}
                >
                  <button
                    onClick={() => toggleExpand(pair.id)}
                    className="flex items-center gap-1.5 font-medium transition-colors hover:opacity-80 cursor-pointer"
                    style={{ color: "var(--brass)" }}
                  >
                    <span>
                      {isExpanded ? "Hide" : "View"} Deltas & Warnings
                      {pair.statutory_deltas.length > 0 && ` (${pair.statutory_deltas.length})`}
                    </span>
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  <button
                    onClick={() => handleCopyArgument(pair)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs transition-all cursor-pointer"
                    style={{
                      background: isCopied ? "var(--seal-disposed)" : "var(--brass-soft)",
                      color: isCopied ? "#ffffff" : "var(--brass-bright)",
                      border: "1px solid var(--hairline)",
                    }}
                    title="Copy Section 8 General Clauses Act transposed argument"
                  >
                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{isCopied ? "Copied Pleading" : "Copy Court Pleading"}</span>
                  </button>
                </div>

                {/* Expandable Statutory Deltas */}
                <AnimatePresence>
                  {isExpanded && pair.statutory_deltas.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2.5 pt-2 border-t overflow-hidden"
                      style={{ borderColor: "var(--hairline-soft)" }}
                    >
                      <span
                        className="text-[10px] font-mono font-semibold uppercase tracking-wider block"
                        style={{ color: "var(--ink-faint)" }}
                      >
                        Statutory Variations in 2023 Enactment:
                      </span>
                      {pair.statutory_deltas.map((delta, dIdx) => (
                        <div
                          key={dIdx}
                          className="p-3 rounded-lg text-xs space-y-1.5"
                          style={{
                            background: "rgba(150, 114, 26, 0.06)",
                            border: "1px solid rgba(150, 114, 26, 0.22)",
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="font-semibold"
                              style={{ color: "var(--seal-pending)" }}
                            >
                              {delta.provision_name}
                            </span>
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase"
                              style={{
                                background: "var(--surface-container)",
                                color: "var(--ink-dim)",
                              }}
                            >
                              {delta.delta_type.replace("_", " ")}
                            </span>
                          </div>
                          <p style={{ color: "var(--ink-dim)" }}>{delta.details}</p>
                          <div
                            className="flex items-start gap-1.5 font-medium text-[11px] pt-1"
                            style={{ color: "var(--seal-pending)" }}
                          >
                            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                            <span>Litigator Warning: {delta.litigator_warning}</span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
