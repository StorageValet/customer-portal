// Email notification service for Storage Valet
// Uses SendGrid for reliable transactional email delivery

import { sendEmail } from "./services/sendgrid-email-service";

interface EmailNotificationData {
  type: "pickup" | "delivery";
  customerName: string;
  customerEmail: string;
  scheduledDate: string;
  timeSlot: string;
  items: string[];
  address?: string;
  specialInstructions?: string;
  confirmationNumber: string;
}

export class EmailService {
  private static instance: EmailService;

  constructor() {
    // Email service now uses SendGrid
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendPickupConfirmation(data: EmailNotificationData): Promise<boolean> {
    try {
      const itemsList = data.items.map((item) => `• ${item}`).join("\n");
      const dateFormatted = new Date(data.scheduledDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      await sendEmail({
        to: data.customerEmail,
        subject: `Pickup Confirmed - ${dateFormatted}`,
        text: `Hi ${data.customerName},\n\nYour pickup has been confirmed!\n\nDate: ${dateFormatted}\nTime: ${data.timeSlot}\nItems: ${data.items.length}\n\nConfirmation #: ${data.confirmationNumber}\n\nOur team will arrive at your registered address during the scheduled time slot.\n\nBest regards,\nThe Storage Valet Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">Pickup Confirmed!</h2>
            <p>Hi ${data.customerName},</p>
            <p>Your pickup has been scheduled successfully.</p>
            <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Pickup Details</h3>
              <p><strong>Date:</strong> ${dateFormatted}</p>
              <p><strong>Time:</strong> ${data.timeSlot}</p>
              <p><strong>Items to pickup:</strong> ${data.items.length}</p>
              <p><strong>Confirmation #:</strong> ${data.confirmationNumber}</p>
            </div>
            <p>Our team will arrive at your registered address during the scheduled time slot.</p>
            <p>Best regards,<br>The Storage Valet Team</p>
          </div>
        `,
      });

      console.log("Pickup confirmation email sent successfully");
      return true;
    } catch (error) {
      console.error("Failed to send pickup confirmation email:", error);
      return false;
    }
  }

  async sendDeliveryConfirmation(data: EmailNotificationData): Promise<boolean> {
    try {
      const itemsList = data.items.map((item) => `• ${item}`).join("\n");
      const dateFormatted = new Date(data.scheduledDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      await sendEmail({
        to: data.customerEmail,
        subject: `Delivery Confirmed - ${dateFormatted}`,
        text: `Hi ${data.customerName},\n\nYour delivery has been confirmed!\n\nDate: ${dateFormatted}\nTime: ${data.timeSlot}\nItems: ${data.items.length}\n\nConfirmation #: ${data.confirmationNumber}\n\nWe'll deliver your items to your registered address during the scheduled time slot.\n\nBest regards,\nThe Storage Valet Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">Delivery Confirmed!</h2>
            <p>Hi ${data.customerName},</p>
            <p>Your delivery has been scheduled successfully.</p>
            <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Delivery Details</h3>
              <p><strong>Date:</strong> ${dateFormatted}</p>
              <p><strong>Time:</strong> ${data.timeSlot}</p>
              <p><strong>Items to deliver:</strong> ${data.items.length}</p>
              <p><strong>Confirmation #:</strong> ${data.confirmationNumber}</p>
            </div>
            <p>We'll deliver your items to your registered address during the scheduled time slot.</p>
            <p>Best regards,<br>The Storage Valet Team</p>
          </div>
        `,
      });

      console.log("Delivery confirmation email sent successfully");
      return true;
    } catch (error) {
      console.error("Failed to send delivery confirmation email:", error);
      return false;
    }
  }

  async sendMovementReminder(data: any): Promise<boolean> {
    try {
      await sendEmail({
        to: data.customerEmail,
        subject: `Reminder: ${data.type === "pickup" ? "Pickup" : "Delivery"} Tomorrow`,
        text: `Hi ${data.customerName},\n\nThis is a reminder that your ${data.type} is scheduled for tomorrow.\n\nDate: ${data.scheduledDate}\nTime: ${data.timeSlot}\n\nPlease ensure someone is available at your registered address during this time.\n\nBest regards,\nThe Storage Valet Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">Reminder: ${data.type === "pickup" ? "Pickup" : "Delivery"} Tomorrow</h2>
            <p>Hi ${data.customerName},</p>
            <p>Just a friendly reminder that your ${data.type} is scheduled for tomorrow.</p>
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0;"><strong>Date:</strong> ${data.scheduledDate}</p>
              <p style="margin: 0;"><strong>Time:</strong> ${data.timeSlot}</p>
            </div>
            <p>Please ensure someone is available at your registered address during this time.</p>
            <p>Best regards,<br>The Storage Valet Team</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error("Failed to send movement reminder:", error);
      return false;
    }
  }

  async sendWelcomeEmail(data: any): Promise<boolean> {
    try {
      await sendEmail({
        to: data.customerEmail,
        subject: "Welcome to Storage Valet!",
        text: `Hi ${data.customerName},\n\nWelcome to Storage Valet! We're excited to help you declutter your space.\n\nYour account has been created successfully. You can now schedule pickups and manage your stored items through our portal.\n\nIf you have any questions, feel free to reach out to our support team.\n\nBest regards,\nThe Storage Valet Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">Welcome to Storage Valet!</h2>
            <p>Hi ${data.customerName},</p>
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
      });
      return true;
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean> {
    try {
      await sendEmail({
        to: email,
        subject: "Reset Your Storage Valet Password",
        text: `You requested a password reset. Click this link to reset your password: ${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">Reset Your Password</h2>
            <p>You requested a password reset for your Storage Valet account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #14b8a6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      return false;
    }
  }

  async sendPaymentReceiptEmail(
    email: string,
    amount: number,
    description: string
  ): Promise<boolean> {
    try {
      await sendEmail({
        to: email,
        subject: "Payment Receipt - Storage Valet",
        text: `Thank you for your payment!\n\nAmount: $${(amount / 100).toFixed(2)}\nDescription: ${description}\n\nBest regards,\nThe Storage Valet Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">Payment Receipt</h2>
            <p>Thank you for your payment!</p>
            <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Amount:</strong> $${(amount / 100).toFixed(2)}</p>
              <p><strong>Description:</strong> ${description}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <p>Best regards,<br>The Storage Valet Team</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error("Failed to send payment receipt:", error);
      return false;
    }
  }

  // Generic email sending method
  async sendEmail(data: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<boolean> {
    try {
      await sendEmail(data);
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  // Generate confirmation number
  generateConfirmationNumber(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `SV-${timestamp}-${randomStr}`.toUpperCase();
  }
}

export const emailService = EmailService.getInstance();
