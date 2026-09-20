'use client'

import { useState } from 'react'
import { formatAmount, detectGuestCurrency, getConversionRate } from '@/lib/currency'

interface Props {
  amount: number
  restaurantCurrency: string
  className?: string
}

export default function PriceDisplay({ amount, restaurantCurrency, className }: Props) {
  const [showConverted, setShowConverted] = useState(false)
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [guestCurrency, setGuestCurrency] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConvert = async () => {
    if (showConverted) {
      setShowConverted(false)
      return
    }
    const gc = detectGuestCurrency()
    if (gc === restaurantCurrency) {
      // Same currency — nothing to show
      return
    }
    setGuestCurrency(gc)
    setLoading(true)
    const rate = await getConversionRate(restaurantCurrency, gc)
    setLoading(false)
    if (rate !== null) {
      setConvertedAmount(amount * rate)
    }
    setShowConverted(true)
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className ?? ''}`}>
      <span className="font-bold text-teal-600">
        {formatAmount(amount, restaurantCurrency)}
      </span>
      <button
        onClick={handleConvert}
        title="Convert to your currency"
        className="text-xs text-gray-400 hover:text-teal-500 transition-colors leading-none"
        aria-label="Show converted price"
      >
        {loading ? '…' : '≈'}
      </button>
      {showConverted && convertedAmount !== null && (
        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
          ≈ {formatAmount(convertedAmount, guestCurrency)}
        </span>
      )}
    </span>
  )
}
