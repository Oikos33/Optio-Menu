'use client'

import { useEffect, useState } from 'react'
import { createPublicClient } from '@/lib/supabase/public'

interface Props {
  orderId: string
  tableName: string | null
  onNewOrder: () => void
}

export default function OrderConfirmation({ orderId, tableName, onNewOrder }: Props) {
  const [status, setStatus] = useState<string>('pending')
  const shortId = orderId.slice(0, 8).toUpperCase()

  const STATUS_LABEL: Record<string, { label: string; emoji: string; color: string }> = {
    pending:    { label: 'Waiting for confirmation',   emoji: '⏳', color: 'text-yellow-600' },
    confirmed:  { label: 'Order confirmed!',            emoji: '✅', color: 'text-blue-600' },
    preparing:  { label: 'Being prepared in kitchen…', emoji: '👨‍🍳', color: 'text-orange-600' },
    ready:      { label: 'Ready — coming to you!',      emoji: '🛎️', color: 'text-teal-600' },
    delivered:  { label: 'Delivered. Enjoy!',           emoji: '🎉', color: 'text-green-600' },
    paid:       { label: 'Paid. Thank you!',            emoji: '💚', color: 'text-green-700' },
    cancelled:  { label: 'Order cancelled',             emoji: '❌', color: 'text-red-600' },
  }

  useEffect(() => {
    const supabase = createPublicClient()
    const channel = supabase
      .channel(`order:${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        setStatus((payload.new as any).status)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [orderId])

  const cfg = STATUS_LABEL[status] ?? STATUS_LABEL.pending

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
        <p className="text-6xl mb-4">{cfg.emoji}</p>
        <h1 className={`text-xl font-bold mb-1 ${cfg.color}`}>{cfg.label}</h1>

        <div className="my-4 bg-gray-50 rounded-2xl px-6 py-4">
          <p className="text-xs text-gray-400 mb-1">Order number</p>
          <p className="text-3xl font-black text-gray-900 tracking-wider">#{shortId}</p>
          {tableName && (
            <p className="text-sm text-teal-600 font-medium mt-1">🪑 {tableName}</p>
          )}
        </div>

        {/* Live status progress */}
        <div className="flex justify-between text-xs text-gray-300 px-2 mt-4 mb-6 relative">
          {['pending','confirmed','preparing','ready','delivered'].map((s, i, arr) => {
            const statuses = ['pending','confirmed','preparing','ready','delivered','paid']
            const currentIdx = statuses.indexOf(status)
            const stepIdx = statuses.indexOf(s)
            const done = currentIdx >= stepIdx
            return (
              <div key={s} className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-3 h-3 rounded-full transition-colors ${done ? 'bg-teal-500' : 'bg-gray-200'}`} />
                <span className={`text-center leading-tight ${done ? 'text-teal-600 font-medium' : ''}`}>
                  {s === 'pending' ? 'Sent' : s === 'confirmed' ? 'OK' : s === 'preparing' ? 'Kitchen' : s === 'ready' ? 'Ready' : 'Done'}
                </span>
                {i < arr.length - 1 && (
                  <div className={`absolute top-1.5 h-0.5 ${done ? 'bg-teal-300' : 'bg-gray-200'}`}
                    style={{ left: `${(i + 0.5) / arr.length * 100}%`, width: `${1 / arr.length * 100}%` }}
                  />
                )}
              </div>
            )
          })}
        </div>

        <p className="text-xs text-gray-400 mb-6">
          This page updates automatically. Keep it open to track your order.
        </p>

        <button
          onClick={onNewOrder}
          className="w-full bg-teal-600 text-white font-semibold py-3 rounded-2xl hover:bg-teal-700 transition-colors"
        >
          Order more items
        </button>
      </div>
    </div>
  )
}
