export interface StatuteItem {
  id: string;
  act_name: string;
  short_name: string;
  category: string;
  citation_count: number;
  cases_count: number;
  percentage: number;
  top_sections: string[];
  sample_sources: string[];
}

export interface CourtDistributionItem {
  forum_id: string;
  court_name: string;
  short_name: string;
  forum_type: string; // "Apex Court" | "High Court" | "Tribunal" | "District Court"
  count: number;
  percentage: number;
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  day_of_week: number; // 0 = Monday, 6 = Sunday
  week_index: number;
  searches: number;
  ai_queries: number;
  case_views: number;
  doc_uploads: number;
  total_actions: number;
  level: number; // 0 to 4
}

export interface WeeklyTrendPoint {
  period_label: string;
  start_date: string;
  end_date: string;
  searches: number;
  ai_queries: number;
  case_views: number;
  total_actions: number;
}

export interface ResearchActivityTelemetry {
  heatmap_matrix: HeatmapDay[];
  weekly_trends: WeeklyTrendPoint[];
  active_days_count: number;
  current_streak_days: number;
  longest_streak_days: number;
  total_searches: number;
  total_ai_queries: number;
  total_case_views: number;
  most_active_day: string;
  peak_hours_label: string;
}

export interface PracticeInsightsData {
  bookmarks: number;
  conversations: number;
  searches: number;
  research_hours_est: number;
  total_documents: number;
  total_statutes_analyzed: number;
  top_cited_acts: StatuteItem[];
  court_distribution: CourtDistributionItem[];
  activity_trends: ResearchActivityTelemetry;
}
