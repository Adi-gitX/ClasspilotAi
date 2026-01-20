#!/bin/bash
echo "Starting ClassPilot AI..."

# Function to kill background processes on exit
cleanup() {
  echo "Stopping all processes..."
  kill $(jobs -p)
  exit
}

trap cleanup SIGINT SIGTERM

# Start Chat
if [ -d "chat" ]; then
  echo "Starting Chat..."
  cd chat
  npm run dev &
  cd ..
fi

# Start Services
if [ -d "services" ]; then
  echo "Starting Services..."
  source services/venv/bin/activate
  python3 services/main.py &
  deactivate
fi

wait
