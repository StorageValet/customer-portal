// Airtable field type utilities

const COMPUTED_FIELDS = new Set([
  "Customer ID",
  "Full Name",
  "Service Address",
  "Full Address",
]);

const CURRENCY_FIELDS = new Set([
  "Estimated Value",
  "Monthly Rate",
  "Setup Fee",
]);

const DATE_FIELDS = new Set([
  "Created Date",
  "First Pickup Date",
  "Last Activity",
]);

export function assertWritableField(fieldName: string): void {
  if (COMPUTED_FIELDS.has(fieldName)) {
    throw new Error(`Field "${fieldName}" is computed and cannot be written`);
  }
}

export function coerceForWrite(fieldName: string, value: any): any {
  if (value === null || value === undefined) return undefined;
  
  // Currency fields: convert number to string with $ format
  if (CURRENCY_FIELDS.has(fieldName)) {
    if (typeof value === "number") {
      return `$${value.toFixed(2)}`;
    }
    return value;
  }
  
  // Date fields: ensure ISO string format
  if (DATE_FIELDS.has(fieldName)) {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    return value;
  }
  
  // Boolean fields: keep as boolean for checkbox fields
  if (typeof value === "boolean") {
    return value;
  }
  
  return value;
}

import { storage } from "./storage";

export function getAirtableBase() {
  return storage.base;
}