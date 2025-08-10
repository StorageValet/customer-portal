import Airtable from 'airtable';
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);
type Customer = { id?: string; fullName: string; email: string; phone?: string; addressLine1?: string; unit?: string; city?: string; state?: string; zipCode?: string; planTier?: string; setupFeePaid?: boolean; stripeCustomerId?: string; agreeTos?: boolean; };
const customers = () => base.table('Customers_v7');
const items = () => base.table('Items_v7');
export async function findCustomerByEmail(email: string) {
  const safe = email.replace(/'/g, "\\'");
  const records = await customers().select({ filterByFormula: `{Email} = '${safe}'`, maxRecords: 1 }).all();
  return records[0];
}
export async function upsertCustomer(c: Customer) {
  const existing = await findCustomerByEmail(c.email);
  const fields: any = { 'Full Name': c.fullName, 'Email': c.email, 'Phone': c.phone || undefined, 'Address Line 1': c.addressLine1 || undefined, 'Unit': c.unit || undefined, 'City': c.city || undefined, 'State': c.state || undefined, 'Zip': c.zipCode || undefined, 'Plan Tier': c.planTier || undefined, 'Setup Fee Paid': c.setupFeePaid ?? false, 'Stripe Customer Id': c.stripeCustomerId || undefined, 'Agreed TOS': !!c.agreeTos };
  return existing ? await customers().update(existing.id, fields) : await customers().create(fields);
}
export function toClientCustomer(r: any) {
  const f = r.fields || {};
  return { id: r.id, fullName: f['Full Name'] || '', email: f['Email'] || '', planTier: f['Plan Tier'] || null, zipCode: f['Zip'] || null, setupFeePaid: !!f['Setup Fee Paid'], stripeCustomerId: f['Stripe Customer Id'] || null };
}
function num(x: any): number { const n = Number(x); return Number.isFinite(n) ? n : 0; }
export async function listItemsForCustomerRecord(customerRecId: string) {
  try {
    const filter = `FIND("${customerRecId}", ARRAYJOIN({Customer}))`;
    const recs = await items().select({ filterByFormula: filter, maxRecords: 200 }).all();
    return recs.map((r: any) => { const f = r.fields || {}; const L = num(f['Length (in)']); const W = num(f['Width (in)']); const H = num(f['Height (in)']); const cf = num(f['Cubic Ft']) || (L && W && H ? (L*W*H)/1728 : 0); const photos = Array.isArray(f['Photos']) ? f['Photos'].map((p: any) => p.url).filter(Boolean) : []; return { id: r.id, name: f['Item Name'] || f['Name'] || '', lengthIn: L, widthIn: W, heightIn: H, cubicFt: cf, weightLbs: num(f['Weight (lbs)']), status: f['Status'] || 'inStorage', photoUrls: photos }; });
  } catch { return []; }
}
