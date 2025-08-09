# Storage Valet AI Coding Assistant Instructions

## Architecture Overview

This is a **hybrid-authentication, multi-table storage management platform** with React frontend, Express backend, and Airtable database integration.

### Core Architecture Patterns

**Authentication System:**

- Traditional email/password authentication (`server/routes.ts`)
- Persistent sessions stored in Airtable via `AirtableSessionStore`
- Session-based user identification

**Database Integration:**

- Airtable as production database with 11 tables (see `attached_assets/` schema docs)
- Current implementation uses simplified 3-table schema: Customers, Containers, Movements
- Field mapping system in `server/storage.ts` converts between app fields and Airtable field names
- All IDs are strings (Airtable record IDs), not integers

**Session Management:**

- Custom `AirtableSessionStore` extends express-session Store
- Sessions persist in Airtable 'Sessions' table with TTL expiry
- Hybrid auth support: `req.session.userId` or `req.user.claims.sub`

## Development Workflow

**Build Process:**

```bash
npm run build  # Builds both frontend (Vite) and backend (esbuild)
npm run dev    # Development with hot reload
npm start      # Production server
```

**Key Dependencies:**

- Airtable integration requires `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID`
- Stripe payments need `STRIPE_SECRET_KEY`
- Dropbox integration for file uploads (fallback to placeholders)

## Critical Patterns

**Authentication Middleware:**

```typescript
const requireAuth = (req: any, res: any, next: any) => {
  if (req.session?.userId) return next(); // Session-based auth
  return res.status(401).json({ message: "Authentication required" });
};
```

**Airtable Field Mapping:**

- Use `toAirtableUserFields()`, `toAirtableItemFields()` for data transformation
- Linked records use array format: `{ 'Customer': ['rec123'] }`
- Date fields need ISO string format for Airtable compatibility

**Error Handling:**

- Console.error for all failures with context
- Don't expose internal errors to client
- Graceful degradation (e.g., placeholder images if storage fails)

## Project-Specific Conventions

**File Organization:**

- `server/routes.ts` - Main API routes (current simplified version)
- `server/storage.ts` - Airtable abstraction layer
- `shared/schema.ts` - TypeScript interfaces and Zod schemas (simplified)
- `client/src/pages/` - Route components
- `client/src/components/` - Reusable UI components

**Admin Access:**

- Hardcoded admin emails: `admin@mystoragevalet.com`, `carol@example.com`
- Admin routes use `requireAdmin` middleware

**Deployment:**

- Build artifacts in `dist/` (backend) and `client/dist/` (frontend)
- Environment variables for production deployment

## Integration Points

**External Services:**

- Airtable: All data persistence (users, items, movements, sessions)
- Stripe: Subscription billing with metadata linking to users
- Dropbox: Photo uploads with placeholder fallback
- OpenAI: AI chat and categorization features

**Key Environment Variables:**

- `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID` - Database access
- `STRIPE_SECRET_KEY` - Payment processing
- `SESSION_SECRET` - Session security

## Important Notes

**Database Schema Gap:**
The current codebase implements only 3 tables but the production Airtable has 11 tables including Facilities, Zones, Properties, Referrals, etc. When extending functionality, reference the full schema in `attached_assets/Pasted--Airtable-Database-Schema-*.txt`.

**Photo Handling:**
File uploads go to Dropbox first, with graceful fallback to Picsum placeholders if storage fails.

**Session Persistence:**
Unlike typical memory-based sessions, this uses Airtable for persistence across server restarts, crucial for production reliability.
