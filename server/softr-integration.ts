import { Request, Response } from "express";
import crypto from "crypto";
import { storage } from "./storage";
import { EmailService } from "./email";

// Softr webhook security
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(`sha256=${expectedSignature}`), Buffer.from(signature));
}

export class SoftrIntegration {
  private emailService: EmailService;

  constructor() {
    this.emailService = EmailService.getInstance();
  }

  // Handle new customer registration from Softr
  async handleCustomerCreated(req: Request, res: Response) {
    try {
      // Verify webhook signature
      const signature = req.headers["x-softr-signature"] as string;
      const payload = JSON.stringify(req.body);

      if (!verifyWebhookSignature(payload, signature, process.env.SOFTR_WEBHOOK_SECRET!)) {
        return res.status(401).json({ error: "Invalid signature" });
      }

      const customerData = req.body;

      // Extract customer information from Softr
      const {
        email,
        firstName,
        lastName,
        phone,
        address,
        city,
        state,
        zip,
        plan,
        promoCode,
        stripeCustomerId,
        setupFeePaid,
      } = customerData;

      // Generate temporary access token for portal
      const accessToken = crypto.randomBytes(32).toString("hex");
      const temporaryPassword = crypto.randomBytes(12).toString("base64").slice(0, 12);

      // Create user in portal database
      const hashedPassword = await this.hashPassword(temporaryPassword);

      const userData = {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        profileImageUrl: null,
        phone,
        address,
        city,
        state,
        zip,
        plan,
        setupFeePaid: setupFeePaid === "true",
        stripeCustomerId,
        stripeSubscriptionId: null,
        referralCode: promoCode || null,
        insuranceCoverage: this.getInsuranceCoverageForPlan(plan),
        firstPickupDate: null,
        preferredAuthMethod: "email",
        lastAuthMethod: "email",
      };

      // Save to Airtable
      await storage.createUser(userData);

      // Send welcome email with portal access
      await this.sendPortalWelcomeEmail(email, firstName, temporaryPassword, accessToken);

      // Log successful integration
      console.log(`✅ Customer created from Softr: ${email}`);

      res.json({
        success: true,
        message: "Customer created successfully",
        portalAccess: true,
      });
    } catch (error) {
      console.error("❌ Error creating customer from Softr:", error);
      res.status(500).json({ error: "Failed to create customer" });
    }
  }

  // Helper method to get insurance coverage based on plan
  private getInsuranceCoverageForPlan(plan: string): number {
    const coverageMap: { [key: string]: number } = {
      starter: 5000,
      medium: 15000,
      family: 25000,
    };
    return coverageMap[plan.toLowerCase()] || 5000;
  }

  // Handle plan updates from Softr
  async handlePlanUpdated(req: Request, res: Response) {
    try {
      const signature = req.headers["x-softr-signature"] as string;
      const payload = JSON.stringify(req.body);

      if (!verifyWebhookSignature(payload, signature, process.env.SOFTR_WEBHOOK_SECRET!)) {
        return res.status(401).json({ error: "Invalid signature" });
      }

      const { email, newPlan, oldPlan } = req.body;

      // Update user plan in portal
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.updateUser(user.id, {
        plan: newPlan,
      });

      // Send plan change notification
      await this.emailService.sendEmail({
        to: email,
        subject: "Plan Updated - Storage Valet",
        html: `
          <h2>Your plan has been updated</h2>
          <p>Your Storage Valet plan has been changed from ${oldPlan} to ${newPlan}.</p>
          <p>You can view your updated benefits in your portal at: 
          <a href="https://portal.mystoragevalet.com">portal.mystoragevalet.com</a></p>
        `,
      });

      console.log(`✅ Plan updated for ${email}: ${oldPlan} → ${newPlan}`);

      res.json({ success: true, message: "Plan updated successfully" });
    } catch (error) {
      console.error("❌ Error updating plan from Softr:", error);
      res.status(500).json({ error: "Failed to update plan" });
    }
  }

  // Handle payment updates from Softr
  async handlePaymentUpdated(req: Request, res: Response) {
    try {
      const signature = req.headers["x-softr-signature"] as string;
      const payload = JSON.stringify(req.body);

      if (!verifyWebhookSignature(payload, signature, process.env.SOFTR_WEBHOOK_SECRET!)) {
        return res.status(401).json({ error: "Invalid signature" });
      }

      const { email, paymentStatus, stripeSubscriptionId, setupFeePaid } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.updateUser(user.id, {
        stripeSubscriptionId,
        setupFeePaid: setupFeePaid === "true",
      });

      console.log(`✅ Payment updated for ${email}: Status ${paymentStatus}`);

      res.json({ success: true, message: "Payment updated successfully" });
    } catch (error) {
      console.error("❌ Error updating payment from Softr:", error);
      res.status(500).json({ error: "Failed to update payment" });
    }
  }

  // Sync customer data back to Softr (if needed)
  async syncToSoftr(customerId: string, updateData: any) {
    try {
      // This would be used to send data back to Softr
      // Implementation depends on Softr's API capabilities

      const response = await fetch(`${process.env.SOFTR_API_BASE}/customers/${customerId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.SOFTR_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`Softr API error: ${response.statusText}`);
      }

      console.log(`✅ Synced data to Softr for customer: ${customerId}`);
      return true;
    } catch (error) {
      console.error("❌ Error syncing to Softr:", error);
      return false;
    }
  }

  // Send portal welcome email with access credentials
  private async sendPortalWelcomeEmail(
    email: string,
    firstName: string,
    temporaryPassword: string,
    accessToken: string
  ) {
    const portalUrl = `https://portal.mystoragevalet.com/login?token=${accessToken}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e3a8a;">Welcome to Storage Valet, ${firstName}!</h1>
        
        <p>Thank you for choosing Storage Valet for your storage needs. Your customer portal is now ready!</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Portal Access:</h3>
          <p><strong>Portal URL:</strong> <a href="${portalUrl}">portal.mystoragevalet.com</a></p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
        </div>
        
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Click the link above to access your portal</li>
          <li>Change your password to something secure</li>
          <li>Add your first items to schedule a pickup</li>
          <li>Explore your dashboard and features</li>
        </ol>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>🎯 Pro Tip:</strong> Use your portal to track items, schedule pickups/deliveries, and chat with our AI assistant for instant help!</p>
        </div>
        
        <p>Questions? Reply to this email or use the chat feature in your portal.</p>
        
        <p>Welcome to the future of storage!</p>
        <p>The Storage Valet Team</p>
      </div>
    `;

    await this.emailService.sendEmail({
      to: email,
      subject: "🚀 Your Storage Valet Portal is Ready!",
      html: emailHtml,
    });
  }

  // Utility function for password hashing
  private async hashPassword(password: string): Promise<string> {
    const bcrypt = await import("bcrypt");
    return bcrypt.hash(password, 10);
  }
}

export const softrIntegration = new SoftrIntegration();
