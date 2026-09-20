'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { getTranslation, getImageUrl } from '@/lib/utils'
import { formatAmount } from '@/lib/currency'
import StarRating from '@/components/menu/StarRating'
import { DISH_TAGS, TAG_COLOR_MAP } from '@/lib/dish-guides'
import type { Json } from '@/types/database'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RankedDish {
  id: string
  name: Json
  description: Json | null
  imagePath: string | null
  price: number | null
  tags: string[]
  score: number
  avgRating: number
  reviewCount: number
  verifiedCount: number
  distanceKm: number | null
  business: {
    id: string
    name: string
    slug: string
    logoPath: string | null
    latitude: number
    longitude: number
    currency: string
    address: string | null
  }
}

interface Review {
  id: string
  rating: number
  review_text: string | null
  tags: string[]
  is_verified: boolean
  photo_path: string | null
  created_at: string
}

// ── Filter Config ─────────────────────────────────────────────────────────────

const TAG_FILTERS = [
  { value: '',          label: 'All',       emoji: '🍽️' },
  { value: 'vegan',     label: 'Vegan',     emoji: '🌱' },
  { value: 'halal',     label: 'Halal',     emoji: '☪️' },
  { value: 'spicy',     label: 'Spicy',     emoji: '🌶️' },
  { value: 'signature', label: 'Signature', emoji: '⭐' },
  { value: 'popular',   label: 'Popular',   emoji: '🔥' },
  { value: 'gluten_free', label: 'GF',      emoji: '🌾' },
]

const RADIUS_OPTIONS = [
  { value: 1,    label: '1km' },
  { value: 5,    label: '5km' },
  { value: 10,   label: '10km' },
  { value: 50,   label: '50km' },
  { value: null, label: 'Global' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function rankBadge(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4 animate-pulse">
      <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  )
}

// ── Review Bottom Sheet ───────────────────────────────────────────────────────

interface ReviewSheetProps {
  dish: RankedDish
  locale: string
  onClose: () => void
}

function ReviewSheet({ dish, locale, onClose }: ReviewSheetProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/reviews?menuItemId=${dish.id}`)
      .then(r => r.json())
      .then(d => setReviews(d.reviews ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dish.id])

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  const handleSubmit = async () => {
    if (rating === 0) return
    setSubmitting(true)
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItemId: dish.id,
          businessId: dish.business.id,
          rating,
          reviewText: text.trim() || null,
          tags: [],
        }),
      })
      setSubmitted(true)
    } catch {
      // silent fail
    } finally {
      setSubmitting(false)
    }
  }

  const dishName = getTranslation(dish.name, locale) || dish.business.name

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div
        ref={sheetRef}
        className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-lg leading-tight">{dishName}</h3>
              <p className="text-sm text-gray-400 mt-0.5">{dish.business.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none flex-shrink-0 mt-0.5"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <StarRating rating={dish.avgRating} size="sm" showCount count={dish.reviewCount} />
            {dish.verifiedCount > 0 && (
              <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
                ✅ {dish.verifiedCount} verified
              </span>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Leave a Review */}
          {!submitted ? (
            <div className="bg-teal-50 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-teal-800">⭐ Leave a Review</p>
              {/* Star picker */}
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    className={`text-2xl transition-transform hover:scale-110 ${
                      s <= rating ? 'text-amber-400' : 'text-gray-200'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Share your experience (optional)…"
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
              />
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
              >
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
              <p className="text-green-700 font-semibold">🎉 Thanks for your review!</p>
              <p className="text-xs text-green-600 mt-1">Your feedback helps others discover great dishes.</p>
            </div>
          )}

          {/* Review list */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              {reviews.length > 0 ? `${reviews.length} review${reviews.length !== 1 ? 's' : ''}` : 'No reviews yet'}
            </p>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="animate-pulse space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StarRating rating={review.rating} size="sm" showCount={false} />
                      {review.is_verified && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                          ✅ Verified order
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">{timeAgo(review.created_at)}</span>
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-gray-600 leading-relaxed">{review.review_text}</p>
                    )}
                    {review.photo_path && (
                      <div className="mt-2">
                        <Image
                          src={getImageUrl(review.photo_path, { width: 200 })}
                          alt="Review photo"
                          width={80}
                          height={80}
                          className="rounded-xl object-cover"
                        />
                      </div>
                    )}
                    {review.tags && review.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {review.tags.map((tag: string) => {
                          const def = DISH_TAGS.find(t => t.value === tag)
                          if (!def) return null
                          const colorClass = TAG_COLOR_MAP[def.color] ?? 'bg-gray-100 text-gray-600'
                          return (
                            <span key={tag} className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${colorClass}`}>
                              {def.emoji} {def.label}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Dish Card ─────────────────────────────────────────────────────────────────

interface DishCardProps {
  dish: RankedDish
  rank: number
  locale: string
  onClick: () => void
}

function DishCard({ dish, rank, locale, onClick }: DishCardProps) {
  const isVerifiedBadge = dish.reviewCount > 0 && (dish.verifiedCount / dish.reviewCount) > 0.3
  const badge = rankBadge(rank)
  const isMedal = rank <= 3
  const dishName = getTranslation(dish.name, locale) || getTranslation(dish.name, 'en') || 'Unnamed dish'

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all duration-200 p-4 flex gap-4 group"
    >
      {/* Rank badge */}
      <div className="flex-shrink-0 w-8 flex items-start justify-center pt-1">
        {isMedal ? (
          <span className="text-xl leading-none">{badge}</span>
        ) : (
          <span className="text-xs font-bold text-gray-400 bg-gray-50 rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0">
            {badge}
          </span>
        )}
      </div>

      {/* Dish image */}
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 relative">
        <Image
          src={getImageUrl(dish.imagePath, { width: 160, height: 160 })}
          alt={dishName}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="80px"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 text-sm leading-tight truncate pr-1">{dishName}</h3>

        {/* Rating row */}
        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
          <StarRating rating={dish.avgRating} size="sm" showCount count={dish.reviewCount} />
          {isVerifiedBadge && (
            <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
              ✅ {dish.verifiedCount} verified
            </span>
          )}
        </div>

        {/* Restaurant + location */}
        <p className="mt-1 text-xs text-gray-500 truncate">
          🏪 {dish.business.name}
          {dish.distanceKm !== null && (
            <span className="text-teal-600 font-medium"> · 📍 {dish.distanceKm}km</span>
          )}
          {dish.distanceKm === null && dish.business.address && (
            <span className="text-gray-400"> · {dish.business.address}</span>
          )}
        </p>

        {/* Tags */}
        {dish.tags.length > 0 && (
          <div className="mt-1.5 flex gap-1 flex-wrap">
            {dish.tags.slice(0, 3).map(tag => {
              const def = DISH_TAGS.find(t => t.value === tag)
              if (!def) return null
              const colorClass = TAG_COLOR_MAP[def.color] ?? 'bg-gray-100 text-gray-600'
              return (
                <span key={tag} className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${colorClass}`}>
                  {def.emoji} {def.label}
                </span>
              )
            })}
          </div>
        )}

        {/* Price */}
        {dish.price !== null && (
          <p className="mt-1.5 text-sm font-bold text-teal-700">
            {formatAmount(dish.price, dish.business.currency)}
          </p>
        )}
      </div>

      {/* Chevron */}
      <div className="flex-shrink-0 self-center text-gray-300 group-hover:text-teal-400 transition-colors">
        ›
      </div>
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  locale: string
}

export default function RankingsClient({ locale }: Props) {
  // Filter state
  const [activeTag, setActiveTag] = useState('')
  const [search, setSearch] = useState('')
  const [geoState, setGeoState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'granted'; lat: number; lng: number }
    | { status: 'denied' }
  >({ status: 'idle' })
  const [radius, setRadius] = useState<number | null>(null)

  // Data state
  const [dishes, setDishes] = useState<RankedDish[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Bottom sheet
  const [selectedDish, setSelectedDish] = useState<RankedDish | null>(null)

  // ── Fetch rankings ──────────────────────────────────────────────────────────
  const fetchRankings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '20' })
      if (activeTag) params.set('tag', activeTag)
      if (geoState.status === 'granted') {
        params.set('lat', String(geoState.lat))
        params.set('lng', String(geoState.lng))
        if (radius !== null) params.set('radius', String(radius))
      }

      const res = await fetch(`/api/rankings?${params.toString()}`)
      const data = await res.json() as { rankings: RankedDish[]; total: number }
      setDishes(data.rankings ?? [])
      setTotalCount(data.total ?? 0)
    } catch {
      setDishes([])
    } finally {
      setLoading(false)
    }
  }, [activeTag, geoState, radius])

  useEffect(() => {
    fetchRankings()
  }, [fetchRankings])

  // ── Geo detection ───────────────────────────────────────────────────────────
  const handleNearMe = () => {
    if (geoState.status === 'granted') {
      // Already have location — just cycle through radius options
      return
    }
    setGeoState({ status: 'loading' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoState({ status: 'granted', lat: pos.coords.latitude, lng: pos.coords.longitude })
        if (radius === null) setRadius(10) // default to 10km when location first granted
      },
      () => {
        setGeoState({ status: 'denied' })
      },
      { timeout: 8000 }
    )
  }

  // ── Client-side search filter ───────────────────────────────────────────────
  const filteredDishes = search.trim()
    ? dishes.filter(d => {
        const name = getTranslation(d.name, locale) || getTranslation(d.name, 'en') || ''
        return name.toLowerCase().includes(search.toLowerCase())
      })
    : dishes

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="bg-gradient-to-br from-teal-600 to-teal-700 text-white px-4 pt-10 pb-6 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-extrabold tracking-tight">🏆 Dish Rankings</h1>
          <p className="text-teal-200 text-sm mt-1">Discover the world&apos;s best dishes</p>
          {totalCount > 0 && !loading && (
            <p className="text-teal-300 text-xs mt-1">{totalCount} ranked dish{totalCount !== 1 ? 'es' : ''} found</p>
          )}
        </div>
      </header>

      {/* ── Filter bar ───────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto">
          {/* Tag pills */}
          <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
            {TAG_FILTERS.map(tag => (
              <button
                key={tag.value}
                onClick={() => setActiveTag(tag.value)}
                className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  activeTag === tag.value
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-600'
                }`}
              >
                <span>{tag.emoji}</span>
                <span>{tag.label}</span>
              </button>
            ))}
          </div>

          {/* Geo + search row */}
          <div className="flex items-center gap-2 px-4 pb-3">
            {/* Near me button */}
            <button
              onClick={handleNearMe}
              disabled={geoState.status === 'loading'}
              className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                geoState.status === 'granted'
                  ? 'bg-teal-50 text-teal-700 border-teal-300'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-600'
              }`}
            >
              {geoState.status === 'loading' ? (
                <span className="animate-spin text-base">⏳</span>
              ) : (
                '📍'
              )}
              {geoState.status === 'granted' ? 'Near me' : 'Near me'}
            </button>

            {/* Radius options (shown after location granted) */}
            {geoState.status === 'granted' && (
              <div className="flex gap-1 overflow-x-auto no-scrollbar">
                {RADIUS_OPTIONS.map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setRadius(opt.value)}
                    className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                      radius === opt.value
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-teal-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search */}
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search dishes…"
                className="text-xs pl-7 pr-3 py-1.5 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white w-32 sm:w-44"
              />
            </div>
          </div>

          {/* Location error */}
          {geoState.status === 'denied' && (
            <p className="text-xs text-amber-600 bg-amber-50 px-4 pb-2">
              ⚠️ Could not detect location. Try expanding your radius.
            </p>
          )}
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3 pb-24">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filteredDishes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🌎</p>
            <p className="text-gray-500 font-medium">No ranked dishes found in this area yet.</p>
            <p className="text-sm text-gray-400 mt-2">Be the first to review!</p>
            {geoState.status === 'granted' && radius !== null && (
              <button
                onClick={() => setRadius(null)}
                className="mt-4 text-sm text-teal-600 font-semibold underline"
              >
                Show global rankings
              </button>
            )}
          </div>
        ) : (
          filteredDishes.map((dish, index) => (
            <DishCard
              key={dish.id}
              dish={dish}
              rank={index + 1}
              locale={locale}
              onClick={() => setSelectedDish(dish)}
            />
          ))
        )}
      </main>

      {/* ── Bottom nav hint ───────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none">
        <div className="max-w-2xl mx-auto px-4 pb-4 flex justify-center">
          <Link
            href="/login"
            className="pointer-events-auto bg-teal-600 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg hover:bg-teal-700 transition-colors"
          >
            🏪 Own a restaurant? Add yours free →
          </Link>
        </div>
      </div>

      {/* ── Review Bottom Sheet ───────────────────────────────────────────────── */}
      {selectedDish && (
        <ReviewSheet
          dish={selectedDish}
          locale={locale}
          onClose={() => setSelectedDish(null)}
        />
      )}
    </div>
  )
}
