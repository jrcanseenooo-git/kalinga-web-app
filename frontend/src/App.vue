<template>
  <component :is="layout">
    <RouterView />
  </component>

  <!-- PWA update notification -->
  <Transition name="slide-down">
    <div v-if="needRefresh"
      class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-brand-800 text-white
             rounded-xl shadow-2xl px-5 py-3.5 flex items-center gap-4 text-sm">
      <span>🔄 A new version is available.</span>
      <button @click="updateApp"
        class="bg-white text-brand-800 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-brand-50 transition-colors">
        Update now
      </button>
      <button @click="needRefresh.value = false"
        class="text-brand-300 hover:text-white text-xs">
        Later
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout  from '@/components/layout/AppLayout.vue'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import { useSync } from '@/composables/useSync'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const route  = useRoute()
const layout = computed(() => route.meta.public ? AuthLayout : AppLayout)

useSync()

// ── PWA auto-update ───────────────────────────────────────────
const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegistered(r) {
    r && setInterval(() => r.update(), 60 * 1000)  // check for updates every 60s
  }
})

function updateApp() {
  updateServiceWorker(true)
}
</script>

<style>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(100%);
}
</style>