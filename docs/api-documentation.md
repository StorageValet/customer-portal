# Storage Valet Portal API Documentation

## Overview

The Storage Valet Portal API is a RESTful service that provides endpoints for managing customer accounts, items, movements (pickups/deliveries), payments, and integrations. The API uses session-based authentication with Airtable as the primary data store.

## Authentication & Session Management

### Session Configuration
- **Store**: AirtableSessionStore (persistent) or MemoryStore (fallback)
- **Secret**: `SESSION_SECRET` environment variable
- **Duration**: 30 days
- **Security**: HttpOnly cookies, secure flag in production

### Authentication Middleware
Protected routes require authentication via session. Unauthenticated requests return:
```json
{
  "message": "Authentication required"
}
```

### Public Routes (No Authentication Required)
- `/api/auth/*` - Authentication endpoints
- `/api/softr/*` - Softr integration webhooks
- `/api/health` - Health check
- `/api/validate-promo` - Promo code validation
- `/api/test-email` - Email testing

---

## Authentication Endpoints

### GET /api/auth/user
Get current authenticated user information.

**Authentication**: Required

**Response**:
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "plan": "starter",
  "setupFeePaid": true,
  "stripeCustomerId": "cus_xxx",
  "insuranceCoverage": 2000,
  // ... other user fields
}
```

**Error Responses**:
- `401` - Authentication required
- `500` - Failed to fetch user data

### POST /api/auth/login
Authenticate user with email and password.

**Authentication**: None (rate limited)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    // ... other user fields (excluding passwordHash)
  }
}
```

**Error Responses**:
- `400` - Invalid input
- `401` - Invalid email or password
- `500` - Login failed

### POST /api/auth/signup
Create new user account.

**Authentication**: None (rate limited)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John", // optional
  "lastName": "Doe", // optional
  "phone": "+1234567890", // optional
  "address": "123 Main St", // optional
  "plan": "starter", // optional, defaults to "starter"
  "referralCode": "PROMO2024" // optional
}
```

**Response**:
```json
{
  "user": { /* user object */ },
  "message": "Account created successfully!"
}
```

**Error Responses**:
- `400` - Email already registered or invalid input
- `500` - Failed to create account

### POST /api/auth/forgot-password
Request password reset email.

**Authentication**: None (rate limited)

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "message": "If the email exists, a reset link has been sent."
}
```

### POST /api/auth/reset-password
Reset password using token from email.

**Authentication**: None

**Request Body**:
```json
{
  "token": "reset_token_from_email",
  "password": "newpassword123"
}
```

**Response**:
```json
{
  "message": "Password reset successfully"
}
```

**Error Responses**:
- `400` - Invalid or expired reset token

### POST /api/auth/magic-link
Request magic link for passwordless authentication.

**Authentication**: None

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "message": "If the email exists, a magic link has been sent."
}
```

### GET /api/auth/magic-login
Verify magic link and authenticate user (redirects to dashboard).

**Authentication**: None

**Query Parameters**:
- `token` - Magic link token from email

**Response**: Redirects to `/dashboard` on success, `/login?error=...` on failure

### POST /api/auth/logout
Logout current user.

**Authentication**: Required

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

### GET /api/auth/preferences/:email
Get authentication preferences for email (used by SSO).

**Authentication**: None

**Parameters**:
- `email` - User email address

**Response**:
```json
{
  "email": "user@example.com",
  "preferredAuthMethod": "password",
  "hasPassword": true,
  "isNewUser": false,
  "firstName": "John",
  "lastName": "Doe"
}
```

---

## Item Management Endpoints

### GET /api/items
Get all items for authenticated user.

**Authentication**: Required

**Response**:
```json
[
  {
    "id": "item_id",
    "userId": "user_id",
    "name": "Dining Table",
    "description": "Wooden dining table",
    "category": "Furniture",
    "estimatedValue": 500,
    "photoUrls": ["https://url1.com", "https://url2.com"],
    "coverPhotoIndex": 0,
    "qrCode": "QR123456",
    "status": "in_storage",
    "length": 72,
    "width": 36,
    "height": 30,
    "weight": 100,
    "facility": "Warehouse A",
    "zone": "Zone 1",
    "rack": "R-15",
    "shelf": "S-3",
    "lastScannedAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T09:00:00Z"
  }
]
```

### POST /api/items
Create new item.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Dining Table",
  "description": "Wooden dining table", // optional
  "category": "Furniture",
  "estimatedValue": 500,
  "photoUrls": [], // optional, defaults to []
  "coverPhotoIndex": 0, // optional, defaults to 0
  "qrCode": "QR123456", // optional
  "status": "at_home", // optional, defaults to "at_home"
  "length": 72, // optional, defaults to 12
  "width": 36, // optional, defaults to 12
  "height": 30, // optional, defaults to 12
  "weight": 100, // optional, defaults to 10
  "facility": "Warehouse A", // optional
  "zone": "Zone 1", // optional
  "rack": "R-15", // optional
  "shelf": "S-3" // optional
}
```

**Response**: Created item object

**Error Responses**:
- `400` - Invalid input
- `500` - Failed to create item

### PUT /api/items/:id
Update existing item.

**Authentication**: Required

**Parameters**:
- `id` - Item ID

**Request Body**: Partial item object with fields to update

**Response**: Updated item object

**Error Responses**:
- `404` - Item not found
- `500` - Failed to update item

### DELETE /api/items/:id
Delete item.

**Authentication**: Required

**Parameters**:
- `id` - Item ID

**Response**:
```json
{
  "message": "Item deleted successfully"
}
```

**Error Responses**:
- `404` - Item not found
- `500` - Failed to delete item

### DELETE /api/items/bulk-delete
Delete multiple items.

**Authentication**: Required

**Request Body**:
```json
{
  "itemIds": ["item1", "item2", "item3"]
}
```

**Response**:
```json
{
  "message": "3 items deleted successfully",
  "deletedCount": 3
}
```

**Error Responses**:
- `400` - Invalid request body
- `500` - Failed to bulk delete items

### PUT /api/items/bulk/status
Update status for multiple items.

**Authentication**: Required

**Request Body**:
```json
{
  "itemIds": ["item1", "item2", "item3"],
  "status": "in_storage"
}
```

**Response**:
```json
{
  "message": "3 items updated successfully",
  "updatedCount": 3
}
```

**Error Responses**:
- `400` - Invalid request body or status
- `500` - Failed to bulk update items

### POST /api/items/:itemId/photos
Upload photo for item.

**Authentication**: Required (with upload rate limiting)

**Parameters**:
- `itemId` - Item ID

**Request**: Multipart form data with `photo` file

**Response**:
```json
{
  "photoUrl": "https://dropbox.com/photo.jpg",
  "path": "/customer_123/items/item_456/photo.jpg",
  "name": "photo.jpg",
  "size": 1024
}
```

**Error Responses**:
- `400` - No file uploaded
- `404` - Item not found
- `500` - Failed to upload photo

### DELETE /api/items/:itemId/photos
Delete photo from item.

**Authentication**: Required

**Parameters**:
- `itemId` - Item ID

**Request Body**:
```json
{
  "photoUrl": "https://dropbox.com/photo.jpg"
}
```

**Response**:
```json
{
  "message": "Photo deleted successfully"
}
```

### GET /api/items/:itemId/photos
Get all photos for item.

**Authentication**: Required

**Parameters**:
- `itemId` - Item ID

**Response**:
```json
{
  "photos": ["https://url1.com", "https://url2.com"]
}
```

---

## Movement Management Endpoints

### GET /api/movements
Get all movements for authenticated user.

**Authentication**: Required

**Response**:
```json
[
  {
    "id": "movement_id",
    "userId": "user_id",
    "type": "pickup",
    "status": "scheduled",
    "scheduledDate": "2024-01-15T00:00:00Z",
    "scheduledTimeSlot": "Morning (9-12 PM)",
    "itemIds": ["item1", "item2"],
    "address": "123 Main St",
    "specialInstructions": "Ring doorbell twice",
    "totalVolume": 100.5,
    "totalWeight": 150.0,
    "truckSize": "medium",
    "estimatedDuration": 120,
    "createdAt": "2024-01-01T09:00:00Z"
  }
]
```

### POST /api/movements
Create new movement (pickup or delivery).

**Authentication**: Required

**Request Body**:
```json
{
  "type": "pickup",
  "scheduledDate": "2024-01-15",
  "scheduledTimeSlot": "Morning (9-12 PM)",
  "itemIds": ["item1", "item2"],
  "address": "123 Main St",
  "specialInstructions": "Ring doorbell twice", // optional
  "totalVolume": 100.5, // optional
  "totalWeight": 150.0, // optional
  "truckSize": "medium", // optional
  "estimatedDuration": 120 // optional (minutes)
}
```

**Response**: Created movement object

**Side Effects**:
- Sends confirmation email to customer
- For pickups: triggers subscription creation on first completed pickup

**Error Responses**:
- `500` - Failed to create movement

### PUT /api/movements/:id/status
Update movement status.

**Authentication**: Required

**Parameters**:
- `id` - Movement ID

**Request Body**:
```json
{
  "status": "completed"
}
```

**Response**:
```json
{
  "message": "Movement status updated",
  "status": "completed"
}
```

**Side Effects**:
- If first pickup marked as completed: creates Stripe subscription and updates user's `firstPickupDate`

**Error Responses**:
- `404` - Movement not found
- `500` - Failed to update movement status

### POST /api/movements/:movementId/photos
Upload photo for movement.

**Authentication**: Required

**Parameters**:
- `movementId` - Movement ID

**Request**: Multipart form data with `photo` file and `type` field

**Request Body** (form data):
- `photo` - Image file
- `type` - "pickup" or "delivery"

**Response**:
```json
{
  "photoUrl": "https://dropbox.com/photo.jpg",
  "path": "/customer_123/movements/movement_456/pickup/photo.jpg",
  "name": "photo.jpg",
  "size": 1024,
  "type": "pickup"
}
```

**Error Responses**:
- `400` - No file uploaded or invalid type
- `404` - Movement not found
- `500` - Failed to upload photo

---

## Payment Endpoints

### POST /api/create-payment-intent
Create Stripe payment intent for setup fee.

**Authentication**: Required

**Request Body**:
```json
{
  "amount": 99.50,
  "couponCode": "PROMO2024" // optional
}
```

**Response**:
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "finalAmount": 99.50,
  "originalAmount": 99.50,
  "appliedCoupon": "PROMO2024"
}
```

**Error Responses**:
- `404` - User not found
- `500` - Error creating payment intent

### POST /api/create-subscription
Create monthly subscription (called after first pickup).

**Authentication**: Required

**Response**:
```json
{
  "subscriptionId": "sub_xxx",
  "message": "Monthly subscription created successfully"
}
```

**Error Responses**:
- `400` - User already has subscription
- `404` - User not found
- `500` - Error creating subscription

### GET /api/subscription-status
Get current subscription status.

**Authentication**: Required

**Response**:
```json
{
  "hasSubscription": true,
  "status": "active",
  "plan": "starter",
  "currentPeriodEnd": 1640995200,
  "cancelAtPeriodEnd": false
}
```

### POST /api/update-payment-method
Update customer's default payment method.

**Authentication**: Required

**Request Body**:
```json
{
  "paymentMethodId": "pm_xxx"
}
```

**Response**:
```json
{
  "message": "Payment method updated successfully"
}
```

### POST /api/cancel-subscription
Cancel subscription.

**Authentication**: Required

**Request Body**:
```json
{
  "immediate": false // optional, defaults to false
}
```

**Response**:
```json
{
  "message": "Subscription will be cancelled at the end of the billing period"
}
```

### POST /api/validate-promo
Validate promo/coupon code.

**Authentication**: None

**Request Body**:
```json
{
  "code": "PROMO2024"
}
```

**Response**:
```json
{
  "valid": true,
  "message": "Valid promo code! Setup fee will be waived.",
  "waivesSetupFee": true,
  "percentOff": 100,
  "amountOff": null
}
```

---

## Admin Endpoints

All admin endpoints require authentication and admin email verification.

**Admin Emails**: `admin@mystoragevalet.com`, `carol@example.com`

### GET /api/admin/settings
Get admin settings configuration.

**Authentication**: Required (Admin only)

**Response**:
```json
{
  "pricing": {
    "starter": { "monthly": 199, "setup": 99.5 },
    "medium": { "monthly": 299, "setup": 149.5 },
    "family": { "monthly": 349, "setup": 174.5 }
  },
  "insurance": {
    "starter": 2000,
    "medium": 3000,
    "family": 4000
  },
  "calendar": {
    "availableDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "timeSlots": [
      {
        "id": "morning",
        "label": "Morning (9-12 PM)",
        "startTime": "09:00",
        "endTime": "12:00",
        "weekendOnly": false,
        "premium": false
      }
      // ... more time slots
    ],
    "advanceBookingDays": 7,
    "emergencyBookingEnabled": true
  },
  "referralCredits": {
    "newCustomerCredit": 50,
    "referrerCredit": 50,
    "enabled": true
  },
  "serviceAreas": {
    "primaryZones": ["Downtown", "Midtown", "Uptown"],
    "extendedZones": ["Suburbs North", "Suburbs South"],
    "rushDeliveryZones": ["Downtown", "Midtown"]
  }
}
```

### PUT /api/admin/settings
Update admin settings.

**Authentication**: Required (Admin only)

**Request Body**: Settings object to update

**Response**:
```json
{
  "message": "Settings updated successfully"
}
```

### POST /api/setup-test-data
Setup test data for development.

**Authentication**: Required (Admin only)

**Response**:
```json
{
  "success": true,
  "message": "Test data setup complete"
}
```

### GET /api/admin/users
Get all users (admin view).

**Authentication**: Required (Admin only)

**Response**:
```json
[
  {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "plan": "starter",
    "createdAt": "2024-01-01T09:00:00Z",
    "setupFeePaid": true,
    "stripeCustomerId": "cus_xxx",
    "stripeSubscriptionId": "sub_xxx"
  }
]
```

### GET /api/admin/stats
Get system statistics.

**Authentication**: Required (Admin only)

**Response**:
```json
{
  "totalUsers": 0,
  "activeSubscriptions": 0,
  "totalItems": 0,
  "totalMovements": 0,
  "revenueThisMonth": 0,
  "newUsersThisMonth": 0
}
```

---

## Integration Endpoints

### POST /api/test-email
Send test email (used for testing email integration).

**Authentication**: Required

**Request Body**:
```json
{
  "email": "test@example.com",
  "type": "welcome" // "welcome", "pickup", or "delivery"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Test welcome email sent successfully"
}
```

### POST /api/ai-chat
Get AI assistant response.

**Authentication**: Required

**Request Body**:
```json
{
  "message": "How many items do I have?",
  "currentPage": "dashboard" // optional
}
```

**Response**:
```json
{
  "response": "You currently have 15 items in your Storage Valet account..."
}
```

### POST /api/ai-categorize
Get AI-suggested category for item.

**Authentication**: Required

**Request Body**:
```json
{
  "itemName": "Dining Table",
  "description": "Wooden dining table with 6 chairs" // optional
}
```

**Response**:
```json
{
  "category": "Furniture"
}
```

### GET /api/debug-users
Debug endpoint to check specific user accounts.

**Authentication**: Required

**Response**:
```json
{
  "users": [
    {
      "email": "test@example.com",
      "found": true,
      "id": "user_123",
      "firstName": "Test"
    }
  ]
}
```

### Softr Integration Webhooks

#### POST /api/softr/customer-created
Handle customer creation from Softr.

**Authentication**: None (webhook)

#### POST /api/softr/plan-updated
Handle plan updates from Softr.

**Authentication**: None (webhook)

#### POST /api/softr/payment-updated
Handle payment updates from Softr.

**Authentication**: None (webhook)

#### GET /api/softr/health
Health check for Softr integration.

**Authentication**: None

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "storage-valet-portal"
}
```

### POST /api/chat (Legacy)
Legacy chat endpoint (redirects to AI chat).

**Authentication**: Required

**Request Body**:
```json
{
  "message": "Hello",
  "context": {} // optional
}
```

**Response**:
```json
{
  "response": "I understand you're asking about: \"Hello\". As your Storage Valet concierge..."
}
```

---

## Utility Endpoints

### GET /api/health
System health check.

**Authentication**: None

**Response**:
```json
{
  "status": "healthy"
}
```

### GET /api/logout (Legacy)
Legacy logout endpoint (redirects to login).

**Authentication**: None

**Response**: Redirects to `/login`

---

## Error Handling

### Standard Error Response Format
```json
{
  "message": "Error description",
  "errors": [ /* validation errors if applicable */ ]
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Rate Limiting
- **Auth endpoints**: Rate limited to prevent brute force attacks
- **Upload endpoints**: Rate limited to prevent abuse
- Rate limit headers included in responses

---

## Data Models

### User Object
```typescript
interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  plan: string; // "starter", "medium", "family"
  setupFeePaid: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  referralCode: string | null;
  insuranceCoverage: number;
  firstPickupDate: Date | null;
  preferredAuthMethod: string;
  lastAuthMethod: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Item Object
```typescript
interface Item {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  category: string;
  estimatedValue: number;
  photoUrls: string[];
  coverPhotoIndex: number;
  qrCode: string;
  status: "at_home" | "in_storage";
  length: number;
  width: number;
  height: number;
  weight: number;
  facility: string | null;
  zone: string | null;
  rack: string | null;
  shelf: string | null;
  lastScannedAt: Date | null;
  createdAt: Date;
}
```

### Movement Object
```typescript
interface Movement {
  id: string;
  userId: string;
  type: "pickup" | "delivery";
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduledDate: Date;
  scheduledTimeSlot: string;
  itemIds: string[];
  address: string;
  specialInstructions: string | null;
  totalVolume: number | null;
  totalWeight: number | null;
  truckSize: string | null;
  estimatedDuration: number | null;
  createdAt: Date;
}
```

---

## Environment Variables Required

```bash
# Session Management
SESSION_SECRET=your_session_secret

# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com

# Dropbox Configuration
DROPBOX_ACCESS_TOKEN=your_dropbox_access_token

# Application Configuration
APP_URL=https://yourdomain.com
NODE_ENV=production
```

---

## SDK Usage Examples

### JavaScript Fetch Examples

#### Login
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});
const data = await response.json();
```

#### Create Item
```javascript
const response = await fetch('/api/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Dining Table',
    category: 'Furniture',
    estimatedValue: 500,
    length: 72,
    width: 36,
    height: 30,
    weight: 100
  })
});
const item = await response.json();
```

#### Upload Photo
```javascript
const formData = new FormData();
formData.append('photo', file);

const response = await fetch(`/api/items/${itemId}/photos`, {
  method: 'POST',
  body: formData
});
const result = await response.json();
```

This API documentation provides a comprehensive reference for all endpoints in the Storage Valet Portal system, including authentication, data management, payments, and integrations.