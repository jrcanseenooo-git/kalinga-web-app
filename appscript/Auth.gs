// ============================================================
// Auth.gs — Email/password auth with salted SHA-256
// ============================================================

function _sha256(value) {
  const raw  = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    value,
    Utilities.Charset.UTF_8
  );
  return raw.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function _generateSalt() {
  return Utilities.getUuid().replace(/-/g, '');
}

function _generateSessionToken() {
  // Prefixed with 'ses_' so Code.gs can detect token type unambiguously
  return SESSION_TOKEN_PREFIX +
         Utilities.getUuid().replace(/-/g, '') +
         Utilities.getUuid().replace(/-/g, '');
}

function _hashPassword(password, salt) {
  return _sha256(salt + password + salt);
}

// ── Login with email/password ─────────────────────────────────
function loginWithPassword(params) {
  const email    = (params.email || '').toLowerCase().trim();
  const password = params.password || '';

  if (!email || !password) return _error('Email and password are required');

  const sheet   = _getSheet('users');
  const [headers, ...rows] = sheet.getDataRange().getValues();

  const idx = {
    email:                headers.indexOf('email'),
    role:                 headers.indexOf('role'),
    active:               headers.indexOf('active'),
    lgu_code:             headers.indexOf('lgu_code'),
    region:               headers.indexOf('region'),
    province:             headers.indexOf('province'),
    display_name:         headers.indexOf('display_name'),
    password_hash:        headers.indexOf('password_hash'),
    salt:                 headers.indexOf('salt'),
    must_change_password: headers.indexOf('must_change_password'),
    failed_attempts:      headers.indexOf('failed_attempts'),
    locked_until:         headers.indexOf('locked_until'),
    permissions:          headers.indexOf('permissions'),
  };

  const rowIdx = rows.findIndex(r => r[idx.email] === email);
  // Return identical error for unknown email to prevent user enumeration
  if (rowIdx === -1) return _error('Invalid email or password');

  const row      = rows[rowIdx];
  const sheetRow = rowIdx + 2;

  if (row[idx.active] !== true) return _error('Account is inactive');

  const lockedUntil = row[idx.locked_until];
  if (lockedUntil && new Date(lockedUntil) > new Date()) {
    return _error('Account is temporarily locked. Try again later.');
  }

  const hash = row[idx.password_hash];
  const salt = row[idx.salt];
  if (!hash || !salt) return _error('Password not set. Contact your administrator.');

  const computed = _hashPassword(password, salt);
  if (computed !== hash) {
    const attempts = (parseInt(row[idx.failed_attempts]) || 0) + 1;
    sheet.getRange(sheetRow, idx.failed_attempts + 1).setValue(attempts);
    _logActivity(email, 'LOGIN_FAILED', 'attempt ' + attempts);
    if (attempts >= 5) {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      sheet.getRange(sheetRow, idx.locked_until + 1).setValue(lockUntil);
      _logActivity(email, 'ACCOUNT_LOCKED', '15 min lockout');
      return _error('Too many failed attempts. Account locked for 15 minutes.');
    }
    return _error(`Invalid email or password. ${5 - attempts} attempt(s) remaining.`);
  }

  // Reset failed attempts on success
  sheet.getRange(sheetRow, idx.failed_attempts + 1).setValue(0);
  sheet.getRange(sheetRow, idx.locked_until + 1).setValue('');

  const sessionToken  = _generateSessionToken();
  const sessionExpiry = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

  _saveSession(sessionToken, email, sessionExpiry);

  _logActivity(email, 'LOGIN_PASSWORD', '');
  return _output({
    session_token:        sessionToken,
    expires_at:           sessionExpiry,
    must_change_password: row[idx.must_change_password] === true,
    user: {
      email:       email,
      name:        row[idx.display_name],
      role:        row[idx.role],
      lgu_code:    row[idx.lgu_code],
      region:      idx.region   >= 0 ? row[idx.region]   : '',
      province:    idx.province >= 0 ? row[idx.province] : '',
      permissions: _parsePermissions(idx.permissions >= 0 ? row[idx.permissions] : ''),
    }
  });
}

// ── Change password ───────────────────────────────────────────
function changePassword(params, user) {
  const newPassword = params.new_password || '';
  if (newPassword.length < 8) return _error('Password must be at least 8 characters');
  if (!/[A-Z]/.test(newPassword)) return _error('Password must contain at least one uppercase letter');
  if (!/[0-9]/.test(newPassword)) return _error('Password must contain at least one number');

  const sheet   = _getSheet('users');
  const [headers, ...rows] = sheet.getDataRange().getValues();
  const idx = {
    email:                headers.indexOf('email'),
    password_hash:        headers.indexOf('password_hash'),
    salt:                 headers.indexOf('salt'),
    must_change_password: headers.indexOf('must_change_password'),
  };

  const rowIdx = rows.findIndex(r => r[idx.email] === user.email);
  if (rowIdx === -1) return _error('User not found');

  const sheetRow = rowIdx + 2;
  const salt     = _generateSalt();
  const hash     = _hashPassword(newPassword, salt);

  sheet.getRange(sheetRow, idx.password_hash + 1).setValue(hash);
  sheet.getRange(sheetRow, idx.salt + 1).setValue(salt);
  sheet.getRange(sheetRow, idx.must_change_password + 1).setValue(false);

  _logActivity(user.email, 'CHANGE_PASSWORD', user.email);
  return _output({ changed: true });
}

// ── Session helpers ───────────────────────────────────────────
function _saveSession(token, email, expiry) {
  let sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('sessions');
  if (!sheet) {
    sheet = SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet('sessions');
    sheet.appendRow(['token', 'email', 'expires_at']);
  }
  sheet.appendRow([token, email, expiry]);

  // Opportunistically clean up expired sessions to keep the sheet lean
  _pruneExpiredSessions(sheet);
}

function _getEmailFromSession(token) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('sessions');
  if (!sheet) return null;

  const [headers, ...rows] = sheet.getDataRange().getValues();
  const idx = {
    token:      headers.indexOf('token'),
    email:      headers.indexOf('email'),
    expires_at: headers.indexOf('expires_at'),
  };

  const row = rows.find(r => r[idx.token] === token);
  if (!row) return null;
  if (new Date(row[idx.expires_at]) < new Date()) return null;

  return row[idx.email];
}

function _invalidateSession(token) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('sessions');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var tokenIdx = data[0].indexOf('token');
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][tokenIdx] === token) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}

// Deletes rows whose expires_at is in the past.
function _pruneExpiredSessions(sheet) {
  try {
    const [headers, ...rows] = sheet.getDataRange().getValues();
    const expiresIdx = headers.indexOf('expires_at');
    const now = new Date();
    // Iterate bottom-up so row deletion doesn't shift indices
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i][expiresIdx] && new Date(rows[i][expiresIdx]) < now) {
        sheet.deleteRow(i + 2); // +2: 1 for header row, 1 for 0-index offset
      }
    }
  } catch(e) {
    // Non-critical — don't let cleanup failure break login
  }
}
