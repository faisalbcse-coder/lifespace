import nodemailer from "nodemailer";

interface SendResetEmailParams {
  to: string;
  name?: string | null;
  resetUrl: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST || "127.0.0.1";
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER || "noreply@lifespace.notekori.com";
  const pass = process.env.SMTP_PASS || "LS_Noreply#Secure_8f4a9b2c7e1d";

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: SendResetEmailParams): Promise<{ success: boolean; error?: string }> {
  const from = process.env.SMTP_FROM || '"LifeSpace" <noreply@lifespace.notekori.com>';
  const greeting = name ? `Hello ${name},` : "Hello,";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your LifeSpace Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05); overflow: hidden;" cellspacing="0" cellpadding="0">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 20px 36px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              <div style="display: inline-block; padding: 10px 18px; border-radius: 14px; background: linear-gradient(135deg, #0284c7 0%, #4f46e5 100%);">
                <span style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">LifeSpace</span>
              </div>
              <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px;">
                Personal Management Workspace
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="margin: 0 0 14px 0; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.3;">
                Password Reset Request
              </h1>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                ${greeting}
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                We received a request to reset your password for your <strong>LifeSpace</strong> account. Click the button below to choose a new password:
              </p>

              <!-- Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #0284c7 0%, #4f46e5 100%);">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; letter-spacing: 0.2px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 12px 0; font-size: 12px; line-height: 1.6; color: #64748b;">
                This link will remain active for <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email. Your password will not change.
              </p>

              <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #f1f5f9; font-size: 11px; line-height: 1.5; color: #94a3b8; word-break: break-all;">
                If the button above does not work, copy and paste this URL into your browser:<br>
                <a href="${resetUrl}" style="color: #4f46e5; text-decoration: underline;">${resetUrl}</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px 28px 36px; background-color: #f8fafc; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 500;">
                © 2026 LifeSpace · SW-IT. All rights reserved.
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

  const text = `
LifeSpace Password Reset

${greeting}

We received a request to reset your password for your LifeSpace account.
Use the following link to choose a new password:

${resetUrl}

This link is valid for 15 minutes.
If you did not request this, please ignore this email.

© 2026 LifeSpace · SW-IT
`;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from,
      to,
      subject: "Reset Your LifeSpace Password",
      text,
      html,
    });
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to send email";
    console.error("[Email] Send error:", errorMsg);

    // Try fallback on port 25 without SSL if 465 failed
    try {
      console.log("[Email] Attempting fallback to port 25...");
      const fallbackTransporter = nodemailer.createTransport({
        host: "127.0.0.1",
        port: 25,
        secure: false,
        tls: { rejectUnauthorized: false },
        connectionTimeout: 8000,
      });

      await fallbackTransporter.sendMail({
        from,
        to,
        subject: "Reset Your LifeSpace Password",
        text,
        html,
      });
      return { success: true };
    } catch (fallbackErr: unknown) {
      const fbMsg = fallbackErr instanceof Error ? fallbackErr.message : "Fallback failed";
      console.error("[Email] Fallback error:", fbMsg);
      return { success: false, error: errorMsg };
    }
  }
}
