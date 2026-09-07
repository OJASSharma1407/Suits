import React, { useState } from "react";
import {
  Landmark,
  PieChart as PieIcon,
  BarChart2,
  Layers,
  Scale,
  Building,
  Shield,
  Award,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import type { CourtDistributionItem } from "@/types/analytics";

interface CourtDistributionCardProps {
  distribution: CourtDistributionItem[];
}

const PALETTE_COLORS = [
  "#38BDF8", // Apex Court / Sky Sapphire
  "#F59E0B", // Amber Gold (Delhi HC)
  "#10B981", // Emerald (High Courts)
  "#A855F7", // Purple (Tribunals)
  "#EC4899", // Rose
  "#06B6D4", // Cyan
  "#C4A06D", // Brass
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--hairline)",
        borderRadius: "8px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        padding: "8px 12px",
        fontSize: "12px",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="font-semibold text-xs" style={{ color: "var(--ink)" }}>
        {data.court_name || data.name}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium"
          style={{ background: "rgba(255,255,255,0.06)", color: "var(--ink-dim)" }}
        >
          {data.forum_type}
        </span>
        <span className="font-mono font-bold text-xs" style={{ color: "var(--brass)" }}>
          {data.count} {data.count === 1 ? "case" : "cases"} ({data.percentage}%)
        </span>
      </div>
    </div>
  );
}

export function CourtDistributionCard({ distribution }: CourtDistributionCardProps) {
  const [viewMode, setViewMode] = useState<"donut" | "ranked" | "tiers">("donut");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalCases = distribution.reduce((sum, d) => sum + d.count, 0);

  // Group by forum level
  const apexItems = distribution.filter(
    (d) => d.forum_type === "Apex Court" || d.short_name.toLowerCase().includes("supreme")
  );
  const apexCases = apexItems.reduce((sum, d) => sum + d.count, 0);
  const apexPercentage = totalCases > 0 ? ((apexCases / totalCases) * 100).toFixed(0) : "0";

  const hcItems = distribution.filter(
    (d) =>
      d.forum_type === "High Court" ||
      d.short_name.toLowerCase().includes("hc") ||
      d.court_name.toLowerCase().includes("high court")
  );
  const hcCases = hcItems.reduce((sum, d) => sum + d.count, 0);
  const hcPercentage = totalCases > 0 ? ((hcCases / totalCases) * 100).toFixed(0) : "0";

  const tribunalItems = distribution.filter(
    (d) => d.forum_type === "Tribunal" || d.court_name.toLowerCase().includes("tribunal")
  );
  const tribunalCases = tribunalItems.reduce((sum, d) => sum + d.count, 0);
  const tribunalPercentage = totalCases > 0 ? ((tribunalCases / totalCases) * 100).toFixed(0) : "0";

  const topCourt = distribution.length > 0
    ? [...distribution].sort((a, b) => b.count - a.count)[0]
    : null;

  const chartData = distribution.map((d) => ({
    name: d.short_name,
    court_name: d.court_name,
    value: d.count,
    count: d.count,
    percentage: d.percentage,
    forum_type: d.forum_type,
  }));

  const activeItem = hoveredIndex !== null ? chartData[hoveredIndex] : null;
  const activeColor = hoveredIndex !== null ? PALETTE_COLORS[hoveredIndex % PALETTE_COLORS.length] : null;

  return (
    <div className="card-float p-6 flex flex-col justify-between">
      {/* ── Header with View Switcher ─────────────────────────── */}
      <div>
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
            {/* View Mode Switcher */}
            <div
              className="inline-flex p-0.5 rounded-lg"
              style={{ background: "var(--surface-container)", border: "1px solid var(--hairline)" }}
            >
              <button
                onClick={() => setViewMode("donut")}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold font-mono flex items-center gap-1 transition-all ${
                  viewMode === "donut" ? "shadow-xs" : ""
                }`}
                style={{
                  background: viewMode === "donut" ? "var(--surface)" : "transparent",
                  color: viewMode === "donut" ? "var(--ink)" : "var(--ink-faint)",
                }}
                title="Donut Distribution View"
              >
                <PieIcon size={12} />
                Donut
              </button>
              <button
                onClick={() => setViewMode("ranked")}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold font-mono flex items-center gap-1 transition-all ${
                  viewMode === "ranked" ? "shadow-xs" : ""
                }`}
                style={{
                  background: viewMode === "ranked" ? "var(--surface)" : "transparent",
                  color: viewMode === "ranked" ? "var(--ink)" : "var(--ink-faint)",
                }}
                title="Ranked Comparison View"
              >
                <BarChart2 size={12} />
                Ranked
              </button>
              <button
                onClick={() => setViewMode("tiers")}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold font-mono flex items-center gap-1 transition-all ${
                  viewMode === "tiers" ? "shadow-xs" : ""
                }`}
                style={{
                  background: viewMode === "tiers" ? "var(--surface)" : "transparent",
                  color: viewMode === "tiers" ? "var(--ink)" : "var(--ink-faint)",
                }}
                title="Forum Tiers View"
              >
                <Layers size={12} />
                Tiers
              </button>
            </div>
          </div>
        </div>

        {/* ── Key Jurisdictional Intelligence Strip ─────────────── */}
        {distribution.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div
              className="p-2.5 rounded-xl flex flex-col justify-center transition-all"
              style={{ background: "var(--surface-container)", border: "1px solid var(--hairline)" }}
            >
              <div className="flex items-center gap-1">
                <Award size={11} style={{ color: "var(--brass)" }} />
                <span className="text-[9px] uppercase font-mono tracking-wider font-semibold" style={{ color: "var(--ink-faint)" }}>
                  Primary Forum
                </span>
              </div>
              <span className="text-xs font-bold truncate mt-1" style={{ color: "var(--ink)" }}>
                {topCourt?.short_name || "N/A"}
              </span>
              <span className="text-[10px] font-mono mt-0.5" style={{ color: "var(--brass)" }}>
                {topCourt ? `${topCourt.percentage}% Share` : "No data"}
              </span>
            </div>

            <div
              className="p-2.5 rounded-xl flex flex-col justify-center transition-all"
              style={{ background: "var(--surface-container)", border: "1px solid var(--hairline)" }}
            >
              <div className="flex items-center gap-1">
                <Scale size={11} style={{ color: "#38BDF8" }} />
                <span className="text-[9px] uppercase font-mono tracking-wider font-semibold" style={{ color: "var(--ink-faint)" }}>
                  Apex Ratio
                </span>
              </div>
              <span className="text-xs font-bold font-mono mt-1" style={{ color: "#38BDF8" }}>
                {apexPercentage}%
              </span>
              <span className="text-[10px] font-mono mt-0.5" style={{ color: "var(--ink-dim)" }}>
                {apexCases} of {totalCases} Cases
              </span>
            </div>

            <div
              className="p-2.5 rounded-xl flex flex-col justify-center transition-all"
              style={{ background: "var(--surface-container)", border: "1px solid var(--hairline)" }}
            >
              <div className="flex items-center gap-1">
                <Building size={11} style={{ color: "var(--seal-disposed)" }} />
                <span className="text-[9px] uppercase font-mono tracking-wider font-semibold" style={{ color: "var(--ink-faint)" }}>
                  High Courts
                </span>
              </div>
              <span className="text-xs font-bold font-mono mt-1" style={{ color: "var(--seal-disposed)" }}>
                {hcCases} Cases
              </span>
              <span className="text-[10px] font-mono mt-0.5" style={{ color: "var(--ink-dim)" }}>
                {hcItems.length} Regional Bench{hcItems.length !== 1 ? "es" : ""}
              </span>
            </div>
          </div>
        )}

        {/* ── Main Content Area ─────────────────────────────────── */}
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
        ) : viewMode === "donut" ? (
          /* ── Donut + Interactive Cards View ─────────────────── */
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Donut graphic with center telemetry */}
            <div className="sm:col-span-5 h-[175px] flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="transparent"
                    onMouseEnter={(_, index) => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    animationDuration={500}
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PALETTE_COLORS[index % PALETTE_COLORS.length]}
                        opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.55}
                        style={{
                          cursor: "pointer",
                          transition: "opacity 250ms ease",
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RechartsPieChart>
              </ResponsiveContainer>

              {/* Dynamic Center Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span
                  className="text-xl font-bold font-mono transition-all"
                  style={{ color: activeColor || "var(--ink)" }}
                >
                  {activeItem ? activeItem.count : totalCases}
                </span>
                <span
                  className="text-[10px] font-medium uppercase tracking-wider truncate max-w-[80px]"
                  style={{ color: "var(--ink-faint)" }}
                >
                  {activeItem ? activeItem.name : "Cases"}
                </span>
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded mt-0.5"
                  style={{
                    background: activeColor ? `${activeColor}20` : "var(--surface-container-high)",
                    color: activeColor || "var(--brass)",
                    border: `1px solid ${activeColor ? `${activeColor}40` : "var(--hairline)"}`,
                  }}
                >
                  {activeItem ? `${activeItem.percentage}%` : `${distribution.length} Forums`}
                </span>
              </div>
            </div>

            {/* Interactive Court Cards List */}
            <div className="sm:col-span-7 flex flex-col gap-2">
              {chartData.map((entry, index) => {
                const isHovered = hoveredIndex === index;
                const color = PALETTE_COLORS[index % PALETTE_COLORS.length];

                return (
                  <div
                    key={index}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="p-2.5 rounded-xl transition-all cursor-pointer"
                    style={{
                      background: isHovered ? "var(--surface-container-high)" : "var(--surface-container)",
                      border: isHovered ? `1px solid ${color}80` : "1px solid var(--hairline)",
                      boxShadow: isHovered ? `0 2px 12px ${color}20` : "none",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Court Initials Avatar */}
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-mono font-bold"
                          style={{
                            background: `${color}18`,
                            color: color,
                            border: `1px solid ${color}40`,
                          }}
                        >
                          {entry.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="text-xs font-semibold truncate"
                              style={{ color: isHovered ? "var(--ink)" : "var(--ink-dim)" }}
                            >
                              {entry.name}
                            </span>
                            <span
                              className="text-[9px] px-1.5 py-0.2 rounded font-mono font-medium"
                              style={{
                                background: "rgba(255,255,255,0.04)",
                                color: "var(--ink-faint)",
                                border: "1px solid var(--hairline)",
                              }}
                            >
                              {entry.forum_type}
                            </span>
                          </div>
                          <p className="text-[10px] truncate mt-0.5 hidden sm:block" style={{ color: "var(--ink-faint)" }}>
                            {entry.court_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <div
                          className="w-12 h-1.5 rounded-full overflow-hidden hidden md:block"
                          style={{ background: "var(--hairline)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${entry.percentage}%`, background: color }}
                          />
                        </div>
                        <span className="text-xs font-bold font-mono w-5 text-right" style={{ color: isHovered ? color : "var(--ink)" }}>
                          {entry.count}
                        </span>
                        <span className="text-[10px] font-medium font-mono w-8 text-right" style={{ color: "var(--ink-faint)" }}>
                          {entry.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : viewMode === "ranked" ? (
          /* ── Ranked Horizontal Bars View ─────────────────────── */
          <div className="flex flex-col gap-2 py-1">
            {chartData.map((item, idx) => {
              const color = PALETTE_COLORS[idx % PALETTE_COLORS.length];
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl transition-all"
                  style={{
                    background: "var(--surface-container)",
                    border: "1px solid var(--hairline)",
                  }}
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0"
                        style={{
                          background: idx === 0 ? "var(--brass-soft)" : "rgba(255,255,255,0.04)",
                          color: idx === 0 ? "var(--brass)" : "var(--ink-faint)",
                          border: `1px solid ${idx === 0 ? "var(--brass)" : "var(--hairline)"}`,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold truncate" style={{ color: "var(--ink)" }}>
                        {item.court_name || item.name}
                      </span>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ml-1 hidden sm:inline"
                        style={{ background: `${color}15`, color: color, border: `1px solid ${color}30` }}
                      >
                        {item.forum_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-bold font-mono" style={{ color: color }}>
                        {item.count} {item.count === 1 ? "case" : "cases"}
                      </span>
                      <span className="text-[10px] font-mono font-semibold" style={{ color: "var(--ink-faint)" }}>
                        {item.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--hairline)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Forum Tiers Grouped View ────────────────────────── */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 py-1">
            {/* Apex Court Tier */}
            <div
              className="p-3 rounded-xl flex flex-col justify-between"
              style={{ background: "var(--surface-container)", border: "1px solid var(--hairline)" }}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Scale size={13} style={{ color: "#38BDF8" }} />
                    <span className="text-[11px] font-semibold" style={{ color: "var(--ink)" }}>
                      Apex Court
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold" style={{ color: "#38BDF8" }}>
                    {apexPercentage}%
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {apexItems.length > 0 ? (
                    apexItems.map((c, i) => (
                      <div key={i} className="text-[10px] flex items-center justify-between" style={{ color: "var(--ink-dim)" }}>
                        <span className="truncate">{c.short_name}</span>
                        <span className="font-mono font-semibold">{c.count}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px]" style={{ color: "var(--ink-faint)" }}>No cases</span>
                  )}
                </div>
              </div>
              <div className="w-full h-1 rounded-full mt-2" style={{ background: "var(--hairline)" }}>
                <div className="h-full rounded-full" style={{ width: `${apexPercentage}%`, background: "#38BDF8" }} />
              </div>
            </div>

            {/* High Courts Tier */}
            <div
              className="p-3 rounded-xl flex flex-col justify-between"
              style={{ background: "var(--surface-container)", border: "1px solid var(--hairline)" }}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Building size={13} style={{ color: "#10B981" }} />
                    <span className="text-[11px] font-semibold" style={{ color: "var(--ink)" }}>
                      High Courts
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold" style={{ color: "#10B981" }}>
                    {hcPercentage}%
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {hcItems.length > 0 ? (
                    hcItems.map((c, i) => (
                      <div key={i} className="text-[10px] flex items-center justify-between" style={{ color: "var(--ink-dim)" }}>
                        <span className="truncate">{c.short_name}</span>
                        <span className="font-mono font-semibold">{c.count}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px]" style={{ color: "var(--ink-faint)" }}>No cases</span>
                  )}
                </div>
              </div>
              <div className="w-full h-1 rounded-full mt-2" style={{ background: "var(--hairline)" }}>
                <div className="h-full rounded-full" style={{ width: `${hcPercentage}%`, background: "#10B981" }} />
              </div>
            </div>

            {/* Tribunals Tier */}
            <div
              className="p-3 rounded-xl flex flex-col justify-between"
              style={{ background: "var(--surface-container)", border: "1px solid var(--hairline)" }}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Shield size={13} style={{ color: "#8B5CF6" }} />
                    <span className="text-[11px] font-semibold" style={{ color: "var(--ink)" }}>
                      Tribunals
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold" style={{ color: "#8B5CF6" }}>
                    {tribunalPercentage}%
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {tribunalItems.length > 0 ? (
                    tribunalItems.map((c, i) => (
                      <div key={i} className="text-[10px] flex items-center justify-between" style={{ color: "var(--ink-dim)" }}>
                        <span className="truncate">{c.short_name}</span>
                        <span className="font-mono font-semibold">{c.count}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px]" style={{ color: "var(--ink-faint)" }}>No cases</span>
                  )}
                </div>
              </div>
              <div className="w-full h-1 rounded-full mt-2" style={{ background: "var(--hairline)" }}>
                <div className="h-full rounded-full" style={{ width: `${tribunalPercentage}%`, background: "#8B5CF6" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Jurisdictional Tier Spectrum Footer ───────────────── */}
      {distribution.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-[var(--hairline)]">
          <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
            <span className="uppercase tracking-wider font-semibold" style={{ color: "var(--ink-faint)" }}>
              Jurisdictional Spectrum
            </span>
            <span style={{ color: "var(--ink-dim)" }}>
              {apexCases} Apex • {hcCases} High Court{hcCases !== 1 ? "s" : ""}{tribunalCases > 0 ? ` • ${tribunalCases} Tribunals` : ""}
            </span>
          </div>

          {/* Multi-segment stacked spectrum bar */}
          <div
            className="w-full h-2 rounded-full overflow-hidden flex gap-0.5 p-0.5"
            style={{ background: "var(--surface-container)" }}
          >
            {Number(apexPercentage) > 0 && (
              <div
                className="h-full rounded-sm transition-all duration-500"
                style={{ width: `${apexPercentage}%`, background: "#38BDF8" }}
                title={`Apex Court: ${apexCases} cases (${apexPercentage}%)`}
              />
            )}
            {Number(hcPercentage) > 0 && (
              <div
                className="h-full rounded-sm transition-all duration-500"
                style={{ width: `${hcPercentage}%`, background: "#10B981" }}
                title={`High Courts: ${hcCases} cases (${hcPercentage}%)`}
              />
            )}
            {Number(tribunalPercentage) > 0 && (
              <div
                className="h-full rounded-sm transition-all duration-500"
                style={{ width: `${tribunalPercentage}%`, background: "#8B5CF6" }}
                title={`Tribunals: ${tribunalCases} cases (${tribunalPercentage}%)`}
              />
            )}
          </div>

          {/* Spectrum Legend Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2 mt-2 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "#38BDF8" }} />
              <span style={{ color: "var(--ink-dim)" }}>Apex Court ({apexPercentage}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "#10B981" }} />
              <span style={{ color: "var(--ink-dim)" }}>High Courts ({hcPercentage}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "#8B5CF6" }} />
              <span style={{ color: "var(--ink-dim)" }}>Tribunals ({tribunalPercentage}%)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
