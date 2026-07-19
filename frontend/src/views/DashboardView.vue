<template>
  <div class="space-y-5 animate-fade-in">

    <!-- Welcome header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-extrabold text-gray-900">Good {{ timeOfDay }}, {{ firstName }}!</h2>
        <p class="text-sm text-gray-500 mt-0.5">Here's what's happening with the CEFMU Registry.</p>
      </div>
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:block">{{ todayStr }}</p>
    </div>

    <!-- Role modules -->
    <div class="grid gap-3 lg:grid-cols-[1.2fr_2fr]">
      <div class="card p-4">
        <p class="text-xs font-bold uppercase tracking-wider text-gray-400">Current operational view</p>
        <h3 class="text-base font-extrabold text-gray-900 mt-1">{{ roleSummary.title }}</h3>
        <p class="text-xs text-gray-500 mt-1 leading-relaxed">{{ roleSummary.description }}</p>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div v-for="module in roleModules" :key="module.label" class="card p-4">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" :class="module.color">
              <component :is="module.icon" class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold text-gray-900 leading-snug">{{ module.label }}</p>
              <p class="text-xs text-gray-500 mt-1 leading-relaxed">{{ module.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
      <StatCard label="Total Cases"  :value="stats?.summary.total"  color="brand"  :icon="FolderOpenIcon"  :loading="!stats" />
      <StatCard label="Active Cases" :value="stats?.summary.active" color="blue"   :icon="ClockIcon"       :loading="!stats" />
      <StatCard label="Closed Cases" :value="stats?.summary.closed" color="green"  :icon="CheckCircleIcon" :loading="!stats" />
      <StatCard label="This Month"   :value="thisMonthCount"        color="purple" :icon="CalendarIcon"    :loading="!stats" sub="new intakes" />
    </div>

    <div class="card p-4 flex flex-wrap items-center gap-3">
      <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mr-1">Area filter</p>
      <select v-model="area.region" @change="onAreaChange('region')" class="input-base text-xs w-56">
        <option value="">All accessible regions</option>
        <option v-for="region in regionOptions" :key="region" :value="region">{{ region }}</option>
      </select>
      <select v-model="area.province" @change="onAreaChange('province')" class="input-base text-xs w-48" :disabled="!area.region">
        <option value="">All provinces</option>
        <option v-for="province in provinceOptions" :key="province" :value="province">{{ province }}</option>
      </select>
      <select v-model="area.city_muni" @change="onAreaChange('city_muni')" class="input-base text-xs w-48" :disabled="!area.province">
        <option value="">All municipalities / cities</option>
        <option v-for="city in cityOptions" :key="city" :value="city">{{ city }}</option>
      </select>
      <button v-if="area.region || area.province || area.city_muni" @click="clearArea" class="btn-secondary text-xs py-2">
        Clear area
      </button>
    </div>

    <!-- Main grid: portrait map LEFT (40%) + charts RIGHT (60%) -->
    <div class="grid gap-5" style="grid-template-columns: 42% 1fr;">

      <!-- LEFT: Philippine heatmap portrait card -->
      <div class="card p-5" style="height: fit-content; position: sticky; top: 20px;">
        <PhilippineHeatmap :data="stats?.byRegion || {}" :height="740" @select-region="onMapRegionSelect" />
      </div>

      <!-- RIGHT: stacked charts -->
      <div class="space-y-4 min-w-0">

        <!-- Trend -->
        <div class="card p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-gray-800">Monthly intake</h3>
            <span class="badge bg-brand-50 text-brand-700 text-xs">Last 6 months</span>
          </div>
          <div v-if="!trendChartData" class="h-44 bg-gray-50 rounded-xl animate-pulse-soft"></div>
          <div v-else class="h-44">
            <Bar :data="trendChartData" :options="barOptions" class="w-full h-full" />
          </div>
        </div>

        <!-- Classification + Sex -->
        <div class="grid grid-cols-2 gap-4">
          <div class="card p-5">
            <h3 class="text-sm font-bold text-gray-800 mb-3">By CEFMU classification</h3>
            <div v-if="!classChartData" class="h-40 bg-gray-50 rounded-xl animate-pulse-soft"></div>
            <div v-else class="h-40">
              <Doughnut :data="classChartData" :options="doughnutOptions" class="w-full h-full" />
            </div>
          </div>
          <div class="card p-5">
            <h3 class="text-sm font-bold text-gray-800 mb-3">Cases by sex</h3>
            <div v-if="!sexChartData" class="h-40 bg-gray-50 rounded-xl animate-pulse-soft"></div>
            <div v-else class="h-40">
              <Doughnut :data="sexChartData" :options="doughnutOptions" class="w-full h-full" />
            </div>
          </div>
        </div>

        <!-- Age + CEFMU type -->
        <div class="grid grid-cols-2 gap-4">
          <div class="card p-5">
            <h3 class="text-sm font-bold text-gray-800 mb-3">Cases by age group</h3>
            <div v-if="!ageChartData" class="h-40 bg-gray-50 rounded-xl animate-pulse-soft"></div>
            <div v-else class="h-40">
              <Bar :data="ageChartData" :options="barOptions" class="w-full h-full" />
            </div>
          </div>
          <div class="card p-5">
            <h3 class="text-sm font-bold text-gray-800 mb-3">Cases by CEFMU type</h3>
            <div v-if="!cefmuChartData" class="h-40 bg-gray-50 rounded-xl animate-pulse-soft"></div>
            <div v-else class="h-40">
              <Bar :data="cefmuChartData" :options="horizOptions" class="w-full h-full" />
            </div>
          </div>
        </div>

        <!-- Services -->
        <div class="card p-5">
          <h3 class="text-sm font-bold text-gray-800 mb-3">Services provided</h3>
          <div v-if="!serviceChartData" class="h-40 bg-gray-50 rounded-xl animate-pulse-soft"></div>
          <div v-else class="h-40">
            <Bar :data="serviceChartData" :options="horizOptions" class="w-full h-full" />
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend
} from 'chart.js'
import { useAuthStore }  from '@/stores/auth'
import { api }           from '@/services/api'
import { regions as psgcRegions, provinces as psgcProvinces } from '@/data/psgc'
import StatCard          from '@/components/ui/StatCard.vue'
import PhilippineHeatmap from '@/components/ui/PhilippineHeatmap.vue'
import {
  FolderOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  CalendarIcon,
  PlusCircleIcon,
  ArrowPathRoundedSquareIcon,
  ClipboardDocumentListIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const auth  = useAuthStore()
const stats       = ref(null)
const refreshing  = ref(false)
const area = ref({ region: '', province: '', city_muni: '' })

async function loadDashboard() {
  const params = Object.fromEntries(Object.entries(area.value).filter(([, value]) => value))
  stats.value = await api('getDashboard', params, {
    revalidate(fresh) { stats.value = fresh }
  })
}

function onMapRegionSelect(region) {
  area.value.region = region || ''
  area.value.province = ''
  area.value.city_muni = ''
  loadDashboard()
}

function onAreaChange(level) {
  if (level === 'region') {
    area.value.province = ''
    area.value.city_muni = ''
  }
  if (level === 'province') area.value.city_muni = ''
  loadDashboard()
}

function clearArea() {
  area.value = { region: '', province: '', city_muni: '' }
  loadDashboard()
}

let pollTimer = null

onMounted(async () => {
  await loadDashboard()
  // Re-fetch every 2 min in background so data stays current
  pollTimer = setInterval(() => {
    const params = Object.fromEntries(Object.entries(area.value).filter(([, value]) => value))
    api('getDashboard', params, { skipCache: true, revalidate(fresh) { stats.value = fresh } })
      .then(fresh => { stats.value = fresh })
      .catch(() => {})
  }, 2 * 60 * 1000)
})

onUnmounted(() => clearInterval(pollTimer))

const timeOfDay = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
})
const firstName = computed(() => auth.user?.name?.split(' ')[0] || 'there')
const todayStr  = computed(() =>
  new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })
)

const accessibleRegions = computed(() => Object.keys(stats.value?.filters?.regions || {}).filter(Boolean))
const regionOptions = computed(() => accessibleRegions.value.length ? accessibleRegions.value : psgcRegions.map(r => r.name))
const provinceOptions = computed(() => {
  const fromStats = Object.keys(stats.value?.filters?.provinces || {}).filter(Boolean)
  if (fromStats.length) return fromStats
  const regionCode = psgcRegions.find(r => r.name === area.value.region)?.code
  return regionCode ? (psgcProvinces[regionCode] || []) : []
})
const cityOptions = computed(() => Object.keys(stats.value?.filters?.cities || {}).filter(Boolean))

const roleSummary = computed(() => {
  const map = {
    admin: {
      title: 'System Administrator',
      description: 'Administrative oversight only. Intake and case registration are assigned to authorized Case Worker or Social Worker roles.',
    },
    case_worker: {
      title: 'Case Worker / Social Worker',
      description: 'Operational case management from intake and assessment through referrals, services, monitoring, and closure.',
    },
    fo_user: {
      title: 'Field Office Implementer',
      description: 'Regional referral tracking, service documentation, and monitoring support for assigned cases.',
    },
    lgu_supervisor: {
      title: 'LGU / Implementer View',
      description: 'Local monitoring of active CEFMU cases, referrals, service delivery, and follow-up status.',
    },
    cpu_monitor: {
      title: 'CPU Monitoring View',
      description: 'Read-only monitoring for assigned child protection unit coverage.',
    },
  }
  return map[auth.role] || { title: 'Case Management View', description: 'Role-based access is applied to operational modules.' }
})

const roleModules = computed(() => {
  if (auth.isAdmin) {
    return [
      { label: 'User roles', description: 'Assign Case Worker, LGU, FO, and monitor access.', icon: ShieldCheckIcon, color: 'bg-purple-50 text-purple-600' },
      { label: 'Case monitoring', description: 'View CEFMU caseload without intake controls.', icon: FolderOpenIcon, color: 'bg-blue-50 text-blue-600' },
      { label: 'Audit logs', description: 'Review access, changes, and export activity.', icon: ClipboardDocumentListIcon, color: 'bg-amber-50 text-amber-600' },
      { label: 'Reports', description: 'Prepare non-identifying summaries for coordination.', icon: CheckCircleIcon, color: 'bg-emerald-50 text-emerald-600' },
    ]
  }
  return [
    { label: 'Intake to closure', description: auth.canRegisterCase ? 'Register new CEFMU cases and manage the full case plan.' : 'Update assigned cases through service and follow-up actions.', icon: PlusCircleIcon, color: 'bg-blue-50 text-blue-600' },
    { label: 'Referral tracking', description: 'Record MDT referrals, receiving office, action taken, and next steps.', icon: ArrowPathRoundedSquareIcon, color: 'bg-amber-50 text-amber-600' },
    { label: 'Services provided', description: 'Log medical, legal, psychosocial, financial, and education support.', icon: ClipboardDocumentListIcon, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'GIDA monitoring', description: 'Use offline sync, LGU location history, and map verification for remote areas.', icon: MapPinIcon, color: 'bg-rose-50 text-rose-600' },
  ]
})

const PURPLE = ['#6b4aab','#9a7de8','#4a2e85','#b89ce0','#3d2470','#c4b5e3','#7c5cbf']
const BLUES  = ['#3b82f6','#60a5fa','#2563eb','#93c5fd']

const baseTooltip = {
  backgroundColor: '#1e0b4b',
  titleFont: { family: 'Plus Jakarta Sans', size: 11 },
  bodyFont:  { family: 'Plus Jakarta Sans', size: 11 },
  padding: 10, cornerRadius: 8,
}

function obj2chart(obj, colors) {
  if (!obj) return null
  const entries = Object.entries(obj).filter(([k, v]) => v > 0 && k && k !== 'Unknown')
  if (!entries.length) return null
  return {
    labels:   entries.map(([k]) => k),
    datasets: [{ data: entries.map(([, v]) => v), backgroundColor: colors }]
  }
}

const thisMonthCount = computed(() => {
  if (!stats.value?.trend?.length) return 0
  return stats.value.trend[stats.value.trend.length - 1]?.count || 0
})

const trendChartData = computed(() => stats.value ? {
  labels: stats.value.trend.map(t => t.label),
  datasets: [{ label: 'Intakes', data: stats.value.trend.map(t => t.count), backgroundColor: '#6b4aab', borderRadius: 6, borderSkipped: false }]
} : null)

const classChartData   = computed(() => stats.value ? obj2chart(stats.value.byClassification, PURPLE) : null)
const sexChartData     = computed(() => stats.value ? obj2chart(stats.value.bySex, BLUES) : null)
const ageChartData     = computed(() => stats.value ? obj2chart(stats.value.ageBands, PURPLE) : null)
const cefmuChartData   = computed(() => stats.value ? obj2chart(stats.value.byCefmuType, PURPLE) : null)
const serviceChartData = computed(() => stats.value ? obj2chart(stats.value.byService, PURPLE) : null)

const tickFont = { family: 'Plus Jakarta Sans', size: 11 }

const barOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: baseTooltip },
  scales: {
    x: { grid: { display: false }, ticks: { font: tickFont } },
    y: { grid: { color: '#f3f4f6' }, ticks: { font: tickFont, precision: 0 } },
  }
}
const doughnutOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { font: tickFont, padding: 10, usePointStyle: true, pointStyleWidth: 8 } },
    tooltip: baseTooltip
  },
  cutout: '62%',
}
const horizOptions = {
  responsive: true, maintainAspectRatio: false, indexAxis: 'y',
  plugins: { legend: { display: false }, tooltip: baseTooltip },
  scales: {
    x: { grid: { color: '#f3f4f6' }, ticks: { font: tickFont, precision: 0 } },
    y: { grid: { display: false }, ticks: { font: tickFont } },
  }
}
</script>
