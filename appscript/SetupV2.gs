// ============================================================
// SetupV2.gs — run ONCE to add new columns & sheets
// In Apps Script editor: Run > setupV2
// This ADDS to your existing setup — does not replace.
// ============================================================

function setupV2() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // ── 1. Rebuild cases sheet with expanded columns ──────────
  // IMPORTANT: This creates a NEW cases_v2 sheet. After verifying,
  // rename your old 'cases' to 'cases_old' and 'cases_v2' to 'cases'.
  const newCaseCols = [
    'case_id', 'date_intake', 'status',
    'client_last', 'client_first', 'client_mi', 'suffix',
    'birthdate', 'sex', 'age', 'civil_status', 'religion',
    'ip_category', 'education', 'phone', 'occupation', 'income', 'philhealth_no',
    'present_street', 'region', 'province', 'city_muni', 'barangay',
    'prov_street', 'prov_region', 'prov_province', 'prov_city_muni', 'prov_barangay',
    'classification', 'cefmu_type', 'admission_mode',
    'aics_form_no', 'lgu_code',
    'referred_by', 'referral_date',
    'presenting_problem', 'initial_assessment', 'plan_of_action', 'remarks',
    'family_members',
    'case_worker_email', 'date_closed', 'created_at', 'updated_at',
  ];

  let casesV2 = ss.getSheetByName('cases_v2');
  if (!casesV2) {
    casesV2 = ss.insertSheet('cases_v2');
    casesV2.getRange(1, 1, 1, newCaseCols.length).setValues([newCaseCols]);
    casesV2.getRange(1, 1, 1, newCaseCols.length)
      .setFontWeight('bold')
      .setBackground('#4B2E8C')
      .setFontColor('#ffffff');
    casesV2.setFrozenRows(1);
    Logger.log('Created cases_v2 sheet with expanded columns');
  } else {
    Logger.log('cases_v2 already exists, skipping');
  }

  // ── 2. Create progress_notes sheet ────────────────────────
  const notesCols = [
    'note_id', 'case_id', 'date_note', 'note_type',
    'content', 'action_taken', 'next_steps',
    'created_by', 'created_at',
  ];

  let notesSheet = ss.getSheetByName('progress_notes');
  if (!notesSheet) {
    notesSheet = ss.insertSheet('progress_notes');
    notesSheet.getRange(1, 1, 1, notesCols.length).setValues([notesCols]);
    notesSheet.getRange(1, 1, 1, notesCols.length)
      .setFontWeight('bold')
      .setBackground('#4B2E8C')
      .setFontColor('#ffffff');
    notesSheet.setFrozenRows(1);
    Logger.log('Created progress_notes sheet');
  }

  // ── 3. Create sessions sheet (if not exists) ──────────────
  let sessionsSheet = ss.getSheetByName('sessions');
  if (!sessionsSheet) {
    sessionsSheet = ss.insertSheet('sessions');
    sessionsSheet.appendRow(['token', 'email', 'expires_at']);
    sessionsSheet.getRange(1, 1, 1, 3)
      .setFontWeight('bold')
      .setBackground('#4B2E8C')
      .setFontColor('#ffffff');
    sessionsSheet.setFrozenRows(1);
    Logger.log('Created sessions sheet');
  }

  // ── 4. Add more lookup seeds ──────────────────────────────
  const lookupSheet = ss.getSheetByName('lookups');
  const newSeeds = [
    ['cefmu_type', 'child_marriage',    'Child marriage',     1],
    ['cefmu_type', 'early_union',       'Early union',        2],
    ['cefmu_type', 'forced_marriage',   'Forced marriage',    3],
    ['cefmu_type', 'teenage_pregnancy', 'Teenage pregnancy',  4],
    ['cefmu_type', 'child_abuse',       'Child abuse',        5],
    ['cefmu_type', 'child_labor',       'Child labor',        6],
    ['cefmu_type', 'child_trafficking', 'Child trafficking',  7],
    ['cefmu_type', 'other',             'Other',              8],
    ['note_type',  'progress',          'Progress Note',      1],
    ['note_type',  'follow_up',         'Follow-up',          2],
    ['note_type',  'referral',          'Referral Note',      3],
    ['note_type',  'closure',           'Closure Note',       4],
    ['admission_mode', 'walk_in',   'Walk-in',    1],
    ['admission_mode', 'referral',  'Referral',   2],
    ['admission_mode', 'outreach',  'Outreach',   3],
    ['admission_mode', 'online',    'Online',     4],
    ['admission_mode', 'phone',     'Phone',      5],
  ];
  // Skip anything already present. Without this guard every re-run appended
  // another full copy of these seeds, which is how the intake dropdowns ended
  // up showing each option four times.
  const existingLookups = {};
  const lookupData = lookupSheet.getDataRange().getValues();
  const lHeaders = lookupData[0];
  const ltCol = lHeaders.indexOf('lookup_type');
  const lvCol = lHeaders.indexOf('value');
  const llCol = lHeaders.indexOf('label');
  for (let i = 1; i < lookupData.length; i++) {
    existingLookups[String(lookupData[i][ltCol]) + '||' + String(lookupData[i][lvCol])] = true;
    // Also key on label so a differently-cased value can't create a visual duplicate.
    existingLookups[String(lookupData[i][ltCol]) + '||L||' + String(lookupData[i][llCol]).toLowerCase()] = true;
  }

  let addedSeeds = 0;
  newSeeds.forEach(row => {
    const byValue = row[0] + '||' + row[1];
    const byLabel = row[0] + '||L||' + String(row[2]).toLowerCase();
    if (existingLookups[byValue] || existingLookups[byLabel]) return;
    lookupSheet.appendRow(row);
    existingLookups[byValue] = true;
    existingLookups[byLabel] = true;
    addedSeeds++;
  });
  Logger.log('Added ' + addedSeeds + ' new lookup seeds (skipped ' + (newSeeds.length - addedSeeds) + ' existing)');

  Logger.log('SetupV2 complete! Next steps:');
  Logger.log('1. Rename "cases" to "cases_old"');
  Logger.log('2. Rename "cases_v2" to "cases"');
  Logger.log('3. Migrate existing data from cases_old to cases if needed');
}

// ============================================================
// setupFamilySheet — run ONCE to create the family_members sheet
// In Apps Script editor: Run > setupFamilySheet
// ============================================================

function setupFamilySheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const FAMILY_COLS = [
    'member_id',
    'case_id',
    // Respondent (client) snapshot
    'client_last', 'client_first', 'city_muni', 'province', 'region',
    // Family member details
    'name', 'birthdate', 'age', 'sex', 'relationship',
    'education', 'occupation', 'income',
    'created_at', 'updated_at',
  ];

  let sheet = ss.getSheetByName('family_members');
  if (sheet) {
    Logger.log('family_members sheet already exists — skipping creation.');
    return;
  }

  sheet = ss.insertSheet('family_members');
  sheet.getRange(1, 1, 1, FAMILY_COLS.length).setValues([FAMILY_COLS]);
  sheet.getRange(1, 1, 1, FAMILY_COLS.length)
    .setFontWeight('bold')
    .setBackground('#4B2E8C')
    .setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  Logger.log('family_members sheet created with columns: ' + FAMILY_COLS.join(', '));
  Logger.log('Done! Existing family data will be migrated automatically when each case is next saved.');
}