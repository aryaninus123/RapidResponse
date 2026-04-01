#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND="$ROOT/frontend-web"
LOG_DIR="$ROOT/logs"
mkdir -p "$LOG_DIR"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

echo -e "${BLUE}=== RapidResponse Dev Server ===${NC}"

# --- PostgreSQL ---
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if ! pg_isready -h localhost -p 5432 -q; then
  echo -e "  Starting PostgreSQL..."
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null
  sleep 2
fi
echo -e "  ${GREEN}PostgreSQL ready${NC}"

# --- Python venv ---
echo -e "${YELLOW}Setting up Python environment...${NC}"
if [ ! -d "$ROOT/venv" ]; then
  python3 -m venv "$ROOT/venv"
  echo -e "  Created venv"
fi
source "$ROOT/venv/bin/activate"

# Install deps if needed
if ! python -c "import fastapi" 2>/dev/null; then
  echo -e "  Installing Python dependencies..."
  pip install -r "$ROOT/requirements-minimal.txt" -q
fi
echo -e "  ${GREEN}Python environment ready${NC}"

# --- DB init ---
echo -e "${YELLOW}Initializing database...${NC}"
python "$ROOT/scripts/init_db.py" 2>/dev/null && echo -e "  ${GREEN}Database ready${NC}"

# --- Frontend deps ---
echo -e "${YELLOW}Checking frontend dependencies...${NC}"
if [ ! -d "$FRONTEND/node_modules" ]; then
  echo -e "  Installing npm packages..."
  cd "$FRONTEND" && npm install -q
fi
echo -e "  ${GREEN}Frontend dependencies ready${NC}"

# --- Start backend ---
echo -e "${YELLOW}Starting backend on :8000...${NC}"
cd "$ROOT"
uvicorn main_minimal:app --host 0.0.0.0 --port 8000 --reload > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
for i in {1..15}; do
  if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}Backend ready${NC} (http://localhost:8000)"
    break
  fi
  sleep 1
  if [ $i -eq 15 ]; then
    echo -e "  ${RED}Backend failed to start. Check logs/backend.log${NC}"
    cat "$LOG_DIR/backend.log"
    exit 1
  fi
done

# --- Start frontend ---
echo -e "${YELLOW}Starting frontend on :3000...${NC}"
cd "$FRONTEND"
npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be ready
for i in {1..20}; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "  ${GREEN}Frontend ready${NC} (http://localhost:3000)"
    break
  fi
  sleep 1
  if [ $i -eq 20 ]; then
    echo -e "  ${RED}Frontend failed to start. Check logs/frontend.log${NC}"
    cat "$LOG_DIR/frontend.log"
    exit 1
  fi
done

echo ""
echo -e "${GREEN}=== All services running ===${NC}"
echo -e "  Frontend:   ${BLUE}http://localhost:3000${NC}"
echo -e "  Backend:    ${BLUE}http://localhost:8000${NC}"
echo -e "  API Docs:   ${BLUE}http://localhost:8000/docs${NC}"
echo -e "  Logs:       $LOG_DIR/"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Tail logs
tail -f "$LOG_DIR/backend.log" "$LOG_DIR/frontend.log" &
TAIL_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
kill "$TAIL_PID" 2>/dev/null
