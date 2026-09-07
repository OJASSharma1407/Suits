import React, { useState } from "react";
import { Flame, Award, Calendar, Clock, Filter } from "lucide-react";
import type { HeatmapDay, ResearchActivityTelemetry } from "@/types/analytics";

interface ResearchHeatmapProps {
  telemetry: ResearchActivityTelemetry;
}

type FilterMode = "all" | "searches" | "ai" | "views";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ResearchHeatmap({ telemetry }: ResearchHeatmapProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  const days = telemetry.heatmap_matrix || [];

  // Group days into 12 weeks: weekIndex -> 7 days
  const weeks: HeatmapDay[][] = [];
  for (let w = 0; w < 12; w++) {
    const weekDays = days.filter((d) => d.week_index === w);
    if (weekDays.length > 0) {
      weeks.push(weekDays);
    }
  }

  // Calculate cell level based on selected filter mode
  const getCellLevel = (day: HeatmapDay): number => {
    let val = day.total_actions;
    if (filterMode === "searches") val = day.searches;
    if (filterMode === "ai") val = day.ai_queries;
    if (filterMode === "views") val = day.case_views;

    if (val === 0) return 0;
    if (val <= 1) return 1;
    if (val <= 3) return 2;
    if (val <= 6) return 3;
    return 4;
  };

  const getLevelColor = (level: number): string => {
    switch (level) {
      case 1:
        return "rgba(62, 124, 166, 0.28)";
      case 2:
        return "rgba(62, 124, 166, 0.52)";
      case 3:
        return "rgba(62, 124, 166, 0.78)";
      case 4:
        return "var(--brass)";
      case 0:
      default:
        return "var(--surface-container)";
    }
  };

  return (
    <div className="card-float p-6 flex flex-col justify-between">
      {/* ── Header & Filter Bar ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Calendar size={16} style={{ color: "var(--brass)" }} />
            <h3
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--ink)", letterSpacing: "0.06em" }}
            >
              Research Activity Heatmap
            </h3>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-faint)" }}>
            Rolling 12-week cadence tracking daily legal research and inquiries
          </p>
        </div>

        {/* Filter Pills */}
        <div
          className="inline-flex p-0.5 rounded-lg self-start sm:self-auto"
          style={{ background: "var(--surface-container)", border: "1px solid var(--hairline)" }}
        >
          <button
            onClick={() => setFilterMode("all")}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
              filterMode === "all" ? "shadow-xs" : ""
            }`}
            style={{
              background: filterMode === "all" ? "var(--surface)" : "transparent",
              color: filterMode === "all" ? "var(--ink)" : "var(--ink-dim)",
            }}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilterMode("searches")}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
              filterMode === "searches" ? "shadow-xs" : ""
            }`}
            style={{
              background: filterMode === "searches" ? "var(--surface)" : "transparent",
              color: filterMode === "searches" ? "var(--ink)" : "var(--ink-dim)",
            }}
          >
            Searches
          </button>
          <button
            onClick={() => setFilterMode("ai")}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
              filterMode === "ai" ? "shadow-xs" : ""
            }`}
            style={{
              background: filterMode === "ai" ? "var(--surface)" : "transparent",
              color: filterMode === "ai" ? "var(--ink)" : "var(--ink-dim)",
            }}
          >
            AI Queries
          </button>
          <button
            onClick={() => setFilterMode("views")}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
              filterMode === "views" ? "shadow-xs" : ""
            }`}
            style={{
              background: filterMode === "views" ? "var(--surface)" : "transparent",
              color: filterMode === "views" ? "var(--ink)" : "var(--ink-dim)",
            }}
          >
            Case Reads
          </button>
        </div>
      </div>

      {/* ── Telemetry Quick Stats ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div
          className="p-3 rounded-xl flex items-center gap-3"
          style={{ background: "var(--surface-container)", border: "1px solid var(--hairline)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(220, 100, 30, 0.12)", color: "#DC641E" }}
          >
            <Flame size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider" style={{ color: "var(--ink-faint)" }}>
              Current Streak
            </div>
            <div className="text-base font-semibold font-mono" style={{ color: "var(--ink)" }}>
              {telemetry.current_streak_days} {telemetry.current_streak_days === 1 ? "Day" : "Days"}
            </div>
          </div>
        </div>

        <div
          className="p-3 rounded-xl flex items-center gap-3"
          style={{ background: "var(--surface-container)", border: "1px solid var(--hairline)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--brass-soft)", color: "var(--brass)" }}
          >
            <Award size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider" style={{ color: "var(--ink-faint)" }}>
              Longest Streak
            </div>
            <div className="text-base font-semibold font-mono" style={{ color: "var(--ink)" }}>
              {telemetry.longest_streak_days} {telemetry.longest_streak_days === 1 ? "Day" : "Days"}
            </div>
          </div>
        </div>

        <div
          className="p-3 rounded-xl flex items-center gap-3"
          style={{ background: "var(--surface-container)", border: "1px solid var(--hairline)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(63, 122, 84, 0.12)", color: "var(--seal-disposed)" }}
          >
            <Calendar size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider" style={{ color: "var(--ink-faint)" }}>
              Active Days
            </div>
            <div className="text-base font-semibold font-mono" style={{ color: "var(--ink)" }}>
              {telemetry.active_days_count} / 84
            </div>
          </div>
        </div>

        <div
          className="p-3 rounded-xl flex items-center gap-3"
          style={{ background: "var(--surface-container)", border: "1px solid var(--hairline)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(123, 94, 167, 0.12)", color: "var(--seal-reserved)" }}
          >
            <Clock size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider" style={{ color: "var(--ink-faint)" }}>
              Peak Study Day
            </div>
            <div className="text-base font-semibold font-mono truncate" style={{ color: "var(--ink)" }}>
              {telemetry.most_active_day}
            </div>
          </div>
        </div>
      </div>

      {/* ── Heatmap Calendar Grid ─────────────────────────────── */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[620px]">
          <div className="flex gap-1.5">
            {/* Day of Week row labels */}
            <div className="flex flex-col gap-1.5 pt-6 pr-2">
              {DAY_LABELS.map((day, idx) => (
                <div
                  key={day}
                  className="h-3 text-[9px] font-mono leading-none flex items-center justify-end"
                  style={{ color: idx % 2 === 0 ? "var(--ink-faint)" : "transparent" }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 12 Weekly Columns */}
            <div className="flex gap-1.5 flex-1">
              {weeks.map((weekDays, wIdx) => {
                const firstDay = weekDays[0];
                const weekLabel = firstDay ? new Date(firstDay.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

                return (
                  <div key={wIdx} className="flex flex-col gap-1.5 flex-1">
                    {/* Month / Week header above column */}
                    <div className="h-4 text-[9px] font-mono text-center truncate" style={{ color: "var(--ink-faint)" }}>
                      {wIdx % 3 === 0 ? weekLabel : ""}
                    </div>

                    {/* 7 Day Blocks in Column */}
                    {weekDays.map((day) => {
                      const level = getCellLevel(day);
                      const isHovered = hoveredDay?.date === day.date;

                      return (
                        <div
                          key={day.date}
                          onMouseEnter={() => setHoveredDay(day)}
                          onMouseLeave={() => setHoveredDay(null)}
                          className="h-3 rounded-[3px] transition-all cursor-pointer relative"
                          style={{
                            background: getLevelColor(level),
                            border: isHovered ? "1px solid var(--ink)" : "1px solid transparent",
                            transform: isHovered ? "scale(1.2)" : "scale(1)",
                            zIndex: isHovered ? 10 : 1,
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Interactive Detail Panel / Tooltip Banner ─────────── */}
      <div
        className="mt-4 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs"
        style={{
          background: "var(--surface-container)",
          border: "1px solid var(--hairline)",
        }}
      >
        {hoveredDay ? (
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>
              📅 {new Date(hoveredDay.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span className="font-medium" style={{ color: "var(--brass)" }}>
              <strong>{hoveredDay.total_actions}</strong> total research actions
            </span>
            <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
              • {hoveredDay.searches} searches
            </span>
            <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
              • {hoveredDay.ai_queries} AI queries
            </span>
            <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
              • {hoveredDay.case_views} case reads
            </span>
          </div>
        ) : (
          <div className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
            Hover over any square on the 12-week grid to inspect daily research breakdown.
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono ml-auto" style={{ color: "var(--ink-faint)" }}>
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-[2px]" style={{ background: getLevelColor(0) }} />
          <div className="w-2.5 h-2.5 rounded-[2px]" style={{ background: getLevelColor(1) }} />
          <div className="w-2.5 h-2.5 rounded-[2px]" style={{ background: getLevelColor(2) }} />
          <div className="w-2.5 h-2.5 rounded-[2px]" style={{ background: getLevelColor(3) }} />
          <div className="w-2.5 h-2.5 rounded-[2px]" style={{ background: getLevelColor(4) }} />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
