const Redis = require("ioredis");

// ─── Redis Toggle ────────────────────────────────────────────────────────────
// Controlled by a single env var. Strict check: only the literal string 'true' enables it.
const isRedisEnabled = process.env.REDIS_ENABLED === "true";

let redisClient = null;
let redisSubClient = null;

/**
 * Create an ioredis instance with resilient error handling.
 * Logs on connect/error — never throws or crashes the process.
 * @param {string} label  Human-readable label for log messages (e.g. "Redis" or "Redis-Sub")
 * @returns {import("ioredis")}
 */
const createClient = (label) => {
  const client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    // Don't throw on connection failure — let the app degrade gracefully
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false, // connect immediately so we get fast feedback in logs
    retryStrategy(times) {
      // Exponential backoff capped at 5 seconds between retries
      const delay = Math.min(times * 200, 5000);
      console.warn(`⚠️  [${label}] Reconnecting in ${delay}ms (attempt ${times})…`);
      return delay;
    },
  });

  client.on("connect", () => {
    console.log(`🟢 [${label}] Connected to ${process.env.REDIS_URL || "redis://localhost:6379"}`);
  });

  client.on("error", (err) => {
    console.error(`🔴 [${label}] Error — ${err.message}`);
  });

  return client;
};

/**
 * Get (or lazily create) the shared Redis client.
 * Returns null immediately if REDIS_ENABLED is not 'true'.
 * @returns {import("ioredis") | null}
 */
const getRedisClient = () => {
  if (!isRedisEnabled) return null;
  if (!redisClient) {
    redisClient = createClient("Redis");
  }
  return redisClient;
};

/**
 * Get (or lazily create) a duplicate Redis client for Socket.IO adapter pub/sub.
 * Returns null immediately if REDIS_ENABLED is not 'true'.
 * @returns {import("ioredis") | null}
 */
const getRedisSubClient = () => {
  if (!isRedisEnabled) return null;
  // Ensure main client exists first, then duplicate for the subscriber role
  const main = getRedisClient();
  if (!redisSubClient) {
    redisSubClient = main.duplicate();
    redisSubClient.on("connect", () => {
      console.log("🟢 [Redis-Sub] Subscriber client connected");
    });
    redisSubClient.on("error", (err) => {
      console.error(`🔴 [Redis-Sub] Error — ${err.message}`);
    });
  }
  return redisSubClient;
};

module.exports = { isRedisEnabled, getRedisClient, getRedisSubClient };
