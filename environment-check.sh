#!/bin/bash
# Master Environment Check - Run before any development session

echo "🤖 Storage Valet Development Environment Check"
echo "=============================================="
echo ""

# Run port manager
echo "1️⃣ Checking Ports..."
./port-manager.sh
echo ""

# Run git guardian
echo "2️⃣ Checking Git..."
./git-guardian.sh
echo ""

# Check for conflicting processes
echo "3️⃣ Checking for Conflicting Processes..."
CONFLICTS=$(ps aux | grep -E "Visual Studio Code|GitHub Desktop" | grep -v grep | wc -l | tr -d ' ')
if [ "$CONFLICTS" -gt 0 ]; then
    echo "⚠️  Found $CONFLICTS potentially conflicting applications"
    ps aux | grep -E "Visual Studio Code|GitHub Desktop" | grep -v grep | awk '{print "  - " $11}'
else
    echo "✅ No conflicting applications detected"
fi

# Check Node processes
echo ""
echo "4️⃣ Checking Node Processes..."
NODE_COUNT=$(ps aux | grep -E "node|npm" | grep -v grep | wc -l | tr -d ' ')
if [ "$NODE_COUNT" -gt 0 ]; then
    echo "📊 Found $NODE_COUNT Node/npm processes running"
    echo "   Run 'killall node' if you need to clear them"
else
    echo "✅ No Node processes running"
fi

# Final summary
echo ""
echo "=============================================="
echo "🎯 ENVIRONMENT STATUS SUMMARY:"
echo ""

# Check if ready
READY=true
if check_port 3000 > /dev/null 2>&1; then
    echo "❌ Port 3000 is still in use"
    READY=false
else
    echo "✅ Port 3000 is free"
fi

if [ -f .git/index.lock ]; then
    echo "❌ Git lock file exists"
    READY=false
else
    echo "✅ Git is unlocked"
fi

if [ "$READY" = true ]; then
    echo ""
    echo "✅ ENVIRONMENT IS READY FOR DEVELOPMENT!"
    echo ""
    echo "You can now run:"
    echo "  npm run dev"
else
    echo ""
    echo "⚠️  ENVIRONMENT NEEDS CLEANUP"
    echo ""
    echo "Run this to fix:"
    echo "  ./environment-clean.sh"
fi