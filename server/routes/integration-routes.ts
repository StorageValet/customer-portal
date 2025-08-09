import { Router, Request, Response } from "express";
import { emailService } from "../email";
import { aiService } from "../ai-service";
import { softrIntegration } from "../softr-integration";
import { storage } from "../storage";

const router = Router();

// Helper function to extract user ID from session
const getUserId = (req: Request): string => {
  if (!req.session?.user?.id) {
    throw new Error("User not authenticated");
  }
  return req.session.user.id;
};

// Test email endpoint
router.post("/api/test-email", async (req: Request, res: Response) => {
  try {
    const { email, type } = req.body;
    const userId = getUserId(req);

    const user = userId ? await storage.getUser(userId) : null;
    const customerName = user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : "Test User";

    console.log(`Testing ${type} email to ${email}`);

    let result;
    switch (type) {
      case "welcome":
        result = await emailService.sendWelcomeEmail({
          customerName: customerName || email,
          customerEmail: email,
          plan: user?.plan || "starter",
          setupFee: 100,
        });
        break;

      case "pickup":
        result = await emailService.sendPickupConfirmation({
          type: "pickup",
          customerName: customerName || email,
          customerEmail: email,
          scheduledDate: new Date().toLocaleDateString(),
          timeSlot: "Morning (9-12 PM)",
          items: ["Test Item 1", "Test Item 2"],
          address: user?.address || "123 Test Street",
          confirmationNumber: emailService.generateConfirmationNumber(),
        });
        break;

      case "delivery":
        result = await emailService.sendDeliveryConfirmation({
          type: "delivery",
          customerName: customerName || email,
          customerEmail: email,
          scheduledDate: new Date().toLocaleDateString(),
          timeSlot: "Afternoon (12-5 PM)",
          items: ["Test Item 3", "Test Item 4"],
          address: user?.address || "123 Test Street",
          confirmationNumber: emailService.generateConfirmationNumber(),
        });
        break;

      default:
        return res.status(400).json({ message: "Invalid email type" });
    }

    res.json({
      success: result,
      message: result
        ? `Test ${type} email sent successfully`
        : `Test ${type} email logged to console (webhook not configured)`,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({ message: "Failed to send test email" });
  }
});

// AI Chat endpoint
router.post("/api/ai-chat", async (req: Request, res: Response) => {
  try {
    const { message, currentPage } = req.body;
    const userId = getUserId(req);

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Get user context
    const user = userId ? await storage.getUser(userId) : null;
    const items = userId ? await storage.getUserItems(userId) : [];

    const response = await aiService.getChatResponse(message, {
      userName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : undefined,
      userPlan: user?.plan,
      currentPage,
      itemCount: items.length,
    });

    res.json({ response });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({ message: "Failed to get AI response" });
  }
});

// AI Categorization endpoint
router.post("/api/ai-categorize", async (req: Request, res: Response) => {
  try {
    const { itemName, description } = req.body;

    if (!itemName) {
      return res.status(400).json({ message: "Item name is required" });
    }

    const category = await aiService.categorizeItem(itemName, description);
    res.json({ category });
  } catch (error) {
    console.error("AI categorization error:", error);
    res.status(500).json({ message: "Failed to categorize item" });
  }
});

// Debug route to check users
router.get("/api/debug-users", async (req: Request, res: Response) => {
  try {
    const testEmails = ["test@example.com", "zach@mystoragevalet.com", "zjbrown11@gmail.com"];
    const userInfo = [];

    for (const email of testEmails) {
      const user = await storage.getUserByEmail(email);
      userInfo.push({
        email,
        found: !!user,
        id: user?.id,
        firstName: user?.firstName,
      });
    }

    res.json({ users: userInfo });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Softr Integration Webhooks
router.post("/api/softr/customer-created", async (req: Request, res: Response) => {
  await softrIntegration.handleCustomerCreated(req, res);
});

router.post("/api/softr/plan-updated", async (req: Request, res: Response) => {
  await softrIntegration.handlePlanUpdated(req, res);
});

router.post("/api/softr/payment-updated", async (req: Request, res: Response) => {
  await softrIntegration.handlePaymentUpdated(req, res);
});

// Health check endpoint for Softr integration
router.get("/api/softr/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "storage-valet-portal",
  });
});

// Legacy chat endpoint (redirect to new AI chat)
router.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { message, context } = req.body;
    const userId = getUserId(req);
    const user = await storage.getUser(userId);

    // Basic AI response - in production this would call OpenAI
    const response = `I understand you're asking about: "${message}". As your Storage Valet concierge, I'm here to help with your ${user?.plan || "premium"} plan account. How else can I assist you today?`;

    res.json({ response });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ message: "Chat service unavailable" });
  }
});

export default router;
