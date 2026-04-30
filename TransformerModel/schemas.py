"""
schemas.py
----------
Pydantic request / response models for the FastAPI inference server.

FastAPI validates incoming JSON against EmotionRequest automatically.
If the landmark list is missing or has the wrong length, FastAPI returns
a 422 Unprocessable Entity before any model code runs.
"""

from typing import Dict, List

from pydantic import BaseModel, Field, field_validator

# Expected number of values: 468 MediaPipe face landmarks × 3 coords (x, y, z)
EXPECTED_LANDMARKS = 468 * 3  # 1404


class EmotionRequest(BaseModel):
    """
    Payload for POST /detect-emotion.

    landmarks : flat list of 1404 floats
                [x0, y0, z0, x1, y1, z1, ..., x467, y467, z467]
    """

    landmarks: List[float] = Field(
        ...,
        description=f"Flat list of {EXPECTED_LANDMARKS} landmark coordinates (468 × x,y,z).",
        min_length=EXPECTED_LANDMARKS,
        max_length=EXPECTED_LANDMARKS,
    )

    @field_validator("landmarks")
    @classmethod
    def validate_landmark_count(cls, v: List[float]) -> List[float]:
        if len(v) != EXPECTED_LANDMARKS:
            raise ValueError(
                f"Expected exactly {EXPECTED_LANDMARKS} landmarks, received {len(v)}."
            )
        return v


class EmotionResponse(BaseModel):
    """
    Response from POST /detect-emotion.

    emotion       : predicted emotion label (e.g. "Happy")
    probabilities : per-class softmax probabilities keyed by label name
    """

    emotion: str = Field(..., description="Predicted dominant emotion label.")
    probabilities: Dict[str, float] = Field(
        ..., description="Softmax probability for each emotion class."
    )


class HealthResponse(BaseModel):
    """Response from GET /health."""

    status: str = Field(..., description="'ok' when the service is ready.")
    model_loaded: bool = Field(..., description="True when model weights are loaded.")
    device: str = Field(..., description="Torch device in use ('cpu' or 'cuda').")
