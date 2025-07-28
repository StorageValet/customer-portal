import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import session from "express-session";
import crypto from "crypto";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertUserSchema, insertItemSchema, insertMovementSchema } from "@shared/schema";
import { z } from "zod";
import { emailService } from "./email";
import Stripe from "stripe";
import multer from "multer";
import { Dropbox } from "dropbox";

// Extend the session data interface
declare module "express-session" {
  interface SessionData {
    userId: string;
    authMethod: string;
  }
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration for traditional auth
  app.use(session({
    secret: process.env.SESSION_SECRET || 'storage-valet-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  }));

  // Auth middleware setup (SSO)
  await setupAuth(app);

  // Helper function to get user ID from either auth method
  const getUserId = (req: any): string | null => {
    if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
      return req.user.claims.sub;
    }
    return req.session?.userId || null;
  };

  // Hybrid authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    // Check SSO authentication first
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    // Check traditional session auth
    if (req.session?.userId) {
      return next();
    }
    return res.status(401).json({ message: "Authentication required" });
  };

  // Auth status route - works with both auth methods
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      let userId: string | null = null;
      
      // Check SSO auth first
      if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      // Check traditional session auth
      else if (req.session?.userId) {
        userId = req.session.userId;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Traditional login route
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Update auth preference
      await storage.updateUser(user.id, { 
        lastAuthMethod: 'email',
        preferredAuthMethod: 'email'
      });
      
      req.session!.userId = user.id;
      req.session!.authMethod = 'email';
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Password reset routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: "If an account exists with this email, you will receive a password reset link." });
      }
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expires = new Date(Date.now() + 3600000); // 1 hour expiry
      
      // Save token to storage
      await storage.saveResetToken(user.id, hashedToken, expires);
      
      // Send email with reset link
      const resetLink = `${process.env.REPLIT_PROJECT_NAME ? `https://${process.env.REPLIT_PROJECT_NAME}.replit.app` : 'http://localhost:5000'}/reset-password?token=${resetToken}`;
      
      const emailData = {
        to: email,
        subject: 'Reset Your Password',
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the link below to set a new password:</p>
          <p><a href="${resetLink}" style="background-color: #368157; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      };
      
      await emailService.sendEmail(emailData);
      
      res.json({ message: "If an account exists with this email, you will receive a password reset link." });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }
      
      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      // Verify token and get user ID
      const userId = await storage.verifyResetToken(hashedToken);
      if (!userId) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update user password
      await storage.updateUserPassword(userId, hashedPassword);
      
      // Clear the reset token
      await storage.clearResetToken(userId);
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Magic link routes
  app.post("/api/auth/magic-link", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: "If an account exists with this email, you will receive a sign-in link." });
      }
      
      // Generate magic link token
      const magicToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(magicToken).digest('hex');
      const expires = new Date(Date.now() + 900000); // 15 minutes expiry
      
      // Save magic token (reusing reset token storage)
      await storage.saveResetToken(user.id, hashedToken, expires);
      
      // Send magic link email
      const magicLink = `${process.env.REPLIT_PROJECT_NAME ? `https://${process.env.REPLIT_PROJECT_NAME}.replit.app` : 'http://localhost:5000'}/api/auth/magic-login?token=${magicToken}`;
      
      const emailData = {
        to: email,
        subject: 'Sign in to Storage Valet',
        html: `
          <h2>Sign in to Storage Valet</h2>
          <p>Click the link below to sign in to your account:</p>
          <p><a href="${magicLink}" style="background-color: #368157; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Sign In</a></p>
          <p>This link will expire in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      };
      
      await emailService.sendEmail(emailData);
      
      res.json({ message: "If an account exists with this email, you will receive a sign-in link." });
    } catch (error) {
      console.error("Magic link error:", error);
      res.status(500).json({ message: "Failed to send magic link" });
    }
  });

  app.get("/api/auth/magic-login", async (req: any, res) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.redirect('/login?error=invalid_token');
      }
      
      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      // Verify token and get user ID
      const userId = await storage.verifyResetToken(hashedToken);
      if (!userId) {
        return res.redirect('/login?error=expired_token');
      }
      
      // Create session for the user
      req.session!.userId = userId;
      req.session!.authMethod = 'magic-link';
      
      // Update auth preferences
      await storage.updateUser(userId, { 
        lastAuthMethod: 'magic-link',
        preferredAuthMethod: 'magic-link'
      });
      
      // Clear the token
      await storage.clearResetToken(userId);
      
      // Redirect to dashboard
      res.redirect('/dashboard');
    } catch (error) {
      console.error("Magic login error:", error);
      res.redirect('/login?error=login_failed');
    }
  });

  // Traditional signup route
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email || '');
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password!, 10);
      
      // Create user with email auth preference
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        firstName: validatedData.firstName || null,
        lastName: validatedData.lastName || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        profileImageUrl: validatedData.profileImageUrl || null,
        stripeCustomerId: validatedData.stripeCustomerId || null,
        stripeSubscriptionId: validatedData.stripeSubscriptionId || null,
        referralCode: validatedData.referralCode || null,
        firstPickupDate: validatedData.firstPickupDate || null,
        preferredAuthMethod: 'email',
        lastAuthMethod: 'email'
      });
      
      req.session!.userId = user.id;
      req.session!.authMethod = 'email';
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // Traditional logout route
  app.get("/api/logout", (req: any, res) => {
    req.session?.destroy(() => {
      res.redirect('/');
    });
  });

  app.post("/api/auth/logout", (req: any, res) => {
    req.session?.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Debug route to check users
  app.get("/api/debug-users", async (req, res) => {
    try {
      const testEmails = ["test@example.com", "zach@mystoragevalet.com", "zjbrown11@gmail.com"];
      const userInfo = [];
      
      for (const email of testEmails) {
        const user = await storage.getUserByEmail(email);
        userInfo.push({
          email,
          found: !!user,
          id: user?.id,
          firstName: user?.firstName
        });
      }
      
      res.json({ users: userInfo });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Magic Link Login routes
  app.post("/api/auth/magic-link", async (req, res) => {
    const { email } = req.body;
    
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security
        return res.json({ message: "If an account exists, we've sent a magic link." });
      }

      // Generate magic link token
      const magicToken = crypto.randomBytes(32).toString('hex');
      const magicTokenExpires = new Date(Date.now() + 900000); // 15 minutes
      
      // Store magic link token (reuse reset token storage)
      await storage.saveResetToken(user.id, magicToken, magicTokenExpires);
      
      // Send email (placeholder for now)
      console.log(`Magic link: ${process.env.BASE_URL || 'http://localhost:5000'}/magic-link-verify?token=${magicToken}`);
      
      res.json({ message: "Magic link sent to your email" });
    } catch (error) {
      console.error("Magic link error:", error);
      res.status(500).json({ message: "Failed to send magic link" });
    }
  });

  app.post("/api/auth/magic-link-verify", async (req, res) => {
    const { token } = req.body;
    
    try {
      // Verify token and get user
      const userId = await storage.verifyResetToken(token);
      if (!userId) {
        return res.status(400).json({ message: "Invalid or expired magic link" });
      }
      
      // Clear the token
      await storage.clearResetToken(userId);
      
      // Create session
      req.session!.userId = userId;
      req.session!.authMethod = 'magic-link';
      
      // Get user data
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update auth preference
      await storage.updateUser(userId, { 
        lastAuthMethod: 'magic-link',
        preferredAuthMethod: 'magic-link'
      });
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Magic link verify error:", error);
      res.status(500).json({ message: "Failed to verify magic link" });
    }
  });

  // Password reset routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security
        return res.json({ message: "If an account exists, we've sent a reset link." });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour
      
      // Store reset token
      await storage.saveResetToken(user.id, resetToken, resetTokenExpires);
      
      // Send email (placeholder for now)
      console.log(`Password reset link: ${process.env.BASE_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`);
      
      res.json({ message: "Password reset link sent to your email" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, password } = req.body;
    
    try {
      // Verify token and get user
      const userId = await storage.verifyResetToken(token);
      if (!userId) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update password
      await storage.updateUserPassword(userId, hashedPassword);
      
      // Clear reset token
      await storage.clearResetToken(userId);
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Auth preferences route
  app.get("/api/auth/preferences/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const user = await storage.getUserByEmail(email);
      
      res.json({
        preferredAuthMethod: user?.preferredAuthMethod || 'email',
        lastAuthMethod: user?.lastAuthMethod || null,
        hasPassword: !!user?.password,
        hasSSO: !!user && !user.password // SSO users typically don't have passwords
      });
    } catch (error) {
      console.error("Error fetching auth preferences:", error);
      res.json({
        preferredAuthMethod: 'email',
        lastAuthMethod: null,
        hasPassword: false,
        hasSSO: false
      });
    }
  });

  // Admin middleware - restrict to specific admin emails  
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      let userId: string | null = null;
      let userEmail: string | null = null;
      
      // Check SSO auth first
      if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims) {
        userId = req.user.claims.sub;
        userEmail = req.user.claims.email;
      }
      // Check traditional session auth
      else if (req.session?.userId) {
        userId = req.session.userId;
        const user = await storage.getUser(userId!);
        userEmail = user?.email || '';
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

  // User items routes
  app.get("/api/items", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const items = await storage.getUserItems(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.post("/api/items", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const validatedData = insertItemSchema.parse(req.body);
      const itemData = {
        ...validatedData,
        userId,
        description: validatedData.description || null,
        facility: validatedData.facility || null,
        zone: validatedData.zone || null,
        rack: validatedData.rack || null,
        shelf: validatedData.shelf || null,
        lastScannedAt: validatedData.lastScannedAt || null,
        qrCode: validatedData.qrCode || '', // Ensure qrCode is never undefined
      };
      const item = await storage.createItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating item:", error);
      res.status(500).json({ message: "Failed to create item" });
    }
  });

  app.put("/api/items/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
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

  app.delete("/api/items/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
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

  // Bulk delete items
  app.delete("/api/items/bulk-delete", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
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
          deletePromises.push(storage.deleteItem(itemId).then(() => {
            deletedCount++;
          }));
        }
      }
      
      await Promise.all(deletePromises);
      
      res.json({ 
        message: `${deletedCount} items deleted successfully`,
        deletedCount 
      });
    } catch (error) {
      console.error("Error bulk deleting items:", error);
      res.status(500).json({ message: "Failed to bulk delete items" });
    }
  });

  // Bulk update items status
  app.put("/api/items/bulk/status", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { itemIds, status } = req.body;
      
      if (!itemIds || !Array.isArray(itemIds) || !status) {
        return res.status(400).json({ message: "Invalid request body" });
      }
      
      if (!['at_home', 'in_storage'].includes(status)) {
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
        updatedCount: updatedItems.length 
      });
    } catch (error) {
      console.error("Error bulk updating items:", error);
      res.status(500).json({ message: "Failed to bulk update items" });
    }
  });

  // Configure multer for memory storage
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit per file
    },
    fileFilter: (req, file, cb) => {
      // Accept only images
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Not an image! Please upload an image file.'));
      }
    },
  });

  // Photo upload endpoint
  app.post("/api/upload-photo", requireAuth, upload.single('photo'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Check if Dropbox token is configured
      if (!process.env.DROPBOX_TOKEN) {
        console.warn("DROPBOX_TOKEN not configured, using placeholder");
        // For development, return a working placeholder URL
        // Using picsum.photos for reliable placeholder images
        const randomId = Math.floor(Math.random() * 1000);
        const placeholderUrl = `https://picsum.photos/seed/${randomId}/400/300`;
        return res.json({ photoUrl: placeholderUrl });
      }

      // Initialize Dropbox client
      const dbx = new Dropbox({ accessToken: process.env.DROPBOX_TOKEN });

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const extension = req.file.originalname.split('.').pop() || 'jpg';
      const filename = `storage-valet/${timestamp}_${randomString}.${extension}`;

      // Upload to Dropbox
      const uploadResult = await dbx.filesUpload({
        path: `/${filename}`,
        contents: req.file.buffer,
        mode: { '.tag': 'add' },
        autorename: true,
        mute: false,
      });

      // Create shared link
      const sharedLinkResult = await dbx.sharingCreateSharedLinkWithSettings({
        path: uploadResult.result.path_display || uploadResult.result.path_lower || '',
        settings: {
          requested_visibility: { '.tag': 'public' },
        },
      });

      // Convert to direct download URL by replacing dl=0 with raw=1
      const photoUrl = sharedLinkResult.result.url.replace('dl=0', 'raw=1');

      res.json({ photoUrl });
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      
      // Handle Dropbox-specific errors
      if (error.error && error.error.error_summary) {
        if (error.error.error_summary.includes('shared_link_already_exists')) {
          // Try to get existing shared link
          try {
            const dbx = new Dropbox({ accessToken: process.env.DROPBOX_TOKEN });
            const existingLinks = await dbx.sharingListSharedLinks({
              path: error.error.error.shared_link_already_exists.metadata.path_lower,
            });
            if (existingLinks.result.links.length > 0) {
              const photoUrl = existingLinks.result.links[0].url.replace('dl=0', 'raw=1');
              return res.json({ photoUrl });
            }
          } catch (linkError) {
            console.error("Error getting existing link:", linkError);
          }
        }
      }

      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  // User movements routes
  app.get("/api/movements", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const movements = await storage.getUserMovements(userId);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching movements:", error);
      res.status(500).json({ message: "Failed to fetch movements" });
    }
  });

  app.post("/api/movements", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Convert scheduledDate string to Date object
      const movementData = {
        ...req.body,
        scheduledDate: new Date(req.body.scheduledDate)
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
      const movement = await storage.createMovement(movementCreateData);
      
      // Send email notification
      const user = await storage.getUser(userId);
      if (user && user.email) {
        const emailData = {
          type: movement.type as 'pickup' | 'delivery',
          customerName: `${user.firstName} ${user.lastName}`,
          customerEmail: user.email,
          scheduledDate: movement.scheduledDate.toLocaleDateString(),
          timeSlot: movement.scheduledTimeSlot,
          items: movement.itemIds,
          address: user.address || undefined,
          specialInstructions: movement.specialInstructions || undefined,
          confirmationNumber: emailService.generateConfirmationNumber(),
        };
        
        if (movement.type === 'pickup') {
          await emailService.sendPickupConfirmation(emailData);
        } else {
          await emailService.sendDeliveryConfirmation(emailData);
        }
      }
      
      res.json(movement);
    } catch (error) {
      console.error("Error creating movement:", error);
      res.status(500).json({ message: "Failed to create movement" });
    }
  });

  // Admin routes
  app.get("/api/admin/settings", requireAdmin, (req, res) => {
    // Return default admin settings
    const settings = {
      pricing: {
        starter: { monthly: 199, setup: 100 },
        medium: { monthly: 299, setup: 150 },
        family: { monthly: 359, setup: 180 },
      },
      insurance: {
        starter: 2000,
        medium: 3000,
        family: 4000,
      },
      calendar: {
        availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        timeSlots: [
          { id: "morning", label: "Morning (9-12 PM)", startTime: "09:00", endTime: "12:00", weekendOnly: false, premium: false },
          { id: "afternoon", label: "Afternoon (12-5 PM)", startTime: "12:00", endTime: "17:00", weekendOnly: false, premium: false },
          { id: "evening", label: "Evening (5-8 PM)", startTime: "17:00", endTime: "20:00", weekendOnly: false, premium: true },
          { id: "weekend-morning", label: "Weekend Morning (10-1 PM)", startTime: "10:00", endTime: "13:00", weekendOnly: true, premium: true },
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

  app.put("/api/admin/settings", requireAdmin, (req, res) => {
    console.log("Admin settings updated:", req.body);
    res.json({ message: "Settings updated successfully" });
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", requireAuth, async (req, res) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Email test route
  app.post("/api/test-email", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const testData = {
        type: 'pickup' as const,
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.email!,
        scheduledDate: new Date().toLocaleDateString(),
        timeSlot: "Morning (9-12 PM)",
        items: ["Test Item 1", "Test Item 2"],
        address: user.address || undefined,
        specialInstructions: "This is a test email",
        confirmationNumber: emailService.generateConfirmationNumber(),
      };

      const success = await emailService.sendPickupConfirmation(testData);
      
      res.json({ 
        success,
        message: success ? "Test email sent successfully" : "Failed to send test email"
      });
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  // AI Chat route
  app.post("/api/chat", requireAuth, async (req: any, res) => {
    try {
      const { message, context } = req.body;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      // Basic AI response - in production this would call OpenAI
      const response = `I understand you're asking about: "${message}". As your Storage Valet concierge, I'm here to help with your ${user?.plan || 'premium'} plan account. How else can I assist you today?`;
      
      res.json({ response });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Chat service unavailable" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}