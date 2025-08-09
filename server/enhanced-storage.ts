/**
 * Enhanced Airtable Storage with Dynamic Schema Management
 * This extends the existing storage class with schema validation and dynamic field mapping
 */

import Airtable from "airtable";
import { PRODUCTION_AIRTABLE_SCHEMA, type AirtableSchema } from "../shared/airtable-schema";
import type { User, Item, Movement } from "@shared/schema";

export interface EnhancedFieldMapping {
  appField: string;
  airtableField: string;
  type: "text" | "number" | "date" | "boolean" | "select" | "linkedRecord";
  required: boolean;
  transform?: {
    toAirtable?: (value: any) => any;
    fromAirtable?: (value: any) => any;
  };
}

export interface TableMapping {
  tableName: string;
  fields: Map<string, EnhancedFieldMapping>;
  relationships: Map<
    string,
    {
      targetTable: string;
      type: "oneToMany" | "manyToOne" | "manyToMany";
    }
  >;
}

export class EnhancedAirtableStorage {
  private base: any;
  private schema: AirtableSchema;
  private tableMappings: Map<string, TableMapping> = new Map();
  private fieldMappingCache: Map<string, Map<string, string>> = new Map();

  constructor() {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    // Only require credentials if actually connecting to Airtable
    if (apiKey && baseId) {
      this.base = new Airtable({ apiKey }).base(baseId);
    } else {
      console.warn("Airtable credentials not found - running in test mode");
      this.base = null;
    }

    this.schema = PRODUCTION_AIRTABLE_SCHEMA;

    this.initializeTableMappings();
  }

  /**
   * Initialize table mappings with enhanced field definitions
   */
  private initializeTableMappings(): void {
    // Customers table mapping
    const customersMapping: TableMapping = {
      tableName: "Customers",
      fields: new Map([
        [
          "id",
          {
            appField: "id",
            airtableField: "Customer ID",
            type: "text",
            required: false,
          },
        ],
        [
          "email",
          {
            appField: "email",
            airtableField: "Email",
            type: "text",
            required: true,
          },
        ],
        [
          "passwordHash",
          {
            appField: "passwordHash",
            airtableField: "Password",
            type: "text",
            required: false,
          },
        ],
        [
          "firstName",
          {
            appField: "firstName",
            airtableField: "First Name",
            type: "text",
            required: false,
          },
        ],
        [
          "lastName",
          {
            appField: "lastName",
            airtableField: "Last Name",
            type: "text",
            required: false,
          },
        ],
        [
          "phone",
          {
            appField: "phone",
            airtableField: "Phone",
            type: "text",
            required: false,
          },
        ],
        [
          "address",
          {
            appField: "address",
            airtableField: "Full Address",
            type: "text",
            required: false,
          },
        ],
        [
          "city",
          {
            appField: "city",
            airtableField: "City",
            type: "text",
            required: false,
          },
        ],
        [
          "state",
          {
            appField: "state",
            airtableField: "State",
            type: "text",
            required: false,
          },
        ],
        [
          "zip",
          {
            appField: "zip",
            airtableField: "ZIP Code",
            type: "text",
            required: false,
          },
        ],
        [
          "plan",
          {
            appField: "plan",
            airtableField: "Monthly Plan",
            type: "select",
            required: true,
          },
        ],
        [
          "setupFeePaid",
          {
            appField: "setupFeePaid",
            airtableField: "Setup Fee Paid",
            type: "select",
            required: false,
            transform: {
              toAirtable: (value: boolean) => (value ? "Yes" : "No"),
              fromAirtable: (value: string) => value === "Yes",
            },
          },
        ],
        [
          "stripeCustomerId",
          {
            appField: "stripeCustomerId",
            airtableField: "Stripe Customer ID",
            type: "text",
            required: false,
          },
        ],
        [
          "stripeSubscriptionId",
          {
            appField: "stripeSubscriptionId",
            airtableField: "Stripe Subscription ID",
            type: "text",
            required: false,
          },
        ],
        [
          "referralCode",
          {
            appField: "referralCode",
            airtableField: "Referral Code",
            type: "text",
            required: false,
          },
        ],
        [
          "insuranceCoverage",
          {
            appField: "insuranceCoverage",
            airtableField: "Total Insured Value",
            type: "number",
            required: false,
          },
        ],
        [
          "firstPickupDate",
          {
            appField: "firstPickupDate",
            airtableField: "First Pickup Date",
            type: "date",
            required: false,
            transform: {
              toAirtable: (value: Date | null) =>
                value ? value.toISOString().split("T")[0] : null,
              fromAirtable: (value: string | null) => (value ? new Date(value) : null),
            },
          },
        ],
        [
          "createdAt",
          {
            appField: "createdAt",
            airtableField: "Account Created Date",
            type: "date",
            required: true,
            transform: {
              toAirtable: (value: Date) => value.toISOString().split("T")[0],
              fromAirtable: (value: string) => new Date(value),
            },
          },
        ],
      ]),
      relationships: new Map([
        ["containers", { targetTable: "Containers", type: "oneToMany" }],
        ["movements", { targetTable: "Movements", type: "oneToMany" }],
        ["referrals", { targetTable: "Referrals", type: "oneToMany" }],
      ]),
    };

    // Containers table mapping
    const containersMapping: TableMapping = {
      tableName: "Containers",
      fields: new Map([
        [
          "id",
          {
            appField: "id",
            airtableField: "QR Code",
            type: "text",
            required: true,
          },
        ],
        [
          "userId",
          {
            appField: "userId",
            airtableField: "Customer",
            type: "linkedRecord",
            required: true,
          },
        ],
        [
          "name",
          {
            appField: "name",
            airtableField: "Item Name/Label",
            type: "text",
            required: true,
          },
        ],
        [
          "description",
          {
            appField: "description",
            airtableField: "Description",
            type: "text",
            required: false,
          },
        ],
        [
          "category",
          {
            appField: "category",
            airtableField: "Category Tags",
            type: "text",
            required: false,
          },
        ],
        [
          "status",
          {
            appField: "status",
            airtableField: "Current Status",
            type: "select",
            required: true,
            transform: {
              toAirtable: (value: string) => {
                const statusMap: Record<string, string> = {
                  at_home: "At Home",
                  in_storage: "In Storage",
                  in_transit: "In Transit",
                };
                return statusMap[value] || value;
              },
              fromAirtable: (value: string) => {
                const statusMap: Record<string, string> = {
                  "At Home": "at_home",
                  "In Storage": "in_storage",
                  "In Transit": "in_transit",
                };
                return statusMap[value] || "at_home";
              },
            },
          },
        ],
        [
          "estimatedValue",
          {
            appField: "estimatedValue",
            airtableField: "Estimated Value",
            type: "number",
            required: false,
          },
        ],
        [
          "photoUrls",
          {
            appField: "photoUrls",
            airtableField: "Additional Photos",
            type: "text",
            required: false,
            transform: {
              toAirtable: (value: string[]) => value.join(","),
              fromAirtable: (value: string) =>
                value ? value.split(",").map((url) => url.trim()) : [],
            },
          },
        ],
        [
          "qrCode",
          {
            appField: "qrCode",
            airtableField: "QR String",
            type: "text",
            required: true,
          },
        ],
        [
          "facility",
          {
            appField: "facility",
            airtableField: "Current Location",
            type: "linkedRecord",
            required: false,
          },
        ],
        [
          "lastScannedAt",
          {
            appField: "lastScannedAt",
            airtableField: "Last Movement Date",
            type: "date",
            required: false,
            transform: {
              toAirtable: (value: Date | null) =>
                value ? value.toISOString().split("T")[0] : null,
              fromAirtable: (value: string | null) => (value ? new Date(value) : null),
            },
          },
        ],
        [
          "createdAt",
          {
            appField: "createdAt",
            airtableField: "Created Date",
            type: "date",
            required: true,
            transform: {
              toAirtable: (value: Date) => value.toISOString().split("T")[0],
              fromAirtable: (value: string) => new Date(value),
            },
          },
        ],
      ]),
      relationships: new Map([
        ["customer", { targetTable: "Customers", type: "manyToOne" }],
        ["movements", { targetTable: "Movements", type: "manyToMany" }],
        ["facility", { targetTable: "Facilities", type: "manyToOne" }],
      ]),
    };

    // Movements table mapping
    const movementsMapping: TableMapping = {
      tableName: "Movements",
      fields: new Map([
        [
          "id",
          {
            appField: "id",
            airtableField: "Movement ID",
            type: "text",
            required: false,
          },
        ],
        [
          "userId",
          {
            appField: "userId",
            airtableField: "Customers",
            type: "linkedRecord",
            required: true,
          },
        ],
        [
          "type",
          {
            appField: "type",
            airtableField: "Movement Type",
            type: "select",
            required: true,
            transform: {
              toAirtable: (value: string) => {
                const typeMap: Record<string, string> = {
                  pickup: "Pickup",
                  delivery: "Delivery",
                };
                return typeMap[value] || value;
              },
              fromAirtable: (value: string) => {
                const typeMap: Record<string, string> = {
                  Pickup: "pickup",
                  Delivery: "delivery",
                };
                return typeMap[value] || "pickup";
              },
            },
          },
        ],
        [
          "status",
          {
            appField: "status",
            airtableField: "Status",
            type: "select",
            required: true,
            transform: {
              toAirtable: (value: string) => {
                const statusMap: Record<string, string> = {
                  scheduled: "Scheduled",
                  in_progress: "In Progress",
                  completed: "Completed",
                  cancelled: "Cancelled",
                };
                return statusMap[value] || value;
              },
              fromAirtable: (value: string) => {
                const statusMap: Record<string, string> = {
                  Scheduled: "scheduled",
                  "In Progress": "in_progress",
                  Completed: "completed",
                  Cancelled: "cancelled",
                };
                return statusMap[value] || "scheduled";
              },
            },
          },
        ],
        [
          "scheduledDate",
          {
            appField: "scheduledDate",
            airtableField: "Requested Date",
            type: "date",
            required: true,
            transform: {
              toAirtable: (value: Date) => value.toISOString().split("T")[0],
              fromAirtable: (value: string) => new Date(value),
            },
          },
        ],
        [
          "scheduledTimeSlot",
          {
            appField: "scheduledTimeSlot",
            airtableField: "Time Window",
            type: "select",
            required: false,
          },
        ],
        [
          "itemIds",
          {
            appField: "itemIds",
            airtableField: "Containers",
            type: "linkedRecord",
            required: false,
          },
        ],
        [
          "address",
          {
            appField: "address",
            airtableField: "Service Address",
            type: "text",
            required: true,
          },
        ],
        [
          "specialInstructions",
          {
            appField: "specialInstructions",
            airtableField: "Special Instructions",
            type: "text",
            required: false,
          },
        ],
      ]),
      relationships: new Map([
        ["customer", { targetTable: "Customers", type: "manyToOne" }],
        ["containers", { targetTable: "Containers", type: "manyToMany" }],
      ]),
    };

    this.tableMappings.set("Customers", customersMapping);
    this.tableMappings.set("Containers", containersMapping);
    this.tableMappings.set("Movements", movementsMapping);

    // Build field mapping cache for quick lookup
    this.buildFieldMappingCache();
  }

  /**
   * Build a cache of field mappings for quick lookup
   */
  private buildFieldMappingCache(): void {
    this.tableMappings.forEach((mapping, tableName) => {
      const fieldMap = new Map<string, string>();
      mapping.fields.forEach((fieldMapping, appField) => {
        fieldMap.set(appField, fieldMapping.airtableField);
      });
      this.fieldMappingCache.set(tableName, fieldMap);
    });
  }

  /**
   * Transform data from app format to Airtable format
   */
  public transformToAirtable(tableName: string, data: any): any {
    const mapping = this.tableMappings.get(tableName);
    if (!mapping) {
      throw new Error(`No mapping found for table: ${tableName}`);
    }

    const transformed: any = {};

    for (const [appField, value] of Object.entries(data)) {
      const fieldMapping = mapping.fields.get(appField);
      if (fieldMapping) {
        let transformedValue = value;

        // Apply custom transformation if available
        if (fieldMapping.transform?.toAirtable) {
          transformedValue = fieldMapping.transform.toAirtable(value);
        }

        transformed[fieldMapping.airtableField] = transformedValue;
      }
    }

    return transformed;
  }

  /**
   * Transform data from Airtable format to app format
   */
  public transformFromAirtable(tableName: string, record: any): any {
    const mapping = this.tableMappings.get(tableName);
    if (!mapping) {
      throw new Error(`No mapping found for table: ${tableName}`);
    }

    const transformed: any = { id: record.id };
    const fields = record.fields || record;

    mapping.fields.forEach((fieldMapping, appField) => {
      const airtableValue = fields[fieldMapping.airtableField];
      let transformedValue = airtableValue;

      // Apply custom transformation if available
      if (fieldMapping.transform?.fromAirtable) {
        transformedValue = fieldMapping.transform.fromAirtable(airtableValue);
      }

      transformed[appField] = transformedValue;
    });

    return transformed;
  }

  /**
   * Validate data against field mappings
   */
  public validateData(tableName: string, data: any): { valid: boolean; errors: string[] } {
    const mapping = this.tableMappings.get(tableName);
    if (!mapping) {
      return { valid: false, errors: [`No mapping found for table: ${tableName}`] };
    }

    const errors: string[] = [];

    // Check required fields
    mapping.fields.forEach((fieldMapping, appField) => {
      if (fieldMapping.required && (data[appField] === undefined || data[appField] === null)) {
        errors.push(`Required field '${appField}' is missing`);
      }
    });

    // Type validation could be added here

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get field mapping for a table
   */
  public getFieldMapping(tableName: string): Map<string, string> | undefined {
    return this.fieldMappingCache.get(tableName);
  }

  /**
   * Get all available tables
   */
  public getAvailableTables(): string[] {
    return Array.from(this.tableMappings.keys());
  }

  /**
   * Check if a table is implemented
   */
  public isTableImplemented(tableName: string): boolean {
    return this.tableMappings.has(tableName);
  }

  /**
   * Get schema for a specific table
   */
  public getTableSchema(tableName: string): TableMapping | undefined {
    return this.tableMappings.get(tableName);
  }

  /**
   * Update schema and rebuild mappings
   */
  public async updateSchema(newSchema: AirtableSchema): Promise<void> {
    this.schema = newSchema;
    // In a full implementation, this would rebuild mappings based on new schema
    console.log("Schema updated - mappings would be rebuilt here");
  }
}

// Export for use in other modules
export const enhancedStorage = new EnhancedAirtableStorage();
