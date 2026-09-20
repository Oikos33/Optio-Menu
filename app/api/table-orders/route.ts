import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'

// GET /api/table-orders?token={tableToken}&businessSlug={slug}
// Returns all non-cancelled, non-paid orders for this table in the last 4 hours

export async function GET(req: NextRequest) {
  const supabase = createPublicClient()
  const { searchParams } = req.nextUrl

  const token       = searchParams.get('token')
  const businessSlug = searchParams.get('businessSlug')

  if (!token || !businessSlug) {
    return NextResponse.json({ error: 'Missing token or businessSlug' }, { status: 400 })
  }

  // Resolve table by token
  const { data: table } = await (supabase as any)
    .from('tables')
    .select('id, name, business_id')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (!table) {
    return NextResponse.json({ tableOrders: [] })
  }

  // Verify business slug matches
  const { data: business } = await (supabase as any)
    .from('businesses')
    .select('id')
    .eq('id', table.business_id)
    .eq('slug', businessSlug)
    .single()

  if (!business) {
    return NextResponse.json({ tableOrders: [] })
  }

  // 4 hours ago
  const since = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()

  const { data: tableOrders } = await (supabase as any)
    .from('orders')
    .select('*, order_items(*)')
    .eq('table_id', table.id)
    .not('status', 'in', '("paid","cancelled")')
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  return NextResponse.json({ tableOrders: tableOrders ?? [] })
}
