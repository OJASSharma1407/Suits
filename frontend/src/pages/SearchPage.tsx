import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { SuitsLoader } from "@/components/common/SuitsLoader";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { searchService } from "@/services/search";
import { bookmarkService } from "@/services/bookmarks";
import { getErrorMessage } from "@/lib/error";
import type { SearchResultItem, SearchFilters as SearchFiltersType } from "@/types/search";
import { toast } from "sonner";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [bookmarkedCnrs, setBookmarkedCnrs] = useState<Set<string>>(new Set());
  const [togglingCnrs, setTogglingCnrs] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<SearchFiltersType>({
    query: searchParams.get("query") || "",
    page: 1,
    page_size: 20,
  });

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const bookmarks = await bookmarkService.list();
        if (Array.isArray(bookmarks)) {
          setBookmarkedCnrs(new Set(bookmarks.map((b) => b.cnr)));
        }
      } catch {
        // Silent fail
      }
    };
    fetchBookmarks();
  }, []);

  const fetchResults = useCallback(async (currentFilters: SearchFiltersType) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await searchService.search(currentFilters);
      setResults(data.results || []);
    } catch {
      toast.error("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Synchronize when searchParams changes (e.g. from top bar or direct navigation)
  useEffect(() => {
    const q = searchParams.get("query") || "";
    setFilters((prev) => {
      const updated = { ...prev, query: q, page: 1 };
      fetchResults(updated);
      return updated;
    });
  }, [searchParams, fetchResults]);

  const handleSearch = (query: string) => {
    const updated = { ...filters, query, page: 1 };
    setFilters(updated);
    setSearchParams(query ? { query } : {});
    fetchResults(updated);
  };

  const QUICK_SEARCH_PILLS = [
    "Bachan Singh",
    "Editors Guild",
    "Apex Infrastructure",
    "Anticipatory Bail",
    "Supreme Court",
    "Delhi High Court",
  ];

  const handleBookmarkToggle = async (cnr: string, title?: string) => {
    if (togglingCnrs.has(cnr)) return;
    setTogglingCnrs((prev) => new Set(prev).add(cnr));
    const wasBookmarked = bookmarkedCnrs.has(cnr);
    setBookmarkedCnrs((prev) => {
      const next = new Set(prev);
      wasBookmarked ? next.delete(cnr) : next.add(cnr);
      return next;
    });
    try {
      if (wasBookmarked) {
        await bookmarkService.remove(cnr);
        toast.info("Bookmark removed.");
      } else {
        await bookmarkService.add(cnr, title || cnr);
        toast.success("Case bookmarked.");
      }
    } catch (err: unknown) {
      setBookmarkedCnrs((prev) => {
        const next = new Set(prev);
        wasBookmarked ? next.add(cnr) : next.delete(cnr);
        return next;
      });
      const fallbackMsg = wasBookmarked ? "Failed to remove bookmark." : "Failed to save bookmark.";
      toast.error(getErrorMessage(err, fallbackMsg));
    } finally {
      setTogglingCnrs((prev) => {
        const next = new Set(prev);
        next.delete(cnr);
        return next;
      });
    }
  };

  return (
    <div className="dashboard-layout">
      {/* In-page Search bar */}
      <SearchBar initialValue={filters.query} onSearch={handleSearch} isLoading={loading} />

      {/* Quick Search Suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mt-2 mb-4 scrollbar-none text-xs">
        <span className="text-[var(--text-muted)] shrink-0 font-medium">Try searching:</span>
        {QUICK_SEARCH_PILLS.map((pill) => (
          <button
            key={pill}
            type="button"
            onClick={() => handleSearch(pill)}
            className="px-2.5 py-1 rounded-full border transition-all hover:border-[var(--primary)] hover:text-[var(--primary)] shrink-0"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Results Header */}
      {hasSearched && (
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2 px-1">
          <span>
            {filters.query
              ? `Showing results for "${filters.query}"`
              : "Featured & Recent Cases"}
          </span>
          <span>{results.length} cases found</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div
          className="flex flex-col items-center justify-center py-20 my-4 rounded-2xl border transition-all"
          style={{
            background: "var(--surface)",
            borderColor: "var(--hairline)",
            minHeight: "360px",
          }}
        >
          <SuitsLoader
            size={52}
            label="Searching case records…"
            sublabel={
              filters.query
                ? `Scanning court registers and judgments for "${filters.query}"`
                : "Fetching featured and recent court proceedings"
            }
          />
        </div>
      ) : results.length === 0 ? (
        <div className="empty-note" style={{ marginTop: 12 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          No cases found{filters.query ? ` for "${filters.query}"` : ""}. Try a different spelling or keyword.
        </div>
      ) : (
        <div className="ledger-list" style={{ marginTop: 16 }}>
          {results.map((item) => (
            <SearchResultCard
              key={item.cnr}
              item={item}
              isBookmarked={bookmarkedCnrs.has(item.cnr)}
              isToggling={togglingCnrs.has(item.cnr)}
              onBookmarkToggle={handleBookmarkToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
