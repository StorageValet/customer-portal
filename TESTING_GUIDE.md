# StorageValet Portal - Testing Guide

## 🚀 Server is Running!

The development server is now running at: **http://localhost:3000**

## Test Accounts

Based on the handoff document, these test accounts were created:

- `zach@mystoragevalet.com` (your account)
- `zjbrown11@gmail.com` (with WAIVESETUP promo applied)

## Testing Steps

### 1. Basic Application Access

1. Open your browser and go to: http://localhost:3000
2. You should see the StorageValet landing page

### 2. Test User Authentication

1. Click "Login" or "Sign Up"
2. Try logging in with one of the test accounts
3. If you don't know the password, you can create a new account

### 3. Test Photo Upload (After Login)

1. Navigate to your dashboard
2. Create a new item or select an existing one
3. Try uploading a photo
   - **Note**: Since Dropbox token is not configured, it will use placeholder images
   - You'll see a message in the console: "Dropbox not configured, using placeholder"

### 4. Test Promo Code System

1. Log out and go to Sign Up
2. Try these promo codes:
   - `WAIVESETUP` - Waives $100 setup fee
   - `LAUNCH2025` - Waives setup fee
   - `FREEBETA` - Waives setup fee
   - `STORAGEFREE` - Waives setup fee

## API Endpoints You Can Test

### Without Authentication:

- `GET http://localhost:3000/api/auth/user` - Check auth status
- `POST http://localhost:3000/api/auth/signup` - Create account
- `POST http://localhost:3000/api/auth/login` - Login

### With Authentication (requires login):

- `GET http://localhost:3000/api/items` - Get your items
- `POST http://localhost:3000/api/items` - Create new item
- `GET http://localhost:3000/api/movements` - Get your movements
- `POST http://localhost:3000/api/items/:itemId/photos` - Upload photo

## Known Limitations

1. **Email Service**: Currently logs to console instead of sending actual emails
2. **Dropbox**: Uses placeholder images unless you add a real Dropbox token
3. **Stripe**: Has LIVE keys configured - BE CAREFUL with payment testing!

## Checking Logs

To see server logs in real-time:

```bash
tail -f ~/Documents/SV-Portal_v6/server.log
```

## Stopping the Server

When you're done testing:

```bash
pkill -f "tsx server/index.ts"
```

## Troubleshooting

If you encounter issues:

1. **Port already in use**:

   ```bash
   lsof -i :3000
   kill -9 <PID>
   ```

2. **Dependencies issues**:

   ```bash
   npm install
   ```

3. **TypeScript errors**:
   ```bash
   npm run check
   ```

## Next Steps

After testing, we can:

1. Configure Gmail API for real email sending
2. Add your Dropbox access token for real photo uploads
3. Set up deployment configurations for Vercel/Railway
4. Switch to Stripe test keys for safer payment testing
