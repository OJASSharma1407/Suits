import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function MetricCard({ title, value, icon, trend }: MetricCardProps) {
  return (
    <div className="card-float p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-container)", color: "var(--text-primary)" }}>
          {icon}
        </div>
        {trend && (
          <span
            className="text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1"
            style={{
              background: trend.isPositive ? "rgba(22, 163, 74, 0.1)" : "rgba(220, 38, 38, 0.1)",
              color: trend.isPositive ? "var(--success)" : "var(--danger)",
            }}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: "var(--text-muted)" }}>
          {title}
        </p>
        <p className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {value}
        </p>
      </div>
    </div>
  );
}
