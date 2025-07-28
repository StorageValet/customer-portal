// Email notification service for Storage Valet
// Uses webhook integration with Google Workspace/Zapier for cost-effective email delivery

interface EmailNotificationData {
  type: 'pickup' | 'delivery';
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
  private webhookUrl: string;

  constructor() {
    // This will be a Zapier webhook URL that connects to your Google Workspace
    this.webhookUrl = process.env.ZAPIER_WEBHOOK_URL || '';
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendPickupConfirmation(data: EmailNotificationData): Promise<boolean> {
    try {
      if (!this.webhookUrl) {
        console.log('Webhook URL not configured, logging email data:', data);
        return false;
      }

      const emailData = {
        ...data,
        subject: `Storage Valet Pickup Confirmation - ${data.confirmationNumber}`,
        template: 'pickup_confirmation',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      console.log('Pickup confirmation email sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send pickup confirmation email:', error);
      return false;
    }
  }

  async sendDeliveryConfirmation(data: EmailNotificationData): Promise<boolean> {
    try {
      if (!this.webhookUrl) {
        console.log('Webhook URL not configured, logging email data:', data);
        return false;
      }

      const emailData = {
        ...data,
        subject: `Storage Valet Delivery Confirmation - ${data.confirmationNumber}`,
        template: 'delivery_confirmation',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      console.log('Delivery confirmation email sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send delivery confirmation email:', error);
      return false;
    }
  }

  // Generic email send method
  async sendEmail(data: { to: string; subject: string; html: string }): Promise<boolean> {
    try {
      if (!this.webhookUrl) {
        console.log('Webhook URL not configured, logging email data:', data);
        console.log('Email would be sent to:', data.to);
        console.log('Subject:', data.subject);
        console.log('Content:', data.html);
        return true; // Return true for development
      }

      const emailData = {
        to: data.to,
        subject: data.subject,
        html: data.html,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      console.log('Email sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // Generate a simple confirmation number
  generateConfirmationNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SV-${timestamp.slice(-6)}-${random}`;
  }
}

export const emailService = EmailService.getInstance();