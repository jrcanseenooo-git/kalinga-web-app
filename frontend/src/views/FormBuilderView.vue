<template>
  <div class="space-y-4 animate-fade-in">

    <!-- Tabs -->
    <div class="flex gap-2 border-b">
      <button v-for="t in tabs" :key="t.key" @click="tab = t.key"
        class="px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors"
        :class="tab === t.key
          ? 'border-brand-600 text-brand-600'
          : 'border-transparent text-gray-400 hover:text-gray-600'">
        {{ t.label }}
      </button>
    </div>

    <!-- ═══ Custom fields ═══ -->
    <div v-if="tab === 'fields'" class="space-y-4">
      <div class="flex items-start justify-between gap-3">
        <p class="text-xs text-gray-500 max-w-2xl">
          Add extra questions to the intake form without a developer. Core fields
          (name, birthdate, address, classification) are fixed and cannot be changed here —
          they are required by the dashboards, reports and case matching.
        </p>
        <button @click="openNew" class="btn-primary flex-shrink-0">
          <PlusIcon class="w-4 h-4" /> Add field
        </button>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Label</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 hidden md:table-cell">Key</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Type</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Classification</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Section</th>
              <th class="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loadingFields"><td colspan="6" class="py-8 text-center text-sm text-gray-400">Loading…</td></tr>
            <tr v-else-if="!fields.length"><td colspan="6" class="py-12 text-center text-sm text-gray-400">
              No custom fields yet. Click "Add field" to create one.
            </td></tr>
            <tr v-for="f in fields" :key="f.field_key" class="hover:bg-gray-50 transition-colors">
              <td class="px-5 py-3.5 font-semibold text-gray-900">
                {{ f.label }}
                <span v-if="f.required" class="text-red-400">*</span>
              </td>
              <td class="px-5 py-3.5 text-gray-500 text-xs font-mono hidden md:table-cell">{{ f.field_key }}</td>
              <td class="px-5 py-3.5 text-gray-500 text-xs">{{ f.field_type }}</td>
              <td class="px-5 py-3.5">
                <span class="badge" :class="f.sensitivity === 'sensitive'
                  ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'">
                  {{ f.sensitivity === 'sensitive' ? 'Sensitive (SPI)' : 'Personal' }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-gray-400 text-xs hidden lg:table-cell">{{ f.section }}</td>
              <td class="px-5 py-3.5 text-right">
                <button @click="openEdit(f)"
                  class="text-xs font-semibold text-brand-600 hover:bg-brand-50 px-2.5 py-1.5 rounded-lg">Edit</button>
                <button @click="confirmRemove(f)"
                  class="text-xs font-semibold text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══ Dropdown options ═══ -->
    <div v-if="tab === 'lookups'" class="space-y-4">
      <p class="text-xs text-gray-500 max-w-2xl">
        Manage the choices that appear in the intake form dropdowns.
        Changes take effect immediately for all users.
      </p>

      <div class="flex flex-col sm:flex-row gap-3">
        <select v-model="activeLookup" class="input-base sm:max-w-xs">
          <option v-for="t in lookupTypes" :key="t.key" :value="t.key">{{ t.label }}</option>
        </select>
        <div class="flex gap-2 flex-1">
          <input v-model="newOption" @keyup.enter="addOption" placeholder="Add a new option…"
            class="input-base flex-1" />
          <button @click="addOption" :disabled="!newOption.trim() || savingOption" class="btn-primary flex-shrink-0">
            <PlusIcon class="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      <div class="card p-4">
        <p v-if="!currentOptions.length" class="text-sm text-gray-400 py-6 text-center">
          No options yet — the form is using its built-in defaults.
        </p>
        <div v-else class="flex flex-wrap gap-2">
          <span v-for="o in currentOptions" :key="o.value"
            class="inline-flex items-center gap-2 text-sm border rounded-lg px-3 py-1.5 bg-gray-50">
            {{ o.label || o.value }}
            <button @click="confirmRemoveOption(o)" class="text-gray-400 hover:text-red-500">
              <XMarkIcon class="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      </div>
    </div>

    <div v-if="pageError" class="flex items-start gap-2 bg-red-50 border border-red-100 px-3.5 py-3 rounded-xl">
      <ExclamationCircleIcon class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-red-700">{{ pageError }}</p>
    </div>
  </div>

  <!-- Field editor modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showFieldForm"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showFieldForm = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-bold text-gray-900 text-base">
              {{ editingField ? 'Edit field' : 'Add custom field' }}
            </h3>
            <button @click="showFieldForm = false" class="text-gray-400 hover:text-gray-600">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <div class="space-y-4">
            <FormField label="Question / Label" v-model="fieldForm.label"
              placeholder="e.g. Is the client currently enrolled in school?" />

            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">Field key</label>
              <input v-model="fieldForm.field_key" :readonly="!!editingField"
                placeholder="e.g. school_enrolled"
                class="input-base font-mono" :class="{ 'bg-gray-50 text-gray-500': editingField }" />
              <p class="text-xs text-gray-400 mt-1">
                Lowercase letters, numbers and underscores. Cannot be changed later.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">Type</label>
                <select v-model="fieldForm.field_type" class="input-base">
                  <option v-for="t in fieldTypes" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <FormField label="Section heading" v-model="fieldForm.section"
                placeholder="Additional information" />
            </div>

            <div v-if="fieldForm.field_type === 'select' || fieldForm.field_type === 'multiselect'">
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">Options</label>
              <textarea v-model="fieldForm.optionsText" rows="3" class="input-base resize-none"
                placeholder="One option per line" />
              <p class="text-xs text-gray-400 mt-1">One option per line.</p>
            </div>

            <!-- RA 10173 -->
            <div class="border rounded-xl p-3.5 bg-amber-50/40 space-y-3">
              <div class="flex items-start gap-2">
                <ShieldCheckIcon class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p class="text-xs text-amber-800 font-semibold">
                  Required under the Data Privacy Act of 2012 (RA 10173)
                </p>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">Data classification</label>
                <select v-model="fieldForm.sensitivity" class="input-base">
                  <option value="personal">Personal Information</option>
                  <option value="sensitive">Sensitive Personal Information (SPI)</option>
                </select>
                <p class="text-xs text-gray-400 mt-1">
                  Choose SPI for health, ethnicity, religion, sexual life, or legal proceedings.
                </p>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">Purpose of collection</label>
                <textarea v-model="fieldForm.purpose" rows="2" class="input-base resize-none"
                  placeholder="Why is this information collected and how will it be used?" />
                <p class="text-xs text-gray-400 mt-1">At least 10 characters.</p>
              </div>
            </div>

            <FormField label="Help text (optional)" v-model="fieldForm.help_text"
              placeholder="Shown under the question to guide the case worker" />

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="fieldForm.required"
                class="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
              <span class="text-sm text-gray-700">Required field</span>
            </label>
          </div>

          <div v-if="fieldError" class="mt-4 flex items-start gap-2 bg-red-50 px-3 py-2.5 rounded-xl">
            <ExclamationCircleIcon class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-red-700">{{ fieldError }}</p>
          </div>

          <div class="flex gap-3 mt-5">
            <button @click="saveField" :disabled="savingField" class="btn-primary flex-1 justify-center">
              {{ savingField ? 'Saving…' : 'Save field' }}
            </button>
            <button @click="showFieldForm = false" class="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <ConfirmModal v-model="showRemoveConfirm" title="Remove this field?"
    :message="`&quot;${removeTarget?.label}&quot; will no longer appear on the intake form. Existing case data is kept.`"
    variant="danger" confirm-label="Yes, remove" :loading="removing"
    @confirm="doRemove" @cancel="showRemoveConfirm = false" />

  <ConfirmModal v-model="showRemoveOptConfirm" title="Remove this option?"
    :message="`&quot;${removeOptTarget?.label || removeOptTarget?.value}&quot; will no longer be selectable. Existing cases keep their saved value.`"
    variant="danger" confirm-label="Yes, remove" :loading="removingOpt"
    @confirm="doRemoveOption" @cancel="showRemoveOptConfirm = false" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api, apiPost } from '@/services/api'
import FormField from '@/components/ui/FormField.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { PlusIcon, XMarkIcon, ExclamationCircleIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'

const tabs = [
  { key: 'fields',  label: 'Custom fields' },
  { key: 'lookups', label: 'Dropdown options' },
]
const tab = ref('fields')
const pageError = ref(null)

// ── Custom fields ──────────────────────────────────────────────
const fields = ref([])
const loadingFields = ref(true)
const fieldTypes = ['text', 'textarea', 'number', 'date', 'select', 'multiselect', 'checkbox']

const showFieldForm = ref(false)
const editingField = ref(null)
const savingField = ref(false)
const fieldError = ref(null)

const emptyField = () => ({
  field_key: '', label: '', field_type: 'text', optionsText: '',
  required: false, section: 'Additional information',
  sensitivity: 'personal', purpose: '', help_text: '', sort_order: 0,
})
const fieldForm = ref(emptyField())

async function loadFields() {
  loadingFields.value = true
  try {
    fields.value = await api('getFormFields') || []
  } catch (e) {
    pageError.value = e.message
  } finally {
    loadingFields.value = false
  }
}

function openNew() {
  editingField.value = null
  fieldForm.value = emptyField()
  fieldError.value = null
  showFieldForm.value = true
}

function openEdit(f) {
  editingField.value = f
  fieldForm.value = {
    field_key:   f.field_key,
    label:       f.label,
    field_type:  f.field_type,
    optionsText: (f.options || []).join('\n'),
    required:    !!f.required,
    section:     f.section || 'Additional information',
    sensitivity: f.sensitivity || 'personal',
    purpose:     f.purpose || '',
    help_text:   f.help_text || '',
    sort_order:  f.sort_order || 0,
  }
  fieldError.value = null
  showFieldForm.value = true
}

async function saveField() {
  fieldError.value = null
  const f = fieldForm.value

  if (!f.label.trim()) { fieldError.value = 'Label is required.'; return }
  if (!/^[a-z][a-z0-9_]{1,39}$/.test(f.field_key.trim())) {
    fieldError.value = 'Field key must start with a letter and use only lowercase letters, numbers and underscores.'
    return
  }
  if (f.sensitivity !== 'personal' && f.sensitivity !== 'sensitive') {
    fieldError.value = 'Select a data classification.'; return
  }
  if (f.purpose.trim().length < 10) {
    fieldError.value = 'State the collection purpose (at least 10 characters) — required under RA 10173.'
    return
  }
  const options = f.optionsText.split('\n').map(o => o.trim()).filter(Boolean)
  if ((f.field_type === 'select' || f.field_type === 'multiselect') && !options.length) {
    fieldError.value = 'Provide at least one option.'; return
  }

  savingField.value = true
  try {
    await apiPost('saveFormField', {
      field_key: f.field_key.trim(),
      label: f.label.trim(),
      field_type: f.field_type,
      options: JSON.stringify(options),
      required: f.required,
      section: f.section.trim() || 'Additional information',
      sort_order: f.sort_order,
      sensitivity: f.sensitivity,
      purpose: f.purpose.trim(),
      help_text: f.help_text.trim(),
    })
    showFieldForm.value = false
    await loadFields()
  } catch (e) {
    fieldError.value = e.message
  } finally {
    savingField.value = false
  }
}

const showRemoveConfirm = ref(false)
const removeTarget = ref(null)
const removing = ref(false)

function confirmRemove(f) { removeTarget.value = f; showRemoveConfirm.value = true }

async function doRemove() {
  removing.value = true
  try {
    await apiPost('deleteFormField', { field_key: removeTarget.value.field_key })
    showRemoveConfirm.value = false
    await loadFields()
  } catch (e) {
    pageError.value = e.message
  } finally {
    removing.value = false
  }
}

// ── Dropdown options ───────────────────────────────────────────
const lookupTypes = [
  { key: 'civil_status',       label: 'Civil status' },
  { key: 'religion',           label: 'Religion' },
  { key: 'education',          label: 'Educational attainment' },
  { key: 'ip_category',        label: 'IP category' },
  { key: 'cefmu_type',         label: 'CEFMU classification' },
  { key: 'admission_mode',     label: 'Mode of admission' },
  { key: 'other_circumstance', label: 'Other circumstances' },
  { key: 'service_type',       label: 'Service type' },
  { key: 'classification',     label: 'Client classification' },
]
const activeLookup = ref('civil_status')
const lookups = ref({})
const newOption = ref('')
const savingOption = ref(false)

const currentOptions = computed(() => lookups.value[activeLookup.value] || [])

async function loadLookups() {
  try {
    lookups.value = await api('getLookups') || {}
  } catch (e) {
    pageError.value = e.message
  }
}

async function addOption() {
  const val = newOption.value.trim()
  if (!val) return
  savingOption.value = true
  try {
    await apiPost('saveLookupOption', {
      lookup_type: activeLookup.value,
      value: val,
      label: val,
    })
    newOption.value = ''
    await loadLookups()
  } catch (e) {
    pageError.value = e.message
  } finally {
    savingOption.value = false
  }
}

const showRemoveOptConfirm = ref(false)
const removeOptTarget = ref(null)
const removingOpt = ref(false)

function confirmRemoveOption(o) { removeOptTarget.value = o; showRemoveOptConfirm.value = true }

async function doRemoveOption() {
  removingOpt.value = true
  try {
    await apiPost('deleteLookupOption', {
      lookup_type: activeLookup.value,
      value: removeOptTarget.value.value,
    })
    showRemoveOptConfirm.value = false
    await loadLookups()
  } catch (e) {
    pageError.value = e.message
  } finally {
    removingOpt.value = false
  }
}

onMounted(() => { loadFields(); loadLookups() })
</script>
