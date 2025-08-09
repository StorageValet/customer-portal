import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export class StripeService {
  private static instance: StripeService;

  static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  /**
   * Validate a coupon code
   * @param code The coupon code to validate
   * @returns Coupon details if valid, null if invalid
   */
  async validateCoupon(code: string): Promise<{
    valid: boolean;
    percentOff?: number;
    amountOff?: number;
    currency?: string;
    duration?: string;
    metadata?: Record<string, string>;
  } | null> {
    try {
      const coupon = await stripe.coupons.retrieve(code);

      if (!coupon.valid) {
        return null;
      }

      return {
        valid: true,
        percentOff: coupon.percent_off || undefined,
        amountOff: coupon.amount_off || undefined,
        currency: coupon.currency || undefined,
        duration: coupon.duration,
        metadata: coupon.metadata || undefined,
      };
    } catch (error) {
      // Coupon not found or other error
      console.error("Coupon validation error:", error);
      return null;
    }
  }

  /**
   * Create a checkout session with optional coupon
   * @param amount Amount in cents
   * @param customerId Stripe customer ID
   * @param couponCode Optional coupon code
   * @param metadata Session metadata
   */
  async createCheckoutSession(params: {
    amount: number;
    customerId?: string;
    couponCode?: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }) {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Storage Valet Setup Fee",
              description: "One-time setup fee for your Storage Valet account",
            },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    };

    if (params.customerId) {
      sessionParams.customer = params.customerId;
    }

    if (params.couponCode) {
      sessionParams.discounts = [
        {
          coupon: params.couponCode,
        },
      ];
    }

    return await stripe.checkout.sessions.create(sessionParams);
  }

  /**
   * Create a payment intent with optional coupon
   * @param amount Amount in cents before discount
   * @param couponCode Optional coupon code
   * @returns Payment intent with adjusted amount
   */
  async createPaymentIntent(
    amount: number,
    couponCode?: string,
    metadata?: Record<string, string>
  ) {
    let finalAmount = amount;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await this.validateCoupon(couponCode);
      if (coupon && coupon.valid) {
        if (coupon.percentOff) {
          finalAmount = Math.round(amount * (1 - coupon.percentOff / 100));
        } else if (coupon.amountOff) {
          finalAmount = Math.max(0, amount - coupon.amountOff);
        }
        appliedCoupon = couponCode;
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: "usd",
      metadata: {
        ...metadata,
        original_amount: amount.toString(),
        applied_coupon: appliedCoupon || "",
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      amount: finalAmount,
      originalAmount: amount,
      appliedCoupon,
    };
  }

  /**
   * Create a Stripe customer
   * @param email Customer email
   * @param metadata Additional metadata
   */
  async createCustomer(email: string, metadata?: Record<string, string>) {
    return await stripe.customers.create({
      email,
      metadata,
    });
  }

  /**
   * Create a subscription with optional coupon
   * @param customerId Stripe customer ID
   * @param priceId Stripe price ID for the plan
   * @param couponCode Optional coupon code
   */
  async createSubscription(customerId: string, priceId: string, couponCode?: string) {
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    };

    if (couponCode) {
      (subscriptionParams as any).coupon = couponCode;
    }

    return await stripe.subscriptions.create(subscriptionParams);
  }
}

export const stripeService = StripeService.getInstance();
