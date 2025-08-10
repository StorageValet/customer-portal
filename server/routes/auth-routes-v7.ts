import { Router } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { signMagicToken, verifyMagicToken } from '../jwt';
import { sendMagicEmail } from '../email';
import { upsertCustomer, findCustomerByEmail, toClientCustomer } from '../airtable-v7';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });
const router = Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const signupSchema = z.object({ fullName: z.string().min(3), email: z.string().email(), phone: z.string().optional().nullable(), addressLine1: z.string().optional().nullable(), unit: z.string().optional().nullable(), city: z.string().optional().nullable(), state: z.enum(['NJ','NY']).optional().nullable(), zipCode: z.string().min(5), planTier: z.enum(['starter','medium','family']), promoCode: z.string().optional().nullable(), agreeTos: z.boolean() });
router.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'validation_error', details: parsed.error.issues });
  const { fullName, email, phone, addressLine1, unit, city, state, zipCode, planTier, promoCode, agreeTos } = parsed.data;
  const waived = (promoCode || '').toUpperCase() === 'WAIVEDSETUP';
  if (waived) {
    await upsertCustomer({ fullName, email, phone: phone || undefined, addressLine1: addressLine1 || undefined, unit: unit || undefined, city: city || undefined, state: state || undefined, zipCode, planTier, setupFeePaid: true, agreeTos });
    const token = signMagicToken({ email }); const link = `${FRONTEND_URL}/login?token=${encodeURIComponent(token)}`; await sendMagicEmail(email, link);
    return res.json({ flow: 'waived', message: 'Setup fee waived. Magic link sent.' });
  }
  const session = await stripe.checkout.sessions.create({ mode: 'payment', payment_method_types: ['card'], line_items: [{ price_data: { currency: 'usd', product_data: { name: 'Storage Valet Setup Fee' }, unit_amount: 19900 }, quantity: 1 }], customer_email: email, metadata: { sv_email: email, sv_fullName: fullName, sv_phone: phone || '', sv_addressLine1: addressLine1 || '', sv_unit: unit || '', sv_city: city || '', sv_state: state || '', sv_zipCode: zipCode, sv_planTier: planTier, sv_agreeTos: String(agreeTos) }, success_url: `${FRONTEND_URL}/signup-success`, cancel_url: `${FRONTEND_URL}/signup-cancelled` });
  return res.json({ flow: 'checkout', checkoutUrl: session.url, message: 'Proceed to Stripe Checkout' });
});
router.post('/magic-link/request', async (req, res) => {
  const email = String((req.body?.email || '')).toLowerCase();
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'validation_error' });
  const customer = await findCustomerByEmail(email);
  if (!customer) return res.status(404).json({ error: 'email_not_found' });
  const token = signMagicToken({ email }); const link = `${FRONTEND_URL}/login?token=${encodeURIComponent(token)}`; await sendMagicEmail(email, link);
  return res.json({ message: 'If your email exists, a sign-in link has been sent.' });
});
router.post('/magic-link/verify', async (req, res) => {
  const token = String(req.body?.token || '');
  try { const { email } = verifyMagicToken(token); (req.session as any).user = { email }; return res.json({ ok: true, redirect: '/dashboard' }); }
  catch { return res.status(400).json({ error: 'invalid_or_expired_token' }); }
});
async function meHandler(req: any, res: any) {
  const user = req.session?.user;
  if (!user?.email) return res.status(401).json({ error: 'not_authenticated' });
  const rec = await findCustomerByEmail(user.email);
  if (!rec) return res.status(401).json({ error: 'not_authenticated' });
  return res.json(toClientCustomer(rec));
}
router.get('/me', meHandler);
router.get('/user', meHandler);
export default router;
