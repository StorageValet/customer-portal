import { Store, SessionData } from "express-session";
import Airtable from "airtable";

// Define type for session records
interface SessionRecord extends Airtable.FieldSet {
  "Session ID": string;
  Data: string;
  Expiry: string; // ISO date string for Airtable
  "Last Access": string; // ISO date string for Airtable
  [key: string]: any; // Required for compatibility with FieldSet
}

type AirtableError = Error & { statusCode?: number };

export class AirtableSessionStore extends Store {
  private base: Airtable.Base;
  private tableName = "Sessions";
  private ttl: number;

  constructor(apiKey: string, baseId: string, options?: { ttl?: number }) {
    super();
    this.base = new Airtable({ apiKey }).base(baseId);
    this.ttl = options?.ttl || 86400; // Default 24 hours
  }

  // Get session from Airtable
  get(sid: string, callback: (err: Error | null, session?: SessionData | null) => void): void {
    try {
      this.base(this.tableName)
        .select({
          filterByFormula: `{Session ID} = '${sid}'`,
          maxRecords: 1,
        })
        .firstPage((err, records) => {
          if (err) {
            return callback(err);
          }

          if (!records || records.length === 0) {
            return callback(null, null);
          }

          const record = records[0];
          const expiry = record.fields["Expiry"];

          // Check if session has expired (expiry is ISO date string)
          if (expiry && new Date(String(expiry)).getTime() < Date.now()) {
            this.destroy(sid, () => {});
            return callback(null, null);
          }

          try {
            const sessionData = JSON.parse(String(record.fields["Data"] || "{}"));
            callback(null, sessionData);
          } catch (parseError) {
            callback(parseError instanceof Error ? parseError : new Error(String(parseError)));
          }
        });
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Set session in Airtable
  set(sid: string, session: SessionData, callback?: (err?: Error | null) => void): void {
    try {
      const expiry = new Date();
      expiry.setSeconds(expiry.getSeconds() + this.ttl);

      let sessionDataStr: string;
      try {
        sessionDataStr = JSON.stringify(session);
      } catch (jsonError) {
        if (callback)
          callback(jsonError instanceof Error ? jsonError : new Error(String(jsonError)));
        return;
      }

      // Convert to date-only format for Airtable date field (not datetime)
      const sessionData: Partial<SessionRecord> = {
        "Session ID": sid,
        Data: sessionDataStr,
        Expiry: expiry.toISOString().split('T')[0], // Airtable date field expects YYYY-MM-DD
        "Last Access": new Date().toISOString().split('T')[0], // Airtable date field expects YYYY-MM-DD
      } as any;

      // Try to find existing session
      this.base(this.tableName)
        .select({
          filterByFormula: `{Session ID} = '${sid}'`,
          maxRecords: 1,
        })
        .firstPage((err, records) => {
          if (err) {
            if (callback) callback(err);
            return;
          }

          if (records && records.length > 0) {
            // Update existing session
            this.base(this.tableName).update(
              records[0].id,
              sessionData,
              (updateErr: Error | null) => {
                if (callback) callback(updateErr);
              }
            );
          } else {
            // Create new session
            this.base(this.tableName).create(sessionData, (createErr: Error | null) => {
              if (callback) callback(createErr);
            });
          }
        });
    } catch (error) {
      if (callback) callback(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Destroy session
  destroy(sid: string, callback?: (err?: Error | null) => void): void {
    try {
      this.base(this.tableName)
        .select({
          filterByFormula: `{Session ID} = '${sid}'`,
          maxRecords: 1,
        })
        .firstPage((err, records) => {
          if (err) {
            if (callback) callback(err);
            return;
          }

          if (records && records.length > 0) {
            this.base(this.tableName).destroy(records[0].id, (destroyErr) => {
              if (callback) callback(destroyErr);
            });
          } else {
            if (callback) callback();
          }
        });
    } catch (error) {
      if (callback) callback(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Clear all sessions (optional)
  clear(callback?: (err?: Error | null) => void): void {
    try {
      this.base(this.tableName)
        .select()
        .all((err, records) => {
          if (err) {
            if (callback) callback(err);
            return;
          }

          if (!records || records.length === 0) {
            if (callback) callback();
            return;
          }

          // Process in batches for better performance
          const batchSize = 10;
          const batches: Airtable.Record<Airtable.FieldSet>[][] = [];

          for (let i = 0; i < records.length; i += batchSize) {
            batches.push(records.slice(i, i + batchSize));
          }

          let completedBatches = 0;
          let lastError: Error | null = null;

          batches.forEach((batch) => {
            const recordIds = batch.map((record) => record.id);
            this.base(this.tableName).destroy(recordIds, (destroyErr) => {
              if (destroyErr) {
                lastError = destroyErr;
              }

              completedBatches++;
              if (completedBatches === batches.length && callback) {
                callback(lastError);
              }
            });
          });
        });
    } catch (error) {
      if (callback) callback(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Touch session to reset expiry
  touch(sid: string, session: SessionData, callback?: (err?: Error | null) => void): void {
    try {
      const expiry = new Date();
      expiry.setSeconds(expiry.getSeconds() + this.ttl);

      this.base(this.tableName)
        .select({
          filterByFormula: `{Session ID} = '${sid}'`,
          maxRecords: 1,
        })
        .firstPage((err, records) => {
          if (err) {
            if (callback) callback(err);
            return;
          }

          if (records && records.length > 0) {
            this.base(this.tableName).update(
              records[0].id,
              {
                Expiry: expiry.toISOString().split('T')[0], // Airtable date field expects YYYY-MM-DD
                "Last Access": new Date().toISOString().split('T')[0], // Airtable date field expects YYYY-MM-DD
              },
              (updateErr) => {
                if (callback) callback(updateErr);
              }
            );
          } else {
            if (callback) callback();
          }
        });
    } catch (error) {
      if (callback) callback(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Get all sessions (optional)
  all(
    callback: (err: Error | null, sessions?: { [sid: string]: SessionData } | null) => void
  ): void {
    try {
      this.base(this.tableName)
        .select()
        .all((err, records) => {
          if (err) {
            callback(err);
            return;
          }

          const sessions: { [sid: string]: SessionData } = {};

          if (records && records.length > 0) {
            records.forEach((record) => {
              const sid = String(record.fields["Session ID"]);
              try {
                const data = JSON.parse(String(record.fields["Data"] || "{}"));
                sessions[sid] = data;
              } catch (parseErr) {
                // Skip invalid sessions
                console.warn(`Skipping invalid session ${sid}: ${parseErr}`);
              }
            });
          }

          callback(null, sessions);
        });
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Get session count (optional)
  length(callback: (err: Error | null, length?: number) => void): void {
    try {
      this.base(this.tableName)
        .select({
          fields: ["Session ID"],
        })
        .all((err, records) => {
          if (err) {
            callback(err);
            return;
          }

          callback(null, records ? records.length : 0);
        });
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
