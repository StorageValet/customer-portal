/**
 * Authentication Routes - Simplified for v7 Schema
 */

import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage-v7";
import { stripeService } from "../stripe-service";

const router = Router();

// Validation schemas - Complete form with address
const SignupSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().min(1),
  unit: z.string().optional(),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().regex(/^(07030|07302|07304|07305|07306|07307|07310|07311|07086|07087|07093|07020|07047)$/),
  plan_tier: z.string(),
  promo_code: z.string().optional(),
  agree_tos: z.string().optional(),
  form_source: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/signup (also aliased as /register for compatibility)
router.post("/signup", async (req, res) => {
  try {
    const data = SignupSchema.parse(req.body);
    
    // Parse the full name into first and last
    const nameParts = data.full_name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';
    
    // Map plan_tier value to plan name
    const planMap: Record<string, string> = {
      '199': 'Starter',
      '299': 'Medium', 
      '359': 'Family'
    };
    const plan = planMap[data.plan_tier || '199'] || 'Starter';
    
    // Generate a temporary password (user will need to reset)
    const tempPassword = `TempPass${Math.random().toString(36).slice(2, 10)}`;
    
    // Check if email already exists
    const existing = await storage.getCustomerByEmail(data.email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }
    
    // Create Stripe customer
    const stripeCustomer = await stripeService.createCustomer(data.email, {
      name: `${firstName} ${lastName}`,
      phone: data.phone,
    });
    
    // Check promo code for setup fee waiver
    let setupFeeWaived = false;
    let promoCode = '';
    if (data.promo_code) {
      try {
        const coupon = await stripeService.validateCoupon(data.promo_code);
        if (coupon) {
          setupFeeWaived = true;
          promoCode = data.promo_code;
        }
      } catch (error) {
        console.log("Invalid promo code:", data.promo_code);
      }
    }
    
    // Create customer in Airtable with FULL address
    const fullAddress = data.unit 
      ? `${data.address}, ${data.unit}, ${data.city}, ${data.state} ${data.zip}`
      : `${data.address}, ${data.city}, ${data.state} ${data.zip}`;
    
    const customer = await storage.createCustomer({
      email: data.email,
      password: tempPassword,  // Temporary - will send magic link for them to set password
      firstName: firstName,
      lastName: lastName,
      phone: data.phone,
      serviceAddress: fullAddress,
      zipCode: data.zip,
      plan: plan,
      stripeCustomerId: stripeCustomer.id,
      setupFeePaid: false,
      setupFeeWaivedBy: data.promo_code || '',
    });
    
    // Create ops task for follow-up
    await storage.createOpsTask({
      type: 'New Setup Fee',
      customerId: customer.id,
      priority: 'High',
      actionRequired: setupFeeWaived 
        ? 'Setup fee waived - follow up for first pickup'
        : 'Collect setup fee and schedule first pickup',
      dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
    });
    
    // Set session
    req.session.userId = customer.id;
    req.session.userEmail = customer.email;
    
    res.json({
      user: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        plan: customer.monthlyPlan,
        setupFeePaid: customer.setupFeePaid,
        setupFeeWaived: setupFeeWaived,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error("Signup error:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// Alias /register to /signup for frontend compatibility
router.post("/register", async (req, res) => {
  try {
    const data = SignupSchema.parse(req.body);
    
    // Check if email already exists
    const existing = await storage.getCustomerByEmail(data.email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }
    
    // Create Stripe customer
    const stripeCustomer = await stripeService.createCustomer(data.email, {
      name: `${firstName} ${lastName}`,
      phone: data.phone,
    });
    
    // Check promo code for setup fee waiver
    let setupFeeWaived = false;
    let promoCode = '';
    if (data.promo_code) {
      try {
        const coupon = await stripeService.validateCoupon(data.promo_code);
        if (coupon) {
          setupFeeWaived = true;
          promoCode = data.promo_code;
        }
      } catch (error) {
        console.log("Invalid promo code:", data.promo_code);
      }
    }
    
    // Create customer in Airtable with FULL address
    const fullAddress = data.unit 
      ? `${data.address}, ${data.unit}, ${data.city}, ${data.state} ${data.zip}`
      : `${data.address}, ${data.city}, ${data.state} ${data.zip}`;
    
    const customer = await storage.createCustomer({
      email: data.email,
      password: tempPassword,  // Temporary - will send magic link for them to set password
      firstName: firstName,
      lastName: lastName,
      phone: data.phone,
      serviceAddress: fullAddress,
      zipCode: data.zip,
      plan: plan,
      stripeCustomerId: stripeCustomer.id,
      setupFeePaid: false,
      setupFeeWaivedBy: data.promo_code || '',
    });
    
    // Create ops task for follow-up
    await storage.createOpsTask({
      type: 'New Setup Fee',
      customerId: customer.id,
      priority: 'High',
      actionRequired: setupFeeWaived 
        ? 'Setup fee waived - follow up for first pickup'
        : 'Collect setup fee and schedule first pickup',
      dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
    });
    
    // Set session
    req.session.userId = customer.id;
    req.session.userEmail = customer.email;
    
    res.json({
      user: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        plan: customer.monthlyPlan,
        setupFeePaid: customer.setupFeePaid,
        setupFeeWaived: setupFeeWaived,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error("Signup error:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    
    // Validate credentials
    const isValid = await storage.validatePassword(email, password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    // Get customer
    const customer = await storage.getCustomerByEmail(email);
    if (!customer) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    // Set session
    req.session.userId = customer.id;
    req.session.userEmail = customer.email;
    
    res.json({
      user: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        plan: customer.monthlyPlan,
        setupFeePaid: customer.setupFeePaid,
        subscriptionStatus: customer.subscriptionStatus,
        // Usage data for visual indicators
        planCubicFeet: customer.planCubicFeet,
        usedCubicFeet: customer.usedCubicFeet,
        planInsurance: customer.planInsurance,
        usedInsurance: customer.usedInsurance,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// GET /api/auth/me (also /user for compatibility)
router.get("/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    const customer = await storage.getCustomerById(req.session.userId);
    if (!customer) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "Session invalid" });
    }
    
    res.json({
      user: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        plan: customer.monthlyPlan,
        setupFeePaid: customer.setupFeePaid,
        subscriptionStatus: customer.subscriptionStatus,
        // Usage data for visual indicators
        planCubicFeet: customer.planCubicFeet,
        usedCubicFeet: customer.usedCubicFeet,
        planInsurance: customer.planInsurance,
        usedInsurance: customer.usedInsurance,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    
    const customer = await storage.getCustomerByEmail(email);
    if (!customer) {
      // Don't reveal if email exists
      return res.json({ message: "If the email exists, a reset link has been sent" });
    }
    
    // Generate reset token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    await storage.saveResetToken(customer.id, token, expires);
    
    // TODO: Send email with reset link
    console.log(`Password reset link: http://localhost:3000/reset-password?token=${token}`);
    
    res.json({ message: "If the email exists, a reset link has been sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = z.object({
      token: z.string(),
      password: z.string().min(8),
    }).parse(req.body);
    
    const userId = await storage.verifyResetToken(token);
    if (!userId) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }
    
    await storage.updateUserPassword(userId, password);
    await storage.clearResetToken(userId);
    
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Alias /user to /me for frontend compatibility
router.get("/user", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    const customer = await storage.getCustomer(req.session.userId);
    if (!customer) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      plan: customer.monthlyPlan,
      setupFeePaid: customer.setupFeePaid,
      insuranceCoverage: customer.planInsurance,
      stripeCustomerId: customer.stripeCustomerId,
      stripeSubscriptionId: customer.stripeSubscriptionId,
      phone: customer.phone,
      address: customer.serviceAddress,
      zip: customer.zipCode,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

export default router;