import React, { useMemo } from "react";
import type { TimelineEvent } from "@/types/case";
import { Calendar, FileText, Scale } from "lucide-react";

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  // Always sorted strictly oldest to newest (chronological)
  const sortedEvents = useMemo(() => {
    if (!events) return [];

    // Tiebreaker for same-date events: filing(0) → hearing(1) → interim/order(2) → judgment(3)
    const typePriority = (type: string): number => {
      switch (type) {
        case "filing":
          return 0;
        case "hearing":
          return 1;
        case "interim":
        case "order":
          return 2;
        case "judgment":
          return 3;
        default:
          return 1;
      }
    };

    return [...events].sort((a, b) => {
      const dateA = a.date || "";
      const dateB = b.date || "";
      const dateCmp = dateA.localeCompare(dateB);

      if (dateCmp !== 0) return dateCmp;
      return typePriority(a.event_type) - typePriority(b.event_type);
    });
  }, [events]);

  if (!events || events.length === 0) {
    return (
      <p className="text-sm p-8 text-center card-float rounded-2xl" style={{ color: "var(--text-muted)" }}>
        No timeline events recorded for this case.
      </p>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "interim":
      case "order":
        return <FileText size={16} />;
      case "judgment":
        return <Scale size={16} />;
      default:
        return <Calendar size={16} />;
    }
  };

  const getEventBadgeClass = (type: string) => {
    switch (type) {
      case "judgment":
        return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      case "interim":
      case "order":
        return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "filing":
        return "bg-purple-500/10 text-purple-500 border-purple-500/30";
      default:
        return "bg-cyan-500/10 text-cyan-500 border-cyan-500/30";
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case "judgment":
        return "border-amber-400 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
      case "interim":
      case "order":
        return "border-blue-400 text-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.2)]";
      case "filing":
        return "border-purple-400 text-purple-500 shadow-[0_0_10px_rgba(147,51,234,0.2)]";
      default:
        return "border-cyan-400 text-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]";
    }
  };

  return (
    <div className="card-float p-6 sm:p-8 rounded-2xl overflow-hidden">
      {/* Vertical Timeline Representation (Oldest → Newest) */}
      <div className="relative pl-8 space-y-6 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-px before:bg-[var(--border-strong)]">
        {sortedEvents.map((event, idx) => (
          <div key={idx} className="relative group">
            {/* Node Icon on Connecting Line */}
            <div
              className={`absolute -left-8 top-1 w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-transform group-hover:scale-105 ${getNodeColor(
                event.event_type
              )}`}
              style={{
                background: "var(--card)",
              }}
            >
              {getIcon(event.event_type)}
            </div>

            {/* Event Content Card */}
            <div className="card-float p-5 ml-4 rounded-xl transition-all group-hover:border-[var(--border-strong)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border ${getEventBadgeClass(
                      event.event_type
                    )}`}
                  >
                    {event.event_type}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {event.title}
                  </span>
                </div>
                <span className="font-mono text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  {event.date}
                </span>
              </div>

              {event.description && (
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {event.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
