import { setRequestLocale } from 'next-intl/server'
import RankingsClient from '@/components/rankings/RankingsClient'

export default async function RankingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <RankingsClient locale={locale} />
}
