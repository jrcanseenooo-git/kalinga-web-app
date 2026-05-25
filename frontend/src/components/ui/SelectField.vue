<template>
  <div>
    <label class="block text-xs font-semibold text-gray-600 mb-1.5">
      {{ label }} <span v-if="required" class="text-red-400">*</span>
    </label>
    <select
      :value="modelValue"
      :required="required"
      :disabled="disabled"
      class="input-base"
      :class="disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option value="">{{ placeholder || '— Select —' }}</option>
      <option v-for="opt in options" :key="optValue(opt)" :value="optValue(opt)">
        {{ optLabel(opt) }}
      </option>
    </select>
  </div>
</template>

<script setup>
const props = defineProps({
  label: String, modelValue: [String, Number],
  options: { type: Array, default: () => [] },
  required: Boolean, disabled: Boolean, placeholder: String,
  optionKey: { type: String, default: null },
  optionLabel: { type: String, default: null },
})
defineEmits(['update:modelValue'])

function optValue(opt) {
  if (typeof opt === 'string') return opt
  return props.optionKey ? opt[props.optionKey] : opt.value || opt.code || opt
}
function optLabel(opt) {
  if (typeof opt === 'string') return opt
  return props.optionLabel ? opt[props.optionLabel] : opt.label || opt.name || opt
}
</script>
