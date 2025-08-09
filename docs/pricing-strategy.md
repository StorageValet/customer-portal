# 📦 Storage Valet Pricing Structure (Finalized)

## 🧾 Monthly Subscription Tiers

Our tiered plans are designed to accommodate a range of storage needs, from single-person apartments to large family households:

| Plan Name    | Monthly Rate | One-Time Setup Fee (50%) | Total Due at Signup |
| ------------ | ------------ | ------------------------ | ------------------- |
| Starter Plan | $199         | $99.50                   | $99.50              |
| Medium Plan  | $299         | $149.50                  | $149.50             |
| Family Plan  | $349         | $174.50                  | $174.50             |

---

## 💵 Billing & Setup Policy

- **One-Time Setup Fee**: Due upon **account creation and registration**, this grants access to the customer portal and account activation. The fee is 50% of the monthly subscription for the selected plan.
- **Monthly Billing Cycle**: Begins **only after the customer's first completed movement**. Movements include:
  - Initial pickup of items from the customer's location
  - Delivery of containers to the customer
  - Re-delivery of stored items
- **Billing Start Date**: Monthly billing is triggered **on the date of the first completed movement**, and recurs on that same calendar day each month thereafter.

---

## 📌 Summary

This pricing model ensures:

- Low upfront commitment with setup fee only at signup
- Pay-as-you-use flexibility with billing delayed until services are rendered
- Full transparency—no hidden fees, and predictable billing aligned with actual usage

---

## 💡 Updated Pricing Strategy & Rationale

**Document Title**: Updated Pricing Strategy & Rationale  
**Date**: June 26, 2025  
**Author**: Gemini Strategic Assistant  
**Status**: Final

This document outlines the "value-based" pricing model for Storage Valet, designed to align our rates with the premium, high-touch concierge service we provide, rather than competing with the price of raw storage space.

### 1. The Core Philosophy: Selling a Solution, Not Space

Our pricing is intentionally positioned higher than traditional self-storage facilities because we are not selling the same product. Our service is an all-inclusive solution that saves our target customers their most valuable assets: time and convenience.

**We Solve for:**

- **Labor & Time**: The hours spent packing, moving, and traveling to a storage unit.
- **Logistics & Transportation**: The cost and hassle of renting a truck, gas, and tolls.
- **Inventory & Access**: The mental burden of not knowing what's in storage and the effort required to retrieve a single item.
- **Risk & Peace of Mind**: The anxiety of signing one-sided contracts and storing valuables in a facility without true insurance.

---

### 2. Justification for Premium Pricing

The rates are justified by the all-inclusive nature of the Storage Valet service. The monthly fee covers:

- The cost of the physical, climate-controlled storage space.
- Professional pickup of all items directly from the customer's home.
- A complete digital inventory of every container, accessible on demand.
- On-demand delivery of specific items when needed.
- A true Bailee's Customer Insurance policy that protects the customer's belongings while in our care, custody, and control.

This model allows us to confidently communicate our value, attract a clientele that prioritizes convenience over raw cost, and build a sustainable, profitable business.

---

## 🔧 Technical Implementation Notes

### Container Types in v1

- Container Types are primarily for **operational efficiency** and **service quality**
- No per-container or à la carte pricing in v1
- Architecture should support future pricing models but not implement them yet

### Key Implementation Points:

1. **Plan Selection**: Based on estimated storage needs, not container count
2. **Billing Trigger**: First movement completion, not registration
3. **Value Communication**: Focus on service benefits, not space metrics
4. **Future Flexibility**: Design data model to support BTB/à la carte pricing later
