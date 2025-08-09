# Airtable Schema Documentation & Migration Strategy

## Current Implementation vs Production Schema

### Overview

The current implementation uses a simplified 3-table schema while the production Airtable base contains 11 tables. This document outlines the gaps and provides a migration strategy.

## Current Implementation (3 Tables)

### 1. Customers (Users in code)

**Implemented Fields:**

- Customer ID (id)
- Email
- Password (passwordHash)
- First Name
- Last Name
- Phone
- Full Address (combined from address fields)
- Monthly Plan
- Setup Fee Paid
- Total Insured Value (insuranceCoverage)
- Referral Code
- Stripe Customer ID
- Stripe Subscription ID
- Account Created Date (createdAt)

**Missing Fields:**

- Building/Property relationship
- Billing Mode
- Referred By / Referrer Customer
- Acquisition Source
- Account Status
- First Pickup Date (partially implemented)
- Subscription Start Date
- Insurance Tier
- Agreement Signed/Date
- Container Delivery Preference/Status
- À la Carte Selections
- Last sign-in

### 2. Containers (Items in code)

**Implemented Fields:**

- Container ID (id)
- Customer (userId)
- Item Name/Label (name)
- Description
- Category Tags (category)
- Additional Photos (photoUrls)
- Estimated Value
- Current Status (status)
- Current Location (facility)
- Last Movement Date (lastScannedAt)
- Created Date (createdAt)
- QR String (qrCode)

**Missing Fields:**

- QR Code (physical ID)
- Customer denormalized fields (First Name, Last Name, Email)
- Container Type relationship
- Primary Photo (separate from Additional Photos)
- Photo Required flag
- Fragile flag
- Storage Start Date
- Access Frequency Score
- Stackable flag
- Special Instructions
- Facility relationship
- Specialty Item fields
- Approval workflow fields

### 3. Movements

**Implemented Fields:**

- Movement ID (id)
- Customers (userId)
- Movement Type (type)
- Status
- Requested Date (scheduledDate)
- Time Window (scheduledTimeSlot)
- Containers (itemIds)
- Service Address (address)
- Special Instructions

**Missing Fields:**

- Container Count
- Empty Containers Requested
- Driver/Team assignment
- Confirmed Date/Time
- Started At / Completed At
- Driver Notes
- Photos
- Grouping ID
- Notifications relationship

## Missing Tables (8 Tables)

### 4. Container Types

- Defines available container types and pricing
- Referenced by Containers table
- Critical for pricing calculations

### 5. Facilities

- Storage facility information
- Referenced by Containers for location tracking
- Critical for inventory management

### 6. Zones

- Sub-divisions within facilities
- Critical for precise location tracking
- Capacity management

### 7. Properties

- Building/property partnerships
- Referenced by Customers
- Important for B2B relationships

### 8. Promo Codes

- Marketing and discount management
- Used for customer acquisition
- Important for pricing

### 9. Referrals

- Tracks referral relationships
- Critical for referral program
- Links to Customers table

### 10. Notifications

- Communication tracking
- Related to Movements and Containers
- Important for customer communication

### 11. Waitlist

- Pre-customer management
- Lead tracking
- Marketing funnel

## Migration Strategy

### Phase 1: Critical Business Operations (Current)

✅ **Completed**: Basic customer, item, and movement tracking

### Phase 2: Enhanced Operations (High Priority)

1. **Container Types Integration**
   - Add container type field to items
   - Implement pricing logic based on container types
   - Update UI to show container type selection

2. **Facilities & Zones**
   - Add facility management to admin panel
   - Update item location tracking to use zones
   - Implement capacity tracking

3. **Properties Integration**
   - Add property field to customer registration
   - Implement B2B partner dashboard
   - Add property-based reporting

### Phase 3: Marketing & Growth (Medium Priority)

1. **Promo Codes**
   - Implement promo code validation
   - Add to signup and checkout flows
   - Create admin management interface

2. **Referrals Table**
   - Implement full referral tracking
   - Add referral dashboard for customers
   - Automate reward distribution

3. **Waitlist Management**
   - Create public waitlist form
   - Add admin interface for lead management
   - Implement conversion tracking

### Phase 4: Advanced Features (Low Priority)

1. **Notifications System**
   - Implement notification queue
   - Add email/SMS templates
   - Create notification preferences

2. **Advanced Inventory Features**
   - Access frequency scoring
   - Approval workflows
   - Specialty item handling

## Implementation Approach

### 1. Extend Storage Interface

```typescript
// Add new methods to IStorage interface
interface IStorage {
  // Existing methods...

  // Container Types
  getContainerTypes(): Promise<ContainerType[]>;
  getContainerType(id: string): Promise<ContainerType | undefined>;

  // Facilities
  getFacilities(): Promise<Facility[]>;
  getFacility(id: string): Promise<Facility | undefined>;
  getZonesByFacility(facilityId: string): Promise<Zone[]>;

  // Properties
  getProperties(): Promise<Property[]>;
  getProperty(id: string): Promise<Property | undefined>;

  // Promo Codes
  validatePromoCode(code: string): Promise<PromoCode | undefined>;
  applyPromoCode(userId: string, code: string): Promise<void>;

  // Referrals
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralsByUser(userId: string): Promise<Referral[]>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;

  // Waitlist
  addToWaitlist(entry: InsertWaitlistEntry): Promise<WaitlistEntry>;
  getWaitlistEntries(): Promise<WaitlistEntry[]>;
}
```

### 2. Update Schema Types

```typescript
// Add new types to shared/schema.ts
export interface ContainerType {
  id: string;
  typeName: string;
  category: string;
  dimensions: string;
  volumeCubicFt: number;
  maxWeightLbs: number;
  price: number;
  active: boolean;
}

export interface Facility {
  id: string;
  facilityName: string;
  facilityType: string;
  address: string;
  totalSqFt: number;
  activeStatus: boolean;
  zones: string[]; // Zone IDs
}

// ... additional types for other tables
```

### 3. Database Field Mapping

```typescript
// Extend field mappings in storage.ts
private containerTypeFieldToAirtable = {
  typeName: 'Type Name',
  category: 'Category',
  dimensions: 'Dimensions',
  volumeCubicFt: 'Volume (cubic ft)',
  maxWeightLbs: 'Max Weight (lbs)',
  price: 'A la Carte Price',
  active: 'Active'
};

// ... additional mappings for other tables
```

### 4. API Endpoints

```typescript
// Add new routes in server/routes.ts
app.get("/api/container-types", async (req, res) => {
  const types = await storage.getContainerTypes();
  res.json(types);
});

app.get("/api/facilities", async (req, res) => {
  const facilities = await storage.getFacilities();
  res.json(facilities);
});

// ... additional endpoints
```

## Testing Strategy

### 1. Schema Validation Tests

- Verify all field mappings work correctly
- Test data type conversions
- Validate relationships between tables

### 2. Integration Tests

- Test API endpoints with real Airtable data
- Verify data consistency across related tables
- Test error handling for missing relationships

### 3. Migration Tests

- Create test scripts to validate data integrity
- Test rollback procedures
- Verify no data loss during migration

## Risks & Mitigation

### 1. Data Consistency

**Risk**: Mismatched data between simplified and full schema
**Mitigation**: Implement validation layer to ensure data integrity

### 2. Performance Impact

**Risk**: Additional API calls to Airtable may slow down operations
**Mitigation**: Implement caching layer for reference data (facilities, container types)

### 3. Breaking Changes

**Risk**: Schema changes may break existing functionality
**Mitigation**: Use feature flags to gradually roll out new tables

## Timeline Estimate

- **Phase 2**: 2-3 weeks (Container Types, Facilities, Properties)
- **Phase 3**: 2-3 weeks (Promo Codes, Referrals, Waitlist)
- **Phase 4**: 3-4 weeks (Notifications, Advanced Features)

**Total**: 7-10 weeks for complete schema implementation

## Next Steps

1. **Immediate**: Document any custom fields or business logic not captured in schema
2. **Week 1**: Implement Container Types integration
3. **Week 2**: Add Facilities and Zones support
4. **Week 3**: Implement Properties integration
5. **Ongoing**: Add comprehensive tests for each new table

## Notes for Developers

1. **Always check field mappings** when adding new Airtable operations
2. **Use TypeScript interfaces** for all new table types
3. **Add proper error handling** for missing relationships
4. **Document any deviations** from the production schema
5. **Test with production-like data** before deployment
