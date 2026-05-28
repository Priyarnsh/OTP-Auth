import dotenv from "dotenv";
dotenv.config();

const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // Redis
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "fallback-access-secret",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // Resend
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "noreply@yourdomain.com",

  // Twilio
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "",
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || "",

  // OTP
  OTP_LENGTH: parseInt(process.env.OTP_LENGTH, 10) || 6,
  OTP_EXPIRY_SECONDS: parseInt(process.env.OTP_EXPIRY_SECONDS, 10) || 300,
  OTP_MAX_ATTEMPTS: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5,

  // Derived helpers
  get isDev() {
    return this.NODE_ENV === "development";
  },
  get isProd() {
    return this.NODE_ENV === "production";
  },
};

export default env;
