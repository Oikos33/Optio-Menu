import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'
import { sendContactConfirmation, sendAdminNotification } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { name, email, subject, message, source } = await req.json()

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const supabase = createPublicClient()

  // Store in DB
  const { error } = await (supabase as any)
    .from('contact_messages')
    .insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      source: source ?? 'contact_form',
    })

  if (error) {
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
  }

  // Send confirmation to sender (non-blocking)
  sendContactConfirmation({ to: email.trim(), name: name.trim() }).catch(console.error)

  // Notify admin (non-blocking)
  sendAdminNotification({
    subject: `📩 New contact message: ${subject.trim()}`,
    html: `
      <div style="font-family:sans-serif; max-width:560px; margin:0 auto; padding:32px 24px; background:#f8fafc; border-radius:12px;">
        <h2 style="color:#0f172a; margin:0 0 16px;">📩 New Contact Message</h2>
        <table style="width:100%; border-collapse:collapse;">
          <tr><td style="padding:6px 0; color:#64748b; font-size:14px; width:100px;">From</td><td style="padding:6px 0; color:#0f172a; font-weight:600;">${name}</td></tr>
          <tr><td style="padding:6px 0; color:#64748b; font-size:14px;">Email</td><td style="padding:6px 0; color:#0f172a;">${email}</td></tr>
          <tr><td style="padding:6px 0; color:#64748b; font-size:14px;">Subject</td><td style="padding:6px 0; color:#0f172a;">${subject}</td></tr>
        </table>
        <div style="margin-top:16px; padding:16px; background:white; border-radius:8px; border:1px solid #e2e8f0;">
          <p style="color:#334155; line-height:1.6; margin:0; white-space:pre-wrap;">${message}</p>
        </div>
        <div style="margin-top:24px;">
          <a href="https://www.optio-menu.ai/en/admin/messages"
             style="background:#0d9488; color:white; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">
            View in Admin Panel →
          </a>
        </div>
      </div>
    `,
  }).catch(console.error)

  return NextResponse.json({ success: true }, { status: 201 })
}
