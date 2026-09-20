'use client'

import { useState, useEffect } from 'react'

type OrderItem = {
  id: string
  name: string
  quantity: number
  price: number | null
  notes: string | null
}

type TableOrder = {
  id: string
  status: string
  created_at: string
  notes: string | null
  order_items: OrderItem[]
}

interface Props {
  tableToken: string | null
  businessSlug: string
}

export default function TableSessionBanner({ tableToken, businessSlug }: Props) {
  const [orders, setOrders] = useState<TableOrder[]>([])
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tableToken) { setLoading(false); return }
    fetch(`/api/table-orders?token=${encodeURIComponent(tableToken)}&businessSlug=${encodeURIComponent(businessSlug)}`)
      .then(r => r.json())
      .then(data => {
        setOrders(data.tableOrders ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tableToken, businessSlug])

  if (!tableToken || loading || orders.length === 0) return null

  const totalItems = orders.reduce(
    (sum, o) => sum + o.order_items.reduce((s, i) => s + i.quantity, 0),
    0
  )

  const STATUS_LABEL: Record<string, string> = {
    pending:   '⏳ Pending',
    confirmed: '✅ Confirmed',
    preparing: '👨‍🍳 Preparing',
    ready:     '🛎️ Ready',
    delivered: '📦 Delivered',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-3">
      <div className="bg-teal-50 border border-teal-200 rounded-xl overflow-hidden">
        {/* Collapsed header */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-teal-100 transition-colors"
        >
          <span className="text-xl flex-shrink-0">🪑</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-teal-800">
              Table already has orders
            </p>
            <p className="text-xs text-teal-600">
              {orders.length} order{orders.length !== 1 ? 's' : ''} · {totalItems} item{totalItems !== 1 ? 's' : ''}
            </p>
          </div>
          <svg
            className={`w-4 h-4 text-teal-600 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="border-t border-teal-200 px-4 py-3 space-y-4">
            {orders.map(order => (
              <div key={order.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono text-teal-700 font-semibold">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="text-xs text-teal-600">
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>
                <div className="space-y-1">
                  {order.order_items.map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm text-teal-900">
                      <span className="w-5 h-5 bg-teal-200 text-teal-800 rounded text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {item.quantity}
                      </span>
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.notes && (
                        <span className="text-xs text-amber-600 truncate max-w-[100px]">
                          {item.notes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {order.notes && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1">
                    📝 {order.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
