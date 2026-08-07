import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, MessageSquare, Clock, Search, BarChart3, ArrowRight } from "lucide-react";
import { MetricCard } from "@/components/common/MetricCard";
import api from "@/lib/axios";

export default function DashboardPage() {
  const [stats, setStats] = useState({ bookmarks: 0, conversations: 0, searches: 0 });
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const statsRes = await api.get("/analytics/dashboard");
        setStats(statsRes.data.data);

        const bookmarkRes = await api.get("/bookmarks");
        setBookmarks(bookmarkRes.data.data.slice(0, 5));
      } catch {
        // Silently handle
      }
    }
    loadData();
  }, []);

  const quickActions = [
    { to: "/search", icon: Search, title: "Case Search", subtitle: "Search by CNR or keywords" },
    { to: "/bookmarks", icon: Bookmark, title: "Bookmarks", subtitle: "View saved court cases" },
    { to: "/history", icon: Clock, title: "History", subtitle: "Past searches & chats" },
    { to: "/analytics", icon: BarChart3, title: "Analytics", subtitle: "Case metrics & trends" },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}
        >
          Workspace
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Your legal research overview — saved cases, active conversations, and recent activity.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map(({ to, icon: Icon, title, subtitle }) => (
          <Link
            key={to}
            to={to}
            className="card-float p-5 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--surface-container)", color: "var(--text-primary)" }}
              >
                <Icon size={18} />
              </div>
              <div>
                <span className="block text-sm font-medium" style={{ color: "var(--text-primary)" }}>{title}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{subtitle}</span>
              </div>
            </div>
            <ArrowRight size={14} style={{ color: "var(--text-muted)" }} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Bookmarked Cases" value={stats.bookmarks} icon={<Bookmark size={20} />} />
        <MetricCard title="Active Chats" value={stats.conversations} icon={<MessageSquare size={20} />} />
        <MetricCard title="Searches Performed" value={stats.searches} icon={<Search size={20} />} />
      </div>

      {/* Recent Bookmarks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Saved Cases
          </h2>
          <Link
            to="/bookmarks"
            className="text-xs font-medium hover:underline"
            style={{ color: "var(--text-secondary)" }}
          >
            View all →
          </Link>
        </div>

        {bookmarks.length === 0 ? (
          <div
            className="card-float p-8 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            No bookmarked cases yet. Search for a case and save it to track here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bookmarks.map((b) => (
              <div key={b.id} className="card-float p-5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {b.title}
                  </h4>
                  <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                    {b.cnr}
                  </span>
                </div>
                <Link to={`/case/${b.cnr}`} className="btn-secondary" style={{ padding: "8px 16px", fontSize: "12px" }}>
                  Open
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
