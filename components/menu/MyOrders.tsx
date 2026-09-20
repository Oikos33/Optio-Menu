'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatAmount } from '@/lib/currency'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number | null
  notes: string | null
}

interface Order {
  id: string
  status: string
  total: number | null
  created_at: string
  table_name: string | null
  notes: string | null
  order_items: OrderItem[]
}

const STATUS_META: Record<string, { label: string; emoji: string; bg: string; text: string }> = {
  pending:   { label: 'Pending',   emoji: '⏳', bg: 'bg-yellow-50',  text: 'text-yellow-700' },
  confirmed: { label: 'Confirmed', emoji: '✅', bg: 'bg-blue-50',    text: 'text-blue-700'   },
  preparing: { label: 'Preparing', emoji: '👨‍🍳', bg: 'bg-orange-50', text: 'text-orange-700' },
  ready:     { label: 'Ready',     emoji: '🛎️', bg: 'bg-teal-50',   text: 'text-teal-700'   },
  delivered: { label: 'Delivered', emoji: '📦', bg: 'bg-green-50',   text: 'text-green-700'  },
  paid:      { label: 'Paid',      emoji: '💚', bg: 'bg-gray-50',    text: 'text-gray-500'   },
  cancelled: { label: 'Cancelled', emoji: '❌', bg: 'bg-red-50',     text: 'text-red-500'    },
}

// 2-minute cancellation window in ms
const CANCEL_WINDOW_MS = 2 * 60 * 1000

interface Props {
  orderIds: string[]
  restaurantCurrency: string
}

export default function MyOrders({ orderIds, restaurantCurrency }: Props) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [, setTick] = useState(0) // force re-render for countdown

  // Re-render every second for countdown
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Load orders + realtime subscription
  useEffect(() => {
    if (!orderIds.length) { setLoading(false); return }

    const supabase = createClient()

    const fetchOrders = async () => {
      const { data } = await (supabase as any)
        .from('orders')
        .select('*, order_items(*)')
        .in('id', orderIds)
        .order('created_at', { ascending: false })
      if (data) setOrders(data as Order[])
      setLoading(false)
    }

    fetchOrders()

    // Realtime subscription
    const channel = supabase
      .channel(`my-orders:${orderIds.join(',')}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
      }, async () => {
        await fetchOrders()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orderIds])

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    setCancelling(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) {
        alert(data.error ?? 'Could not cancel order')
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
      }
    } finally {
      setCancelling(null)
    }
  }

  const getCancelSecondsLeft = (createdAt: string) => {
    const elapsed = Date.now() - new Date(createdAt).getTime()
    return Math.max(0, Math.ceil((CANCEL_WINDOW_MS - elapsed) / 1000))
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!orders.length) return null

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-800 text-sm">Your Orders</h3>
      {orders.map(order => {
        const meta = STATUS_META[order.status] ?? STATUS_META.pending
        const shortId = order.id.slice(0, 8).toUpperCase()
        const canCancel = order.status === 'pending'
        const secondsLeft = canCancel ? getCancelSecondsLeft(order.created_at) : 0
        const withinWindow = secondsLeft > 0

        return (
          <div
            key={order.id}
            className={`rounded-2xl border border-gray-100 shadow-sm p-4 ${meta.bg}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-gray-400 font-mono">#{shortId}</span>
                {order.table_name && (
                  <span className="ml-2 text-xs text-teal-600 font-semibold">🪑 {order.table_name}</span>
                )}
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text} border`}>
                {meta.emoji} {meta.label}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-0.5 mb-3">
              {order.order_items.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 bg-white/70 text-gray-600 rounded text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {item.quantity}
                  </span>
                  <span className="text-gray-800 flex-1 truncate">{item.name}</span>
                  {item.price != null && (
                    <span className="text-gray-400 text-xs flex-shrink-0">
                      {formatAmount(item.price * item.quantity, restaurantCurrency)}
                    </span>
                  )}
                </div>
              ))}
              {order.notes && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1">📝 {order.notes}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2">
              {order.total != null && (
                <span className="text-sm font-bold text-gray-900 mr-auto">
                  {formatAmount(order.total, restaurantCurrency)}
                </span>
              )}
              {canCancel && withinWindow && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    Cancel window: {secondsLeft}s
                  </span>
                  <button
                    onClick={() => cancelOrder(order.id)}
                    disabled={cancelling === order.id}
                    className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl font-medium disabled:opacity-50 transition-colors"
                  >
                    {cancelling === order.id ? '…' : 'Cancel Order'}
                  </button>
                </div>
              )}
              {canCancel && !withinWindow && (
                <span className="text-xs text-gray-400">Cancellation window expired</span>
              )}
              {!canCancel && order.status !== 'cancelled' && (
                <span className="text-xs text-gray-400">Cannot cancel</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
