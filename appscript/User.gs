function getUsers(e, user) {
  if (user.role !== 'admin') return _error('Forbidden', 403);
  const rows = _sheetToObjects(_getSheet('users'));
  // Strip sensitive fields before returning to client
  const safe = rows.map(({ password_hash, salt, failed_attempts, locked_until, ...rest }) => rest);
  return _output(safe);
}

// Validate an incoming permissions grant (array or JSON string) against the
// server-side whitelist. Returns a JSON string safe to store. Anything not in
// GRANTABLE_ACTIONS is silently dropped so the client can never widen access
// beyond what the backend explicitly allows.
function _sanitizePermissions(raw) {
  var list = raw;
  if (typeof raw === 'string') {
    try { list = JSON.parse(raw); } catch (e) { list = []; }
  }
  if (!Array.isArray(list)) return '[]';
  var clean = list.filter(function (a) {
    return typeof a === 'string' && GRANTABLE_ACTIONS.indexOf(a) !== -1;
  });
  // De-duplicate
  var seen = {};
  clean = clean.filter(function (a) { return seen[a] ? false : (seen[a] = true); });
  return JSON.stringify(clean);
}

function createUser(params, user) {
  if (user.role !== 'admin') return _error('Forbidden', 403);
  const email = (params.email || '').toLowerCase().trim();
  if (!email) return _error('Email is required');

  const sheet = _getSheet('users');
  const [headers, ...rows] = sheet.getDataRange().getValues();
  const emailIdx = headers.indexOf('email');

  // Prevent duplicate accounts
  const exists = rows.some(r => r[emailIdx] === email);
  if (exists) return _error('A user with this email already exists');

  sheet.appendRow([
    email,
    params.display_name,
    params.role,
    params.lgu_code  || '',
    true,
    new Date().toISOString(),
    params.region    || '',
    params.province  || '',
  ]);

  // Persist per-user grants (if the permissions column exists).
  const permIdx = headers.indexOf('permissions');
  if (permIdx >= 0) {
    sheet.getRange(sheet.getLastRow(), permIdx + 1)
      .setValue(_sanitizePermissions(params.permissions));
  }

  _logActivity(user.email, 'CREATE_USER', email);
  return _output({ created: true });
}

function updateUser(params, user) {
  if (user.role !== 'admin') return _error('Forbidden', 403);
  const sheet = _getSheet('users');
  const [headers, ...rows] = sheet.getDataRange().getValues();
  const rowIdx = rows.findIndex(r => r[headers.indexOf('email')] === params.email);
  if (rowIdx === -1) return _error('User not found', 404);
  const sheetRow = rowIdx + 2;
  sheet.getRange(sheetRow, headers.indexOf('display_name') + 1).setValue(params.display_name);
  sheet.getRange(sheetRow, headers.indexOf('role') + 1).setValue(params.role);
  sheet.getRange(sheetRow, headers.indexOf('lgu_code') + 1).setValue(params.lgu_code || '');
  const regionIdx   = headers.indexOf('region');
  const provinceIdx = headers.indexOf('province');
  if (regionIdx >= 0)   sheet.getRange(sheetRow, regionIdx + 1).setValue(params.region || '');
  if (provinceIdx >= 0) sheet.getRange(sheetRow, provinceIdx + 1).setValue(params.province || '');
  const permIdx = headers.indexOf('permissions');
  // Only touch grants when the client actually sent them, so an older client
  // that omits the field never wipes an existing user's grants.
  if (permIdx >= 0 && params.permissions !== undefined) {
    sheet.getRange(sheetRow, permIdx + 1).setValue(_sanitizePermissions(params.permissions));
  }
  _logActivity(user.email, 'UPDATE_USER', params.email);
  return _output({ updated: true });
}

// ── One-time migration: add the `permissions` column to the users sheet ──
// Run this once from the Apps Script editor after deploying. Idempotent —
// safe to run more than once; it only adds the column if missing.
function addPermissionsColumn() {
  const sheet = _getSheet('users');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf('permissions') !== -1) {
    Logger.log('permissions column already exists — nothing to do.');
    return;
  }
  sheet.getRange(1, sheet.getLastColumn() + 1).setValue('permissions');
  Logger.log('Added "permissions" column to users sheet.');
}

function toggleUser(params, user) {
  if (user.role !== 'admin') return _error('Forbidden', 403);
  const sheet = _getSheet('users');
  const [headers, ...rows] = sheet.getDataRange().getValues();
  const rowIdx = rows.findIndex(r => r[headers.indexOf('email')] === params.email);
  if (rowIdx === -1) return _error('User not found', 404);
  const sheetRow = rowIdx + 2;
  const active = params.active === 'true' || params.active === true;
  sheet.getRange(sheetRow, headers.indexOf('active') + 1).setValue(active);
  _logActivity(user.email, active ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', params.email);
  return _output({ toggled: true });
}

function setUserPassword(params, user) {
  if (user.role !== 'admin') return _error('Forbidden', 403);
  var pw = params.password || '';
  if (pw.length < 8) return _error('Password must be at least 8 characters');
  if (!/[A-Z]/.test(pw)) return _error('Password must contain at least one uppercase letter');
  if (!/[0-9]/.test(pw)) return _error('Password must contain at least one number');

  const sheet = _getSheet('users');
  const [headers, ...rows] = sheet.getDataRange().getValues();
  const idx = {
    email: headers.indexOf('email'),
    password_hash: headers.indexOf('password_hash'),
    salt: headers.indexOf('salt'),
    must_change_password: headers.indexOf('must_change_password'),
  };

  const rowIdx = rows.findIndex(r => r[idx.email] === params.email);
  if (rowIdx === -1) return _error('User not found', 404);

  const sheetRow = rowIdx + 2;
  const salt = _generateSalt();
  const hash = _hashPassword(params.password, salt);

  sheet.getRange(sheetRow, idx.password_hash + 1).setValue(hash);
  sheet.getRange(sheetRow, idx.salt + 1).setValue(salt);
  sheet.getRange(sheetRow, idx.must_change_password + 1).setValue(true);

  _logActivity(user.email, 'SET_PASSWORD', params.email);
  return _output({ set: true });
}