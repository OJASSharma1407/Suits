import React from "react";
import { Bookmark, RefreshCw, Share2 } from "lucide-react";
import type { CaseDetails } from "@/types/case";
import { StatusBadge } from "@/components/common/StatusBadge";

interface CaseHeaderProps {
  caseData: CaseDetails;
  isBookmarked: boolean;
  onBookmarkToggle: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function CaseHeader({
  caseData,
  isBookmarked,
  onBookmarkToggle,
  onRefresh,
  isRefreshing = false,
}: CaseHeaderProps) {
  return (
    <div className="card-float p-8 space-y-6 relative overflow-hidden">
      {/* Decorative gradient */}
      <div 
        className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-30 pointer-events-none" 
        style={{ 
          background: "var(--accent-orb-1)", 
          filter: "blur(60px)",
          transform: "translate(30%, -30%)"
        }} 
      />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={caseData.case_status} label={caseData.case_status_label} />
            {caseData.case_type_label && (
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md" style={{ background: "var(--surface-container)", color: "var(--text-muted)" }}>
                {caseData.case_type_label}
              </span>
            )}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            {caseData.case_title}
          </h1>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono px-2 py-1 rounded bg-gray-100" style={{ color: "var(--text-secondary)" }}>
              {caseData.cnr}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onBookmarkToggle}
            className="btn-ghost"
            style={{ 
              color: isBookmarked ? "var(--primary)" : "var(--text-secondary)",
              background: isBookmarked ? "var(--surface-container)" : "transparent"
            }}
          >
            <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
            {isBookmarked ? "Saved" : "Save"}
          </button>
          
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn-ghost disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="btn-ghost p-2"
            title="Copy Case Link"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t relative z-10" style={{ borderColor: "var(--border)" }}>
        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Court</span>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {caseData.court.court_name || "Unknown"}
          </span>
        </div>
        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Filing Date</span>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {caseData.filing_date || "Unknown"}
          </span>
        </div>
        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Next Hearing</span>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {caseData.next_hearing_date || "N/A"}
          </span>
        </div>
        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Case Duration</span>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {caseData.case_duration || "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}
