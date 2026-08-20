import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { SearchResultTable } from "@/components/search/SearchResultTable";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { searchService } from "@/services/search";
import { bookmarkService } from "@/services/bookmarks";
import { getErrorMessage } from "@/lib/error";
import type { SearchResultItem, SearchFilters as SearchFiltersType } from "@/types/search";
import { LayoutGrid, Table } from "lucide-react";
import { toast } from "sonner";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [bookmarkedCnrs, setBookmarkedCnrs] = useState<Set<string>>(new Set());
  const [togglingCnrs, setTogglingCnrs] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<SearchFiltersType>({
    query: searchParams.get("query") || "",
    case_status: searchParams.get("case_status") || undefined,
    court_code: searchParams.get("court_code") || undefined,
    filing_year: searchParams.get("filing_year") ? Number(searchParams.get("filing_year")) : undefined,
    page: 1,
    page_size: 20,
  });

  // Fetch initial bookmarks to synchronize state
  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const bookmarks = await bookmarkService.list();
        if (Array.isArray(bookmarks)) {
          setBookmarkedCnrs(new Set(bookmarks.map((b) => b.cnr)));
        }
      } catch {
        // Silent fail if unauthenticated or on initial load
      }
    };
    fetchBookmarks();
  }, []);

  const fetchResults = useCallback(async (currentFilters: SearchFiltersType) => {
    if (!currentFilters.query && !currentFilters.case_status && !currentFilters.court_code && !currentFilters.filing_year) {
      return;
    }
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

  // Only auto-search if there's a query param from URL
  useEffect(() => {
    if (filters.query) {
      fetchResults(filters);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (query: string) => {
    const updated = { ...filters, query, page: 1 };
    setFilters(updated);
    setSearchParams(query ? { query } : {});
    fetchResults(updated);
  };

  const handleBookmarkToggle = async (cnr: string, title?: string) => {
    if (togglingCnrs.has(cnr)) return;

    setTogglingCnrs((prev) => new Set(prev).add(cnr));
    const wasBookmarked = bookmarkedCnrs.has(cnr);

    // Optimistically update UI
    setBookmarkedCnrs((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) {
        next.delete(cnr);
      } else {
        next.add(cnr);
      }
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
      // Revert optimistic update on failure
      setBookmarkedCnrs((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) {
          next.add(cnr);
        } else {
          next.delete(cnr);
        }
        return next;
      });

      const fallbackMsg = wasBookmarked ? "Failed to remove bookmark." : "Failed to save bookmark.";
      const errorMessage = getErrorMessage(err, fallbackMsg);
      
      toast.error(errorMessage);
    } finally {
      setTogglingCnrs((prev) => {
        const next = new Set(prev);
        next.delete(cnr);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          Case Search
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Search cases across courts using keywords, party names, advocates, or CNRs.
        </p>
      </div>

      <SearchBar initialValue={filters.query} onSearch={handleSearch} />

      <SearchFilters
        filters={filters}
        onChange={(newFilters: SearchFiltersType) => {
          setFilters(newFilters);
          fetchResults(newFilters);
        }}
        onReset={() => {
          const reset: SearchFiltersType = { page: 1, page_size: 20 };
          setFilters(reset);
          setResults([]);
          setHasSearched(false);
        }}
      />

      {/* View Toggle */}
      {hasSearched && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {results.length} {results.length === 1 ? "case found" : "cases found"}
          </span>
          <div className="flex items-center gap-1 p-1 rounded-full" style={{ background: "var(--surface-container)", border: "1px solid var(--border)" }}>
            <button
              onClick={() => setViewMode("grid")}
              className="p-1.5 rounded-full cursor-pointer"
              style={{
                background: viewMode === "grid" ? "var(--card)" : "transparent",
                color: viewMode === "grid" ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: viewMode === "grid" ? "var(--shadow-ambient)" : "none",
              }}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className="p-1.5 rounded-full cursor-pointer"
              style={{
                background: viewMode === "table" ? "var(--card)" : "transparent",
                color: viewMode === "table" ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: viewMode === "table" ? "var(--shadow-ambient)" : "none",
              }}
            >
              <Table size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <SkeletonLoader count={4} height="120px" />
      ) : !hasSearched ? (
        <EmptyState
          title="Start your research"
          description="Enter a search query or apply filters to find court cases."
        />
      ) : results.length === 0 ? (
        <EmptyState
          title="No cases found"
          description="Try broadening your search query or removing filters."
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-3">
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
      ) : (
        <SearchResultTable
          items={results}
          bookmarkedCnrs={bookmarkedCnrs}
          togglingCnrs={togglingCnrs}
          onBookmarkToggle={handleBookmarkToggle}
        />
      )}
    </div>
  );
}
