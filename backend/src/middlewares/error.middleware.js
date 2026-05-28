import env from "../config/env.js";

/**
 * Global Error Handler Middleware.
 * Catches all unhandled errors and returns a structured JSON response.
 * Must be registered LAST in Express middleware chain.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // Default status code
  const statusCode = err.statusCode || err.status || 500;

  // Build response
  const response = {
    success: false,
    message: err.message || "Internal Server Error",
  };

  // Include extra fields from custom errors
  if (err.cooldownRemaining !== undefined) {
    response.cooldownRemaining = err.cooldownRemaining;
  }
  if (err.attemptsRemaining !== undefined) {
    response.attemptsRemaining = err.attemptsRemaining;
  }

  // Include stack trace in development only
  if (env.isDev) {
    response.stack = err.stack;
  }

  // Log server errors
  if (statusCode >= 500) {
    console.error("💥 Server Error:", err);
  }

  res.status(statusCode).json(response);
}

/**
 * 404 Not Found Handler.
 * Catches requests to undefined routes.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}
