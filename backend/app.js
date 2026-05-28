import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import env from "./src/config/env.js";
import apiRoutes from "./src/routes/index.js";
import { apiLimiter } from "./src/middlewares/rateLimiter.middleware.js";
import {
  errorHandler,
  notFoundHandler,
} from "./src/middlewares/error.middleware.js";

const app = express();

// ─── Security Headers ────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Body Parsing ─────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ─── Cookies ──────────────────────────────────────────────
app.use(cookieParser());

// ─── Request Logging ──────────────────────────────────────
if (env.isDev) {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ─── Global Rate Limiter ──────────────────────────────────
app.use("/api", apiLimiter);

// ─── API Routes ───────────────────────────────────────────
app.use("/api/v1", apiRoutes);

// ─── Root Endpoint ────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "OTP Auth API Server",
    version: "1.0.0",
    docs: "/api/v1/health",
  });
});

// ─── 404 Handler ──────────────────────────────────────────
app.use(notFoundHandler);

// ─── Global Error Handler ─────────────────────────────────
app.use(errorHandler);

export default app;
