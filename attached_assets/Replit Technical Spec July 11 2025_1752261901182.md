# Storage Valet Web App - Replit Technical Specification

_Build a mobile-first storage service web app with customer portal_

## Project Overview

Build a responsive web application for Storage Valet, a pickup/delivery storage service. Users can create accounts, manage their stored items inventory with photos, and schedule pickups/deliveries.

## Tech Stack

- **Frontend**: React with Tailwind CSS
- **Backend**: Node.js/Express
- **Database**: Airtable (existing setup via API)
- **Authentication**: Simple email/password with sessions
- **File Storage**: Dropbox (2TB available)
- **Hosting**: Replit deployment

## Airtable Integration

Use your existing Airtable database via API:

```javascript
// Airtable setup
const Airtable = require("airtable");
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);

// Get user's items
async function getUserItems(email) {
  const records = await base("Containers")
    .select({
      filterByFormula: `{Customer Email} = '${email}'`,
    })
    .all();
  return records.map((r) => r.fields);
}
```

## Dropbox Image Upload

```javascript
// Upload photo to Dropbox
const Dropbox = require("dropbox").Dropbox;
const dbx = new Dropbox({ accessToken: process.env.DROPBOX_TOKEN });

async function uploadImage(fileData, filename) {
  const result = await dbx.filesUpload({
    path: `/storage-valet/${filename}`,
    contents: fileData,
  });

  // Get shareable link
  const link = await dbx.sharingCreateSharedLinkWithSettings({
    path: result.result.path_display,
  });

  return link.result.url.replace("dl=0", "raw=1");
}
```

## Core Features to Build

### 1. Landing Page (`/`)

```jsx
// Components needed:
- Hero section: "Premium Storage That Comes to You"
- How it works (3 steps with icons)
- Pricing cards ($169/$259/$399 per month)
- Service area list
- "Get Started" → signup
- "Customer Login" → login
```

### 2. Authentication Pages

```jsx
// Signup (`/signup`)
- Email, password, first name, last name
- Phone, address
- Plan selection (starter/medium/family)
- Setup fee payment (matches monthly rate)
- Create account → auto-login
- Start 72-hour first pickup timer

// Key Business Logic:
- Setup fee charged immediately (non-refundable)
- Monthly subscription starts on first pickup
- Anniversary billing on pickup date each month

// Login (`/login`)
- Email & password
- "Forgot password" link (Phase 2)
- Login → redirect to dashboard
```

### 3. Customer Dashboard (`/dashboard`)

```jsx
// Layout:
- Header: "Welcome back, [Name]"
- Stats cards:
  - Total items in storage
  - Total value
  - Plan usage (visual meter)
- Quick action buttons:
  - "Add New Item"
  - "Schedule Pickup"
  - "Request Delivery"
- Recent items grid (last 6 items)
```

### 4. Inventory Management (`/inventory`)

```jsx
// Features:
- Grid view of all items with photos
- Each item card shows:
  - Photo (or placeholder)
  - Name
  - Status (at_home/in_storage)
  - Value
- "Add Item" button → modal
- Click item → edit modal

// Add/Edit Item Modal:
- Name (required)
- Description
- Category dropdown
- Estimated value
- Photo upload (convert to base64)
- Save/Cancel
```

### 5. Schedule Pickup (`/schedule-pickup`)

```jsx
// Flow:
1. Show items with status='at_home'
2. Checkbox to select items (NO MINIMUM)
3. Show available time slots:
   - Dynamic based on route capacity
   - Gray out unavailable slots
   - Hide operational complexity
4. Date picker (encourage within 72 hours)
5. Special instructions textarea
6. Emergency contact info displayed
7. Submit button

// Backend must track:
- Total volume/weight per route
- Truck capacity constraints
- Zone-based scheduling
```

### 6. Request Delivery (`/request-delivery`)

```jsx
// Similar to pickup but:
- Show items with status='in_storage'
- Prominent option: "Also scheduling a pickup?"
- If yes, show pickup flow in same booking
- Highlight seasonal rotation benefits
- Same date/time selection
- Note about $24 fee after first free delivery
```

## Design Requirements

### Colors

```css
:root {
  /* Primary */
  --navy: #05445e;
  --teal: #75e6da;
  --teal-dark: #147e93;
  --teal-medium: #46beda;

  /* Neutral */
  --white: #ebfdff;
  --gray: #8b9299; /* regent gray approximation */
  --dark-blue: #3e5c76; /* cloud burst approximation */

  /* Text */
  --text-primary: #05445e;
  --text-secondary: #3e5c76;

  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #ebfdff;

  /* CTA Button */
  --cta-primary: #75e6da;
  --cta-hover: #46beda;
}
```

### Mobile-First Responsive

- Base design for 375px width
- Breakpoints: 640px, 768px, 1024px
- Touch-friendly buttons (min 44px height)
- Large, readable fonts (16px base)

### UI Components

```jsx
// Reusable components:
- Button (primary/secondary variants)
- Card (for pricing, stats, items)
- Modal (for forms)
- Input (with label and error states)
- ItemGrid (responsive grid layout)
```

## API Endpoints

```javascript
// Auth
POST /api/auth/signup
POST /api/auth/login
GET /api/auth/me

// Items
GET /api/items (user's items)
POST /api/items (create item)
PUT /api/items/:id (update item)
DELETE /api/items/:id

// Movements
GET /api/movements (user's movements)
POST /api/movements (schedule pickup/delivery)
GET /api/movements/slots (available time slots by zone)

// Billing
POST /api/billing/retry (webhook from Stripe)
PUT /api/users/:id/status (suspend/reactivate)

// Admin
GET /api/admin/routes (multi-building optimization)
```

## Business Logic Requirements

### Payment Handling

- Failed payment: 3 retry attempts over 7 days
- Service continues during grace period
- Delivery bookings disabled until current
- No late fees (unless habitual - 3+ failures)
- Clear email notifications at each step

### Scheduling Intelligence

- Detect same-building opportunities
- Suggest pickup+delivery combinations
- Promote seasonal rotations in UI
- Track total volume per route
- No hard limits on quantity (case-by-case)

### Referral System

- Referrer gets $50 credit after referee's first pickup
- Prevents gaming while encouraging sharing
- Applied as account credit automatically

### Data & Privacy

- Customer data retained 1 year post-cancellation
- Deletion available upon request
- Comply with privacy regulations
- Inventory photos archived separately

## Implementation Priority

### Day 1-2: Foundation

1. Set up React + Tailwind
2. Create database schema
3. Build authentication (signup/login)
4. Create landing page

### Day 3-4: Core Features

5. Build dashboard layout
6. Implement inventory page
7. Add item creation with photo upload
8. Create schedule pickup flow

### Day 5: Polish & Deploy

9. Add request delivery flow
10. Mobile responsiveness testing
11. Basic error handling
12. Deploy on Replit

## Sample Code Structure

```
/src
  /components
    Button.jsx
    Card.jsx
    ItemCard.jsx
    Modal.jsx
    Navigation.jsx
  /pages
    Landing.jsx
    Login.jsx
    Signup.jsx
    Dashboard.jsx
    Inventory.jsx
    SchedulePickup.jsx
    RequestDelivery.jsx
  /api
    auth.js
    items.js
    movements.js
  App.jsx
  index.js
```

## Quick Start Data

Include 3 sample items for new users:

1. "Winter Coats" - Category: Clothing
2. "Holiday Decorations" - Category: Seasonal
3. "Old Documents" - Category: Documents

## Success Criteria

- User can sign up and log in
- User can add items with photos
- User can view all their items
- User can schedule a pickup
- Mobile responsive on all screens
- Deploys successfully on Replit

**Note**: Focus on core functionality over perfect styling. Get it working first, polish second.
