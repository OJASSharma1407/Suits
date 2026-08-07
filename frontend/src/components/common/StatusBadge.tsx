import React from "react";

interface StatusBadgeProps {
  status: string | null;
  label?: string | null;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const normalized = (status || "").toLowerCase();
  const displayLabel = label || status || "Unknown";

  let bg = "var(--surface-container)";
  let color = "var(--text-secondary)";
  let border = "var(--border)";

  if (normalized.includes("pending") || normalized.includes("listed")) {
    bg = "rgba(217, 119, 6, 0.1)";
    color = "var(--warning)";
    border = "rgba(217, 119, 6, 0.2)";
  } else if (normalized.includes("disposed") || normalized.includes("decided") || normalized.includes("closed")) {
    bg = "rgba(22, 163, 74, 0.1)";
    color = "var(--success)";
    border = "rgba(22, 163, 74, 0.2)";
  } else if (normalized.includes("transferred") || normalized.includes("appealed")) {
    bg = "rgba(37, 99, 235, 0.08)";
    color = "var(--text-primary)";
    border = "rgba(37, 99, 235, 0.2)";
  }

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border"
      style={{ background: bg, color, borderColor: border }}
    >
      {displayLabel}
    </span>
  );
}
