export type CourtTier = "sc" | "hc" | "tribunal" | "district" | "statute";
export type NodeType = "target" | "cited" | "citing" | "statute";
export type LinkRelationship =
  | "cites"
  | "cited_by"
  | "relies_upon"
  | "applies_statute"
  | "distinguishes"
  | "affirms"
  | "overrules";

export interface CitationNode {
  id: string;
  title: string;
  court: string | null;
  court_tier: CourtTier;
  year: number | string | null;
  node_type: NodeType;
  authority_score: number;
  inbound_count: number;
  outbound_count: number;
  disposition?: string | null;
  summary?: string | null;
  tid?: string | null;
  url?: string | null;
  category?: string | null;

  // Simulation coordinate properties added dynamically by force layout
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  radius?: number;
}

export interface CitationLink {
  source: string | CitationNode;
  target: string | CitationNode;
  relationship: LinkRelationship;
  weight: number;
  label?: string | null;
}

export interface CitationGraphSummary {
  total_nodes: number;
  total_precedents: number;
  total_subsequent: number;
  total_statutes: number;
  total_edges: number;
  max_authority_score: number;
  landmark_citations_count: number;
}

export interface CitationGraphData {
  target_cnr: string;
  target_id: string;
  case_title: string;
  nodes: CitationNode[];
  links: CitationLink[];
  summary: CitationGraphSummary;
  is_cached: boolean;
  generated_at?: string | null;
}

export interface CitationFilterState {
  searchQuery: string;
  selectedTier: CourtTier | "all";
  selectedType: NodeType | "all";
  minAuthority: number;
  showStatutes: boolean;
  showSubsequent: boolean;
  showPrecedents: boolean;
}
