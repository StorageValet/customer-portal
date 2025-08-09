# Storage Valet Customer Portal - Implementation Guide

**Date**: July 29, 2025  
**Priority**: Launch-ready by end of July 30, 2025  
**Agent**: This document provides your implementation priorities and architectural decisions.

## 🚨 CRITICAL CONTEXT

- **Current State**: Portal is ~85% complete with working auth, Airtable integration, and basic features
- **Launch Goal**: Fully functional customer portal within 24-36 hours
- **Business Model**: Premium storage concierge service with AI-driven operations
- **Key Stakeholder**: Zach (founder) needs this live to onboard waiting customers

## 🎯 IMPLEMENTATION PRIORITIES (In Order)

### Priority 1: Fix Breaking Issues (If Any Remain)

- [ ] Verify all authentication methods work (email/password, Google OAuth)
- [ ] Ensure navigation works on mobile (iOS Safari priority)
- [ ] Test that Sessions table is properly storing/retrieving data
- [ ] Confirm items can be created, updated, and deleted without errors

### Priority 2: Implement Batch Delivery Scheduling ⭐

**This is THE key differentiator for Storage Valet**

```typescript
// Required functionality:
// 1. Customer selects multiple items from inventory
// 2. Clicks "Schedule Delivery"
// 3. Chooses single date/time
// 4. System creates ONE movement with multiple containers
// 5. Sends single confirmation email

// Update Movement creation to handle:
interface CreateMovementRequest {
  type: "pickup" | "delivery";
  itemIds: string[]; // Array of container IDs
  scheduledDate: Date;
  scheduledTimeSlot: string;
  specialInstructions?: string;
  // For batch deliveries, this should support multiple items
}
```

**Implementation Steps**:

1. Add multi-select checkboxes to inventory page
2. Add "Schedule Delivery" button that appears when items selected
3. Create modal for date/time selection
4. Modify backend to accept array of itemIds
5. Update email template to list all items in single confirmation

### Priority 3: Complete API Integrations

#### 3.1 Dropbox Photo Storage

```typescript
// In server/routes.ts - update photo upload endpoint
// Use environment variable: DROPBOX_ACCESS_TOKEN
// Fallback: If no token, use placeholder images (already implemented)
```

#### 3.2 Email Notifications via Zapier

```typescript
// Required notifications:
// - Welcome email (on signup)
// - Pickup confirmation
// - Delivery confirmation
// - 24-hour reminder

// Use ZAPIER_WEBHOOK_URL from environment
// Send structured data:
{
  type: 'pickup_confirmation',
  customer: { name, email },
  movement: { date, timeSlot, items },
  confirmationNumber: string
}
```

#### 3.3 Stripe Subscription Flow Fix

**Critical Business Logic**:

```typescript
// Current flow needs adjustment:
// 1. Signup → Collect setup fee (50% of monthly rate)
// 2. Customer completes onboarding
// 3. First pickup CONFIRMED → Start monthly subscription
// 4. Bill monthly on pickup anniversary

// Setup fees:
// Starter: $199/month → $100 setup
// Standard: $299/month → $150 setup
// Family: $399/month → $200 setup
```

### Priority 4: AI Concierge Implementation 🤖

**Basic Version for Launch**:

```typescript
// Floating chat button (bottom-right corner)
// Uses OPENAI_API_KEY

const systemPrompt = `You are the Storage Valet AI Concierge. You help customers:
- Navigate the portal
- Understand our services
- Schedule pickups/deliveries
- Manage their inventory
- Answer questions about pricing and insurance

Current customer context:
- Name: {customerName}
- Plan: {plan}
- Items in storage: {itemCount}
- Current page: {currentPage}

Maintain a professional, helpful, concierge-level tone.`;

// Log all conversations for future training
interface ConversationLog {
  customerId: string;
  timestamp: Date;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  page: string;
  resolved: boolean;
}
```

### Priority 5: Data Collection Architecture 📊

**Every significant action should log to Airtable**:

```typescript
// Create new Airtable table: "Analytics_Events"
interface AnalyticsEvent {
  customerId: string;
  eventType: string; // 'signup', 'item_added', 'pickup_scheduled', etc.
  timestamp: Date;
  metadata: {
    promoCode?: string;
    source?: string;
    itemCount?: number;
    value?: number;
    [key: string]: any;
  };
}
```

### Priority 6: Customer Onboarding Flow Polish

1. **Registration Path**:
   - Add promo code field to signup
   - Ensure proper plan selection UI
   - Validate address during signup

2. **Setup Payment Page**:
   - Clear messaging about setup fee vs monthly
   - Show exactly what customer is paying today
   - Explain when monthly billing starts

3. **Welcome Tutorial Enhancement**:
   - Interactive walkthrough of adding first item
   - Explain QR code system
   - Show how to schedule pickup

### Priority 7: Test Data & QA Setup

Create test accounts with realistic scenarios:

```typescript
const testCustomers = [
  {
    email: "new.customer@test.com",
    plan: "starter",
    items: [], // Empty inventory
    scenario: "Brand new user",
  },
  {
    email: "active.family@test.com",
    plan: "family",
    items: 50, // Mix of seasonal items
    scenario: "Large family with seasonal rotation",
  },
  {
    email: "premium.user@test.com",
    plan: "standard",
    items: 20, // High-value items
    scenario: "Insurance limit testing",
  },
];
```

## 🏗️ ARCHITECTURAL PRINCIPLES

### Data First

- Every customer interaction must be logged
- Design for future analytics and ML
- Capture source attribution from day one

### Premium Experience

- UI should feel high-end and trustworthy
- Minimize clicks to accomplish tasks
- Proactive communication at every step

### Scalability Built-In

- Code should handle 3 customers or 300
- AI Concierge data collection starts now
- Batch operations for efficiency

## 🚫 DO NOT IMPLEMENT (Save for Later)

- Complex analytics dashboards
- Facility/zone management UI
- Temperature-sensitive item tracking
- Specialty items workflow
- SMS notifications
- Advanced AI features (natural language scheduling)

## ✅ DEFINITION OF DONE

The portal is ready to launch when:

1. New users can sign up and pay setup fee
2. Users can add items with photos and see QR codes
3. Users can schedule batch deliveries
4. Email confirmations are sent
5. AI Concierge answers basic questions
6. No critical bugs in core flows
7. Mobile navigation works properly

## 🔧 ENVIRONMENT VARIABLES NEEDED

Ensure these are all set in Replit Secrets:

```
AIRTABLE_API_KEY=xxx (already set)
AIRTABLE_BASE_ID=xxx (already set)
STRIPE_SECRET_KEY=xxx (verify working)
DROPBOX_ACCESS_TOKEN=xxx (add this)
ZAPIER_WEBHOOK_URL=xxx (add this)
OPENAI_API_KEY=xxx (add this)
SESSION_SECRET=xxx (already set)
```

## 💬 COMMUNICATION WITH ZACH

- Ask for clarification if anything is unclear
- Share progress updates regularly
- Flag any blockers immediately
- Suggest better solutions if you see them

## 🎯 SUCCESS METRICS

You'll know you've succeeded when:

- Zach can onboard his waitlist customers
- Users complete signup → first pickup without support
- The experience feels premium and "just works"
- Data is being captured for future growth

---

**Remember**: Quality over features. Better to have fewer features that work perfectly than many features with bugs. Zach needs this to work flawlessly for his early customers to build word-of-mouth growth.

Good luck! You're building the foundation of a technology-first storage company that will scale to 100+ customers while maintaining premium service quality.
