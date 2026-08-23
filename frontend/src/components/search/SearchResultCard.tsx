import React from "react";
import { Link } from "react-router-dom";
import { Bookmark, Loader2 } from "lucide-react";
import type { SearchResultItem } from "@/types/search";

interface SearchResultCardProps {
  item: SearchResultItem;
  onBookmarkToggle?: (cnr: string, title?: string) => void;
  isBookmarked?: boolean;
  isToggling?: boolean;
}

function getStampClass(status: string | null): string {
  const s = (status || "").toLowerCase();
  if (s.includes("pending") || s.includes("listed") || s.includes("admitted")) return "pending";
  if (s.includes("disposed") || s.includes("decided") || s.includes("closed") || s.includes("allowed") || s.includes("decreed") || s.includes("dismissed")) return "disposed";
  if (s.includes("transfer") || s.includes("appeal")) return "transfer";
  if (s.includes("reserved")) return "reserved";
  return "disposed";
}

function isValidStatus(status: string | null | undefined, label: string | null | undefined): boolean {
  const s = (status || "").trim().toLowerCase();
  const l = (label || "").trim().toLowerCase();
  if (!s && !l) return false;
  if (s === "unknown" || l === "unknown") return false;
  if (s === "none" || l === "none") return false;
  return true;
}

export function SearchResultCard({
  item,
  onBookmarkToggle,
  isBookmarked,
  isToggling,
}: SearchResultCardProps) {
  const hasStatus = isValidStatus(item.case_status, item.case_status_label);
  const stampClass = getStampClass(item.case_status);
  const displayStatus = item.case_status_label || item.case_status;

  return (
    <div className="result-row">
      <div className="result-main">
        <Link to={`/case/${item.cnr}`} className="result-title">
          {item.case_title}
        </Link>
        <div className="result-meta">
          {item.court_name && <span>{item.court_name}</span>}
          {item.cnr && (
            <span style={{ fontFamily: "var(--font-mono)" }}>
              № {item.cnr}
            </span>
          )}
          {item.case_type_label && <span>{item.case_type_label}</span>}
          {item.next_hearing_date && (
            <span>Next: {item.next_hearing_date}</span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        {/* Bookmark button */}
        {onBookmarkToggle && (
          <button
            onClick={() => onBookmarkToggle(item.cnr, item.case_title)}
            disabled={isToggling}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: isBookmarked ? "var(--brass)" : "var(--ink-faint)",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              borderRadius: "var(--radius-sm)",
              opacity: isToggling ? 0.5 : 1,
              transition: "color 140ms ease",
            }}
            title={isBookmarked ? "Remove Bookmark" : "Save Case"}
            aria-label={isBookmarked ? "Remove Bookmark" : "Save Case"}
          >
            {isToggling ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Bookmark size={15} fill={isBookmarked ? "currentColor" : "none"} />
            )}
          </button>
        )}

        {/* Status stamp: Only rendered when valid (not UNKNOWN) */}
        {hasStatus && (
          <div className={`stamp ${stampClass}`}>
            {displayStatus}
          </div>
        )}
      </div>
    </div>
  );
}
