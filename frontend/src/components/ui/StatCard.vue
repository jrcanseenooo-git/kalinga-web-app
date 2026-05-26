<template>
  <div class="card p-5 relative overflow-hidden group hover:shadow-card-hover transition-all duration-300">
    <!-- Background accent -->
    <div class="absolute -right-6 -top-6 w-16 h-16 rounded-full opacity-10 transition-transform group-hover:scale-110"
      :class="bgAccent"></div>

    <div class="flex items-start justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">{{ label }}</p>
        <p class="stat-number" :class="textColor">
          <span v-if="loading" class="inline-block w-16 h-9 bg-gray-100 rounded-lg animate-pulse-soft"></span>
          <span v-else>{{ value ?? '-' }}</span>
        </p>
        <p v-if="sub" class="text-xs text-gray-400 mt-1">{{ sub }}</p>
      </div>
      <div v-if="icon" class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        :class="iconBg">
        <component :is="icon" class="w-5 h-5" :class="iconColor" />
      </div>
    </div>

    <!-- Trend indicator -->
    <div v-if="trend !== undefined" class="mt-3 flex items-center gap-1.5">
      <span class="text-xs font-medium" :class="trend >= 0 ? 'text-emerald-600' : 'text-red-500'">
        {{ trend >= 0 ? '↑' : '↓' }} {{ Math.abs(trend) }}%
      </span>
      <span class="text-xs text-gray-400">vs last month</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: String,
  value: [Number, String],
  sub: String,
  color: { default: 'brand' },
  icon: Object,
  trend: Number,
  loading: Boolean,
})

const colorMap = {
  brand:   { text: 'text-brand-600', bg: 'bg-brand-50', iconBg: 'bg-brand-100', iconColor: 'text-brand-600', accent: 'bg-brand-400' },
  blue:    { text: 'text-blue-600',  bg: 'bg-blue-50',  iconBg: 'bg-blue-100',  iconColor: 'text-blue-600',  accent: 'bg-blue-400' },
  green:   { text: 'text-emerald-600', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', accent: 'bg-emerald-400' },
  purple:  { text: 'text-purple-600', bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', accent: 'bg-purple-400' },
  amber:   { text: 'text-amber-600',  bg: 'bg-amber-50',  iconBg: 'bg-amber-100',  iconColor: 'text-amber-600',  accent: 'bg-amber-400' },
}

const c = computed(() => colorMap[props.color] || colorMap.brand)
const textColor = computed(() => c.value.text)
const iconBg    = computed(() => c.value.iconBg)
const iconColor = computed(() => c.value.iconColor)
const bgAccent  = computed(() => c.value.accent)
</script>
