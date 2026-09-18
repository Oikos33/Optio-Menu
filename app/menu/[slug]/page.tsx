import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { FullBusiness } from '@/types/database'
import MenuPageClient from '@/components/menu/MenuPageClient'

// ISR: rebuild menu pages from CDN every 60 seconds
export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  // Use public (cookie-free) client — generateMetadata may also run at build time
  const supabase = createPublicClient()
  const { data: business } = await (supabase as any)
    .from('businesses')
    .select('name, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single() as { data: { name: string; description: string | null } | null }

  if (!business) return { title: 'Menu Not Found' }

  return {
    title: `${business.name} — Optio Menu`,
    description: business.description || `View the menu for ${business.name}`,
  }
}

export async function generateStaticParams() {
  // MUST use cookie-free client — no HTTP request exists at build time
  const supabase = createPublicClient()
  const { data: businesses } = await supabase
    .from('businesses')
    .select('slug')
    .eq('is_active', true)

  return (businesses || []).map(({ slug }) => ({ slug }))
}

export default async function MenuPage({ params }: Props) {
  const { slug } = await params
  // At request time, use the cookie-based server client for auth context
  const supabase = await createClient()

  // Fetch business with sections, items, and comments in one go
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: business } = await (supabase as any)
    .from('businesses')
    .select(`
      *,
      business_types ( id, name ),
      menu_sections (
        id, name, sort_order,
        menu_items (
          id, name, description, price, image_path, sort_order,
          menu_item_comments ( id, body, user_id, created_at )
        )
      ),
      menu_items (
        id, name, description, price, image_path, sort_order, menu_section_id,
        menu_item_comments ( id, body, user_id, created_at )
      )
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .order('sort_order', { referencedTable: 'menu_sections' })
    .order('sort_order', { referencedTable: 'menu_items' })
    .single()

  if (!business) notFound()

  // Separate unsectioned items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unsectionedItems = ((business as any).menu_items || []).filter(
    (item: any) => item.menu_section_id === null
  )

  const fullBusiness = {
    ...business,
    unsectioned_items: unsectionedItems,
  } as FullBusiness

  return <MenuPageClient business={fullBusiness} />
}
