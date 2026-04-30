"""
config.py
---------
Environment-aware configuration for the TransformerModel service.

Values are read from environment variables (or a .env file in the project root).
All paths are relative to the TransformerModel/ directory unless overridden.

Usage
-----
    from config import settings

    model_path = settings.model_path
    allowed_origins = settings.allowed_origins_list
"""

import os
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Root of the TransformerModel/ package
_BASE_DIR = Path(__file__).parent


class Settings(BaseSettings):
    """Application settings — all fields may be overridden via environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Artifact paths ────────────────────────────────────────────────────────
    artifacts_dir: str = Field(
        default="artifacts",
        description="Directory containing trained model artifacts (relative or absolute).",
    )

    @property
    def artifacts_path(self) -> Path:
        p = Path(self.artifacts_dir)
        return p if p.is_absolute() else _BASE_DIR / p

    @property
    def model_path(self) -> Path:
        return self.artifacts_path / "emotion_model.pth"

    @property
    def label_encoder_path(self) -> Path:
        return self.artifacts_path / "label_encoder.npy"

    @property
    def mean_path(self) -> Path:
        return self.artifacts_path / "mean.npy"

    @property
    def std_path(self) -> Path:
        return self.artifacts_path / "std.npy"

    @property
    def hyperparams_path(self) -> Path:
        return self.artifacts_path / "model_hyperparams.json"

    # ── Server ────────────────────────────────────────────────────────────────
    port: int = Field(default=8000, description="Uvicorn port.")
    host: str = Field(default="0.0.0.0", description="Uvicorn bind address.")

    # ── CORS ──────────────────────────────────────────────────────────────────
    allowed_origins: str = Field(
        default="http://localhost:5173",
        description="Comma-separated list of allowed CORS origins.",
    )

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    # ── Rate limiting ─────────────────────────────────────────────────────────
    rate_limit: str = Field(
        default="100/minute",
        description="slowapi rate-limit string, e.g. '100/minute'.",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton Settings instance."""
    return Settings()


# Convenience alias used throughout the service
settings = get_settings()
