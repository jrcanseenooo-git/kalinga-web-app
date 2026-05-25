<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden">

    <!-- Sidebar -->
    <aside class="w-64 flex-shrink-0 sidebar-bg text-white flex flex-col shadow-sidebar relative z-10"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
      style="transition: transform 0.3s ease;">
      <!-- Logo area -->
      <div class="px-5 pt-6 pb-5">
        <div class="flex items-center gap-3 mb-1">
          <img src="/logo-white.png" alt="Kalinga" class="h-10 w-auto" />
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300 leading-none">KALINGA</p>
            <h1 class="text-xs font-bold text-white leading-snug mt-0.5">CEFMU Registry</h1>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="mx-4 h-px bg-white/10 mb-3"></div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p class="text-[10px] font-bold uppercase tracking-widest text-brand-400 px-3 py-2">Navigation</p>

        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-item" :class="isActive(item.to)
          ? 'bg-white/15 text-white shadow-sm'
          : 'text-brand-200 hover:bg-white/8 hover:text-white'">
          <span class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
            :class="isActive(item.to) ? 'bg-white/20' : 'bg-transparent'">
            <component :is="item.icon" class="w-4 h-4" />
          </span>
          <span class="flex-1">{{ item.label }}</span>
          <span v-if="item.badge" class="text-[10px] bg-brand-500 text-white px-1.5 py-0.5 rounded-md font-bold">
            {{ item.badge }}
          </span>
        </RouterLink>

        <!-- Divider -->
        <div class="h-px bg-white/10 my-3 mx-1"></div>

        <!-- Public dashboard -->
        <a href="/public" target="_blank" class="nav-item text-brand-200 hover:bg-white/8 hover:text-white">
          <span class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0">
            <GlobeAltIcon class="w-4 h-4" />
          </span>
          <span class="flex-1">Public Dashboard</span>
          <ArrowTopRightOnSquareIcon class="w-3.5 h-3.5 opacity-50" />
        </a>
      </nav>

      <!-- User section -->
      <div class="mx-3 mb-3">
        <div class="bg-white/8 rounded-xl p-3 flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {{ auth.user?.name?.charAt(0)?.toUpperCase() || '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold truncate text-white">{{ auth.user?.name }}</p>
            <p class="text-[10px] text-brand-300 capitalize">{{ auth.user?.role?.replace('_', ' ') }}</p>
          </div>
          <button @click="confirmLogout"
            class="text-brand-300 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10" title="Sign out">
            <ArrowRightOnRectangleIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main area -->
    <div class="flex-1 flex flex-col overflow-hidden">

      <!-- Top bar -->
      <header class="h-14 bg-white border-b border-gray-100 flex items-center px-6 flex-shrink-0 gap-4">
        <!-- Mobile menu button -->
        <button @click="sidebarOpen = !sidebarOpen" class="md:hidden text-gray-400 hover:text-gray-600">
          <Bars3Icon class="w-5 h-5" />
        </button>

        <!-- Breadcrumb / Page title -->
        <div class="flex items-center gap-2 min-w-0">
          <h2 class="text-sm font-bold text-gray-900 truncate">{{ pageTitle }}</h2>
        </div>

        <div class="ml-auto flex items-center gap-3">
          <!-- Role badge -->
          <span class="badge text-xs" :class="roleBadge.class">
            {{ roleBadge.label }}
          </span>

          <!-- Quick new case button -->
          <RouterLink v-if="auth.isAdmin || auth.isCaseWorker" to="/cases/new"
            class="btn-primary text-xs py-2 hidden sm:inline-flex">
            <PlusIcon class="w-3.5 h-3.5" />
            New Case
          </RouterLink>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>

  <!-- Mobile overlay -->
  <div v-if="sidebarOpen" class="fixed inset-0 bg-black/40 z-[5] md:hidden" @click="sidebarOpen = false"></div>

  <!-- Logout modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showLogoutModal"
        class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in"
        @click.self="showLogoutModal = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <ArrowRightOnRectangleIcon class="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 class="font-bold text-gray-900">Sign out</h3>
              <p class="text-xs text-gray-500 mt-0.5">You'll need to sign in again to access the registry.</p>
            </div>
          </div>
          <div class="flex gap-3 justify-end">
            <button @click="showLogoutModal = false" class="btn-secondary">Cancel</button>
            <button @click="doLogout" class="btn-danger">Sign out</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  Squares2X2Icon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  FolderOpenIcon,
  PlusCircleIcon,
  ArrowRightOnRectangleIcon,
  UsersIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
  PlusIcon,
  Bars3Icon,
} from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const showLogoutModal = ref(false)
const sidebarOpen = ref(false)

function confirmLogout() { showLogoutModal.value = true }
function doLogout() {
  showLogoutModal.value = false
  auth.logout()
  router.push('/login')
}

function isActive(path) {
  if (path === '/dashboard') return route.path === '/dashboard'
  if (path === '/cases') return route.path.startsWith('/cases') && !route.path.includes('/new')
  return route.path.startsWith(path)
}

const navItems = computed(() => {
  const items = [
    { to: '/dashboard', label: 'Dashboard', icon: Squares2X2Icon },
    { to: '/cases', label: 'Case Registry', icon: FolderOpenIcon },
    { to: '/reports', label: 'Reports', icon: ChartBarIcon },
  ]
  if (auth.isAdmin) {
    items.push({ to: '/users', label: 'User Management', icon: UsersIcon })
  }
  return items
})

const pageTitle = computed(() => {
  const map = {
    '/dashboard': 'Dashboard',
    '/cases': 'Case Registry',
    '/cases/new': 'New Case',
    '/users': 'User Management',
    '/reports': 'Reports & Export',
    '/faq': 'Help & FAQ',
  }
  if (route.path.includes('/cases/') && route.path.includes('/edit')) return 'Edit Case'
  if (route.path.includes('/cases/') && !route.path.includes('/new')) return 'Case Details'
  return map[route.path] || 'CEFMU Registry'
})

const roleBadge = computed(() => {
  const map = {
    admin: { label: 'System Admin', class: 'bg-purple-100 text-purple-700' },
    case_worker: { label: 'Case Worker', class: 'bg-blue-100 text-blue-700' },
    fo_user: { label: 'Field Office', class: 'bg-indigo-100 text-indigo-700' },
    lgu_supervisor: { label: 'LGU Supervisor', class: 'bg-amber-100 text-amber-700' },
    cpu_monitor: { label: 'CPU Monitor', class: 'bg-green-100 text-green-700' },
  }
  return map[auth.role] || { label: auth.role, class: 'bg-gray-100 text-gray-600' }
})
</script>
