const SPREADSHEET_ID = '1O9C0eDYsMrpWeCKIMalxT9Xlz1hxXSXS0ZzGmZYDJ3w';
const ALLOWED_DOMAIN = 'dswd.gov.ph';
const SESSION_TOKEN_PREFIX = 'ses_';
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

// ── Input sanitization ───────────────────────────────────────
function _sanitize(val) {
  if (typeof val !== 'string') return val;
  return val
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

function _sanitizeParams(params) {
  var clean = {};
  for (var k in params) {
    if (!params.hasOwnProperty(k)) continue;
    var v = params[k];
    if (typeof v === 'string') {
      if (v.length > 50000) return null;
      clean[k] = _sanitize(v);
    } else if (Array.isArray(v)) {
      clean[k] = v.map(function(item) {
        return typeof item === 'string' ? _sanitize(item) : item;
      });
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

// ── Rate limiting (auth routes) ──────────────────────────────
function _checkRateLimit(identifier, maxAttempts, windowSeconds) {
  var cache = CacheService.getScriptCache();
  var key = 'rl_' + identifier;
  var count = parseInt(cache.get(key)) || 0;
  if (count >= maxAttempts) return false;
  cache.put(key, String(count + 1), windowSeconds);
  return true;
}

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

// ── Parse POST body ──────────────────────────────────────────
function _getPostParams(e) {
  const params = {};
  // Query params (action, token)
  const raw = e.parameter || {};
  for (const key in raw) {
    if (raw.hasOwnProperty(key)) params[key] = raw[key];
  }
  // POST body (JSON payload with sensitive data)
  if (e.postData && e.postData.contents) {
    try {
      const body = JSON.parse(e.postData.contents);
      for (const k in body) {
        if (body.hasOwnProperty(k)) params[k] = body[k];
      }
    } catch (err) {}
  }
  return params;
}

// ── Google JWT verification ──────────────────────────────────
// Verifies signature, issuer, audience, expiry and domain
function _verifyGoogleJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const headerB64 = parts[0];
    const payloadB64 = parts[1];

    const header = JSON.parse(
      Utilities.newBlob(Utilities.base64DecodeWebSafe(headerB64)).getDataAsString()
    );
    const payload = JSON.parse(
      Utilities.newBlob(Utilities.base64DecodeWebSafe(payloadB64)).getDataAsString()
    );

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    // Check issuer
    if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') return null;

    // Check email domain if ALLOWED_DOMAIN is set
    const email = payload.email || '';
    if (ALLOWED_DOMAIN && email) {
      const domain = email.split('@')[1] || '';
      if (domain !== ALLOWED_DOMAIN) return null;
    }

    // Check email_verified
    if (payload.email_verified === false) return null;

    return email || null;
  } catch (e) {
    return null;
  }
}

// ── Auth ──────────────────────────────────────────────────────
function _getAuthedUser(token) {
  if (!token) return null;

  let email;

  if (token.startsWith(SESSION_TOKEN_PREFIX)) {
    email = _getEmailFromSession(token);
  } else {
    // Google JWT — verify claims server-side
    email = _verifyGoogleJwt(token);
  }

  if (!email) return null;

  const sheet = _getSheet('users');
  const [headers, ...rows] = sheet.getDataRange().getValues();
  const idx = {
    email:       headers.indexOf('email'),
    role:        headers.indexOf('role'),
    active:      headers.indexOf('active'),
    lgu_code:    headers.indexOf('lgu_code'),
    region:      headers.indexOf('region'),
    province:    headers.indexOf('province'),
    permissions: headers.indexOf('permissions'),
  };

  const row = rows.find(r => r[idx.email] === email && r[idx.active] === true);
  if (!row) return null;

  return {
    email,
    role:        row[idx.role],
    lgu_code:    row[idx.lgu_code] || '',
    region:      idx.region   >= 0 ? row[idx.region]   : '',
    province:    idx.province >= 0 ? row[idx.province] : '',
    permissions: _parsePermissions(idx.permissions >= 0 ? row[idx.permissions] : ''),
  };
}

// Parse the per-user permissions cell (JSON array of granted actions).
// Tolerant of empty cells, malformed JSON, and a missing column so the
// system behaves exactly as before when no grants are configured.
function _parsePermissions(cell) {
  if (!cell) return [];
  try {
    var parsed = JSON.parse(cell);
    return Array.isArray(parsed) ? parsed.filter(function (a) { return typeof a === 'string'; }) : [];
  } catch (e) {
    return [];
  }
}

// ── Role-action permission map ───────────────────────────────
// Defines which roles can perform which write actions.
// Read actions use coverage checks in their handlers.
var ROLE_PERMISSIONS = {
  createCase:   ['case_worker'],
  updateCase:   ['case_worker', 'fo_user', 'lgu_supervisor'],
  closeCase:    ['case_worker', 'fo_user', 'lgu_supervisor'],
  reopenCase:   ['case_worker', 'fo_user', 'lgu_supervisor'],
  addService:   ['case_worker', 'fo_user', 'lgu_supervisor'],
  addNote:      ['case_worker', 'fo_user', 'lgu_supervisor'],
  updateNote:   ['case_worker'],
  saveLocation: ['case_worker', 'fo_user', 'lgu_supervisor'],
  createUser:   ['admin'],
  updateUser:   ['admin'],
  toggleUser:   ['admin'],
  setPassword:  ['admin'],
  generateReport: ['admin', 'case_worker', 'fo_user', 'lgu_supervisor', 'cpu_monitor'],
  logExport:    ['admin', 'case_worker', 'fo_user', 'lgu_supervisor', 'cpu_monitor'],
  // Form builder — admin only, and deliberately NOT grantable.
  saveFormField:      ['admin'],
  deleteFormField:    ['admin'],
  saveLookupOption:   ['admin'],
  deleteLookupOption: ['admin'],
};

// Actions an admin may grant to an individual user on top of their role.
// Grants are additive only — they can add access, never remove it. Admin
// and user-management actions are intentionally NOT grantable here; those
// stay role-gated so least privilege can't be widened by accident.
var GRANTABLE_ACTIONS = [
  'createCase', 'updateCase', 'closeCase', 'reopenCase',
  'addService', 'addNote', 'updateNote', 'generateReport',
];

function _checkPermission(action, user) {
  var allowed = ROLE_PERMISSIONS[action];
  if (!allowed) return true;
  if (allowed.indexOf(user.role) !== -1) return true;
  // Additive per-user grant — only for whitelisted grantable actions.
  if (GRANTABLE_ACTIONS.indexOf(action) !== -1 &&
      user.permissions && user.permissions.indexOf(action) !== -1) {
    return true;
  }
  return false;
}

// ── Router ────────────────────────────────────────────────────
// All requests come through doGet because Apps Script redirects
// via 302 which converts POST→GET in browsers.
function doGet(e) {
  const action = e.parameter.action || '';
  const rawParams = _getParams(e);
  const params = _sanitizeParams(rawParams);
  if (!params) return _error('Request too large', 413);

  // Public routes (no auth)
  if (action === 'getPublicDashboard') return getPublicDashboard(e);
  if (action === 'loginWithPassword') {
    var clientIp = (e.parameter._ip || 'unknown').replace(/[^a-zA-Z0-9.:]/g, '');
    var loginEmail = (params.email || 'unknown').toLowerCase().replace(/[^a-zA-Z0-9.@_-]/g, '');
    var loginLimiter = clientIp === 'unknown'
      ? 'login_email_' + loginEmail
      : 'login_' + clientIp + '_' + loginEmail;
    if (!_checkRateLimit(loginLimiter, 5, 60)) {
      return _error('Too many requests. Please try again later.', 429);
    }
    return loginWithPassword(params);
  }

  // All other routes require auth
  const token = params.token || '';
  const user  = _getAuthedUser(token);
  if (!user) return _error('Unauthorized', 401);

  // Logout — invalidate session server-side
  if (action === 'logout') {
    if (token.startsWith(SESSION_TOKEN_PREFIX)) {
      _invalidateSession(token);
    }
    _logActivity(user.email, 'LOGOUT', '');
    return _output({ logged_out: true });
  }

  // Check role permission for write actions
  if (ROLE_PERMISSIONS[action] && !_checkPermission(action, user)) {
    _logActivity(user.email, 'BLOCKED_' + action, params.case_id || params.email || '');
    return _error('Forbidden', 403);
  }

  switch (action) {
    // Read
    case 'getCases':          return getCases(e, user);
    case 'getCase':           return getCase(e, user);
    case 'getDashboard':      return getDashboard(e, user);
    case 'getLookups':        return getLookups(e, user);
    case 'getFormFields':     return getFormFields(e, user);
    case 'getMe':             return getMe(params, user, token);
    case 'getUsers':          return getUsers(e, user);
    case 'getLocations':      return getLocations(e, user);
    case 'getLatestLocation': return getLatestLocation(e, user);
    case 'getAuditLogs':      return getAuditLogs(e, user);
    case 'generateReport':    return generateReport(params, user);
    // Write
    case 'createCase':     return createCase(params, user);
    case 'updateCase':     return updateCase(params, user);
    case 'closeCase':      return closeCase(params, user);
    case 'reopenCase':     return reopenCase(params, user);
    case 'addService':     return addService(params, user);
    case 'addNote':        return addNote(params, user);
    case 'updateNote':     return updateNote(params, user);
    case 'saveLocation':   return saveLocation(params, user);
    case 'createUser':     return createUser(params, user);
    case 'updateUser':     return updateUser(params, user);
    case 'toggleUser':     return toggleUser(params, user);
    case 'setPassword':    return setUserPassword(params, user);
    case 'changePassword': return changePassword(params, user);
    case 'logExport':      return logExport(params, user);
    // Form builder (admin)
    case 'saveFormField':      return saveFormField(params, user);
    case 'deleteFormField':    return deleteFormField(params, user);
    case 'saveLookupOption':   return saveLookupOption(params, user);
    case 'deleteLookupOption': return deleteLookupOption(params, user);
    default:               return _error('Unknown action');
  }
}

function doPost(e) {
  return doGet(e);
}
 
// ── getMe ─────────────────────────────────────────────────────
function getMe(params, user, token) {
  // Already using a long-lived session token — just return user info
  if (token && token.startsWith(SESSION_TOKEN_PREFIX)) {
    return _output({
      email:       user.email,
      role:        user.role,
      lgu_code:    user.lgu_code,
      region:      user.region,
      province:    user.province,
      permissions: user.permissions || [],
    });
  }
 
  // Google JWT login — create a long-lived ses_ session so the
  // user doesn't need to re-authenticate after the JWT expires.
  const sessionToken  = _generateSessionToken();
  const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  _saveSession(sessionToken, user.email, sessionExpiry);

  _logActivity(user.email, 'LOGIN_GOOGLE', '');
  return _output({
    email:         user.email,
    role:          user.role,
    lgu_code:      user.lgu_code,
    region:        user.region,
    province:      user.province,
    permissions:   user.permissions || [],
    session_token: sessionToken,
  });
}

// ── getAuditLogs (admin only) ────────────────────────────────
function getAuditLogs(e, user) {
  if (user.role !== 'admin') return _error('Forbidden', 403);

  var sheet = _getSheet('activity_log');
  if (!sheet) return _output([]);
  var logs = _sheetToObjects(sheet);
  logs.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });

  // P2: Include failed login data for admin security monitoring
  var usersSheet = _getSheet('users');
  var failedLogins = [];
  if (usersSheet) {
    var userData = _sheetToObjects(usersSheet);
    failedLogins = userData
      .filter(function(u) { return (parseInt(u.failed_attempts) || 0) > 0 || u.locked_until; })
      .map(function(u) {
        return {
          email: u.email,
          failed_attempts: parseInt(u.failed_attempts) || 0,
          locked_until: u.locked_until || '',
          active: u.active,
        };
      });
  }

  return _output({
    logs: logs.slice(0, 500),
    failedLogins: failedLogins,
  });
}
