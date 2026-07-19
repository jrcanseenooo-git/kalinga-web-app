<template>
  <div class="space-y-6 animate-fade-in">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-extrabold text-gray-900">Reports & Export</h2>
        <p class="text-sm text-gray-500 mt-0.5">Generate and download reports from the CEFMU Registry.</p>
      </div>
    </div>

    <!-- Filter card -->
    <div class="card p-5 space-y-4">
      <h3 class="text-sm font-bold text-gray-800">Report filters</h3>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <!-- Region -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1.5">Region</label>
          <div class="relative">
            <select v-model="filters.region" class="input-base appearance-none pr-8">
              <option value="">All regions</option>
              <option v-for="r in regionList" :key="r.code" :value="r.name">{{ r.name }}</option>
            </select>
            <ChevronDownIcon class="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <!-- Province -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1.5">Province</label>
          <div class="relative">
            <select v-model="filters.province" class="input-base appearance-none pr-8" :disabled="!filters.region">
              <option value="">All provinces</option>
              <option v-for="p in provinceList" :key="p" :value="p">{{ p }}</option>
            </select>
            <ChevronDownIcon class="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <!-- Status -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
          <div class="relative">
            <select v-model="filters.status" class="input-base appearance-none pr-8">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
            <ChevronDownIcon class="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <!-- Classification -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1.5">Classification</label>
          <div class="relative">
            <select v-model="filters.classification" class="input-base appearance-none pr-8">
              <option value="">All types</option>
              <option value="Child">Child</option>
              <option value="Person With Disability">PWD</option>
            </select>
            <ChevronDownIcon class="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <!-- Date from -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1.5">Date intake - from</label>
          <input v-model="filters.dateFrom" type="date" class="input-base" />
        </div>

        <!-- Date to -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1.5">Date intake - to</label>
          <input v-model="filters.dateTo" type="date" class="input-base" />
        </div>

        <!-- CEFMU type -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1.5">CEFMU type</label>
          <div class="relative">
            <select v-model="filters.cefmuType" class="input-base appearance-none pr-8">
              <option value="">All types</option>
              <option v-for="t in cefmuTypes" :key="t" :value="t">{{ t }}</option>
            </select>
            <ChevronDownIcon class="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <!-- Sex -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1.5">Sex</label>
          <div class="relative">
            <select v-model="filters.sex" class="input-base appearance-none pr-8">
              <option value="">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <ChevronDownIcon class="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button @click="loadCases" :disabled="loading"
          class="btn-primary text-sm">
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {{ loading ? 'Loading…' : 'Generate report' }}
        </button>
        <button @click="clearFilters" class="btn-secondary text-sm">Clear filters</button>
      </div>
    </div>

    <!-- Results -->
    <template v-if="filtered.length > 0 || generated">

      <!-- Summary + export buttons -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <p class="text-sm font-semibold text-gray-700">
            {{ filtered.length }} case{{ filtered.length !== 1 ? 's' : '' }} found
          </p>
          <div class="flex gap-2">
            <span class="badge bg-brand-50 text-brand-700">Active: {{ activeCount }}</span>
            <span class="badge bg-green-50 text-green-700">Closed: {{ closedCount }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <button @click="requestExport('csv')"
            class="flex items-center gap-1.5 text-xs font-semibold border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <ArrowDownTrayIcon class="w-3.5 h-3.5" />
            Export
          </button>
          <button @click="requestExport('summary')"
            class="flex items-center gap-1.5 text-xs font-semibold bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors">
            <DocumentChartBarIcon class="w-3.5 h-3.5" />
            Summary report
          </button>
        </div>
      </div>

      <!-- Summary stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card p-4 text-center">
          <p class="text-2xl font-extrabold text-brand-600">{{ filtered.length }}</p>
          <p class="text-xs text-gray-400 mt-1 font-medium">Total cases</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-extrabold text-blue-600">{{ activeCount }}</p>
          <p class="text-xs text-gray-400 mt-1 font-medium">Active</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-extrabold text-green-600">{{ closedCount }}</p>
          <p class="text-xs text-gray-400 mt-1 font-medium">Closed</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-extrabold text-purple-600">{{ femaleCount }}</p>
          <p class="text-xs text-gray-400 mt-1 font-medium">Female clients</p>
        </div>
      </div>

      <!-- Breakdown by region -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="card p-5">
          <h3 class="text-sm font-bold text-gray-800 mb-3">By region</h3>
          <div class="space-y-2">
            <div v-for="(count, region) in byRegion" :key="region"
              class="flex items-center gap-3">
              <span class="text-xs text-gray-600 w-48 truncate">{{ region }}</span>
              <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div class="h-2 rounded-full bg-brand-500 transition-all"
                  :style="{ width: (count / filtered.length * 100) + '%' }"></div>
              </div>
              <span class="text-xs font-bold text-gray-700 w-6 text-right">{{ count }}</span>
            </div>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="text-sm font-bold text-gray-800 mb-3">By CEFMU type</h3>
          <div class="space-y-2">
            <div v-for="(count, type) in byCefmuType" :key="type"
              class="flex items-center gap-3">
              <span class="text-xs text-gray-600 w-48 truncate">{{ type }}</span>
              <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div class="h-2 rounded-full bg-purple-500 transition-all"
                  :style="{ width: (count / filtered.length * 100) + '%' }"></div>
              </div>
              <span class="text-xs font-bold text-gray-700 w-6 text-right">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Case table -->
      <div class="card overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-sm font-bold text-gray-800">Case list</h3>
          <p class="text-xs text-gray-400">Showing {{ Math.min(filtered.length, pageSize * page) }} of {{ filtered.length }}</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Case ID</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Client name</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Region</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Province</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">CEFMU type</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date intake</th>
                <th class="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="c in paginated" :key="c.case_id" class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 font-mono text-xs text-brand-700">{{ c.case_id }}</td>
                <td class="px-4 py-3 font-medium text-gray-900">
                  {{ c.client_last }}, {{ c.client_first }} {{ c.client_mi }}
                </td>
                <td class="px-4 py-3 text-gray-600 text-xs">{{ c.region || '-' }}</td>
                <td class="px-4 py-3 text-gray-600 text-xs">{{ c.province || '-' }}</td>
                <td class="px-4 py-3 text-gray-600 text-xs">{{ c.cefmu_type || '-' }}</td>
                <td class="px-4 py-3 text-gray-500 text-xs">{{ fmtDate(c.date_intake) }}</td>
                <td class="px-4 py-3">
                  <span class="badge capitalize"
                    :class="c.status === 'active' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'">
                    {{ c.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="filtered.length > pageSize" class="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <button @click="page--" :disabled="page <= 1"
            class="text-xs font-semibold text-gray-500 hover:text-brand-600 disabled:opacity-30 transition-colors">
            ← Previous
          </button>
          <span class="text-xs text-gray-400">Page {{ page }} of {{ totalPages }}</span>
          <button @click="page++" :disabled="page >= totalPages"
            class="text-xs font-semibold text-gray-500 hover:text-brand-600 disabled:opacity-30 transition-colors">
            Next →
          </button>
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <div v-else-if="generated && !loading"
      class="card p-12 text-center">
      <DocumentChartBarIcon class="w-10 h-10 text-gray-200 mx-auto mb-3" />
      <p class="text-sm font-semibold text-gray-400">No cases match your filters</p>
      <p class="text-xs text-gray-400 mt-1">Try adjusting or clearing the filters above</p>
    </div>

    <!-- Initial state -->
    <div v-else class="card p-12 text-center">
      <DocumentChartBarIcon class="w-12 h-12 text-gray-200 mx-auto mb-3" />
      <p class="text-sm font-semibold text-gray-500">Set filters and click "Generate report"</p>
      <p class="text-xs text-gray-400 mt-1">Export as CSV or summary report</p>
    </div>

  </div>

  <!-- Export confirmation modal (P1) -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showExportModal"
        class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in"
        @click.self="showExportModal = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldExclamationIcon class="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 class="font-bold text-gray-900 text-sm">Export confirmation</h3>
              <p class="text-xs text-gray-500 mt-0.5">This export contains sensitive personal data protected under the Data Privacy Act.</p>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">Purpose of export <span class="text-red-500">*</span></label>
            <select v-model="exportPurpose" class="input-base w-full">
              <option value="">Select purpose…</option>
              <option value="Official reporting">Official reporting</option>
              <option value="Case review">Case review</option>
              <option value="Data analysis">Data analysis</option>
              <option value="Audit/compliance">Audit / compliance</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div v-if="exportPurpose === 'Other'">
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">Specify purpose</label>
            <input v-model="exportPurposeOther" type="text" class="input-base w-full" placeholder="Describe the purpose…" />
          </div>

          <p class="text-xs text-gray-400">
            By proceeding, you confirm this export is for an authorized purpose and that you will handle the data in accordance with DSWD data privacy policies.
          </p>

          <div class="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button @click="showExportModal = false" class="btn-secondary text-sm">Cancel</button>
            <button @click="confirmExport" :disabled="!exportPurposeValid" class="btn-primary text-sm disabled:opacity-40">
              Confirm & export
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { api, apiPost } from '@/services/api'
import { regions as regionList, provinces as provincesMap, cefmuTypes } from '@/data/psgc'
import {
  ArrowDownTrayIcon, DocumentChartBarIcon, ChevronDownIcon, ShieldExclamationIcon
} from '@heroicons/vue/24/outline'

const loading   = ref(false)
const generated = ref(false)
const cases     = ref([])
const page      = ref(1)
const pageSize  = 50

const showExportModal   = ref(false)
const exportPurpose     = ref('')
const exportPurposeOther = ref('')
const pendingExportType = ref('')

const exportPurposeValid = computed(() => {
  if (!exportPurpose.value) return false
  if (exportPurpose.value === 'Other' && !exportPurposeOther.value.trim()) return false
  return true
})

function requestExport(type) {
  pendingExportType.value = type
  exportPurpose.value = ''
  exportPurposeOther.value = ''
  showExportModal.value = true
}

async function confirmExport() {
  const purpose = exportPurpose.value === 'Other' ? exportPurposeOther.value.trim() : exportPurpose.value
  showExportModal.value = false

  apiPost('logExport', {
    export_type: pendingExportType.value,
    purpose,
    exported_count: filtered.value.length,
    filters: JSON.stringify(filters.value),
  }).catch(() => {})

  if (pendingExportType.value === 'csv') exportCSV()
  else exportSummaryCSV()
}

const filters = ref({
  region: '', province: '', status: '', classification: '',
  dateFrom: '', dateTo: '', cefmuType: '', sex: '',
})

const provinceList = computed(() => {
  const found = regionList.find(r => r.name === filters.value.region)
  return found ? (provincesMap[found.code] || []) : []
})

watch(() => filters.value.region, () => { filters.value.province = '' })

function clearFilters() {
  filters.value = { region: '', province: '', status: '', classification: '', dateFrom: '', dateTo: '', cefmuType: '', sex: '' }
  cases.value   = []
  generated.value = false
  page.value    = 1
}

async function loadCases() {
  loading.value = true
  try {
    cases.value = await api('generateReport', {
      filters: JSON.stringify(filters.value),
    }, { skipCache: true })
    generated.value = true
    page.value = 1
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  let data = cases.value
  const f  = filters.value
  if (f.region)         data = data.filter(c => c.region === f.region)
  if (f.province)       data = data.filter(c => c.province === f.province)
  if (f.classification) data = data.filter(c => (c.classification || '').toLowerCase() === f.classification.toLowerCase())
  if (f.cefmuType)      data = data.filter(c => c.cefmu_type === f.cefmuType)
  if (f.sex)            data = data.filter(c => c.sex === f.sex)
  if (f.dateFrom)       data = data.filter(c => c.date_intake && c.date_intake >= f.dateFrom)
  if (f.dateTo)         data = data.filter(c => c.date_intake && c.date_intake <= f.dateTo)
  return data
})

const paginated   = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const totalPages  = computed(() => Math.ceil(filtered.value.length / pageSize))
const activeCount = computed(() => filtered.value.filter(c => c.status === 'active').length)
const closedCount = computed(() => filtered.value.filter(c => c.status === 'closed').length)
const femaleCount = computed(() => filtered.value.filter(c => c.sex === 'Female').length)

const byRegion = computed(() => {
  const acc = {}
  filtered.value.forEach(c => { const k = c.region || 'Unknown'; acc[k] = (acc[k] || 0) + 1 })
  return Object.fromEntries(Object.entries(acc).sort((a, b) => b[1] - a[1]))
})

const byCefmuType = computed(() => {
  const acc = {}
  filtered.value.forEach(c => { const k = c.cefmu_type || 'Unknown'; acc[k] = (acc[k] || 0) + 1 })
  return Object.fromEntries(Object.entries(acc).sort((a, b) => b[1] - a[1]))
})

function fmtDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-PH', { dateStyle: 'medium' })
}

// Export full case list as CSV
function exportCSV() {
  const cols = [
    'case_id', 'date_intake', 'status', 'client_last', 'client_first', 'client_mi',
    'birthdate', 'age', 'sex', 'civil_status', 'religion', 'ip_category', 'education',
    'phone', 'occupation', 'income', 'philhealth_no',
    'present_street', 'region', 'province', 'city_muni', 'barangay',
    'classification', 'cefmu_type', 'admission_mode', 'aics_form_no', 'lgu_code',
    'referred_by', 'referral_date',
    'presenting_problem', 'initial_assessment', 'plan_of_action', 'remarks',
    'case_worker_email', 'date_closed', 'created_at',
  ]

  const headers = cols.join(',')
  const rows = filtered.value.map(c =>
    cols.map(col => {
      const val = c[col] ?? ''
      return typeof val === 'string' && (val.includes(',') || val.includes('\n') || val.includes('"'))
        ? `"${val.replace(/"/g, '""')}"`
        : val
    }).join(',')
  )

  const csv  = [headers, ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `cefmu-cases-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// Export summary report CSV
function exportSummaryCSV() {
  const now = new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })
  const rows = [
    ['CEFMU Registry - Summary Report'],
    [`Generated: ${now}`],
    [`Filters: Region=${filters.value.region||'All'}, Province=${filters.value.province||'All'}, Status=${filters.value.status||'All'}`],
    [],
    ['SUMMARY'],
    ['Total cases', filtered.value.length],
    ['Active cases', activeCount.value],
    ['Closed cases', closedCount.value],
    ['Female clients', femaleCount.value],
    ['Male clients', filtered.value.filter(c => c.sex === 'Male').length],
    [],
    ['BY REGION'],
    ['Region', 'Count'],
    ...Object.entries(byRegion.value),
    [],
    ['BY CEFMU TYPE'],
    ['Type', 'Count'],
    ...Object.entries(byCefmuType.value),
  ]

  const csv  = rows.map(r => Array.isArray(r) ? r.join(',') : r).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `cefmu-summary-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
