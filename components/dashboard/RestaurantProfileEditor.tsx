'use client'

import { useState, useTransition } from 'react'
import { CURRENCIES } from '@/lib/currency'
import { updateRestaurantProfile } from '@/app/actions/restaurant'

const OCCASIONS = [
  { key: 'date',       label: '💍 Date' },
  { key: 'family',     label: '👨‍👩‍👧 Family' },
  { key: 'business',   label: '💼 Business' },
  { key: 'birthday',   label: '🎂 Birthday' },
  { key: 'wedding',    label: '💒 Wedding' },
  { key: 'proposal',   label: '💞 Proposal' },
  { key: 'graduation', label: '🎓 Graduation' },
  { key: 'friends',    label: '🍻 Friends' },
  { key: 'quiet',      label: '🤫 Quiet' },
  { key: 'party',      label: '🎉 Party' },
]

const AMENITIES = [
  { key: 'smoking_area',        label: '🚬 Smoking Area' },
  { key: 'wheelchair_accessible', label: '♿ Wheelchair Accessible' },
  { key: 'parking',             label: '🅿️ Parking' },
  { key: 'near_station',        label: '🚉 Near Station' },
  { key: 'kids_welcome',        label: '👶 Kids Welcome' },
  { key: 'pet_friendly',        label: '🐾 Pet Friendly' },
  { key: 'card_payment',        label: '💳 Card Payment' },
  { key: 'cash_only',           label: '💴 Cash Only' },
  { key: 'qr_payment',          label: '📱 QR Payment' },
]

const DRESS_CODES = [
  { value: '',             label: 'Not specified' },
  { value: 'casual',       label: 'Casual' },
  { value: 'smart_casual', label: 'Smart Casual' },
  { value: 'business',     label: 'Business' },
  { value: 'formal',       label: 'Formal' },
]

interface Props {
  businessId: string
  currency: string
  tipEnabled: boolean
  tipPresets: number[]
  occasions: string[]
  amenities: Record<string, boolean>
  dressCode: string | null
  languagesSpoken: string[]
  walkInOk: boolean
  kdsPin: string | null
}

export default function RestaurantProfileEditor({
  businessId,
  currency: initialCurrency,
  tipEnabled: initialTipEnabled,
  tipPresets: initialTipPresets,
  occasions: initialOccasions,
  amenities: initialAmenities,
  dressCode: initialDressCode,
  languagesSpoken: initialLanguages,
  walkInOk: initialWalkInOk,
  kdsPin: initialKdsPin,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Local state
  const [currency, setCurrency] = useState(initialCurrency || 'JPY')
  const [tipEnabled, setTipEnabled] = useState(initialTipEnabled)
  const [tipPresetsStr, setTipPresetsStr] = useState((initialTipPresets ?? [10, 15, 20]).join(', '))
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(initialOccasions ?? [])
  const [amenities, setAmenities] = useState<Record<string, boolean>>(initialAmenities ?? {})
  const [dressCode, setDressCode] = useState(initialDressCode ?? '')
  const [languagesInput, setLanguagesInput] = useState((initialLanguages ?? []).join(', '))
  const [walkInOk, setWalkInOk] = useState(initialWalkInOk)
  const [kdsPin, setKdsPin] = useState(initialKdsPin ?? '')
  const [showPin, setShowPin] = useState(false)

  const toggleOccasion = (key: string) => {
    setSelectedOccasions(prev =>
      prev.includes(key) ? prev.filter(o => o !== key) : [...prev, key]
    )
  }

  const toggleAmenity = (key: string) => {
    setAmenities(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    setSaved(false)
    setError('')
    startTransition(async () => {
      const formData = new FormData()
      formData.set('currency', currency)
      if (tipEnabled) formData.set('tip_enabled', 'on')
      formData.set('tip_presets', tipPresetsStr)
      for (const occ of selectedOccasions) formData.append('occasions', occ)
      for (const [key, val] of Object.entries(amenities)) {
        if (val) formData.set(`amenity_${key}`, 'on')
      }
      formData.set('dress_code', dressCode)
      formData.set('languages_spoken', languagesInput)
      if (walkInOk) formData.set('walk_in_ok', 'on')
      if (kdsPin.trim()) formData.set('kds_pin', kdsPin.trim())

      const result = await updateRestaurantProfile(businessId, formData)
      if (result.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(result.error ?? 'Failed to save')
      }
    })
  }

  return (
    <div className="max-w-2xl space-y-8">

      {/* ── 1. CURRENCY & PAYMENTS ──────────────────────────── */}
      <section>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span>💱</span> Currency & Payments
        </h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">

          {/* Currency */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Restaurant Currency</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
            >
              {Object.entries(CURRENCIES).map(([code, cfg]) => (
                <option key={code} value={code}>
                  {cfg.symbol} {cfg.name} ({code})
                </option>
              ))}
            </select>
          </div>

          {/* Tip toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Enable Tipping</p>
              <p className="text-xs text-gray-400">Show tip options in the cart</p>
            </div>
            <button
              type="button"
              onClick={() => setTipEnabled(v => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                tipEnabled ? 'bg-teal-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  tipEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Tip presets */}
          {tipEnabled && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Tip Presets (comma-separated %)
              </label>
              <input
                type="text"
                value={tipPresetsStr}
                onChange={e => setTipPresetsStr(e.target.value)}
                placeholder="10, 15, 20"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
              <p className="text-xs text-gray-400 mt-1">e.g. &quot;10, 15, 20&quot;</p>
            </div>
          )}
        </div>
      </section>

      {/* ── 2. OCCASIONS ─────────────────────────────────────── */}
      <section>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span>🎉</span> Occasions
        </h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-3">Select occasions that suit your restaurant</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {OCCASIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleOccasion(key)}
                className={`text-xs py-2 px-3 rounded-xl border text-left transition-colors ${
                  selectedOccasions.includes(key)
                    ? 'bg-teal-50 border-teal-400 text-teal-700 font-semibold'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. AMENITIES ─────────────────────────────────────── */}
      <section>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span>🏢</span> Amenities
        </h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AMENITIES.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={amenities[key] ?? false}
                  onChange={() => toggleAmenity(key)}
                  className="accent-teal-500 w-4 h-4"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. OTHER ─────────────────────────────────────────── */}
      <section>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span>ℹ️</span> Other Details
        </h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">

          {/* Dress code */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Dress Code</label>
            <select
              value={dressCode}
              onChange={e => setDressCode(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
            >
              {DRESS_CODES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Languages */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Languages Spoken</label>
            <input
              type="text"
              value={languagesInput}
              onChange={e => setLanguagesInput(e.target.value)}
              placeholder="English, Japanese, Mandarin"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
            <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
            {languagesInput && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {languagesInput.split(',').map(l => l.trim()).filter(Boolean).map(lang => (
                  <span key={lang} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200">
                    {lang}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Walk-in OK */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Walk-ins Welcome</p>
              <p className="text-xs text-gray-400">No reservation needed</p>
            </div>
            <button
              type="button"
              onClick={() => setWalkInOk(v => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                walkInOk ? 'bg-teal-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  walkInOk ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* ── 5. KDS PIN ─────────────────────────────────────────── */}
      <section>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span>🔑</span> Kitchen Display PIN
        </h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-3">
            4–6 digit PIN for kitchen staff to access the KDS without full login
          </p>
          <div className="flex items-center gap-2 max-w-xs">
            <input
              type={showPin ? 'text' : 'password'}
              value={kdsPin}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                setKdsPin(val)
              }}
              placeholder="e.g. 1234"
              maxLength={6}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200 font-mono tracking-widest"
            />
            <button
              type="button"
              onClick={() => setShowPin(v => !v)}
              className="text-xs text-gray-400 hover:text-gray-600 px-2"
            >
              {showPin ? '🙈' : '👁️'}
            </button>
          </div>
          {kdsPin && !/^\d{4,6}$/.test(kdsPin) && (
            <p className="text-xs text-red-500 mt-1">PIN must be 4–6 digits</p>
          )}
        </div>
      </section>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="bg-teal-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? '⏳ Saving…' : '💾 Save Settings'}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">✅ Saved!</span>
        )}
        {error && (
          <span className="text-sm text-red-600">{error}</span>
        )}
      </div>
    </div>
  )
}
