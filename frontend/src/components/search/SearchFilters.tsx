import React, { useState } from "react";
import type { SearchFilters as SearchFiltersType } from "@/types/search";

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onChange: (filters: SearchFiltersType) => void;
  onReset: () => void;
}

const CASE_STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "DISPOSED", label: "Disposed" },
  { value: "ADMITTED", label: "Admitted" },
  { value: "TRANSFER", label: "Transferred" },
  { value: "DISMISSED", label: "Dismissed" },
  { value: "ALLOWED", label: "Allowed" },
  { value: "DECREED", label: "Decreed" },
];

const COURTS = [
  { value: "", label: "All Courts" },
  { value: "SCIN01", label: "Supreme Court" },
  { value: "DLHC01", label: "Delhi High Court" },
  { value: "BOMHC01", label: "Bombay High Court" },
  { value: "KARHC01", label: "Karnataka High Court" },
  { value: "MADHC01", label: "Madras High Court" },
  { value: "CALHC01", label: "Calcutta High Court" },
  { value: "ALLHC01", label: "Allahabad High Court" },
  { value: "GUJHC01", label: "Gujarat High Court" },
  { value: "PNHC01", label: "Punjab & Haryana HC" },
  { value: "DLND02", label: "New Delhi District" },
];

const CASE_TYPES = [
  { value: "", label: "All Types" },
  { value: "WP_C", label: "Writ (Civil)" },
  { value: "WP_CRL", label: "Writ (Criminal)" },
  { value: "CRL_A", label: "Criminal Appeal" },
  { value: "CS", label: "Civil Suit" },
  { value: "SLP", label: "SLP" },
  { value: "BA", label: "Bail Application" },
  { value: "CA", label: "Civil Appeal" },
  { value: "SUO_MOTU", label: "Suo Motu" },
];

const YEARS = Array.from({ length: 27 }, (_, i) => 2026 - i);

export function SearchFilters({ filters, onChange, onReset }: SearchFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (field: keyof SearchFiltersType, value: any) => {
    onChange({ ...filters, [field]: value || undefined, page: 1 });
  };

  // Quick chip row: status chips
  const activeStatus = filters.case_status || "";

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Status chips (always visible) */}
      <div className="filter-row" style={{ marginBottom: 12 }}>
        {CASE_STATUSES.map((s) => (
          <button
            key={s.value}
            className={`chip${activeStatus === s.value ? " active" : ""}`}
            onClick={() => handleChange("case_status", s.value)}
            type="button"
          >
            {s.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.04em",
            border: "1px solid var(--hairline)",
            color: "var(--ink-faint)",
            padding: "6px 13px",
            borderRadius: 20,
            cursor: "pointer",
            background: "transparent",
            transition: "all 140ms ease",
          }}
        >
          {expanded ? "Fewer filters ↑" : "More filters ↓"}
        </button>
        {(filters.court_code || filters.filing_year || filters.case_type) && (
          <button
            type="button"
            onClick={onReset}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              border: "none",
              color: "var(--brass)",
              padding: "6px 10px",
              borderRadius: 20,
              cursor: "pointer",
              background: "transparent",
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Extended filters */}
      {expanded && (
        <div
          className="animate-slide-up"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            padding: "16px",
            background: "var(--surface)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-md)",
          }}
        >
          {/* Court */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--ink-faint)",
                marginBottom: 6,
              }}
            >
              Court
            </label>
            <select
              value={filters.court_code || ""}
              onChange={(e) => handleChange("court_code", e.target.value)}
              style={{
                background: "var(--bg)",
                borderColor: "var(--hairline)",
                color: "var(--ink)",
                borderRadius: "var(--radius)",
                fontSize: "12.5px",
                padding: "8px 10px",
              }}
            >
              {COURTS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filing year */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--ink-faint)",
                marginBottom: 6,
              }}
            >
              Filing Year
            </label>
            <select
              value={filters.filing_year || ""}
              onChange={(e) =>
                handleChange("filing_year", e.target.value ? Number(e.target.value) : "")
              }
              style={{
                background: "var(--bg)",
                borderColor: "var(--hairline)",
                color: "var(--ink)",
                borderRadius: "var(--radius)",
                fontSize: "12.5px",
                padding: "8px 10px",
              }}
            >
              <option value="">All Years</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Case type */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--ink-faint)",
                marginBottom: 6,
              }}
            >
              Case Type
            </label>
            <select
              value={filters.case_type || ""}
              onChange={(e) => handleChange("case_type", e.target.value)}
              style={{
                background: "var(--bg)",
                borderColor: "var(--hairline)",
                color: "var(--ink)",
                borderRadius: "var(--radius)",
                fontSize: "12.5px",
                padding: "8px 10px",
              }}
            >
              {CASE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
