"""Similar Cases schemas - DTOs for Hybrid RAG similarity search and legal synthesis."""

from pydantic import BaseModel, ConfigDict, Field


class SimilarCaseItem(BaseModel):
    """A similar precedent retrieved through Hybrid RAG (citations + semantic embeddings + legal synthesis)."""
    model_config = ConfigDict(coerce_numbers_to_str=True)

    cnr: str | None = Field(default=None, description="CNR or unique case identifier")
    tid: str | None = Field(default=None, description="Indian Kanoon Document ID if available")
    case_title: str = Field(..., description="Full title of the similar judgment")
    court_name: str | None = Field(default=None, description="Court name (e.g. Supreme Court of India, Delhi High Court)")
    court_tier: str = Field(default="hc", description="Tier: 'sc', 'hc', 'tribunal', 'district'")
    decision_date: str | None = Field(default=None, description="Judgment or order date")
    
    # Hybrid RAG Scores & Precedent Classifications
    similarity_score: int = Field(default=80, description="Overall hybrid similarity score (0 to 100)")
    semantic_score: float = Field(default=0.75, description="Dense vector cosine similarity score (0.0 to 1.0)")
    precedent_type: str = Field(
        default="Persuasive Authority",
        description="Type: 'Binding Precedent', 'Persuasive Authority', or 'Distinguishable Precedent'"
    )
    strategic_alignment: str = Field(
        default="Neutral",
        description="Strategic effect: 'Supports Petitioner', 'Supports Respondent', or 'Neutral'"
    )
    
    # AI Legal Nexus & Ratio
    legal_nexus: str = Field(
        ...,
        description="AI explanation of why this precedent is legally analogous to the active case"
    )
    key_ratio: str | None = Field(
        default=None,
        description="Core ratio decidendi or legal holding established in this judgment"
    )
    shared_statutes: list[str] = Field(
        default_factory=list,
        description="List of shared Acts, Sections, or Articles"
    )
    distinguishing_factors: str | None = Field(
        default=None,
        description="Factual or procedural distinctions to watch out for"
    )
    url: str | None = Field(default=None, description="Indian Kanoon or official judgment link")


class SimilarCasesSummary(BaseModel):
    """Statistical summary of retrieved similar cases."""
    total_found: int = 0
    binding_count: int = 0
    avg_similarity_score: int = 0
    primary_shared_statutes: list[str] = Field(default_factory=list)
    query_legal_profile: str | None = None
    execution_time_ms: int = 0


class SimilarCasesResponse(BaseModel):
    """Complete response payload for Similar Cases retrieval."""
    model_config = ConfigDict(coerce_numbers_to_str=True)

    target_cnr: str
    target_title: str
    summary: SimilarCasesSummary = Field(default_factory=SimilarCasesSummary)
    cases: list[SimilarCaseItem] = Field(default_factory=list)
    is_cached: bool = False
    generated_at: str | None = None
