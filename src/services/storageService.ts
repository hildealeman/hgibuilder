
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Artifact } from '../types';

interface HGIDB extends DBSchema {
  artifacts: {
    key: string;
    value: Artifact;
    indexes: { 'by-timestamp': number };
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'hgi-vibe-builder-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<HGIDB>>;

if (typeof window !== 'undefined') {
  dbPromise = openDB<HGIDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const artifactStore = db.createObjectStore('artifacts', { keyPath: 'id' });
      artifactStore.createIndex('by-timestamp', 'timestamp');
      db.createObjectStore('settings');
    },
  });
}

export const storageService = {
  async saveArtifact(artifact: Artifact) {
    const db = await dbPromise;
    // Add simple validation/sanitization here if needed
    return db.put('artifacts', artifact);
  },

  async getArtifact(id: string): Promise<Artifact | undefined> {
    const db = await dbPromise;
    return db.get('artifacts', id);
  },

  async getAllArtifacts(): Promise<Artifact[]> {
    const db = await dbPromise;
    return db.getAllFromIndex('artifacts', 'by-timestamp');
  },

  async saveSetting(key: string, value: any) {
    const db = await dbPromise;
    return db.put('settings', value, key);
  },

  async getSetting(key: string) {
    const db = await dbPromise;
    return db.get('settings', key);
  },
  
  // Temporary session storage for sensitive tokens (Github PAT)
  // These are cleared on tab close and NEVER persist to IDB/LocalStore
  setSessionSecret(key: string, value: string) {
      sessionStorage.setItem(`hgi_sec_${key}`, btoa(value));
  },
  
  getSessionSecret(key: string): string | null {
      const val = sessionStorage.getItem(`hgi_sec_${key}`);
      return val ? atob(val) : null;
  }
};
