/**
 * Centralized in-memory API cache + request de-duplication.
 *
 * Architecture:
 *   Component -> api service (e.g. locationApi.nearby) -> cachedRequest() -> HTTP
 *
 * Responsibilities:
 *  - TTL-based response reuse, so navigating between pages that need the same
 *    data does not re-hit the backend (and therefore does not re-hit Overpass).
 *  - In-flight de-duplication, so N components asking for the same thing at the
 *    same time produce exactly ONE HTTP request and share one Promise.
 *
 * Deliberately NOT cached here (see services/api.ts for the per-endpoint policy):
 *  - any non-GET request (POST/PUT/PATCH/DELETE), user mutations, emergency actions
 *  - alerts / disasters (severity, expiry and active status are time-sensitive)
 *  - weather (useWeather owns its own 5-minute refresh interval)
 *  - nearby users (30s polling, safety-critical), /users/me, /users/settings
 *
 * Storage is in-memory only: the cache lives for the current app session and is
 * never written to localStorage/sessionStorage.
 */

/** TTL policy per data class. */
export const CACHE_TTL = {
  /** OSM/Overpass-derived nearby infrastructure. Slow, effectively static. */
  nearby: 5 * 60 * 1000,
  /** Database reference data (shelters, hospitals). Rarely changes. */
  reference: 5 * 60 * 1000,
} as const;

/**
 * Decimal places kept for coordinates in cache keys.
 *
 * 4 dp ~= 11 m of latitude (~8.5 m of longitude at the equator). This absorbs
 * ordinary GPS jitter (a phone drifting a few metres between fixes) so a
 * stationary user reuses one cache entry, while still separating genuinely
 * different locations (two users 100 m apart get different keys).
 */
const COORD_PRECISION = 4;

/** Upper bound on retained entries; oldest-stored are evicted first. */
const MAX_ENTRIES = 50;

export interface CachedRequestOptions {
  /** Bypass any cached value and perform a real request. */
  force?: boolean;
}

interface CacheEntry {
  value: unknown;
  storedAt: number;
  ttlMs: number;
}

export interface ApiCacheStats {
  entries: number;
  inFlight: number;
  keys: string[];
}

/** key -> { value, storedAt, ttlMs } */
const store = new Map<string, CacheEntry>();
/** key -> Promise of an in-progress request, so duplicates can await it. */
const inFlight = new Map<string, Promise<unknown>>();

const isDev = (): boolean => {
  try {
    return Boolean(import.meta.env?.DEV);
  } catch {
    return false;
  }
};

/** Dev-only logging. Never runs (or spams) in production builds. */
function log(status: 'HIT' | 'MISS' | 'IN-FLIGHT' | 'EXPIRED' | 'FORCE', key: string, detail?: unknown): void {
  if (!isDev()) return;
  if (detail === undefined) console.debug(`[API CACHE] ${status} ${key}`);
  else console.debug(`[API CACHE] ${status} ${key}`, detail);
}

/** Round a coordinate so insignificant float noise cannot fragment cache keys. */
export function normalizeCoord(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Number(value.toFixed(COORD_PRECISION));
}

/**
 * Cache key for /api/location/nearby.
 *
 * Every parameter that changes the response is part of the key, so a 5 km
 * result can never be served for a 10 km request. Coordinates are normalized
 * for GPS jitter; radius is kept exact (integer metres).
 */
export function nearbyCacheKey(lat: number, lng: number, radius: number): string {
  return `nearby:${normalizeCoord(lat)}:${normalizeCoord(lng)}:${Math.round(radius)}`;
}

/** Evict expired entries, then the oldest entries, until back under MAX_ENTRIES. */
function prune(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.storedAt >= entry.ttlMs) store.delete(key);
  }
  if (store.size <= MAX_ENTRIES) return;
  const byAge = [...store.entries()].sort((a, b) => a[1].storedAt - b[1].storedAt);
  for (const [key] of byAge) {
    if (store.size <= MAX_ENTRIES) break;
    store.delete(key);
  }
}

/**
 * Return a cached value when fresh, otherwise perform `request` — collapsing
 * concurrent identical requests onto a single HTTP call.
 *
 * @param key       Fully-qualified cache key (all response-affecting params).
 * @param ttlMs     Freshness window for this entry.
 * @param request   Performs the actual HTTP request. Only called when needed.
 * @param options   `force: true` skips the cache and always hits the network.
 */
export async function cachedRequest<T>(
  key: string,
  ttlMs: number,
  request: () => Promise<T>,
  options: CachedRequestOptions = {}
): Promise<T> {
  const force = options.force === true;

  if (force) {
    // An explicit refresh must return genuinely fresh data, so it neither reads
    // the cache nor joins an ordinary in-flight request. Concurrent *forced*
    // refreshes still collapse together (see flightKey below).
    log('FORCE', key);
  } else {
    const entry = store.get(key);
    if (entry) {
      const age = Date.now() - entry.storedAt;
      if (age < entry.ttlMs) {
        log('HIT', key, { ageMs: age, ttlMs: entry.ttlMs });
        return entry.value as T;
      }
      log('EXPIRED', key, { ageMs: age, ttlMs: entry.ttlMs });
      store.delete(key);
    }

    const pending = inFlight.get(key);
    if (pending) {
      log('IN-FLIGHT', key);
      return pending as Promise<T>;
    }
    log('MISS', key);
  }

  const flightKey = force ? `${key}::force` : key;
  const concurrentForced = inFlight.get(flightKey);
  if (concurrentForced) {
    log('IN-FLIGHT', key, { forced: true });
    return concurrentForced as Promise<T>;
  }

  const promise = request()
    .then((value) => {
      store.set(key, { value, storedAt: Date.now(), ttlMs });
      prune();
      return value;
    })
    .finally(() => {
      if (inFlight.get(flightKey) === promise) inFlight.delete(flightKey);
    });

  inFlight.set(flightKey, promise);
  return promise;
}

/**
 * Drop cached entries. Pass a prefix to target a group (e.g. `'nearby:'`).
 * In-flight requests are left alone; they will repopulate on completion.
 *
 * @returns how many entries were removed
 */
export function invalidateApiCache(keyPrefix?: string): number {
  if (!keyPrefix) {
    const removed = store.size;
    store.clear();
    if (isDev()) console.debug(`[API CACHE] INVALIDATE all (${removed} entries)`);
    return removed;
  }

  let removed = 0;
  for (const key of [...store.keys()]) {
    if (key.startsWith(keyPrefix)) {
      store.delete(key);
      removed++;
    }
  }
  if (isDev()) console.debug(`[API CACHE] INVALIDATE ${keyPrefix}* (${removed} entries)`);
  return removed;
}

/** Convenience wrapper: forget every cached /location/nearby response. */
export function invalidateNearbyCache(): number {
  return invalidateApiCache('nearby:');
}

/** Diagnostics for debugging and tests. */
export function getApiCacheStats(): ApiCacheStats {
  return {
    entries: store.size,
    inFlight: inFlight.size,
    keys: [...store.keys()],
  };
}
