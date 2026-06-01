const SPREADSHEET_ID = '1O9C0eDYsMrpWeCKIMalxT9Xlz1hxXSXS0ZzGmZYDJ3w';
const ALLOWED_DOMAIN = 'dswd.gov.ph';

const SESSION_TOKEN_PREFIX = 'ses_';

function _output(data, status = 200) {
  const payload = JSON.stringify({ status, data });
  return ContentService
    .createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}

function _error(message, status = 400) {
  return _output({ error: message }, status);
}

// ── Parse params: merges JSON payload if present ─────────────
function _getParams(e) {
  var params = {};
  var raw = e.parameter || {};
  for (var key in raw) {
    if (raw.hasOwnProperty(key)) params[key] = raw[key];
  }
  if (params.payload) {
    try {
      var parsed = JSON.parse(params.payload);
      for (var k in parsed) {
        if (parsed.hasOwnProperty(k)) params[k] = parsed[k];
      }
    } catch (err) { }
    delete params.payload;
  }
  return params;
}

// ── Auth ──────────────────────────────────────────────────────
function _getAuthedUser(token) {
  if (!token) return null;

  let email;

  if (token.startsWith(SESSION_TOKEN_PREFIX)) {
    // Email/password session
    email = _getEmailFromSession(token);
  } else {
    // Google JWT — decode payload (base64url middle segment)
    try {
      const parts = token.split('.');
      const payload = JSON.parse(
        Utilities.newBlob(
          Utilities.base64DecodeWebSafe(parts[1])
        ).getDataAsString()
      );
      email = payload.email || null;
    } catch (e) {
      return null;
    }
  }

  if (!email) return null;

  // Look up user in sheet
  const sheet = _getSheet('users');
  const [headers, ...rows] = sheet.getDataRange().getValues();
  const idx = {
    email: headers.indexOf('email'),
    role: headers.indexOf('role'),
    active: headers.indexOf('active'),
    lgu_code: headers.indexOf('lgu_code'),
  };

  const row = rows.find(r => r[idx.email] === email && r[idx.active] === true);
  if (!row) return null;

  const regionIdx = headers.indexOf('region');
  const provinceIdx = headers.indexOf('province');
  return {
    email,
    role: row[idx.role],
    lgu_code: row[idx.lgu_code],
    region: regionIdx >= 0 ? row[regionIdx] : '',
    province: provinceIdx >= 0 ? row[provinceIdx] : '',
  };
}

// ── Router ────────────────────────────────────────────────────
function doGet(e) {
  const action = e.parameter.action || '';
  const params = _getParams(e);

  // Public routes
  if (action === 'loginWithPassword') return loginWithPassword(params);
  if (action === 'getPublicDashboard') return getPublicDashboard(e);

  // Auth required
  const token = params.token || '';
  const user = _getAuthedUser(token);
  if (!user) return _error('Unauthorized', 401);

  switch (action) {
    case 'getCases': return getCases(e, user);
    case 'getCase': return getCase(e, user);
    case 'getDashboard': return getDashboard(e, user);
    case 'getLookups': return getLookups(e, user);
    case 'getMe': return getMe(params, user, token);
    case 'getUsers': return getUsers(e, user);
    case 'createCase': return createCase(params, user);
    case 'updateCase': return updateCase(params, user);
    case 'closeCase': return closeCase(params, user);
    case 'reopenCase': return reopenCase(params, user);
    case 'addService': return addService(params, user);
    case 'addNote': return addNote(params, user);
    case 'updateNote': return updateNote(params, user);
    case 'saveLocation': return saveLocation(params, user);
    case 'getLocations': return getLocations(e, user);
    case 'getLatestLocation': return getLatestLocation(e, user);
    case 'createUser': return createUser(params, user);
    case 'updateUser': return updateUser(params, user);
    case 'toggleUser': return toggleUser(params, user);
    case 'setPassword': return setUserPassword(params, user);
    case 'changePassword': return changePassword(params, user);
    default: return _error('Unknown action');
  }
}

function doPost(e) {
  return _error('Use GET', 405);
}

function getMe(params, user, token) {
  // If already using a ses_ token, just return user info
  // No need to create another session
  if (token && token.startsWith(SESSION_TOKEN_PREFIX)) {
    return _output({
      email:    user.email,
      role:     user.role,
      lgu_code: user.lgu_code,
      region:   user.region,
      province: user.province,
    });
  }

  // Google JWT login — create a long-lived ses_ session token
  // so the user doesn't need to re-login after token expiry
  const sessionToken = _createSession(user.email);

  return _output({
    email:         user.email,
    role:          user.role,
    lgu_code:      user.lgu_code,
    region:        user.region,
    province:      user.province,
    session_token: sessionToken,
  });
}

function _createSession(email) {
  const sheet = _getSheet('sessions');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const tokenIdx   = headers.indexOf('token');
  const emailIdx   = headers.indexOf('email');
  const expiresIdx = headers.indexOf('expires_at');

  // Check if a valid session already exists for this email
  if (sheet.getLastRow() > 1) {
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    for (const row of rows) {
      const rowEmail   = row[emailIdx];
      const rowToken   = row[tokenIdx];
      const rowExpires = new Date(row[expiresIdx]);
      if (rowEmail === email && rowToken && rowExpires > new Date()) {
        return rowToken;   // reuse existing valid session
      }
    }
  }

  // Create new session — expires in 30 days
  const token    = SESSION_TOKEN_PREFIX + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      email + Date.now() + Math.random()
    )
  ).replace(/=/g, '').substring(0, 60);

  const expires  = new Date();
  expires.setDate(expires.getDate() + 30);   // 30 days

  // Build new row matching sessions sheet columns
  const newRow = headers.map(h => {
    if (h === 'token')      return token;
    if (h === 'email')      return email;
    if (h === 'expires_at') return expires.toISOString();
    return '';
  });

  sheet.appendRow(newRow);
  return token;
}