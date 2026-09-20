import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'

export interface CartItem {
  menuItemId: string
  name: string
  price: number | null
  quantity: number
  notes?: string
}

export interface PlaceOrderBody {
  businessId: string
  tableToken?: string      // from ?t= in URL
  items: CartItem[]
  notes?: string           // order-level note
}

export async function POST(req: NextRequest) {
  const supabase = createPublicClient()
  const body: PlaceOrderBody = await req.json()

  const { businessId, tableToken, items, notes } = body

  if (!businessId || !items?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Resolve table from token (optional)
  let tableId: string | null = null
  let tableName: string | null = null

  if (tableToken) {
    const { data: table } = await (supabase as any)
      .from('tables')
      .select('id, name')
      .eq('token', tableToken)
      .eq('is_active', true)
      .single()
    if (table) {
      tableId = table.id
      tableName = table.name
    }
  }

  // Calculate total
  const total = items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0)

  // Insert order
  const { data: order, error: orderError } = await (supabase as any)
    .from('orders')
    .insert({
      business_id: businessId,
      table_id: tableId,
      table_name: tableName,
      notes: notes?.trim() || null,
      total: Number(total.toFixed(2)),
    })
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('Order insert error:', orderError)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  // Insert order items
  const orderItems = items.map(item => ({
    order_id: order.id,
    menu_item_id: item.menuItemId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    notes: item.notes?.trim() || null,
  }))

  const { error: itemsError } = await (supabase as any)
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('Order items insert error:', itemsError)
    // Order was created but items failed — still return the order ID
    return NextResponse.json({ orderId: order.id, tableName, warning: 'Some items may not have been recorded' })
  }

  return NextResponse.json({ orderId: order.id, tableName }, { status: 201 })
}
