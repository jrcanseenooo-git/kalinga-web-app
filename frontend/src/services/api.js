// ============================================================
// api.js — Apps Script API wrapper with caching
//
// Strategy:
//   - In-memory cache with TTL (survives tab switches, not refreshes)
//   - staleWhileRevalidate: serves stale cache INSTANTLY, then
//     silently fetches fresh data in the background
//   - Cache is keyed by action + sorted params so the same
//     request always hits the same cache slot
// ============================================================

const BASE_URL = import.meta.env.VITE_APPS_SCRIPT_URL

// ── Cache store ──────────────────────────────────────────────
const _cache = new Map()

// TTLs in milliseconds
const CACHE_TTL = {
  getDashboard:        2 * 60 * 1000,  // 2 min  — auth dashboard
  getPublicDashboard:  5 * 60 * 1000,  // 5 min  — public dashboard
  getCases:            2 * 60 * 1000,  // 2 min  — case list
  getLookups:         30 * 60 * 1000,  // 30 min — rarely changes
  getUsers:            5 * 60 * 1000,  // 5 min
}

function _cacheKey(action, params) {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  return `${action}?${sorted}`
}

function _getCached(key) {
  const entry = _cache.get(key)
  if (!entry) return null
  return entry  // caller decides if stale
}

function _setCached(key, data, ttl) {
  _cache.set(key, { data, ts: Date.now(), ttl })
}

function _isStale(entry) {
  return Date.now() - entry.ts > entry.ttl
}

// Invalidate cache entries matching an action prefix
// Call after write operations so the next read is fresh
export function invalidateCache(action) {
  for (const key of _cache.keys()) {
    if (key.startsWith(action)) _cache.delete(key)
  }
}

// ── Raw fetch (no cache) ─────────────────────────────────────
function getToken() {
  return localStorage.getItem('cefmu_token') || ''
}

async function _fetch(action, params = {}) {
  const url = new URL(BASE_URL)
  url.searchParams.set('action', action)
  url.searchParams.set('token', getToken())
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      url.searchParams.set(k, String(v))
    }
  })
  const res  = await fetch(url.toString())
  const json = await res.json()
  if (json.status !== 200) throw new Error(json.data?.error || 'API error')
  return json.data
}

// ── Public api() — cache-aware ───────────────────────────────
// options.revalidate: callback called with fresh data after bg fetch
// options.skipCache:  force a fresh fetch
export async function api(action, params = {}, options = {}) {
  const ttl = CACHE_TTL[action]

  // No TTL configured → fetch directly, no caching
  if (!ttl || options.skipCache) {
    return _fetch(action, params)
  }

  const key    = _cacheKey(action, params)
  const cached = _getCached(key)

  if (cached && !_isStale(cached)) {
    // Fresh cache — return immediately, optionally kick bg revalidation
    if (options.revalidate) {
      _fetch(action, params)
        .then(fresh => {
          _setCached(key, fresh, ttl)
          options.revalidate(fresh)
        })
        .catch(() => {})
    }
    return cached.data
  }

  if (cached && _isStale(cached)) {
    // Stale-while-revalidate: return stale data instantly,
    // then fetch fresh in background and call revalidate()
    _fetch(action, params)
      .then(fresh => {
        _setCached(key, fresh, ttl)
        if (options.revalidate) options.revalidate(fresh)
      })
      .catch(() => {})
    return cached.data
  }

  // No cache at all — must wait
  const data = await _fetch(action, params)
  _setCached(key, data, ttl)
  return data
}

// ── apiPost — write ops, invalidates related caches ─────────
export async function apiPost(action, body = {}) {
  const url = new URL(BASE_URL)
  url.searchParams.set('action', action)
  url.searchParams.set('token', getToken())
  url.searchParams.set('payload', JSON.stringify(body))

  const res  = await fetch(url.toString())
  const json = await res.json()
  if (json.status !== 200) throw new Error(json.data?.error || 'API error')

  // Invalidate caches likely affected by this write
  const invalidations = {
    createCase:  ['getCases', 'getDashboard', 'getPublicDashboard'],
    updateCase:  ['getCases', 'getDashboard', 'getPublicDashboard', 'getCase'],
    closeCase:   ['getCases', 'getDashboard', 'getPublicDashboard', 'getCase'],
    reopenCase:  ['getCases', 'getDashboard', 'getPublicDashboard', 'getCase'],
    addService:  ['getDashboard', 'getPublicDashboard', 'getCase'],
    addNote:      ['getCase'],
    updateNote:   ['getCase'],
    saveLocation: ['getCase'],
    createUser:  ['getUsers'],
    updateUser:  ['getUsers'],
    toggleUser:  ['getUsers'],
  }
  ;(invalidations[action] || []).forEach(invalidateCache)

  return json.data
}