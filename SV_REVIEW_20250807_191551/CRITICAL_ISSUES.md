# Storage Valet Portal - Critical Issues Summary
## Date: 2025-08-07

### 1. Field Type Mismatches with Airtable
- **Issue**: Multiple fields expect different formats than app sends
- **Examples**:
  - "Estimated Value" expects currency format ("$1,500.00") but gets number (1500)
  - Sessions "Expiry" field expects date-only but was getting ISO datetime
  - "Service Address" is computed field but app tries to write to it
- **Impact**: 422 errors when creating/updating records

### 2. Session Persistence Problems
- **Issue**: Airtable session store fails, falls back to memory
- **Impact**: Users lose sessions on server restart
- **Root Cause**: Date format mismatch in Sessions table

### 3. Database Over-Engineering
- **Issue**: 12 tables with complex relationships for MVP that needs 3-4 tables
- **Impact**: Constant field mapping errors, computed field conflicts
- **Recommendation**: Simplify to essential fields only

### 4. Authentication Flow
- **Issue**: Session creation succeeds but shows 404 after login
- **Root Cause**: Race condition between authentication state update and navigation

### 5. Movement Creation Failures
- **Issue**: Cannot schedule pickups/deliveries
- **Root Cause**: Trying to write to computed "Service Address" field

## Fixes Applied Today
1. ✅ Changed Sessions date fields to date-only format (YYYY-MM-DD)
2. ✅ Removed write attempt to "Service Address" computed field
3. ✅ Configured Stripe MCP with full access (`--tools=*`)

## Immediate Next Steps
1. Backup Airtable base
2. Simplify schema to match app requirements
3. Convert currency fields to numbers
4. Change Sessions date fields to text
5. Remove all computed fields from write operations

## Long-term Recommendations
1. Build application-first, let database follow
2. Use simple field types initially
3. Add complexity only when features require it
4. Consider PostgreSQL for sessions, keep Airtable for business data