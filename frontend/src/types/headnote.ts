export type PrecedentTreatment =
  | 'OVERRULED'
  | 'FOLLOWED'
  | 'RELIED ON'
  | 'DISTINGUISHED'
  | 'EXPLAINED'
  | 'REFERRED'
  | 'DOUBTED';

export type StatutoryInterpretationNature =
  | 'STRICT'
  | 'PURPOSIVE'
  | 'HARMONIOUS'
  | 'READ_DOWN'
  | 'VALIDITY_UPHELD'
  | 'PROSPECTIVE_OVERRULING'
  | 'GENERAL_APPLICATION';

export interface PrecedentTreatmentItem {
  precedent_name: string;
  treatment: PrecedentTreatment;
  bench_commentary: string;
  overruled_specific_ratio?: string | null;
}

export interface StatutoryInterpretationItem {
  act_name: string;
  section_article: string;
  nature_of_interpretation: StatutoryInterpretationNature;
  interpretation_summary: string;
}

export interface CaseHeadnote {
  catchwords: string[];
  held_points: string[];
  ratio_decidendi_summary: string;
  obiter_dicta?: string[];
  precedent_citator_table: PrecedentTreatmentItem[];
  statutory_provisions_considered: StatutoryInterpretationItem[];
  operative_disposition: string;
}

export interface CaseHeadnoteResponse {
  target_cnr: string;
  order_id?: string | null;
  order_title?: string | null;
  order_date?: string | null;
  court_name?: string | null;
  bench_coram?: string[];
  headnote: CaseHeadnote;
  model_attribution: string;
  order_hash: string;
  is_cached: boolean;
  generated_at: string;
}
