import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/orders/[id] — update order or item status (restaurant owners only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify the order belongs to one of the user's businesses
  const { data: order } = await (supabase as any)
    .from('orders')
    .select('id, business_id')
    .eq('id', id)
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const { data: biz } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', order.business_id)
    .eq('user_id', user.id)
    .single()

  if (!biz) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { status, itemId, itemStatus } = body

  const validOrderStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'paid', 'cancelled']
  const validItemStatuses = ['pending', 'preparing', 'ready', 'served']

  // Update a single item's status
  if (itemId && itemStatus) {
    if (!validItemStatuses.includes(itemStatus)) {
      return NextResponse.json({ error: 'Invalid item status' }, { status: 400 })
    }
    const { error } = await (supabase as any)
      .from('order_items')
      .update({ status: itemStatus })
      .eq('id', itemId)
      .eq('order_id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Update order status
  if (status) {
    if (!validOrderStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    const { error } = await (supabase as any)
      .from('orders')
      .update({ status })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
}
