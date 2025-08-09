import { Router, Request, Response } from "express";
import { sendEmail } from "../services/sendgrid-email-service";

const router = Router();

router.post("/api/test-email", async (req: Request, res: Response) => {
  try {
    await sendEmail({
      to: "zach@mystoragevalet.com",
      subject: "Test from SendGrid",
      text: "This is a test email from the Storage Valet Portal using SendGrid. If you're reading this, your email integration is working perfectly!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a365d;">Test Email from SendGrid</h2>
          <p>This is a test email from the Storage Valet Portal.</p>
          <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46;">
              <strong>✅ Your SendGrid integration is working perfectly!</strong>
            </p>
          </div>
          <p>Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "Test email sent successfully to zach@mystoragevalet.com",
    });
  } catch (error: any) {
    console.error("Test email error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send test email",
    });
  }
});

export default router;
