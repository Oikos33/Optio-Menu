import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import RestaurantProfileEditor from '@/components/dashboard/RestaurantProfileEditor'
import ReservationSettingsEditor from '@/components/dashboard/ReservationSettingsEditor'

interface Props {
  params: Promise<{ locale: string; id: string }>
}

export default async function BusinessSettingsPage({ params }: Props) {
  const { locale, id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

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
    .single()

  if (!business) notFound()

  // Fetch reservation settings + blackouts
  const [{ data: resSettings }, { data: blackouts }] = await Promise.all([
    (supabase as any).from('reservation_settings').select('*').eq('business_id', id).maybeSingle(),
    (supabase as any).from('reservation_blackouts').select('date, reason').eq('business_id', id).order('date'),
  ])

  const navLinks = [
    { href: `/dashboard/businesses/${id}`, label: '🍽️ Menu' },
    { href: `/dashboard/businesses/${id}/tables`, label: '📋 Tables' },
    { href: `/dashboard/businesses/${id}/orders`, label: '📦 Orders' },
    { href: `/dashboard/businesses/${id}/reservations`, label: '📅 Reservations' },
    { href: `/dashboard/businesses/${id}/kds`, label: '🍳 KDS' },
    { href: `/dashboard/businesses/${id}/analytics`, label: '📊 Analytics' },
    { href: `/dashboard/businesses/${id}/combos`, label: '🎁 Deals' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
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

        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-0 -mb-px overflow-x-auto">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 border-b-2 border-transparent hover:border-gray-300 transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
          <span className="text-sm font-semibold text-teal-600 px-4 py-2 border-b-2 border-teal-600 whitespace-nowrap">
            ⚙️ Settings
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-10">
        {/* Restaurant profile */}
        <section>
          <h2 className="font-bold text-gray-900 text-xl mb-1">Restaurant Settings</h2>
          <p className="text-sm text-gray-400 mb-6">Configure currency, tipping, occasions, amenities and kitchen access.</p>
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
        </section>

        <hr className="border-gray-200" />

        {/* Reservation settings */}
        <section>
          <h2 className="font-bold text-gray-900 text-xl mb-1">Reservation Settings</h2>
          <p className="text-sm text-gray-400 mb-6">Set up online table booking for your customers.</p>
          <ReservationSettingsEditor
            businessId={id}
            slug={business.slug}
            initialSettings={resSettings ?? null}
            initialBlackouts={blackouts ?? []}
          />
        </section>
      </main>
    </div>
  )
}
