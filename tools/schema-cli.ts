#!/usr/bin/env node

/**
 * Schema Synchronization CLI Tool
 * Provides commands to validate, sync, and manage Airtable schema
 */

import { Command } from "commander";
import { AirtableSchemaValidator } from "./schema-validator";
import chalk from "chalk";

const program = new Command();

program.name("schema-sync").description("Airtable Schema Synchronization Tool").version("1.0.0");

// Validate command
program
  .command("validate")
  .description("Validate current implementation against Airtable schema")
  .action(async () => {
    try {
      console.log(chalk.bold.blue("🔍 Starting schema validation...\n"));

      const validator = new AirtableSchemaValidator();
      await validator.fetchLiveSchema();

      const report = await validator.validateCurrentImplementation();
      validator.printValidationReport(report);

      process.exit(report.success ? 0 : 1);
    } catch (error) {
      console.error(chalk.red("❌ Validation failed:"), error);
      process.exit(1);
    }
  });

// Check changes command
program
  .command("changes")
  .description("Detect schema changes since last update")
  .action(async () => {
    try {
      console.log(chalk.bold.blue("🔄 Checking for schema changes...\n"));

      const validator = new AirtableSchemaValidator();
      await validator.fetchLiveSchema();

      const report = await validator.detectSchemaChanges();
      validator.printSchemaChangeReport(report);
    } catch (error) {
      console.error(chalk.red("❌ Change detection failed:"), error);
      process.exit(1);
    }
  });

// Status command
program
  .command("status")
  .description("Show current schema synchronization status")
  .action(async () => {
    try {
      console.log(chalk.bold.blue("📊 Schema Status Report\n"));

      const validator = new AirtableSchemaValidator();
      await validator.fetchLiveSchema();

      // Run both validation and change detection
      const validationReport = await validator.validateCurrentImplementation();
      const changeReport = await validator.detectSchemaChanges();

      validator.printValidationReport(validationReport);
      validator.printSchemaChangeReport(changeReport);

      // Summary
      console.log(chalk.bold.blue("\n📋 Status Summary:"));
      if (validationReport.success) {
        console.log(chalk.green("  ✅ Schema validation: PASSED"));
      } else {
        console.log(chalk.red("  ❌ Schema validation: FAILED"));
      }

      const hasChanges =
        changeReport.newTables.length > 0 ||
        changeReport.removedTables.length > 0 ||
        changeReport.modifiedTables.length > 0;

      if (hasChanges) {
        console.log(chalk.yellow("  ⚠️  Schema changes: DETECTED"));
      } else {
        console.log(chalk.green("  ✅ Schema changes: NONE"));
      }
    } catch (error) {
      console.error(chalk.red("❌ Status check failed:"), error);
      process.exit(1);
    }
  });

// Test connection command
program
  .command("test")
  .description("Test Airtable connection and basic schema access")
  .action(async () => {
    try {
      console.log(chalk.bold.blue("🔌 Testing Airtable connection...\n"));

      const validator = new AirtableSchemaValidator();
      await validator.fetchLiveSchema();

      console.log(chalk.green("✅ Connection successful!"));
      console.log(chalk.green("✅ Schema access working!"));
    } catch (error) {
      console.error(chalk.red("❌ Connection test failed:"), error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
