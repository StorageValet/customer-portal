import crypto from "node:crypto";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export function toE164(input?: string|null): string|undefined {
  if (!input) return undefined;
  const p = parsePhoneNumberFromString(String(input));
  return p?.isValid() ? p.number : undefined;
}

export function sha256Hex(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export function isoDate(input?: string|Date|null): string|undefined {
  if (!input) return undefined;
  const d = input instanceof Date ? input : new Date(String(input));
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}