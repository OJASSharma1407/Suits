import api from "@/lib/axios";
import type { APIResponse } from "@/types/common";
import type { SearchResponse, SearchFilters } from "@/types/search";

// Client-side in-memory search results cache
const searchCache = new Map<string, { timestamp: number; data: SearchResponse }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const searchService = {
  search: async (filters: SearchFilters): Promise<SearchResponse> => {
    const cacheKey = JSON.stringify(filters);
    const cached = searchCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const res = await api.get<APIResponse<SearchResponse>>("/search", { params: filters });
    const data = res.data.data;

    if (data) {
      searchCache.set(cacheKey, { timestamp: Date.now(), data });
    }

    return data;
  },

  getCapabilities: async () => {
    const res = await api.get<APIResponse<Record<string, unknown>>>("/search/capabilities");
    return res.data.data;
  },

  clearCache: () => {
    searchCache.clear();
  },
};
