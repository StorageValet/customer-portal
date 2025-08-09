#!/bin/bash
# Storage Valet Portal - Quick Recovery Script

echo "Storage Valet Portal - Quick Recovery Script"
echo "==========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: This script must be run from the project root directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
echo "Checking required tools..."
if ! command_exists node; then
    echo "Error: Node.js is not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "Error: npm is not installed"
    exit 1
fi

# Kill any processes on port 3000
echo "Checking for processes on port 3000..."
if lsof -ti:3000 >/dev/null 2>&1; then
    echo "Killing processes on port 3000..."
    lsof -ti:3000 | xargs kill -9
    sleep 2
fi

# Clean npm cache and reinstall dependencies
echo "Cleaning npm cache and reinstalling dependencies..."
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Check for .env file
if [ ! -f ".env" ]; then
    echo ""
    echo "WARNING: .env file not found!"
    echo "Please copy .env.example to .env and fill in your values:"
    echo "  cp .env.example .env"
    echo ""
fi

# Run type checking
echo "Running type checking..."
npm run check

# Show status
echo ""
echo "Recovery complete!"
echo ""
echo "Next steps:"
echo "1. Ensure your .env file is configured correctly"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Quick commands:"
echo "  npm run dev    - Start development server"
echo "  npm run check  - Run TypeScript type checking"
echo "  npm run build  - Build for production"
echo ""