const SPREADSHEET_ID = '';
const ALLOWED_DOMAIN = 'dswd.gov.ph';
const SESSION_TOKEN_PREFIX = 'ses_';

// ── Output helpers ────────────────────────────────────────────
function _output(data, status) {
  status = status || 200;
  const payload = JSON.stringify({ status: status, data: data });
  return ContentService
    .createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}

function _error(message, status) {
  status = status || 400;
  return _output({ error: message }, status);
}

// ── Parse params: merges JSON payload if present ─────────────
function _getParams(e) {
  const params = {};
  const raw = e.parameter || {};
  for (const key in raw) {
    if (raw.hasOwnProperty(key)) params[key] = raw[key];
  }
  if (params.payload) {
    try {
      const parsed = JSON.parse(params.payload);
      for (const k in parsed) {
        if (parsed.hasOwnProperty(k)) params[k] = parsed[k];
      }
    } catch (err) {}
    delete params.payload;
  }
  return params;
}

// ── Auth ──────────────────────────────────────────────────────
function _getAuthedUser(token) {
  if (!token) return null;

  let email;

  if (token.startsWith(SESSION_TOKEN_PREFIX)) {
    // Email/password session — defined in Auth.gs
    email = _getEmailFromSession(token);
  } else {
    // Google JWT — decode the middle segment
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

  const sheet = _getSheet('users');
  const [headers, ...rows] = sheet.getDataRange().getValues();
  const idx = {
    email:    headers.indexOf('email'),
    role:     headers.indexOf('role'),
    active:   headers.indexOf('active'),
    lgu_code: headers.indexOf('lgu_code'),
    region:   headers.indexOf('region'),
    province: headers.indexOf('province'),
  };

  const row = rows.find(r => r[idx.email] === email && r[idx.active] === true);
  if (!row) return null;

  return {
    email,
    role:     row[idx.role],
    lgu_code: row[idx.lgu_code] || '',
    region:   idx.region   >= 0 ? row[idx.region]   : '',
    province: idx.province >= 0 ? row[idx.province] : '',
  };
}

// ── Router ────────────────────────────────────────────────────
function doGet(e) {
  const action = e.parameter.action || '';
  const params = _getParams(e);

  // Public routes (no auth)
  if (action === 'loginWithPassword')  return loginWithPassword(params);
  if (action === 'getPublicDashboard') return getPublicDashboard(e);

  // All other routes require auth
  const token = params.token || '';
  const user  = _getAuthedUser(token);
  if (!user) return _error('Unauthorized', 401);

  switch (action) {
    case 'getCases':          return getCases(e, user);
    case 'getCase':           return getCase(e, user);
    case 'getDashboard':      return getDashboard(e, user);
    case 'getLookups':        return getLookups(e, user);
    case 'getMe':             return getMe(params, user, token);
    case 'getUsers':          return getUsers(e, user);
    case 'createCase':        return createCase(params, user);
    case 'updateCase':        return updateCase(params, user);
    case 'closeCase':         return closeCase(params, user);
    case 'reopenCase':        return reopenCase(params, user);
    case 'addService':        return addService(params, user);
    case 'addNote':           return addNote(params, user);
    case 'updateNote':        return updateNote(params, user);
    case 'saveLocation':      return saveLocation(params, user);
    case 'getLocations':      return getLocations(e, user);
    case 'getLatestLocation': return getLatestLocation(e, user);
    case 'createUser':        return createUser(params, user);
    case 'updateUser':        return updateUser(params, user);
    case 'toggleUser':        return toggleUser(params, user);
    case 'setPassword':       return setUserPassword(params, user);
    case 'changePassword':    return changePassword(params, user);
    default:                  return _error('Unknown action');
  }
}

function doPost(e) {
  return _error('Use GET', 405);
}

// ── getMe ─────────────────────────────────────────────────────
function getMe(params, user, token) {
  // Already using a long-lived session token — just return user info
  if (token && token.startsWith(SESSION_TOKEN_PREFIX)) {
    return _output({
      email:    user.email,
      role:     user.role,
      lgu_code: user.lgu_code,
      region:   user.region,
      province: user.province,
    });
  }

  // Google JWT login — create a long-lived ses_ session so the
  // user doesn't need to re-authenticate after the JWT expires.
  const sessionToken  = _generateSessionToken();
  const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  _saveSession(sessionToken, user.email, sessionExpiry);

  return _output({
    email:         user.email,
    role:          user.role,
    lgu_code:      user.lgu_code,
    region:        user.region,
    province:      user.province,
    session_token: sessionToken,
  });
}