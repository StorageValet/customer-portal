#!/bin/bash

# Replace YOUR_GITHUB_USERNAME with your actual GitHub username
GITHUB_USERNAME="YOUR_GITHUB_USERNAME"

echo "Setting up GitHub remote..."
git remote add origin https://github.com/$GITHUB_USERNAME/storage-valet-portal.git

echo "Pushing code to GitHub..."
git branch -M main
git push -u origin main

echo "✅ Code pushed to GitHub successfully!"
echo ""
echo "Next steps:"
echo "1. Go to https://github.com/$GITHUB_USERNAME/storage-valet-portal"
echo "2. Click the green 'Code' button"
echo "3. Select 'Codespaces' tab"
echo "4. Click 'Create codespace on main'"
echo ""
echo "Your development environment will be ready in a few minutes!"