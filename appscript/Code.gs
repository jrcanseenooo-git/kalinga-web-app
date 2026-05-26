const SPREADSHEET_ID = '';
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
    case 'getMe': return _output(user);
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