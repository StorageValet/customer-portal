# Storage Valet Visual Indicators Specification
## Dashboard Usage Display with Real Plan Limits

---

## 📊 Visual Progress Bars (Customer Dashboard)

### Starter Plan ($199/month)
```javascript
// Customer has stored 65 cu.ft worth of items, declared value $1,500
Space Usage:     [██████▌░░░] 65/100 cu.ft (65%)
                 "35 cubic feet remaining"

Insurance Usage: [███████▌░░] $1,500/$2,000 (75%)
                 "$500 coverage remaining"
```

### Medium Plan ($299/month)
```javascript
// Customer has stored 170 cu.ft worth of items, declared value $2,800
Space Usage:     [████████▌░] 170/200 cu.ft (85%)
                 "⚠️ Only 30 cubic feet remaining! Consider Family plan"

Insurance Usage: [█████████▎] $2,800/$3,000 (93%)
                 "⚠️ Near limit! Add coverage for $24/month per $1,000"
```

### Family Plan ($399/month)
```javascript
// Customer has stored 250 cu.ft worth of items, declared value $5,200
Space Usage:     [████████▎░] 250/300 cu.ft (83%)
                 "50 cubic feet remaining"

Insurance Usage: [██████████] $5,200/$4,000 (130%)
                 "❗ Over limit by $1,200"
                 "Additional charge: $29/month for extra coverage"
                 // Calculation: ceil(1200/1000) * $24 = $29
```

---

## 🎯 Upsell Triggers & Messaging

### Space-Based Upsells

#### At 70% Usage (Warning Zone)
```javascript
if (usedCubicFeet / planCubicFeet >= 0.70) {
  showMessage("You're using " + usedCubicFeet + " of " + planCubicFeet + " cubic feet");
  // Yellow indicator bar
}
```

#### At 85% Usage (Upsell Zone)
```javascript
if (usedCubicFeet / planCubicFeet >= 0.85) {
  const nextPlan = getNextPlan(currentPlan);
  const additionalCost = nextPlan.price - currentPlan.price;
  
  showUpsell(
    "Running low on space! 🚨",
    "Upgrade to " + nextPlan.name + " for just $" + additionalCost + " more per month",
    "You'll get " + (nextPlan.cubicFeet - currentPlan.cubicFeet) + " additional cubic feet"
  );
  // Orange indicator bar
}
```

#### At 95% Usage (Critical Zone)
```javascript
if (usedCubicFeet / planCubicFeet >= 0.95) {
  showCritical(
    "⚠️ Almost at capacity!",
    "Only " + (planCubicFeet - usedCubicFeet) + " cubic feet remaining",
    [
      { action: "Upgrade Plan", highlight: true },
      { action: "Remove Items", highlight: false }
    ]
  );
  // Red indicator bar
}
```

### Insurance-Based Upsells

#### When Declared Value Exceeds Coverage
```javascript
if (totalDeclaredValue > planInsurance) {
  const excess = totalDeclaredValue - planInsurance;
  const additionalMonthly = Math.ceil(excess / 1000) * 24;
  
  showInsuranceWarning(
    "Your items ($" + totalDeclaredValue + ") exceed your coverage ($" + planInsurance + ")",
    "Add $" + additionalMonthly + "/month for full protection",
    "Covers additional $" + excess + " in value"
  );
}
```

---

## 📈 Dashboard Component Examples

### React Component Structure
```jsx
<PlanUsageWidget>
  <SpaceUsageBar 
    used={customer.usedCubicFeet}
    limit={customer.planCubicFeet}
    showUpsell={customer.usedCubicFeet / customer.planCubicFeet > 0.85}
  />
  
  <InsuranceUsageBar
    declaredValue={customer.totalDeclaredValue}
    coverage={customer.planInsurance}
    additionalCost={calculateAdditionalInsurance(declaredValue, coverage)}
  />
  
  <QuickStats>
    <Stat label="Items Stored" value={customer.itemCount} />
    <Stat label="Total Weight" value={customer.totalWeight + " lbs"} />
    <Stat label="Last Activity" value={formatDate(customer.lastActivity)} />
  </QuickStats>
</PlanUsageWidget>
```

### Color Coding Logic
```javascript
function getBarColor(percentage) {
  if (percentage < 70) return '#10B981';  // Green
  if (percentage < 85) return '#F59E0B';  // Yellow
  if (percentage < 95) return '#FB923C';  // Orange
  return '#EF4444';                       // Red
}
```

---

## 💡 Smart Messaging Examples

### Starter Customer Approaching Limit
```
"Hi Sarah! You're using 92 of your 100 cubic feet. 
The Medium plan gives you 200 cubic feet for just $100 more per month. 
That's double the space! Upgrade now?"
[Upgrade to Medium] [Not Now]
```

### Medium Customer Over Insurance Limit
```
"Your stored items are valued at $3,500, but your plan covers $3,000.
Add protection for the extra $500 for just $24/month.
Peace of mind is worth it!"
[Add Coverage] [I'll Risk It]
```

### Family Customer - Healthy Usage
```
"Great job managing your storage! 
You're using 180 of 300 cubic feet (60%).
Your items are fully insured at $3,200 of $4,000 covered.
[View Inventory] [Schedule Delivery]
```

---

## 🔧 Implementation Notes

### Database Fields Required
```javascript
// In Customers table
"Plan Cubic Feet": 100|200|300,      // Based on plan
"Used Cubic Feet": 0.0,              // Sum of all active items
"Plan Insurance": 2000|3000|4000,    // Based on plan  
"Total Declared Value": 0.0,         // Sum of item values

// Calculated fields (can be computed in app)
"Space Usage Percentage": (Used CF / Plan CF) * 100,
"Insurance Usage Percentage": (Declared Value / Plan Insurance) * 100,
"Additional Insurance Needed": Math.max(0, Declared Value - Plan Insurance),
"Additional Insurance Cost": Math.ceil(Additional Insurance Needed / 1000) * 24
```

### Update Triggers
- Recalculate on item add/remove
- Recalculate on item value update
- Recalculate on plan change
- Cache for 5 minutes to reduce DB calls

---

## ✅ Benefits of This Approach

1. **Clear Communication**: Customers always know their usage
2. **Natural Upsells**: Prompts appear at logical moments
3. **No Surprises**: Transparent about additional costs
4. **Encourages Engagement**: Visual feedback drives action
5. **Reduces Support**: Self-service understanding of limits

---

*Last Updated: August 9, 2025*
*Confirmed plan limits: 100/200/300 cu.ft, $2k/$3k/$4k insurance*