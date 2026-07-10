const rateLimit = require("express-rate-limit");
const { isRedisEnabled, getRedisClient } = require("../config/redis");

// Custom key generator that uses both IP and User-Agent to differentiate devices on the same network
const customKeyGenerator = (req) => {
  return `${req.ip}_${req.headers['user-agent'] || 'unknown'}`;
};

// ─── Helper: create a dedicated RedisStore per tier ──────────────────────────
// Each tier MUST have its own RedisStore instance (express-rate-limit v8 enforces this).
// Returns undefined when Redis is disabled → limiter falls back to in-memory MemoryStore.

function createTierStore(prefix) {
  if (!isRedisEnabled) return undefined;
  try {
    const { RedisStore } = require("rate-limit-redis");
    const redisClient = getRedisClient();
    if (!redisClient) return undefined;
    console.log(`🟢 [Rate-Limit] Using Redis store (prefix: ${prefix})`);
    return new RedisStore({
      prefix,
      sendCommand: (...args) => redisClient.call(...args),
    });
  } catch (err) {
    console.warn(`⚠️  [Rate-Limit] Failed to init Redis store for ${prefix} — ${err.message}. Using in-memory store.`);
    return undefined;
  }
}

// ─── Tier configuration (env-configurable, safe defaults) ────────────────────
const GLOBAL_WINDOW_MS = (parseInt(process.env.RATE_LIMIT_GLOBAL_WINDOW_MIN, 10) || 15) * 60 * 1000;
const GLOBAL_MAX       = parseInt(process.env.RATE_LIMIT_GLOBAL_MAX, 10) || 1500;
const AUTH_WINDOW_MS   = (parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MIN, 10) || 15) * 60 * 1000;
const AUTH_MAX         = parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 20;
const UPLOAD_WINDOW_MS = (parseInt(process.env.RATE_LIMIT_UPLOAD_WINDOW_MIN, 10) || 15) * 60 * 1000;
const UPLOAD_MAX       = parseInt(process.env.RATE_LIMIT_UPLOAD_MAX, 10) || 3500;
const PUBLIC_WINDOW_MS = (parseInt(process.env.RATE_LIMIT_PUBLIC_WINDOW_MIN, 10) || 15) * 60 * 1000;
const PUBLIC_MAX       = parseInt(process.env.RATE_LIMIT_PUBLIC_MAX, 10) || 100000;

// ─── Global Limiter ──────────────────────────────────────────────────────────
const globalStore = createTierStore("rl-global:");
const globalLimiter = rateLimit({
  windowMs: GLOBAL_WINDOW_MS,
  max: GLOBAL_MAX,
  keyGenerator: customKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  store: globalStore || undefined,
});

// ─── Auth Limiter ────────────────────────────────────────────────────────────
const authStore = createTierStore("rl-auth:");
const authLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX,
  keyGenerator: customKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  store: authStore || undefined,
});

// ─── Upload Limiter (applied per-route in upload route files) ────────────────
const uploadStore = createTierStore("rl-upload:");
const uploadLimiter = rateLimit({
  windowMs: UPLOAD_WINDOW_MS,
  max: UPLOAD_MAX,
  keyGenerator: customKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: {
    success: false,
    message: "Too many upload requests, please try again later.",
  },
  store: uploadStore || undefined,
});

// ─── Public Limiter (applied per-route in public listing route files) ────────
const publicStore = createTierStore("rl-public:");
const publicLimiter = rateLimit({
  windowMs: PUBLIC_WINDOW_MS,
  max: PUBLIC_MAX,
  keyGenerator: customKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: {
    success: false,
    message: "Too many requests, please slow down.",
  },
  store: publicStore || undefined,
});

module.exports = { globalLimiter, authLimiter, uploadLimiter, publicLimiter };
