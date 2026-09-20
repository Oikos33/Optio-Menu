'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Toggle item availability (simple on/off) ────────────────────────────────

export async function toggleItemAvailability(itemId: string, businessId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify ownership via the business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!business) throw new Error('Business not found or not owned by user')

  // Fetch current value then flip it
  const { data: item } = await (supabase as any)
    .from('menu_items')
    .select('is_available')
    .eq('id', itemId)
    .eq('business_id', businessId)
    .single()

  if (!item) throw new Error('Item not found')

  const { error } = await (supabase as any)
    .from('menu_items')
    .update({ is_available: !item.is_available })
    .eq('id', itemId)
    .eq('business_id', businessId)

  if (error) throw new Error(error.message)

  revalidatePath(`/en/dashboard/businesses/${businessId}`)
  revalidatePath(`/ja/dashboard/businesses/${businessId}`)
}

// ── Full availability settings update ──────────────────────────────────────

export async function updateItemAvailability(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const itemId       = formData.get('itemId')       as string
  const businessId   = formData.get('businessId')   as string
  const isAvailable  = formData.get('isAvailable')  === 'true'
  const trackStock   = formData.get('trackStock')   === 'true'
  const availableFrom  = (formData.get('availableFrom')  as string) || null
  const availableUntil = (formData.get('availableUntil') as string) || null
  const stockCountRaw  = formData.get('stockCount')

  const stockCount: number | null =
    stockCountRaw !== null && stockCountRaw !== '' ? Number(stockCountRaw) : null

  // Verify ownership
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!business) throw new Error('Business not found or not owned by user')

  const { error } = await (supabase as any)
    .from('menu_items')
    .update({
      is_available:    isAvailable,
      track_stock:     trackStock,
      available_from:  availableFrom  || null,
      available_until: availableUntil || null,
      stock_count:     trackStock ? stockCount : null,
    })
    .eq('id', itemId)
    .eq('business_id', businessId)

  if (error) throw new Error(error.message)

  revalidatePath(`/en/dashboard/businesses/${businessId}`)
  revalidatePath(`/ja/dashboard/businesses/${businessId}`)
}
