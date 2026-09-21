import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import ComboManager, { type ComboWithItems } from '@/components/dashboard/ComboManager'

interface Props {
  params: Promise<{ locale: string; id: string }>
}

export default async function CombosPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify ownership + get business details
  const { data: business } = await (supabase as any)
    .from('businesses')
    .select('id, name, slug, currency')
    .eq('id', id)
    .eq('user_id', user.id)
    .single() as { data: { id: string; name: string; slug: string; currency: string } | null }

  if (!business) notFound()

  // Fetch all menu items for this business (for the combo builder)
  const { data: menuItems } = await (supabase as any)
    .from('menu_items')
    .select('id, name, price')
    .eq('business_id', id)
    .order('sort_order', { ascending: true }) as {
      data: { id: string; name: any; price: number | null }[] | null
    }

  // Fetch existing combo deals with their items joined to menu_items
  const { data: combos } = await (supabase as any)
    .from('combo_deals')
    .select(`
      id, name, description, price, is_available,
      combo_deal_items (
        id, menu_item_id, quantity,
        menu_items ( id, name, price )
      )
    `)
    .eq('business_id', id)
    .order('created_at', { ascending: false }) as { data: ComboWithItems[] | null }

  const currency: string = business.currency ?? 'JPY'

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
            <p className="text-xs text-gray-400">Combo / Package Deals</p>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-0 -mb-px overflow-x-auto">
          <Link
            href={`/dashboard/businesses/${id}`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 border-b-2 border-transparent hover:border-gray-300 transition-colors whitespace-nowrap"
          >
            Menu
          </Link>
          <Link
            href={`/dashboard/businesses/${id}/tables`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 border-b-2 border-transparent hover:border-gray-300 transition-colors whitespace-nowrap"
          >
            Tables
          </Link>
          <Link
            href={`/dashboard/businesses/${id}/orders`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 border-b-2 border-transparent hover:border-gray-300 transition-colors whitespace-nowrap"
          >
            Orders
          </Link>
          <Link
            href={`/dashboard/businesses/${id}/reservations`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 border-b-2 border-transparent hover:border-gray-300 transition-colors whitespace-nowrap"
          >
            📅 Reservations
          </Link>
          <Link
            href={`/dashboard/businesses/${id}/kds`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 border-b-2 border-transparent hover:border-gray-300 transition-colors whitespace-nowrap"
          >
            🍳 KDS
          </Link>
          <span className="text-sm font-semibold text-teal-600 px-4 py-2 border-b-2 border-teal-600 whitespace-nowrap">
            🎁 Deals
          </span>
          <Link
            href={`/dashboard/businesses/${id}/settings`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 border-b-2 border-transparent hover:border-gray-300 transition-colors whitespace-nowrap"
          >
            ⚙️ Settings
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="font-bold text-gray-900 text-xl">🎁 Combo / Package Deals</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Bundle menu items into special deal sets. Customers can add all items in one tap.
          </p>
        </div>

        <ComboManager
          businessId={id}
          menuItems={menuItems ?? []}
          existingCombos={combos ?? []}
          currency={currency}
        />
      </main>
    </div>
  )
}
