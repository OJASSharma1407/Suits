import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  FileText,
  BookOpen,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Type,
  AlignLeft,
  AlertCircle,
  Loader2,
  Scale,
  ChevronDown,
  Sparkles,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { caseService } from "@/services/cases";
import { fileService } from "@/services/files";
import { documentService } from "@/services/document";
import { toast } from "sonner";
import { CustomPDFViewer, type CustomPDFViewerRef, type SidebarMode } from "./CustomPDFViewer";
import { ReaderResearchPanel } from "./reader/ReaderResearchPanel";
import { AISummaryCard } from "./AISummaryCard";
import { ResearchBriefModal } from "../files/ResearchBriefModal";
import { ChatPanel } from "@/components/chat/ChatPanel";
import type { OrderItem, OrderAI } from "@/types/case";
import type { PDFHighlight } from "@/types/file";
import type { ChatMessage } from "@/types/chat";
import type { UserDocument } from "@/types/document";

interface DocumentReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cnr?: string;
  filename?: string;
  caseTitle?: string;
  courtName?: string;
  orderDate?: string;
  initialMode?: "pdf" | "text" | "ai";
  orders?: OrderItem[];
  allowModeToggle?: boolean;
  // User Document support
  userDocumentId?: string;
  userDoc?: UserDocument | null;
  aiData?: OrderAI | null;
  // Optional Chat integration
  isChatOpen?: boolean;
  onToggleChat?: () => void;
  chatMessages?: ChatMessage[];
  onSendMessage?: (text: string) => void;
  chatLoading?: boolean;
  streamingContent?: string;
  suggestedQuestions?: string[];
  onClearChat?: () => void;
  onExpandChat?: () => void;
}

type ViewMode = "pdf" | "text" | "ai";
type FontFamily = "sans" | "serif";
type FontSize = 14 | 16 | 18 | 20;

// Client-side in-memory cache for instantaneous reopening of PDFs during a session
const pdfBufferCache = new Map<string, ArrayBuffer>();
const textCache = new Map<string, string>();

export function DocumentReaderModal({
  isOpen,
  onClose,
  cnr = "",
  filename: initialFilename = "",
  caseTitle: initialCaseTitle = "Court Document",
  courtName: initialCourtName = "Court Record",
  orderDate: initialOrderDate = "Record Copy",
  initialMode = "pdf",
  orders = [],
  allowModeToggle = true,
  userDocumentId,
  userDoc,
  aiData: initialAiData,
  isChatOpen: propIsChatOpen,
  onToggleChat: propOnToggleChat,
  chatMessages: propChatMessages,
  onSendMessage: propOnSendMessage,
  chatLoading: propChatLoading,
  streamingContent: propStreamingContent,
  suggestedQuestions = [],
  onClearChat: propOnClearChat,
  onExpandChat,
}: DocumentReaderModalProps) {
  const effectiveId = userDocumentId || userDoc?.id;
  const effectiveCnr = userDoc?.cnr || cnr || "";
  const effectiveFilename = userDoc?.original_filename || initialFilename || "document.pdf";
  const effectiveCaseTitle = userDoc?.original_filename || initialCaseTitle;
  const effectiveCourtName = userDoc ? `Document Type: ${userDoc.tag.toUpperCase()}` : initialCourtName;

  const [currentFilename, setCurrentFilename] = useState<string>(effectiveFilename);
  const [currentOrderDate, setCurrentOrderDate] = useState<string>(initialOrderDate);
  const [mode, setMode] = useState<ViewMode>(initialMode);

  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [textContent, setTextContent] = useState<string | null>(userDoc?.extracted_text || null);
  const [textLoading, setTextLoading] = useState<boolean>(false);
  const [textError, setTextError] = useState<string | null>(null);

  const [structuredAI, setStructuredAI] = useState<OrderAI | null>(initialAiData || userDoc?.ai_analysis || null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Typography state (Clean Text Mode)
  const [fontFamily, setFontFamily] = useState<FontFamily>("serif");
  const [fontSize, setFontSize] = useState<FontSize>(16);
  const [isWideLayout, setIsWideLayout] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Unified Left Sidebar Mode: 'thumbnails' | 'research' | 'none'
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("none");

  // Research Vault State
  const [isBriefModalOpen, setIsBriefModalOpen] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>(userDoc?.notes || "");
  const [highlights, setHighlights] = useState<PDFHighlight[]>(userDoc?.highlights || []);
  const [tags, setTags] = useState<string[]>(userDoc?.tags_list || []);
  const [isSaved, setIsSaved] = useState<boolean>(!!userDoc);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Local Chat State (used if no external onSendMessage is provided, e.g. on FilesPage)
  const [internalChatOpen, setInternalChatOpen] = useState<boolean>(false);
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([]);
  const [internalLoading, setInternalLoading] = useState<boolean>(false);
  const [internalStreaming, setInternalStreaming] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const isChatOpen = propOnToggleChat ? propIsChatOpen : internalChatOpen;
  const onToggleChat = propOnToggleChat || (() => setInternalChatOpen((prev) => !prev));
  const chatMessages = propOnSendMessage ? propChatMessages || [] : internalMessages;
  const chatLoading = propOnSendMessage ? propChatLoading || false : internalLoading;
  const streamingContent = propOnSendMessage ? propStreamingContent || "" : internalStreaming;

  const modalRef = useRef<HTMLDivElement>(null);
  const pdfViewerRef = useRef<CustomPDFViewerRef>(null);

  // Reset when opening or when initial props change
  useEffect(() => {
    if (!isOpen) return;
    setCurrentFilename(effectiveFilename);
    setCurrentOrderDate(initialOrderDate);
    setMode(initialMode);
    if (userDoc) {
      if (userDoc.extracted_text) setTextContent(userDoc.extracted_text);
      if (userDoc.ai_analysis) setStructuredAI(userDoc.ai_analysis);
      if (userDoc.notes) setNotes(userDoc.notes);
      if (userDoc.highlights) setHighlights(userDoc.highlights);
      if (userDoc.tags_list) setTags(userDoc.tags_list);
      setIsSaved(true);
    }
  }, [isOpen, effectiveFilename, initialOrderDate, initialMode, userDoc]);

  // Load saved research notes & highlights for public case order
  useEffect(() => {
    if (!isOpen || effectiveId) return;
    if (!effectiveCnr || !currentFilename) return;
    fileService
      .getByCase(effectiveCnr, currentFilename)
      .then((saved) => {
        if (saved) {
          setNotes(saved.notes || "");
          setHighlights(saved.highlights || []);
          setTags(saved.tags || []);
          setIsSaved(true);
        } else {
          setNotes("");
          setHighlights([]);
          setTags([]);
          setIsSaved(false);
        }
      })
      .catch(() => {});
  }, [isOpen, effectiveCnr, currentFilename, effectiveId]);

  // Load content whenever currentFilename or active mode changes
  useEffect(() => {
    if (!isOpen) return;
    if (mode === "pdf") {
      loadPDF(currentFilename);
    } else if (mode === "text") {
      loadMarkdown(currentFilename);
    } else if (mode === "ai") {
      loadAI(currentFilename);
    }
  }, [isOpen, currentFilename, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcut listener (Esc to close, Alt+1/2/3 to switch mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (allowModeToggle && e.key === "1" && (e.altKey || e.metaKey)) {
        e.preventDefault();
        setMode("pdf");
      } else if (allowModeToggle && e.key === "2" && (e.altKey || e.metaKey)) {
        e.preventDefault();
        setMode("text");
      } else if (allowModeToggle && e.key === "3" && (e.altKey || e.metaKey)) {
        e.preventDefault();
        setMode("ai");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, allowModeToggle]);

  const loadPDF = async (fname: string) => {
    const cacheKey = effectiveId ? `doc_${effectiveId}` : `${effectiveCnr}_${fname}`;
    if (pdfBufferCache.has(cacheKey)) {
      const cached = pdfBufferCache.get(cacheKey)!;
      setPdfData(cached.slice(0));
      setPdfLoading(false);
      return;
    }

    setPdfLoading(true);
    setPdfError(null);
    try {
      let buffer: ArrayBuffer;
      if (effectiveId) {
        buffer = await documentService.getArrayBuffer(effectiveId);
      } else {
        buffer = await caseService.getOrderPDFArrayBuffer(effectiveCnr, fname);
      }
      pdfBufferCache.set(cacheKey, buffer.slice(0));
      setPdfData(buffer.slice(0));
    } catch {
      setPdfError("Original document PDF is unavailable for this record.");
      setMode("text");
      toast.info("Showing clean digital transcript.");
    } finally {
      setPdfLoading(false);
    }
  };

  const loadMarkdown = async (fname: string) => {
    if (textContent) return;
    const cacheKey = effectiveId ? `doc_md_${effectiveId}` : `${effectiveCnr}_${fname}`;
    if (textCache.has(cacheKey)) {
      setTextContent(textCache.get(cacheKey)!);
      setTextLoading(false);
      return;
    }

    setTextLoading(true);
    setTextError(null);
    try {
      if (effectiveId) {
        const doc = await documentService.getById(effectiveId);
        const md = doc.extracted_text || doc.summary || "No extracted text available.";
        textCache.set(cacheKey, md);
        setTextContent(md);
      } else {
        const data = await caseService.getOrderMarkdown(effectiveCnr, fname);
        if (data && data.markdown) {
          textCache.set(cacheKey, data.markdown);
          setTextContent(data.markdown);
        } else {
          setTextError("Document transcript is unavailable.");
        }
      }
    } catch {
      setTextError("Failed to fetch document text.");
    } finally {
      setTextLoading(false);
    }
  };

  const loadAI = async (fname: string) => {
    const raw = structuredAI as any;
    const hasValidSummary =
      raw &&
      (raw.executive_summary ||
        raw.executiveSummary ||
        raw.summary ||
        raw.plain_language_summary ||
        raw.plainLanguageSummary);

    if (hasValidSummary && !effectiveId) return;

    setAiLoading(true);
    try {
      if (effectiveId) {
        const ai = await documentService.getAiAnalysis(effectiveId);
        if (ai) {
          setStructuredAI(ai);
        }
      } else {
        const ai = await caseService.getOrderAI(effectiveCnr, fname);
        if (ai) {
          setStructuredAI(ai);
        }
      }
    } catch {
      toast.error("Failed to load AI structured analysis.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectOrder = (selectedFname: string) => {
    const found = orders.find((o) => o.filename === selectedFname);
    if (found) {
      setCurrentFilename(selectedFname);
      setCurrentOrderDate(found.order_date || "Court Order");
    }
  };

  const handleCopyText = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    toast.success("Document text copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!modalRef.current) return;
    if (!document.fullscreenElement) {
      modalRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSaveToFiles = async () => {
    setIsSaving(true);
    try {
      if (effectiveId) {
        await documentService.saveResearch(effectiveId, {
          notes,
          highlights,
          tags_list: tags,
        });
      } else {
        await fileService.save({
          cnr: effectiveCnr,
          filename: currentFilename,
          case_title: effectiveCaseTitle,
          court_name: effectiveCourtName,
          order_date: currentOrderDate,
          notes,
          highlights,
          tags,
        });
      }
      setIsSaved(true);
      toast.success("Research saved to Vault.");
    } catch {
      toast.error("Failed to save research.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInternalSendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      message: text,
      timestamp: new Date().toISOString(),
    };
    setInternalMessages((prev) => [...prev, userMsg]);
    setInternalLoading(true);
    setInternalStreaming("");

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const historyForApi = internalMessages.map((m) => ({
      role: m.role,
      message: m.message,
    }));

    try {
      if (effectiveId) {
        await documentService.streamChat(
          effectiveId,
          text,
          historyForApi,
          (chunk) => setInternalStreaming((prev) => prev + chunk),
          (full) => {
            const aiMsg: ChatMessage = {
              id: `msg_ai_${Date.now()}`,
              role: "assistant",
              message: full,
              timestamp: new Date().toISOString(),
            };
            setInternalMessages((prev) => [...prev, aiMsg]);
            setInternalStreaming("");
            setInternalLoading(false);
          },
          abortController.signal
        );
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error("AI chat response failed.");
      }
      setInternalLoading(false);
    }
  };

  const handleInternalClearChat = () => {
    abortControllerRef.current?.abort();
    setInternalStreaming("");
    setInternalMessages([]);
  };

  const handleAddHighlight = (newHighlight: PDFHighlight) => {
    setHighlights((prev) => [...prev, newHighlight]);
  };

  const handleDeleteHighlight = (id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    toast.info("Highlight removed.");
  };

  const handleAddToResearchNotes = (quoteText: string) => {
    setNotes((prev) => (prev ? `${prev}\n\n${quoteText}` : quoteText));
    setSidebarMode("research");
  };

  const handleJumpToPage = (pageNum: number) => {
    if (mode !== "pdf") {
      setMode("pdf");
    }
    setTimeout(() => {
      pdfViewerRef.current?.scrollToPage(pageNum);
    }, 150);
  };

  if (!isOpen) return null;

  const validOrders = orders.filter((o) => o.filename && !o.is_stub);

  const researchPanelNode = (
    <ReaderResearchPanel
      isOpen={sidebarMode === "research"}
      onClose={() => setSidebarMode("none")}
      caseTitle={effectiveCaseTitle}
      courtName={effectiveCourtName}
      orderDate={currentOrderDate}
      cnr={effectiveCnr}
      notes={notes}
      onNotesChange={setNotes}
      highlights={highlights}
      onDeleteHighlight={handleDeleteHighlight}
      onJumpToHighlight={handleJumpToPage}
      tags={tags}
      onTagsChange={setTags}
      isSaved={isSaved}
      isSaving={isSaving}
      onSaveToFiles={handleSaveToFiles}
      onOpenBriefModal={() => setIsBriefModalOpen(true)}
    />
  );

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-3 md:p-4 animate-fade-in">
      {/* Full-Screen Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl transition-all" onClick={onClose} />

      {/* Full-Screen Reader Container */}
      <div
        ref={modalRef}
        className="relative z-10 w-full h-full flex flex-col rounded-2xl md:rounded-3xl overflow-hidden animate-spring-in shadow-2xl"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border-strong)",
        }}
      >
        {/* ========================================================
            SLEEK MINIMALIST HEADER
           ======================================================== */}
        <header
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b flex-shrink-0"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          {/* Left: Metadata Badge & Order Switcher */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "var(--primary)",
                color: "var(--on-primary)",
              }}
            >
              <Scale size={15} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  className="text-xs font-semibold truncate max-w-[200px] sm:max-w-sm md:max-w-md"
                  style={{ color: "var(--text-primary)" }}
                  title={effectiveCaseTitle}
                >
                  {effectiveCaseTitle}
                </h3>
                {effectiveCnr && (
                  <span
                    className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono"
                    style={{
                      background: "var(--surface-container)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    CNR: {effectiveCnr}
                  </span>
                )}
              </div>

              {/* Sub-header with Court Name or Multi-Order Switcher */}
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                <span>{effectiveCourtName}</span>
                <span>•</span>
                {validOrders.length > 1 ? (
                  /* Multi-Order Dropdown Switcher */
                  <div className="relative inline-flex items-center">
                    <select
                      value={currentFilename}
                      onChange={(e) => handleSelectOrder(e.target.value)}
                      className="text-[11px] font-medium bg-transparent border-0 cursor-pointer pr-4 focus:ring-0 focus:outline-none"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {validOrders.map((o, idx) => (
                        <option key={idx} value={o.filename || ""}>
                          Order ({o.order_date || "Date N/A"}) - {o.description || o.filename}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={11} className="pointer-events-none -ml-3" style={{ color: "var(--text-muted)" }} />
                  </div>
                ) : (
                  <span>Record: {currentOrderDate}</span>
                )}
              </div>
            </div>
          </div>

          {/* Center: Segmented View Switcher */}
          {allowModeToggle && (
            <div
              className="flex items-center p-0.5 rounded-full border"
              style={{
                background: "var(--surface-container)",
                borderColor: "var(--border)",
              }}
            >
              <button
                onClick={() => setMode("pdf")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all"
                style={{
                  background: mode === "pdf" ? "var(--card)" : "transparent",
                  color: mode === "pdf" ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: mode === "pdf" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                <FileText size={13} />
                <span>{effectiveId ? "Document PDF" : "Court PDF"}</span>
              </button>

              <button
                onClick={() => setMode("text")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all"
                style={{
                  background: mode === "text" ? "var(--card)" : "transparent",
                  color: mode === "text" ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: mode === "text" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                <BookOpen size={13} />
                <span>Clean Text</span>
              </button>

              <button
                onClick={() => setMode("ai")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all"
                style={{
                  background: mode === "ai" ? "var(--card)" : "transparent",
                  color: mode === "ai" ? "var(--brass-bright)" : "var(--text-muted)",
                  boxShadow: mode === "ai" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                <Sparkles size={13} />
                <span>AI Analysis</span>
              </button>
            </div>
          )}

          {/* Right: Typography Controls, Fullscreen & Close */}
          <div className="flex items-center gap-1.5">
            {/* Clean Text Typography Controls */}
            {mode === "text" && (
              <>
                <button
                  onClick={() => setSidebarMode((prev) => (prev === "research" ? "none" : "research"))}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
                    sidebarMode === "research" ? "shadow-sm" : ""
                  }`}
                  style={{
                    background: sidebarMode === "research" ? "var(--brass)" : "var(--surface-container)",
                    borderColor: sidebarMode === "research" ? "var(--brass-bright)" : "var(--border)",
                    color: sidebarMode === "research" ? "var(--on-primary)" : "var(--ink)",
                  }}
                  title={sidebarMode === "research" ? "Close Research" : "Open Research"}
                >
                  <Sparkles size={12} />
                  <span>Research</span>
                </button>

                <button
                  onClick={() => setFontFamily((prev) => (prev === "serif" ? "sans" : "serif"))}
                  className="btn-ghost flex items-center gap-1 text-xs px-2 py-1 rounded-lg border cursor-pointer"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  title="Toggle Serif / Sans Font"
                >
                  <Type size={12} />
                  <span className="text-[11px] font-medium hidden sm:inline">
                    {fontFamily === "serif" ? "Serif" : "Sans"}
                  </span>
                </button>

                {/* Font Size controls */}
                <div
                  className="hidden sm:flex items-center rounded-lg border overflow-hidden"
                  style={{ borderColor: "var(--border)" }}
                >
                  <button
                    onClick={() => setFontSize((prev) => (prev > 14 ? ((prev - 2) as FontSize) : 14))}
                    className="px-2 py-1 text-xs hover:bg-[var(--surface-container)] cursor-pointer"
                    style={{ color: "var(--text-secondary)" }}
                    title="Decrease Font Size"
                  >
                    A-
                  </button>
                  <button
                    onClick={() => setFontSize((prev) => (prev < 20 ? ((prev + 2) as FontSize) : 20))}
                    className="px-2 py-1 text-xs hover:bg-[var(--surface-container)] border-l cursor-pointer"
                    style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                    title="Increase Font Size"
                  >
                    A+
                  </button>
                </div>

                <button
                  onClick={() => setIsWideLayout((prev) => !prev)}
                  className="btn-ghost p-1 rounded-lg border hidden sm:flex cursor-pointer"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  title={isWideLayout ? "Standard Reading Width" : "Wide Reading Width"}
                >
                  <AlignLeft size={13} />
                </button>

                <button
                  onClick={handleCopyText}
                  className="btn-ghost flex items-center gap-1 text-xs px-2 py-1 rounded-lg border cursor-pointer"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  title="Copy full document text"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                        Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span className="text-[11px] font-medium hidden md:inline">Copy</span>
                    </>
                  )}
                </button>
              </>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="btn-ghost p-1.5 rounded-lg border hidden md:flex cursor-pointer"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-[var(--surface-container)] cursor-pointer ml-1"
              style={{ color: "var(--text-primary)" }}
              title="Close Reader (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* ========================================================
            MAIN WORKSPACE VIEWPORT (Zero-shift centered layout)
           ======================================================== */}
        <div className="flex-1 w-full h-full overflow-hidden relative flex" style={{ background: "var(--bg)" }}>
          {/* MODE 1: CUSTOM IN-APP PDF VIEWER (PDF.js Canvas Engine, default 155% zoom) */}
          {mode === "pdf" && (
            <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
              {pdfLoading && !pdfData ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} />
                  <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                    Loading document PDF…
                  </p>
                </div>
              ) : pdfError ? (
                <div className="text-center max-w-md p-6 card-float space-y-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                    style={{ background: "rgba(220, 38, 38, 0.1)", color: "var(--danger)" }}
                  >
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                      PDF Unavailable
                    </h4>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {pdfError}
                    </p>
                  </div>
                  <button
                    onClick={() => setMode("text")}
                    className="btn btn-primary text-xs px-4 py-2 rounded-xl"
                  >
                    Switch to Clean Text Mode
                  </button>
                </div>
              ) : pdfData ? (
                <CustomPDFViewer
                  ref={pdfViewerRef}
                  pdfData={pdfData}
                  initialScale={1.55} // Default 155% Zoom as requested
                  highlights={highlights}
                  onAddHighlight={handleAddHighlight}
                  onDeleteHighlight={handleDeleteHighlight}
                  onAddToResearchNotes={handleAddToResearchNotes}
                  sidebarMode={sidebarMode}
                  onSidebarModeChange={setSidebarMode}
                  researchPanel={researchPanelNode}
                />
              ) : null}
            </div>
          )}

          {/* MODE 2: CLEAN TEXT DIGITAL TRANSCRIPT */}
          {mode === "text" && (
            <div className="w-full h-full flex overflow-hidden relative">
              {/* Clean text article centered */}
              <div className="flex-1 h-full overflow-y-auto p-6 sm:p-12 md:p-16 flex justify-center selection:bg-[var(--brass-soft)]">
                {textLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      Formatting digital text…
                    </p>
                  </div>
                ) : textError ? (
                  <div className="flex flex-col items-center justify-center h-full text-center max-w-md space-y-3">
                    <AlertCircle size={28} className="text-amber-500" />
                    <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      Transcript Unavailable
                    </h4>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {textError}
                    </p>
                  </div>
                ) : (
                  <article
                    className={`w-full transition-all ${
                      isWideLayout ? "max-w-4xl" : "max-w-3xl"
                    } py-4 leading-relaxed`}
                    style={{
                      fontFamily: fontFamily === "serif" ? "Georgia, Cambria, 'Times New Roman', serif" : "system-ui, -apple-system, sans-serif",
                      fontSize: `${fontSize}px`,
                      lineHeight: 1.95,
                      letterSpacing: "0.012em",
                      color: "var(--text-primary)",
                    }}
                  >
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1
                            className="text-xl sm:text-2xl font-bold font-display border-b pb-3 mb-6 mt-4"
                            style={{ borderColor: "var(--border)", color: "var(--ink)" }}
                          >
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2
                            className="text-base sm:text-lg font-bold font-display mt-8 mb-4"
                            style={{ color: "var(--ink)" }}
                          >
                            {children}
                          </h2>
                        ),
                        p: ({ children }) => (
                          <p className="mb-6 text-justify leading-relaxed whitespace-pre-line opacity-95">
                            {children}
                          </p>
                        ),
                        pre: ({ children }) => (
                          <pre
                            className="p-4 my-6 rounded-xl border overflow-x-auto text-xs font-mono leading-relaxed"
                            style={{ background: "var(--surface-dim)", borderColor: "var(--border)" }}
                          >
                            {children}
                          </pre>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote
                            className="border-l-4 pl-4 my-6 italic text-sm"
                            style={{ borderColor: "var(--brass)", background: "var(--surface-container)" }}
                          >
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {textContent || ""}
                    </ReactMarkdown>
                  </article>
                )}
              </div>

              {/* Absolute Left Drawer in Clean text mode */}
              {sidebarMode === "research" && (
                <div className="absolute top-0 left-0 bottom-0 z-30 shadow-2xl animate-slide-left">
                  {researchPanelNode}
                </div>
              )}
            </div>
          )}

          {/* MODE 3: STRUCTURED AI LEGAL ANALYSIS */}
          {mode === "ai" && (
            <div className="w-full h-full flex overflow-y-auto p-4 sm:p-8 justify-center">
              <div className="w-full max-w-5xl">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Loader2 size={36} className="animate-spin" style={{ color: "var(--brass)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--ink-faint)" }}>
                      Synthesizing structured legal breakdown…
                    </p>
                  </div>
                ) : (
                  <AISummaryCard
                    aiData={structuredAI}
                    summary={structuredAI?.executive_summary}
                    plainLanguage={structuredAI?.plain_language_summary}
                    issues={structuredAI?.primary_issues}
                    reasoning={structuredAI?.court_reasoning}
                    ratioDecidendi={structuredAI?.ratio_decidendi}
                    directions={structuredAI?.court_directions}
                    statutesCited={structuredAI?.statutes_cited}
                    onReadDocument={() => setMode("pdf")}
                  />
                )}
              </div>
            </div>
          )}

          {/* Floating AI Chat Assistant Card */}
          <div className="absolute bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto select-none">
            {isChatOpen && (
              <div
                className="mb-3 w-[410px] sm:w-[430px] h-[580px] max-h-[78vh] flex flex-col rounded-2xl overflow-hidden animate-slide-up shadow-2xl border overscroll-contain select-text"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--card)",
                  overscrollBehavior: "contain",
                  boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.4)",
                }}
              >
                <div
                  className="p-3 px-4 border-b flex items-center justify-between flex-shrink-0"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--brass-soft)", color: "var(--brass-bright)" }}
                    >
                      <Sparkles size={15} />
                    </div>
                    <h3 className="text-sm font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                      {effectiveId ? "Document AI Assistant" : "Case Assistant"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={propOnClearChat || handleInternalClearChat}
                      title="Clear conversation and start new chat"
                      className="px-2.5 py-1 rounded-lg hover:bg-[var(--surface-container)] text-xs flex items-center gap-1.5 transition-colors cursor-pointer border"
                      style={{ borderColor: "var(--border)", color: "var(--ink-dim)" }}
                    >
                      <RotateCcw size={12} />
                      <span className="text-[11px] font-medium">New Chat</span>
                    </button>
                    {onExpandChat && (
                      <button
                        type="button"
                        onClick={onExpandChat}
                        title="Expand to Full Chat Window"
                        className="p-1.5 rounded-lg hover:bg-[var(--surface-container)] transition-colors cursor-pointer"
                        style={{ color: "var(--ink-dim)" }}
                      >
                        <Maximize2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatPanel
                    messages={chatMessages}
                    onSendMessage={propOnSendMessage || handleInternalSendMessage}
                    isLoading={chatLoading}
                    streamingMessage={streamingContent}
                    suggestedQuestions={suggestedQuestions.length > 0 ? suggestedQuestions : [
                      "Summarize the key clauses of this document.",
                      "What are the main liabilities or risks?",
                      "List all named parties and dates mentioned.",
                    ]}
                    onClearChat={propOnClearChat || handleInternalClearChat}
                  />
                </div>
              </div>
            )}

            <button
              onClick={onToggleChat}
              className="h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                background: isChatOpen ? "var(--surface-container-high)" : "var(--primary)",
                color: isChatOpen ? "var(--text-primary)" : "var(--on-primary)",
              }}
              title={isChatOpen ? "Minimize Assistant" : "Ask Document AI"}
            >
              {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>
          </div>
        </div>

        {/* Case Research Brief Printable Modal */}
        <ResearchBriefModal
          isOpen={isBriefModalOpen}
          onClose={() => setIsBriefModalOpen(false)}
          caseTitle={effectiveCaseTitle}
          courtName={effectiveCourtName}
          orderDate={currentOrderDate}
          cnr={effectiveCnr}
          notes={notes}
          highlights={highlights}
          tags={tags}
        />
      </div>
    </div>,
    document.body
  );
}
