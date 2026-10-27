#!/usr/bin/env bash
# =================================================================
# SUITS - Docker Deployment Launcher (Bash)
# =================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "⚖️  Starting SUITS Docker Stack from Docker(suits)..."

# Ensure .env exists
if [ ! -f ".env" ]; then
    if [ -f ".env.docker.example" ]; then
        echo "Creating .env from .env.docker.example..."
        cp .env.docker.example .env
    elif [ -f "../.env" ]; then
        echo "Copying .env from project root..."
        cp ../.env .env
    fi
fi

# Build and start containers
echo "Building and launching PostgreSQL, Redis, Backend, and Frontend containers..."
docker compose up --build -d

echo ""
echo "=========================================================="
echo "🎉 SUITS is running in Docker containers!"
echo "   - Frontend UI:    http://localhost:5173"
echo "   - Backend API:    http://localhost:8000"
echo "   - Interactive Docs: http://localhost:8000/docs"
echo "   - Health Check:   http://localhost:8000/api/health"
echo "   - Postgres DB:    localhost:5432"
echo "   - Redis:          localhost:6379"
echo "=========================================================="
echo "To view real-time logs:     docker compose logs -f"
echo "To stop containers:         docker compose down"
