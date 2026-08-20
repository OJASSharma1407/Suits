import React from "react";

interface SkeletonLoaderProps {
  count?: number;
  height?: string;
  className?: string;
  /**
   * "line"   – default thin lines (for text content)
   * "card"   – tall rounded card placeholder
   * "avatar" – small circular avatar placeholder
   * "row"    – icon + two-line text row (list items)
   */
  variant?: "line" | "card" | "avatar" | "row";
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3" style={{ background: "var(--card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
      {/* Avatar */}
      <div className="skeleton flex-shrink-0" style={{ width: 36, height: 36, borderRadius: "var(--radius-lg)" }} />
      {/* Lines */}
      <div className="flex-1 space-y-2">
        <div className="skeleton" style={{ height: 13, width: "60%", borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 11, width: "40%", borderRadius: 6 }} />
      </div>
      {/* End badge */}
      <div className="skeleton flex-shrink-0" style={{ height: 20, width: 56, borderRadius: 999 }} />
    </div>
  );
}

function SkeletonCard({ height }: { height: string }) {
  return (
    <div className="skeleton" style={{ height, borderRadius: "var(--radius-card)" }} />
  );
}

function SkeletonAvatar() {
  return (
    <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
  );
}

function SkeletonLine({ height }: { height: string }) {
  return <div className="skeleton" style={{ height }} />;
}

export function SkeletonLoader({
  count = 1,
  height = "20px",
  className = "",
  variant = "line",
}: SkeletonLoaderProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => {
        if (variant === "row")    return <SkeletonRow key={i} />;
        if (variant === "card")   return <SkeletonCard key={i} height={height} />;
        if (variant === "avatar") return <SkeletonAvatar key={i} />;
        return <SkeletonLine key={i} height={height} />;
      })}
    </div>
  );
}
