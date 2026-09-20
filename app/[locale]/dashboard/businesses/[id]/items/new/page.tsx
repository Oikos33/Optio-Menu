import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AddItemForm from './AddItemForm'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function NewItemPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('AddItemForm')

  // Verify ownership
  const { data: business } = await (supabase as any)
    .from('businesses')
    .select('id, name, slug')
    .eq('id', id)
    .eq('user_id', user.id)
    .single() as { data: { id: string; name: string; slug: string } | null }

  if (!business) notFound()

  const { data: sections } = await supabase
    .from('menu_sections')
    .select('id, name')
    .eq('business_id', id)
    .order('sort_order')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href={`/dashboard/businesses/${id}`} className="text-sm text-teal-600 hover:underline">
          ← {business.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">{t('pageTitle')}</h1>
        <AddItemForm
          businessId={id}
          userId={user.id}
          sections={sections ?? []}
        />
      </div>
    </div>
  )
}
