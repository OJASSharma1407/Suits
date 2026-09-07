import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Activity,
  Scale,
  Flame,
  RotateCw,
  Landmark,
} from "lucide-react";
import { MetricCard } from "@/components/common/MetricCard";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { TopCitedActsCard } from "@/components/analytics/TopCitedActsCard";
import { CourtDistributionCard } from "@/components/analytics/CourtDistributionCard";
import { analyticsService } from "@/services/analytics";
import type { PracticeInsightsData } from "@/types/analytics";

export default function AnalyticsPage() {
  const [data, setData] = useState<PracticeInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await analyticsService.getDashboardAnalytics();
      setData(res);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="dashboard-layout" style={{ maxWidth: "100%", width: "100%", marginTop: 36 }}>
        <SkeletonLoader count={1} height="70px" />
        <SkeletonLoader count={1} height="140px" />
        <SkeletonLoader count={1} height="320px" />
      </div>
    );
  }

  return (
    <div className="dashboard-layout" style={{ maxWidth: "100%", width: "100%", marginTop: 36, paddingBottom: 48 }}>
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl font-medium"
            style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}
          >
            Practice Intelligence & Telemetry
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--ink-faint)" }}>
            Real-time statutory frequency and forum distribution telemetry
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1 rounded-full font-medium"
            style={{
              background: "rgba(63, 122, 84, 0.10)",
              color: "var(--seal-disposed)",
              border: "1px solid rgba(63, 122, 84, 0.20)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[var(--seal-disposed)] animate-pulse" />
            Live Telemetry
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg transition-all hover:shadow-xs"
            style={{
              background: "var(--surface-container)",
              color: "var(--ink-dim)",
              border: "1px solid var(--hairline)",
            }}
            title="Refresh Telemetry"
          >
            <RotateCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── Metric Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Practice Streak"
          value={`${data?.activity_trends.current_streak_days || 0} Days`}
          icon={<Flame size={18} style={{ color: "#DC641E" }} />}
        />
        <MetricCard
          title="Statutes Analyzed"
          value={data?.total_statutes_analyzed || 0}
          icon={<Scale size={18} style={{ color: "var(--brass)" }} />}
        />
        <MetricCard
          title="AI Legal Discussions"
          value={data?.conversations || 0}
          icon={<Activity size={18} style={{ color: "var(--seal-disposed)" }} />}
        />
        <MetricCard
          title="Case Searches Conducted"
          value={data?.searches || 0}
          icon={<TrendingUp size={18} style={{ color: "var(--seal-reserved)" }} />}
        />
      </div>

      {/* ── Legal Practice Focus & Forum Telemetry ─────────────── */}
      <div className="flex items-center gap-2" style={{ marginTop: 36, marginBottom: 20 }}>
        <Landmark size={16} style={{ color: "var(--brass)" }} />
        <h2
          className="text-[12px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}
        >
          Statutory Focus & Forum Footprint
        </h2>
        <div className="flex-1 h-px" style={{ background: "var(--hairline)" }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data && (
          <>
            <TopCitedActsCard statutes={data.top_cited_acts || []} />
            <CourtDistributionCard distribution={data.court_distribution || []} />
          </>
        )}
      </div>
    </div>
  );
}
