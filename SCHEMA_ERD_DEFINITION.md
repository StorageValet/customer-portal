# Storage Valet Database Schema - ERD Definition
## For Visual Diagramming Tools (dbdiagram.io, Lucidchart, etc.)

---

## Schema in DBML Format (for dbdiagram.io)

```dbml
// Storage Valet Phase 1 Schema
// 4 Tables Only - Simplified for Launch

Table customers {
  id varchar [pk, note: 'Airtable Record ID']
  email varchar [unique, not null]
  password_hash varchar [not null]
  first_name varchar [not null]
  last_name varchar [not null]
  phone varchar
  service_address text [not null]
  zip_code varchar [not null, note: 'Must be in 13 approved ZIPs']
  
  // Plan & Limits
  monthly_plan enum('Starter', 'Medium', 'Family') [not null]
  plan_cubic_feet int [not null, note: '100, 200, or 300']
  plan_insurance decimal [not null, note: '2000, 3000, or 4000']
  
  // Current Usage (for visual indicators)
  used_cubic_feet decimal [default: 0]
  used_insurance decimal [default: 0]
  total_weight_lbs decimal [default: 0]
  active_items_count int [default: 0]
  
  // Stripe Integration (NO custom promo system!)
  stripe_customer_id varchar [note: 'Stripe Customer ID']
  stripe_subscription_id varchar [note: 'Stripe Subscription ID']
  stripe_payment_method_id varchar [note: 'Stripe Payment Method']
  setup_fee_paid boolean [default: false]
  setup_fee_amount decimal
  setup_fee_waived_by varchar [note: 'Stripe Coupon Code Used']
  billing_start_date date [note: 'Anniversary billing date']
  subscription_status enum('none', 'active', 'paused', 'cancelled')
  
  // Timestamps
  created_at timestamp [not null]
  updated_at timestamp [not null]
  last_activity timestamp
}

Table items {
  id varchar [pk, note: 'Airtable Record ID']
  customer_id varchar [not null, ref: > customers.id]
  qr_code varchar [unique, not null, note: 'SV-2025-000001 format']
  
  // Description
  item_name varchar [not null]
  description text
  category enum('Clothing', 'Documents', 'Electronics', 'Furniture', 'Seasonal', 'Books', 'Sports', 'Other')
  
  // CRITICAL: Dimensions for space tracking
  length_inches decimal [not null]
  width_inches decimal [not null]
  height_inches decimal [not null]
  cubic_feet decimal [not null, note: 'Auto-calc: (L*W*H)/1728']
  weight_lbs decimal [not null]
  estimated_value decimal [not null, note: 'For insurance']
  
  // Container Info
  container_type enum('Bin', 'Tote', 'Crate', 'Customer') [not null]
  is_sv_container boolean [default: true]
  
  // Photos (Dropbox)
  photo_urls text [note: 'Comma-separated Dropbox URLs']
  
  // Status & Location
  status enum('At Home', 'In Transit', 'In Storage') [not null]
  storage_location varchar [note: 'Zone-Shelf for retrieval']
  
  // Timestamps
  created_at timestamp [not null]
  pickup_date date
  last_accessed timestamp
}

Table movements {
  id varchar [pk, note: 'Airtable Record ID']
  customer_id varchar [not null, ref: > customers.id]
  
  // Movement Details
  type enum('Pickup', 'Delivery', 'Container Delivery') [not null]
  status enum('Scheduled', 'In Progress', 'Completed', 'Cancelled') [not null]
  
  // Scheduling
  scheduled_date date [not null]
  time_window enum('8AM-12PM', '12PM-4PM', '4PM-8PM') [not null]
  
  // Items & Capacity (CRITICAL for route planning)
  item_ids text [note: 'JSON array of item IDs']
  total_cubic_feet decimal [not null, note: 'Sum of items']
  total_weight_lbs decimal [not null, note: 'Sum of items']
  item_count int [not null]
  
  // Route Planning
  route_id varchar [note: 'ROUTE-2025-08-25-AM format']
  stop_number int [note: 'Order in route']
  
  // Service Details  
  service_address text [not null]
  special_instructions text
  
  // Completion
  completed_at timestamp
  driver_notes text
  
  // Billing Impact
  triggers_billing boolean [default: false, note: 'First movement flag']
  
  // Timestamps
  created_at timestamp [not null]
  updated_at timestamp
}

Table operations_queue {
  id varchar [pk]
  type enum('New Setup Fee', 'First Pickup Pending', 'Movement Today', 'Payment Failed') [not null]
  customer_id varchar [ref: > customers.id]
  movement_id varchar [ref: > movements.id]
  
  priority enum('Urgent', 'High', 'Normal', 'Low') [not null]
  action_required text [not null]
  due_date date
  
  status enum('Pending', 'In Progress', 'Complete', 'Skipped') [not null]
  assigned_to varchar
  notes text
  
  created_at timestamp [not null]
  completed_at timestamp
}

// Relationships
Ref: items.customer_id > customers.id [delete: cascade]
Ref: movements.customer_id > customers.id [delete: restrict]
Ref: operations_queue.customer_id > customers.id [delete: cascade]
Ref: operations_queue.movement_id > movements.id [delete: cascade]
```

---

## 🎯 Promo Code Strategy (STRIPE ONLY!)

### ✅ What We're KEEPING:
```javascript
// In customers table
setup_fee_waived_by: "STRIPE_COUPON_CODE"  // Tracks which Stripe coupon was used

// Stripe handles:
- Coupon creation (% off, $ off, free setup)
- Validation
- Usage tracking
- Expiration
- Single-use vs multi-use
- Customer restrictions
```

### ❌ What We're REMOVING:
```javascript
// DELETE this entire table from Airtable:
"Promo Codes" table  // Redundant!

// Remove these fields from anywhere:
- Custom discount calculations
- In-house promo validation
- Manual setup fee waivers
```

### How Promo Codes Work (Stripe):
1. **Create in Stripe Dashboard**:
   - `LAUNCH50` - 50% off setup fee
   - `FRIENDSANDFAMILY` - Free setup fee
   - `BUILDINGNAME` - Partner building codes

2. **Customer Uses at Signup**:
   ```javascript
   // Frontend
   const { valid, discount } = await validateStripeCoupon(promoCode);
   
   // Backend (already implemented!)
   const coupon = await stripe.coupons.retrieve(code);
   ```

3. **Track in Our Database**:
   ```javascript
   // Just store which coupon was used
   customer.setup_fee_waived_by = "LAUNCH50"
   ```

---

## 📊 Visual ERD Summary

```
┌─────────────┐      ┌─────────────┐
│  CUSTOMERS  │      │    ITEMS    │
├─────────────┤      ├─────────────┤
│ id (PK)     │←─────┤customer_id  │
│ email       │      │ qr_code     │
│ stripe_ids  │      │ dimensions  │
│ plan_limits │      │ value       │
│ usage_stats │      │ status      │
└─────────────┘      └─────────────┘
       │                     
       │                    
       ▼                    
┌─────────────┐      ┌─────────────┐
│  MOVEMENTS  │      │ OPERATIONS  │
├─────────────┤      ├─────────────┤
│ customer_id │      │ customer_id │
│ item_ids    │      │ movement_id │
│ schedule    │      │ priority    │
│ capacity    │      │ action      │
└─────────────┘      └─────────────┘
```

---

## ✅ Critical Fields Confirmed Present:

1. **Cubic Feet Tracking** ✓ (for operations, not shown to customers)
2. **Weight Tracking** ✓ (for route capacity)
3. **Insurance Values** ✓ (for coverage limits)
4. **Stripe Integration** ✓ (customer, subscription, payment method)
5. **Promo Tracking** ✓ (via setup_fee_waived_by field)
6. **Visual Indicator Data** ✓ (used vs plan limits)

---

## 🚫 Tables We're NOT Creating:

- ❌ Promo Codes (Stripe handles this)
- ❌ Sessions (use Redis/in-memory)
- ❌ Container Types (hardcode 3 types)
- ❌ Facilities/Zones (single warehouse)
- ❌ Properties (not needed yet)
- ❌ Waitlist/Leads (use spreadsheet)
- ❌ Payments (Stripe is source of truth)

---

## Migration Notes:

1. **Export existing Customers, Items, Movements**
2. **Map fields to new structure**
3. **DELETE the Promo Codes table**
4. **Move all promo logic to Stripe**
5. **Calculate cubic feet from existing dimensions**

---

*This schema is optimized for:*
- **Simplicity**: 4 tables instead of 12+
- **Reliability**: No computed fields to break
- **Scalability**: Can handle 100+ customers
- **Integration**: Stripe handles complex billing

*Copy the DBML section into dbdiagram.io to visualize*