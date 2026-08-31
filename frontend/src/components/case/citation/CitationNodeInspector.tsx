import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ExternalLink,
  BookOpen,
  Scale,
} from "lucide-react";
import type { CitationNode } from "@/types/citation";

interface CitationNodeInspectorProps {
  node: CitationNode | null;
  onClose: () => void;
  onReadDocument?: (node: CitationNode) => void;
}

export function CitationNodeInspector({
  node,
  onClose,
  onReadDocument,
}: CitationNodeInspectorProps) {
  if (!node) return null;

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "sc":
        return { label: "Supreme Court of India", color: "#3B82F6", bg: "rgba(59, 130, 246, 0.12)" };
      case "hc":
        return { label: "High Court Precedent", color: "#10B981", bg: "rgba(16, 185, 129, 0.12)" };
      case "statute":
        return { label: "Statutory Law / Provision", color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.12)" };
      case "tribunal":
        return { label: "Appellate Tribunal", color: "#6B7280", bg: "rgba(107, 114, 128, 0.12)" };
      default:
        return { label: "Judicial Precedent", color: "#E5A93C", bg: "rgba(229, 169, 60, 0.15)" };
    }
  };

  const badgeInfo = getTierBadge(node.court_tier);
  const isTarget = node.node_type === "target";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full sm:w-96 rounded-xl border p-5 space-y-4 backdrop-blur-xl shadow-2xl relative overflow-hidden"
        style={{
          background: "var(--glass-bg)",
          borderColor: "var(--hairline)",
          color: "var(--ink)",
          boxShadow: "var(--shadow-float)",
        }}
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono inline-flex items-center gap-1"
              style={{
                background: isTarget ? "var(--brass-soft)" : badgeInfo.bg,
                color: isTarget ? "var(--brass-bright)" : badgeInfo.color,
                border: `1px solid ${isTarget ? "var(--brass)" : badgeInfo.color}33`,
              }}
            >
              {isTarget ? "Active Subject Case" : badgeInfo.label}
            </span>
            <h4
              className="text-base font-semibold font-display leading-snug line-clamp-2"
              style={{ color: "var(--ink)" }}
              title={node.title}
            >
              {node.title}
            </h4>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 cursor-pointer"
            style={{ color: "var(--ink)" }}
            aria-label="Close inspector"
          >
            <X size={16} />
          </button>
        </div>

        {/* Metadata Grid */}
        <div
          className="grid grid-cols-2 gap-2 p-3 rounded-lg border text-xs"
          style={{
            background: "var(--surface-raised)",
            borderColor: "var(--hairline-soft)",
          }}
        >
          <div>
            <span className="text-[10.5px] uppercase font-mono block opacity-60">Jurisdiction</span>
            <span className="font-medium truncate block" style={{ color: "var(--ink)" }}>
              {node.court || "Supreme Court"}
            </span>
          </div>

          <div>
            <span className="text-[10.5px] uppercase font-mono block opacity-60">Year / Date</span>
            <span className="font-medium block" style={{ color: "var(--ink)" }}>
              {node.year || "Enacted Law"}
            </span>
          </div>

          <div>
            <span className="text-[10.5px] uppercase font-mono block opacity-60">Inbound Citations</span>
            <span className="font-bold text-sm font-mono" style={{ color: "var(--brass)" }}>
              {node.inbound_count} <span className="text-[10px] font-normal opacity-70">cases</span>
            </span>
          </div>

          <div>
            <span className="text-[10.5px] uppercase font-mono block opacity-60">Authority Score</span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <div className="w-16 h-2 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, node.authority_score)}%`,
                    background:
                      node.authority_score > 85
                        ? "#3B82F6"
                        : node.authority_score > 65
                        ? "#10B981"
                        : "#E5A93C",
                  }}
                />
              </div>
              <span className="font-bold font-mono text-xs" style={{ color: "var(--ink)" }}>
                {node.authority_score}
              </span>
            </div>
          </div>
        </div>

        {/* Summary / Ratio Decidendi Snippet */}
        {node.summary && (
          <div className="space-y-1.5">
            <span
              className="text-[10.5px] font-semibold uppercase tracking-wider font-mono flex items-center gap-1"
              style={{ color: "var(--ink-dim)" }}
            >
              <Scale size={12} style={{ color: "var(--brass)" }} /> Legal Significance & Principle
            </span>
            <p
              className="text-xs leading-relaxed line-clamp-4 p-2.5 rounded border"
              style={{
                background: "var(--surface)",
                borderColor: "var(--hairline-soft)",
                color: "var(--ink-dim)",
              }}
            >
              "{node.summary}"
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {onReadDocument && (
            <button
              onClick={() => onReadDocument(node)}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              style={{
                background: "var(--brass)",
                color: "var(--on-primary)",
              }}
            >
              <BookOpen size={14} />
              <span>Read Document</span>
            </button>
          )}

          {node.url && (
            <a
              href={node.url}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg border hover:bg-[var(--surface-hover)] transition-all flex items-center justify-center"
              style={{
                background: "var(--surface)",
                borderColor: "var(--hairline)",
                color: "var(--ink)",
              }}
              title="Open in Indian Kanoon"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
