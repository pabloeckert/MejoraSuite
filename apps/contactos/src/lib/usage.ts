/**
 * Free tier usage tracking (client-side, localStorage).
 * Limits: 500 contacts/batch, 3 batches/day.
 *
 * Upgrading = user adds their own API keys (no payment needed).
 * Limits are enforced client-side as a soft gate.
 */

const USAGE_KEY = "__mc_usage__";
const FREE_MAX_CONTACTS_PER_BATCH = 500;
const FREE_MAX_BATCHES_PER_DAY = 3;

interface UsageRecord {
  date: string; // YYYY-MM-DD
  batchCount: number;
  totalContacts: number;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadUsage(): UsageRecord {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return { date: todayKey(), batchCount: 0, totalContacts: 0 };
    const rec = JSON.parse(raw) as UsageRecord;
    // Reset if day changed
    if (rec.date !== todayKey()) return { date: todayKey(), batchCount: 0, totalContacts: 0 };
    return rec;
  } catch {
    return { date: todayKey(), batchCount: 0, totalContacts: 0 };
  }
}

function saveUsage(rec: UsageRecord): void {
  localStorage.setItem(USAGE_KEY, JSON.stringify(rec));
}

/** Check if user has their own API keys configured (bypasses limits). */
export function hasOwnApiKeys(): boolean {
  try {
    const raw = localStorage.getItem("mejoraapp_api_keys_v2");
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return false;
    return data.some((pk: { keys?: Array<{ apiKey?: string; status?: string }> }) =>
      pk.keys?.some((k) => k.apiKey && k.status !== "error")
    );
  } catch {
    return false;
  }
}

/** Returns current usage stats. */
export function getUsageStats(): {
  batchesUsed: number;
  batchesRemaining: number;
  contactsUsedToday: number;
  maxBatchSize: number;
  maxBatchesPerDay: number;
  isFreeTier: boolean;
} {
  const isFree = !hasOwnApiKeys();
  if (!isFree) {
    return {
      batchesUsed: 0,
      batchesRemaining: Infinity,
      contactsUsedToday: 0,
      maxBatchSize: Infinity,
      maxBatchesPerDay: Infinity,
      isFreeTier: false,
    };
  }
  const rec = loadUsage();
  return {
    batchesUsed: rec.batchCount,
    batchesRemaining: Math.max(0, FREE_MAX_BATCHES_PER_DAY - rec.batchCount),
    contactsUsedToday: rec.totalContacts,
    maxBatchSize: FREE_MAX_CONTACTS_PER_BATCH,
    maxBatchesPerDay: FREE_MAX_BATCHES_PER_DAY,
    isFreeTier: true,
  };
}

/**
 * Pre-check: can the user process `contactCount` contacts?
 * Returns { allowed, reason, suggestion }.
 */
export function canProcess(contactCount: number): {
  allowed: boolean;
  reason?: string;
  suggestion?: string;
} {
  if (hasOwnApiKeys()) return { allowed: true };

  const stats = getUsageStats();

  if (contactCount > stats.maxBatchSize) {
    return {
      allowed: false,
      reason: `Límite free: ${stats.maxBatchSize} contactos por lote. Tu archivo tiene ${contactCount.toLocaleString()}.`,
      suggestion: "Agregá tus propias API keys en Config para eliminar el límite, o procesá en lotes más chicos.",
    };
  }

  if (stats.batchesRemaining <= 0) {
    return {
      allowed: false,
      reason: `Límite free: ${stats.maxBatchesPerDay} lotes por día. Ya usaste ${stats.batchesUsed} hoy.`,
      suggestion: "Agregá tus propias API keys en Config para procesar sin límites, o volvé mañana.",
    };
  }

  return { allowed: true };
}

/** Record a batch processed. Call AFTER successful processing. */
export function recordBatch(contactCount: number): void {
  const rec = loadUsage();
  rec.batchCount += 1;
  rec.totalContacts += contactCount;
  saveUsage(rec);
}

export { FREE_MAX_CONTACTS_PER_BATCH, FREE_MAX_BATCHES_PER_DAY };
