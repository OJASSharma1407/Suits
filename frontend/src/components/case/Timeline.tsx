import React, { useRef, useState, useMemo } from "react";
import type { TimelineEvent } from "@/types/case";
import { 
  Calendar, 
  FileText, 
  Scale, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  LayoutList, 
  Columns 
} from "lucide-react";

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  const [viewMode, setViewMode] = useState<"horizontal" | "vertical">("horizontal");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc"); // asc is left-to-right chronological (as in image)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sortedEvents = useMemo(() => {
    if (!events) return [];

    // Tiebreaker for same-date events.
    // Base priority: filing(0) → hearing(1) → interim/order(2) → judgment(3)
    // In asc  (Oldest→Newest): judgment has highest value → sorts last  ✓
    // In desc (Newest→Oldest): we negate the priority → judgment has lowest value → sorts first ✓
    const typePriority = (type: string): number => {
      switch (type) {
        case "filing":   return 0;
        case "hearing":  return 1;
        case "interim":
        case "order":    return 2;
        case "judgment": return 3;
        default:         return 1;
      }
    };

    const dirMultiplier = sortOrder === "asc" ? 1 : -1;

    return [...events].sort((a, b) => {
      const dateA = a.date || "";
      const dateB = b.date || "";
      const dateCmp = sortOrder === "asc"
        ? dateA.localeCompare(dateB)
        : dateB.localeCompare(dateA);

      if (dateCmp !== 0) return dateCmp;

      // Same date: flip tiebreaker based on direction so judgment is
      // always the "last" event in the visual reading order.
      return dirMultiplier * (typePriority(a.event_type) - typePriority(b.event_type));
    });
  }, [events, sortOrder]);

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
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "filing":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      default:
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case "judgment":
        return "bg-amber-500 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]";
      case "interim":
      case "order":
        return "bg-blue-600 border-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.4)]";
      case "filing":
        return "bg-purple-600 border-purple-400 shadow-[0_0_12px_rgba(147,51,234,0.4)]";
      default:
        return "bg-cyan-600 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]";
    }
  };

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="card-float p-6 rounded-2xl overflow-hidden space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-[var(--surface-container)]" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            {sortedEvents.length} Procedural Milestones
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Order toggle */}
          <button
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-[var(--surface-container)] transition-colors cursor-pointer"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            title={sortOrder === "asc" ? "Oldest first (left-to-right)" : "Newest first"}
          >
            <ArrowUpDown size={13} />
            <span>{sortOrder === "asc" ? "Oldest → Newest" : "Newest → Oldest"}</span>
          </button>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border p-0.5 bg-[var(--surface-container)]" style={{ borderColor: "var(--border)" }}>
            <button
              onClick={() => setViewMode("horizontal")}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === "horizontal"
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
              title="Horizontal Timeline"
            >
              <Columns size={14} />
            </button>
            <button
              onClick={() => setViewMode("vertical")}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === "vertical"
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
              title="Vertical List"
            >
              <LayoutList size={14} />
            </button>
          </div>

          {/* Scroll navigation arrows for horizontal mode */}
          {viewMode === "horizontal" && sortedEvents.length > 3 && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => handleScroll("left")}
                className="p-1.5 rounded-lg border hover:bg-[var(--surface-container)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                style={{ borderColor: "var(--border)" }}
                aria-label="Scroll left"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => handleScroll("right")}
                className="p-1.5 rounded-lg border hover:bg-[var(--surface-container)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                style={{ borderColor: "var(--border)" }}
                aria-label="Scroll right"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Milestone Timeline (Matching Reference Design) */}
      {viewMode === "horizontal" ? (
        <div className="relative py-4">
          <div
            ref={scrollContainerRef}
            className="flex items-start gap-8 overflow-x-auto pb-6 pt-2 scroll-smooth no-scrollbar"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {sortedEvents.map((event, idx) => {
              const dateYear = event.date ? event.date.slice(0, 4) : "—";
              const dateFull = event.date || "Date Unspecified";

              return (
                <div
                  key={idx}
                  className="flex-shrink-0 w-72 flex flex-col group relative"
                  style={{ scrollSnapAlign: "start" }}
                >
                  {/* Top: Year & Date header */}
                  <div className="mb-4 space-y-1">
                    <div className="text-lg font-bold font-mono tracking-wider text-cyan-400">
                      {dateYear}
                    </div>
                    <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                      {dateFull}
                    </div>
                  </div>

                  {/* Middle: Horizontal Line & Node Point */}
                  <div className="relative flex items-center justify-start h-8 my-2">
                    {/* Connecting line spanning horizontally */}
                    <div
                      className="absolute left-0 right-[-32px] top-1/2 -translate-y-1/2 h-0.5"
                      style={{ background: "var(--border-strong)" }}
                    />

                    {/* Node circle */}
                    <div
                      className={`relative z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110 ${getNodeColor(
                        event.event_type
                      )}`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    </div>
                  </div>

                  {/* Bottom: Heading, Event Badge & Description */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md border ${getEventBadgeClass(
                          event.event_type
                        )}`}
                      >
                        {event.event_type}
                      </span>
                    </div>

                    <h4
                      className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-cyan-400 transition-colors"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {event.title}
                    </h4>

                    {event.description && (
                      <p
                        className="text-xs leading-relaxed line-clamp-4"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Vertical Detailed View */
        <div className="relative pl-8 space-y-6 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-px before:bg-[var(--border-strong)]">
          {sortedEvents.map((event, idx) => (
            <div key={idx} className="relative group">
              <div
                className={`absolute -left-8 top-1 w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 ${getNodeColor(
                  event.event_type
                )}`}
                style={{
                  background: "var(--card)",
                  color: "var(--text-primary)",
                }}
              >
                {getIcon(event.event_type)}
              </div>
              <div className="card-float p-5 ml-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
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
                  <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
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
      )}
    </div>
  );
}

