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
    <body style="margin:0; padding:0; background-color:#0c0a09; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0c0a09; padding: 60px 0;">
        <tr>
          <td align="center">
            <table width="420" cellpadding="0" cellspacing="0" style="background-color: #1c1917; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); padding: 40px;">
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <h1 style="margin: 0; color: #fafaf9; font-size: 20px; font-weight: 600; letter-spacing: -0.5px;">Verification Code</h1>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom: 32px;">
                  <p style="margin: 0; color: #a8a29e; font-size: 14px; line-height: 1.5;">
                    Enter this code to verify your identity. It will expire in 5 minutes.
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom: 32px;">
                  <div style="background-color: rgba(255, 255, 255, 0.04); border: 1px solid rgba(249, 115, 22, 0.2); border-radius: 8px; padding: 16px 24px; display: inline-block;">
                    <span style="font-size: 32px; font-weight: 600; letter-spacing: 8px; color: #f97316; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; user-select: all;">\${otp}</span>
                  </div>
                  <div style="margin-top: 12px;">
                    <span style="font-size: 12px; color: #78716c; background-color: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 4px;">Double-click code to copy</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <p style="margin: 0; color: #78716c; font-size: 12px; line-height: 1.5;">
                    If you didn't request this code, you can safely ignore this email.
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
