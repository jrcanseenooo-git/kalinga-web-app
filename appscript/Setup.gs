// ============================================================
// Setup.gs — run ONCE to create all sheets & headers
// In Apps Script editor: Run > setupSheets
// ============================================================

function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const schema = {
    cases: [
      'case_id', 'date_intake', 'status',
      'client_last', 'client_first', 'client_mi',
      'birthdate', 'sex', 'age',
      'classification',
      'lgu_code', 'region', 'province', 'city_muni',
      'presenting_problem', 'aics_form_no',
      'referred_by', 'referral_date',
      'case_worker_email', 'date_closed',
      'remarks', 'created_at', 'updated_at',
    ],
    users: [
      'email', 'display_name', 'role', 'lgu_code', 'active', 'created_at'
      // role: 'admin' | 'case_worker' | 'cpu_monitor'
      // active: TRUE | FALSE
    ],
    services: [
      'service_id', 'case_id', 'service_type', 'amount', 'date_provided', 'provided_by'
    ],
    activity_log: [
      'timestamp', 'user_email', 'action', 'reference', 'locale'
    ],
    lookups: [
      'lookup_type', 'value', 'label', 'sort_order'
      // lookup_type: 'classification' | 'service_type' | 'region' | ...
    ],
  };

  Object.entries(schema).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      Logger.log('Created sheet: ' + name);
    } else {
      Logger.log('Sheet already exists, skipping header row: ' + name);
      return;
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#4B2E8C')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  });

  // Seed lookups
  const lookupSheet = ss.getSheetByName('lookups');
  const seeds = [
    ['classification', 'child',   'Child',   1],
    ['classification', 'elderly', 'Elderly', 2],
    ['classification', 'pwd',     'PWD',     3],
    ['service_type', 'medical',      'Medical Assistance',      1],
    ['service_type', 'financial',    'Financial Assistance',    2],
    ['service_type', 'funeral',      'Funeral Assistance',      3],
    ['service_type', 'transportation','Transportation Assistance',4],
    ['service_type', 'legal',        'Legal Assistance',        5],
    ['service_type', 'psychosocial', 'Psychosocial Support',    6],
  ];
  seeds.forEach(row => lookupSheet.appendRow(row));

  Logger.log('Setup complete!');
}
