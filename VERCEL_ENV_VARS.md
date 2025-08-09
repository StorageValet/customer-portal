# Environment Variables for Vercel

Copy these to your Vercel dashboard:
https://vercel.com/zach-browns-projects-21b3bfe1/storage-valet-portal/settings/environment-variables

## Required Variables:

```
NODE_ENV=production
PORT=3000
SESSION_SECRET=sv-portal-session-2025-secure-key-change-this
AIRTABLE_API_KEY=<your-airtable-api-key>
AIRTABLE_BASE_ID=appSampziZuFLMveE
SENDGRID_API_KEY=<your-sendgrid-key>
SENDGRID_SENDER_EMAIL=zach@mystoragevalet.com
STRIPE_SECRET_KEY=<your-stripe-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook>
OPENAI_API_KEY=<your-openai-api-key>
DROPBOX_ACCESS_TOKEN=<your-dropbox-access-token>
SOFTR_WEBHOOK_SECRET=<if-you-have-one>
SOFTR_PORTAL_DOMAIN=<if-you-have-one>
```

## How to Add:
1. Click "Add New"
2. Enter the Key (e.g., AIRTABLE_API_KEY)
3. Enter the Value
4. Leave all environments checked (Production, Preview, Development)
5. Click "Save"

## After Adding All Variables:
1. Go to the Deployments tab
2. Click the three dots on the latest deployment
3. Click "Redeploy"
4. Wait 1-2 minutes
5. Your portal will be fully functional!

## Missing Keys?
- SENDGRID_API_KEY: Get from https://app.sendgrid.com/settings/api_keys
- STRIPE_SECRET_KEY: Get from https://dashboard.stripe.com/apikeys
- DROPBOX_ACCESS_TOKEN: Get from https://www.dropbox.com/developers/apps