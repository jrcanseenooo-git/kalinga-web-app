<template>
  <div class="faq-page">

    <!-- ── Hero ─────────────────────────────────────────────── -->
    <header class="faq-hero">
      <div class="hero-noise"></div>
      <div class="hero-inner">
        <div class="hero-brand">
          <img src="/logo-white.png" alt="Kalinga" class="hero-logo" />
          <div class="hero-brand-sep"></div>
          <div>
            <p class="hero-program">DSWD Kalinga Program</p>
            <p class="hero-subtitle">Help Center &amp; FAQ</p>
          </div>
        </div>
        <div class="hero-content">
          <div class="hero-tag">
            <span class="hero-tag-dot"></span>
            <span>Knowledge Base</span>
          </div>
          <h1 class="hero-title">Frequently<br>Asked <em>Questions</em></h1>
          <p class="hero-desc">
            Everything you need to know about CEFMU, the Kalinga Program,
            and how to use this registry system.
          </p>
          <!-- Hero search -->
          <div class="hero-search-wrap">
            <MagnifyingGlassIcon class="hero-search-icon" />
            <input
              v-model="search"
              type="search"
              placeholder="Search questions…"
              class="hero-search"
            />
            <span v-if="search" class="hero-search-count">
              {{ filtered.length }} result{{ filtered.length !== 1 ? 's' : '' }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- ── Body ──────────────────────────────────────────────── -->
    <div class="faq-body">

      <!-- Left sidebar: categories -->
      <aside class="faq-sidebar">
        <p class="sidebar-label">Categories</p>
        <nav class="sidebar-nav">
          <button
            v-for="cat in categories"
            :key="cat.name"
            @click="activeCategory = cat.name; open = null"
            class="sidebar-btn"
            :class="{ active: activeCategory === cat.name }"
          >
            <span class="sidebar-btn-icon" :style="{ background: cat.color + '18', color: cat.color }">
              <component :is="cat.icon" class="w-3.5 h-3.5" />
            </span>
            <span class="sidebar-btn-label">{{ cat.name }}</span>
            <span class="sidebar-btn-count">{{ cat.count }}</span>
          </button>
        </nav>

        <!-- Bottom info cards -->
        <div class="sidebar-cards">
          <div class="sidebar-card sidebar-card--purple">
            <ChatBubbleLeftRightIcon class="sidebar-card-icon" />
            <div>
              <p class="sidebar-card-title">Need help?</p>
              <p class="sidebar-card-body">Contact your DSWD Regional Field Office for account issues or data corrections.</p>
            </div>
          </div>
          <div class="sidebar-card sidebar-card--amber">
            <ShieldCheckIcon class="sidebar-card-icon" />
            <div>
              <p class="sidebar-card-title">Data privacy</p>
              <p class="sidebar-card-body">All case records are confidential under RA 10173 (Data Privacy Act of 2012).</p>
            </div>
          </div>
        </div>

        <div class="sidebar-back">
          <RouterLink to="/public">
            <ArrowLeftIcon class="w-3.5 h-3.5" />
            Back to Public Dashboard
          </RouterLink>
        </div>
      </aside>

      <!-- Right: FAQ list -->
      <main class="faq-main">

        <!-- Active category header -->
        <div class="faq-main-header" v-if="!search">
          <div class="faq-main-header-icon"
            :style="{ background: activeCat?.color + '18', color: activeCat?.color }">
            <component :is="activeCat?.icon" class="w-5 h-5" />
          </div>
          <div>
            <h2 class="faq-main-title">{{ activeCategory }}</h2>
            <p class="faq-main-meta">{{ filtered.length }} question{{ filtered.length !== 1 ? 's' : '' }}</p>
          </div>
        </div>
        <div class="faq-search-header" v-else>
          <MagnifyingGlassIcon class="w-4 h-4 text-gray-400" />
          <span>Results for <strong>"{{ search }}"</strong></span>
          <button @click="search = ''" class="faq-search-clear">Clear</button>
        </div>

        <!-- FAQ accordion -->
        <div v-if="filtered.length" class="faq-list">
          <div
            v-for="(faq, i) in filtered"
            :key="i"
            class="faq-item"
            :class="{ 'faq-item--open': open === i }"
          >
            <button class="faq-q" @click="toggle(i)">
              <span class="faq-q-num">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="faq-q-text">{{ faq.q }}</span>
              <span class="faq-q-cat" v-if="search" :style="{ color: catMeta(faq.category)?.color }">
                {{ faq.category }}
              </span>
              <span class="faq-chevron" :class="{ 'faq-chevron--open': open === i }">
                <ChevronDownIcon class="w-4 h-4" />
              </span>
            </button>
            <Transition name="faq-answer">
              <div v-if="open === i" class="faq-a">
                <div class="faq-a-inner" v-html="faq.a"></div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- No results -->
        <div v-else class="faq-empty">
          <div class="faq-empty-icon">
            <QuestionMarkCircleIcon class="w-8 h-8" />
          </div>
          <p class="faq-empty-title">No results found</p>
          <p class="faq-empty-sub">No questions match <em>"{{ search }}"</em></p>
          <button @click="search = ''; activeCategory = 'All'" class="faq-empty-reset">
            Clear search
          </button>
        </div>

      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  MagnifyingGlassIcon, QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon, ShieldCheckIcon,
  ArrowLeftIcon, ChevronDownIcon,
  InformationCircleIcon, HeartIcon, FolderOpenIcon,
  WrenchScrewdriverIcon, LockClosedIcon, ComputerDesktopIcon, ScaleIcon
} from '@heroicons/vue/24/outline'

const search         = ref('')
const open           = ref(null)
const activeCategory = ref('All')

function toggle(i) { open.value = open.value === i ? null : i }

const CAT_META = [
  { name: 'All',                icon: InformationCircleIcon, color: '#8D5FCC' },
  { name: 'About CEFMU',        icon: InformationCircleIcon, color: '#e55353' },
  { name: 'Kalinga Program',    icon: HeartIcon,             color: '#8D5FCC' },
  { name: 'Case management',    icon: FolderOpenIcon,        color: '#3b82f6' },
  { name: 'Services & support', icon: WrenchScrewdriverIcon, color: '#10b981' },
  { name: 'Data & privacy',     icon: LockClosedIcon,        color: '#f59e0b' },
  { name: 'System & access',    icon: ComputerDesktopIcon,   color: '#8b5cf6' },
  { name: 'Legal basis',        icon: ScaleIcon,             color: '#64748b' },
]

function catMeta(name) { return CAT_META.find(c => c.name === name) }
const activeCat = computed(() => catMeta(activeCategory.value))

const faqs = [
  // ── About CEFMU ──────────────────────────────────────────
  { category: 'About CEFMU', q: 'What does CEFMU stand for?', a: '<strong>CEFMU</strong> stands for <strong>Children in Early and/or Forced Marriage and Union</strong>. It refers to situations where children - persons below 18 years of age - enter into formal or informal marriages or unions, whether voluntarily or through coercion, force, or circumstances beyond their control.' },
  { category: 'About CEFMU', q: 'What is child marriage?', a: 'Child marriage is a formal marriage or informal union where at least one party is under 18 years of age. In the Philippines, it is prohibited under Republic Act No. 11596 (Prohibition of Child Marriage Act of 2021), which declares all marriages involving a child as void from the beginning and imposes penalties on those who facilitate such marriages.' },
  { category: 'About CEFMU', q: 'What is an early union?', a: 'An early union refers to an informal cohabitation or live-in arrangement between a child (below 18) and another person, without a formal marriage ceremony. These are also covered under the CEFMU mandate and must be reported and documented by social workers.' },
  { category: 'About CEFMU', q: 'What is a forced marriage?', a: 'A forced marriage occurs when one or both parties do not give their full, free, and informed consent. This includes marriages arranged by family members, marriages resulting from economic pressure, bride price arrangements, or situations where a child has no real choice. It is a form of gender-based violence and a violation of human rights.' },
  { category: 'About CEFMU', q: 'What other cases are classified under CEFMU?', a: 'The CEFMU registry covers the following case types:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li><strong>Child marriage</strong> - formal marriage involving a minor</li><li><strong>Early union</strong> - informal cohabitation involving a minor</li><li><strong>Forced marriage</strong> - marriage without genuine consent</li><li><strong>Teenage pregnancy</strong> - pregnancy in girls below 18</li><li><strong>Child abuse</strong> - physical, sexual, psychological, or economic abuse</li><li><strong>Child labor</strong> - children engaged in work that deprives them of childhood and education</li><li><strong>Child trafficking</strong> - recruitment, transport, or receipt of children for exploitation</li></ul>' },
  { category: 'About CEFMU', q: 'Who are considered children under Philippine law?', a: 'Under Philippine law, a <strong>child</strong> is any person below 18 years of age, or older persons who are unable to fully take care of or protect themselves due to physical or mental disability. Republic Act No. 7610 (Special Protection of Children) is the primary law protecting children from all forms of abuse, exploitation, and discrimination.' },
  { category: 'About CEFMU', q: 'What laws protect children from child marriage in the Philippines?', a: 'Key laws include:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li><strong>RA 11596</strong> - Prohibition of Child Marriage Act (2021)</li><li><strong>RA 7610</strong> - Special Protection of Children Against Abuse, Exploitation and Discrimination Act</li><li><strong>RA 9262</strong> - Anti-Violence Against Women and Their Children Act</li><li><strong>RA 10364</strong> - Expanded Anti-Trafficking in Persons Act</li><li><strong>RA 9208</strong> - Anti-Trafficking in Persons Act</li><li>The <strong>Family Code of the Philippines</strong> (Executive Order 209) which sets the minimum age for marriage at 18</li></ul>' },
  { category: 'About CEFMU', q: 'Why is CEFMU harmful to children?', a: 'CEFMU - particularly child and forced marriage - has severe consequences:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li>Interrupts or ends children\'s education</li><li>Increases risk of domestic violence and abuse</li><li>Leads to early and repeated pregnancies, endangering health</li><li>Perpetuates cycles of poverty</li><li>Strips children of their childhood and autonomy</li><li>Causes long-term psychological trauma</li><li>Disproportionately affects girls, particularly in indigenous communities</li></ul>' },
  // ── Kalinga Program ──────────────────────────────────────
  { category: 'Kalinga Program', q: 'What is the DSWD Kalinga Program?', a: 'The <strong>Kalinga Program</strong> is a DSWD initiative focused on the protection and welfare of children in especially difficult circumstances. It aims to prevent, identify, and respond to cases of CEFMU and other forms of child abuse and exploitation across the Philippines, beginning with pilot areas.' },
  { category: 'Kalinga Program', q: 'What does "Kalinga" mean?', a: '"Kalinga" is a Filipino word meaning <strong>care</strong>, <strong>concern</strong>, or <strong>nurturing</strong>. The program name reflects the DSWD\'s commitment to caring for and protecting vulnerable children from exploitation and abuse, particularly those affected by early and forced marriage.' },
  { category: 'Kalinga Program', q: 'What is the CEFMU Registry and Dashboard System?', a: 'This system is the official digital registry for the Kalinga Program. It allows DSWD social workers and field office staff to:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li>Record and manage CEFMU case intakes</li><li>Track interventions and services provided to clients</li><li>Monitor case status (active/closed)</li><li>Generate reports and statistical dashboards by region and province</li><li>Coordinate across Field Offices and LGUs</li></ul>' },
  { category: 'Kalinga Program', q: 'Is the system available to the public?', a: 'The <strong>Public Dashboard</strong> is accessible to anyone without login and shows only aggregate statistics - total cases, case type breakdowns, and regional distribution. No client names, personal details, or identifying information are shown publicly.<br><br>Case management features require authorized login and are restricted to DSWD staff and LGU partners.' },
  { category: 'Kalinga Program', q: 'What pilot areas does the Kalinga Program currently cover?', a: 'The system is currently in its pilot phase. Coverage areas are being expanded progressively. The Public Dashboard includes a disclaimer that figures shown are from pilot areas and may not reflect the complete national picture. Contact your DSWD Regional Office for the current list of covered areas.' },
  // ── Case management ──────────────────────────────────────
  { category: 'Case management', q: 'What is the General Intake Sheet (GIS)?', a: 'The General Intake Sheet is the primary case intake form used by DSWD social workers when a CEFMU case is first received. It captures:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li>Client identifying information (name, birthdate, sex, civil status, religion, IP group, education)</li><li>Present and permanent address</li><li>CEFMU case classification and type</li><li>Mode of admission and referral details</li><li>Family composition</li><li>Social worker\'s assessment and plan of action</li></ul>The GIS is equivalent to Annex A of the eSCMS case documentation standards.' },
  { category: 'Case management', q: 'What are the modes of admission for a case?', a: 'A CEFMU case can be admitted through:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li><strong>Walk-in</strong> - client or family comes to the DSWD office directly</li><li><strong>Referral</strong> - referred by another agency, LGU, NGO, or person</li><li><strong>Outreach</strong> - identified during community outreach activities</li><li><strong>Online</strong> - reported through online channels</li><li><strong>Phone</strong> - reported via phone call</li></ul>' },
  { category: 'Case management', q: 'What is a case status and what do active/closed mean?', a: '<strong>Active</strong> - the case is ongoing, with the social worker actively providing interventions, monitoring, and support to the client.<br><br><strong>Closed</strong> - the case has been resolved, interventions are complete, or the client no longer requires services. Closed cases remain in the registry for documentation and reporting purposes and can be reopened if circumstances change.' },
  { category: 'Case management', q: 'What is included in the family composition section?', a: 'The family composition section documents each household member of the client\'s family, including their name, birthdate, age, sex, relationship to the client, highest educational attainment, occupation, and monthly income. This information helps the social worker assess the family\'s overall situation and economic capacity.' },
  { category: 'Case management', q: 'What is the difference between present address and permanent address?', a: '<strong>Present address</strong> - where the client is currently living at the time of intake. This may be a temporary location such as a shelter, relative\'s home, or the social worker\'s office area.<br><br><strong>Permanent address</strong> - the client\'s home province, municipality, and barangay of origin. Many CEFMU clients have relocated, and the permanent address helps identify geographic patterns and coordinate with local authorities.' },
  { category: 'Case management', q: 'What does "IP category" mean in the intake form?', a: '<strong>IP</strong> stands for <strong>Indigenous Peoples</strong>. CEFMU cases among indigenous communities are tracked separately because child marriage and early union practices can be more prevalent in certain indigenous groups due to cultural traditions. Identifying IP affiliation helps DSWD tailor interventions appropriately and coordinate with the National Commission on Indigenous Peoples (NCIP).' },
  { category: 'Case management', q: 'What is the AICS Form No.?', a: 'The <strong>AICS Form No.</strong> (Assistance to Individuals in Crisis Situation) is the reference number from the DSWD\'s AICS program if the client is also receiving crisis assistance. Not all CEFMU cases have an AICS number - it is optional and applies only when the client is receiving AICS services alongside case management.' },
  // ── Services & support ───────────────────────────────────
  { category: 'Services & support', q: 'What services can be provided to CEFMU clients?', a: 'The system tracks the following types of assistance provided to clients:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li><strong>Medical assistance</strong> - health services, medical referrals</li><li><strong>Financial assistance</strong> - emergency cash assistance, livelihood support</li><li><strong>Funeral assistance</strong> - for cases involving death</li><li><strong>Transportation assistance</strong> - travel support for medical or legal appointments</li><li><strong>Legal assistance</strong> - legal aid, court accompaniment, filing of cases</li><li><strong>Psychosocial support</strong> - counseling, therapy, mental health services</li></ul>' },
  { category: 'Services & support', q: 'What is psychosocial support and why is it important for CEFMU clients?', a: 'Psychosocial support covers counseling, psychological first aid, and mental health services provided to clients and their families. CEFMU clients - especially victims of child marriage, forced marriage, and abuse - often experience trauma, depression, anxiety, and social stigma. Psychosocial support helps them heal, rebuild confidence, and make informed decisions about their situation.' },
  { category: 'Services & support', q: 'What is a progress note?', a: 'A progress note is a record of ongoing interactions and updates on a case after the initial intake. Social workers use progress notes to document:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li>Follow-up visits and client updates</li><li>New developments in the case</li><li>Services provided and their outcomes</li><li>Referrals made to other agencies</li><li>Next steps and action plans</li></ul>Progress notes types include: Progress Note, Follow-up, Referral Note, and Closure Note.' },
  // ── Data & privacy ───────────────────────────────────────
  { category: 'Data & privacy', q: 'Is client information kept confidential?', a: 'Yes. All CEFMU case records are strictly confidential. Access is restricted to authorized DSWD social workers and administrators based on their assigned role and geographic scope. The Public Dashboard shows only aggregate statistics - no client names, addresses, or personal details are ever displayed publicly.' },
  { category: 'Data & privacy', q: 'What law protects the privacy of client data?', a: 'Client data is protected under:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li><strong>Republic Act No. 10173</strong> - Data Privacy Act of 2012</li><li><strong>DSWD Administrative Order</strong> on confidentiality of social case records</li></ul>Unauthorized disclosure of client information is a violation of law and DSWD policy.' },
  { category: 'Data & privacy', q: 'Who can access the case records?', a: 'Access is role-based:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li><strong>Admin</strong> - all cases nationwide</li><li><strong>Field Office User</strong> - cases within their assigned region</li><li><strong>LGU Supervisor</strong> - cases within their assigned province</li><li><strong>CPU Monitor</strong> - read-only access to cases in their LGU</li><li><strong>Case Worker</strong> - only the cases they personally handle</li></ul>' },
  { category: 'Data & privacy', q: 'How long are case records retained?', a: 'Case records are retained in accordance with DSWD records management policies. Generally, social case records are kept for a minimum period as prescribed by law and agency guidelines. Contact your records management officer for specific retention schedules applicable to your office.' },
  // ── System & access ──────────────────────────────────────
  { category: 'System & access', q: 'How do I log in to the CEFMU Registry?', a: 'Two login methods are available:<br><br><strong>Google (DSWD staff):</strong> Use your official DSWD Google Workspace account (@dswd.gov.ph). Click "Continue with Google" on the login page.<br><br><strong>Email & Password (LGU partners):</strong> Use the email and temporary password provided by your system administrator. You will be prompted to change your password on first login.' },
  { category: 'System & access', q: 'My account is locked. What do I do?', a: 'Accounts are temporarily locked for 15 minutes after 5 consecutive failed login attempts. Wait 15 minutes and try again. If you cannot remember your password, contact your system administrator to reset it.' },
  { category: 'System & access', q: 'Why can I only see some cases and not all?', a: 'Your view is filtered based on your assigned role and geographic scope. A case worker only sees their own cases. A Field Office User sees all cases in their region. An LGU Supervisor sees all cases in their province. This is by design to protect client confidentiality and ensure data is handled only by those with appropriate jurisdiction.' },
  { category: 'System & access', q: 'The system shows an error when I save a case. What should I do?', a: 'Try the following:<br><ol class="list-decimal ml-4 mt-2 space-y-1"><li>Check that all required fields (marked with *) are filled in</li><li>Ensure you have a stable internet connection</li><li>Refresh the page and try again</li><li>If the error persists, take a screenshot of the error message and report it to your system administrator</li></ol>' },
  // ── Legal basis ──────────────────────────────────────────
  { category: 'Legal basis', q: 'What is Republic Act 11596?', a: '<strong>RA 11596</strong>, the <strong>Prohibition of Child Marriage Act of 2021</strong>, is the landmark law that expressly prohibits child marriage in the Philippines. Key provisions:<br><ul class="list-disc ml-4 mt-2 space-y-1"><li>All marriages involving a child are void from the beginning</li><li>Persons who cause, fix, facilitate, or arrange child marriages face imprisonment of 6-12 years</li><li>Government officials who solemnize child marriages face higher penalties</li><li>Requires DSWD and LGUs to provide services to victims</li><li>Mandates reporting of child marriage cases to authorities</li></ul>' },
  { category: 'Legal basis', q: 'Are there exceptions to the prohibition on child marriage under RA 11596?', a: 'No. Republic Act 11596 removes all exceptions previously found under the Family Code and other laws, including the exception that allowed marriage for girls aged 12 and above under Muslim Personal Law. The prohibition is absolute - no child under 18 may legally marry under Philippine law regardless of religion, custom, or parental consent.' },
  { category: 'Legal basis', q: 'What should I do if I encounter or witness a CEFMU case?', a: 'If you encounter a CEFMU situation:<br><ol class="list-decimal ml-4 mt-2 space-y-1"><li>Report it to the nearest DSWD Field Office or Social Welfare and Development Office (SWDO) of the local government</li><li>You may also report to the barangay for immediate intervention</li><li>For emergencies, contact the Philippine National Police (PNP) or the Bantay Bata hotline: <strong>163</strong></li><li>DSWD also operates the DSWD Action Center hotline</li></ol>Reporting is mandated for certain professionals (teachers, health workers, social workers) under RA 7610.' },
]

const categories = computed(() => {
  return CAT_META.map(c => ({
    ...c,
    count: c.name === 'All'
      ? faqs.length
      : faqs.filter(f => f.category === c.name).length
  }))
})

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
/* ── Page shell ──────────────────────────────────────────── */
.faq-page {
  min-height: 100vh;
  background: #f8f7fc;
  font-family: "Plus Jakarta Sans", sans-serif;
  overflow-y: auto;
}

/* ── Hero ────────────────────────────────────────────────── */
.faq-hero {
  background: linear-gradient(135deg, #1e0b4b 0%, #3b1d8a 50%, #2d1a5e 100%);
  position: relative;
  overflow: hidden;
  padding: 0;
}

.hero-noise {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(ellipse at 80% 20%, rgba(141, 95, 204, 0.35) 0%, transparent 60%),
    radial-gradient(ellipse at 10% 80%, rgba(131, 203, 221, 0.15) 0%, transparent 50%);
  pointer-events: none;
}

.hero-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 40px 36px;
}

.hero-brand {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.hero-logo { height: 36px; width: auto; }

.hero-brand-sep {
  width: 1px;
  height: 32px;
  background: rgba(255,255,255,0.2);
}

.hero-program {
  color: rgba(255,255,255,0.45);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-subtitle {
  color: rgba(255,255,255,0.85);
  font-size: 13px;
  font-weight: 600;
  margin-top: 2px;
}

.hero-content { max-width: 640px; }

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 100px;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.6);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 14px;
}

.hero-tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #83CBDD;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.hero-title {
  font-size: 38px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.12;
  letter-spacing: -0.02em;
  margin-bottom: 12px;
}

.hero-title em {
  font-style: normal;
  color: #83CBDD;
}

.hero-desc {
  font-size: 14px;
  color: rgba(255,255,255,0.55);
  line-height: 1.65;
  margin-bottom: 24px;
  max-width: 480px;
}

/* Hero search bar */
.hero-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.hero-search-icon {
  position: absolute;
  left: 16px;
  width: 18px;
  height: 18px;
  color: rgba(255,255,255,0.4);
  pointer-events: none;
}

.hero-search {
  width: 100%;
  max-width: 480px;
  background: rgba(255,255,255,0.08);
  border: 1.5px solid rgba(255,255,255,0.15);
  border-radius: 14px;
  padding: 13px 16px 13px 48px;
  font-size: 14px;
  font-family: inherit;
  color: #fff;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}

.hero-search::placeholder { color: rgba(255,255,255,0.35); }
.hero-search:focus {
  border-color: rgba(131, 203, 221, 0.5);
  background: rgba(255,255,255,0.12);
}

.hero-search-count {
  position: absolute;
  right: 16px;
  font-size: 12px;
  font-weight: 600;
  color: #83CBDD;
}

/* ── Body layout ─────────────────────────────────────────── */
.faq-body {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 40px 60px;
  display: grid;
  grid-template-columns: 256px 1fr;
  gap: 28px;
  align-items: start;
}

/* ── Sidebar ─────────────────────────────────────────────── */
.faq-sidebar {
  position: sticky;
  top: 24px;
}

.sidebar-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9ca3af;
  margin-bottom: 10px;
  padding-left: 4px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 24px;
}

.sidebar-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border-radius: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
}

.sidebar-btn:hover { background: rgba(141, 95, 204, 0.07); }

.sidebar-btn.active {
  background: rgba(141, 95, 204, 0.1);
}

.sidebar-btn-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.15s;
}

.sidebar-btn.active .sidebar-btn-icon {
  transform: scale(1.05);
}

.sidebar-btn-label {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  line-height: 1;
}

.sidebar-btn.active .sidebar-btn-label {
  color: #4c1d95;
  font-weight: 600;
}

.sidebar-btn-count {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 1px 7px;
  border-radius: 100px;
}

.sidebar-btn.active .sidebar-btn-count {
  background: rgba(141, 95, 204, 0.12);
  color: #7c3aed;
}

/* Sidebar info cards */
.sidebar-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.sidebar-card {
  display: flex;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  align-items: flex-start;
}

.sidebar-card--purple {
  background: rgba(141, 95, 204, 0.07);
  border: 1px solid rgba(141, 95, 204, 0.12);
}

.sidebar-card--amber {
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.12);
}

.sidebar-card-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.sidebar-card--purple .sidebar-card-icon { color: #8D5FCC; }
.sidebar-card--amber  .sidebar-card-icon { color: #d97706; }

.sidebar-card-title {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 3px;
}

.sidebar-card-body {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.5;
}

.sidebar-back a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #8D5FCC;
  text-decoration: none;
  padding: 6px 4px;
}

.sidebar-back a:hover { text-decoration: underline; }

/* ── Main content ────────────────────────────────────────── */
.faq-main { min-width: 0; }

.faq-main-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1.5px solid #ede9f7;
}

.faq-main-header-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.faq-main-title {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.faq-main-meta {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
  font-weight: 500;
}

.faq-search-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1.5px solid #ede9f7;
  font-size: 13px;
  color: #6b7280;
}

.faq-search-header strong { color: #111827; }

.faq-search-clear {
  margin-left: auto;
  font-size: 12px;
  font-weight: 600;
  color: #8D5FCC;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.faq-search-clear:hover { text-decoration: underline; }

/* ── FAQ accordion ───────────────────────────────────────── */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 16px;
  overflow: hidden;
  border: 1.5px solid #e5e0f5;
  background: #fff;
  box-shadow: 0 2px 8px rgba(141, 95, 204, 0.06);
}

.faq-item {
  border-bottom: 1px solid #ede9f7;
  transition: background 0.15s;
}

.faq-item:last-child { border-bottom: none; }

.faq-item--open { background: #fdfcff; }

.faq-q {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 18px 20px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.faq-q:hover { background: rgba(141, 95, 204, 0.03); }
.faq-item--open .faq-q { background: rgba(141, 95, 204, 0.04); }

.faq-q-num {
  font-size: 11px;
  font-weight: 700;
  color: #c4b5e3;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  flex-shrink: 0;
  width: 24px;
}

.faq-item--open .faq-q-num { color: #8D5FCC; }

.faq-q-text {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.45;
}

.faq-item--open .faq-q-text { color: #3b1d8a; }

.faq-q-cat {
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
  opacity: 0.85;
}

.faq-chevron {
  flex-shrink: 0;
  color: #c4b5e3;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), color 0.15s;
  display: flex;
  align-items: center;
}

.faq-chevron--open {
  transform: rotate(180deg);
  color: #8D5FCC;
}

/* Answer panel */
.faq-a {
  overflow: hidden;
}

.faq-a-inner {
  padding: 0 20px 20px 58px;
  font-size: 13.5px;
  color: #4b5563;
  line-height: 1.7;
}

.faq-a-inner :deep(strong) { color: #1f2937; font-weight: 700; }
.faq-a-inner :deep(ul),
.faq-a-inner :deep(ol) {
  padding-left: 1.2em;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.faq-a-inner :deep(li) { line-height: 1.6; }

/* ── Answer transition ───────────────────────────────────── */
.faq-answer-enter-active {
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.faq-answer-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.faq-answer-enter-from,
.faq-answer-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── Empty state ─────────────────────────────────────────── */
.faq-empty {
  text-align: center;
  padding: 64px 32px;
  background: #fff;
  border-radius: 16px;
  border: 1.5px solid #e5e0f5;
}

.faq-empty-icon {
  width: 56px;
  height: 56px;
  background: #f5f0ff;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: #c4b5e3;
}

.faq-empty-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 6px;
}

.faq-empty-sub {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 20px;
}

.faq-empty-sub em { color: #6b7280; font-style: normal; font-weight: 600; }

.faq-empty-reset {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f5f0ff;
  color: #7c3aed;
  border: none;
  border-radius: 10px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}

.faq-empty-reset:hover { background: #ede4ff; }

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 768px) {
  .faq-body {
    grid-template-columns: 1fr;
    padding: 20px 16px 40px;
    gap: 20px;
  }
  .faq-sidebar {
    position: static;
  }
  .hero-inner {
    padding: 20px 20px 28px;
  }
  .hero-title { font-size: 28px; }
  .sidebar-nav {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
  }
  .sidebar-btn {
    width: auto;
    padding: 6px 10px;
    border: 1.5px solid #e5e0f5;
    border-radius: 100px;
  }
  .sidebar-btn.active {
    border-color: #8D5FCC;
    background: rgba(141, 95, 204, 0.1);
  }
  .sidebar-btn-count { display: none; }
}
</style>