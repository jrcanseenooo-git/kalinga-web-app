<template>
  <div class="max-w-4xl mx-auto animate-fade-in">

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="card p-6 h-40 animate-pulse-soft bg-gray-50"></div>
      <div class="card p-6 h-32 animate-pulse-soft bg-gray-50"></div>
    </div>

    <template v-else-if="caseData">

      <!-- Sticky action bar -->
      <div v-if="auth.isAdmin || auth.isCaseWorker"
        class="flex items-center justify-between mb-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 px-4 py-3 sticky top-0 z-10 shadow-sm no-print">
        <RouterLink to="/cases" class="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1.5">
          <ChevronLeftIcon class="w-4 h-4" /> Back to Cases
        </RouterLink>
        <div class="flex gap-2">
          <button @click="printCase" class="btn-secondary text-xs py-2">
            <PrinterIcon class="w-3.5 h-3.5" /> Print
          </button>
          <RouterLink :to="`/cases/${caseData.case_id}/edit`" class="btn-primary text-xs py-2">
            <PencilIcon class="w-3.5 h-3.5" /> Edit Case
          </RouterLink>
          <button v-if="caseData.status === 'active'" @click="closeCase"
            class="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-semibold">
            <XMarkIcon class="w-3.5 h-3.5" /> Close
          </button>
          <button v-if="caseData.status === 'closed'" @click="reopenCase"
            class="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors font-semibold">
            <ArrowPathIcon class="w-3.5 h-3.5" /> Reopen
          </button>
        </div>
      </div>

      <!-- Header card -->
      <div class="card p-6 mb-4">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 font-bold"
              :class="caseData.classification === 'child' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'">
              {{ caseData.client_first?.charAt(0) }}{{ caseData.client_last?.charAt(0) }}
            </div>
            <div>
              <h2 class="font-extrabold text-gray-900 text-xl leading-tight">
                {{ caseData.client_last }}, {{ caseData.client_first }}
                <span v-if="caseData.client_mi"> {{ caseData.client_mi }}</span>
                <span v-if="caseData.suffix"> {{ caseData.suffix }}</span>
              </h2>
              <p class="font-mono text-xs text-brand-600 font-semibold mt-1">{{ caseData.case_id }}</p>
              <p class="text-xs text-gray-400 mt-1">
                Intake: {{ fmtDate(caseData.date_intake) }}
                <span v-if="caseData.case_worker_email"> · {{ caseData.case_worker_email }}</span>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="badge capitalize" :class="classColor(caseData.classification)">
              {{ caseData.classification }}
            </span>
            <span class="badge"
              :class="caseData.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'">
              <span class="w-1.5 h-1.5 rounded-full mr-1.5"
                :class="caseData.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'"></span>
              {{ caseData.status }}
            </span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="mt-6">
          <div class="flex border-b border-gray-100 gap-4 mb-5 overflow-x-auto">
            <button v-for="tab in detailTabs" :key="tab.id" @click="activeTab = tab.id"
              class="text-xs font-semibold pb-3 px-1 border-b-2 transition-colors whitespace-nowrap"
              :class="activeTab === tab.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-400 hover:text-gray-600'">
              {{ tab.label }}
            </button>
          </div>

          <!-- Personal Info -->
          <div v-if="activeTab === 'personal'" class="animate-fade-in">
            <dl class="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
              <InfoItem label="Sex" :value="caseData.sex" />
              <InfoItem label="Age" :value="caseData.age" />
              <InfoItem label="Date of birth" :value="fmtDate(caseData.birthdate)" />
              <InfoItem label="Civil status" :value="caseData.civil_status" />
              <InfoItem label="Religion" :value="caseData.religion" />
              <InfoItem label="IP category" :value="caseData.ip_category" />
              <InfoItem label="Education" :value="caseData.education" />
              <InfoItem label="Contact Number" :value="caseData.phone" />
            </dl>
          </div>

          <!-- Address -->
          <div v-if="activeTab === 'address'" class="animate-fade-in">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-gray-50 rounded-xl p-4">
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Present address</p>
                <p class="text-sm text-gray-700">
                  {{[caseData.present_street, caseData.barangay, caseData.city_muni, caseData.province,
                  caseData.region].filter(v => v && String(v).trim()).join(', ') || '—' }}
                </p>
              </div>
              <div class="bg-gray-50 rounded-xl p-4">
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Permanent address</p>
                <p class="text-sm text-gray-700">
                  {{[caseData.per_street, caseData.per_barangay, caseData.per_city_muni, caseData.per_province,
                  caseData.per_region].filter(v => v && String(v).trim()).join(', ') ||
                    [caseData.prov_street, caseData.prov_barangay, caseData.prov_city_muni, caseData.prov_province,
                    caseData.prov_region].filter(v => v && String(v).trim()).join(', ') || '—' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Family -->
          <div v-if="activeTab === 'family'" class="animate-fade-in">
            <p v-if="!parsedFamily.length" class="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-xl">
              No family members recorded.
            </p>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2.5 text-left font-bold text-gray-400 uppercase tracking-wider">Name</th>
                    <th class="px-4 py-2.5 text-left font-bold text-gray-400 uppercase tracking-wider">Age</th>
                    <th class="px-4 py-2.5 text-left font-bold text-gray-400 uppercase tracking-wider">Sex</th>
                    <th class="px-4 py-2.5 text-left font-bold text-gray-400 uppercase tracking-wider">Relationship</th>
                    <th class="px-4 py-2.5 text-left font-bold text-gray-400 uppercase tracking-wider">Education</th>
                    <th class="px-4 py-2.5 text-left font-bold text-gray-400 uppercase tracking-wider">Occupation</th>
                    <th class="px-4 py-2.5 text-right font-bold text-gray-400 uppercase tracking-wider">Income</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="(m, i) in parsedFamily" :key="i" class="hover:bg-gray-50 transition-colors">
                    <td class="px-4 py-3 font-medium">{{ m.name }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ m.age }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ m.sex }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ m.relationship }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ m.education }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ m.occupation }}</td>
                    <td class="px-4 py-3 text-right text-gray-600">{{ m.income ? '₱' + Number(m.income).toLocaleString()
                      : '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Case Info -->
      <div class="card p-6 mb-4">
        <h3 class="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ClipboardDocumentListIcon class="w-4 h-4 text-gray-400" /> Case Info
        </h3>
        <dl class="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
          <InfoItem label="CEFMU type" :value="caseData.cefmu_type" />
          <InfoItem label="Mode of admission" :value="caseData.admission_mode" />
          <InfoItem label="Date of intake" :value="fmtDate(caseData.date_intake)" />
          <InfoItem label="Referred by" :value="caseData.referred_by" />
          <InfoItem label="Referral date" :value="fmtDate(caseData.referral_date)" />
          <InfoItem label="Case Worker" :value="caseData.case_worker_email" />
          <InfoItem label="Date Closed" :value="fmtDate(caseData.date_closed)" />
        </dl>
      </div>

      <!-- Assessment -->
      <div class="card p-6 mb-4">
        <h3 class="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <DocumentTextIcon class="w-4 h-4 text-gray-400" /> Assessment
        </h3>
        <div class="space-y-4">
          <AssessmentItem label="Problem presented" :value="caseData.presenting_problem" />
          <AssessmentItem label="Initial assessment" :value="caseData.initial_assessment" />
          <AssessmentItem label="Plan of action" :value="caseData.plan_of_action" />
          <AssessmentItem label="Remarks" :value="caseData.remarks" />
        </div>
      </div>

      <!-- ═══ Progress Notes & MDT Transfer Timeline ═══ -->
      <div class="card p-6 mb-4">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 class="text-sm font-bold text-gray-800 flex items-center gap-2">
              <ClockIcon class="w-4 h-4 text-gray-400" />
              Progress Notes & MDT Transfers
            </h3>
            <p class="text-xs text-gray-400 mt-0.5">Case history, referrals to MDT members, and progress updates</p>
          </div>
          <button v-if="auth.isAdmin || auth.isCaseWorker" @click="showNoteForm = !showNoteForm"
            class="btn-primary text-xs py-2">
            <PlusIcon class="w-3.5 h-3.5" />
            {{ showNoteForm ? 'Cancel' : 'Add note' }}
          </button>
        </div>

        <!-- Add note form -->
        <Transition name="fade-slide">
          <div v-if="showNoteForm" class="note-form bg-gray-50 rounded-2xl border border-gray-100 p-5 mb-5 space-y-4">
            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider">{{ editingNoteId ? '✏️ Edit entry' :
              'New entry' }}</h4>

            <div class="grid grid-cols-2 gap-4">
              <!-- Note type -->
              <div>
                <label class="block text-xs font-semibold text-gray-500 mb-1.5">Note type <span
                    class="text-red-400">*</span></label>
                <select v-model="noteForm.note_type" class="input-base text-sm">
                  <option value="">— Select type —</option>
                  <option value="progress">📝 Progress Note</option>
                  <option value="referral">🔀 MDT Referral / Transfer</option>
                  <option value="follow_up">🔔 Follow-up</option>
                  <option value="closure">✅ Closure Note</option>
                </select>
              </div>
              <!-- Date -->
              <div>
                <label class="block text-xs font-semibold text-gray-500 mb-1.5">Date</label>
                <input v-model="noteForm.date_note" type="date" class="input-base text-sm" />
              </div>
            </div>

            <!-- MDT referral fields — show only for referral type -->
            <Transition name="fade-slide">
              <div v-if="noteForm.note_type === 'referral'"
                class="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                <p class="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                  <UserGroupIcon class="w-3.5 h-3.5" />
                  MDT Transfer Details
                </p>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 mb-1.5">Referred to (MDT member /
                      agency)</label>
                    <select v-model="noteForm.referred_to" class="input-base text-sm">
                      <option value="">— Select MDT member —</option>
                      <optgroup label="Internal MDT">
                        <option value="Social Worker">Social Worker</option>
                        <option value="Psychosocial Officer">Psychosocial Officer</option>
                        <option value="Medical Officer">Medical Officer / Nurse</option>
                        <option value="Legal Officer">Legal Officer</option>
                        <option value="Livelihood Officer">Livelihood Officer</option>
                        <option value="Case Manager">Case Manager</option>
                      </optgroup>
                      <optgroup label="External agencies">
                        <option value="LGU - SWDO">LGU - SWDO</option>
                        <option value="PNP - WCPD">PNP - WCPD</option>
                        <option value="DOH / Hospital">DOH / Hospital</option>
                        <option value="DepEd">DepEd</option>
                        <option value="DSWD Crisis Center">DSWD Crisis Center</option>
                        <option value="PAO">Public Attorney's Office (PAO)</option>
                        <option value="NCIP">NCIP (for IP cases)</option>
                        <option value="NGO Partner">NGO Partner</option>
                        <option value="Other">Other</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 mb-1.5">Purpose of referral</label>
                    <select v-model="noteForm.referral_purpose" class="input-base text-sm">
                      <option value="">— Select purpose —</option>
                      <option value="Psychosocial support">Psychosocial support</option>
                      <option value="Medical assistance">Medical assistance</option>
                      <option value="Legal assistance">Legal assistance</option>
                      <option value="Livelihood / skills training">Livelihood / skills training</option>
                      <option value="Educational assistance">Educational assistance</option>
                      <option value="Shelter / temporary placement">Shelter / temporary placement</option>
                      <option value="Financial assistance">Financial assistance</option>
                      <option value="Law enforcement">Law enforcement referral</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- Content -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1.5">
                {{ noteForm.note_type === 'referral' ? 'Reason / background for referral' : 'Note / update' }}
                <span class="text-red-400">*</span>
              </label>
              <textarea v-model="noteForm.content" rows="3" class="input-base resize-none text-sm" :placeholder="noteForm.note_type === 'referral'
                ? 'Describe the reason for MDT transfer and client\'s current situation…'
                : 'Document the progress, findings, or update for this entry…'" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-500 mb-1.5">Action taken</label>
                <textarea v-model="noteForm.action_taken" rows="2" class="input-base resize-none text-sm"
                  placeholder="What was done during this interaction…" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 mb-1.5">Next steps</label>
                <textarea v-model="noteForm.next_steps" rows="2" class="input-base resize-none text-sm"
                  placeholder="Planned follow-up actions…" />
              </div>
            </div>

            <div v-if="noteError" class="flex items-start gap-2 bg-red-50 px-3 py-2.5 rounded-xl">
              <span class="text-red-500 text-xs">⚠</span>
              <p class="text-xs text-red-700">{{ noteError }}</p>
            </div>

            <div class="flex gap-3 pt-1">
              <button @click="submitNote" :disabled="savingNote" class="btn-primary text-sm">
                <span v-if="savingNote"
                  class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {{ savingNote ? 'Saving…' : editingNoteId ? 'Update entry' : 'Save entry' }}
              </button>
              <button @click="showNoteForm = false; resetNoteForm()" class="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        </Transition>

        <!-- Notes timeline -->
        <div v-if="!caseData._notes?.length" class="text-sm text-gray-400 py-6 text-center bg-gray-50 rounded-xl">
          No progress notes yet. Add the first entry above.
        </div>

        <div v-else class="relative">
          <!-- Timeline line -->
          <div class="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100"></div>

          <div class="space-y-4">
            <div v-for="note in caseData._notes" :key="note.note_id" class="relative pl-12">
              <!-- Timeline dot -->
              <div class="absolute left-3.5 top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                :class="noteTypeStyle(note.note_type).dot"></div>

              <div class="card p-4 border-l-4" :class="noteTypeStyle(note.note_type).border">
                <!-- Note header -->
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-bold px-2.5 py-1 rounded-full"
                      :class="noteTypeStyle(note.note_type).badge">
                      {{ noteTypeLabel(note.note_type) }}
                    </span>
                    <!-- MDT transfer info -->
                    <span v-if="note.note_type === 'referral' && note.action_taken"
                      class="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <UserGroupIcon class="w-3 h-3" />
                      {{ note.action_taken }}
                    </span>
                  </div>
                  <div class="text-right flex-shrink-0 space-y-1">
                    <p class="text-xs font-semibold text-gray-500">{{ fmtDate(note.date_note) }}</p>
                    <p class="text-xs text-gray-400">{{ note.created_by }}</p>
                    <button v-if="auth.isAdmin || auth.isCaseWorker" @click="startEditNote(note)"
                      class="text-xs text-brand-600 hover:text-brand-800 font-semibold transition-colors">
                      Edit
                    </button>
                  </div>
                </div>

                <!-- Content -->
                <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">{{ note.content }}</p>

                <!-- Action taken / Next steps (repurposed for MDT) -->
                <div v-if="note.next_steps || (note.note_type !== 'referral' && note.action_taken)"
                  class="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
                  <div v-if="note.note_type !== 'referral' && note.action_taken">
                    <p class="text-xs font-semibold text-gray-400 mb-1">Action taken</p>
                    <p class="text-xs text-gray-600 whitespace-pre-wrap">{{ note.action_taken }}</p>
                  </div>
                  <div v-if="note.next_steps">
                    <p class="text-xs font-semibold text-gray-400 mb-1">Next steps</p>
                    <p class="text-xs text-gray-600 whitespace-pre-wrap">{{ note.next_steps }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Services provided -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold text-gray-800 flex items-center gap-2">
            <ClipboardDocumentListIcon class="w-4 h-4 text-gray-400" />
            Services provided
          </h3>
          <button v-if="auth.isAdmin || auth.isCaseWorker" @click="showServiceForm = true"
            class="btn-primary text-xs py-2">
            <PlusIcon class="w-3.5 h-3.5" /> Add service
          </button>
        </div>

        <p v-if="!caseData._services?.length" class="text-sm text-gray-400 py-6 text-center bg-gray-50 rounded-xl">
          No services recorded yet.
        </p>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-xs">
              <tr>
                <th class="px-4 py-2.5 text-left font-bold text-gray-400 uppercase tracking-wider">Service type</th>
                <th class="px-4 py-2.5 text-right font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                <th class="px-4 py-2.5 text-left font-bold text-gray-400 uppercase tracking-wider">Date provided</th>
                <th class="px-4 py-2.5 text-left font-bold text-gray-400 uppercase tracking-wider">Provided by</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="s in caseData._services" :key="s.service_id" class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 capitalize font-medium">{{ s.service_type }}</td>
                <td class="px-4 py-3 text-right font-semibold text-brand-700">₱{{ Number(s.amount).toLocaleString() }}
                </td>
                <td class="px-4 py-3 text-gray-500 text-xs">{{ fmtDate(s.date_provided) }}</td>
                <td class="px-4 py-3 text-gray-500 text-xs">{{ s.provided_by }}</td>
              </tr>
            </tbody>
          </table>
          <div class="flex justify-end pt-3 border-t border-gray-100 mt-2">
            <p class="text-sm">
              <span class="text-gray-400 mr-3">Total assistance:</span>
              <span class="font-extrabold text-brand-700 text-base">
                ₱{{caseData._services.reduce((s, r) => s + Number(r.amount || 0), 0).toLocaleString()}}
              </span>
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- Add service modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showServiceForm"
        class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in"
        @click.self="showServiceForm = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-fade-in-up">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-gray-900">Add service</h3>
            <button @click="showServiceForm = false" class="text-gray-400 hover:text-gray-600">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
          <SelectField label="Service type" v-model="svcForm.service_type"
            :options="['Medical', 'Financial', 'Funeral', 'Transportation', 'Legal', 'Psychosocial', 'Educational', 'Other']"
            required />
          <FormField label="Amount (₱)" v-model="svcForm.amount" type="number" />
          <FormField label="Date provided" v-model="svcForm.date_provided" type="date" />
          <div class="flex gap-3 pt-2">
            <button @click="submitService" :disabled="savingSvc" class="btn-primary flex-1 justify-center">
              <span v-if="savingSvc"
                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {{ savingSvc ? 'Saving…' : 'Add service' }}
            </button>
            <button @click="showServiceForm = false" class="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api, apiPost } from '@/services/api'
import FormField from '@/components/ui/FormField.vue'
import SelectField from '@/components/ui/SelectField.vue'
import InfoItem from '@/components/ui/InfoItem.vue'
import AssessmentItem from '@/components/ui/AssessmentItem.vue'
import {
  PencilIcon, PrinterIcon, ChevronLeftIcon, XMarkIcon,
  ArrowPathIcon, PlusIcon, ClipboardDocumentListIcon,
  DocumentTextIcon, ClockIcon, UserGroupIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const auth = useAuthStore()
const caseData = ref(null)
const loading = ref(true)
const activeTab = ref('personal')

const detailTabs = [
  { id: 'personal', label: '👤 Personal' },
  { id: 'address', label: '📍 Address' },
  { id: 'family', label: '👨‍👩‍👧 Family' },
]

// ── Services ──────────────────────────────────────────────────
const showServiceForm = ref(false)
const savingSvc = ref(false)
const svcForm = ref({ service_type: '', amount: '', date_provided: '' })

// ── Progress notes / MDT ─────────────────────────────────────
const showNoteForm = ref(false)
const savingNote = ref(false)
const noteError = ref(null)

const emptyNote = () => ({
  note_type: '',
  date_note: new Date().toISOString().slice(0, 10),
  content: '',
  action_taken: '',
  next_steps: '',
  referred_to: '',
  referral_purpose: '',
})
const noteForm = ref(emptyNote())

function resetNoteForm() { noteForm.value = emptyNote() }

const editingNoteId = ref(null)

function startEditNote(note) {
  editingNoteId.value = note.note_id
  const parts = (note.action_taken || '').split(' — ')
  noteForm.value = {
    note_type: note.note_type || '',
    date_note: String(note.date_note || '').slice(0, 10),
    content: note.content || '',
    action_taken: note.note_type === 'referral' ? '' : (note.action_taken || ''),
    next_steps: note.next_steps || '',
    referred_to: note.note_type === 'referral' ? (parts[0] || '') : '',
    referral_purpose: note.note_type === 'referral' ? (parts[1] || '') : '',
  }
  showNoteForm.value = true
  setTimeout(() => document.querySelector('.note-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
}

onMounted(async () => {
  caseData.value = await api('getCase', { case_id: route.params.id })
  loading.value = false
})

const parsedFamily = computed(() => {
  if (!caseData.value) return []
  if (Array.isArray(caseData.value._family) && caseData.value._family.length) {
    return caseData.value._family
  }
  if (caseData.value.family_members) {
    try { return JSON.parse(caseData.value.family_members) } catch { return [] }
  }
  return []
})

function classColor(cls) {
  return { child: 'bg-blue-50 text-blue-700', pwd: 'bg-purple-50 text-purple-700' }[cls] || 'bg-gray-100 text-gray-600'
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-PH', { dateStyle: 'medium' }) : '—'
}

function noteTypeLabel(type) {
  return { progress: '📝 Progress Note', referral: '🔀 MDT Referral', follow_up: '🔔 Follow-up', closure: '✅ Closure' }[type] || type
}

function noteTypeStyle(type) {
  const styles = {
    progress: { dot: 'bg-brand-500', border: 'border-brand-200', badge: 'bg-brand-50 text-brand-700' },
    referral: { dot: 'bg-blue-500', border: 'border-blue-200', badge: 'bg-blue-50 text-blue-700' },
    follow_up: { dot: 'bg-amber-500', border: 'border-amber-200', badge: 'bg-amber-50 text-amber-700' },
    closure: { dot: 'bg-green-500', border: 'border-green-200', badge: 'bg-green-50 text-green-700' },
  }
  return styles[type] || styles.progress
}

function printCase() { window.print() }

async function closeCase() {
  if (!confirm('Are you sure you want to close this case?')) return
  await apiPost('closeCase', { case_id: route.params.id })
  caseData.value.status = 'closed'
  caseData.value.date_closed = new Date().toISOString()
}

async function reopenCase() {
  if (!confirm('Reopen this case?')) return
  await apiPost('reopenCase', { case_id: route.params.id })
  caseData.value.status = 'active'
  caseData.value.date_closed = ''
}

async function submitService() {
  if (!svcForm.value.service_type) return
  savingSvc.value = true
  try {
    await apiPost('addService', { case_id: route.params.id, ...svcForm.value })
    caseData.value = await api('getCase', { case_id: route.params.id })
    showServiceForm.value = false
    svcForm.value = { service_type: '', amount: '', date_provided: '' }
  } finally { savingSvc.value = false }
}

async function submitNote() {
  noteError.value = null
  if (!noteForm.value.note_type) { noteError.value = 'Please select a note type.'; return }
  if (!noteForm.value.content) { noteError.value = 'Please enter a note or update.'; return }

  savingNote.value = true
  try {
    const payload = {
      case_id: route.params.id,
      note_type: noteForm.value.note_type,
      date_note: noteForm.value.date_note,
      content: noteForm.value.content,
      action_taken: noteForm.value.note_type === 'referral'
        ? [noteForm.value.referred_to, noteForm.value.referral_purpose].filter(Boolean).join(' — ')
        : noteForm.value.action_taken,
      next_steps: noteForm.value.next_steps,
    }
    if (editingNoteId.value) {
      await apiPost('updateNote', { note_id: editingNoteId.value, ...payload })
      editingNoteId.value = null
    } else {
      await apiPost('addNote', payload)
    }
    caseData.value = await api('getCase', { case_id: route.params.id })
    showNoteForm.value = false
    resetNoteForm()
  } catch (e) {
    noteError.value = e.message
  } finally {
    savingNote.value = false
  }
}
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>