import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import RestaurantProfileEditor from '@/components/dashboard/RestaurantProfileEditor'

interface Props {
  params: Promise<{ locale: string; id: string }>
}

interface BusinessSettings {
  id: string
  name: string
  slug: string
  currency: string
  tip_enabled: boolean
  tip_presets: number[]
  occasions: string[]
  amenities: Record<string, boolean>
  dress_code: string | null
  languages_spoken: string[]
  walk_in_ok: boolean
  kds_pin: string | null
}

export default async function BusinessSettingsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await (supabase as any)
    .from('businesses')
    .select(`
      id, name, slug,
      currency, tip_enabled, tip_presets,
      occasions, amenities, dress_code,
      languages_spoken, walk_in_ok, kds_pin
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single() as { data: BusinessSettings | null }

  if (!business) notFound()

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
            <p className="text-xs text-gray-400">/menu/{business.slug}</p>
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
          <span className="text-sm font-semibold text-teal-600 px-4 py-2 border-b-2 border-teal-600 whitespace-nowrap">
            ⚙️ Settings
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="font-bold text-gray-900 text-xl">Restaurant Settings</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Configure currency, tipping, occasions, amenities and kitchen access.
          </p>
        </div>

        <RestaurantProfileEditor
          businessId={id}
          currency={business.currency ?? 'JPY'}
          tipEnabled={business.tip_enabled ?? false}
          tipPresets={business.tip_presets ?? [10, 15, 20]}
          occasions={business.occasions ?? []}
          amenities={(business.amenities ?? {}) as Record<string, boolean>}
          dressCode={business.dress_code ?? null}
          languagesSpoken={business.languages_spoken ?? []}
          walkInOk={business.walk_in_ok ?? true}
          kdsPin={business.kds_pin ?? null}
        />
      </main>
    </div>
  )
}
