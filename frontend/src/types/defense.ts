export interface PlaintParagraph {
  para_number: number;
  text: string;
  is_substantive: boolean;
  detected_topic: string;
}

export interface StatutoryBar {
  bar_id: string;
  title: string;
  statute: string;
  precedent: string;
  description: string;
  suggested_objection_text: string;
  is_selected: boolean;
}

export interface AnalyzePlaintRequest {
  document_id?: string;
  raw_text?: string;
  plaint_title?: string;
}

export interface AnalyzePlaintResponse {
  court_name: string;
  suit_number: string;
  plaintiff: string;
  defendant: string;
  paragraphs: PlaintParagraph[];
  detected_bars: StatutoryBar[];
  total_paragraphs: number;
  substantive_count: number;
}

export type DefenseStrategy = "aggressive_denial" | "demurrer" | "counter_claim";

export interface GenerateWrittenStatementRequest {
  court_name: string;
  suit_number: string;
  plaintiff: string;
  defendant: string;
  selected_bars: StatutoryBar[];
  paragraphs: PlaintParagraph[];
  defense_strategy: DefenseStrategy;
  advocate_notes?: string;
}

export interface TraverseItem {
  para_number: number;
  allegation_summary: string;
  traverse_text: string;
  is_ai_generated: boolean;
}

export interface WrittenStatementResponse {
  title: string;
  cause_title_html: string;
  preliminary_objections_html: string;
  preliminary_submissions_html: string;
  para_wise_reply_html: string;
  prayer_html: string;
  verification_html: string;
  full_draft_html: string;
  traversals: TraverseItem[];
}
