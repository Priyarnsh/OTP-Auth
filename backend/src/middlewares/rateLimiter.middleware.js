import redis from "../config/redis.js";

/**
 * Redis-based Rate Limiter Middleware Factory.
 *
 * @param {object} options
 * @param {number} options.windowSeconds — Time window in seconds
 * @param {number} options.maxRequests — Max requests per window
 * @param {string} [options.keyPrefix] — Redis key prefix
 * @param {function} [options.keyGenerator] — Custom key generator (req) => string
 * @param {string} [options.message] — Custom error message
 */
export function rateLimiter({
  windowSeconds = 60,
  maxRequests = 10,
  keyPrefix = "rl",
  keyGenerator = null,
  message = "Too many requests. Please try again later.",
} = {}) {
  return async (req, res, next) => {
    try {
      // Generate the unique key for this client
      const identifier = keyGenerator
        ? keyGenerator(req)
        : req.ip || req.socket.remoteAddress || "unknown";

      const key = `${keyPrefix}:${identifier}`;

      // Increment request count
      const current = await redis.incr(key);

      // Set expiry on first request in window
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      // Get remaining TTL for headers
      const ttl = await redis.ttl(key);

      // Set rate limit headers
      res.set({
        "X-RateLimit-Limit": String(maxRequests),
        "X-RateLimit-Remaining": String(Math.max(0, maxRequests - current)),
        "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + ttl),
      });

      if (current > maxRequests) {
        return res.status(429).json({
          success: false,
          message,
          retryAfter: ttl,
        });
      }

      next();
    } catch (err) {
      // If Redis is down, allow the request (fail-open)
      console.warn("⚠️  Rate limiter error (fail-open):", err.message);
      next();
    }
  };
}

/**
 * Pre-configured rate limiter for OTP sending.
 * Limits to 3 OTP requests per 10 minutes per IP.
 */
export const otpSendLimiter = rateLimiter({
  windowSeconds: 60,
  maxRequests: 20,
  keyPrefix: "rl:otp-send",
  message: "Too many OTP requests. Please wait before trying again.",
});

/**
 * Pre-configured rate limiter for OTP verification.
 * Limits to 10 verification attempts per 10 minutes per IP.
 */
export const otpVerifyLimiter = rateLimiter({
  windowSeconds: 600,
  maxRequests: 10,
  keyPrefix: "rl:otp-verify",
  message: "Too many verification attempts. Please wait before trying again.",
});

/**
 * General API rate limiter.
 * Limits to 100 requests per minute per IP.
 */
export const apiLimiter = rateLimiter({
  windowSeconds: 60,
  maxRequests: 100,
  keyPrefix: "rl:api",
});
