# Storage Valet Phase 1 Database Design
## Strategic Data Architecture for Scale

---

## Executive Summary

This database design balances immediate operational needs with long-term data strategy. Every field serves either current operations OR future optimization potential. No field is arbitrary.

---

## Core Business Logic

### The Unit Economics Foundation
- **We pay**: ~$2-3 per cubic foot (wholesale storage)
- **We charge**: ~$20-30 per cubic foot (via subscription model)
- **Multiple**: 8-12x space arbitrage
- **Critical Success Factor**: Precise space utilization tracking

### Why Dimensions & Weight Matter NOW
1. **Today**: Can this pickup fit in tomorrow's truck route?
2. **Next Month**: Which warehouse zone optimizes access patterns?
3. **Next Year**: Can we predict seasonal volume fluctuations?
4. **Future**: Which items are compatible with robotic retrieval?

---

## Phase 1 Schema (Simplified but Data-Rich)

### Table 1: Customers
```javascript
{
  // Identity
  id: "rec_xxx",                    // Airtable ID
  email: "customer@email.com",      // Unique identifier
  password_hash: "bcrypt_hash",     
  first_name: "John",
  last_name: "Doe",
  phone: "201-555-0123",
  
  // Single Address (Phase 1 constraint)
  address: {
    street: "123 Main St, Apt 4B",
    city: "Hoboken",
    state: "NJ",
    zip: "07030"                    // Must be in approved 15 zips
  },
  
  // Subscription
  plan: "Starter|Medium|Family",    // $199/$299/$399
  plan_cubic_feet: 50|100|200,      // Plan allowances
  
  // Billing
  stripe_customer_id: "cus_xxx",
  stripe_payment_method_id: "pm_xxx",
  setup_fee_paid: true,
  setup_fee_amount: 199.00,
  setup_fee_date: "2025-08-15",
  subscription_status: "none|active|paused|cancelled",
  subscription_id: "sub_xxx",        // Stripe subscription
  billing_start_date: "2025-08-20",  // Anniversary date
  next_billing_date: "2025-09-20",
  
  // Metrics
  total_items_stored: 0,
  total_cubic_feet_used: 0.0,       // Running total
  total_weight_lbs: 0.0,            // Running total
  total_declared_value: 0.0,        // For insurance
  
  // Timestamps
  created_at: "2025-08-15T10:00:00Z",
  updated_at: "2025-08-15T10:00:00Z"
}
```

### Table 2: Items
```javascript
{
  // Identity
  id: "rec_xxx",                    // Airtable ID
  customer_id: "rec_xxx",           // Link to Customers
  qr_code: "SV-2025-08-000001",     // Unique, scannable
  
  // Description
  name: "Winter Clothes Box",
  description: "Coats, boots, scarves",
  category: "Clothing|Documents|Electronics|Furniture|Seasonal|Other",
  
  // CRITICAL: Dimensions & Weight
  length_inches: 24,
  width_inches: 18,
  height_inches: 12,
  cubic_feet: 3.0,                  // Auto-calculated: (L×W×H)/1728
  weight_lbs: 25,
  
  // CRITICAL: Value (Insurance)
  estimated_value: 500.00,           // Customer declared
  
  // Container Type (if using SV container)
  container_type: "Bin|Tote|Crate|Customer",
  container_id: "SV-BIN-0001",       // If ours
  
  // Photos
  photo_urls: ["dropbox_url_1", "dropbox_url_2"],
  
  // Location & Status
  location: "customer|transit|warehouse",
  warehouse_zone: "A1",              // For retrieval optimization
  status: "active|pending_pickup|pending_delivery|delivered",
  
  // Timestamps
  created_at: "2025-08-15T10:00:00Z",
  last_accessed: "2025-08-15T10:00:00Z",
  pickup_date: "2025-08-20",
  stored_since: "2025-08-20"
}
```

### Table 3: Movements
```javascript
{
  // Identity
  id: "rec_xxx",
  customer_id: "rec_xxx",
  
  // Movement Details
  type: "pickup|delivery|container_delivery",
  status: "scheduled|in_transit|completed|cancelled",
  
  // Scheduling
  scheduled_date: "2025-08-25",
  time_window: "8AM-12PM|12PM-4PM|4PM-8PM",
  
  // Items (Critical for capacity planning)
  item_ids: ["rec_xxx", "rec_xxx"],
  total_cubic_feet: 15.5,           // Sum of items
  total_weight_lbs: 125,             // Sum of items
  
  // Routing (Phase 2 will expand this)
  route_id: "ROUTE-2025-08-25-AM",
  stop_number: 3,                   // Order in route
  
  // Instructions
  special_instructions: "Please call when arriving",
  access_notes: "Buzzer 4B",
  
  // Completion
  completed_at: "2025-08-25T10:30:00Z",
  completed_by: "Driver Name",
  completion_notes: "All items collected",
  completion_photos: ["url1", "url2"],
  
  // Billing Impact
  triggers_billing: true,            // First movement flag
  
  // Timestamps
  created_at: "2025-08-20T10:00:00Z",
  updated_at: "2025-08-25T10:30:00Z"
}
```

### Table 4: Operations_Queue
```javascript
{
  // Simple ops visibility
  id: "rec_xxx",
  type: "new_setup_fee|pending_first_pickup|upcoming_movement|failed_payment",
  customer_id: "rec_xxx",
  movement_id: "rec_xxx",           // If applicable
  
  priority: "urgent|high|normal|low",
  action_required: "Call customer to schedule first pickup",
  due_date: "2025-08-18",
  
  status: "pending|in_progress|completed|skipped",
  assigned_to: "Zach",
  
  notes: "Customer prefers morning slots",
  
  created_at: "2025-08-15T10:00:00Z",
  completed_at: null
}
```

---

## Data Validation Rules

### Critical Validations
1. **Zip Code**: Must be in approved 15 zips
2. **Cubic Feet**: Must calculate correctly from dimensions
3. **Plan Limits**: Warn (don't block) when exceeding plan cubic feet
4. **Weight Limits**: Flag items >50lbs for two-person carry
5. **Value Limits**: Flag items >$2000 for special handling

### Route Capacity Constraints
- Standard truck capacity: 500 cubic feet
- Weight limit: 3,000 lbs
- Stop time allocation: 30 minutes per stop
- Route window: 4 hours max

---

## What We're NOT Storing (Yet)

### Defer to Phase 2:
- Individual container tracking beyond items
- Multiple addresses per customer
- Complex routing algorithms
- Predictive analytics
- Seasonal patterns
- Multi-warehouse inventory

### Let External Systems Handle:
- Payment details (Stripe)
- Email templates (SendGrid)
- Complex scheduling logic (keep simple for now)

---

## Migration Strategy

### From Current Complex Schema:
1. Export existing Customers, Items, Movements
2. Map fields to new simplified structure
3. Calculate missing dimensions from descriptions where possible
4. Set default weights based on category
5. Preserve all customer IDs for continuity

### Data Cleanup:
- Remove computed fields
- Consolidate duplicate customer records
- Fix timezone inconsistencies
- Standardize address formats

---

## Why This Design Wins

### For Operations (Today):
- Clear what fits in tomorrow's truck
- Simple ops queue to work through
- No complex computed fields to break

### For Scale (Tomorrow):
- Every cubic foot tracked
- Route optimization possible
- Warehouse zones ready

### For Investment (Future):
- Rich dataset for ML models
- Autonomous delivery compatibility
- Robotics-ready item profiles

---

## Implementation Priority

1. **Week 1**: Migrate Customers table
2. **Week 1**: Migrate Items with dimensions
3. **Week 2**: Implement Movements with capacity tracking
4. **Week 2**: Build simple Ops Queue view

---

## Success Metrics

### Phase 1 (20 customers):
- 100% of items have dimensions
- 100% of movements fit in assigned trucks
- Zero double-billing incidents
- <5 minute ops queue review time

### Phase 2 (100 customers):
- Automatic route optimization
- Predictive capacity planning
- Warehouse zone optimization
- 15% reduction in cost per delivery

---

*This design is deliberately simple where it can be, and deliberately rich where data matters for the future.*