import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  sparklineData?: number[];
  variant?: "default" | "emerald" | "amber" | "indigo";
}

function MiniSparkline({
  data,
  isPositive = true,
}: {
  data: number[];
  isPositive?: boolean;
}) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 96;
  const height = 30;
  const padding = 3;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    const prev = points[i - 1];
    const cx = ((prev.x + pt.x) / 2).toFixed(1);
    return `${acc} C ${cx} ${prev.y.toFixed(1)}, ${cx} ${pt.y.toFixed(1)}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, "");

  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  const areaD = `${pathD} L ${lastPt.x.toFixed(1)} ${height} L ${firstPt.x.toFixed(1)} ${height} Z`;
  const strokeColor = isPositive ? "#16a34a" : "#dc2626";
  const gradId = `spark-grad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg width={width} height={height} className="overflow-visible" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastPt.x} cy={lastPt.y} r="2.5" fill={strokeColor} />
    </svg>
  );
}

export function MetricCard({
  title,
  value,
  icon,
  trend,
  sparklineData,
}: MetricCardProps) {
  // Generate consistent pseudo-sparkline data if none provided
  const numVal = typeof value === "number" ? value : parseInt(String(value), 10) || 10;
  const defaultSparkline = sparklineData || [
    Math.max(2, Math.round(numVal * 0.4)),
    Math.max(3, Math.round(numVal * 0.65)),
    Math.max(2, Math.round(numVal * 0.5)),
    Math.max(4, Math.round(numVal * 0.8)),
    Math.max(3, Math.round(numVal * 0.75)),
    Math.max(5, Math.round(numVal * 0.95)),
    Math.max(5, numVal || 4),
  ];

  const isPositiveTrend = trend ? trend.isPositive : true;

  return (
    <div className="card-float p-5 relative overflow-hidden group">
      {/* Subtle ambient corner glow */}
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-50 transition-opacity group-hover:opacity-80"
        style={{
          background: isPositiveTrend
            ? "radial-gradient(circle, rgba(22, 163, 74, 0.15) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(220, 38, 38, 0.15) 0%, transparent 70%)",
        }}
      />

      <div className="flex items-center justify-between mb-3 relative z-10">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
          style={{
            background: "var(--surface-container)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
          }}
        >
          {icon}
        </div>

        {trend ? (
          <span
            className="text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1"
            style={{
              background: trend.isPositive ? "rgba(22, 163, 74, 0.08)" : "rgba(220, 38, 38, 0.08)",
              color: trend.isPositive ? "var(--success)" : "var(--danger)",
              border: `1px solid ${trend.isPositive ? "rgba(22, 163, 74, 0.2)" : "rgba(220, 38, 38, 0.2)"}`,
            }}
          >
            <span>{trend.isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
            {trend.label && <span className="opacity-75 text-[10px]">{trend.label}</span>}
          </span>
        ) : (
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{
              background: "var(--surface-container)",
              color: "var(--text-muted)",
            }}
          >
            Live
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-2 relative z-10 mt-2">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1"
            style={{ color: "var(--text-muted)" }}
          >
            {title}
          </p>
          <p
            className="text-2xl sm:text-3xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {value}
          </p>
        </div>

        <div className="pb-1">
          <MiniSparkline data={defaultSparkline} isPositive={isPositiveTrend} />
        </div>
      </div>
    </div>
  );
}
