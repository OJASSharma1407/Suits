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
  sapphire: { base: "#1e3a5f", light: "#2d5a8e", soft: "rgba(30, 58, 95, 0.12)" },
  gold: { base: "#b8860b", light: "#d4a843", soft: "rgba(184, 134, 11, 0.12)" },
  emerald: { base: "#1b6b4a", light: "#2d9d6e", soft: "rgba(27, 107, 74, 0.12)" },
  rose: { base: "#9e3344", light: "#c75d6e", soft: "rgba(158, 51, 68, 0.12)" },
  slate: { base: "#4a5568", light: "#718096", soft: "rgba(74, 85, 104, 0.12)" },
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
    const expandedOuter = isActive ? outerRadius + 5 : outerRadius;
    const expandedInner = isActive ? innerRadius - 2 : innerRadius;
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
          style={isActive ? { filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.12))" } : undefined}
        />
        {isActive && (
          <>
            <text x={cx} y={cy - 5} textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="700">
              {value}
            </text>
            <text x={cx} y={cy + 13} textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontWeight="500">
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
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        padding: "8px 12px",
        fontSize: "12px",
      }}
    >
      {label && (
        <p style={{ color: "var(--text-muted)", fontSize: "10px", marginBottom: 3, fontWeight: 600 }}>
          {label}
        </p>
      )}
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 7, height: 7, borderRadius: "50%",
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

  if (type === "pie") {
    return (
      <div className="card-float p-5 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                {subtitle}
              </p>
            )}
          </div>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "var(--surface-container)", color: "var(--text-secondary)" }}
          >
            {total} Total
          </span>
        </div>

        {/* Spacious Side-by-Side Layout: Donut on Left, Rich List on Right */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-1">
          {/* Donut Chart */}
          <div className="sm:col-span-5 h-[160px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  shape={buildActiveShape(activeIndex)}
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={68}
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
            </ResponsiveContainer>
          </div>

          {/* Interactive Breakdown List with Mini Progress Bars */}
          <div className="sm:col-span-7 flex flex-col justify-center gap-1.5">
            {data.map((entry, index) => {
              const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
              const isActive = activeIndex === index;
              const color = PIE_COLORS[index % PIE_COLORS.length];

              return (
                <div
                  key={index}
                  onMouseEnter={() => setActiveIndex(index)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                  style={{
                    background: isActive ? "var(--surface-container)" : "transparent",
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: color,
                        boxShadow: isActive ? `0 0 0 3px ${color}30` : "none",
                        transition: "box-shadow 200ms ease",
                      }}
                    />
                    <span
                      className="text-xs font-medium truncate"
                      style={{
                        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                        fontWeight: isActive ? 600 : 500,
                      }}
                    >
                      {entry.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <div
                      className="w-14 h-1.5 rounded-full overflow-hidden hidden md:block"
                      style={{ background: "var(--border)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <span className="text-xs font-semibold font-mono w-5 text-right" style={{ color: "var(--text-primary)" }}>
                      {entry.value}
                    </span>
                    <span className="text-[10px] font-medium w-7 text-right" style={{ color: "var(--text-muted)" }}>
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Bar and Area charts fallback
  return (
    <div className="card-float p-5 flex flex-col justify-between">
      <div className="mb-2">
        <h3
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="w-full relative h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} dy={5} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-container)", radius: 6 }} />
              <Bar dataKey="value" fill={PALETTE.sapphire.base} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} dy={5} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="value" stroke={PALETTE.emerald.base} strokeWidth={2} fill={PALETTE.emerald.soft} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
