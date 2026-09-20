import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'

// Haversine formula — returns distance in km between two lat/lng points
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Weighted ranking score for a set of reviews
function computeScore(reviews: any[]): number {
  if (reviews.length === 0) return 0
  const now = Date.now()
  let weightedSum = 0
  let totalWeight = 0

  for (const r of reviews) {
    // Base weight
    const base = r.is_verified
      ? 1.0
      : r.photo_path
      ? 0.7
      : (r.review_text?.length ?? 0) > 10
      ? 0.5
      : 0.3

    // Recency decay: half-weight after 180 days
    const daysOld = (now - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
    const recency = Math.exp(-daysOld / 180)

    const weight = base * recency
    weightedSum += r.rating * weight
    totalWeight += weight
  }

  // Bayesian adjustment: pull toward global mean (3.5) if few reviews
  const globalMean = 3.5
  const C = 5 // minimum reviews for full confidence
  return (weightedSum + C * globalMean) / (totalWeight + C)
}

// GET /api/rankings
// Query params: tag?, lat?, lng?, radius? (km), limit? (default 20), page?
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tag = searchParams.get('tag')           // e.g. 'vegan', 'spicy'
  const lat = searchParams.get('lat') ? Number(searchParams.get('lat')) : null
  const lng = searchParams.get('lng') ? Number(searchParams.get('lng')) : null
  const radius = searchParams.get('radius') ? Number(searchParams.get('radius')) : null
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50)
  const cuisine = searchParams.get('cuisine')   // e.g. 'japanese', 'italian'

  const supabase = createPublicClient()

  // Fetch menu items with their reviews and business location
  let query = (supabase as any)
    .from('menu_items')
    .select(`
      id, name, description, image_path, price, dish_tags, available_seasons,
      businesses!inner(id, name, slug, logo_path, latitude, longitude, currency, address),
      dish_reviews(id, rating, is_verified, photo_path, review_text, created_at)
    `)
    .eq('is_available', true)
    .not('businesses.latitude', 'is', null)
    .not('businesses.longitude', 'is', null)

  // Filter by tag
  if (tag) {
    query = query.contains('dish_tags', [tag])
  }

  // Bounding box pre-filter for geo radius (degrees ≈ km / 111)
  if (lat !== null && lng !== null && radius !== null) {
    const latDelta = radius / 111
    const lngDelta = radius / (111 * Math.cos((lat * Math.PI) / 180))
    query = query
      .gte('businesses.latitude', lat - latDelta)
      .lte('businesses.latitude', lat + latDelta)
      .gte('businesses.longitude', lng - lngDelta)
      .lte('businesses.longitude', lng + lngDelta)
  }

  const { data, error } = await query.limit(500)

  if (error || !data) {
    return NextResponse.json({ rankings: [], total: 0 }, { status: 500 })
  }

  // Build ranked list
  type RankedDish = {
    id: string
    name: any
    description: any
    imagePath: string | null
    price: number | null
    tags: string[]
    score: number
    avgRating: number
    reviewCount: number
    verifiedCount: number
    distanceKm: number | null
    business: {
      id: string; name: string; slug: string; logoPath: string | null
      latitude: number; longitude: number; currency: string; address: string | null
    }
  }

  const ranked: RankedDish[] = []

  for (const item of data) {
    const reviews = item.dish_reviews ?? []
    // Only show items with at least 1 review
    if (reviews.length === 0) continue

    const biz = item.businesses
    let distanceKm: number | null = null
    if (lat !== null && lng !== null && biz.latitude && biz.longitude) {
      distanceKm = haversine(lat, lng, Number(biz.latitude), Number(biz.longitude))
      // Exact radius filter (Haversine is more accurate than bounding box)
      if (radius !== null && distanceKm > radius) continue
    }

    const score = computeScore(reviews)
    const avgRating = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
    const verifiedCount = reviews.filter((r: any) => r.is_verified).length

    ranked.push({
      id: item.id,
      name: item.name,
      description: item.description,
      imagePath: item.image_path,
      price: item.price,
      tags: item.dish_tags ?? [],
      score,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
      verifiedCount,
      distanceKm: distanceKm !== null ? Math.round(distanceKm * 10) / 10 : null,
      business: {
        id: biz.id,
        name: biz.name,
        slug: biz.slug,
        logoPath: biz.logo_path,
        latitude: biz.latitude,
        longitude: biz.longitude,
        currency: biz.currency,
        address: biz.address,
      },
    })
  }

  // Sort by weighted score descending
  ranked.sort((a, b) => b.score - a.score)

  return NextResponse.json({
    rankings: ranked.slice(0, limit),
    total: ranked.length,
  }, {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' }
  })
}
