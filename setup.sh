#!/bin/bash

# ClassPilot AI - Setup Script
# Sets up both frontend and backend environments

set -e

echo "🚀 ClassPilot AI Setup"
echo "======================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$PROJECT_DIR/client"
SERVER_DIR="$PROJECT_DIR/server"

# Check Node.js
echo ""
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ and try again.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  Node.js version $NODE_VERSION detected. Version 18+ recommended.${NC}"
fi
echo -e "${GREEN}✅ Node.js $(node -v) found${NC}"

# Check Python
echo ""
echo "🐍 Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.10+ and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python $(python3 --version) found${NC}"

# Setup Frontend
echo ""
echo "📱 Setting up Frontend (Next.js)..."
cd "$CLIENT_DIR"

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
else
    echo "Frontend dependencies already installed"
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local..."
    cat > .env.local << EOL
# ClassPilot AI - Frontend Environment
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
EOL
    echo -e "${GREEN}✅ Created .env.local${NC}"
fi

# Setup Backend
echo ""
echo "🔧 Setting up Backend (FastAPI)..."
cd "$SERVER_DIR"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
echo "Installing backend dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env..."
    cat > .env << EOL
# ClassPilot AI - Backend Environment

# ASR Configuration
WHISPER_MODEL=small.en
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8
VAD_THRESHOLD=0.5

# RAG Configuration
EMBEDDING_MODEL=all-MiniLM-L6-v2
CHROMA_PERSIST_DIR=./data/vectors
MAX_CONTEXT_LENGTH=4000

# LLM Configuration
OLLAMA_HOST=http://localhost:11434
LLM_MODEL=llama3.2

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]
EOL
    echo -e "${GREEN}✅ Created .env${NC}"
fi

# Create data directories
mkdir -p data/vectors

deactivate

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "To start the application:"
echo ""
echo "  Option 1: Use start script"
echo "    ./start.sh"
echo ""
echo "  Option 2: Start manually"
echo "    Terminal 1 (Backend):"
echo "      cd server && source venv/bin/activate && cd asr && python app.py"
echo ""
echo "    Terminal 2 (Frontend):"
echo "      cd client && npm run dev"
echo ""
echo "  Then open: http://localhost:3000"
echo "=========================================="
