#!/bin/bash

echo "🚀 Storage Valet Portal Deployment Script"
echo "========================================"
echo ""
echo "This script will deploy your app to Vercel."
echo ""
echo "📧 First, let's authenticate with Vercel..."
echo "When prompted:"
echo "1. Press down arrow 4 times to select 'Continue with Email'"
echo "2. Press Enter"
echo "3. Type: zach@mystoragevalet.com"
echo "4. Press Enter"
echo "5. Check your email and click the verification link"
echo "6. Come back here and the deployment will continue"
echo ""
echo "Press Enter to start..."
read

# Login to Vercel
npx vercel login

echo ""
echo "✅ Great! Now deploying your app..."
echo ""

# Deploy to production
npx vercel --prod --yes

echo ""
echo "🎉 Deployment complete!"
echo "Your app is now live on the internet!"