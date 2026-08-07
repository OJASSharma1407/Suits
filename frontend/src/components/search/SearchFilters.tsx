import React from "react";
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

const CASE_TYPES = [
  { value: "", label: "All Case Types" },
  { value: "WP_C", label: "Writ Petition (Civil)" },
  { value: "WP_CRL", label: "Writ Petition (Criminal)" },
  { value: "CRL_A", label: "Criminal Appeal" },
  { value: "CRL_OP", label: "Criminal Original Petition" },
  { value: "CRL_MP", label: "Criminal Misc Petition" },
  { value: "CS", label: "Civil Suit" },
  { value: "CMA", label: "Civil Misc Appeal" },
  { value: "RFA", label: "Regular First Appeal" },
  { value: "RSA", label: "Regular Second Appeal" },
  { value: "SLP", label: "Special Leave Petition" },
  { value: "BA", label: "Bail Application" },
  { value: "CA", label: "Civil Appeal" },
  { value: "IA", label: "Interim Application" },
  { value: "SUO_MOTU", label: "Suo Motu Petition" },
];

const COURTS = [
  { value: "", label: "All Courts" },
  { value: "SCIN01", label: "Supreme Court of India" },
  { value: "DLHC01", label: "Delhi High Court" },
  { value: "BOMHC01", label: "Bombay High Court" },
  { value: "KARHC01", label: "Karnataka High Court" },
  { value: "MADHC01", label: "Madras High Court" },
  { value: "CALHC01", label: "Calcutta High Court" },
  { value: "ALLHC01", label: "Allahabad High Court" },
  { value: "GUJHC01", label: "Gujarat High Court" },
  { value: "PNHC01", label: "Punjab & Haryana High Court" },
  { value: "DLND02", label: "New Delhi District Court" },
];

// Generate years 2026 down to 2000
const YEARS = Array.from({ length: 27 }, (_, i) => 2026 - i);

export function SearchFilters({ filters, onChange, onReset }: SearchFiltersProps) {
  const handleChange = (field: keyof SearchFiltersType, value: any) => {
    onChange({ ...filters, [field]: value || undefined, page: 1 });
  };

  return (
    <div className="card-float p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
          Refine Search
        </h4>
        <button
          onClick={onReset}
          className="text-xs font-medium hover:underline cursor-pointer"
          style={{ color: "var(--text-secondary)" }}
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Case Status
          </label>
          <select
            value={filters.case_status || ""}
            onChange={(e) => handleChange("case_status", e.target.value)}
            className="w-full p-2.5 text-xs border outline-none cursor-pointer"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)", borderRadius: "var(--radius-input)" }}
          >
            {CASE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Case Type
          </label>
          <select
            value={filters.case_type || ""}
            onChange={(e) => handleChange("case_type", e.target.value)}
            className="w-full p-2.5 text-xs border outline-none cursor-pointer"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)", borderRadius: "var(--radius-input)" }}
          >
            {CASE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Filing Year
          </label>
          <select
            value={filters.filing_year || ""}
            onChange={(e) => handleChange("filing_year", e.target.value ? Number(e.target.value) : "")}
            className="w-full p-2.5 text-xs border outline-none cursor-pointer"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)", borderRadius: "var(--radius-input)" }}
          >
            <option value="">All Years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Court
          </label>
          <select
            value={filters.court_code || ""}
            onChange={(e) => handleChange("court_code", e.target.value)}
            className="w-full p-2.5 text-xs border outline-none cursor-pointer"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)", borderRadius: "var(--radius-input)" }}
          >
            {COURTS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
