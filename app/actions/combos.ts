'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Create a new combo deal ──────────────────────────────────────────────────

export async function createComboDeal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const businessId = formData.get('businessId') as string
  const nameEn = (formData.get('nameEn') as string)?.trim()
  const nameJa = (formData.get('nameJa') as string)?.trim() || null
  const descEn = (formData.get('descEn') as string)?.trim() || null
  const descJa = (formData.get('descJa') as string)?.trim() || null
  const price = formData.get('price') ? Number(formData.get('price')) : null

  if (!nameEn) throw new Error('Combo name (EN) is required')
  if (!businessId) throw new Error('Business ID is required')

  const menuItemIds = formData.getAll('menuItemIds') as string[]
  const quantities = (formData.getAll('quantities') as string[]).map(Number)

  if (menuItemIds.length === 0) throw new Error('At least one menu item is required')

  // Verify ownership
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!business) throw new Error('Business not found or not owned by you')

  // Insert combo deal
  const { data: combo, error: comboError } = await (supabase as any)
    .from('combo_deals')
    .insert({
      business_id: businessId,
      name: { en: nameEn, ...(nameJa ? { ja: nameJa } : {}) },
      description: (descEn || descJa)
        ? { ...(descEn ? { en: descEn } : {}), ...(descJa ? { ja: descJa } : {}) }
        : null,
      price: price != null ? Number(price.toFixed(2)) : null,
      is_available: true,
    })
    .select('id')
    .single()

  if (comboError || !combo) {
    console.error('Combo insert error:', comboError)
    throw new Error(comboError?.message || 'Failed to create combo deal')
  }

  // Insert combo deal items
  const items = menuItemIds.map((menuItemId, i) => ({
    combo_deal_id: combo.id,
    menu_item_id: menuItemId,
    quantity: quantities[i] ?? 1,
  }))

  const { error: itemsError } = await (supabase as any)
    .from('combo_deal_items')
    .insert(items)

  if (itemsError) {
    console.error('Combo items insert error:', itemsError)
    throw new Error(itemsError.message)
  }

  revalidatePath(`/en/dashboard/businesses/${businessId}/combos`)
  revalidatePath(`/ja/dashboard/businesses/${businessId}/combos`)
}

// ── Delete a combo deal ──────────────────────────────────────────────────────

export async function deleteComboDeal(id: string, businessId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify ownership via business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!business) throw new Error('Business not found or not owned by you')

  // combo_deal_items will cascade delete via FK
  const { error } = await (supabase as any)
    .from('combo_deals')
    .delete()
    .eq('id', id)
    .eq('business_id', businessId)

  if (error) throw new Error(error.message)

  revalidatePath(`/en/dashboard/businesses/${businessId}/combos`)
  revalidatePath(`/ja/dashboard/businesses/${businessId}/combos`)
}

// ── Toggle combo availability ────────────────────────────────────────────────

export async function toggleComboAvailability(
  id: string,
  businessId: string,
  current: boolean,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify ownership
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!business) throw new Error('Business not found or not owned by you')

  const { error } = await (supabase as any)
    .from('combo_deals')
    .update({ is_available: !current })
    .eq('id', id)
    .eq('business_id', businessId)

  if (error) throw new Error(error.message)

  revalidatePath(`/en/dashboard/businesses/${businessId}/combos`)
  revalidatePath(`/ja/dashboard/businesses/${businessId}/combos`)
}
