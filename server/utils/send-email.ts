import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY!;
const EMAIL_SENDER = process.env.EMAIL_SENDER || "zach@mystoragevalet.com";

// Initialize SendGrid
if (SENDGRID_API_KEY && SENDGRID_API_KEY !== "your-sendgrid-api-key") {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) => {
  // If SendGrid not configured, log to console
  if (!SENDGRID_API_KEY || SENDGRID_API_KEY === "your-sendgrid-api-key") {
    console.log("📧 Email (fallback mode):", {
      to,
      subject,
      preview: text?.substring(0, 100) + "...",
    });
    return;
  }

  const msg: any = {
    to,
    from: EMAIL_SENDER,
    subject,
  };

  // SendGrid requires either text or html content
  if (html) {
    msg.html = html;
  }
  if (text) {
    msg.text = text;
  }

  // If neither is provided, use the subject as text content
  if (!html && !text) {
    msg.text = subject;
  }

  try {
    await sgMail.send(msg);
    console.log(`✅ Email sent to ${to}`);
  } catch (error: any) {
    console.error("❌ SendGrid error:", error?.response?.body || error.message);
    // Log email details as fallback
    console.log("📧 Email (fallback after error):", {
      to,
      subject,
      preview: text?.substring(0, 100) + "...",
    });
  }
};

// Convenience functions for common emails
export const sendWelcomeEmail = async (to: string, firstName: string) => {
  await sendEmail({
    to,
    subject: "Welcome to Storage Valet!",
    text: `Hi ${firstName},\n\nWelcome to Storage Valet! We're excited to help you declutter your space.\n\nBest regards,\nThe Storage Valet Team`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Welcome to Storage Valet!</h2>
        <p>Hi ${firstName},</p>
        <p>We're excited to help you declutter your space.</p>
        <p>Best regards,<br>The Storage Valet Team</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (to: string, resetToken: string) => {
  const resetUrl = `${process.env.BASE_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

  await sendEmail({
    to,
    subject: "Reset Your Storage Valet Password",
    text: `Click this link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Reset Your Password</h2>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
      </div>
    `,
  });
};
