import api from '@/lib/axios';
import type { APIResponse } from '@/types/common';
import type { CaseHeadnoteResponse } from '@/types/headnote';

export const headnoteService = {
  /**
   * Fetch publisher-grade editorial headnote & ratio extraction.
   * Returns null if service returns 204 No Content (unconfigured or no valid order text).
   */
  getHeadnote: async (cnr: string, filename?: string | null): Promise<CaseHeadnoteResponse | null> => {
    try {
      const url = filename
        ? `/cases/${cnr}/headnote?filename=${encodeURIComponent(filename)}`
        : `/cases/${cnr}/headnote`;
      const res = await api.get<APIResponse<CaseHeadnoteResponse>>(url);
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
   * Force regenerate publisher headnote by evicting state cache.
   */
  refreshHeadnote: async (cnr: string, filename?: string | null): Promise<CaseHeadnoteResponse | null> => {
    try {
      const url = filename
        ? `/cases/${cnr}/headnote/refresh?filename=${encodeURIComponent(filename)}`
        : `/cases/${cnr}/headnote/refresh`;
      const res = await api.post<APIResponse<CaseHeadnoteResponse>>(url);
      if (res.status === 204 || !res.data || !res.data.data) {
        return null;
      }
      return res.data.data;
    } catch {
      return null;
    }
  },
};
