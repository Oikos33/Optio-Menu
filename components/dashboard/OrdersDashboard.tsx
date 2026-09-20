'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type OrderItem = {
  id: string
  name: string
  quantity: number
  price: number | null
  notes: string | null
  status: string
}

export type Order = {
  id: string
  table_name: string | null
  status: string
  notes: string | null
  total: number | null
  created_at: string
  order_items: OrderItem[]
}

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'paid'] as const
const STATUS_META: Record<string, { label: string; emoji: string; bg: string; text: string; next?: string; nextLabel?: string }> = {
  pending:   { label: 'Pending',   emoji: '⏳', bg: 'bg-yellow-50',  text: 'text-yellow-700', next: 'confirmed', nextLabel: '✅ Confirm' },
  confirmed: { label: 'Confirmed', emoji: '✅', bg: 'bg-blue-50',    text: 'text-blue-700',   next: 'preparing', nextLabel: '👨‍🍳 Start Prep' },
  preparing: { label: 'Preparing', emoji: '👨‍🍳', bg: 'bg-orange-50', text: 'text-orange-700', next: 'ready',    nextLabel: '🛎️ Mark Ready' },
  ready:     { label: 'Ready',     emoji: '🛎️', bg: 'bg-teal-50',   text: 'text-teal-700',   next: 'delivered', nextLabel: '📦 Delivered' },
  delivered: { label: 'Delivered', emoji: '📦', bg: 'bg-green-50',   text: 'text-green-700',  next: 'paid',     nextLabel: '💳 Mark Paid' },
  paid:      { label: 'Paid',      emoji: '💚', bg: 'bg-gray-50',    text: 'text-gray-500' },
  cancelled: { label: 'Cancelled', emoji: '❌', bg: 'bg-red-50',     text: 'text-red-500' },
}

interface Props {
  businessId: string
  initialOrders: Order[]
}

export default function OrdersDashboard({ businessId, initialOrders }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [updating, setUpdating] = useState<string | null>(null)

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`orders:${businessId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `business_id=eq.${businessId}`,
      }, async () => {
        // Re-fetch all orders on any change
        const { data } = await (supabase as any)
          .from('orders')
          .select('*, order_items(*)')
          .eq('business_id', businessId)
          .not('status', 'in', '("paid","cancelled")')
          .order('created_at', { ascending: false })
        if (data) setOrders(data)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'order_items',
      }, async () => {
        const { data } = await (supabase as any)
          .from('orders')
          .select('*, order_items(*)')
          .eq('business_id', businessId)
          .not('status', 'in', '("paid","cancelled")')
          .order('created_at', { ascending: false })
        if (data) setOrders(data)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [businessId])

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdating(orderId)
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    setUpdating(null)
  }

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Cancel this order?')) return
    await updateOrderStatus(orderId, 'cancelled')
    setOrders(prev => prev.filter(o => o.id !== orderId))
  }

  const activeOrders = orders.filter(o => !['paid', 'cancelled'].includes(o.status))
  const timeAgo = (ts: string) => {
    const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    return `${Math.floor(mins / 60)}h ago`
  }

  return (
    <div>
      {/* View toggle + summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">{activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}</span>
          {activeOrders.filter(o => o.status === 'pending').length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
              {activeOrders.filter(o => o.status === 'pending').length} new
            </span>
          )}
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setView('kanban')}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${view === 'kanban' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            📋 Kanban
          </button>
          <button
            onClick={() => setView('table')}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${view === 'table' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            🪑 By Table
          </button>
        </div>
      </div>

      {activeOrders.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-5xl mb-3">🎉</p>
          <p className="font-semibold text-gray-700">All clear! No active orders.</p>
          <p className="text-sm text-gray-400 mt-1">Orders will appear here in real-time when customers scan a table QR.</p>
        </div>
      )}

      {/* ── KANBAN VIEW ──────────────────────────────── */}
      {view === 'kanban' && activeOrders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {STATUS_FLOW.slice(0, 5).map(status => {
            const colOrders = activeOrders.filter(o => o.status === status)
            const meta = STATUS_META[status]
            return (
              <div key={status}>
                <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl ${meta.bg}`}>
                  <span>{meta.emoji}</span>
                  <span className={`font-semibold text-sm ${meta.text}`}>{meta.label}</span>
                  <span className={`ml-auto text-xs font-bold ${meta.text}`}>{colOrders.length}</span>
                </div>
                <div className="space-y-3">
                  {colOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      updating={updating === order.id}
                      onAdvance={meta.next ? () => updateOrderStatus(order.id, meta.next!) : undefined}
                      advanceLabel={meta.nextLabel}
                      onCancel={() => cancelOrder(order.id)}
                      timeAgo={timeAgo(order.created_at)}
                      businessId={businessId}
                    />
                  ))}
                  {colOrders.length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-300 border border-dashed border-gray-100 rounded-xl">
                      None
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── BY TABLE VIEW ─────────────────────────────── */}
      {view === 'table' && activeOrders.length > 0 && (
        <div className="space-y-6">
          {Array.from(new Set(activeOrders.map(o => o.table_name ?? 'No table'))).sort().map(tableName => {
            const tableOrders = activeOrders.filter(o => (o.table_name ?? 'No table') === tableName)
            return (
              <div key={tableName} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                  <span className="text-lg">🪑</span>
                  <span className="font-bold text-gray-900">{tableName}</span>
                  <span className="text-sm text-gray-400 ml-auto">{tableOrders.length} order{tableOrders.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {tableOrders.map(order => {
                    const meta = STATUS_META[order.status] ?? STATUS_META.pending
                    return (
                      <OrderCard
                        key={order.id}
                        order={order}
                        updating={updating === order.id}
                        onAdvance={meta.next ? () => updateOrderStatus(order.id, meta.next!) : undefined}
                        advanceLabel={meta.nextLabel}
                        onCancel={() => cancelOrder(order.id)}
                        timeAgo={timeAgo(order.created_at)}
                        flat
                        businessId={businessId}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── ORDER CARD ─────────────────────────────────────────────

function OrderCard({
  order, updating, onAdvance, advanceLabel, onCancel, timeAgo, flat = false, businessId,
}: {
  order: Order
  updating: boolean
  onAdvance?: () => void
  advanceLabel?: string
  onCancel: () => void
  timeAgo: string
  flat?: boolean
  businessId?: string
}) {
  const meta = STATUS_META[order.status] ?? STATUS_META.pending
  const shortId = order.id.slice(0, 8).toUpperCase()

  return (
    <div className={`${flat ? 'p-4' : `${meta.bg} rounded-2xl p-4 border border-gray-100 shadow-sm`} ${updating ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-bold text-gray-400 font-mono">#{shortId}</span>
          {order.table_name && !flat && (
            <span className="ml-2 text-xs text-teal-600 font-semibold">🪑 {order.table_name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{timeAgo}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
            {meta.emoji} {meta.label}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-3">
        {order.order_items.map(item => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            <span className="w-5 h-5 bg-gray-100 text-gray-600 rounded text-xs font-bold flex items-center justify-center flex-shrink-0">
              {item.quantity}
            </span>
            <span className="text-gray-800 flex-1 truncate">{item.name}</span>
            {item.price != null && (
              <span className="text-gray-400 text-xs flex-shrink-0">¥{(item.price * item.quantity).toFixed(0)}</span>
            )}
          </div>
        ))}
        {order.notes && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1">
            📝 {order.notes}
          </p>
        )}
      </div>

      {/* Total + Actions */}
      <div className="flex items-center gap-2">
        {order.total != null && (
          <span className="text-sm font-bold text-gray-900 mr-auto">¥{order.total.toFixed(0)}</span>
        )}
        {order.status === 'paid' && businessId && (
          <a
            href={`/dashboard/businesses/${businessId}/orders/${order.id}/receipt`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-teal-600 transition-colors px-2 py-1 border border-gray-200 rounded-lg"
            title="Print receipt"
          >
            🖨️ Receipt
          </a>
        )}
        <button
          onClick={onCancel}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
        >
          Cancel
        </button>
        {onAdvance && (
          <button
            onClick={onAdvance}
            disabled={updating}
            className="bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {advanceLabel}
          </button>
        )}
      </div>
    </div>
  )
}
