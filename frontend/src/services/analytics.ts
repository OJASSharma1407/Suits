import api from "@/lib/axios";
import type { APIResponse } from "@/types/common";
import type { PracticeInsightsData } from "@/types/analytics";

export const analyticsService = {
  getDashboardAnalytics: async (): Promise<PracticeInsightsData> => {
    const res = await api.get<APIResponse<PracticeInsightsData>>("/analytics/dashboard");
    return res.data.data;
  },
};
