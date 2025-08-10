# Airtable Schema Implementation Plan
## CAREFUL Step-by-Step Field Definitions

---

## 📋 Table 1: Customers

### Fields to Create:
| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| Customer ID | Autonumber | Yes | Primary key |
| Email | Email | Yes | Unique identifier |
| Password Hash | Long Text | Yes | Bcrypt hash |
| First Name | Single Line Text | Yes | |
| Last Name | Single Line Text | Yes | |
| Phone | Phone | No | |
| Service Address | Long Text | Yes | Full address |
| ZIP Code | Single Line Text | Yes | Must validate against 13 zips |
| Monthly Plan | Single Select | Yes | Options: Starter, Medium, Family |
| Plan Cubic Feet | Number | Yes | 100, 200, or 300 |
| Plan Insurance | Currency | Yes | $2000, $3000, or $4000 |
| Used Cubic Feet | Number | No | Default: 0, Decimal |
| Used Insurance | Currency | No | Default: $0 |
| Total Weight Lbs | Number | No | Default: 0, Decimal |
| Active Items Count | Number | No | Default: 0, Integer |
| Stripe Customer ID | Single Line Text | No | cus_xxx |
| Stripe Subscription ID | Single Line Text | No | sub_xxx |
| Stripe Payment Method | Single Line Text | No | pm_xxx |
| Setup Fee Paid | Checkbox | Yes | Default: false |
| Setup Fee Amount | Currency | No | $99.50, $149.50, or $179.50 |
| Setup Fee Waived By | Single Line Text | No | Stripe coupon code used |
| Billing Start Date | Date | No | Anniversary date |
| Subscription Status | Single Select | Yes | Options: none, active, paused, cancelled |
| Created Date | Created Time | Yes | Auto |
| Updated Date | Last Modified | Yes | Auto |

---

## 📦 Table 2: Items

### Fields to Create:
| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| Item ID | Autonumber | Yes | Primary key |
| Customer | Link to Customers | Yes | Single link |
| QR Code | Single Line Text | Yes | SV-2025-000001 format |
| Item Name | Single Line Text | Yes | |
| Description | Long Text | No | |
| Category | Single Select | No | Options: Clothing, Documents, Electronics, Furniture, Seasonal, Books, Sports, Other |
| Length Inches | Number | Yes | Decimal |
| Width Inches | Number | Yes | Decimal |
| Height Inches | Number | Yes | Decimal |
| Cubic Feet | Formula | Auto | (Length * Width * Height) / 1728 |
| Weight Lbs | Number | Yes | Decimal |
| Estimated Value | Currency | Yes | For insurance |
| Container Type | Single Select | Yes | Options: Bin, Tote, Crate, Customer |
| Is SV Container | Checkbox | Yes | Default: true |
| Photo URLs | Long Text | No | Comma-separated Dropbox URLs |
| Status | Single Select | Yes | Options: At Home, In Transit, In Storage |
| Storage Location | Single Line Text | No | Zone-Shelf identifier |
| Created Date | Created Time | Yes | Auto |
| Pickup Date | Date | No | |
| Last Accessed | Date | No | |

---

## 🚚 Table 3: Actions (formerly Movements)

### Fields to Create:
| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| Action ID | Autonumber | Yes | Primary key |
| Customer | Link to Customers | Yes | Single link |
| Type | Single Select | Yes | Options: Pickup, Delivery, Container Delivery |
| Status | Single Select | Yes | Options: Scheduled, In Progress, Completed, Cancelled |
| Scheduled Date | Date | Yes | |
| Time Window | Single Select | Yes | Options: 8AM-12PM, 12PM-4PM, 4PM-8PM |
| Items | Link to Items | No | Multiple links allowed |
| Total Cubic Feet | Number | Yes | Sum of items, Decimal |
| Total Weight | Number | Yes | Sum of items, Decimal |
| Item Count | Number | Yes | Integer |
| Route ID | Single Line Text | No | ROUTE-2025-08-25-AM format |
| Stop Number | Number | No | Order in route |
| Service Address | Long Text | Yes | |
| Special Instructions | Long Text | No | |
| Completed At | Date/Time | No | |
| Driver Notes | Long Text | No | |
| Triggers Billing | Checkbox | No | First action flag |
| Created Date | Created Time | Yes | Auto |

---

## 📋 Table 4: Operations

### Fields to Create:
| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| Operation ID | Autonumber | Yes | Primary key |
| Type | Single Select | Yes | Options: New Setup Fee, First Pickup Pending, Action Today, Payment Failed |
| Customer | Link to Customers | No | Single link |
| Action | Link to Actions | No | Single link |
| Priority | Single Select | Yes | Options: Urgent, High, Normal, Low |
| Action Required | Long Text | Yes | |
| Due Date | Date | No | |
| Status | Single Select | Yes | Options: Pending, In Progress, Complete, Skipped |
| Assigned To | Single Line Text | No | |
| Notes | Long Text | No | |
| Created Date | Created Time | Yes | Auto |
| Completed At | Date/Time | No | |

---

## 🗑️ Tables to DELETE After Migration:

1. Containers (replaced by Items)
2. Container Types (hardcoded)
3. Facilities
4. Zones  
5. Properties
6. Promo Codes (Stripe handles)
7. Waitlist
8. Leads
9. Notifications
10. Payments
11. Subscriptions
12. Sessions

---

## ⚠️ Critical Validations:

### Before Creating:
1. Backup current base ✓ (you said you did this)
2. Document current table names
3. Test with one record in each table

### After Creating:
1. Verify formulas calculate correctly
2. Test linking between tables
3. Create sample data
4. Update codebase mappings

---

## 🔄 Code Updates Required:

### File: `server/airtable-mapping.ts`
```javascript
export const Tables = {
  Customers: "Customers",
  Items: "Items", 
  Actions: "Actions",
  Operations: "Operations"
};
```

### File: `server/storage.ts`
- Update all table references
- Simplify field mappings
- Remove computed field logic

---

**Ready to proceed with creating these 4 tables?**

I'll be VERY careful and create them exactly as specified above.