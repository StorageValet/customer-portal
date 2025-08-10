import nodemailer from 'nodemailer';
const from = process.env.EMAIL_FROM || 'no-reply@example.com';
const useConsoleOnly = !process.env.SMTP_HOST;
export async function sendMagicEmail(to: string, link: string) {
  if (useConsoleOnly) { console.log(`[DEMO EMAIL] To: ${to}\nLink: ${link}\n`); return; }
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST!, port: Number(process.env.SMTP_PORT || 587), secure: false, auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! } });
  await transporter.sendMail({ from, to, subject: 'Your Storage Valet sign-in link', text: `Click to sign in: ${link}`, html: `<p><a href="${link}">Sign in</a></p>` });
}
