#!/bin/bash
set -euo pipefail

echo "🔍 Repository Health Check"
echo "=========================="

# Check Git root
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "Not a git repo")
CURRENT_DIR=$(pwd)

if [[ "$GIT_ROOT" == "$HOME" ]]; then
    echo "❌ CRITICAL: Git root is at HOME directory!"
    echo "   This is likely a misconfigured repository."
    exit 1
elif [[ "$GIT_ROOT" == "Not a git repo" ]]; then
    echo "⚠️  Not in a git repository"
else
    echo "✅ Git root: $GIT_ROOT"
fi

# Check for secrets in tracked files
echo ""
echo "Scanning for potential secrets..."
if git ls-files | xargs grep -l -E 'sk-proj-|pk_live_|sk_live_|GOCSPX-|pat[A-Z0-9]{20}' 2>/dev/null; then
    echo "⚠️  WARNING: Potential secrets found in tracked files!"
else
    echo "✅ No obvious secrets in tracked files"
fi

# Check .gitignore
echo ""
if [[ -f .gitignore ]]; then
    echo "✅ .gitignore exists"
    if grep -q "^\.env$" .gitignore && grep -q "^node_modules" .gitignore; then
        echo "✅ Critical entries found in .gitignore"
    else
        echo "⚠️  .gitignore may be missing critical entries"
    fi
else
    echo "❌ No .gitignore file!"
fi

# Check for common problem files
echo ""
echo "Checking for problem files..."
PROBLEMS=0
if [[ -d "$HOME/.git" ]]; then
    echo "❌ Found .git in HOME directory!"
    PROBLEMS=$((PROBLEMS + 1))
fi
if git ls-files | grep -q "Icon$"; then
    echo "⚠️  macOS Icon files tracked (may contain CR characters)"
    PROBLEMS=$((PROBLEMS + 1))
fi
if [[ $PROBLEMS -eq 0 ]]; then
    echo "✅ No common problem files detected"
fi

echo ""
echo "Repository health check complete."