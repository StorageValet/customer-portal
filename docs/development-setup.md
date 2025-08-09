# Storage Valet Portal - Development Setup Guide

## ⚠️ CRITICAL: AIRTABLE ONLY DATABASE

**This application uses AIRTABLE as its ONLY database.**  
**DO NOT install PostgreSQL or any SQL database.**  
**DO NOT run database migrations.**  
**See AIRTABLE_ONLY_README.md for complete details.**

This guide will help you set up the Storage Valet Portal development environment from scratch.

## Prerequisites

1. **Node.js** (v18 or higher)
   - Check version: `node --version`
   - Install from: https://nodejs.org/

2. **npm** (comes with Node.js)
   - Check version: `npm --version`

3. **Git**
   - Check version: `git --version`

## Initial Setup

### 1. Navigate to Project Directory

```bash
cd /Users/zacharybrown/Documents/SV-Portal_v6
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your values
# You'll need:
# - Airtable API credentials
# - Stripe API key
# - Gmail OAuth credentials (see docs/gmail-setup-guide.md)
# - Dropbox access token (see docs/dropbox-setup-guide.md)
```

### 4. Verify TypeScript Configuration

```bash
npm run check
```

## Starting Development

### Quick Start

```bash
npm run dev
```

This starts the development server on http://localhost:3000

### If Something Goes Wrong

#### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

#### Complete Reset

```bash
# Run the recovery script
./project-reset.sh
```

## Development Workflow

### 1. Before Starting Work

- Pull latest changes: `git pull`
- Install any new dependencies: `npm install`
- Check for type errors: `npm run check`

### 2. During Development

- Development server auto-reloads on changes
- API endpoints are at http://localhost:3000/api/\*
- Frontend is served from http://localhost:3000

### 3. Before Committing

- Run type checking: `npm run check`
- Test your changes thoroughly
- Ensure no console errors

## Project Structure Overview

```
/client         - React frontend application
/server         - Express backend server
/shared         - Shared types and schemas
/docs           - Documentation
```

## Common Tasks

### Adding a New Page

1. Create component in `/client/src/pages/`
2. Add route in `/client/src/App.tsx`
3. Add navigation link if needed

### Adding an API Endpoint

1. Add route handler in `/server/routes.ts`
2. Add types in `/shared/schema.ts`
3. Update API client in `/client/src/lib/api.ts`

### Updating Database Schema

1. Update Airtable base structure
2. Update types in `/server/storage.ts`
3. Update validation schemas in `/shared/schema.ts`

## Troubleshooting

### Module Not Found Errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
npm run check
```

### Authentication Issues

- Check SESSION_SECRET is set in .env
- Verify Airtable API credentials
- Check browser cookies are enabled

### Email Not Sending

- Verify Gmail OAuth setup (see docs/gmail-setup-guide.md)
- Check GMAIL\_\* environment variables
- Test with the email test page at /test-email

## Getting Help

1. Check existing documentation in `/docs`
2. Review CLAUDE.md for AI assistant instructions
3. Check recent commits for examples: `git log --oneline -10`

## Common Pitfalls to Avoid

### 1. Never Add Catch-All Routes in Development

**Problem**: Adding routes like `app.get('/', ...)` or `app.get('*', ...)` in `server/routes.ts` will prevent the React app from loading.

**Why**: In development, Vite serves the React app through middleware. Catch-all routes intercept requests before they reach Vite.

**Solution**: Let Vite handle all non-API routes. Only add specific API routes (e.g., `/api/*`).

### 2. React App Shows HTML Instead of Components

**Symptom**: You see a basic HTML page instead of your React app.

**Cause**: Usually caused by catch-all routes in `server/routes.ts`.

**Fix**: Remove any routes that match `/` or `*` from the routes file.

## Useful Commands Reference

```bash
# Development
npm run dev          # Start dev server
npm run check        # TypeScript checking
npm run build        # Build for production

# Troubleshooting
./project-reset.sh   # Full reset
lsof -ti:3000        # Check port 3000
pkill -f "tsx"       # Kill all tsx processes
```
