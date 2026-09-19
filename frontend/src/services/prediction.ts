import api from "@/lib/axios";
import type { APIResponse } from "@/types/common";
import type { CasePredictionResponse } from "@/types/prediction";

export const predictionService = {
  /**
   * Fetch judicial outcome prediction & precedent comparison.
   * Returns null if service returns 204 No Content (disabled or unconfigured).
   */
  getPrediction: async (cnr: string): Promise<CasePredictionResponse | null> => {
    try {
      const res = await api.get<APIResponse<CasePredictionResponse>>(`/cases/${cnr}/prediction`);
      if (res.status === 204 || !res.data || !res.data.data) {
        return null;
      }
      return res.data.data;
    } catch (err: any) {
      if (err?.response?.status === 204) {
        return null;
      }
      // Silently return null for graceful card degradation
      return null;
    }
  },

  /**
   * Force regenerate prediction by evicting state cache.
   */
  refreshPrediction: async (cnr: string): Promise<CasePredictionResponse | null> => {
    try {
      const res = await api.post<APIResponse<CasePredictionResponse>>(`/cases/${cnr}/prediction/refresh`);
      if (res.status === 204 || !res.data || !res.data.data) {
        return null;
      }
      return res.data.data;
    } catch {
      return null;
    }
  },
};
