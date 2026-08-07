import React from "react";
import { Link } from "react-router-dom";
import type { SearchResultItem } from "@/types/search";
import { StatusBadge } from "@/components/common/StatusBadge";

interface SearchResultTableProps {
  items: SearchResultItem[];
}

export function SearchResultTable({ items }: SearchResultTableProps) {
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
          {items.map((item) => (
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
                <Link
                  to={`/case/${item.cnr}`}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: "var(--text-primary)" }}
                >
                  Open →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
