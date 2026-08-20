import React, { useEffect, useRef, useState, useCallback } from "react";
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
} from "lucide-react";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface CustomPDFViewerProps {
  pdfData: ArrayBuffer;
  initialScale?: number;
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

export function CustomPDFViewer({ pdfData, initialScale = 1.25 }: CustomPDFViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(initialScale);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);

  // Standard page aspect ratio (width / height)
  const [pageAspect, setPageAspect] = useState<number>(0.707); // Default A4 aspect ratio

  const containerRef = useRef<HTMLDivElement>(null);
  const pageContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderedPages = useRef<Set<number>>(new Set());
  const renderingPages = useRef<Set<number>>(new Set());

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
    } catch (sliceErr: any) {
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

  // Render individual page canvas
  const renderPageCanvas = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc) return;
      if (renderingPages.current.has(pageNumber)) return;

      const canvas = canvasRefs.current.get(pageNumber);
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

  // IntersectionObserver for lazy on-demand page rendering and current page detection
  useEffect(() => {
    if (!pdfDoc || numPages === 0 || !containerRef.current) return;

    // Clear rendered cache on scale change to trigger re-renders at new zoom
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
  const handleZoomReset = () => setScale(1.25);
  const handleFitWidth = () => {
    if (!containerRef.current || !pdfDoc) return;
    pdfDoc.getPage(1).then((page) => {
      const naturalWidth = page.getViewport({ scale: 1 }).width;
      const availableWidth = containerRef.current!.clientWidth - 96; // padding margin
      if (availableWidth > 0 && naturalWidth > 0) {
        setScale(+(availableWidth / naturalWidth).toFixed(2));
      }
    });
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          Loading document pages…
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

  // Base display width calculated from scale
  const basePageWidth = Math.round(620 * scale);
  const basePageHeight = Math.round(basePageWidth / pageAspect);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Sub-header / Reader Action Bar */}
      <div
        className="flex items-center justify-between px-5 py-2.5 border-b flex-shrink-0 text-xs select-none"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Left: Thumbnail sidebar toggle + Page Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThumbnails((prev) => !prev)}
            className="p-1.5 rounded-lg border hover:bg-[var(--surface-container)] transition-colors cursor-pointer"
            style={{
              borderColor: "var(--border)",
              color: showThumbnails ? "var(--primary)" : "var(--text-muted)",
              background: showThumbnails ? "var(--surface-container)" : "transparent",
            }}
            title={showThumbnails ? "Hide Thumbnails" : "Show Thumbnails"}
          >
            <PanelLeft size={14} />
          </button>

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
              title="Reset 100%"
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

      {/* Main Viewport: Split Thumbnails + Centered Continuous Canvas Scroll */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Collapsible Left Thumbnail Navigator */}
        {showThumbnails && pdfDoc && (
          <aside
            className="w-48 sm:w-56 border-r overflow-y-auto p-3 space-y-2.5 flex-shrink-0 animate-fade-in select-none"
            style={{
              background: "var(--surface)",
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

        {/* Continuous Centered Scroll PDF Document Canvas Pages */}
        <div
          ref={containerRef}
          className="flex-1 h-full overflow-y-auto overflow-x-auto p-4 sm:p-8 flex flex-col items-center"
          style={{ background: "var(--surface-dim)" }}
        >
          <div className="w-full flex flex-col items-center space-y-8 pb-16">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
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
                  className="bg-white rounded-sm shadow-xl border border-neutral-300 dark:border-neutral-700 overflow-hidden flex items-center justify-center relative"
                  style={{
                    width: `${basePageWidth}px`,
                    height: `${basePageHeight}px`,
                  }}
                >
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
