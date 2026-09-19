export interface PrecedentSummary {
  title: string;
  citation: string;
  court: string;
  ratio: string;
}

export interface StatutoryDelta {
  provision_name: string;
  delta_type:
    | 'SUBSTANTIAL_CHANGE'
    | 'NEW_PROVISO_ADDED'
    | 'PROCEDURE_MODIFIED'
    | 'PENALTY_ENHANCED'
    | 'DIRECT_SUBSTITUTION';
  details: string;
  litigator_warning: string;
}

export interface StatuteConcordancePair {
  id: string;
  old_code: 'CrPC' | 'IPC' | 'IEA';
  old_section: string;
  old_title: string;
  new_code: 'BNSS' | 'BNS' | 'BSA';
  new_section: string;
  new_title: string;
  category: 'PROCEDURAL' | 'SUBSTANTIVE' | 'EVIDENTIARY';
  concept_doctrine: string;
  doctrine_summary: string;
  landmark_precedents: PrecedentSummary[];
  statutory_deltas: StatutoryDelta[];
  similarity_score?: number | null;
}

export interface PrecedentTranspositionItem {
  precedent_title: string;
  citation: string;
  historic_section_cited: string;
  transposed_section: string;
  governing_doctrine: string;
  court_pleading_paragraph: string;
  statutory_continuity_basis: string;
  persuasion_ratio: string;
}

export interface EraTransitionCaseAnalysis {
  target_cnr: string;
  active_era: 'NEW_BNS_ERA' | 'LEGACY_IPC_ERA' | 'HYBRID_TRANSITION_ERA';
  era_explanation: string;
  concordance_mappings: StatuteConcordancePair[];
  statutory_deltas: StatutoryDelta[];
  transposed_precedents: PrecedentTranspositionItem[];
  procedural_risks: string[];
  model_attribution: string;
  generated_at: string;
}

export interface ConcordanceLookupResponse {
  query: string;
  match_count: number;
  pairs: StatuteConcordancePair[];
}
