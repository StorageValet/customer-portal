import { Router, Request, Response } from "express";
import { sendEmail } from "../utils/send-email";

const router = Router();

// Test email endpoint (development only)
if (process.env.NODE_ENV === "development") {
  router.post("/api/test-email", async (req: Request, res: Response) => {
    try {
      const { to = "zach@mystoragevalet.com" } = req.body;

      await sendEmail({
        to,
        subject: "Test Email - Storage Valet Portal",
        text: "This is a test email from your Storage Valet Portal. If you received this, your SendGrid integration is working perfectly!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a365d;">Test Email Successful! 🎉</h2>
            <p>This is a test email from your Storage Valet Portal.</p>
            <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46;">
                <strong>✅ SendGrid integration is working perfectly!</strong>
              </p>
            </div>
            <p>You can now:</p>
            <ul>
              <li>Send welcome emails to new users</li>
              <li>Send password reset emails</li>
              <li>Send pickup/delivery confirmations</li>
              <li>Send movement reminders</li>
            </ul>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Sent from Storage Valet Portal<br>
              ${new Date().toLocaleString()}
            </p>
          </div>
        `,
      });

      res.json({
        success: true,
        message: `Test email sent to ${to}`,
      });
    } catch (error: any) {
      console.error("Test email error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
}

export default router;
