'use client'

import { useState } from 'react'
import type { CartItem } from '@/app/api/orders/route'
import { formatAmount } from '@/lib/currency'
import BillSplitter from './BillSplitter'

interface Props {
  cartItems: CartItem[]
  tableName: string | null
  businessId: string
  tableToken: string | null
  onUpdateQty: (menuItemId: string, delta: number) => void
  onUpdateNote: (menuItemId: string, note: string) => void
  onClear: () => void
  onOrderPlaced: (orderId: string, tableName: string | null) => void
  isStaffMode?: boolean
  restaurantCurrency?: string
  tipEnabled?: boolean
  tipPresets?: number[]
}

export default function CartDrawer({
  cartItems, tableName, businessId, tableToken,
  onUpdateQty, onUpdateNote, onClear, onOrderPlaced,
  isStaffMode = false,
  restaurantCurrency = 'JPY',
  tipEnabled = false,
  tipPresets = [10, 15, 20],
}: Props) {
  const [open, setOpen] = useState(false)
  const [orderNote, setOrderNote] = useState('')
  const [waiterName, setWaiterName] = useState('')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  // Tipping
  const [selectedTipPct, setSelectedTipPct] = useState<number | null>(null)
  const [customTipPct, setCustomTipPct] = useState('')
  const [showCustomTip, setShowCustomTip] = useState(false)
  const [showSplit, setShowSplit] = useState(false)

  const subtotal = cartItems.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0)
  const tipPct = showCustomTip ? (Number(customTipPct) || 0) : (selectedTipPct ?? 0)
  const tipAmount = subtotal * tipPct / 100
  const total = subtotal + tipAmount
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
          tipAmount: tipAmount > 0 ? tipAmount : undefined,
          placed_by: isStaffMode ? 'staff' : 'customer',
          waiter_name: isStaffMode && waiterName.trim() ? waiterName.trim() : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to place order')
      onClear()
      setOpen(false)
      setOrderNote('')
      setWaiterName('')
      setSelectedTipPct(null)
      setCustomTipPct('')
      setShowSplit(false)
      onOrderPlaced(data.orderId, data.tableName)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
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
        {total > 0 && (
          <span className="text-teal-200 font-semibold">{formatAmount(total, restaurantCurrency)}</span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-up drawer */}
      <div className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col transition-transform duration-300 ${open ? 'translate-y-0' : 'translate-y-full'}`}>
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
            {isStaffMode && (
              <p className="text-xs text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                👔 Staff Mode
              </p>
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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {/* Items */}
          {cartItems.map(item => (
            <div key={item.menuItemId}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                  {item.price != null && (
                    <p className="text-xs text-teal-600 font-semibold mt-0.5">
                      {formatAmount(item.price * item.quantity, restaurantCurrency)}
                      {item.quantity > 1 && (
                        <span className="text-gray-400 font-normal"> ({formatAmount(item.price, restaurantCurrency)} × {item.quantity})</span>
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

          {/* Waiter name — staff mode only */}
          {isStaffMode && (
            <div className="border-t border-teal-100 pt-3">
              <label className="text-sm font-medium text-teal-700 block mb-1">👔 Your name (optional)</label>
              <input
                type="text"
                placeholder="e.g. Maria"
                value={waiterName}
                onChange={e => setWaiterName(e.target.value)}
                className="w-full text-sm border border-teal-200 bg-teal-50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
            </div>
          )}

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

          {/* Tip section */}
          {tipEnabled && subtotal > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Tip</p>
              <div className="flex gap-2 flex-wrap">
                {tipPresets.map(pct => (
                  <button
                    key={pct}
                    onClick={() => { setSelectedTipPct(pct === selectedTipPct ? null : pct); setShowCustomTip(false) }}
                    className={`text-sm px-3 py-1.5 rounded-xl font-medium transition-colors ${
                      !showCustomTip && selectedTipPct === pct
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
                <button
                  onClick={() => { setShowCustomTip(v => !v); setSelectedTipPct(null) }}
                  className={`text-sm px-3 py-1.5 rounded-xl font-medium transition-colors ${
                    showCustomTip ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Custom
                </button>
              </div>
              {showCustomTip && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    min="0" max="100"
                    value={customTipPct}
                    onChange={e => setCustomTipPct(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-20 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  />
                  <span className="text-sm text-gray-500">%</span>
                  {Number(customTipPct) > 0 && (
                    <span className="text-sm text-teal-600 font-semibold">
                      = {formatAmount(tipAmount, restaurantCurrency)}
                    </span>
                  )}
                </div>
              )}
              {tipAmount > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Tip: {formatAmount(tipAmount, restaurantCurrency)} ({tipPct}%)
                </p>
              )}
            </div>
          )}

          {/* Bill splitter */}
          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={() => setShowSplit(v => !v)}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors"
            >
              <span>⚖️ Split the bill</span>
              <svg className={`w-4 h-4 transition-transform ${showSplit ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showSplit && (
              <div className="mt-3">
                <BillSplitter
                  cartItems={cartItems}
                  restaurantCurrency={restaurantCurrency}
                  tipAmount={tipAmount}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-3">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center">{error}</p>
          )}

          {/* Totals */}
          <div className="space-y-1">
            {tipAmount > 0 && (
              <>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatAmount(subtotal, restaurantCurrency)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tip ({tipPct}%)</span>
                  <span>{formatAmount(tipAmount, restaurantCurrency)}</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between text-sm font-bold text-gray-900">
              <span>Total ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
              <span className="text-teal-600 text-lg">{total > 0 ? formatAmount(total, restaurantCurrency) : '—'}</span>
            </div>
          </div>

          <button
            onClick={placeOrder}
            disabled={placing}
            className="w-full bg-teal-600 text-white font-bold py-4 rounded-2xl hover:bg-teal-700 disabled:opacity-50 transition-colors text-base"
          >
            {placing ? '⏳ Placing order…' : isStaffMode ? '👔 Place Staff Order' : '🛎️ Place Order'}
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
