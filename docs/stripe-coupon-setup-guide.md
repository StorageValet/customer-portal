# Storage Valet - Stripe Coupon Configuration

## Current Active Promo Code

### Setup Fee Waiver
- **Promo Code**: `WAIVEDSETUP`
- **Coupon ID**: `VpDavmda`
- **Discount**: 100% off setup fee
- **Duration**: One-time use
- **Status**: Active and available

## How It Works

When customers enter `WAIVEDSETUP` during signup, they receive:
- **Starter Plan**: Save $99.50
- **Medium Plan**: Save $149.50
- **Family Plan**: Save $179.50

## Integration
The promo code is validated directly through Stripe's API. No manual configuration needed - it's already active in your Stripe account.

## Testing
To test the promo code:
1. Go through signup flow
2. Enter `WAIVEDSETUP` in the promo code field
3. The setup fee should be waived upon validation

Last Updated: August 9, 2025