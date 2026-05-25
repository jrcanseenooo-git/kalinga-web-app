<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue"
        class="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 animate-fade-in"
        @click.self="$emit('cancel')">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up">

          <!-- Icon + title -->
          <div class="flex items-start gap-4 mb-4">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              :class="iconBg">
              <component :is="iconComponent" class="w-5 h-5" :class="iconColor" />
            </div>
            <div>
              <h3 class="font-bold text-gray-900 text-base">{{ title }}</h3>
              <p class="text-sm text-gray-500 mt-1 leading-relaxed">{{ message }}</p>
            </div>
          </div>

          <!-- Extra warning for destructive -->
          <div v-if="variant === 'danger'"
            class="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mb-4 flex items-start gap-2">
            <ExclamationTriangleIcon class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-red-700">{{ warningText || 'This action cannot be undone.' }}</p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button @click="$emit('confirm')" :disabled="loading"
              class="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              :class="confirmClass">
              <span v-if="loading" class="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"></span>
              {{ loading ? 'Please wait…' : confirmLabel }}
            </button>
            <button @click="$emit('cancel')" :disabled="loading"
              class="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
              {{ cancelLabel || 'Cancel' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  TrashIcon,
  ArrowPathIcon,
  LockClosedIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps({
  modelValue:   { type: Boolean, default: false },
  title:        { type: String,  default: 'Are you sure?' },
  message:      { type: String,  default: 'Please confirm this action.' },
  variant:      { type: String,  default: 'default' }, // default | danger | warning | success
  confirmLabel: { type: String,  default: 'Confirm' },
  cancelLabel:  { type: String,  default: 'Cancel' },
  warningText:  { type: String,  default: '' },
  loading:      { type: Boolean, default: false },
  icon:         { type: String,  default: '' }, // override icon
})

defineEmits(['confirm', 'cancel', 'update:modelValue'])

const iconComponent = computed(() => {
  if (props.icon === 'trash')   return TrashIcon
  if (props.icon === 'lock')    return LockClosedIcon
  if (props.icon === 'reopen')  return ArrowPathIcon
  if (props.variant === 'danger')   return ExclamationTriangleIcon
  if (props.variant === 'warning')  return ExclamationTriangleIcon
  if (props.variant === 'success')  return CheckCircleIcon
  return InformationCircleIcon
})

const iconBg = computed(() => ({
  danger:  'bg-red-50',
  warning: 'bg-amber-50',
  success: 'bg-green-50',
  default: 'bg-brand-50',
}[props.variant] || 'bg-brand-50'))

const iconColor = computed(() => ({
  danger:  'text-red-500',
  warning: 'text-amber-500',
  success: 'text-green-500',
  default: 'text-brand-600',
}[props.variant] || 'text-brand-600'))

const confirmClass = computed(() => ({
  danger:  'bg-red-500 hover:bg-red-600 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  success: 'bg-green-500 hover:bg-green-600 text-white',
  default: 'bg-brand-600 hover:bg-brand-700 text-white',
}[props.variant] || 'bg-brand-600 hover:bg-brand-700 text-white'))
</script>
