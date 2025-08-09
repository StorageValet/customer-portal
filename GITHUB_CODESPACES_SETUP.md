# GitHub Codespaces Setup - Work Around Mac Localhost Issue

## Why Codespaces?
Your Mac is blocking localhost connections due to security restrictions. Codespaces gives you a full development environment in the cloud - no local restrictions!

## Setup Steps

### 1. Create GitHub Repository
```bash
# In your project folder
cd /Users/zacharybrown/Documents/SV-Portal_v6
git init
git add .
git commit -m "Initial commit"
```

### 2. Push to GitHub
1. Create new repo at https://github.com/new
   - Name: `storage-valet-portal`
   - Private repository
   - Don't initialize with README

2. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/storage-valet-portal.git
git push -u origin main
```

### 3. Open in Codespaces
1. Go to your repository on GitHub
2. Click green "Code" button
3. Select "Codespaces" tab
4. Click "Create codespace on main"

### 4. Start Development
Once Codespaces opens:
```bash
npm install
npm run dev
```

The portal will be accessible via a Codespaces URL - no localhost issues!

## Benefits
- ✅ Free 60 hours/month
- ✅ Full VS Code in browser
- ✅ No local security restrictions
- ✅ Automatic port forwarding
- ✅ Works on any computer

## Environment Variables
Add your .env.production variables in Codespaces:
1. Click Terminal → New Terminal
2. Run: `cp .env.example .env`
3. Edit with your production values

Your Storage Valet Portal will run perfectly in Codespaces!