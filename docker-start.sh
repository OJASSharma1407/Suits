#!/usr/bin/env bash
# =================================================================
# SUITS - Docker Deployment Launcher (Bash)
# =================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting SUITS Docker Stack..."

# 1. Ensure .env exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating .env from .env.example..."
        cp ".env.example" ".env"
    elif [ -f "backend/.env" ]; then
        echo "Copying .env from backend/.env..."
        cp "backend/.env" ".env"
    fi
fi

# 2. Check Docker availability
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed or not in PATH."
    exit 1
fi

# 3. Build & start containers
echo "Building and launching PostgreSQL, Redis, Backend, and Frontend containers..."
docker compose up --build -d

echo ""
echo "=========================================================="
echo "SUITS is running in Docker containers!"
echo "   - Frontend UI:      http://localhost:5173"
echo "   - Backend API:      http://localhost:8000"
echo "   - Health Check:     http://localhost:8000/api/health"
echo "=========================================================="
echo "To view logs: docker compose logs -f"
echo "To stop:      docker compose down"
