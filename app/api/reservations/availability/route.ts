import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'

// GET /api/reservations/availability?businessId=X&date=YYYY-MM-DD&partySize=N
// Returns available time slots for a given date

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const businessId = searchParams.get('businessId')
  const dateStr = searchParams.get('date')       // YYYY-MM-DD
  const partySize = Number(searchParams.get('partySize') ?? 1)

  if (!businessId || !dateStr) {
    return NextResponse.json({ slots: [], error: 'Missing params' }, { status: 400 })
  }

  const supabase = createPublicClient()

  // 1. Load settings
  const { data: settings } = await (supabase as any)
    .from('reservation_settings')
    .select('*')
    .eq('business_id', businessId)
    .single()

  if (!settings || !settings.reservations_enabled) {
    return NextResponse.json({ slots: [], closed: true })
  }

  // 2. Check blackout
  const { data: blackout } = await (supabase as any)
    .from('reservation_blackouts')
    .select('id, reason')
    .eq('business_id', businessId)
    .eq('date', dateStr)
    .maybeSingle()

  if (blackout) {
    return NextResponse.json({ slots: [], blackout: true, blackoutReason: blackout.reason })
  }

  // 3. Get day of week (0=Sun…6=Sat) from local date string
  const [year, month, day] = dateStr.split('-').map(Number)
  const dateObj = new Date(year, month - 1, day)
  const dayOfWeek = dateObj.getDay()

  const dayHours = settings.hours?.[String(dayOfWeek)]
  if (!dayHours) {
    return NextResponse.json({ slots: [], closed: true, closedReason: 'Closed on this day' })
  }

  // 4. Validate party size
  if (partySize > settings.max_party_size) {
    return NextResponse.json({
      slots: [],
      error: `Maximum party size is ${settings.max_party_size}`,
    })
  }

  // 5. Enforce booking window (min advance hours, max advance days)
  const nowMs = Date.now()
  const dateMs = dateObj.getTime()
  const diffHours = (dateMs - nowMs) / (1000 * 60 * 60)
  if (diffHours < -24) {
    return NextResponse.json({ slots: [], error: 'Date is in the past' })
  }
  const diffDays = (dateMs - nowMs) / (1000 * 60 * 60 * 24)
  if (diffDays > settings.max_advance_days) {
    return NextResponse.json({ slots: [], error: `Cannot book more than ${settings.max_advance_days} days in advance` })
  }

  // 6. Generate candidate slots
  const openMin = timeToMinutes(dayHours.open)
  // Last slot start = close - slot_duration
  const closeMin = timeToMinutes(dayHours.close)
  const lastSlotStart = closeMin - settings.slot_duration_minutes
  const interval = settings.slot_interval_minutes

  const candidateSlots: string[] = []
  for (let t = openMin; t <= lastSlotStart; t += interval) {
    candidateSlots.push(minutesToTime(t))
  }

  if (candidateSlots.length === 0) {
    return NextResponse.json({ slots: [], closed: true })
  }

  // 7. Fetch existing reservations for this date
  const { data: existing } = await (supabase as any)
    .from('reservations')
    .select('reservation_time, party_size, status')
    .eq('business_id', businessId)
    .eq('reservation_date', dateStr)
    .not('status', 'in', '("cancelled","no_show")')

  // 8. For each slot calculate total covers booked
  const coversBySlot: Record<string, number> = {}
  for (const r of existing ?? []) {
    const slotKey = r.reservation_time.slice(0, 5) // "HH:MM"
    coversBySlot[slotKey] = (coversBySlot[slotKey] ?? 0) + r.party_size
  }

  // 9. Also exclude slots that are too soon (min_advance_hours)
  const minFutureMs = nowMs + settings.min_advance_hours * 60 * 60 * 1000
  const minFutureDate = new Date(minFutureMs)

  const availableSlots = candidateSlots
    .filter(slot => {
      // Check min advance: combine date + slot time
      const [sh, sm] = slot.split(':').map(Number)
      const slotMs = new Date(year, month - 1, day, sh, sm).getTime()
      if (slotMs < minFutureDate.getTime()) return false

      // Check capacity
      const coversBooked = coversBySlot[slot] ?? 0
      return coversBooked + partySize <= settings.max_covers_per_slot
    })
    .map(slot => ({
      time: slot,
      available: true,
      coversLeft: settings.max_covers_per_slot - (coversBySlot[slot] ?? 0),
    }))

  return NextResponse.json({
    slots: availableSlots,
    settings: {
      slotDuration: settings.slot_duration_minutes,
      maxPartySize: settings.max_party_size,
      confirmationMessage: settings.confirmation_message,
    },
  })
}
