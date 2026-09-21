'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveReservationSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const businessId = formData.get('businessId') as string

  // Verify ownership
  const { data: biz } = await (supabase as any)
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', user.id)
    .single()
  if (!biz) throw new Error('Not found')

  // Parse hours from individual day fields
  const days = ['0', '1', '2', '3', '4', '5', '6']
  const hours: Record<string, { open: string; close: string } | null> = {}
  for (const d of days) {
    const closed = formData.get(`day_${d}_closed`) === 'true'
    if (closed) {
      hours[d] = null
    } else {
      const open = formData.get(`day_${d}_open`) as string
      const close = formData.get(`day_${d}_close`) as string
      hours[d] = { open: open || '11:30', close: close || '22:00' }
    }
  }

  const settings = {
    business_id: businessId,
    reservations_enabled: formData.get('reservations_enabled') === 'true',
    slot_duration_minutes: Number(formData.get('slot_duration_minutes') ?? 90),
    slot_interval_minutes: Number(formData.get('slot_interval_minutes') ?? 30),
    max_party_size: Number(formData.get('max_party_size') ?? 12),
    max_covers_per_slot: Number(formData.get('max_covers_per_slot') ?? 30),
    max_advance_days: Number(formData.get('max_advance_days') ?? 60),
    min_advance_hours: Number(formData.get('min_advance_hours') ?? 1),
    confirmation_message: (formData.get('confirmation_message') as string)?.trim() || null,
    cancellation_policy: (formData.get('cancellation_policy') as string)?.trim() || null,
    hours,
  }

  // Upsert
  const { error } = await (supabase as any)
    .from('reservation_settings')
    .upsert(settings, { onConflict: 'business_id' })

  if (error) throw new Error(error.message)

  revalidatePath(`/en/dashboard/businesses/${businessId}/settings`)
  revalidatePath(`/ja/dashboard/businesses/${businessId}/settings`)
}

export async function addBlackoutDate(businessId: string, date: string, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await (supabase as any)
    .from('reservation_blackouts')
    .upsert({ business_id: businessId, date, reason: reason || null }, { onConflict: 'business_id,date' })

  revalidatePath(`/en/dashboard/businesses/${businessId}/settings`)
  revalidatePath(`/ja/dashboard/businesses/${businessId}/settings`)
}

export async function removeBlackoutDate(businessId: string, date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await (supabase as any)
    .from('reservation_blackouts')
    .delete()
    .eq('business_id', businessId)
    .eq('date', date)

  revalidatePath(`/en/dashboard/businesses/${businessId}/settings`)
  revalidatePath(`/ja/dashboard/businesses/${businessId}/settings`)
}

export async function updateReservationStatus(
  reservationId: string,
  status: string,
  businessId: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify ownership via business
  const { data: biz } = await (supabase as any)
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', user.id)
    .single()
  if (!biz) throw new Error('Not found')

  await (supabase as any)
    .from('reservations')
    .update({ status })
    .eq('id', reservationId)
    .eq('business_id', businessId)

  revalidatePath(`/en/dashboard/businesses/${businessId}/reservations`)
  revalidatePath(`/ja/dashboard/businesses/${businessId}/reservations`)
}
