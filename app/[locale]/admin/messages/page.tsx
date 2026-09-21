import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/is-admin'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminMessagesClient from '@/components/admin/AdminMessagesClient'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function AdminMessagesPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  try {
    await requireAdmin()
  } catch {
    notFound()
  }

  const supabase = await createClient()

  const { data: messages } = await (supabase as any)
    .from('contact_messages')
    .select('id, name, email, subject, message, source, status, created_at')
    .order('created_at', { ascending: false })

  return (
    <AdminLayout activeTab="messages" locale={locale}>
      <AdminMessagesClient messages={messages ?? []} />
    </AdminLayout>
  )
}
