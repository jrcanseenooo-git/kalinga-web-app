<template>
  <div class="space-y-3">

    <!-- Header + filter + legend -->
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-sm font-bold text-gray-800">Cases by region</h3>

      <div class="flex items-center gap-3">
        <!-- Dropdown filter -->
        <div class="relative">
          <select :value="selectedRegion || ''" @change="selectRegion($event.target.value || null)"
            class="text-xs border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer">
            <option value="">All regions</option>
            <option v-for="(geoName, psgcName) in REGION_MAP" :key="psgcName" :value="psgcName">
              {{ shortName(psgcName) }}
            </option>
          </select>
          <div class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
            <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <!-- Legend -->
        <!-- <div class="flex items-center gap-1.5 text-xs text-gray-400">
          <span>0</span>
          <div class="flex gap-0.5">
            <div v-for="shade in legendShades" :key="shade" class="w-3.5 h-2.5 rounded-sm"
              :style="{ background: shade }"></div>
          </div>
          <span>{{ maxVal }}</span>
        </div> -->
      </div>
    </div>

    <!-- Map + Info panel -->
    <div class="flex gap-3">

      <!-- Map -->
      <div ref="mapContainer" class="relative flex-1" :style="{ height: height + 'px' }">
        <svg ref="svgEl" class="w-full h-full rounded-xl bg-gray-50"></svg>

        <!-- Tooltip -->
        <div v-if="tooltip.visible"
          class="absolute z-10 pointer-events-none bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap"
          :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px', transform: 'translate(-50%, -110%)' }">
          <p class="font-semibold">{{ tooltip.region }}</p>
          <p class="text-gray-300 mt-0.5">{{ tooltip.count }} case{{ tooltip.count !== 1 ? 's' : '' }}</p>
        </div>

        <!-- Zoom controls -->
        <div class="absolute bottom-3 right-3 flex flex-col gap-1">
          <button @click="zoom(1.4)"
            class="w-7 h-7 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center text-sm font-bold shadow-sm">+</button>
          <button @click="zoom(0.7)"
            class="w-7 h-7 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center text-sm font-bold shadow-sm">−</button>
          <button @click="resetZoom" title="Reset"
            class="w-7 h-7 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 flex items-center justify-center shadow-sm">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <!-- Selected region badge -->
        <div v-if="selectedRegion"
          class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-brand-200 rounded-lg px-3 py-1.5 shadow-sm">
          <p class="text-xs font-semibold text-brand-700">{{ shortName(selectedRegion) }}</p>
          <p class="text-xs text-gray-500">
            {{ normalizedData[REGION_MAP[selectedRegion]] || 0 }} cases
          </p>
        </div>
      </div>

      <!-- Info panel when region selected -->
      <div v-if="selectedRegion" class="w-36 flex-shrink-0 space-y-2">
        <div class="bg-brand-50 border border-brand-100 rounded-xl p-3 text-center">
          <p class="text-2xl font-extrabold text-brand-700">
            {{ normalizedData[REGION_MAP[selectedRegion]] || 0 }}
          </p>
          <p class="text-xs text-brand-500 mt-0.5">total cases</p>
        </div>
        <div class="bg-white border border-gray-100 rounded-xl p-3">
          <p class="text-xs font-semibold text-gray-700 mb-1">Region</p>
          <p class="text-xs text-gray-500 leading-snug">{{ selectedRegion }}</p>
        </div>
        <button @click="resetZoom"
          class="w-full text-xs text-gray-500 hover:text-brand-600 py-1.5 border border-gray-200 rounded-lg hover:border-brand-300 transition-colors">
          ← Back to all
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  data: { type: Object, default: () => ({}) },
  height: { type: Number, default: 480 },
})

const svgEl = ref(null)
const mapContainer = ref(null)
const tooltip = ref({ visible: false, x: 0, y: 0, region: '', count: 0 })
const selectedRegion = ref(null)

let geoData = null
let svgSel = null
let gSel = null
let zoomBeh = null
let pathGen = null
// Guards against concurrent drawMap() calls (can happen when props.data
// arrives while the GeoJSON fetch is still in-flight).
let drawing = false
// True once drawMap() has fully completed at least once.
let mapReady = false

const GEOJSON_URL = 'https://raw.githubusercontent.com/macoymejia/geojsonph/master/Regions/Regions.json'

const REGION_MAP = {
  'Region I - Ilocos Region': 'Ilocos Region (Region I)',
  'Region II - Cagayan Valley': 'Cagayan Valley (Region II)',
  'Region III - Central Luzon': 'Central Luzon (Region III)',
  'Region IV-A - CALABARZON': 'CALABARZON (Region IV-A)',
  'Region V - Bicol Region': 'Bicol Region (Region V)',
  'Region VI - Western Visayas': 'Western Visayas (Region VI)',
  'Region VII - Central Visayas': 'Central Visayas (Region VII)',
  'Region VIII - Eastern Visayas': 'Eastern Visayas (Region VIII)',
  'Region IX - Zamboanga Peninsula': 'Zamboanga Peninsula (Region IX)',
  'Region X - Northern Mindanao': 'Northern Mindanao (Region X)',
  'Region XI - Davao Region': 'Davao Region (Region XI)',
  'Region XII - SOCCSKSARGEN': 'SOCCSKSARGEN (Region XII)',
  'NCR - National Capital Region': 'Metropolitan Manila',
  'CAR - Cordillera Administrative Region': 'Cordillera Administrative Region (CAR)',
  'BARMM': 'Autonomous Region of Muslim Mindanao (ARMM)',
  'Region XIII - Caraga': 'Caraga (Region XIII)',
  'MIMAROPA': 'MIMAROPA (Region IV-B)',
}

const normalizedData = computed(() => {
  const result = {}
  Object.entries(props.data || {}).forEach(([key, val]) => {
    const mapped = REGION_MAP[key]
    if (mapped) {
      result[mapped] = (result[mapped] || 0) + Number(val)
    } else {
      const keyLower = key.toLowerCase()
      const geoName = Object.values(REGION_MAP).find(g =>
        g.toLowerCase().includes(keyLower.split('-')[0].trim()) ||
        keyLower.includes(g.toLowerCase().split('(')[0].trim())
      )
      if (geoName) result[geoName] = (result[geoName] || 0) + Number(val)
    }
  })
  return result
})

const hasData = computed(() => Object.values(normalizedData.value).some(v => v > 0))
const maxVal = computed(() => Math.max(1, ...Object.values(normalizedData.value)))
const legendShades = computed(() =>
  [0.1, 0.25, 0.45, 0.65, 0.85, 1].map(t => d3.interpolate('#9b8ec4', '#2d1760')(t))
)

function getColor(region) {
  const count = normalizedData.value[region] || 0
  if (count === 0) return '#e5e3e8'
  return d3.interpolate('#7b6aad', '#2d1760')(count / maxVal.value)
}

function shortName(psgcName) {
  const map = {
    'Region I - Ilocos Region': 'Region I',
    'Region II - Cagayan Valley': 'Region II',
    'Region III - Central Luzon': 'Region III',
    'Region IV-A - CALABARZON': 'Region IV-A',
    'Region V - Bicol Region': 'Region V',
    'Region VI - Western Visayas': 'Region VI',
    'Region VII - Central Visayas': 'Region VII',
    'Region VIII - Eastern Visayas': 'Region VIII',
    'Region IX - Zamboanga Peninsula': 'Region IX',
    'Region X - Northern Mindanao': 'Region X',
    'Region XI - Davao Region': 'Region XI',
    'Region XII - SOCCSKSARGEN': 'Region XII',
    'NCR - National Capital Region': 'NCR',
    'CAR - Cordillera Administrative Region': 'CAR',
    'BARMM': 'BARMM',
    'Region XIII - Caraga': 'Region XIII',
    'MIMAROPA': 'MIMAROPA',
  }
  return map[psgcName] || psgcName
}

function zoomToRegion(psgcName) {
  if (!mapReady || !geoData || !svgSel || !zoomBeh || !pathGen) return
  if (!psgcName) {
    svgSel.transition().duration(600).call(zoomBeh.transform, d3.zoomIdentity)
    return
  }
  const geoName = REGION_MAP[psgcName]
  const feature = geoData.features.find(f => f.properties.REGION === geoName)
  if (!feature) return

  const w = svgEl.value.clientWidth || 400
  const h = props.height
  const [[x0, y0], [x1, y1]] = pathGen.bounds(feature)
  const dx = x1 - x0, dy = y1 - y0
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
  const scale = Math.min(8, 0.8 / Math.max(dx / w, dy / h))
  const tx = w / 2 - scale * cx
  const ty = h / 2 - scale * cy

  svgSel.transition().duration(700).ease(d3.easeCubicInOut).call(
    zoomBeh.transform,
    d3.zoomIdentity.translate(tx, ty).scale(scale)
  )
}

function selectRegion(psgcName) {
  selectedRegion.value = psgcName || null
  // If the map isn't ready yet, zoom will be applied at the end of drawMap()
  if (mapReady) zoomToRegion(psgcName || null)
}

function zoom(factor) {
  if (svgSel && zoomBeh) svgSel.transition().duration(300).call(zoomBeh.scaleBy, factor)
}

function resetZoom() {
  selectedRegion.value = null
  if (svgSel && zoomBeh) svgSel.transition().duration(500).call(zoomBeh.transform, d3.zoomIdentity)
}

async function drawMap() {
  // Prevent concurrent draws — only one drawMap() may run at a time.
  if (drawing || !svgEl.value) return
  drawing = true
  mapReady = false

  svgSel = d3.select(svgEl.value)
  svgSel.selectAll('*').remove()
  gSel = null

  if (!geoData) {
    try {
      const res = await fetch(GEOJSON_URL)
      geoData = await res.json()
    } catch (e) {
      console.error('GeoJSON failed', e)
      drawing = false
      return
    }
  }

  const w = svgEl.value.clientWidth || 400
  const h = props.height

  const padding = 20
  const projection = d3.geoMercator()
    .fitExtent([[padding, padding], [w - padding, h - padding]], geoData)

  pathGen = d3.geoPath().projection(projection)

  zoomBeh = d3.zoom().scaleExtent([0.5, 12]).on('zoom', e => gSel.attr('transform', e.transform))
  svgSel.call(zoomBeh)
  gSel = svgSel.append('g')

  gSel.selectAll('path')
    .data(geoData.features)
    .enter().append('path')
    .attr('d', pathGen)
    .attr('fill', d => getColor(d.properties.REGION))
    .attr('stroke', '#ffffff')
    .attr('stroke-width', 0.8)
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      const geoName = d.properties.REGION
      const psgcName = Object.keys(REGION_MAP).find(k => REGION_MAP[k] === geoName) || null
      selectRegion(psgcName)
    })
    .on('mouseenter', function (event, d) {
      d3.select(this).attr('stroke', '#4a2e85').attr('stroke-width', 2)
      const r = svgEl.value.getBoundingClientRect()
      tooltip.value = {
        visible: true,
        x: event.clientX - r.left,
        y: event.clientY - r.top,
        region: d.properties.REGION,
        count: normalizedData.value[d.properties.REGION] || 0,
      }
    })
    .on('mousemove', function (event) {
      const r = svgEl.value.getBoundingClientRect()
      tooltip.value.x = event.clientX - r.left
      tooltip.value.y = event.clientY - r.top
    })
    .on('mouseleave', function () {
      d3.select(this).attr('stroke', '#ffffff').attr('stroke-width', 0.8)
      tooltip.value.visible = false
    })

  // NCR is geographically tiny (~0.2° wide) — overlay a visible dot + ring so it's always clickable
  const ncrFeature = geoData.features.find(d => d.properties.REGION === 'Metropolitan Manila')
  if (ncrFeature) {
    const [cx, cy] = pathGen.centroid(ncrFeature)
    const ncrColor = getColor('Metropolitan Manila')
  }

  // Map fully ready. If a region was selected before the map loaded, zoom to it now.
  drawing = false
  mapReady = true
  if (selectedRegion.value) {
    await nextTick()
    zoomToRegion(selectedRegion.value)
  }
}

// Only recolor paths when data updates — never re-draw the whole map.
// drawMap() is only ever called once (on mount). This prevents the
// doubled-map bug caused by concurrent async draw invocations.
function recolorPaths() {
  if (gSel) {
    gSel.selectAll('path').attr('fill', d => getColor(d.properties.REGION))
  }
}

onMounted(drawMap)
watch(() => props.data, recolorPaths, { deep: true })
</script>