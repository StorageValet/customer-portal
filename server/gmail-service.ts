import { google } from "googleapis";
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class GmailService {
  private transporter: Mail | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Check if Gmail credentials are configured
      const clientId = process.env.GMAIL_CLIENT_ID;
      const clientSecret = process.env.GMAIL_CLIENT_SECRET;
      const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
      const userEmail = process.env.GMAIL_USER_EMAIL || "support@storagevalet.com";

      if (!clientId || !clientSecret || !refreshToken) {
        console.log("Gmail API not configured. Email will be logged to console.");
        return;
      }

      // Create OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        "https://developers.google.com/oauthplayground" // Redirect URL
      );

      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      // Create Nodemailer transporter
      this.transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          type: "OAuth2",
          user: userEmail,
          clientId: clientId,
          clientSecret: clientSecret,
          refreshToken: refreshToken,
          accessToken: async () => {
            const { token } = await oauth2Client.getAccessToken();
            return token || "";
          },
        },
      } as any);

      // Verify transporter
      await this.transporter.verify();
      this.isConfigured = true;
      console.log("Gmail service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Gmail service:", error);
      console.log("Email will be logged to console as fallback.");
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.isConfigured || !this.transporter) {
      // Fallback to console logging
      console.log("📧 Email (Gmail not configured):");
      console.log("To:", options.to);
      console.log("Subject:", options.subject);
      console.log("Content:", options.text || options.html);
      console.log("---");
      return;
    }

    try {
      const mailOptions = {
        from: `StorageValet <${process.env.GMAIL_USER_EMAIL || "support@storagevalet.com"}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent:", info.messageId);
    } catch (error) {
      console.error("Failed to send email:", error);
      // Fallback to console
      console.log("📧 Email (send failed):");
      console.log("To:", options.to);
      console.log("Subject:", options.subject);
      console.log("---");
    }
  }

  // Simple HTML to text converter
  private htmlToText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  // Email templates
  async sendWelcomeEmail(email: string, firstName: string) {
    const subject = "Welcome to StorageValet!";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e3a8a;">Welcome to StorageValet, ${firstName}!</h1>
        <p>We're thrilled to have you join our storage community.</p>
        <p>Your account has been created successfully. Here's what you can do next:</p>
        <ul>
          <li>Schedule your first pickup</li>
          <li>Browse our storage plans</li>
          <li>Start cataloging items for storage</li>
        </ul>
        <p>If you have any questions, feel free to reply to this email or visit our help center.</p>
        <p>Best regards,<br>The StorageValet Team</p>
      </div>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendPickupConfirmation(email: string, date: string, timeSlot: string, address: string) {
    const subject = "Pickup Scheduled - StorageValet";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e3a8a;">Pickup Confirmed!</h1>
        <p>Your pickup has been scheduled for:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${timeSlot}</p>
          <p><strong>Address:</strong> ${address}</p>
        </div>
        <p>Our team will arrive during the scheduled time window. Please have your items ready for pickup.</p>
        <p>You'll receive a reminder the day before your pickup.</p>
        <p>Best regards,<br>The StorageValet Team</p>
      </div>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendDeliveryConfirmation(email: string, date: string, timeSlot: string, address: string) {
    const subject = "Delivery Scheduled - StorageValet";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e3a8a;">Delivery Confirmed!</h1>
        <p>Your items will be delivered on:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${timeSlot}</p>
          <p><strong>Address:</strong> ${address}</p>
        </div>
        <p>Our team will arrive during the scheduled time window with your items.</p>
        <p>You'll receive a reminder the day before your delivery.</p>
        <p>Best regards,<br>The StorageValet Team</p>
      </div>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendPasswordResetEmail(email: string, resetLink: string) {
    const subject = "Reset Your Password - StorageValet";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e3a8a;">Password Reset Request</h1>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #1e3a8a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${resetLink}</p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The StorageValet Team</p>
      </div>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendPaymentReceiptEmail(email: string, amount: number, description: string) {
    const subject = "Payment Receipt - StorageValet";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e3a8a;">Payment Receipt</h1>
        <p>Thank you for your payment!</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>This receipt confirms your payment has been processed successfully.</p>
        <p>Best regards,<br>The StorageValet Team</p>
      </div>
    `;

    await this.sendEmail({ to: email, subject, html });
  }
}

export const gmailService = new GmailService();
