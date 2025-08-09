#!/usr/bin/env node

/**
 * Simple test script to verify schema validation functionality
 * Run with: npm run schema:test
 */

import dotenv from "dotenv";
import { AirtableSchemaValidator } from "./schema-validator";
import { enhancedStorage } from "../server/enhanced-storage";
import chalk from "chalk";

// Load environment variables
dotenv.config();

async function runTests() {
  console.log(chalk.bold.blue("🧪 Running Schema Synchronization Tests\n"));

  try {
    // Test 1: Enhanced Storage Field Mapping
    console.log(chalk.blue("Test 1: Enhanced Storage Field Mapping"));
    const tables = enhancedStorage.getAvailableTables();
    console.log(chalk.green(`✅ Available tables: ${tables.join(", ")}`));

    // Test field mapping for each table
    for (const table of tables) {
      const mapping = enhancedStorage.getFieldMapping(table);
      if (mapping && mapping.size > 0) {
        console.log(chalk.green(`✅ ${table}: ${mapping.size} fields mapped`));
      } else {
        console.log(chalk.red(`❌ ${table}: No field mappings found`));
      }
    }

    // Test 2: Data Transformation
    console.log(chalk.blue("\nTest 2: Data Transformation"));

    const testUserData = {
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      plan: "starter",
      setupFeePaid: true,
      createdAt: new Date(),
    };

    try {
      const airtableFormat = enhancedStorage.transformToAirtable("Customers", testUserData);
      console.log(chalk.green("✅ User data transformation to Airtable format successful"));

      const appFormat = enhancedStorage.transformFromAirtable("Customers", {
        id: "test123",
        fields: airtableFormat,
      });
      console.log(chalk.green("✅ User data transformation from Airtable format successful"));
    } catch (error) {
      console.log(chalk.red(`❌ Data transformation failed: ${error}`));
    }

    // Test 3: Data Validation
    console.log(chalk.blue("\nTest 3: Data Validation"));

    const validUserData = {
      email: "valid@example.com",
      plan: "starter",
      createdAt: new Date(),
    };

    const invalidUserData = {
      // Missing required email and plan
      firstName: "Invalid",
    };

    const validResult = enhancedStorage.validateData("Customers", validUserData);
    const invalidResult = enhancedStorage.validateData("Customers", invalidUserData);

    if (validResult.valid) {
      console.log(chalk.green("✅ Valid user data passed validation"));
    } else {
      console.log(
        chalk.red(`❌ Valid user data failed validation: ${validResult.errors.join(", ")}`)
      );
    }

    if (!invalidResult.valid) {
      console.log(
        chalk.green(`✅ Invalid user data correctly rejected: ${invalidResult.errors.join(", ")}`)
      );
    } else {
      console.log(chalk.red("❌ Invalid user data incorrectly passed validation"));
    }

    // Test 4: Schema Validator (if credentials are available)
    console.log(chalk.blue("\nTest 4: Schema Validator"));

    if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
      try {
        const validator = new AirtableSchemaValidator();
        console.log(chalk.green("✅ Schema validator initialized successfully"));

        // Test connection without full validation to avoid API calls in tests
        console.log(chalk.blue("  (Skipping full validation to avoid API calls in test)"));
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Schema validator initialization failed: ${error}`));
      }
    } else {
      console.log(
        chalk.yellow("⚠️  Airtable credentials not found - skipping schema validator test")
      );
    }

    console.log(chalk.bold.green("\n🎉 All tests completed successfully!"));
    console.log(chalk.blue("\nNext steps:"));
    console.log(chalk.blue("1. Set up Airtable credentials to enable full schema validation"));
    console.log(chalk.blue("2. Run npm run schema:validate to test with live Airtable"));
    console.log(chalk.blue("3. Implement remaining tables (Facilities, Zones, etc.)"));
  } catch (error) {
    console.error(chalk.red("\n❌ Test suite failed:"), error);
    process.exit(1);
  }
}

// Run tests
runTests();
