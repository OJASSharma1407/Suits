import React, { useState, useEffect, useCallback, useRef } from "react";
import { CitationGraphCanvas } from "./CitationGraphCanvas";
import { CitationGraphControls } from "./CitationGraphControls";
import { CitationNodeInspector } from "./CitationNodeInspector";
import { CitationLegend } from "./CitationLegend";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { ErrorState } from "@/components/common/ErrorState";
import { citationService } from "@/services/citations";
import type { CitationGraphData, CitationNode } from "@/types/citation";
import { toast } from "sonner";

interface CitationNetworkViewProps {
  cnr: string;
  caseTitle?: string;
  onReadDocument?: (node: CitationNode) => void;
}

export function CitationNetworkView({
  cnr,
  caseTitle,
  onReadDocument,
}: CitationNetworkViewProps) {
  const [data, setData] = useState<CitationGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inspector & filter state
  const [selectedNode, setSelectedNode] = useState<CitationNode | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");

  // Viewport transforms
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const fetchGraph = useCallback(async () => {
    if (!cnr) return;
    setLoading(true);
    setError(null);
    try {
      const res = await citationService.getGraph(cnr);
      setData(res);
      const rootNode = res.nodes.find((n) => n.node_type === "target") || res.nodes[0];
      if (rootNode) setSelectedNode(rootNode);
    } catch {
      setError("Unable to generate citation network. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [cnr]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(3.2, prev * 1.25));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.35, prev * 0.8));
  };

  const handleResetView = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    const rootNode = data?.nodes.find((n) => n.node_type === "target") || data?.nodes[0];
    if (rootNode) setSelectedNode(rootNode);
    toast.info("Network view reset to center.");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader count={1} height="80px" />
        <SkeletonLoader count={1} height="480px" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center rounded-xl border" style={{ borderColor: "var(--hairline)", background: "var(--surface)" }}>
        <ErrorState
          title="Citation Network Error"
          message={error || "Failed to load citation relationships."}
          onRetry={fetchGraph}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-4 relative">
      {/* Network Header & Authority Metric Summary */}
      <div
        className="p-5 rounded-2xl border space-y-3"
        style={{
          background: "var(--surface)",
          borderColor: "var(--hairline)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h3
              className="text-lg font-semibold font-display tracking-tight"
              style={{ color: "var(--ink)" }}
            >
              Citation & Precedent Authority Network
            </h3>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Precedents Relied Upon */}
            <div
              className="px-3 py-1.5 rounded-lg border font-mono flex items-center gap-1.5"
              style={{
                background: "var(--surface-raised)",
                borderColor: "var(--hairline-soft)",
                color: "var(--ink)",
              }}
            >
              <span className="opacity-60 text-[11px]">Cites:</span>
              <span className="font-bold text-sm" style={{ color: "#3B82F6" }}>
                {data.summary.total_precedents}
              </span>
            </div>

            {/* Subsequent Cases */}
            <div
              className="px-3 py-1.5 rounded-lg border font-mono flex items-center gap-1.5"
              style={{
                background: "var(--surface-raised)",
                borderColor: "var(--hairline-soft)",
                color: "var(--ink)",
              }}
            >
              <span className="opacity-60 text-[11px]">Cited By:</span>
              <span className="font-bold text-sm" style={{ color: "#10B981" }}>
                {data.summary.total_subsequent}
              </span>
            </div>

            {/* Statutes */}
            <div
              className="px-3 py-1.5 rounded-lg border font-mono flex items-center gap-1.5"
              style={{
                background: "var(--surface-raised)",
                borderColor: "var(--hairline-soft)",
                color: "var(--ink)",
              }}
            >
              <span className="opacity-60 text-[11px]">Statutes:</span>
              <span className="font-bold text-sm" style={{ color: "#8B5CF6" }}>
                {data.summary.total_statutes}
              </span>
            </div>

            {/* Landmark Count */}
            <div
              className="px-3 py-1.5 rounded-lg border font-mono flex items-center gap-1.5"
              style={{
                background: "var(--surface-raised)",
                borderColor: "var(--hairline-soft)",
                color: "var(--ink)",
              }}
            >
              <span className="opacity-60 text-[11px]">Landmarks:</span>
              <span className="font-bold text-sm" style={{ color: "#E5A93C" }}>
                {data.summary.landmark_citations_count}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating HUD Controls */}
      <CitationGraphControls
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
      />

      {/* Main Canvas with Floating Inspector Sheet */}
      <div className="relative">
        <CitationGraphCanvas
          nodes={data.nodes}
          links={data.links}
          selectedNodeId={selectedNode?.id || null}
          onSelectNode={setSelectedNode}
          activeFilter={activeFilter}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          panOffset={panOffset}
          onPanChange={setPanOffset}
        />

        {/* Floating Glassmorphic Inspector Drawer on the bottom/right */}
        {selectedNode && (
          <div className="absolute top-4 right-4 z-30 max-w-[calc(100%-2rem)]">
            <CitationNodeInspector
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onReadDocument={onReadDocument}
            />
          </div>
        )}
      </div>

      {/* Network Legend */}
      <CitationLegend />
    </div>
  );
}
