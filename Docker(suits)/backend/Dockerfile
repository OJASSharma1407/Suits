FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app \
    PORT=8000

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU wheel first to prevent downloading 2GB+ CUDA binaries
RUN pip install --no-cache-dir torch>=2.3.0 --index-url https://download.pytorch.org/whl/cpu

# Install application dependencies from backend/requirements.txt
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Remove build-essential to reduce image footprint
RUN apt-get purge -y --auto-remove build-essential && rm -rf /var/lib/apt/lists/*

# Create persistent storage directories
RUN mkdir -p /app/data/uploads /app/data/pdf_cache /app/data/models

# Copy backend application source
COPY backend/ .

# Set up non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Health check using the FastAPI /api/health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
