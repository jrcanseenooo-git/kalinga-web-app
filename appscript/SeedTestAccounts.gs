/**
 * Run this ONCE in the STAGING Apps Script editor to create 5 test accounts.
 * Delete this file after seeding.
 *
 * Each account gets password: Kalinga2026!
 * All accounts have must_change_password = false (for QA convenience).
 */
function seedTestAccounts() {
  var password = 'Kalinga2026!';

  var accounts = [
    { email: 'qa.admin@dswd.gov.ph',         display_name: 'QA Admin',          role: 'admin',          lgu_code: '',            region: '',         province: '' },
    { email: 'qa.caseworker@dswd.gov.ph',     display_name: 'QA Case Worker',    role: 'case_worker',    lgu_code: 'KALINGA-001', region: 'Region 2', province: 'Kalinga' },
    { email: 'qa.fouser@dswd.gov.ph',         display_name: 'QA FO User',        role: 'fo_user',        lgu_code: 'KALINGA-001', region: 'Region 2', province: 'Kalinga' },
    { email: 'qa.lgusupervisor@dswd.gov.ph',  display_name: 'QA LGU Supervisor', role: 'lgu_supervisor', lgu_code: 'KALINGA-001', region: 'Region 2', province: 'Kalinga' },
    { email: 'qa.cpumonitor@dswd.gov.ph',     display_name: 'QA CPU Monitor',    role: 'cpu_monitor',    lgu_code: '',            region: 'Region 2', province: 'Kalinga' },
  ];

  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  if (!sheet) {
    Logger.log('ERROR: "users" sheet not found');
    return;
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var emailIdx = headers.indexOf('email');

  // Check for existing rows to avoid duplicates
  var existingData = sheet.getDataRange().getValues();
  var existingEmails = existingData.slice(1).map(function(r) { return r[emailIdx]; });

  var created = 0;
  accounts.forEach(function(acct) {
    if (existingEmails.indexOf(acct.email) !== -1) {
      Logger.log('SKIP: ' + acct.email + ' already exists');
      return;
    }

    var salt = Utilities.getUuid().replace(/-/g, '');
    var hash = _sha256Seed(salt + password + salt);

    sheet.appendRow([
      acct.email,
      acct.display_name,
      acct.role,
      acct.lgu_code,
      true,                    // active
      new Date().toISOString(), // created_at
      acct.region,
      acct.province,
      hash,                    // password_hash
      salt,                    // salt
      false,                   // must_change_password
      0,                       // failed_attempts
      '',                      // locked_until
    ]);
    Logger.log('CREATED: ' + acct.email + ' (' + acct.role + ')');
    created++;
  });

  Logger.log('Done. Created ' + created + ' test accounts.');
  Logger.log('Password for all accounts: ' + password);
}

function _sha256Seed(value) {
  var raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    value,
    Utilities.Charset.UTF_8
  );
  return raw.map(function(b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}
