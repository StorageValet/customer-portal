# Vercel Deployment Guide for Storage Valet Portal

## 🚀 **Quick Vercel Setup**

### **Step 1: Prerequisites**

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login
```

### **Step 2: Project Configuration**

```bash
# From your project root
cd /Users/zacharybrown/Documents/SV-Portal_v6

# Initialize Vercel project
vercel

# Follow prompts:
# ? Set up and deploy "~/Documents/SV-Portal_v6"? [Y/n] Y
# ? Which scope do you want to deploy to? [Your Account]
# ? Link to existing project? [y/N] N
# ? What's your project's name? storage-valet-portal
# ? In which directory is your code located? ./
```

### **Step 3: Environment Variables**

Set these in Vercel dashboard or via CLI:

```bash
# Core Database
vercel env add AIRTABLE_API_KEY
vercel env add AIRTABLE_BASE_ID

# Authentication & Sessions
vercel env add SESSION_SECRET
vercel env add REPLIT_APP_ID
vercel env add REPLIT_APP_SECRET

# Payment Processing
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_PUBLISHABLE_KEY

# AI Features
vercel env add OPENAI_API_KEY

# Email Service
vercel env add GMAIL_CLIENT_ID
vercel env add GMAIL_CLIENT_SECRET
vercel env add GMAIL_REFRESH_TOKEN
vercel env add GMAIL_USER_EMAIL

# File Storage
vercel env add DROPBOX_ACCESS_TOKEN

# Softr Integration (NEW)
vercel env add SOFTR_WEBHOOK_SECRET
vercel env add PORTAL_DOMAIN
vercel env add MARKETING_DOMAIN
vercel env add AIRTABLE_WEBHOOK_URL

# Production Settings
vercel env add NODE_ENV production
```

### **Step 4: Custom Domain Setup**

```bash
# Add custom domain
vercel domains add portal.mystoragevalet.com

# Link domain to project
vercel domains ls
vercel alias set storage-valet-portal-xxxx.vercel.app portal.mystoragevalet.com
```

### **Step 5: Build and Deploy**

```bash
# Test build locally
npm run build

# Deploy to Vercel
vercel --prod

# Your portal will be available at:
# https://portal.mystoragevalet.com
```

## 🔧 **Vercel Project Settings**

### **Build Configuration**

- **Framework Preset**: Other
- **Build Command**: `npm run build`
- **Output Directory**: `client/dist`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

### **Function Configuration**

- **Node.js Version**: 18.x
- **Memory**: 1024 MB
- **Timeout**: 30 seconds
- **Environment**: Serverless

## 🌐 **DNS Configuration**

### **Required DNS Records**

Add these to your domain registrar (where mystoragevalet.com is managed):

```dns
Type: CNAME
Name: portal
Value: cname.vercel-dns.com
TTL: 300
```

### **Verification**

```bash
# Test DNS propagation
dig portal.mystoragevalet.com

# Test HTTPS
curl -I https://portal.mystoragevalet.com
```

## 📊 **Monitoring & Analytics**

### **Vercel Analytics** (Recommended)

```bash
# Enable in Vercel dashboard
# Analytics → Enable Web Analytics
# Provides: Page views, performance metrics, user insights
```

### **Custom Monitoring**

```javascript
// Add to your app for custom tracking
// pages/_app.tsx or main.tsx
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

## 🚨 **Troubleshooting**

### **Common Issues**

**Build Fails:**

```bash
# Check build logs
vercel logs

# Test build locally
npm run build
npm run check
```

**Function Timeout:**

```javascript
// If API calls timeout, optimize in server/index.ts
export const config = {
  maxDuration: 30,
  memory: 1024,
};
```

**Environment Variables Missing:**

```bash
# List all env vars
vercel env ls

# Pull env vars locally for testing
vercel env pull .env.local
```

**Domain Not Working:**

```bash
# Check domain status
vercel domains ls

# Re-verify domain
vercel domains verify portal.mystoragevalet.com
```

## ✅ **Success Verification**

Your deployment is successful when:

1. ✅ **Build completes**: No errors in Vercel dashboard
2. ✅ **Domain resolves**: `https://portal.mystoragevalet.com` loads
3. ✅ **API works**: `/api/auth/user` returns data
4. ✅ **Database connects**: Can login and see dashboard
5. ✅ **Webhooks ready**: Softr integration endpoints respond

## 📈 **Performance Optimization**

### **Automatic Optimizations**

Vercel automatically provides:

- ✅ Global CDN distribution
- ✅ Image optimization
- ✅ Static file caching
- ✅ Gzip compression
- ✅ HTTP/2 support

### **Custom Optimizations**

```javascript
// next.config.js (if needed)
module.exports = {
  experimental: {
    serverComponentsExternalPackages: ["airtable"],
  },
  images: {
    domains: ["dropbox.com", "dl.dropboxusercontent.com"],
  },
};
```

## 🔄 **Deployment Workflow**

### **Development → Production**

```bash
# 1. Develop locally
npm run dev

# 2. Test build
npm run build

# 3. Deploy to preview
vercel

# 4. Deploy to production
vercel --prod

# 5. Alias to custom domain (automatic with setup)
```

### **Continuous Deployment**

Once connected to GitHub:

- ✅ Push to `main` → Auto-deploy to production
- ✅ Push to other branches → Auto-deploy to preview
- ✅ Pull requests → Auto-deploy preview URLs

Your Storage Valet Portal is now ready for production on Vercel! 🚀
