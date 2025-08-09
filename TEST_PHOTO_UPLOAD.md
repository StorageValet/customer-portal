# Photo Upload Testing Guide

## ✅ Integration Summary

### What's Working:
1. **Authentication**: Login redirects to dashboard properly
2. **Dropbox Service**: Fully configured with your access token
3. **Upload Endpoints**: Ready at `/api/items/:itemId/upload-photo`
4. **UI Integration**: Upload modal fixed to use correct endpoint
5. **Airtable Storage**: Photos stored as comma-separated URLs in "Additional Photos" field

## 🧪 Testing Steps

### Step 1: Login
1. Go to http://localhost:3000
2. Click "Portal Sign In"
3. Login with `zach@mystoragevalet.com`
4. Confirm you're redirected to the dashboard

### Step 2: Navigate to Inventory
1. Click "Inventory" in the navigation
2. You should see your items list

### Step 3: Create or Edit an Item
1. Click "Add New Item" button (or click on an existing item)
2. Fill in:
   - Name: "Test Photo Item"
   - Category: "Electronics" (or any category)
   - Estimated Value: 100
   - Status: "At Home"

### Step 4: Upload Photos
1. In the modal, look for the photo upload section
2. Click "Choose Files" or drag and drop images
3. Select one or more image files (JPG, PNG, etc.)
4. Click "Save Item"

### Step 5: Verify Upload
1. Check the item card shows the uploaded photo
2. If multiple photos, it should show photo count
3. Click the item again to see all photos

## 🔍 Backend Verification

### Check Server Logs
Look for entries like:
```
POST /api/items/{itemId}/upload-photo 200
```

### Check Dropbox
1. Go to https://www.dropbox.com/home/Apps/Storage%20Valet%20Portal
2. Navigate to: `/StorageValet/users/{your-customer-id}/items/{item-id}/`
3. You should see uploaded photos with timestamp prefixes

### Check Airtable
1. Open your Airtable base
2. Go to "Containers" table
3. Find your test item
4. Check "Additional Photos" field contains Dropbox URLs like:
   ```
   https://www.dropbox.com/scl/fi/xxxxx?rlkey=xxxxx&raw=1
   ```

## 🚨 Troubleshooting

### If Upload Fails:
1. **Check browser console** for errors
2. **Check server logs** for detailed error messages
3. **Verify file size** - must be under 10MB
4. **Ensure image format** - must be image/* MIME type

### Common Issues:
- **401 Unauthorized**: Need to login first
- **404 Not Found**: Wrong endpoint (should be `/upload-photo`)
- **500 Server Error**: Check Dropbox token is valid

### Debug Commands:
```bash
# Check if Dropbox token is loaded
grep DROPBOX .env | head -1

# Watch server logs
tail -f dev.log

# Test upload manually
curl -X POST http://localhost:3000/api/items/YOUR_ITEM_ID/upload-photo \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -F "photo=@test.jpg"
```

## 📊 Expected Flow:

1. **Browser** → Selects files
2. **Frontend** → POST to `/api/items/:id/upload-photo`
3. **Backend** → Validates image
4. **Dropbox** → Stores file, returns URL
5. **Airtable** → Updates "Additional Photos" field
6. **Frontend** → Shows uploaded photo

## 🎯 Success Indicators:
- ✅ Photo appears on item card
- ✅ Dropbox has the file
- ✅ Airtable shows URL in "Additional Photos"
- ✅ No errors in console or server logs

---

Ready to test? The Dropbox integration is fully configured and waiting for your photos!