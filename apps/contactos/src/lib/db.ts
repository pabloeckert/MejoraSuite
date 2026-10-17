import { openDB, type IDBPDatabase } from "idb";
import type { UnifiedContact } from "@/types/contact";

const DB_NAME = "mejoraapp";
const DB_VERSION = 3;
const CURSOR_BATCH_SIZE = 5000;

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  action: "clean" | "dedup" | "import";
  description: string;
  contactCount: number;
  snapshot: UnifiedContact[]; // contacts BEFORE the operation
}

let dbInstance: IDBPDatabase | null = null;

async function getDB() {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Contacts store
      if (db.objectStoreNames.contains("contacts")) {
        db.deleteObjectStore("contacts");
      }
      const store = db.createObjectStore("contacts", { keyPath: "id" });
      store.createIndex("email", "email", { unique: false });
      store.createIndex("whatsapp", "whatsapp", { unique: false });
      store.createIndex("source", "source", { unique: false });

      // History store (v3)
      if (!db.objectStoreNames.contains("history")) {
        const histStore = db.createObjectStore("history", { keyPath: "id" });
        histStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    },
  });
  return dbInstance;
}

export async function saveContacts(contacts: UnifiedContact[]) {
  const db = await getDB();
  const tx = db.transaction("contacts", "readwrite");
  for (const c of contacts) {
    await tx.store.put(c);
  }
  await tx.done;
}

/**
 * Batched cursor-based getAll — replaces the old db.getAll() that loaded
 * everything into memory at once. Processes CURSOR_BATCH_SIZE records
 * per iteration to keep memory flat for 50K+ datasets.
 */
export async function getAllContacts(): Promise<UnifiedContact[]> {
  const db = await getDB();
  const all: UnifiedContact[] = [];
  let cursor = await db.transaction("contacts").store.openCursor();

  while (cursor) {
    all.push(cursor.value as UnifiedContact);
    cursor = await cursor.continue();
  }

  return all;
}

/**
 * Stream contacts in batches via cursor — for operations that process
 * records without needing them all in memory at once.
 * Calls onBatch for each batch of CURSOR_BATCH_SIZE records.
 */
export async function streamContacts(
  onBatch: (batch: UnifiedContact[], isLast: boolean) => void | Promise<void>
): Promise<number> {
  const db = await getDB();
  const tx = db.transaction("contacts");
  let cursor = await tx.store.openCursor();
  let batch: UnifiedContact[] = [];
  let total = 0;

  while (cursor) {
    batch.push(cursor.value as UnifiedContact);
    total++;

    if (batch.length >= CURSOR_BATCH_SIZE) {
      await onBatch(batch, false);
      batch = [];
    }

    cursor = await cursor.continue();
  }

  // Final batch
  if (batch.length > 0) {
    await onBatch(batch, true);
  }

  return total;
}

/**
 * Count-only operation — lightweight, no data transfer.
 */
export async function getContactCount(): Promise<number> {
  const db = await getDB();
  return db.count("contacts");
}

export async function clearContacts() {
  const db = await getDB();
  await db.clear("contacts");
}

export async function deleteContact(id: string) {
  const db = await getDB();
  await db.delete("contacts", id);
}

export async function updateContact(contact: UnifiedContact) {
  const db = await getDB();
  await db.put("contacts", contact);
}

/**
 * Batch delete by IDs — single transaction for efficiency.
 */
export async function deleteContacts(ids: string[]) {
  const db = await getDB();
  const tx = db.transaction("contacts", "readwrite");
  for (const id of ids) {
    await tx.store.delete(id);
  }
  await tx.done;
}

/**
 * Batch update — single transaction for bulk operations.
 */
export async function updateContacts(contacts: UnifiedContact[]) {
  const db = await getDB();
  const tx = db.transaction("contacts", "readwrite");
  for (const c of contacts) {
    await tx.store.put(c);
  }
  await tx.done;
}

// ── History (Undo) ──────────────────────────────────────────

const MAX_HISTORY = 10; // Keep last 10 snapshots

/**
 * Save a snapshot before an operation (clean, dedup, import).
 * Keeps only the last MAX_HISTORY entries.
 */
export async function saveHistorySnapshot(
  action: HistoryEntry["action"],
  description: string,
  snapshot: UnifiedContact[]
): Promise<string> {
  const db = await getDB();
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    action,
    description,
    contactCount: snapshot.length,
    snapshot,
  };

  const tx = db.transaction("history", "readwrite");
  await tx.store.put(entry);

  // Prune old entries
  const all = await tx.store.index("timestamp").getAll();
  const toDelete: HistoryEntry[] = [];
  if (all.length > MAX_HISTORY) {
    const excess = all.slice(0, all.length - MAX_HISTORY);
    for (const old of excess) {
      toDelete.push(old);
      await tx.store.delete(old.id);
    }
  }

  // TTL cleanup: remove entries older than 30 days
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);
  const oldEntries = all.filter(e => new Date(e.timestamp) < cutoff);
  for (const old of oldEntries) {
    if (!toDelete.find(d => d.id === old.id)) { // Don't double-delete
      await tx.store.delete(old.id);
    }
  }

  await tx.done;
  return entry.id;
}

/**
 * Manually clean up history entries older than 30 days.
 * Returns the number of deleted entries.
 */
export async function cleanupOldHistory(): Promise<number> {
  const db = await getDB();
  const all = await db.getAll("history");
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);
  let deleted = 0;
  const tx = db.transaction("history", "readwrite");
  for (const entry of all) {
    if (new Date(entry.timestamp) < cutoff) {
      await tx.store.delete(entry.id);
      deleted++;
    }
  }
  await tx.done;
  return deleted;
}

/**
 * Get history entries (newest first), without snapshots (lightweight).
 */
export async function getHistory(): Promise<Omit<HistoryEntry, "snapshot">[]> {
  const db = await getDB();
  const all = await db.getAll("history");
  return all
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map(({ snapshot, ...rest }) => rest);
}

/**
 * Restore contacts from a specific history snapshot.
 * Clears current contacts and replaces with the snapshot.
 */
export async function restoreFromHistory(historyId: string): Promise<UnifiedContact[]> {
  const db = await getDB();
  const entry = await db.get("history", historyId);
  if (!entry) throw new Error("Historial no encontrado");

  // Clear and restore
  await clearContacts();
  await saveContacts(entry.snapshot);
  return entry.snapshot;
}

/**
 * Delete a single history entry.
 */
export async function deleteHistoryEntry(historyId: string) {
  const db = await getDB();
  await db.delete("history", historyId);
}

/**
 * Clear all history.
 */
export async function clearHistory() {
  const db = await getDB();
  await db.clear("history");
}
