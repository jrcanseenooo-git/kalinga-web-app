import { openDB } from 'idb'
import { ref } from 'vue'

const DB_NAME    = 'kalinga_offline'
const DB_VERSION = 3          // bumped — new schema (iv + ciphertext instead of payload)
const STORE      = 'pending_actions'

// ── Shared reactive count ─────────────────────────────────────
export const pendingCount = ref(0)

// ── IndexedDB setup ───────────────────────────────────────────
async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Always recreate the store cleanly on version bump.
      // Any unsynced items from the old unencrypted store are
      // dropped — they were plain text and should not migrate.
      if (db.objectStoreNames.contains(STORE)) {
        db.deleteObjectStore(STORE)
      }
      db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
    },
  })
}

// ── Web Crypto helpers ────────────────────────────────────────
// Derive a 256-bit AES-GCM key from the session token.
// Uses PBKDF2 with a fixed salt tied to this app — the token
// itself is the secret, the salt just adds domain separation.
const CRYPTO_SALT = new TextEncoder().encode('kalinga-cefmu-dswd-2026')

async function deriveKey(token) {
  const rawKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(token || 'anonymous'),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: CRYPTO_SALT, iterations: 100_000, hash: 'SHA-256' },
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function encryptPayload(payload, token) {
  const key       = await deriveKey(token)
  const iv        = crypto.getRandomValues(new Uint8Array(12))  // 96-bit IV for AES-GCM
  const plaintext = new TextEncoder().encode(JSON.stringify(payload))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  return {
    iv:         Array.from(iv),                           // stored as plain array
    ciphertext: Array.from(new Uint8Array(encrypted)),    // stored as plain array
  }
}

async function decryptPayload(iv, ciphertext, token) {
  const key       = await deriveKey(token)
  const ivBuf     = new Uint8Array(iv)
  const cBuf      = new Uint8Array(ciphertext)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuf }, key, cBuf)
  return JSON.parse(new TextDecoder().decode(decrypted))
}

function getToken() {
  return localStorage.getItem('cefmu_token') || ''
}

// ── UUID v4 for offline_id stamping ──────────────────────────
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// ── Public API ────────────────────────────────────────────────

export async function refreshCount() {
  const db = await getDb()
  pendingCount.value = await db.count(STORE)
}

// queueAction — encrypts the payload before writing to IndexedDB.
// Stamps offline_id UUID on createCase payloads for deduplication.
export async function queueAction(action, payload) {
  const db = await getDb()

  // Deep-clone to strip Vue reactive proxies
  const cleanPayload = JSON.parse(JSON.stringify(payload))

  // Stamp offline_id for createCase deduplication
  if (action === 'createCase' && !cleanPayload.offline_id) {
    cleanPayload.offline_id = uuidv4()
  }

  // Encrypt before storing — raw payload never touches IndexedDB
  const token = getToken()
  const { iv, ciphertext } = await encryptPayload(cleanPayload, token)

  await db.add(STORE, {
    action,
    iv,
    ciphertext,
    queued_at: new Date().toISOString(),
    status: 'pending',
  })

  await refreshCount()
}

// getPendingActions — decrypts each item before returning.
// Returns the same shape as before: [{ id, action, payload, ... }]
// useSync.js and everything else works exactly as before.
export async function getPendingActions() {
  const db    = await getDb()
  const items = await db.getAll(STORE)
  const token = getToken()

  const decrypted = await Promise.all(
    items.map(async item => {
      try {
        const payload = await decryptPayload(item.iv, item.ciphertext, token)
        return { ...item, payload }
      } catch (e) {
        // Decryption failed — token mismatch or corrupted entry.
        // Mark as unreadable so useSync can skip/drop it gracefully.
        console.warn('[offlineQueue] Failed to decrypt item id=' + item.id, e.message)
        return { ...item, payload: null, _decryptError: true }
      }
    })
  )

  // Filter out unreadable items — don't attempt to sync corrupt/stale data
  return decrypted.filter(item => item.payload !== null)
}

export async function deleteAction(id) {
  const db = await getDb()
  return db.delete(STORE, id)
}

export async function getPendingCount() {
  const db = await getDb()
  return db.count(STORE)
}

// clearAll — called on logout to wipe any remaining queued data.
// Even though items are encrypted, clearing on logout is a second
// layer of protection and keeps the queue lean.
export async function clearAll() {
  const db = await getDb()
  await db.clear(STORE)
  pendingCount.value = 0
}

// ── Aliases for backwards compatibility ───────────────────────
// Some files import the older function names. These aliases
// ensure both naming conventions work without any other changes.
export const enqueue    = queueAction        // used by api.js
export const getAll     = getPendingActions  // used by useSync.js
export const remove     = deleteAction       // used by useSync.js