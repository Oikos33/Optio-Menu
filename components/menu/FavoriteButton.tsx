'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  menuItemId: string
  supabase: ReturnType<typeof createClient>
  user: any
}

export default function FavoriteButton({ menuItemId, supabase, user }: Props) {
  const [isFav, setIsFav] = useState(false)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_favorite_menu_items')
      .select('user_id', { count: 'exact' })
      .eq('menu_item_id', menuItemId)
      .then(({ count: c }) => setCount(c || 0))

    supabase
      .from('user_favorite_menu_items')
      .select('user_id')
      .eq('menu_item_id', menuItemId)
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => setIsFav(!!data))
  }, [user, menuItemId, supabase])

  const toggle = async () => {
    if (!user) { window.location.href = '/login'; return }
    setLoading(true)
    if (isFav) {
      await (supabase as any).from('user_favorite_menu_items')
        .delete().eq('menu_item_id', menuItemId).eq('user_id', user.id)
      setIsFav(false)
      setCount(c => Math.max(0, c - 1))
    } else {
      await (supabase as any).from('user_favorite_menu_items')
        .insert({ menu_item_id: menuItemId, user_id: user.id })
      setIsFav(true)
      setCount(c => c + 1)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition-all shadow-sm
        ${isFav
          ? 'bg-red-500 text-white'
          : 'bg-white/80 backdrop-blur text-gray-600 hover:bg-red-50'
        }`}
    >
      <span>{isFav ? '❤️' : '🤍'}</span>
      {count > 0 && <span>{count}</span>}
    </button>
  )
}
