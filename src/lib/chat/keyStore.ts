// Device-local storage for the user's chat private key.
//
// The key is stored as a NON-EXTRACTABLE CryptoKey in IndexedDB: scripts on the
// page (including an XSS payload) can ask the browser to use it for ECDH but can
// never read its bytes. It is never written to localStorage or sent anywhere.
// The only off-device copy is the passphrase-encrypted backup made at setup.

export interface StoredIdentity {
  privateKey: CryptoKey;
  publicJwk: JsonWebKey;
  keyVersion: number;
}

const DB_NAME = 'fuzo-chat-keys';
const STORE = 'identity';

function open(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise<T | undefined>((resolve) => {
        if (!db) return resolve(undefined);
        try {
          const tx = db.transaction(STORE, mode);
          const req = fn(tx.objectStore(STORE));
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(undefined);
          tx.oncomplete = () => db.close();
        } catch {
          resolve(undefined);
        }
      }),
  );
}

export const KeyStore = {
  get: (userId: string) => run<StoredIdentity>('readonly', (s) => s.get(userId)),
  put: async (userId: string, identity: StoredIdentity): Promise<boolean> => {
    const db = await open();
    if (!db) return false;
    return new Promise<boolean>((resolve) => {
      try {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(identity, userId);
        tx.oncomplete = () => { db.close(); resolve(true); };
        tx.onerror = () => resolve(false);
        tx.onabort = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  },
  remove: (userId: string) => run('readwrite', (s) => s.delete(userId)),
};
