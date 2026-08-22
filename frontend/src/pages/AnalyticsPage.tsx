import React, { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Activity, Scale, BookOpen } from "lucide-react";
import { AnalyticsChart } from "@/components/analytics/AnalyticsChart";
import { MetricCard } from "@/components/common/MetricCard";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import api from "@/lib/axios";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get("/analytics/dashboard");
        setStats(res.data.data);
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  /* ── Mock Chart Data ──────────────────────────────────────── */
  const caseTypeData = [
    { name: "Civil Suit", value: 45 },
    { name: "Writ Petition", value: 30 },
    { name: "Criminal Appeal", value: 15 },
    { name: "Bail App", value: 10 },
  ];

  const statusData = [
    { name: "Pending", value: 60 },
    { name: "Disposed", value: 35 },
    { name: "Transferred", value: 5 },
  ];

  if (loading) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <SkeletonLoader count={1} height="70px" />
        <SkeletonLoader count={1} height="220px" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div>
        <h1
          className="text-3xl sm:text-4xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
        >
          Workspace Analytics
        </h1>
        <p className="text-sm mt-1.5" style={{ color: "var(--text-secondary)" }}>
          Insights into your legal research activity, case types, and bookmarked proceedings.
        </p>
      </div>

      {/* ── Metric Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Total Bookmarks"
          value={stats?.bookmarks || 0}
          icon={<BookOpen size={18} />}
          trend={{ value: 12, isPositive: true, label: "vs last mo" }}
        />
        <MetricCard
          title="AI Conversations"
          value={stats?.conversations || 0}
          icon={<Activity size={18} />}
          trend={{ value: 8, isPositive: true, label: "vs last mo" }}
        />
        <MetricCard
          title="Total Searches"
          value={stats?.searches || 0}
          icon={<TrendingUp size={18} />}
          trend={{ value: 5, isPositive: true, label: "vs last mo" }}
        />
        <MetricCard
          title="Research Hours (Est.)"
          value={Math.round((stats?.conversations || 0) * 0.5 + (stats?.searches || 0) * 0.1)}
          icon={<Scale size={18} />}
        />
      </div>

      {/* ── Section Divider ──────────────────────────────────── */}
      <div className="flex items-center gap-2 pt-1">
        <BarChart3 size={15} style={{ color: "var(--text-muted)" }} />
        <h2 className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Activity Breakdown
        </h2>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>

      {/* ── Charts Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnalyticsChart
          type="pie"
          data={caseTypeData}
          title="Bookmarked Cases by Type"
        />
        <AnalyticsChart
          type="pie"
          data={statusData}
          title="Case Status Distribution"
        />
      </div>
    </div>
  );
}
