#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

echo "=========================================================="
echo "          ClientOps - Web Clients Dashboard               "
echo "=========================================================="

DOCKER_STARTED=false
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo ">> Received shutdown signal. Terminating ClientOps..."

  # Terminate frontend
  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo ">> Stopping desktop frontend (PID $FRONTEND_PID)..."
    kill -TERM "$FRONTEND_PID" 2>/dev/null || true
    wait "$FRONTEND_PID" 2>/dev/null || true
  fi

  # Terminate local backend if running
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo ">> Stopping local backend server (PID $BACKEND_PID)..."
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi

  # Stop docker containers if docker was started
  if [ "$DOCKER_STARTED" = true ]; then
    echo ">> Stopping Docker containers (docker compose down)..."
    docker compose down 2>/dev/null || true
  fi

  # Kill any stray processes associated with this app
  pkill -P $$ 2>/dev/null || true

  echo ">> All processes and containers stopped cleanly. Goodbye!"
  exit 0
}

# Trap signals for complete cleanup on Ctrl+C (SIGINT) or SIGTERM
trap cleanup SIGINT SIGTERM EXIT

# 1. Start Backend (Docker if available, otherwise local venv fallback)
echo ">> Checking backend environment..."
if docker info >/dev/null 2>&1; then
  echo ">> Docker daemon detected! Starting PostgreSQL and FastAPI via Docker Compose..."
  docker compose up -d
  DOCKER_STARTED=true
else
  echo ">> Docker daemon not directly accessible. Using local Python virtualenv for backend..."
  if [ ! -d "backend/.venv" ]; then
    echo ">> Creating backend virtualenv..."
    python3 -m venv backend/.venv
    backend/.venv/bin/pip install -r backend/requirements.txt
  fi
  PYTHONPATH=backend backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 &
  BACKEND_PID=$!
  echo ">> Local backend started with PID $BACKEND_PID."
fi

# 2. Wait for backend health check
echo ">> Waiting for Backend API to become ready..."
for i in {1..30}; do
  if curl -s http://localhost:8000/api/v1/health | grep -q '"status":"ok"'; then
    echo ">> Backend API is healthy and operational at http://localhost:8000"
    break
  fi
  sleep 1
  if [ $i -eq 30 ]; then
    echo ">> Warning: Backend health check timed out. Proceeding anyway..."
  fi
done

# 3. Launch Frontend Desktop App
echo ">> Starting Electron Desktop App..."
npm --prefix frontend run dev &
FRONTEND_PID=$!

echo ""
echo ">> ClientOps is now RUNNING!"
echo ">> Press Ctrl+C at any time to kill all processes and containers cleanly."
echo ""

# Wait for frontend process
wait "$FRONTEND_PID"
