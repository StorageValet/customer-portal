import { z } from "zod";

// Complete Airtable Schema Definitions based on production schema

export interface AirtableFieldDefinition {
  type:
    | "text"
    | "number"
    | "date"
    | "boolean"
    | "singleSelect"
    | "multipleSelect"
    | "attachment"
    | "linkedRecord"
    | "email"
    | "phone"
    | "currency"
    | "autoNumber";
  required: boolean;
  linkedTo?: string; // For linked records
  options?: string[]; // For select fields
  description: string;
}

export interface AirtableTableSchema {
  name: string;
  fields: Record<string, AirtableFieldDefinition>;
  relationships: Record<
    string,
    {
      targetTable: string;
      type: "oneToMany" | "manyToOne" | "manyToMany";
    }
  >;
}

export interface AirtableSchema {
  version: string;
  lastUpdated: Date;
  tables: Record<string, AirtableTableSchema>;
}

// Complete production schema definition
export const PRODUCTION_AIRTABLE_SCHEMA: AirtableSchema = {
  version: "2025-08-03",
  lastUpdated: new Date("2025-07-27"),
  tables: {
    Customers: {
      name: "Customers",
      fields: {
        "Customer ID": {
          type: "autoNumber",
          required: true,
          description: "Unique customer identifier",
        },
        "First Name": { type: "text", required: true, description: "Customer first name" },
        "Last Name": { type: "text", required: true, description: "Customer last name" },
        "Full Name": { type: "text", required: false, description: "Computed full name" },
        Email: { type: "email", required: true, description: "Customer email address" },
        Phone: { type: "phone", required: false, description: "Customer phone number" },
        Password: { type: "text", required: false, description: "Hashed password" },
        "Street Address": { type: "text", required: false, description: "Street address" },
        "Unit/Apt": { type: "text", required: false, description: "Unit or apartment number" },
        City: { type: "text", required: false, description: "City" },
        State: { type: "text", required: false, description: "State" },
        "ZIP Code": { type: "text", required: false, description: "ZIP code" },
        "Full Address": { type: "text", required: false, description: "Complete address" },
        "Building/Property": {
          type: "linkedRecord",
          required: false,
          linkedTo: "Properties",
          description: "Associated property",
        },
        "Monthly Plan": {
          type: "singleSelect",
          required: true,
          options: ["starter", "medium", "family", "custom"],
          description: "Customer plan type",
        },
        "Billing Mode": {
          type: "singleSelect",
          required: false,
          options: ["monthly", "annual"],
          description: "Billing frequency",
        },
        "Referral Code": { type: "text", required: false, description: "Customer referral code" },
        "Referred By": {
          type: "linkedRecord",
          required: false,
          linkedTo: "Referrals",
          description: "Referral record",
        },
        "Referrer Customer": {
          type: "linkedRecord",
          required: false,
          linkedTo: "Customers",
          description: "Referring customer",
        },
        "Acquisition Source": {
          type: "singleSelect",
          required: false,
          options: ["organic", "referral", "ads", "partnership"],
          description: "How customer found service",
        },
        "Account Status": {
          type: "singleSelect",
          required: true,
          options: ["active", "paused", "cancelled"],
          description: "Account status",
        },
        "Setup Fee Paid": {
          type: "singleSelect",
          required: false,
          options: ["Yes", "No"],
          description: "Setup fee payment status",
        },
        "First Pickup Date": { type: "date", required: false, description: "Date of first pickup" },
        "Subscription Start Date": {
          type: "date",
          required: false,
          description: "Subscription start date",
        },
        "Insurance Tier": {
          type: "singleSelect",
          required: false,
          options: ["basic", "premium"],
          description: "Insurance coverage level",
        },
        "Total Insured Value": {
          type: "currency",
          required: false,
          description: "Total insurance coverage amount",
        },
        "Account Created Date": {
          type: "date",
          required: true,
          description: "Account creation date",
        },
        "Stripe Customer ID": {
          type: "text",
          required: false,
          description: "Stripe customer identifier",
        },
        "Stripe Setup Payment ID": {
          type: "text",
          required: false,
          description: "Stripe setup payment identifier",
        },
        "Stripe Subscription ID": {
          type: "text",
          required: false,
          description: "Stripe subscription identifier",
        },
        "Container Count": { type: "number", required: false, description: "Number of containers" },
        "Total Referrals Made": {
          type: "number",
          required: false,
          description: "Number of successful referrals",
        },
        "Agreement Signed": {
          type: "boolean",
          required: false,
          description: "Service agreement status",
        },
        "Agreement Date": {
          type: "date",
          required: false,
          description: "Agreement signature date",
        },
        "Container Delivery Preference": {
          type: "singleSelect",
          required: false,
          options: ["pickup", "delivery"],
          description: "Preferred delivery method",
        },
        "Container Delivery Status": {
          type: "singleSelect",
          required: false,
          options: ["pending", "delivered", "returned"],
          description: "Container delivery status",
        },
        "À la Carte Selections": {
          type: "multipleSelect",
          required: false,
          description: "Additional services selected",
        },
        "Last sign-in": { type: "date", required: false, description: "Last portal login date" },
      },
      relationships: {
        Movements: { targetTable: "Movements", type: "oneToMany" },
        Containers: { targetTable: "Containers", type: "oneToMany" },
        Referrals: { targetTable: "Referrals", type: "oneToMany" },
        Notifications: { targetTable: "Notifications", type: "oneToMany" },
      },
    },
    Containers: {
      name: "Containers",
      fields: {
        "QR Code": { type: "text", required: true, description: "QR code identifier" },
        "QR String": { type: "text", required: true, description: "QR code string value" },
        Customer: {
          type: "linkedRecord",
          required: true,
          linkedTo: "Customers",
          description: "Container owner",
        },
        "Customer First Name": {
          type: "text",
          required: false,
          description: "Owner first name (computed)",
        },
        "Customer Last Name": {
          type: "text",
          required: false,
          description: "Owner last name (computed)",
        },
        "Customer Email": { type: "email", required: false, description: "Owner email (computed)" },
        "Container Type": {
          type: "linkedRecord",
          required: false,
          linkedTo: "Container Types",
          description: "Type of container",
        },
        "Item Name/Label": { type: "text", required: true, description: "Item name or label" },
        Description: { type: "text", required: false, description: "Item description" },
        "Category Tags": {
          type: "multipleSelect",
          required: false,
          description: "Item category tags",
        },
        "Primary Photo": { type: "attachment", required: false, description: "Main item photo" },
        "Additional Photos": {
          type: "text",
          required: false,
          description: "Additional photo URLs",
        },
        "Estimated Value": {
          type: "currency",
          required: false,
          description: "Estimated item value",
        },
        "Photo Required": {
          type: "boolean",
          required: false,
          description: "Whether photo is required",
        },
        Fragile: { type: "boolean", required: false, description: "Fragile item flag" },
        "Current Status": {
          type: "singleSelect",
          required: true,
          options: ["At Home", "In Storage", "In Transit"],
          description: "Current item status",
        },
        "Current Location": {
          type: "linkedRecord",
          required: false,
          linkedTo: "Facilities",
          description: "Current storage location",
        },
        "Storage Start Date": {
          type: "date",
          required: false,
          description: "Date item entered storage",
        },
        "Last Movement Date": { type: "date", required: false, description: "Last movement date" },
        "Access Frequency Score": {
          type: "number",
          required: false,
          description: "How often item is accessed",
        },
        Stackable: { type: "boolean", required: false, description: "Whether item can be stacked" },
        "Special Instructions": {
          type: "text",
          required: false,
          description: "Special handling instructions",
        },
        "Created Date": { type: "date", required: true, description: "Record creation date" },
        Facility: {
          type: "linkedRecord",
          required: false,
          linkedTo: "Facilities",
          description: "Storage facility",
        },
        "Specialty ID": { type: "text", required: false, description: "Special item identifier" },
        "Anticipated Return Delivery Date": {
          type: "date",
          required: false,
          description: "Expected return date",
        },
        "Approval Status": {
          type: "singleSelect",
          required: false,
          options: ["pending", "approved", "rejected"],
          description: "Item approval status",
        },
        "Approval Notes": { type: "text", required: false, description: "Approval notes" },
        "Approved By": { type: "text", required: false, description: "Approver name" },
        "Approval Date": { type: "date", required: false, description: "Approval date" },
        "Special Handling Fee": {
          type: "currency",
          required: false,
          description: "Additional handling fee",
        },
        "QR Image URL": { type: "text", required: false, description: "QR code image URL" },
        "QR Image": { type: "attachment", required: false, description: "QR code image" },
      },
      relationships: {
        Customer: { targetTable: "Customers", type: "manyToOne" },
        Movements: { targetTable: "Movements", type: "manyToMany" },
        Facility: { targetTable: "Facilities", type: "manyToOne" },
        "Container Type": { targetTable: "Container Types", type: "manyToOne" },
      },
    },
    Movements: {
      name: "Movements",
      fields: {
        "Movement ID": {
          type: "autoNumber",
          required: true,
          description: "Unique movement identifier",
        },
        "Movement Type": {
          type: "singleSelect",
          required: true,
          options: ["Pickup", "Delivery", "Internal Move"],
          description: "Type of movement",
        },
        "Requested Date": { type: "date", required: true, description: "Requested service date" },
        "Time Window": {
          type: "singleSelect",
          required: false,
          options: ["Morning", "Afternoon", "Evening"],
          description: "Preferred time window",
        },
        Status: {
          type: "singleSelect",
          required: true,
          options: ["Scheduled", "In Progress", "Completed", "Cancelled"],
          description: "Movement status",
        },
        "Container Count": { type: "number", required: false, description: "Number of containers" },
        "Empty Containers Requested": {
          type: "number",
          required: false,
          description: "Number of empty containers needed",
        },
        "Special Instructions": {
          type: "text",
          required: false,
          description: "Special instructions",
        },
        "Driver/Team": { type: "text", required: false, description: "Assigned driver or team" },
        Customers: {
          type: "linkedRecord",
          required: true,
          linkedTo: "Customers",
          description: "Associated customers",
        },
        "Confirmed Date/Time": {
          type: "date",
          required: false,
          description: "Confirmed service date/time",
        },
        "Service Address": { type: "text", required: true, description: "Service address" },
        "Started At / Completed At": {
          type: "text",
          required: false,
          description: "Service timing",
        },
        "Driver Notes": { type: "text", required: false, description: "Driver notes" },
        Photos: { type: "attachment", required: false, description: "Movement photos" },
        "Grouping ID": { type: "text", required: false, description: "Movement group identifier" },
        Containers: {
          type: "linkedRecord",
          required: false,
          linkedTo: "Containers",
          description: "Associated containers",
        },
        Autonumber: { type: "autoNumber", required: false, description: "Auto-generated number" },
      },
      relationships: {
        Customers: { targetTable: "Customers", type: "manyToOne" },
        Containers: { targetTable: "Containers", type: "manyToMany" },
        Notifications: { targetTable: "Notifications", type: "oneToMany" },
      },
    },
    "Container Types": {
      name: "Container Types",
      fields: {
        "Type ID": { type: "autoNumber", required: true, description: "Unique type identifier" },
        "Type Name": { type: "text", required: true, description: "Container type name" },
        Category: {
          type: "singleSelect",
          required: false,
          options: ["Small", "Medium", "Large", "Specialty"],
          description: "Container category",
        },
        Dimensions: { type: "text", required: false, description: "Container dimensions" },
        "Volume (cubic ft)": { type: "number", required: false, description: "Container volume" },
        "Max Weight (lbs)": {
          type: "number",
          required: false,
          description: "Maximum weight capacity",
        },
        "A la Carte Price": {
          type: "currency",
          required: false,
          description: "Individual pricing",
        },
        Image: { type: "attachment", required: false, description: "Container type image" },
        Active: { type: "boolean", required: false, description: "Whether type is active" },
        ID: { type: "text", required: false, description: "Alternative identifier" },
        "BTB Price": {
          type: "currency",
          required: false,
          description: "Business-to-business pricing",
        },
      },
      relationships: {
        Containers: { targetTable: "Containers", type: "oneToMany" },
      },
    },
    Facilities: {
      name: "Facilities",
      fields: {
        "Facility ID": {
          type: "autoNumber",
          required: true,
          description: "Unique facility identifier",
        },
        "Facility Name": { type: "text", required: true, description: "Facility name" },
        "Facility Type": {
          type: "singleSelect",
          required: false,
          options: ["Primary", "Secondary", "Temporary"],
          description: "Facility type",
        },
        Address: { type: "text", required: true, description: "Facility address" },
        "Total Sq Ft": { type: "number", required: false, description: "Total square footage" },
        Cost: { type: "currency", required: false, description: "Facility cost" },
        "Autopay Date": { type: "date", required: false, description: "Autopay date" },
        Info: { type: "text", required: false, description: "Additional information" },
        "Access Hours": { type: "text", required: false, description: "Facility access hours" },
        "Active Status": {
          type: "boolean",
          required: false,
          description: "Whether facility is active",
        },
        "Total Cu Ft": { type: "number", required: false, description: "Total cubic footage" },
        "Unit Number": { type: "text", required: false, description: "Unit number" },
        "Width (ft)": { type: "number", required: false, description: "Facility width" },
        "Depth (ft)": { type: "number", required: false, description: "Facility depth" },
        "Height (ft)": { type: "number", required: false, description: "Facility height" },
        "Cost/Sq Ft": { type: "currency", required: false, description: "Cost per square foot" },
        "Cost/Cu Ft": { type: "currency", required: false, description: "Cost per cubic foot" },
        "Next Charge Date": { type: "date", required: false, description: "Next billing date" },
      },
      relationships: {
        Zones: { targetTable: "Zones", type: "oneToMany" },
        Containers: { targetTable: "Containers", type: "oneToMany" },
        Customers: { targetTable: "Customers", type: "manyToMany" },
      },
    },
    Zones: {
      name: "Zones",
      fields: {
        "Zone ID": { type: "autoNumber", required: true, description: "Unique zone identifier" },
        "Zone Number": { type: "text", required: true, description: "Zone number" },
        "Zone Access Level": {
          type: "singleSelect",
          required: false,
          options: ["Public", "Restricted", "Private"],
          description: "Access level",
        },
        Notes: { type: "text", required: false, description: "Zone notes" },
        "Sq. Ft.": { type: "number", required: false, description: "Zone square footage" },
        "Cu. Ft.": { type: "number", required: false, description: "Zone cubic footage" },
        "Current Capacity": {
          type: "number",
          required: false,
          description: "Current capacity usage",
        },
        Facility: {
          type: "linkedRecord",
          required: true,
          linkedTo: "Facilities",
          description: "Parent facility",
        },
        "Facility Name": { type: "text", required: false, description: "Facility name (computed)" },
        "Max Containers": {
          type: "number",
          required: false,
          description: "Maximum container capacity",
        },
        "Container Count": {
          type: "number",
          required: false,
          description: "Current container count",
        },
      },
      relationships: {
        Facility: { targetTable: "Facilities", type: "manyToOne" },
        Containers: { targetTable: "Containers", type: "oneToMany" },
      },
    },
    Properties: {
      name: "Properties",
      fields: {
        "Property ID": {
          type: "autoNumber",
          required: true,
          description: "Unique property identifier",
        },
        "Property Name": { type: "text", required: true, description: "Property name" },
        "Management Company": {
          type: "text",
          required: false,
          description: "Management company name",
        },
        "Full Address": { type: "text", required: true, description: "Property address" },
        "Partnership Status": {
          type: "singleSelect",
          required: false,
          options: ["Active", "Pending", "Inactive"],
          description: "Partnership status",
        },
        "Partnership Start Date": {
          type: "date",
          required: false,
          description: "Partnership start date",
        },
        "Special Terms": {
          type: "text",
          required: false,
          description: "Special partnership terms",
        },
        "Promo Code": {
          type: "text",
          required: false,
          description: "Property-specific promo code",
        },
        "Total Units": { type: "number", required: false, description: "Total units in property" },
        Notes: { type: "text", required: false, description: "Additional notes" },
        "Management Company Website": {
          type: "text",
          required: false,
          description: "Management company website",
        },
        ID: { type: "text", required: false, description: "Alternative identifier" },
      },
      relationships: {
        Customers: { targetTable: "Customers", type: "oneToMany" },
      },
    },
    "Promo Codes": {
      name: "Promo Codes",
      fields: {
        Code: { type: "text", required: true, description: "Promo code" },
        Type: {
          type: "singleSelect",
          required: true,
          options: ["Discount", "Free Setup", "Free Month"],
          description: "Promo type",
        },
        "Value Type": {
          type: "singleSelect",
          required: false,
          options: ["Percentage", "Fixed Amount"],
          description: "Value type",
        },
        "Value Amount": { type: "number", required: false, description: "Discount value" },
        "Valid From": { type: "date", required: false, description: "Valid from date" },
        "Valid Until": { type: "date", required: false, description: "Valid until date" },
        "Max Uses": { type: "number", required: false, description: "Maximum uses allowed" },
        "Times Used": { type: "number", required: false, description: "Times used so far" },
        "Associated Building": {
          type: "linkedRecord",
          required: false,
          linkedTo: "Properties",
          description: "Associated property",
        },
        "Campaign Name": { type: "text", required: false, description: "Marketing campaign name" },
        Active: { type: "boolean", required: false, description: "Whether promo is active" },
      },
      relationships: {
        "Associated Building": { targetTable: "Properties", type: "manyToOne" },
      },
    },
    Referrals: {
      name: "Referrals",
      fields: {
        "Referral ID": {
          type: "autoNumber",
          required: true,
          description: "Unique referral identifier",
        },
        Referrer: {
          type: "linkedRecord",
          required: true,
          linkedTo: "Customers",
          description: "Referring customer",
        },
        "Referrer Code Used": { type: "text", required: false, description: "Referral code used" },
        "Referred Email": { type: "email", required: true, description: "Referred customer email" },
        "Referred Customer": {
          type: "linkedRecord",
          required: false,
          linkedTo: "Customers",
          description: "Referred customer record",
        },
        "Referral Date": { type: "date", required: true, description: "Referral date" },
        Status: {
          type: "singleSelect",
          required: true,
          options: ["Pending", "Converted", "Expired"],
          description: "Referral status",
        },
        "Conversion Date": { type: "date", required: false, description: "Conversion date" },
        "Referrer Reward": {
          type: "currency",
          required: false,
          description: "Referrer reward amount",
        },
        "Referred Reward": {
          type: "currency",
          required: false,
          description: "Referred customer reward",
        },
        "Referrer Credit Applied": {
          type: "boolean",
          required: false,
          description: "Whether referrer credit was applied",
        },
        "Referred Discount Applied": {
          type: "boolean",
          required: false,
          description: "Whether referred discount was applied",
        },
      },
      relationships: {
        Referrer: { targetTable: "Customers", type: "manyToOne" },
        "Referred Customer": { targetTable: "Customers", type: "manyToOne" },
      },
    },
    Notifications: {
      name: "Notifications",
      fields: {
        "Notification ID": {
          type: "autoNumber",
          required: true,
          description: "Unique notification identifier",
        },
        Customer: {
          type: "linkedRecord",
          required: true,
          linkedTo: "Customers",
          description: "Target customer",
        },
        Type: {
          type: "singleSelect",
          required: true,
          options: ["Email", "SMS", "Push"],
          description: "Notification type",
        },
        Subject: { type: "text", required: true, description: "Notification subject" },
        Message: { type: "text", required: true, description: "Notification message" },
        "Send Method": {
          type: "singleSelect",
          required: false,
          options: ["Immediate", "Scheduled", "Triggered"],
          description: "Send method",
        },
        "Scheduled Send Time": {
          type: "date",
          required: false,
          description: "Scheduled send time",
        },
        "Sent Time": { type: "date", required: false, description: "Actual send time" },
        Status: {
          type: "singleSelect",
          required: true,
          options: ["Pending", "Sent", "Failed"],
          description: "Notification status",
        },
        "Related Movement": {
          type: "linkedRecord",
          required: false,
          linkedTo: "Movements",
          description: "Related movement",
        },
        "Related Container": {
          type: "linkedRecord",
          required: false,
          linkedTo: "Containers",
          description: "Related container",
        },
      },
      relationships: {
        Customer: { targetTable: "Customers", type: "manyToOne" },
        "Related Movement": { targetTable: "Movements", type: "manyToOne" },
        "Related Container": { targetTable: "Containers", type: "manyToOne" },
      },
    },
    Waitlist: {
      name: "Waitlist",
      fields: {
        "Waitlist ID": {
          type: "autoNumber",
          required: true,
          description: "Unique waitlist identifier",
        },
        "First Name": { type: "text", required: true, description: "First name" },
        "Last Name": { type: "text", required: true, description: "Last name" },
        Email: { type: "email", required: true, description: "Email address" },
        Phone: { type: "phone", required: false, description: "Phone number" },
        "ZIP Code": { type: "text", required: false, description: "ZIP code" },
        City: { type: "text", required: false, description: "City" },
        "What to Store": { type: "text", required: false, description: "What they want to store" },
        "Referral Code Used": { type: "text", required: false, description: "Referral code used" },
        "Submission Date": {
          type: "date",
          required: true,
          description: "Waitlist submission date",
        },
        Status: {
          type: "singleSelect",
          required: true,
          options: ["Active", "Contacted", "Converted", "Inactive"],
          description: "Waitlist status",
        },
        Notes: { type: "text", required: false, description: "Additional notes" },
      },
      relationships: {},
    },
  },
};

// Validation schemas for each table
export const CustomerSchema = z.object({
  "Customer ID": z.number().optional(),
  "First Name": z.string().min(1),
  "Last Name": z.string().min(1),
  Email: z.string().email(),
  Phone: z.string().optional(),
  Password: z.string().optional(),
  "Monthly Plan": z.enum(["starter", "medium", "family", "custom"]),
  "Account Status": z.enum(["active", "paused", "cancelled"]).default("active"),
  "Setup Fee Paid": z.enum(["Yes", "No"]).optional(),
  "Total Insured Value": z.number().optional(),
  "Account Created Date": z.date(),
  // ... add all other fields
});

export const ContainerSchema = z.object({
  "QR Code": z.string().min(1),
  "QR String": z.string().min(1),
  Customer: z.string(), // Airtable record ID
  "Item Name/Label": z.string().min(1),
  Description: z.string().optional(),
  "Current Status": z.enum(["At Home", "In Storage", "In Transit"]),
  "Estimated Value": z.number().optional(),
  "Created Date": z.date(),
  // ... add all other fields
});

export const MovementSchema = z.object({
  "Movement ID": z.number().optional(),
  "Movement Type": z.enum(["Pickup", "Delivery", "Internal Move"]),
  "Requested Date": z.date(),
  Status: z.enum(["Scheduled", "In Progress", "Completed", "Cancelled"]),
  Customers: z.array(z.string()), // Array of Airtable record IDs
  "Service Address": z.string().min(1),
  // ... add all other fields
});

// Type exports for use throughout the application
export type Customer = z.infer<typeof CustomerSchema>;
export type Container = z.infer<typeof ContainerSchema>;
export type Movement = z.infer<typeof MovementSchema>;
