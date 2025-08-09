import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { stripeService } from "../stripe-service";
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

// Create payment intent for setup fee
router.post("/api/create-payment-intent", async (req: Request, res: Response) => {
  try {
    const { amount, couponCode } = req.body;
    const userId = getUserId(req);

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create payment intent with optional coupon
    const result = await stripeService.createPaymentIntent(
      Math.round(amount * 100), // Convert to cents
      couponCode,
      {
        user_id: userId,
        user_email: user.email,
        payment_type: "setup_fee",
        plan: user.plan,
      }
    );

    res.json({
      clientSecret: result.clientSecret,
      finalAmount: result.amount,
      originalAmount: result.originalAmount,
      appliedCoupon: result.appliedCoupon,
    });
  } catch (error: any) {
    console.error("Payment intent creation error:", error);
    res.status(500).json({ message: "Error creating payment intent: " + error.message });
  }
});

// Create subscription - only called after first pickup is confirmed
router.post("/api/create-subscription", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user already has a subscription
    if (user.stripeSubscriptionId) {
      return res.status(400).json({ message: "User already has an active subscription" });
    }

    // Monthly subscription prices based on plan
    const monthlyPrices = {
      starter: 199,
      medium: 299,
      family: 349,
    };

    const monthlyAmount = monthlyPrices[user.plan as keyof typeof monthlyPrices] || 199;

    // Create Stripe customer if doesn't exist
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.id,
          plan: user.plan,
        },
      });
      customerId = customer.id;
      await storage.updateUser(userId, { stripeCustomerId: customerId });
    }

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
      customer: customerId,
      items: [{ price: price.id }],
      metadata: {
        userId: user.id,
        plan: user.plan,
      },
    });

    // Update user with subscription ID
    await storage.updateUser(userId, { stripeSubscriptionId: subscription.id });

    res.json({
      subscriptionId: subscription.id,
      message: "Monthly subscription created successfully",
    });
  } catch (error: any) {
    console.error("Subscription creation error:", error);
    res.status(500).json({ message: "Error creating subscription: " + error.message });
  }
});

// Get subscription status
router.get("/api/subscription-status", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.stripeSubscriptionId) {
      return res.json({
        hasSubscription: false,
        status: "no_subscription",
        plan: user.plan,
      });
    }

    // Get subscription from Stripe
    try {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      res.json({
        hasSubscription: true,
        status: subscription.status,
        plan: user.plan,
        currentPeriodEnd: (subscription as any).current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });
    } catch (stripeError) {
      // Subscription might not exist in Stripe
      console.error("Error fetching subscription:", stripeError);
      res.json({
        hasSubscription: false,
        status: "error",
        plan: user.plan,
      });
    }
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ message: "Failed to fetch subscription status" });
  }
});

// Update payment method
router.post("/api/update-payment-method", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { paymentMethodId } = req.body;

    const user = await storage.getUser(userId);
    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ message: "User or Stripe customer not found" });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });

    // Set as default payment method
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    res.json({ message: "Payment method updated successfully" });
  } catch (error: any) {
    console.error("Payment method update error:", error);
    res.status(500).json({ message: "Error updating payment method: " + error.message });
  }
});

// Cancel subscription
router.post("/api/cancel-subscription", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { immediate } = req.body;

    const user = await storage.getUser(userId);
    if (!user || !user.stripeSubscriptionId) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    if (immediate) {
      // Cancel immediately
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    res.json({
      message: immediate
        ? "Subscription cancelled immediately"
        : "Subscription will be cancelled at the end of the billing period",
    });
  } catch (error: any) {
    console.error("Subscription cancellation error:", error);
    res.status(500).json({ message: "Error cancelling subscription: " + error.message });
  }
});

export default router;
