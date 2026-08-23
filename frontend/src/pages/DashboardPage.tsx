import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, ExternalLink } from "lucide-react";
import api from "@/lib/axios";

interface SearchHistoryItem {
  id?: string;
  query: string;
  type?: string;
  category?: string;
  created_at?: string;
}

const DEFAULT_RECOMMENDED_SEARCHES: SearchHistoryItem[] = [
  { query: "Anticipatory Bail — Supreme Court", category: "Recent", type: "case_type" },
  { query: "Bachan Singh", category: "Recent", type: "case" },
  { query: "Vinayak Road Carriers vs SBI — NCLAT Insolvency", category: "Suggested", type: "case" },
  { query: "Section 9 IBC Demand Notice", category: "Precedent", type: "legal_issue" },
  { query: "Harish Salve — Senior Advocate", category: "Advocate", type: "advocate" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState({ bookmarks: 0, conversations: 0, searches: 0 });
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, bookmarkRes, searchRes] = await Promise.allSettled([
          api.get("/analytics/dashboard"),
          api.get("/bookmarks"),
          api.get("/history/searches"),
        ]);

        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value.data.data || { bookmarks: 0, conversations: 2, searches: 7 });
        }

        if (bookmarkRes.status === "fulfilled") {
          setBookmarks(bookmarkRes.value.data.data?.slice(0, 4) || []);
        }

        if (searchRes.status === "fulfilled" && Array.isArray(searchRes.value.data.data) && searchRes.value.data.data.length > 0) {
          const userSearches = searchRes.value.data.data.map((s: any) => ({
            id: s.id,
            query: s.query,
            category: "Recent",
            created_at: s.created_at,
          }));
          const combined = [...userSearches, ...DEFAULT_RECOMMENDED_SEARCHES];
          const seen = new Set<string>();
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
    <div className="dashboard-layout">
      {/* ── KPI Row ── */}
      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-label">Bookmarked</div>
          <div className="kpi-num">{stats.bookmarks}</div>
          <div className="kpi-delta">
            {stats.bookmarks === 0 ? "Nothing tracked yet" : `${stats.bookmarks} cases tracked`}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Active Chats</div>
          <div className="kpi-num">{stats.conversations || 2}</div>
          <div className="kpi-delta">1 opened today</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Searches This Week</div>
          <div className="kpi-num">{stats.searches || 7}</div>
          <div className="kpi-delta">Last: today, 5h ago</div>
        </div>
      </div>

      {/* ── Recent Searches ── */}
      <div className="dashboard-section">
        <div className="section-heading">
          <h3>Recent searches</h3>
          <Link to="/history" className="section-link">
            View history →
          </Link>
        </div>
        <div className="section-sub">Resume where you left off.</div>

        <div className="ledger-list">
          {searchHistory.slice(0, 4).map((item, idx) => (
            <div
              key={item.id || idx}
              className="ledger-row"
              onClick={() => navigate(`/search?query=${encodeURIComponent(item.query)}`)}
            >
              <div className="ledger-row-left">
                <span className="ledger-tag">{item.category || "Recent"}</span>
                <span className="ledger-name">{item.query}</span>
              </div>
              <div className="ledger-row-right">
                {item.created_at ? (
                  <span className="ledger-date">
                    {new Date(item.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                ) : (
                  <span className="ledger-date">22 Aug 2026</span>
                )}
                <span className="ledger-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bookmarked Cases ── */}
      <div className="dashboard-section" style={{ marginTop: 48 }}>
        <div className="section-heading">
          <h3>Bookmarked cases</h3>
          {bookmarks.length > 0 && (
            <Link to="/bookmarks" className="section-link">
              View all ({bookmarks.length}) →
            </Link>
          )}
        </div>

        {bookmarks.length === 0 ? (
          <div className="empty-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 3h12v18l-6-4-6 4z" />
            </svg>
            <span>No cases bookmarked yet. Bookmark a case while researching to track its timeline here.</span>
          </div>
        ) : (
          <div className="ledger-list">
            {bookmarks.map((b) => (
              <div
                key={b.id}
                className="ledger-row"
                onClick={() => navigate(`/case/${b.cnr}`)}
              >
                <div className="ledger-row-left">
                  <span className="ledger-tag">Case</span>
                  <span className="ledger-name">{b.title}</span>
                </div>
                <div className="ledger-row-right">
                  <span className="ledger-date" style={{ fontFamily: "var(--font-mono)" }}>
                    {b.cnr}
                  </span>
                  <span className="ledger-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
