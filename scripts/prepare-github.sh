#!/bin/bash

# GitHub Upload Preparation Script
# Run this before uploading to GitHub

echo "🚀 Preparing Storage Valet Portal for GitHub Upload..."
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this from the project root."
    exit 1
fi

echo "✅ Found package.json - we're in the right directory"

# Check for sensitive files
echo ""
echo "🔍 Checking for sensitive files..."

if [ -f ".env" ]; then
    echo "⚠️  WARNING: .env file found - this contains secrets!"
    echo "   This file will be ignored by .gitignore, but double-check it's not committed"
fi

# Check for API keys in code
echo ""
echo "🔐 Scanning for hardcoded API keys..."

if grep -r "sk_" . --exclude-dir=node_modules --exclude=".git" --exclude="*.md" --exclude="*.example" >/dev/null 2>&1; then
    echo "⚠️  WARNING: Found potential Stripe keys in code"
    grep -r "sk_" . --exclude-dir=node_modules --exclude=".git" --exclude="*.md" --exclude="*.example"
else
    echo "✅ No Stripe keys found in code"
fi

if grep -r "pat_" . --exclude-dir=node_modules --exclude=".git" --exclude="*.md" --exclude="*.example" >/dev/null 2>&1; then
    echo "⚠️  WARNING: Found potential Airtable keys in code"
    grep -r "pat_" . --exclude-dir=node_modules --exclude=".git" --exclude="*.md" --exclude="*.example"
else
    echo "✅ No Airtable keys found in code"
fi

# Test build process
echo ""
echo "🏗️  Testing build process..."

if npm run check >/dev/null 2>&1; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed - fix errors before uploading"
    npm run check
    exit 1
fi

if npm run schema:test >/dev/null 2>&1; then
    echo "✅ Schema tests passed"
else
    echo "❌ Schema tests failed"
    npm run schema:test
    exit 1
fi

# Check important files
echo ""
echo "📁 Checking required files..."

required_files=("README.md" ".gitignore" "LICENSE" "package.json" ".env.example")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ Missing required file: $file"
    fi
done

# Check directory structure
echo ""
echo "📂 Checking directory structure..."

required_dirs=("client" "server" "shared" "docs" "tools")
for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/ directory exists"
    else
        echo "❌ Missing directory: $dir/"
    fi
done

# Generate pre-commit info
echo ""
echo "📊 Repository Statistics:"
echo "========================"

if command -v find >/dev/null; then
    ts_files=$(find . -name "*.ts" -not -path "./node_modules/*" | wc -l)
    tsx_files=$(find . -name "*.tsx" -not -path "./node_modules/*" | wc -l)
    total_files=$(find . -type f -not -path "./node_modules/*" -not -path "./.git/*" | wc -l)
    
    echo "📄 TypeScript files: $ts_files"
    echo "⚛️  React components: $tsx_files"
    echo "📁 Total files: $total_files"
fi

if command -v wc >/dev/null && [ -f "README.md" ]; then
    readme_lines=$(wc -l < README.md)
    echo "📖 README.md lines: $readme_lines"
fi

# Final checklist
echo ""
echo "✅ PRE-UPLOAD CHECKLIST:"
echo "========================"
echo "□ Remove or secure any .env files"
echo "□ Verify no API keys in code"
echo "□ All tests passing"
echo "□ README.md is complete"
echo "□ .gitignore covers sensitive files"
echo "□ Documentation is up to date"
echo ""

# Git status if already initialized
if [ -d ".git" ]; then
    echo "📝 Current Git Status:"
    echo "====================="
    git status --short
    echo ""
fi

echo "🎯 Next Steps:"
echo "=============="
echo "1. Review any warnings above"
echo "2. Follow the GitHub setup guide: docs/github-setup-guide.md"
echo "3. Create repository on GitHub"
echo "4. Push your code"
echo ""
echo "Ready for GitHub upload! 🚀"
