# Gmail Setup Instructions for Storage Valet Portal

## Current Issue

Gmail authentication fails because:

- Primary Google Workspace domain: b4storagesolutions.com
- Secondary domain: mystoragevalet.com
- App passwords and OAuth2 are restricted for secondary domains

## Recommended Solution

### Step 1: Create App Password with Primary Domain Account

1. Sign in to a b4storagesolutions.com account (e.g., `zach@b4storagesolutions.com`)
2. Go to: https://myaccount.google.com/apppasswords
3. Generate an app password for "Mail"
4. Copy the 16-character password

### Step 2: Configure "Send As" (Optional but Recommended)

In the b4storagesolutions.com Gmail account:

1. Go to Settings → Accounts and Import
2. Under "Send mail as", click "Add another email address"
3. Add `zach@mystoragevalet.com` or `support@mystoragevalet.com`
4. Verify the email address
5. Set as default if desired

### Step 3: Update .env Configuration

```env
# Gmail Configuration - Using Primary Domain
GMAIL_USER_EMAIL=zach@b4storagesolutions.com  # Or your b4storagesolutions.com account
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx        # 16-character app password
GMAIL_FROM_NAME=Storage Valet Support
GMAIL_FROM_EMAIL=support@mystoragevalet.com   # Display email (if using Send As)

# Keep OAuth2 credentials for future use
GMAIL_CLIENT_ID=<your-gmail-client-id>
GMAIL_CLIENT_SECRET=<your-gmail-client-secret>
GMAIL_REFRESH_TOKEN=<your-gmail-refresh-token>
```

### Step 4: Update Email Service

The portal can use either:

1. `simple-email-service.ts` - App password authentication (recommended for now)
2. `gmail-service.ts` - OAuth2 (for future when app is verified)

## Alternative Solutions

### Option 1: Third-Party Email Service

- SendGrid: Reliable, good deliverability, free tier available
- Mailgun: Developer-friendly, good for transactional emails
- AWS SES: Cost-effective at scale, requires AWS account

### Option 2: Full Google App Verification

- Submit app for Google verification
- May take weeks/months
- Required for production OAuth2 with external users

### Option 3: Domain Migration (Not Recommended)

- Make mystoragevalet.com the primary domain
- Complex process with potential downtime
- Risk of account disruption

## Current Status

✅ OAuth2 credentials obtained
✅ Server running with email fallback
⏳ Awaiting app password from b4storagesolutions.com account
⏳ Dropbox access token needed

## Next Steps

1. Generate app password using b4storagesolutions.com account
2. Configure "Send As" for mystoragevalet.com addresses
3. Update .env with app password
4. Test email functionality
5. Configure Dropbox access token
