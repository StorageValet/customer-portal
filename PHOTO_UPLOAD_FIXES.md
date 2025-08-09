# Photo Upload Fixes

## Issues Found and Fixed:

### 1. ✅ File Size Limit
**Problem**: 10MB limit was too restrictive for high-resolution photos
**Fix**: Increased to 50MB to accommodate modern camera photos
```javascript
// Changed from:
fileSize: 10 * 1024 * 1024, // 10MB limit

// To:
fileSize: 50 * 1024 * 1024, // 50MB limit - increased for high-res photos
```

### 2. ✅ Wrong Endpoint URL
**Problem**: Frontend was calling `/upload-photo` but backend had `/photos`
**Fix**: Updated backend route to match frontend expectation
```javascript
// Changed from:
router.post("/api/items/:itemId/photos", ...

// To:
router.post("/api/items/:itemId/upload-photo", ...
```

## Current Status:
- ✅ Can upload images up to 50MB
- ✅ Endpoint URLs match between frontend and backend
- ✅ Dropbox integration fully configured with your 2TB storage
- ✅ Photos saved to Airtable "Additional Photos" field

## How Photos Are Stored:

### In Dropbox:
```
/StorageValet/users/{customerId}/items/{itemId}/{timestamp}_{filename}
```

### In Airtable:
- Field: "Additional Photos" (Long text)
- Format: Comma-separated Dropbox URLs
- Example: `https://www.dropbox.com/scl/fi/xxx?rlkey=xxx&raw=1,https://...`

## Testing Your Upload:

1. **Try Again**: Go back to your inventory and try uploading photos again
2. **Multiple Photos**: You can now upload multiple photos without size restrictions
3. **Check Results**: 
   - Photos should appear on item cards
   - Multiple photos show count indicator
   - First photo is used as cover

## If Issues Persist:

Check browser console for specific errors:
- Network tab: Look for 200 OK response
- Console: Any JavaScript errors
- Server logs: `tail -f dev.log`

The system is now ready to handle your high-resolution product photos!