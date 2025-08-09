import { storage } from "./server/storage";
import bcrypt from "bcrypt";

async function createAdminUser() {
  try {
    console.log("Creating admin user...");

    // Check if admin user already exists
    try {
      const existingAdmin = await storage.getUserByEmail("admin@mystoragevalet.com");
      if (existingAdmin) {
        console.log("ℹ️  Admin user already exists");
        return;
      }
    } catch (error) {
      // User doesn't exist, continue with creation
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const adminUser = {
      email: "admin@mystoragevalet.com",
      passwordHash: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      phone: "555-0100",
      address: "100 Admin Street, San Francisco, CA 94107",
      city: "San Francisco",
      state: "CA",
      zip: "94107",
      plan: "family" as const,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      referralCode: null,
      firstPickupDate: null,
      profileImageUrl: null,
      preferredAuthMethod: "email" as const,
      lastAuthMethod: "email" as const,
      setupFeePaid: true,
    };

    const user = await storage.createUser(adminUser);
    console.log("✅ Admin user created successfully:", user.email);
    console.log("   Email: admin@mystoragevalet.com");
    console.log("   Password: admin123");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  }
}

createAdminUser();
