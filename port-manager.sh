#!/bin/bash
# Port Manager Agent - Ensures development ports are available

echo "🔧 Port Manager Agent Active"
echo "================================"

check_port() {
    lsof -i :$1 2>/dev/null | grep LISTEN
}

free_port() {
    local processes=$(lsof -ti:$1 2>/dev/null)
    if [ ! -z "$processes" ]; then
        echo "$processes" | xargs kill -9 2>/dev/null
        echo "✅ Port $1 freed"
    fi
}

# Check common dev ports
PORTS=(3000 5173 8080 4000 5000)

echo "Checking development ports..."
for port in "${PORTS[@]}"; do
    if check_port $port > /dev/null; then
        echo "⚠️  Port $port in use, freeing..."
        free_port $port
    else
        echo "✅ Port $port is free"
    fi
done

echo ""
echo "Port status summary:"
netstat -an | grep LISTEN | grep -E '3000|5173|8080|4000|5000' || echo "✅ All development ports are clear!"