import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "pdfjs-dist/web/pdf_viewer.css";
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

/**
 * Merges raw DOMRects into clean, line-by-line highlight rectangles.
 * - Discards tiny phantom artifacts (<2px) and out-of-bound coords.
 * - Clusters word/character fragments on the same line using vertical center baseline proximity.
 * - Never cascades or expands vertically into neighboring lines.
 * - Merges each line into a single uninterrupted horizontal bar matching the true selected width.
 * - Resolves vertical overlaps between adjacent lines to prevent dark multiplier seams.
 */
export function cleanHighlightRects(rects: HighlightRect[]): HighlightRect[] {
  if (!rects || rects.length === 0) return [];

  const isPct = rects.some((r) => r.topPct != null && (r.widthPct != null || r.width != null));

  // Filter out tiny or invalid rects (less than 2px or 0.25% width/height, or negative coords)
  const minDimension = isPct ? 0.25 : 2;
  const valid = rects.filter((r) => {
    const w = isPct ? (r.widthPct ?? r.width ?? 0) : (r.width ?? 0);
    const h = isPct ? (r.heightPct ?? r.height ?? 0) : (r.height ?? 0);
    const top = isPct ? (r.topPct ?? r.top ?? 0) : (r.top ?? 0);
    const left = isPct ? (r.leftPct ?? r.left ?? 0) : (r.left ?? 0);
    return w >= minDimension && h >= minDimension && top >= 0 && left >= 0;
  });

  if (valid.length <= 1) return valid;

  interface NormRect {
    top: number;
    left: number;
    width: number;
    height: number;
    bottom: number;
    right: number;
    centerY: number;
  }

  const items: NormRect[] = valid.map((r) => {
    const top = (isPct ? r.topPct : r.top) ?? 0;
    const left = (isPct ? r.leftPct : r.left) ?? 0;
    const width = (isPct ? r.widthPct : r.width) ?? 0;
    const height = (isPct ? r.heightPct : r.height) ?? 0;
    return {
      top,
      left,
      width,
      height,
      bottom: top + height,
      right: left + width,
      centerY: top + height / 2,
    };
  });

  // Sort primarily by vertical center, then horizontal left
  items.sort((a, b) => {
    if (Math.abs(a.centerY - b.centerY) > (isPct ? 0.4 : 3)) {
      return a.centerY - b.centerY;
    }
    return a.left - b.left;
  });

  // Group into distinct lines based on vertical center baseline proximity
  // We keep a stable baseline centerY for each line to avoid cascading into adjacent lines
  interface LineCluster {
    centerY: number;
    avgHeight: number;
    items: NormRect[];
  }
  const lineClusters: LineCluster[] = [];

  for (const item of items) {
    let matchedCluster: LineCluster | null = null;
    for (const cluster of lineClusters) {
      // Two fragments are on the same line if their vertical centers are within 48% of line height
      const threshold = Math.min(cluster.avgHeight, item.height) * 0.48;
      if (Math.abs(item.centerY - cluster.centerY) <= threshold) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.items.push(item);
      const count = matchedCluster.items.length;
      matchedCluster.centerY = (matchedCluster.centerY * (count - 1) + item.centerY) / count;
      matchedCluster.avgHeight = (matchedCluster.avgHeight * (count - 1) + item.height) / count;
    } else {
      lineClusters.push({
        centerY: item.centerY,
        avgHeight: item.height,
        items: [item],
      });
    }
  }

  // Sort line clusters from top to bottom
  lineClusters.sort((a, b) => a.centerY - b.centerY);

  // For each line cluster, merge horizontally into a clean bar for that line
  const mergedLineRects: NormRect[] = [];

  for (const cluster of lineClusters) {
    cluster.items.sort((a, b) => a.left - b.left);

    const lefts = cluster.items.map((i) => i.left);
    const rights = cluster.items.map((i) => i.right);
    const tops = cluster.items.map((i) => i.top);
    const bottoms = cluster.items.map((i) => i.bottom);

    const minLeft = Math.min(...lefts);
    const maxRight = Math.max(...rights);
    const minTop = Math.min(...tops);
    const maxBottom = Math.max(...bottoms);

    mergedLineRects.push({
      top: minTop,
      left: minLeft,
      width: Math.max(isPct ? 0.1 : 1, maxRight - minLeft),
      height: Math.max(isPct ? 0.1 : 1, maxBottom - minTop),
      bottom: maxBottom,
      right: maxRight,
      centerY: (minTop + maxBottom) / 2,
    });
  }

  // Prevent vertical overlap between adjacent lines to stop dark multiplier seams
  // and keep distinct line highlights cleanly separated
  for (let i = 0; i < mergedLineRects.length - 1; i++) {
    const curr = mergedLineRects[i];
    const next = mergedLineRects[i + 1];
    if (curr.bottom >= next.top) {
      const gap = isPct ? 0.08 : 1;
      const mid = (curr.bottom + next.top) / 2;
      curr.bottom = mid - gap / 2;
      curr.height = Math.max(isPct ? 0.1 : 1, curr.bottom - curr.top);
      next.top = mid + gap / 2;
      next.height = Math.max(isPct ? 0.1 : 1, next.bottom - next.top);
    }
  }

  return mergedLineRects.map((m) => {
    if (isPct) {
      return {
        topPct: +m.top.toFixed(3),
        leftPct: +m.left.toFixed(3),
        widthPct: +m.width.toFixed(3),
        heightPct: +m.height.toFixed(3),
        top: +m.top.toFixed(3),
        left: +m.left.toFixed(3),
        width: +m.width.toFixed(3),
        height: +m.height.toFixed(3),
      };
    }
    return {
      top: +m.top.toFixed(2),
      left: +m.left.toFixed(2),
      width: +m.width.toFixed(2),
      height: +m.height.toFixed(2),
    };
  });
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
    // Increments whenever any page finishes rendering, forcing the loading
    // overlay to re-evaluate (renderedPages is a ref, not state, so without
    // this the white spinner overlay would never disappear on its own)
    const [renderVersion, setRenderVersion] = useState<number>(0);

    // Natural page dimensions in PDF points (scale: 1)
    const [defaultPageDim, setDefaultPageDim] = useState<{ width: number; height: number }>({
      width: 595.28,
      height: 841.89,
    });
    const [pageDimensions, setPageDimensions] = useState<Map<number, { width: number; height: number }>>(
      new Map()
    );

    const containerRef = useRef<HTMLDivElement>(null);
    const pageContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const paperSheetRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
    const textLayerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const activeTextLayers = useRef<Map<number, pdfjsLib.TextLayer>>(new Map());
    const renderedPages = useRef<Set<number>>(new Set());
    const renderingPages = useRef<Set<number>>(new Set());
    // Tracks live intersection ratio per page so we always pick the most-visible page
    const intersectionRatios = useRef<Map<number, number>>(new Map());

    // Clean up active text layers on unmount
    useEffect(() => {
      return () => {
        activeTextLayers.current.forEach((tl) => {
          try {
            tl.cancel();
          } catch {}
        });
        activeTextLayers.current.clear();
      };
    }, []);

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

          // Fetch page 1 to determine natural dimensions
          doc.getPage(1).then((firstPage) => {
            if (isCancelled) return;
            const vp = firstPage.getViewport({ scale: 1 });
            if (vp.width && vp.height) {
              setDefaultPageDim({ width: vp.width, height: vp.height });
              setPageDimensions((prev) => {
                const next = new Map(prev);
                next.set(1, { width: vp.width, height: vp.height });
                return next;
              });
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
          const naturalVp = page.getViewport({ scale: 1 });
          if (naturalVp.width && naturalVp.height) {
            setPageDimensions((prev) => {
              const curr = prev.get(pageNumber);
              if (curr?.width === naturalVp.width && curr?.height === naturalVp.height) return prev;
              const next = new Map(prev);
              next.set(pageNumber, { width: naturalVp.width, height: naturalVp.height });
              return next;
            });
          }

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

          // Render Official PDF.js Text Layer for 1:1 character alignment & selection
          if (textLayerDiv) {
            const prevTextLayer = activeTextLayers.current.get(pageNumber);
            if (prevTextLayer) {
              try {
                prevTextLayer.cancel();
              } catch {}
            }

            textLayerDiv.innerHTML = "";
            textLayerDiv.style.width = `${viewport.width}px`;
            textLayerDiv.style.height = `${viewport.height}px`;
            textLayerDiv.style.setProperty("--scale-factor", scale.toString());

            const textContent = await page.getTextContent();
            const textLayer = new pdfjsLib.TextLayer({
              textContentSource: textContent,
              container: textLayerDiv,
              viewport: viewport,
            });

            activeTextLayers.current.set(pageNumber, textLayer);
            await textLayer.render();
          }

          renderedPages.current.add(pageNumber);
          // Trigger a re-render so the loading placeholder is removed.
          // renderedPages is a ref, not state — without this setState the
          // white overlay would stay visible even after the canvas is painted.
          setRenderVersion((v) => v + 1);
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
      renderingPages.current.clear();
      intersectionRatios.current.clear();

      const observer = new IntersectionObserver(
        (entries) => {
          // Update the ratio map for every changed entry (both entering and leaving)
          entries.forEach((entry) => {
            const pageNum = Number(entry.target.getAttribute("data-page-number"));
            if (entry.isIntersecting) {
              intersectionRatios.current.set(pageNum, entry.intersectionRatio);
              // Trigger canvas render for pages that just came into view
              if (!renderedPages.current.has(pageNum)) {
                renderPageCanvas(pageNum);
              }
            } else {
              intersectionRatios.current.delete(pageNum);
            }
          });

          // Pick the single page with the highest visible ratio to avoid
          // the "last entry wins" race that caused the wrong page counter
          let bestPage = 0;
          let bestRatio = 0;
          intersectionRatios.current.forEach((ratio, pageNum) => {
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestPage = pageNum;
            }
          });
          if (bestPage > 0) {
            setCurrentPage(bestPage);
          }
        },
        {
          root: containerRef.current,
          rootMargin: "400px 0px",
          // Fine-grained thresholds give the ratio map better accuracy
          threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
        }
      );

      pageContainerRefs.current.forEach((el) => {
        if (el) observer.observe(el);
      });

      // IntersectionObserver fires asynchronously and does NOT call back
      // immediately for elements already in the viewport on mount.
      // This bootstrap pass manually renders already-visible pages so the
      // spinner never gets stuck on the initial open.
      requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        // Expand the check by 400px to match rootMargin
        const expandedTop = containerRect.top - 400;
        const expandedBottom = containerRect.bottom + 400;

        pageContainerRefs.current.forEach((el, pageNum) => {
          if (!el) return;
          const elRect = el.getBoundingClientRect();
          const isInExpandedView =
            elRect.bottom > expandedTop && elRect.top < expandedBottom;
          if (isInExpandedView && !renderedPages.current.has(pageNum)) {
            renderPageCanvas(pageNum);
          }
        });

        // Always ensure page 1 is rendered first, even before the container
        // rect math resolves (handles edge cases with late-mounted containers)
        if (!renderedPages.current.has(1)) {
          renderPageCanvas(1);
        }
      });

      return () => observer.disconnect();
    }, [pdfDoc, numPages, scale, renderPageCanvas]);

/**
 * Walks all Text nodes contained within a DOM Range and returns character sub-slices.
 * This guarantees that only actual text characters are measured, completely ignoring
 * PDF.js presentation elements like <br role="presentation"> which otherwise create
 * full-line selection artifacts that span across empty margins.
 */
function getTextNodesInRange(range: Range): { node: Text; start: number; end: number }[] {
  const result: { node: Text; start: number; end: number }[] = [];
  let startNode: Node = range.startContainer;
  let startOffset = range.startOffset;
  let endNode: Node = range.endContainer;
  let endOffset = range.endOffset;

  if (startNode.nodeType === Node.ELEMENT_NODE && startNode.hasChildNodes()) {
    const child = startNode.childNodes[Math.min(startOffset, startNode.childNodes.length - 1)];
    if (child) {
      startNode = child;
      startOffset = 0;
    }
  }

  if (endNode.nodeType === Node.ELEMENT_NODE && endNode.hasChildNodes()) {
    const child = endNode.childNodes[Math.min(Math.max(0, endOffset - 1), endNode.childNodes.length - 1)];
    if (child) {
      endNode = child;
      endOffset = child.nodeType === Node.TEXT_NODE ? (child as Text).length : 0;
    }
  }

  // Single text node selection
  if (startNode === endNode && startNode.nodeType === Node.TEXT_NODE) {
    if (startOffset < endOffset) {
      result.push({
        node: startNode as Text,
        start: startOffset,
        end: endOffset,
      });
    }
    return result;
  }

  const root = range.commonAncestorContainer;
  const container = root.nodeType === Node.TEXT_NODE ? root.parentElement || root : root;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);

  let started = false;
  let currentNode = walker.nextNode();

  while (currentNode) {
    const text = currentNode as Text;
    const isStart =
      currentNode === startNode ||
      (startNode.nodeType === Node.ELEMENT_NODE && startNode.contains(currentNode));
    const isEnd =
      currentNode === endNode ||
      (endNode.nodeType === Node.ELEMENT_NODE && endNode.contains(currentNode));

    if (isStart && isEnd) {
      const s = startOffset;
      const e = endOffset;
      if (s < e) {
        result.push({ node: text, start: s, end: e });
      }
      break;
    } else if (isStart) {
      started = true;
      const s =
        currentNode === startNode && startNode.nodeType === Node.TEXT_NODE ? startOffset : 0;
      const e = text.length;
      if (s < e) {
        result.push({ node: text, start: s, end: e });
      }
    } else if (isEnd) {
      const s = 0;
      const e =
        currentNode === endNode && endNode.nodeType === Node.TEXT_NODE ? endOffset : text.length;
      if (s < e) {
        result.push({ node: text, start: s, end: e });
      }
      break;
    } else if (started) {
      if (text.length > 0) {
        result.push({ node: text, start: 0, end: text.length });
      }
    }
    currentNode = walker.nextNode();
  }

  return result;
}

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

      // Measure character sub-ranges directly to exclude <br> artifacts and trailing line-break boxes
      const clientRects: DOMRect[] = [];
      const textNodes = getTextNodesInRange(range);

      if (textNodes.length > 0) {
        for (const item of textNodes) {
          try {
            const subRange = document.createRange();
            subRange.setStart(item.node, item.start);
            subRange.setEnd(item.node, item.end);
            const rects = subRange.getClientRects();
            for (let i = 0; i < rects.length; i++) {
              clientRects.push(rects[i]);
            }
          } catch {}
        }
      } else {
        clientRects.push(...Array.from(range.getClientRects()));
      }

      if (paperRect && paperRect.width > 0 && paperRect.height > 0) {
        for (let i = 0; i < clientRects.length; i++) {
          const cr = clientRects[i];
          if (cr.width < 3 || cr.height < 3) continue;

          const top = cr.top - paperRect.top;
          const left = cr.left - paperRect.left;
          const width = cr.width;
          const height = cr.height;

          // Ensure rect is within paper sheet bounds
          if (left < 0 || top < 0 || left >= paperRect.width || top >= paperRect.height) continue;

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

      const mergedRects = cleanHighlightRects(relativeRects);
      if (mergedRects.length === 0) {
        setSelectionPopup(null);
        return;
      }

      setSelectionPopup({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        text,
        pageNum,
        rects: mergedRects,
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

    const getPageSize = (pageNum: number) => {
      const natural = pageDimensions.get(pageNum) || defaultPageDim;
      return {
        width: Math.round(natural.width * scale),
        height: Math.round(natural.height * scale),
      };
    };

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

        {/* Main Viewport */}
        <div className="flex-1 w-full h-full overflow-hidden relative flex">
          {/* Left Panel Layer (Thumbnails overlay, retains zero shift when opening thumbnails) */}
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

          {/* Research Workspace (In-flow side-by-side to fit document view without overlap) */}
          {sidebarMode === "research" && (
            <div className="h-full flex-shrink-0 z-20 animate-slide-left">
              {researchPanel}
            </div>
          )}

          {/* Continuous Centered Scroll PDF Document Canvas Pages */}
          <div
            ref={containerRef}
            className="flex-1 h-full overflow-y-auto overflow-x-auto p-4 sm:p-8 flex flex-col items-center select-text min-w-0"
            style={{ background: "var(--surface-dim)" }}
          >
            <div className="min-w-fit w-full flex flex-col items-center space-y-8 pb-20">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
                const pageHighlights = highlights.filter((h) => h.pageNum === pageNum);
                const pageSize = getPageSize(pageNum);

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
                      className="pdf-paper-sheet bg-white rounded-sm shadow-xl border border-neutral-300 dark:border-neutral-700 overflow-hidden relative"
                      style={{
                        width: `${pageSize.width}px`,
                        height: `${pageSize.height}px`,
                      }}
                    >
                      {/* PDF Canvas */}
                      <canvas
                        ref={(el) => {
                          if (el) canvasRefs.current.set(pageNum, el);
                          else canvasRefs.current.delete(pageNum);
                        }}
                        className="absolute inset-0 block max-w-none"
                        style={{
                          width: `${pageSize.width}px`,
                          height: `${pageSize.height}px`,
                        }}
                      />

                      {/* Persistent Highlights Layer (Rendered below textLayer to preserve selection, cleaned & line-merged) */}
                      {pageHighlights.map((h) => {
                        const cleaned = cleanHighlightRects(h.rects || []);
                        return (
                          <div key={h.id} className="pointer-events-none absolute inset-0 z-[1]">
                            {cleaned.map((r, rIdx) => (
                              <div
                                key={rIdx}
                                className="absolute mix-blend-multiply opacity-40 rounded-[2px] pointer-events-auto cursor-pointer hover:opacity-75 transition-opacity"
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
                        );
                      })}

                      {/* PDF.js Text Layer Overlay for Selection (Official TextLayer with 1:1 character alignment) */}
                      <div
                        ref={(el) => {
                          if (el) textLayerRefs.current.set(pageNum, el);
                          else textLayerRefs.current.delete(pageNum);
                        }}
                        className="textLayer absolute inset-0 overflow-hidden select-text pointer-events-auto leading-none text-transparent z-[2]"
                        style={{
                          width: `${pageSize.width}px`,
                          height: `${pageSize.height}px`,
                          ["--scale-factor" as any]: scale,
                        }}
                      />

                      {/* Subtle placeholder while canvas renders */}
                      {!renderedPages.current.has(pageNum) && renderVersion >= 0 && (
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
        </div>
      </div>
    );
  }
);
