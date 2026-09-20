import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'
import { createClient } from '@/lib/supabase/server'

// ── POST /api/reviews  — submit a dish review ─────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { menuItemId, businessId, rating, reviewText, tags, orderId, photoPath } = body

  if (!menuItemId || !businessId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid review data' }, { status: 400 })
  }

  const supabase = createPublicClient()

  // Check if this is a verified order
  let isVerified = false
  let userId: string | null = null

  try {
    const serverClient = await createClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (user) userId = user.id
  } catch { /* anon user — that's fine */ }

  if (orderId) {
    const { data: order } = await (supabase as any)
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .eq('business_id', businessId)
      .not('status', 'eq', 'cancelled')
      .single()
    isVerified = !!order
  }

  const { data, error } = await (supabase as any)
    .from('dish_reviews')
    .insert({
      menu_item_id: menuItemId,
      business_id: businessId,
      user_id: userId,
      rating: Number(rating),
      review_text: reviewText?.trim() || null,
      tags: tags ?? [],
      is_verified: isVerified,
      order_id: orderId || null,
      photo_path: photoPath || null,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reviewId: data.id }, { status: 201 })
}

// ── GET /api/reviews?menuItemId=XXX  — get reviews for a dish ─────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const menuItemId = searchParams.get('menuItemId')
  if (!menuItemId) return NextResponse.json({ reviews: [], avgRating: null, count: 0 })

  const supabase = createPublicClient()

  const { data: reviews } = await (supabase as any)
    .from('dish_reviews')
    .select('id, rating, review_text, tags, is_verified, photo_path, created_at')
    .eq('menu_item_id', menuItemId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!reviews || reviews.length === 0) {
    return NextResponse.json({ reviews: [], avgRating: null, count: 0 })
  }

  const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length

  return NextResponse.json({
    reviews,
    avgRating: Math.round(avgRating * 10) / 10,
    count: reviews.length,
  })
}
