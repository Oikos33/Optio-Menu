'use client'

import { useState, useEffect, useCallback } from 'react'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Types ────────────────────────────────────────────────────────────────────

type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'

type Reservation = {
  id: string
  business_id: string
  reservation_date: string
  reservation_time: string
  party_size: number
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  occasion: string | null
  special_requests: string | null
  confirmation_code: string
  status: ReservationStatus
  internal_notes: string | null
  created_at: string
}

interface Props {
  business: { id: string; name: string; slug: string }
  locale: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const OCCASION_EMOJI: Record<string, string> = {
  birthday: '🎂',
  anniversary: '💍',
  date: '❤️',
  business: '💼',
  family: '👨‍👩‍👧',
  graduation: '🎓',
  holiday: '🎄',
  other: '🎉',
}

const STATUS_META: Record<ReservationStatus, { label: string; bg: string; text: string; border: string }> = {
  pending:   { label: 'Pending',   bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-200' },
  confirmed: { label: 'Confirmed', bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200' },
  seated:    { label: 'Seated',    bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200' },
  completed: { label: 'Completed', bg: 'bg-gray-50',    text: 'text-gray-500',   border: 'border-gray-200' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-200' },
  no_show:   { label: 'No-show',   bg: 'bg-orange-50',  text: 'text-orange-600', border: 'border-orange-200' },
}

const KANBAN_STATUSES: ReservationStatus[] = ['pending', 'confirmed', 'seated', 'completed']

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function nowTimeStr() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 max-w-sm">
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-white ml-2">✕</button>
    </div>
  )
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReservationStatus }) {
  const meta = STATUS_META[status]
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}>
      {meta.label}
    </span>
  )
}

// ── Reservation Card ──────────────────────────────────────────────────────────

function ReservationCard({
  res,
  onAction,
  updating,
  flat = false,
}: {
  res: Reservation
  onAction: (id: string, status: ReservationStatus) => void
  updating: boolean
  flat?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const meta = STATUS_META[res.status]
  const occasionEmoji = res.occasion ? (OCCASION_EMOJI[res.occasion] ?? '🎉') : null

  return (
    <div className={`${flat ? 'p-4' : `${meta.bg} rounded-2xl p-4 border ${meta.border} shadow-sm`} ${updating ? 'opacity-60' : ''} transition-opacity`}>
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{res.customer_name}</span>
            {occasionEmoji && (
              <span className="text-sm" title={res.occasion ?? ''}>{occasionEmoji}</span>
            )}
            <span className="text-sm text-gray-500">👥 {res.party_size}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs font-semibold text-gray-700">{res.reservation_time.slice(0, 5)}</span>
            <StatusBadge status={res.status} />
            <span className="text-xs text-gray-400 font-mono">{res.confirmation_code}</span>
          </div>
        </div>
      </div>

      {/* Special requests */}
      {res.special_requests && (
        <div className="mt-2">
          <p
            className={`text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 cursor-pointer ${expanded ? '' : 'line-clamp-1'}`}
            onClick={() => setExpanded(v => !v)}
          >
            📝 {res.special_requests}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {res.status === 'pending' && (
          <>
            <button
              onClick={() => onAction(res.id, 'confirmed')}
              disabled={updating}
              className="bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              ✅ Confirm
            </button>
            <button
              onClick={() => onAction(res.id, 'cancelled')}
              disabled={updating}
              className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5 transition-colors"
            >
              Cancel
            </button>
          </>
        )}
        {res.status === 'confirmed' && (
          <>
            <button
              onClick={() => onAction(res.id, 'seated')}
              disabled={updating}
              className="bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              🪑 Seat
            </button>
            <button
              onClick={() => onAction(res.id, 'no_show')}
              disabled={updating}
              className="text-xs text-orange-500 hover:text-orange-700 px-2 py-1.5 transition-colors"
            >
              No-show
            </button>
            <button
              onClick={() => onAction(res.id, 'cancelled')}
              disabled={updating}
              className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5 transition-colors"
            >
              Cancel
            </button>
          </>
        )}
        {res.status === 'seated' && (
          <button
            onClick={() => onAction(res.id, 'completed')}
            disabled={updating}
            className="bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            ✓ Complete
          </button>
        )}
        {(['completed', 'cancelled', 'no_show'] as ReservationStatus[]).includes(res.status) && (
          <span className="text-xs text-gray-400 italic">View only</span>
        )}
      </div>
    </div>
  )
}

// ── Walk-in Modal ─────────────────────────────────────────────────────────────

function WalkInModal({
  businessId,
  onClose,
  onCreated,
}: {
  businessId: string
  onClose: () => void
  onCreated: (res: Reservation) => void
}) {
  const [partySize, setPartySize] = useState(2)
  const [name, setName] = useState('')
  const [occasion, setOccasion] = useState('')
  const [time, setTime] = useState(nowTimeStr())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          date: todayStr(),
          time,
          partySize,
          customerName: name.trim(),
          occasion: occasion || null,
          specialRequests: null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed'); setLoading(false); return }
      // Override status to seated for walk-ins
      const patchRes = await fetch('/api/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: json.reservation.id, status: 'seated' }),
      })
      const patchJson = await patchRes.json()
      if (patchRes.ok) {
        onCreated({ ...json.reservation, status: 'seated', reservation_time: time, party_size: partySize, customer_name: name.trim(), occasion: occasion || null, special_requests: null, internal_notes: null, business_id: businessId })
      } else {
        setError(patchJson.error ?? 'Status update failed')
      }
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 text-lg">🚶 Walk-in</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Customer Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Party Size</label>
              <input
                type="number"
                min={1}
                max={50}
                value={partySize}
                onChange={e => setPartySize(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Occasion</label>
            <select
              value={occasion}
              onChange={e => setOccasion(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">None</option>
              {Object.entries(OCCASION_EMOJI).map(([key, emoji]) => (
                <option key={key} value={key}>{emoji} {key.charAt(0).toUpperCase() + key.slice(1)}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Adding…' : '🪑 Seat Walk-in'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ReservationsDashboard({ business, locale }: Props) {
  const { id, slug } = business
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://optio-menu.ai'

  const [date, setDate] = useState(todayStr())
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'timeline' | 'kanban'>('timeline')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showWalkIn, setShowWalkIn] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // ── Fetch reservations ──────────────────────────────────────────────────────
  const fetchReservations = useCallback(async (d: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reservations?businessId=${id}&date=${d}`)
      const json = await res.json()
      setReservations(json.reservations ?? [])
    } catch {
      // ignore
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchReservations(date)
  }, [date, fetchReservations])

  // ── Realtime ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`reservations:${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reservations',
        filter: `business_id=eq.${id}`,
      }, async (payload) => {
        // Show toast for new reservations
        if (payload.eventType === 'INSERT') {
          const r = payload.new as Reservation
          const timeStr = r.reservation_time?.slice(0, 5) ?? ''
          setToast(`🔔 New reservation! ${r.customer_name} · 👥${r.party_size} · ${timeStr}`)
        }
        // Refresh current date
        const res = await fetch(`/api/reservations?businessId=${id}&date=${date}`)
        const json = await res.json()
        if (json.reservations) setReservations(json.reservations)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id, date])

  // ── Status update ───────────────────────────────────────────────────────────
  const handleAction = async (resId: string, status: ReservationStatus) => {
    setUpdatingId(resId)
    await fetch('/api/reservations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: resId, status }),
    })
    setReservations(prev => prev.map(r => r.id === resId ? { ...r, status } : r))
    setUpdatingId(null)
  }

  // ── Walk-in created ─────────────────────────────────────────────────────────
  const handleWalkInCreated = (res: Reservation) => {
    setShowWalkIn(false)
    if (res.reservation_date === date) {
      setReservations(prev => [...prev, res].sort((a, b) => a.reservation_time.localeCompare(b.reservation_time)))
    }
    setToast(`🪑 Walk-in added: ${res.customer_name} · 👥${res.party_size}`)
  }

  // ── Copy booking link ───────────────────────────────────────────────────────
  const copyBookingLink = () => {
    navigator.clipboard.writeText(`${appUrl}/reserve/${slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Date helpers ────────────────────────────────────────────────────────────
  const today = todayStr()
  const dateLabel =
    date === today ? 'Today' :
    date === addDays(today, 1) ? 'Tomorrow' :
    date === addDays(today, -1) ? 'Yesterday' :
    formatDate(date)

  // ── Grouped by status (for timeline sections) ───────────────────────────────
  const byStatus = (status: ReservationStatus) => reservations.filter(r => r.status === status)
  const activeReservations = reservations.filter(r => !['cancelled', 'no_show'].includes(r.status))

  const tabCls = (active: boolean) =>
    active
      ? 'text-sm font-semibold text-teal-600 px-4 py-2 border-b-2 border-teal-600 whitespace-nowrap'
      : 'text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 border-b-2 border-transparent hover:border-gray-300 transition-colors whitespace-nowrap'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/dashboard/businesses/${id}`} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate">{business.name}</h1>
            <p className="text-xs text-gray-400">Reservations</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 pb-0 -mb-px overflow-x-auto">
          <Link href={`/dashboard/businesses/${id}`} className={tabCls(false)}>
            🍽️ Menu
          </Link>
          <Link href={`/dashboard/businesses/${id}/tables`} className={tabCls(false)}>
            📋 Tables
          </Link>
          <Link href={`/dashboard/businesses/${id}/orders`} className={tabCls(false)}>
            📦 Orders
          </Link>
          <span className={tabCls(true)}>
            📅 Reservations
          </span>
          <Link href={`/dashboard/businesses/${id}/kds`} className={tabCls(false)}>
            🍳 KDS
          </Link>
          <Link href={`/dashboard/businesses/${id}/analytics`} className={tabCls(false)}>
            📊 Analytics
          </Link>
          <Link href={`/dashboard/businesses/${id}/combos`} className={tabCls(false)}>
            🎁 Deals
          </Link>
          <Link href={`/dashboard/businesses/${id}/settings`} className={tabCls(false)}>
            ⚙️ Settings
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* ── TOOLBAR ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          {/* Date navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDate(d => addDays(d, -1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 text-lg"
            >
              ‹
            </button>
            <div className="text-center min-w-[140px]">
              <p className="font-semibold text-gray-900 text-sm">{dateLabel}</p>
              <p className="text-xs text-gray-400">{formatDate(date)}</p>
            </div>
            <button
              onClick={() => setDate(d => addDays(d, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 text-lg"
            >
              ›
            </button>
            {date !== today && (
              <button
                onClick={() => setDate(today)}
                className="text-xs text-teal-600 hover:text-teal-800 font-medium ml-1"
              >
                Today
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            {/* View toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setView('timeline')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${view === 'timeline' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              >
                ⏱ Timeline
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${view === 'kanban' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              >
                📋 Kanban
              </button>
            </div>

            {/* Walk-in */}
            <button
              onClick={() => setShowWalkIn(true)}
              className="bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-teal-700 transition-colors whitespace-nowrap"
            >
              + Walk-in
            </button>
          </div>
        </div>

        {/* ── SUMMARY PILLS ───────────────────────────────────────── */}
        {reservations.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(STATUS_META).map(([status, meta]) => {
              const count = byStatus(status as ReservationStatus).length
              if (count === 0) return null
              return (
                <span key={status} className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}>
                  {meta.label} · {count}
                </span>
              )
            })}
          </div>
        )}

        {/* ── LOADING ─────────────────────────────────────────────── */}
        {loading && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-2xl mb-2">⏳</p>
            <p className="text-sm">Loading…</p>
          </div>
        )}

        {/* ── EMPTY STATE ─────────────────────────────────────────── */}
        {!loading && reservations.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-5xl mb-4">📅</p>
            <h2 className="font-semibold text-gray-700 mb-1">No reservations for this date</h2>
            <p className="text-sm text-gray-400 mb-6">Share your booking link so guests can reserve a table.</p>
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={copyBookingLink}
                className="bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors"
              >
                {copied ? '✓ Copied!' : '🔗 Share booking link'}
              </button>
              <Link
                href={`/dashboard/businesses/${id}/settings#reservations`}
                className="text-xs text-gray-400 hover:text-teal-600 flex items-center gap-1"
              >
                ⚙️ Configure availability
              </Link>
            </div>
          </div>
        )}

        {/* ── TIMELINE VIEW ───────────────────────────────────────── */}
        {!loading && reservations.length > 0 && view === 'timeline' && (
          <div className="space-y-2">
            {/* Group by status sections */}
            {(['pending', 'confirmed', 'seated', 'completed', 'no_show', 'cancelled'] as ReservationStatus[]).map(status => {
              const group = byStatus(status)
              if (group.length === 0) return null
              const meta = STATUS_META[status]
              return (
                <div key={status} className="mb-6">
                  <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl ${meta.bg} border ${meta.border}`}>
                    <span className={`font-semibold text-sm ${meta.text}`}>{meta.label}</span>
                    <span className={`ml-auto text-xs font-bold ${meta.text}`}>{group.length}</span>
                  </div>
                  <div className="space-y-3">
                    {group.map(res => (
                      <ReservationCard
                        key={res.id}
                        res={res}
                        onAction={handleAction}
                        updating={updatingId === res.id}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── KANBAN VIEW ─────────────────────────────────────────── */}
        {!loading && reservations.length > 0 && view === 'kanban' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {KANBAN_STATUSES.map(status => {
              const group = byStatus(status)
              const meta = STATUS_META[status]
              return (
                <div key={status}>
                  <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl ${meta.bg} border ${meta.border}`}>
                    <span className={`font-semibold text-sm ${meta.text}`}>{meta.label}</span>
                    <span className={`ml-auto text-xs font-bold ${meta.text}`}>{group.length}</span>
                  </div>
                  <div className="space-y-3">
                    {group.map(res => (
                      <ReservationCard
                        key={res.id}
                        res={res}
                        onAction={handleAction}
                        updating={updatingId === res.id}
                      />
                    ))}
                    {group.length === 0 && (
                      <div className="text-center py-8 text-xs text-gray-300 border border-dashed border-gray-100 rounded-xl">
                        None
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── SETTINGS SHORTCUT ───────────────────────────────────── */}
        {!loading && (
          <div className="mt-8 text-center">
            <Link
              href={`/dashboard/businesses/${id}/settings#reservations`}
              className="text-xs text-gray-400 hover:text-teal-600 transition-colors"
            >
              ⚙️ Configure availability &amp; hours
            </Link>
          </div>
        )}
      </main>

      {/* ── WALK-IN MODAL ───────────────────────────────────────────── */}
      {showWalkIn && (
        <WalkInModal
          businessId={id}
          onClose={() => setShowWalkIn(false)}
          onCreated={handleWalkInCreated}
        />
      )}

      {/* ── TOAST ───────────────────────────────────────────────────── */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
