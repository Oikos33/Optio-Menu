'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateRestaurantProfile(
  businessId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Not authenticated' }

  // Verify ownership
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', user.id)
    .single() as { data: { id: string } | null; error: unknown }

  if (!business) return { ok: false, error: 'Business not found or access denied' }

  // Parse tip_presets from comma-separated or JSON
  let tipPresets: number[] = [10, 15, 20]
  const tipPresetsRaw = formData.get('tip_presets') as string | null
  if (tipPresetsRaw) {
    try {
      tipPresets = tipPresetsRaw.split(',').map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v))
    } catch {
      // keep defaults
    }
  }

  // Parse occasions (checkboxes — multiple values)
  const occasions = formData.getAll('occasions') as string[]

  // Parse amenities (checkboxes with known keys)
  const amenityKeys = [
    'smoking_area', 'wheelchair_accessible', 'parking', 'near_station',
    'kids_welcome', 'pet_friendly', 'card_payment', 'cash_only', 'qr_payment',
  ]
  const amenities: Record<string, boolean> = {}
  for (const key of amenityKeys) {
    amenities[key] = formData.get(`amenity_${key}`) === 'on'
  }

  // Parse languages (comma-separated string)
  const languagesRaw = formData.get('languages_spoken') as string | null
  const languagesSpoken = languagesRaw
    ? languagesRaw.split(',').map(s => s.trim()).filter(Boolean)
    : []

  // KDS PIN: validate 4-6 digits
  const kdsPin = formData.get('kds_pin') as string | null
  const kdsPinValue = kdsPin && /^\d{4,6}$/.test(kdsPin.trim()) ? kdsPin.trim() : null

  const updates = {
    currency: (formData.get('currency') as string) || 'JPY',
    tip_enabled: formData.get('tip_enabled') === 'on',
    tip_presets: tipPresets,
    occasions,
    amenities,
    dress_code: (formData.get('dress_code') as string) || null,
    languages_spoken: languagesSpoken,
    walk_in_ok: formData.get('walk_in_ok') === 'on',
    kds_pin: kdsPinValue,
    updated_at: new Date().toISOString(),
  }

  const { error } = await (supabase as any)
    .from('businesses')
    .update(updates)
    .eq('id', businessId)

  if (error) {
    console.error('updateRestaurantProfile error:', error)
    return { ok: false, error: error.message }
  }

  revalidatePath(`/dashboard/businesses/${businessId}`)
  revalidatePath(`/dashboard/businesses/${businessId}/settings`)
  revalidatePath(`/menu`) // if menu page uses these fields

  return { ok: true }
}
