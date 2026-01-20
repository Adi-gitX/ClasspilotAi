#!/bin/bash
echo "Setting up ClassPilot AI..."

# Install Root Dependencies if any (assuming monorepo style later)
# npm install

# Install Chat Dependencies
if [ -d "chat" ]; then
  echo "Installing Chat Dependencies..."
  cd chat
  npm install
  cd ..
else
  echo "Chat directory not found!"
fi

# Install Service Dependencies
if [ -d "services" ]; then
  echo "Installing Service Dependencies..."
  python3 -m venv services/venv
  source services/venv/bin/activate
  pip install -r services/requirements.txt
  deactivate
else
  echo "Services directory not found!"
fi

echo "Setup Complete!"
