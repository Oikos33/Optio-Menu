'use client'

import { useState } from 'react'
import { formatAmount } from '@/lib/currency'
import type { CartItem } from '@/app/api/orders/route'

interface Props {
  cartItems: CartItem[]
  restaurantCurrency: string
  tipAmount: number
}

type SplitMode = 'equal' | 'item'

export default function BillSplitter({ cartItems, restaurantCurrency, tipAmount }: Props) {
  const [mode, setMode] = useState<SplitMode>('equal')
  const [numPeople, setNumPeople] = useState(2)
  const [assignments, setAssignments] = useState<Record<string, number>>({}) // menuItemId → person index (1-based)
  const [personNames, setPersonNames] = useState<string[]>(['Person 1', 'Person 2'])
  const [sharedCard, setSharedCard] = useState<number | null>(null) // person index to show card for

  const subtotal = cartItems.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0)
  const grandTotal = subtotal + tipAmount

  // ── EQUAL SPLIT ──────────────────────────────────────────
  const perPerson = grandTotal / numPeople

  // ── ITEM-BY-ITEM SPLIT ────────────────────────────────────
  const ensureNames = (n: number) => {
    setPersonNames(prev => {
      const next = [...prev]
      while (next.length < n) next.push(`Person ${next.length + 1}`)
      return next.slice(0, n)
    })
  }

  const assignItem = (menuItemId: string, person: number) => {
    setAssignments(prev => ({ ...prev, [menuItemId]: person }))
  }

  const getPersonTotal = (personIdx: number): number => {
    const itemsForPerson = cartItems.filter(i => (assignments[i.menuItemId] ?? 1) === personIdx)
    const itemSubtotal = itemsForPerson.reduce((s, i) => s + (i.price ?? 0) * i.quantity, 0)
    // Share tip proportionally
    const tipShare = subtotal > 0 ? (itemSubtotal / subtotal) * tipAmount : tipAmount / numPeople
    return itemSubtotal + tipShare
  }

  const getPersonItems = (personIdx: number) =>
    cartItems.filter(i => (assignments[i.menuItemId] ?? 1) === personIdx)

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {(['equal', 'item'] as SplitMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
              mode === m ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            {m === 'equal' ? '⚖️ Equal Split' : '🍽️ Item by Item'}
          </button>
        ))}
      </div>

      {/* ── EQUAL MODE ─────────────────────────────────────── */}
      {mode === 'equal' && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">People:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNumPeople(n => Math.max(2, n - 1))}
                className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-sm"
              >−</button>
              <span className="w-6 text-center font-semibold text-sm">{numPeople}</span>
              <button
                onClick={() => setNumPeople(n => Math.min(20, n + 1))}
                className="w-7 h-7 rounded-full bg-teal-100 hover:bg-teal-200 flex items-center justify-center text-teal-700 font-bold text-sm"
              >+</button>
            </div>
          </div>
          <div className="bg-teal-50 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-teal-600 font-medium mb-0.5">Each person pays</p>
            <p className="text-xl font-bold text-teal-700">{formatAmount(perPerson, restaurantCurrency)}</p>
            {tipAmount > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                incl. {formatAmount(tipAmount / numPeople, restaurantCurrency)} tip
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── ITEM-BY-ITEM MODE ───────────────────────────────── */}
      {mode === 'item' && (
        <div className="space-y-3">
          {/* People count */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">People:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { const n = Math.max(2, numPeople - 1); setNumPeople(n); ensureNames(n) }}
                className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-sm"
              >−</button>
              <span className="w-6 text-center font-semibold text-sm">{numPeople}</span>
              <button
                onClick={() => { const n = Math.min(20, numPeople + 1); setNumPeople(n); ensureNames(n) }}
                className="w-7 h-7 rounded-full bg-teal-100 hover:bg-teal-200 flex items-center justify-center text-teal-700 font-bold text-sm"
              >+</button>
            </div>
          </div>

          {/* Name inputs */}
          <div className="grid grid-cols-2 gap-2">
            {personNames.map((name, idx) => (
              <input
                key={idx}
                value={name}
                onChange={e => {
                  const next = [...personNames]
                  next[idx] = e.target.value
                  setPersonNames(next)
                }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-300"
                placeholder={`Person ${idx + 1}`}
              />
            ))}
          </div>

          {/* Item assignment */}
          <div className="space-y-2">
            {cartItems.map(item => (
              <div key={item.menuItemId} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                  {item.price != null && (
                    <p className="text-xs text-gray-400">{formatAmount(item.price * item.quantity, restaurantCurrency)}</p>
                  )}
                </div>
                <select
                  value={assignments[item.menuItemId] ?? 1}
                  onChange={e => assignItem(item.menuItemId, Number(e.target.value))}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-300 flex-shrink-0"
                >
                  {personNames.map((name, idx) => (
                    <option key={idx} value={idx + 1}>{name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Per-person summary */}
          <div className="border-t border-gray-100 pt-2 space-y-1.5">
            {personNames.map((name, idx) => {
              const personIdx = idx + 1
              const total = getPersonTotal(personIdx)
              const items = getPersonItems(personIdx)
              return (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-gray-700">{name}</span>
                    <span className="text-xs text-gray-400 ml-1">
                      ({items.length} item{items.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <span className="text-xs font-bold text-teal-600">{formatAmount(total, restaurantCurrency)}</span>
                  <button
                    onClick={() => setSharedCard(sharedCard === personIdx ? null : personIdx)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-lg text-gray-600 flex-shrink-0"
                    title="Share bill summary"
                  >
                    📋
                  </button>
                </div>
              )
            })}
          </div>

          {/* Shared card view */}
          {sharedCard !== null && (
            <div className="border border-teal-200 rounded-xl p-3 bg-teal-50">
              <p className="text-xs font-bold text-teal-700 mb-2">
                🧾 {personNames[sharedCard - 1]}&apos;s Bill
              </p>
              {getPersonItems(sharedCard).length === 0 ? (
                <p className="text-xs text-gray-400 italic">No items assigned</p>
              ) : (
                getPersonItems(sharedCard).map(item => (
                  <div key={item.menuItemId} className="flex justify-between text-xs text-gray-700 py-0.5">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{item.price != null ? formatAmount(item.price * item.quantity, restaurantCurrency) : '—'}</span>
                  </div>
                ))
              )}
              {tipAmount > 0 && (
                <div className="flex justify-between text-xs text-gray-500 border-t border-teal-200 mt-1 pt-1">
                  <span>Tip share</span>
                  <span>
                    {formatAmount(
                      subtotal > 0
                        ? (getPersonItems(sharedCard).reduce((s, i) => s + (i.price ?? 0) * i.quantity, 0) / subtotal) * tipAmount
                        : tipAmount / numPeople,
                      restaurantCurrency
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold text-teal-700 border-t border-teal-200 mt-1 pt-1">
                <span>Total</span>
                <span>{formatAmount(getPersonTotal(sharedCard), restaurantCurrency)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
