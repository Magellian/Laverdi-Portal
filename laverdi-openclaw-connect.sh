#!/bin/bash
# Laverdi OpenClaw Connection Script for Mac/Linux
# This script opens an SSH tunnel and launches your OpenClaw instance in the browser

echo ""
echo "===================================="
echo "  Laverdi OpenClaw Connector"
echo "===================================="
echo ""
echo "This will:"
echo "  1. Open an SSH tunnel to your server"
echo "  2. Launch OpenClaw in your browser"
echo ""
echo "Keep this terminal open while using OpenClaw."
echo ""

# Check if SSH is available
if ! command -v ssh &> /dev/null; then
    echo "ERROR: SSH is not installed"
    echo ""
    echo "Mac: Install with: brew install openssh"
    echo "Linux: Install with: sudo apt-get install openssh-client (Ubuntu/Debian)"
    echo ""
    exit 1
fi

# Start SSH tunnel in background
echo "Starting SSH tunnel..."
ssh -L 9000:localhost:9000 root@64.23.142.154 &
SSH_PID=$!

# Wait for tunnel to establish
echo "Waiting for tunnel to establish..."
sleep 3

# Launch browser
echo "Launching OpenClaw in browser..."
sleep 1

# Open browser based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:9000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:9000
    elif command -v gnome-open &> /dev/null; then
        gnome-open http://localhost:9000
    else
        echo "Please open http://localhost:9000 in your browser"
    fi
fi

echo ""
echo "===================================="
echo "  Connection Established!"
echo "===================================="
echo ""
echo "Your OpenClaw instance is now accessible at:"
echo "  http://localhost:9000"
echo ""
echo "Keep this terminal open. Press Ctrl+C to close the tunnel when done."
echo ""

# Keep the script running (keep SSH tunnel alive)
wait $SSH_PID
