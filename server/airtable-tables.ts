/**
 * Airtable Table Names - Single Source of Truth
 * Updated for simplified schema - August 2025
 */

export const TABLES = {
  // New simplified schema (4 tables - v7)
  CUSTOMERS: 'Customers_v7',
  ITEMS: 'Items_v7',
  ACTIONS: 'Actions_v7',
  OPERATIONS: 'Ops_v7',
  
  // OLD TABLES - TO BE REMOVED
  // Keep these temporarily for migration
  OLD_CONTAINERS: 'Containers',
  OLD_MOVEMENTS: 'Movements',
  OLD_SESSIONS: 'Sessions',
} as const;

export type TableName = typeof TABLES[keyof typeof TABLES];

// Field mappings for new schema
export const CUSTOMER_FIELDS = {
  // Identity
  EMAIL: 'Email',
  PASSWORD_HASH: 'Password Hash',
  FIRST_NAME: 'First Name',
  LAST_NAME: 'Last Name',
  PHONE: 'Phone',
  
  // Address
  SERVICE_ADDRESS: 'Service Address',
  ZIP_CODE: 'ZIP Code',
  
  // Plan & Usage
  MONTHLY_PLAN: 'Monthly Plan',
  PLAN_CUBIC_FEET: 'Plan Cubic Feet',
  PLAN_INSURANCE: 'Plan Insurance',
  USED_CUBIC_FEET: 'Used Cubic Feet',
  USED_INSURANCE: 'Used Insurance',
  TOTAL_WEIGHT_LBS: 'Total Weight Lbs',
  ACTIVE_ITEMS_COUNT: 'Active Items Count',
  
  // Stripe
  STRIPE_CUSTOMER_ID: 'Stripe Customer ID',
  STRIPE_SUBSCRIPTION_ID: 'Stripe Subscription ID',
  STRIPE_PAYMENT_METHOD: 'Stripe Payment Method',
  
  // Setup Fee
  SETUP_FEE_PAID: 'Setup Fee Paid',
  SETUP_FEE_AMOUNT: 'Setup Fee Amount',
  SETUP_FEE_WAIVED_BY: 'Setup Fee Waived By',
  
  // Billing
  BILLING_START_DATE: 'Billing Start Date',
  SUBSCRIPTION_STATUS: 'Subscription Status',
} as const;

export const ITEM_FIELDS = {
  // Identity
  CUSTOMER: 'Customer',
  QR_CODE: 'QR Code',
  
  // Description
  ITEM_NAME: 'Item Name',
  DESCRIPTION: 'Description',
  CATEGORY: 'Category',
  
  // Dimensions (CRITICAL)
  LENGTH_INCHES: 'Length Inches',
  WIDTH_INCHES: 'Width Inches',
  HEIGHT_INCHES: 'Height Inches',
  CUBIC_FEET: 'Cubic Feet',
  WEIGHT_LBS: 'Weight Lbs',
  ESTIMATED_VALUE: 'Estimated Value',
  
  // Container
  CONTAINER_TYPE: 'Container Type',
  IS_SV_CONTAINER: 'Is SV Container',
  
  // Status
  STATUS: 'Status',
  STORAGE_LOCATION: 'Storage Location',
  PHOTO_URLS: 'Photo URLs',
  
  // Dates
  PICKUP_DATE: 'Pickup Date',
  LAST_ACCESSED: 'Last Accessed',
  
  // Advanced Return Scheduling
  RETURN_DELIVERY_SCHEDULED: 'Return Delivery Scheduled',
  RETURN_DELIVERY_DATE: 'Return Delivery Date',
  RETURN_DELIVERY_ACTION_ID: 'Return Delivery Action',
} as const;

export const ACTION_FIELDS = {
  // Identity
  CUSTOMER: 'Customer',
  TYPE: 'Type',
  STATUS: 'Status',
  
  // Scheduling
  SCHEDULED_DATE: 'Scheduled Date',
  TIME_WINDOW: 'Time Window',
  
  // Items & Capacity
  ITEMS: 'Items',
  TOTAL_CUBIC_FEET: 'Total Cubic Feet',
  TOTAL_WEIGHT: 'Total Weight',
  ITEM_COUNT: 'Item Count',
  
  // Route
  ROUTE_ID: 'Route ID',
  STOP_NUMBER: 'Stop Number',
  
  // Service
  SERVICE_ADDRESS: 'Service Address',
  SPECIAL_INSTRUCTIONS: 'Special Instructions',
  
  // Completion
  COMPLETED_AT: 'Completed At',
  DRIVER_NOTES: 'Driver Notes',
  TRIGGERS_BILLING: 'Triggers Billing',
} as const;

export const OPERATION_FIELDS = {
  TYPE: 'Type',
  CUSTOMER: 'Customer',
  ACTION: 'Action',
  PRIORITY: 'Priority',
  ACTION_REQUIRED: 'Action Required',
  DUE_DATE: 'Due Date',
  STATUS: 'Status',
  ASSIGNED_TO: 'Assigned To',
  NOTES: 'Notes',
  COMPLETED_AT: 'Completed At',
} as const;