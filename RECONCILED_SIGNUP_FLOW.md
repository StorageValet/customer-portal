# Storage Valet - RECONCILED SIGNUP FLOW
## Single Source of Truth for Registration & Authentication
### Created: August 9, 2025

---

## 🎯 THE DEFINITIVE SIGNUP FLOW

After reviewing all documentation, here is what SHOULD happen:

### Step 1: Landing Page
- User clicks "Get Started" or "Sign Up Now"
- Both buttons go to `/signup`

### Step 2: Registration Form (`/signup`)
User provides ALL required information:

**Personal Information:**
- Full Name (will be split into First/Last)
- Email
- Phone (optional but recommended)

**Service Address (REQUIRED - this is a pickup/delivery service!):**
- Street Address
- Apartment/Unit (optional)
- City
- State (NJ only for Phase 1)
- ZIP Code (must be in service area: 07030, 07302, 07304, 07305, 07306, 07307, 07310, 07311, 07086, 07087, 07093, 07020, 07047)

**Service Selection:**
- Plan Choice: Starter ($199/mo), Medium ($299/mo), Family ($399/mo)
- Promo Code (optional): WAIVEDSETUP for 100% off setup fee

**Legal:**
- Agree to Terms of Service (checkbox)

**NO PASSWORD FIELD AT THIS STAGE**

### Step 3: Form Submission
When user clicks "Continue to Payment":

1. **Validate all fields locally**
2. **Check ZIP code is in service area**
3. **If promo code entered, validate with Stripe**
4. **Create Stripe Checkout Session** with:
   - Setup fee amount (or $0 if waived)
   - Customer metadata (all form data)
   - Success URL: `/api/stripe/success`
   - Cancel URL: `/signup?error=payment_cancelled`
5. **Redirect to Stripe Checkout**

### Step 4: Stripe Checkout
- User enters payment information
- Pays setup fee (unless waived)
- Stripe processes payment

### Step 5: Success Webhook (`/api/stripe/webhook`)
After successful payment:

1. **Create Stripe Customer** with payment method
2. **Create Airtable Customer Record** with:
   - All personal information
   - Full service address
   - Plan selection
   - Stripe Customer ID
   - Setup Fee Paid: true
   - Setup Fee Amount: (actual amount or 0)
   - Setup Fee Waived By: (promo code if used)
   - Subscription Status: "none" (not started yet)
3. **Generate temporary password** for initial access
4. **Create Ops_v7 record** for follow-up
5. **Send Welcome Email** with:
   - Temporary password
   - Portal access link
   - Next steps

### Step 6: First Login
- User logs in with email + temporary password
- Prompted to set their own password
- Access dashboard

### Step 7: Billing Start
Monthly subscription billing starts on either:
- First pickup from customer's address, OR
- First delivery of containers to customer

NOT at signup!

---

## 🔴 CURRENT IMPLEMENTATION ISSUES

### Frontend (`/signup`) Issues:
✅ Has name, email, phone, ZIP
✅ Has plan selection
✅ Has terms checkbox
✅ NOW has address fields (just added)
✅ NOW has promo code field (just added)
❌ Submits to `/api/auth/register` instead of creating Stripe session
❌ Field names don't match backend expectations
❌ Not redirecting to Stripe

### Backend (`/api/auth/register`) Issues:
❌ Trying to create account immediately instead of after payment
❌ Expecting password in signup (shouldn't have one yet)
❌ Not creating Stripe Checkout Session
❌ Not handling the two-step process (payment first, then account)
❌ Field name mismatches with frontend

### Database Issues:
✅ Schema is correct (Customers_v7, Items_v7, Actions_v7, Ops_v7)
❌ Missing Stripe webhook handler for post-payment account creation

---

## ✅ WHAT NEEDS TO BE FIXED

### 1. Frontend Changes (`/signup`):
```javascript
// Instead of calling /api/auth/register
// Should call /api/checkout/create-session
const response = await fetch('/api/checkout/create-session', {
  method: 'POST',
  body: JSON.stringify({
    full_name,
    email,
    phone,
    address,
    unit,
    city,
    state,
    zip,
    plan_tier,
    promo_code
  })
});

const { checkout_url } = await response.json();
window.location.href = checkout_url; // Redirect to Stripe
```

### 2. New Backend Route (`/api/checkout/create-session`):
- Validate form data
- Check promo code with Stripe
- Calculate setup fee
- Create Stripe Checkout Session
- Return checkout URL

### 3. New Webhook Handler (`/api/stripe/webhook`):
- Verify webhook signature
- Handle `checkout.session.completed`
- Create customer in Airtable
- Send welcome email
- Create ops task

### 4. Remove/Deprecate:
- Current `/api/auth/register` endpoint (it's doing too much too early)
- Any password field in signup form
- Direct account creation before payment

---

## 📊 DATA FLOW DIAGRAM

```
User Input → Validate → Stripe Session → Stripe Checkout
                                              ↓
                                         Payment Success
                                              ↓
Welcome Email ← Airtable Customer ← Webhook Handler
     ↓
Portal Access (with temp password)
     ↓
Set Real Password
     ↓
Full Access
```

---

## 🏆 SUCCESS CRITERIA

1. User can complete entire signup with full address
2. Promo code WAIVEDSETUP waives setup fee
3. Payment processed before account creation
4. Account created only after successful payment
5. User receives welcome email with access instructions
6. User can log in and set permanent password
7. Monthly billing doesn't start until first service

---

## 🚫 WHAT NOT TO DO

1. Don't ask for password during initial signup
2. Don't create account before payment
3. Don't start subscription billing at signup
4. Don't allow signups outside service area
5. Don't skip address collection (it's required for service!)

---

## 📝 ENVIRONMENT VARIABLES NEEDED

```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_SETUP_STARTER=price_xxx  # $99.50
STRIPE_PRICE_SETUP_MEDIUM=price_xxx   # $149.50
STRIPE_PRICE_SETUP_FAMILY=price_xxx   # $179.50
```

---

## 🔗 RELATED DOCUMENTATION

- `REGISTRATION_FLOW_PLAN.md` - Original flow design
- `SINGLE_SOURCE_OF_TRUTH.md` - Business facts
- `PHASE1_DATABASE_DESIGN.md` - Database structure
- `docs/stripe-coupon-setup-guide.md` - Promo codes

---

## ⚠️ TEMPORARY WORKAROUND

Until the proper Stripe Checkout flow is implemented, we could:
1. Collect all information including address
2. Create account with temporary password
3. Mark setup fee as "pending"
4. Send email to manually process payment
5. Add to Ops_v7 queue for follow-up

But this is NOT the intended flow and should be fixed ASAP.

---

**This document represents the reconciled, correct flow based on all available documentation.**