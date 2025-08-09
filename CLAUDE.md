# Storage Valet Portal - Claude AI Assistant Instructions

## Project Overview

Storage Valet Portal (SV Portal) is a customer portal application for a valet storage service. The application allows customers to manage their stored items, schedule pickups/deliveries, and interact with their inventory.

### Business Model & Key Concepts

- **Single Address System**: Each customer has ONE registered address on their account. All pickups and deliveries occur at this address.
- **No Address Input**: Never ask customers for addresses during scheduling - use their registered account address automatically.
- **Route Optimization**: The single-address model enables AI/ML-powered route optimization to suggest optimal pickup/delivery times based on geographic clustering of customers.
- **Service Types**:
  - **Pickup**: Collect items from customer's registered address to store in warehouse
  - **Delivery**: Return stored items from warehouse to customer's registered address

### UI Design Principles

- **"Less is More"**: Clean, minimalist interface that reduces clutter
- **Smart Forms**: Auto-populate fields from existing data, never ask for information we already have
- **Consolidated Widgets**: Combined Total Value & Insurance, Items & Plan Usage
- **Simplified Navigation**: All items visible on desktop, icon-based mobile bottom tab bar
- **No Redundancy**: Remove duplicate buttons and unnecessary access points
- **Premium Experience**: Focus on value, not price per square/cubic foot

## Quick Access

- **Project Location**: `/Users/zacharybrown/Documents/SV-Portal_v6`
- **Development Server**: http://localhost:3000
- **API Server**: http://localhost:3000/api

## Essential Commands

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Type checking
npm run check
```

### Testing & Validation

```bash
# Type checking (always run before committing)
npm run check

# Run development server with hot reload
npm run dev

# Schema synchronization commands
npm run schema:test      # Test schema tools
npm run schema:validate  # Validate against live Airtable
npm run schema:status    # Complete status report
npm run schema:changes   # Check for schema changes
```

## Project Structure

```
SV-Portal_v6/
├── client/          # React frontend application
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities and API client
│   │   └── contexts/    # React contexts
├── server/          # Express backend server
│   ├── index.ts     # Main server entry point
│   ├── routes.ts    # API routes
│   ├── email.ts     # Email service
│   └── airtableSessionStore.ts  # Session management
├── shared/          # Shared types and schemas
│   └── schema.ts    # Zod schemas
└── docs/           # Documentation

## Key Technologies
- **Frontend**: React, TypeScript, Vite, TailwindCSS, Radix UI
- **Backend**: Express, TypeScript, Airtable
- **Database**: ⚠️ **AIRTABLE ONLY** - No PostgreSQL/SQL databases (See AIRTABLE_ONLY_README.md)
- **Authentication**: Session-based with Airtable backend
- **Email**: Nodemailer with Gmail
- **Storage**: Dropbox integration for photos
- **Payments**: Stripe integration

## Current Pricing Model (v1)
- **Starter Plan**: $199/month (Setup Fee: $99.50)
- **Medium Plan**: $299/month (Setup Fee: $149.50)
- **Family Plan**: $349/month (Setup Fee: $174.50)
- **Billing Trigger**: Monthly billing starts after first movement, not at registration
- **Model Type**: Fixed subscription - no per-container or à la carte pricing in v1
- **Value Proposition**: Premium concierge service, not space rental

## Environment Variables Required
The application requires several environment variables. Check `.env.example` for the full list.

## Important Notes
1. Always run `npm run check` before committing changes
2. The application uses Airtable as the primary database
3. Session management is handled through AirtableSessionStore
4. Email service requires Gmail app-specific password
5. Dropbox integration requires OAuth token

## MCP Integrations

### Airtable MCP ✅
- **MCP Server**: `@felores/airtable-mcp-server`
- **Base ID**: `appSampziZuFLMveE`
- **Operations**: Full CRUD on all tables
- **Setup Guide**: `/MCP_SETUP_GUIDE.md`

### Stripe MCP ✅
- **MCP Server**: `@stripe/mcp`
- **Mode**: LIVE KEYS (use caution)
- **Operations**: Read-only (customers, subscriptions, products, charges)
- **Setup Guide**: `/STRIPE_MCP_GUIDE.md`

### Cross-System Queries
With both MCPs active, you can:
```
# Verify customer sync
"Check if Stripe customer matches Airtable record"

# Audit subscriptions
"List all Stripe subscriptions and verify Airtable matches"

# Payment verification
"Show recent Stripe charges for customer [email]"
```

### System Integration Map
See `/SYSTEM_INTEGRATION_MAP.md` for complete platform architecture

## Common Issues & Solutions
1. **Port already in use**: Kill process on port 3000: `lsof -ti:3000 | xargs kill -9`
2. **TypeScript errors**: Run `npm run check` to see all type errors
3. **Module not found**: Run `npm install` to ensure all dependencies are installed
4. **React app not loading (only seeing HTML)**:
   - Check `server/routes.ts` for any catch-all routes (`/` or `*`) that might intercept requests
   - These routes prevent Vite from serving the React app in development
   - Remove any test HTML routes - Vite handles all non-API routes

## Development Workflow
1. Always pull latest changes before starting work
2. Create feature branches for new work
3. Test thoroughly on development server
4. Run type checking before committing
5. Document any new environment variables or setup requirements
```
