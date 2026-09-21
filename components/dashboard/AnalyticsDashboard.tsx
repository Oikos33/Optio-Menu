'use client'

import { useState, useEffect, useCallback } from 'react'
import { Link } from '@/i18n/navigation'
import { formatAmount } from '@/lib/currency'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Business {
  id: string
  name: string
  slug: string
  currency: string
}

interface DailyData {
  date: string
  revenue: number
  orders: number
}

interface PeakHour {
  hour: number
  label: string
  count: number
}

interface TopDish {
  name: string
  qty: number
  revenue: number
}

interface ReservationStats {
  total: number
  confirmed: number
  cancelled: number
  avgPartySize: number
}

interface ReviewStats {
  total: number
  avgRating: number | null
  verified: number
}

interface AnalyticsData {
  currency: string
  period: number
  totals: {
    revenue: number
    orders: number
    avgOrderValue: number
  }
  daily: DailyData[]
  peakHours: PeakHour[]
  topDishes: TopDish[]
  reservations: ReservationStats
  reviews: ReviewStats
}

interface Props {
  business: Business
  locale: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TEAL = '#0d9488'
const TEAL_LIGHT = '#5eead4'
const AMBER = '#f59e0b'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400 text-sm">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>
          {i < full ? '★' : i === full && half ? '⯨' : '☆'}
        </span>
      ))}
    </span>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
      <div className="h-7 w-32 bg-gray-200 rounded" />
    </div>
  )
}

function SkeletonChart({ height }: { height: number }) {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse"
      style={{ height }}
    >
      <div className="h-3 w-28 bg-gray-200 rounded mb-4" />
      <div className="h-full bg-gray-100 rounded-xl" />
    </div>
  )
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function RevenueTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean
  payload?: Array<{ value: number; payload: DailyData }>
  label?: string
  currency: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-teal-600">{formatAmount(d.revenue, currency)}</p>
      <p className="text-gray-400">{d.orders} order{d.orders !== 1 ? 's' : ''}</p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AnalyticsDashboard({ business, locale: _locale }: Props) {
  const { id } = business
  const [period, setPeriod] = useState<7 | 30 | 90>(30)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?businessId=${id}&period=${p}`)
      if (res.ok) {
        const json = await res.json() as AnalyticsData
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAnalytics(period)
  }, [period, fetchAnalytics])

  // ── Tab nav ────────────────────────────────────────────────────────────────

  const tabs = [
    { href: `/dashboard/businesses/${id}`,              label: '🍽️ Menu' },
    { href: `/dashboard/businesses/${id}/tables`,       label: '📋 Tables' },
    { href: `/dashboard/businesses/${id}/orders`,       label: '📦 Orders' },
    { href: `/dashboard/businesses/${id}/reservations`, label: '📅 Reservations' },
    { href: `/dashboard/businesses/${id}/kds`,          label: '🍳 KDS' },
    { href: `/dashboard/businesses/${id}/analytics`,    label: '📊 Analytics', active: true },
    { href: `/dashboard/businesses/${id}/combos`,       label: '🎁 Deals' },
    { href: `/dashboard/businesses/${id}/settings`,     label: '⚙️ Settings' },
  ]

  const currency = data?.currency ?? business.currency ?? 'JPY'

  // ── Peak hours: find max for highlight ────────────────────────────────────

  const maxPeak = data ? Math.max(...data.peakHours.map(h => h.count), 1) : 1

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/dashboard/businesses/${id}`} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate">{business.name}</h1>
            <p className="text-xs text-gray-400">Analytics</p>
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-0 -mb-px overflow-x-auto">
          {tabs.map(tab =>
            tab.active ? (
              <span
                key={tab.href}
                className="text-sm font-semibold text-teal-600 px-4 py-2 border-b-2 border-teal-600 whitespace-nowrap"
              >
                {tab.label}
              </span>
            ) : (
              <Link
                key={tab.href}
                href={tab.href}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 px-4 py-2 border-b-2 border-transparent hover:border-gray-300 transition-colors whitespace-nowrap"
              >
                {tab.label}
              </Link>
            )
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Period selector */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-xl">📊 Analytics</h2>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {([7, 30, 90] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-white text-teal-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p} days
              </button>
            ))}
          </div>
        </div>

        {/* ── Stat Cards ──────────────────────────────────────────────────── */}
        {loading ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
            <SkeletonChart height={280} />
            <SkeletonChart height={240} />
            <SkeletonChart height={220} />
          </>
        ) : !data || data.totals.orders === 0 ? (
          /* Empty state */
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-5xl mb-4">📊</p>
            <p className="text-gray-500">
              No data yet. Orders will appear here once customers start ordering!
            </p>
          </div>
        ) : (
          <>
            {/* Stat cards row 1 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-gray-400 mb-1">💰 Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(data.totals.revenue, currency)}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-gray-400 mb-1">📦 Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.totals.orders.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-gray-400 mb-1">💳 Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(data.totals.avgOrderValue, currency)}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-gray-400 mb-1">⭐ Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.reviews.avgRating != null
                    ? data.reviews.avgRating.toFixed(1)
                    : '—'}
                </p>
                {data.reviews.avgRating != null && (
                  <StarRating rating={data.reviews.avgRating} />
                )}
              </div>
            </div>

            {/* Chart 1: Daily Revenue */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Daily Revenue</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.daily} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={TEAL} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    interval={Math.max(0, Math.floor(data.daily.length / 7) - 1)}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                    tickFormatter={(v: number) => formatAmount(v, currency)}
                  />
                  <Tooltip
                    content={
                      <RevenueTooltip currency={currency} />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={TEAL}
                    strokeWidth={2}
                    fill="url(#revGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2: Peak Hours */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Peak Hours</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.peakHours} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                    allowDecimals={false}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={((value: any) => [value, 'Orders']) as any}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    labelFormatter={((label: any) => label) as any}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.peakHours.map(entry => (
                      <Cell
                        key={entry.hour}
                        fill={entry.count === maxPeak && entry.count > 0 ? AMBER : TEAL_LIGHT}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 3: Top Dishes */}
            {data.topDishes.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-700 mb-4">Top Dishes</h3>
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(180, data.topDishes.length * 40)}
                >
                  <BarChart
                    data={data.topDishes}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#374151' }}
                      axisLine={false}
                      tickLine={false}
                      width={120}
                      tickFormatter={(v: string) =>
                        v.length > 20 ? v.slice(0, 20) + '…' : v
                      }
                    />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={((value: any) => [value, 'Ordered']) as any}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="qty" fill={TEAL} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Stat cards row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reservations */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="font-semibold text-gray-700">📅 Reservations</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-xl font-bold text-gray-900">{data.reservations.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Confirmed</p>
                    <p className="text-xl font-bold text-green-600">{data.reservations.confirmed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Cancelled</p>
                    <p className="text-xl font-bold text-red-500">{data.reservations.cancelled}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Avg Party Size</p>
                    <p className="text-xl font-bold text-gray-900">
                      {data.reservations.avgPartySize > 0
                        ? data.reservations.avgPartySize.toFixed(1)
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="font-semibold text-gray-700">✅ Reviews</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-xl font-bold text-gray-900">{data.reviews.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Verified</p>
                    <p className="text-xl font-bold text-teal-600">{data.reviews.verified}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 mb-1">Avg Rating</p>
                    {data.reviews.avgRating != null ? (
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-bold text-gray-900">
                          {data.reviews.avgRating.toFixed(1)}
                        </p>
                        <StarRating rating={data.reviews.avgRating} />
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-gray-400">—</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
