# Email Integration Guide for Storage Valet

## Overview
The Storage Valet application uses a cost-effective email integration approach that leverages your existing Google Workspace account and Zapier automation.

## How It Works

### 1. Webhook Integration
- When customers schedule pickup/delivery appointments, the application sends structured data to a Zapier webhook
- This webhook triggers a Zap that formats and sends emails using your Google Workspace Gmail account
- No additional email service costs - uses your existing Google Workspace subscription

### 2. Email Templates
The system sends two types of confirmation emails:

#### Pickup Confirmation Template
Subject: `Storage Valet Pickup Confirmation - [CONFIRMATION_NUMBER]`

```
Dear [CUSTOMER_NAME],

Thank you for scheduling a pickup with Storage Valet! We've received your request and are excited to help you store your belongings.

📦 Pickup Details:
• Date: [SCHEDULED_DATE]
• Time: [TIME_SLOT]
• Items: [ITEMS_LIST]
• Confirmation Number: [CONFIRMATION_NUMBER]

📋 Special Instructions:
[SPECIAL_INSTRUCTIONS]

Our team will arrive at your location during the scheduled time slot. Please ensure your items are ready for pickup.

Best regards,
The Storage Valet Team

Questions? Reply to this email or call us at [PHONE_NUMBER]
```

#### Delivery Confirmation Template
Subject: `Storage Valet Delivery Confirmation - [CONFIRMATION_NUMBER]`

```
Dear [CUSTOMER_NAME],

Your Storage Valet delivery has been scheduled! We're preparing your items for return.

🚚 Delivery Details:
• Date: [SCHEDULED_DATE]
• Time: [TIME_SLOT]
• Items: [ITEMS_LIST]
• Confirmation Number: [CONFIRMATION_NUMBER]

📋 Special Instructions:
[SPECIAL_INSTRUCTIONS]

Our team will deliver your items during the scheduled time slot. Please ensure someone is available to receive the delivery.

Best regards,
The Storage Valet Team

Questions? Reply to this email or call us at [PHONE_NUMBER]
```

## Setup Instructions

### 1. Create Zapier Webhook
1. Log in to your Zapier account
2. Create a new Zap with "Webhooks by Zapier" as the trigger
3. Choose "Catch Hook" and copy the webhook URL
4. Set the webhook URL as `ZAPIER_WEBHOOK_URL` environment variable

### 2. Configure Gmail Action
1. Add "Gmail" as the action app in your Zap
2. Choose "Send Email" as the action
3. Map the webhook fields to email template fields:
   - `customerEmail` → To
   - `subject` → Subject
   - Format the body using the template data

### 3. Test the Integration
1. Schedule a test pickup/delivery appointment
2. Check that the webhook receives the data
3. Verify the email is sent from your Gmail account
4. Adjust the email templates as needed

## Data Structure
The application sends this JSON structure to the webhook:

```json
{
  "type": "pickup" | "delivery",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "scheduledDate": "2025-01-15",
  "timeSlot": "9:00 AM - 12:00 PM",
  "items": ["Item 1", "Item 2"],
  "specialInstructions": "Leave at front door",
  "confirmationNumber": "SV-123456-ABC123",
  "subject": "Storage Valet Pickup Confirmation - SV-123456-ABC123",
  "template": "pickup_confirmation",
  "timestamp": "2025-01-11T21:30:00.000Z"
}
```

## Benefits
- **Cost-effective**: Uses existing Google Workspace subscription
- **Reliable**: Gmail's delivery infrastructure
- **Customizable**: Easy to modify templates in Zapier
- **Scalable**: Can handle growing email volume
- **Professional**: Emails sent from your business domain

## Troubleshooting
- If emails aren't sending, check the Zapier webhook URL configuration
- Verify your Gmail integration permissions in Zapier
- Check the application logs for webhook errors
- Test with a simple webhook receiver first to verify data format