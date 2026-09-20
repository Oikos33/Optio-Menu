'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Create a new table ──────────────────────────────────────────────────────

export async function createTable(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const businessId = formData.get('businessId') as string
  const name = (formData.get('name') as string).trim()
  const capacity = formData.get('capacity') ? Number(formData.get('capacity')) : null
  const section = (formData.get('section') as string)?.trim() || null

  if (!name) throw new Error('Table name is required')

  // Verify ownership
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!business) throw new Error('Business not found')

  const { error } = await (supabase as any)
    .from('tables')
    .insert({ business_id: businessId, name, capacity, section })

  if (error) throw new Error(error.message)

  revalidatePath(`/en/dashboard/businesses/${businessId}/tables`)
  revalidatePath(`/ja/dashboard/businesses/${businessId}/tables`)
}

// ── Update table status ─────────────────────────────────────────────────────

export async function updateTableStatus(tableId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const validStatuses = ['available', 'occupied', 'reserved', 'needs_cleaning']
  if (!validStatuses.includes(status)) throw new Error('Invalid status')

  const { error } = await (supabase as any)
    .from('tables')
    .update({ status })
    .eq('id', tableId)
    .in('business_id', supabase.from('businesses').select('id').eq('user_id', user.id))

  if (error) throw new Error(error.message)

  // Revalidate — we don't know the business ID here so revalidate broadly
  revalidatePath('/en/dashboard', 'layout')
  revalidatePath('/ja/dashboard', 'layout')
}

// ── Update table name / capacity / section ──────────────────────────────────

export async function updateTable(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const tableId = formData.get('tableId') as string
  const businessId = formData.get('businessId') as string
  const name = (formData.get('name') as string).trim()
  const capacity = formData.get('capacity') ? Number(formData.get('capacity')) : null
  const section = (formData.get('section') as string)?.trim() || null

  if (!name) throw new Error('Table name is required')

  const { error } = await (supabase as any)
    .from('tables')
    .update({ name, capacity, section })
    .eq('id', tableId)
    .in('business_id', supabase.from('businesses').select('id').eq('user_id', user.id))

  if (error) throw new Error(error.message)

  revalidatePath(`/en/dashboard/businesses/${businessId}/tables`)
  revalidatePath(`/ja/dashboard/businesses/${businessId}/tables`)
}

// ── Delete a table ──────────────────────────────────────────────────────────

export async function deleteTable(tableId: string, businessId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await (supabase as any)
    .from('tables')
    .delete()
    .eq('id', tableId)
    .in('business_id', supabase.from('businesses').select('id').eq('user_id', user.id))

  if (error) throw new Error(error.message)

  revalidatePath(`/en/dashboard/businesses/${businessId}/tables`)
  revalidatePath(`/ja/dashboard/businesses/${businessId}/tables`)
}
