import { Resend } from "resend";
import env from "../config/env.js";

let resend = null;

if (env.RESEND_API_KEY) {
  resend = new Resend(env.RESEND_API_KEY);
}

/**
 * Send OTP via email using Resend.
 * Falls back to console logging if RESEND_API_KEY is not configured.
 *
 * @param {string} to — Recipient email address
 * @param {string} otp — The OTP code
 */
export async function sendOtpEmail(to, otp) {
  const subject = "Your Verification Code";
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background-color:#0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); padding: 48px 40px;">
              <tr>
                <td align="center" style="padding-bottom: 32px;">
                  <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 14px; line-height: 56px; text-align: center;">
                    <span style="font-size: 28px;">🔐</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom: 8px;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Verification Code</h1>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom: 32px;">
                  <p style="margin: 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                    Enter this code to verify your email address. It will expire in 5 minutes.
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom: 32px;">
                  <div style="background: rgba(102, 126, 234, 0.1); border: 1px solid rgba(102, 126, 234, 0.25); border-radius: 12px; padding: 20px 32px; display: inline-block;">
                    <span style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #667eea; font-family: 'Courier New', monospace;">${otp}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                    If you didn't request this code, please ignore this email.<br>
                    Do not share this code with anyone.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  if (!resend) {
    console.log("──────────────────────────────────────────");
    console.log(`📧 EMAIL OTP (Console Fallback)`);
    console.log(`   To:   ${to}`);
    console.log(`   Code: ${otp}`);
    console.log("──────────────────────────────────────────");
    return { success: true, provider: "console" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: [to],
      subject,
      html: htmlBody,
    });

    if (error) {
      console.error("❌ Resend error:", error);
      throw new Error(`Email delivery failed: ${error.message}`);
    }

    console.log(`✅ Email sent to ${to} (Resend ID: ${data.id})`);
    return { success: true, provider: "resend", id: data.id };
  } catch (err) {
    console.error("❌ Email service error:", err.message);
    // Fallback to console in case of transient failures
    console.log(`📧 FALLBACK — OTP for ${to}: ${otp}`);
    return { success: true, provider: "console-fallback" };
  }
}
