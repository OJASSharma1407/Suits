import api from "@/lib/axios";
import type { APIResponse } from "@/types/common";
import type { SearchResponse, SearchFilters } from "@/types/search";

export const searchService = {
  search: async (filters: SearchFilters) => {
    const res = await api.get<APIResponse<SearchResponse>>("/search", { params: filters });
    return res.data.data;
  },

  getCapabilities: async () => {
    const res = await api.get<APIResponse<Record<string, unknown>>>("/search/capabilities");
    return res.data.data;
  },
};
