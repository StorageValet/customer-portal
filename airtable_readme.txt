# Storage Valet Portal - AIRTABLE ONLY

## 🚨 CRITICAL: THIS APPLICATION USES AIRTABLE DATABASE ONLY

**DO NOT CREATE POSTGRESQL DATABASE**  
**DO NOT USE REPLIT DATABASE**  
**DO NOT RUN DATABASE MIGRATIONS**

## Database Configuration

This application uses **Airtable** as its database. All data storage is handled through the Airtable API.

### Required Environment Variables
```bash
AIRTABLE_API_KEY=pat_your_personal_access_token
AIRTABLE_BASE_ID=app_your_airtable_base_id
STRIPE_SECRET_KEY=sk_test_your_stripe_key
SESSION_SECRET=your_long_random_string
```

### Airtable Tables Required
1. **Customers** - User accounts and profiles
2. **Containers** - Stored items with photos and metadata  
3. **Movements** - Pickup and delivery scheduling
4. **Sessions** - User session management

### Storage Implementation
- File: `server/storage.ts`
- Class: `AirtableStorage`
- All CRUD operations use Airtable API
- No SQL database required

## Deployment Instructions

1. Upload all files to Replit
2. Set environment variables in Secrets tab
3. **DO NOT** run `npm run db:push` (this is legacy)
4. Run `npm start` or `npm run dev`

## 🚫 What NOT to Do
- Do not create PostgreSQL database
- Do not run database migrations
- Do not use Replit's database features
- Do not let AI agents create database schema

## ✅ What TO Do
- Set Airtable environment variables
- Ensure Airtable tables exist
- Test Airtable connection
- Run the application directly
- Use the new schema synchronization tools:
  - `npm run schema:test` - Test schema tools
  - `npm run schema:validate` - Validate against live Airtable
  - `npm run schema:status` - Get complete status report