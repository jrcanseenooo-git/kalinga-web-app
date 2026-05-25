<template>
  <div>
    <label class="block text-xs font-semibold text-gray-600 mb-1.5">
      {{ label }} <span v-if="required" class="text-red-400">*</span>
    </label>
    <input
      :type="type"
      :value="modelValue"
      :required="required"
      :placeholder="placeholder"
      :readonly="readonly"
      class="input-base"
      :class="readonly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <p v-if="hint" class="text-xs text-gray-400 mt-1">{{ hint }}</p>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  modelValue: [String, Number],
  type: { default: 'text' },
  required: Boolean,
  placeholder: String,
  readonly: Boolean,
  hint: String,
})
defineEmits(['update:modelValue'])
</script>
