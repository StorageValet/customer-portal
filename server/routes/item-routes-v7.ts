/**
 * Item Routes - v7 Schema
 * Handles inventory management with advanced features
 */

import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage-v7";
import { dropboxService } from "../dropbox-service";

const router = Router();

// Validation schemas
const CreateItemSchema = z.object({
  itemName: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().optional(), // Free text for customer-defined categories
  lengthInches: z.number().positive(),
  widthInches: z.number().positive(),
  heightInches: z.number().positive(),
  weightLbs: z.number().positive(),
  estimatedValue: z.number().min(0),
  containerType: z.enum(['Bin', 'Tote', 'Crate', 'Customer Container', 'Specialty Item']),
  photoUrls: z.string().optional(),
  // Advanced return scheduling
  returnDeliveryDate: z.string().optional(), // ISO date string
  returnDeliveryTimeWindow: z.enum(['8AM-12PM', '12PM-4PM', '4PM-8PM']).optional(),
});

const UpdateItemSchema = z.object({
  itemName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  estimatedValue: z.number().min(0).optional(),
  photoUrls: z.string().optional(),
});

// GET /api/items
router.get("/api/items", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const items = await storage.getCustomerItems(req.session.userId);
    
    // Calculate totals for the response
    const totals = {
      itemCount: items.length,
      totalCubicFeet: items.reduce((sum, item) => sum + (item.cubicFeet || 0), 0),
      totalValue: items.reduce((sum, item) => sum + (item.estimatedValue || 0), 0),
      inStorage: items.filter(i => i.status === 'In Storage').length,
      atHome: items.filter(i => i.status === 'At Home').length,
    };

    res.json({ items, totals });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// GET /api/items/categories
router.get("/api/items/categories", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const categories = await storage.getCustomerCategories(req.session.userId);
    
    // Also provide some default suggestions for new users
    const defaults = [
      "📚 Books",
      "👗 Clothing", 
      "🎄 Holiday Decorations",
      "🏈 Sports Equipment",
      "📦 Documents",
      "🪑 Furniture",
      "🧸 Kids Toys",
      "🎨 Art & Crafts",
    ];
    
    // Combine user's categories with defaults (user's first)
    const allCategories = [...new Set([...categories, ...defaults])];
    
    res.json({ 
      userCategories: categories,
      suggestions: allCategories.slice(0, 12),
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// GET /api/items/:id
router.get("/api/items/:id", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const item = await storage.getItemById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    // Verify ownership
    if (item.customerId !== req.session.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

// POST /api/items
router.post("/api/items", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const data = CreateItemSchema.parse(req.body);
    
    // Parse return delivery date if provided
    const returnDeliveryDate = data.returnDeliveryDate 
      ? new Date(data.returnDeliveryDate)
      : undefined;
    
    // Create item with optional return scheduling
    const item = await storage.createItem({
      customerId: req.session.userId,
      itemName: data.itemName,
      description: data.description,
      category: data.category,
      lengthInches: data.lengthInches,
      widthInches: data.widthInches,
      heightInches: data.heightInches,
      weightLbs: data.weightLbs,
      estimatedValue: data.estimatedValue,
      containerType: data.containerType,
      photoUrls: data.photoUrls,
      returnDeliveryDate,
      returnDeliveryTimeWindow: data.returnDeliveryTimeWindow,
    });
    
    // Create ops task for new item
    await storage.createOpsTask({
      type: 'New Item Added',
      customerId: req.session.userId,
      priority: 'Low',
      actionRequired: `Review new item: ${data.itemName} (${item.cubicFeet.toFixed(1)} cu.ft.)`,
    });

    res.json({ 
      item,
      message: returnDeliveryDate 
        ? `Item created with return delivery scheduled for ${returnDeliveryDate.toLocaleDateString()}`
        : 'Item created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error("Error creating item:", error);
    res.status(500).json({ error: "Failed to create item" });
  }
});

// PUT /api/items/:id
router.put("/api/items/:id", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Verify ownership first
    const existing = await storage.getItemById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Item not found" });
    }
    if (existing.customerId !== req.session.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updates = UpdateItemSchema.parse(req.body);
    const item = await storage.updateItem(req.params.id, updates);
    
    res.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// DELETE /api/items/:id
router.delete("/api/items/:id", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Verify ownership first
    const item = await storage.getItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    if (item.customerId !== req.session.userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Don't allow deletion if item is in storage
    if (item.status === 'In Storage') {
      return res.status(400).json({ 
        error: "Cannot delete items currently in storage. Schedule a delivery first." 
      });
    }

    await storage.deleteItem(req.params.id);
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// POST /api/items/:id/upload-photo
router.post("/api/items/:id/upload-photo", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Verify ownership
    const item = await storage.getItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    if (item.customerId !== req.session.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { photoData, photoName } = req.body;
    if (!photoData || !photoName) {
      return res.status(400).json({ error: "Photo data and name required" });
    }

    // Upload to Dropbox
    const photoUrl = await dropboxService.uploadPhoto(
      `items/${item.qrCode}/${photoName}`,
      photoData
    );

    // Add to item's photo URLs
    const currentPhotos = item.photoUrls ? item.photoUrls.split(',') : [];
    currentPhotos.push(photoUrl);
    
    const updatedItem = await storage.updateItem(req.params.id, {
      photoUrls: currentPhotos.join(','),
    });

    res.json({ 
      photoUrl,
      item: updatedItem,
    });
  } catch (error) {
    console.error("Error uploading photo:", error);
    res.status(500).json({ error: "Failed to upload photo" });
  }
});

export default router;