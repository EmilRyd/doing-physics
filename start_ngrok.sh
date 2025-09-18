#!/bin/bash

# Script to start the Vertical Projectile Motion Simulator with ngrok
echo "🚀 Starting Vertical Projectile Motion Simulator..."
echo "=================================================="

# Check if Python server is already running
if lsof -ti:8000 > /dev/null; then
    echo "✅ Python server already running on port 8000"
else
    echo "🔧 Starting Python HTTP server on port 8000..."
    python3 -m http.server 8000 &
    SERVER_PID=$!
    echo "✅ Server started with PID: $SERVER_PID"
    sleep 2
fi

echo ""
echo "🌐 Starting ngrok tunnel..."
echo "This will create a public URL for your simulator!"
echo ""
echo "Press Ctrl+C to stop the tunnel when you're done sharing."
echo "=================================================="
echo ""

# Start ngrok tunnel with custom subdomain
echo "🎯 Attempting to use custom subdomain: doingphysics.ngrok.app"
echo "Note: Custom subdomains require a paid ngrok plan"
echo ""
ngrok http 8000 --subdomain=projectile --log stdout
