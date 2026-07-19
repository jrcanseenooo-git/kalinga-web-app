function _matchesReportFilters(c, filters) {
  filters = filters || {};
  if (filters.status && String(c.status || '') !== String(filters.status)) return false;
  if (filters.region && !_sameText(c.region, filters.region)) return false;
  if (filters.province && !_sameText(c.province, filters.province)) return false;
  if (filters.classification && !_sameText(c.classification, filters.classification)) return false;
  if (filters.cefmuType && String(c.cefmu_type || '') !== String(filters.cefmuType)) return false;
  if (filters.sex && String(c.sex || '') !== String(filters.sex)) return false;
  if (filters.dateFrom && String(c.date_intake || '') < String(filters.dateFrom)) return false;
  if (filters.dateTo && String(c.date_intake || '') > String(filters.dateTo)) return false;
  return true;
}

function _parseFiltersParam(filters) {
  if (!filters) return {};
  if (typeof filters === 'object') return filters;
  try { return JSON.parse(filters); } catch (e) { return {}; }
}

function generateReport(params, user) {
  const filters = _parseFiltersParam(params.filters);
  let cases = _sheetToObjects(_getSheet(CASE_SHEET));
  cases = cases
    .filter(function(c) { return _canViewCase(c, user); })
    .filter(function(c) { return _matchesReportFilters(c, filters); });

  _logActivity(
    user.email,
    'GENERATE_REPORT',
    JSON.stringify({
      count: cases.length,
      scope: { role: user.role, lgu_code: user.lgu_code || '', province: user.province || '', region: user.region || '' },
      filters: filters,
    })
  );

  return _output(cases);
}

function logExport(params, user) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Auto-create the sheet if it doesn't exist yet
  let sheet = ss.getSheetByName('export_audit');
  if (!sheet) {
    sheet = ss.insertSheet('export_audit');
    const cols = [
      'timestamp', 'user_email', 'user_role', 'lgu_code',
      'region', 'province', 'exported_count', 'filters',
    ];
    sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
    sheet.getRange(1, 1, 1, cols.length)
      .setFontWeight('bold')
      .setBackground('#4B2E8C')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  const parsedFilters = _parseFiltersParam(params.filters);
  const visibleCount = _sheetToObjects(_getSheet(CASE_SHEET))
    .filter(function(c) { return _canViewCase(c, user); })
    .filter(function(c) { return _matchesReportFilters(c, parsedFilters); })
    .length;
  const requestedCount = Number(params.exported_count || params.record_count) || 0;
  const auditedCount = Math.min(requestedCount, visibleCount);
  const filters = JSON.stringify(parsedFilters);

  sheet.appendRow([
    new Date().toISOString(),
    user.email,
    user.role,
    user.lgu_code || '',
    user.region   || '',
    user.province || '',
    auditedCount,
    filters,
  ]);

  // Also write to the main activity_log so it appears in existing logs
  _logActivity(
    user.email,
    'EXPORT_' + String(params.export_type || 'CSV').toUpperCase(),
    JSON.stringify({
      count: auditedCount,
      requested_count: requestedCount,
      purpose: params.purpose || '',
      filters: parsedFilters,
    })
  );

  return _output({ logged: true });
}
