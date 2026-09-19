export interface OutcomeWeight {
  label: string;
  weight: number; // 0.0 to 1.0
  rationale?: string | null;
}

export interface CalibrationStatus {
  is_backtested: boolean;
  backtest_sample_size?: number | null;
  backtest_accuracy?: number | null;
  matter_type_evaluated: boolean;
  disclaimer: string;
}

export interface OutcomeDistribution {
  matter_type: string;
  outcomes: OutcomeWeight[];
  basis: "precedent_weighted";
  calibration: CalibrationStatus;
}

export interface CaseComparisonItem {
  precedent_title: string;
  precedent_citation?: string | null;
  precedent_url?: string | null;
  inlegalbert_score: number; // 0.0 to 1.0
  similarities: string[];
  differences: string[];
  directional_effect: "supports_relief" | "supports_denial" | "neutral";
  effect_rationale: string;
}

export interface ThresholdCheck {
  test: string;
  status: "met" | "not_met" | "unclear";
  note: string;
}

export interface PredictionExplanation {
  governing_doctrine: string;
  statutory_thresholds: ThresholdCheck[];
  critical_vulnerabilities: string[];
  judicial_deduction_summary: string;
}

export interface CasePredictionResponse {
  target_cnr: string;
  matter_type: string;
  outcome_distribution: OutcomeDistribution;
  comparisons: CaseComparisonItem[];
  explanation: PredictionExplanation;
  reasoning_summary?: string | null;
  model_attribution: string;
  case_state_hash: string;
  generated_at: string;
  is_cached?: boolean;
}
