/**
 * FormBuilder.gs — admin-managed intake form extensions.
 *
 * Design: HYBRID. Core case columns stay fixed in code (dashboards, dedup,
 * coverage filtering and exports depend on them). Admins may:
 *   1. Manage dropdown options (the `lookups` sheet), and
 *   2. Add custom fields (the `form_fields` sheet), stored as JSON in the
 *      `custom_fields` column on each case.
 *
 * RA 10173 (Data Privacy Act) by design: every custom field MUST declare a
 * sensitivity classification and a collection purpose before it can be saved.
 * This prevents silently collecting sensitive personal information (SPI)
 * without a documented lawful basis.
 */

// Core case columns an admin must never shadow with a custom field.
var RESERVED_FIELD_KEYS = [
  'case_id', 'date_intake', 'status', 'client_last', 'client_first', 'client_mi',
  'suffix', 'birthdate', 'sex', 'age', 'civil_status', 'religion', 'ip_category',
  'education', 'phone', 'occupation', 'income', 'philhealth_no', 'present_street',
  'region', 'province', 'city_muni', 'barangay', 'prov_street', 'prov_region',
  'prov_province', 'prov_city_muni', 'prov_barangay', 'classification',
  'cefmu_type', 'admission_mode', 'aics_form_no', 'lgu_code', 'referred_by',
  'referral_date', 'presenting_problem', 'initial_assessment', 'plan_of_action',
  'remarks', 'family_members', 'case_worker_email', 'date_closed', 'created_at',
  'updated_at', 'offline_id', 'custom_fields', 'token', 'action',
];

var FIELD_TYPES = ['text', 'textarea', 'number', 'date', 'select', 'multiselect', 'checkbox'];

// RA 10173: 'personal' = Personal Information; 'sensitive' = Sensitive Personal
// Information (health, ethnicity, religion, sexual life, legal proceedings...).
var SENSITIVITY_LEVELS = ['personal', 'sensitive'];

var MAX_CUSTOM_VALUE_LEN = 5000;
var FORM_FIELDS_SHEET = 'form_fields';

// ── Migration ────────────────────────────────────────────────
// Run once from the Apps Script editor. Idempotent.
function setupFormBuilder() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // 1. form_fields sheet
  var sheet = ss.getSheetByName(FORM_FIELDS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(FORM_FIELDS_SHEET);
    var headers = [
      'field_key', 'label', 'field_type', 'options', 'required', 'section',
      'sort_order', 'active', 'sensitivity', 'purpose', 'help_text',
      'created_at', 'created_by',
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold').setBackground('#4B2E8C').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    Logger.log('Created sheet: ' + FORM_FIELDS_SHEET);
  } else {
    Logger.log('form_fields sheet already exists.');
  }

  // 2. custom_fields column on cases
  var cases = ss.getSheetByName(CASE_SHEET);
  if (cases) {
    var caseHeaders = cases.getRange(1, 1, 1, cases.getLastColumn()).getValues()[0];
    if (caseHeaders.indexOf('custom_fields') === -1) {
      cases.getRange(1, cases.getLastColumn() + 1).setValue('custom_fields');
      Logger.log('Added "custom_fields" column to ' + CASE_SHEET);
    } else {
      Logger.log('custom_fields column already exists.');
    }
  }

  // 3. Seed the dropdown lookup types that were previously hardcoded in the
  //    frontend, so admins can manage them without a developer.
  seedFormLookups();
  Logger.log('setupFormBuilder complete.');
}

function seedFormLookups() {
  var sheet = _getSheet('lookups');
  if (!sheet) { Logger.log('lookups sheet missing — run setupSheets first.'); return; }

  var existing = _sheetToObjects(sheet);
  var have = {};
  existing.forEach(function (r) { have[r.lookup_type + '|' + r.value] = true; });

  var seeds = [];
  function add(type, values) {
    values.forEach(function (v, i) {
      if (!have[type + '|' + v]) seeds.push([type, v, v, i + 1]);
    });
  }

  add('civil_status', ['Single', 'Married', 'Widowed', 'Separated', 'Annulled', 'Live-in']);
  add('religion', ['Roman Catholic', 'Islam', 'Iglesia ni Cristo', 'Protestant',
                   'Born Again Christian', 'Seventh-day Adventist', 'Others']);
  add('education', ['No formal education', 'Elementary level', 'Elementary graduate',
                    'High school level', 'High school graduate', 'Vocational',
                    'College level', 'College graduate', 'Post-graduate']);
  add('ip_category', ['Not applicable', 'Igorot', 'Lumad', 'Mangyan', 'Aeta',
                      'Badjao', 'Others']);
  add('cefmu_type', ['Child marriage', 'Early union', 'Forced marriage', 'Forced union']);
  add('admission_mode', ['Walk-in', 'Referral', 'Outreach', 'Online', 'Phone']);
  add('other_circumstance', [
    'Child with Disability', 'Child with Special Needs', 'Child abuse', 'Child labor',
    'Child trafficking', 'Teenage pregnancy', 'Psychologically / emotionally abused',
    'Sexually exploited / Online sexual abuse', 'Abandoned / neglected',
    'Physically abused', 'Runaway / missing child',
  ]);

  seeds.forEach(function (row) { sheet.appendRow(row); });
  _bustLookupsCache();
  Logger.log('Seeded ' + seeds.length + ' lookup options.');
}

// ── Remove duplicate dropdown options ────────────────────────
// Two seeders collided: SetupV2.gs seeds admission_mode/cefmu_type/note_type
// with snake_case values ('walk_in'), seedFormLookups() seeded Title-Case
// values ('Walk-in'). Same label, different value, so neither deduped the
// other — and SetupV2 appends with no guard, so each re-run added a full copy.
// The admin UI shows the label, so they render as identical repeated chips.
//
// Dedupes on (lookup_type + label), keeping the FIRST occurrence. Stored case
// data is untouched — this only changes what the dropdowns offer.
//
// SAFE BY DEFAULT: running this from the editor's Run button only PREVIEWS.
// Call dedupeLookupsApply() to actually delete.
function dedupeLookups(apply) {
  _dedupeLookups(apply === true);
}

// Explicit destructive entry point — deletes the duplicate rows.
function dedupeLookupsApply() {
  _dedupeLookups(true);
}

function _dedupeLookups(apply) {
  var dryRun = !apply;
  var sheet = _getSheet('lookups');
  if (!sheet) { Logger.log('lookups sheet not found'); return; }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var tCol = headers.indexOf('lookup_type');
  var vCol = headers.indexOf('value');
  var lCol = headers.indexOf('label');

  var seen = {};
  var toDelete = [];
  for (var i = 1; i < data.length; i++) {
    var type = String(data[i][tCol]).trim();
    if (!type) continue;
    var label = String(data[i][lCol] || data[i][vCol]).trim().toLowerCase();
    var key = type + '||' + label;
    if (seen[key]) {
      toDelete.push({ row: i + 1, type: type, value: data[i][vCol], label: data[i][lCol] });
    } else {
      seen[key] = true;
    }
  }

  Logger.log((dryRun ? '[DRY RUN] ' : '') + 'Duplicate options found: ' + toDelete.length);
  toDelete.forEach(function (d) {
    Logger.log('  row ' + d.row + ': ' + d.type + ' | value="' + d.value + '" label="' + d.label + '"');
  });

  if (dryRun) { Logger.log('Nothing deleted. Run dedupeLookupsApply() to actually remove these.'); return; }

  // Delete bottom-up so earlier row indexes stay valid.
  for (var j = toDelete.length - 1; j >= 0; j--) sheet.deleteRow(toDelete[j].row);
  _bustLookupsCache();
  Logger.log('Removed ' + toDelete.length + ' duplicate option(s). Unique remaining: ' + Object.keys(seen).length);
}

function _bustLookupsCache() {
  try { CacheService.getScriptCache().remove('lookups_v1'); } catch (e) {}
}
function _bustFormFieldsCache() {
  try { CacheService.getScriptCache().remove('form_fields_v1'); } catch (e) {}
}

// ── Read: active form fields (any authenticated user) ────────
function getFormFields(e, user) {
  var cached = _cacheGet('form_fields_v1');
  if (cached) return _output(cached);

  var sheet = _getSheet(FORM_FIELDS_SHEET);
  if (!sheet) return _output([]);

  var fields = _sheetToObjects(sheet)
    .filter(function (f) { return f.active === true || f.active === 'TRUE'; })
    .map(function (f) {
      return {
        field_key:   f.field_key,
        label:       f.label,
        field_type:  f.field_type,
        options:     _parseFieldOptions(f.options),
        required:    f.required === true || f.required === 'TRUE',
        section:     f.section || 'Additional information',
        sort_order:  parseInt(f.sort_order) || 0,
        sensitivity: f.sensitivity || 'personal',
        purpose:     f.purpose || '',
        help_text:   f.help_text || '',
      };
    })
    .sort(function (a, b) { return a.sort_order - b.sort_order; });

  _cachePut('form_fields_v1', fields, 30 * 60);
  return _output(fields);
}

function _parseFieldOptions(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  var s = String(raw).trim();
  if (s.charAt(0) === '[') {
    try {
      var parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch (err) {}
  }
  // Fallback: comma-separated
  return s.split(',').map(function (o) { return o.trim(); }).filter(String);
}

// ── Write: create/update a custom field (admin only) ─────────
function saveFormField(params, user) {
  if (user.role !== 'admin') return _error('Forbidden', 403);

  var key = String(params.field_key || '').toLowerCase().trim();
  var label = String(params.label || '').trim();
  var type = String(params.field_type || '').trim();
  var sensitivity = String(params.sensitivity || '').trim();
  var purpose = String(params.purpose || '').trim();

  // ── Validation ──
  if (!/^[a-z][a-z0-9_]{1,39}$/.test(key)) {
    return _error('Field key must be 2-40 chars: lowercase letters, numbers, underscore; starting with a letter.');
  }
  if (RESERVED_FIELD_KEYS.indexOf(key) !== -1) {
    return _error('"' + key + '" is a reserved core field and cannot be redefined.');
  }
  if (!label) return _error('Label is required.');
  if (FIELD_TYPES.indexOf(type) === -1) return _error('Invalid field type.');

  // RA 10173 — classification and purpose are mandatory.
  if (SENSITIVITY_LEVELS.indexOf(sensitivity) === -1) {
    return _error('Select a data classification (personal or sensitive) — required under RA 10173.');
  }
  if (purpose.length < 10) {
    return _error('State the collection purpose (at least 10 characters) — required under RA 10173.');
  }

  var options = _parseFieldOptions(params.options);
  if ((type === 'select' || type === 'multiselect') && options.length === 0) {
    return _error('Provide at least one option for a select field.');
  }

  var sheet = _getSheet(FORM_FIELDS_SHEET);
  if (!sheet) return _error('Form builder is not set up. Run setupFormBuilder() first.', 500);

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);
  var keyCol = headers.indexOf('field_key');
  var rowIdx = rows.findIndex(function (r) { return String(r[keyCol]).toLowerCase() === key; });

  var record = {
    field_key:   key,
    label:       label,
    field_type:  type,
    options:     JSON.stringify(options),
    required:    params.required === true || params.required === 'true',
    section:     String(params.section || 'Additional information').trim(),
    sort_order:  parseInt(params.sort_order) || 0,
    active:      params.active === false || params.active === 'false' ? false : true,
    sensitivity: sensitivity,
    purpose:     purpose,
    help_text:   String(params.help_text || '').trim(),
  };

  if (rowIdx === -1) {
    record.created_at = new Date().toISOString();
    record.created_by = user.email;
    sheet.appendRow(headers.map(function (h) {
      return record[h] !== undefined ? record[h] : '';
    }));
    _logActivity(user.email, 'CREATE_FORM_FIELD', key + ' (' + sensitivity + ')');
  } else {
    var sheetRow = rowIdx + 2;
    headers.forEach(function (h, i) {
      if (record[h] !== undefined) sheet.getRange(sheetRow, i + 1).setValue(record[h]);
    });
    _logActivity(user.email, 'UPDATE_FORM_FIELD', key + ' (' + sensitivity + ')');
  }

  _bustFormFieldsCache();
  return _output({ saved: true, field_key: key });
}

// ── Soft-delete a custom field (admin only) ──────────────────
// Deactivates rather than deletes so historical case data keeps its meaning.
function deleteFormField(params, user) {
  if (user.role !== 'admin') return _error('Forbidden', 403);
  var key = String(params.field_key || '').toLowerCase().trim();
  if (!key) return _error('field_key is required');

  var sheet = _getSheet(FORM_FIELDS_SHEET);
  if (!sheet) return _error('Form builder is not set up.', 500);

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);
  var keyCol = headers.indexOf('field_key');
  var rowIdx = rows.findIndex(function (r) { return String(r[keyCol]).toLowerCase() === key; });
  if (rowIdx === -1) return _error('Field not found', 404);

  sheet.getRange(rowIdx + 2, headers.indexOf('active') + 1).setValue(false);
  _bustFormFieldsCache();
  _logActivity(user.email, 'DEACTIVATE_FORM_FIELD', key);
  return _output({ deactivated: true });
}

// ── Lookup (dropdown option) management — admin only ─────────
function saveLookupOption(params, user) {
  if (user.role !== 'admin') return _error('Forbidden', 403);
  var type = String(params.lookup_type || '').trim();
  var value = String(params.value || '').trim();
  var label = String(params.label || value).trim();
  if (!/^[a-z][a-z0-9_]{1,39}$/.test(type)) return _error('Invalid lookup type.');
  if (!value) return _error('Value is required.');
  if (value.length > 200 || label.length > 200) return _error('Value or label too long.');

  var sheet = _getSheet('lookups');
  if (!sheet) return _error('lookups sheet not found', 500);

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);
  var tCol = headers.indexOf('lookup_type');
  var vCol = headers.indexOf('value');
  var rowIdx = rows.findIndex(function (r) {
    return String(r[tCol]) === type && String(r[vCol]) === value;
  });

  if (rowIdx === -1) {
    // Sort order must be relative to this lookup_type, not the whole sheet —
    // using the sheet row count produced values like 118 for a new option.
    var sameType = rows.filter(function (r) { return String(r[tCol]) === type; });
    var nextOrder = parseInt(params.sort_order) || (sameType.length + 1);
    sheet.appendRow(headers.map(function (h) {
      if (h === 'lookup_type') return type;
      if (h === 'value') return value;
      if (h === 'label') return label;
      if (h === 'sort_order') return nextOrder;
      return '';
    }));
    _logActivity(user.email, 'CREATE_LOOKUP', type + ':' + value);
  } else {
    sheet.getRange(rowIdx + 2, headers.indexOf('label') + 1).setValue(label);
    _logActivity(user.email, 'UPDATE_LOOKUP', type + ':' + value);
  }

  _bustLookupsCache();
  return _output({ saved: true });
}

function deleteLookupOption(params, user) {
  if (user.role !== 'admin') return _error('Forbidden', 403);
  var type = String(params.lookup_type || '').trim();
  var value = String(params.value || '').trim();
  if (!type || !value) return _error('lookup_type and value are required');

  var sheet = _getSheet('lookups');
  if (!sheet) return _error('lookups sheet not found', 500);

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);
  var tCol = headers.indexOf('lookup_type');
  var vCol = headers.indexOf('value');
  var rowIdx = rows.findIndex(function (r) {
    return String(r[tCol]) === type && String(r[vCol]) === value;
  });
  if (rowIdx === -1) return _error('Option not found', 404);

  sheet.deleteRow(rowIdx + 2);
  _bustLookupsCache();
  _logActivity(user.email, 'DELETE_LOOKUP', type + ':' + value);
  return _output({ deleted: true });
}

// ── Validate + sanitize custom field values on case save ─────
// SECURITY: the router's _sanitizeParams only walks top-level strings and
// arrays, so values nested inside a custom_fields object arrive unsanitized.
// Every value is sanitized and length-capped here before it is persisted.
// Unknown keys are dropped so a tampered client cannot inject arbitrary data.
function _validateCustomFields(raw) {
  var incoming = raw;
  if (typeof raw === 'string') {
    if (!raw.trim()) return { ok: true, value: '{}' };
    try { incoming = JSON.parse(raw); } catch (e) { return { ok: false, error: 'Invalid custom field data.' }; }
  }
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return { ok: true, value: '{}' };
  }

  var sheet = _getSheet(FORM_FIELDS_SHEET);
  if (!sheet) return { ok: true, value: '{}' };

  var defs = _sheetToObjects(sheet).filter(function (f) {
    return f.active === true || f.active === 'TRUE';
  });
  if (!defs.length) return { ok: true, value: '{}' };

  var clean = {};
  for (var i = 0; i < defs.length; i++) {
    var def = defs[i];
    var key = def.field_key;
    var val = incoming[key];
    var isRequired = def.required === true || def.required === 'TRUE';

    var empty = val === undefined || val === null || val === '' ||
                (Array.isArray(val) && val.length === 0);
    if (empty) {
      if (isRequired) return { ok: false, error: '"' + def.label + '" is required.' };
      continue;
    }

    if (def.field_type === 'multiselect') {
      if (!Array.isArray(val)) val = [val];
      var allowed = _parseFieldOptions(def.options);
      var picked = val.map(function (v) { return _sanitize(String(v)).slice(0, 200); })
                      .filter(function (v) { return allowed.indexOf(v) !== -1; });
      if (picked.length) clean[key] = picked;
    } else if (def.field_type === 'select') {
      var opts = _parseFieldOptions(def.options);
      var sv = _sanitize(String(val)).slice(0, 200);
      if (opts.indexOf(sv) === -1) {
        return { ok: false, error: 'Invalid option for "' + def.label + '".' };
      }
      clean[key] = sv;
    } else if (def.field_type === 'checkbox') {
      clean[key] = (val === true || val === 'true');
    } else if (def.field_type === 'number') {
      var n = Number(val);
      if (isNaN(n)) return { ok: false, error: '"' + def.label + '" must be a number.' };
      clean[key] = n;
    } else {
      clean[key] = _sanitize(String(val)).slice(0, MAX_CUSTOM_VALUE_LEN);
    }
  }

  return { ok: true, value: JSON.stringify(clean) };
}
