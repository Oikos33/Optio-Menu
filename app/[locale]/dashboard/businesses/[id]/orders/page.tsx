import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import OrdersDashboard from '@/components/dashboard/OrdersDashboard'

interface Props {
  params: Promise<{ locale: string; id: string }>
}

export default async function OrdersPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('OrdersPage')

  // Verify ownership
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, slug')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single() as { data: { id: string; name: string; slug: string } | null; error: unknown }

  if (!business) notFound()

  // Initial load — all non-terminal orders
  const { data: orders } = await (supabase as any)
    .from('orders')
    .select('*, order_items(*)')
    .eq('business_id', id)
    .not('status', 'in', '("paid","cancelled")')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/dashboard/businesses/${id}`} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate">{business.name}</h1>
            <p className="text-xs text-gray-400">{t('ordersTitle')}</p>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 pb-0 -mb-px overflow-x-auto">
          <Link
            href={`/dashboard/businesses/${id}`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 border-b-2 border-transparent hover:border-gray-300 transition-colors whitespace-nowrap"
          >
            {t('tabMenu')}
          </Link>
          <Link
            href={`/dashboard/businesses/${id}/tables`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 border-b-2 border-transparent hover:border-gray-300 transition-colors whitespace-nowrap"
          >
            {t('tabTables')}
          </Link>
          <span className="text-sm font-semibold text-teal-600 px-4 py-2 border-b-2 border-teal-600 whitespace-nowrap">
            {t('tabOrders')}
          </span>
          <Link
            href={`/dashboard/businesses/${id}/kds`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 border-b-2 border-transparent hover:border-gray-300 transition-colors whitespace-nowrap"
          >
            🍳 KDS
          </Link>
          <Link
            href={`/dashboard/businesses/${id}/settings`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 border-b-2 border-transparent hover:border-gray-300 transition-colors whitespace-nowrap"
          >
            ⚙️ Settings
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <OrdersDashboard
          businessId={id}
          initialOrders={orders ?? []}
        />
      </main>
    </div>
  )
}
