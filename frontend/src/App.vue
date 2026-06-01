<template>
  <component :is="layout">
    <RouterView />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout  from '@/components/layout/AppLayout.vue'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import { useSync } from '@/composables/useSync'

const route  = useRoute()
const layout = computed(() => route.meta.public ? AuthLayout : AppLayout)

useSync()
</script>