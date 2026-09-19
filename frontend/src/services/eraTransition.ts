import api from '@/lib/axios';
import type { APIResponse } from '@/types/common';
import type {
  ConcordanceLookupResponse,
  EraTransitionCaseAnalysis,
} from '@/types/era_transition';

export const eraTransitionService = {
  /**
   * Fast search across statutory concordance by section number or legal doctrine.
   */
  lookupConcordance: async (
    query: string,
    limit: number = 12
  ): Promise<ConcordanceLookupResponse | null> => {
    try {
      const res = await api.get<APIResponse<ConcordanceLookupResponse>>(
        `/statutes/era-transition/lookup?query=${encodeURIComponent(query)}&limit=${limit}`
      );
      if (res.status === 204 || !res.data || !res.data.data) {
        return null;
      }
      return res.data.data;
    } catch {
      return null;
    }
  },

  /**
   * Fetch criminal law era transition matrix, deltas, and transposed arguments for a case.
   */
  getCaseEraTransition: async (
    cnr: string
  ): Promise<EraTransitionCaseAnalysis | null> => {
    try {
      const res = await api.get<APIResponse<EraTransitionCaseAnalysis>>(
        `/cases/${cnr}/era-transition`
      );
      if (res.status === 204 || !res.data || !res.data.data) {
        return null;
      }
      return res.data.data;
    } catch (err: any) {
      if (err?.response?.status === 204) {
        return null;
      }
      return null;
    }
  },

  /**
   * Force regenerate criminal era transition analysis by invalidating state cache.
   */
  refreshCaseEraTransition: async (
    cnr: string
  ): Promise<EraTransitionCaseAnalysis | null> => {
    try {
      const res = await api.post<APIResponse<EraTransitionCaseAnalysis>>(
        `/cases/${cnr}/era-transition/refresh`
      );
      if (res.status === 204 || !res.data || !res.data.data) {
        return null;
      }
      return res.data.data;
    } catch {
      return null;
    }
  },
};
