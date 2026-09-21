'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Link } from '@/i18n/navigation'

type OrderItem = {
  id: string
  name: string
  quantity: number
  price: number | null
  notes: string | null
}

type KDSOrder = {
  id: string
  table_name: string | null
  status: 'pending' | 'preparing' | string
  notes: string | null
  created_at: string
  placed_by: string | null
  waiter_name: string | null
  order_items: OrderItem[]
}

interface Props {
  businessId: string
  businessName: string
  kdsPin: string | null
  initialOrders: KDSOrder[]
}

// ── Elapsed time helper ──────────────────────────────────────────────────────

function useElapsed(createdAt: string): { text: string; isUrgent: boolean } {
  const [elapsed, setElapsed] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    const calc = () => {
      const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
      setIsUrgent(mins >= 10)
      if (mins < 1) { setElapsed('just now'); return }
      if (mins < 60) { setElapsed(`${mins} min ago`); return }
      setElapsed(`${Math.floor(mins / 60)}h ago`)
    }
    calc()
    const id = setInterval(calc, 30_000)
    return () => clearInterval(id)
  }, [createdAt])

  return { text: elapsed, isUrgent }
}

// ── Order card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onAction,
  updating,
}: {
  order: KDSOrder
  onAction: (orderId: string, newStatus: string) => void
  updating: boolean
}) {
  const { text: elapsed, isUrgent } = useElapsed(order.created_at)
  const isPending = order.status === 'pending'

  return (
    <div className={`bg-gray-900 border rounded-2xl p-5 flex flex-col gap-4 transition-opacity ${updating ? 'opacity-50' : ''} ${isUrgent ? 'border-red-500' : 'border-gray-700'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-white truncate">
            {order.table_name ?? 'No table'}
          </h2>
          {order.placed_by === 'staff' && (
            <span className="inline-flex items-center gap-1 mt-1 bg-teal-900 text-teal-300 text-xs font-semibold px-2 py-0.5 rounded-full">
              👔 Staff Order{order.waiter_name ? ` — ${order.waiter_name}` : ''}
            </span>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <p className={`text-sm font-bold ${isUrgent ? 'text-red-400' : 'text-gray-400'}`}>
            {elapsed}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${isPending ? 'bg-yellow-900 text-yellow-300' : 'bg-orange-900 text-orange-300'}`}>
            {isPending ? '⏳ Pending' : '👨‍🍳 Preparing'}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {order.order_items.map(item => (
          <div key={item.id}>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-gray-700 text-white rounded-lg text-sm font-black flex items-center justify-center flex-shrink-0">
                {item.quantity}
              </span>
              <span className="text-xl text-white font-medium">{item.name}</span>
            </div>
            {item.notes && (
              <p className="ml-11 text-sm text-amber-400 font-medium mt-0.5">
                📝 {item.notes}
              </p>
            )}
          </div>
        ))}
        {order.notes && (
          <p className="text-sm text-amber-400 bg-amber-950 rounded-lg px-3 py-2 mt-1">
            📋 {order.notes}
          </p>
        )}
      </div>

      {/* Action button */}
      <button
        onClick={() => onAction(order.id, isPending ? 'preparing' : 'ready')}
        disabled={updating}
        className={`w-full font-black text-lg py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50 ${
          isPending
            ? 'bg-teal-600 hover:bg-teal-500 text-white'
            : 'bg-green-600 hover:bg-green-500 text-white'
        }`}
      >
        {isPending ? 'START PREPARING' : 'READY ✓'}
      </button>
    </div>
  )
}

// ── Main KDS client ──────────────────────────────────────────────────────────

export default function KDSClient({ businessId, businessName, kdsPin, initialOrders }: Props) {
  const [authenticated, setAuthenticated] = useState(!kdsPin)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [orders, setOrders] = useState<KDSOrder[]>(initialOrders)
  const [updating, setUpdating] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [showSoundBanner, setShowSoundBanner] = useState(true)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const prevOrderCountRef = useRef(initialOrders.filter(o => o.status === 'pending').length)

  // Play beep using Web Audio API
  const playBeep = useCallback(() => {
    if (!soundEnabled) return
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, ctx.currentTime)
      gainNode.gain.setValueAtTime(0.4, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.4)
    } catch (e) {
      console.warn('Audio playback failed', e)
    }
  }, [soundEnabled])

  const enableSound = () => {
    // Create AudioContext on user gesture to satisfy browser policy
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    setSoundEnabled(true)
    setShowSoundBanner(false)
    // Play a test beep immediately
    playBeep()
  }

  // Realtime subscription
  useEffect(() => {
    if (!authenticated) return
    const supabase = createClient()

    const refetch = async () => {
      const { data } = await (supabase as any)
        .from('orders')
        .select('*, order_items(*), placed_by, waiter_name')
        .eq('business_id', businessId)
        .in('status', ['pending', 'preparing'])
        .order('created_at', { ascending: true })
      if (data) {
        setOrders(data)
        const pendingCount = (data as KDSOrder[]).filter(o => o.status === 'pending').length
        if (pendingCount > prevOrderCountRef.current) {
          playBeep()
        }
        prevOrderCountRef.current = pendingCount
      }
    }

    const channel = supabase
      .channel(`kds:${businessId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `business_id=eq.${businessId}` }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, refetch)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [authenticated, businessId, playBeep])

  // Re-play beep when soundEnabled toggles on and pending count was > 0
  useEffect(() => {
    if (soundEnabled && orders.filter(o => o.status === 'pending').length > 0) {
      playBeep()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled])

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === kdsPin) {
      setAuthenticated(true)
      setPinError(false)
    } else {
      setPinError(true)
      setPin('')
    }
  }

  const handleAction = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    // Realtime will sync, but optimistically remove from KDS if ready
    if (newStatus === 'ready') {
      setOrders(prev => prev.filter(o => o.id !== orderId))
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    }
    setUpdating(null)
  }

  // ── PIN SCREEN ──────────────────────────────────────────────────────────────

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="text-4xl mb-3">🍳</p>
            <h1 className="text-2xl font-bold text-white">Kitchen Display</h1>
            <p className="text-gray-400 mt-1">{businessName}</p>
          </div>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2 text-center">Enter KDS PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={e => { setPin(e.target.value); setPinError(false) }}
                className={`w-full text-center text-4xl font-bold tracking-widest bg-gray-900 text-white border-2 rounded-2xl py-5 px-4 focus:outline-none focus:border-teal-500 ${pinError ? 'border-red-500' : 'border-gray-700'}`}
                placeholder="••••••"
                autoFocus
              />
              {pinError && (
                <p className="text-center text-red-400 text-sm mt-2">Incorrect PIN. Try again.</p>
              )}
            </div>
            <button
              type="submit"
              disabled={pin.length === 0}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-4 rounded-2xl text-lg disabled:opacity-40 transition-colors"
            >
              Unlock KDS
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── KDS BOARD ───────────────────────────────────────────────────────────────

  const pendingOrders   = orders.filter(o => o.status === 'pending')
  const preparingOrders = orders.filter(o => o.status === 'preparing')

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Sound banner */}
      {showSoundBanner && (
        <div className="bg-teal-900 border-b border-teal-700 px-4 py-2 flex items-center justify-between">
          <p className="text-sm text-teal-200">🔔 Click to enable order alert sounds</p>
          <button
            onClick={enableSound}
            className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-3 py-1 rounded-lg transition-colors"
          >
            Enable Sound
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <Link
          href={`/dashboard/businesses/${businessId}`}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-white">🍳 Kitchen Display</h1>
          <p className="text-xs text-gray-500">{businessName}</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-yellow-400 font-bold">{pendingOrders.length} pending</span>
          <span className="text-orange-400 font-bold">{preparingOrders.length} preparing</span>
          {soundEnabled && <span className="text-teal-400 text-xs">🔔 Sound on</span>}
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 ml-4">
          <Link
            href={`/dashboard/businesses/${businessId}`}
            className="text-sm font-medium text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Menu
          </Link>
          <Link
            href={`/dashboard/businesses/${businessId}/tables`}
            className="text-sm font-medium text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Tables
          </Link>
          <Link
            href={`/dashboard/businesses/${businessId}/orders`}
            className="text-sm font-medium text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Orders
          </Link>
          <Link
            href={`/dashboard/businesses/${businessId}/reservations`}
            className="text-sm font-medium text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            📅 Reservations
          </Link>
          <span className="text-sm font-semibold text-teal-400 px-3 py-1.5 rounded-lg bg-gray-800">
            KDS
          </span>
        </div>
      </header>

      {/* Empty state */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-gray-600">
          <p className="text-6xl mb-4">✅</p>
          <p className="text-xl font-semibold text-gray-400">All caught up!</p>
          <p className="text-sm text-gray-600 mt-1">No pending or preparing orders.</p>
        </div>
      )}

      {/* Order grid — pending first (most urgent), then preparing */}
      <main className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...pendingOrders, ...preparingOrders].map(order => (
          <OrderCard
            key={order.id}
            order={order}
            onAction={handleAction}
            updating={updating === order.id}
          />
        ))}
      </main>
    </div>
  )
}
