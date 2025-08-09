import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY!;
const EMAIL_SENDER = process.env.EMAIL_SENDER || "zach@mystoragevalet.com";

// Initialize SendGrid with API key
sgMail.setApiKey(SENDGRID_API_KEY);

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
  }
};
