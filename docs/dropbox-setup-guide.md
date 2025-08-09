# Dropbox API Setup Guide for StorageValet

This guide will help you set up Dropbox API for photo storage in your StorageValet application.

## Prerequisites

- A Dropbox account (preferably Business with 2TB storage)
- Access to Dropbox App Console

## Step 1: Create a Dropbox App

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click "Create app"
3. Choose the following settings:
   - **API**: Choose "Scoped access"
   - **Access type**: Choose "Full Dropbox" (to organize files in folders)
   - **Name**: Enter a unique app name (e.g., "StorageValet-Production")
4. Click "Create app"

## Step 2: Configure App Permissions

1. In your app settings, go to the "Permissions" tab
2. Enable the following permissions:
   - `files.content.write` - Upload files
   - `files.content.read` - Download files
   - `sharing.write` - Create shared links
   - `sharing.read` - List shared links
3. Click "Submit" to save changes

## Step 3: Generate Access Token

### Option A: Long-lived Access Token (Recommended for Production)

1. In the "Settings" tab, scroll to "OAuth 2"
2. Under "Access token expiration", select "No expiration"
3. Click "Generate" under "Generated access token"
4. Copy the token - you won't be able to see it again!

### Option B: Refresh Token (More Secure)

1. Note your App key and App secret
2. Use OAuth 2 flow to get refresh token
3. Implement token refresh logic in the application

## Step 4: Configure StorageValet

Update your `.env` file:

```env
# Dropbox API Key
DROPBOX_ACCESS_TOKEN=your_access_token_here
```

## Step 5: Test File Upload

1. Restart your server: `npm run dev`
2. Create an item and upload a photo
3. Check your Dropbox folder structure:
   ```
   /StorageValet/
     /users/{customerId}/
       /items/{itemId}/
         photo1.jpg
       /movements/{movementId}/
         pickup/
         delivery/
   ```

## Folder Structure

The application automatically creates this folder structure:

- `/StorageValet/` - Root folder for all storage
- `/users/{customerId}/` - Per-customer folder
- `/items/{itemId}/` - Photos for specific items
- `/movements/{movementId}/` - Photos for pickups/deliveries

## API Limits

Dropbox API has the following limits:

- **Upload size**: Up to 150 MB per file
- **Rate limits**:
  - 500 requests per user per hour
  - Uploads don't count against rate limit
- **Storage**: Based on your Dropbox plan (2TB for Business)

## Best Practices

1. **File Naming**: Files are automatically timestamped to avoid conflicts
2. **Error Handling**: The app falls back to placeholder images if upload fails
3. **Shared Links**: All uploaded files get public shared links for easy access
4. **Cleanup**: Implement periodic cleanup of old/unused files

## Troubleshooting

### "Dropbox not configured" message

- Verify DROPBOX_ACCESS_TOKEN is set in .env
- Make sure the token isn't the placeholder value

### Upload failures

- Check Dropbox storage quota
- Verify app permissions are correct
- Check file size (max 10MB per current settings)

### Shared link errors (409)

- This is normal - the app tries to create a link, then retrieves existing one
- No action needed

## Production Checklist

- [ ] Use a Dropbox Business account for 2TB storage
- [ ] Set up monitoring for storage usage
- [ ] Implement file cleanup policies
- [ ] Consider CDN for frequently accessed images
- [ ] Set up backup to Google Drive (as requested)

## Security Considerations

1. **Access Token**: Keep it secret, never commit to git
2. **Shared Links**: All photos get public links - ensure no sensitive data
3. **Folder Permissions**: App has full Dropbox access - consider scoped access
4. **Rate Limiting**: Implement client-side rate limiting for uploads
