import { Store, SessionData } from "express-session";

// Simple in-memory session store
class SimpleMemoryStore extends Store {
  private sessions: Map<string, { data: SessionData; expires: Date }> = new Map();

  get(sid: string, callback: (err: Error | null, session?: SessionData | null) => void): void {
    const session = this.sessions.get(sid);
    if (!session) {
      return callback(null, null);
    }

    if (new Date() > session.expires) {
      this.sessions.delete(sid);
      return callback(null, null);
    }

    callback(null, session.data);
  }

  set(sid: string, session: SessionData, callback?: (err?: Error | null) => void): void {
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hour expiration
    
    this.sessions.set(sid, { data: session, expires });
    if (callback) callback();
  }

  destroy(sid: string, callback?: (err?: Error | null) => void): void {
    this.sessions.delete(sid);
    if (callback) callback();
  }

  touch(sid: string, session: SessionData, callback?: (err?: Error | null) => void): void {
    const existing = this.sessions.get(sid);
    if (existing) {
      const expires = new Date();
      expires.setHours(expires.getHours() + 24);
      existing.expires = expires;
    }
    if (callback) callback();
  }
}

// Create a more reliable session store that falls back to memory if Airtable fails
export class ReliableSessionStore extends Store {
  private airtableStore: Store | null;
  private memoryStore: Store;
  private useMemoryFallback: boolean = false;

  constructor(airtableStore: Store | null) {
    super();
    this.airtableStore = airtableStore;
    this.memoryStore = new SimpleMemoryStore();
  }

  private async tryAirtableFirst<T>(
    operation: string,
    airtableOp: () => Promise<T>,
    memoryOp: () => Promise<T>
  ): Promise<T> {
    if (!this.airtableStore || this.useMemoryFallback) {
      return memoryOp();
    }

    try {
      return await airtableOp();
    } catch (error) {
      console.warn(`[SessionStore] Airtable ${operation} failed, using memory fallback:`, error);
      this.useMemoryFallback = true;
      // Reset fallback after 5 minutes
      setTimeout(() => {
        this.useMemoryFallback = false;
      }, 300000);
      return memoryOp();
    }
  }

  get(sid: string, callback: (err: Error | null, session?: SessionData | null) => void): void {
    this.tryAirtableFirst(
      'get',
      () => new Promise((resolve, reject) => {
        this.airtableStore!.get(sid, (err, session) => {
          if (err) reject(err);
          else resolve(session);
        });
      }),
      () => new Promise((resolve, reject) => {
        this.memoryStore.get(sid, (err, session) => {
          if (err) reject(err);
          else resolve(session);
        });
      })
    ).then(
      session => callback(null, session as SessionData | null),
      err => callback(err)
    );
  }

  set(sid: string, session: SessionData, callback?: (err?: Error | null) => void): void {
    this.tryAirtableFirst(
      'set',
      () => new Promise<void>((resolve, reject) => {
        this.airtableStore!.set(sid, session, (err) => {
          if (err) reject(err);
          else resolve();
        });
      }),
      () => new Promise<void>((resolve, reject) => {
        this.memoryStore.set(sid, session, (err) => {
          if (err) reject(err);
          else resolve();
        });
      })
    ).then(
      () => callback && callback(),
      err => callback && callback(err)
    );
  }

  destroy(sid: string, callback?: (err?: Error | null) => void): void {
    // Destroy in both stores
    Promise.all([
      new Promise<void>((resolve) => {
        if (this.airtableStore && !this.useMemoryFallback) {
          this.airtableStore.destroy(sid, () => resolve());
        } else {
          resolve();
        }
      }),
      new Promise<void>((resolve) => {
        this.memoryStore.destroy(sid, () => resolve());
      })
    ]).then(
      () => callback && callback(),
      err => callback && callback(err as Error)
    );
  }

  touch(sid: string, session: SessionData, callback?: (err?: Error | null) => void): void {
    this.tryAirtableFirst(
      'touch',
      () => new Promise<void>((resolve, reject) => {
        if (this.airtableStore!.touch) {
          this.airtableStore!.touch(sid, session, (err?: Error | null) => {
            if (err) reject(err);
            else resolve();
          });
        } else {
          resolve();
        }
      }),
      () => new Promise<void>((resolve, reject) => {
        if (this.memoryStore.touch) {
          this.memoryStore.touch(sid, session, (err?: Error | null) => {
            if (err) reject(err);
            else resolve();
          });
        } else {
          resolve();
        }
      })
    ).then(
      () => callback && callback(),
      err => callback && callback(err)
    );
  }
}