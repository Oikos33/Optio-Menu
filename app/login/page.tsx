import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginClient from './LoginClient'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>
}) {
  const { error, redirectTo } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return <LoginClient error={error} redirectTo={redirectTo} />
}
