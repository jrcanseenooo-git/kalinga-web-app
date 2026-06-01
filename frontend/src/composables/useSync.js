import { ref, onMounted, onUnmounted } from 'vue'
import {
  getPendingActions,
  deleteAction,
  pendingCount,
  refreshCount,
} from '@/services/offlineQueue'
import { apiPost } from '@/services/api'

export { pendingCount } from '@/services/offlineQueue'

export const isSyncing   = ref(false)
export const isOnline    = ref(navigator.onLine)
export const syncedAt    = ref(null)

export async function flushQueue() {
  if (isSyncing.value || !navigator.onLine) return
  await refreshCount()
  if (pendingCount.value === 0) return

  isSyncing.value = true
  try {
    const pending = await getPendingActions()
    for (const item of pending) {
      try {
        await apiPost(item.action, item.payload)
        await deleteAction(item.id)
        pendingCount.value = Math.max(0, pendingCount.value - 1)
      } catch (e) {
        console.warn('Sync failed for queued item, will retry later:', e)
        break
      }
    }
    syncedAt.value = Date.now()
  } finally {
    isSyncing.value = false
    await refreshCount()
  }
}

export function useSync() {
  function handleOnline() {
    isOnline.value = true
    flushQueue()
  }
  function handleOffline() {
    isOnline.value = false
  }

  onMounted(async () => {
    await refreshCount()
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    if (navigator.onLine) flushQueue()
  })

  onUnmounted(() => {
    window.removeEventListener('online',  handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return { isOnline, isSyncing, pendingCount, flushQueue }
}