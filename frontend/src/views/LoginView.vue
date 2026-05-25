<template>
  <div class="flex bg-white" style="height:100vh;overflow:hidden;width:100vw;">

    <!-- Left panel — form -->
    <div class="flex-shrink-0 flex flex-col justify-center px-12 overflow-y-auto bg-white"
      style="height:100vh;width:480px;min-width:480px;">

      <!-- Logo -->
      <div class="mb-10">
        <div class="flex items-center gap-3 mb-1">
          <img src="/logo-purple.png" alt="Kalinga" class="h-12 w-auto" />
        </div>
      </div>

      <!-- Heading -->
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-gray-900 leading-tight mb-2">Login account</h1>
        <p class="text-sm text-gray-400">Welcome back, sign in to continue.</p>
      </div>

      <!-- Google button -->
      <div class="mb-3">
        <div
          class="flex items-center justify-center gap-3 w-full border border-gray-200 rounded-xl py-3 px-4 hover:bg-gray-50 transition-colors cursor-pointer"
          @click="triggerGoogle">
          <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span class="text-sm font-medium text-gray-700">Continue with Google</span>
        </div>
        <!-- Hidden GoogleLogin component -->
        <div class="hidden">
          <GoogleLogin ref="googleLoginRef" :callback="handleCredential" :auto-login="false" />
        </div>
      </div>

      <!-- Divider -->
      <div class="flex items-center gap-3 my-5">
        <div class="flex-1 h-px bg-gray-100"></div>
        <span class="text-xs text-gray-400 font-medium uppercase tracking-wider">or</span>
        <div class="flex-1 h-px bg-gray-100"></div>
      </div>

      <!-- Email/password form -->
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
          <input v-model="form.email" type="email" placeholder="Enter your email address"
            class="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder:text-gray-300"
            @keyup.enter="handleEmailLogin" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
          <div class="relative">
            <input v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="Input your password"
              class="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 pr-11 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder:text-gray-300"
              @keyup.enter="handleEmailLogin" />
            <button type="button" @click="showPassword = !showPassword"
              class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
              <EyeIcon v-if="!showPassword" class="w-4 h-4" />
              <EyeSlashIcon v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="flex items-start gap-2 bg-red-50 border border-red-100 px-3.5 py-3 rounded-xl">
          <ExclamationCircleIcon class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-red-700">{{ error }}</p>
        </div>

        <button @click="handleEmailLogin" :disabled="logging"
          class="w-full bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          <span v-if="logging" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {{ logging ? 'Signing in…' : 'Login Account' }}
        </button>
      </div>

      <!-- Footer note -->
      <p class="text-xs text-gray-300 text-center mt-8">
        Access is restricted to authorized personnel only.
      </p>
    </div>

    <!-- Right panel — visual -->
    <div class="flex flex-1 relative overflow-hidden" style="height:100vh;">
      <!-- Gradient background matching brand -->
      <div class="absolute inset-0 sidebar-bg"></div>

      <!-- Decorative blobs -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-32 -right-32 w-96 h-96 bg-brand-500 rounded-full opacity-30 blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-80 h-80 bg-brand-800 rounded-full opacity-40 blur-3xl"></div>
        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-400 rounded-full opacity-15 blur-2xl">
        </div>
        <!-- Grid -->
        <div class="absolute inset-0 opacity-5"
          style="background-image: linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px); background-size: 48px 48px;">
        </div>
      </div>

      <!-- Content -->
      <div class="absolute inset-0 flex flex-col justify-end p-12">
        <div class="space-y-4">
          <div class="mb-4">
            <img src="/logo-white.png" alt="Kalinga" class="h-14 w-auto mb-4" />
          </div>
          <h2 class="text-4xl font-extrabold text-white leading-tight max-w-sm">
            Protecting children,<br />
            <span class="text-[#83CBDD]">one case at a time.</span>
          </h2>
          <p class="text-brand-200 text-sm leading-relaxed max-w-xs">
            Track and manage CEFMU cases across the Kalinga program area with real-time insights.
          </p>

          <!-- Create account link -->
          <div class="pt-2">
            <a href="/public" target="_blank"
              class="inline-flex items-center gap-2 bg-black/20 backdrop-blur-sm border border-white/20 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-black/30 transition-colors">
              View Public Dashboard
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Force change password modal -->
  <Teleport to="body">
    <div v-if="showChangePassword" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <KeyIcon class="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 class="font-bold text-gray-900 text-sm">Set your new password</h3>
            <p class="text-xs text-gray-500">Required before you can continue.</p>
          </div>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">New password</label>
            <input v-model="newPassword" type="password"
              class="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Min. 8 chars, 1 uppercase, 1 number" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">Confirm password</label>
            <input v-model="confirmPassword" type="password"
              class="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div v-if="changeError" class="flex items-start gap-2 bg-red-50 px-3 py-2.5 rounded-xl">
          <ExclamationCircleIcon class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-red-700">{{ changeError }}</p>
        </div>

        <button @click="submitPasswordChange" :disabled="changingPassword"
          class="w-full bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          <span v-if="changingPassword"
            class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {{ changingPassword ? 'Saving…' : 'Set password & continue' }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { GoogleLogin } from 'vue3-google-login'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import {
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
  KeyIcon,
} from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = ref({ email: '', password: '' })
const showPassword = ref(false)
const logging = ref(false)
const error = ref(null)

const showChangePassword = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const changeError = ref(null)
const changingPassword = ref(false)
const pendingUser = ref(null)
const pendingToken = ref(null)

// Trigger the hidden GoogleLogin button programmatically
function triggerGoogle() {
  const btn = document.querySelector('.hidden .g_id_signin button, .hidden [role="button"]')
  if (btn) btn.click()
}

async function handleCredential({ credential }) {
  try {
    error.value = null
    await auth.loginWithGoogle(credential)
    router.push(route.query.redirect || '/dashboard')
  } catch (e) {
    error.value = e.message || 'Login failed. Please try again.'
  }
}

async function handleEmailLogin() {
  if (!form.value.email || !form.value.password) {
    error.value = 'Please enter your email and password.'
    return
  }
  logging.value = true
  error.value = null
  try {
    const res = await api('loginWithPassword', {
      email: form.value.email,
      password: form.value.password,
    })
    if (res.must_change_password) {
      pendingUser.value = res.user
      pendingToken.value = res.session_token
      showChangePassword.value = true
    } else {
      auth.loginWithSession(res.session_token, res.user)
      router.push(route.query.redirect || '/dashboard')
    }
  } catch (e) {
    error.value = e.message || 'Login failed.'
  } finally {
    logging.value = false
  }
}

async function submitPasswordChange() {
  changeError.value = null
  if (newPassword.value.length < 8) { changeError.value = 'Password must be at least 8 characters.'; return }
  if (!/[A-Z]/.test(newPassword.value)) { changeError.value = 'Must contain at least one uppercase letter.'; return }
  if (!/[0-9]/.test(newPassword.value)) { changeError.value = 'Must contain at least one number.'; return }
  if (newPassword.value !== confirmPassword.value) { changeError.value = 'Passwords do not match.'; return }
  changingPassword.value = true
  try {
    auth.loginWithSession(pendingToken.value, pendingUser.value)
    await api('changePassword', { new_password: newPassword.value })
    router.push(route.query.redirect || '/dashboard')
  } catch (e) {
    changeError.value = e.message
  } finally {
    changingPassword.value = false
  }
}
</script>