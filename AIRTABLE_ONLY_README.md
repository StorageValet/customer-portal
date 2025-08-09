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

## Why Airtable?

Storage Valet chose Airtable as the production database for several reasons:

1. **Business User Access** - Non-technical team members can view and manage data
2. **Built-in UI** - Airtable provides forms, views, and reports out of the box
3. **Flexible Schema** - Easy to add fields and tables as business evolves
4. **API First** - Robust API for all operations
5. **No Infrastructure** - No database server to maintain

## Schema Synchronization

The project now includes enterprise-grade schema synchronization tools:

### Enhanced Storage Layer

- `server/enhanced-storage.ts` - Type-safe field transformations
- Automatic validation and data conversion
- Bidirectional sync between app models and Airtable fields

### Schema Documentation

- `shared/airtable-schema.ts` - Complete TypeScript definitions for all 11 tables
- Field types, validation rules, and relationships
- Zod schemas for runtime validation

### Validation Tools

- `tools/schema-validator.ts` - Live schema comparison
- Detects missing fields, type mismatches, and relationship errors
- Comprehensive reporting with actionable feedback

## Common Issues

### "Cannot find module 'pg'" or PostgreSQL errors

**Solution**: This is expected. The app doesn't use PostgreSQL. Ignore these errors.

### "Database connection failed"

**Solution**: Check your Airtable API key and Base ID in environment variables.

### "Table not found" errors

**Solution**: Ensure your Airtable base has the required tables with correct names.

### Schema mismatch errors

**Solution**: Run `npm run schema:validate` to identify field mapping issues.

## For AI Agents and Developers

When working on this codebase:

1. **ALWAYS** use `AirtableStorage` class for data operations
2. **NEVER** create SQL migrations or schema files
3. **IGNORE** any PostgreSQL or Drizzle-related files (they're legacy)
4. **USE** the schema synchronization tools for field mapping
5. **REFER** to `shared/airtable-schema.ts` for table structure

## Support

If you encounter database-related issues:

1. First, verify Airtable credentials are set correctly
2. Run `npm run schema:test` to test the connection
3. Use `npm run schema:status` for a full diagnostic report
4. Check `server/storage.ts` for the implementation details

Remember: **Airtable is the ONLY database**. There is no PostgreSQL, no SQLite, no other database.
