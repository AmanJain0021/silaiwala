const { isRedisEnabled, getRedisClient } = require("../config/redis");

/**
 * Get a cached value or compute it fresh.
 * When Redis is disabled or on any Redis error, falls through to fetchFn() directly.
 *
 * @param {string} key          Redis key (e.g. "cache:admin:dashboard-stats")
 * @param {number} ttlSeconds   Time-to-live in seconds
 * @param {Function} fetchFn    Async function that returns the fresh data
 * @returns {Promise<any>}
 */
const getCached = async (key, ttlSeconds, fetchFn) => {
  if (!isRedisEnabled) return await fetchFn();

  try {
    const client = getRedisClient();
    if (!client) return await fetchFn();

    const cached = await client.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const fresh = await fetchFn();
    // Store in background — don't block the response if SET fails
    client.set(key, JSON.stringify(fresh), "EX", ttlSeconds).catch((err) => {
      console.warn(`⚠️  [Cache] Failed to SET ${key} — ${err.message}`);
    });
    return fresh;
  } catch (err) {
    console.warn(`⚠️  [Cache] Error on key ${key} — ${err.message}. Falling back to live query.`);
    return await fetchFn();
  }
};

/**
 * Invalidate one or more cache keys.
 * - Exact key:  invalidateCache("cache:admin:dashboard-stats")
 * - Pattern:    invalidateCache("cache:products:*")  (uses KEYS + DEL)
 *
 * NOTE: KEYS is O(n) and acceptable at this scale. If the dataset grows much
 * larger, this should be replaced with SCAN-based iteration.
 *
 * No-op when Redis is disabled. Never throws.
 *
 * @param {string} keyOrPattern
 */
const invalidateCache = async (keyOrPattern) => {
  if (!isRedisEnabled) return;

  try {
    const client = getRedisClient();
    if (!client) return;

    if (keyOrPattern.includes("*")) {
      const keys = await client.keys(keyOrPattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } else {
      await client.del(keyOrPattern);
    }
  } catch (err) {
    console.warn(`⚠️  [Cache] Invalidation error for "${keyOrPattern}" — ${err.message}`);
  }
};

module.exports = { getCached, invalidateCache };
