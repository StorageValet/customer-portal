#!/bin/bash
# Emergency Environment Cleanup

echo "🧹 Emergency Environment Cleanup"
echo "================================"
echo ""

echo "This will:"
echo "  - Kill all Node processes"
echo "  - Free all development ports"
echo "  - Clear git locks"
echo "  - Close conflicting applications"
echo ""

read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔧 Starting cleanup..."
    
    # Kill Node processes
    echo "Stopping Node processes..."
    killall node 2>/dev/null || echo "  No Node processes found"
    pkill -f "npm" 2>/dev/null || echo "  No npm processes found"
    
    # Free ports
    echo "Freeing ports..."
    for port in 3000 5173 8080 4000 5000; do
        lsof -ti:$port | xargs kill -9 2>/dev/null || echo "  Port $port was already free"
    done
    
    # Clear git locks
    echo "Clearing git locks..."
    find . -name "*.lock" -path "*/.git/*" -delete 2>/dev/null || echo "  No git locks found"
    
    # Optional: Close conflicting apps
    echo "Closing conflicting applications..."
    osascript -e 'tell application "Visual Studio Code" to quit' 2>/dev/null || echo "  VS Code not running"
    osascript -e 'tell application "GitHub Desktop" to quit' 2>/dev/null || echo "  GitHub Desktop not running"
    
    echo ""
    echo "✅ Cleanup complete!"
    echo ""
    echo "Run './environment-check.sh' to verify"
else
    echo "Cleanup cancelled."
fi