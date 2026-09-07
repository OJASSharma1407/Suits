export interface StatuteMetric {
  statute: string;
  count: number;
  percentage: number;
  category: string;
}

export interface SubjectAreaMetric {
  area: string;
  count: number;
  percentage: number;
  icon?: string;
}

export interface CadenceYearMetric {
  year: number;
  count: number;
}

export interface LandmarkJudgment {
  tid?: string | number | null;
  title: string;
  year: number | string;
  citation: string;
  subject: string;
  bench_strength: string;
  ratio_summary: string;
  disposition?: string | null;
  court?: string | null;
}

export interface BenchPartner {
  name: string;
  joint_cases_count: number;
  notable_case?: string | null;
}

export interface BenchInsight {
  title: string;
  tip: string;
  tag: string;
}

export interface JudgeAnalyticsDossier {
  judge_name: string;
  clean_name: string;
  salutation: string;
  court: string;
  tenure: string;
  is_sitting: boolean;
  total_judgments: number;
  disposal_rate: string;
  primary_focus: string;
  experience_years: number;
  top_statutes: StatuteMetric[];
  subject_areas: SubjectAreaMetric[];
  disposal_cadence: CadenceYearMetric[];
  landmark_judgments: LandmarkJudgment[];
  bench_partners: BenchPartner[];
  bench_insights: BenchInsight[];
  source: string;
  fetched_at: string;
  is_cached: boolean;
}
