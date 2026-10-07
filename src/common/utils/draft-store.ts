/**
 * Tiny IndexedDB-backed store for work-in-progress forms ("drafts"), so a refresh,
 * a crash or an accidental tab close never loses what the user already did.
 * IndexedDB (not localStorage) because drafts can hold thousands of rows.
 * Every call fails soft: without storage the page simply works without drafts.
 */
const DB_NAME = "pdesk-drafts";
const STORE = "drafts";

interface DraftRecord<T> {
  key: string;
  value: T;
  savedAt: number;
  version: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "key" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<R>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<R>): Promise<R> {
  const db = await openDb();
  try {
    return await new Promise<R>((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = run(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

export async function saveDraft<T>(key: string, value: T, version: number): Promise<boolean> {
  try {
    const record: DraftRecord<T> = { key, value, savedAt: Date.now(), version };
    await withStore("readwrite", (store) => store.put(record));
    return true;
  } catch {
    return false;
  }
}

/** Returns the draft only if it is the current `version` and younger than `maxAgeMs`. */
export async function loadDraft<T>(key: string, version: number, maxAgeMs: number): Promise<{ value: T; savedAt: number } | null> {
  try {
    const record = (await withStore("readonly", (store) => store.get(key))) as DraftRecord<T> | undefined;
    if (!record || record.version !== version) return null;
    if (Date.now() - record.savedAt > maxAgeMs) {
      void deleteDraft(key);
      return null;
    }
    return { value: record.value, savedAt: record.savedAt };
  } catch {
    return null;
  }
}

export async function deleteDraft(key: string): Promise<void> {
  try {
    await withStore("readwrite", (store) => store.delete(key));
  } catch {
    /* nothing to clean up */
  }
}
