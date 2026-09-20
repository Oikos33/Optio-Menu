'use client'

import { useState, useEffect } from 'react'

interface HotItem {
  name: string
  count: number
}

interface Props {
  businessId: string
}

export default function WhatsHotBanner({ businessId }: Props) {
  const [hot, setHot] = useState<HotItem[]>([])

  useEffect(() => {
    fetch(`/api/whats-hot?businessId=${businessId}`)
      .then(r => r.json())
      .then(d => setHot(d.hot ?? []))
      .catch(() => {})
  }, [businessId])

  if (hot.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 rounded-xl px-3 py-2 mb-4">
      <p className="text-xs font-semibold text-orange-700 mb-1.5">🔥 Popular right now</p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {hot.map((item, i) => (
          <div
            key={item.name}
            className="flex-shrink-0 flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-orange-100"
          >
            <span className="text-xs font-bold text-orange-400">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🔥'}
            </span>
            <span className="text-xs font-medium text-gray-700 max-w-[100px] truncate">
              {item.name}
            </span>
            <span className="text-xs text-gray-400">×{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
