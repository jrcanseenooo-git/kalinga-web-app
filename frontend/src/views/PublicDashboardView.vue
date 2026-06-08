<template>
  <div class="min-h-screen" style="background: #f8f7ff; overflow-y: auto;">

    <!-- ── HERO BANNER ── -->
    <div class="relative overflow-hidden text-white"
      style="background: linear-gradient(135deg, #1e0b4b 0%, #3d1a7a 50%, #1a1040 100%); min-height: 180px;">
      <!-- Decorative Kalinga logo watermark -->
      <div class="absolute right-0 top-0 h-full flex items-center pr-12 opacity-5 pointer-events-none select-none">
        <img src="/logo-white.png" alt="" class="h-64 w-auto" />
      </div>
      <!-- Dot pattern -->
      <div class="absolute inset-0 opacity-5 pointer-events-none"
        style="background-image: radial-gradient(circle, #ffffff 1px, transparent 1px); background-size: 28px 28px;">
      </div>

      <div class="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div class="flex items-center gap-4 mb-4">
          <img src="/logo-white.png" alt="Kalinga" class="h-10 w-auto drop-shadow-lg" />
          <div class="h-8 w-px bg-white/20"></div>
          <div>
            <p class="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">CEFMU Dashboard</p>
            <p class="text-white font-semibold text-sm">Department of Social Welfare and Development</p>
          </div>
        </div>

        <div class="flex items-end justify-between gap-6">
          <div>
            <p class="text-white/50 text-xs leading-relaxed max-w-lg">
              Aggregate figures including cases of child marriage, early union, and related issues.
            </p>
            <!-- Disclaimer -->
            <div
              class="mt-4 bg-amber-400/15 border border-amber-300/30 rounded-xl px-4 py-2.5 text-xs text-amber-200 flex items-start gap-2">
              <InformationCircleIcon class="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span><strong>Pilot area data only.</strong> Figures shown are currently from pilot areas and may not reflect the
                complete national picture. No personally identifiable information is displayed.</span>
            </div>
          </div>
          <!-- FAQ CTA - visible to new visitors right in the hero -->
          <RouterLink to="/faq"
            class="flex-shrink-0 flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/50 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-all backdrop-blur-sm">
            <QuestionMarkCircleIcon class="w-4 h-4" />
            Help &amp; FAQ
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- ── FILTER BAR ── -->
    <div class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
      <div class="max-w-7xl mx-auto px-6 py-2.5 flex items-center gap-2 flex-wrap">
        <span class="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Filter</span>

        <div class="flex items-center gap-2 flex-wrap flex-1">
          <!-- Status -->
          <div class="relative">
            <select v-model="filterStatus"
              class="text-xs border rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer transition-colors"
              :class="filterStatus !== 'all' ? 'border-brand-400 bg-brand-50 text-brand-700 font-semibold' : 'border-gray-200 bg-white text-gray-600'">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
            <ChevronDownIcon
              class="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>

          <!-- Classification -->
          <div class="relative">
            <select v-model="filterClass"
              class="text-xs border rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer transition-colors"
              :class="filterClass !== 'all' ? 'border-brand-400 bg-brand-50 text-brand-700 font-semibold' : 'border-gray-200 bg-white text-gray-600'">
              <option value="all">All classifications</option>
              <option value="child">Child</option>
              <option value="pwd">PWD</option>
            </select>
            <ChevronDownIcon
              class="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>

          <!-- Sex -->
          <div class="relative">
            <select v-model="filterSex"
              class="text-xs border rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer transition-colors"
              :class="filterSex !== 'all' ? 'border-brand-400 bg-brand-50 text-brand-700 font-semibold' : 'border-gray-200 bg-white text-gray-600'">
              <option value="all">All sexes</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <ChevronDownIcon
              class="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>

          <!-- CEFMU type -->
          <div class="relative">
            <select v-model="filterCefmuType"
              class="text-xs border rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer transition-colors"
              :class="filterCefmuType !== 'all' ? 'border-brand-400 bg-brand-50 text-brand-700 font-semibold' : 'border-gray-200 bg-white text-gray-600'">
              <option value="all">All CEFMU types</option>
              <option v-for="t in cefmuTypeOptions" :key="t" :value="t">{{ t }}</option>
            </select>
            <ChevronDownIcon
              class="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>

          <!-- Clear -->
          <button v-if="hasActiveFilters" @click="clearFilters"
            class="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors bg-red-50">
            <XMarkIcon class="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>
    </div>

    <!-- ── LOADING ── -->
    <div v-if="loading" class="max-w-7xl mx-auto px-6 mt-8 space-y-4">
      <div class="grid grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="h-28 bg-white rounded-2xl animate-pulse"></div>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div class="col-span-2 h-96 bg-white rounded-2xl animate-pulse"></div>
        <div class="h-96 bg-white rounded-2xl animate-pulse"></div>
      </div>
    </div>

    <!-- ── MAIN CONTENT ── -->
    <template v-else-if="stats">
      <div class="max-w-7xl mx-auto px-6 py-8 space-y-6 data-panel">

        <!-- Summary cards -->
        <div class="grid grid-cols-3 gap-4 stagger">
          <div class="card p-5 flex items-center gap-4">
            <div class="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
              <FolderOpenIcon class="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total cases</p>
              <Transition name="num" mode="out-in">
                <p :key="stats.summary.total" class="text-2xl font-extrabold text-brand-600">{{ stats.summary.total }}</p>
              </Transition>
            </div>
          </div>
          <div class="card p-5 flex items-center gap-4">
            <div class="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <ClockIcon class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active cases</p>
              <Transition name="num" mode="out-in">
                <p :key="stats.summary.active" class="text-2xl font-extrabold text-blue-600">{{ stats.summary.active }}</p>
              </Transition>
            </div>
          </div>
          <div class="card p-5 flex items-center gap-4">
            <div class="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <CheckCircleIcon class="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Closed cases</p>
              <Transition name="num" mode="out-in">
                <p :key="stats.summary.closed" class="text-2xl font-extrabold text-green-600">{{ stats.summary.closed }}</p>
              </Transition>
            </div>
          </div>
        </div>

        <!-- Row 1: Map + Sex/Classification -->
        <div class="grid grid-cols-3 gap-5">

          <!-- Philippine Heatmap (spans 2 cols) -->
          <div class="col-span-2 card p-6">
            <PhilippineHeatmap :data="stats.byRegion || {}" :height="500" />
          </div>

          <!-- Right: Sex + Classification stacked -->
          <div class="space-y-5">
            <div class="card p-5">
              <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Cases by sex</p>
              <div v-if="sexData" class="h-44">
                <Doughnut :data="sexData" :options="doughnutOpts" class="w-full h-full" />
              </div>
              <p v-else class="text-xs text-gray-400 text-center py-8">No data</p>
            </div>
            <div class="card p-5">
              <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">By classification</p>
              <div v-if="classData" class="h-44">
                <Doughnut :data="classData" :options="doughnutOpts" class="w-full h-full" />
              </div>
              <p v-else class="text-xs text-gray-400 text-center py-8">No data</p>
            </div>
          </div>
        </div>

        <!-- Row 2: Trend + Age + CEFMU type -->
        <div class="grid grid-cols-3 gap-5">
          <div class="col-span-2 card p-6">
            <div class="flex items-center justify-between mb-4">
              <p class="text-xs font-bold uppercase tracking-wider text-gray-400">Monthly intake trend</p>
              <span class="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">Last 12
                months</span>
            </div>
            <div v-if="trendData" class="h-52">
              <Bar :data="trendData" :options="barOpts" class="w-full h-full" />
            </div>
            <p v-else class="text-xs text-gray-400 text-center py-12">No trend data</p>
          </div>
          <div class="card p-5">
            <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Cases by age group</p>
            <div v-if="ageData" class="h-52">
              <Bar :data="ageData" :options="barOpts" class="w-full h-full" />
            </div>
            <p v-else class="text-xs text-gray-400 text-center py-12">No data</p>
          </div>
        </div>

        <!-- Row 3: CEFMU type (full width horizontal) -->
        <div class="card p-6">
          <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Cases by CEFMU type</p>
          <div v-if="cefmuData" class="h-48">
            <Bar :data="cefmuData" :options="horizOpts" class="w-full h-full" />
          </div>
          <p v-else class="text-xs text-gray-400 text-center py-8">No data</p>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between py-4 border-t border-gray-100">
          <div class="flex items-center gap-3">
            <img src="/logo-purple.png" alt="Kalinga" class="h-7 w-auto opacity-50" />
            <p class="text-xs text-gray-400">DSWD Kalinga Program | CEFMU Dashboard</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1.5">
              <span class="relative flex h-2 w-2">
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span class="text-xs text-gray-400">Updated {{ lastUpdatedLabel }}</span>
            </div>
            <RouterLink to="/faq"
              class="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800 border border-brand-200 hover:border-brand-400 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-colors">
              <QuestionMarkCircleIcon class="w-3.5 h-3.5" />
              Help & FAQ
            </RouterLink>
          </div>
        </div>

      </div>
    </template>

    <!-- Error -->
    <div v-else class="max-w-7xl mx-auto px-6 mt-20 text-center">
      <p class="text-gray-400 text-sm">Unable to load dashboard data. Please try again later.</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend
} from 'chart.js'
import { api } from '@/services/api'
import PhilippineHeatmap from '@/components/ui/PhilippineHeatmap.vue'
import {
  InformationCircleIcon, XMarkIcon, ChevronDownIcon,
  FolderOpenIcon, ClockIcon, CheckCircleIcon, QuestionMarkCircleIcon
} from '@heroicons/vue/24/outline'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const loading = ref(true)
const stats = ref(null)
const allCefmuTypes = ref([])
const lastUpdatedAt = ref(null)
let pollTimer = null
let labelTimer = null

// ── Filters ──────────────────────────────────────────────────
const filterStatus = ref('all')
const filterClass = ref('all')
const filterSex = ref('all')
const filterCefmuType = ref('all')

const hasActiveFilters = computed(() =>
  [filterStatus, filterClass, filterSex, filterCefmuType].some(f => f.value !== 'all')
)
const activeFilterCount = computed(() =>
  [filterStatus, filterClass, filterSex, filterCefmuType].filter(f => f.value !== 'all').length
)
// Always show the full CEFMU type list (from unfiltered data) so the dropdown is stable
const cefmuTypeOptions = computed(() => allCefmuTypes.value)

function clearFilters() {
  filterStatus.value = filterClass.value = filterSex.value = filterCefmuType.value = 'all'
}

// ── Build API params from current filters ─────────────────────
function filterParams() {
  const p = {}
  if (filterStatus.value    !== 'all') p.status         = filterStatus.value
  if (filterClass.value     !== 'all') p.classification  = filterClass.value
  if (filterSex.value       !== 'all') p.sex             = filterSex.value
  if (filterCefmuType.value !== 'all') p.cefmu_type      = filterCefmuType.value
  return p
}

// ── Last-updated label ────────────────────────────────────────
const lastUpdatedLabel = computed(() => {
  if (!lastUpdatedAt.value) return '-'
  const secs = Math.floor((Date.now() - lastUpdatedAt.value) / 1000)
  if (secs < 10) return 'just now'
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
})

// ── Data loading ──────────────────────────────────────────────
async function loadData(params = {}, opts = {}) {
  try {
    const data = await api('getPublicDashboard', params, opts)
    if (data) {
      stats.value = data
      lastUpdatedAt.value = Date.now()
      // Preserve the full CEFMU type list from the unfiltered response
      if (data.allCefmuTypes) {
        allCefmuTypes.value = Object.keys(data.allCefmuTypes).filter(k => k && k !== 'Unknown')
      } else if (!allCefmuTypes.value.length) {
        allCefmuTypes.value = Object.keys(data.byCefmuType || {}).filter(k => k && k !== 'Unknown')
      }
    }
  } catch (e) {
    console.error('Public dashboard load error:', e)
  }
}

// ── Watch filters → re-fetch with params ─────────────────────
watch([filterStatus, filterClass, filterSex, filterCefmuType], async () => {
  await loadData(filterParams(), { skipCache: false,
    revalidate(fresh) {
      stats.value = fresh
      lastUpdatedAt.value = Date.now()
    }
  })
})

// ── Polling — re-fetch every 5 minutes ───────────────────────
function startPolling() {
  pollTimer = setInterval(() => {
    loadData(filterParams(), { skipCache: true,
      revalidate(fresh) {
        stats.value = fresh
        lastUpdatedAt.value = Date.now()
      }
    })
  }, 5 * 60 * 1000)
}

onMounted(async () => {
  window.scrollTo({ top: 0, behavior: 'instant' })
  await loadData({}, {
    revalidate(fresh) {
      stats.value = fresh
      lastUpdatedAt.value = Date.now()
    }
  })
  loading.value = false
  startPolling()
  labelTimer = setInterval(() => { lastUpdatedAt.value = lastUpdatedAt.value }, 15_000)
})

onUnmounted(() => {
  clearInterval(pollTimer)
  clearInterval(labelTimer)
})

// ── Chart helpers ─────────────────────────────────────────────
const PURPLE = ['#8D5FCC', '#9a7de8', '#6b4aab', '#b89ce0', '#5a3a95', '#c4b5e3', '#7c5cbf']
const BLUES = ['#3b82f6', '#60a5fa', '#2563eb', '#93c5fd']

const baseTooltip = {
  backgroundColor: '#1e0b4b',
  titleFont: { family: 'Plus Jakarta Sans', size: 11 },
  bodyFont: { family: 'Plus Jakarta Sans', size: 11 },
  padding: 10, cornerRadius: 8, displayColors: false,
}

function obj2chart(obj, colors) {
  if (!obj) return null
  const entries = Object.entries(obj).filter(([k, v]) => v > 0 && k && k !== 'Unknown')
  if (!entries.length) return null
  return {
    labels: entries.map(([k]) => k),
    datasets: [{ data: entries.map(([, v]) => v), backgroundColor: colors }]
  }
}

const trendData = computed(() => stats.value?.trend?.length ? {
  labels: stats.value.trend.map(t => t.label),
  datasets: [{
    label: 'Intakes',
    data: stats.value.trend.map(t => t.count),
    backgroundColor: '#8D5FCC',
    borderRadius: 6, borderSkipped: false,
  }]
} : null)

const classData = computed(() => stats.value ? obj2chart(stats.value.byClassification, PURPLE) : null)
const sexData   = computed(() => stats.value ? obj2chart(stats.value.bySex, BLUES) : null)
const ageData   = computed(() => stats.value ? obj2chart(stats.value.ageBands, PURPLE) : null)
const cefmuData = computed(() => stats.value ? obj2chart(stats.value.byCefmuType, PURPLE) : null)

const tickFont = { family: 'Plus Jakarta Sans', size: 10 }

const barOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: baseTooltip },
  scales: {
    x: { grid: { display: false }, ticks: { font: tickFont } },
    y: { grid: { color: '#f3f4f6' }, ticks: { font: tickFont, precision: 0 } }
  }
}
const doughnutOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, pointStyleWidth: 8, font: tickFont } },
    tooltip: baseTooltip
  },
  cutout: '62%'
}
const horizOpts = {
  responsive: true, maintainAspectRatio: false, indexAxis: 'y',
  plugins: { legend: { display: false }, tooltip: baseTooltip },
  scales: {
    x: { grid: { color: '#f3f4f6' }, ticks: { font: tickFont, precision: 0 } },
    y: { grid: { display: false }, ticks: { font: tickFont } }
  }
}
</script>
<style scoped>
/* Summary number swap animation */
.num-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.num-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.num-enter-from   { opacity: 0; transform: translateY(6px); }
.num-leave-to     { opacity: 0; transform: translateY(-6px); }

/* Charts fade when data swaps */
.data-panel canvas {
  transition: opacity 0.3s ease;
}
</style>