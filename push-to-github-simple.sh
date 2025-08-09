#!/bin/bash

echo "=== GitHub Push Script ==="
echo ""
echo "This script will push your Storage Valet Portal to GitHub"
echo ""

# Step 1: Authenticate
echo "Step 1: Authenticating with GitHub..."
echo "You'll need to:"
echo "1. Copy the one-time code that appears"
echo "2. Open https://github.com/login/device in your browser"
echo "3. Enter the code"
echo ""
read -p "Press Enter to start authentication..."

gh auth login

# Step 2: Check authentication
echo ""
echo "Checking authentication status..."
gh auth status

# Step 3: Push code
echo ""
echo "Step 2: Pushing code to GitHub..."
echo "This will replace the old Replit version with your current code."
read -p "Press Enter to push your code (or Ctrl+C to cancel)..."

git push --force origin main

echo ""
echo "✅ Done! Your code has been pushed to GitHub."
echo ""
echo "Next steps:"
echo "1. Go to https://github.com/StorageValet/customer-portal"
echo "2. Click the green 'Code' button"
echo "3. Click 'Codespaces' tab"
echo "4. Click 'Create codespace on main'"
echo ""
echo "Your development environment will be ready in a few minutes!"