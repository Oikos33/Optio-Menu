import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'

// POST /api/orders/[id]/cancel
// Anyone with the orderId can cancel if still pending (orderId is secret enough)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createPublicClient()

  // Check current status
  const { data: order } = await (supabase as any)
    .from('orders')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.status !== 'pending') {
    return NextResponse.json(
      { error: 'Cannot cancel — order is already being prepared' },
      { status: 409 }
    )
  }

  const { error } = await (supabase as any)
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('status', 'pending') // extra safety check

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
