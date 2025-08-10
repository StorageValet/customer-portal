import { Router } from "express";
import { z } from "zod";
import { Tables } from "../airtable-mapping";
import { getAirtableBase } from "../airtable-utils";
import { createEmailFilter } from "../lib/airtable-security";

const router = Router();
const Promote = z.object({ lead_id: z.string().min(1) });

router.post("/api/ingest/promote-lead", async (req, res) => {
  try {
    const { lead_id } = Promote.parse(req.body);
    const base = getAirtableBase();
    const Leads = Tables.Leads;
    const Customers = Tables.Customers;

    const lead = await base(Leads).find(lead_id);
    if (!lead) return res.status(404).json({ ok:false, error:"Lead not found" });

    const f = lead.fields as Record<string, any>;
    const email = String(f["Email"]||"").toLowerCase();
    const firstName = String(f["First Name"]||"");
    const lastName = String(f["Last Name"]||"");
    const fullName = `${firstName} ${lastName}`.trim();
    if (!email || !fullName) return res.status(422).json({ ok:false, error:"Waitlist entry missing email/name" });

    // Upsert customer by email (pseudo—replace with your helper/select)
    const existing = await base(Customers).select({ filterByFormula: createEmailFilter(email) }).firstPage();
    let custId: string;
    const payload: Record<string, any> = {
      "Email": email,
      "First Name": firstName,
      "Last Name": lastName,
      "Phone": f["Phone"] || undefined,
    };

    if (existing.length) {
      await base(Customers).update(existing[0].id, payload);
      custId = existing[0].id;
    } else {
      const created = await base(Customers).create(payload);
      custId = created.id;
    }

    // Mark lead as converted in Notes field since Status might be a select field
    const convertedNote = `Converted to Customer on ${new Date().toISOString().split('T')[0]}`;
    await base(Leads).update(lead_id, { 
      "Notes": convertedNote,
      "Customer Link": [custId] // Link to the customer record if field exists
    });
    return res.json({ ok:true, customer_id: custId });
  } catch (e:any) {
    return res.status(400).json({ ok:false, error: e.message });
  }
});

export default router;