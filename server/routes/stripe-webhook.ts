import express from 'express';
import Stripe from 'stripe';
import { upsertCustomer } from '../airtable-v7';
import { signMagicToken } from '../jwt';
import { sendMagicEmail } from '../email';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
export default async function stripeWebhookHandler(req: express.Request, res: express.Response) {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(req.body as any, sig, process.env.STRIPE_WEBHOOK_SECRET || ''); }
  catch (err: any) { return res.status(400).send(`Webhook Error: ${err.message}`); }
  if (event.type === 'checkout.session.completed') {
    const sess = event.data.object as Stripe.Checkout.Session;
    const email = (sess.customer_details?.email || sess.customer_email || '').toLowerCase();
    if (email) {
      const md: any = sess.metadata || {};
      const stripeCustomerId = typeof sess.customer === 'string' ? sess.customer : (sess.customer as any)?.id;
      await upsertCustomer({ fullName: md.sv_fullName || '', email, phone: md.sv_phone || undefined, addressLine1: md.sv_addressLine1 || undefined, unit: md.sv_unit || undefined, city: md.sv_city || undefined, state: md.sv_state || undefined, zipCode: md.sv_zipCode || undefined, planTier: md.sv_planTier || undefined, setupFeePaid: true, agreeTos: md.sv_agreeTos === 'true', stripeCustomerId });
      const token = signMagicToken({ email }); const link = `${FRONTEND_URL}/login?token=${encodeURIComponent(token)}`; await sendMagicEmail(email, link);
    }
  }
  res.json({ received: true });
}
