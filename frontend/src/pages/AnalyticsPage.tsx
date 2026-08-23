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
      <div className="dashboard-layout" style={{ maxWidth: "100%", width: "100%", marginTop: 36 }}>
        <SkeletonLoader count={1} height="70px" />
        <SkeletonLoader count={1} height="220px" />
      </div>
    );
  }

  return (
    <div className="dashboard-layout" style={{ maxWidth: "100%", width: "100%", marginTop: 36 }}>
      {/* ── Page Header (Clean title without subtitle) ───────────── */}
      <div className="mb-6">
        <h1
          className="text-2xl font-medium"
          style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}
        >
          Workspace Analytics
        </h1>
      </div>

      {/* ── Metric Cards (No percentage / live badges) ───────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Bookmarks"
          value={stats?.bookmarks || 0}
          icon={<BookOpen size={18} />}
        />
        <MetricCard
          title="AI Conversations"
          value={stats?.conversations || 0}
          icon={<Activity size={18} />}
        />
        <MetricCard
          title="Total Searches"
          value={stats?.searches || 0}
          icon={<TrendingUp size={18} />}
        />
        <MetricCard
          title="Research Hours (Est.)"
          value={Math.round((stats?.conversations || 0) * 0.5 + (stats?.searches || 0) * 0.1)}
          icon={<Scale size={18} />}
        />
      </div>

      {/* ── Section Divider with generous spacing above & below ───── */}
      <div className="flex items-center gap-2" style={{ marginTop: 48, marginBottom: 24 }}>
        <BarChart3 size={16} style={{ color: "var(--brass)" }} />
        <h2
          className="text-[12px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}
        >
          Activity Breakdown
        </h2>
        <div className="flex-1 h-px" style={{ background: "var(--hairline)" }} />
      </div>

      {/* ── Charts Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
