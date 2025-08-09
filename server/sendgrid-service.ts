import sgMail from "@sendgrid/mail";
import type { MailDataRequired } from "@sendgrid/mail";

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_SENDER = process.env.EMAIL_SENDER || "zach@mystoragevalet.com";
const FROM_NAME = "Storage Valet";

if (SENDGRID_API_KEY && SENDGRID_API_KEY !== "your-sendgrid-api-key") {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log("✅ SendGrid configured with sender:", EMAIL_SENDER);
} else {
  console.log("⚠️  SendGrid API key not configured - emails will be logged to console");
}

export class SendGridService {
  private static instance: SendGridService;
  private isConfigured = !!SENDGRID_API_KEY && SENDGRID_API_KEY !== "your-sendgrid-api-key";

  private constructor() {}

  static getInstance(): SendGridService {
    if (!SendGridService.instance) {
      SendGridService.instance = new SendGridService();
    }
    return SendGridService.instance;
  }

  async initialize() {
    // No-op - initialization happens at module load
    if (!this.isConfigured) {
      console.log("\nTo set up SendGrid:");
      console.log("1. Create a free account at https://sendgrid.com");
      console.log("2. Verify your sender domain (mystoragevalet.com)");
      console.log('3. Generate an API key with "Mail Send" permission');
      console.log("4. Add to .env:");
      console.log("   SENDGRID_API_KEY=SG.your-api-key");
      console.log("   EMAIL_SENDER=zach@mystoragevalet.com");
    }
  }

  private async sendEmail(data: MailDataRequired): Promise<void> {
    const msg = {
      ...data,
      from: data.from || { email: EMAIL_SENDER, name: FROM_NAME },
    };

    if (!this.isConfigured) {
      // Fallback to console logging
      console.log("📧 Email (fallback mode):", {
        to: msg.to,
        subject: msg.subject,
        preview: msg.text?.toString().substring(0, 100) + "...",
      });
      return;
    }

    try {
      await sgMail.send(msg);
      console.log(`✅ Email sent to ${msg.to}`);
    } catch (error: any) {
      console.error("❌ SendGrid error:", error?.response?.body || error.message);

      // Fallback to console
      console.log("📧 Email (fallback after error):", {
        to: msg.to,
        subject: msg.subject,
        preview: msg.text?.toString().substring(0, 100) + "...",
      });
    }
  }

  // Email template methods
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const msg: MailDataRequired = {
      to: email,
      from: {
        email: EMAIL_SENDER,
        name: FROM_NAME,
      },
      subject: "Welcome to Storage Valet!",
      text: `Hi ${firstName},\n\nWelcome to Storage Valet! We're excited to help you declutter your space.\n\nYour account has been created successfully. You can now schedule pickups and manage your stored items through our portal.\n\nIf you have any questions, feel free to reach out to our support team.\n\nBest regards,\nThe Storage Valet Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Welcome to Storage Valet!</h2>
          <p>Hi ${firstName},</p>
          <p>We're excited to help you declutter your space and make storage simple.</p>
          <p>Your account has been created successfully. You can now:</p>
          <ul>
            <li>Schedule pickups for items you want to store</li>
            <li>View and manage your stored items</li>
            <li>Request delivery when you need items back</li>
          </ul>
          <p>If you have any questions, our support team is here to help!</p>
          <p>Best regards,<br>The Storage Valet Team</p>
        </div>
      `,
    };

    await this.sendEmail(msg);
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.BASE_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    const msg: MailDataRequired = {
      to: email,
      from: {
        email: EMAIL_SENDER,
        name: FROM_NAME,
      },
      subject: "Reset Your Storage Valet Password",
      text: `You requested a password reset. Click this link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Reset Your Password</h2>
          <p>You requested a password reset for your Storage Valet account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #14b8a6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    await this.sendEmail(msg);
  }

  async sendPickupConfirmation(
    email: string,
    customerName: string,
    scheduledDate: string,
    timeSlot: string,
    itemCount: number
  ): Promise<void> {
    const msg: MailDataRequired = {
      to: email,
      from: {
        email: EMAIL_SENDER,
        name: FROM_NAME,
      },
      subject: `Pickup Confirmed - ${scheduledDate}`,
      text: `Hi ${customerName},\n\nYour pickup has been confirmed!\n\nDate: ${scheduledDate}\nTime: ${timeSlot}\nItems: ${itemCount}\n\nOur team will arrive at your registered address during the scheduled time slot.\n\nBest regards,\nThe Storage Valet Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Pickup Confirmed!</h2>
          <p>Hi ${customerName},</p>
          <p>Your pickup has been scheduled successfully.</p>
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Pickup Details</h3>
            <p><strong>Date:</strong> ${scheduledDate}</p>
            <p><strong>Time:</strong> ${timeSlot}</p>
            <p><strong>Items to pickup:</strong> ${itemCount}</p>
            <p><strong>Location:</strong> Your registered address</p>
          </div>
          <p>Our team will arrive during your scheduled time slot. Please have your items ready for pickup.</p>
          <p>You can manage your pickup from your dashboard if you need to make any changes.</p>
          <p>Best regards,<br>The Storage Valet Team</p>
        </div>
      `,
    };

    await this.sendEmail(msg);
  }

  async sendDeliveryConfirmation(
    email: string,
    customerName: string,
    scheduledDate: string,
    timeSlot: string,
    itemCount: number
  ): Promise<void> {
    const msg: MailDataRequired = {
      to: email,
      from: {
        email: EMAIL_SENDER,
        name: FROM_NAME,
      },
      subject: `Delivery Confirmed - ${scheduledDate}`,
      text: `Hi ${customerName},\n\nYour delivery has been confirmed!\n\nDate: ${scheduledDate}\nTime: ${timeSlot}\nItems: ${itemCount}\n\nWe'll deliver your items to your registered address during the scheduled time slot.\n\nBest regards,\nThe Storage Valet Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Delivery Confirmed!</h2>
          <p>Hi ${customerName},</p>
          <p>Your delivery has been scheduled successfully.</p>
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Delivery Details</h3>
            <p><strong>Date:</strong> ${scheduledDate}</p>
            <p><strong>Time:</strong> ${timeSlot}</p>
            <p><strong>Items to deliver:</strong> ${itemCount}</p>
            <p><strong>Location:</strong> Your registered address</p>
          </div>
          <p>Our team will arrive during your scheduled time slot with your items.</p>
          <p>You can manage your delivery from your dashboard if you need to make any changes.</p>
          <p>Best regards,<br>The Storage Valet Team</p>
        </div>
      `,
    };

    await this.sendEmail(msg);
  }

  async sendMovementReminder(
    email: string,
    customerName: string,
    movementType: "pickup" | "delivery",
    scheduledDate: string,
    timeSlot: string
  ): Promise<void> {
    const msg: MailDataRequired = {
      to: email,
      from: {
        email: EMAIL_SENDER,
        name: FROM_NAME,
      },
      subject: `Reminder: ${movementType === "pickup" ? "Pickup" : "Delivery"} Tomorrow`,
      text: `Hi ${customerName},\n\nThis is a reminder that your ${movementType} is scheduled for tomorrow.\n\nDate: ${scheduledDate}\nTime: ${timeSlot}\n\nPlease ensure someone is available at your registered address during this time.\n\nBest regards,\nThe Storage Valet Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Reminder: ${movementType === "pickup" ? "Pickup" : "Delivery"} Tomorrow</h2>
          <p>Hi ${customerName},</p>
          <p>Just a friendly reminder that your ${movementType} is scheduled for tomorrow.</p>
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0;"><strong>Date:</strong> ${scheduledDate}</p>
            <p style="margin: 0;"><strong>Time:</strong> ${timeSlot}</p>
            <p style="margin: 0;"><strong>Location:</strong> Your registered address</p>
          </div>
          <p>Please ensure someone is available at your address during this time.</p>
          <p>Best regards,<br>The Storage Valet Team</p>
        </div>
      `,
    };

    await this.sendEmail(msg);
  }

  async sendMagicLinkEmail(email: string, magicLink: string): Promise<void> {
    const msg: MailDataRequired = {
      to: email,
      from: {
        email: EMAIL_SENDER,
        name: FROM_NAME,
      },
      subject: "Your Storage Valet Login Link",
      text: `Click this link to log in to Storage Valet: ${magicLink}\n\nThis link will expire in 15 minutes.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Your Login Link</h2>
          <p>Click the button below to log in to your Storage Valet account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" style="background-color: #14b8a6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Log In to Storage Valet</a>
          </div>
          <p style="color: #666; font-size: 14px;">This link will expire in 15 minutes for security.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    await this.sendEmail(msg);
  }

  // Test email for verification
  async sendTestEmail(email: string): Promise<void> {
    const msg: MailDataRequired = {
      to: email,
      from: {
        email: EMAIL_SENDER,
        name: FROM_NAME,
      },
      subject: "Test Email - Storage Valet",
      text: "This is a test email from Storage Valet. If you received this, your email configuration is working correctly!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Test Email</h2>
          <p>This is a test email from Storage Valet.</p>
          <p style="color: #059669;">✅ If you received this, your email configuration is working correctly!</p>
        </div>
      `,
    };

    await this.sendEmail(msg);
  }
}

export const sendGridService = SendGridService.getInstance();
