import { setRequestLocale } from 'next-intl/server'
import ContactForm from '@/components/ContactForm'

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <div className="min-h-screen bg-gray-50">
      <ContactForm locale={locale} />
    </div>
  )
}
