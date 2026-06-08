import { ref, onMounted } from 'vue'
import { getPendingActions, deleteAction, refreshCount as refreshQueueCount, pendingCount as queuedCount } from '@/services/offlineQueue'
import { apiPost } from '@/services/api'

// ── Module-level singletons ───────────────────────────────────
export const isOnline     = ref(navigator.onLine)
export const isSyncing    = ref(false)
export const pendingCount = ref(0)
export const syncedAt     = ref(null)

// ── Refresh the pending badge count ──────────────────────────
async function refreshCount() {
  await refreshQueueCount()
  pendingCount.value = queuedCount.value
}

// ── Flush queue ───────────────────────────────────────────────
export async function flushQueue() {
  if (!navigator.onLine || isSyncing.value) return

  const items = await getPendingActions()
  if (!items.length) {
    pendingCount.value = 0
    return
  }

  isSyncing.value = true

  for (const item of items) {
    try {
      await apiPost(item.action, item.payload)
      await deleteAction(item.id)
    } catch (err) {
      const isNetworkError =
        !navigator.onLine ||
        err.message === 'Failed to fetch' ||
        (err.message || '').includes('NetworkError')

      if (!isNetworkError) {
        console.warn(`[sync] Dropping failed item (${item.action}):`, err.message)
        await deleteAction(item.id)
      } else {
        console.warn('[sync] Network lost mid-flush, will retry on reconnect.')
        break
      }
    }
  }

  isSyncing.value = false
  syncedAt.value  = Date.now()
  await refreshCount()
}

// ── Connectivity handlers ─────────────────────────────────────
function handleOnline()  { isOnline.value = true;  flushQueue() }
function handleOffline() { isOnline.value = false }

// ── Bootstrap once at module load ────────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('online',  handleOnline)
  window.addEventListener('offline', handleOffline)
  // queuedCount is a ref — read .value, never call it as a function
  refreshQueueCount().then(() => { pendingCount.value = queuedCount.value })
  if (navigator.onLine) flushQueue()
}

// ── useSync() composable ──────────────────────────────────────
export function useSync() {
  onMounted(refreshCount)
  return { isOnline, isSyncing, pendingCount, syncedAt, syncNow: flushQueue, flushQueue, refreshCount }
}