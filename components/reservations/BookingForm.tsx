'use client'

import { useState, useCallback } from 'react'
import { Link } from '@/i18n/navigation'
import { getImageUrl } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Business {
  id: string
  name: string
  description: any
  logo_path: string | null
  address: string | null
  currency: string
}

interface Props {
  business: Business
  locale: string
  slug: string
}

interface TimeSlot {
  time: string
  available: boolean
  coversLeft: number
}

interface AvailabilityResponse {
  slots?: TimeSlot[]
  closed?: boolean
  blackout?: boolean
  blackoutReason?: string
  closedReason?: string
  error?: string
  settings?: {
    slotDuration: number
    maxPartySize: number
    confirmationMessage: string | null
  }
}

interface Reservation {
  id: string
  confirmation_code: string
  reservation_date: string
  reservation_time: string
  party_size: number
  status: string
}

const OCCASIONS = [
  { value: '', label: 'None' },
  { value: 'birthday', label: '🎂 Birthday' },
  { value: 'anniversary', label: '💑 Anniversary' },
  { value: 'proposal', label: '💍 Proposal' },
  { value: 'business', label: '👔 Business' },
  { value: 'family', label: '👨‍👩‍👧 Family' },
  { value: 'date_night', label: '💕 Date Night' },
  { value: 'celebration', label: '🎉 Celebration' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-100">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2 flex-1">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
              s < step
                ? 'bg-teal-600 text-white'
                : s === step
                ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {s < step ? '✓' : s}
          </div>
          {s < 3 && (
            <div
              className={`h-0.5 flex-1 rounded-full transition-colors ${
                s < step ? 'bg-teal-600' : 'bg-gray-100'
              }`}
            />
          )}
        </div>
      ))}
      <div className="ml-3 text-xs text-gray-500 shrink-0">
        {step === 1 && 'Date & Size'}
        {step === 2 && 'Time'}
        {step === 3 && 'Your Info'}
      </div>
    </div>
  )
}

function RestaurantHeader({ business }: { business: Business }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-100">
      {business.logo_path ? (
        <img
          src={getImageUrl(business.logo_path)}
          alt={business.name}
          className="w-12 h-12 rounded-xl object-cover shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
          <span className="text-teal-600 text-xl">🍽️</span>
        </div>
      )}
      <div className="min-w-0">
        <h1 className="font-semibold text-gray-900 truncate">{business.name}</h1>
        {business.address && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{business.address}</p>
        )}
      </div>
    </div>
  )
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

function MonthCalendar({
  year,
  month,
  selectedDate,
  onSelect,
}: {
  year: number
  month: number
  selectedDate: string | null
  onSelect: (d: string) => void
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const firstDay = new Date(year, month, 1)
  const startDow = firstDay.getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />
          const cellDate = new Date(year, month, day)
          cellDate.setHours(0, 0, 0, 0)
          const isPast = cellDate < today
          const dateStr = toDateString(new Date(year, month, day))
          const isSelected = selectedDate === dateStr
          const isToday = dateStr === toDateString(today)

          return (
            <button
              key={idx}
              type="button"
              disabled={isPast}
              onClick={() => onSelect(dateStr)}
              className={`
                mx-auto w-9 h-9 rounded-full text-sm font-medium transition-all flex items-center justify-center
                ${isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                ${!isPast && !isSelected ? 'text-gray-700 hover:bg-teal-50 hover:text-teal-700 hover:border hover:border-teal-300' : ''}
                ${isSelected ? 'bg-teal-600 text-white shadow-md' : ''}
                ${isToday && !isSelected ? 'border border-teal-400 text-teal-700' : ''}
              `}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 1: Date + Party Size ────────────────────────────────────────────────

interface Step1Props {
  business: Business
  partySize: number
  selectedDate: string | null
  loading: boolean
  errorMsg: string | null
  onPartySize: (n: number) => void
  onDate: (d: string) => void
  onCheckAvailability: () => void
}

function Step1({
  business,
  partySize,
  selectedDate,
  loading,
  errorMsg,
  onPartySize,
  onDate,
  onCheckAvailability,
}: Step1Props) {
  const now = new Date()
  const thisMonth = { year: now.getFullYear(), month: now.getMonth() }
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const nextMonth = { year: nextMonthDate.getFullYear(), month: nextMonthDate.getMonth() }

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  const [calTab, setCalTab] = useState<'this' | 'next'>('this')
  const active = calTab === 'this' ? thisMonth : nextMonth

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Party size */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Party Size</h2>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPartySize(n)}
              className={`h-10 rounded-lg text-sm font-semibold border transition-all ${
                partySize === n
                  ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-teal-400 hover:text-teal-700'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {/* Month tabs */}
        <div className="flex gap-2 mb-4">
          {(['this', 'next'] as const).map((tab) => {
            const m = tab === 'this' ? thisMonth : nextMonth
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setCalTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  calTab === tab
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {MONTHS[m.month]} {m.year}
              </button>
            )
          })}
        </div>
        <MonthCalendar
          year={active.year}
          month={active.month}
          selectedDate={selectedDate}
          onSelect={onDate}
        />
      </div>

      {selectedDate && (
        <p className="text-center text-sm text-teal-700 font-medium">
          📅 {formatDate(selectedDate)}
        </p>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <button
        type="button"
        disabled={!selectedDate || loading}
        onClick={onCheckAvailability}
        className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Checking…
          </>
        ) : (
          'Check Availability'
        )}
      </button>
    </div>
  )
}

// ─── Step 2: Time Slot ────────────────────────────────────────────────────────

interface Step2Props {
  slots: TimeSlot[]
  selectedDate: string
  partySize: number
  selectedSlot: string | null
  onSlot: (t: string) => void
  onBack: () => void
  onContinue: () => void
}

function Step2({ slots, selectedDate, partySize, selectedSlot, onSlot, onBack, onContinue }: Step2Props) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between bg-teal-50 rounded-xl px-4 py-3">
        <div>
          <p className="text-xs text-teal-600 font-medium uppercase tracking-wide">Selected</p>
          <p className="text-sm font-semibold text-teal-900">
            {formatDate(selectedDate)} · {partySize} {partySize === 1 ? 'guest' : 'guests'}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-teal-700 font-medium underline underline-offset-2 hover:text-teal-900"
        >
          Edit
        </button>
      </div>

      <h2 className="text-sm font-semibold text-gray-700">Available Times</h2>

      {slots.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-4xl mb-3">😔</p>
          <p className="text-gray-700 font-medium">No slots available</p>
          <p className="text-gray-500 text-sm mt-1">Try a different date or party size.</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-4 text-teal-600 text-sm font-medium underline underline-offset-2 hover:text-teal-700"
          >
            ← Go Back
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot) => {
              const isPopular = slot.coversLeft < 5
              const isSelected = selectedSlot === slot.time
              return (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => onSlot(slot.time)}
                  className={`relative py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-teal-600 border-teal-600 text-white shadow-md'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-teal-400 hover:text-teal-700'
                  }`}
                >
                  {formatTime(slot.time)}
                  {isPopular && (
                    <span
                      className={`block text-[10px] font-medium mt-0.5 ${
                        isSelected ? 'text-teal-100' : 'text-orange-500'
                      }`}
                    >
                      Popular
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            disabled={!selectedSlot}
            onClick={onContinue}
            className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue →
          </button>
        </>
      )}
    </div>
  )
}

// ─── Step 3: Guest Info ────────────────────────────────────────────────────────

interface GuestInfo {
  name: string
  phone: string
  email: string
  occasion: string
  specialRequests: string
}

interface Step3Props {
  business: Business
  selectedDate: string
  selectedSlot: string
  partySize: number
  guestInfo: GuestInfo
  loading: boolean
  errorMsg: string | null
  onChange: (field: keyof GuestInfo, value: string) => void
  onBack: () => void
  onSubmit: () => void
}

function Step3({
  business,
  selectedDate,
  selectedSlot,
  partySize,
  guestInfo,
  loading,
  errorMsg,
  onChange,
  onBack,
  onSubmit,
}: Step3Props) {
  const inputClass =
    'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white'
  const labelClass = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Summary card */}
      <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
        <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide mb-2">Your Reservation</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-teal-900">
            <span>📅</span>
            <span className="font-medium">{formatDate(selectedDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-teal-900">
            <span>🕐</span>
            <span className="font-medium">{formatTime(selectedSlot)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-teal-900">
            <span>👥</span>
            <span className="font-medium">
              {partySize} {partySize === 1 ? 'guest' : 'guests'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-teal-900">
            <span>🍽️</span>
            <span className="font-medium">{business.name}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 text-xs text-teal-700 font-medium underline underline-offset-2 hover:text-teal-900"
        >
          ← Edit
        </button>
      </div>

      {/* Form fields */}
      <div className="flex flex-col gap-3">
        <div>
          <label className={labelClass}>
            Name <span className="text-red-400 normal-case font-normal">(required)</span>
          </label>
          <input
            type="text"
            value={guestInfo.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Your full name"
            className={inputClass}
            autoComplete="name"
          />
        </div>

        <div>
          <label className={labelClass}>Phone</label>
          <input
            type="tel"
            value={guestInfo.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="+1 (555) 000-0000"
            className={inputClass}
            autoComplete="tel"
          />
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            value={guestInfo.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
            autoComplete="email"
          />
        </div>

        <div>
          <label className={labelClass}>Occasion</label>
          <select
            value={guestInfo.occasion}
            onChange={(e) => onChange('occasion', e.target.value)}
            className={inputClass}
          >
            {OCCASIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Special Requests</label>
          <textarea
            value={guestInfo.specialRequests}
            onChange={(e) => onChange('specialRequests', e.target.value)}
            placeholder="Allergies, high chair needed, window seat preference…"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <button
        type="button"
        disabled={!guestInfo.name.trim() || loading}
        onClick={onSubmit}
        className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Confirming…
          </>
        ) : (
          '✓ Complete Reservation'
        )}
      </button>
    </div>
  )
}

// ─── Step 4: Confirmation ──────────────────────────────────────────────────────

interface Step4Props {
  reservation: Reservation
  business: Business
  slug: string
  onReset: () => void
}

function Step4({ reservation, business, slug, onReset }: Step4Props) {
  return (
    <div className="flex flex-col items-center gap-5 p-6 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-[scale-in_0.4s_ease]">
        <span className="text-4xl">✅</span>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900">Reservation Confirmed!</h2>
        <p className="text-gray-500 text-sm mt-1">
          We look forward to seeing you at {business.name}.
        </p>
      </div>

      {/* Confirmation code */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 w-full">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
          Confirmation Code
        </p>
        <p className="font-mono text-2xl font-bold tracking-widest text-teal-700">
          {reservation.confirmation_code}
        </p>
        <p className="text-xs text-gray-400 mt-2">Show this code when you arrive</p>
      </div>

      {/* Details */}
      <div className="bg-teal-50 rounded-xl p-4 border border-teal-100 w-full text-left">
        <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide mb-3">Summary</p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-teal-900">
            <span>🍽️</span>
            <span className="font-medium">{business.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-teal-900">
            <span>📅</span>
            <span className="font-medium">{formatDate(reservation.reservation_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-teal-900">
            <span>🕐</span>
            <span className="font-medium">{formatTime(reservation.reservation_time)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-teal-900">
            <span>👥</span>
            <span className="font-medium">
              {reservation.party_size} {reservation.party_size === 1 ? 'guest' : 'guests'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 w-full">
        <Link
          href={`/menu/${slug}` as any}
          className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
        >
          🍽️ View Menu
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          Make Another Reservation
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

const DEFAULT_GUEST_INFO: GuestInfo = {
  name: '',
  phone: '',
  email: '',
  occasion: '',
  specialRequests: '',
}

export default function BookingForm({ business, locale, slug }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1 state
  const [partySize, setPartySize] = useState(2)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])

  // Step 2 state
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  // Step 3 state
  const [guestInfo, setGuestInfo] = useState<GuestInfo>(DEFAULT_GUEST_INFO)

  // Step 4 state
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null)

  // Shared
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCheckAvailability = useCallback(async () => {
    if (!selectedDate) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const url = `/api/reservations/availability?businessId=${encodeURIComponent(business.id)}&date=${selectedDate}&partySize=${partySize}`
      const res = await fetch(url)
      const data: AvailabilityResponse = await res.json()

      if (data.blackout) {
        setErrorMsg(`Closed: ${data.blackoutReason || 'Unavailable on this date.'}`)
        return
      }
      if (data.closed) {
        setErrorMsg(data.closedReason || 'The restaurant is closed on this day.')
        return
      }
      if (data.error) {
        setErrorMsg(data.error)
        return
      }

      setSlots(data.slots ?? [])
      setSelectedSlot(null)
      setStep(2)
    } catch {
      setErrorMsg('Failed to check availability. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [business.id, selectedDate, partySize])

  const handleSubmit = useCallback(async () => {
    if (!selectedDate || !selectedSlot || !guestInfo.name.trim()) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          date: selectedDate,
          time: selectedSlot,
          partySize,
          customerName: guestInfo.name,
          customerPhone: guestInfo.phone || null,
          customerEmail: guestInfo.email || null,
          specialRequests: guestInfo.specialRequests || null,
          occasion: guestInfo.occasion || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create reservation.')
        return
      }
      setConfirmedReservation(data.reservation as Reservation)
      setStep(4)
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [business.id, selectedDate, selectedSlot, partySize, guestInfo])

  const handleReset = useCallback(() => {
    setStep(1)
    setPartySize(2)
    setSelectedDate(null)
    setSlots([])
    setSelectedSlot(null)
    setGuestInfo(DEFAULT_GUEST_INFO)
    setConfirmedReservation(null)
    setErrorMsg(null)
  }, [])

  const handleGuestChange = useCallback((field: keyof GuestInfo, value: string) => {
    setGuestInfo((prev) => ({ ...prev, [field]: value }))
  }, [])

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-4 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        {/* Restaurant header always visible */}
        <RestaurantHeader business={business} />

        {/* Progress bar (steps 1–3 only) */}
        {step !== 4 && <ProgressBar step={step} />}

        {/* Step content */}
        {step === 1 && (
          <Step1
            business={business}
            partySize={partySize}
            selectedDate={selectedDate}
            loading={loading}
            errorMsg={errorMsg}
            onPartySize={(n) => { setPartySize(n); setErrorMsg(null) }}
            onDate={(d) => { setSelectedDate(d); setErrorMsg(null) }}
            onCheckAvailability={handleCheckAvailability}
          />
        )}

        {step === 2 && selectedDate && (
          <Step2
            slots={slots}
            selectedDate={selectedDate}
            partySize={partySize}
            selectedSlot={selectedSlot}
            onSlot={setSelectedSlot}
            onBack={() => { setStep(1); setErrorMsg(null) }}
            onContinue={() => { setStep(3); setErrorMsg(null) }}
          />
        )}

        {step === 3 && selectedDate && selectedSlot && (
          <Step3
            business={business}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            partySize={partySize}
            guestInfo={guestInfo}
            loading={loading}
            errorMsg={errorMsg}
            onChange={handleGuestChange}
            onBack={() => { setStep(2); setErrorMsg(null) }}
            onSubmit={handleSubmit}
          />
        )}

        {step === 4 && confirmedReservation && (
          <Step4
            reservation={confirmedReservation}
            business={business}
            slug={slug}
            onReset={handleReset}
          />
        )}
      </div>

      {/* Powered by footer */}
      <p className="mt-6 text-xs text-gray-400">Powered by Optio Menu</p>
    </div>
  )
}
