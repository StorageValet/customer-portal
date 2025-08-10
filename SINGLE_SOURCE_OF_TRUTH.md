# Storage Valet Portal - SINGLE SOURCE OF TRUTH
## ⚠️ THIS IS THE ONLY DOCUMENT THAT MATTERS - August 2025

---

## 🎯 Business Facts (Current & Accurate)

### Pricing
- **Starter Plan**: $199/month (Setup fee: $99.50)
- **Medium Plan**: $299/month (Setup fee: $149.50)
- **Family Plan**: $399/month (Setup fee: $179.50)
- **Setup Fees**: Non-refundable, waivable with promo codes
- **Additional Insurance**: $24 per $1,000 per month above plan limits

### Plan Limits (CONFIRMED August 9, 2025)
- **Starter**: 100 cubic feet, $2,000 insurance included
- **Medium**: 200 cubic feet, $3,000 insurance included  
- **Family**: 300 cubic feet, $4,000 insurance included

### Service Area (Phase 1)
13 ZIP codes in Hudson County, NJ:
- **Hoboken**: 07030
- **Jersey City**: 07302, 07304, 07305, 07306, 07307, 07310, 07311
- **Weehawken/Union City**: 07086, 07087
- **West New York**: 07093
- **Edgewater**: 07020
- **North Bergen**: 07047

### Container Types (Our Inventory)
1. **Plastic Bin**: 27"×17"×12" (3.2 cu.ft)
2. **Soft Tote**: 24"×16"×12" (2.7 cu.ft)
3. **XL Crate**: 28"×18"×23" (6.7 cu.ft)

---

## 💻 Technical Facts

### Deployment
- **Platform**: Railway (NOT Vercel, NOT Heroku)
- **Database**: Airtable (via API)
- **File Storage**: Dropbox
- **Payments**: Stripe (Live keys)
- **Email**: SendGrid (NOT Gmail SMTP)
- **Sessions**: In-memory for Phase 1

### Environment Variables Required
```
PORT=3000
NODE_ENV=production
SESSION_SECRET=[generated]
AIRTABLE_API_KEY=[from Airtable]
AIRTABLE_BASE_ID=appSampziZuFLMveE
STRIPE_SECRET_KEY=sk_live_[xxx]
SENDGRID_API_KEY=[from SendGrid]
DROPBOX_ACCESS_TOKEN=[from Dropbox]
INGEST_WEBHOOK_SECRET=[for Softr integration]
```

### Critical Data Requirements
Every item MUST have:
1. **Dimensions**: L × W × H (inches)
2. **Weight**: (lbs)
3. **Estimated Value**: ($)
4. **Cubic Feet**: Calculated from dimensions

---

## 🗂️ Database Schema (Simplified)

### 4 Tables Only:
1. **Customers** - User accounts, plans, usage tracking
2. **Items** - Inventory with dimensions, weight, value
3. **Movements** - Pickups and deliveries
4. **Operations** - Simple queue for ops team

### Removed/Deferred:
- Container Types (hardcoded)
- Facilities/Zones (single warehouse)
- Properties (not needed until 100+ customers)
- Sessions (use in-memory)
- Waitlist/Leads (use spreadsheet)

---

## 🚀 Phase 1 Goals (August 2025)

### Success Metrics:
- 20 registrations by end of August
- 10 customers with completed first pickup
- Zero double-billing incidents
- All items have dimensions captured

### NOT in Phase 1:
- Route optimization (manual for now)
- Multi-warehouse support
- Complex analytics
- Mobile app
- B2B partnerships

---

## 🐛 Known Issues (As of Aug 9, 2025)

### Fixed:
✅ SQL injection vulnerability in Airtable formulas
✅ Repository migration from $HOME to proper directory

### Pending:
- Double-billing risk in subscription creation
- Setup fee tracking needs improvement
- "Estimated Value" field type mismatch with Airtable

---

## 📝 Documentation to DELETE

The following files are OUTDATED and should be removed:
- All Vercel-related docs (already removed)
- Duplicate files (anything with "2" in name)
- Old deployment guides for other platforms
- Test files and experiments
- Session summaries older than 1 week

---

## ⚠️ DO NOT TRUST THESE DOCUMENTS:
- Any file dated before August 2025
- Anything mentioning different pricing
- Deployment guides for Vercel/Heroku
- Insurance values that don't match above

---

**LAST UPDATED**: August 9, 2025, 3:45 PM ET
**NEXT REVIEW**: Before any major decision

---

# ZACH: Please confirm/correct:
1. [ ] Plan cubic feet limits
2. [ ] Insurance coverage amounts per plan
3. [ ] Remaining 3 ZIP codes
4. [ ] Railway deployment is working
5. [ ] SendGrid is set up and working