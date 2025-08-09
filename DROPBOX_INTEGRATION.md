# Dropbox Integration Guide

## ✅ Current Status
- Dropbox service is fully implemented
- Access token is configured in `.env`
- Routes are ready for photo uploads
- Airtable stores photo URLs in "Additional Photos" field

## 📸 How Photo Upload Works

### 1. **Item Photos**
- **Endpoint**: `POST /api/items/:itemId/upload-photo`
- **Frontend**: Upload button on item details
- **Storage Path**: `/StorageValet/users/{customerId}/items/{itemId}/{timestamp_filename}`
- **Airtable Field**: "Additional Photos" (comma-separated URLs)

### 2. **Movement Photos**
- **Endpoint**: `POST /api/movements/:movementId/upload-photo`
- **Frontend**: Upload during pickup/delivery
- **Storage Path**: `/StorageValet/users/{customerId}/movements/{movementId}/{pickup|delivery}/{timestamp_filename}`
- **Airtable Field**: Currently not stored in Movements table (needs to be added)

## 🔧 API Usage

### Upload Item Photo
```bash
curl -X POST http://localhost:3000/api/items/{itemId}/upload-photo \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -F "photo=@/path/to/photo.jpg"
```

### Upload Movement Photo
```bash
curl -X POST http://localhost:3000/api/movements/{movementId}/upload-photo \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -F "photo=@/path/to/photo.jpg" \
  -F "type=pickup"  # or "delivery"
```

## 🎯 Testing the Integration

### 1. Test from UI
1. Login to the portal
2. Go to Inventory
3. Click on any item
4. Click "Upload Photo" button
5. Select an image file
6. Verify photo appears

### 2. Check Dropbox
1. Go to https://www.dropbox.com/home/Apps/Storage%20Valet%20Portal
2. Navigate to `/StorageValet/users/{customerId}/items/{itemId}/`
3. Verify photos are uploaded

### 3. Verify in Airtable
1. Open your Airtable base
2. Go to Containers table
3. Find the item
4. Check "Additional Photos" field contains Dropbox URLs

## 📋 Airtable Configuration Needed

### For Movement Photos
The Movements table needs a field to store photos:
1. Add field "Photos" (Long text type)
2. Or use existing "Photos" field if it's attachment type

### Current Field Mappings
- **Items**: 
  - `photoUrls` → "Additional Photos" (Long text, comma-separated URLs)
- **Movements**: 
  - Photos not currently mapped (needs implementation)

## 🔐 Security Features
- 10MB file size limit
- Only image files accepted (image/* MIME types)
- Files stored with timestamp prefix to avoid conflicts
- Public shared links for easy access

## 🚀 Next Steps

### 1. Add Photo Display to UI
Currently photos are uploaded but may not be displayed. Need to:
- Update ItemCard component to show photos
- Add photo carousel for multiple photos
- Show photos in movement details

### 2. Add Movement Photo Storage
Update `toAirtableMovementFields` in storage.ts to save photo URLs

### 3. Add Photo Management
- Delete photos
- Set cover photo
- Reorder photos

## 🛠️ Troubleshooting

### "Dropbox not configured" Error
- Check `.env` has valid `DROPBOX_ACCESS_TOKEN`
- Restart server after updating token

### Upload Fails
- Check file size (max 10MB)
- Ensure it's an image file
- Check console for specific errors

### Photos Not Showing
- Verify URLs are stored in Airtable
- Check browser console for loading errors
- Ensure Dropbox shared links are public

## 📝 Code Locations
- **Service**: `/server/dropbox-service.ts`
- **Routes**: `/server/routes/item-routes.ts`, `/server/routes/movement-routes.ts`
- **Storage**: `/server/storage.ts` (Airtable field mappings)
- **UI Components**: Need to be updated to display photos