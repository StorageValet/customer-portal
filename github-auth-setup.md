# GitHub Authentication Setup

Since you're getting an authentication error, you need to set up GitHub credentials. Here are two options:

## Option 1: GitHub Personal Access Token (Recommended)

1. Go to https://github.com/settings/tokens/new
2. Create a new token with these settings:
   - Note: "Storage Valet Portal Access"
   - Expiration: 90 days (or your preference)
   - Select scopes:
     - ✅ repo (Full control of private repositories)
     - ✅ workflow (Update GitHub Action workflows)

3. Copy the token (it looks like: ghp_xxxxxxxxxxxx)

4. Run this command and paste your token when prompted for password:
   ```bash
   git push origin main
   # Username: YOUR_GITHUB_USERNAME
   # Password: YOUR_PERSONAL_ACCESS_TOKEN
   ```

## Option 2: Use GitHub CLI (Easier)

1. Install GitHub CLI if you haven't:
   ```bash
   brew install gh
   ```

2. Authenticate:
   ```bash
   gh auth login
   ```

3. Follow the prompts to authenticate via browser

4. Then push:
   ```bash
   git push origin main
   ```

## After Pushing Successfully

Your repository will be updated at:
https://github.com/StorageValet/customer-portal

Then you can create a Codespace from the GitHub website!