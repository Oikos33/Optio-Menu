import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewBusinessForm from './NewBusinessForm'

export default async function NewBusinessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/dashboard/businesses/new')

  const { data: businessTypes } = await supabase
    .from('business_types')
    .select('id, name')
    .order('name->en')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <a href="/dashboard" className="text-sm text-teal-600 hover:underline">← My Menus</a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">Create Restaurant</h1>
        <NewBusinessForm userId={user.id} businessTypes={businessTypes ?? []} />
      </div>
    </div>
  )
}
