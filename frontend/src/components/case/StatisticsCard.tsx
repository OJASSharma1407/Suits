import React from "react";
import type { CaseStatistics } from "@/types/case";

interface StatisticsCardProps {
  stats?: CaseStatistics;
}

export function StatisticsCard({ stats }: StatisticsCardProps) {
  if (!stats) return null;

  const data = [
    { label: "Hearings", value: stats.hearing_count },
    { label: "Orders/Judgments", value: stats.order_count },
    { label: "Interim Orders", value: stats.interim_order_count },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {data.map((item, i) => (
        <div key={i} className="card-float p-5">
          <span className="block text-[11px] uppercase tracking-[0.05em] font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
            {item.label}
          </span>
          <span className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
