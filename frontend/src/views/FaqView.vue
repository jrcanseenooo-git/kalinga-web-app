<template>
  <div class="min-h-screen bg-gray-50 pb-16">

    <!-- Hero -->
    <div class="sidebar-bg text-white">
      <div class="max-w-4xl mx-auto px-6 py-10">
        <div class="flex items-center gap-4 mb-5">
          <img src="/logo-white.png" alt="Kalinga" class="h-10 w-auto" />
          <div class="border-l border-white/20 pl-4">
            <p class="text-white/50 text-xs font-bold uppercase tracking-widest">DSWD Kalinga Program</p>
            <p class="text-white font-bold text-sm">Help Center & FAQ</p>
          </div>
        </div>
        <h1 class="text-2xl font-extrabold text-white mb-2">Frequently Asked Questions</h1>
        <p class="text-white/60 text-sm max-w-2xl">
          Everything you need to know about CEFMU, the Kalinga Program, and how to use this registry system.
        </p>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-6 mt-8 space-y-6">

      <!-- Search -->
      <div class="relative">
        <MagnifyingGlassIcon class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input v-model="search" type="search"
          placeholder="Search questions…"
          class="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" />
      </div>

      <!-- Category tabs -->
      <div class="flex gap-2 flex-wrap">
        <button v-for="cat in categories" :key="cat"
          @click="activeCategory = cat"
          class="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
          :class="activeCategory === cat
            ? 'bg-brand-600 text-white border-brand-600'
            : 'bg-white text-gray-500 border-gray-200 hover:border-brand-400 hover:text-brand-600'">
          {{ cat }}
        </button>
      </div>

      <!-- FAQ items -->
      <div v-if="filtered.length" class="space-y-3">
        <div v-for="(faq, i) in filtered" :key="i" class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <button
            class="w-full flex items-start justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            @click="toggle(i)">
            <div class="flex items-start gap-3 flex-1 min-w-0 pr-4">
              <span class="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                :class="open === i ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'">
                {{ open === i ? '−' : '+' }}
              </span>
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ faq.q }}</p>
                <span class="text-xs font-medium mt-0.5 inline-block" :class="catColor(faq.category)">{{ faq.category }}</span>
              </div>
            </div>
          </button>
          <Transition name="fade">
            <div v-if="open === i" class="px-5 pb-5 ml-9">
              <div class="text-sm text-gray-600 leading-relaxed space-y-2" v-html="faq.a"></div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- No results -->
      <div v-else class="bg-white rounded-2xl border p-12 text-center">
        <QuestionMarkCircleIcon class="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p class="text-sm font-semibold text-gray-400">No questions found for "{{ search }}"</p>
        <button @click="search = ''; activeCategory = 'All'" class="text-xs text-brand-600 hover:underline mt-2">Clear search</button>
      </div>

      <!-- Legal & Contact -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-brand-50 border border-brand-100 rounded-2xl p-5 flex items-start gap-4">
          <div class="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
            <ChatBubbleLeftRightIcon class="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-brand-900 mb-1">Need more help?</h3>
            <p class="text-xs text-brand-700 leading-relaxed">
              Contact the DSWD Kalinga Program technical team or your regional Field Office for system access, account issues, or data corrections.
            </p>
          </div>
        </div>
        <div class="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4">
          <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheckIcon class="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-amber-900 mb-1">Data privacy</h3>
            <p class="text-xs text-amber-800 leading-relaxed">
              All case information is confidential and protected under the Data Privacy Act of 2012 (RA 10173). Only authorized DSWD personnel may access client records.
            </p>
          </div>
        </div>
      </div>

      <!-- Back link -->
      <div class="text-center pt-2 pb-4">
        <RouterLink to="/public" class="text-xs text-brand-600 hover:underline font-semibold">← Back to Public Dashboard</RouterLink>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { MagnifyingGlassIcon, QuestionMarkCircleIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'

const search         = ref('')
const open           = ref(null)
const activeCategory = ref('All')

function toggle(i) { open.value = open.value === i ? null : i }

function catColor(cat) {
  const map = {
    'About CEFMU':        'text-red-500',
    'Kalinga Program':    'text-brand-500',
    'Case management':    'text-blue-500',
    'Services & support': 'text-green-500',
    'Data & privacy':     'text-amber-500',
    'System & access':    'text-purple-500',
    'Legal basis':        'text-gray-500',
  }
  return map[cat] || 'text-gray-400'
}

const faqs = [
  // ── About CEFMU ──────────────────────────────────────────
  {
    category: 'About CEFMU',
    q: 'What does CEFMU stand for?',
    a: '<strong>CEFMU</strong> stands for <strong>Children in Early and/or Forced Marriage and Union</strong>. It refers to situations where children — persons below 18 years of age — enter into formal or informal marriages or unions, whether voluntarily or through coercion, force, or circumstances beyond their control.',
  },
  {
    category: 'About CEFMU',
    q: 'What is child marriage?',
    a: 'Child marriage is a formal marriage or informal union where at least one party is under 18 years of age. In the Philippines, it is prohibited under Republic Act No. 11596 (Prohibition of Child Marriage Act of 2021), which declares all marriages involving a child as void from the beginning and imposes penalties on those who facilitate such marriages.',
  },
  {
    category: 'About CEFMU',
    q: 'What is an early union?',
    a: 'An early union refers to an informal cohabitation or live-in arrangement between a child (below 18) and another person, without a formal marriage ceremony. These are also covered under the CEFMU mandate and must be reported and documented by social workers.',
  },
  {
    category: 'About CEFMU',
    q: 'What is a forced marriage?',
    a: 'A forced marriage occurs when one or both parties do not give their full, free, and informed consent. This includes marriages arranged by family members, marriages resulting from economic pressure, bride price arrangements, or situations where a child has no real choice. It is a form of gender-based violence and a violation of human rights.',
  },
  {
    category: 'About CEFMU',
    q: 'What other cases are classified under CEFMU?',
    a: 'The CEFMU registry covers the following case types:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li><strong>Child marriage</strong> — formal marriage involving a minor</li><li><strong>Early union</strong> — informal cohabitation involving a minor</li><li><strong>Forced marriage</strong> — marriage without genuine consent</li><li><strong>Teenage pregnancy</strong> — pregnancy in girls below 18</li><li><strong>Child abuse</strong> — physical, sexual, psychological, or economic abuse</li><li><strong>Child labor</strong> — children engaged in work that deprives them of childhood and education</li><li><strong>Child trafficking</strong> — recruitment, transport, or receipt of children for exploitation</li></ul>',
  },
  {
    category: 'About CEFMU',
    q: 'Who are considered children under Philippine law?',
    a: 'Under Philippine law, a <strong>child</strong> is any person below 18 years of age, or older persons who are unable to fully take care of or protect themselves due to physical or mental disability. Republic Act No. 7610 (Special Protection of Children) is the primary law protecting children from all forms of abuse, exploitation, and discrimination.',
  },
  {
    category: 'About CEFMU',
    q: 'What laws protect children from child marriage in the Philippines?',
    a: 'Key laws include:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li><strong>RA 11596</strong> — Prohibition of Child Marriage Act (2021)</li><li><strong>RA 7610</strong> — Special Protection of Children Against Abuse, Exploitation and Discrimination Act</li><li><strong>RA 9262</strong> — Anti-Violence Against Women and Their Children Act</li><li><strong>RA 10364</strong> — Expanded Anti-Trafficking in Persons Act</li><li><strong>RA 9208</strong> — Anti-Trafficking in Persons Act</li><li>The <strong>Family Code of the Philippines</strong> (Executive Order 209) which sets the minimum age for marriage at 18</li></ul>',
  },
  {
    category: 'About CEFMU',
    q: 'Why is CEFMU harmful to children?',
    a: 'CEFMU — particularly child and forced marriage — has severe consequences:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li>Interrupts or ends children\'s education</li><li>Increases risk of domestic violence and abuse</li><li>Leads to early and repeated pregnancies, endangering health</li><li>Perpetuates cycles of poverty</li><li>Strips children of their childhood and autonomy</li><li>Causes long-term psychological trauma</li><li>Disproportionately affects girls, particularly in indigenous communities</li></ul>',
  },

  // ── Kalinga Program ──────────────────────────────────────
  {
    category: 'Kalinga Program',
    q: 'What is the DSWD Kalinga Program?',
    a: 'The <strong>Kalinga Program</strong> is a DSWD initiative focused on the protection and welfare of children in especially difficult circumstances. It aims to prevent, identify, and respond to cases of CEFMU and other forms of child abuse and exploitation across the Philippines, beginning with pilot areas.',
  },
  {
    category: 'Kalinga Program',
    q: 'What does "Kalinga" mean?',
    a: '"Kalinga" is a Filipino word meaning <strong>care</strong>, <strong>concern</strong>, or <strong>nurturing</strong>. The program name reflects the DSWD\'s commitment to caring for and protecting vulnerable children from exploitation and abuse, particularly those affected by early and forced marriage.',
  },
  {
    category: 'Kalinga Program',
    q: 'What is the CEFMU Registry and Dashboard System?',
    a: 'This system is the official digital registry for the Kalinga Program. It allows DSWD social workers and field office staff to:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li>Record and manage CEFMU case intakes</li><li>Track interventions and services provided to clients</li><li>Monitor case status (active/closed)</li><li>Generate reports and statistical dashboards by region and province</li><li>Coordinate across Field Offices and LGUs</li></ul>',
  },
  {
    category: 'Kalinga Program',
    q: 'Is the system available to the public?',
    a: 'The <strong>Public Dashboard</strong> (this page) is accessible to anyone without login and shows only aggregate statistics — total cases, case type breakdowns, and regional distribution. No client names, personal details, or identifying information are shown publicly.<br><br>Case management features require authorized login and are restricted to DSWD staff and LGU partners.',
  },
  {
    category: 'Kalinga Program',
    q: 'What pilot areas does the Kalinga Program currently cover?',
    a: 'The system is currently in its pilot phase. Coverage areas are being expanded progressively. The Public Dashboard includes a disclaimer that figures shown are from pilot areas and may not reflect the complete national picture. Contact your DSWD Regional Office for the current list of covered areas.',
  },

  // ── Case management ──────────────────────────────────────
  {
    category: 'Case management',
    q: 'What is the General Intake Sheet (GIS)?',
    a: 'The General Intake Sheet is the primary case intake form used by DSWD social workers when a CEFMU case is first received. It captures:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li>Client identifying information (name, birthdate, sex, civil status, religion, IP group, education)</li><li>Present and permanent address</li><li>CEFMU case classification and type</li><li>Mode of admission and referral details</li><li>Family composition</li><li>Social worker\'s assessment and plan of action</li></ul>The GIS is equivalent to Annex A of the eSCMS case documentation standards.',
  },
  {
    category: 'Case management',
    q: 'What are the modes of admission for a case?',
    a: 'A CEFMU case can be admitted through:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li><strong>Walk-in</strong> — client or family comes to the DSWD office directly</li><li><strong>Referral</strong> — referred by another agency, LGU, NGO, or person</li><li><strong>Outreach</strong> — identified during community outreach activities</li><li><strong>Online</strong> — reported through online channels</li><li><strong>Phone</strong> — reported via phone call</li></ul>',
  },
  {
    category: 'Case management',
    q: 'What is a case status and what do active/closed mean?',
    a: '<strong>Active</strong> — the case is ongoing, with the social worker actively providing interventions, monitoring, and support to the client.<br><br><strong>Closed</strong> — the case has been resolved, interventions are complete, or the client no longer requires services. Closed cases remain in the registry for documentation and reporting purposes and can be reopened if circumstances change.',
  },
  {
    category: 'Case management',
    q: 'What is included in the family composition section?',
    a: 'The family composition section documents each household member of the client\'s family, including their name, birthdate, age, sex, relationship to the client, highest educational attainment, occupation, and monthly income. This information helps the social worker assess the family\'s overall situation and economic capacity.',
  },
  {
    category: 'Case management',
    q: 'What is the difference between present address and permanent address?',
    a: '<strong>Present address</strong> — where the client is currently living at the time of intake. This may be a temporary location such as a shelter, relative\'s home, or the social worker\'s office area.<br><br><strong>Permanent address</strong> — the client\'s home province, municipality, and barangay of origin. Many CEFMU clients have relocated, and the permanent address helps identify geographic patterns and coordinate with local authorities.',
  },
  {
    category: 'Case management',
    q: 'What does "IP category" mean in the intake form?',
    a: '<strong>IP</strong> stands for <strong>Indigenous Peoples</strong>. CEFMU cases among indigenous communities are tracked separately because child marriage and early union practices can be more prevalent in certain indigenous groups due to cultural traditions. Identifying IP affiliation helps DSWD tailor interventions appropriately and coordinate with the National Commission on Indigenous Peoples (NCIP).',
  },
  {
    category: 'Case management',
    q: 'What is the AICS Form No.?',
    a: 'The <strong>AICS Form No.</strong> (Assistance to Individuals in Crisis Situation) is the reference number from the DSWD\'s AICS program if the client is also receiving crisis assistance. Not all CEFMU cases have an AICS number — it is optional and applies only when the client is receiving AICS services alongside case management.',
  },

  // ── Services & support ───────────────────────────────────
  {
    category: 'Services & support',
    q: 'What services can be provided to CEFMU clients?',
    a: 'The system tracks the following types of assistance provided to clients:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li><strong>Medical assistance</strong> — health services, medical referrals</li><li><strong>Financial assistance</strong> — emergency cash assistance, livelihood support</li><li><strong>Funeral assistance</strong> — for cases involving death</li><li><strong>Transportation assistance</strong> — travel support for medical or legal appointments</li><li><strong>Legal assistance</strong> — legal aid, court accompaniment, filing of cases</li><li><strong>Psychosocial support</strong> — counseling, therapy, mental health services</li></ul>',
  },
  {
    category: 'Services & support',
    q: 'What is psychosocial support and why is it important for CEFMU clients?',
    a: 'Psychosocial support covers counseling, psychological first aid, and mental health services provided to clients and their families. CEFMU clients — especially victims of child marriage, forced marriage, and abuse — often experience trauma, depression, anxiety, and social stigma. Psychosocial support helps them heal, rebuild confidence, and make informed decisions about their situation.',
  },
  {
    category: 'Services & support',
    q: 'What is a progress note?',
    a: 'A progress note is a record of ongoing interactions and updates on a case after the initial intake. Social workers use progress notes to document:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li>Follow-up visits and client updates</li><li>New developments in the case</li><li>Services provided and their outcomes</li><li>Referrals made to other agencies</li><li>Next steps and action plans</li></ul>Progress notes types include: Progress Note, Follow-up, Referral Note, and Closure Note.',
  },

  // ── Data & privacy ───────────────────────────────────────
  {
    category: 'Data & privacy',
    q: 'Is client information kept confidential?',
    a: 'Yes. All CEFMU case records are strictly confidential. Access is restricted to authorized DSWD social workers and administrators based on their assigned role and geographic scope. The Public Dashboard shows only aggregate statistics — no client names, addresses, or personal details are ever displayed publicly.',
  },
  {
    category: 'Data & privacy',
    q: 'What law protects the privacy of client data?',
    a: 'Client data is protected under:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li><strong>Republic Act No. 10173</strong> — Data Privacy Act of 2012</li><li><strong>DSWD Administrative Order</strong> on confidentiality of social case records</li></ul>Unauthorized disclosure of client information is a violation of law and DSWD policy.',
  },
  {
    category: 'Data & privacy',
    q: 'Who can access the case records?',
    a: 'Access is role-based:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li><strong>Admin</strong> — all cases nationwide</li><li><strong>Field Office User</strong> — cases within their assigned region</li><li><strong>LGU Supervisor</strong> — cases within their assigned province</li><li><strong>CPU Monitor</strong> — read-only access to cases in their LGU</li><li><strong>Case Worker</strong> — only the cases they personally handle</li></ul>',
  },
  {
    category: 'Data & privacy',
    q: 'How long are case records retained?',
    a: 'Case records are retained in accordance with DSWD records management policies. Generally, social case records are kept for a minimum period as prescribed by law and agency guidelines. Contact your records management officer for specific retention schedules applicable to your office.',
  },

  // ── System & access ──────────────────────────────────────
  {
    category: 'System & access',
    q: 'How do I log in to the CEFMU Registry?',
    a: 'Two login methods are available:<br><br><strong>Google (DSWD staff):</strong> Use your official DSWD Google Workspace account (@dswd.gov.ph). Click "Continue with Google" on the login page.<br><br><strong>Email & Password (LGU partners):</strong> Use the email and temporary password provided by your system administrator. You will be prompted to change your password on first login.',
  },
  {
    category: 'System & access',
    q: 'My account is locked. What do I do?',
    a: 'Accounts are temporarily locked for 15 minutes after 5 consecutive failed login attempts. Wait 15 minutes and try again. If you cannot remember your password, contact your system administrator to reset it.',
  },
  {
    category: 'System & access',
    q: 'Why can I only see some cases and not all?',
    a: 'Your view is filtered based on your assigned role and geographic scope. A case worker only sees their own cases. A Field Office User sees all cases in their region. An LGU Supervisor sees all cases in their province. This is by design to protect client confidentiality and ensure data is handled only by those with appropriate jurisdiction.',
  },
  {
    category: 'System & access',
    q: 'The system shows an error when I save a case. What should I do?',
    a: 'Try the following:<br><ol class="list-decimal ml-4 mt-2 space-y-1"><li>Check that all required fields (marked with *) are filled in</li><li>Ensure you have a stable internet connection</li><li>Refresh the page and try again</li><li>If the error persists, take a screenshot of the error message and report it to your system administrator</li></ol>',
  },

  // ── Legal basis ──────────────────────────────────────────
  {
    category: 'Legal basis',
    q: 'What is Republic Act 11596?',
    a: '<strong>RA 11596</strong>, the <strong>Prohibition of Child Marriage Act of 2021</strong>, is the landmark law that expressly prohibits child marriage in the Philippines. Key provisions:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li>All marriages involving a child are void from the beginning</li><li>Persons who cause, fix, facilitate, or arrange child marriages face imprisonment of 6–12 years</li><li>Government officials who solemnize child marriages face higher penalties</li><li>Requires DSWD and LGUs to provide services to victims</li><li>Mandates reporting of child marriage cases to authorities</li></ul>',
  },
  {
    category: 'Legal basis',
    q: 'Are there exceptions to the prohibition on child marriage under RA 11596?',
    a: 'No. Republic Act 11596 removes all exceptions previously found under the Family Code and other laws, including the exception that allowed marriage for girls aged 12 and above under Muslim Personal Law. The prohibition is absolute — no child under 18 may legally marry under Philippine law regardless of religion, custom, or parental consent.',
  },
  {
    category: 'Legal basis',
    q: 'What should I do if I encounter or witness a CEFMU case?',
    a: 'If you encounter a CEFMU situation:<br><ol class="list-decimal ml-4 mt-2 space-y-1"><li>Report it to the nearest DSWD Field Office or Social Welfare and Development Office (SWDO) of the local government</li><li>You may also report to the barangay for immediate intervention</li><li>For emergencies, contact the Philippine National Police (PNP) or the Bantay Bata hotline: <strong>163</strong></li><li>DSWD also operates the DSWD Action Center hotline</li></ol>Reporting is mandated for certain professionals (teachers, health workers, social workers) under RA 7610.',
  },
]

const categories = ['All', ...new Set(faqs.map(f => f.category))]

const filtered = computed(() => {
  let data = faqs
  if (activeCategory.value !== 'All') {
    data = data.filter(f => f.category === activeCategory.value)
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    data = data.filter(f =>
      f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
    )
  }
  return data
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>