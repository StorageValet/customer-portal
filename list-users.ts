import dotenv from "dotenv";
dotenv.config();

import { storage } from "./server/storage";

async function listUsers() {
  try {
    console.log("🔍 Checking existing users in Airtable...");

    // Try to get some users by checking common emails
    const commonEmails = [
      "test@example.com",
      "admin@mystoragevalet.com",
      "zach@mystoragevalet.com",
      "zjbrown11@gmail.com",
      "carol@example.com",
      "new.customer@test.com",
      "active.family@test.com",
      "premium.user@test.com",
    ];

    for (const email of commonEmails) {
      try {
        const user = await storage.getUserByEmail(email);
        if (user) {
          console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
          console.log(`   Name: ${user.firstName} ${user.lastName}`);
          console.log(`   Plan: ${user.plan}`);
          console.log(`   Has password: ${user.passwordHash ? "Yes" : "No"}`);
          console.log("");
        }
      } catch (error) {
        // User doesn't exist, continue
      }
    }

    console.log("✅ User check complete");
  } catch (error) {
    console.error("❌ Error checking users:", error);
  }
}

listUsers();
