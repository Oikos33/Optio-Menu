import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/is-admin'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminOverview from '@/components/admin/AdminOverview'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function AdminPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  try {
    await requireAdmin()
  } catch {
    notFound()
  }

  const supabase = await createClient()

  // Today / week boundaries (UTC)
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setUTCHours(0, 0, 0, 0)
  const weekStart = new Date(now)
  weekStart.setUTCDate(now.getUTCDate() - 7)

  // Fetch all stats in parallel
  const [
    { count: totalRestaurants },
    { count: activeRestaurants },
    { count: ordersToday },
    { count: ordersThisWeek },
    { count: unreadMessages },
    { count: reservationsToday },
    { data: recentSignupsRaw },
  ] = await Promise.all([
    supabase.from('businesses').select('id', { count: 'exact', head: true }),
    (supabase as any).from('businesses').select('id', { count: 'exact', head: true }).eq('is_active', true),
    (supabase as any)
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString()),
    (supabase as any)
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString()),
    (supabase as any)
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'unread'),
    (supabase as any)
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('reservation_date', todayStart.toISOString().split('T')[0]),
    supabase
      .from('businesses')
      .select('name, slug, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const stats = {
    totalRestaurants: totalRestaurants ?? 0,
    activeRestaurants: activeRestaurants ?? 0,
    ordersToday: ordersToday ?? 0,
    ordersThisWeek: ordersThisWeek ?? 0,
    unreadMessages: unreadMessages ?? 0,
    reservationsToday: reservationsToday ?? 0,
    recentSignups: (recentSignupsRaw ?? []).map((b: { name: string; slug: string; created_at: string }) => ({
      name: b.name,
      slug: b.slug,
      createdAt: b.created_at,
    })),
  }

  return (
    <AdminLayout activeTab="overview" locale={locale}>
      <AdminOverview stats={stats} />
    </AdminLayout>
  )
}
