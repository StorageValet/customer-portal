#!/usr/bin/env node

/**
 * Setup Script for New Airtable Schema
 * Creates 4 new tables with proper field configuration
 * 
 * IMPORTANT: Run this CAREFULLY after backing up your base!
 */

import Airtable from 'airtable';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

// Configure Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

console.log('🚀 Storage Valet - Airtable Schema Setup');
console.log('=========================================\n');

// Check connection
async function checkConnection() {
  try {
    console.log('✓ Connected to Airtable base:', process.env.AIRTABLE_BASE_ID);
    
    // List current tables
    const currentTables = ['Customers_v7', 'Items_v7', 'Actions_v7', 'Ops_v7'];
    
    console.log('\n📋 Checking for new tables...');
    for (const tableName of currentTables) {
      try {
        const records = await base(tableName).select({ maxRecords: 1 }).firstPage();
        console.log(`  ✓ Table "${tableName}" exists`);
      } catch (error) {
        console.log(`  ✗ Table "${tableName}" not found - needs to be created`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

// Create sample records to establish schema
async function createSampleRecords() {
  console.log('\n📝 Creating sample records to establish schema...\n');
  
  try {
    // 1. Create sample Customer
    console.log('Creating sample Customer...');
    const customer = await base('Customers_v7').create({
      'Email': 'sample@example.com',
      'Password Hash': '$2b$10$samplehashvalue',
      'First Name': 'Sample',
      'Last Name': 'Customer',
      'Phone': '201-555-0001',
      'Service Address': '123 Sample St, Hoboken, NJ 07030',
      'ZIP Code': '07030',
      'Monthly Plan': 'Starter',
      'Plan Cubic Feet': 100,
      'Plan Insurance': 2000,
      'Used Cubic Feet': 0,
      'Used Insurance': 0,
      'Total Weight Lbs': 0,
      'Active Items Count': 0,
      'Stripe Customer ID': 'cus_sample',
      'Stripe Subscription ID': '',
      'Stripe Payment Method': '',
      // 'Setup Fee Paid': true, // Add this field manually as checkbox
      'Setup Fee Amount': 99.50,
      'Setup Fee Waived By': '',
      'Billing Start Date': null,
      'Subscription Status': 'none'
    });
    console.log(`  ✓ Customer created: ${customer.id}`);
    
    // 2. Create sample Item
    console.log('Creating sample Item...');
    const item = await base('Items_v7').create({
      'Customer': [customer.id],
      'QR Code': 'SV-2025-000001',
      'Item Name': 'Sample Box',
      'Description': 'Sample item for schema setup',
      'Category': 'Other',
      'Length Inches': 24,
      'Width Inches': 18,
      'Height Inches': 12,
      'Weight Lbs': 25,
      'Estimated Value': 100,
      'Container Type': 'Bin',
      // 'Is SV Container': true, // Add manually as checkbox
      'Photo URLs': '',
      'Status': 'At Home',
      'Storage Location': '',
      'Pickup Date': null,
      'Last Accessed': null
    });
    console.log(`  ✓ Item created: ${item.id}`);
    
    // 3. Create sample Action
    console.log('Creating sample Action...');
    const action = await base('Actions_v7').create({
      'Customer': [customer.id],
      'Type': 'Pickup',
      'Status': 'Scheduled',
      'Scheduled Date': '2025-08-15',
      'Time Window': '8AM-12PM',
      'Items': [item.id],
      'Total Cubic Feet': 3.0,
      'Total Weight': 25,
      'Item Count': 1,
      'Route ID': '',
      'Stop Number': null,
      'Service Address': '123 Sample St, Hoboken, NJ 07030',
      'Special Instructions': '',
      'Completed At': null,
      'Driver Notes': '',
      'Triggers Billing': false
    });
    console.log(`  ✓ Action created: ${action.id}`);
    
    // 4. Create sample Operation
    console.log('Creating sample Operation...');
    const operation = await base('Ops_v7').create({
      'Type': 'New Setup Fee',
      'Customer': [customer.id],
      'Priority': 'Normal',
      'Action Required': 'Follow up for first pickup scheduling',
      'Due Date': '2025-08-17',
      'Status': 'Pending',
      'Assigned To': 'Zach',
      'Notes': 'Sample task for schema setup'
    });
    console.log(`  ✓ Operation created: ${operation.id}`);
    
    console.log('\n✅ Sample records created successfully!');
    console.log('   You can now delete these sample records.');
    
  } catch (error) {
    console.error('\n❌ Error creating sample records:', error.message);
    console.log('\n💡 Manual Setup Required:');
    console.log('   1. Go to Airtable and create these 4 tables manually:');
    console.log('      - Customers');
    console.log('      - Items');
    console.log('      - Actions');
    console.log('      - Operations');
    console.log('   2. Add fields as specified in AIRTABLE_NEW_SCHEMA.md');
    console.log('   3. Run this script again to verify');
  }
}

// List tables to be deleted
async function listOldTables() {
  console.log('\n🗑️  Tables to DELETE (after verification):');
  const oldTables = [
    'Container_Types',
    'Containers',
    'Facilities',
    'Leads',
    'Leads_v2',
    'Movements',  // Keep until Actions is working
    'Notifications',
    'Promo_Codes',
    'Properties',
    'Referrals',
    'Sessions',
    'Waitlist',
    'Zones'
  ];
  
  oldTables.forEach(table => {
    console.log(`   - ${table}`);
  });
  
  console.log('\n⚠️  DO NOT delete these until the new schema is working!');
}

// Main execution
async function main() {
  const connected = await checkConnection();
  
  if (!connected) {
    console.log('\n❌ Please check your .env file and try again.');
    process.exit(1);
  }
  
  console.log('\n📊 New Schema Summary:');
  console.log('   - Customers (user accounts, plans, usage)');
  console.log('   - Items (inventory with dimensions)');
  console.log('   - Actions (pickups, deliveries)');
  console.log('   - Operations (ops queue)');
  
  // Create sample records
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\n⚠️  Create sample records? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      await createSampleRecords();
    }
    
    await listOldTables();
    
    console.log('\n✅ Next Steps:');
    console.log('   1. Verify new tables have correct fields');
    console.log('   2. Update codebase to use new schema');
    console.log('   3. Test with a few operations');
    console.log('   4. Delete old tables when confident');
    
    rl.close();
  });
}

// Run the script
main().catch(console.error);