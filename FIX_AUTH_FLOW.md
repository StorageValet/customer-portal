# Authentication Flow Fix

## Problem
Users were successfully logging in but being redirected back to the login page instead of the dashboard.

## Root Causes
1. **Login page redirect**: After successful login, the page was navigating to "/" (landing page) instead of "/dashboard"
2. **Landing page behavior**: The landing page wasn't checking for authenticated users and redirecting them
3. **Airtable session storage**: The Sessions table "Expiry" field expects ISO date strings, not Unix timestamps

## Solutions Implemented

### 1. Fixed Login Redirect
**File**: `client/src/pages/login.tsx`
```typescript
// Changed from:
navigate("/");

// To:
navigate("/dashboard");
```

### 2. Added Authentication Check to Landing Page
**File**: `client/src/pages/landing.tsx`
```typescript
const { isAuthenticated, isLoading } = useAuth();
const [, navigate] = useLocation();

useEffect(() => {
  // If user is authenticated, redirect to dashboard
  if (isAuthenticated && !isLoading) {
    navigate("/dashboard");
  }
}, [isAuthenticated, isLoading, navigate]);
```

### 3. Fixed Airtable Session Storage Format
**File**: `server/airtableSessionStore.ts`
```typescript
// Changed from Unix timestamps:
Expiry: Math.floor(expiry.getTime() / 1000),

// To ISO date strings:
Expiry: expiry.toISOString(),
```

## Result
- ✅ Users now properly redirect to dashboard after login
- ✅ Authenticated users visiting the landing page auto-redirect to dashboard
- ✅ Session storage works with fallback to memory if Airtable fails
- ✅ Authentication state persists across page refreshes

## Testing
1. Clear browser cookies/session
2. Visit http://localhost:3000
3. Click "Portal Sign In"
4. Login with credentials
5. Confirm redirect to /dashboard
6. Refresh page - should stay logged in
7. Visit "/" - should auto-redirect to dashboard

## Notes
- The Airtable session storage error is non-critical as the system falls back to memory storage
- To fully fix Airtable sessions, ensure the "Sessions" table in Airtable has:
  - "Session ID" (text field)
  - "Data" (long text field)
  - "Expiry" (date/time field)
  - "Last Access" (date/time field)