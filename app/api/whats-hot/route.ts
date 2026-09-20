import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'

// GET /api/whats-hot?businessId=XXX
// Returns dishes ordered most in the last 24h — "What's Hot Tonight"
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const businessId = searchParams.get('businessId')
  if (!businessId) return NextResponse.json({ hot: [] })

  const supabase = createPublicClient()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Aggregate order_items for this business in the last 24 hours
  const { data, error } = await (supabase as any)
    .from('order_items')
    .select('name, quantity, orders!inner(business_id, created_at)')
    .eq('orders.business_id', businessId)
    .gte('orders.created_at', since)
    .not('orders.status', 'in', '("cancelled")')

  if (error || !data) return NextResponse.json({ hot: [] })

  // Aggregate counts by name
  const counts: Record<string, number> = {}
  for (const row of data) {
    counts[row.name] = (counts[row.name] ?? 0) + (row.quantity ?? 1)
  }

  const hot = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  return NextResponse.json({ hot }, {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' }
  })
}
