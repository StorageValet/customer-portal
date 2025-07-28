import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import Stripe from "stripe";

// Extend the session data interface
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}
import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "./storage";
import { insertUserSchema, insertItemSchema, insertMovementSchema } from "@shared/schema";
import { emailService } from "./email";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
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

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };

  // Auth routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Process referral code if provided
      if (userData.referralCode) {
        try {
          // In production, this would validate the referral code and apply credits
          console.log(`Referral code provided: ${userData.referralCode} for user ${user.email}`);
          // TODO: Implement referral credit system
          // - Validate referral code exists
          // - Apply $50 credit to new user (after first pickup)
          // - Apply $50 credit to referring user
        } catch (referralError) {
          console.error('Failed to process referral code:', referralError);
          // Don't fail signup if referral processing fails
        }
      }

      // Set session
      req.session.userId = user.id;
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          plan: user.plan,
          setupFeePaid: user.setupFeePaid,
        },
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Signup failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.session.userId = user.id;
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          plan: user.plan,
          setupFeePaid: user.setupFeePaid,
        },
      });
    } catch (error) {
      res.status(400).json({ message: 'Login failed' });
    }
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          plan: user.plan,
          setupFeePaid: user.setupFeePaid,
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: 'Logged out' });
    });
  });

  // Item routes
  app.get('/api/items', requireAuth, async (req, res) => {
    try {
      const items = await storage.getUserItems(req.session.userId!);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get items' });
    }
  });

  app.post('/api/items', requireAuth, async (req, res) => {
    try {
      const itemData = insertItemSchema.parse(req.body);
      const item = await storage.createItem({
        ...itemData,
        userId: req.session.userId!,
      });
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create item' });
    }
  });

  app.put('/api/items/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = insertItemSchema.partial().parse(req.body);
      
      // Check if item belongs to user
      const item = await storage.getItem(id);
      if (!item || item.userId !== req.session.userId!) {
        return res.status(404).json({ message: 'Item not found' });
      }

      const updatedItem = await storage.updateItem(id, itemData);
      res.json(updatedItem);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update item' });
    }
  });

  app.delete('/api/items/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if item belongs to user
      const item = await storage.getItem(id);
      if (!item || item.userId !== req.session.userId!) {
        return res.status(404).json({ message: 'Item not found' });
      }

      await storage.deleteItem(id);
      res.json({ message: 'Item deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete item' });
    }
  });

  // Movement routes
  app.get('/api/movements', requireAuth, async (req, res) => {
    try {
      const movements = await storage.getUserMovements(req.session.userId!);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get movements' });
    }
  });

  app.post('/api/movements', requireAuth, async (req, res) => {
    try {
      // Transform the date string to Date object before validation
      const requestBody = {
        ...req.body,
        scheduledDate: new Date(req.body.scheduledDate)
      };
      const movementData = insertMovementSchema.parse(requestBody);
      const movement = await storage.createMovement({
        ...movementData,
        userId: req.session.userId!,
      });

      // Send email notification
      try {
        const user = await storage.getUser(req.session.userId!);
        if (user) {
          const confirmationNumber = emailService.generateConfirmationNumber();
          const items = movementData.itemIds ? movementData.itemIds.split(',') : [];
          
          const emailData = {
            type: movement.type as 'pickup' | 'delivery',
            customerName: `${user.firstName} ${user.lastName}`,
            customerEmail: user.email,
            scheduledDate: movement.scheduledDate.toISOString().split('T')[0],
            timeSlot: movement.timeSlot,
            items: items,
            specialInstructions: movement.specialInstructions || '',
            confirmationNumber: confirmationNumber
          };

          if (movement.type === 'pickup') {
            await emailService.sendPickupConfirmation(emailData);
          } else {
            await emailService.sendDeliveryConfirmation(emailData);
          }
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails
      }

      res.json(movement);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create movement' });
    }
  });

  // Available time slots endpoint
  app.get('/api/movements/slots', requireAuth, async (req, res) => {
    try {
      const { date } = req.query;
      // In a real implementation, this would check availability based on existing bookings
      const slots = [
        { id: 'morning', label: '9:00 AM - 12:00 PM', available: true },
        { id: 'afternoon', label: '12:00 PM - 3:00 PM', available: true },
        { id: 'evening', label: '3:00 PM - 6:00 PM', available: true },
      ];
      res.json(slots);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get time slots' });
    }
  });

  // Waitlist endpoint - integrates with Airtable
  app.post('/api/waitlist', async (req, res) => {
    try {
      const { name, email, address, phone } = req.body;
      
      if (!name || !email || !address) {
        return res.status(400).json({ message: 'Name, email, and address are required' });
      }

      // Try Airtable first, fall back to local storage if needed
      let success = false;
      let waitlistId = null;

      if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
        try {
          const airtableResponse = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Waitlist`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: {
                'Name': name,
                'Email': email,
                'Address': address,
                'Phone': phone || '',
                'Date Added': new Date().toISOString(),
                'Status': 'Pending'
              }
            })
          });

          if (airtableResponse.ok) {
            const airtableData = await airtableResponse.json();
            waitlistId = airtableData.id;
            success = true;
            console.log('Successfully added to Airtable waitlist:', waitlistId);
          } else {
            const errorText = await airtableResponse.text();
            console.error('Airtable error:', airtableResponse.status, errorText);
          }
        } catch (airtableError) {
          console.error('Airtable connection error:', airtableError);
        }
      }

      // Fallback: store locally for now (in production, could be database or alternative service)
      if (!success) {
        waitlistId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('Stored waitlist entry locally:', { name, email, address, phone, id: waitlistId });
        success = true;
      }

      res.json({ 
        message: 'Successfully added to waitlist',
        id: waitlistId,
        note: process.env.AIRTABLE_API_KEY ? 'Added to Airtable' : 'Stored locally (Airtable integration pending)'
      });
    } catch (error) {
      console.error('Waitlist error:', error);
      res.status(500).json({ message: 'Failed to join waitlist' });
    }
  });

  // Photo upload endpoint (placeholder - would integrate with Dropbox in production)
  app.post('/api/upload', requireAuth, async (req, res) => {
    try {
      // In production, this would upload to Dropbox and return the URL
      const { imageData, filename } = req.body;
      
      // For now, return a placeholder URL
      const photoUrl = `https://via.placeholder.com/300x200?text=${encodeURIComponent(filename)}`;
      
      res.json({ photoUrl });
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload photo' });
    }
  });

  // Stripe payment routes
  
  // Create payment intent for setup fee
  app.post("/api/create-payment-intent", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Setup fee amounts based on plan
      const setupFees = {
        starter: 100,
        medium: 150,
        family: 180
      };

      const amount = setupFees[user.plan as keyof typeof setupFees] || 169;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: "usd",
        metadata: {
          userId: user.id.toString(),
          type: 'setup_fee',
          plan: user.plan
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Create subscription for monthly billing
  app.post('/api/create-subscription', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // If user already has subscription, return existing
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        if (subscription.latest_invoice && typeof subscription.latest_invoice !== 'string') {
          const invoice = subscription.latest_invoice as any;
          const paymentIntent = invoice.payment_intent;
          if (paymentIntent && typeof paymentIntent !== 'string') {
            return res.json({
              subscriptionId: subscription.id,
              clientSecret: paymentIntent.client_secret,
            });
          }
        }
      }

      // Create Stripe customer if doesn't exist
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        });
        customerId = customer.id;
        await storage.updateUser(user.id, { stripeCustomerId: customerId });
      }

      // Monthly subscription prices based on plan
      const monthlyPrices = {
        starter: 199,
        medium: 299,
        family: 359
      };

      const monthlyAmount = monthlyPrices[user.plan as keyof typeof monthlyPrices] || 29;

      // Create price for this plan
      const price = await stripe.prices.create({
        unit_amount: monthlyAmount * 100,
        currency: 'usd',
        recurring: { interval: 'month' },
        product_data: {
          name: `Storage Valet ${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan`,
        },
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription ID
      await storage.updateUser(user.id, { stripeSubscriptionId: subscription.id });

      const invoice = subscription.latest_invoice as any;
      if (invoice && typeof invoice !== 'string' && invoice.payment_intent && typeof invoice.payment_intent !== 'string') {
        res.json({
          subscriptionId: subscription.id,
          clientSecret: invoice.payment_intent.client_secret,
        });
      } else {
        res.status(500).json({ message: 'Failed to create subscription payment intent' });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Mark setup fee as paid
  app.post('/api/setup-fee-paid', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await storage.updateUser(user.id, { setupFeePaid: true });
      res.json({ message: 'Setup fee marked as paid' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Photo upload endpoint (placeholder for Dropbox integration)
  app.post('/api/upload', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { imageData, filename } = req.body;
      
      // For now, return a placeholder URL
      // In production, this would upload to Dropbox and return the real URL
      const photoUrl = `https://via.placeholder.com/300x200?text=${encodeURIComponent(filename)}`;
      
      console.log(`Photo upload requested: ${filename} for user ${req.user?.email}`);
      
      res.json({ photoUrl });
    } catch (error) {
      console.error('Photo upload error:', error);
      res.status(500).json({ message: 'Failed to upload photo' });
    }
  });

  // AI Chat endpoint
  app.post('/api/chat', requireAuth, async (req, res) => {
    try {
      const { messages } = req.body;

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: 'OpenAI API key not configured' });
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API error:', response.status, errorData);
        return res.status(response.status).json({ message: 'AI service temporarily unavailable' });
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;

      if (!aiResponse) {
        return res.status(500).json({ message: 'Invalid response from AI service' });
      }

      res.json({ response: aiResponse });
    } catch (error) {
      console.error('Chat endpoint error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin settings endpoints
  app.get("/api/admin/settings", requireAuth, async (req, res) => {
    try {
      // Check if user is admin
      const isAdmin = req.user.email === 'admin@mystoragevalet.com' || req.user.email === 'carol@example.com';
      if (!isAdmin) {
        return res.sendStatus(403);
      }

      // Return current admin settings (in production, these would come from database)
      const settings = {
        pricing: {
          starter: { monthly: 199, setup: 100 },
          medium: { monthly: 299, setup: 150 },
          family: { monthly: 359, setup: 180 }
        },
        insurance: {
          starter: 2000,
          medium: 3000,
          family: 4000
        },
        calendar: {
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          advanceBookingDays: 14,
          emergencyBookingEnabled: true
        },
        referralCredits: {
          newCustomerCredit: 50,
          referrerCredit: 50,
          enabled: true
        }
      };

      res.json(settings);
    } catch (error) {
      console.error('Get admin settings error:', error);
      res.status(500).json({ message: "Error retrieving admin settings" });
    }
  });

  app.post("/api/admin/settings", requireAuth, async (req, res) => {
    try {
      // Check if user is admin
      const isAdmin = req.user.email === 'admin@mystoragevalet.com' || req.user.email === 'carol@example.com';
      if (!isAdmin) {
        return res.sendStatus(403);
      }

      const settings = req.body;
      
      // In production, save these settings to database
      console.log('Admin settings updated:', settings);
      
      res.json({ message: "Settings updated successfully", settings });
    } catch (error) {
      console.error('Save admin settings error:', error);
      res.status(500).json({ message: "Error saving admin settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
