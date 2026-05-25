<template>
  <div class="min-h-screen bg-brand-900 flex items-center justify-center p-4" v-if="isLogin">
    <slot />
  </div>
  <div v-else class="min-h-screen overflow-y-auto">
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isLogin = computed(() => route.path === '/login')
</script>