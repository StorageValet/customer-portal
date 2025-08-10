/**
 * Security utilities for Airtable operations
 * Prevents formula injection attacks
 */

/**
 * Escapes a string value for safe use in Airtable formulas
 * Prevents formula injection by escaping single quotes and backslashes
 * 
 * @param value - The raw value to escape
 * @returns The escaped value safe for use in Airtable formulas
 */
export function escapeAirtableString(value: string): string {
  if (typeof value !== 'string') {
    return String(value);
  }
  
  // Escape backslashes first (must be done before escaping quotes)
  // Then escape single quotes by doubling them (Airtable formula syntax)
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''");
}

/**
 * Creates a safe Airtable formula for email matching
 * @param email - The email to search for
 * @returns A safe formula string
 */
export function createEmailFilter(email: string): string {
  const safeEmail = escapeAirtableString(email);
  return `{Email} = '${safeEmail}'`;
}

/**
 * Creates a safe Airtable formula for searching within an array field
 * @param searchValue - The value to search for
 * @param fieldName - The name of the array field
 * @returns A safe formula string
 */
export function createArraySearchFilter(searchValue: string, fieldName: string): string {
  const safeValue = escapeAirtableString(searchValue);
  return `SEARCH('${safeValue}', ARRAYJOIN({${fieldName}}))`;
}

/**
 * Creates a safe Airtable formula for field matching
 * @param fieldName - The name of the field
 * @param value - The value to match
 * @returns A safe formula string
 */
export function createFieldMatchFilter(fieldName: string, value: string): string {
  const safeValue = escapeAirtableString(value);
  return `{${fieldName}} = '${safeValue}'`;
}