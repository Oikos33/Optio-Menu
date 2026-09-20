'use client'

import { useState, useEffect } from 'react'
import StarRating from './StarRating'
import DishReviewForm from './DishReviewForm'

interface Props {
  menuItemId: string
  businessId: string
  itemName: string
  initialRating?: number | null
  initialCount?: number
}

interface ReviewStats {
  avgRating: number | null
  count: number
}

export default function DishRatingRow({
  menuItemId,
  businessId,
  itemName,
  initialRating,
  initialCount,
}: Props) {
  const [stats, setStats] = useState<ReviewStats>({
    avgRating: initialRating ?? null,
    count: initialCount ?? 0,
  })
  const [fetched, setFetched] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (fetched) return
    setFetched(true)

    fetch(`/api/reviews?menuItemId=${menuItemId}`)
      .then(r => r.json())
      .then((data: { avgRating: number | null; count: number }) => {
        setStats({ avgRating: data.avgRating, count: data.count })
      })
      .catch(() => { /* silently fail — rating just won't show */ })
  }, [menuItemId, fetched])

  // Don't show anything if no reviews yet (avoid clutter)
  const showRating = stats.count > 0

  return (
    <>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        {showRating && (
          <StarRating
            rating={stats.avgRating}
            count={stats.count}
            size="sm"
            showCount
          />
        )}
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="text-xs text-teal-500 hover:text-teal-700 hover:underline transition-colors leading-none"
        >
          Write a review
        </button>
      </div>

      {showForm && (
        <DishReviewForm
          menuItemId={menuItemId}
          businessId={businessId}
          itemName={itemName}
          onSubmitted={() => {
            // Refetch stats after submission
            setFetched(false)
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  )
}
