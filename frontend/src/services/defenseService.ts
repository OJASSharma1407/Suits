import api from "@/lib/axios";
import type { APIResponse } from "@/types/common";
import type {
  AnalyzePlaintRequest,
  AnalyzePlaintResponse,
  GenerateWrittenStatementRequest,
  WrittenStatementResponse,
} from "@/types/defense";

export const defenseService = {
  analyzePlaint: async (req: AnalyzePlaintRequest): Promise<AnalyzePlaintResponse> => {
    const res = await api.post<APIResponse<AnalyzePlaintResponse>>("/defense/analyze-plaint", req);
    if (!res.data.data) {
      throw new Error(res.data.message || "Failed to analyze plaint structure.");
    }
    return res.data.data;
  },

  generateWrittenStatement: async (
    req: GenerateWrittenStatementRequest
  ): Promise<WrittenStatementResponse> => {
    const res = await api.post<APIResponse<WrittenStatementResponse>>(
      "/defense/generate-written-statement",
      req
    );
    if (!res.data.data) {
      throw new Error(res.data.message || "Failed to generate Written Statement.");
    }
    return res.data.data;
  },
};
