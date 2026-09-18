'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTranslation } from '@/lib/utils'
import type { MenuSection } from '@/types/database'

interface Props {
  businessId: string
  sections: MenuSection[]
}

export default function SectionManager({ businessId, sections }: Props) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const addSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await (supabase as any).from('menu_sections').insert({
      business_id: businessId,
      name: { en: name.trim() },
      sort_order: sections.length,
    })
    setSaving(false)
    setName('')
    setOpen(false)
    window.location.reload()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-xl hover:border-teal-300 hover:text-teal-600 transition-colors"
      >
        + Section
      </button>
      {open && (
        <div className="absolute right-0 top-10 bg-white border border-gray-100 rounded-2xl shadow-lg z-20 p-4 w-64">
          <p className="text-sm font-semibold text-gray-700 mb-2">New section</p>
          <form onSubmit={addSection} className="space-y-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Starters"
              autoFocus
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-teal-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {saving ? 'Adding…' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 border border-gray-200 text-xs text-gray-600 py-1.5 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
