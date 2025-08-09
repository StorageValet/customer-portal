import { Router } from "express";
import { z } from "zod";
import { toE164, sha256Hex, isoDate } from "../lib/normalize";
import { Tables, Fields } from "../airtable-mapping";
import { coerceForWrite, assertWritableField } from "../airtable-utils";
// Airtable base factory lives in storage
import { getAirtableBase } from "../storage";
// Access the dev-only logger from global to avoid import cycles
const logIngest = (entry: {email?:string, submission_id?:string, ok:boolean}) => {
  if (process.env.NODE_ENV !== "development") return;
  const log = (global as any).INGEST_LOG;
  if (log && Array.isArray(log)) {
    log.push({ ts:new Date().toISOString(), ...entry });
    if (log.length > 50) log.shift();
  }
};

// Safe coercion for checkboxes and single-selects so Airtable never errors
const SELECTS = {
  referral: ["Building-QR","Concierge","Friend","Ad","Web","Other"] as const,
  form: ["Softr","JotForm","Website","Manual"] as const,
  status: ["New","Validated","Converted","Rejected"] as const,
};

function asBool(v: unknown): boolean|undefined {
  if (v === true || v === false) return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true","1","yes","y","on","checked"].includes(s)) return true;
    if (["false","0","no","n","off","unchecked"].includes(s)) return false;
  }
  if (typeof v === "number") return v !== 0;
  return undefined;
}

function pickSelect<T extends readonly string[]>(val: unknown, allowed: T, fallback: T[number] | undefined) {
  if (typeof val === "string") {
    const hit = allowed.find(opt => opt.toLowerCase() === val.trim().toLowerCase());
    if (hit) return hit;
  }
  return fallback;
}

const router = Router();

const Registration = z.object({
  email: z.string().email(),
  full_name: z.string().min(1),
  phone: z.string().optional(),
  property_name: z.string().optional(),
  unit: z.string().optional(),
  referral_source: z.string().optional(),
  marketing_opt_in: z.union([z.boolean(), z.string()]).optional(),
  agree_tos: z.union([z.boolean(), z.string()]),
  form_source: z.string().optional(),
  submission_id: z.string().optional(),
  submission_ts: z.union([z.string(), z.date()]).optional(),
});

router.post("/api/ingest/registration", async (req, res) => {
  try {
    const body = Registration.parse(req.body);
    const email = body.email.trim().toLowerCase();
    const fullName = body.full_name.trim();
    const phone_e164 = toE164(body.phone);
    const submission_ts_iso = isoDate(body.submission_ts) || new Date().toISOString();
    const submission_id = body.submission_id || `softr_${Date.now()}`;
    const form_source = body.form_source || "Softr";

    const base = getAirtableBase();

    // Use Leads table as staging area
    const Leads = Tables.Leads;
    
    // Split full name into first and last
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Map incoming values to exact Airtable types/options
    const rec: Record<string, any> = {
      "Email": email,
      "Full Name": fullName,
      "First Name": firstName,
      "Last Name": lastName,
      "Phone": body.phone ?? undefined,              // store phone as entered
      "Property Name": body.property_name ?? undefined,
      "Unit": body.unit ?? undefined,
      "Referral Source": pickSelect(body.referral_source, SELECTS.referral, undefined),
      "Marketing Opt-In": asBool(body.marketing_opt_in) ?? false,
      "Agree TOS": asBool(body.agree_tos) ?? false,
      "Form Source": pickSelect(body.form_source || "Softr", SELECTS.form, "Softr"),
      "Submission ID": submission_id,
      "Submission Date": submission_ts_iso.split('T')[0],
      "Status": pickSelect("New", SELECTS.status, "New")
    };

    const safe: Record<string, any> = {};
    for (const [k, v] of Object.entries(rec)) {
      try { assertWritableField(k); } catch { continue; }
      const val = coerceForWrite(k, v);
      if (val !== undefined) safe[k] = val;
    }

    // Idempotency: Submission ID only (Softr/JotForm unique id)
    const existing = await base(Leads).select({ filterByFormula:
      `{Submission ID}='${submission_id}'`
    }).firstPage();

    let leadId: string;
    if (existing.length) {
      await base(Leads).update(existing[0].id, safe);
      leadId = existing[0].id;
    } else {
      const created = await base(Leads).create(safe);
      leadId = created.id;
    }
    logIngest({ email, submission_id, ok:true });
    return res.json({ ok: true, lead_id: leadId });
  } catch (e:any) {
    try { logIngest({ email: req?.body?.email, submission_id: req?.body?.submission_id, ok:false }); } catch {}
    return res.status(400).json({ ok: false, error: e.message });
  }
});

export default router;