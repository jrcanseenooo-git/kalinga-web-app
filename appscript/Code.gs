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

// ── Sheet helper ──────────────────────────────────────────────
function _getSheet(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
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
    } catch (err) {}
    delete params.payload;
  }
  return params;
}

// ── Session helpers ───────────────────────────────────────────
function _getEmailFromSession(token) {
  var sheet = _getSheet('sessions');
  if (sheet.getLastRow() < 2) return null;
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var tokenIdx   = headers.indexOf('token');
  var emailIdx   = headers.indexOf('email');
  var expiresIdx = headers.indexOf('expires_at');
  for (var i = 1; i < data.length; i++) {
    if (data[i][tokenIdx] === token) {
      var expires = new Date(data[i][expiresIdx]);
      if (expires > new Date()) return data[i][emailIdx];
    }
  }
  return null;
}

// ── Auth ──────────────────────────────────────────────────────
function _getAuthedUser(token) {
  if (!token) return null;

  var email;

  if (token.startsWith(SESSION_TOKEN_PREFIX)) {
    email = _getEmailFromSession(token);
  } else {
    try {
      var parts = token.split('.');
      var payload = JSON.parse(
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

  var sheet = _getSheet('users');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idx = {
    email:    headers.indexOf('email'),
    role:     headers.indexOf('role'),
    active:   headers.indexOf('active'),
    lgu_code: headers.indexOf('lgu_code'),
    region:   headers.indexOf('region'),
    province: headers.indexOf('province'),
  };

  for (var i = 1; i < data.length; i++) {
    if (data[i][idx.email] === email && data[i][idx.active] === true) {
      return {
        email:    email,
        role:     data[i][idx.role],
        lgu_code: data[i][idx.lgu_code] || '',
        region:   idx.region   >= 0 ? data[i][idx.region]   : '',
        province: idx.province >= 0 ? data[i][idx.province] : '',
      };
    }
  }
  return null;
}

// ── Router ────────────────────────────────────────────────────
function doGet(e) {
  var action = e.parameter.action || '';
  var params = _getParams(e);

  // Public routes
  if (action === 'loginWithPassword')  return loginWithPassword(params);
  if (action === 'getPublicDashboard') return getPublicDashboard(params);

  // Auth required
  var token = params.token || '';
  var user  = _getAuthedUser(token);
  if (!user) return _error('Unauthorized', 401);

  switch (action) {
    case 'getCases':          return getCases(params, user);
    case 'getCase':           return getCase(params, user);
    case 'getDashboard':      return getDashboard(params, user);
    case 'getLookups':        return getLookups(params, user);
    case 'getMe':             return getMe(params, user, token);
    case 'getUsers':          return getUsers(params, user);
    case 'createCase':        return createCase(params, user);
    case 'updateCase':        return updateCase(params, user);
    case 'closeCase':         return closeCase(params, user);
    case 'reopenCase':        return reopenCase(params, user);
    case 'addService':        return addService(params, user);
    case 'addNote':           return addNote(params, user);
    case 'updateNote':        return updateNote(params, user);
    case 'saveLocation':      return saveLocation(params, user);
    case 'getLocations':      return getLocations(params, user);
    case 'getLatestLocation': return getLatestLocation(params, user);
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
  if (token && token.startsWith(SESSION_TOKEN_PREFIX)) {
    return _output({
      email:    user.email,
      role:     user.role,
      lgu_code: user.lgu_code,
      region:   user.region,
      province: user.province,
    });
  }
  var sessionToken = _createSession(user.email);
  return _output({
    email:         user.email,
    role:          user.role,
    lgu_code:      user.lgu_code,
    region:        user.region,
    province:      user.province,
    session_token: sessionToken,
  });
}

// ── Session management ────────────────────────────────────────
function _createSession(email) {
  var sheet   = _getSheet('sessions');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var tokenIdx   = headers.indexOf('token');
  var emailIdx   = headers.indexOf('email');
  var expiresIdx = headers.indexOf('expires_at');

  if (sheet.getLastRow() > 1) {
    var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][emailIdx] === email && rows[i][tokenIdx] && new Date(rows[i][expiresIdx]) > new Date()) {
        return rows[i][tokenIdx];
      }
    }
  }

  var token = SESSION_TOKEN_PREFIX + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      email + Date.now() + Math.random()
    )
  ).replace(/=/g, '').substring(0, 60);

  var expires = new Date();
  expires.setDate(expires.getDate() + 30);

  var newRow = headers.map(function(h) {
    if (h === 'token')      return token;
    if (h === 'email')      return email;
    if (h === 'expires_at') return expires.toISOString();
    return '';
  });
  sheet.appendRow(newRow);
  return token;
}

// ── loginWithPassword ─────────────────────────────────────────
function loginWithPassword(params) {
  var email    = (params.email || '').toLowerCase().trim();
  var password = params.password || '';
  if (!email || !password) return _error('Email and password required');

  var sheet   = _getSheet('users');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var col = function(n) { return headers.indexOf(n); };

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[col('email')]).toLowerCase() !== email) continue;
    if (row[col('active')] !== true) return _error('Account is inactive');

    var storedHash = row[col('password_hash')] || '';
    var salt       = row[col('salt')]          || '';
    if (!storedHash) return _error('Password not set. Contact your administrator.');

    var inputHash = Utilities.computeHexDigest(
      Utilities.DigestAlgorithm.SHA_256,
      salt + password
    );
    if (inputHash !== storedHash) return _error('Invalid email or password');

    var mustChange = row[col('must_change_password')];
    var sessionToken = _createSession(email);

    return _output({
      session_token:        sessionToken,
      must_change_password: mustChange === true,
      user: {
        email:        row[col('email')],
        display_name: row[col('display_name')] || '',
        role:         row[col('role')]         || '',
        lgu_code:     row[col('lgu_code')]     || '',
        region:       col('region')   >= 0 ? row[col('region')]   : '',
        province:     col('province') >= 0 ? row[col('province')] : '',
      }
    });
  }
  return _error('Invalid email or password');
}

// ── changePassword ────────────────────────────────────────────
function changePassword(params, user) {
  var newPassword = params.new_password || '';
  if (newPassword.length < 8) return _error('Password must be at least 8 characters');

  var sheet   = _getSheet('users');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var emailCol = headers.indexOf('email');
  var hashCol  = headers.indexOf('password_hash');
  var saltCol  = headers.indexOf('salt');
  var mustCol  = headers.indexOf('must_change_password');

  for (var i = 1; i < data.length; i++) {
    if (data[i][emailCol] === user.email) {
      var salt = Utilities.base64EncodeWebSafe(
        Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(Math.random()))
      ).substring(0, 16);
      var hash = Utilities.computeHexDigest(Utilities.DigestAlgorithm.SHA_256, salt + newPassword);
      sheet.getRange(i + 1, hashCol + 1).setValue(hash);
      sheet.getRange(i + 1, saltCol  + 1).setValue(salt);
      if (mustCol >= 0) sheet.getRange(i + 1, mustCol + 1).setValue(false);
      return _output({ success: true });
    }
  }
  return _error('User not found');
}

function setUserPassword(params, user) {
  if (user.role !== 'admin') return _error('Forbidden', 403);
  var targetEmail = params.email || '';
  var newPassword = params.password || '';
  if (!targetEmail || !newPassword) return _error('Email and password required');

  var sheet   = _getSheet('users');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var emailCol = headers.indexOf('email');
  var hashCol  = headers.indexOf('password_hash');
  var saltCol  = headers.indexOf('salt');
  var mustCol  = headers.indexOf('must_change_password');

  for (var i = 1; i < data.length; i++) {
    if (data[i][emailCol] === targetEmail) {
      var salt = Utilities.base64EncodeWebSafe(
        Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(Math.random()))
      ).substring(0, 16);
      var hash = Utilities.computeHexDigest(Utilities.DigestAlgorithm.SHA_256, salt + newPassword);
      sheet.getRange(i + 1, hashCol + 1).setValue(hash);
      sheet.getRange(i + 1, saltCol  + 1).setValue(salt);
      if (mustCol >= 0) sheet.getRange(i + 1, mustCol + 1).setValue(true);
      return _output({ success: true });
    }
  }
  return _error('User not found');
}

// ── getLookups ────────────────────────────────────────────────
function getLookups(params, user) {
  var sheet   = _getSheet('lookups');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var typeCol  = headers.indexOf('lookup_type');
  var valueCol = headers.indexOf('value');
  var labelCol = headers.indexOf('label');
  var sortCol  = headers.indexOf('sort_order');

  var result = {};
  for (var i = 1; i < data.length; i++) {
    var type  = data[i][typeCol];
    var value = data[i][valueCol];
    var label = data[i][labelCol];
    if (!type || !value) continue;
    if (!result[type]) result[type] = [];
    result[type].push({ value: value, label: label });
  }
  return _output(result);
}

// ── Row → object helper ───────────────────────────────────────
function _rowToObj(headers, row) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) {
    var val = row[i];
    obj[headers[i]] = (val instanceof Date) ? val.toISOString() : (val === null || val === undefined ? '' : val);
  }
  return obj;
}

// ── getCases ──────────────────────────────────────────────────
function getCases(params, user) {
  var sheet = _getSheet('cases');
  var data  = sheet.getDataRange().getValues();
  if (data.length < 2) return _output([]);
  var headers = data[0];

  var cases = [];
  for (var i = 1; i < data.length; i++) {
    var obj = _rowToObj(headers, data[i]);
    // LGU/FO users only see their own cases
    if (user.role === 'lgu_supervisor' || user.role === 'fo_user') {
      if (user.lgu_code && obj.lgu_code !== user.lgu_code) continue;
    } else if (user.role === 'case_worker') {
      if (obj.case_worker_email !== user.email) continue;
    }
    cases.push(obj);
  }
  return _output(cases);
}

// ── getCase ───────────────────────────────────────────────────
function getCase(params, user) {
  var caseId = params.case_id || '';
  if (!caseId) return _error('case_id required');

  var sheet = _getSheet('cases');
  var data  = sheet.getDataRange().getValues();
  var headers = data[0];
  var caseIdCol = headers.indexOf('case_id');

  var caseRow = null;
  for (var i = 1; i < data.length; i++) {
    if (data[i][caseIdCol] === caseId) { caseRow = data[i]; break; }
  }
  if (!caseRow) return _error('Case not found', 404);

  var caseObj = _rowToObj(headers, caseRow);

  // Attach progress notes
  var notesSheet = _getSheet('progress_notes');
  var notesData  = notesSheet.getDataRange().getValues();
  var nHeaders   = notesData[0];
  var nCaseId    = nHeaders.indexOf('case_id');
  caseObj._notes = [];
  for (var j = 1; j < notesData.length; j++) {
    if (notesData[j][nCaseId] === caseId) {
      caseObj._notes.push(_rowToObj(nHeaders, notesData[j]));
    }
  }

  // Attach services
  var svcSheet = _getSheet('services');
  var svcData  = svcSheet.getDataRange().getValues();
  var sHeaders = svcData[0];
  var sCaseId  = sHeaders.indexOf('case_id');
  caseObj._services = [];
  for (var k = 1; k < svcData.length; k++) {
    if (svcData[k][sCaseId] === caseId) {
      caseObj._services.push(_rowToObj(sHeaders, svcData[k]));
    }
  }

  // Attach family members from dedicated sheet
  var famSheet = _getSheet('family_members');
  var famData  = famSheet.getDataRange().getValues();
  var fHeaders = famData[0];
  var fCaseId  = fHeaders.indexOf('case_id');
  caseObj._family = [];
  for (var f = 1; f < famData.length; f++) {
    if (famData[f][fCaseId] === caseId) {
      caseObj._family.push(_rowToObj(fHeaders, famData[f]));
    }
  }

  return _output(caseObj);
}

// ── createCase ────────────────────────────────────────────────
function createCase(params, user) {
  var sheet    = _getSheet('cases');
  var famSheet = _getSheet('family_members');

  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];

  var offlineIdCol = headers.indexOf('offline_id');

  // ── Idempotency check (offline deduplication) ─────────────
  if (params.offline_id && offlineIdCol !== -1) {
    for (var i = 1; i < allData.length; i++) {
      if (allData[i][offlineIdCol] === params.offline_id) {
        var existingId = allData[i][headers.indexOf('case_id')];
        Logger.log('createCase: duplicate offline_id — returning existing case_id=' + existingId);
        return _output({ case_id: existingId });
      }
    }
  }

  // ── Generate case_id ──────────────────────────────────────
  var now       = new Date();
  var tz        = Session.getScriptTimeZone();
  var yearMonth = Utilities.formatDate(now, tz, 'yyyyMM');
  var random    = Math.random().toString(36).substring(2, 7).toUpperCase();
  var caseId    = 'CEFMU-' + yearMonth + '-' + random;
  var nowIso    = now.toISOString();

  // ── Normalise array fields ─────────────────────────────────
  function toStr(val) {
    if (!val) return '';
    if (Array.isArray(val)) return val.join(', ');
    try {
      var p = JSON.parse(val);
      if (Array.isArray(p)) return p.join(', ');
    } catch(e) {}
    return String(val);
  }

  var fieldMap = {
    case_id:             caseId,
    date_intake:         params.date_intake         || '',
    status:              'active',
    client_last:         params.client_last         || '',
    client_first:        params.client_first        || '',
    client_mi:           params.client_mi           || '',
    suffix:              params.suffix              || '',
    birthdate:           params.birthdate           || '',
    sex:                 params.sex                 || '',
    age:                 params.age                 || '',
    civil_status:        params.civil_status        || '',
    religion:            params.religion            || '',
    ip_category:         params.ip_category         || '',
    education:           params.education           || '',
    phone:               params.phone               || '',
    occupation:          params.occupation          || '',
    income:              params.income              || '',
    philhealth_no:       params.philhealth_no       || '',
    present_street:      params.present_street      || '',
    region:              params.region              || '',
    province:            params.province            || '',
    city_muni:           params.city_muni           || '',
    barangay:            params.barangay            || '',
    per_street:          params.per_street          || '',
    per_region:          params.per_region          || '',
    per_province:        params.per_province        || '',
    per_city_muni:       params.per_city_muni       || '',
    per_barangay:        params.per_barangay        || '',
    classification:      toStr(params.classification),
    other_circumstances: toStr(params.other_circumstances),
    cefmu_type:          params.cefmu_type          || '',
    admission_mode:      params.admission_mode      || '',
    aics_form_no:        params.aics_form_no        || '',
    lgu_code:            params.lgu_code            || user.lgu_code || '',
    referred_by:         params.referred_by         || '',
    referral_date:       params.referral_date       || '',
    presenting_problem:  params.presenting_problem  || '',
    initial_assessment:  params.initial_assessment  || '',
    plan_of_action:      params.plan_of_action      || '',
    remarks:             params.remarks             || '',
    family_members:      params.family_members      || '',
    case_worker_email:   user.email                 || '',
    date_closed:         '',
    created_at:          nowIso,
    updated_at:          nowIso,
    offline_id:          params.offline_id          || '',
  };

  var newRow = headers.map(function(h) {
    return fieldMap.hasOwnProperty(h) ? fieldMap[h] : '';
  });
  sheet.appendRow(newRow);

  // ── Write family members ───────────────────────────────────
  if (params.family_members && famSheet) {
    try {
      var members = JSON.parse(params.family_members);
      if (Array.isArray(members) && members.length > 0) {
        var famHeaders = famSheet.getRange(1, 1, 1, famSheet.getLastColumn()).getValues()[0];
        members.forEach(function(m) {
          var memberId  = 'MBR-' + Utilities.getUuid().substring(0, 8).toUpperCase();
          var memberMap = {
            member_id:    memberId,
            case_id:      caseId,
            client_last:  params.client_last  || '',
            client_first: params.client_first || '',
            city_muni:    params.city_muni    || '',
            province:     params.province     || '',
            region:       params.region       || '',
            name:         m.name              || '',
            birthdate:    m.birthdate         || '',
            age:          m.age               || '',
            sex:          m.sex               || '',
            relationship: m.relationship      || '',
            education:    m.education         || '',
            occupation:   m.occupation        || '',
            created_at:   nowIso,
            updated_at:   nowIso,
          };
          var memberRow = famHeaders.map(function(h) {
            return memberMap.hasOwnProperty(h) ? memberMap[h] : '';
          });
          famSheet.appendRow(memberRow);
        });
      }
    } catch(e) {
      Logger.log('createCase: family_members parse error — ' + e.message);
    }
  }

  return _output({ case_id: caseId });
}

// ── updateCase ────────────────────────────────────────────────
function updateCase(params, user) {
  var caseId = params.case_id || '';
  if (!caseId) return _error('case_id required');

  var sheet   = _getSheet('cases');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var caseIdCol = headers.indexOf('case_id');

  for (var i = 1; i < data.length; i++) {
    if (data[i][caseIdCol] !== caseId) continue;

    function toStr(val) {
      if (!val) return '';
      if (Array.isArray(val)) return val.join(', ');
      try { var p = JSON.parse(val); if (Array.isArray(p)) return p.join(', '); } catch(e) {}
      return String(val);
    }

    var updatable = [
      'date_intake','client_last','client_first','client_mi','suffix',
      'birthdate','sex','age','civil_status','religion','ip_category','education',
      'phone','occupation','income','philhealth_no',
      'present_street','region','province','city_muni','barangay',
      'per_street','per_region','per_province','per_city_muni','per_barangay',
      'cefmu_type','admission_mode','aics_form_no','lgu_code',
      'referred_by','referral_date',
      'presenting_problem','initial_assessment','plan_of_action','remarks',
    ];

    updatable.forEach(function(field) {
      var col = headers.indexOf(field);
      if (col >= 0 && params[field] !== undefined) {
        sheet.getRange(i + 1, col + 1).setValue(params[field]);
      }
    });

    // Array fields
    ['classification','other_circumstances'].forEach(function(field) {
      var col = headers.indexOf(field);
      if (col >= 0 && params[field] !== undefined) {
        sheet.getRange(i + 1, col + 1).setValue(toStr(params[field]));
      }
    });

    // family_members JSON column
    var famCol = headers.indexOf('family_members');
    if (famCol >= 0 && params.family_members !== undefined) {
      sheet.getRange(i + 1, famCol + 1).setValue(params.family_members);
    }

    // updated_at
    var updatedCol = headers.indexOf('updated_at');
    if (updatedCol >= 0) sheet.getRange(i + 1, updatedCol + 1).setValue(new Date().toISOString());

    // Sync family members sheet
    if (params.family_members) {
      try {
        var famSheet   = _getSheet('family_members');
        var famData    = famSheet.getDataRange().getValues();
        var famHeaders = famData[0];
        var famCaseCol = famHeaders.indexOf('case_id');
        // Delete existing rows for this case (scan bottom-up)
        for (var r = famData.length - 1; r >= 1; r--) {
          if (famData[r][famCaseCol] === caseId) famSheet.deleteRow(r + 1);
        }
        var members = JSON.parse(params.family_members);
        if (Array.isArray(members)) {
          var nowIso = new Date().toISOString();
          members.forEach(function(m) {
            var memberId  = 'MBR-' + Utilities.getUuid().substring(0, 8).toUpperCase();
            var memberMap = {
              member_id:    memberId,
              case_id:      caseId,
              client_last:  params.client_last  || '',
              client_first: params.client_first || '',
              city_muni:    params.city_muni    || '',
              province:     params.province     || '',
              region:       params.region       || '',
              name:         m.name              || '',
              birthdate:    m.birthdate         || '',
              age:          m.age               || '',
              sex:          m.sex               || '',
              relationship: m.relationship      || '',
              education:    m.education         || '',
              occupation:   m.occupation        || '',
              created_at:   nowIso,
              updated_at:   nowIso,
            };
            var memberRow = famHeaders.map(function(h) {
              return memberMap.hasOwnProperty(h) ? memberMap[h] : '';
            });
            famSheet.appendRow(memberRow);
          });
        }
      } catch(e) {
        Logger.log('updateCase: family_members error — ' + e.message);
      }
    }

    return _output({ success: true });
  }
  return _error('Case not found', 404);
}

// ── closeCase ─────────────────────────────────────────────────
function closeCase(params, user) {
  var caseId = params.case_id || '';
  if (!caseId) return _error('case_id required');

  var sheet   = _getSheet('cases');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var caseIdCol   = headers.indexOf('case_id');
  var statusCol   = headers.indexOf('status');
  var closedCol   = headers.indexOf('date_closed');
  var updatedCol  = headers.indexOf('updated_at');
  var now = new Date().toISOString();

  for (var i = 1; i < data.length; i++) {
    if (data[i][caseIdCol] === caseId) {
      sheet.getRange(i + 1, statusCol  + 1).setValue('closed');
      sheet.getRange(i + 1, closedCol  + 1).setValue(now);
      sheet.getRange(i + 1, updatedCol + 1).setValue(now);
      return _output({ success: true });
    }
  }
  return _error('Case not found', 404);
}

// ── reopenCase ────────────────────────────────────────────────
function reopenCase(params, user) {
  var caseId = params.case_id || '';
  if (!caseId) return _error('case_id required');

  var sheet   = _getSheet('cases');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var caseIdCol  = headers.indexOf('case_id');
  var statusCol  = headers.indexOf('status');
  var closedCol  = headers.indexOf('date_closed');
  var updatedCol = headers.indexOf('updated_at');
  var now = new Date().toISOString();

  for (var i = 1; i < data.length; i++) {
    if (data[i][caseIdCol] === caseId) {
      sheet.getRange(i + 1, statusCol  + 1).setValue('active');
      sheet.getRange(i + 1, closedCol  + 1).setValue('');
      sheet.getRange(i + 1, updatedCol + 1).setValue(now);
      return _output({ success: true });
    }
  }
  return _error('Case not found', 404);
}

// ── addNote ───────────────────────────────────────────────────
function addNote(params, user) {
  var caseId = params.case_id || '';
  if (!caseId) return _error('case_id required');

  var sheet   = _getSheet('progress_notes');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var noteId  = 'NOTE-' + Utilities.getUuid().substring(0, 8).toUpperCase();
  var nowIso  = new Date().toISOString();

  var fieldMap = {
    note_id:      noteId,
    case_id:      caseId,
    date_note:    params.date_note    || nowIso.slice(0, 10),
    note_type:    params.note_type    || '',
    content:      params.content      || '',
    action_taken: params.action_taken || '',
    next_steps:   params.next_steps   || '',
    created_by:   user.email,
    created_at:   nowIso,
  };

  var newRow = headers.map(function(h) {
    return fieldMap.hasOwnProperty(h) ? fieldMap[h] : '';
  });
  sheet.appendRow(newRow);
  return _output({ note_id: noteId });
}

// ── updateNote ────────────────────────────────────────────────
function updateNote(params, user) {
  var noteId = params.note_id || '';
  if (!noteId) return _error('note_id required');

  var sheet   = _getSheet('progress_notes');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var noteIdCol = headers.indexOf('note_id');

  var updatable = ['date_note','note_type','content','action_taken','next_steps'];

  for (var i = 1; i < data.length; i++) {
    if (data[i][noteIdCol] === noteId) {
      updatable.forEach(function(field) {
        var col = headers.indexOf(field);
        if (col >= 0 && params[field] !== undefined) {
          sheet.getRange(i + 1, col + 1).setValue(params[field]);
        }
      });
      return _output({ success: true });
    }
  }
  return _error('Note not found', 404);
}

// ── addService ────────────────────────────────────────────────
function addService(params, user) {
  var caseId = params.case_id || '';
  if (!caseId) return _error('case_id required');

  var sheet   = _getSheet('services');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var svcId   = 'SVC-' + Utilities.getUuid().substring(0, 8).toUpperCase();

  var fieldMap = {
    service_id:    svcId,
    case_id:       caseId,
    service_type:  params.service_type  || '',
    amount:        params.amount        || '',
    date_provided: params.date_provided || '',
    provided_by:   user.email,
  };

  var newRow = headers.map(function(h) {
    return fieldMap.hasOwnProperty(h) ? fieldMap[h] : '';
  });
  sheet.appendRow(newRow);
  return _output({ service_id: svcId });
}

// ── saveLocation ──────────────────────────────────────────────
function saveLocation(params, user) {
  var caseId = params.case_id || '';
  if (!caseId) return _error('case_id required');

  var sheet   = _getSheet('case_locations');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var locId   = 'LOC-' + Utilities.getUuid().substring(0, 8).toUpperCase();
  var nowIso  = new Date().toISOString();

  // Get client name from cases sheet
  var casesSheet = _getSheet('cases');
  var casesData  = casesSheet.getDataRange().getValues();
  var cHeaders   = casesData[0];
  var clientLast = '', clientFirst = '', clientMi = '';
  for (var i = 1; i < casesData.length; i++) {
    if (casesData[i][cHeaders.indexOf('case_id')] === caseId) {
      clientLast  = casesData[i][cHeaders.indexOf('client_last')]  || '';
      clientFirst = casesData[i][cHeaders.indexOf('client_first')] || '';
      clientMi    = casesData[i][cHeaders.indexOf('client_mi')]    || '';
      break;
    }
  }

  var fieldMap = {
    location_id:           locId,
    case_id:               caseId,
    client_last:           clientLast,
    client_first:          clientFirst,
    client_mi:             clientMi,
    perm_region:           params.perm_region           || '',
    perm_province:         params.perm_province         || '',
    perm_city_muni:        params.perm_city_muni        || '',
    perm_barangay:         params.perm_barangay         || '',
    current_lgu:           params.current_lgu           || '',
    current_province:      params.current_province      || '',
    current_region:        params.current_region        || '',
    current_barangay:      params.current_barangay      || '',
    current_address_notes: params.current_address_notes || '',
    latitude:              params.latitude              || '',
    longitude:             params.longitude             || '',
    recorded_by:           user.email,
    recorded_at:           nowIso,
    transfer_reason:       params.transfer_reason       || '',
  };

  var newRow = headers.map(function(h) {
    return fieldMap.hasOwnProperty(h) ? fieldMap[h] : '';
  });
  sheet.appendRow(newRow);
  return _output({ location_id: locId });
}

// ── getLocations ──────────────────────────────────────────────
function getLocations(params, user) {
  var caseId = params.case_id || '';
  if (!caseId) return _error('case_id required');

  var sheet   = _getSheet('case_locations');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var caseIdCol = headers.indexOf('case_id');

  var results = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][caseIdCol] === caseId) results.push(_rowToObj(headers, data[i]));
  }
  return _output(results);
}

// ── getLatestLocation ─────────────────────────────────────────
function getLatestLocation(params, user) {
  var caseId = params.case_id || '';
  if (!caseId) return _error('case_id required');

  var sheet   = _getSheet('case_locations');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var caseIdCol = headers.indexOf('case_id');

  var latest = null;
  for (var i = 1; i < data.length; i++) {
    if (data[i][caseIdCol] === caseId) latest = _rowToObj(headers, data[i]);
  }
  return _output(latest);
}

// ── getDashboard ──────────────────────────────────────────────
function getDashboard(params, user) {
  var sheet = _getSheet('cases');
  var data  = sheet.getDataRange().getValues();
  if (data.length < 2) return _output(_emptyStats());
  var headers = data[0];

  var cases = [];
  for (var i = 1; i < data.length; i++) {
    var obj = _rowToObj(headers, data[i]);
    if (user.role === 'case_worker' && obj.case_worker_email !== user.email) continue;
    if ((user.role === 'lgu_supervisor' || user.role === 'fo_user') && user.lgu_code && obj.lgu_code !== user.lgu_code) continue;
    cases.push(obj);
  }
  return _output(_computeStats(cases));
}

// ── getPublicDashboard ────────────────────────────────────────
function getPublicDashboard(params) {
  var sheet = _getSheet('cases');
  var data  = sheet.getDataRange().getValues();
  if (data.length < 2) return _output(_emptyStats());
  var headers = data[0];

  var cases = [];
  for (var i = 1; i < data.length; i++) {
    cases.push(_rowToObj(headers, data[i]));
  }

  // Apply optional filters
  if (params.status)         cases = cases.filter(function(c) { return c.status         === params.status; });
  if (params.classification) cases = cases.filter(function(c) { return (c.classification || '').indexOf(params.classification) !== -1; });
  if (params.sex)            cases = cases.filter(function(c) { return c.sex             === params.sex; });
  if (params.cefmu_type)     cases = cases.filter(function(c) { return c.cefmu_type      === params.cefmu_type; });

  var stats = _computeStats(cases);
  // Also include unfiltered cefmu types for the filter dropdown
  var allCases = [];
  for (var j = 1; j < data.length; j++) allCases.push(_rowToObj(headers, data[j]));
  stats.allCefmuTypes = _countBy(allCases, 'cefmu_type');

  return _output(stats);
}

function _emptyStats() {
  return { total: 0, active: 0, closed: 0, trend: [], byRegion: {}, bySex: {}, byClassification: {}, byCefmuType: {}, ageBands: {}, byServiceType: {} };
}

function _countBy(arr, field) {
  var result = {};
  arr.forEach(function(c) { var k = c[field] || 'Unknown'; result[k] = (result[k] || 0) + 1; });
  return result;
}

function _computeStats(cases) {
  var total  = cases.length;
  var active = 0, closed = 0;
  var byRegion = {}, bySex = {}, byClass = {}, byCefmu = {}, ageBands = {}, byService = {};
  var trendMap = {};

  cases.forEach(function(c) {
    if (c.status === 'active') active++;
    else if (c.status === 'closed') closed++;

    var region = c.region || 'Unknown';
    byRegion[region] = (byRegion[region] || 0) + 1;

    var sex = c.sex || 'Unknown';
    bySex[sex] = (bySex[sex] || 0) + 1;

    var classifs = c.classification ? c.classification.split(', ') : ['Unknown'];
    classifs.forEach(function(cl) {
      cl = cl.trim() || 'Unknown';
      byClass[cl] = (byClass[cl] || 0) + 1;
    });

    var cefmu = c.cefmu_type || 'Unknown';
    byCefmu[cefmu] = (byCefmu[cefmu] || 0) + 1;

    var age = parseInt(c.age, 10);
    if (!isNaN(age)) {
      var band = age < 10 ? 'Under 10' : age < 13 ? '10-12' : age < 16 ? '13-15' : age < 18 ? '16-17' : '18+';
      ageBands[band] = (ageBands[band] || 0) + 1;
    }

    if (c.date_intake) {
      var ym = String(c.date_intake).slice(0, 7);
      trendMap[ym] = (trendMap[ym] || 0) + 1;
    }
  });

  var sortedYM = Object.keys(trendMap).sort();
  var last12   = sortedYM.slice(-12);
  var trend    = last12.map(function(ym) {
    var parts = ym.split('-');
    var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    return { label: d.toLocaleString('en-PH', { month: 'short', year: '2-digit' }), count: trendMap[ym] };
  });

  return {
    total: total, active: active, closed: closed,
    trend: trend,
    byRegion: byRegion, bySex: bySex,
    byClassification: byClass, byCefmuType: byCefmu,
    ageBands: ageBands, byServiceType: byService,
  };
}

// ── getUsers ──────────────────────────────────────────────────
function getUsers(params, user) {
  if (user.role !== 'admin') return _error('Forbidden', 403);

  var sheet   = _getSheet('users');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var safeHeaders = headers.filter(function(h) {
    return ['password_hash','salt','failed_attempts','locked_until'].indexOf(h) === -1;
  });

  var users = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    safeHeaders.forEach(function(h) {
      var col = headers.indexOf(h);
      obj[h] = data[i][col];
    });
    users.push(obj);
  }
  return _output(users);
}

// ── createUser ────────────────────────────────────────────────
function createUser(params, user) {
  if (user.role !== 'admin') return _error('Forbidden', 403);

  var email = (params.email || '').toLowerCase().trim();
  if (!email) return _error('Email required');

  var sheet   = _getSheet('users');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var emailCol = headers.indexOf('email');

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][emailCol]).toLowerCase() === email) return _error('User already exists');
  }

  var nowIso = new Date().toISOString();
  var fieldMap = {
    email:                email,
    display_name:         params.display_name || '',
    role:                 params.role         || 'case_worker',
    lgu_code:             params.lgu_code     || '',
    region:               params.region       || '',
    province:             params.province     || '',
    active:               true,
    created_at:           nowIso,
    password_hash:        '',
    salt:                 '',
    must_change_password: true,
    failed_attempts:      0,
    locked_until:         '',
  };

  var newRow = headers.map(function(h) {
    return fieldMap.hasOwnProperty(h) ? fieldMap[h] : '';
  });
  sheet.appendRow(newRow);
  return _output({ success: true, email: email });
}

// ── updateUser ────────────────────────────────────────────────
function updateUser(params, user) {
  if (user.role !== 'admin') return _error('Forbidden', 403);

  var email = params.email || '';
  if (!email) return _error('Email required');

  var sheet   = _getSheet('users');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var emailCol = headers.indexOf('email');

  var updatable = ['display_name','role','lgu_code','region','province'];

  for (var i = 1; i < data.length; i++) {
    if (data[i][emailCol] === email) {
      updatable.forEach(function(field) {
        var col = headers.indexOf(field);
        if (col >= 0 && params[field] !== undefined) {
          sheet.getRange(i + 1, col + 1).setValue(params[field]);
        }
      });
      return _output({ success: true });
    }
  }
  return _error('User not found', 404);
}

// ── toggleUser ────────────────────────────────────────────────
function toggleUser(params, user) {
  if (user.role !== 'admin') return _error('Forbidden', 403);

  var email = params.email || '';
  if (!email) return _error('Email required');
  if (email === user.email) return _error('Cannot deactivate your own account');

  var sheet   = _getSheet('users');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var emailCol  = headers.indexOf('email');
  var activeCol = headers.indexOf('active');

  for (var i = 1; i < data.length; i++) {
    if (data[i][emailCol] === email) {
      var current = data[i][activeCol];
      sheet.getRange(i + 1, activeCol + 1).setValue(!current);
      return _output({ success: true, active: !current });
    }
  }
  return _error('User not found', 404);
}