import { openDB } from 'idb'

const DB_NAME    = 'kalinga_offline'
const DB_VERSION = 2   // bumped so the upgrade runs and creates the queue store
const STORE      = 'queue'

// ── Simple UUID v4 (no external dependency) ──────────────────
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { autoIncrement: true })
      }
    },
  })
}

// ── Enqueue a write operation ─────────────────────────────────
// Stamps offline_id UUID on createCase payloads for deduplication.
export async function enqueue(action, body) {
  const db = await getDB()
  // Deep-clone to strip Vue reactive proxies before storing in IndexedDB
  const safeBody = JSON.parse(JSON.stringify(body))
  if (action === 'createCase' && !safeBody.offline_id) {
    safeBody.offline_id = uuidv4()
  }
  await db.add(STORE, { action, body: safeBody, ts: Date.now() })
}

// ── Return all queued items in insertion order (FIFO) ─────────
export async function getAll() {
  const db     = await getDB()
  const keys   = await db.getAllKeys(STORE)
  const values = await db.getAll(STORE)
  return keys.map((key, i) => ({ key, ...values[i] }))
}

// ── Alias used by CasesView to show pending offline entries ──
export const getPendingActions = getAll

// ── Remove a successfully synced item ────────────────────────
export async function remove(key) {
  const db = await getDB()
  await db.delete(STORE, key)
}

// ── Number of items waiting ───────────────────────────────────
export async function pendingCount() {
  const db = await getDB()
  return db.count(STORE)
}

// ── Clear everything ──────────────────────────────────────────
export async function clearAll() {
  const db = await getDB()
  await db.clear(STORE)
}