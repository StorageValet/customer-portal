# SendGrid Setup Guide for Storage Valet Portal

## Why SendGrid?

- Gmail OAuth2/App Passwords blocked due to Google Workspace domain restrictions
- SendGrid offers reliable transactional email delivery
- Free tier: 100 emails/day (sufficient for current needs)
- Better for production with domain verification and analytics

## Setup Steps

### 1. Create SendGrid Account

1. Go to https://sendgrid.com
2. Click "Start for Free"
3. Sign up with your email (zach@mystoragevalet.com)
4. Verify your email address

### 2. Verify Your Sender

Two options:

#### Option A: Single Sender Verification (Quick Start)

1. Go to Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Add sender details:
   - From Name: Storage Valet
   - From Email: support@mystoragevalet.com
   - Reply To: support@mystoragevalet.com
   - Company Address: Your business address
4. Verify the email address

#### Option B: Domain Authentication (Recommended for Production)

1. Go to Settings → Sender Authentication
2. Click "Authenticate Your Domain"
3. Select your DNS provider
4. Add the provided DNS records to mystoragevalet.com
5. Verify the domain

### 3. Generate API Key

1. Go to Settings → API Keys
2. Click "Create API Key"
3. Name: "Storage Valet Portal"
4. Permissions: Select "Restricted Access"
   - Mail Send: Full Access
   - (All other permissions can be "No Access")
5. Click "Create & View"
6. **COPY THE API KEY** - You won't see it again!

### 4. Update Your .env File

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=support@mystoragevalet.com
```

### 5. Test Email Sending

Restart your dev server and the SendGrid service will initialize automatically:

```bash
npm run dev
```

You should see:

```
✅ SendGrid email service initialized successfully
   Sending from: support@mystoragevalet.com
```

### 6. Send Test Email

Create a test endpoint or use the signup flow to trigger an email.

## Email Templates Available

The portal includes these email templates:

- Welcome email (new user signup)
- Password reset
- Pickup confirmation
- Delivery confirmation
- Movement reminders (24 hours before)
- Magic link login

## Monitoring & Analytics

SendGrid provides:

- Email delivery status
- Open/click tracking
- Bounce handling
- Spam report management

Access these at: https://app.sendgrid.com/statistics

## Troubleshooting

### "Sender address not verified"

- Complete Single Sender Verification or Domain Authentication
- Make sure SENDGRID_FROM_EMAIL matches verified sender

### "API key not valid"

- Check for extra spaces in the API key
- Ensure the key has "Mail Send" permission

### Emails going to spam

- Complete domain authentication
- Add SPF, DKIM, and DMARC records
- Use a consistent from address

## Production Checklist

- [ ] Domain authentication completed
- [ ] SPF, DKIM records added
- [ ] API key stored securely (not in code)
- [ ] From address matches domain
- [ ] Unsubscribe link in marketing emails
- [ ] Privacy policy link included

## Support

- SendGrid Docs: https://docs.sendgrid.com
- Status Page: https://status.sendgrid.com
- Support: https://support.sendgrid.com
