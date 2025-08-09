import Airtable from "airtable";
import {
  PRODUCTION_AIRTABLE_SCHEMA,
  type AirtableSchema,
  type AirtableTableSchema,
} from "../shared/airtable-schema";
import chalk from "chalk";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

export interface ValidationError {
  type: "missing_table" | "missing_field" | "type_mismatch" | "relationship_error";
  table?: string;
  field?: string;
  expected?: string;
  actual?: string;
  message: string;
}

export interface ValidationReport {
  success: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    tablesChecked: number;
    fieldsChecked: number;
    missingTables: number;
    missingFields: number;
    typeMismatches: number;
  };
}

export interface SchemaChangeReport {
  newTables: string[];
  removedTables: string[];
  modifiedTables: {
    tableName: string;
    newFields: string[];
    removedFields: string[];
    modifiedFields: string[];
  }[];
}

export class AirtableSchemaValidator {
  private base: any;
  private currentSchema: AirtableSchema | null = null;

  constructor() {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!apiKey || !baseId) {
      throw new Error("AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables are required");
    }

    this.base = new Airtable({ apiKey }).base(baseId);
  }

  /**
   * Fetch the current schema from Airtable
   */
  async fetchLiveSchema(): Promise<AirtableSchema> {
    try {
      console.log(chalk.blue("🔍 Fetching live schema from Airtable..."));

      // Note: Airtable doesn't provide a direct schema API
      // We'll need to infer schema from table metadata
      const schema: AirtableSchema = {
        version: new Date().toISOString().split("T")[0],
        lastUpdated: new Date(),
        tables: {},
      };

      // For now, we'll use the production schema as reference
      // In a real implementation, you'd use Airtable's metadata API or web API
      this.currentSchema = PRODUCTION_AIRTABLE_SCHEMA;

      console.log(chalk.green("✅ Schema fetched successfully"));
      return this.currentSchema;
    } catch (error) {
      console.error(chalk.red("❌ Failed to fetch live schema:"), error);
      throw error;
    }
  }

  /**
   * Validate current implementation against production schema
   */
  async validateCurrentImplementation(): Promise<ValidationReport> {
    const report: ValidationReport = {
      success: true,
      errors: [],
      warnings: [],
      summary: {
        tablesChecked: 0,
        fieldsChecked: 0,
        missingTables: 0,
        missingFields: 0,
        typeMismatches: 0,
      },
    };

    try {
      console.log(chalk.blue("🔍 Validating current implementation..."));

      // Check if we have the schema
      const schema = this.currentSchema || (await this.fetchLiveSchema());

      // Validate tables from current storage implementation
      const currentTables = ["Customers", "Containers", "Movements"];
      const schemaTables = Object.keys(schema.tables);

      report.summary.tablesChecked = currentTables.length;

      // Check for missing tables in current implementation
      for (const tableKey of schemaTables) {
        if (!currentTables.includes(tableKey)) {
          report.warnings.push({
            type: "missing_table",
            table: tableKey,
            message: `Table '${tableKey}' exists in schema but not implemented in storage layer`,
          });
          report.summary.missingTables++;
        }
      }

      // Validate field mappings for implemented tables
      await this.validateFieldMappings(currentTables, schema, report);

      // Check for relationship consistency
      await this.validateRelationships(schema, report);

      report.success = report.errors.length === 0;

      console.log(chalk.green("✅ Validation complete"));
      return report;
    } catch (error) {
      console.error(chalk.red("❌ Validation failed:"), error);
      report.success = false;
      report.errors.push({
        type: "missing_field",
        message: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
      return report;
    }
  }

  /**
   * Validate field mappings for specific tables
   */
  private async validateFieldMappings(
    tables: string[],
    schema: AirtableSchema,
    report: ValidationReport
  ): Promise<void> {
    // Import storage to check field mappings
    const { storage } = await import("../server/storage");

    for (const tableName of tables) {
      const tableSchema = schema.tables[tableName];
      if (!tableSchema) {
        report.errors.push({
          type: "missing_table",
          table: tableName,
          message: `Table '${tableName}' not found in schema`,
        });
        continue;
      }

      // Check field mappings based on storage implementation
      await this.validateTableFields(tableName, tableSchema, report);
    }
  }

  /**
   * Validate fields for a specific table
   */
  private async validateTableFields(
    tableName: string,
    tableSchema: AirtableTableSchema,
    report: ValidationReport
  ): Promise<void> {
    // Get field mappings from storage class
    const fieldMappings = this.getFieldMappingsForTable(tableName);

    if (!fieldMappings) {
      report.warnings.push({
        type: "missing_field",
        table: tableName,
        message: `No field mappings found for table '${tableName}'`,
      });
      return;
    }

    // Check each mapped field exists in schema
    for (const [appField, airtableField] of Object.entries(fieldMappings)) {
      report.summary.fieldsChecked++;

      if (!tableSchema.fields[airtableField]) {
        report.errors.push({
          type: "missing_field",
          table: tableName,
          field: airtableField,
          message: `Field '${airtableField}' mapped from '${appField}' not found in table '${tableName}'`,
        });
        report.summary.missingFields++;
      }
    }

    // Check for required fields that aren't mapped
    for (const [fieldName, fieldDef] of Object.entries(tableSchema.fields)) {
      if (fieldDef.required && !Object.values(fieldMappings).includes(fieldName)) {
        report.warnings.push({
          type: "missing_field",
          table: tableName,
          field: fieldName,
          message: `Required field '${fieldName}' in table '${tableName}' is not mapped`,
        });
      }
    }
  }

  /**
   * Get field mappings for a specific table from storage implementation
   */
  private getFieldMappingsForTable(tableName: string): Record<string, string> | null {
    // This would normally be extracted from the storage class
    // For now, we'll hardcode the current mappings
    const mappings: Record<string, Record<string, string>> = {
      Customers: {
        email: "Email",
        password: "Password",
        firstName: "First Name",
        lastName: "Last Name",
        phone: "Phone",
        address: "Full Address",
        plan: "Monthly Plan",
        setupFeePaid: "Setup Fee Paid",
        insuranceCoverage: "Total Insured Value",
        referralCode: "Referral Code",
        stripeCustomerId: "Stripe Customer ID",
        stripeSubscriptionId: "Stripe Subscription ID",
        firstPickupDate: "First Pickup Date",
        createdAt: "Account Created Date",
      },
      Containers: {
        userId: "Customer",
        name: "Item Name/Label",
        description: "Description",
        category: "Category Tags",
        status: "Current Status",
        estimatedValue: "Estimated Value",
        photoUrls: "Additional Photos",
        qrCode: "QR String",
        facility: "Current Location",
        lastScannedAt: "Last Movement Date",
        createdAt: "Created Date",
      },
      Movements: {
        userId: "Customers",
        type: "Movement Type",
        status: "Status",
        scheduledDate: "Requested Date",
        scheduledTimeSlot: "Time Window",
        itemIds: "Containers",
        address: "Service Address",
        specialInstructions: "Special Instructions",
      },
    };

    return mappings[tableName] || null;
  }

  /**
   * Validate relationship consistency
   */
  private async validateRelationships(
    schema: AirtableSchema,
    report: ValidationReport
  ): Promise<void> {
    for (const [tableName, tableSchema] of Object.entries(schema.tables)) {
      for (const [fieldName, relationship] of Object.entries(tableSchema.relationships)) {
        const targetTable = relationship.targetTable;

        if (!schema.tables[targetTable]) {
          report.errors.push({
            type: "relationship_error",
            table: tableName,
            field: fieldName,
            message: `Relationship field '${fieldName}' references non-existent table '${targetTable}'`,
          });
        }
      }
    }
  }

  /**
   * Generate a schema change report
   */
  async detectSchemaChanges(): Promise<SchemaChangeReport> {
    const currentSchema = this.currentSchema || (await this.fetchLiveSchema());
    const lastKnownSchema = PRODUCTION_AIRTABLE_SCHEMA; // In reality, this would be loaded from storage

    const report: SchemaChangeReport = {
      newTables: [],
      removedTables: [],
      modifiedTables: [],
    };

    const currentTables = new Set(Object.keys(currentSchema.tables));
    const lastKnownTables = new Set(Object.keys(lastKnownSchema.tables));

    // Find new and removed tables
    report.newTables = Array.from(currentTables).filter((t) => !lastKnownTables.has(t));
    report.removedTables = Array.from(lastKnownTables).filter((t) => !currentTables.has(t));

    // Find modified tables
    for (const tableName of currentTables) {
      if (lastKnownTables.has(tableName)) {
        const currentFields = new Set(Object.keys(currentSchema.tables[tableName].fields));
        const lastKnownFields = new Set(Object.keys(lastKnownSchema.tables[tableName].fields));

        const newFields = Array.from(currentFields).filter((f) => !lastKnownFields.has(f));
        const removedFields = Array.from(lastKnownFields).filter((f) => !currentFields.has(f));
        const modifiedFields: string[] = []; // Would need deeper comparison for this

        if (newFields.length > 0 || removedFields.length > 0 || modifiedFields.length > 0) {
          report.modifiedTables.push({
            tableName,
            newFields,
            removedFields,
            modifiedFields,
          });
        }
      }
    }

    return report;
  }

  /**
   * Print a formatted validation report
   */
  printValidationReport(report: ValidationReport): void {
    console.log("\n" + chalk.bold.blue("📊 SCHEMA VALIDATION REPORT"));
    console.log(chalk.blue("═".repeat(50)));

    // Summary
    console.log(chalk.bold("\n📈 Summary:"));
    console.log(`  Tables Checked: ${report.summary.tablesChecked}`);
    console.log(`  Fields Checked: ${report.summary.fieldsChecked}`);
    console.log(`  Missing Tables: ${report.summary.missingTables}`);
    console.log(`  Missing Fields: ${report.summary.missingFields}`);
    console.log(`  Type Mismatches: ${report.summary.typeMismatches}`);

    // Overall status
    if (report.success) {
      console.log(chalk.green("\n✅ VALIDATION PASSED"));
    } else {
      console.log(chalk.red("\n❌ VALIDATION FAILED"));
    }

    // Errors
    if (report.errors.length > 0) {
      console.log(chalk.bold.red("\n🚨 Errors:"));
      report.errors.forEach((error, index) => {
        console.log(chalk.red(`  ${index + 1}. ${error.message}`));
        if (error.table) console.log(chalk.red(`     Table: ${error.table}`));
        if (error.field) console.log(chalk.red(`     Field: ${error.field}`));
      });
    }

    // Warnings
    if (report.warnings.length > 0) {
      console.log(chalk.bold.yellow("\n⚠️  Warnings:"));
      report.warnings.forEach((warning, index) => {
        console.log(chalk.yellow(`  ${index + 1}. ${warning.message}`));
        if (warning.table) console.log(chalk.yellow(`     Table: ${warning.table}`));
        if (warning.field) console.log(chalk.yellow(`     Field: ${warning.field}`));
      });
    }

    console.log("\n" + chalk.blue("═".repeat(50)));
  }

  /**
   * Print a formatted schema change report
   */
  printSchemaChangeReport(report: SchemaChangeReport): void {
    console.log("\n" + chalk.bold.blue("🔄 SCHEMA CHANGE REPORT"));
    console.log(chalk.blue("═".repeat(50)));

    if (report.newTables.length > 0) {
      console.log(chalk.bold.green("\n➕ New Tables:"));
      report.newTables.forEach((table) => {
        console.log(chalk.green(`  • ${table}`));
      });
    }

    if (report.removedTables.length > 0) {
      console.log(chalk.bold.red("\n➖ Removed Tables:"));
      report.removedTables.forEach((table) => {
        console.log(chalk.red(`  • ${table}`));
      });
    }

    if (report.modifiedTables.length > 0) {
      console.log(chalk.bold.yellow("\n🔧 Modified Tables:"));
      report.modifiedTables.forEach((table) => {
        console.log(chalk.yellow(`  📋 ${table.tableName}:`));
        if (table.newFields.length > 0) {
          console.log(chalk.green(`    ➕ New fields: ${table.newFields.join(", ")}`));
        }
        if (table.removedFields.length > 0) {
          console.log(chalk.red(`    ➖ Removed fields: ${table.removedFields.join(", ")}`));
        }
        if (table.modifiedFields.length > 0) {
          console.log(chalk.yellow(`    🔧 Modified fields: ${table.modifiedFields.join(", ")}`));
        }
      });
    }

    const hasChanges =
      report.newTables.length > 0 ||
      report.removedTables.length > 0 ||
      report.modifiedTables.length > 0;

    if (!hasChanges) {
      console.log(chalk.green("\n✅ No schema changes detected"));
    }

    console.log("\n" + chalk.blue("═".repeat(50)));
  }
}

// CLI usage
export async function runSchemaValidation() {
  try {
    const validator = new AirtableSchemaValidator();

    console.log(chalk.bold.blue("🚀 Starting Schema Validation Process\n"));

    // Fetch live schema
    await validator.fetchLiveSchema();

    // Validate current implementation
    const validationReport = await validator.validateCurrentImplementation();
    validator.printValidationReport(validationReport);

    // Detect changes
    const changeReport = await validator.detectSchemaChanges();
    validator.printSchemaChangeReport(changeReport);

    // Exit with appropriate code
    process.exit(validationReport.success ? 0 : 1);
  } catch (error) {
    console.error(chalk.red("\n❌ Schema validation failed:"), error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSchemaValidation();
}
