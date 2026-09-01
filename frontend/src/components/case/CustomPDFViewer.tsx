import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  Loader2,
  AlertCircle,
  Highlighter,
  Sparkles,
  X,
} from "lucide-react";
import type { PDFHighlight, HighlightColor, HighlightRect } from "@/types/file";
import { toast } from "sonner";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface CustomPDFViewerRef {
  scrollToPage: (pageNum: number) => void;
}

export type SidebarMode = "thumbnails" | "research" | "none";

interface CustomPDFViewerProps {
  pdfData: ArrayBuffer;
  initialScale?: number;
  highlights?: PDFHighlight[];
  onAddHighlight?: (highlight: PDFHighlight) => void;
  onDeleteHighlight?: (id: string) => void;
  onAddToResearchNotes?: (quoteText: string) => void;
  sidebarMode?: SidebarMode;
  onSidebarModeChange?: (mode: SidebarMode) => void;
  researchPanel?: React.ReactNode;
}

// Sub-component to render real visual thumbnail canvas for a page
function PDFThumbnail({
  pdfDoc,
  pageNum,
  isActive,
  onClick,
}: {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNum: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    pdfDoc.getPage(pageNum).then((page) => {
      if (isCancelled || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      // Small scale for crisp thumbnail
      const viewport = page.getViewport({ scale: 0.22 });
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = "100%";
      canvas.style.height = "auto";

      context.scale(dpr, dpr);

      page
        .render({
          canvasContext: context,
          viewport: viewport,
        })
        .promise.then(() => {
          if (!isCancelled) setRendered(true);
        })
        .catch(() => {});
    });

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, pageNum]);

  return (
    <button
      onClick={onClick}
      className={`w-full p-2 rounded-xl border transition-all text-left flex flex-col items-center gap-1.5 cursor-pointer group relative ${
        isActive ? "ring-2 ring-[var(--primary)]" : ""
      }`}
      style={{
        background: isActive ? "var(--card)" : "var(--surface-container)",
        borderColor: isActive ? "var(--primary)" : "var(--border)",
        boxShadow: isActive ? "0 4px 12px rgba(0, 0, 0, 0.12)" : "none",
      }}
    >
      <div className="w-full rounded bg-white shadow-sm overflow-hidden flex items-center justify-center min-h-[110px] relative">
        <canvas ref={canvasRef} className="block w-full" />
        {!rendered && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
            <Loader2 size={16} className="animate-spin opacity-40" />
          </div>
        )}
      </div>
      <span
        className="text-[11px] font-mono font-semibold tracking-tight"
        style={{
          color: isActive ? "var(--primary)" : "var(--text-muted)",
        }}
      >
        Page {pageNum}
      </span>
    </button>
  );
}

export const CustomPDFViewer = forwardRef<CustomPDFViewerRef, CustomPDFViewerProps>(
  function CustomPDFViewer(
    {
      pdfData,
      initialScale = 1.55, // Default 155% Zoom as requested
      highlights = [],
      onAddHighlight,
      onDeleteHighlight,
      onAddToResearchNotes,
      sidebarMode = "none",
      onSidebarModeChange,
      researchPanel,
    },
    ref
  ) {
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [scale, setScale] = useState<number>(initialScale);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Standard page aspect ratio (width / height)
    const [pageAspect, setPageAspect] = useState<number>(0.707);

    const containerRef = useRef<HTMLDivElement>(null);
    const pageContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const paperSheetRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
    const textLayerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const renderedPages = useRef<Set<number>>(new Set());
    const renderingPages = useRef<Set<number>>(new Set());

    // Selection & Floating Highlighter State
    const [selectionPopup, setSelectionPopup] = useState<{
      x: number;
      y: number;
      text: string;
      pageNum: number;
      rects: HighlightRect[];
    } | null>(null);

    // Expose scrollToPage to parent component via ref
    useImperativeHandle(ref, () => ({
      scrollToPage: (pageNum: number) => {
        scrollToPage(pageNum);
      },
    }));

    // Load PDF Document
    useEffect(() => {
      let isCancelled = false;
      setLoading(true);
      setError(null);
      setPdfDoc(null);
      setNumPages(0);
      renderedPages.current.clear();
      renderingPages.current.clear();

      let safeData: Uint8Array;
      try {
        const raw: any = pdfData;
        if (raw && typeof raw.slice === "function") {
          safeData = new Uint8Array(raw.slice(0));
        } else if (raw && raw.buffer && typeof raw.buffer.slice === "function") {
          safeData = new Uint8Array(raw.buffer.slice(0));
        } else {
          safeData = new Uint8Array(raw);
        }
      } catch {
        setError("Document data stream was interrupted. Please retry.");
        setLoading(false);
        return;
      }

      const loadingTask = pdfjsLib.getDocument({
        data: safeData,
        cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/",
        cMapPacked: true,
      });

      loadingTask.promise
        .then((doc) => {
          if (isCancelled) return;
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setLoading(false);

          // Fetch page 1 to determine natural aspect ratio
          doc.getPage(1).then((firstPage) => {
            if (isCancelled) return;
            const vp = firstPage.getViewport({ scale: 1 });
            if (vp.width && vp.height) {
              setPageAspect(vp.width / vp.height);
            }
          });
        })
        .catch((err) => {
          if (isCancelled) return;
          setError(err?.message || "Failed to load PDF document.");
          setLoading(false);
        });

      return () => {
        isCancelled = true;
        loadingTask.destroy().catch(() => {});
      };
    }, [pdfData]);

    // Render individual page canvas and text layer
    const renderPageCanvas = useCallback(
      async (pageNumber: number) => {
        if (!pdfDoc) return;
        if (renderingPages.current.has(pageNumber)) return;

        const canvas = canvasRefs.current.get(pageNumber);
        const textLayerDiv = textLayerRefs.current.get(pageNumber);
        if (!canvas) return;

        renderingPages.current.add(pageNumber);

        try {
          const page = await pdfDoc.getPage(pageNumber);
          const dpr = window.devicePixelRatio || 1;
          const viewport = page.getViewport({ scale });

          const context = canvas.getContext("2d", { alpha: false });
          if (!context) return;

          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          context.scale(dpr, dpr);

          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;

          // Render Text Layer spans for 1:1 text selection & highlighting
          if (textLayerDiv) {
            textLayerDiv.innerHTML = "";
            textLayerDiv.style.width = `${viewport.width}px`;
            textLayerDiv.style.height = `${viewport.height}px`;

            const textContent = await page.getTextContent();
            textContent.items.forEach((item: any) => {
              if (!item.str) return;
              const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
              const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
              const span = document.createElement("span");
              span.textContent = item.str;
              span.style.position = "absolute";
              span.style.left = `${tx[4]}px`;
              span.style.top = `${tx[5] - fontHeight}px`;
              span.style.fontSize = `${fontHeight}px`;
              span.style.fontFamily = item.fontName || "sans-serif";
              span.style.color = "transparent";
              span.style.lineHeight = "1";
              span.style.whiteSpace = "pre";
              span.style.cursor = "text";
              span.style.userSelect = "text";
              textLayerDiv.appendChild(span);
            });
          }

          renderedPages.current.add(pageNumber);
        } catch (err: any) {
          if (err?.name !== "RenderingCancelledException") {
            console.warn(`Error rendering page ${pageNumber}:`, err);
          }
        } finally {
          renderingPages.current.delete(pageNumber);
        }
      },
      [pdfDoc, scale]
    );

    // IntersectionObserver for lazy on-demand page rendering
    useEffect(() => {
      if (!pdfDoc || numPages === 0 || !containerRef.current) return;

      renderedPages.current.clear();

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const pageNum = Number(entry.target.getAttribute("data-page-number"));
            if (entry.isIntersecting) {
              if (!renderedPages.current.has(pageNum)) {
                renderPageCanvas(pageNum);
              }
              if (entry.intersectionRatio > 0.45) {
                setCurrentPage(pageNum);
              }
            }
          });
        },
        {
          root: containerRef.current,
          rootMargin: "400px 0px",
          threshold: [0.1, 0.5],
        }
      );

      pageContainerRefs.current.forEach((el) => {
        if (el) observer.observe(el);
      });

      return () => observer.disconnect();
    }, [pdfDoc, numPages, scale, renderPageCanvas]);

    // Handle Text Selection for Floating Highlighter (with ZERO offset calculation)
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionPopup(null);
        return;
      }
      const text = selection.toString().trim();
      if (!text || text.length < 2) {
        setSelectionPopup(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect || rect.width === 0) {
        setSelectionPopup(null);
        return;
      }

      // Find which page container this selection is inside
      let node: HTMLElement | null = range.commonAncestorContainer as HTMLElement;
      while (node && !node.getAttribute?.("data-page-number") && node.parentElement) {
        node = node.parentElement;
      }
      const pageNum = Number(node?.getAttribute?.("data-page-number")) || currentPage;

      // Get exact paper sheet rect to prevent any scaling or margin offsets
      const paperSheet = paperSheetRefs.current.get(pageNum);
      const paperRect = paperSheet ? paperSheet.getBoundingClientRect() : null;

      const relativeRects: HighlightRect[] = [];
      const clientRects = range.getClientRects();

      if (paperRect && paperRect.width > 0 && paperRect.height > 0) {
        for (let i = 0; i < clientRects.length; i++) {
          const cr = clientRects[i];
          const top = cr.top - paperRect.top;
          const left = cr.left - paperRect.left;
          const width = cr.width;
          const height = cr.height;

          relativeRects.push({
            top,
            left,
            width,
            height,
            topPct: (top / paperRect.height) * 100,
            leftPct: (left / paperRect.width) * 100,
            widthPct: (width / paperRect.width) * 100,
            heightPct: (height / paperRect.height) * 100,
          });
        }
      }

      setSelectionPopup({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        text,
        pageNum,
        rects: relativeRects,
      });
    };

    const handleApplyHighlight = (color: HighlightColor, andAddToResearch = false) => {
      if (!selectionPopup || !onAddHighlight) return;

      const newHl: PDFHighlight = {
        id: `hl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        pageNum: selectionPopup.pageNum,
        color,
        text: selectionPopup.text,
        rects: selectionPopup.rects,
        createdAt: new Date().toISOString(),
      };

      onAddHighlight(newHl);

      if (andAddToResearch && onAddToResearchNotes) {
        onAddToResearchNotes(`> "${selectionPopup.text}"\n*(Page ${selectionPopup.pageNum})*\n\n`);
      }

      window.getSelection()?.removeAllRanges();
      setSelectionPopup(null);
      toast.success(
        andAddToResearch
          ? "Excerpt highlighted & added to Research Notes."
          : "Text highlighted."
      );
    };

    const handleClearSelection = () => {
      window.getSelection()?.removeAllRanges();
      setSelectionPopup(null);
    };

    // Scroll to page
    const scrollToPage = (pageNum: number) => {
      const targetEl = pageContainerRefs.current.get(pageNum);
      if (targetEl && containerRef.current) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        setCurrentPage(pageNum);
      }
    };

    const handleZoomIn = () => setScale((prev) => Math.min(2.5, +(prev + 0.15).toFixed(2)));
    const handleZoomOut = () => setScale((prev) => Math.max(0.6, +(prev - 0.15).toFixed(2)));
    const handleZoomReset = () => setScale(1.55); // Reset to 155%
    const handleFitWidth = () => {
      if (!containerRef.current || !pdfDoc) return;
      pdfDoc.getPage(1).then((page) => {
        const naturalWidth = page.getViewport({ scale: 1 }).width;
        const availableWidth = containerRef.current!.clientWidth - 96;
        if (availableWidth > 0 && naturalWidth > 0) {
          setScale(+(availableWidth / naturalWidth).toFixed(2));
        }
      });
    };

    // Exclusive Left Sidebar Toggle Actions
    const handleToggleThumbnails = () => {
      const newMode = sidebarMode === "thumbnails" ? "none" : "thumbnails";
      onSidebarModeChange?.(newMode);
    };

    const handleToggleResearch = () => {
      const newMode = sidebarMode === "research" ? "none" : "research";
      onSidebarModeChange?.(newMode);
    };

    const colorHexMap: Record<string, string> = {
      gold: "#F59E0B",
      green: "#10B981",
      purple: "#8B5CF6",
      blue: "#3B82F6",
    };

    if (loading) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            Streaming official court record…
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="card-float p-6 text-center max-w-md space-y-3">
            <AlertCircle size={32} className="mx-auto" style={{ color: "var(--danger)" }} />
            <h4 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              Unable to Render PDF
            </h4>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {error}
            </p>
          </div>
        </div>
      );
    }

    const basePageWidth = Math.round(620 * scale);
    const basePageHeight = Math.round(basePageWidth / pageAspect);

    return (
      <div
        className="w-full h-full flex flex-col overflow-hidden relative"
        style={{ background: "var(--bg)" }}
        onMouseUp={handleMouseUp}
      >
        {/* Floating Selection Highlighter Toolbar */}
        {selectionPopup && onAddHighlight && (
          <div
            className="fixed z-50 transform -translate-x-1/2 -translate-y-full flex items-center gap-1.5 p-1.5 rounded-xl border backdrop-blur-xl shadow-2xl animate-fade-in select-none"
            style={{
              left: `${selectionPopup.x}px`,
              top: `${selectionPopup.y}px`,
              background: "var(--card)",
              borderColor: "var(--border)",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
            }}
          >
            <span className="text-[10px] font-mono text-muted pl-1 pr-0.5 flex items-center gap-1">
              <Highlighter size={12} style={{ color: "var(--brass)" }} />
            </span>

            {/* Gold Highlight */}
            <button
              onClick={() => handleApplyHighlight("gold")}
              className="w-6 h-6 rounded-full flex items-center justify-center border hover:scale-110 transition-transform cursor-pointer"
              style={{ background: "#F59E0B", borderColor: "#D97706" }}
              title="Highlight Amber Gold"
            />

            {/* Green Highlight */}
            <button
              onClick={() => handleApplyHighlight("green")}
              className="w-6 h-6 rounded-full flex items-center justify-center border hover:scale-110 transition-transform cursor-pointer"
              style={{ background: "#10B981", borderColor: "#059669" }}
              title="Highlight Emerald Green"
            />

            {/* Purple Highlight */}
            <button
              onClick={() => handleApplyHighlight("purple")}
              className="w-6 h-6 rounded-full flex items-center justify-center border hover:scale-110 transition-transform cursor-pointer"
              style={{ background: "#8B5CF6", borderColor: "#7C3AED" }}
              title="Highlight Violet"
            />

            {/* Blue Highlight */}
            <button
              onClick={() => handleApplyHighlight("blue")}
              className="w-6 h-6 rounded-full flex items-center justify-center border hover:scale-110 transition-transform cursor-pointer"
              style={{ background: "#3B82F6", borderColor: "#2563EB" }}
              title="Highlight Slate Blue"
            />

            <div className="w-[1px] h-4 mx-1" style={{ background: "var(--border)" }} />

            {/* Add to Research Notes as Pointer */}
            <button
              onClick={() => handleApplyHighlight("gold", true)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              style={{
                background: "var(--brass)",
                color: "var(--on-primary)",
              }}
              title="Add this quote to Research Notes as a Pointer"
            >
              <Sparkles size={12} />
              <span>Add to Research</span>
            </button>

            {/* Dismiss / Remove selection */}
            <button
              onClick={handleClearSelection}
              className="p-1 rounded-md text-muted hover:text-[var(--ink)] transition-colors cursor-pointer"
              title="Dismiss toolbar"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Sub-header / Reader Action Bar */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0 text-xs select-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {/* Left: Page Preview Button + Page Navigation + Enlarged Research Button */}
          <div className="flex items-center gap-2">
            {/* Page Preview Button */}
            <button
              onClick={handleToggleThumbnails}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                sidebarMode === "thumbnails"
                  ? "bg-[var(--surface-container)] text-[var(--primary)] border-[var(--primary)]"
                  : "hover:bg-[var(--surface-container)] text-muted"
              }`}
              style={{
                borderColor: sidebarMode === "thumbnails" ? "var(--primary)" : "var(--border)",
              }}
              title={sidebarMode === "thumbnails" ? "Close Page Preview" : "Open Page Preview"}
            >
              <PanelLeft size={14} />
            </button>

            {/* Page Stepper */}
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border"
              style={{ borderColor: "var(--border)", background: "var(--surface-container)" }}
            >
              <button
                onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="p-0.5 rounded hover:bg-[var(--surface)] disabled:opacity-30 cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="font-mono text-[11px] font-semibold px-1 min-w-[58px] text-center" style={{ color: "var(--text-primary)" }}>
                {currentPage} / {numPages}
              </span>
              <button
                onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))}
                disabled={currentPage >= numPages}
                className="p-0.5 rounded hover:bg-[var(--surface)] disabled:opacity-30 cursor-pointer"
                title="Next Page"
              >
                <ChevronRight size={13} />
              </button>
            </div>

            {/* ENLARGED RESEARCH BUTTON NEXT TO PAGE INDICATOR */}
            <button
              onClick={handleToggleResearch}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
                sidebarMode === "research" ? "shadow-sm" : ""
              }`}
              style={{
                background: sidebarMode === "research" ? "var(--brass)" : "var(--surface-container)",
                borderColor: sidebarMode === "research" ? "var(--brass-bright)" : "var(--border)",
                color: sidebarMode === "research" ? "var(--on-primary)" : "var(--ink)",
              }}
              title={sidebarMode === "research" ? "Close Research Panel" : "Open Research Panel"}
            >
              <Sparkles size={13} />
              <span>Research</span>
              {highlights.length > 0 && (
                <span
                  className="w-4 h-4 rounded-full text-[9.5px] font-mono font-bold flex items-center justify-center -mr-1"
                  style={{
                    background: sidebarMode === "research" ? "rgba(0,0,0,0.3)" : "var(--brass)",
                    color: sidebarMode === "research" ? "#FFF" : "var(--on-primary)",
                  }}
                >
                  {highlights.length}
                </span>
              )}
            </button>
          </div>

          {/* Right: Zoom Controls */}
          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center rounded-lg border p-0.5"
              style={{ borderColor: "var(--border)", background: "var(--surface-container)" }}
            >
              <button
                onClick={handleZoomOut}
                className="p-1 rounded hover:bg-[var(--surface)] cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
              <span className="text-[11px] font-mono px-2 font-semibold min-w-[44px] text-center" style={{ color: "var(--text-primary)" }}>
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 rounded hover:bg-[var(--surface)] cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
              <button
                onClick={handleZoomReset}
                className="p-1 rounded hover:bg-[var(--surface)] cursor-pointer text-[10px] font-medium px-1.5"
                style={{ color: "var(--text-secondary)" }}
                title="Reset 155%"
              >
                <RotateCcw size={11} />
              </button>
            </div>

            <button
              onClick={handleFitWidth}
              className="btn-ghost flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border cursor-pointer"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              title="Fit to Width"
            >
              Fit Width
            </button>
          </div>
        </div>

        {/* Main Viewport: Fixed Stable Center Document Canvas (Zero Horizontal Movement on Sidebar Toggles) */}
        <div className="flex-1 w-full h-full overflow-hidden relative">
          {/* Continuous Centered Scroll PDF Document Canvas Pages (Spanning full width so center is 100% stable) */}
          <div
            ref={containerRef}
            className="w-full h-full overflow-y-auto overflow-x-auto p-4 sm:p-8 flex flex-col items-center select-text"
            style={{ background: "var(--surface-dim)" }}
          >
            <div className="w-full flex flex-col items-center space-y-8 pb-20">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
                const pageHighlights = highlights.filter((h) => h.pageNum === pageNum);

                return (
                  <div
                    key={pageNum}
                    data-page-number={pageNum}
                    ref={(el) => {
                      if (el) pageContainerRefs.current.set(pageNum, el);
                      else pageContainerRefs.current.delete(pageNum);
                    }}
                    className="flex flex-col items-center relative transition-all"
                  >
                    {/* Paper Sheet Container with Drop Shadow & Crisp Borders */}
                    <div
                      ref={(el) => {
                        if (el) paperSheetRefs.current.set(pageNum, el);
                        else paperSheetRefs.current.delete(pageNum);
                      }}
                      className="pdf-paper-sheet bg-white rounded-sm shadow-xl border border-neutral-300 dark:border-neutral-700 overflow-hidden flex items-center justify-center relative"
                      style={{
                        width: `${basePageWidth}px`,
                        height: `${basePageHeight}px`,
                      }}
                    >
                      {/* PDF Canvas */}
                      <canvas
                        ref={(el) => {
                          if (el) canvasRefs.current.set(pageNum, el);
                          else canvasRefs.current.delete(pageNum);
                        }}
                        className="block max-w-none"
                        style={{
                          width: `${basePageWidth}px`,
                          height: `${basePageHeight}px`,
                        }}
                      />

                      {/* PDF.js Text Layer Overlay for Selection */}
                      <div
                        ref={(el) => {
                          if (el) textLayerRefs.current.set(pageNum, el);
                          else textLayerRefs.current.delete(pageNum);
                        }}
                        className="absolute inset-0 overflow-hidden select-text pointer-events-auto leading-none text-transparent"
                        style={{
                          width: `${basePageWidth}px`,
                          height: `${basePageHeight}px`,
                        }}
                      />

                      {/* Persistent Highlights Layer (Zero-offset percentage rendering) */}
                      {pageHighlights.map((h) => (
                        <div key={h.id} className="pointer-events-none absolute inset-0">
                          {h.rects?.map((r, rIdx) => (
                            <div
                              key={rIdx}
                              className="absolute mix-blend-multiply opacity-40 rounded-[1.5px] pointer-events-auto cursor-pointer hover:opacity-75 transition-opacity"
                              style={{
                                top: r.topPct != null ? `${r.topPct}%` : `${r.top}px`,
                                left: r.leftPct != null ? `${r.leftPct}%` : `${r.left}px`,
                                width: r.widthPct != null ? `${r.widthPct}%` : `${r.width}px`,
                                height: r.heightPct != null ? `${r.heightPct}%` : `${r.height}px`,
                                background: colorHexMap[h.color] || "#F59E0B",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteHighlight?.(h.id);
                              }}
                              title="Click to remove highlight"
                            />
                          ))}
                        </div>
                      ))}

                      {/* Subtle placeholder while canvas renders */}
                      {!renderedPages.current.has(pageNum) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white gap-2">
                          <Loader2 size={22} className="animate-spin opacity-30 text-neutral-600" />
                          <span className="text-[10px] font-mono text-neutral-400">Loading Page {pageNum}…</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Page Indicator Tag */}
                    <span className="text-[10px] font-mono mt-2 font-medium" style={{ color: "var(--text-muted)" }}>
                      Page {pageNum} of {numPages}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Left Panel Layer (Absolute: Zero Horizontal Shift of Center Document) */}
          {sidebarMode === "thumbnails" && pdfDoc && (
            <aside
              className="absolute top-0 left-0 bottom-0 z-30 w-52 border-r overflow-y-auto p-3 space-y-2.5 flex-shrink-0 animate-slide-left shadow-2xl select-none"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted font-mono">
                  Thumbnails
                </span>
                <span className="text-[10px] font-mono text-muted">
                  {numPages} {numPages === 1 ? "Page" : "Pages"}
                </span>
              </div>

              <div className="space-y-3">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                  <PDFThumbnail
                    key={pageNum}
                    pdfDoc={pdfDoc}
                    pageNum={pageNum}
                    isActive={currentPage === pageNum}
                    onClick={() => scrollToPage(pageNum)}
                  />
                ))}
              </div>
            </aside>
          )}

          {sidebarMode === "research" && (
            <div className="absolute top-0 left-0 bottom-0 z-30 shadow-2xl animate-slide-left">
              {researchPanel}
            </div>
          )}
        </div>
      </div>
    );
  }
);
