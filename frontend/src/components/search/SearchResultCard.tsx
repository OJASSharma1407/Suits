import React from "react";
import { Link } from "react-router-dom";
import { Bookmark, Calendar, Scale, Loader2, ArrowRight, Hash } from "lucide-react";
import type { SearchResultItem } from "@/types/search";
import { StatusBadge } from "@/components/common/StatusBadge";

interface SearchResultCardProps {
  item: SearchResultItem;
  onBookmarkToggle?: (cnr: string, title?: string) => void;
  isBookmarked?: boolean;
  isToggling?: boolean;
}

export function SearchResultCard({ item, onBookmarkToggle, isBookmarked, isToggling }: SearchResultCardProps) {
  return (
    <div className="card-float p-6 relative group hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          {/* Top badges: Status + Case Type + High-Contrast Court Tag */}
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <StatusBadge status={item.case_status} label={item.case_status_label} />

            {item.case_type_label && (
              <span
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{
                  background: "var(--surface-container)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                {item.case_type_label}
              </span>
            )}

            {item.court_name && (
              <span
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5"
                style={{
                  background: "var(--primary)",
                  color: "var(--on-primary)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                }}
              >
                <Scale size={12} />
                <span className="max-w-[280px] sm:max-w-xs truncate">{item.court_name}</span>
              </span>
            )}
          </div>

          {/* Case Title */}
          <Link
            to={`/case/${item.cnr}`}
            className="text-lg font-semibold tracking-tight hover:underline block leading-snug mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            {item.case_title}
          </Link>
        </div>

        {/* Bookmark action button */}
        {onBookmarkToggle && (
          <button
            onClick={() => onBookmarkToggle(item.cnr, item.case_title)}
            disabled={isToggling}
            className="p-2.5 rounded-full hover:bg-[var(--surface-container)] transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
            style={{
              color: isBookmarked ? "var(--primary)" : "var(--text-muted)",
              border: "1px solid",
              borderColor: isBookmarked ? "var(--border-strong)" : "var(--border)",
              background: isBookmarked ? "var(--surface-container)" : "transparent",
            }}
            title={isBookmarked ? "Remove Bookmark" : "Save Case"}
            aria-label={isBookmarked ? "Remove Bookmark" : "Save Case"}
          >
            {isToggling ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
            )}
          </button>
        )}
      </div>

      {/* Metadata Badges Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t text-xs" style={{ borderColor: "var(--border)" }}>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* CNR Pill */}
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-[11px]"
            style={{
              background: "var(--surface)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            <Hash size={12} style={{ color: "var(--text-muted)" }} />
            <span>CNR: {item.cnr}</span>
          </div>

          {/* Next Hearing Date Pill */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px]"
            style={{
              background: "var(--surface)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            <Calendar size={12} style={{ color: "var(--text-muted)" }} />
            <span>Next Hearing: <strong className="font-semibold">{item.next_hearing_date || "N/A"}</strong></span>
          </div>
        </div>

        {/* View Details Link */}
        <Link
          to={`/case/${item.cnr}`}
          className="btn-ghost flex items-center gap-1 text-xs font-semibold group-hover:translate-x-0.5 transition-transform"
          style={{ padding: "6px 14px", color: "var(--primary)" }}
        >
          View Details <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
