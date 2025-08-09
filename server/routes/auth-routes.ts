import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage, getAirtableBase } from "../storage";
import { stripeService } from "../stripe-service";
import { emailService } from "../email";
import { z } from "zod";
import { authRateLimit, catchAsync } from "../middleware/security";
import Stripe from "stripe";
import { Tables } from "../airtable-mapping";

// Define validation schemas
const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  plan: z.enum(["starter", "medium", "family"]).default("starter"),
  referralCode: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

const MagicLinkSchema = z.object({
  email: z.string().email(),
});

const router = Router();

// ZIP allow-list
function parseZips(src?: string) {
  if (!src) return new Set<string>();
  return new Set(src.split(/[,\s]+/).filter(Boolean).map(z => z.trim()));
}
const SERVICEABLE = parseZips(process.env.SERVICEABLE_ZIPS);
const SELECTS = {
  status: ["New","Validated","Converted","Rejected"] as const,
  form: ["Softr","JotForm","Website","Manual"] as const,
} as const;
function pick<T extends readonly string[]>(val: unknown, allowed: T, fallback: T[number]) {
  if (typeof val === "string") {
    const hit = allowed.find(o => o.toLowerCase() === val.trim().toLowerCase());
    if (hit) return hit;
  }
  return fallback;
}

// Helper function to extract user ID from session
const getUserId = (req: Request): string => {
  if (!req.session?.user?.id) {
    throw new Error("User not authenticated");
  }
  return req.session.user.id;
};

// Get current user
router.get("/api/auth/user", async (req: Request, res: Response) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Fetch fresh user data from database
    const user = await storage.getUser(req.session.user.id);
    if (!user) {
      // Clear invalid session
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
      });
      return res.status(401).json({ message: "User not found" });
    }

    // Update session with fresh data (but exclude sensitive fields)
    const { passwordHash, ...userWithoutPassword } = user;
    req.session.user = {
      id: user.id,
      email: user.email,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    };

    // Setup fee status is determined by Stripe coupon validation during signup
    // No need to check hardcoded promo codes here anymore

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
});

// Login
router.post(
  "/api/auth/login",
  authRateLimit,
  catchAsync(async (req: Request, res: Response) => {
    try {
      const validatedData = LoginSchema.parse(req.body);

      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Enhanced password validation with logging
      if (!user.passwordHash) {
        console.error(`User ${user.email} has no password hash stored`);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      let isValidPassword = false;
      try {
        isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash);
      } catch (error) {
        console.error(`Password comparison error for ${user.email}:`, error);
        return res.status(500).json({ message: "Authentication error" });
      }

      if (!isValidPassword) {
        console.log(`Failed login attempt for ${user.email}`);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set up session
      req.session.user = {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      };

      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  })
);

// Forgot password
router.post(
  "/api/auth/forgot-password",
  authRateLimit,
  catchAsync(async (req: Request, res: Response) => {
    try {
      const validatedData = ForgotPasswordSchema.parse(req.body);

      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        // Don't reveal if email exists
        return res.json({ message: "If the email exists, a reset link has been sent." });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      // Save reset token
      await storage.saveResetToken(user.id, resetToken, resetExpires);

      // Send reset email
      const resetUrl = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

      const emailSent = await emailService.sendEmail({
        to: user.email,
        subject: "Reset Your Storage Valet Password",
        html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to create a new password:</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      });

      if (!emailSent) {
        console.error("Failed to send password reset email");
        return res.status(500).json({ message: "Failed to send reset email" });
      }

      res.json({ message: "If the email exists, a reset link has been sent." });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  })
);

// Reset password
router.post("/api/auth/reset-password", async (req: Request, res: Response) => {
  try {
    const validatedData = ResetPasswordSchema.parse(req.body);

    // Verify token
    const userId = await storage.verifyResetToken(validatedData.token);
    if (!userId) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Update password
    await storage.updateUserPassword(userId, hashedPassword);

    // Clear reset token
    await storage.clearResetToken(userId);

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

// Request magic link
router.post("/api/auth/magic-link", async (req: Request, res: Response) => {
  try {
    const validatedData = MagicLinkSchema.parse(req.body);

    const user = await storage.getUserByEmail(validatedData.email);
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: "If the email exists, a magic link has been sent." });
    }

    // Generate magic link token
    const magicToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 900000); // 15 minutes

    // Save magic token (reusing reset token functionality)
    await storage.saveResetToken(user.id, magicToken, tokenExpires);

    // Send magic link email
    const magicUrl = `${process.env.APP_URL || "http://localhost:3000"}/api/auth/magic-login?token=${magicToken}`;

    const emailSent = await emailService.sendEmail({
      to: user.email,
      subject: "Your Storage Valet Magic Link",
      html: `
        <h2>Sign in to Storage Valet</h2>
        <p>Click the link below to sign in to your account:</p>
        <p><a href="${magicUrl}" style="display: inline-block; padding: 10px 20px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px;">Sign In</a></p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send magic link" });
    }

    res.json({ message: "If the email exists, a magic link has been sent." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    console.error("Magic link error:", error);
    res.status(500).json({ message: "Failed to process request" });
  }
});

// Verify magic link
router.get("/api/auth/magic-login", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.redirect("/login?error=invalid_token");
    }

    // Verify token
    const userId = await storage.verifyResetToken(token);
    if (!userId) {
      return res.redirect("/login?error=expired_token");
    }

    // Get user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.redirect("/login?error=user_not_found");
    }

    // Set up session
    req.session.user = {
      id: user.id,
      email: user.email,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    };

    // Clear the token
    await storage.clearResetToken(userId);

    // Redirect to dashboard
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Magic login error:", error);
    res.redirect("/login?error=login_failed");
  }
});

// Signup
router.post(
  "/api/auth/signup",
  authRateLimit,
  catchAsync(async (req: Request, res: Response) => {
    try {
      const validatedData = SignupSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Validate Stripe coupon if provided
      let setupFeeWaived = false;
      let appliedCoupon = null;

      if (validatedData.referralCode) {
        const coupon = await stripeService.validateCoupon(validatedData.referralCode);
        if (coupon && coupon.valid) {
          // Check if this is a 100% off coupon (setup fee waiver)
          setupFeeWaived =
            (coupon.percentOff !== undefined && coupon.percentOff === 100) ||
            coupon.metadata?.waives_setup_fee === "true" ||
            false;
          appliedCoupon = validatedData.referralCode;
        }
      }

      // Create Stripe customer
      const stripeCustomer = await stripeService.createCustomer(validatedData.email || "", {
        name: `${validatedData.firstName || ""} ${validatedData.lastName || ""}`.trim(),
        coupon_applied: appliedCoupon || "",
        signup_date: new Date().toISOString(),
      });

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);

      // Create user
      const user = await storage.createUser({
        email: validatedData.email,
        passwordHash: hashedPassword,
        firstName: validatedData.firstName || null,
        lastName: validatedData.lastName || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        city: null,
        state: null,
        zip: null,
        plan: validatedData.plan,
        setupFeePaid: setupFeeWaived,
        stripeCustomerId: stripeCustomer.id,
        stripeSubscriptionId: null,
        profileImageUrl: null,
        referralCode: validatedData.referralCode || null,
        insuranceCoverage:
          validatedData.plan === "starter" ? 2000 : validatedData.plan === "medium" ? 3000 : 4000,
        firstPickupDate: null,
        preferredAuthMethod: "email",
        lastAuthMethod: "email",
      });

      // Log Stripe coupon usage if applicable
      if (setupFeeWaived) {
        console.log(
          `Stripe coupon ${validatedData.referralCode} applied - setup fee waived for ${user.email}`
        );
      }

      // Set up session
      req.session.user = {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      };

      const { passwordHash, ...userWithoutPassword } = user;
      res.status(201).json({
        user: userWithoutPassword,
        message: setupFeeWaived
          ? "Account created successfully! Your setup fee has been waived."
          : "Account created successfully!",
      });

      // Send welcome email
      emailService.sendEmail({
        to: user.email,
        subject: "Welcome to Storage Valet! 🎉",
        html: `
        <h2>Welcome to Storage Valet, ${user.firstName}!</h2>
        <p>We're thrilled to have you join our community.</p>
        ${
          setupFeeWaived
            ? "<p><strong>Great news!</strong> Your setup fee has been waived with the promo code you used.</p>"
            : ""
        }
        <p>Here's what you can do next:</p>
        <ul>
          <li>Add items to your inventory</li>
          <li>Schedule your first pickup</li>
          <li>Explore your dashboard</li>
        </ul>
        <p>If you have any questions, our support team is here to help!</p>
      `,
      });

      // Log Stripe coupon usage for tracking
      if (setupFeeWaived) {
        console.log(
          `Stripe coupon used: ${validatedData.referralCode} - Setup fee waived for ${user.email}`
        );
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  })
);

// Validate Stripe coupon endpoint
router.post("/api/validate-promo", async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.json({ valid: false, message: "Please enter a promo code" });
    }

    const coupon = await stripeService.validateCoupon(code);

    if (coupon && coupon.valid) {
      // Check if this coupon waives the setup fee
      const waivesSetupFee =
        (coupon.percentOff !== undefined && coupon.percentOff === 100) ||
        coupon.metadata?.waives_setup_fee === "true" ||
        false;

      let message = "Valid promo code!";
      if (waivesSetupFee) {
        message = "Valid promo code! Setup fee will be waived.";
      } else if (coupon.percentOff) {
        message = `Valid promo code! ${coupon.percentOff}% off your setup fee.`;
      } else if (coupon.amountOff) {
        message = `Valid promo code! $${(coupon.amountOff / 100).toFixed(2)} off your setup fee.`;
      }

      res.json({
        valid: true,
        message,
        waivesSetupFee,
        percentOff: coupon.percentOff,
        amountOff: coupon.amountOff,
      });
    } else {
      res.json({
        valid: false,
        message: "Invalid promo code",
        waivesSetupFee: false,
      });
    }
  } catch (error) {
    console.error("Promo validation error:", error);
    res.status(500).json({ valid: false, message: "Failed to validate promo code" });
  }
});

// Logout endpoints (both GET and POST for compatibility)
router.get("/api/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.redirect("/login");
  });
});

router.post("/api/auth/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// Get user preferences by email (for SSO)
router.get("/api/auth/preferences/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: "Email parameter is required" });
    }

    // Decode email in case it's URL encoded
    const decodedEmail = decodeURIComponent(email);

    // Get user from storage
    const user = await storage.getUserByEmail(decodedEmail);

    if (!user) {
      // Return default preferences for new users
      return res.json({
        email: decodedEmail,
        preferredAuthMethod: "password",
        hasPassword: false,
        isNewUser: true,
      });
    }

    // Check if user has a password set
    const hasPassword = !!(user.passwordHash && user.passwordHash.length > 0);

    // Determine preferred auth method
    let preferredAuthMethod = "password"; // Default

    // If user has used SSO before (has lastAuthMethod), prefer that
    if (user.lastAuthMethod) {
      preferredAuthMethod = user.lastAuthMethod;
    } else if (user.preferredAuthMethod) {
      preferredAuthMethod = user.preferredAuthMethod;
    } else if (!hasPassword) {
      // If no password set, prefer SSO
      preferredAuthMethod = "sso";
    }

    return res.json({
      email: user.email,
      preferredAuthMethod,
      hasPassword,
      isNewUser: false,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  } catch (error) {
    console.error("Error fetching auth preferences:", error);
    res.status(500).json({ error: "Failed to fetch auth preferences" });
  }
});

// POST /api/auth/register (portal signup with Stripe checkout)
// Body: { email, full_name, phone?, zip, agree_tos, plan_tier: "199"|"299"|"359", property_name?, unit?, form_source?="Website" }
router.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const body = z.object({
      email: z.string().email(),
      full_name: z.string().min(1),
      phone: z.string().optional(),
      zip: z.string().min(3).max(10),
      agree_tos: z.union([z.boolean(), z.string()]),
      plan_tier: z.enum(["199","299","359"]),
      property_name: z.string().optional(),
      unit: z.string().optional(),
      form_source: z.string().optional(),
    }).parse(req.body || {});

    const tosAccepted = ((): boolean => {
      const v:any = body.agree_tos;
      if (v === true || v === false) return v;
      if (typeof v === "string") return ["true","1","yes","y","on","checked"].includes(v.toLowerCase());
      return false;
    })();
    if (!tosAccepted) return res.status(400).json({ ok:false, error:"You must accept the Terms of Service." });

    const zip = String(body.zip).trim().slice(0,10);
    const isServiceable = SERVICEABLE.size ? SERVICEABLE.has(zip) : true; // default open if unset

    const base = getAirtableBase();
    const Leads = Tables.Leads || "Leads";
    const nowIso = new Date().toISOString();
    const [firstName, ...rest] = body.full_name.trim().split(/\s+/);
    const lastName = rest.join(" ");

    // Create lead record - Note: ZIP Code field might not exist yet in Airtable
    const leadData: any = {
      "Email": body.email.toLowerCase(),
      "Full Name": body.full_name,
      "First Name": firstName,
      "Last Name": lastName,
      "Phone": body.phone || undefined,
      "Property Name": body.property_name || undefined,
      "Unit": body.unit || undefined,
      "Form Source": pick(body.form_source || "Website", SELECTS.form, "Website"),
      "Status": isServiceable ? "New" : "Rejected", // Using Rejected for waitlist until Waitlist option added
      "Submission Date": nowIso.split("T")[0],
      "Submission ID": `portal-${Date.now()}`,
      "Agree TOS": true,
    };
    
    // Store ZIP in Notes field for now if ZIP Code field doesn't exist
    // TODO: Add ZIP Code field to Airtable Leads table
    leadData["Notes"] = isServiceable ? `ZIP: ${zip}` : `WAITLIST - ZIP: ${zip} (not serviceable)`;
    
    const lead = await base(Leads).create(leadData);

    // If not serviceable → stop here.
    if (!isServiceable) {
      return res.json({ ok:true, status:"waitlist", lead_id: lead.id });
    }

    // Serviceable → Create Stripe Checkout Session and return checkout_url
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("Missing STRIPE_SECRET_KEY");
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" as any });

    const priceMap: Record<string, string | undefined> = {
      "199": process.env.STRIPE_PRICE_199,
      "299": process.env.STRIPE_PRICE_299,
      "359": process.env.STRIPE_PRICE_359,
    };
    const priceId = priceMap[body.plan_tier];
    if (!priceId) throw new Error(`Missing Stripe price ID for plan ${body.plan_tier}`);

    const successUrl = process.env.STRIPE_SUCCESS_URL || `${process.env.PORTAL_BASE_URL || "http://localhost:3000"}/checkout/success`;
    const cancelUrl = process.env.STRIPE_CANCEL_URL || `${process.env.PORTAL_BASE_URL || "http://localhost:3000"}/signup?cancelled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl + "?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: cancelUrl,
      customer_email: body.email.toLowerCase(),
      client_reference_id: lead.id, // so Zapier/Stripe event can tie back
      metadata: {
        lead_id: lead.id,
        plan_tier: body.plan_tier,
        zip,
        source: "portal",
      },
    });

    return res.json({ ok:true, status:"serviceable", lead_id: lead.id, checkout_url: session.url });

  } catch (e:any) {
    return res.status(400).json({ ok:false, error: e.message });
  }
});

export default router;
