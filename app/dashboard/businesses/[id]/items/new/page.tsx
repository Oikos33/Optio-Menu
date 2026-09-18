import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AddItemForm from './AddItemForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function NewItemPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
        <a href={`/dashboard/businesses/${id}`} className="text-sm text-indigo-600 hover:underline">
          ← {business.name}
        </a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">Add Menu Item</h1>
        <AddItemForm
          businessId={id}
          userId={user.id}
          sections={sections ?? []}
        />
      </div>
    </div>
  )
}
