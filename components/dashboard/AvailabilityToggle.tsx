'use client'

import { useState, useRef, useEffect } from 'react'
import { toggleItemAvailability, updateItemAvailability } from '@/app/actions/availability'

interface Props {
  itemId: string
  businessId: string
  isAvailable: boolean
  availableFrom?: string | null
  availableUntil?: string | null
  stockCount?: number | null
  trackStock?: boolean
}

export default function AvailabilityToggle({
  itemId,
  businessId,
  isAvailable: initialAvailable,
  availableFrom: initialFrom,
  availableUntil: initialUntil,
  stockCount: initialStock,
  trackStock: initialTrackStock,
}: Props) {
  // Optimistic local state
  const [available, setAvailable] = useState(initialAvailable)
  const [showSettings, setShowSettings] = useState(false)
  const [saving, setSaving] = useState(false)

  // Settings form state
  const [fromTime, setFromTime]     = useState(initialFrom   ?? '')
  const [untilTime, setUntilTime]   = useState(initialUntil  ?? '')
  const [trackStk, setTrackStk]     = useState(initialTrackStock ?? false)
  const [stockCount, setStockCount] = useState<string>(
    initialStock != null ? String(initialStock) : ''
  )

  const panelRef = useRef<HTMLDivElement>(null)

  // Close panel on outside click
  useEffect(() => {
    if (!showSettings) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowSettings(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSettings])

  const handleToggle = async () => {
    // Optimistic flip
    setAvailable(v => !v)
    try {
      await toggleItemAvailability(itemId, businessId)
    } catch {
      // Revert on error
      setAvailable(v => !v)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    const fd = new FormData()
    fd.set('itemId', itemId)
    fd.set('businessId', businessId)
    fd.set('isAvailable', String(available))
    fd.set('trackStock', String(trackStk))
    fd.set('availableFrom',  fromTime  || '')
    fd.set('availableUntil', untilTime || '')
    fd.set('stockCount', stockCount)
    try {
      await updateItemAvailability(fd)
      setShowSettings(false)
    } catch (err) {
      console.error('Failed to save availability settings', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative flex items-center gap-1" ref={panelRef}>
      {/* Pill toggle */}
      <button
        onClick={handleToggle}
        title={available ? 'Available — click to hide' : 'Unavailable — click to show'}
        className={`
          inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
          transition-colors select-none cursor-pointer
          ${available
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-red-100 text-red-600 hover:bg-red-200'
          }
        `}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${available ? 'bg-green-500' : 'bg-red-400'}`} />
        {available ? 'On' : 'Off'}
      </button>

      {/* Settings cog */}
      <button
        onClick={() => setShowSettings(v => !v)}
        title="Availability settings"
        className="text-gray-300 hover:text-gray-500 transition-colors p-0.5 rounded"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute right-0 top-7 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-60 space-y-3">
          <p className="text-xs font-semibold text-gray-700">Availability Settings</p>

          {/* Time window */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Available hours (HH:MM)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="time"
                value={fromTime}
                onChange={e => setFromTime(e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-300"
              />
              <span className="text-xs text-gray-400">–</span>
              <input
                type="time"
                value={untilTime}
                onChange={e => setUntilTime(e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-300"
              />
            </div>
            {fromTime && untilTime && (
              <p className="text-[10px] text-teal-600 mt-0.5">
                Shows {fromTime} – {untilTime}
              </p>
            )}
          </div>

          {/* Stock tracking */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={trackStk}
                onChange={e => setTrackStk(e.target.checked)}
                className="rounded accent-teal-600"
              />
              <span className="text-xs text-gray-600">Track stock count</span>
            </label>
            {trackStk && (
              <input
                type="number"
                min={0}
                value={stockCount}
                onChange={e => setStockCount(e.target.value)}
                placeholder="Qty remaining"
                className="mt-1.5 w-full text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-300"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(false)}
              className="flex-1 text-xs text-gray-500 border border-gray-200 rounded-lg py-1 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex-1 text-xs bg-teal-600 text-white rounded-lg py-1 hover:bg-teal-700 disabled:opacity-50 font-semibold"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
