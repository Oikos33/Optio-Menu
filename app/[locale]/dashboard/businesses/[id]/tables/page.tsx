import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import TableCard from '@/components/dashboard/TableCard'
import AddTableForm from '@/components/dashboard/AddTableForm'

interface Props {
  params: Promise<{ locale: string; id: string }>
}

export default async function TablesPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('TableManagement')

  // Verify ownership + get slug
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, slug')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single() as { data: { id: string; name: string; slug: string } | null; error: unknown }

  if (!business) notFound()

  // Fetch all tables for this business
  const { data: tables } = await (supabase as any)
    .from('tables')
    .select('*')
    .eq('business_id', id)
    .order('created_at', { ascending: true })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://optio-menu.ai'

  type TableRow = {
    id: string; business_id: string; name: string; token: string
    capacity: number | null; section: string | null
    status: string; is_active: boolean; created_at: string
  }

  const tableList: TableRow[] = tables ?? []

  // Group by section (empty string = no section)
  const sectionNames = [...new Set(tableList.map(t => t.section ?? ''))].sort() as string[]
  const grouped: Record<string, TableRow[]> = {}
  for (const s of sectionNames) {
    grouped[s] = tableList.filter(t => (t.section ?? '') === s)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/dashboard/businesses/${id}`} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate">{business.name}</h1>
            <p className="text-xs text-gray-400">{t('tableManagement')}</p>
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-0 -mb-px">
          <Link
            href={`/dashboard/businesses/${id}`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 border-b-2 border-transparent hover:border-gray-300 transition-colors"
          >
            {t('tabMenu')}
          </Link>
          <span className="text-sm font-semibold text-teal-600 px-4 py-2 border-b-2 border-teal-600">
            {t('tabTables')}
          </span>
          <Link
            href={`/dashboard/businesses/${id}/orders`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 border-b-2 border-transparent hover:border-gray-300 transition-colors"
          >
            {t('tabOrders')}
          </Link>
          <Link
            href={`/dashboard/businesses/${id}/kds`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 border-b-2 border-transparent hover:border-gray-300 transition-colors"
          >
            🍳 KDS
          </Link>
          <Link
            href={`/dashboard/businesses/${id}/combos`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 border-b-2 border-transparent hover:border-gray-300 transition-colors whitespace-nowrap"
          >
            🎁 Deals
          </Link>
          <Link
            href={`/dashboard/businesses/${id}/settings`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 border-b-2 border-transparent hover:border-gray-300 transition-colors whitespace-nowrap"
          >
            ⚙️ Settings
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats bar */}
        {tableList.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { key: 'available', label: t('status.available'), emoji: '🟢', count: tableList.filter((t: any) => t.status === 'available').length },
              { key: 'occupied', label: t('status.occupied'), emoji: '🔴', count: tableList.filter((t: any) => t.status === 'occupied').length },
              { key: 'reserved', label: t('status.reserved'), emoji: '🟡', count: tableList.filter((t: any) => t.status === 'reserved').length },
              { key: 'needs_cleaning', label: t('status.needs_cleaning'), emoji: '🧹', count: tableList.filter((t: any) => t.status === 'needs_cleaning').length },
            ].map(stat => (
              <div key={stat.key} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.emoji} {stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add table */}
        <div className="mb-6">
          <AddTableForm businessId={id} />
        </div>

        {/* Empty state */}
        {tableList.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-5xl mb-4">🪑</p>
            <h2 className="font-semibold text-gray-700 mb-1">{t('empty.heading')}</h2>
            <p className="text-sm text-gray-500 mb-2">{t('empty.subtitle')}</p>
          </div>
        )}

        {/* Tables grouped by section */}
        {sectionNames.map(sectionName => (
          <div key={sectionName} className="mb-8">
            {sectionName && (
              <h2 className="font-semibold text-gray-500 text-sm uppercase tracking-wider mb-3 px-1">
                {sectionName}
              </h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped[sectionName].map(table => (
                <TableCard
                  key={table.id}
                  table={table}
                  appUrl={appUrl}
                  slug={business.slug}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Print all QR codes hint */}
        {tableList.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-8">
            💡 {t('printHint')}
          </p>
        )}
      </main>
    </div>
  )
}
