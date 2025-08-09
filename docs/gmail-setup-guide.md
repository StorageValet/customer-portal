# Gmail API Setup Guide for StorageValet

This guide will help you set up Gmail API to send emails from your StorageValet application.

## Prerequisites

- A Google Workspace account or Gmail account
- Access to Google Cloud Console

## Step 1: Enable Gmail API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Library"
4. Search for "Gmail API"
5. Click on it and press "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" or "Internal" (if using Google Workspace)
   - Fill in the required fields
   - Add scope: `https://www.googleapis.com/auth/gmail.send`
4. For Application type, choose "Web application"
5. Add authorized redirect URI: `https://developers.google.com/oauthplayground`
6. Click "Create"
7. Save your Client ID and Client Secret

## Step 3: Get Refresh Token

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
2. Click the gear icon (⚙️) in the top right
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. In the left panel, find "Gmail API v1" and select:
   - `https://www.googleapis.com/auth/gmail.send`
6. Click "Authorize APIs"
7. Sign in with the Gmail account you want to send emails from
8. Click "Exchange authorization code for tokens"
9. Copy the "Refresh token"

## Step 4: Configure StorageValet

Update your `.env` file with the credentials:

```env
# Gmail API Configuration
GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REFRESH_TOKEN=your_refresh_token_here
GMAIL_USER_EMAIL=support@storagevalet.com
```

## Step 5: Test Email Sending

1. Restart your server: `npm run dev`
2. Create a new user account
3. Check the console logs to verify emails are being sent
4. Check the recipient's inbox

## Troubleshooting

### "Gmail API not configured" message

- Double-check all environment variables are set correctly
- Ensure the Gmail API is enabled in Google Cloud Console

### Authentication errors

- Verify the refresh token hasn't expired
- Make sure the OAuth consent screen is properly configured
- Check that the email address in GMAIL_USER_EMAIL matches the authenticated account

### Rate limits

- Gmail API has sending limits:
  - 250 quota units per user per second
  - 1,000,000,000 quota units per day
  - Each email send costs 100 quota units

## Production Considerations

1. **Domain Verification**: For production, verify your domain in Google Workspace
2. **SPF/DKIM Records**: Set up proper email authentication
3. **Error Handling**: Monitor failed email sends and implement retry logic
4. **Rate Limiting**: Implement rate limiting to avoid hitting API quotas

## Alternative: Using App Passwords (Simpler but Less Secure)

If you prefer a simpler setup, you can use Gmail App Passwords:

1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings > Security > 2-Step Verification > App passwords
3. Generate an app password for "Mail"
4. Use nodemailer with simple auth instead of OAuth2

However, OAuth2 is recommended for production use.
