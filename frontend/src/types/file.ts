export interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
  topPct?: number;
  leftPct?: number;
  widthPct?: number;
  heightPct?: number;
}

export type HighlightColor = "gold" | "green" | "purple" | "blue";

export interface PDFHighlight {
  id: string;
  pageNum: number;
  color: HighlightColor;
  text: string;
  rects?: HighlightRect[];
  comment?: string;
  createdAt?: string;
}

export interface SavedFile {
  id: string;
  user_id: string;
  cnr: string;
  filename: string;
  case_title: string;
  court_name: string;
  order_date: string;
  notes: string;
  highlights: PDFHighlight[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SaveFilePayload {
  cnr: string;
  filename: string;
  case_title: string;
  court_name: string;
  order_date: string;
  notes?: string;
  highlights?: PDFHighlight[];
  tags?: string[];
}

export interface UpdateFilePayload {
  notes?: string;
  highlights?: PDFHighlight[];
  tags?: string[];
  case_title?: string;
  court_name?: string;
  order_date?: string;
}

export interface SavedFileListResponse {
  items: SavedFile[];
  total: number;
}
