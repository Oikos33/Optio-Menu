'use client'

import { useState, useEffect } from 'react'
import type { CartItem } from '@/app/api/orders/route'
import { formatAmount } from '@/lib/currency'
import { createPublicClient } from '@/lib/supabase/public'

const STORAGE_KEY_PREFIX = 'optio_orders_'
const MAX_AGE_DAYS = 7

interface StoredOrder {
  orderId: string
  items: CartItem[]
  total: number
  currency: string
  placedAt: string // ISO string
}

interface Props {
  businessId: string
  restaurantCurrency: string
  onAddToCart: (items: CartItem[]) => void
}

export function saveOrderToMemory(businessId: string, orderId: string, items: CartItem[], total: number, currency: string) {
  try {
    const key = `${STORAGE_KEY_PREFIX}${businessId}`
    const stored: StoredOrder = { orderId, items, total, currency, placedAt: new Date().toISOString() }
    localStorage.setItem(key, JSON.stringify(stored))
  } catch { /* localStorage may be unavailable in some browsers */ }
}

export default function MemoryLane({ businessId, restaurantCurrency, onAddToCart }: Props) {
  const [pastOrder, setPastOrder] = useState<StoredOrder | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [reordering, setReordering] = useState(false)

  useEffect(() => {
    try {
      const key = `${STORAGE_KEY_PREFIX}${businessId}`
      const raw = localStorage.getItem(key)
      if (!raw) return
      const order: StoredOrder = JSON.parse(raw)
      // Only show if within last 7 days
      const daysAgo = (Date.now() - new Date(order.placedAt).getTime()) / (1000 * 60 * 60 * 24)
      if (daysAgo <= MAX_AGE_DAYS && order.items?.length > 0) {
        setPastOrder(order)
      }
    } catch { /* ignore parse errors */ }
  }, [businessId])

  if (!pastOrder) return null

  const daysAgo = Math.floor((Date.now() - new Date(pastOrder.placedAt).getTime()) / (1000 * 60 * 60 * 24))
  const timeLabel = daysAgo === 0 ? 'earlier today' : daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`
  const itemCount = pastOrder.items.reduce((s, i) => s + i.quantity, 0)

  const handleReorder = () => {
    setReordering(true)
    onAddToCart(pastOrder.items.map(i => ({ ...i, notes: undefined })))
    setTimeout(() => setReordering(false), 800)
  }

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 mb-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">🕐</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-amber-800">You ordered here {timeLabel}</p>
            <p className="text-xs text-amber-600 truncate">
              {itemCount} item{itemCount !== 1 ? 's' : ''} · {formatAmount(pastOrder.total, restaurantCurrency)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-amber-600 hover:text-amber-800 font-medium"
          >
            {expanded ? 'Hide' : 'See'}
          </button>
          <button
            onClick={handleReorder}
            disabled={reordering}
            className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-60 transition-colors"
          >
            {reordering ? '✓ Added!' : '↺ Order again'}
          </button>
        </div>
      </div>

      {expanded && (
        <ul className="mt-2 space-y-1 border-t border-amber-100 pt-2">
          {pastOrder.items.map((item, i) => (
            <li key={i} className="flex justify-between text-xs text-amber-700">
              <span>{item.name} × {item.quantity}</span>
              {item.price != null && (
                <span className="text-amber-500">{formatAmount(item.price * item.quantity, restaurantCurrency)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
