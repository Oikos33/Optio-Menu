import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginClient from './LoginClient'

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string; redirectTo?: string }>
}) {
  const { locale } = await params
  const { error, redirectTo } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If already logged in, go to redirectTo or dashboard
  if (user) redirect(redirectTo ?? `/${locale}/dashboard`)

  return <LoginClient error={error} redirectTo={redirectTo} locale={locale} />
}
