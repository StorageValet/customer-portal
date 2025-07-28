# Storage Valet Q&A Implementation Guide
*Comprehensive questions and answers for Replit development and business operations*

## Authentication & Security

**Q: Should delivery requests require SMS verification beyond email login?**
A: Not required for MVP. While nice to have as a future toggle feature, delivery security isn't more critical than food delivery services. Focus on basic email/password authentication first.

**Q: How do customers reset forgotten passwords?**
A: Phase 2 feature. For MVP, handle manually via support email. Future implementation should follow standard email reset flow.

## Container Management

**Q: What happens to containers when customers cancel service?**
A: To be determined based on customer behavior. Initially, we'll include containers in the service and monitor usage patterns. Will adapt policy based on container cost amortization across customer lifetime value.

**Q: Who's liable if customer-provided containers break during transport?**
A: Customers who provide their own containers do so at their own risk. This will be clearly stated in terms of service. Storage Valet containers are tested for durability.

**Q: How long can customers keep empty containers before scheduling pickup?**
A: No strict limit initially. Goal is customer flexibility. Monitor for abuse and adjust if needed.

**Q: Is there a minimum number of containers for pickup?**
A: No minimum. Customer-centric approach means accepting even single container pickups. Pricing accounts for this flexibility.

**Q: Maximum storage limits per customer?**
A: No hard maximum. Large volume requests handled case-by-case. If customer is paying, we'll accommodate.

## Inventory & Documentation

**Q: What photo requirements exist for damage documentation?**
A: Customers upload photos during inventory creation. For claims, they'll submit new photos showing damage plus description. We honor customer's pre-declared values, avoiding negotiation.

**Q: How detailed should item descriptions be?**
A: Customer discretion. Minimum: name and photo. For items over $100, photo required. More detail helps with retrieval but not mandated.

**Q: Can customers update inventory after pickup?**
A: Yes, through portal. Can update descriptions, values, and categories anytime.

## Scheduling & Operations

**Q: How far in advance must pickups/deliveries be scheduled?**
A: Encouraging 24-hour advance notice, but system should allow same-day requests where operationally feasible. First pickup encouraged within 72 hours of signup.

**Q: How do you handle same-day crisis (15 holiday decoration requests)?**
A: Smart scheduling system shows only available slots. Customers can indicate future needs (e.g., "need back by Thanksgiving"). AI assistant and tech handle optimization.

**Q: What about building-specific move-in/out restrictions?**
A: Not a major concern in Hoboken. Customers provide delivery instructions during signup. Our containers are grocery-bag sized, minimizing building concerns.

**Q: How do you prioritize multi-building pickups?**
A: System automatically detects same-building opportunities and suggests combined routes. Promotes pickup+delivery combinations for efficiency.

**Q: Weather contingency policies?**
A: Service suspended only for unsafe conditions. Ability to disable specific zones or entire network. Clear policy in customer agreement.

## Billing & Payments

**Q: When is the setup fee charged?**
A: Immediately upon registration, non-refundable. Creates urgency for first pickup within 72 hours. If customer doesn't schedule pickup, we've covered container costs.

**Q: When does monthly billing start?**
A: First pickup date becomes anniversary billing date. Charged monthly on same date going forward.

**Q: How are failed payments handled?**
A: 3 retry attempts over 7 days. Service continues during grace period but delivery bookings disabled. No late fees unless habitual (3+ failures).

**Q: Additional delivery fees?**
A: First delivery per month included. Additional deliveries $24 each.

## Insurance & Claims

**Q: What's the claims reporting timeline?**
A: 7 days to report damage. For expensive items, encourage inspection within 48 hours. Claims submitted within 24 hours expedited.

**Q: How are claim values determined?**
A: Customer's pre-declared values honored. No negotiation since they set values during inventory creation.

**Q: Different policies for customer vs. Storage Valet containers?**
A: Extra scrutiny for customer-provided container claims, but same timeline and process.

## Prohibited Items

**Q: What items won't Storage Valet accept?**
A: 
- Food of any kind
- Beverages  
- Lithium batteries (fire hazard)
- Live plants, animals, or organic matter
- Weapons or illegal items
- Hazardous materials

## Customer Service

**Q: How are emergency requests handled?**
A: Clear contact chain established. No guaranteed emergency service, but we'll accommodate when possible. Not positioned as revenue stream but as customer care. No direct facility access ever.

**Q: Can customers visit storage facilities?**
A: Never. All access through pickup/delivery service only.

**Q: Expected response times?**
A: Email within 24 hours, text within 4 hours, emergencies within 1 hour.

## Referrals & Marketing

**Q: When are referral rewards applied?**
A: $50 credit applied after referee completes first pickup. Prevents gaming while encouraging sharing.

**Q: Building partnership access method?**
A: URL parameters initially (mystoragevalet.com/signup?building=beacon&promo=BEACON270). Subdomains in Phase 2.

**Q: Promo code usage limits?**
A: One per email address. Building codes unlimited use. Referral codes unique per customer.

## Data & Privacy

**Q: How long is customer data retained after cancellation?**
A: 1 year post-cancellation. Deletion available upon request. Compliance with privacy regulations required.

**Q: What data is captured during operations?**
A: All interactions logged for future optimization: movement patterns, seasonal trends, item categories, access frequency.

## Technology Decisions

**Q: Why switch from Softr/Airtable to Replit?**
A: Need full control for custom features and better mobile experience. Softr limitations preventing timely launch. Airtable remains as backend via API.

**Q: Image storage solution?**
A: Dropbox (2TB available) instead of database storage. Store Dropbox URLs in database.

**Q: Authentication complexity?**
A: Simple email/password for MVP. No complex JWT or 2FA initially.

## Operational Policies

**Q: Service area boundaries?**
A: 15 ZIP codes across Hudson County waterfront. May disable zones for weather or operational needs.

**Q: Seasonal demand management?**
A: Customers indicate return dates during inventory creation. System prevents overload by managing available slots.

**Q: Route optimization approach?**
A: Hidden from customers who just see available slots. Backend tracks volume/weight per route to prevent truck overload.

## Business Model

**Q: Why these specific price points?**
A: Value-based pricing reflecting full-service solution, not just storage space. Includes labor, convenience, insurance, and technology.

**Q: Target customer acquisition cost?**
A: $50-100 with LTV of $4,000+ (24 months). Achieved through building partnerships and referrals.

**Q: When is profitability expected?**
A: 95 customers at $250 average monthly revenue covers all costs including founder salary.

---

This Q&A guide serves as a comprehensive reference for developers, customer service, and future team members implementing Storage Valet's vision.