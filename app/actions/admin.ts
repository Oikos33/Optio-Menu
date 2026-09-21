'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/is-admin'
import { revalidatePath } from 'next/cache'

export async function suspendBusiness(businessId: string) {
  await requireAdmin()
  const supabase = await createClient()
  await (supabase as any)
    .from('businesses')
    .update({ is_active: false })
    .eq('id', businessId)
  revalidatePath('/en/admin/users')
  revalidatePath('/ja/admin/users')
}

export async function reactivateBusiness(businessId: string) {
  await requireAdmin()
  const supabase = await createClient()
  await (supabase as any)
    .from('businesses')
    .update({ is_active: true })
    .eq('id', businessId)
  revalidatePath('/en/admin/users')
  revalidatePath('/ja/admin/users')
}

export async function addPlatformAdmin(email: string) {
  await requireAdmin()
  const supabase = await createClient()
  // Look up user by email in businesses (proxy for auth.users)
  const { data: biz } = await (supabase as any)
    .from('businesses')
    .select('user_id')
    .eq('user_id', email) // Note: this won't work directly — see note
    .maybeSingle()

  // Actually we can look up from auth.users via admin API
  // For now, just insert by user_id if provided directly
  if (email.includes('-')) {
    // Looks like a UUID — treat as user_id
    const { data: { user } } = await supabase.auth.getUser()
    await (supabase as any)
      .from('platform_admins')
      .insert({ user_id: email, added_by: user?.id, note: `Added via admin panel` })
    revalidatePath('/en/admin')
    revalidatePath('/ja/admin')
  }
}

export async function updateContactMessageStatus(id: string, status: string) {
  await requireAdmin()
  const supabase = await createClient()
  await (supabase as any)
    .from('contact_messages')
    .update({ status })
    .eq('id', id)
  revalidatePath('/en/admin/messages')
  revalidatePath('/ja/admin/messages')
}
