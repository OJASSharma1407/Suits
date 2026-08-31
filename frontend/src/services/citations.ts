import api from "@/lib/axios";
import type { APIResponse } from "@/types/common";
import type { CitationGraphData } from "@/types/citation";

export const citationService = {
  getGraph: async (cnr: string): Promise<CitationGraphData> => {
    const res = await api.get<APIResponse<CitationGraphData>>(`/cases/${cnr}/citation-graph`);
    return res.data.data;
  },
};
