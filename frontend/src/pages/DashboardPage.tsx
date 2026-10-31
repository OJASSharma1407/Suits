import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/axios";

interface SearchHistoryItem {
  id?: string;
  query: string;
  type?: string;
  category?: string;
  created_at?: string;
}

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

        if (statsRes.status === "fulfilled" && statsRes.value?.data?.data) {
          const d = statsRes.value.data.data;
          setStats({
            bookmarks: typeof d.bookmarks === "number" ? d.bookmarks : 0,
            conversations: typeof d.conversations === "number" ? d.conversations : 0,
            searches: typeof d.searches === "number" ? d.searches : 0,
          });
        }

        if (bookmarkRes.status === "fulfilled") {
          setBookmarks(bookmarkRes.value.data.data?.slice(0, 4) || []);
        }

        if (
          searchRes.status === "fulfilled" &&
          Array.isArray(searchRes.value.data.data) &&
          searchRes.value.data.data.length > 0
        ) {
          const userSearches = searchRes.value.data.data.map((s: any) => ({
            id: s.id,
            query: s.query,
            category: "Recent",
            created_at: s.created_at,
          }));
          setSearchHistory(userSearches);
        } else {
          setSearchHistory([]);
        }
      } catch {
        setSearchHistory([]);
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
            {stats.bookmarks === 0
              ? "Nothing tracked yet"
              : `${stats.bookmarks} case${stats.bookmarks === 1 ? "" : "s"} tracked`}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Active Chats</div>
          <div className="kpi-num">{stats.conversations}</div>
          <div className="kpi-delta">
            {stats.conversations === 0
              ? "No active discussions"
              : `${stats.conversations} conversation${stats.conversations === 1 ? "" : "s"}`}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Searches This Week</div>
          <div className="kpi-num">{stats.searches}</div>
          <div className="kpi-delta">
            {stats.searches === 0
              ? "No searches run yet"
              : `${stats.searches} quer${stats.searches === 1 ? "y" : "ies"} logged`}
          </div>
        </div>
      </div>

      {/* ── Recent Searches ── */}
      <div className="dashboard-section">
        <div className="section-heading">
          <h3>Recent searches</h3>
          {searchHistory.length > 0 && (
            <Link to="/history" className="section-link">
              View history →
            </Link>
          )}
        </div>
        <div className="section-sub">Resume where you left off.</div>

        {searchHistory.length === 0 ? (
          <div>
            <div className="empty-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>No recent searches yet. Search for court cases, legal citations, or statutes above to get started.</span>
            </div>

            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>Suggested topics:</span>
              {[
                "Anticipatory Bail Supreme Court",
                "Section 9 IBC Demand Notice",
                "Arbitration Act Section 34",
                "Cheque Bounce Section 138 NI Act",
              ].map((suggested) => (
                <button
                  key={suggested}
                  type="button"
                  onClick={() => navigate(`/search?query=${encodeURIComponent(suggested)}`)}
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: "var(--radius-sm, 4px)",
                    background: "var(--surface-raised)",
                    border: "1px solid var(--hairline)",
                    color: "var(--ink-dim)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--ink)";
                    e.currentTarget.style.borderColor = "var(--brass)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--ink-dim)";
                    e.currentTarget.style.borderColor = "var(--hairline)";
                  }}
                >
                  {suggested} →
                </button>
              ))}
            </div>
          </div>
        ) : (
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
                  {item.created_at && (
                    <span className="ledger-date">
                      {new Date(item.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  <span className="ledger-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
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
