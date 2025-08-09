#!/bin/bash
# Background Monitoring Agent

echo "👁️ Background Monitor Agent"
echo "=========================="
echo "Monitoring ports 3000 and 5173 for conflicts..."
echo "Press Ctrl+C to stop"
echo ""

while true; do
    # Check if our key ports get taken
    for port in 3000 5173; do
        if lsof -i :$port 2>/dev/null | grep LISTEN > /dev/null; then
            echo "⚠️  [$(date +%H:%M:%S)] Port $port was taken! Freeing it..."
            lsof -ti:$port | xargs kill -9 2>/dev/null
            echo "✅ [$(date +%H:%M:%S)] Port $port freed"
        fi
    done
    
    # Check for git locks
    if [ -f .git/index.lock ]; then
        echo "⚠️  [$(date +%H:%M:%S)] Git lock detected! Removing..."
        rm -f .git/index.lock
        echo "✅ [$(date +%H:%M:%S)] Git lock removed"
    fi
    
    sleep 5  # Check every 5 seconds
done