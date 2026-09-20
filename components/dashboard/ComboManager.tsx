'use client'

import { useState, useTransition, useMemo } from 'react'
import { createComboDeal, deleteComboDeal, toggleComboAvailability } from '@/app/actions/combos'

// ── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string
  name: any
  price: number | null
}

interface ComboItem {
  id: string
  menu_item_id: string
  quantity: number
  menu_items: MenuItem
}

export interface ComboWithItems {
  id: string
  name: any
  description: any
  price: number | null
  is_available: boolean
  combo_deal_items: ComboItem[]
}

interface Props {
  businessId: string
  menuItems: MenuItem[]
  existingCombos: ComboWithItems[]
  currency: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getT(val: any, locale = 'en'): string {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val[locale] || val['en'] || Object.values(val)[0] || ''
}

function formatCurrency(amount: number | null, currency: string): string {
  if (amount == null) return '—'
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ComboManager({ businessId, menuItems, existingCombos, currency }: Props) {
  const [creating, setCreating] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-6">
      {/* ── Existing Combos ─── */}
      {existingCombos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-4xl mb-2">🎁</p>
          <p className="text-sm text-gray-500">No combo deals yet. Create your first deal below!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {existingCombos.map(combo => (
            <ComboRow
              key={combo.id}
              combo={combo}
              businessId={businessId}
              currency={currency}
              isPending={isPending}
              startTransition={startTransition}
            />
          ))}
        </div>
      )}

      {/* ── Create New Deal ─── */}
      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-teal-300 text-teal-600 font-semibold text-sm hover:bg-teal-50 transition-colors"
        >
          + Create New Deal
        </button>
      ) : (
        <CreateComboForm
          businessId={businessId}
          menuItems={menuItems}
          currency={currency}
          onCancel={() => setCreating(false)}
          onDone={() => setCreating(false)}
        />
      )}
    </div>
  )
}

// ── Combo Row (existing deal) ─────────────────────────────────────────────────

function ComboRow({
  combo,
  businessId,
  currency,
  isPending,
  startTransition,
}: {
  combo: ComboWithItems
  businessId: string
  currency: string
  isPending: boolean
  startTransition: (fn: () => void) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleToggle = () => {
    startTransition(async () => {
      await toggleComboAvailability(combo.id, businessId, combo.is_available)
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await deleteComboDeal(combo.id, businessId)
    })
  }

  const itemsSummary = combo.combo_deal_items
    .map(ci => `${getT(ci.menu_items?.name)} × ${ci.quantity}`)
    .join(' + ')

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">🎁 Set Deal</span>
            {!combo.is_available && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Unavailable</span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 mt-1">{getT(combo.name)}</h3>
          {combo.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{getT(combo.description)}</p>
          )}
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{itemsSummary}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          {combo.price != null && (
            <p className="font-bold text-teal-600">{formatCurrency(combo.price, currency)}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
        {/* Availability toggle */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            combo.is_available
              ? 'bg-green-50 text-green-700 hover:bg-green-100'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${combo.is_available ? 'bg-green-500' : 'bg-gray-400'}`} />
          {combo.is_available ? 'Available' : 'Unavailable'}
        </button>

        <div className="flex-1" />

        {/* Delete */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs text-red-400 hover:text-red-600 font-medium"
          >
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Sure?</span>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs text-red-600 font-semibold hover:text-red-700 disabled:opacity-50"
            >
              Yes, delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Create Combo Form ─────────────────────────────────────────────────────────

function CreateComboForm({
  businessId,
  menuItems,
  currency,
  onCancel,
  onDone,
}: {
  businessId: string
  menuItems: MenuItem[]
  currency: string
  onCancel: () => void
  onDone: () => void
}) {
  const [nameEn, setNameEn] = useState('')
  const [nameJa, setNameJa] = useState('')
  const [descEn, setDescEn] = useState('')
  const [descJa, setDescJa] = useState('')
  const [price, setPrice] = useState('')
  // Map itemId -> quantity (0 = not selected)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedItems = menuItems.filter(mi => (quantities[mi.id] ?? 0) > 0)

  // Individual items total
  const individualTotal = useMemo(() => {
    return selectedItems.reduce((sum, mi) => {
      const qty = quantities[mi.id] ?? 1
      return sum + (mi.price ?? 0) * qty
    }, 0)
  }, [selectedItems, quantities])

  const comboPrice = price ? parseFloat(price) : null
  const savings =
    comboPrice != null && individualTotal > 0 && comboPrice < individualTotal
      ? Math.round(((individualTotal - comboPrice) / individualTotal) * 100)
      : null

  const setQty = (itemId: string, delta: number) => {
    setQuantities(prev => {
      const next = (prev[itemId] ?? 0) + delta
      if (next <= 0) {
        const { [itemId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [itemId]: next }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nameEn.trim()) {
      setError('Combo name (EN) is required')
      return
    }
    if (selectedItems.length === 0) {
      setError('Please select at least one menu item')
      return
    }

    const formData = new FormData()
    formData.set('businessId', businessId)
    formData.set('nameEn', nameEn)
    formData.set('nameJa', nameJa)
    formData.set('descEn', descEn)
    formData.set('descJa', descJa)
    if (price) formData.set('price', price)

    for (const mi of selectedItems) {
      formData.append('menuItemIds', mi.id)
      formData.append('quantities', String(quantities[mi.id] ?? 1))
    }

    startTransition(async () => {
      try {
        await createComboDeal(formData)
        onDone()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4"
    >
      <h3 className="font-semibold text-gray-800">New Combo Deal</h3>

      {/* Names */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Name (EN) <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={nameEn}
            onChange={e => setNameEn(e.target.value)}
            placeholder="e.g. Ramen Set A"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Name (JA)</label>
          <input
            type="text"
            value={nameJa}
            onChange={e => setNameJa(e.target.value)}
            placeholder="e.g. ラーメンセットA"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
          />
        </div>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Description (EN)</label>
          <input
            type="text"
            value={descEn}
            onChange={e => setDescEn(e.target.value)}
            placeholder="Optional description…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Description (JA)</label>
          <input
            type="text"
            value={descJa}
            onChange={e => setDescJa(e.target.value)}
            placeholder="任意の説明…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
          />
        </div>
      </div>

      {/* Price */}
      <div className="max-w-[200px]">
        <label className="text-xs font-medium text-gray-600 block mb-1">Combo Price</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{currency}</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="0"
            className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
          />
        </div>
      </div>

      {/* Item Picker */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-2">Select Items</label>
        {menuItems.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No menu items found. Add items first.</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {menuItems.map(mi => {
              const qty = quantities[mi.id] ?? 0
              const isSelected = qty > 0
              return (
                <div
                  key={mi.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors ${
                    isSelected ? 'border-teal-200 bg-teal-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    id={`item-${mi.id}`}
                    checked={isSelected}
                    onChange={e => {
                      if (e.target.checked) {
                        setQuantities(prev => ({ ...prev, [mi.id]: 1 }))
                      } else {
                        setQuantities(prev => {
                          const { [mi.id]: _, ...rest } = prev
                          return rest
                        })
                      }
                    }}
                    className="rounded accent-teal-600"
                  />
                  <label
                    htmlFor={`item-${mi.id}`}
                    className="flex-1 text-sm text-gray-800 cursor-pointer"
                  >
                    {getT(mi.name)}
                    {mi.price != null && (
                      <span className="ml-1 text-xs text-gray-400">
                        ({formatCurrency(mi.price, currency)})
                      </span>
                    )}
                  </label>
                  {isSelected && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQty(mi.id, -1)}
                        className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-bold"
                      >−</button>
                      <span className="text-sm font-semibold text-teal-700 w-5 text-center">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(mi.id, 1)}
                        className="w-6 h-6 rounded-full bg-teal-100 hover:bg-teal-200 flex items-center justify-center text-teal-700 text-xs font-bold"
                      >+</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Preview Card */}
      {selectedItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-700 mb-1">Preview</p>
          <p className="text-sm font-semibold text-gray-800">
            {nameEn || 'Unnamed Deal'}:{' '}
            <span className="font-normal text-gray-600">
              {selectedItems.map(mi => `${getT(mi.name)} × ${quantities[mi.id] ?? 1}`).join(' + ')}
            </span>
          </p>
          <div className="flex items-center gap-3 mt-2">
            {comboPrice != null && (
              <span className="text-sm font-bold text-teal-600">
                {formatCurrency(comboPrice, currency)}
              </span>
            )}
            {individualTotal > 0 && (
              <span className="text-xs text-gray-400">
                vs {formatCurrency(individualTotal, currency)} individually
              </span>
            )}
            {savings != null && savings > 0 && (
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                Save {savings}%
              </span>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Creating…' : '🎁 Create Deal'}
        </button>
      </div>
    </form>
  )
}
