import { Store, SessionData } from 'express-session';
import Airtable from 'airtable';

export class AirtableSessionStore extends Store {
  private base: any;
  private tableName = 'Sessions';
  private ttl: number;

  constructor(apiKey: string, baseId: string, options?: { ttl?: number }) {
    super();
    this.base = new Airtable({ apiKey }).base(baseId);
    this.ttl = options?.ttl || 86400; // Default 24 hours
  }

  // Get session from Airtable
  get(sid: string, callback: (err: any, session?: SessionData | null) => void) {
    this.base(this.tableName).select({
      filterByFormula: `{Session ID} = '${sid}'`,
      maxRecords: 1
    }).firstPage((err: any, records: any[]) => {
      if (err) {
        return callback(err);
      }

      if (!records || records.length === 0) {
        return callback(null, null);
      }

      const record = records[0];
      const expiry = record.fields['Expiry'];
      
      // Check if session has expired
      if (expiry && new Date(expiry) < new Date()) {
        this.destroy(sid, () => {});
        return callback(null, null);
      }

      try {
        const sessionData = JSON.parse(record.fields['Data'] || '{}');
        callback(null, sessionData);
      } catch (parseError) {
        callback(parseError);
      }
    });
  }

  // Set session in Airtable
  set(sid: string, session: SessionData, callback?: (err?: any) => void) {
    const expiry = new Date();
    expiry.setSeconds(expiry.getSeconds() + this.ttl);
    
    const sessionData = {
      'Session ID': sid,
      'Data': JSON.stringify(session),
      'Expiry': expiry.toISOString(),
      'Last Access': new Date().toISOString()
    };

    // Try to find existing session
    this.base(this.tableName).select({
      filterByFormula: `{Session ID} = '${sid}'`,
      maxRecords: 1
    }).firstPage((err: any, records: any[]) => {
      if (err) {
        if (callback) callback(err);
        return;
      }

      if (records && records.length > 0) {
        // Update existing session
        this.base(this.tableName).update(records[0].id, sessionData, (updateErr: any) => {
          if (callback) callback(updateErr);
        });
      } else {
        // Create new session
        this.base(this.tableName).create(sessionData, (createErr: any) => {
          if (callback) callback(createErr);
        });
      }
    });
  }

  // Destroy session
  destroy(sid: string, callback?: (err?: any) => void) {
    this.base(this.tableName).select({
      filterByFormula: `{Session ID} = '${sid}'`,
      maxRecords: 1
    }).firstPage((err: any, records: any[]) => {
      if (err) {
        if (callback) callback(err);
        return;
      }

      if (records && records.length > 0) {
        this.base(this.tableName).destroy(records[0].id, (destroyErr: any) => {
          if (callback) callback(destroyErr);
        });
      } else {
        if (callback) callback();
      }
    });
  }

  // Clear all sessions (optional)
  clear(callback?: (err?: any) => void) {
    this.base(this.tableName).select().all((err: any, records: any[]) => {
      if (err) {
        if (callback) callback(err);
        return;
      }

      if (!records || records.length === 0) {
        if (callback) callback();
        return;
      }

      let deleted = 0;
      const total = records.length;
      
      records.forEach((record: any) => {
        this.base(this.tableName).destroy(record.id, (destroyErr: any) => {
          deleted++;
          if (deleted === total) {
            if (callback) callback(destroyErr);
          }
        });
      });
    });
  }

  // Touch session to reset expiry
  touch(sid: string, session: SessionData, callback?: (err?: any) => void) {
    const expiry = new Date();
    expiry.setSeconds(expiry.getSeconds() + this.ttl);
    
    this.base(this.tableName).select({
      filterByFormula: `{Session ID} = '${sid}'`,
      maxRecords: 1
    }).firstPage((err: any, records: any[]) => {
      if (err) {
        if (callback) callback(err);
        return;
      }

      if (records && records.length > 0) {
        this.base(this.tableName).update(records[0].id, {
          'Expiry': expiry.toISOString(),
          'Last Access': new Date().toISOString()
        }, (updateErr: any) => {
          if (callback) callback(updateErr);
        });
      } else {
        if (callback) callback();
      }
    });
  }

  // Get all sessions (optional)
  all(callback: (err: any, sessions?: { [sid: string]: SessionData } | SessionData[] | null) => void) {
    this.base(this.tableName).select().all((err: any, records: any[]) => {
      if (err) {
        callback(err);
        return;
      }

      const sessions: { [sid: string]: SessionData } = {};
      
      if (records && records.length > 0) {
        records.forEach((record: any) => {
          const sid = record.fields['Session ID'] as string;
          try {
            const data = JSON.parse(record.fields['Data'] as string || '{}');
            sessions[sid] = data;
          } catch (parseErr) {
            // Skip invalid sessions
          }
        });
      }
      
      callback(null, sessions);
    });
  }

  // Get session count (optional)
  length(callback: (err: any, length?: number) => void) {
    this.base(this.tableName).select({
      fields: ['Session ID']
    }).all((err: any, records: any[]) => {
      if (err) {
        callback(err);
        return;
      }
      
      callback(null, records ? records.length : 0);
    });
  }
}