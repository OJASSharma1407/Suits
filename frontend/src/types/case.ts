// Case types
export interface CourtInfo {
  court_name: string | null;
  court_number: string | null;
  court_code: string | null;
  court_complex: string | null;
  district: string | null;
  state: string | null;
  state_code: string | null;
  district_code: string | null;
}

export interface PartyInfo {
  petitioners: string[];
  respondents: string[];
  petitioner_advocates: string[];
  respondent_advocates: string[];
}

export interface HearingItem {
  hearing_date: string | null;
  business_date: string | null;
  judge: string | null;
  purpose: string | null;
}

export interface OrderItem {
  order_date: string | null;
  description: string | null;
  order_type: "interim" | "judgment";
  filename: string | null;
  order_url: string | null;
}

export interface CaseStatistics {
  order_count: number;
  interim_order_count: number;
  judgment_count: number;
  hearing_count: number;
  ia_count: number;
}

export interface TimelineEvent {
  date: string;
  event_type: "hearing" | "order" | "judgment" | "filing";
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
}

export interface CaseDetails {
  cnr: string;
  case_title: string;
  case_number: string | null;
  filing_number: string | null;
  registration_number: string | null;
  filing_date: string | null;
  registration_date: string | null;
  first_hearing_date: string | null;
  next_hearing_date: string | null;
  last_hearing_date: string | null;
  decision_date: string | null;
  case_status: string | null;
  case_status_label: string | null;
  case_type: string | null;
  case_type_label: string | null;
  case_duration: string | null;
  court: CourtInfo;
  parties: PartyInfo;
  judges: string[];
  hearings: HearingItem[];
  orders: OrderItem[];
  statistics: CaseStatistics;
  timeline: TimelineEvent[];
  case_category: string | null;
  bench_type: string | null;
  judicial_section: string | null;
  related_cases: string[];
  acts_and_sections: string[];
  fetched_at: string | null;
  is_cached: boolean;
}

export interface OrderMarkdown {
  cnr: string;
  filename: string;
  markdown: string;
}

export interface OrderAI {
  cnr: string;
  filename: string;
  executive_summary: string | null;
  plain_language_summary: string | null;
  primary_issues: string[];
  statutes_cited: string[];
  court_reasoning: string | null;
  ratio_decidendi: string | null;
  court_directions: string[];
  [key: string]: unknown;
}
