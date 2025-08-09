import "dotenv/config";
import { storage } from "./server/storage";
import bcrypt from "bcrypt";

async function debugAuth() {
  console.log("🔍 Debugging Authentication Issues\n");

  // Test emails
  const testEmails = ["zach@mystoragevalet.com", "zjbrown11@gmail.com"];

  for (const email of testEmails) {
    console.log(`\n📧 Checking user: ${email}`);
    console.log("=" . repeat(50));

    try {
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log("❌ User not found in database");
        continue;
      }

      console.log("✅ User found:");
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Name: ${user.firstName} ${user.lastName}`);
      console.log(`  - Plan: ${user.plan}`);
      console.log(`  - Setup Fee Paid: ${user.setupFeePaid}`);
      console.log(`  - Has Password: ${!!user.passwordHash}`);
      console.log(`  - Password Hash Length: ${user.passwordHash?.length || 0}`);
      console.log(`  - Created: ${user.createdAt}`);
      
      // Check if password field is properly formatted
      if (user.passwordHash) {
        const isBcryptHash = user.passwordHash.startsWith('$2a$') || 
                            user.passwordHash.startsWith('$2b$') || 
                            user.passwordHash.startsWith('$2y$');
        console.log(`  - Valid bcrypt hash: ${isBcryptHash}`);
        
        // Test password validation
        if (isBcryptHash) {
          const testPasswords = ['password', 'Password123', 'password123'];
          console.log("\n  Testing common passwords:");
          for (const testPass of testPasswords) {
            try {
              const matches = await bcrypt.compare(testPass, user.passwordHash);
              if (matches) {
                console.log(`    ✅ Password matches: "${testPass}"`);
              }
            } catch (err) {
              // Silent fail for non-matches
            }
          }
        }
      }

    } catch (error) {
      console.error(`❌ Error checking user ${email}:`, error);
    }
  }

  console.log("\n\n📊 Database Connection Test:");
  console.log("=" . repeat(50));
  console.log(`AIRTABLE_API_KEY: ${process.env.AIRTABLE_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`AIRTABLE_BASE_ID: ${process.env.AIRTABLE_BASE_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`SESSION_SECRET: ${process.env.SESSION_SECRET ? '✅ Set' : '❌ Missing'}`);

  process.exit(0);
}

debugAuth().catch(console.error);