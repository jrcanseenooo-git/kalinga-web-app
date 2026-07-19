const cases = [
  {
    case_id: 'CEFMU-202607-A1B2',
    date_intake: '2026-07-08',
    status: 'active',
    client_last: 'Dela Cruz',
    client_first: 'Maria',
    client_mi: 'L',
    birthdate: '2010-02-14',
    sex: 'Female',
    age: 16,
    civil_status: 'Single',
    religion: 'Roman Catholic',
    ip_category: 'Non-IP',
    education: 'Grade 10',
    phone: '09XX-XXX-0123',
    present_street: 'Purok 3',
    region: 'Region II - Cagayan Valley',
    province: 'Kalinga',
    city_muni: 'Tabuk City',
    barangay: 'Bulanao',
    classification: 'Child',
    cefmu_type: 'Child marriage',
    admission_mode: 'Referral',
    aics_form_no: 'AICS-DEMO-001',
    lgu_code: 'KALINGA-001',
    referred_by: 'MSWDO Tabuk',
    referral_date: '2026-07-07',
    presenting_problem: 'Client was referred for assessment after a reported early union arrangement. The case requires coordinated psychosocial, legal, and family intervention support.',
    initial_assessment: 'Initial interview indicates the need for safety planning, family counseling, and referral coordination with the local protection network.',
    plan_of_action: 'Conduct case conference, provide psychosocial support, coordinate with LGU focal person, and monitor family compliance with the agreed safety plan.',
    remarks: 'Demo record for documentation screenshots only.',
    case_worker_email: 'caseworker.demo@dswd.gov.ph',
    created_at: '2026-07-08T09:30:00+08:00',
    updated_at: '2026-07-12T14:20:00+08:00',
    family_members: JSON.stringify([
      { name: 'Ana Dela Cruz', age: 42, sex: 'Female', relationship: 'Mother', education: 'High School', occupation: 'Vendor', income: 6500 },
      { name: 'Jose Dela Cruz', age: 45, sex: 'Male', relationship: 'Father', education: 'High School', occupation: 'Farmer', income: 7000 },
    ]),
  },
  {
    case_id: 'CEFMU-202607-C3D4',
    date_intake: '2026-07-04',
    status: 'active',
    client_last: 'Santos',
    client_first: 'Angela',
    client_mi: 'R',
    birthdate: '2009-09-21',
    sex: 'Female',
    age: 16,
    civil_status: 'Single',
    region: 'Region II - Cagayan Valley',
    province: 'Kalinga',
    city_muni: 'Rizal',
    barangay: 'Liwan West',
    classification: 'Child',
    cefmu_type: 'Early union',
    admission_mode: 'Walk-in',
    lgu_code: 'KALINGA-002',
    referred_by: 'Barangay VAW Desk',
    referral_date: '2026-07-04',
    presenting_problem: 'Client sought assistance after family conflict related to an early union situation.',
    initial_assessment: 'Client requires psychosocial first aid and education continuity planning.',
    plan_of_action: 'Refer to social worker, coordinate with school focal person, and schedule follow-up visit.',
    case_worker_email: 'caseworker.demo@dswd.gov.ph',
  },
  {
    case_id: 'CEFMU-202606-E5F6',
    date_intake: '2026-06-26',
    status: 'closed',
    client_last: 'Luna',
    client_first: 'Grace',
    client_mi: 'M',
    birthdate: '2008-11-03',
    sex: 'Female',
    age: 17,
    region: 'Region II - Cagayan Valley',
    province: 'Kalinga',
    city_muni: 'Lubuagan',
    barangay: 'Poblacion',
    classification: 'Child',
    cefmu_type: 'Forced marriage',
    admission_mode: 'Referral',
    lgu_code: 'KALINGA-003',
    referred_by: 'School Guidance Office',
    referral_date: '2026-06-25',
    date_closed: '2026-07-10',
    case_worker_email: 'fo.demo@kalinga.local',
  },
  {
    case_id: 'CEFMU-202606-G7H8',
    date_intake: '2026-06-18',
    status: 'active',
    client_last: 'Bautista',
    client_first: 'Rhea',
    client_mi: 'N',
    sex: 'Female',
    age: 15,
    region: 'Region II - Cagayan Valley',
    province: 'Kalinga',
    city_muni: 'Pinukpuk',
    barangay: 'Taga',
    classification: 'Child',
    cefmu_type: 'Teenage pregnancy',
    admission_mode: 'Outreach',
    lgu_code: 'KALINGA-004',
    case_worker_email: 'caseworker.demo@dswd.gov.ph',
  },
  {
    case_id: 'CEFMU-202605-I9J0',
    date_intake: '2026-05-30',
    status: 'closed',
    client_last: 'Reyes',
    client_first: 'Camille',
    client_mi: 'P',
    sex: 'Female',
    age: 17,
    region: 'Region II - Cagayan Valley',
    province: 'Kalinga',
    city_muni: 'Tinglayan',
    barangay: 'Buscalan',
    classification: 'Child',
    cefmu_type: 'Child abuse',
    admission_mode: 'Phone',
    lgu_code: 'KALINGA-005',
    date_closed: '2026-06-20',
    case_worker_email: 'fo.demo@kalinga.local',
  },
]

const services = [
  { service_id: 'SVC-DEMO-001', case_id: 'CEFMU-202607-A1B2', service_type: 'Psychosocial support', amount: 0, date_provided: '2026-07-09', provided_by: 'DSWD Social Worker' },
  { service_id: 'SVC-DEMO-002', case_id: 'CEFMU-202607-A1B2', service_type: 'Legal assistance', amount: 0, date_provided: '2026-07-10', provided_by: 'LGU Legal Desk' },
  { service_id: 'SVC-DEMO-003', case_id: 'CEFMU-202607-A1B2', service_type: 'Financial assistance', amount: 5000, date_provided: '2026-07-11', provided_by: 'AICS Desk' },
]

const progress_notes = [
  {
    note_id: 'NOTE-DEMO-001',
    case_id: 'CEFMU-202607-A1B2',
    date_note: '2026-07-09',
    note_type: 'progress',
    content: 'Initial psychosocial support session conducted. Client was oriented on available services and referral pathways.',
    action_taken: 'Safety planning initiated with parent/guardian.',
    next_steps: 'Schedule case conference with LGU focal person.',
    created_by: 'caseworker.demo@dswd.gov.ph',
    created_at: '2026-07-09T10:15:00+08:00',
  },
  {
    note_id: 'NOTE-DEMO-002',
    case_id: 'CEFMU-202607-A1B2',
    date_note: '2026-07-11',
    note_type: 'referral',
    content: 'Case referred to the local protection network for coordinated service planning.',
    action_taken: 'Referral sent to LGU and legal focal person.',
    next_steps: 'Monitor referral acceptance and update service plan.',
    created_by: 'caseworker.demo@dswd.gov.ph',
    created_at: '2026-07-11T15:45:00+08:00',
  },
]

export const demoUser = {
  email: 'admin.demo@dswd.gov.ph',
  name: 'Demo Admin',
  display_name: 'Demo Admin',
  role: 'admin',
  lgu_code: '',
  region: 'Region II - Cagayan Valley',
  province: 'Kalinga',
}

export const demoUsers = [
  { email: 'admin.demo@dswd.gov.ph', display_name: 'Demo Admin', role: 'admin', active: true, region: '', province: '', lgu_code: '' },
  { email: 'caseworker.demo@dswd.gov.ph', display_name: 'Demo Case Worker', role: 'case_worker', active: true, region: 'Region II - Cagayan Valley', province: 'Kalinga', lgu_code: 'KALINGA-001' },
  { email: 'fo.demo@kalinga.local', display_name: 'Demo FO User', role: 'fo_user', active: true, region: 'Region II - Cagayan Valley', province: 'Kalinga', lgu_code: 'KALINGA-001' },
  { email: 'supervisor.demo@kalinga.local', display_name: 'Demo LGU Supervisor', role: 'lgu_supervisor', active: true, region: 'Region II - Cagayan Valley', province: 'Kalinga', lgu_code: 'KALINGA-002' },
  { email: 'monitor.demo@kalinga.local', display_name: 'Demo CPU Monitor', role: 'cpu_monitor', active: false, region: 'Region II - Cagayan Valley', province: 'Kalinga', lgu_code: 'KALINGA-003' },
]

export const demoDashboard = {
  summary: { total: 37, active: 24, closed: 13 },
  byRegion: {
    'Region II - Cagayan Valley': 37,
    'CAR - Cordillera Administrative Region': 8,
    'Region I - Ilocos Region': 5,
  },
  byClassification: { Child: 33, 'Person With Disability': 4 },
  bySex: { Female: 34, Male: 3 },
  ageBands: { '10-12': 3, '13-15': 14, '16-17': 20 },
  byCefmuType: {
    'Child marriage': 11,
    'Early union': 9,
    'Forced marriage': 6,
    'Teenage pregnancy': 7,
    'Child abuse': 4,
  },
  byService: {
    'Psychosocial support': 18,
    'Financial assistance': 14,
    'Legal assistance': 7,
    'Educational assistance': 5,
  },
  trend: [
    { label: 'Feb', count: 3 },
    { label: 'Mar', count: 5 },
    { label: 'Apr', count: 6 },
    { label: 'May', count: 8 },
    { label: 'Jun', count: 9 },
    { label: 'Jul', count: 6 },
  ],
}

function groupCount(rows, key) {
  return rows.reduce((acc, row) => {
    const raw = row[key]
    if (!raw) return acc
    String(raw).split(',').map((item) => item.trim()).filter(Boolean).forEach((item) => {
      acc[item] = (acc[item] || 0) + 1
    })
    return acc
  }, {})
}

function buildDemoDashboard(params = {}) {
  const filtered = cases.filter((row) => {
    if (params.region && row.region !== params.region) return false
    if (params.province && row.province !== params.province) return false
    if (params.city_muni && row.city_muni !== params.city_muni) return false
    return true
  })
  const caseIds = new Set(filtered.map((row) => row.case_id))
  const scopedServices = services.filter((row) => caseIds.has(row.case_id))
  return {
    ...demoDashboard,
    summary: {
      total: filtered.length,
      active: filtered.filter((row) => row.status === 'active').length,
      closed: filtered.filter((row) => row.status === 'closed').length,
    },
    byRegion: groupCount(filtered, 'region'),
    byProvince: groupCount(filtered, 'province'),
    byLgu: groupCount(filtered, 'city_muni'),
    byClassification: groupCount(filtered, 'classification'),
    bySex: groupCount(filtered, 'sex'),
    ageBands: filtered.reduce((acc, row) => {
      const age = Number(row.age || 0)
      const band = age <= 12 ? '10-12' : age <= 15 ? '13-15' : '16-17'
      acc[band] = (acc[band] || 0) + 1
      return acc
    }, {}),
    byCefmuType: groupCount(filtered, 'cefmu_type'),
    byService: groupCount(scopedServices, 'service_type'),
    filters: {
      region: params.region || '',
      province: params.province || '',
      city_muni: params.city_muni || '',
      regions: groupCount(cases, 'region'),
      provinces: groupCount(filtered, 'province'),
      cities: groupCount(filtered, 'city_muni'),
    },
  }
}

export function demoApi(action, params = {}) {
  if (action === 'getMe') return demoUser
  if (action === 'getDashboard' || action === 'getPublicDashboard') return buildDemoDashboard(params)
  if (action === 'getCases') return cases
  if (action === 'getCase') {
    const found = cases.find((c) => c.case_id === params.case_id) || cases[0]
    return {
      ...found,
      _services: services.filter((s) => s.case_id === found.case_id),
      _notes: progress_notes.filter((n) => n.case_id === found.case_id),
    }
  }
  if (action === 'getUsers') return demoUsers
  if (action === 'getLocations' || action === 'getLatestLocation') return []
  if (action === 'getLookups') {
    return {
      cefmu_type: ['Child marriage', 'Early union', 'Forced marriage', 'Teenage pregnancy', 'Child abuse'],
      note_type: ['progress', 'follow_up', 'referral', 'closure'],
      admission_mode: ['Walk-in', 'Referral', 'Outreach', 'Online', 'Phone'],
    }
  }
  if (action === 'getAuditLogs') {
    return {
      logs: [
        { timestamp: '2026-07-16T09:08:00+08:00', email: 'admin.demo@dswd.gov.ph', action: 'LOGIN_PASSWORD', details: 'Demo login' },
        { timestamp: '2026-07-16T09:12:00+08:00', email: 'caseworker.demo@dswd.gov.ph', action: 'CREATE_CASE', details: 'CEFMU-202607-A1B2' },
        { timestamp: '2026-07-16T09:21:00+08:00', email: 'caseworker.demo@dswd.gov.ph', action: 'ADD_SERVICE', details: 'CEFMU-202607-A1B2' },
        { timestamp: '2026-07-16T09:34:00+08:00', email: 'fo.demo@kalinga.local', action: 'UPDATE_CASE', details: 'CEFMU-202607-C3D4' },
      ],
      failed_logins: [
        { timestamp: '2026-07-15T17:42:00+08:00', email: 'external.demo@kalinga.local', action: 'LOGIN_FAILED', details: 'attempt 2' },
        { timestamp: '2026-07-15T17:46:00+08:00', email: 'monitor.demo@kalinga.local', action: 'ACCOUNT_LOCKED', details: '15 min lockout' },
      ],
      export_logs: [
        { timestamp: '2026-07-16T10:05:00+08:00', email: 'admin.demo@dswd.gov.ph', export_type: 'summary', purpose: 'Official reporting', record_count: 37 },
        { timestamp: '2026-07-16T10:18:00+08:00', email: 'caseworker.demo@dswd.gov.ph', export_type: 'csv', purpose: 'Case review', record_count: 5 },
      ],
    }
  }
  return {}
}

export function demoPost(action, body = {}) {
  if (action === 'loginWithPassword') {
    return { session_token: 'ses_demo_screenshot_token', user: demoUser, must_change_password: false }
  }
  return { ok: true, _demo: true, ...body }
}
