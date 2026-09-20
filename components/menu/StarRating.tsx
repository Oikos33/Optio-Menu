'use client'

interface Props {
  rating: number | null
  count?: number
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
}

const SIZE_CLASS: Record<NonNullable<Props['size']>, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

/**
 * Renders a row of 5 stars (filled / half / empty) for a given numeric rating.
 * Half stars overlay a clipped amber star over a gray base star.
 */
export default function StarRating({
  rating,
  count,
  size = 'md',
  showCount = false,
}: Props) {
  const sizeClass = SIZE_CLASS[size]

  if (rating === null) {
    return (
      <span className={`${sizeClass} text-gray-400 italic`}>No reviews yet</span>
    )
  }

  const stars = Array.from({ length: 5 }, (_, i) => {
    const starValue = i + 1
    if (rating >= starValue) return 'full'
    if (rating >= starValue - 0.5) return 'half'
    return 'empty'
  }) as Array<'full' | 'half' | 'empty'>

  return (
    <span className={`inline-flex items-center gap-0.5 ${sizeClass}`}>
      {stars.map((type, i) => (
        <StarGlyph key={i} type={type} />
      ))}
      <span className="ml-0.5 font-semibold text-gray-700">{rating.toFixed(1)}</span>
      {showCount && count !== undefined && (
        <span className="text-gray-400 ml-0.5">({count})</span>
      )}
    </span>
  )
}

function StarGlyph({ type }: { type: 'full' | 'half' | 'empty' }) {
  if (type === 'full') {
    return <span className="text-amber-400 leading-none">★</span>
  }
  if (type === 'empty') {
    return <span className="text-gray-200 leading-none">★</span>
  }
  // Half star: overlay filled star clipped to left 50% over an empty base
  return (
    <span className="relative inline-block leading-none">
      <span className="text-gray-200">★</span>
      <span
        className="absolute inset-0 text-amber-400 overflow-hidden"
        style={{ width: '50%' }}
      >
        ★
      </span>
    </span>
  )
}
