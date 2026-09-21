import { createClient } from '@/lib/supabase/server'

/**
 * Verifies the current user is a platform admin.
 * Throws 'unauthenticated' or 'not_admin' — callers should catch and call notFound().
 * Returns the user's ID on success.
 */
export async function requireAdmin(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthenticated')
  const { data } = await (supabase as any)
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!data) throw new Error('not_admin')
  return user.id
}
