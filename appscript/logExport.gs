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

  const filters = typeof params.filters === 'object'
    ? JSON.stringify(params.filters)
    : String(params.filters || '');

  sheet.appendRow([
    new Date().toISOString(),
    user.email,
    user.role,
    user.lgu_code || '',
    user.region   || '',
    user.province || '',
    Number(params.exported_count) || 0,
    filters,
  ]);

  // Also write to the main activity_log so it appears in existing logs
  _logActivity(user.email, 'EXPORT_CSV', `${params.exported_count || 0} records`);

  return _output({ logged: true });
}