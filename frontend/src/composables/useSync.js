import { ref, onMounted, onUnmounted } from 'vue'
import { getAll, remove, pendingCount as queuedCount, refreshCount as refreshQueueCount } from '@/services/offlineQueue'
import { apiPost } from '@/services/api'

// ── Module-level singletons shared across all consumers ───────
// This means AppLayout and CasesView all read the same reactive state.
export const isOnline     = ref(navigator.onLine)
export const isSyncing    = ref(false)
export const pendingCount = ref(0)
export const syncedAt     = ref(null) // Date of last successful flush

// ── Refresh the pending badge count ──────────────────────────
async function refreshCount() {
  // queuedCount is a reactive ref from offlineQueue — read its .value directly
  pendingCount.value = queuedCount.value
  // Also trigger a DB count refresh so the ref stays accurate
  await refreshQueueCount()
}

// ── Flush queue — replay each item against the live API ──────
export async function flushQueue() {
  if (!navigator.onLine || isSyncing.value) return

  const items = await getAll()
  if (!items.length) {
    pendingCount.value = 0
    return
  }

  isSyncing.value = true

  for (const item of items) {
    try {
      await apiPost(item.action, item.payload)
      await remove(item.id)
    } catch (err) {
      const isNetworkError =
        !navigator.onLine ||
        err.message === 'Failed to fetch' ||
        (err.message || '').includes('NetworkError')

      if (!isNetworkError) {
        // Backend rejected it (not a network issue) — drop to avoid infinite loop
        console.warn(`[sync] Dropping failed queue item (${item.action}):`, err.message)
        await remove(item.id)
      } else {
        // True network loss mid-flush — stop and retry on next reconnect
        console.warn('[sync] Network lost mid-flush, will retry on reconnect.')
        break
      }
    }
  }

  isSyncing.value = false
  syncedAt.value  = Date.now()
  await refreshCount()
}

// ── React to connectivity changes ────────────────────────────
function handleOnline() {
  isOnline.value = true
  flushQueue()
}

function handleOffline() {
  isOnline.value = false
}

// ── Bootstrap listeners once at module load ───────────────────
// This runs when any file first imports from useSync.js, so the
// listeners are always active regardless of which component mounts first.
if (typeof window !== 'undefined') {
  window.addEventListener('online',  handleOnline)
  window.addEventListener('offline', handleOffline)
  // Initial count
  refreshQueueCount().then(() => { pendingCount.value = queuedCount.value })
  // Attempt flush on first load in case items were queued in a prior session
  if (navigator.onLine) flushQueue()
}

// ── useSync() composable — for components that need lifecycle hooks ──
// Optional: some components call useSync() to get the refs back.
// Since the refs are module-level singletons, this just returns them.
export function useSync() {
  // Refresh count on mount so new components always see current state
  onMounted(refreshCount)

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncedAt,
    syncNow: flushQueue,
    flushQueue,
    refreshCount,
  }
}