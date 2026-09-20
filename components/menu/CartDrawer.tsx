'use client'

import { useState } from 'react'
import type { CartItem } from '@/app/api/orders/route'

interface Props {
  cartItems: CartItem[]
  tableName: string | null
  businessId: string
  tableToken: string | null
  onUpdateQty: (menuItemId: string, delta: number) => void
  onUpdateNote: (menuItemId: string, note: string) => void
  onClear: () => void
  onOrderPlaced: (orderId: string, tableName: string | null) => void
}

export default function CartDrawer({
  cartItems, tableName, businessId, tableToken,
  onUpdateQty, onUpdateNote, onClear, onOrderPlaced,
}: Props) {
  const [open, setOpen] = useState(false)
  const [orderNote, setOrderNote] = useState('')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  const total = cartItems.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0)
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)

  const placeOrder = async () => {
    setPlacing(true)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          tableToken: tableToken || undefined,
          items: cartItems,
          notes: orderNote.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to place order')
      onClear()
      setOpen(false)
      setOrderNote('')
      onOrderPlaced(data.orderId, data.tableName)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPlacing(false)
    }
  }

  if (cartItems.length === 0) return null

  return (
    <>
      {/* Floating cart button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-teal-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl hover:bg-teal-700 active:scale-95 transition-all flex items-center gap-3"
      >
        <span className="bg-white text-teal-600 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
          {itemCount}
        </span>
        <span>View Cart</span>
        <span className="text-teal-200 font-semibold">
          {total > 0 ? `¥${total.toFixed(0)}` : ''}
        </span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-up drawer */}
      <div className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col transition-transform duration-300 ${open ? 'translate-y-0' : 'translate-y-full'}`}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Your Cart</h2>
            {tableName && (
              <p className="text-sm text-teal-600 font-medium">🪑 {tableName}</p>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {cartItems.map(item => (
            <div key={item.menuItemId}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                  {item.price != null && (
                    <p className="text-xs text-teal-600 font-semibold mt-0.5">
                      ¥{(item.price * item.quantity).toFixed(0)}
                      {item.quantity > 1 && (
                        <span className="text-gray-400 font-normal"> (¥{item.price.toFixed(0)} × {item.quantity})</span>
                      )}
                    </p>
                  )}
                </div>
                {/* Qty stepper */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onUpdateQty(item.menuItemId, -1)}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm"
                  >−</button>
                  <span className="w-4 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQty(item.menuItemId, 1)}
                    className="w-7 h-7 rounded-full bg-teal-100 hover:bg-teal-200 flex items-center justify-center text-teal-700 font-bold text-sm"
                  >+</button>
                </div>
              </div>
              {/* Per-item note */}
              <input
                type="text"
                placeholder="Special request (e.g. no onions)"
                value={item.notes ?? ''}
                onChange={e => onUpdateNote(item.menuItemId, e.target.value)}
                className="mt-1.5 w-full text-xs border border-gray-100 rounded-lg px-2.5 py-1.5 text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-teal-200 bg-gray-50"
              />
            </div>
          ))}

          {/* Order note */}
          <div className="border-t border-gray-100 pt-3">
            <label className="text-sm font-medium text-gray-700 block mb-1">Order note</label>
            <textarea
              rows={2}
              placeholder="Any allergies or instructions for the whole order…"
              value={orderNote}
              onChange={e => setOrderNote(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-3">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center">{error}</p>
          )}
          <div className="flex items-center justify-between text-sm font-bold text-gray-900">
            <span>Total ({itemCount} items)</span>
            <span className="text-teal-600 text-lg">{total > 0 ? `¥${total.toFixed(0)}` : '—'}</span>
          </div>
          <button
            onClick={placeOrder}
            disabled={placing}
            className="w-full bg-teal-600 text-white font-bold py-4 rounded-2xl hover:bg-teal-700 disabled:opacity-50 transition-colors text-base"
          >
            {placing ? '⏳ Placing order…' : '🛎️ Place Order'}
          </button>
          <button
            onClick={onClear}
            className="w-full text-xs text-gray-400 hover:text-red-400 transition-colors py-1"
          >
            Clear cart
          </button>
        </div>
      </div>
    </>
  )
}
