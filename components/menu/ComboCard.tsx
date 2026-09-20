'use client'

import type { CartItem } from '@/app/api/orders/route'

// ── Types ────────────────────────────────────────────────────────────────────

interface ComboItemPreview {
  name: any
  quantity: number
}

interface ComboData {
  id: string
  name: any
  description: any
  price: number | null
  items: ComboItemPreview[]
  // items with price info for savings calculation
  itemsWithPrice?: { name: any; quantity: number; price: number | null; menu_item_id: string }[]
}

interface Props {
  combos: ComboData[]
  locale: string
  restaurantCurrency: string
  onAddToCart: (comboItems: CartItem[]) => void
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function ComboCard({ combos, locale, restaurantCurrency, onAddToCart }: Props) {
  if (!combos || combos.length === 0) return null

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🎁</span>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Set Deals</h2>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
        {combos.map(combo => (
          <ComboCardItem
            key={combo.id}
            combo={combo}
            locale={locale}
            currency={restaurantCurrency}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  )
}

// ── Single card ───────────────────────────────────────────────────────────────

function ComboCardItem({
  combo,
  locale,
  currency,
  onAddToCart,
}: {
  combo: ComboData
  locale: string
  currency: string
  onAddToCart: (items: CartItem[]) => void
}) {
  // Calculate individual total (for savings)
  const individualTotal = combo.itemsWithPrice
    ? combo.itemsWithPrice.reduce((sum, ci) => sum + (ci.price ?? 0) * ci.quantity, 0)
    : null

  const savings =
    combo.price != null && individualTotal != null && individualTotal > 0 && combo.price < individualTotal
      ? Math.round(((individualTotal - combo.price) / individualTotal) * 100)
      : null

  const handleAdd = () => {
    // Build cart items from the combo — each unique menu item gets its own CartItem
    const cartItems: CartItem[] = (combo.itemsWithPrice ?? combo.items.map((ci) => ({
      menu_item_id: '',
      name: ci.name,
      quantity: ci.quantity,
      price: null,
    }))).map((ci: any) => ({
      menuItemId: ci.menu_item_id || '',
      name: getT(ci.name, locale) || getT(ci.name, 'en') || 'Item',
      price: ci.price ?? null,
      quantity: ci.quantity,
    }))

    onAddToCart(cartItems)
  }

  const itemsLabel = combo.items
    .map(ci => `${getT(ci.name, locale)} × ${ci.quantity}`)
    .join(' + ')

  return (
    <div className="flex-shrink-0 w-64 snap-start bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
      <div className="bg-amber-50 px-4 py-3 border-b border-amber-100">
        <span className="inline-block text-xs font-semibold bg-amber-400 text-white px-2 py-0.5 rounded-full mb-1.5">
          🎁 Set Deal
        </span>
        <h3 className="font-bold text-gray-900 text-sm leading-snug">
          {getT(combo.name, locale)}
        </h3>
        {combo.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
            {getT(combo.description, locale)}
          </p>
        )}
      </div>

      <div className="px-4 py-3">
        {/* Item chips */}
        <p className="text-xs text-gray-600 leading-relaxed mb-3">{itemsLabel}</p>

        {/* Price row */}
        <div className="flex items-center gap-2 mb-3">
          {combo.price != null && (
            <span className="text-base font-bold text-teal-600">
              {formatCurrency(combo.price, currency)}
            </span>
          )}
          {individualTotal != null && individualTotal > 0 && combo.price != null && (
            <span className="text-xs text-gray-400 line-through">
              {formatCurrency(individualTotal, currency)}
            </span>
          )}
          {savings != null && savings > 0 && (
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              Save {savings}%
            </span>
          )}
        </div>

        {/* Add deal button */}
        <button
          onClick={handleAdd}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2 rounded-xl active:scale-95 transition-all"
        >
          Add deal
        </button>
      </div>
    </div>
  )
}
