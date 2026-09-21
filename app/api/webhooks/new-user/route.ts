import { NextRequest, NextResponse } from 'next/server'
import { sendNewUserNotification } from '@/lib/email'

// This endpoint receives webhooks from Supabase Auth (via Database Webhooks or Edge Functions)
// Set this up in Supabase: Database → Webhooks → New webhook
// Table: auth.users | Event: INSERT | HTTP method: POST
// URL: https://www.optio-menu.ai/api/webhooks/new-user
// Secret header: x-webhook-secret: {WEBHOOK_SECRET env var}

export async function POST(req: NextRequest) {
  // Verify webhook secret
  const secret = req.headers.get('x-webhook-secret')
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await req.json()

    // Supabase webhook payload structure
    const record = payload.record ?? payload
    const email = record.email ?? record.new?.email
    const userId = record.id ?? record.new?.id
    const createdAt = record.created_at ?? record.new?.created_at ?? new Date().toISOString()

    if (!email || !userId) {
      return NextResponse.json({ error: 'Missing user data' }, { status: 400 })
    }

    await sendNewUserNotification({ email, userId, signedUpAt: createdAt })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('New user webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
