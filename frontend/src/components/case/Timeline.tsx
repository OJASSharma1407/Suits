import React, { useMemo, useState } from "react";
import type { TimelineEvent } from "@/types/case";
import {
  Calendar,
  FileText,
  Scale,
  FolderPlus,
  ArrowDownUp,
  Gavel,
  CheckCircle2,
  Bell,
} from "lucide-react";

interface TimelineProps {
  events: TimelineEvent[];
}

function formatDateDisplay(dateStr?: string): { formatted: string; isYearOnly: boolean } {
  if (!dateStr) return { formatted: "Date Unavailable", isYearOnly: false };
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const dt = new Date(dateStr);
      if (!isNaN(dt.getTime())) {
        return {
          formatted: dt.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          isYearOnly: false,
        };
      }
    }
  } catch {
    // fallback
  }
  return { formatted: dateStr, isYearOnly: false };
}

export function Timeline({ events }: TimelineProps) {
  const [sortAsc, setSortAsc] = useState(true); // true = oldest first, false = newest first

  const sortedEvents = useMemo(() => {
    if (!events) return [];

    const typePriority = (type: string): number => {
      const t = (type || "").toLowerCase();
      switch (t) {
        case "filing":
          return 0;
        case "notice":
          return 1;
        case "hearing":
          return 2;
        case "interim":
        case "order":
          return 3;
        case "arguments":
          return 4;
        case "judgment":
        case "disposal":
          return 5;
        default:
          return 2;
      }
    };

    return [...events].sort((a, b) => {
      const dateA = a.date || "";
      const dateB = b.date || "";
      const dateCmp = dateA.localeCompare(dateB);

      if (dateCmp !== 0) {
        return sortAsc ? dateCmp : -dateCmp;
      }
      const typeDiff = typePriority(a.event_type) - typePriority(b.event_type);
      return sortAsc ? typeDiff : -typeDiff;
    });
  }, [events, sortAsc]);

  if (!events || events.length === 0) {
    return (
      <div className="card-float p-8 text-center rounded-2xl" style={{ color: "var(--text-muted)" }}>
        <p className="text-sm">No timeline events recorded for this case.</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    const t = (type || "").toLowerCase();
    switch (t) {
      case "filing":
        return <FolderPlus size={16} />;
      case "notice":
        return <Bell size={16} />;
      case "interim":
      case "order":
        return <FileText size={16} />;
      case "judgment":
        return <Scale size={16} />;
      case "disposal":
        return <CheckCircle2 size={16} />;
      case "arguments":
        return <Gavel size={16} />;
      default:
        return <Calendar size={16} />;
    }
  };

  const getEventBadgeClass = (type: string) => {
    const t = (type || "").toLowerCase();
    switch (t) {
      case "judgment":
      case "disposal":
        return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      case "interim":
      case "order":
        return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "filing":
        return "bg-purple-500/10 text-purple-500 border-purple-500/30";
      case "notice":
        return "bg-orange-500/10 text-orange-500 border-orange-500/30";
      default:
        return "bg-cyan-500/10 text-cyan-500 border-cyan-500/30";
    }
  };

  const getNodeColor = (type: string) => {
    const t = (type || "").toLowerCase();
    switch (t) {
      case "judgment":
      case "disposal":
        return "border-amber-400 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
      case "interim":
      case "order":
        return "border-blue-400 text-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.2)]";
      case "filing":
        return "border-purple-400 text-purple-500 shadow-[0_0_10px_rgba(147,51,234,0.2)]";
      case "notice":
        return "border-orange-400 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]";
      default:
        return "border-cyan-400 text-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]";
    }
  };

  return (
    <div className="card-float p-6 sm:p-8 rounded-2xl overflow-hidden">
      {/* Controls Header */}
      <div className="flex items-center justify-between pb-5 mb-6 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          Showing {sortedEvents.length} lifecycle milestones ({sortAsc ? "Oldest → Newest" : "Newest → Oldest"})
        </div>
        <button
          type="button"
          onClick={() => setSortAsc((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
          title={sortAsc ? "Switch to Newest First" : "Switch to Oldest First"}
        >
          <ArrowDownUp size={13} />
          <span>{sortAsc ? "Oldest First" : "Newest First"}</span>
        </button>
      </div>

      {/* Vertical Timeline Representation */}
      <div className="relative pl-8 space-y-6 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-px before:bg-[var(--border-strong)]">
        {sortedEvents.map((event, idx) => {
          const dateInfo = formatDateDisplay(event.date);
          const rawType = event.event_type || "hearing";
          return (
            <div key={idx} className="relative group">
              {/* Node Icon on Connecting Line */}
              <div
                className={`absolute -left-8 top-1 w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-transform group-hover:scale-105 ${getNodeColor(
                  rawType
                )}`}
                style={{
                  background: "var(--card)",
                }}
              >
                {getIcon(rawType)}
              </div>

              {/* Event Content Card */}
              <div className="card-float p-5 ml-4 rounded-xl transition-all group-hover:border-[var(--border-strong)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border ${getEventBadgeClass(
                        rawType
                      )}`}
                    >
                      {rawType}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {event.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="text-xs font-medium font-mono" style={{ color: "var(--text-primary)" }}>
                      {dateInfo.formatted}
                    </span>
                    {event.date && event.date !== dateInfo.formatted && (
                      <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                        ({event.date})
                      </span>
                    )}
                  </div>
                </div>

                {event.description && (
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {event.description}
                  </p>
                )}

                {/* Metadata tags if present */}
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className="flex items-center gap-3 mt-3 pt-2 border-t text-[11px] text-[var(--text-muted)]" style={{ borderColor: "var(--border)" }}>
                    {Boolean(event.metadata.judge) && (
                      <span>Judge: <strong className="font-medium text-[var(--text-secondary)]">{String(event.metadata.judge)}</strong></span>
                    )}
                    {Boolean(event.metadata.court) && (
                      <span>Court: <strong className="font-medium text-[var(--text-secondary)]">{String(event.metadata.court)}</strong></span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
