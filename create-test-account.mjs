import bcrypt from 'bcrypt';
import Airtable from 'airtable';
import dotenv from 'dotenv';

dotenv.config();

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

// Test account credentials
const email = 'test@mystoragevalet.com';
const password = 'test123';

async function createTestAccount() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the customer record
    const record = await base('Customers_v7').create({
      'Email': email,
      'Password Hash': hashedPassword,
      'First Name': 'Test',
      'Last Name': 'User',
      'Phone': '201-555-0001',
      'Service Address': '123 Test Street, Hoboken, NJ 07030',
      'ZIP Code': '07030',
      'Monthly Plan': 'Starter',
      'Plan Cubic Feet': 100,
      'Plan Insurance': 2000,
      'Used Cubic Feet': 0,
      'Used Insurance': 0,
      'Setup Fee Paid': true,
      'Subscription Status': 'active'
    });
    
    console.log('\n✅ TEST ACCOUNT CREATED SUCCESSFULLY!\n');
    console.log('🔐 Login Credentials:');
    console.log('   Email: test@mystoragevalet.com');
    console.log('   Password: test123\n');
    console.log('📍 Go to http://localhost:3000/login');
    console.log('   Enter these credentials and you should be able to log in!\n');
    console.log('Record ID:', record.id);
    
  } catch (error) {
    console.error('Error creating test account:', error);
  }
}

createTestAccount();