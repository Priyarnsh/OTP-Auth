import { Router } from "express";
import {
  sendOtpHandler,
  verifyOtpHandler,
  refreshHandler,
  logoutHandler,
  logoutAllHandler,
  getMeHandler,
  updateProfileHandler,
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  otpSendLimiter,
  otpVerifyLimiter,
} from "../middlewares/rateLimiter.middleware.js";
import {
  sendOtpSchema,
  verifyOtpSchema,
  updateProfileSchema,
} from "../validators/auth.validator.js";

const router = Router();

// ─── Public Routes ────────────────────────────────────────
router.post(
  "/send-otp",
  otpSendLimiter,
  validate(sendOtpSchema),
  sendOtpHandler
);

router.post(
  "/verify-otp",
  otpVerifyLimiter,
  validate(verifyOtpSchema),
  verifyOtpHandler
);

router.post("/refresh", refreshHandler);

// ─── Protected Routes ─────────────────────────────────────
router.post("/logout", authenticate, logoutHandler);
router.post("/logout-all", authenticate, logoutAllHandler);
router.get("/me", authenticate, getMeHandler);
router.patch(
  "/profile",
  authenticate,
  validate(updateProfileSchema),
  updateProfileHandler
);

export default router;
