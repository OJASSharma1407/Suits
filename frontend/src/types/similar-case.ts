export interface SimilarCaseItem {
  cnr?: string | null;
  tid?: string | null;
  case_title: string;
  court_name?: string | null;
  court_tier: "sc" | "hc" | "tribunal" | "district" | string;
  decision_date?: string | null;
  similarity_score: number; // 0 - 100
  semantic_score: number; // 0.0 - 1.0
  precedent_type: "Binding Precedent" | "Persuasive Authority" | "Distinguishable Precedent" | string;
  strategic_alignment: "Supports Petitioner" | "Supports Respondent" | "Neutral" | string;
  legal_nexus: string;
  key_ratio?: string | null;
  shared_statutes: string[];
  distinguishing_factors?: string | null;
  url?: string | null;
}

export interface SimilarCasesSummary {
  total_found: number;
  binding_count: number;
  avg_similarity_score: number;
  primary_shared_statutes: string[];
  query_legal_profile?: string | null;
  execution_time_ms: number;
}

export interface SimilarCasesResponse {
  target_cnr: string;
  target_title: string;
  summary: SimilarCasesSummary;
  cases: SimilarCaseItem[];
  is_cached?: boolean;
  generated_at?: string | null;
}
