#!/bin/bash

# ClassPilot AI - Backend Start Script

echo "=============================================="
echo "  ClassPilot AI Backend Server"
echo "=============================================="
echo ""

# Change to server directory
cd "$(dirname "$0")"

# Check for virtual environment
if [ ! -d "venv" ]; then
    echo "⚠️  Virtual environment not found. Creating..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
source venv/bin/activate

# Check for required packages
if ! python -c "import fastapi" 2>/dev/null; then
    echo "📦 Installing required packages..."
    pip install -r requirements.txt
fi

# Check for optional packages
echo ""
echo "Checking optional components:"

if python -c "import faster_whisper" 2>/dev/null; then
    echo "  ✅ Whisper ASR: Available"
else
    echo "  ⚠️  Whisper ASR: Not installed (demo mode)"
fi

if python -c "import ollama" 2>/dev/null; then
    echo "  ✅ Ollama LLM: Available"
else
    echo "  ⚠️  Ollama LLM: Not installed"
fi

if python -c "import mysql.connector" 2>/dev/null; then
    echo "  ✅ MySQL: Available"
else
    echo "  ⚠️  MySQL: Not installed"
fi

echo ""
echo "Starting server on http://localhost:8000"
echo "API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo "=============================================="
echo ""

# Run the server
cd asr
python app.py
