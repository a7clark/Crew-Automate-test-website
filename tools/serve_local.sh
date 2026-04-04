#!/usr/bin/env bash
# tools/serve_local.sh
#
# Starts a local HTTP server from the repo root.
# Kills any existing process on the port first.
#
# Usage:
#   bash tools/serve_local.sh [port]
#   Default port: 8080

PORT="${1:-8080}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Kill anything already on the port
lsof -ti :"$PORT" | xargs kill -9 2>/dev/null

echo "Serving $ROOT on http://localhost:$PORT"
cd "$ROOT" && python3 -m http.server "$PORT" --bind 127.0.0.1
