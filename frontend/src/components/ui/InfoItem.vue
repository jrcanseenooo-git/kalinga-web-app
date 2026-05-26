<template>
  <div>
    <dt class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{{ label }}</dt>
    <dd class="text-sm text-gray-800 font-medium">{{ value || '-' }}</dd>
  </div>
</template>
<script setup>
defineProps({ label: String, value: [String, Number] })
</script>
