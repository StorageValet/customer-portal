import "dotenv/config";
import { storage } from "./server/storage";
import bcrypt from "bcrypt";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function resetPassword() {
  console.log("🔐 Password Reset Utility\n");

  const email = await new Promise<string>((resolve) => {
    rl.question("Enter email address: ", resolve);
  });

  const password = await new Promise<string>((resolve) => {
    rl.question("Enter new password: ", resolve);
  });

  console.log("\nResetting password for:", email);

  try {
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      console.error("❌ User not found");
      process.exit(1);
    }

    console.log("✅ User found:", user.firstName, user.lastName);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log("✅ Password hashed");
    
    // Update the password
    await storage.updateUserPassword(user.id, hashedPassword);
    console.log("✅ Password updated successfully!");
    
    // Verify the update
    const updatedUser = await storage.getUser(user.id);
    if (updatedUser?.passwordHash === hashedPassword) {
      console.log("✅ Password verified in database");
    } else {
      console.log("⚠️  Warning: Password may not have been saved correctly");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

resetPassword().catch(console.error);