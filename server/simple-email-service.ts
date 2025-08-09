import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";

export class SimpleEmailService {
  private transporter: Mail | null = null;
  private isConfigured = false;

  async initialize() {
    try {
      const userEmail = process.env.GMAIL_USER_EMAIL;
      const appPassword = process.env.GMAIL_APP_PASSWORD;

      if (!userEmail || !appPassword) {
        console.log("Gmail app-specific password not configured");
        console.log("\nTo use Gmail with app-specific password:");
        console.log("1. Enable 2-factor authentication on your Google account");
        console.log("2. Go to: https://myaccount.google.com/apppasswords");
        console.log('3. Generate an app password for "Mail"');
        console.log("4. Add to .env: GMAIL_APP_PASSWORD=your-16-char-password");
        return;
      }

      // Create transporter with app-specific password
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: userEmail,
          pass: appPassword,
        },
      });

      // Verify transporter
      await this.transporter.verify();
      this.isConfigured = true;
      console.log("✅ Gmail service initialized successfully with app password");
    } catch (error) {
      console.error("Failed to initialize Gmail service:", error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options: Mail.Options): Promise<void> {
    if (!this.isConfigured || !this.transporter) {
      console.log("📧 Email (fallback mode):", {
        to: options.to,
        subject: options.subject,
        preview: options.text?.toString().substring(0, 100) + "...",
      });
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Storage Valet" <${process.env.GMAIL_USER_EMAIL}>`,
        ...options,
      });
      console.log("✅ Email sent:", info.messageId);
    } catch (error) {
      console.error("Failed to send email:", error);
      // Fallback to console
      console.log("📧 Email (fallback after error):", {
        to: options.to,
        subject: options.subject,
        preview: options.text?.toString().substring(0, 100) + "...",
      });
    }
  }
}

export const simpleEmailService = new SimpleEmailService();
