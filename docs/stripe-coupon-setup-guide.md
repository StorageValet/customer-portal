# Storage Valet - Stripe Coupon Setup Guide

## Overview

Storage Valet now uses Stripe's native coupon system for all promotional codes and discounts. This provides better tracking, analytics, and integration with your financial reporting.

## Pricing Structure

### Monthly Plans

- **Starter**: $199/month
- **Medium**: $299/month
- **Family**: $349/month

### Setup Fees (50% of monthly)

- **Starter**: $99.50
- **Medium**: $149.50
- **Family**: $174.50

## Creating Coupons in Stripe

### 1. Access Stripe Dashboard

1. Log into your Stripe Dashboard
2. Navigate to **Products** → **Coupons**
3. Click **+ New coupon**

### 2. Setup Fee Waiver Coupons

For coupons that completely waive the setup fee:

```
Name: LAUNCH2025
Coupon ID: LAUNCH2025
Type: Percentage discount
Percent off: 100%
Duration: Once
Metadata:
  - Key: waives_setup_fee
  - Value: true
```

### 3. Partial Discount Coupons

For coupons that give a partial discount:

```
Name: SAVE50
Coupon ID: SAVE50
Type: Percentage discount
Percent off: 50%
Duration: Once
```

Or for fixed amount discounts:

```
Name: 25OFF
Coupon ID: 25OFF
Type: Fixed amount discount
Amount off: $25.00
Duration: Once
```

### 4. Subscription Coupons

For ongoing subscription discounts:

```
Name: PARTNER20
Coupon ID: PARTNER20
Type: Percentage discount
Percent off: 20%
Duration: Repeating
Repeat for: 3 months
```

## Coupon Metadata

Use metadata to track campaigns and special rules:

- `waives_setup_fee`: Set to "true" for 100% setup fee waivers
- `campaign`: Track marketing campaigns (e.g., "summer2025", "partner_xyz")
- `partner_id`: Track partner/referral sources
- `max_uses`: Internal tracking (Stripe has its own usage limits)

## How the Integration Works

### 1. Signup Flow

- User enters coupon code during signup
- Real-time validation shows discount message
- Coupon is stored with user record

### 2. Payment Flow

- Setup payment page automatically applies the coupon
- If 100% off, no payment required
- Partial discounts show adjusted amount

### 3. Data Storage

- Stripe Customer ID stored in Airtable
- Applied coupon code stored in referralCode field
- Stripe tracks all usage and analytics

## Testing Coupons

### In Test Mode

1. Create test coupons with "TEST\_" prefix
2. Use Stripe test card numbers
3. Verify discount application

### Test Scenarios

- 100% off coupon (waives setup fee)
- 50% off coupon
- $25 off coupon
- Invalid/expired coupon
- Already used coupon

## Analytics & Reporting

### In Stripe Dashboard

- View coupon redemption rates
- Track revenue impact
- See customer segments

### Custom Reports

- Export data via Stripe API
- Combine with Airtable data
- Track by campaign/partner

## Best Practices

1. **Naming Convention**
   - Use descriptive IDs (e.g., PARTNER_ABC, SUMMER25)
   - Keep consistent format
   - Document purpose

2. **Expiration Dates**
   - Set reasonable expiration
   - Monitor usage regularly
   - Extend popular campaigns

3. **Usage Limits**
   - Set max redemptions
   - Consider per-customer limits
   - Monitor for abuse

4. **Communication**
   - Clear terms for customers
   - Update marketing materials
   - Train support team

## Troubleshooting

### Common Issues

1. **"Invalid promo code"**
   - Check coupon ID spelling
   - Verify not expired
   - Check usage limits

2. **Discount not applying**
   - Verify coupon type matches use case
   - Check metadata settings
   - Review customer eligibility

3. **Analytics not showing**
   - Allow 24 hours for data
   - Check date ranges
   - Verify production vs test mode

## Migration from Old System

The previous hardcoded promo codes have been removed:

- WAIVESETUP
- LAUNCH2025
- FREEBETA
- STORAGEFREE

To maintain continuity:

1. Create equivalent coupons in Stripe with same IDs
2. Set as 100% off with waives_setup_fee metadata
3. Communicate to existing users if needed

## Support

For technical issues:

- Check Stripe logs for API errors
- Review server logs for integration issues
- Contact Stripe support for platform issues

For business questions:

- Review coupon performance weekly
- Adjust strategy based on data
- Document lessons learned
