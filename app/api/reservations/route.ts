import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'
import { createClient } from '@/lib/supabase/server'

// POST /api/reservations — create a booking
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    businessId, date, time, partySize,
    customerName, customerPhone, customerEmail,
    specialRequests, occasion,
  } = body

  if (!businessId || !date || !time || !partySize || !customerName?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createPublicClient()

  // Re-verify the slot is still available (race-condition protection)
  const { data: existing } = await (supabase as any)
    .from('reservations')
    .select('party_size')
    .eq('business_id', businessId)
    .eq('reservation_date', date)
    .eq('reservation_time', time)
    .not('status', 'in', '("cancelled","no_show")')

  const { data: settings } = await (supabase as any)
    .from('reservation_settings')
    .select('max_covers_per_slot, slot_duration_minutes')
    .eq('business_id', businessId)
    .single()

  if (settings) {
    const coversBooked = (existing ?? []).reduce((s: number, r: any) => s + r.party_size, 0)
    if (coversBooked + partySize > settings.max_covers_per_slot) {
      return NextResponse.json({ error: 'Sorry, this time slot just filled up. Please choose another.' }, { status: 409 })
    }
  }

  const { data, error } = await (supabase as any)
    .from('reservations')
    .insert({
      business_id: businessId,
      reservation_date: date,
      reservation_time: time,
      party_size: partySize,
      customer_name: customerName.trim(),
      customer_phone: customerPhone?.trim() || null,
      customer_email: customerEmail?.trim() || null,
      special_requests: specialRequests?.trim() || null,
      occasion: occasion || null,
      duration_minutes: settings?.slot_duration_minutes ?? 90,
      status: 'pending',
    })
    .select('id, confirmation_code, status, reservation_date, reservation_time, party_size')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reservation: data }, { status: 201 })
}

// GET /api/reservations?businessId=X&date=YYYY-MM-DD  (dashboard)
// GET /api/reservations?code=XXXXXX  (customer lookup)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const businessId = searchParams.get('businessId')
  const date = searchParams.get('date')

  const supabase = createPublicClient()

  // Customer: look up own reservation by code
  if (code) {
    const { data } = await (supabase as any)
      .from('reservations')
      .select('id, confirmation_code, status, reservation_date, reservation_time, party_size, customer_name, occasion, business_id, businesses(name, address, slug)')
      .eq('confirmation_code', code.toUpperCase())
      .maybeSingle()
    return NextResponse.json({ reservation: data })
  }

  // Dashboard: list by business + date (requires auth)
  if (businessId && date) {
    const serverClient = await createClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await (supabase as any)
      .from('reservations')
      .select('*')
      .eq('business_id', businessId)
      .eq('reservation_date', date)
      .order('reservation_time', { ascending: true })

    return NextResponse.json({ reservations: data ?? [] })
  }

  return NextResponse.json({ error: 'Missing params' }, { status: 400 })
}

// PATCH /api/reservations — update status
export async function PATCH(req: NextRequest) {
  const { id, status, internalNotes } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createPublicClient()
  const { data, error } = await (supabase as any)
    .from('reservations')
    .update({ status, ...(internalNotes !== undefined ? { internal_notes: internalNotes } : {}) })
    .eq('id', id)
    .select('id, status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reservation: data })
}
