import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import KDSClient from '@/components/dashboard/KDSClient'

interface Props {
  params: Promise<{ locale: string; id: string }>
}

export default async function KDSPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify ownership + get kds_pin
  const { data: business } = await (supabase as any)
    .from('businesses')
    .select('id, name, kds_pin')
    .eq('id', id)
    .eq('user_id', user.id)
    .single() as { data: { id: string; name: string; kds_pin: string | null } | null; error: unknown }

  if (!business) notFound()

  // Initial orders — pending + preparing, oldest first
  const { data: orders } = await (supabase as any)
    .from('orders')
    .select('*, order_items(*)')
    .eq('business_id', id)
    .in('status', ['pending', 'preparing'])
    .order('created_at', { ascending: true })

  return (
    <KDSClient
      businessId={id}
      businessName={business.name}
      kdsPin={business.kds_pin}
      initialOrders={orders ?? []}
    />
  )
}
