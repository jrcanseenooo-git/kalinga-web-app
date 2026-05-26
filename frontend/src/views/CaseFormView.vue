<template>
  <div class="max-w-4xl mx-auto">
    <div class="bg-white rounded-xl border p-6 space-y-6 overflow-hidden">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-gray-800">{{ isEdit ? 'Edit Case' : 'General Intake Sheet' }}</h2>
        <span v-if="!isEdit" class="text-xs text-gray-400 uppercase tracking-wider">Kalinga Form</span>
      </div>

      <form @submit.prevent="submit" class="space-y-6">

        <!-- ═══ Section 1: Identifying Information ═══ -->
        <fieldset class="space-y-4 border-t pt-4">
          <legend class="text-xs font-semibold uppercase tracking-wider text-brand-600">I. Identifying information
          </legend>

          <div class="grid grid-cols-4 gap-3">
            <FormField label="Last name" v-model="form.client_last" required />
            <FormField label="First name" v-model="form.client_first" required />
            <FormField label="Middle name" v-model="form.client_mi" />
            <FormField label="Suffix" v-model="form.suffix" placeholder="Jr., Sr., III" />
          </div>

          <div class="grid grid-cols-4 gap-3">
            <FormField label="Date of birth" v-model="form.birthdate" type="date" required />
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Age</label>
              <input :value="computedAge" readonly
                class="w-full text-sm border rounded-lg px-3 py-2 bg-gray-50 text-gray-500" />
            </div>
            <SelectField label="Sex" v-model="form.sex" :options="['Male', 'Female']" required />
            <SelectField label="Civil status" v-model="form.civil_status" :options="civilStatuses" />
          </div>

          <div class="grid grid-cols-4 gap-3">
            <FormField label="Contact Number" v-model="form.phone" />
            <SelectField label="Religion" v-model="form.religion" :options="religions" />
            <SelectField label="IP Category" v-model="form.ip_category" :options="ipCategories" />
            <SelectField label="Highest Education Attainment" v-model="form.education" :options="educLevels" />
          </div>
        </fieldset>

        <!-- ═══ Section 2: Present Address ═══ -->
        <fieldset class="space-y-4 border-t pt-4">
          <legend class="text-xs font-semibold uppercase tracking-wider text-brand-600">II. Present address</legend>
          <div class="grid grid-cols-2 gap-3">
            <FormField label="House no. / Building / Street" v-model="form.present_street" />
            <SelectField label="Region" v-model="form.region" :options="regionList" option-key="name"
              option-label="name" required @update:modelValue="onRegionChange" />
          </div>
          <div class="grid grid-cols-3 gap-3">
            <SelectField label="Province" v-model="form.province" :options="provinceList" :disabled="!form.region"
              required />
            <FormField label="City / Municipality" v-model="form.city_muni" required />
            <FormField label="Barangay" v-model="form.barangay" />
          </div>
        </fieldset>

        <!-- ═══ Section 3: Permanent Address ═══ -->
        <fieldset class="space-y-4 border-t pt-4">
          <legend class="text-xs font-semibold uppercase tracking-wider text-brand-600">III. Permanent Address (if
            different)</legend>
          <div class="flex items-center gap-2 mb-2">
            <input type="checkbox" id="sameAddr" v-model="sameAddress" class="accent-brand-600" />
            <label for="sameAddr" class="text-xs text-gray-500">Same as present address</label>
          </div>
          <template v-if="!sameAddress">
            <div class="grid grid-cols-2 gap-3">
              <FormField label="House no. / Building / Street" v-model="form.per_street" />
              <SelectField label="Region" v-model="form.per_region" :options="regionList" option-key="name"
                option-label="name" @update:modelValue="onProvRegionChange" />
            </div>
            <div class="grid grid-cols-3 gap-3">
              <SelectField label="Province" v-model="form.per_province" :options="provProvinceList"
                :disabled="!form.per_region" />
              <FormField label="City / Municipality" v-model="form.per_city_muni" />
              <FormField label="Barangay" v-model="form.per_barangay" />
            </div>
          </template>
        </fieldset>

        <!-- ═══ Section 4: CEFMU Details ═══ -->
        <fieldset class="space-y-4 border-t pt-4">
          <legend class="text-xs font-semibold uppercase tracking-wider text-brand-600">IV. Case details</legend>

          <!-- Row 1: Classification (1 col) + Additional circumstances (2 cols) -->
          <div class="grid grid-cols-3 gap-3">
            <!-- Classification multi-select -->
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">Classification <span class="text-red-400">*</span></label>
              <div class="relative" ref="classifDropdownRef">
                <button type="button" @click.stop="showClassifDropdown = !showClassifDropdown"
                  class="field flex items-center justify-between w-full text-left min-h-[38px]">
                  <span class="truncate pr-2 text-sm" :class="form.classification.length ? 'text-gray-800' : 'text-gray-400'">
                    {{ form.classification.length ? form.classification.join(', ') : '— Select —' }}
                  </span>
                  <svg class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform" :class="showClassifDropdown ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                <div v-if="showClassifDropdown" class="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div class="p-2 space-y-0.5 max-h-52 overflow-y-auto">
                    <label v-for="opt in classificationOptions" :key="opt"
                      class="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50"
                      :class="form.classification.includes(opt) ? 'bg-brand-50' : ''"
                      @mousedown.stop>
                      <div class="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                        :class="form.classification.includes(opt) ? 'bg-brand-600 border-brand-600' : 'border-gray-300'">
                        <svg v-if="form.classification.includes(opt)" class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                      </div>
                      <input type="checkbox" class="hidden" :value="opt" v-model="form.classification" />
                      <span class="text-sm" :class="form.classification.includes(opt) ? 'text-brand-700 font-semibold' : 'text-gray-700'">{{ opt }}</span>
                    </label>
                  </div>
                  <div class="border-t border-gray-100 px-3 py-2 flex items-center justify-between">
                    <span class="text-xs text-gray-400">{{ form.classification.length }} selected</span>
                    <button type="button" @mousedown.stop="form.classification = []" class="text-xs text-red-500 hover:text-red-700 font-semibold">Clear</button>
                  </div>
                </div>
              </div>
            </div>
            <!-- Additional circumstances multi-select -->
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                Additional / co-occurring circumstances
              </label>
              <div class="relative" ref="circumDropdownRef">
                <button type="button" @click.stop="showCircumDropdown = !showCircumDropdown"
                  class="field flex items-center justify-between w-full text-left min-h-[38px]">
                  <span class="truncate pr-2 text-sm" :class="form.other_circumstances.length ? 'text-gray-800' : 'text-gray-400'">
                    {{ form.other_circumstances.length ? form.other_circumstances.join(', ') : '— Select circumstances —' }}
                  </span>
                  <svg class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform" :class="showCircumDropdown ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                <div v-if="showCircumDropdown" class="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div class="p-2 space-y-0.5 max-h-56 overflow-y-auto">
                    <label v-for="opt in otherCircumstances" :key="opt"
                      class="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50"
                      :class="form.other_circumstances.includes(opt) ? 'bg-brand-50' : ''"
                      @mousedown.stop>
                      <div class="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                        :class="form.other_circumstances.includes(opt) ? 'bg-brand-600 border-brand-600' : 'border-gray-300'">
                        <svg v-if="form.other_circumstances.includes(opt)" class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                      </div>
                      <input type="checkbox" class="hidden" :value="opt" v-model="form.other_circumstances" />
                      <span class="text-sm" :class="form.other_circumstances.includes(opt) ? 'text-brand-700 font-semibold' : 'text-gray-700'">{{ opt }}</span>
                    </label>
                  </div>
                  <div class="border-t border-gray-100 px-3 py-2 flex items-center justify-between">
                    <span class="text-xs text-gray-400">{{ form.other_circumstances.length }} selected</span>
                    <button type="button" @mousedown.stop="form.other_circumstances = []; showCircumDropdown = false" class="text-xs text-red-500 hover:text-red-700 font-semibold">Clear all</button>
                  </div>
                </div>
              </div>
            </div>
            <FormField label="Date of intake" v-model="form.date_intake" type="date" required />
          </div>

          <!-- Row 2: Mode of admission + Referred by + Referral date -->
          <div class="grid grid-cols-3 gap-3">
            <SelectField label="Mode of admission" v-model="form.admission_mode" :options="admissionModes" />
            <FormField label="Referred by (person/org)" v-model="form.referred_by" />
            <FormField label="Referral date" v-model="form.referral_date" type="date" />
          </div>
        </fieldset>

        <!-- ═══ Section 5: Family Composition ═══ -->
        <fieldset class="space-y-4 border-t pt-4 min-w-0">
          <legend class="text-xs font-semibold uppercase tracking-wider text-brand-600">V. Family composition</legend>

          <!-- Members table -->
          <div v-if="familyMembers.length" class="rounded-xl border border-gray-100 w-full">
            <table class="w-full text-xs table-fixed">
              <colgroup>
                <col class="w-[16%]" /> <!-- Name -->
                <col class="w-[11%]" /> <!-- Birthdate -->
                <col class="w-[5%]" /> <!-- Age -->
                <col class="w-[7%]" /> <!-- Sex -->
                <col class="w-[12%]" /> <!-- Relationship -->
                <col class="w-[14%]" /> <!-- Education -->
                <col class="w-[14%]" /> <!-- Occupation -->
                <col class="w-[9%]" /> <!-- Income -->
                <col class="w-[12%]" /> <!-- Actions -->
              </colgroup>
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-2 py-2.5 text-left font-bold text-gray-400 uppercase tracking-wider truncate">Name</th>
                  <th class="px-2 py-2.5 text-left font-bold text-gray-400 uppercase tracking-wider truncate">Birthdate
                  </th>
                  <th class="px-2 py-2.5 text-left font-bold text-gray-400 uppercase tracking-wider truncate">Age</th>
                  <th class="px-2 py-2.5 text-left font-bold text-gray-400 uppercase tracking-wider truncate">Sex</th>
                  <th class="px-2 py-2.5 text-left font-bold text-gray-400 uppercase tracking-wider truncate">
                    Relationship</th>
                  <th class="px-2 py-2.5 text-left font-bold text-gray-400 uppercase tracking-wider truncate">Education
                  </th>
                  <th class="px-2 py-2.5 text-left font-bold text-gray-400 uppercase tracking-wider truncate">Occupation
                  </th>
                  <th class="px-2 py-2.5 text-right font-bold text-gray-400 uppercase tracking-wider truncate">Income
                  </th>
                  <th class="px-2 py-2.5 text-right font-bold text-gray-400 uppercase tracking-wider truncate">Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="(m, i) in familyMembers" :key="i" class="hover:bg-gray-50 transition-colors"
                  :class="editingMemberIndex === i ? 'bg-brand-50/60 ring-1 ring-inset ring-brand-200' : ''">
                  <td class="px-2 py-2 font-medium text-gray-800 truncate">{{ m.name }}</td>
                  <td class="px-2 py-2 text-gray-500 truncate">{{ fmtBirthdate(m.birthdate) }}</td>
                  <td class="px-2 py-2 text-gray-600">{{ memberAge(m) }}</td>
                  <td class="px-2 py-2 text-gray-600 truncate">{{ m.sex }}</td>
                  <td class="px-2 py-2 text-gray-600 truncate">{{ m.relationship }}</td>
                  <td class="px-2 py-2 text-gray-600 truncate">{{ m.education }}</td>
                  <td class="px-2 py-2 text-gray-600 truncate">{{ m.occupation }}</td>
                  <td class="px-2 py-2 text-right text-gray-600 truncate">
                    {{ m.income ? '₱' + Number(m.income).toLocaleString() : '—' }}
                  </td>
                  <td class="px-2 py-2 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button type="button" @click="startEditMember(i)"
                        class="text-brand-600 hover:text-brand-800 font-semibold transition-colors">
                        Edit
                      </button>
                      <span class="text-gray-200">|</span>
                      <button type="button" @click="removeMember(i)"
                        class="text-red-400 hover:text-red-600 font-semibold transition-colors">
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-xl">
            No family members added yet.
          </div>

          <!-- Add family member toggle button -->
          <div class="flex justify-end">
            <button v-if="!showMemberForm" type="button" @click="showMemberForm = true"
              class="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1.5 transition-colors">
              <span class="text-base leading-none">+</span>
              Add family member
            </button>
          </div>

          <!-- Add / Edit member inline form -->
          <div v-if="showMemberForm" class="rounded-xl p-4 space-y-2.5 border" :class="editingMemberIndex !== null
            ? 'border-brand-200 bg-brand-50/30'
            : 'border-gray-100 bg-gray-50'">

            <p class="text-xs font-semibold text-gray-600">
              {{ editingMemberIndex !== null ? '✏️ Editing family member' : '➕ Add family member' }}
            </p>

            <!-- Row 1: Name, Birthdate, Age, Sex, Relationship -->
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              <input v-model="memberForm.name" placeholder="Full name" class="field text-xs md:col-span-2" />
              <input v-model="memberForm.birthdate" type="date" class="field text-xs"
                @change="onMemberBirthdateChange" />
              <input :value="memberComputedAge" readonly placeholder="Age"
                class="field text-xs bg-white/70 text-gray-400 cursor-not-allowed" />
              <select v-model="memberForm.sex" class="field text-xs">
                <option value="">Sex</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>

            <!-- Row 2: Relationship, Education, Occupation, Income -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select v-model="memberForm.relationship" class="field text-xs">
                <option value="">Relationship</option>
                <option v-for="r in relationships" :key="r">{{ r }}</option>
              </select>
              <input v-model="memberForm.education" placeholder="Education" class="field text-xs" />
              <input v-model="memberForm.occupation" placeholder="Occupation" class="field text-xs" />
              <input v-model="memberForm.income" placeholder="Income (₱)" type="number" class="field text-xs" />
            </div>

            <div class="flex gap-2 pt-0.5">
              <button type="button" @click="saveMember"
                class="text-xs bg-brand-600 text-white px-4 py-1.5 rounded-lg hover:bg-brand-700 font-semibold transition-colors">
                {{ editingMemberIndex !== null ? '✓ Update member' : '+ Add member' }}
              </button>
              <button type="button" @click="cancelEditMember"
                class="text-xs border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </fieldset>

        <!-- ═══ Section 6: Assessment ═══ -->
        <fieldset class="space-y-4 border-t pt-4">
          <legend class="text-xs font-semibold uppercase tracking-wider text-brand-600">VI. Social worker's assessment
          </legend>

          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Problem presented</label>
            <textarea v-model="form.presenting_problem" rows="3" class="field resize-none"
              placeholder="Describe the problem/situation of the client…" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Initial assessment</label>
            <textarea v-model="form.initial_assessment" rows="3" class="field resize-none"
              placeholder="Case worker's initial assessment and findings…" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Plan of action / Recommendations</label>
            <textarea v-model="form.plan_of_action" rows="3" class="field resize-none"
              placeholder="Recommended interventions and next steps…" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
            <textarea v-model="form.remarks" rows="2" class="field resize-none" />
          </div>
        </fieldset>

        <!-- ═══ Error & Actions ═══ -->
        <div v-if="error" class="flex items-start gap-2 bg-red-50 border border-red-100 px-3.5 py-3 rounded-xl">
          <span class="text-red-500 text-xs mt-0.5">⚠</span>
          <p class="text-xs text-red-700">{{ error }}</p>
        </div>

        <div class="flex gap-3 pt-2 border-t">
          <button type="button" @click.prevent="confirmSubmit" :disabled="saving"
            class="bg-brand-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            <span v-if="saving"
              class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create case' }}
          </button>
          <RouterLink to="/cases" class="text-sm px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors">
            Cancel
          </RouterLink>
        </div>

      </form>
    </div>
  </div>

  <!-- Confirm submit modal -->
  <ConfirmModal
    v-model="showConfirm"
    :title="confirmTitle"
    :message="confirmMessage"
    :confirm-label="confirmLabel"
    :loading="saving"
    @confirm="doSubmit"
    @cancel="showConfirm = false"
  />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, apiPost } from '@/services/api'
import FormField from '@/components/ui/FormField.vue'
import SelectField from '@/components/ui/SelectField.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import {
  regions as regionList, provinces as provincesMap,
  civilStatuses, religions, educLevels, ipCategories,
  relationships, cefmuTypes, admissionModes
} from '@/data/psgc'

const classificationOptions = [
  'Child marriage',
  'Early union (informal cohabitation)',
  'Forced marriage',
]

const showClassifDropdown = ref(false)
const classifDropdownRef  = ref(null)

const otherCircumstances = [
  'Child with Disability',
  'Child with Special Needs',
  'Child abuse',
  'Child labor',
  'Child trafficking',
  'Teenage pregnancy',
  'Psychologically / emotionally abused',
  'Sexually exploited / Online sexual abuse',
  'Abandoned / neglected',
  'Physically abused',
  'Runaway / missing child',
]

const showCircumDropdown = ref(false)
const circumDropdownRef  = ref(null)

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener('mousedown', (e) => {
    if (circumDropdownRef.value && !circumDropdownRef.value.contains(e.target)) {
      showCircumDropdown.value = false
    }
    if (classifDropdownRef.value && !classifDropdownRef.value.contains(e.target)) {
      showClassifDropdown.value = false
    }
  })
})

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id && route.path.includes('edit'))
const saving = ref(false)
const error = ref(null)
const sameAddress = ref(false)

// ─── Helpers ──────────────────────────────────────────────────
function toDateInput(val) {
  if (!val) return ''
  return String(val).slice(0, 10)
}

// Display birthdate as MM/DD/YYYY
function fmtBirthdate(val) {
  if (!val) return '—'
  const [y, m, d] = String(val).slice(0, 10).split('-')
  if (!y || !m || !d) return val
  return `${m}/${d}/${y}`
}

function calcAge(bdStr) {
  if (!bdStr) return ''
  const bd = new Date(bdStr)
  const today = new Date()
  let age = today.getFullYear() - bd.getFullYear()
  if (today.getMonth() < bd.getMonth() ||
    (today.getMonth() === bd.getMonth() && today.getDate() < bd.getDate())) age--
  return age >= 0 ? age : ''
}

// ─── Form state ───────────────────────────────────────────────
const emptyForm = () => ({
  client_last: '', client_first: '', client_mi: '', suffix: '',
  birthdate: '', sex: '', civil_status: '', religion: '',
  ip_category: '', education: '', phone: '', occupation: '',
  income: '', philhealth_no: '',
  present_street: '', region: '', province: '', city_muni: '', barangay: '',
  per_street: '', per_region: '', per_province: '', per_city_muni: '', per_barangay: '',
  classification: [], cefmu_type: '', other_circumstances: [], admission_mode: '',
  aics_form_no: '', date_intake: new Date().toISOString().slice(0, 10), lgu_code: '',
  referred_by: '', referral_date: '',
  presenting_problem: '', initial_assessment: '', plan_of_action: '', remarks: '',
})

const form = ref({
  client_last: '', client_first: '', client_mi: '', suffix: '',
  birthdate: '', sex: '', civil_status: '', religion: '',
  ip_category: '', education: '', phone: '', occupation: '',
  income: '', philhealth_no: '',
  present_street: '', region: '', province: '', city_muni: '', barangay: '',
  per_street: '', per_region: '', per_province: '', per_city_muni: '', per_barangay: '',
  classification: [], cefmu_type: '', other_circumstances: [], admission_mode: '',
  aics_form_no: '', date_intake: new Date().toISOString().slice(0, 10), lgu_code: '',
  referred_by: '', referral_date: '',
  presenting_problem: '', initial_assessment: '', plan_of_action: '', remarks: '',
})

// ─── Family composition ───────────────────────────────────────
const familyMembers = ref([])
const editingMemberIndex = ref(null)
const showMemberForm = ref(false)

const emptyMember = () => ({
  name: '', birthdate: '', age: '', sex: '',
  relationship: '', education: '', occupation: '', income: ''
})
const memberForm = ref(emptyMember())

// Auto-compute age from member birthdate
const memberComputedAge = computed(() => calcAge(memberForm.value.birthdate))

// Keep age in sync whenever birthdate changes
function onMemberBirthdateChange() {
  memberForm.value.age = memberComputedAge.value
}

// Display age for a saved member row
function memberAge(m) {
  if (m.age) return m.age
  return calcAge(m.birthdate) || '—'
}

function startEditMember(i) {
  editingMemberIndex.value = i
  memberForm.value = { ...familyMembers.value[i] }
  showMemberForm.value = true
}

function cancelEditMember() {
  editingMemberIndex.value = null
  memberForm.value = emptyMember()
  showMemberForm.value = false
}

function removeMember(i) {
  if (editingMemberIndex.value === i) cancelEditMember()
  else if (editingMemberIndex.value > i) editingMemberIndex.value--
  familyMembers.value.splice(i, 1)
}

function saveMember() {
  if (!memberForm.value.name) return
  // Ensure age is current
  memberForm.value.age = memberComputedAge.value || memberForm.value.age

  if (editingMemberIndex.value !== null) {
    familyMembers.value[editingMemberIndex.value] = { ...memberForm.value }
    editingMemberIndex.value = null
  } else {
    familyMembers.value.push({ ...memberForm.value })
  }
  memberForm.value = emptyMember()
  showMemberForm.value = false
}

// ─── Address dropdowns ────────────────────────────────────────
const provinceList = computed(() => {
  const found = regionList.find(r => r.name === form.value.region)
  return found ? (provincesMap[found.code] || []) : []
})
const provProvinceList = computed(() => {
  const found = regionList.find(r => r.name === form.value.per_region)
  return found ? (provincesMap[found.code] || []) : []
})

function onRegionChange() {
  form.value.province = ''
  form.value.city_muni = ''
  form.value.barangay = ''
}
function onProvRegionChange() {
  form.value.per_province = ''
  form.value.per_city_muni = ''
  form.value.per_barangay = ''
}

// ─── Client age computation ───────────────────────────────────
const computedAge = computed(() => calcAge(form.value.birthdate))
watch(computedAge, (val) => { form.value.age = val })

// ─── Same-address sync ────────────────────────────────────────
watch(sameAddress, (checked) => {
  if (checked) {
    form.value.per_street = form.value.present_street
    form.value.per_region = form.value.region
    form.value.per_province = form.value.province
    form.value.per_city_muni = form.value.city_muni
    form.value.per_barangay = form.value.barangay
  }
})

// ─── Load existing case for edit ──────────────────────────────
onMounted(async () => {
  if (isEdit.value) {
    const data = await api('getCase', { case_id: route.params.id })
    const dateFields = ['birthdate', 'date_intake', 'referral_date']

    Object.keys(form.value).forEach(k => {
      if (data[k] !== undefined && data[k] !== null) {
        if (k === 'classification' || k === 'other_circumstances') {
          // Parse back to array — handles both plain text and legacy JSON
          try {
            const val = data[k]
            if (!val || val === '[]') { form.value[k] = []; return }
            if (Array.isArray(val)) { form.value[k] = val; return }
            if (val.startsWith('[')) { form.value[k] = JSON.parse(val) }
            else { form.value[k] = val.split(', ').map(s => s.trim()).filter(Boolean) }
          } catch { form.value[k] = [] }
        } else {
          form.value[k] = dateFields.includes(k) ? toDateInput(data[k]) : data[k]
        }
      }
    })

    // Prefer _family (from dedicated sheet) over family_members JSON column
    if (data._family && data._family.length) {
      familyMembers.value = data._family.map(m => ({
        name: m.name || '',
        birthdate: toDateInput(m.birthdate),
        age: m.age || '',
        sex: m.sex || '',
        relationship: m.relationship || '',
        education: m.education || '',
        occupation: m.occupation || '',
        income: m.income || '',
      }))
    } else if (data.family_members) {
      // Fallback: parse legacy JSON column
      try {
        familyMembers.value = JSON.parse(data.family_members).map(m => ({
          name: m.name || '',
          birthdate: toDateInput(m.birthdate || ''),
          age: m.age || '',
          sex: m.sex || '',
          relationship: m.relationship || '',
          education: m.education || '',
          occupation: m.occupation || '',
          income: m.income || '',
        }))
      } catch (e) { }
    }
  } else {
    // Always reset when opening new case form
    form.value = emptyForm()
    familyMembers.value = []
    sameAddress.value = false
    error.value = null
  }
})

// Reset form when route changes to /cases/new
watch(() => route.path, (path) => {
  if (path === '/cases/new') {
    form.value = emptyForm()
    familyMembers.value = []
    sameAddress.value = false
    error.value = null
  }
})

// ─── Submit ───────────────────────────────────────────────────
const showConfirm = ref(false)
const confirmTitle   = computed(() => isEdit.value ? 'Save changes?' : 'Create new case?')
const confirmMessage = computed(() => isEdit.value
  ? 'Save changes to this case record. Ensure all information is accurate before saving.'
  : 'Create a new CEFMU case record. Ensure all required fields are filled in correctly.')
const confirmLabel   = computed(() => isEdit.value ? 'Yes, save changes' : 'Yes, create case')

function confirmSubmit() {
  // Basic validation before showing confirm
  if (!form.value.client_last || !form.value.client_first) {
    error.value = "Please enter the client last name and first name."
    return
  }
  if (!form.value.date_intake) {
    error.value = 'Please fill in the date of intake.'
    return
  }
  if (!form.value.region) {
    error.value = 'Please select a region.'
    return
  }
  if (!form.value.classification.length) {
    error.value = 'Please select at least one classification.'
    return
  }
  error.value = null
  showConfirm.value = true
}

async function doSubmit() {
  saving.value = true
  error.value = null
  try {
    const payload = {
      ...form.value,
      age: computedAge.value,
      // Send members as JSON; backend saves to dedicated sheet AND updates JSON column
      family_members: JSON.stringify(familyMembers.value),
    }
    if (isEdit.value) {
      await apiPost('updateCase', { case_id: route.params.id, ...payload })
      router.push(`/cases/${route.params.id}`)
    } else {
      const { case_id } = await apiPost('createCase', payload)
      router.push(`/cases/${case_id}`)
    }
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.field {
  @apply w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white border-gray-200;
}
</style>