import { storage } from "./storage";
import bcrypt from "bcrypt";
import crypto from "crypto";

// Test data scenarios from implementation guide
const testScenarios = [
  {
    email: "new.customer@test.com",
    password: "test123",
    firstName: "New",
    lastName: "Customer",
    phone: "555-0101",
    address: "123 Starter Lane, San Francisco, CA 94107",
    plan: "starter" as const,
    items: [],
    scenario: "Brand new user - no items yet",
  },
  {
    email: "active.family@test.com",
    password: "test123",
    firstName: "Active",
    lastName: "Family",
    phone: "555-0102",
    address: "456 Family Court, San Francisco, CA 94109",
    plan: "family" as const,
    items: 50,
    scenario: "Large family with seasonal rotation",
  },
  {
    email: "premium.user@test.com",
    password: "test123",
    firstName: "Premium",
    lastName: "User",
    phone: "555-0103",
    address: "789 Luxury Drive, San Francisco, CA 94108",
    plan: "medium" as const,
    items: 20,
    scenario: "High-value items testing insurance limits",
  },
];

// Realistic item templates
const itemTemplates = {
  seasonal: [
    {
      name: "Holiday Decorations Box",
      category: "Decorations",
      value: 150,
      description: "Christmas ornaments and lights",
      length: 24,
      width: 18,
      height: 18,
      weight: 25,
    },
    {
      name: "Winter Ski Equipment",
      category: "Sports Equipment",
      value: 800,
      description: "Skis, boots, poles, and gear",
      length: 72,
      width: 12,
      height: 8,
      weight: 35,
    },
    {
      name: "Summer Camping Gear",
      category: "Sports Equipment",
      value: 600,
      description: "Tent, sleeping bags, camp stove",
      length: 30,
      width: 20,
      height: 15,
      weight: 40,
    },
    {
      name: "Halloween Costume Collection",
      category: "Clothing",
      value: 200,
      description: "Family costume box",
      length: 24,
      width: 18,
      height: 12,
      weight: 15,
    },
    {
      name: "Beach Equipment",
      category: "Sports Equipment",
      value: 250,
      description: "Umbrellas, chairs, cooler",
      length: 48,
      width: 24,
      height: 18,
      weight: 30,
    },
  ],
  furniture: [
    {
      name: "Dining Room Chairs (Set of 4)",
      category: "Furniture",
      value: 600,
      description: "Wooden dining chairs",
      length: 36,
      width: 36,
      height: 48,
      weight: 80,
    },
    {
      name: "Coffee Table",
      category: "Furniture",
      value: 400,
      description: "Glass top coffee table",
      length: 48,
      width: 24,
      height: 18,
      weight: 60,
    },
    {
      name: "Bookshelf",
      category: "Furniture",
      value: 300,
      description: "5-shelf wooden bookcase",
      length: 36,
      width: 12,
      height: 72,
      weight: 75,
    },
    {
      name: "Office Desk",
      category: "Furniture",
      value: 500,
      description: "Standing desk with drawers",
      length: 60,
      width: 30,
      height: 30,
      weight: 100,
    },
    {
      name: "Nightstand Set",
      category: "Furniture",
      value: 350,
      description: "Matching bedside tables",
      length: 24,
      width: 18,
      height: 24,
      weight: 40,
    },
  ],
  electronics: [
    {
      name: "Gaming Console Collection",
      category: "Electronics",
      value: 1200,
      description: "PS5, Xbox, Nintendo Switch",
      length: 24,
      width: 18,
      height: 12,
      weight: 20,
    },
    {
      name: "Home Theater System",
      category: "Electronics",
      value: 800,
      description: "Speakers and receiver",
      length: 36,
      width: 24,
      height: 18,
      weight: 45,
    },
    {
      name: "Computer Equipment",
      category: "Electronics",
      value: 1500,
      description: "Desktop, monitors, peripherals",
      length: 30,
      width: 24,
      height: 24,
      weight: 50,
    },
    {
      name: "Photography Equipment",
      category: "Electronics",
      value: 2000,
      description: "DSLR cameras, lenses, tripods",
      length: 24,
      width: 18,
      height: 18,
      weight: 25,
    },
    {
      name: "Vintage Record Player",
      category: "Electronics",
      value: 600,
      description: "Turntable and vinyl collection",
      length: 20,
      width: 18,
      height: 16,
      weight: 30,
    },
  ],
  clothing: [
    {
      name: "Winter Coat Collection",
      category: "Clothing",
      value: 500,
      description: "Family winter coats",
      length: 36,
      width: 24,
      height: 12,
      weight: 20,
    },
    {
      name: "Formal Wear",
      category: "Clothing",
      value: 800,
      description: "Suits and dresses",
      length: 36,
      width: 24,
      height: 6,
      weight: 15,
    },
    {
      name: "Vintage Clothing Box",
      category: "Clothing",
      value: 300,
      description: "Collectible vintage pieces",
      length: 24,
      width: 18,
      height: 12,
      weight: 10,
    },
    {
      name: "Baby Clothes (0-2 years)",
      category: "Clothing",
      value: 200,
      description: "Outgrown baby clothing",
      length: 24,
      width: 18,
      height: 12,
      weight: 8,
    },
    {
      name: "Sports Uniforms",
      category: "Clothing",
      value: 150,
      description: "Kids soccer and baseball uniforms",
      length: 18,
      width: 14,
      height: 8,
      weight: 5,
    },
  ],
  documents: [
    {
      name: "Tax Records (2020-2024)",
      category: "Documents",
      value: 100,
      description: "Filed tax returns and receipts",
      length: 12,
      width: 10,
      height: 12,
      weight: 15,
    },
    {
      name: "Family Photo Albums",
      category: "Documents",
      value: 500,
      description: "Irreplaceable family memories",
      length: 18,
      width: 14,
      height: 10,
      weight: 20,
    },
    {
      name: "Legal Documents",
      category: "Documents",
      value: 200,
      description: "Contracts and agreements",
      length: 12,
      width: 10,
      height: 6,
      weight: 10,
    },
    {
      name: "Medical Records",
      category: "Documents",
      value: 100,
      description: "Family medical history",
      length: 12,
      width: 10,
      height: 8,
      weight: 12,
    },
    {
      name: "School Memorabilia",
      category: "Documents",
      value: 150,
      description: "Yearbooks and certificates",
      length: 14,
      width: 12,
      height: 10,
      weight: 15,
    },
  ],
  highValue: [
    {
      name: "Fine China Set",
      category: "Kitchen Items",
      value: 1200,
      description: "12-place setting with serving pieces",
      length: 24,
      width: 24,
      height: 18,
      weight: 45,
    },
    {
      name: "Art Collection",
      category: "Decorations",
      value: 3000,
      description: "Framed paintings and sculptures",
      length: 48,
      width: 36,
      height: 6,
      weight: 30,
    },
    {
      name: "Persian Rug",
      category: "Decorations",
      value: 2500,
      description: "Antique hand-woven rug",
      length: 96,
      width: 8,
      height: 8,
      weight: 50,
    },
    {
      name: "Jewelry Box",
      category: "Other",
      value: 1500,
      description: "Family heirloom jewelry",
      length: 12,
      width: 10,
      height: 8,
      weight: 10,
    },
    {
      name: "Wine Collection",
      category: "Other",
      value: 2000,
      description: "Temperature-controlled wine case",
      length: 24,
      width: 18,
      height: 36,
      weight: 60,
    },
  ],
};

// Generate QR code
function generateQRCode(): string {
  return `SV-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

// Get random items from templates
function getRandomItems(count: number, focus?: "seasonal" | "highValue"): any[] {
  const items: any[] = [];
  const allTemplates =
    focus === "seasonal"
      ? [...itemTemplates.seasonal, ...itemTemplates.clothing]
      : focus === "highValue"
        ? [...itemTemplates.highValue, ...itemTemplates.electronics, ...itemTemplates.furniture]
        : Object.values(itemTemplates).flat();

  for (let i = 0; i < count; i++) {
    const template = allTemplates[Math.floor(Math.random() * allTemplates.length)];
    items.push({
      ...template,
      qrCode: generateQRCode(),
      status: Math.random() > 0.3 ? "in_storage" : "at_home",
      photoUrls: [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800", // Storage box
        "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800", // Organized items
        "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800", // Storage room
      ],
      coverPhotoIndex: 0,
      location: "A-1-" + (i + 1),
      notes: template.description,
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Return Date object
    });
  }

  return items;
}

export async function setupTestData() {
  console.log("Setting up test data...");

  try {
    for (const scenario of testScenarios) {
      console.log(`\nCreating user: ${scenario.email}`);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(scenario.email);
      if (existingUser) {
        console.log(`User ${scenario.email} already exists, skipping...`);
        continue;
      }

      // Create user
      const hashedPassword = await bcrypt.hash(scenario.password, 10);
      const user = await storage.createUser({
        email: scenario.email,
        passwordHash: hashedPassword,
        firstName: scenario.firstName,
        lastName: scenario.lastName,
        phone: scenario.phone,
        address: scenario.address,
        plan: scenario.plan,
        setupFeePaid: true, // All test users have paid setup fee
        stripeCustomerId: `cus_test_${scenario.email.split("@")[0]}`,
        stripeSubscriptionId:
          typeof scenario.items === "number" && scenario.items > 0
            ? `sub_test_${scenario.email.split("@")[0]}`
            : null,
        insuranceCoverage:
          scenario.plan === "family" ? 4000 : scenario.plan === "medium" ? 3000 : 2000,
        city: "San Francisco",
        state: "CA",
        zip: "94107",
        referralCode: null,
        firstPickupDate:
          typeof scenario.items === "number" && scenario.items > 0 ? new Date() : null,
        preferredAuthMethod: "email",
        lastAuthMethod: "email",
        profileImageUrl: null,
      });

      console.log(`Created user ${scenario.email} with ID: ${user.id}`);
      console.log(`Scenario: ${scenario.scenario}`);

      // Create items based on scenario
      if (typeof scenario.items === "number" && scenario.items > 0) {
        const focus = scenario.email.includes("family")
          ? "seasonal"
          : scenario.email.includes("premium")
            ? "highValue"
            : undefined;
        const items = getRandomItems(scenario.items, focus);

        console.log(`Creating ${items.length} items for ${scenario.email}...`);

        for (const item of items) {
          await storage.createItem({
            ...item,
            userId: user.id,
          });
        }

        // Create some sample movements for active users
        if (scenario.items > 10) {
          // Past pickup (completed)
          await storage.createMovement({
            userId: user.id,
            type: "pickup",
            status: "completed",
            scheduledDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            scheduledTimeSlot: "morning",
            address: scenario.address,
            itemIds: items.slice(0, 5).map((i) => i.qrCode),
            totalVolume: 150,
            totalWeight: 100,
            truckSize: "van",
            estimatedDuration: 45,
            specialInstructions: "Initial pickup - handled with care",
          });

          // Upcoming delivery
          await storage.createMovement({
            userId: user.id,
            type: "delivery",
            status: "scheduled",
            scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            scheduledTimeSlot: "afternoon",
            address: scenario.address,
            itemIds: items.slice(5, 8).map((i) => i.qrCode),
            totalVolume: 80,
            totalWeight: 60,
            truckSize: "van",
            estimatedDuration: 30,
            specialInstructions: "Holiday decorations request",
          });
        }
      }
    }

    console.log("\n✅ Test data setup complete!");
    console.log("\nTest accounts created:");
    console.log("- new.customer@test.com / test123 (New user, no items)");
    console.log("- active.family@test.com / test123 (Family plan, 50 seasonal items)");
    console.log("- premium.user@test.com / test123 (Medium plan, 20 high-value items)");
  } catch (error) {
    console.error("Error setting up test data:", error);
  }
}

// Run if called directly
setupTestData().then(() => process.exit(0));
