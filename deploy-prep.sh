#!/bin/bash

# Storage Valet Deployment Preparation Script

echo "🚀 Preparing Storage Valet for deployment..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf client/dist/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📋 Deployment files ready:"
    echo "   - Frontend: client/dist/"
    echo "   - Backend: dist/"
    echo "   - Config: vercel.json, railway.toml, render.yaml"
    echo ""
    echo "🌟 Next steps:"
    echo "   1. Choose your hosting platform (Vercel recommended)"
    echo "   2. Set up environment variables (see DEPLOYMENT.md)"
    echo "   3. Connect your Git repository or upload files"
    echo "   4. Deploy!"
    echo ""
    echo "📖 See DEPLOYMENT.md for detailed instructions"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi
