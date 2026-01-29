#!/bin/bash

# ClassPilot AI - Start Script
# Starts both frontend and backend services

set -e

echo "🚀 Starting ClassPilot AI..."
echo "============================"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$PROJECT_DIR/client"
SERVER_DIR="$PROJECT_DIR/server"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Cleanup function
cleanup() {
    echo ""
    echo "Shutting down services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check if setup has been run
if [ ! -d "$CLIENT_DIR/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not installed. Running setup...${NC}"
    ./setup.sh
fi

if [ ! -d "$SERVER_DIR/venv" ]; then
    echo -e "${YELLOW}⚠️  Backend virtual environment not found. Running setup...${NC}"
    ./setup.sh
fi

# Start Backend
echo ""
echo -e "${BLUE}🔧 Starting Backend (FastAPI)...${NC}"
cd "$SERVER_DIR"
source venv/bin/activate
cd asr
python app.py &
BACKEND_PID=$!
cd "$PROJECT_DIR"

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend failed to start${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend running on http://localhost:8000${NC}"

# Start Frontend
echo ""
echo -e "${BLUE}📱 Starting Frontend (Next.js)...${NC}"
cd "$CLIENT_DIR"
npm run dev &
FRONTEND_PID=$!
cd "$PROJECT_DIR"

# Wait for frontend to start
sleep 5

echo ""
echo "=========================================="
echo -e "${GREEN}✅ ClassPilot AI is running!${NC}"
echo ""
echo -e "  Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "  Backend:  ${BLUE}http://localhost:8000${NC}"
echo -e "  Health:   ${BLUE}http://localhost:8000/health${NC}"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=========================================="

# Wait for processes
wait $FRONTEND_PID $BACKEND_PID
