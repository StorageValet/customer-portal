import { Router, Request, Response } from "express";
import { storage } from "../storage";

const router = Router();

// Admin middleware - restrict to specific admin emails
const requireAdmin = async (req: Request, res: Response, next: Function) => {
  try {
    let userId: string | null = null;
    let userEmail: string | null = null;

    // Check session auth
    if (req.session?.user?.id) {
      userId = req.session.user.id;
      const user = await storage.getUser(userId!);
      userEmail = user?.email || "";
    }

    if (!userId || !userEmail) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!["admin@mystoragevalet.com", "carol@example.com"].includes(userEmail)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Get admin settings
router.get("/api/admin/settings", requireAdmin, (req: Request, res: Response) => {
  // Return default admin settings
  const settings = {
    pricing: {
      starter: { monthly: 199, setup: 99.5 },
      medium: { monthly: 299, setup: 149.5 },
      family: { monthly: 349, setup: 174.5 },
    },
    insurance: {
      starter: 2000,
      medium: 3000,
      family: 4000,
    },
    calendar: {
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      timeSlots: [
        {
          id: "morning",
          label: "Morning (9-12 PM)",
          startTime: "09:00",
          endTime: "12:00",
          weekendOnly: false,
          premium: false,
        },
        {
          id: "afternoon",
          label: "Afternoon (12-5 PM)",
          startTime: "12:00",
          endTime: "17:00",
          weekendOnly: false,
          premium: false,
        },
        {
          id: "evening",
          label: "Evening (5-8 PM)",
          startTime: "17:00",
          endTime: "20:00",
          weekendOnly: false,
          premium: true,
        },
        {
          id: "weekend-morning",
          label: "Weekend Morning (10-1 PM)",
          startTime: "10:00",
          endTime: "13:00",
          weekendOnly: true,
          premium: true,
        },
      ],
      advanceBookingDays: 7,
      emergencyBookingEnabled: true,
    },
    referralCredits: {
      newCustomerCredit: 50,
      referrerCredit: 50,
      enabled: true,
    },
    serviceAreas: {
      primaryZones: ["Downtown", "Midtown", "Uptown"],
      extendedZones: ["Suburbs North", "Suburbs South"],
      rushDeliveryZones: ["Downtown", "Midtown"],
    },
  };
  res.json(settings);
});

// Update admin settings
router.put("/api/admin/settings", requireAdmin, (req: Request, res: Response) => {
  console.log("Admin settings updated:", req.body);
  res.json({ message: "Settings updated successfully" });
});

// Test data setup endpoint
router.post("/api/setup-test-data", requireAdmin, async (req: Request, res: Response) => {
  try {
    // Run test data setup
    const { setupTestData } = await import("../setup-test-data");
    await setupTestData();

    res.json({ success: true, message: "Test data setup complete" });
  } catch (error) {
    console.error("Error setting up test data:", error);
    res.status(500).json({ message: "Failed to setup test data" });
  }
});

// Get all users (admin only)
router.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
  try {
    // TODO: Implement getAllUsers in AirtableStorage
    const users: any[] = []; // await storage.getAllUsers();
    // Remove sensitive data
    const sanitizedUsers = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      plan: user.plan,
      createdAt: user.createdAt,
      setupFeePaid: user.setupFeePaid,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
    }));
    res.json(sanitizedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Get system stats (admin only)
router.get("/api/admin/stats", requireAdmin, async (req: Request, res: Response) => {
  try {
    // In a real implementation, these would be calculated from the database
    // TODO: Implement these methods in AirtableStorage
    const stats = {
      totalUsers: 0, // await storage.getUserCount(),
      activeSubscriptions: 0, // await storage.getActiveSubscriptionCount(),
      totalItems: 0, // await storage.getTotalItemCount(),
      totalMovements: 0, // await storage.getTotalMovementCount(),
      revenueThisMonth: 0, // Would be calculated from Stripe
      newUsersThisMonth: 0, // Would be calculated from user creation dates
    };
    res.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

export default router;
