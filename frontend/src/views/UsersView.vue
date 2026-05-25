<template>
  <div class="space-y-4 animate-fade-in">

    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <MagnifyingGlassIcon class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input v-model="search" type="search" placeholder="Search by name or email…"
          class="input-base pl-10" />
      </div>
      <button @click="showForm = true" class="btn-primary flex-shrink-0">
        <PlusIcon class="w-4 h-4" /> Add user
      </button>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-3 gap-3 stagger">
      <div class="card p-4 text-center">
        <p class="stat-number text-brand-600 text-2xl">{{ users.filter(u => u.active === true || u.active === 'TRUE').length }}</p>
        <p class="text-xs text-gray-400 mt-1 font-medium">Active users</p>
      </div>
      <div class="card p-4 text-center">
        <p class="stat-number text-blue-600 text-2xl">{{ users.filter(u => u.role === 'case_worker').length }}</p>
        <p class="text-xs text-gray-400 mt-1 font-medium">Case workers</p>
      </div>
      <div class="card p-4 text-center">
        <p class="stat-number text-gray-600 text-2xl">{{ users.length }}</p>
        <p class="text-xs text-gray-400 mt-1 font-medium">Total users</p>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">User</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 hidden md:table-cell">Email</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Role</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Scope</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
              <th class="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading" v-for="i in 5" :key="i">
              <td colspan="6" class="px-5 py-4">
                <div class="h-4 bg-gray-100 rounded-lg animate-pulse-soft"></div>
              </td>
            </tr>
            <tr v-else-if="!filtered.length">
              <td colspan="6" class="py-12 text-center text-sm text-gray-400">No users found</td>
            </tr>
            <tr v-for="u in filtered" :key="u.email" class="hover:bg-gray-50 transition-colors group">
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    :class="roleAvatarColor(u.role)">
                    {{ u.display_name?.charAt(0) || '?' }}
                  </div>
                  <span class="font-semibold text-gray-900">{{ u.display_name }}</span>
                </div>
              </td>
              <td class="px-5 py-3.5 text-gray-500 text-xs hidden md:table-cell">{{ u.email }}</td>
              <td class="px-5 py-3.5">
                <span class="badge capitalize" :class="roleColor(u.role)">
                  {{ roleLabel(u.role) }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-gray-400 text-xs hidden lg:table-cell">
                <span v-if="u.region" class="block">{{ u.region }}</span>
                <span v-if="u.province" class="block">{{ u.province }}</span>
                <span v-if="u.lgu_code">LGU: {{ u.lgu_code }}</span>
                <span v-if="!u.region && !u.province && !u.lgu_code">—</span>
              </td>
              <td class="px-5 py-3.5">
                <span class="badge" :class="(u.active === true || u.active === 'TRUE')
                  ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'">
                  <span class="w-1.5 h-1.5 rounded-full mr-1.5"
                    :class="(u.active === true || u.active === 'TRUE') ? 'bg-emerald-500' : 'bg-red-500'"></span>
                  {{ (u.active === true || u.active === 'TRUE') ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center justify-end gap-1">
                  <button @click="editUser(u)"
                    class="text-xs font-semibold text-brand-600 hover:bg-brand-50 px-2.5 py-1.5 rounded-lg transition-colors">
                    Edit
                  </button>
                  <button @click="setPassword(u)"
                    class="text-xs font-semibold text-amber-600 hover:bg-amber-50 px-2.5 py-1.5 rounded-lg transition-colors">
                    Set pwd
                  </button>
                  <button @click="toggleActive(u)"
                    class="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                    :class="(u.active === true || u.active === 'TRUE')
                      ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'">
                    {{ (u.active === true || u.active === 'TRUE') ? 'Deactivate' : 'Activate' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Add/Edit modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showForm"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
        @click.self="closeForm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-bold text-gray-900 text-base">{{ editing ? 'Edit user' : 'Add new user' }}</h3>
            <button @click="closeForm" class="text-gray-400 hover:text-gray-600 transition-colors">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <div class="space-y-4">
            <FormField label="Full name" v-model="form.display_name" placeholder="Juan dela Cruz" />
            <FormField label="Email" v-model="form.email" type="email" :readonly="!!editing" placeholder="user@dswd.gov.ph" />

            <!-- Role -->
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">Role</label>
              <select v-model="form.role" class="input-base">
                <option value="">— Select role —</option>
                <option value="admin">Admin (all cases nationwide)</option>
                <option value="case_worker">Case Worker (own cases only)</option>
                <option value="fo_user">Field Office User (by region)</option>
                <option value="lgu_supervisor">LGU Supervisor (by province)</option>
                <option value="cpu_monitor">CPU Monitor (LGU read-only)</option>
              </select>
              <p class="text-xs text-gray-400 mt-1">{{ roleScopeHint }}</p>
            </div>

            <!-- Region — show for fo_user -->
            <div v-if="form.role === 'fo_user'">
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                Region <span class="text-red-400">*</span>
              </label>
              <select v-model="form.region" class="input-base">
                <option value="">— Select region —</option>
                <option v-for="r in regionOptions" :key="r" :value="r">{{ r }}</option>
              </select>
              <p class="text-xs text-gray-400 mt-1">User will see all cases from this region.</p>
            </div>

            <!-- Province — show for lgu_supervisor -->
            <div v-if="form.role === 'lgu_supervisor'">
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                Province <span class="text-red-400">*</span>
              </label>
              <input v-model="form.province" type="text"
                placeholder="e.g. Batangas, Cebu, Davao del Sur"
                class="input-base" />
              <p class="text-xs text-gray-400 mt-1">User will see all cases from this province.</p>
            </div>

            <!-- LGU code — show for case_worker and cpu_monitor -->
            <div v-if="form.role === 'case_worker' || form.role === 'cpu_monitor'">
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">LGU code</label>
              <input v-model="form.lgu_code" type="text"
                placeholder="e.g. 012801000"
                class="input-base" />
              <p class="text-xs text-gray-400 mt-1">
                {{ form.role === 'cpu_monitor' ? 'CPU monitor sees all cases from this LGU.' : 'Optional identifier for case worker.' }}
              </p>
            </div>
          </div>

          <div v-if="formError" class="mt-4 flex items-start gap-2 bg-red-50 px-3 py-2.5 rounded-xl">
            <ExclamationCircleIcon class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-red-700">{{ formError }}</p>
          </div>

          <div class="flex gap-3 mt-5">
            <button @click="saveUser" :disabled="saving" class="btn-primary flex-1 justify-center">
              <span v-if="saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {{ saving ? 'Saving…' : 'Save user' }}
            </button>
            <button @click="closeForm" class="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Set password modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showPwdModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
        @click.self="showPwdModal = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up">
          <h3 class="font-bold text-gray-900 mb-1">Set temporary password</h3>
          <p class="text-xs text-gray-500 mb-4">For {{ pwdTarget?.display_name }}. They'll be prompted to change it on first login.</p>
          <div class="space-y-3">
            <FormField label="New password" v-model="newPwd" type="password" placeholder="Min. 8 chars, 1 uppercase, 1 number" />
          </div>
          <div v-if="pwdError" class="mt-3 flex items-start gap-2 bg-red-50 px-3 py-2.5 rounded-xl">
            <ExclamationCircleIcon class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-red-700">{{ pwdError }}</p>
          </div>
          <div class="flex gap-3 mt-5">
            <button @click="submitSetPassword" :disabled="settingPwd" class="btn-primary flex-1 justify-center">
              <span v-if="settingPwd" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {{ settingPwd ? 'Saving…' : 'Set password' }}
            </button>
            <button @click="showPwdModal = false" class="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api, apiPost } from '@/services/api'
import FormField from '@/components/ui/FormField.vue'
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'

const users    = ref([])
const loading  = ref(true)
const search   = ref('')
const showForm = ref(false)
const editing  = ref(null)
const saving   = ref(false)
const formError = ref(null)

const showPwdModal = ref(false)
const pwdTarget    = ref(null)
const newPwd       = ref('')
const pwdError     = ref(null)
const settingPwd   = ref(false)

const emptyForm = () => ({
  display_name: '', email: '', role: '',
  lgu_code: '', region: '', province: ''
})
const form = ref(emptyForm())

// All 17 Philippine regions
const regionOptions = [
  'Region I - Ilocos Region',
  'Region II - Cagayan Valley',
  'Region III - Central Luzon',
  'Region IV-A - CALABARZON',
  'Region V - Bicol Region',
  'Region VI - Western Visayas',
  'Region VII - Central Visayas',
  'Region VIII - Eastern Visayas',
  'Region IX - Zamboanga Peninsula',
  'Region X - Northern Mindanao',
  'Region XI - Davao Region',
  'Region XII - SOCCSKSARGEN',
  'NCR - National Capital Region',
  'CAR - Cordillera Administrative Region',
  'BARMM',
  'Region XIII - Caraga',
  'MIMAROPA',
]

const roleScopeHint = computed(() => {
  const hints = {
    admin:          'Has full access to all cases nationwide.',
    case_worker:    'Can create and manage their own cases.',
    fo_user:        'Can view all cases within their assigned region.',
    lgu_supervisor: 'Can view all cases within their assigned province.',
    cpu_monitor:    'Read-only access to cases within their LGU.',
  }
  return hints[form.value.role] || ''
})

onMounted(async () => {
  users.value  = await api('getUsers')
  loading.value = false
})

const filtered = computed(() =>
  users.value.filter(u => {
    const q = search.value.toLowerCase()
    return !q || u.display_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  })
)

function roleLabel(role) {
  const labels = {
    admin:          'Admin',
    case_worker:    'Case Worker',
    fo_user:        'Field Office',
    lgu_supervisor: 'LGU Supervisor',
    cpu_monitor:    'CPU Monitor',
  }
  return labels[role] || role?.replace('_', ' ') || '—'
}

function roleColor(role) {
  return {
    admin:          'bg-purple-50 text-purple-700',
    case_worker:    'bg-blue-50 text-blue-700',
    fo_user:        'bg-indigo-50 text-indigo-700',
    lgu_supervisor: 'bg-amber-50 text-amber-700',
    cpu_monitor:    'bg-emerald-50 text-emerald-700',
  }[role] || 'bg-gray-100 text-gray-600'
}

function roleAvatarColor(role) {
  return {
    admin:          'bg-purple-100 text-purple-700',
    case_worker:    'bg-blue-100 text-blue-700',
    fo_user:        'bg-indigo-100 text-indigo-700',
    lgu_supervisor: 'bg-amber-100 text-amber-700',
    cpu_monitor:    'bg-emerald-100 text-emerald-700',
  }[role] || 'bg-gray-100 text-gray-600'
}

function editUser(u) {
  editing.value = u
  form.value = {
    display_name: u.display_name,
    email:        u.email,
    role:         u.role,
    lgu_code:     u.lgu_code  || '',
    region:       u.region    || '',
    province:     u.province  || '',
  }
  showForm.value = true
}

function closeForm() {
  showForm.value  = false
  editing.value   = null
  formError.value = null
  form.value      = emptyForm()
}

async function saveUser() {
  if (!form.value.email || !form.value.role) {
    formError.value = 'Email and role are required.'
    return
  }
  if (form.value.role === 'fo_user' && !form.value.region) {
    formError.value = 'Please select a region for Field Office users.'
    return
  }
  if (form.value.role === 'lgu_supervisor' && !form.value.province) {
    formError.value = 'Please enter a province for LGU Supervisor users.'
    return
  }
  saving.value    = true
  formError.value = null
  try {
    const action = editing.value ? 'updateUser' : 'createUser'
    await apiPost(action, form.value)
    users.value = await api('getUsers')
    closeForm()
  } catch (e) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

async function toggleActive(u) {
  const isActive = u.active === true || u.active === 'TRUE'
  if (!confirm(`${isActive ? 'Deactivate' : 'Activate'} ${u.display_name}?`)) return
  await apiPost('toggleUser', { email: u.email, active: !isActive })
  users.value = await api('getUsers')
}

function setPassword(u) {
  pwdTarget.value    = u
  newPwd.value       = ''
  pwdError.value     = null
  showPwdModal.value = true
}

async function submitSetPassword() {
  pwdError.value = null
  if (newPwd.value.length < 8)        { pwdError.value = 'Password must be at least 8 characters.'; return }
  if (!/[A-Z]/.test(newPwd.value))    { pwdError.value = 'Must contain at least one uppercase letter.'; return }
  if (!/[0-9]/.test(newPwd.value))    { pwdError.value = 'Must contain at least one number.'; return }
  settingPwd.value = true
  try {
    await apiPost('setPassword', { email: pwdTarget.value.email, password: newPwd.value })
    showPwdModal.value = false
  } catch (e) {
    pwdError.value = e.message
  } finally {
    settingPwd.value = false
  }
}
</script>