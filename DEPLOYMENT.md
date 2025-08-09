# Deployment Guide for Storage Valet

## Environment Variables Required

Set these environment variables in your hosting platform:

```bash
# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id

# Authentication (Replit SSO)
REPLIT_APP_ID=your_replit_app_id
REPLIT_APP_SECRET=your_replit_app_secret

# Session Security
SESSION_SECRET=your_random_session_secret

# Stripe Payments
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# AI Features
OPENAI_API_KEY=your_openai_api_key

# Email Service
EMAIL_API_KEY=your_email_service_api_key

# Application
NODE_ENV=production
```

## Deployment Options

### 1. Vercel (Recommended)

- Connect your GitHub repository
- Set environment variables in dashboard
- Deploy automatically on push

### 2. Railway

- Connect GitHub repository
- Set environment variables
- Deploy with one click

### 3. Render

- Connect GitHub repository
- Use render.yaml configuration
- Set environment variables in dashboard

### 4. Replit (Development)

- Upload project as ZIP
- Set secrets in Replit
- Good for development/testing

## Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Airtable base properly set up
- [ ] Stripe account configured
- [ ] Domain/subdomain ready (if needed)
- [ ] SSL certificate (usually automatic)

## Build Process

The application builds in two steps:

1. Frontend (React/Vite): `vite build`
2. Backend (Express): `esbuild server/index.ts`

Both are handled by `npm run build`.
