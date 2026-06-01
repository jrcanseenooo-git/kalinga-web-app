import { openDB } from 'idb'

const DB_NAME = 'kalinga_offline'
const STORE   = 'pending_actions'

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
    }
  })
}

export async function queueAction(action, payload) {
  const db = await getDb()
  // Serialize to plain JSON and back to strip Vue reactivity proxies
  const cleanPayload = JSON.parse(JSON.stringify(payload))
  await db.add(STORE, {
    action,
    payload: cleanPayload,
    queued_at: new Date().toISOString(),
    status: 'pending'
  })
}

export async function getPendingActions() {
  const db = await getDb()
  return db.getAll(STORE)
}

export async function deleteAction(id) {
  const db = await getDb()
  return db.delete(STORE, id)
}

export async function getPendingCount() {
  const db = await getDb()
  return db.count(STORE)
}