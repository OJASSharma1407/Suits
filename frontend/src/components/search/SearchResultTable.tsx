import React from "react";
import { Link } from "react-router-dom";
import { Bookmark, Loader2 } from "lucide-react";
import type { SearchResultItem } from "@/types/search";
import { StatusBadge } from "@/components/common/StatusBadge";

interface SearchResultTableProps {
  items: SearchResultItem[];
  bookmarkedCnrs?: Set<string>;
  togglingCnrs?: Set<string>;
  onBookmarkToggle?: (cnr: string, title?: string) => void;
}

export function SearchResultTable({
  items,
  bookmarkedCnrs,
  togglingCnrs,
  onBookmarkToggle,
}: SearchResultTableProps) {
  return (
    <div className="w-full overflow-x-auto card-float">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="border-b" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <tr>
            <th className="p-4 font-medium text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Case Title</th>
            <th className="p-4 font-medium text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>CNR</th>
            <th className="p-4 font-medium text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Status</th>
            <th className="p-4 font-medium text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Court</th>
            <th className="p-4 font-medium text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Next Hearing</th>
            <th className="p-4 font-medium text-xs uppercase tracking-wider text-right" style={{ color: "var(--text-muted)" }}>Action</th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
          {items.map((item) => {
            const isBookmarked = bookmarkedCnrs?.has(item.cnr);
            const isToggling = togglingCnrs?.has(item.cnr);

            return (
              <tr key={item.cnr} className="hover:bg-[var(--surface-container)] transition-colors">
                <td className="p-4 font-medium max-w-xs truncate" style={{ color: "var(--text-primary)" }}>
                  <Link to={`/case/${item.cnr}`} className="hover:underline">
                    {item.case_title}
                  </Link>
                </td>
                <td className="p-4 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                  {item.cnr}
                </td>
                <td className="p-4">
                  <StatusBadge status={item.case_status} label={item.case_status_label} />
                </td>
                <td className="p-4 truncate max-w-xs text-xs" style={{ color: "var(--text-secondary)" }}>
                  {item.court_name || "-"}
                </td>
                <td className="p-4 text-xs" style={{ color: "var(--text-secondary)" }}>
                  {item.next_hearing_date || "-"}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onBookmarkToggle && (
                      <button
                        onClick={() => onBookmarkToggle(item.cnr, item.case_title)}
                        disabled={isToggling}
                        className="p-1.5 rounded-full hover:bg-[var(--surface-container-high)] transition-all cursor-pointer disabled:opacity-50"
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
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Bookmark size={13} fill={isBookmarked ? "currentColor" : "none"} />
                        )}
                      </button>
                    )}
                    <Link
                      to={`/case/${item.cnr}`}
                      className="text-xs font-semibold hover:underline"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Open →
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
