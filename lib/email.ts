import { Resend } from 'resend'

// Lazy getter — avoids throwing at build time when RESEND_API_KEY is not set
function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY ?? 're_placeholder')
}

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'Optio Menu <noreply@optio-menu.ai>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@optio-menu.ai'

export async function sendAdminNotification({
  subject,
  html,
}: {
  subject: string
  html: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email send')
    return
  }
  return getResend().emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject,
    html,
  })
}

export async function sendContactConfirmation({
  to,
  name,
}: {
  to: string
  name: string
}) {
  if (!process.env.RESEND_API_KEY) return
  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'We received your message — Optio Menu',
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
        <img src="https://www.optio-menu.ai/icon.png" alt="Optio Menu" style="height:40px; margin-bottom:24px;" />
        <h2 style="color:#0f172a; margin:0 0 12px;">Hi ${name}!</h2>
        <p style="color:#475569; line-height:1.6; margin:0 0 16px;">
          Thank you for reaching out. We've received your message and will get back to you within 1–2 business days.
        </p>
        <p style="color:#475569; line-height:1.6; margin:0 0 24px;">
          In the meantime, feel free to explore our platform at 
          <a href="https://www.optio-menu.ai" style="color:#0d9488;">optio-menu.ai</a>.
        </p>
        <p style="color:#94a3b8; font-size:13px; margin:0;">
          — The Optio Menu Team
        </p>
      </div>
    `,
  })
}

export async function sendNewUserNotification({
  email,
  userId,
  signedUpAt,
}: {
  email: string
  userId: string
  signedUpAt: string
}) {
  return sendAdminNotification({
    subject: `🎉 New user signed up: ${email}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background:#f8fafc; border-radius:12px;">
        <h2 style="color:#0f172a; margin:0 0 16px;">🎉 New User Registration</h2>
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0; color:#64748b; font-size:14px;">Email</td>
            <td style="padding:8px 0; color:#0f172a; font-weight:600; font-size:14px;">${email}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; color:#64748b; font-size:14px;">User ID</td>
            <td style="padding:8px 0; color:#0f172a; font-size:13px; font-family:monospace;">${userId}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; color:#64748b; font-size:14px;">Signed up</td>
            <td style="padding:8px 0; color:#0f172a; font-size:14px;">${new Date(signedUpAt).toLocaleString('en-GB', { timeZone: 'Asia/Tokyo' })} JST</td>
          </tr>
        </table>
        <div style="margin-top:24px;">
          <a href="https://www.optio-menu.ai/en/admin/users" 
             style="background:#0d9488; color:white; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">
            View in Admin Panel →
          </a>
        </div>
      </div>
    `,
  })
}
