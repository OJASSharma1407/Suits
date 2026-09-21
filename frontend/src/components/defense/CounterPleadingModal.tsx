import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Shield,
  ShieldAlert,
  Gavel,
  Scale,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  BookOpen,
  Info,
  CheckSquare,
  Square,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { defenseService } from "@/services/defenseService";
import { documentService } from "@/services/document";
import type {
  AnalyzePlaintResponse,
  DefenseStrategy,
  StatutoryBar,
  WrittenStatementResponse,
} from "@/types/defense";
import type { UserDocument } from "@/types/document";

interface CounterPleadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInEditor: (draft: { title: string; content: string }) => void;
  preselectedDocId?: string;
}

const SAMPLE_COMMERCIAL_PLAINT = `IN THE COURT OF THE DISTRICT JUDGE (COMMERCIAL), DELHI
CS (COMM) NO. 412 OF 2026

IN THE MATTER OF:
ALPHA TECH ENTERPRISES PVT. LTD.
...PLAINTIFF
VERSUS
BETA INDUSTRIAL SOLUTIONS LLP
...DEFENDANT

COMMERCIAL SUIT FOR RECOVERY OF RS. 45,00,000/- ALONG WITH INTEREST

MOST RESPECTFULLY SHEWETH:
1. That the Plaintiff is a private limited company incorporated under the Companies Act, 2013 having its registered office at Connaught Place, New Delhi.
2. That the Defendant is a limited liability partnership firm having its office at Okhla Industrial Area, New Delhi.
3. That in the month of March 2020, the Plaintiff supplied industrial hardware to the Defendant pursuant to Purchase Order No. 441.
4. That the Defendant failed to make payment of Invoice No. 892 dated 14.04.2020 amounting to Rs. 45,00,000/- despite repeated demands and reminders.
5. That the Defendant has breached the contractual terms and committed deliberate default, thereby causing substantial financial loss to the Plaintiff.
6. That the cause of action firstly arose on 14.04.2020 when the invoice was raised and continues to subsist.
7. That this Hon'ble Court has territorial and pecuniary jurisdiction to try the present commercial suit.
8. That the suit is valued at Rs. 45,00,000/- and requisite court fees have been paid.

PRAYER:
Wherefore it is prayed that a decree for Rs. 45,00,000/- be passed in favour of Plaintiff and against Defendant.`;

export function CounterPleadingModal({
  isOpen,
  onClose,
  onOpenInEditor,
  preselectedDocId,
}: CounterPleadingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Step 1 states
  const [rawText, setRawText] = useState(SAMPLE_COMMERCIAL_PLAINT);
  const [vaultDocs, setVaultDocs] = useState<UserDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(preselectedDocId || "");

  // Step 2 states
  const [analysis, setAnalysis] = useState<AnalyzePlaintResponse | null>(null);
  const [courtName, setCourtName] = useState("");
  const [suitNumber, setSuitNumber] = useState("");
  const [plaintiff, setPlaintiff] = useState("");
  const [defendant, setDefendant] = useState("");
  const [bars, setBars] = useState<StatutoryBar[]>([]);
  const [strategy, setStrategy] = useState<DefenseStrategy>("aggressive_denial");
  const [advocateNotes, setAdvocateNotes] = useState(
    "Goods delivered were severely defective and rejected within 48 hours vide written communication dated 16.04.2020."
  );

  // Step 3 states
  const [generatedWs, setGeneratedWs] = useState<WrittenStatementResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"full" | "traversals" | "objections">("full");

  // Fetch vault documents on mount
  useEffect(() => {
    if (isOpen) {
      documentService
        .list()
        .then((docs) => setVaultDocs(docs))
        .catch(() => {});
      if (preselectedDocId) {
        setSelectedDocId(preselectedDocId);
      }
    }
  }, [isOpen, preselectedDocId]);

  if (!isOpen) return null;

  // ─────────────────────────────────────────── Step 1: Analyze ──
  const handleAnalyze = async () => {
    if (!rawText.trim() && !selectedDocId) {
      toast.error("Please paste plaint text or select a document from your vault.");
      return;
    }

    setLoading(true);
    try {
      const res = await defenseService.analyzePlaint({
        document_id: selectedDocId || undefined,
        raw_text: selectedDocId ? undefined : rawText,
      });

      setAnalysis(res);
      setCourtName(res.court_name);
      setSuitNumber(res.suit_number);
      setPlaintiff(res.plaintiff);
      setDefendant(res.defendant);
      setBars(res.detected_bars);
      setStep(2);
      toast.success(
        `Parsed ${res.total_paragraphs} paragraphs & identified ${res.detected_bars.length} threshold statutory bars.`
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to analyze plaint.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────── Step 2: Generate ──
  const handleGenerate = async () => {
    if (!analysis) return;

    setLoading(true);
    try {
      const res = await defenseService.generateWrittenStatement({
        court_name: courtName || analysis.court_name,
        suit_number: suitNumber || analysis.suit_number,
        plaintiff: plaintiff || analysis.plaintiff,
        defendant: defendant || analysis.defendant,
        selected_bars: bars,
        paragraphs: analysis.paragraphs,
        defense_strategy: strategy,
        advocate_notes: advocateNotes || undefined,
      });

      setGeneratedWs(res);
      setStep(3);
      toast.success("Court-ready Written Statement synthesized successfully!");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to generate Written Statement."
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleBar = (barId: string) => {
    setBars((prev) =>
      prev.map((b) => (b.bar_id === barId ? { ...b, is_selected: !b.is_selected } : b))
    );
  };

  const handleCopyDraft = () => {
    if (!generatedWs) return;
    const cleanText = generatedWs.full_draft_html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    navigator.clipboard.writeText(cleanText);
    setIsCopied(true);
    toast.success("Draft copied to clipboard.");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleInjectIntoEditor = () => {
    if (!generatedWs) return;
    onOpenInEditor({
      title: generatedWs.title || "Written Statement (Order VIII CPC)",
      content: generatedWs.full_draft_html,
    });
    toast.success("Written Statement loaded into Legal Editor!");
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100005] flex items-center justify-center p-3 sm:p-6 animate-fade-in bg-black/75 backdrop-blur-md">
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-[var(--hairline)]"
        style={{ background: "var(--surface)", color: "var(--ink)" }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0"
          style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                color: "#ffffff",
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                  Adversarial Defense Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  Order VIII CPC
                </span>
              </div>
              <p className="text-xs text-[var(--ink-faint)]">
                Automated Paragraph-by-Paragraph Traversal & Statutory Bar Analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Step Indicators */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[var(--ink-dim)]">
              <span
                className={`px-2.5 py-1 rounded-lg border ${
                  step === 1
                    ? "border-indigo-500 text-indigo-500 bg-indigo-500/10 font-bold"
                    : "border-[var(--hairline)] opacity-60"
                }`}
              >
                1. Plaint
              </span>
              <ArrowRight size={12} className="opacity-40" />
              <span
                className={`px-2.5 py-1 rounded-lg border ${
                  step === 2
                    ? "border-indigo-500 text-indigo-500 bg-indigo-500/10 font-bold"
                    : "border-[var(--hairline)] opacity-60"
                }`}
              >
                2. Strategy & Bars
              </span>
              <ArrowRight size={12} className="opacity-40" />
              <span
                className={`px-2.5 py-1 rounded-lg border ${
                  step === 3
                    ? "border-indigo-500 text-indigo-500 bg-indigo-500/10 font-bold"
                    : "border-[var(--hairline)] opacity-60"
                }`}
              >
                3. WS Draft
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[var(--ink-dim)]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* ────────────────── STEP 1: INGESTION ────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--ink)]">
                    Step 1: Ingest Opposing Plaint / Petition
                  </h4>
                  <p className="text-xs text-[var(--ink-faint)] mt-0.5">
                    Paste the plaint text or select an uploaded PDF from your document vault.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDocId("");
                    setRawText(SAMPLE_COMMERCIAL_PLAINT);
                    toast.info("Loaded sample Commercial Plaint");
                  }}
                  className="text-xs px-2.5 py-1 rounded-md border border-[var(--hairline)] text-indigo-500 hover:bg-indigo-500/10 transition-colors"
                >
                  Load Sample Plaint
                </button>
              </div>

              {vaultDocs.length > 0 && (
                <div
                  className="p-3.5 rounded-xl border border-[var(--hairline)] space-y-2"
                  style={{ background: "var(--surface-raised)" }}
                >
                  <label className="text-xs font-semibold text-[var(--ink-dim)] flex items-center gap-1.5">
                    <FileText size={13} className="text-indigo-500" />
                    Select from Document Vault (Optional)
                  </label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] outline-none"
                  >
                    <option value="">-- Or paste plaint text directly below --</option>
                    {vaultDocs.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.original_filename} ({doc.tag})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!selectedDocId && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[var(--ink-dim)]">
                    <label className="font-semibold">Plaint / Petition Text</label>
                    <span className="font-mono text-[11px] text-[var(--ink-faint)]">
                      {rawText.length.toLocaleString()} characters
                    </span>
                  </div>
                  <textarea
                    rows={12}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste the opposing party's plaint, petition, or claim here..."
                    className="w-full text-xs p-3.5 rounded-xl border border-[var(--hairline)] bg-[var(--surface-raised)] text-[var(--ink)] font-mono leading-relaxed outline-none focus:border-indigo-500 transition-colors resize-y custom-scrollbar"
                  />
                </div>
              )}

              <div
                className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-start gap-3"
              >
                <Info size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-[var(--ink-dim)] leading-relaxed">
                  <strong>Zero Token Overhead:</strong> Paragraph chunking and statutory bar checks
                  (Section 12A CCA, Limitation Act, Order VII Rule 11) run deterministically without
                  spending AI tokens.
                </div>
              </div>
            </div>
          )}

          {/* ────────────────── STEP 2: STRATEGY & BARS ────────────────── */}
          {step === 2 && analysis && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  className="p-3 rounded-xl border border-[var(--hairline)]"
                  style={{ background: "var(--surface-raised)" }}
                >
                  <div className="text-[11px] text-[var(--ink-faint)]">Total Paragraphs</div>
                  <div className="text-lg font-bold text-[var(--ink)] mt-0.5">
                    {analysis.total_paragraphs}
                  </div>
                </div>
                <div
                  className="p-3 rounded-xl border border-[var(--hairline)]"
                  style={{ background: "var(--surface-raised)" }}
                >
                  <div className="text-[11px] text-[var(--ink-faint)]">Substantive Allegations</div>
                  <div className="text-lg font-bold text-indigo-500 mt-0.5">
                    {analysis.substantive_count}
                  </div>
                </div>
                <div
                  className="p-3 rounded-xl border border-[var(--hairline)]"
                  style={{ background: "var(--surface-raised)" }}
                >
                  <div className="text-[11px] text-[var(--ink-faint)]">Formal Averments</div>
                  <div className="text-lg font-bold text-emerald-500 mt-0.5">
                    {analysis.total_paragraphs - analysis.substantive_count}
                  </div>
                </div>
                <div
                  className="p-3 rounded-xl border border-[var(--hairline)]"
                  style={{ background: "var(--surface-raised)" }}
                >
                  <div className="text-[11px] text-[var(--ink-faint)]">Detected Legal Bars</div>
                  <div className="text-lg font-bold text-amber-500 mt-0.5">
                    {bars.length}
                  </div>
                </div>
              </div>

              {/* Court & Parties Info */}
              <div
                className="p-4 rounded-xl border border-[var(--hairline)] space-y-3"
                style={{ background: "var(--surface-raised)" }}
              >
                <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-dim)]">
                  Court & Case Details
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[var(--ink-faint)] block mb-1">
                      Court Name
                    </label>
                    <input
                      type="text"
                      value={courtName}
                      onChange={(e) => setCourtName(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--ink-faint)] block mb-1">
                      Suit / Petition Number
                    </label>
                    <input
                      type="text"
                      value={suitNumber}
                      onChange={(e) => setSuitNumber(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--ink-faint)] block mb-1">Plaintiff</label>
                    <input
                      type="text"
                      value={plaintiff}
                      onChange={(e) => setPlaintiff(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--ink-faint)] block mb-1">Defendant</label>
                    <input
                      type="text"
                      value={defendant}
                      onChange={(e) => setDefendant(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Detected Statutory Bars */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-dim)] flex items-center gap-1.5">
                    <Scale size={14} className="text-amber-500" />
                    Detected Preliminary Legal Bars ({bars.filter((b) => b.is_selected).length} selected)
                  </h5>
                  <span className="text-[11px] text-[var(--ink-faint)]">
                    Will be incorporated into Section I (Preliminary Objections)
                  </span>
                </div>

                <div className="space-y-2.5">
                  {bars.map((bar) => (
                    <div
                      key={bar.bar_id}
                      onClick={() => toggleBar(bar.bar_id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        bar.is_selected
                          ? "border-amber-500/40 bg-amber-500/5 shadow-sm"
                          : "border-[var(--hairline)] opacity-60 bg-[var(--surface-raised)]"
                      }`}
                    >
                      <button type="button" className="mt-0.5 text-amber-500 flex-shrink-0">
                        {bar.is_selected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[var(--ink)]">{bar.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            {bar.statute}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ink-dim)] mt-1">{bar.description}</p>
                        <p className="text-[11px] font-mono text-indigo-500 mt-1">
                          Authority: {bar.precedent}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Defense Stance & Advocate Instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className="p-4 rounded-xl border border-[var(--hairline)] space-y-2.5"
                  style={{ background: "var(--surface-raised)" }}
                >
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-dim)]">
                    Defense Pleading Stance
                  </label>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="strategy"
                        value="aggressive_denial"
                        checked={strategy === "aggressive_denial"}
                        onChange={() => setStrategy("aggressive_denial")}
                        className="accent-indigo-500"
                      />
                      <span>
                        <strong>Aggressive Denial:</strong> Vehement factual traverse & put plaintiff
                        to strict proof
                      </span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="strategy"
                        value="demurrer"
                        checked={strategy === "demurrer"}
                        onChange={() => setStrategy("demurrer")}
                        className="accent-indigo-500"
                      />
                      <span>
                        <strong>Demurrer / Legal Challenge:</strong> Focus on legal maintainability &
                        lack of cause of action
                      </span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="strategy"
                        value="counter_claim"
                        checked={strategy === "counter_claim"}
                        onChange={() => setStrategy("counter_claim")}
                        className="accent-indigo-500"
                      />
                      <span>
                        <strong>Counter-Claim:</strong> Plead reciprocal breach & damages
                      </span>
                    </label>
                  </div>
                </div>

                <div
                  className="p-4 rounded-xl border border-[var(--hairline)] space-y-2"
                  style={{ background: "var(--surface-raised)" }}
                >
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-dim)]">
                    Advocate Factual Instructions (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={advocateNotes}
                    onChange={(e) => setAdvocateNotes(e.target.value)}
                    placeholder="Provide specific factual rebuttals (e.g. goods were defective, letter of protest dated 16.04.2020)..."
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] outline-none resize-none custom-scrollbar"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ────────────────── STEP 3: WRITTEN STATEMENT DRAFT ────────────────── */}
          {step === 3 && generatedWs && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)]">
                  <button
                    onClick={() => setActiveTab("full")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "full"
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
                    }`}
                  >
                    Full Court Draft
                  </button>
                  <button
                    onClick={() => setActiveTab("traversals")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "traversals"
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
                    }`}
                  >
                    Para-wise Traversal ({generatedWs.traversals.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("objections")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "objections"
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
                    }`}
                  >
                    Preliminary Objections
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyDraft}
                    className="btn btn-ghost text-xs flex items-center gap-1.5 border border-[var(--hairline)]"
                  >
                    {isCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    {isCopied ? "Copied" : "Copy Text"}
                  </button>
                  <button
                    onClick={handleInjectIntoEditor}
                    className="btn btn-primary text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
                  >
                    <Sparkles size={13} />
                    Open in Legal Editor
                  </button>
                </div>
              </div>

              {/* Content Preview Container */}
              <div
                className="p-6 rounded-2xl border border-[var(--hairline)] bg-[var(--surface-raised)] font-serif text-[13px] leading-relaxed text-[var(--ink)] max-h-[55vh] overflow-y-auto custom-scrollbar"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                {activeTab === "full" && (
                  <div
                    dangerouslySetInnerHTML={{ __html: generatedWs.full_draft_html }}
                    className="legal-draft-preview space-y-4"
                  />
                )}

                {activeTab === "traversals" && (
                  <div className="space-y-4 font-sans text-xs">
                    {generatedWs.traversals.map((t) => (
                      <div
                        key={t.para_number}
                        className="p-3.5 rounded-xl border border-[var(--hairline)] bg-[var(--surface)] space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-500">Paragraph {t.para_number}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                              t.is_ai_generated
                                ? "bg-indigo-500/10 text-indigo-500"
                                : "bg-emerald-500/10 text-emerald-500"
                            }`}
                          >
                            {t.is_ai_generated ? "AI Adversarial Denial" : "Deterministic Template"}
                          </span>
                        </div>
                        <p className="text-[var(--ink-faint)] italic">{t.allegation_summary}</p>
                        <p className="text-[var(--ink)] font-serif text-[13px]">{t.traverse_text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "objections" && (
                  <div
                    dangerouslySetInnerHTML={{ __html: generatedWs.preliminary_objections_html }}
                    className="legal-draft-preview space-y-4"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="px-6 py-3.5 border-t flex items-center justify-between flex-shrink-0"
          style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}
        >
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              disabled={loading}
              className="btn btn-ghost text-xs flex items-center gap-1.5"
            >
              <ArrowLeft size={13} /> Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button onClick={onClose} className="btn btn-ghost text-xs">
              Cancel
            </button>

            {step === 1 && (
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="btn btn-primary text-xs flex items-center gap-1.5"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {loading ? "Analyzing Plaint..." : "Analyze Plaint & Statutory Bars"}
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn btn-primary text-xs flex items-center gap-1.5"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Gavel size={13} />}
                {loading ? "Synthesizing Written Statement..." : "Synthesize Written Statement"}
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleInjectIntoEditor}
                className="btn btn-primary text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
              >
                <Sparkles size={13} /> Open in Legal Editor
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
