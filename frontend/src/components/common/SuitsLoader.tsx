import React from "react";

export interface SuitsLoaderProps {
  /** Size of the spinner in px (default: 50) */
  size?: number;
  /** Primary label under the spinner, e.g. "Searching cases..." */
  label?: string;
  /** Secondary subtitle / hint text */
  sublabel?: string;
  /** Custom wrapper class */
  className?: string;
  /** Custom spinner styles or CSS variable overrides */
  style?: React.CSSProperties;
}

/**
 * SuitsLoader - Conic gradient spinning animation based on Loading.css.
 * Adapts to theme:
 * - Light Mode: Jet Black (#000000)
 * - Dark Mode: Pure White (#ffffff)
 */
export function SuitsLoader({
  size = 50,
  label,
  sublabel,
  className = "",
  style,
}: SuitsLoaderProps) {
  const thickness = Math.max(3, Math.round(size * 0.16));

  return (
    <div
      className={`flex flex-col items-center justify-center p-6 text-center select-none ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className="loader"
        style={{
          ["--loader-size" as string]: `${size}px`,
          ["--loader-thickness" as string]: `${thickness}px`,
          ...style,
        }}
        aria-hidden="true"
      />
      {label && (
        <p
          className="mt-4 text-sm font-semibold tracking-tight animate-pulse"
          style={{ color: "var(--ink, #111827)" }}
        >
          {label}
        </p>
      )}
      {sublabel && (
        <p
          className="mt-1 text-xs max-w-sm"
          style={{ color: "var(--ink-faint, #6B7280)" }}
        >
          {sublabel}
        </p>
      )}
    </div>
  );
}
