# Portal Bug Fix Priority List

## Current State: ⚠️ NOT PRODUCTION READY

### Executive Summary
- **Critical Bugs**: 6 (blocking launch)
- **High Priority**: 8 (major functionality issues)  
- **Medium Priority**: 5 (UX problems)
- **Quick Wins**: 7 (< 15 min each)
- **Total Fix Time**: ~18 hours

## DAY 1: Quick Wins + Critical Session Fix (3 hours)

### Quick Wins (1.5 hours total)
1. **Fix container count display** (15 min)
   - File: `client/src/pages/dashboard.tsx`
   - Issue: Shows "You have undefined containers"
   - Fix: Add null check and default to 0

2. **Remove formula field updates** (15 min)
   - File: `server/routes/auth-routes.ts`
   - Issue: Trying to update 'Full Name' and 'Customer ID' (formula fields)
   - Fix: Remove these from update operations

3. **Fix route ordering** (10 min)
   - File: `server/routes/item-routes.ts`
   - Issue: `/bulk-delete` after `/:id` makes it unreachable
   - Fix: Move bulk-delete before :id route

4. **Add loading states** (20 min)
   - Files: All pages in `client/src/pages/`
   - Fix: Add loading spinners during data fetches

5. **Fix TypeScript errors** (30 min)
   - Run: `npm run check`
   - Fix all type errors

### Critical Fix: Session Management (1.5 hours)
```typescript
// server/airtableSessionStore.ts
// Fix date handling - use consistent format
const sessionData = {
  ...data,
  // Use ISO string, not Unix timestamp
  cookie: {
    ...data.cookie,
    expires: data.cookie.expires ? 
      new Date(data.cookie.expires).toISOString() : 
      undefined
  }
};
```

## DAY 2: Photo Upload + Data Types (6 hours)

### Fix Photo Upload Race Condition (3 hours)
```typescript
// client/src/components/add-item-modal.tsx
// Consolidate into single API call
const handleSubmit = async () => {
  const formData = new FormData();
  formData.append('name', itemName);
  formData.append('description', description);
  formData.append('photo', photo);
  
  // Single endpoint handles everything
  const response = await api.post('/items/create-with-photo', formData);
};
```

### Fix ItemId Type Mismatches (3 hours)
- Standardize on string type throughout
- Update all parseInt/Number conversions
- Fix API endpoints expecting numbers

## DAY 3: Error Handling + Movement Flow (6 hours)

### Add Error Boundaries (2 hours)
```typescript
// client/src/components/error-boundary.tsx
class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error);
    // Log to service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Fix Movement Scheduling (4 hours)
- Date picker validation
- Time slot availability
- Confirmation flow
- Status updates

## JotForm Integration Strategy

### Where JotForm Makes Sense:
1. **Main Landing Page Registration** ✅
   - More reliable than custom form
   - Built-in validation
   - Stripe integration available
   - Can push to Airtable directly

2. **Portal Feedback Forms** ✅
   - Bug reports
   - Feature requests
   - Support tickets

3. **Complex Multi-Step Forms** ✅
   - Onboarding wizard
   - Insurance documentation
   - Specialty item approval

### Where Custom Forms Are Better:
1. **Quick Actions** ❌
   - Add item modal
   - Schedule movement
   - Profile updates

### JotForm Implementation:
```html
<!-- Embed in landing page -->
<iframe
  id="JotFormIFrame-xxxxxx"
  title="Storage Valet Registration"
  src="https://form.jotform.com/xxxxxx"
  style="width: 100%; height: 600px; border: none;"
></iframe>

<!-- Or use their React component -->
import { JotformEmbed } from 'react-jotform-embed';
<JotformEmbed src="https://form.jotform.com/xxxxxx" />
```

## Testing Checklist After Fixes

### Core Functionality:
- [ ] User can register and login
- [ ] Session persists across refreshes
- [ ] Items save correctly
- [ ] Photos upload and display
- [ ] Movements can be scheduled
- [ ] Container count is accurate
- [ ] Search works
- [ ] Filters apply correctly

### Edge Cases:
- [ ] Handle network errors gracefully
- [ ] Large photo uploads
- [ ] Multiple quick submissions
- [ ] Session timeout behavior
- [ ] Empty states display correctly

## Realistic Timeline

### Week 1: Fix Portal (18 hours)
- Day 1: Quick wins + sessions
- Day 2: Photos + data types  
- Day 3: Error handling + movements

### Week 2: Registration Flow (20 hours)
- JotForm setup with Stripe
- Airtable integration
- Magic link system
- Welcome emails

### Week 3: Testing & Deploy (15 hours)
- End-to-end testing
- Production setup
- DNS configuration
- Launch! 🚀

## Next Immediate Step
Run this command to see all TypeScript errors:
```bash
npm run check
```
Then start with the Quick Wins - they'll give you immediate improvements and build momentum.