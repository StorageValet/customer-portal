# Storage Valet Schema Analysis & Recommendations

## Current Schema Problems (12+ Tables)

### Over-Engineered Tables:
- **Container Types**: Should be 3 hardcoded options
- **Facilities/Zones**: Premature optimization for multi-warehouse
- **Properties**: Not needed until 100+ customers
- **Notifications**: Can use email service directly
- **Waitlist/Leads**: Spreadsheet is fine for now
- **Sessions**: Should use Redis/memory, not Airtable

### Missing Critical Fields:
- No dimensions (L×W×H) on Containers table
- No weight tracking
- No cubic footage calculations
- No usage tracking against plan limits

---

## Recommended Simplified Schema (4 Tables Only)

### 1️⃣ **Customers Table**
```javascript
{
  // Keep these existing fields
  id: "rec_xxx",
  "First Name": "John",
  "Last Name": "Doe", 
  Email: "john@example.com",
  Phone: "201-555-0123",
  Password: "hashed_value",
  
  // Simplified address (one field)
  "Service Address": "123 Main St, Apt 4B, Hoboken, NJ 07030",
  "ZIP Code": "07030",  // For zone validation
  
  // Plan & Limits (CRITICAL for visual indicators)
  "Monthly Plan": "Starter|Medium|Family",  // $199/$299/$399
  "Plan Cubic Feet": 100|200|300,           // Plan limits (CONFIRMED)
  "Plan Insurance": 2000|3000|4000,         // Included insurance (CONFIRMED)
  
  // Current Usage (for visual progress bars)
  "Used Cubic Feet": 23.5,                  // Sum of all items
  "Used Insurance": 1250.00,                // Sum of declared values
  "Total Weight Lbs": 187.5,                // Sum of weights
  "Active Items Count": 7,                   // Count of items
  
  // Billing
  "Stripe Customer ID": "cus_xxx",
  "Stripe Subscription ID": "sub_xxx",
  "Setup Fee Paid": true,
  "Setup Fee Amount": 199.00,
  "Billing Start Date": "2025-08-20",       // Anniversary date
  "Subscription Status": "active",
  
  // Computed Visual Indicators (formulas)
  "Space Used %": 47,                       // (Used CF / Plan CF) * 100
  "Insurance Used %": 62.5,                 // (Used Ins / Plan Ins) * 100
  "Space Remaining": 26.5,                  // Plan CF - Used CF
  "Insurance Remaining": 750.00,            // Plan Ins - Used Ins
  
  // Timestamps
  "Created Date": "2025-08-15",
  "Last Activity": "2025-08-20"
}
```

### 2️⃣ **Items Table** (was "Containers")
```javascript
{
  // Identity
  id: "rec_xxx",
  "QR Code": "SV-2025-000001",
  Customer: ["rec_xxx"],                    // Link to Customers
  
  // Description
  "Item Name": "Winter Clothes Box",
  Description: "Coats, boots, scarves",
  Category: "Clothing",                     // Dropdown selection
  
  // CRITICAL NEW FIELDS
  "Length Inches": 24,
  "Width Inches": 18,
  "Height Inches": 12,
  "Cubic Feet": 3.0,                       // Auto-calculated: (L×W×H)/1728
  "Weight Lbs": 25,
  "Estimated Value": 500.00,               // For insurance
  
  // Container Info
  "Container Type": "Bin|Tote|Crate|Customer",
  "Is SV Container": true,                  // Our container or theirs
  
  // Photos (Dropbox URLs)
  "Photo URLs": "dropbox_url1,dropbox_url2",
  
  // Status & Location
  Status: "At Home|In Transit|In Storage",
  "Storage Location": "A1-23",              // Zone-Shelf for retrieval
  
  // Dates
  "Created Date": "2025-08-15",
  "Pickup Date": "2025-08-20",
  "Last Accessed": "2025-08-20"
}
```

### 3️⃣ **Movements Table**
```javascript
{
  // Identity
  id: "rec_xxx",
  Customer: ["rec_xxx"],
  
  // Movement Details
  Type: "Pickup|Delivery|Container Delivery",
  Status: "Scheduled|Completed|Cancelled",
  
  // Scheduling
  "Scheduled Date": "2025-08-25",
  "Time Window": "8AM-12PM|12PM-4PM|4PM-8PM",
  
  // Items & Capacity Planning
  Items: ["rec_xxx", "rec_xxx"],           // Linked items
  "Total Cubic Feet": 15.5,                // Sum of items
  "Total Weight": 125,                     // Sum of items
  "Item Count": 5,
  
  // Route Planning
  "Route Date": "2025-08-25",
  "Route ID": "2025-08-25-AM",
  "Stop Number": 3,
  
  // Service Details
  "Service Address": "123 Main St, Apt 4B, Hoboken, NJ 07030",
  "Special Instructions": "Call when arriving",
  
  // Completion
  "Completed At": "2025-08-25T10:30:00Z",
  "Driver Notes": "All items collected",
  
  // Billing Impact
  "Triggers Billing": true,                // First movement flag
  
  // Timestamps
  "Created Date": "2025-08-20"
}
```

### 4️⃣ **Operations Table** (Simple queue for Zach)
```javascript
{
  id: "rec_xxx",
  Type: "New Setup Fee|First Pickup Pending|Movement Today|Payment Failed",
  Customer: ["rec_xxx"],
  
  Priority: "High|Normal|Low",
  "Action Required": "Call to schedule first pickup",
  "Due Date": "2025-08-18",
  
  Status: "Pending|Complete",
  Notes: "Customer prefers morning",
  
  "Created Date": "2025-08-15"
}
```

---

## Visual Indicators Formula Examples

### Space Usage Bar:
```javascript
// In Customers table
"Space Used %" = (Used Cubic Feet / Plan Cubic Feet) * 100

// Color coding in UI:
if (percentage < 70) return "green"
if (percentage < 90) return "yellow"  
return "red"  // Time to upsell!
```

### Insurance Usage Bar:
```javascript
// In Customers table
"Insurance Used %" = (Used Insurance / Plan Insurance) * 100

// Show additional insurance cost:
if (Used Insurance > Plan Insurance) {
  const excess = Used Insurance - Plan Insurance
  const additionalCost = (excess / 1000) * 24  // $24 per $1k
  return `+$${additionalCost}/month for extra coverage`
}
```

### Upsell Prompts:
```javascript
// When space > 80%
"You're using 42 of 50 cubic feet. Upgrade to Medium for just $100 more!"

// When insurance > 90%
"Your items are worth $4,500 of $5,000 covered. Add insurance for $24/month per $1,000"
```

---

## Migration Path

### Phase 1: Core Tables (Week 1)
1. Migrate Customers → Customers (simplified)
2. Migrate Containers → Items (with dimensions)
3. Keep Movements as-is (already good)
4. Create Operations queue

### Phase 2: Remove Unnecessary (Week 2)
1. Delete Container Types table (hardcode)
2. Delete Facilities/Zones (single warehouse)
3. Delete Properties (not needed yet)
4. Move Sessions to Redis

### Phase 3: Add Calculations (Week 2)
1. Add formulas for usage percentages
2. Add rollup fields for totals
3. Add visual indicator fields

---

## Benefits of This Approach

### For Customer Experience:
- ✅ Clear visual of space/insurance usage
- ✅ Natural upsell prompts
- ✅ Simple, intuitive interface

### For Operations:
- ✅ Know exactly what fits in truck
- ✅ Simple queue to work through
- ✅ No complex computed fields breaking

### For Scale:
- ✅ Every cubic foot tracked
- ✅ Rich data for future ML
- ✅ Clean foundation to build on

### For Development:
- ✅ 4 tables instead of 12+
- ✅ Clear field mappings
- ✅ Easy to debug

---

## Next Steps

1. **Confirm dimensions are captured** in item creation flow
2. **Add visual progress bars** to dashboard
3. **Implement upsell prompts** at 80% usage
4. **Create migration script** for existing data