"""
model.py
--------
Defines the EmotionTransformer neural network architecture.

This module is shared between:
  - train.py  (training pipeline)
  - main.py   (FastAPI inference server)

Architecture:
  Raw landmarks (1404 floats)
    → Linear projection  (1404 → hidden_dim)
    → Unsqueeze          (batch, 1, hidden_dim)
    → TransformerEncoder (n_layers, n_heads)
    → Squeeze            (batch, hidden_dim)
    → Dropout
    → Linear classifier  (hidden_dim → n_classes)
"""

import torch
import torch.nn as nn


class EmotionTransformer(nn.Module):
    """
    Transformer-based classifier for facial emotion recognition.

    Parameters
    ----------
    input_dim  : int   – Number of input features (468 landmarks × 3 coords = 1404)
    hidden_dim : int   – Internal representation size (projection + transformer d_model)
    n_layers   : int   – Number of stacked TransformerEncoder layers
    n_heads    : int   – Number of self-attention heads (hidden_dim must be divisible by n_heads)
    dropout    : float – Dropout probability applied after the encoder and before the classifier
    n_classes  : int   – Number of output emotion classes
    """

    def __init__(
        self,
        input_dim: int,
        hidden_dim: int,
        n_layers: int,
        n_heads: int,
        dropout: float,
        n_classes: int,
    ) -> None:
        super().__init__()

        # Project raw landmark features into the transformer's model dimension
        self.input_proj = nn.Linear(input_dim, hidden_dim)

        # Build one reusable encoder layer, then stack n_layers copies
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden_dim,
            nhead=n_heads,
            dim_feedforward=hidden_dim * 4,  # standard 4× expansion
            dropout=dropout,
            batch_first=True,               # (batch, seq, feature) layout
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=n_layers)

        # Regularization before classification head
        self.dropout = nn.Dropout(dropout)

        # Map encoded representation to class logits
        self.fc = nn.Linear(hidden_dim, n_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.

        Parameters
        ----------
        x : torch.Tensor  shape (batch, input_dim)

        Returns
        -------
        torch.Tensor  shape (batch, n_classes)  — raw logits
        """
        x = self.input_proj(x)          # (batch, hidden_dim)
        x = x.unsqueeze(1)              # (batch, 1, hidden_dim) — single sequence step
        x = self.transformer(x)         # (batch, 1, hidden_dim)
        x = x.squeeze(1)               # (batch, hidden_dim)
        x = self.dropout(x)
        x = self.fc(x)                  # (batch, n_classes)
        return x
