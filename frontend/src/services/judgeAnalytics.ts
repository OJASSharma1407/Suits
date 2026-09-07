import api from "@/lib/axios";
import type { APIResponse } from "@/types/common";
import type { JudgeAnalyticsDossier } from "@/types/judge";

export const judgeAnalyticsService = {
  getJudgeAnalytics: async (judgeName: string, courtName?: string): Promise<JudgeAnalyticsDossier> => {
    const encodedName = encodeURIComponent(judgeName.trim());
    const params = courtName ? { court: courtName } : {};
    const res = await api.get<APIResponse<JudgeAnalyticsDossier>>(`/analytics/judge/${encodedName}`, {
      params,
    });
    return res.data.data;
  },
};
