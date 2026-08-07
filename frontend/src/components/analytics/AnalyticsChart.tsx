import React from "react";
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
} from "recharts";

interface AnalyticsChartProps {
  title: string;
  type: "bar" | "pie";
  data: any[];
}

const COLORS = ["#1c1b1b", "#5e5e5e", "#858383", "#c4c7c7", "#e1dfdf"];

export function AnalyticsChart({ title, type, data }: AnalyticsChartProps) {
  return (
    <div className="card-float p-6 flex flex-col h-[350px]">
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: "var(--text-muted)" }}>
        {title}
      </h3>
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--text-muted)" }}
              />
              <Tooltip
                cursor={{ fill: "var(--surface-container)" }}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-float)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                }}
              />
              <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          ) : (
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-float)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                }}
              />
            </RechartsPieChart>
          )}
        </ResponsiveContainer>
      </div>

      {type === "pie" && (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              {entry.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
