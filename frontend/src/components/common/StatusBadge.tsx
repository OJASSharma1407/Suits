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
  let isLive = false;

  if (normalized.includes("pending") || normalized.includes("listed")) {
    bg = "rgba(217, 119, 6, 0.10)";
    color = "var(--warning)";
    border = "rgba(217, 119, 6, 0.22)";
    isLive = true; // Pending cases are "live" — animate pulse
  } else if (
    normalized.includes("disposed") ||
    normalized.includes("decided") ||
    normalized.includes("closed")
  ) {
    bg = "rgba(22, 163, 74, 0.10)";
    color = "var(--success)";
    border = "rgba(22, 163, 74, 0.22)";
  } else if (
    normalized.includes("transferred") ||
    normalized.includes("appealed")
  ) {
    bg = "rgba(37, 99, 235, 0.08)";
    color = "#3b82f6";
    border = "rgba(37, 99, 235, 0.20)";
  } else if (normalized.includes("reserved")) {
    bg = "rgba(139, 92, 246, 0.08)";
    color = "#8b5cf6";
    border = "rgba(139, 92, 246, 0.20)";
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border"
      style={{ background: bg, color, borderColor: border }}
    >
      {isLive ? (
        /* Animated pulse dot for live/active cases */
        <span
          className="live-pulse live-pulse-dot"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            display: "inline-block",
            flexShrink: 0,
          }}
        />
      ) : (
        /* Static dot for final states */
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            display: "inline-block",
            flexShrink: 0,
            opacity: 0.7,
          }}
        />
      )}
      {displayLabel}
    </span>
  );
}
