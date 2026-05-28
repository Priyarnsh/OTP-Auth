import { Router } from "express";
import authRoutes from "./auth.routes.js";

const router = Router();

// ─── API Version 1 ────────────────────────────────────────
router.use("/auth", authRoutes);

// ─── Health Check ─────────────────────────────────────────
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy 🚀",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
