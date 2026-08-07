import React from "react";
import type { TimelineEvent } from "@/types/case";
import { Calendar, FileText, Scale } from "lucide-react";

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  if (!events || events.length === 0) {
    return (
      <p className="text-sm p-6 text-center card-float" style={{ color: "var(--text-muted)" }}>
        No timeline events recorded for this case.
      </p>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "order":
        return <FileText size={16} />;
      case "judgment":
        return <Scale size={16} />;
      default:
        return <Calendar size={16} />;
    }
  };

  return (
    <div className="relative pl-8 space-y-6 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-px before:bg-[var(--border-strong)]">
      {events.map((event, idx) => (
        <div key={idx} className="relative group">
          <div 
            className="absolute -left-8 top-1 w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white z-10" 
            style={{ 
              borderColor: "var(--border-strong)",
              color: "var(--text-primary)"
            }}
          >
            {getIcon(event.event_type)}
          </div>
          <div
            className="card-float p-5 ml-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {event.title}
              </span>
              <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                {event.date}
              </span>
            </div>
            {event.description && (
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{event.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
