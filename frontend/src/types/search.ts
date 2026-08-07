// Search types
export interface SearchResultItem {
  cnr: string;
  case_title: string;
  case_type: string | null;
  case_type_label: string | null;
  case_status: string | null;
  case_status_label: string | null;
  filing_date: string | null;
  decision_date: string | null;
  next_hearing_date: string | null;
  petitioners: string[];
  respondents: string[];
  advocates: string[];
  judges: string[];
  court_code: string | null;
  court_name: string | null;
  acts_and_sections: string[];
  ai_keywords: string[];
}

export interface SearchResponse {
  results: SearchResultItem[];
  total_hits: number;
  page: number;
  page_size: number;
  total_pages: number;
  facets: Record<string, unknown>;
}

export interface SearchFilters {
  query?: string;
  court_code?: string;
  state_code?: string;
  case_type?: string;
  case_status?: string;
  filing_year?: number;
  page?: number;
  page_size?: number;
  sort_by?: string;
}
