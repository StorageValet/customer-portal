# Airtable Schema Relationship Diagram

## Table Relationships

```
┌─────────────────────┐
│    CUSTOMERS        │
├─────────────────────┤
│ Customer ID (PK)    │──────┐
│ Building/Property   │──┐   │
│ Referrer Customer   │──┼─┐ │
└─────────────────────┘  │ │ │
                         │ │ │
┌─────────────────────┐  │ │ │   ┌─────────────────────┐
│    PROPERTIES       │◄─┘ │ │   │    REFERRALS        │
├─────────────────────┤    │ │   ├─────────────────────┤
│ Property ID (PK)    │    │ │   │ Referral ID (PK)    │
│ Promo Code          │──┐ │ └──►│ Referrer            │
└─────────────────────┘  │ │     │ Referred Customer   │◄─┐
                         │ │     └─────────────────────┘  │
┌─────────────────────┐  │ │                              │
│    PROMO CODES      │◄─┘ │     ┌─────────────────────┐  │
├─────────────────────┤    │     │    CONTAINERS       │  │
│ Code (PK)           │    │     ├─────────────────────┤  │
│ Associated Building │────┘     │ QR String (PK)      │  │
└─────────────────────┘          │ Customer            │──┼──┐
                                 │ Container Type      │──┐  │
┌─────────────────────┐          │ Current Location    │  │  │
│    MOVEMENTS        │          │ Facility            │──┼─┐│
├─────────────────────┤          └─────────────────────┘  │ ││
│ Movement ID (PK)    │                     ▲              │ ││
│ Customers           │─────────────────────┼──────────────┼─┘│
│ Containers          │─────────────────────┘              │  │
│ Notifications       │──┐                                 │  │
└─────────────────────┘  │  ┌─────────────────────┐       │  │
                         │  │  CONTAINER TYPES    │◄──────┘  │
┌─────────────────────┐  │  ├─────────────────────┤          │
│   NOTIFICATIONS     │◄─┘  │ Type ID (PK)        │          │
├─────────────────────┤     └─────────────────────┘          │
│ Notification ID (PK)│                                       │
│ Customer            │───────────────────────────────────────┘
│ Related Movement    │──┐   ┌─────────────────────┐
│ Related Container   │──┼──►│    FACILITIES       │
└─────────────────────┘  │   ├─────────────────────┤
                         │   │ Facility ID (PK)    │◄─────────┐
                         │   │ Zones               │──┐       │
                         │   └─────────────────────┘  │       │
                         │                            │       │
                         │   ┌─────────────────────┐  │       │
                         └──►│    ZONES            │◄─┘       │
                             ├─────────────────────┤          │
                             │ Zone ID (PK)        │          │
                             │ Facility            │──────────┘
                             │ Containers          │
                             └─────────────────────┘

┌─────────────────────┐
│    WAITLIST         │ (Standalone - converts to Customers)
├─────────────────────┤
│ Waitlist ID (PK)    │
│ Email               │
│ Referral Code Used  │
└─────────────────────┘
```

## Relationship Summary

### Primary Relationships (Currently Implemented)

1. **Customers ↔ Containers**: One-to-many (one customer has many items)
2. **Customers ↔ Movements**: Many-to-many (through Customers field)
3. **Containers ↔ Movements**: Many-to-many (through Containers field)

### Missing Relationships (Need Implementation)

1. **Customers → Properties**: Many-to-one (customers belong to buildings)
2. **Customers → Referrals**: One-to-many (as referrer and referred)
3. **Containers → Container Types**: Many-to-one (classification)
4. **Containers → Facilities → Zones**: Location hierarchy
5. **Properties → Promo Codes**: Partnership-specific promotions
6. **Movements → Notifications**: One-to-many (movement updates)
7. **All Tables → Notifications**: Polymorphic relationships

## Data Flow Examples

### Customer Signup Flow

```
Waitlist Entry → Customer Creation → Property Assignment → Referral Tracking
                                  ↓
                            Promo Code Application
```

### Item Storage Flow

```
Customer → Create Container → Assign Container Type → Schedule Movement
                           ↓                      ↓
                    Assign QR Code          Create Notification
                                                 ↓
                                          Execute Movement
                                                 ↓
                                          Update Location (Facility/Zone)
```

### Referral Flow

```
Customer A (Referrer) → Generates Referral Code
                     ↓
              Customer B Uses Code
                     ↓
              Referral Record Created
                     ↓
        Track Conversion & Apply Rewards
```

## Implementation Priority

### Critical Path (Must Have)

1. Container Types - Required for pricing
2. Facilities/Zones - Required for inventory tracking
3. Properties - Required for B2B model

### Growth Features (Should Have)

1. Referrals - Customer acquisition
2. Promo Codes - Marketing campaigns
3. Notifications - Customer communication

### Nice to Have

1. Waitlist - Lead management
2. Advanced container fields (fragile, stackable, etc.)
3. Approval workflows

## Key Insights

1. **Denormalization**: Airtable includes denormalized fields (e.g., Customer First Name in Containers) for easier reporting
2. **Linked Records**: Heavy use of linked record fields for relationships
3. **Calculated Fields**: Some fields are formulas (e.g., Full Name, Container Count)
4. **Status Tracking**: Multiple status fields across tables for workflow management
5. **Audit Trail**: Created dates and modification tracking throughout
