import { verifyAccessToken } from "../services/token.service.js";
import User from "../models/user.model.js";

/**
 * Authentication Middleware.
 * Extracts JWT from cookies or Authorization header,
 * verifies it, and attaches the user to req.user.
 */
export async function authenticate(req, res, next) {
  try {
    // 1. Try to extract token from cookie first, then Authorization header
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    // 2. Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please log in again.",
      });
    }

    // 3. Fetch user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Account may have been deleted.",
      });
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Authentication error.",
    });
  }
}
