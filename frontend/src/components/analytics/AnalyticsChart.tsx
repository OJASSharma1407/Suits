import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Sector,
  AreaChart,
  Area,
} from "recharts";

interface AnalyticsChartProps {
  title: string;
  type: "bar" | "pie" | "area";
  data: any[];
  subtitle?: string;
}

/* ── Curated Legal-Institution Palette ────────────────────────── */
const PALETTE = {
  sapphire:    { base: "#1e3a5f", light: "#2d5a8e", soft: "rgba(30, 58, 95, 0.12)" },
  gold:        { base: "#b8860b", light: "#d4a843", soft: "rgba(184, 134, 11, 0.12)" },
  emerald:     { base: "#1b6b4a", light: "#2d9d6e", soft: "rgba(27, 107, 74, 0.12)" },
  rose:        { base: "#9e3344", light: "#c75d6e", soft: "rgba(158, 51, 68, 0.12)" },
  slate:       { base: "#4a5568", light: "#718096", soft: "rgba(74, 85, 104, 0.12)" },
};

const PIE_COLORS = [
  PALETTE.sapphire.base,
  PALETTE.gold.base,
  PALETTE.emerald.base,
  PALETTE.rose.base,
  PALETTE.slate.base,
];

const PIE_HOVER_COLORS = [
  PALETTE.sapphire.light,
  PALETTE.gold.light,
  PALETTE.emerald.light,
  PALETTE.rose.light,
  PALETTE.slate.light,
];

/* ── Custom Active-Sector Renderer (donut hover) ──────────────── */
function buildActiveShape(activeIndex: number) {
  return function ActiveShape(props: any) {
    const {
      cx, cy, innerRadius, outerRadius, startAngle, endAngle,
      payload, percent, value, index,
    } = props;

    const isActive = index === activeIndex;
    const expandedOuter = isActive ? outerRadius + 6 : outerRadius;
    const expandedInner = isActive ? innerRadius - 3 : innerRadius;
    const fillColor = PIE_COLORS[index % PIE_COLORS.length];
    const hoverColor = PIE_HOVER_COLORS[index % PIE_HOVER_COLORS.length];

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={expandedInner}
          outerRadius={expandedOuter}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={isActive ? hoverColor : fillColor}
          stroke="none"
          style={isActive ? { filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" } : undefined}
        />
        {isActive && (
          <>
            <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text-primary)" fontSize="20" fontWeight="600">
              {value}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-muted)" fontSize="11" fontWeight="500">
              {payload.name}
            </text>
            <text x={cx} y={cy + 26} textAnchor="middle" fill="var(--text-muted)" fontSize="10">
              {(percent * 100).toFixed(0)}%
            </text>
          </>
        )}
      </g>
    );
  };
}

/* ── Custom Tooltip ───────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        padding: "10px 14px",
        fontSize: "13px",
      }}
    >
      {label && (
        <p style={{ color: "var(--text-muted)", fontSize: "11px", marginBottom: 4, fontWeight: 600, letterSpacing: "0.04em" }}>
          {label}
        </p>
      )}
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: entry.color || entry.fill || PALETTE.sapphire.base,
              flexShrink: 0,
            }}
          />
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{entry.value}</span>
          {entry.name && entry.name !== "value" && (
            <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{entry.name}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function AnalyticsChart({ title, type, data, subtitle }: AnalyticsChartProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const total = type === "pie" ? data.reduce((sum, d) => sum + d.value, 0) : 0;

  return (
    <div
      className="card-float p-6 flex flex-col"
      style={{ minHeight: type === "pie" ? 400 : 350 }}
    >
      {/* Header */}
      <div className="mb-5">
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Chart Area */}
      <div className="flex-1 w-full relative" style={{ minHeight: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradSapphire" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PALETTE.sapphire.light} stopOpacity={1} />
                  <stop offset="100%" stopColor={PALETTE.sapphire.base} stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
                strokeOpacity={0.6}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--text-muted)", fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--text-muted)" }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-container)", radius: 6 }} />
              <Bar
                dataKey="value"
                fill="url(#barGradSapphire)"
                radius={[6, 6, 0, 0]}
                maxBarSize={42}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </BarChart>
          ) : type === "area" ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGradEmerald" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PALETTE.emerald.light} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={PALETTE.emerald.light} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
                strokeOpacity={0.6}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--text-muted)", fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--text-muted)" }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border-strong)", strokeDasharray: "4 4" }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={PALETTE.emerald.base}
                strokeWidth={2.5}
                fill="url(#areaGradEmerald)"
                animationDuration={1000}
                animationEasing="ease-out"
                dot={{ r: 3, fill: PALETTE.emerald.base, stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: PALETTE.emerald.light, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <RechartsPieChart>
              <Pie
                shape={buildActiveShape(activeIndex)}
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                animationDuration={700}
                animationEasing="ease-out"
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </RechartsPieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend for pie charts */}
      {type === "pie" && (
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          {data.map((entry, index) => {
            const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
            return (
              <button
                key={index}
                className="flex items-center gap-2 text-xs px-2 py-1 rounded-full cursor-pointer"
                style={{
                  color: activeIndex === index ? PIE_COLORS[index % PIE_COLORS.length] : "var(--text-secondary)",
                  background: activeIndex === index ? (PIE_COLORS[index % PIE_COLORS.length] + "10") : "transparent",
                  fontWeight: activeIndex === index ? 600 : 400,
                  border: "none",
                  transition: "all 200ms ease",
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span
                  style={{
                    width: 9, height: 9, borderRadius: "50%",
                    background: PIE_COLORS[index % PIE_COLORS.length],
                    boxShadow: activeIndex === index
                      ? `0 0 0 2px ${PIE_COLORS[index % PIE_COLORS.length]}30`
                      : "none",
                    transition: "box-shadow 200ms ease",
                  }}
                />
                <span>{entry.name}</span>
                <span style={{ opacity: 0.6, fontSize: "10px" }}>{pct}%</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
