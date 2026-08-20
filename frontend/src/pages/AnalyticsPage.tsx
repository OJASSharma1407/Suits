import React, { useEffect, useState } from "react";
import { BarChart3, PieChart, TrendingUp, Activity, Scale, BookOpen } from "lucide-react";
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

  const trendData = [
    { name: "Jan", value: 12 },
    { name: "Feb", value: 19 },
    { name: "Mar", value: 15 },
    { name: "Apr", value: 25 },
    { name: "May", value: 22 },
    { name: "Jun", value: 30 },
  ];

  const researchIntensity = [
    { name: "Mon", value: 4.2 },
    { name: "Tue", value: 3.8 },
    { name: "Wed", value: 5.1 },
    { name: "Thu", value: 6.7 },
    { name: "Fri", value: 5.9 },
    { name: "Sat", value: 2.1 },
    { name: "Sun", value: 1.4 },
  ];

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <SkeletonLoader count={1} height="80px" />
        <SkeletonLoader count={1} height="300px" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          Workspace Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Insights into your legal research activity and bookmarked cases.
        </p>
      </div>

      {/* ── Metric Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Bookmarks"
          value={stats?.bookmarks || 0}
          icon={<BookOpen size={20} />}
          trend={{ value: 12, isPositive: true, label: "vs last mo" }}
        />
        <MetricCard
          title="AI Conversations"
          value={stats?.conversations || 0}
          icon={<Activity size={20} />}
          trend={{ value: 8, isPositive: true, label: "vs last mo" }}
        />
        <MetricCard
          title="Total Searches"
          value={stats?.searches || 0}
          icon={<TrendingUp size={20} />}
          trend={{ value: 5, isPositive: true, label: "vs last mo" }}
        />
        <MetricCard
          title="Research Hours (Est.)"
          value={Math.round((stats?.conversations || 0) * 0.5 + (stats?.searches || 0) * 0.1)}
          icon={<Scale size={20} />}
        />
      </div>

      {/* ── Section Divider ──────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <BarChart3 size={16} style={{ color: "var(--text-muted)" }} />
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Activity Breakdown
        </h2>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>

      {/* ── Charts Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          type="bar"
          data={trendData}
          title="Search Activity"
          subtitle="Last 6 months"
        />
        <AnalyticsChart
          type="area"
          data={researchIntensity}
          title="Research Intensity"
          subtitle="Hours per day (this week)"
        />
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
