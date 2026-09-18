'use client'

import { getTranslation } from '@/lib/utils'
import type { MenuSection } from '@/types/database'

interface Props {
  sections: MenuSection[]
  hasUnsectioned: boolean
  locale: string
  activeSection: string | null
  onSelect: (id: string | null) => void
}

export default function SectionTabs({ sections, hasUnsectioned, locale, activeSection, onSelect }: Props) {
  const scrollTo = (id: string | null) => {
    onSelect(id)
    const el = document.getElementById(id ? `section-${id}` : 'section-unsorted')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4">
      {sections.map(section => (
        <button
          key={section.id}
          onClick={() => scrollTo(section.id)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
            ${activeSection === section.id
              ? 'bg-teal-600 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300'
            }`}
        >
          {getTranslation(section.name, locale)}
        </button>
      ))}
      {hasUnsectioned && (
        <button
          onClick={() => scrollTo(null)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
            ${activeSection === null && sections.length > 0
              ? 'bg-teal-600 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300'
            }`}
        >
          Other
        </button>
      )}
    </div>
  )
}
