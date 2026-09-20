"""SUITS Backend - Core Configuration.

Loads all environment variables and provides typed access.
"""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database (defaults to zero-config SQLite for easy testing, switchable to PostgreSQL via env)
    database_url: str = Field(default="sqlite+aiosqlite:///./suits.db")

    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0")

    # JWT
    jwt_secret: str = Field(default="change-me")
    jwt_refresh_secret: str = Field(default="change-me-refresh")
    jwt_access_token_expire_minutes: int = Field(default=30)
    jwt_refresh_token_expire_days: int = Field(default=7)
    jwt_algorithm: str = Field(default="HS256")

    # eCourts Partner API
    ecourts_api_key: str = Field(default="")
    ecourts_base_url: str = Field(default="https://webapi.ecourtsindia.com")

    # Indian Kanoon API
    kanoon_api_token: str = Field(default="")

    # Gemini AI API
    gemini_api_key: str = Field(default="")
    gemini_model: str = Field(default="gemini-3.6-flash")

    # OpenRouter API (Used for Interactive AI Chatbot)
    openrouter_api_key: str = Field(default="")
    openrouter_model: str = Field(default="openrouter/free")
    openrouter_max_tokens: int = Field(default=2048)

    # Groq Cloud API (Gemini fallback — openai/gpt-oss-120b)
    groq_api_key: str = Field(default="")
    groq_model: str = Field(default="openai/gpt-oss-120b")

    # Judicial Outcome Prediction Engine (shares gemini_api_key)
    prediction_gemini_model: str = Field(default="gemini-3.1-pro-preview")
    prediction_thinking_level: str = Field(default="high")          # low | medium | high
    prediction_thinking_budget: int = Field(default=24576)          # budget for legacy models
    prediction_cache_ttl: int = Field(default=604800)               # 7 days (state-hash based invalidation)
    prediction_max_precedents: int = Field(default=6)
    prediction_enabled: bool = Field(default=True)                  # Enabled for testing/demo
    inlegalbert_scoring_mode: str = Field(default="whitened")       # "whitened" | "finetuned"
    inlegalbert_device: str = Field(default="auto")                 # auto | cuda | cpu

    # Google OAuth
    google_client_id: str = Field(default="")

    # Email & Verification (Resend / SMTP)
    resend_api_key: str = Field(default="")
    email_from: str = "Suits Legal <onboarding@resend.dev>"
    otp_expiry_minutes: int = Field(default=10)

    # Application
    environment: str = Field(default="development")
    log_level: str = Field(default="INFO")
    cors_origins: str = Field(default="http://localhost:5173,http://127.0.0.1:5173")

    # Rate Limiting
    rate_limit_per_minute: int = Field(default=300)

    # Cache TTLs (seconds)
    cache_ttl_search: int = Field(default=900)       # 15 minutes
    cache_ttl_case: int = Field(default=1800)         # 30 minutes
    cache_ttl_enums: int = Field(default=86400)       # 24 hours
    cache_ttl_court_structure: int = Field(default=604800)  # 7 days
    cache_ttl_available_dates: int = Field(default=86400)   # 24 hours
    cache_ttl_cause_list: int = Field(default=900)    # 15 minutes

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
