// ============================================================
// Cases.gs — CRUD for cases, services, progress notes
// Optimized: single openById per request, caching on getCase
// ============================================================

const CASE_SHEET   = 'cases';
const FAMILY_SHEET = 'family_members';

const FAMILY_COLS = [
  'member_id', 'case_id',
  'client_last', 'client_first', 'city_muni', 'province', 'region',
  'name', 'birthdate', 'age', 'sex', 'relationship',
  'education', 'occupation', 'income',
  'created_at', 'updated_at',
];

// ── Helpers ───────────────────────────────────────────────────
function _getSheet(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}

// Read a sheet by name using an already-open Spreadsheet reference
function _sheetToObjectsSS(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (row[i] === null || row[i] === undefined) ? '' : row[i]; });
    return obj;
  });
}

function _sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (row[i] === null || row[i] === undefined) ? '' : row[i]; });
    return obj;
  });
}

function _stringify(val) {
  if (val === undefined || val === null) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function _parseFamilyMembers(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) {
    try { return JSON.parse(val); } catch (e) { return []; }
  }
  return [];
}

// ── Save family members ───────────────────────────────────────
function _saveFamilyMembers(caseId, members, caseSnapshot) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(FAMILY_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(FAMILY_SHEET);
    sheet.getRange(1, 1, 1, FAMILY_COLS.length).setValues([FAMILY_COLS]);
    sheet.getRange(1, 1, 1, FAMILY_COLS.length)
      .setFontWeight('bold').setBackground('#4B2E8C').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  const allData   = sheet.getDataRange().getValues();
  const headers   = allData[0];
  const caseIdIdx = headers.indexOf('case_id');
  for (let i = allData.length - 1; i >= 1; i--) {
    if (String(allData[i][caseIdIdx]) === String(caseId)) sheet.deleteRow(i + 1);
  }
  if (!members || !members.length) return;
  const now = new Date().toISOString();
  members.forEach(m => {
    const memberId = 'FM-' + Utilities.getUuid().replace(/-/g,'').substr(0,8).toUpperCase();
    const row = FAMILY_COLS.map(col => {
      switch (col) {
        case 'member_id':    return memberId;
        case 'case_id':      return caseId;
        case 'client_last':  return _stringify(caseSnapshot.client_last);
        case 'client_first': return _stringify(caseSnapshot.client_first);
        case 'city_muni':    return _stringify(caseSnapshot.city_muni);
        case 'province':     return _stringify(caseSnapshot.province);
        case 'region':       return _stringify(caseSnapshot.region);
        case 'name':         return _stringify(m.name);
        case 'birthdate':    return _stringify(m.birthdate || '');
        case 'age':          return _stringify(m.age || '');
        case 'sex':          return _stringify(m.sex || '');
        case 'relationship': return _stringify(m.relationship || '');
        case 'education':    return _stringify(m.education || '');
        case 'occupation':   return _stringify(m.occupation || '');
        case 'income':       return _stringify(m.income || '');
        case 'created_at':
        case 'updated_at':   return now;
        default:             return '';
      }
    });
    sheet.appendRow(row);
  });
}

// ── getCases ─────────────────────────────────────────────────
// Single openById, cached per role+user (60s TTL)
function getCases(e, user) {
  const status   = e.parameter.status || '';
  const cacheKey = 'cases_' + user.role + '_' + user.email + '_' + status;

  // Try cache first
  const cached = _cacheGet(cacheKey);
  if (cached) return _output(cached);

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let cases = _sheetToObjectsSS(ss, CASE_SHEET);

  if (user.role === 'case_worker')    cases = cases.filter(c => c.case_worker_email === user.email);
  else if (user.role === 'fo_user')   cases = cases.filter(c => c.region   === user.region);
  else if (user.role === 'lgu_supervisor') cases = cases.filter(c => c.province === user.province);
  else if (user.role === 'cpu_monitor')    cases = cases.filter(c => c.lgu_code  === user.lgu_code);

  if (status) cases = cases.filter(c => c.status === status);

  // Cache for 60 seconds
  _cachePut(cacheKey, cases, 60);
  return _output(cases);
}

// ── getCase ──────────────────────────────────────────────────
// Single openById for all sub-reads, 30s cache per case+role
function getCase(e, user) {
  const id = e.parameter.case_id;

  // Try cache (30s TTL — short enough for real-time feel)
  const cacheKey = 'case_' + id + '_' + user.role;
  const cached   = _cacheGet(cacheKey);
  if (cached) return _output(cached);

  // Open spreadsheet ONCE
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const cases = _sheetToObjectsSS(ss, CASE_SHEET);
  const found = cases.find(c => c.case_id === id);
  if (!found) return _error('Case not found', 404);

  if (user.role === 'case_worker'    && found.case_worker_email !== user.email) return _error('Forbidden', 403);
  if (user.role === 'fo_user'        && found.region   !== user.region)         return _error('Forbidden', 403);
  if (user.role === 'lgu_supervisor' && found.province !== user.province)       return _error('Forbidden', 403);
  if (user.role === 'cpu_monitor'    && found.lgu_code !== user.lgu_code)       return _error('Forbidden', 403);

  // All sub-reads reuse same ss reference — no extra openById calls
  found._services = _sheetToObjectsSS(ss, 'services')
    .filter(s => String(s.case_id) === String(id));

  const famRows = _sheetToObjectsSS(ss, FAMILY_SHEET);
  found._family = famRows.length
    ? famRows.filter(f => String(f.case_id) === String(id))
    : _parseFamilyMembers(found.family_members);

  const noteRows = _sheetToObjectsSS(ss, 'progress_notes');
  found._notes = noteRows
    .filter(n => String(n.case_id) === String(id))
    .sort((a, b) => new Date(b.date_note) - new Date(a.date_note));

  // Cache result
  _cachePut(cacheKey, found, 30);
  return _output(found);
}

// ── createCase ───────────────────────────────────────────────
function createCase(params, user) {
  if (user.role === 'cpu_monitor') return _error('Forbidden', 403);
  const sheet   = _getSheet(CASE_SHEET);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const now     = new Date().toISOString();
  const case_id = 'CEFMU-' + Utilities.formatDate(new Date(), 'Asia/Manila', 'yyyyMM') +
                  '-' + Utilities.getUuid().replace(/-/g,'').substr(0,6).toUpperCase();
  const members = _parseFamilyMembers(params.family_members);
  const row = headers.map(col => {
    switch (col) {
      case 'case_id':           return case_id;
      case 'status':            return 'active';
      case 'case_worker_email': return user.email;
      case 'created_at':
      case 'updated_at':        return now;
      case 'date_closed':       return '';
      case 'family_members':    return members.length ? JSON.stringify(members) : '[]';
      default:
        const val = params[col];
        if (val === undefined || val === null) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
    }
  });
  sheet.appendRow(row);
  if (members.length > 0) {
    _saveFamilyMembers(case_id, members, {
      client_last:  params.client_last  || '',
      client_first: params.client_first || '',
      city_muni:    params.city_muni    || '',
      province:     params.province     || '',
      region:       params.region       || '',
    });
  }
  _bustDashboardCache(user.email, user.role);
  _logActivity(user.email, 'CREATE_CASE', case_id);
  return _output({ case_id });
}

// ── updateCase ───────────────────────────────────────────────
function updateCase(params, user) {
  if (user.role === 'cpu_monitor') return _error('Forbidden', 403);
  const sheet   = _getSheet(CASE_SHEET);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const rows    = allData.slice(1);
  const caseIdCol = headers.indexOf('case_id');
  const rowIdx    = rows.findIndex(r => String(r[caseIdCol]) === String(params.case_id));
  if (rowIdx === -1) return _error('Case not found', 404);
  const sheetRow  = rowIdx + 2;
  const now       = new Date().toISOString();
  const protected_ = new Set(['case_id','status','case_worker_email','date_closed','created_at']);
  const members   = _parseFamilyMembers(params.family_members);
  headers.forEach((col, i) => {
    if (protected_.has(col)) return;
    if (col === 'updated_at')    { sheet.getRange(sheetRow, i + 1).setValue(now); return; }
    if (col === 'family_members') { sheet.getRange(sheetRow, i + 1).setValue(members.length ? JSON.stringify(members) : '[]'); return; }
    if (params[col] !== undefined) {
      const val = params[col];
      sheet.getRange(sheetRow, i + 1).setValue(typeof val === 'object' ? JSON.stringify(val) : String(val === null ? '' : val));
    }
  });
  _saveFamilyMembers(params.case_id, members, {
    client_last:  params.client_last  || rows[rowIdx][headers.indexOf('client_last')]  || '',
    client_first: params.client_first || rows[rowIdx][headers.indexOf('client_first')] || '',
    city_muni:    params.city_muni    || rows[rowIdx][headers.indexOf('city_muni')]    || '',
    province:     params.province     || rows[rowIdx][headers.indexOf('province')]     || '',
    region:       params.region       || rows[rowIdx][headers.indexOf('region')]       || '',
  });
  // Bust case cache so next load is fresh
  try { CacheService.getScriptCache().remove('case_' + params.case_id + '_' + user.role); } catch(e) {}
  _bustDashboardCache(user.email, user.role);
  _logActivity(user.email, 'UPDATE_CASE', params.case_id);
  return _output({ updated: true });
}

// ── closeCase ────────────────────────────────────────────────
function closeCase(params, user) {
  if (user.role === 'cpu_monitor') return _error('Forbidden', 403);
  const sheet   = _getSheet(CASE_SHEET);
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const rows    = sheet.getRange(2,1,Math.max(sheet.getLastRow()-1,1),sheet.getLastColumn()).getValues();
  const rowIdx  = rows.findIndex(r => String(r[headers.indexOf('case_id')]) === String(params.case_id));
  if (rowIdx === -1) return _error('Case not found', 404);
  const sheetRow = rowIdx + 2;
  const now = new Date().toISOString();
  sheet.getRange(sheetRow, headers.indexOf('status')     + 1).setValue('closed');
  sheet.getRange(sheetRow, headers.indexOf('date_closed')+ 1).setValue(now);
  sheet.getRange(sheetRow, headers.indexOf('updated_at') + 1).setValue(now);
  try { CacheService.getScriptCache().remove('case_' + params.case_id + '_' + user.role); } catch(e) {}
  _bustDashboardCache(user.email, user.role);
  _logActivity(user.email, 'CLOSE_CASE', params.case_id);
  return _output({ closed: true });
}

// ── reopenCase ───────────────────────────────────────────────
function reopenCase(params, user) {
  if (user.role === 'cpu_monitor') return _error('Forbidden', 403);
  const sheet   = _getSheet(CASE_SHEET);
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const rows    = sheet.getRange(2,1,Math.max(sheet.getLastRow()-1,1),sheet.getLastColumn()).getValues();
  const rowIdx  = rows.findIndex(r => String(r[headers.indexOf('case_id')]) === String(params.case_id));
  if (rowIdx === -1) return _error('Case not found', 404);
  const sheetRow = rowIdx + 2;
  const now = new Date().toISOString();
  sheet.getRange(sheetRow, headers.indexOf('status')     + 1).setValue('active');
  sheet.getRange(sheetRow, headers.indexOf('date_closed')+ 1).setValue('');
  sheet.getRange(sheetRow, headers.indexOf('updated_at') + 1).setValue(now);
  try { CacheService.getScriptCache().remove('case_' + params.case_id + '_' + user.role); } catch(e) {}
  _bustDashboardCache(user.email, user.role);
  _logActivity(user.email, 'REOPEN_CASE', params.case_id);
  return _output({ reopened: true });
}

// ── addService ───────────────────────────────────────────────
function addService(params, user) {
  if (user.role === 'cpu_monitor') return _error('Forbidden', 403);
  const sheet = _getSheet('services');
  const now   = new Date().toISOString();
  sheet.appendRow([
    'SVC-' + Utilities.getUuid().replace(/-/g,'').substr(0,8).toUpperCase(),
    params.case_id, params.service_type || '', params.amount || 0,
    params.date_provided || now, user.email,
  ]);
  try { CacheService.getScriptCache().remove('case_' + params.case_id + '_' + user.role); } catch(e) {}
  _bustDashboardCache(user.email, user.role);
  _logActivity(user.email, 'ADD_SERVICE', params.case_id);
  return _output({ added: true });
}

// ── addNote ──────────────────────────────────────────────────
function addNote(params, user) {
  if (user.role === 'cpu_monitor') return _error('Forbidden', 403);
  let sheet = _getSheet('progress_notes');
  if (!sheet) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    sheet = ss.insertSheet('progress_notes');
    const cols = ['note_id','case_id','date_note','note_type','content','action_taken','next_steps','created_by','created_at'];
    sheet.getRange(1,1,1,cols.length).setValues([cols]);
    sheet.getRange(1,1,1,cols.length).setFontWeight('bold').setBackground('#4B2E8C').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  const now = new Date().toISOString();
  sheet.appendRow([
    'NOTE-' + Utilities.getUuid().replace(/-/g,'').substr(0,8).toUpperCase(),
    params.case_id, params.date_note || now, params.note_type || 'progress',
    params.content || '', params.action_taken || '', params.next_steps || '',
    user.email, now,
  ]);
  try { CacheService.getScriptCache().remove('case_' + params.case_id + '_' + user.role); } catch(e) {}
  _logActivity(user.email, 'ADD_NOTE', params.case_id);
  return _output({ added: true });
}

// ── updateNote ───────────────────────────────────────────────
function updateNote(params, user) {
  if (user.role === 'cpu_monitor') return _error('Forbidden', 403);
  const sheet = _getSheet('progress_notes');
  if (!sheet) return _error('progress_notes sheet not found', 404);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const rows    = allData.slice(1);
  const rowIdx  = rows.findIndex(r => String(r[headers.indexOf('note_id')]) === String(params.note_id));
  if (rowIdx === -1) return _error('Note not found', 404);
  const sheetRow = rowIdx + 2;
  ['note_type','date_note','content','action_taken','next_steps'].forEach(f => {
    const colIdx = headers.indexOf(f);
    if (colIdx >= 0 && params[f] !== undefined) {
      sheet.getRange(sheetRow, colIdx + 1).setValue(params[f] || '');
    }
  });
  try { CacheService.getScriptCache().remove('case_' + params.case_id + '_' + user.role); } catch(e) {}
  return _output({ updated: true });
}