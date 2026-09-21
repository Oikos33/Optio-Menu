import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import BookingForm from '@/components/reservations/BookingForm'

export default async function ReservePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const supabase = await createClient()
  const { data: business } = await (supabase as any)
    .from('businesses')
    .select('id, name, description, logo_path, address, currency')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  if (!business) notFound()
  return (
    <div className="min-h-screen bg-gray-50">
      <BookingForm business={business} locale={locale} slug={slug} />
    </div>
  )
}
