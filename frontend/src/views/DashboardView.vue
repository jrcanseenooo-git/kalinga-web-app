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

    <!-- Summary cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
      <StatCard label="Total Cases"  :value="stats?.summary.total"  color="brand"  :icon="FolderOpenIcon"  :loading="!stats" />
      <StatCard label="Active Cases" :value="stats?.summary.active" color="blue"   :icon="ClockIcon"       :loading="!stats" />
      <StatCard label="Closed Cases" :value="stats?.summary.closed" color="green"  :icon="CheckCircleIcon" :loading="!stats" />
      <StatCard label="This Month"   :value="thisMonthCount"        color="purple" :icon="CalendarIcon"    :loading="!stats" sub="new intakes" />
    </div>

    <!-- Main grid: portrait map LEFT (40%) + charts RIGHT (60%) -->
    <div class="grid gap-5" style="grid-template-columns: 42% 1fr;">

      <!-- LEFT: Philippine heatmap portrait card -->
      <div class="card p-5" style="height: fit-content; position: sticky; top: 20px;">
        <PhilippineHeatmap :data="stats?.byRegion || {}" :height="740" />
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
            <h3 class="text-sm font-bold text-gray-800 mb-3">By classification</h3>
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
import StatCard          from '@/components/ui/StatCard.vue'
import PhilippineHeatmap from '@/components/ui/PhilippineHeatmap.vue'
import { FolderOpenIcon, ClockIcon, CheckCircleIcon, CalendarIcon } from '@heroicons/vue/24/outline'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const auth  = useAuthStore()
const stats       = ref(null)
const refreshing  = ref(false)

async function loadDashboard() {
  stats.value = await api('getDashboard', {}, {
    revalidate(fresh) { stats.value = fresh }
  })
}

let pollTimer = null

onMounted(async () => {
  await loadDashboard()
  // Re-fetch every 2 min in background so data stays current
  pollTimer = setInterval(() => {
    api('getDashboard', {}, { skipCache: true, revalidate(fresh) { stats.value = fresh } })
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