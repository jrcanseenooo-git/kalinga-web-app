<template>
  <div class="space-y-6 animate-fade-in">

    <!-- Header -->
    <div>
      <h2 class="text-xl font-extrabold text-gray-900">Audit Logs</h2>
      <p class="text-sm text-gray-500 mt-0.5">Security events, login attempts, and system activity.</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
      <button v-for="t in tabs" :key="t.key" @click="activeTab = t.key"
        class="text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
        :class="activeTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
        {{ t.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card p-12 text-center">
      <span class="w-6 h-6 border-2 border-gray-200 border-t-brand-600 rounded-full animate-spin inline-block"></span>
      <p class="text-sm text-gray-400 mt-3">Loading audit logs…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="card p-8 text-center">
      <ExclamationTriangleIcon class="w-8 h-8 text-red-300 mx-auto mb-2" />
      <p class="text-sm text-red-600 font-semibold">{{ error }}</p>
      <button @click="load" class="btn-secondary text-xs mt-3">Retry</button>
    </div>

    <!-- Activity logs -->
    <template v-else-if="activeTab === 'activity'">
      <div class="card overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-sm font-bold text-gray-800">Recent activity</h3>
          <p class="text-xs text-gray-400">{{ activityLogs.length }} entries</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Timestamp</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="(log, i) in activityLogs" :key="i" class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{{ fmtDate(log.timestamp) }}</td>
                <td class="px-4 py-3 text-xs text-gray-700 font-medium">{{ log.email }}</td>
                <td class="px-4 py-3">
                  <span class="badge text-xs" :class="actionBadge(log.action)">{{ log.action }}</span>
                </td>
                <td class="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{{ log.details || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="activityLogs.length === 0" class="p-8 text-center">
          <p class="text-sm text-gray-400">No activity logs found</p>
        </div>
      </div>
    </template>

    <!-- Failed logins -->
    <template v-else-if="activeTab === 'failed'">
      <div class="card overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-100">
          <h3 class="text-sm font-bold text-gray-800">Failed login attempts & locked accounts</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Timestamp</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Event</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="(log, i) in failedLogins" :key="i" class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{{ fmtDate(log.timestamp) }}</td>
                <td class="px-4 py-3 text-xs text-gray-700 font-medium">{{ log.email }}</td>
                <td class="px-4 py-3">
                  <span class="badge text-xs"
                    :class="log.action === 'ACCOUNT_LOCKED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'">
                    {{ log.action }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs text-gray-500">{{ log.details || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="failedLogins.length === 0" class="p-8 text-center">
          <p class="text-sm text-gray-400">No failed login attempts</p>
        </div>
      </div>
    </template>

    <!-- Export logs -->
    <template v-else-if="activeTab === 'exports'">
      <div class="card overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-100">
          <h3 class="text-sm font-bold text-gray-800">Export audit trail</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Timestamp</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Purpose</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Records</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="(log, i) in exportLogs" :key="i" class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{{ fmtDate(log.timestamp) }}</td>
                <td class="px-4 py-3 text-xs text-gray-700 font-medium">{{ log.email }}</td>
                <td class="px-4 py-3 text-xs text-gray-600">{{ log.export_type || '-' }}</td>
                <td class="px-4 py-3 text-xs text-gray-600">{{ log.purpose || '-' }}</td>
                <td class="px-4 py-3 text-xs text-gray-600">{{ log.record_count || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="exportLogs.length === 0" class="p-8 text-center">
          <p class="text-sm text-gray-400">No export logs found</p>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const loading   = ref(true)
const error     = ref(null)
const activeTab = ref('activity')
const data      = ref({ logs: [], failed_logins: [], export_logs: [] })

const tabs = [
  { key: 'activity', label: 'Activity' },
  { key: 'failed',   label: 'Failed logins' },
  { key: 'exports',  label: 'Exports' },
]

const activityLogs = computed(() => data.value.logs || [])
const failedLogins = computed(() => data.value.failed_logins || [])
const exportLogs   = computed(() => data.value.export_logs || [])

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await api('getAuditLogs', {}, { skipCache: true })
  } catch (e) {
    error.value = e.message || 'Failed to load audit logs'
  } finally {
    loading.value = false
  }
}

function fmtDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}

function actionBadge(action) {
  if (!action) return 'bg-gray-100 text-gray-600'
  if (action.startsWith('BLOCKED')) return 'bg-red-100 text-red-700'
  if (action.includes('LOGIN'))    return 'bg-blue-100 text-blue-700'
  if (action.includes('LOCK'))     return 'bg-red-100 text-red-700'
  if (action.includes('CREATE'))   return 'bg-green-100 text-green-700'
  if (action.includes('UPDATE'))   return 'bg-amber-100 text-amber-700'
  if (action.includes('DELETE') || action.includes('DEACTIVATE')) return 'bg-red-100 text-red-700'
  if (action.includes('ACTIVATE')) return 'bg-emerald-100 text-emerald-700'
  return 'bg-gray-100 text-gray-600'
}

onMounted(load)
</script>
