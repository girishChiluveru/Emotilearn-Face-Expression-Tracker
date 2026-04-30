"""
main.py
-------
FastAPI inference server for the EmotionTransformer model.

Endpoints
---------
  GET  /health          – liveness / readiness check
  POST /detect-emotion  – predict emotion from 1404 MediaPipe landmark floats

Run
---
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Environment variables (see .env.example)
-----------------------------------------
  ARTIFACTS_DIR   – path to directory with .pth / .npy / .json artifacts  (default: artifacts)
  ALLOWED_ORIGINS – comma-separated CORS origin list                       (default: http://localhost:5173)
  PORT            – server port                                             (default: 8000)
  RATE_LIMIT      – slowapi limit string                                    (default: 100/minute)
"""

import json
import logging
from contextlib import asynccontextmanager

import numpy as np
import torch
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from config import settings
from model import EmotionTransformer
from schemas import EmotionRequest, EmotionResponse, HealthResponse

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s – %(message)s",
)
logger = logging.getLogger("emotilearn")

# ── Global inference state ────────────────────────────────────────────────────
_model: EmotionTransformer | None = None
_label_encoder: np.ndarray | None = None
_mean: np.ndarray | None = None
_std: np.ndarray | None = None
_device: torch.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def _load_artifacts() -> None:
    """Load model weights, normalization stats, and label encoder from disk."""
    global _model, _label_encoder, _mean, _std

    # ── Hyperparameters ───────────────────────────────────────────────────────
    hp_path = settings.hyperparams_path
    if not hp_path.exists():
        raise FileNotFoundError(f"Hyperparams not found: {hp_path}")
    with hp_path.open() as f:
        hp = json.load(f)
    logger.info("Loaded hyperparameters: %s", hp)

    # ── Model ─────────────────────────────────────────────────────────────────
    model_path = settings.model_path
    if not model_path.exists():
        raise FileNotFoundError(f"Model weights not found: {model_path}")

    model = EmotionTransformer(
        input_dim=hp["input_dim"],
        hidden_dim=hp["hidden_dim"],
        n_layers=hp["n_layers"],
        n_heads=hp["n_heads"],
        dropout=hp["dropout"],
        n_classes=hp["n_classes"],
    )
    model.load_state_dict(torch.load(str(model_path), map_location=_device))
    model.eval()
    model.to(_device)
    _model = model
    logger.info("✅ Model loaded from %s (device: %s)", model_path, _device)

    # ── Normalization stats ───────────────────────────────────────────────────
    _mean = np.load(str(settings.mean_path), allow_pickle=True)
    _std = np.load(str(settings.std_path), allow_pickle=True)
    logger.info("Normalization stats loaded.")

    # ── Label encoder ─────────────────────────────────────────────────────────
    _label_encoder = np.load(str(settings.label_encoder_path), allow_pickle=True)
    logger.info("Label encoder loaded: %s", list(_label_encoder))


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model artifacts at startup; release on shutdown."""
    logger.info("Starting up — loading model artifacts …")
    try:
        _load_artifacts()
    except Exception as exc:
        logger.error("❌ Failed to load artifacts: %s", exc)
        # Allow the server to start; /health will report model_loaded=False
    yield
    logger.info("Shutting down.")


# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit])

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Emotilearn — Emotion Detection API",
    description="Predicts facial emotion from 468 MediaPipe landmark coordinates.",
    version="2.0.0",
    lifespan=lifespan,
)

# Rate-limit error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["Meta"])
async def health():
    """
    Liveness / readiness check.
    Returns model_loaded=False if artifacts failed to load at startup.
    """
    return HealthResponse(
        status="ok",
        model_loaded=_model is not None,
        device=str(_device),
    )


@app.post("/detect-emotion", response_model=EmotionResponse, tags=["Inference"])
@limiter.limit(settings.rate_limit)
async def detect_emotion(request: Request, payload: EmotionRequest):
    """
    Predict the dominant facial emotion from 1404 landmark floats.

    - **landmarks**: flat list `[x0,y0,z0, x1,y1,z1, …, x467,y467,z467]`
    - Returns the predicted emotion label and per-class softmax probabilities.
    """
    if _model is None or _label_encoder is None:
        raise HTTPException(
            status_code=503,
            detail="Model is not loaded. Check server logs.",
        )

    # ── Preprocess ────────────────────────────────────────────────────────────
    try:
        features = np.array(payload.landmarks, dtype=np.float32)
        if _mean is not None and _std is not None:
            features = (features - _mean) / _std
        tensor = torch.FloatTensor(features).unsqueeze(0).to(_device)  # (1, 1404)
    except Exception as exc:
        logger.error("Feature processing error: %s", exc)
        raise HTTPException(status_code=400, detail="Failed to process landmarks.")

    # ── Inference ─────────────────────────────────────────────────────────────
    try:
        with torch.no_grad():
            logits = _model(tensor)                                   # (1, n_classes)
            probs = torch.softmax(logits, dim=1).cpu().numpy()[0]     # (n_classes,)
            pred_idx = int(torch.argmax(logits, dim=1).item())

        emotion: str = str(_label_encoder[pred_idx])
        probabilities = {
            str(_label_encoder[i]): float(p) for i, p in enumerate(probs)
        }

        logger.info("Predicted: %s | probs: %s", emotion, probabilities)
        return EmotionResponse(emotion=emotion, probabilities=probabilities)

    except Exception as exc:
        logger.error("Inference error: %s", exc)
        raise HTTPException(status_code=500, detail="Prediction failed.")


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level="info",
    )
