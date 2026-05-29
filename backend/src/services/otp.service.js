import crypto from "crypto";
import redis from "../config/redis.js";
import env from "../config/env.js";

/**
 * OTP Redis Key Patterns:
 *   otp:{type}:{identifier}       → The OTP code
 *   otp:{type}:{identifier}:att   → Verification attempt counter
 *   otp:cooldown:{type}:{identifier} → Cooldown to prevent spam
 */

const OTP_PREFIX = "otp";
const COOLDOWN_SECONDS = 300; // 5 minutes between OTP requests

/**
 * Generate a cryptographically secure numeric OTP.
 */
function generateOtp(length = env.OTP_LENGTH) {
  const max = Math.pow(10, length);
  const min = Math.pow(10, length - 1);
  const num = crypto.randomInt(min, max);
  return num.toString();
}

/**
 * Store a new OTP in Redis with TTL.
 * @param {"email"|"phone"} type
 * @param {string} identifier — email address or phone number
 * @returns {{ otp: string }} The generated OTP
 * @throws {Error} If on cooldown
 */
export async function createOtp(type, identifier) {
  const cooldownKey = `${OTP_PREFIX}:cooldown:${type}:${identifier}`;
  const otpKey = `${OTP_PREFIX}:${type}:${identifier}`;
  const attemptKey = `${otpKey}:att`;

  // Check cooldown
  const cooldown = await redis.ttl(cooldownKey);
  if (cooldown > 0) {
    const error = new Error(
      `Please wait ${cooldown} seconds before requesting a new OTP.`
    );
    error.statusCode = 429;
    error.cooldownRemaining = cooldown;
    throw error;
  }

  const otp = generateOtp();

  // Store OTP with expiry
  await redis.setex(otpKey, env.OTP_EXPIRY_SECONDS, otp);
  // Reset attempt counter
  await redis.del(attemptKey);
  // Set cooldown
  await redis.setex(cooldownKey, COOLDOWN_SECONDS, "1");

  return { otp };
}

/**
 * Verify an OTP from Redis.
 * @param {"email"|"phone"} type
 * @param {string} identifier
 * @param {string} code — user-supplied OTP code
 * @returns {boolean} true if valid
 * @throws {Error} On invalid/expired/max attempts exceeded
 */
export async function verifyOtp(type, identifier, code) {
  const otpKey = `${OTP_PREFIX}:${type}:${identifier}`;
  const attemptKey = `${otpKey}:att`;

  // Check attempt count
  const attempts = parseInt((await redis.get(attemptKey)) || "0", 10);
  if (attempts >= env.OTP_MAX_ATTEMPTS) {
    // Delete the OTP — force re-request
    await redis.del(otpKey);
    await redis.del(attemptKey);
    const error = new Error(
      "Maximum verification attempts exceeded. Please request a new OTP."
    );
    error.statusCode = 429;
    throw error;
  }

  // Get stored OTP
  const storedOtp = await redis.get(otpKey);
  if (!storedOtp) {
    const error = new Error("OTP expired or not found. Please request a new one.");
    error.statusCode = 400;
    throw error;
  }

  // Increment attempt counter
  await redis.incr(attemptKey);
  await redis.expire(attemptKey, env.OTP_EXPIRY_SECONDS);

  // Constant-time comparison to prevent timing attacks
  if (
    storedOtp.length !== code.length ||
    !crypto.timingSafeEqual(Buffer.from(storedOtp), Buffer.from(code))
  ) {
    const remaining = env.OTP_MAX_ATTEMPTS - attempts - 1;
    const error = new Error(
      `Invalid OTP. ${remaining} attempt(s) remaining.`
    );
    error.statusCode = 400;
    error.attemptsRemaining = remaining;
    throw error;
  }

  // OTP is valid — clean up
  await redis.del(otpKey);
  await redis.del(attemptKey);

  return true;
}
