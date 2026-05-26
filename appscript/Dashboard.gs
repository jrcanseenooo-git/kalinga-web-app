var PUBLIC_CACHE_KEY = "pub_dashboard_v1";
var PUBLIC_CACHE_TTL = 300; // seconds
var PRIVATE_CACHE_TTL = 120; // seconds

// ── Cache helpers ─────────────────────────────────────────────
function _cacheGet(key) {
  try {
    var cache = CacheService.getScriptCache();
    var raw = cache.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function _cachePut(key, data, ttl) {
  try {
    var cache = CacheService.getScriptCache();
    var raw = JSON.stringify(data);
    // Apps Script cache values max 100KB — skip caching if too large
    if (raw.length < 90000) {
      cache.put(key, raw, ttl);
    }
  } catch (e) {
    // Non-fatal — just serve without caching
  }
}

function _cacheRemove(keys) {
  try {
    CacheService.getScriptCache().removeAll(keys);
  } catch (e) {}
}

// Call this after any write operation to bust stale dashboard caches
function _bustDashboardCache(userEmail, userRole) {
  var keys = [PUBLIC_CACHE_KEY];
  if (userEmail) keys.push("priv_dash_" + userEmail);
  // Bust all admin/role caches is impractical without enumeration,
  // but busting the writer's own cache + public is sufficient
  _cacheRemove(keys);
}

// ── getDashboard (auth required) ─────────────────────────────
function getDashboard(e, user) {
  var cacheKey = "priv_dash_" + user.email;
  var cached = _cacheGet(cacheKey);
  if (cached) return _output(cached);

  var cases = _sheetToObjects(_getSheet(CASE_SHEET));
  var services = _sheetToObjects(_getSheet("services"));

  var filtered = cases;
  if (user.role === "case_worker") {
    filtered = cases.filter(function (c) {
      return c.case_worker_email === user.email;
    });
  } else if (user.role === "fo_user") {
    filtered = cases.filter(function (c) {
      return c.region === user.region;
    });
  } else if (user.role === "lgu_supervisor") {
    filtered = cases.filter(function (c) {
      return c.province === user.province;
    });
  } else if (user.role === "cpu_monitor") {
    filtered = cases.filter(function (c) {
      return c.lgu_code === user.lgu_code;
    });
  }

  var active = filtered.filter(function (c) {
    return c.status === "active";
  }).length;
  var closed = filtered.filter(function (c) {
    return c.status === "closed";
  }).length;

  var caseIds = {};
  filtered.forEach(function (c) {
    caseIds[c.case_id] = true;
  });
  var mySvcs = services.filter(function (s) {
    return caseIds[s.case_id];
  });
  var byService = _groupCount(mySvcs, "service_type");

  var result = {
    summary: { total: active + closed, active: active, closed: closed },
    byClassification: _groupCount(filtered, "classification"),
    byCefmuType: _groupCount(filtered, "cefmu_type"),
    bySex: _groupCount(filtered, "sex"),
    ageBands: _buildAgeBands(filtered),
    byRegion: user.role === "admin" ? _groupCount(filtered, "region") : {},
    byLgu:
      user.role !== "case_worker" ? _groupCount(filtered, "city_muni") : {},
    byService: byService,
    trend: _monthlyTrend(filtered, "date_intake", 6),
  };

  _cachePut(cacheKey, result, PRIVATE_CACHE_TTL);
  return _output(result);
}

// ── getPublicDashboard (no auth) ─────────────────────────────
// Accepts optional filter params: status, classification, sex, cefmu_type
// Cache key is derived from active filters so each combination is cached separately.
function getPublicDashboard(e) {
  var params = e && e.parameter ? e.parameter : {};
  var fStatus = params.status || "all";
  var fClass = params.classification || "all";
  var fSex = params.sex || "all";
  var fCefmu = params.cefmu_type || "all";

  // Build a filter-aware cache key
  var filterSuffix = [fStatus, fClass, fSex, fCefmu].join("_");
  var cacheKey = PUBLIC_CACHE_KEY + "_" + filterSuffix;

  var cached = _cacheGet(cacheKey);
  if (cached) return _output(cached);

  var sheet = _getSheet(CASE_SHEET);
  if (!sheet) return _output({ summary: { total: 0, active: 0, closed: 0 } });
  var allCases = _sheetToObjects(sheet);

  // Apply filters
  var cases = allCases.filter(function (c) {
    if (fStatus !== "all" && c.status !== fStatus) return false;
    if (
      fClass !== "all" &&
      (c.classification || "").toLowerCase() !== fClass.toLowerCase()
    )
      return false;
    if (fSex !== "all" && c.sex !== fSex) return false;
    if (fCefmu !== "all" && c.cefmu_type !== fCefmu) return false;
    return true;
  });

  // Always include all CEFMU type options from unfiltered data (for populating the dropdown)
  var allCefmuTypes = _groupCount(allCases, "cefmu_type");

  var result = {
    disclaimer:
      "Data shown is from pilot areas only and may not reflect the complete national picture.",
    summary: {
      total: cases.length,
      active: cases.filter(function (c) {
        return c.status === "active";
      }).length,
      closed: cases.filter(function (c) {
        return c.status === "closed";
      }).length,
    },
    byClassification: _groupCount(cases, "classification"),
    byCefmuType: _groupCount(cases, "cefmu_type"),
    allCefmuTypes: allCefmuTypes,
    bySex: _groupCount(cases, "sex"),
    ageBands: _buildAgeBands(cases),
    byRegion: _groupCount(cases, "region"),
    byLgu: _groupCount(cases, "city_muni"),
    trend: _monthlyTrend(cases, "date_intake", 12),
    cachedAt: new Date().toISOString(),
  };

  _cachePut(cacheKey, result, PUBLIC_CACHE_TTL);
  return _output(result);
}

// ── Shared helpers ────────────────────────────────────────────
function _buildAgeBands(cases) {
  var bands = { "0-5": 0, "6-11": 0, "12-17": 0, "18+": 0 };
  cases.forEach(function (c) {
    var age = parseInt(c.age) || 0;
    if (age <= 5) bands["0-5"]++;
    else if (age <= 11) bands["6-11"]++;
    else if (age <= 17) bands["12-17"]++;
    else bands["18+"]++;
  });
  return bands;
}

function getLookups(e, user) {
  var cacheKey = "lookups_v1";
  var cached = _cacheGet(cacheKey);
  if (cached) return _output(cached);

  var sheet = _getSheet("lookups");
  if (!sheet) return _output({});
  var rows = _sheetToObjects(sheet);
  var result = {};
  rows.forEach(function (r) {
    if (!result[r.lookup_type]) result[r.lookup_type] = [];
    result[r.lookup_type].push({ value: r.value, label: r.label });
  });

  _cachePut(cacheKey, result, 30 * 60); // 30 min
  return _output(result);
}

function _groupCount(arr, key) {
  var acc = {};
  arr.forEach(function (item) {
    var val = item[key];
    // Handle JSON array (e.g. classification stored as ["Child marriage","Early union"])
    if (typeof val === 'string' && val.charAt(0) === '[') {
      try {
        var parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          parsed.forEach(function(k) {
            k = k || 'Unknown';
            acc[k] = (acc[k] || 0) + 1;
          });
          return;
        }
      } catch(e) {}
    }
    var k = val || 'Unknown';
    acc[k] = (acc[k] || 0) + 1;
  });
  return acc;
}

function _monthlyTrend(arr, dateKey, months) {
  var now = new Date();
  var result = [];
  for (var i = months - 1; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    var label = Utilities.formatDate(d, "Asia/Manila", "MMM yyyy");
    var count = arr.filter(function (c) {
      var cd = new Date(c[dateKey]);
      return (
        !isNaN(cd) &&
        cd.getFullYear() === d.getFullYear() &&
        cd.getMonth() === d.getMonth()
      );
    }).length;
    result.push({ label: label, count: count });
  }
  return result;
}

function _logActivity(email, action, reference) {
  var sheet = _getSheet("activity_log");
  if (!sheet) return;
  sheet.appendRow([new Date().toISOString(), email, action, reference, ""]);
}