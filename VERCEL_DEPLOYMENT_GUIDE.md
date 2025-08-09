# Storage Valet Portal - Vercel Deployment Guide

## Step 1: Login to Vercel

Run this command in your terminal:
```bash
npx vercel login
```

It will ask for your email. Use your work email: **zach@mystoragevalet.com**

## Step 2: Verify Your Email
1. Check your email for a verification link from Vercel
2. Click the link to verify
3. Return to the terminal

## Step 3: Deploy the App
Once logged in, run:
```bash
npx vercel --yes --prod
```

## Step 4: Set Environment Variables
After deployment, we'll need to add your secret keys to Vercel:

1. Go to https://vercel.com/dashboard
2. Find your "storage-valet-portal" project
3. Go to Settings → Environment Variables
4. Add these variables:

```
NODE_ENV=production
SESSION_SECRET=<generate-a-strong-secret>
AIRTABLE_API_KEY=<your-airtable-key>
AIRTABLE_BASE_ID=<your-airtable-base>
SENDGRID_API_KEY=<your-sendgrid-key>
SENDGRID_SENDER_EMAIL=zach@mystoragevalet.com
STRIPE_SECRET_KEY=<your-stripe-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook>
OPENAI_API_KEY=<your-openai-key>
DROPBOX_ACCESS_TOKEN=<your-dropbox-token>
```

## What This Does
- ✅ Gives you a live URL accessible from anywhere
- ✅ Automatically handles HTTPS/SSL
- ✅ Scales automatically with traffic
- ✅ Provides reliable hosting
- ✅ Allows continuous development

## After Deployment
You'll get a URL like: https://storage-valet-portal.vercel.app
You can immediately test login with your accounts!