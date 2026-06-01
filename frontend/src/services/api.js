import { queueAction } from './offlineQueue'

const BASE_URL = import.meta.env.VITE_APPS_SCRIPT_URL

// ── Cache store ──────────────────────────────────────────────
const _cache = new Map()

const CACHE_TTL = {
  getDashboard:       2 * 60 * 1000,
  getPublicDashboard: 5 * 60 * 1000,
  getCases:           2 * 60 * 1000,
  getLookups:        30 * 60 * 1000,
  getUsers:           5 * 60 * 1000,
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
  return entry
}

function _setCached(key, data, ttl) {
  _cache.set(key, { data, ts: Date.now(), ttl })
}

function _isStale(entry) {
  return Date.now() - entry.ts > entry.ttl
}

export function invalidateCache(action) {
  for (const key of _cache.keys()) {
    if (key.startsWith(action)) _cache.delete(key)
  }
}

function getToken() {
  return localStorage.getItem('cefmu_token') || ''
}

// ── Raw fetch (no cache) ─────────────────────────────────────
async function _fetch(action, params = {}) {
  if (!navigator.onLine) {
    throw new Error('OFFLINE')
  }
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
export async function api(action, params = {}, options = {}) {
  const ttl = CACHE_TTL[action]

  if (!ttl || options.skipCache) {
    return _fetch(action, params)
  }

  const key    = _cacheKey(action, params)
  const cached = _getCached(key)

  if (cached && !_isStale(cached)) {
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
    _fetch(action, params)
      .then(fresh => {
        _setCached(key, fresh, ttl)
        if (options.revalidate) options.revalidate(fresh)
      })
      .catch(() => {})
    return cached.data
  }

  const data = await _fetch(action, params)
  _setCached(key, data, ttl)
  return data
}

// ── apiPost — write ops, invalidates related caches ─────────
export async function apiPost(action, body = {}) {

  // Offline: queue and return immediately
  if (!navigator.onLine) {
    await queueAction(action, body)
    return { queued: true, offline: true }
  }

  const url = new URL(BASE_URL)
  url.searchParams.set('action', action)
  url.searchParams.set('token', getToken())
  url.searchParams.set('payload', JSON.stringify(body))

  const res  = await fetch(url.toString())
  const json = await res.json()
  if (json.status !== 200) throw new Error(json.data?.error || 'API error')

  const invalidations = {
    createCase:   ['getCases', 'getDashboard', 'getPublicDashboard'],
    updateCase:   ['getCases', 'getDashboard', 'getPublicDashboard', 'getCase'],
    closeCase:    ['getCases', 'getDashboard', 'getPublicDashboard', 'getCase'],
    reopenCase:   ['getCases', 'getDashboard', 'getPublicDashboard', 'getCase'],
    addService:   ['getDashboard', 'getPublicDashboard', 'getCase'],
    addNote:      ['getCase'],
    updateNote:   ['getCase'],
    saveLocation: ['getCase'],
    createUser:   ['getUsers'],
    updateUser:   ['getUsers'],
    toggleUser:   ['getUsers'],
  }
  ;(invalidations[action] || []).forEach(invalidateCache)

  return json.data
}