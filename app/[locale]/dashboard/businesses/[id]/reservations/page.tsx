import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import ReservationsDashboard from '@/components/dashboard/ReservationsDashboard'

export default async function ReservationsPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: business } = await (supabase as any)
    .from('businesses')
    .select('id, name, slug')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!business) redirect(`/${locale}/dashboard`)

  return <ReservationsDashboard business={business} locale={locale} />
}
