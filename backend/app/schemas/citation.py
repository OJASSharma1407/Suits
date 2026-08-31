"""Citation network schemas - DTOs for 2D/3D citation graphs and precedent analytics."""

from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class CitationNode(BaseModel):
    """A node in the legal citation network (case, statute, or landmark authority)."""
    model_config = ConfigDict(coerce_numbers_to_str=True)

    id: str = Field(..., description="Unique node identifier (e.g. Kanoon TID or normalized CNR/name)")
    title: str = Field(..., description="Case or Statute title")
    court: str | None = Field(default=None, description="Court name (e.g. Supreme Court of India, High Court of Delhi)")
    court_tier: str = Field(default="hc", description="Hierarchy level: 'sc' (Supreme Court), 'hc' (High Court), 'tribunal', 'statute', 'district'")
    year: str | int | None = Field(default=None, description="Judgment or enactment year")
    node_type: str = Field(default="cited", description="Node category: 'target' (active case), 'cited' (backward citation), 'citing' (forward citation), 'statute' (Act/Article)")
    authority_score: int = Field(default=1, description="Calculated authority index based on inbound connections and court tier")
    inbound_count: int = Field(default=0, description="Number of cases citing this document")
    outbound_count: int = Field(default=0, description="Number of precedents cited by this document")
    disposition: str | None = Field(default=None, description="Outcome or legal status (e.g. 'Affirmed', 'Allowed', 'Good Law', 'Distinguished')")
    summary: str | None = Field(default=None, description="Core legal holding or ratio decidendi snippet")
    tid: str | None = Field(default=None, description="Indian Kanoon Document ID if available")
    url: str | None = Field(default=None, description="External or Kanoon link")
    category: str | None = Field(default=None, description="Legal subject matter (e.g. Constitutional, Criminal, Commercial, Arbitration)")


class CitationLink(BaseModel):
    """A directed edge in the citation network representing precedent reliance or statutory interpretation."""
    model_config = ConfigDict(coerce_numbers_to_str=True)

    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    relationship: str = Field(default="cites", description="Relationship type: 'cites', 'cited_by', 'relies_upon', 'applies_statute', 'distinguishes', 'affirms', 'overrules'")
    weight: float = Field(default=1.0, description="Link weight or relevance score")
    label: str | None = Field(default=None, description="Display label on the edge")


class CitationGraphSummary(BaseModel):
    """Summary metrics for the citation network."""
    total_nodes: int = 0
    total_precedents: int = 0
    total_subsequent: int = 0
    total_statutes: int = 0
    total_edges: int = 0
    max_authority_score: int = 1
    landmark_citations_count: int = 0


class CitationGraphResponse(BaseModel):
    """Complete citation graph payload returned to the frontend."""
    model_config = ConfigDict(coerce_numbers_to_str=True)

    target_cnr: str
    target_id: str
    case_title: str
    nodes: list[CitationNode] = []
    links: list[CitationLink] = []
    summary: CitationGraphSummary = CitationGraphSummary()
    is_cached: bool = False
    generated_at: str | None = None
