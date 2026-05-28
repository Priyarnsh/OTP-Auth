import twilio from "twilio";
import env from "../config/env.js";

let twilioClient = null;

if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
}

/**
 * Send OTP via SMS using Twilio.
 * Falls back to console logging if Twilio credentials are not configured.
 *
 * @param {string} to — Recipient phone number (E.164 format, e.g. +919876543210)
 * @param {string} otp — The OTP code
 */
export async function sendOtpSms(to, otp) {
  const message = `Your verification code is: ${otp}. It will expire in 5 minutes. Do not share this code.`;

  if (!twilioClient) {
    console.log("──────────────────────────────────────────");
    console.log(`📱 SMS OTP (Console Fallback)`);
    console.log(`   To:   ${to}`);
    console.log(`   Code: ${otp}`);
    console.log("──────────────────────────────────────────");
    return { success: true, provider: "console" };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: env.TWILIO_PHONE_NUMBER,
      to,
    });

    console.log(`✅ SMS sent to ${to} (Twilio SID: ${result.sid})`);
    return { success: true, provider: "twilio", sid: result.sid };
  } catch (err) {
    console.error("❌ Twilio SMS error:", err.message);
    // Fallback to console in case of transient failures
    console.log(`📱 FALLBACK — OTP for ${to}: ${otp}`);
    return { success: true, provider: "console-fallback" };
  }
}
