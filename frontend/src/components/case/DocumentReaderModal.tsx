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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { caseService } from "@/services/cases";
import { toast } from "sonner";
import { CustomPDFViewer } from "./CustomPDFViewer";
import type { OrderItem } from "@/types/case";

interface DocumentReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cnr: string;
  filename: string;
  caseTitle?: string;
  courtName?: string;
  orderDate?: string;
  initialMode?: "pdf" | "text";
  orders?: OrderItem[];
  allowModeToggle?: boolean;
}

type ViewMode = "pdf" | "text";
type FontFamily = "sans" | "serif";
type FontSize = 14 | 16 | 18 | 20;

// Client-side in-memory cache for instantaneous reopening of PDFs during a session
const pdfBufferCache = new Map<string, ArrayBuffer>();
const textCache = new Map<string, string>();

export function DocumentReaderModal({
  isOpen,
  onClose,
  cnr,
  filename: initialFilename,
  caseTitle = "Court Document",
  courtName = "Court Record",
  orderDate: initialOrderDate = "Record Copy",
  initialMode = "pdf",
  orders = [],
  allowModeToggle = true,
}: DocumentReaderModalProps) {
  const [currentFilename, setCurrentFilename] = useState<string>(initialFilename);
  const [currentOrderDate, setCurrentOrderDate] = useState<string>(initialOrderDate);
  const [mode, setMode] = useState<ViewMode>(initialMode);

  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState<boolean>(false);
  const [textError, setTextError] = useState<string | null>(null);

  // Typography state (Clean Text Mode)
  const [fontFamily, setFontFamily] = useState<FontFamily>("serif");
  const [fontSize, setFontSize] = useState<FontSize>(16);
  const [isWideLayout, setIsWideLayout] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Reset when opening or when initial props change
  useEffect(() => {
    if (!isOpen || !cnr || !initialFilename) return;
    setCurrentFilename(initialFilename);
    setCurrentOrderDate(initialOrderDate);
    setMode(initialMode);
  }, [isOpen, cnr, initialFilename, initialOrderDate, initialMode]);

  // Load content whenever currentFilename or active mode changes
  useEffect(() => {
    if (!isOpen || !cnr || !currentFilename) return;
    if (mode === "pdf") {
      loadPDF(currentFilename);
    } else {
      loadMarkdown(currentFilename);
    }
  }, [isOpen, cnr, currentFilename, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcut listener (Esc to close, Alt+1/2 to switch mode)
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, allowModeToggle]);

  const loadPDF = async (fname: string) => {
    const cacheKey = `${cnr}_${fname}`;
    if (pdfBufferCache.has(cacheKey)) {
      const cached = pdfBufferCache.get(cacheKey)!;
      setPdfData(cached.slice(0));
      setPdfLoading(false);
      return;
    }

    setPdfLoading(true);
    setPdfError(null);
    try {
      const buffer = await caseService.getOrderPDFArrayBuffer(cnr, fname);
      pdfBufferCache.set(cacheKey, buffer.slice(0));
      setPdfData(buffer.slice(0));
    } catch {
      setPdfError("Original Court PDF is unavailable for this record.");
      setMode("text");
      toast.info("Scanned PDF not available. Showing clean digital transcript.");
    } finally {
      setPdfLoading(false);
    }
  };

  const loadMarkdown = async (fname: string) => {
    const cacheKey = `${cnr}_${fname}`;
    if (textCache.has(cacheKey)) {
      setTextContent(textCache.get(cacheKey)!);
      setTextLoading(false);
      return;
    }

    setTextLoading(true);
    setTextError(null);
    try {
      const data = await caseService.getOrderMarkdown(cnr, fname);
      if (data && data.markdown) {
        textCache.set(cacheKey, data.markdown);
        setTextContent(data.markdown);
      } else {
        setTextError("Document transcript is unavailable for this order.");
      }
    } catch {
      setTextError("Failed to fetch judgment text.");
    } finally {
      setTextLoading(false);
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
    toast.success("Judgment text copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!modalRef.current) return;
    if (!document.fullscreenElement) {
      modalRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isOpen) return null;

  const validOrders = orders.filter((o) => o.filename && !o.is_stub);

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-3 md:p-4 animate-fade-in">
      {/* Full-Screen Uniform Dark Blur Backdrop covering 100% of viewport */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-2xl transition-all"
        onClick={onClose}
      />

      {/* Full-Screen Reader Container with Sleek Rounded Corners */}
      <div
        ref={modalRef}
        className="relative z-10 w-full h-full flex flex-col rounded-2xl md:rounded-3xl overflow-hidden animate-spring-in shadow-2xl"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border-strong)",
        }}
      >
        {/* ========================================================
            SLEEK MINIMALIST HEADER (No Glossy Clutter)
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
                  title={caseTitle}
                >
                  {caseTitle}
                </h3>
                <span
                  className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono"
                  style={{
                    background: "var(--surface-container)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  CNR: {cnr}
                </span>
              </div>
              
              {/* Sub-header with Court Name or Multi-Order Switcher */}
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                <span>{courtName}</span>
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
                  <span>Order Date: {currentOrderDate}</span>
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
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all"
                style={{
                  background: mode === "pdf" ? "var(--card)" : "transparent",
                  color: mode === "pdf" ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: mode === "pdf" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                <FileText size={12} />
                <span>Court PDF</span>
              </button>

              <button
                onClick={() => setMode("text")}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all"
                style={{
                  background: mode === "text" ? "var(--card)" : "transparent",
                  color: mode === "text" ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: mode === "text" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                <BookOpen size={12} />
                <span>Clean Text</span>
              </button>
            </div>
          )}

          {/* Right: Clean View Typography Actions & Close */}
          <div className="flex items-center gap-1.5">
            {/* Clean Text Typography Controls */}
            {mode === "text" && (
              <>
                {/* Font Family Toggle */}
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

                {/* Font Size Controls */}
                <div
                  className="flex items-center rounded-lg border p-0.5"
                  style={{ borderColor: "var(--border)", background: "var(--surface-container)" }}
                >
                  <button
                    onClick={() => setFontSize((prev) => (prev > 14 ? ((prev - 2) as FontSize) : 14))}
                    disabled={fontSize <= 14}
                    className="p-1 rounded hover:bg-[var(--surface)] disabled:opacity-40 cursor-pointer text-[11px] font-bold px-1"
                    style={{ color: "var(--text-secondary)" }}
                    title="Decrease font size"
                  >
                    A-
                  </button>
                  <span
                    className="text-[10px] font-mono px-1 font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {fontSize}px
                  </span>
                  <button
                    onClick={() => setFontSize((prev) => (prev < 20 ? ((prev + 2) as FontSize) : 20))}
                    disabled={fontSize >= 20}
                    className="p-1 rounded hover:bg-[var(--surface)] disabled:opacity-40 cursor-pointer text-[11px] font-bold px-1"
                    style={{ color: "var(--text-secondary)" }}
                    title="Increase font size"
                  >
                    A+
                  </button>
                </div>

                {/* Column Width Toggle */}
                <button
                  onClick={() => setIsWideLayout((prev) => !prev)}
                  className="btn-ghost p-1 rounded-lg border hidden sm:flex cursor-pointer"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  title={isWideLayout ? "Standard Reading Width" : "Wide Reading Width"}
                >
                  <AlignLeft size={13} />
                </button>

                {/* Copy Text */}
                <button
                  onClick={handleCopyText}
                  className="btn-ghost flex items-center gap-1 text-xs px-2 py-1 rounded-lg border cursor-pointer"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  title="Copy full judgment text"
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
            MAIN VIEWPORT
           ======================================================== */}
        <div className="flex-1 overflow-hidden relative" style={{ background: "var(--bg)" }}>
          {/* MODE 1: CUSTOM IN-APP PDF VIEWER (PDF.js Canvas Engine) */}
          {mode === "pdf" && (
            <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
              {pdfLoading && !pdfData ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} />
                  <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                    Streaming official court record…
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
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setMode("text")}
                      className="btn-primary text-xs"
                      style={{ padding: "8px 18px" }}
                    >
                      <BookOpen size={13} /> Switch to Clean Text View
                    </button>
                  </div>
                </div>
              ) : pdfData ? (
                <CustomPDFViewer pdfData={pdfData} initialScale={1.2} />
              ) : null}
            </div>
          )}

          {/* MODE 2: CLEAN TYPOGRAPHY VIEW */}
          {mode === "text" && (
            <div className="w-full h-full overflow-y-auto px-4 py-8 sm:px-8 md:px-12">
              {textLoading && !textContent ? (
                <div className="max-w-3xl mx-auto space-y-6 pt-10">
                  <div className="skeleton h-8 w-3/4" />
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-4 w-5/6" />
                  <div className="skeleton h-4 w-4/5" />
                  <div className="skeleton h-32 w-full" />
                </div>
              ) : textError ? (
                <div className="text-center max-w-md mx-auto py-16 space-y-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                    style={{ background: "rgba(220, 38, 38, 0.1)", color: "var(--danger)" }}
                  >
                    <AlertCircle size={24} />
                  </div>
                  <h4 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                    Judgment Text Unavailable
                  </h4>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {textError}
                  </p>
                  <button
                    onClick={() => setMode("pdf")}
                    className="btn-secondary text-xs mt-2"
                    style={{ padding: "8px 18px" }}
                  >
                    <FileText size={13} /> Try Court PDF View
                  </button>
                </div>
              ) : textContent ? (
                <article
                  className={`mx-auto transition-all ${
                    isWideLayout ? "max-w-5xl" : "max-w-3xl"
                  } ${fontFamily === "serif" ? "font-serif" : "font-sans"}`}
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: fontSize >= 18 ? "1.8" : "1.75",
                    color: "var(--text-primary)",
                  }}
                >
                  {/* Institutional Judgment Header Banner */}
                  <div
                    className="p-6 sm:p-8 rounded-2xl border mb-8 not-prose"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--surface-container)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        Official Judgment Record
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        • {currentOrderDate}
                      </span>
                    </div>

                    <h1
                      className="text-xl sm:text-2xl font-bold tracking-tight mb-2"
                      style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}
                    >
                      {caseTitle}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <span><strong>Court:</strong> {courtName}</span>
                      <span>•</span>
                      <span><strong>Document ID:</strong> {currentFilename}</span>
                      <span>•</span>
                      <span><strong>CNR:</strong> {cnr}</span>
                    </div>
                  </div>

                  {/* Judgment Content Body */}
                  <div className="space-y-5 leading-relaxed break-words whitespace-pre-wrap">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h2 className="text-2xl font-bold mt-8 mb-4 tracking-tight border-b pb-2" style={{ borderColor: "var(--border)" }}>
                            {children}
                          </h2>
                        ),
                        h2: ({ children }) => (
                          <h3 className="text-xl font-semibold mt-6 mb-3 tracking-tight">
                            {children}
                          </h3>
                        ),
                        h3: ({ children }) => (
                          <h4 className="text-lg font-semibold mt-4 mb-2">
                            {children}
                          </h4>
                        ),
                        p: ({ children }) => (
                          <p className="mb-4 text-justify" style={{ color: "var(--text-primary)" }}>
                            {children}
                          </p>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote
                            className="my-5 pl-4 border-l-4 italic py-1 rounded-r-lg"
                            style={{
                              borderColor: "var(--primary)",
                              background: "var(--surface-container)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {children}
                          </blockquote>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-6 rounded-xl border" style={{ borderColor: "var(--border)" }}>
                            <table className="min-w-full text-xs" style={{ borderColor: "var(--border)" }}>
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="px-3.5 py-2.5 text-left font-semibold border-b" style={{ background: "var(--surface-container)", borderColor: "var(--border)" }}>
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="px-3.5 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
                            {children}
                          </td>
                        ),
                        code: ({ children }) => (
                          <code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-container)", color: "var(--text-primary)" }}>
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {textContent}
                    </ReactMarkdown>
                  </div>

                  {/* End of Judgment Indicator */}
                  <div className="pt-12 pb-8 flex items-center justify-center gap-3 not-prose">
                    <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                    <span className="text-xs uppercase tracking-widest font-mono" style={{ color: "var(--text-muted)" }}>
                      End of Document
                    </span>
                    <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                  </div>
                </article>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
