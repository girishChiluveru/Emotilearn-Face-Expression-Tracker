FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install CPU-specific PyTorch to minimize Docker image size (since EC2 host is CPU only)
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu torch>=2.0.0 torchvision>=0.15.0

# Install remaining Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and configuration
COPY config.py main.py model.py schemas.py ./
COPY artifacts ./artifacts

# Expose port 8000
EXPOSE 8000

# Set default settings
ENV PORT=8000
ENV HOST=0.0.0.0
ENV ARTIFACTS_DIR=artifacts

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
