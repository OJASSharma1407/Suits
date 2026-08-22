import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bookmark,
  MessageSquare,
  Search,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { MetricCard } from "@/components/common/MetricCard";
import api from "@/lib/axios";

interface SearchHistoryItem {
  id?: string;
  query: string;
  type?: string;
  category?: string;
  created_at?: string;
}

const DEFAULT_RECOMMENDED_SEARCHES: SearchHistoryItem[] = [
  { query: "Harish Salve", category: "Senior Advocate", type: "advocate" },
  { query: "Vinayak Road Carriers vs SBI", category: "NCLAT Insolvency", type: "case" },
  { query: "Section 9 IBC Demand Notice", category: "Statute / Precedent", type: "legal_issue" },
  { query: "Anticipatory Bail Supreme Court", category: "Criminal Law", type: "case_type" },
  { query: "Arbitration Act Section 34", category: "Commercial Disputes", type: "statute" },
  { query: "Fali S. Nariman", category: "Senior Advocate", type: "advocate" },
];

export function RecentSearchCarousel({ items }: { items: SearchHistoryItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const navigate = useNavigate();

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, [items]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -320 : 320;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
            <Sparkles size={15} style={{ color: "var(--primary)" }} /> Quick Recent & Suggested Searches
          </h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Jump straight into active legal queries or explore landmark precedents.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            className="p-1.5 rounded-full card-float disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--surface-container)] cursor-pointer transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            className="p-1.5 rounded-full card-float disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--surface-container)] cursor-pointer transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3.5 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item, idx) => (
          <div
            key={item.id || idx}
            onClick={() => navigate(`/search?query=${encodeURIComponent(item.query)}`)}
            className="card-float p-4 min-w-[260px] max-w-[280px] flex-shrink-0 flex flex-col justify-between snap-start cursor-pointer group hover:-translate-y-0.5 transition-all"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider"
                  style={{
                    background: "var(--surface-container)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {item.category || "Search Query"}
                </span>
                <Search size={13} style={{ color: "var(--text-muted)" }} className="group-hover:text-[var(--primary)] transition-colors" />
              </div>
              <h4
                className="text-sm font-semibold tracking-tight line-clamp-2 group-hover:underline"
                style={{ color: "var(--text-primary)" }}
              >
                {item.query}
              </h4>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t text-xs" style={{ borderColor: "var(--border)" }}>
              <span style={{ color: "var(--text-muted)" }}>
                {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Suggested"}
              </span>
              <span className="font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--primary)" }}>
                Search <ArrowRight size={12} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ bookmarks: 0, conversations: 0, searches: 0 });
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, bookmarkRes, searchRes] = await Promise.allSettled([
          api.get("/analytics/dashboard"),
          api.get("/bookmarks"),
          api.get("/history/searches"),
        ]);

        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value.data.data);
        }

        if (bookmarkRes.status === "fulfilled") {
          setBookmarks(bookmarkRes.value.data.data?.slice(0, 6) || []);
        }

        if (searchRes.status === "fulfilled" && Array.isArray(searchRes.value.data.data)) {
          const userSearches = searchRes.value.data.data.map((s: any) => ({
            id: s.id,
            query: s.query,
            category: "Recent Search",
            created_at: s.created_at,
          }));

          // Merge user searches with default recommendations to ensure a lively carousel
          const combined = [...userSearches, ...DEFAULT_RECOMMENDED_SEARCHES];
          // Deduplicate by query
          const seen = new Set();
          const deduped = combined.filter((item) => {
            if (seen.has(item.query.toLowerCase())) return false;
            seen.add(item.query.toLowerCase());
            return true;
          });

          setSearchHistory(deduped);
        } else {
          setSearchHistory(DEFAULT_RECOMMENDED_SEARCHES);
        }
      } catch {
        setSearchHistory(DEFAULT_RECOMMENDED_SEARCHES);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-9 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
        >
          Workspace
        </h1>
        <p className="text-sm sm:text-base mt-2" style={{ color: "var(--text-secondary)" }}>
          Your legal research overview — saved cases, active conversations, and recent activity.
        </p>
      </div>

      {/* Metric Cards with Sparklines & Trend Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          title="Bookmarked Cases"
          value={stats.bookmarks}
          icon={<Bookmark size={20} />}
          trend={{ value: 12, isPositive: true, label: "this month" }}
          sparklineData={[
            Math.max(1, stats.bookmarks - 3),
            Math.max(1, stats.bookmarks - 2),
            Math.max(2, stats.bookmarks - 1),
            Math.max(1, stats.bookmarks),
            Math.max(2, stats.bookmarks + 1),
            Math.max(3, stats.bookmarks + 2),
            stats.bookmarks || 3,
          ]}
        />
        <MetricCard
          title="Active Chats"
          value={stats.conversations}
          icon={<MessageSquare size={20} />}
          trend={{ value: 24, isPositive: true, label: "vs last week" }}
          sparklineData={[
            Math.max(2, stats.conversations - 4),
            Math.max(4, stats.conversations - 3),
            Math.max(6, stats.conversations - 1),
            Math.max(8, stats.conversations),
            Math.max(12, stats.conversations + 2),
            Math.max(16, stats.conversations + 4),
            stats.conversations || 10,
          ]}
        />
        <MetricCard
          title="Searches Performed"
          value={stats.searches}
          icon={<Search size={20} />}
          trend={{ value: 18, isPositive: true, label: "today" }}
          sparklineData={[
            Math.max(4, stats.searches - 10),
            Math.max(8, stats.searches - 7),
            Math.max(12, stats.searches - 5),
            Math.max(15, stats.searches - 2),
            Math.max(20, stats.searches),
            Math.max(24, stats.searches + 3),
            stats.searches || 15,
          ]}
        />
      </div>

      {/* Saved Cases Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              Saved Cases
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Fast access to tracked judgments and ongoing proceedings.
            </p>
          </div>
          <Link
            to="/bookmarks"
            className="text-xs font-medium hover:underline flex items-center gap-1"
            style={{ color: "var(--text-secondary)" }}
          >
            View all ({bookmarks.length}) →
          </Link>
        </div>

        {bookmarks.length === 0 ? (
          <div className="space-y-6">
            {/* Empty state informative card */}
            <div
              className="card-float p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ background: "var(--card)" }}
            >
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--surface-container)", color: "var(--text-primary)" }}
                >
                  <Bookmark size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    No bookmarked cases yet
                  </h4>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Bookmark judgments while searching to monitor timeline updates and AI order summaries here.
                  </p>
                </div>
              </div>
              <Link to="/search" className="btn-primary flex-shrink-0" style={{ fontSize: "13px", padding: "10px 20px" }}>
                Find Cases to Track →
              </Link>
            </div>

            {/* Interactive Quick Recent Searches Carousel */}
            <RecentSearchCarousel items={searchHistory} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bookmarks.map((b) => (
                <div key={b.id} className="card-float p-5 flex items-center justify-between group hover:-translate-y-0.5 transition-all">
                  <div className="max-w-[70%]">
                    <h4 className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {b.title}
                    </h4>
                    <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                      CNR: {b.cnr}
                    </span>
                  </div>
                  <Link
                    to={`/case/${b.cnr}`}
                    className="btn-secondary flex items-center gap-1"
                    style={{ padding: "7px 14px", fontSize: "12px" }}
                  >
                    Open <ExternalLink size={12} />
                  </Link>
                </div>
              ))}
            </div>

            {/* Carousel is also accessible below active bookmarks */}
            <RecentSearchCarousel items={searchHistory} />
          </div>
        )}
      </div>
    </div>
  );
}
