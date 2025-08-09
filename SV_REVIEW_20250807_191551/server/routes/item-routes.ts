import { Router, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { dropboxService } from "../dropbox-service";
import { upload } from "../middleware/upload";
import { insertItemSchema } from "@shared/schema";
import { uploadRateLimit, catchAsync } from "../middleware/security";

const router = Router();

// Helper function to extract user ID from session
const getUserId = (req: Request): string => {
  if (!req.session?.user?.id) {
    throw new Error("User not authenticated");
  }
  return req.session.user.id;
};

// Get all user items
router.get("/api/items", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const items = await storage.getUserItems(userId);
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Failed to fetch items" });
  }
});

// Create new item
router.post("/api/items", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    // Remove userId from request body before validation
    const { userId: _ignoredUserId, ...bodyWithoutUserId } = req.body;

    const validatedData = insertItemSchema.omit({ userId: true }).parse(bodyWithoutUserId);
    const itemData = {
      ...validatedData,
      userId,
      description: validatedData.description || null,
      facility: validatedData.facility || null,
      zone: validatedData.zone || null,
      rack: validatedData.rack || null,
      shelf: validatedData.shelf || null,
      lastScannedAt: validatedData.lastScannedAt || null,
      qrCode: validatedData.qrCode || "", // Ensure qrCode is never undefined
    };
    const item = await storage.createItem(itemData);
    
    // Ensure we return the complete item with ID
    if (!item || !item.id) {
      console.error("Created item missing ID:", item);
      throw new Error("Failed to create item - no ID returned from storage");
    }
    
    console.log("Item created successfully:", { id: item.id, name: item.name });
    res.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Error creating item:", error);
    res.status(500).json({ message: "Failed to create item" });
  }
});

// Bulk delete items (MUST come before /:id routes)
router.delete("/api/items/bulk-delete", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { itemIds } = req.body;

    if (!itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({ message: "Invalid request body: itemIds array required" });
    }

    if (itemIds.length === 0) {
      return res.status(400).json({ message: "No items specified for deletion" });
    }

    const deletePromises = [];
    let deletedCount = 0;

    // Verify ownership and delete each item
    for (const itemId of itemIds) {
      const item = await storage.getItem(itemId);
      if (item && item.userId === userId) {
        deletePromises.push(
          storage.deleteItem(itemId).then(() => {
            deletedCount++;
          })
        );
      }
    }

    await Promise.all(deletePromises);

    res.json({
      message: `${deletedCount} items deleted successfully`,
      deletedCount,
    });
  } catch (error) {
    console.error("Error bulk deleting items:", error);
    res.status(500).json({ message: "Failed to bulk delete items" });
  }
});

// Bulk update items status
router.put("/api/items/bulk/status", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { itemIds, status } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || !status) {
      return res.status(400).json({ message: "Invalid request body" });
    }

    if (!["at_home", "in_storage"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatePromises = [];

    // Verify ownership and update each item
    for (const itemId of itemIds) {
      const item = await storage.getItem(itemId);
      if (item && item.userId === userId) {
        updatePromises.push(storage.updateItem(itemId, { status }));
      }
    }

    const updatedItems = await Promise.all(updatePromises);
    res.json({
      message: `${updatedItems.length} items updated successfully`,
      updatedCount: updatedItems.length,
    });
  } catch (error) {
    console.error("Error bulk updating items:", error);
    res.status(500).json({ message: "Failed to bulk update items" });
  }
});

// Update item (MUST come after bulk routes)
router.put("/api/items/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const itemId = req.params.id;

    // Verify item belongs to user
    const item = await storage.getItem(itemId);
    if (!item || item.userId !== userId) {
      return res.status(404).json({ message: "Item not found" });
    }

    const updatedItem = await storage.updateItem(itemId, req.body);
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ message: "Failed to update item" });
  }
});

// Delete item (MUST come after bulk routes)
router.delete("/api/items/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const itemId = req.params.id;

    // Verify item belongs to user
    const item = await storage.getItem(itemId);
    if (!item || item.userId !== userId) {
      return res.status(404).json({ message: "Item not found" });
    }

    await storage.deleteItem(itemId);
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ message: "Failed to delete item" });
  }
});

// Upload photo for an item
router.post(
  "/api/items/:itemId/upload-photo",
  uploadRateLimit,
  upload.single("photo"),
  catchAsync(async (req: Request, res: Response) => {
    let userId: string;
    try {
      userId = getUserId(req);
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { itemId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      // Verify item belongs to user
      const item = await storage.getItem(itemId);
      if (!item) {
        console.error(`Item not found: ${itemId}`);
        return res.status(404).json({ message: "Item not found" });
      }
      
      if (item.userId !== userId) {
        console.error(`Item ${itemId} does not belong to user ${userId}`);
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if Dropbox is configured
      if (
        !process.env.DROPBOX_ACCESS_TOKEN ||
        process.env.DROPBOX_ACCESS_TOKEN === "your_dropbox_access_token_here"
      ) {
        console.warn("Dropbox not configured, using placeholder");
        const randomId = Math.floor(Math.random() * 1000);
        const placeholderUrl = `https://picsum.photos/seed/${randomId}/400/300`;

        // Update item with placeholder URL
        const currentPhotos = item.photoUrls || [];
        const updatedItem = await storage.updateItem(itemId, {
          photoUrls: [...currentPhotos, placeholderUrl],
        });

        console.log(`Added placeholder photo to item ${itemId}`);
        return res.json({ 
          photoUrl: placeholderUrl,
          message: "Using placeholder image (Dropbox not configured)"
        });
      }

      // Create customer folders if needed (non-blocking)
      dropboxService.createCustomerFolders(userId).catch(err => {
        console.warn("Failed to create folders, continuing:", err);
      });

      // Upload to Dropbox
      console.log(`Uploading photo for item ${itemId}...`);
      const uploadedFile = await dropboxService.uploadFile(
        req.file,
        userId,
        itemId,
        undefined,
        "item"
      );

      // Update item with new photo URL
      const currentPhotos = item.photoUrls || [];
      const updatedItem = await storage.updateItem(itemId, {
        photoUrls: [...currentPhotos, uploadedFile.url],
      });

      console.log(`Successfully uploaded photo for item ${itemId}: ${uploadedFile.url}`);
      
      res.json({
        photoUrl: uploadedFile.url,
        path: uploadedFile.path,
        name: uploadedFile.name,
        size: uploadedFile.size,
      });
    } catch (error) {
      console.error("Error uploading item photo:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload photo";
      res.status(500).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === "development" ? error : undefined 
      });
    }
  })
);

// Delete a photo from an item
router.delete("/api/items/:itemId/photos", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { itemId } = req.params;
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ message: "Photo URL is required" });
    }

    // Verify item belongs to user
    const item = await storage.getItem(itemId);
    if (!item || item.userId !== userId) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Remove photo URL from item
    const updatedPhotos = (item.photoUrls || []).filter((url) => url !== photoUrl);
    await storage.updateItem(itemId, {
      photoUrls: updatedPhotos,
    });

    res.json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Error deleting photo:", error);
    res.status(500).json({ message: "Failed to delete photo" });
  }
});

// Get all photos for an item
router.get("/api/items/:itemId/photos", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { itemId } = req.params;

    // Verify item belongs to user
    const item = await storage.getItem(itemId);
    if (!item || item.userId !== userId) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ photos: item.photoUrls || [] });
  } catch (error) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ message: "Failed to fetch photos" });
  }
});

export default router;
