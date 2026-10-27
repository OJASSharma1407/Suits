#!/usr/bin/env bash
# =================================================================
# SUITS - Root Docker Launcher
# Delegates to Docker(suits)/docker-start.sh
# =================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
if [ -f "$DIR/Docker(suits)/docker-start.sh" ]; then
    bash "$DIR/Docker(suits)/docker-start.sh"
else
    echo "❌ Docker directory Docker(suits) not found."
    exit 1
fi
