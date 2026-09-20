'use client'

import { useState } from 'react'
import { DISH_TAGS, TAG_COLOR_MAP } from '@/lib/dish-guides'

interface Props {
  availableTags: string[]       // All tags present on at least one item in this menu
  activeFilter: string | null
  onChange: (tag: string | null) => void
}

export default function DietaryFilter({ availableTags, activeFilter, onChange }: Props) {
  if (availableTags.length === 0) return null

  const tagDefs = DISH_TAGS.filter(t => availableTags.includes(t.value))

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
      <button
        onClick={() => onChange(null)}
        className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
          activeFilter === null
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
        }`}
      >
        All
      </button>
      {tagDefs.map(tag => {
        const active = activeFilter === tag.value
        const colorClass = TAG_COLOR_MAP[tag.color] ?? 'bg-gray-100 text-gray-600'
        return (
          <button
            key={tag.value}
            onClick={() => onChange(active ? null : tag.value)}
            className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              active
                ? `${colorClass} border-transparent ring-2 ring-offset-1 ring-current`
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {tag.emoji} {tag.label}
          </button>
        )
      })}
    </div>
  )
}
