import { createOtp, verifyOtp } from "../services/otp.service.js";
import { sendOtpEmail } from "../services/email.service.js";
import { sendOtpSms } from "../services/sms.service.js";
import {
  generateTokenPair,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from "../services/token.service.js";
import User from "../models/user.model.js";
import env from "../config/env.js";

// ─── Cookie Config ────────────────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? "strict" : "lax",
  path: "/",
};

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie("accessToken", accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie("refreshToken", refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/v1/auth", // Only sent to auth endpoints
  });
}

function clearAuthCookies(res) {
  res.clearCookie("accessToken", COOKIE_OPTIONS);
  res.clearCookie("refreshToken", { ...COOKIE_OPTIONS, path: "/api/v1/auth" });
}

// ─── Controllers ──────────────────────────────────────────

/**
 * POST /api/v1/auth/send-otp
 * Generate and send OTP via email or SMS.
 */
export async function sendOtpHandler(req, res, next) {
  try {
    const { type, identifier } = req.body;

    // Generate OTP and store in Redis
    const { otp } = await createOtp(type, identifier);

    // Deliver OTP
    if (type === "email") {
      await sendOtpEmail(identifier, otp);
    } else {
      await sendOtpSms(identifier, otp);
    }

    res.status(200).json({
      success: true,
      message: `OTP sent successfully via ${type === "email" ? "email" : "SMS"}.`,
      data: {
        type,
        identifier: maskIdentifier(type, identifier),
        expiresIn: env.OTP_EXPIRY_SECONDS,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/verify-otp
 * Verify OTP and authenticate (create/login) user.
 */
export async function verifyOtpHandler(req, res, next) {
  try {
    const { type, identifier, otp } = req.body;

    // Verify OTP from Redis
    await verifyOtp(type, identifier, otp);

    // Find or create user
    let user = await User.findByIdentifier(type, identifier);
    let isNewUser = false;

    if (!user) {
      user = await User.createUser(type, identifier);
      isNewUser = true;
    } else {
      // Mark as verified if not already
      user = await User.markVerified(user._id, type);
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = await generateTokenPair(user._id);

    // Set HTTP-only cookies
    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: isNewUser
        ? "Account created and verified successfully."
        : "Logged in successfully.",
      data: {
        user: user.toJSON(),
        accessToken, // Also send in body for mobile clients
        isNewUser,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/refresh
 * Rotate refresh token and issue new token pair.
 */
export async function refreshHandler(req, res, next) {
  try {
    const oldToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!oldToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required.",
      });
    }

    const result = await rotateRefreshToken(oldToken);

    if (!result) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token. Please log in again.",
      });
    }

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully.",
      data: {
        accessToken: result.accessToken,
        user: result.user.toJSON ? result.user.toJSON() : result.user,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/logout
 * Revoke refresh token and clear cookies.
 */
export async function logoutHandler(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await revokeRefreshToken(token);
    }

    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/logout-all
 * Revoke ALL refresh tokens for the authenticated user.
 */
export async function logoutAllHandler(req, res, next) {
  try {
    await revokeAllUserTokens(req.user._id);
    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: "Logged out from all devices successfully.",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/auth/me
 * Get current authenticated user.
 */
export async function getMeHandler(req, res) {
  res.status(200).json({
    success: true,
    data: { user: req.user.toJSON() },
  });
}

/**
 * PATCH /api/v1/auth/profile
 * Update user profile.
 */
export async function updateProfileHandler(req, res, next) {
  try {
    const updatedUser = await User.updateProfile(req.user._id, req.body);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: { user: updatedUser.toJSON() },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Helpers ──────────────────────────────────────────────

/**
 * Mask identifier for response (privacy).
 * "john@example.com" → "jo***@example.com"
 * "+919876543210" → "+91*****3210"
 */
function maskIdentifier(type, identifier) {
  if (type === "email") {
    const [local, domain] = identifier.split("@");
    const masked = local.slice(0, 2) + "***";
    return `${masked}@${domain}`;
  }
  if (type === "phone") {
    return identifier.slice(0, 3) + "*****" + identifier.slice(-4);
  }
  return identifier;
}
