'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  menuItemId: string
  businessId: string
  itemName: string
  orderId?: string | null
  onSubmitted?: () => void
  onClose: () => void
}

const REVIEW_TAGS = [
  'Authentic',
  'Value',
  'Unique',
  'Presentation',
  'Must-Try',
  'Disappointing',
  'Good Value',
  'Overpriced',
]

type SubmitState = 'idle' | 'loading' | 'success' | 'error'

export default function DishReviewForm({
  menuItemId,
  businessId,
  itemName,
  orderId,
  onSubmitted,
  onClose,
}: Props) {
  const supabase = createClient()

  const [hoverRating, setHoverRating] = useState(0)
  const [selectedRating, setSelectedRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [reviewText, setReviewText] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const displayRating = hoverRating || selectedRating

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async () => {
    if (selectedRating === 0) {
      setErrorMsg('Please select a star rating.')
      return
    }

    setSubmitState('loading')
    setErrorMsg('')

    let photoPath: string | null = null

    // Upload photo if provided
    if (photoFile) {
      const ext = photoFile.name.split('.').pop() ?? 'jpg'
      const path = `reviews/${menuItemId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('menu-items')
        .upload(path, photoFile, { upsert: false })

      if (uploadError) {
        setSubmitState('error')
        setErrorMsg(`Photo upload failed: ${uploadError.message}`)
        return
      }
      photoPath = path
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItemId,
          businessId,
          rating: selectedRating,
          reviewText: reviewText.trim() || null,
          tags: selectedTags,
          orderId: orderId ?? null,
          photoPath,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Submission failed')
      }

      setSubmitState('success')
      onSubmitted?.()

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setSubmitState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Sheet */}
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="min-w-0">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Review</p>
            <h2 className="font-bold text-gray-900 text-sm leading-tight truncate">{itemName}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4">
          {/* Success state */}
          {submitState === 'success' ? (
            <div className="py-8 text-center">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-semibold text-gray-800">Review submitted! Thank you.</p>
              <p className="text-xs text-gray-400 mt-1">Closing shortly…</p>
            </div>
          ) : (
            <>
              {/* Verified order badge */}
              {orderId && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-sm text-green-700">
                  ✅ This will be marked as a <strong>Verified Order</strong>
                </div>
              )}

              {/* Star selector */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Your Rating
                </p>
                <div
                  className="flex gap-1"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      className={`text-4xl leading-none transition-colors ${
                        displayRating >= star ? 'text-amber-400' : 'text-gray-200'
                      }`}
                      onMouseEnter={() => setHoverRating(star)}
                      onClick={() => setSelectedRating(star)}
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                      type="button"
                    >
                      ★
                    </button>
                  ))}
                </div>
                {selectedRating > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][selectedRating]}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Tags (optional)
                </p>
                <div className="flex flex-wrap gap-2">
                  {REVIEW_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Review text */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Your Review (optional)
                </p>
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Tell others about your experience..."
                  maxLength={1000}
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200 resize-none"
                />
                <p className="text-xs text-gray-400 text-right mt-0.5">
                  {reviewText.length}/1000
                </p>
              </div>

              {/* Photo upload */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Photo (optional)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
                />
                {photoFile ? (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span>📸 {photoFile.name}</span>
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-sm text-teal-600 border border-dashed border-teal-300 rounded-xl px-4 py-2 hover:bg-teal-50 transition-colors"
                  >
                    📷 Add a photo
                  </button>
                )}
              </div>

              {/* Error */}
              {submitState === 'error' && (
                <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{errorMsg}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {submitState !== 'success' && (
          <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitState === 'loading' || selectedRating === 0}
              className="w-full bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {submitState === 'loading' ? '⏳ Submitting…' : 'Submit Review'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
