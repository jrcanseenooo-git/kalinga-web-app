<template>
  <div class="space-y-4 animate-fade-in">

    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row gap-3">
      <!-- Search -->
      <div class="relative flex-1 min-w-0">
        <MagnifyingGlassIcon class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          v-model="search"
          type="search"
          placeholder="Search by name or case ID…"
          class="input-base pl-10"
        />
      </div>

      <!-- Filters -->
      <div class="flex gap-2 flex-shrink-0">
        <select v-model="filterStatus" class="input-base w-auto text-sm">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
        <select v-model="filterClass" class="input-base w-auto text-sm">
          <option value="">All types</option>
          <option value="child">Child</option>
          <option value="pwd">PWD</option>
        </select>
      </div>

      <button @click="exportCSV" class="btn-secondary text-xs py-1.5">
        <ArrowDownTrayIcon class="w-3.5 h-3.5" />
        Export CSV
      </button>
    </div>

    <!-- Results count + export -->
    <div class="flex items-center justify-between">
      <p class="text-xs text-gray-500">
        Showing <strong class="text-gray-700">{{ filtered.length }}</strong> of
        <strong class="text-gray-700">{{ cases.length }}</strong> cases
      </p>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Case ID</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Client name</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 hidden md:table-cell">Classification</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 hidden lg:table-cell">LGU</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Date intake</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <!-- Loading skeleton -->
            <tr v-if="loading" v-for="i in 6" :key="i">
              <td class="px-5 py-4" colspan="7">
                <div class="h-4 bg-gray-100 rounded-lg animate-pulse-soft w-full"></div>
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-else-if="!filtered.length">
              <td colspan="7" class="py-16 text-center">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <FolderOpenIcon class="w-7 h-7 text-gray-300" />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-gray-500">No cases found</p>
                    <p class="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Data rows -->
            <tr
              v-for="c in filtered"
              :key="c.case_id"
              class="hover:bg-brand-50/50 transition-colors cursor-pointer group"
              @click="$router.push(`/cases/${c.case_id}`)"
            >
              <td class="px-5 py-3.5">
                <span class="font-mono text-xs text-brand-700 font-semibold">{{ c.case_id }}</span>
              </td>
              <td class="px-5 py-3.5">
                <div>
                  <p class="font-semibold text-gray-900">{{ c.client_last }}, {{ c.client_first }}</p>
                </div>
              </td>
              <td class="px-5 py-3.5 hidden md:table-cell">
                <span class="badge" :class="classColor(c.classification)">
                  {{ c.classification }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-gray-600 text-xs hidden lg:table-cell">{{ c.city_muni }}</td>
              <td class="px-5 py-3.5 text-gray-400 text-xs hidden lg:table-cell">{{ fmtDate(c.date_intake) }}</td>
              <td class="px-5 py-3.5">
                <span class="badge"
                  :class="c.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'"
                >
                  <span class="w-1.5 h-1.5 rounded-full mr-1.5"
                    :class="c.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'"></span>
                  {{ c.status }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <RouterLink
                    v-if="auth.isAdmin || auth.isCaseWorker"
                    :to="`/cases/${c.case_id}/edit`"
                    class="text-xs text-brand-600 font-semibold hover:underline"
                    @click.stop
                  >Edit</RouterLink>
                  <ChevronRightIcon class="w-4 h-4 text-gray-300" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline'

const auth   = useAuthStore()
const cases  = ref([])
const loading = ref(true)
const search = ref('')
const filterStatus = ref('')
const filterClass  = ref('')

onMounted(async () => {
  cases.value = await api('getCases')
  loading.value = false
})

const filtered = computed(() =>
  cases.value.filter(c => {
    const q = search.value.toLowerCase()
    const matchSearch = !q ||
      c.case_id.toLowerCase().includes(q) ||
      c.client_last?.toLowerCase().includes(q) ||
      c.client_first?.toLowerCase().includes(q)
    const matchStatus = !filterStatus.value || c.status === filterStatus.value
    const matchClass  = !filterClass.value  || c.classification === filterClass.value
    return matchSearch && matchStatus && matchClass
  })
)

function classColor(cls) {
  return {
    child:  'bg-blue-50 text-blue-700',
    pwd:    'bg-purple-50 text-purple-700',
  }[cls] || 'bg-gray-100 text-gray-600'
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-PH', { dateStyle: 'medium' }) : '—'
}

function exportCSV() {
  const headers = ['Case ID', 'Last Name', 'First Name', 'Classification', 'LGU', 'Date Intake', 'Status']
  const rows = filtered.value.map(c => [
    c.case_id, c.client_last, c.client_first, c.classification, c.city_muni, c.date_intake, c.status
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cases-export-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
