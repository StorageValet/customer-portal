import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { dropboxService } from "../dropbox-service";
import { emailService } from "../email";
import { stripeService } from "../stripe-service";
import { upload } from "../middleware/upload";
import { insertMovementSchema } from "@shared/schema";
import Stripe from "stripe";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-07-30.basil",
});

// Helper function to extract user ID from session
const getUserId = (req: Request): string => {
  if (!req.session?.user?.id) {
    throw new Error("User not authenticated");
  }
  return req.session.user.id;
};

// Get all user movements
router.get("/api/movements", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const movements = await storage.getUserMovements(userId);
    res.json(movements);
  } catch (error) {
    console.error("Error fetching movements:", error);
    res.status(500).json({ message: "Failed to fetch movements" });
  }
});

// Create new movement
router.post("/api/movements", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    console.log("Received movement request:", req.body);

    // Parse the scheduled date properly
    const scheduledDate = new Date(req.body.scheduledDate);
    
    // Validate the date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (scheduledDate < today) {
      return res.status(400).json({ message: "Scheduled date must be in the future" });
    }

    // Ensure itemIds is an array of strings
    const itemIds = Array.isArray(req.body.itemIds) 
      ? req.body.itemIds.map((id: any) => String(id))
      : [];
    
    if (itemIds.length === 0) {
      return res.status(400).json({ message: "At least one item must be selected" });
    }

    // Get user for address
    const user = await storage.getUser(userId);
    const address = req.body.address || user?.address || "";

    // Build movement data
    const movementData = {
      ...req.body,
      scheduledDate,
      userId,
      itemIds,
      address,
      scheduledTimeSlot: req.body.timeSlot || req.body.scheduledTimeSlot, // Handle both field names
    };

    const validatedData = insertMovementSchema.parse(movementData);
    const movementCreateData = {
      ...validatedData,
      userId,
      specialInstructions: validatedData.specialInstructions || null,
      totalVolume: validatedData.totalVolume || null,
      totalWeight: validatedData.totalWeight || null,
      truckSize: validatedData.truckSize || null,
      estimatedDuration: validatedData.estimatedDuration || null,
    };
    
    console.log("Creating movement with data:", movementCreateData);
    const movement = await storage.createMovement(movementCreateData);

    // Send email notification
    if (user && user.email) {
      try {
        // Get the actual items for email
        const items = await Promise.all(
          movement.itemIds.map(async (itemId: string) => {
            const item = await storage.getItem(itemId);
            return item ? item.name : `Item ${itemId}`;
          })
        );

        const emailData = {
          type: movement.type as "pickup" | "delivery",
          customerName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Customer",
          customerEmail: user.email,
          scheduledDate: new Date(movement.scheduledDate).toLocaleDateString(),
          timeSlot: movement.scheduledTimeSlot,
          items: items,
          address: movement.address || user.address || undefined,
          specialInstructions: movement.specialInstructions || undefined,
          confirmationNumber: emailService.generateConfirmationNumber(),
        };

        console.log("Sending email confirmation:", emailData.type);
        
        if (movement.type === "pickup") {
          await emailService.sendPickupConfirmation(emailData);
        } else {
          await emailService.sendDeliveryConfirmation(emailData);
        }
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Don't fail the request if email fails
      }
    }

    res.json(movement);
  } catch (error) {
    console.error("Error creating movement:", error);
    res.status(500).json({ message: "Failed to create movement" });
  }
});

// Update movement status - triggers subscription on first pickup completion
router.put("/api/movements/:id/status", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { status } = req.body;
    const movementId = req.params.id;

    // Get the movement
    const movement = await storage.getMovement(movementId);
    if (!movement || movement.userId !== userId) {
      return res.status(404).json({ message: "Movement not found" });
    }

    // Update the movement status
    await storage.updateMovement(movementId, { status });

    // Check if this is a pickup being marked as completed
    if (movement.type === "pickup" && status === "completed") {
      const user = await storage.getUser(userId);
      if (user && !user.firstPickupDate) {
        // This is the user's first pickup!
        await storage.updateUser(userId, { firstPickupDate: new Date() });

        // Start the monthly subscription if they don't have one
        if (!user.stripeSubscriptionId && user.stripeCustomerId) {
          try {
            // Monthly subscription prices based on plan
            const monthlyPrices = {
              starter: 199,
              medium: 299,
              family: 349,
            };

            const monthlyAmount = monthlyPrices[user.plan as keyof typeof monthlyPrices] || 199;

            // Create price for this plan
            const price = await stripe.prices.create({
              unit_amount: monthlyAmount * 100,
              currency: "usd",
              recurring: { interval: "month" },
              product_data: {
                name: `Storage Valet ${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan`,
              },
            });

            // Create subscription
            const subscription = await stripe.subscriptions.create({
              customer: user.stripeCustomerId,
              items: [{ price: price.id }],
              metadata: {
                userId: user.id,
                plan: user.plan,
              },
            });

            // Update user with subscription ID
            await storage.updateUser(userId, { stripeSubscriptionId: subscription.id });

            console.log(`Started monthly subscription for user ${userId} after first pickup`);
          } catch (error) {
            console.error("Failed to create subscription after first pickup:", error);
            // Don't fail the request if subscription creation fails
          }
        }
      }
    }

    res.json({ message: "Movement status updated", status });
  } catch (error) {
    console.error("Error updating movement status:", error);
    res.status(500).json({ message: "Failed to update movement status" });
  }
});

// Upload photo for a movement
router.post(
  "/api/movements/:movementId/photos",
  upload.single("photo"),
  async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { movementId } = req.params;
      const { type } = req.body; // 'pickup' or 'delivery'

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!type || !["pickup", "delivery"].includes(type)) {
        return res
          .status(400)
          .json({ message: "Invalid photo type. Must be 'pickup' or 'delivery'" });
      }

      // Verify movement belongs to user
      const movement = await storage.getMovement(movementId);
      if (!movement || movement.userId !== userId) {
        return res.status(404).json({ message: "Movement not found" });
      }

      // Check if Dropbox is configured
      if (
        !process.env.DROPBOX_ACCESS_TOKEN ||
        process.env.DROPBOX_ACCESS_TOKEN === "your_dropbox_access_token_here"
      ) {
        console.warn("Dropbox not configured, using placeholder");
        const randomId = Math.floor(Math.random() * 1000);
        const placeholderUrl = `https://picsum.photos/seed/${randomId}/400/300`;
        return res.json({ photoUrl: placeholderUrl });
      }

      // Create customer folders if needed
      await dropboxService.createCustomerFolders(userId);

      // Upload to Dropbox
      const uploadedFile = await dropboxService.uploadFile(
        req.file,
        userId,
        undefined,
        movementId,
        type as "pickup" | "delivery"
      );

      res.json({
        photoUrl: uploadedFile.url,
        path: uploadedFile.path,
        name: uploadedFile.name,
        size: uploadedFile.size,
        type,
      });
    } catch (error) {
      console.error("Error uploading movement photo:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  }
);

export default router;
