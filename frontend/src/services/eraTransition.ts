import api from '@/lib/axios';
import type { APIResponse } from '@/types/common';
import type {
  ConcordanceLookupResponse,
  EraTransitionCaseAnalysis,
  EraTransitionInstant,
} from '@/types/era_transition';

export const eraTransitionService = {
  /**
   * Fast search across statutory concordance by section number or legal doctrine.
   */
  lookupConcordance: async (
    query: string = "",
    limit: number = 24,
    category?: string
  ): Promise<ConcordanceLookupResponse | null> => {
    try {
      let url = `/statutes/era-transition/lookup?query=${encodeURIComponent(query)}&limit=${limit}`;
      if (category && category !== "ALL") {
        url += `&category=${encodeURIComponent(category)}`;
      }
      const res = await api.get<APIResponse<ConcordanceLookupResponse>>(url);
      if (res.status === 204 || !res.data || !res.data.data) {
        return null;
      }
      return res.data.data;
    } catch {
      return null;
    }
  },

  /**
   * Zero-LLM instant concordance snapshot for a case.
   *
   * Resolves the applicable statutory era and extracts all relevant IPC ↔ BNS
   * concordance pairs entirely from the static Python dictionary — no LLM call,
   * zero token consumption, returns in <10ms.
   *
   * Call this on every criminal case load.
   * Call getCaseEraTransition() only when the user clicks "Draft Transition Arguments".
   */
  getInstantConcordance: async (
    cnr: string
  ): Promise<EraTransitionInstant | null> => {
    try {
      const res = await api.get<APIResponse<EraTransitionInstant>>(
        `/cases/${cnr}/era-transition/instant`
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
   * Fetch full criminal law era transition matrix WITH Gemini-drafted pleading
   * paragraphs and transposed Supreme Court precedents.
   *
   * ⚠ This triggers an LLM call. Only invoke on explicit user action
   * (e.g., user clicking "Draft Transition Arguments").
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
   * ⚠ This triggers an LLM call. Only invoke on explicit user action.
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
