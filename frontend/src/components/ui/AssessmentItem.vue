<template>
  <div class="bg-gray-50 rounded-xl p-4">
    <dt class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{{ label }}</dt>
    <dd class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{{ value || '—' }}</dd>
  </div>
</template>
<script setup>
defineProps({ label: String, value: String })
</script>
