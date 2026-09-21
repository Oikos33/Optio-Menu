import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/analytics?businessId=X&period=30
// Returns analytics data for a restaurant (auth required, owner only)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const businessId = searchParams.get('businessId')
  const period = Math.min(Number(searchParams.get('period') ?? 30), 365)

  if (!businessId) return NextResponse.json({ error: 'Missing businessId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: biz } = await (supabase as any)
    .from('businesses')
    .select('id, name, currency')
    .eq('id', businessId)
    .eq('user_id', user.id)
    .single()
  if (!biz) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString()

  // Fetch all orders in period
  const { data: orders } = await (supabase as any)
    .from('orders')
    .select('id, status, tip_amount, created_at')
    .eq('business_id', businessId)
    .gte('created_at', since)
    .not('status', 'eq', 'cancelled')

  // Fetch all order items for those orders
  const orderIds = (orders ?? []).map((o: any) => o.id)
  let orderItems: any[] = []
  if (orderIds.length > 0) {
    const { data: items } = await (supabase as any)
      .from('order_items')
      .select('order_id, name, price, quantity, created_at')
      .in('order_id', orderIds)
    orderItems = items ?? []
  }

  // ── Revenue + orders by day ───────────────────────────────────────────────
  const dailyMap: Record<string, { date: string; revenue: number; orders: number }> = {}
  // Pre-populate all days in range
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().split('T')[0]
    dailyMap[key] = { date: key, revenue: 0, orders: 0 }
  }
  // Aggregate items revenue
  for (const item of orderItems) {
    const key = item.created_at?.split('T')[0]
    if (key && dailyMap[key]) {
      dailyMap[key].revenue += (item.price ?? 0) * (item.quantity ?? 1)
    }
  }
  // Add tips + count orders
  for (const order of orders ?? []) {
    const key = order.created_at?.split('T')[0]
    if (key && dailyMap[key]) {
      dailyMap[key].orders += 1
      dailyMap[key].revenue += order.tip_amount ?? 0
    }
  }
  const daily = Object.values(dailyMap)

  // ── Total stats ───────────────────────────────────────────────────────────
  const totalRevenue = daily.reduce((s, d) => s + d.revenue, 0)
  const totalOrders = daily.reduce((s, d) => s + d.orders, 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // ── Peak hours ────────────────────────────────────────────────────────────
  const hourMap: Record<number, number> = {}
  for (let h = 0; h < 24; h++) hourMap[h] = 0
  for (const order of orders ?? []) {
    const h = new Date(order.created_at).getHours()
    hourMap[h] = (hourMap[h] ?? 0) + 1
  }
  const peakHours = Object.entries(hourMap).map(([hour, count]) => ({
    hour: Number(hour),
    label: `${String(hour).padStart(2, '0')}:00`,
    count,
  }))

  // ── Top dishes ────────────────────────────────────────────────────────────
  const dishMap: Record<string, { name: string; qty: number; revenue: number }> = {}
  for (const item of orderItems) {
    if (!dishMap[item.name]) dishMap[item.name] = { name: item.name, qty: 0, revenue: 0 }
    dishMap[item.name].qty += item.quantity ?? 1
    dishMap[item.name].revenue += (item.price ?? 0) * (item.quantity ?? 1)
  }
  const topDishes = Object.values(dishMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10)

  // ── Reservations ─────────────────────────────────────────────────────────
  const { data: reservations } = await (supabase as any)
    .from('reservations')
    .select('status, party_size, created_at')
    .eq('business_id', businessId)
    .gte('created_at', since)

  const resStats = {
    total: (reservations ?? []).length,
    confirmed: (reservations ?? []).filter((r: any) => r.status === 'confirmed' || r.status === 'seated' || r.status === 'completed').length,
    cancelled: (reservations ?? []).filter((r: any) => r.status === 'cancelled' || r.status === 'no_show').length,
    avgPartySize: (reservations ?? []).length > 0
      ? (reservations ?? []).reduce((s: number, r: any) => s + r.party_size, 0) / (reservations ?? []).length
      : 0,
  }

  // ── Reviews ───────────────────────────────────────────────────────────────
  const { data: reviews } = await (supabase as any)
    .from('dish_reviews')
    .select('rating, is_verified, created_at')
    .eq('business_id', businessId)
    .gte('created_at', since)

  const reviewStats = {
    total: (reviews ?? []).length,
    avgRating: (reviews ?? []).length > 0
      ? (reviews ?? []).reduce((s: number, r: any) => s + r.rating, 0) / (reviews ?? []).length
      : null,
    verified: (reviews ?? []).filter((r: any) => r.is_verified).length,
  }

  return NextResponse.json({
    currency: biz.currency ?? 'JPY',
    period,
    totals: {
      revenue: Math.round(totalRevenue * 100) / 100,
      orders: totalOrders,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    },
    daily,
    peakHours,
    topDishes,
    reservations: resStats,
    reviews: reviewStats,
  }, {
    headers: { 'Cache-Control': 'private, max-age=300' }
  })
}
