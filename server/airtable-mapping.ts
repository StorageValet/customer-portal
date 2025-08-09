// Airtable table and field mappings
export const Tables = {
  Customers: "Customers",
  Containers: "Containers",
  Movements: "Movements",
  Sessions: "Sessions",
  Leads: "Leads", // Staging area for registration ingest
} as const;

export const Fields = {
  // Customer fields
  Email: "Email",
  FullName: "Full Name",
  FirstName: "First Name",
  LastName: "Last Name",
  Phone: "Phone",
  PhoneE164: "Phone E164",
  Address: "Full Address",
  Status: "Status",
  
  // Lead fields
  SubmissionId: "Submission Id",
  SubmissionTs: "Submission Ts",
  PayloadHash: "Payload Hash",
  FormSource: "Form Source",
  PropertyName: "Property Name",
  Unit: "Unit",
  ReferralSource: "Referral Source",
  MarketingOptIn: "Marketing Opt-In",
  AgreeTOS: "Agree TOS",
} as const;