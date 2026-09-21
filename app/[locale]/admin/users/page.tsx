import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/is-admin'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminUsersTable from '@/components/admin/AdminUsersTable'
import type { Business } from '@/types/database'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function AdminUsersPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  try {
    await requireAdmin()
  } catch {
    notFound()
  }

  const supabase = await createClient()

  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name, slug, is_active, created_at, user_id')
    .order('created_at', { ascending: false })

  return (
    <AdminLayout activeTab="users" locale={locale}>
      <AdminUsersTable businesses={(businesses as Business[]) ?? []} />
    </AdminLayout>
  )
}
