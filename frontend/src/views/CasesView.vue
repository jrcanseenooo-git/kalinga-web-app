<template>
  <div class="space-y-4 animate-fade-in">

    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1 min-w-0">
        <MagnifyingGlassIcon class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input v-model="search" type="search" placeholder="Search by name, case ID, region, or CEFMU type…"
          class="input-base pl-10" />
      </div>
      <div class="flex gap-2 flex-shrink-0 flex-wrap">
        <div class="relative">
          <select v-model="filterStatus" class="input-base w-auto text-sm appearance-none pr-8"
            :class="filterStatus ? 'border-brand-400 bg-brand-50 text-brand-700 font-semibold' : ''">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
          <ChevronDownIcon
            class="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div class="relative">
          <select v-model="filterClass" class="input-base w-auto text-sm appearance-none pr-8"
            :class="filterClass ? 'border-brand-400 bg-brand-50 text-brand-700 font-semibold' : ''">
            <option value="">All types</option>
            <option value="Child">Child</option>
            <option value="Person With Disability">PWD</option>
          </select>
          <ChevronDownIcon
            class="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div class="relative">
          <select v-model="filterSex" class="input-base w-auto text-sm appearance-none pr-8"
            :class="filterSex ? 'border-brand-400 bg-brand-50 text-brand-700 font-semibold' : ''">
            <option value="">All sexes</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <ChevronDownIcon
            class="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <button v-if="hasFilters" @click="clearFilters"
          class="flex items-center gap-1 text-xs text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg font-semibold transition-colors">
          <XMarkIcon class="w-3.5 h-3.5" /> Clear
        </button>
      </div>
      <button @click="refreshCases" :disabled="loading" class="btn-secondary text-xs py-2 flex-shrink-0">
        <ArrowPathIcon class="w-3.5 h-3.5" :class="loading ? 'animate-spin' : ''" />
        Refresh
      </button>
      <button @click="exportCSV" class="btn-secondary text-xs py-2 flex-shrink-0">
        <ArrowDownTrayIcon class="w-3.5 h-3.5" /> Export
      </button>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-4 gap-3">
      <div class="card px-4 py-3 flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
          <FolderOpenIcon class="w-4 h-4 text-brand-600" />
        </div>
        <div>
          <p class="text-lg font-extrabold text-gray-900 leading-none">{{ filtered.length }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ hasFilters ? 'Filtered' : 'Total' }}</p>
        </div>
      </div>
      <div class="card px-4 py-3 flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
        </div>
        <div>
          <p class="text-lg font-extrabold text-emerald-600 leading-none">{{ activeCount }}</p>
          <p class="text-xs text-gray-400 mt-0.5">Active</p>
        </div>
      </div>
      <div class="card px-4 py-3 flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <span class="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
        </div>
        <div>
          <p class="text-lg font-extrabold text-gray-500 leading-none">{{ closedCount }}</p>
          <p class="text-xs text-gray-400 mt-0.5">Closed</p>
        </div>
      </div>
      <div class="card px-4 py-3 flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <UserIcon class="w-4 h-4 text-blue-500" />
        </div>
        <div>
          <p class="text-lg font-extrabold text-blue-600 leading-none">{{ femaleCount }}</p>
          <p class="text-xs text-gray-400 mt-0.5">Female</p>
        </div>
      </div>
    </div>

    <!-- ── Offline notice ── -->
    <div v-if="offlineMode" class="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
      <div class="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
        <span class="text-lg">📶</span>
      </div>
      <div>
        <p class="text-sm font-semibold text-amber-800">You are currently offline</p>
        <p class="text-xs text-amber-600 mt-0.5">
          Showing <strong>{{ cases.length }}</strong> locally saved
          {{ cases.length === 1 ? 'entry' : 'entries' }} pending sync.
          All data will sync automatically when you reconnect.
        </p>
      </div>
    </div>

    <!-- ── Error notice ── -->
    <div v-if="error" class="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">

      <!-- Table header with count -->
      <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <p class="text-xs text-gray-500">
          Showing <strong class="text-gray-700">{{ filtered.length }}</strong> of
          <strong class="text-gray-700">{{ cases.length }}</strong> cases
        </p>
        <!-- Sort -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-400">Sort by</span>
          <div class="relative">
            <select v-model="sortBy"
              class="text-xs border border-gray-200 rounded-lg pl-2 pr-6 py-1 appearance-none bg-white text-gray-600 focus:outline-none">
              <option value="date_intake_desc">Date intake (newest)</option>
              <option value="date_intake_asc">Date intake (oldest)</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="status">Status</option>
            </select>
            <ChevronDownIcon
              class="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Client</th>
              <th
                class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 hidden md:table-cell">
                CEFMU type</th>
              <th
                class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 hidden lg:table-cell">
                Location</th>
              <th
                class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 hidden lg:table-cell">
                Date intake</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
              <th class="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">

            <!-- Loading -->
            <tr v-if="loading" v-for="i in 6" :key="i">
              <td colspan="6" class="px-5 py-4">
                <div class="h-4 bg-gray-100 rounded-lg animate-pulse-soft w-full"></div>
              </td>
            </tr>

            <!-- Empty -->
            <tr v-else-if="!sorted.length">
              <td colspan="6" class="py-16 text-center">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <FolderOpenIcon class="w-7 h-7 text-gray-300" />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-gray-500">No cases found</p>
                    <p class="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
                  </div>
                  <button v-if="hasFilters" @click="clearFilters"
                    class="text-xs text-brand-600 hover:underline font-semibold">
                    Clear filters
                  </button>
                </div>
              </td>
            </tr>

            <!-- Rows -->
            <tr v-for="c in paginated" :key="c.case_id"
              class="hover:bg-brand-50/40 transition-colors cursor-pointer group"
              @click="$router.push(`/cases/${c.case_id}`)">

              <!-- Client — name masked by default for data privacy -->
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    :class="classifyColor(c.classification)">
                    {{ c.client_first?.charAt(0) }}{{ c.client_last?.charAt(0) }}
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900 leading-tight flex items-center gap-1.5">
                      <span v-if="revealedIds.has(c.case_id)">
                        {{ c.client_last }}, {{ c.client_first }}
                        <span v-if="c.client_mi" class="text-gray-400">{{ c.client_mi.charAt(0) }}.</span>
                      </span>
                      <span v-else class="font-mono tracking-widest text-gray-400 text-xs select-none">
                        {{ maskName(c.client_last) }}, {{ maskName(c.client_first) }}
                      </span>
                      <button
                        @click.stop="toggleReveal(c.case_id)"
                        :title="revealedIds.has(c.case_id) ? 'Hide name' : 'Click to reveal name'"
                        class="text-gray-300 hover:text-brand-500 transition-colors flex-shrink-0 ml-1">
                        <svg v-if="!revealedIds.has(c.case_id)" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        <svg v-else class="w-3.5 h-3.5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                        </svg>
                      </button>
                    </p>
                    <p class="text-xs text-gray-400 font-mono mt-0.5">{{ c.case_id }}</p>
                  </div>
                </div>
              </td>

              <!-- CEFMU type + classification -->
              <td class="px-5 py-3.5 hidden md:table-cell">
                <div class="space-y-1">
                  <span class="badge text-xs" :class="classColor(c.classification)">
                    {{ parseClassif(c.cefmu_type || c.classification) }}
                  </span>
                </div>
              </td>

              <!-- Location -->
              <td class="px-5 py-3.5 hidden lg:table-cell">
                <p class="text-xs font-medium text-gray-700">{{ c.city_muni || '-' }}</p>
                <p class="text-xs text-gray-400">{{ c.province || c.region || '' }}</p>
              </td>

              <!-- Date intake -->
              <td class="px-5 py-3.5 hidden lg:table-cell">
                <p class="text-xs text-gray-600">{{ fmtDate(c.date_intake) }}</p>
                <p class="text-xs text-gray-400">{{ c.sex || '' }}{{ c.age ? ', ' + c.age + ' y/o' : '' }}</p>
              </td>

              <!-- Status -->
              <td class="px-5 py-3.5">
                <!-- Pending offline badge -->
                <span v-if="c._offline" class="badge bg-amber-50 text-amber-700">
                  <span class="w-1.5 h-1.5 rounded-full mr-1.5 bg-amber-400 animate-pulse"></span>
                  Pending sync
                </span>
                <!-- Normal status badge -->
                <span v-else class="badge"
                  :class="c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'">
                  <span class="w-1.5 h-1.5 rounded-full mr-1.5"
                    :class="c.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'"></span>
                  {{ c.status }}
                </span>
              </td>

              <!-- Action -->
              <td class="px-5 py-3.5">
                <div class="flex items-center justify-end gap-2">
                  <RouterLink v-if="auth.canEdit" :to="`/cases/${c.case_id}/edit`"
                    class="text-xs text-brand-600 font-semibold hover:text-brand-800 opacity-0 group-hover:opacity-100 transition-all border border-brand-200 hover:border-brand-400 px-2.5 py-1 rounded-lg"
                    @click.stop>
                    Update
                  </RouterLink>
                  <ChevronRightIcon class="w-4 h-4 text-gray-300 group-hover:text-brand-400 transition-colors" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="sorted.length > pageSize" class="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
        <button @click="page--" :disabled="page <= 1"
          class="text-xs font-semibold text-gray-500 hover:text-brand-600 disabled:opacity-30 transition-colors flex items-center gap-1">
          <ChevronLeftIcon class="w-3.5 h-3.5" /> Previous
        </button>
        <div class="flex items-center gap-1">
          <button v-for="p in totalPages" :key="p" @click="page = p"
            class="w-7 h-7 text-xs font-semibold rounded-lg transition-colors"
            :class="page === p ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'">
            {{ p }}
          </button>
        </div>
        <button @click="page++" :disabled="page >= totalPages"
          class="text-xs font-semibold text-gray-500 hover:text-brand-600 disabled:opacity-30 transition-colors flex items-center gap-1">
          Next
          <ChevronRightIcon class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { isOnline, syncedAt } from '@/composables/useSync'
import { useAuthStore } from '@/stores/auth'
import { api, apiPost, invalidateCache } from '@/services/api'
import { getPendingActions } from '@/services/offlineQueue'
import {
  MagnifyingGlassIcon, FolderOpenIcon, ChevronRightIcon,
  ChevronLeftIcon, ChevronDownIcon, ArrowDownTrayIcon,
  XMarkIcon, UserIcon, ArrowPathIcon,
} from '@heroicons/vue/24/outline'

// ── State ─────────────────────────────────────────────────────
const auth = useAuthStore()

// ── Privacy: name masking ─────────────────────────────────────
// Names are hidden by default in the list. Each row has an eye
// icon — click it to reveal that specific client's name.
// Revealed names are only in memory and reset on page refresh.
const revealedIds = ref(new Set())

function maskName(name) {
  if (!name) return '***'
  // Show first letter + mask the rest: e.g. "Santos" → "S*****"
  return name.charAt(0) + '*'.repeat(Math.max(name.length - 1, 3))
}

function toggleReveal(caseId) {
  const next = new Set(revealedIds.value)
  if (next.has(caseId)) {
    next.delete(caseId)
  } else {
    next.add(caseId)
  }
  revealedIds.value = next
}
const cases = ref([])
const loading = ref(true)
const offlineMode = ref(false)
const error = ref(null)
const page = ref(1)
const pageSize = 20
const search = ref('')
const filterStatus = ref('')
const filterClass = ref('')
const filterSex = ref('')
const sortBy = ref('date_intake_desc')

// ── Helper: force-clear cache then fetch fresh from DB ───────
// Always wipes the in-memory cache before fetching so we never
// serve a stale snapshot, especially important right after sync.
async function _reloadCases({ showLoading = false } = {}) {
  invalidateCache('getCases')       // wipe cache FIRST
  if (showLoading) { cases.value = []; loading.value = true }
  error.value = null
  try {
    const data = await api('getCases', {}, { skipCache: true })
    cases.value = data || []
    offlineMode.value = false
    error.value = null
  } catch (e) {
    if (e.message === 'OFFLINE') {
      offlineMode.value = true
    } else if (!cases.value.length) {
      error.value = e.message
    }
  } finally {
    if (showLoading) loading.value = false
  }
}

// When connectivity is restored — reload immediately
watch(isOnline, async (online) => {
  if (!online) { offlineMode.value = true; return }
  await _reloadCases({ showLoading: true })
})

// When offline queue finishes syncing — reload with retries
// Apps Script can take 3–6 seconds to make a new row readable
// so we reload immediately, then retry at 3s and 6s intervals
watch(syncedAt, async (newVal) => {
  if (!newVal) return
  await _reloadCases({ showLoading: true })
  for (const delay of [3000, 6000]) {
    await new Promise(r => setTimeout(r, delay))
    if (!isOnline.value) break
    await _reloadCases()
  }
})

// ── Lifecycle ─────────────────────────────────────────────────
let autoRefreshTimer = null

onMounted(async () => {
  loading.value = true
  try {
    // Always fetch fresh on mount — wipe cache first
    invalidateCache('getCases')
    const data = await api('getCases', {}, { skipCache: true })
    cases.value = data || []
  } catch (e) {
    if (e.message === 'OFFLINE') {
      offlineMode.value = true
      const queued = await getPendingActions()
      cases.value = queued
        .filter(item => item.action === 'createCase')
        .map(item => ({
          ...item.payload,
          case_id: `PENDING-${item.id}`,
          status: 'pending',
          _offline: true,
        }))
    } else {
      error.value = e.message
    }
  } finally {
    loading.value = false
  }
})

// ── Auto-refresh every 10 seconds while on this page ─────────
onMounted(() => {
  autoRefreshTimer = setInterval(async () => {
    if (!isOnline.value || offlineMode.value) return
    await _reloadCases()
  }, 10 * 1000)
})

onUnmounted(() => {
  clearInterval(autoRefreshTimer)
})

async function refreshCases() {
  cases.value = []
  error.value = null
  loading.value = true
  try {
    const data = await api('getCases', {}, { skipCache: true })
    cases.value = data || []
  } catch (e) {
    if (e.message === 'OFFLINE') {
      offlineMode.value = true
    } else {
      error.value = e.message
    }
  } finally {
    loading.value = false
  }
}

// ── Computed ──────────────────────────────────────────────────
const hasFilters = computed(() =>
  !!search.value || !!filterStatus.value || !!filterClass.value || !!filterSex.value
)

const filtered = computed(() =>
  cases.value.filter(c => {
    const q = search.value.toLowerCase()
    const matchSearch = !q ||
      c.case_id?.toLowerCase().includes(q) ||
      c.client_last?.toLowerCase().includes(q) ||
      c.client_first?.toLowerCase().includes(q) ||
      c.region?.toLowerCase().includes(q) ||
      c.city_muni?.toLowerCase().includes(q) ||
      c.cefmu_type?.toLowerCase().includes(q)
    const matchStatus = !filterStatus.value || c.status === filterStatus.value
    const matchClass = !filterClass.value || (c.classification || '').toLowerCase() === filterClass.value.toLowerCase()
    const matchSex = !filterSex.value || c.sex === filterSex.value
    return matchSearch && matchStatus && matchClass && matchSex
  })
)

const sorted = computed(() => {
  const data = [...filtered.value]
  switch (sortBy.value) {
    case 'date_intake_asc': return data.sort((a, b) => new Date(a.date_intake) - new Date(b.date_intake))
    case 'date_intake_desc': return data.sort((a, b) => new Date(b.date_intake) - new Date(a.date_intake))
    case 'name_asc': return data.sort((a, b) => (a.client_last || '').localeCompare(b.client_last || ''))
    case 'status': return data.sort((a, b) => (a.status || '').localeCompare(b.status || ''))
    default: return data
  }
})

const paginated = computed(() => sorted.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const totalPages = computed(() => Math.ceil(sorted.value.length / pageSize))
const activeCount = computed(() => filtered.value.filter(c => c.status === 'active').length)
const closedCount = computed(() => filtered.value.filter(c => c.status === 'closed').length)
const femaleCount = computed(() => filtered.value.filter(c => c.sex === 'Female').length)

// ── Methods ───────────────────────────────────────────────────
function clearFilters() {
  search.value = ''
  filterStatus.value = ''
  filterClass.value = ''
  filterSex.value = ''
  page.value = 1
}

function parseClassif(val) {
  if (!val) return '-'
  if (Array.isArray(val)) return val.join(', ')
  if (typeof val === 'string' && val.startsWith('[')) {
    try { return JSON.parse(val).join(', ') } catch { return val }
  }
  return val
}

function classifyColor(cls) { return 'bg-brand-100 text-brand-600' }
function classColor(cls) { return 'bg-brand-50 text-brand-700' }

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-PH', { dateStyle: 'medium' }) : '-'
}

async function exportCSV() {
  // ── Audit trail: log export to backend before downloading ──
  try {
    await apiPost('logExport', {
      exported_count: filtered.value.length,
      filters: {
        status: filterStatus.value,
        cefmu_type: filterClass.value,
        sex: filterSex.value,
        search: search.value,
      },
    })
  } catch (e) {
    // Non-blocking — proceed with export even if audit log fails
    console.warn('[export] Audit log failed:', e.message)
  }

  const headers = ['Case ID', 'Last Name', 'First Name', 'Sex', 'Age', 'Classification', 'CEFMU Type', 'Region', 'Province', 'City/Muni', 'Date Intake', 'Status']
  const rows = filtered.value.map(c => [
    c.case_id, c.client_last, c.client_first, c.sex, c.age,
    c.classification, c.cefmu_type, c.region, c.province, c.city_muni,
    c.date_intake, c.status
  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`))
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cases-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
