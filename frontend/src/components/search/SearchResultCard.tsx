import React from "react";
import { Link } from "react-router-dom";
import { Bookmark, Calendar, Scale } from "lucide-react";
import type { SearchResultItem } from "@/types/search";
import { StatusBadge } from "@/components/common/StatusBadge";

interface SearchResultCardProps {
  item: SearchResultItem;
  onBookmarkToggle?: (cnr: string) => void;
  isBookmarked?: boolean;
}

export function SearchResultCard({ item, onBookmarkToggle, isBookmarked }: SearchResultCardProps) {
  return (
    <div className="card-float p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={item.case_status} label={item.case_status_label} />
            {item.case_type_label && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ background: "var(--surface-container)", color: "var(--text-muted)" }}>
                {item.case_type_label}
              </span>
            )}
          </div>
          <Link
            to={`/case/${item.cnr}`}
            className="text-lg font-semibold tracking-tight hover:underline block mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            {item.case_title}
          </Link>
          <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            CNR: {item.cnr}
          </p>
        </div>

        {onBookmarkToggle && (
          <button
            onClick={() => onBookmarkToggle(item.cnr)}
            className="p-2.5 rounded-full hover:bg-[var(--surface-container)] transition-colors"
            style={{
              color: isBookmarked ? "var(--primary)" : "var(--text-muted)",
              border: "1px solid",
              borderColor: isBookmarked ? "var(--border-strong)" : "var(--border)",
              background: isBookmarked ? "var(--surface-container)" : "transparent"
            }}
            title={isBookmarked ? "Remove Bookmark" : "Save Case"}
          >
            <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t text-sm" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <Scale size={15} style={{ color: "var(--text-muted)" }} />
          <span className="truncate" style={{ color: "var(--text-secondary)" }}>
            {item.court_name || "Court Unknown"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={15} style={{ color: "var(--text-muted)" }} />
          <span style={{ color: "var(--text-secondary)" }}>
            Next: {item.next_hearing_date || "N/A"}
          </span>
        </div>
        <div className="col-span-2 md:col-span-1 text-right flex items-center justify-end">
          <Link
            to={`/case/${item.cnr}`}
            className="btn-ghost"
            style={{ padding: "6px 12px" }}
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
