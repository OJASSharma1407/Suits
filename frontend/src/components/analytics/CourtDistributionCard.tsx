import React, { useState } from "react";
import { Landmark, PieChart as PieIcon, BarChart2 } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Sector,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { CourtDistributionItem } from "@/types/analytics";

interface CourtDistributionCardProps {
  distribution: CourtDistributionItem[];
}

const PALETTE_COLORS = [
  "#1e3a5f", // Sapphire
  "#b8860b", // Gold/Brass
  "#1b6b4a", // Emerald
  "#9e3344", // Rose
  "#4a5568", // Slate
  "#5b4b8a", // Purple
  "#2c5c7d", // Bright Brass
];

function buildActiveShape(activeIndex: number) {
  return function ActiveShape(props: any) {
    const {
      cx, cy, innerRadius, outerRadius, startAngle, endAngle,
      percent, value, index,
    } = props;

    const isActive = index === activeIndex;
    const expandedOuter = isActive ? outerRadius + 6 : outerRadius;
    const expandedInner = isActive ? innerRadius - 2 : innerRadius;
    const fillColor = PALETTE_COLORS[index % PALETTE_COLORS.length];

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={expandedInner}
          outerRadius={expandedOuter}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fillColor}
          stroke="none"
          style={isActive ? { filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.15))" } : undefined}
        />
        {isActive && (
          <>
            <text x={cx} y={cy - 5} textAnchor="middle" fill="var(--ink)" fontSize="18" fontWeight="700">
              {value}
            </text>
            <text x={cx} y={cy + 13} textAnchor="middle" fill="var(--ink-faint)" fontSize="10" fontWeight="500">
              {(percent * 100).toFixed(0)}%
            </text>
          </>
        )}
      </g>
    );
  };
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-md)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        padding: "8px 12px",
        fontSize: "12px",
      }}
    >
      <div className="font-semibold text-xs" style={{ color: "var(--ink)" }}>
        {data.court_name || data.name}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
          {data.forum_type} •
        </span>
        <span className="font-mono font-bold" style={{ color: "var(--brass)" }}>
          {data.count || data.value} cases ({data.percentage}%)
        </span>
      </div>
    </div>
  );
}

export function CourtDistributionCard({ distribution }: CourtDistributionCardProps) {
  const [viewMode, setViewMode] = useState<"pie" | "bar">("pie");
  const [activeIndex, setActiveIndex] = useState(0);

  const totalCases = distribution.reduce((sum, d) => sum + d.count, 0);

  const chartData = distribution.map((d) => ({
    name: d.short_name,
    court_name: d.court_name,
    value: d.count,
    count: d.count,
    percentage: d.percentage,
    forum_type: d.forum_type,
  }));

  return (
    <div className="card-float p-6 flex flex-col justify-between">
      {/* ── Header with View Switcher ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Landmark size={16} style={{ color: "var(--brass)" }} />
            <h3
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--ink)", letterSpacing: "0.06em" }}
            >
              Court & Forum Distribution
            </h3>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-faint)" }}>
            Breakdown across Supreme Court, High Courts, and Appellate Tribunals
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full"
            style={{ background: "var(--surface-container)", color: "var(--ink-dim)" }}
          >
            {totalCases} Cases
          </span>

          <div
            className="inline-flex p-0.5 rounded-lg"
            style={{ background: "var(--surface-container)", border: "1px solid var(--hairline)" }}
          >
            <button
              onClick={() => setViewMode("pie")}
              className={`p-1 rounded-md transition-all ${viewMode === "pie" ? "shadow-xs" : ""}`}
              style={{
                background: viewMode === "pie" ? "var(--surface)" : "transparent",
                color: viewMode === "pie" ? "var(--ink)" : "var(--ink-faint)",
              }}
              title="Donut View"
            >
              <PieIcon size={14} />
            </button>
            <button
              onClick={() => setViewMode("bar")}
              className={`p-1 rounded-md transition-all ${viewMode === "bar" ? "shadow-xs" : ""}`}
              style={{
                background: viewMode === "bar" ? "var(--surface)" : "transparent",
                color: viewMode === "bar" ? "var(--ink)" : "var(--ink-faint)",
              }}
              title="Bar View"
            >
              <BarChart2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {distribution.length === 0 ? (
        <div
          className="p-8 rounded-2xl text-center flex flex-col items-center justify-center my-4"
          style={{ background: "var(--surface-container)", border: "1px dashed var(--hairline)" }}
        >
          <Landmark size={28} className="mb-2" style={{ color: "var(--brass)" }} />
          <h4 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            No Court Telemetry Recorded
          </h4>
          <p className="text-xs max-w-sm mt-1 mb-3" style={{ color: "var(--ink-faint)" }}>
            Your bookmarked judgments and saved court orders will populate this forum distribution.
          </p>
        </div>
      ) : viewMode === "pie" ? (
        /* ── Donut Chart View ─────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-2">
          {/* Donut graphic */}
          <div className="sm:col-span-5 h-[170px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  shape={buildActiveShape(activeIndex)}
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  animationDuration={600}
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PALETTE_COLORS[index % PALETTE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Legend List */}
          <div className="sm:col-span-7 flex flex-col justify-center gap-1.5">
            {chartData.map((entry, index) => {
              const isActive = activeIndex === index;
              const color = PALETTE_COLORS[index % PALETTE_COLORS.length];

              return (
                <div
                  key={index}
                  onMouseEnter={() => setActiveIndex(index)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                  style={{
                    background: isActive ? "var(--surface-container-high)" : "transparent",
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
                    <div className="min-w-0 flex-1 truncate">
                      <span
                        className="text-xs font-medium truncate block"
                        style={{
                          color: isActive ? "var(--ink)" : "var(--ink-dim)",
                          fontWeight: isActive ? 600 : 500,
                        }}
                      >
                        {entry.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <div
                      className="w-14 h-1.5 rounded-full overflow-hidden hidden md:block"
                      style={{ background: "var(--hairline)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${entry.percentage}%`, background: color }}
                      />
                    </div>
                    <span className="text-xs font-semibold font-mono w-5 text-right" style={{ color: "var(--ink)" }}>
                      {entry.value}
                    </span>
                    <span className="text-[10px] font-medium font-mono w-7 text-right" style={{ color: "var(--ink-faint)" }}>
                      {entry.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Bar Chart View ───────────────────────────────────── */
        <div className="w-full relative h-[180px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hairline)" strokeOpacity={0.6} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--ink-faint)" }} dy={5} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--ink-faint)" }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface-container)", radius: 6 }} />
              <Bar dataKey="value" fill="var(--brass)" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {chartData.map((_, index) => (
                  <Cell key={`bar-cell-${index}`} fill={PALETTE_COLORS[index % PALETTE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
