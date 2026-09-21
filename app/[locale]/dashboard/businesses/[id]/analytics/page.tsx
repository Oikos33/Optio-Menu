import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard'

export default async function AnalyticsPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)
  const { data: business } = await (supabase as any)
    .from('businesses')
    .select('id, name, slug, currency')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!business) notFound()
  return <AnalyticsDashboard business={business} locale={locale} />
}
