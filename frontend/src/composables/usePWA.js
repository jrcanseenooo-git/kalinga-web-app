import { ref } from 'vue'

const deferredPrompt = ref(null)
const canInstall = ref(false)
const isInstalled = ref(false)

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt.value = e
  canInstall.value = true
})

window.addEventListener('appinstalled', () => {
  isInstalled.value = true
  canInstall.value = false
  deferredPrompt.value = null
})

// Check if already running as installed PWA
if (window.matchMedia('(display-mode: standalone)').matches) {
  isInstalled.value = true
}

export function usePWA() {
  async function installApp() {
    if (!deferredPrompt.value) return
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    if (outcome === 'accepted') {
      canInstall.value = false
      deferredPrompt.value = null
    }
  }

  return { canInstall, isInstalled, installApp }
}