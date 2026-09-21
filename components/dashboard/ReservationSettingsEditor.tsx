'use client'

import { useState, useTransition } from 'react'
import { saveReservationSettings, addBlackoutDate, removeBlackoutDate } from '@/app/actions/reservations'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface DayHours {
  open: string
  close: string
}

interface ReservationSettingsData {
  reservations_enabled: boolean
  slot_duration_minutes: number
  slot_interval_minutes: number
  max_party_size: number
  max_covers_per_slot: number
  max_advance_days: number
  min_advance_hours: number
  confirmation_message: string | null
  cancellation_policy: string | null
  hours: Record<string, DayHours | null>
}

interface Blackout {
  date: string
  reason: string | null
}

interface Props {
  businessId: string
  slug: string
  initialSettings: ReservationSettingsData | null
  initialBlackouts: Blackout[]
}

const DEFAULT_HOURS: Record<string, DayHours | null> = {
  '0': null,
  '1': { open: '11:30', close: '22:00' },
  '2': { open: '11:30', close: '22:00' },
  '3': { open: '11:30', close: '22:00' },
  '4': { open: '11:30', close: '22:00' },
  '5': { open: '11:30', close: '22:30' },
  '6': { open: '11:00', close: '22:30' },
}

export default function ReservationSettingsEditor({ businessId, slug, initialSettings, initialBlackouts }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const init = initialSettings ?? {
    reservations_enabled: false,
    slot_duration_minutes: 90,
    slot_interval_minutes: 30,
    max_party_size: 12,
    max_covers_per_slot: 30,
    max_advance_days: 60,
    min_advance_hours: 1,
    confirmation_message: null,
    cancellation_policy: null,
    hours: DEFAULT_HOURS,
  }

  const [enabled, setEnabled] = useState(init.reservations_enabled)
  const [slotDuration, setSlotDuration] = useState(String(init.slot_duration_minutes))
  const [slotInterval, setSlotInterval] = useState(String(init.slot_interval_minutes))
  const [maxParty, setMaxParty] = useState(String(init.max_party_size))
  const [maxCovers, setMaxCovers] = useState(String(init.max_covers_per_slot))
  const [maxAdvance, setMaxAdvance] = useState(String(init.max_advance_days))
  const [minHours, setMinHours] = useState(String(init.min_advance_hours))
  const [confirmMsg, setConfirmMsg] = useState(init.confirmation_message ?? '')
  const [cancelPolicy, setCancelPolicy] = useState(init.cancellation_policy ?? '')
  const [hours, setHours] = useState<Record<string, DayHours | null>>(init.hours ?? DEFAULT_HOURS)
  const [blackouts, setBlackouts] = useState<Blackout[]>(initialBlackouts)
  const [newBlackout, setNewBlackout] = useState('')
  const [newBlackoutReason, setNewBlackoutReason] = useState('')

  const bookingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${window.location.pathname.split('/')[1]}/reserve/${slug}`
    : `/reserve/${slug}`

  const handleSave = () => {
    setError('')
    setSaved(false)
    const fd = new FormData()
    fd.set('businessId', businessId)
    fd.set('reservations_enabled', String(enabled))
    fd.set('slot_duration_minutes', slotDuration)
    fd.set('slot_interval_minutes', slotInterval)
    fd.set('max_party_size', maxParty)
    fd.set('max_covers_per_slot', maxCovers)
    fd.set('max_advance_days', maxAdvance)
    fd.set('min_advance_hours', minHours)
    fd.set('confirmation_message', confirmMsg)
    fd.set('cancellation_policy', cancelPolicy)
    for (const d of ['0', '1', '2', '3', '4', '5', '6']) {
      const dh = hours[d]
      fd.set(`day_${d}_closed`, dh ? 'false' : 'true')
      if (dh) {
        fd.set(`day_${d}_open`, dh.open)
        fd.set(`day_${d}_close`, dh.close)
      }
    }
    startTransition(async () => {
      try {
        await saveReservationSettings(fd)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  const toggleDay = (day: string) => {
    setHours(prev => ({
      ...prev,
      [day]: prev[day] ? null : (DEFAULT_HOURS[day] ?? { open: '11:00', close: '22:00' }),
    }))
  }

  const updateDayHours = (day: string, field: 'open' | 'close', val: string) => {
    setHours(prev => ({
      ...prev,
      [day]: prev[day] ? { ...prev[day]!, [field]: val } : null,
    }))
  }

  const handleAddBlackout = async () => {
    if (!newBlackout) return
    await addBlackoutDate(businessId, newBlackout, newBlackoutReason || undefined)
    setBlackouts(prev => [...prev, { date: newBlackout, reason: newBlackoutReason || null }])
    setNewBlackout('')
    setNewBlackoutReason('')
  }

  const handleRemoveBlackout = async (date: string) => {
    await removeBlackoutDate(businessId, date)
    setBlackouts(prev => prev.filter(b => b.date !== date))
  }

  return (
    <div id="reservations" className="space-y-6">
      {/* Enable toggle */}
      <div className="flex items-center justify-between p-4 bg-teal-50 border border-teal-100 rounded-xl">
        <div>
          <p className="font-semibold text-gray-800">Reservations</p>
          <p className="text-xs text-gray-500">Allow customers to book a table online</p>
        </div>
        <button
          type="button"
          onClick={() => setEnabled(v => !v)}
          className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-teal-600' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

      {enabled && (
        <>
          {/* Booking link */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-xs font-semibold text-gray-600 mb-1">📎 Your booking link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-teal-700 bg-white border border-gray-200 rounded-lg px-2 py-1.5 truncate">
                {bookingUrl}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(bookingUrl)}
                className="text-xs text-teal-600 hover:text-teal-800 px-2 py-1.5 border border-teal-200 rounded-lg"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Operating hours */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Operating Hours</h4>
            <div className="space-y-2">
              {['0', '1', '2', '3', '4', '5', '6'].map(d => {
                const dh = hours[d]
                return (
                  <div key={d} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={`w-12 text-xs font-medium px-2 py-1 rounded-full ${dh ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400'}`}
                    >
                      {DAY_SHORT[Number(d)]}
                    </button>
                    {dh ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="time"
                          value={dh.open}
                          onChange={e => updateDayHours(d, 'open', e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-200"
                        />
                        <span className="text-gray-400 text-xs">to</span>
                        <input
                          type="time"
                          value={dh.close}
                          onChange={e => updateDayHours(d, 'close', e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-200"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Closed</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Slot config */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Slot Configuration</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Table duration (min)', val: slotDuration, set: setSlotDuration, hint: 'How long each booking holds the table' },
                { label: 'Slot interval (min)', val: slotInterval, set: setSlotInterval, hint: 'How often new slots start (30 = every half hour)' },
                { label: 'Max party size', val: maxParty, set: setMaxParty, hint: 'Largest group that can book online' },
                { label: 'Max covers per slot', val: maxCovers, set: setMaxCovers, hint: 'Total guests allowed to start at the same time' },
                { label: 'Advance booking (days)', val: maxAdvance, set: setMaxAdvance, hint: 'How far ahead customers can book' },
                { label: 'Min notice (hours)', val: minHours, set: setMinHours, hint: 'How soon before a slot customers can book' },
              ].map(({ label, val, set, hint }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type="number"
                    value={val}
                    onChange={e => set(e.target.value)}
                    min="1"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Messaging */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Messaging</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirmation message</label>
                <textarea
                  value={confirmMsg}
                  onChange={e => setConfirmMsg(e.target.value)}
                  rows={2}
                  placeholder="Thank you for your reservation! We look forward to seeing you."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cancellation policy</label>
                <textarea
                  value={cancelPolicy}
                  onChange={e => setCancelPolicy(e.target.value)}
                  rows={2}
                  placeholder="Please cancel at least 2 hours before your reservation."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Blackout dates */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Blackout Dates</h4>
            <p className="text-xs text-gray-400 mb-3">Dates when reservations are disabled (public holidays, private events, etc.)</p>
            {blackouts.length > 0 && (
              <ul className="space-y-1 mb-3">
                {blackouts.sort((a, b) => a.date.localeCompare(b.date)).map(b => (
                  <li key={b.date} className="flex items-center justify-between text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    <span className="font-medium text-red-700">
                      {b.date}
                      {b.reason && <span className="font-normal text-red-500 ml-2">— {b.reason}</span>}
                    </span>
                    <button onClick={() => handleRemoveBlackout(b.date)} className="text-red-400 hover:text-red-600">✕</button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                type="date"
                value={newBlackout}
                onChange={e => setNewBlackout(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
              <input
                type="text"
                value={newBlackoutReason}
                onChange={e => setNewBlackoutReason(e.target.value)}
                placeholder="Reason (optional)"
                className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
              <button
                onClick={handleAddBlackout}
                disabled={!newBlackout}
                className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-xl hover:bg-red-100 disabled:opacity-40"
              >
                + Add
              </button>
            </div>
          </div>
        </>
      )}

      {/* Error / save feedback */}
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Saving…' : saved ? '✓ Saved!' : 'Save Reservation Settings'}
      </button>
    </div>
  )
}
