# Stripe MCP Server Setup Guide

## Status: ✅ CONFIGURED (LIVE MODE)

⚠️ **WARNING**: Currently configured with LIVE Stripe keys. Be extremely careful with any operations.

## Configuration Details

### MCP Server Package
- **Package**: `@stripe/mcp`
- **Installation**: Via npx (no local installation needed)
- **Mode**: LIVE PRODUCTION KEYS

### Enabled Tools (Read-Only for Safety)
- `customers.read` - View customer details
- `customers.list` - List all customers
- `subscriptions.read` - View subscription details
- `subscriptions.list` - List all subscriptions
- `payment_intents.read` - View payment intents
- `charges.list` - List charges
- `products.list` - List products
- `prices.list` - List prices

## How to Use

### Restart Claude Desktop
**IMPORTANT**: You must restart Claude Desktop for the Stripe MCP to be available.

1. Quit Claude Desktop completely (Cmd+Q on Mac)
2. Reopen Claude Desktop
3. The Stripe MCP server will be available in your chat

### Available Operations

#### Customer Management
```
List all Stripe customers
Get Stripe customer cus_xxxxx
Search customers by email
```

#### Subscription Management
```
List all active subscriptions
Get subscription sub_xxxxx
Check subscription status for customer
```

#### Payment History
```
List recent charges
Get payment intent pi_xxxxx
View charge details ch_xxxxx
```

#### Product Catalog
```
List all products
List all prices
Get product details prod_xxxxx
```

## Safety Considerations

### Current Configuration
- **READ-ONLY OPERATIONS**: Only query operations enabled
- **NO WRITE ACCESS**: Cannot create, update, or delete
- **LIVE KEYS**: Operations affect real production data

### To Enable Write Operations (Use Caution!)
If you need write access, update the config to include:
```json
"--tools=customers.create,subscriptions.create,payment_intents.create"
```

### Recommended: Switch to Test Mode
For development, use test keys instead:
1. Get test keys from Stripe Dashboard
2. Update claude_desktop_config.json with test keys
3. Update .env with test keys for application

## Integration with Portal

### Key Stripe IDs in Airtable
- **Customers Table**:
  - `Stripe Customer ID` - Links to Stripe customer
  - `Stripe Setup Payment ID` - Initial setup fee
  - `Stripe Subscription ID` - Monthly subscription

### Common Queries

#### Verify Customer Sync
```
1. Get customer from Airtable by email
2. Search Stripe customer by same email
3. Verify IDs match
```

#### Check Subscription Status
```
1. Get Stripe Subscription ID from Airtable
2. Query subscription details from Stripe
3. Verify status matches Account Status in Airtable
```

#### Audit Payment History
```
1. Get Stripe Customer ID from Airtable
2. List charges for that customer
3. Verify payments align with subscription dates
```

## Troubleshooting

### MCP Not Available
1. Verify Claude Desktop fully restarted
2. Check config: `~/Library/Application Support/Claude/claude_desktop_config.json`
3. Test API key directly:
```bash
curl https://api.stripe.com/v1/customers \
  -u sk_live_YOUR_KEY:
```

### Rate Limiting
- Stripe API has rate limits
- Use pagination for large lists
- Cache results when possible

### Security Best Practices
1. **Never share API keys**
2. **Use restricted keys when possible**
3. **Rotate keys regularly**
4. **Monitor API usage in Stripe Dashboard**

## Next Steps

1. Test read operations with existing customers
2. Verify subscription data matches Airtable
3. Consider implementing webhook sync
4. Plan migration to test keys for development