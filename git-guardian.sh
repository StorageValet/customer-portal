#!/bin/bash
# Git Guardian Agent - Keeps git operations smooth

echo "🔒 Git Guardian Agent Active"
echo "================================"

# Clear any git locks
LOCK_FILES=$(find . -name "*.lock" -path "*/.git/*" 2>/dev/null)
if [ ! -z "$LOCK_FILES" ]; then
    echo "Found git lock files:"
    echo "$LOCK_FILES"
    echo "$LOCK_FILES" | xargs rm -f
    echo "✅ Removed git locks"
else
    echo "✅ No git locks found"
fi

# Check git status
echo ""
echo "Git repository status:"
if git rev-parse --git-dir > /dev/null 2>&1; then
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
    echo "📍 Current branch: $CURRENT_BRANCH"
    
    # Check for uncommitted changes
    CHANGES=$(git status --porcelain | wc -l | tr -d ' ')
    if [ "$CHANGES" -gt 0 ]; then
        echo "📝 Uncommitted changes: $CHANGES files"
    else
        echo "✅ Working directory clean"
    fi
    
    # Check remote status
    REMOTE=$(git remote -v | head -1 | awk '{print $2}')
    echo "🔗 Remote: $REMOTE"
else
    echo "⚠️  Not in a git repository"
fi