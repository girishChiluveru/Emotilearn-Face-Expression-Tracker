"""
train.py
--------
Standalone training pipeline for the EmotionTransformer model.

Reads facial landmark data from an Excel dataset, trains the model, and
saves artifacts to the `artifacts/` directory (configurable via ARTIFACTS_DIR
env var or the default path defined in config.py).

Usage
-----
  python train.py

Artifacts produced (in artifacts/)
------------------------------------
  emotion_model.pth        – best model weights (highest validation accuracy)
  label_encoder.npy        – numpy array of emotion class names
  mean.npy                 – per-feature mean for z-score normalisation
  std.npy                  – per-feature std  for z-score normalisation
  model_hyperparams.json   – architecture config for inference server
"""

import json
import os
import sys
import traceback

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from torch.utils.data import DataLoader, Dataset

from config import settings
from model import EmotionTransformer

print("Starting train.py …")

# ── Valid emotion classes ─────────────────────────────────────────────────────
VALID_EMOTIONS = ["Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad"]


# ── Dataset ───────────────────────────────────────────────────────────────────

class EmotionDataset(Dataset):
    """
    PyTorch Dataset wrapping pre-processed landmark features and integer labels.

    Parameters
    ----------
    features : np.ndarray  shape (N, 1404)
    labels   : np.ndarray  shape (N,)  integer-encoded emotion classes
    augment  : bool        if True, adds Gaussian noise (σ=0.01) during __getitem__
    """

    def __init__(self, features: np.ndarray, labels: np.ndarray, augment: bool = False) -> None:
        self.features = torch.FloatTensor(features)
        self.labels = torch.LongTensor(labels)
        self.augment = augment

    def __len__(self) -> int:
        return len(self.labels)

    def __getitem__(self, idx: int):
        x = self.features[idx]
        if self.augment:
            x = x + torch.normal(0.0, 0.01, x.shape)
        return x, self.labels[idx]


# ── Data loading ──────────────────────────────────────────────────────────────

def load_data(file_path: str):
    """
    Load and pre-process the Excel dataset.

    Returns
    -------
    features      : np.ndarray  z-score normalised, shape (N, 1404)
    labels        : np.ndarray  integer-encoded, shape (N,)
    label_encoder : LabelEncoder
    mean          : np.ndarray  per-feature mean
    std           : np.ndarray  per-feature std  (epsilon-clipped)
    """
    print(f"Loading dataset from: {file_path}")
    try:
        df = pd.read_excel(file_path)
        print(f"Raw shape: {df.shape}")

        # Drop rows with missing / literal-'nan' expressions
        df = df.dropna(subset=["Expression"])
        df = df[df["Expression"].astype(str).str.lower() != "nan"]
        print(f"After null-drop: {df.shape}")

        # Filter to supported emotion labels only
        df = df[df["Expression"].isin(VALID_EMOTIONS)]
        if df.empty:
            raise ValueError("No valid emotions found in dataset after filtering.")
        print(f"After emotion filter: {df.shape}")

        # Feature matrix — every column except the label and filename
        feature_cols = [c for c in df.columns if c not in ("Expression", "FileName")]
        features = df[feature_cols].values.astype(np.float64)

        # Impute NaN / inf
        if np.any(np.isnan(features)) or np.any(np.isinf(features)):
            print("Warning: NaN/Inf values found — imputing with 0.")
            features = np.nan_to_num(features, nan=0.0, posinf=0.0, neginf=0.0)

        # Z-score normalisation
        mean = features.mean(axis=0)
        std = features.std(axis=0) + 1e-8   # epsilon avoids division by zero
        features = (features - mean) / std

        # Encode emotion labels as integers
        label_encoder = LabelEncoder()
        labels = label_encoder.fit_transform(df["Expression"])

        print(f"Unique emotions : {list(df['Expression'].unique())}")
        print(f"Label mapping   : {dict(zip(label_encoder.classes_, range(len(label_encoder.classes_))))}")
        print(f"Feature columns : {len(feature_cols)}")

        return features, labels, label_encoder, mean, std

    except Exception as exc:
        print(f"Error in load_data: {exc}")
        traceback.print_exc()
        sys.exit(1)


# ── Training ──────────────────────────────────────────────────────────────────

def train_model() -> None:
    print("Entering train_model …")

    # ── Hyperparameters ───────────────────────────────────────────────────────
    input_dim = 468 * 3   # 1404 — 468 MediaPipe landmarks × (x, y, z)
    hidden_dim = 128
    n_layers = 1
    n_heads = 8
    dropout = 0.3
    batch_size = 32
    epochs = 50
    learning_rate = 1e-4

    # ── Load data ─────────────────────────────────────────────────────────────
    dataset_path = os.path.join(os.path.dirname(__file__), "JoyVerseDataSet_Filled.xlsx")
    print(f"Resolved dataset path: {os.path.abspath(dataset_path)}")

    features, labels, label_encoder, mean, std = load_data(dataset_path)
    n_classes = len(label_encoder.classes_)
    print(f"Number of classes: {n_classes}")
    if n_classes != 6:
        print(f"Warning: expected 6 classes, got {n_classes}. Check dataset labels.")

    # ── Save normalization stats + hyperparameters ────────────────────────────
    artifacts_dir = settings.artifacts_path
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    np.save(str(artifacts_dir / "mean.npy"), mean)
    np.save(str(artifacts_dir / "std.npy"), std)

    hyperparams = {
        "input_dim": input_dim,
        "hidden_dim": hidden_dim,
        "n_layers": n_layers,
        "n_heads": n_heads,
        "dropout": dropout,
        "n_classes": n_classes,
    }
    with (artifacts_dir / "model_hyperparams.json").open("w") as f:
        json.dump(hyperparams, f)
    print(f"Saved hyperparameters to {artifacts_dir / 'model_hyperparams.json'}")

    # ── Train / test split ────────────────────────────────────────────────────
    print("Splitting data (80/20) …")
    X_train, X_test, y_train, y_test = train_test_split(
        features, labels, test_size=0.2, random_state=42
    )

    # ── Datasets and loaders ──────────────────────────────────────────────────
    print("Building DataLoaders …")
    train_loader = DataLoader(
        EmotionDataset(X_train, y_train, augment=True),
        batch_size=batch_size,
        shuffle=True,
    )
    test_loader = DataLoader(
        EmotionDataset(X_test, y_test, augment=False),
        batch_size=batch_size,
    )

    # ── Model, loss, optimizer ────────────────────────────────────────────────
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    model = EmotionTransformer(
        input_dim=input_dim,
        hidden_dim=hidden_dim,
        n_layers=n_layers,
        n_heads=n_heads,
        dropout=dropout,
        n_classes=n_classes,
    ).to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(
        model.parameters(), lr=learning_rate, weight_decay=1e-4
    )

    # ── Training loop ─────────────────────────────────────────────────────────
    print("Starting training loop …")
    best_acc = 0.0
    model_save_path = artifacts_dir / "emotion_model.pth"

    for epoch in range(epochs):
        # — Training phase —
        model.train()
        total_loss = 0.0

        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            optimizer.zero_grad()
            logits = model(batch_x)
            loss = criterion(logits, batch_y)

            if torch.isnan(loss):
                print(f"NaN loss at epoch {epoch + 1}. Stopping.")
                return

            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            total_loss += loss.item()

        # — Validation phase —
        model.eval()
        correct = total = 0
        with torch.no_grad():
            for batch_x, batch_y in test_loader:
                batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                logits = model(batch_x)
                preds = torch.argmax(logits, dim=1)
                total += batch_y.size(0)
                correct += (preds == batch_y).sum().item()

        acc = 100.0 * correct / total
        avg_loss = total_loss / len(train_loader)
        print(f"Epoch {epoch + 1:>3}/{epochs}  loss={avg_loss:.4f}  acc={acc:.2f}%")

        if acc > best_acc:
            best_acc = acc
            torch.save(model.state_dict(), str(model_save_path))
            print(f"  ✅ Best model saved (acc={acc:.2f}%)")

    # ── Save label encoder ────────────────────────────────────────────────────
    np.save(str(artifacts_dir / "label_encoder.npy"), label_encoder.classes_)
    print(f"Label encoder saved to {artifacts_dir / 'label_encoder.npy'}")
    print(f"\nTraining complete. Best validation accuracy: {best_acc:.2f}%")


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    try:
        train_model()
    except Exception as exc:
        print(f"Fatal error: {exc}")
        traceback.print_exc()
        sys.exit(1)