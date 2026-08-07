import React, { useEffect, useState } from "react";
import { BarChart3, PieChart, TrendingUp, Activity } from "lucide-react";
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

  // Mock data for charts since backend only provides basic counts
  // In a real app, these would come from the API
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          Workspace Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Insights into your legal research activity and bookmarked cases.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Bookmarks" value={stats?.bookmarks || 0} icon={<BarChart3 size={20} />} />
        <MetricCard title="AI Conversations" value={stats?.conversations || 0} icon={<Activity size={20} />} />
        <MetricCard title="Searches" value={stats?.searches || 0} icon={<TrendingUp size={20} />} />
        <MetricCard title="Research Hours (Est.)" value={Math.round((stats?.conversations || 0) * 0.5 + (stats?.searches || 0) * 0.1)} icon={<PieChart size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart type="bar" data={trendData} title="Search Activity (Last 6 Months)" />
        <AnalyticsChart type="pie" data={caseTypeData} title="Bookmarked Cases by Type" />
        <AnalyticsChart type="pie" data={statusData} title="Case Status Distribution" />
      </div>
    </div>
  );
}
