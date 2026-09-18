import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getImageUrl } from '@/lib/utils'
import QRDisplay from '@/components/dashboard/QRDisplay'
import AddItemButton from '@/components/dashboard/AddItemButton'
import SectionManager from '@/components/dashboard/SectionManager'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BusinessManagePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch business with sections + items
  const { data: business } = await (supabase as any)
    .from('businesses')
    .select(`
      *,
      business_types(id, name),
      menu_sections(id, name, sort_order, menu_items(id, name, price, image_path, sort_order)),
      menu_items(id, name, price, image_path, sort_order, menu_section_id)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .order('sort_order', { referencedTable: 'menu_sections' })
    .order('sort_order', { referencedTable: 'menu_items' })
    .single()

  if (!business) notFound()

  const unsectionedItems = (business.menu_items || []).filter((i: any) => !i.menu_section_id)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://optio-menu.ai'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          {business.logo_path && (
            <img
              src={getImageUrl(business.logo_path, { width: 80 })}
              alt={business.name}
              className="w-9 h-9 rounded-full object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-gray-900 truncate">{business.name}</h1>
            <p className="text-xs text-gray-400">/menu/{business.slug}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/menu/${business.slug}`}
              target="_blank"
              className="text-sm text-gray-500 hover:text-indigo-600 border border-gray-200 px-3 py-1.5 rounded-lg"
            >
              Preview ↗
            </a>
            <Link
              href={`/dashboard/businesses/${id}/edit`}
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg"
            >
              Edit
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Menu ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Menu Items</h2>
            <div className="flex gap-2">
              <SectionManager businessId={id} sections={business.menu_sections || []} />
              <AddItemButton businessId={id} />
            </div>
          </div>

          {/* Sections */}
          {(business.menu_sections || []).map((section: any) => (
            <div key={section.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="font-semibold text-gray-700 text-sm">{section.name?.en || 'Section'}</h3>
                <div className="flex gap-3">
                  <Link href={`/dashboard/sections/${section.id}/edit`}
                    className="text-xs text-gray-400 hover:text-gray-700">Edit</Link>
                  <form action={`/api/sections/${section.id}/delete`} method="POST">
                    <button className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  </form>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {(section.menu_items || []).length === 0 ? (
                  <p className="px-4 py-3 text-xs text-gray-400 italic">No items yet</p>
                ) : (
                  (section.menu_items as any[])
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map(item => <ItemRow key={item.id} item={item} businessId={id} />)
                )}
              </div>
            </div>
          ))}

          {/* Unsectioned */}
          {unsectionedItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="font-semibold text-gray-700 text-sm">
                  {business.menu_sections?.length > 0 ? 'Other Items' : 'Menu Items'}
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {unsectionedItems
                  .sort((a: any, b: any) => a.sort_order - b.sort_order)
                  .map((item: any) => <ItemRow key={item.id} item={item} businessId={id} />)}
              </div>
            </div>
          )}

          {business.menu_sections?.length === 0 && unsectionedItems.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-3xl mb-2">🍕</p>
              <p className="text-sm text-gray-500 mb-3">Add your first menu item</p>
              <AddItemButton businessId={id} primary />
            </div>
          )}
        </div>

        {/* ── RIGHT: QR + Info ────────────────────────── */}
        <div className="space-y-4">
          <QRDisplay slug={business.slug} appUrl={appUrl} />

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-sm space-y-2">
            <h3 className="font-semibold text-gray-700 mb-2">Details</h3>
            <div className="flex justify-between text-gray-600">
              <span className="text-gray-400">Status</span>
              <span className={business.is_active ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                {business.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {business.address && (
              <div className="flex justify-between text-gray-600">
                <span className="text-gray-400">Address</span>
                <span className="text-right text-xs max-w-[60%]">{business.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ItemRow({ item, businessId }: { item: any; businessId: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
      <div className="w-11 h-11 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        {item.image_path ? (
          <img
            src={getImageUrl(item.image_path, { width: 88 })}
            alt={item.name?.en || ''}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">🍽️</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name?.en || 'Untitled'}</p>
        {item.price != null && (
          <p className="text-xs text-indigo-600 font-semibold">{Number(item.price).toFixed(2)}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link href={`/dashboard/items/${item.id}/edit`}
          className="text-xs text-gray-500 hover:text-indigo-600 font-medium">Edit</Link>
        <form action={`/api/items/${item.id}/delete`} method="POST">
          <button className="text-xs text-red-400 hover:text-red-600 font-medium">Delete</button>
        </form>
      </div>
    </div>
  )
}
