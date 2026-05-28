import jwt from "jsonwebtoken";
import env from "../config/env.js";
import RefreshToken from "../models/token.model.js";

/**
 * Token Service — Handles JWT access & refresh token generation and validation.
 */

/**
 * Generate a short-lived access token.
 */
export function generateAccessToken(userId) {
  return jwt.sign({ userId, type: "access" }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

/**
 * Generate a long-lived refresh token and persist it in MongoDB.
 */
export async function generateRefreshToken(userId) {
  const token = jwt.sign({ userId, type: "refresh" }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

  // Calculate expiry date for DB storage
  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000);

  await RefreshToken.createToken(userId, token, expiresAt);

  return token;
}

/**
 * Generate both access and refresh tokens.
 */
export async function generateTokenPair(userId) {
  const accessToken = generateAccessToken(userId);
  const refreshToken = await generateRefreshToken(userId);
  return { accessToken, refreshToken };
}

/**
 * Verify and decode an access token.
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch {
    return null;
  }
}

/**
 * Verify a refresh token and return the DB record with user data.
 * Implements token rotation — old token is deleted, new pair is issued.
 */
export async function rotateRefreshToken(oldToken) {
  let decoded;
  try {
    decoded = jwt.verify(oldToken, env.JWT_REFRESH_SECRET);
  } catch {
    return null;
  }

  // Find the token in the database (populated with user)
  const tokenRecord = await RefreshToken.findByToken(oldToken);
  if (!tokenRecord) {
    // Token reuse detected — possible theft. Revoke ALL tokens for this user.
    if (decoded.userId) {
      await RefreshToken.deleteAllForUser(decoded.userId);
      console.warn(
        `⚠️  Refresh token reuse detected for user ${decoded.userId}. All sessions revoked.`
      );
    }
    return null;
  }

  // Delete the old token (rotation)
  await RefreshToken.deleteByToken(oldToken);

  // The populated user is on tokenRecord.userId (because of populate)
  const user = tokenRecord.userId;

  // Issue new pair
  const { accessToken, refreshToken } = await generateTokenPair(user._id);

  return {
    accessToken,
    refreshToken,
    user,
  };
}

/**
 * Revoke a single refresh token (logout).
 */
export async function revokeRefreshToken(token) {
  await RefreshToken.deleteByToken(token);
}

/**
 * Revoke all refresh tokens for a user (logout everywhere).
 */
export async function revokeAllUserTokens(userId) {
  await RefreshToken.deleteAllForUser(userId);
}
