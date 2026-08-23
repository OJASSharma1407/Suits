import React from "react";

interface StatusBadgeProps {
  status: string | null;
  label?: string | null;
}

function getStampVariant(status: string | null): string {
  const s = (status || "").toLowerCase();
  if (s.includes("pending") || s.includes("listed")) return "pending";
  if (s.includes("disposed") || s.includes("decided") || s.includes("closed") || s.includes("allowed") || s.includes("decreed") || s.includes("dismissed")) return "disposed";
  if (s.includes("transfer") || s.includes("appeal")) return "transfer";
  if (s.includes("admit")) return "admitted";
  if (s.includes("reserved")) return "reserved";
  return "disposed";
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const s = (status || "").trim().toLowerCase();
  const l = (label || "").trim().toLowerCase();

  // If status is unknown or empty, do not render
  if ((!s || s === "unknown" || s === "none") && (!l || l === "unknown" || l === "none")) {
    return null;
  }

  const variant = getStampVariant(status);
  const displayLabel = label || status || "";
  const isPending = variant === "pending";

  return (
    <span className={`stamp ${variant}`} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {isPending && (
        <span
          className="live-pulse live-pulse-dot"
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "currentColor",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
      )}
      {displayLabel}
    </span>
  );
}
