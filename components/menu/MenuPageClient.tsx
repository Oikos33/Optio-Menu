'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { FullBusiness, MenuItemComment } from '@/types/database'
import { getTranslation, getImageUrl, formatPrice, timeAgo } from '@/lib/utils'
import SectionTabs from './SectionTabs'
import FavoriteButton from './FavoriteButton'
import MapSection from './MapSection'

const LOCALES: Record<string, string> = {
  en: 'English', ja: '日本語', zh: '中文', ko: '한국어',
  fr: 'Français', de: 'Deutsch', es: 'Español', it: 'Italiano',
  pt: 'Português', ar: 'العربية', hi: 'हिन्दी', th: 'ไทย',
  vi: 'Tiếng Việt', id: 'Indonesia', ms: 'Melayu',
}

interface Props {
  business: FullBusiness
}

export default function MenuPageClient({ business }: Props) {
  const supabase = createClient()
  const [locale, setLocale] = useState('en')
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [langOpen, setLangOpen] = useState(false)

  // Collect all item IDs for realtime subscription
  const allItems = [
    ...business.menu_sections.flatMap(s => s.menu_items),
    ...business.unsectioned_items,
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ── STICKY HEADER ─────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          {business.logo_path && (
            <Image
              src={getImageUrl(business.logo_path, { width: 80 })}
              alt={business.name}
              width={40} height={40}
              className="rounded-full object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-gray-900 text-lg leading-tight truncate">
              {business.name}
            </h1>
            {business.business_types && (
              <p className="text-xs text-gray-400">
                {getTranslation(business.business_types.name, locale)}
              </p>
            )}
          </div>

          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(v => !v)}
              className="flex items-center gap-1 text-sm text-gray-600 border rounded-lg px-2 py-1 hover:bg-gray-50"
            >
              🌐 {locale.toUpperCase()}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-10 bg-white border rounded-xl shadow-lg z-50 py-1 w-44 max-h-64 overflow-y-auto">
                {Object.entries(LOCALES).map(([code, label]) => (
                  <button
                    key={code}
                    onClick={() => { setLocale(code); setLangOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                      locale === code ? 'font-semibold text-teal-600' : 'text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── AD SLOT — TOP ─────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pt-3">
        <div className="bg-gray-100 rounded-lg h-16 flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-200">
          {/* ADSENSE_SLOT: menu-top — replace with actual ins tag once approved */}
          Advertisement
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-4">
        {/* Description */}
        {business.description && (
          <p className="text-sm text-gray-500 leading-relaxed mb-4">
            {business.description}
          </p>
        )}

        {/* ── SECTION TABS ──────────────────────────────── */}
        {business.menu_sections.length > 0 && (
          <SectionTabs
            sections={business.menu_sections}
            hasUnsectioned={business.unsectioned_items.length > 0}
            locale={locale}
            activeSection={activeSection}
            onSelect={setActiveSection}
          />
        )}

        {/* ── SECTIONED ITEMS ───────────────────────────── */}
        {business.menu_sections.map(section => (
          <section
            key={section.id}
            id={`section-${section.id}`}
            className="mt-6 scroll-mt-20"
          >
            <h2 className="text-base font-bold text-gray-800 mb-3 pb-1 border-b border-gray-100">
              {getTranslation(section.name, locale)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.menu_items
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                .map((item: any) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    locale={locale}
                    supabase={supabase}
                  />
                ))}
            </div>
          </section>
        ))}

        {/* ── UNSECTIONED ITEMS ─────────────────────────── */}
        {business.unsectioned_items.length > 0 && (
          <section id="section-unsorted" className="mt-6 scroll-mt-20">
            {business.menu_sections.length > 0 && (
              <h2 className="text-base font-bold text-gray-800 mb-3 pb-1 border-b border-gray-100">
                Other Items
              </h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {business.unsectioned_items
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((item: any) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    locale={locale}
                    supabase={supabase}
                  />
                ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {business.menu_sections.length === 0 && business.unsectioned_items.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-2">🍽️</p>
            <p>Menu coming soon!</p>
          </div>
        )}

        {/* ── MAP ───────────────────────────────────────── */}
        {business.latitude && business.longitude && (
          <MapSection
            lat={business.latitude}
            lng={business.longitude}
            name={business.name}
            address={business.address}
          />
        )}

        {/* ── AD SLOT — BOTTOM ──────────────────────────── */}
        <div className="mt-8">
          <div className="bg-gray-100 rounded-lg h-16 flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-200">
            {/* ADSENSE_SLOT: menu-bottom */}
            Advertisement
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by{' '}
          <a href="/" className="text-teal-500 hover:underline">Optio Menu</a>
          {' '}· Free QR menus
        </p>
      </main>
    </div>
  )
}

// ── ITEM CARD ─────────────────────────────────────────────

function ItemCard({ item, locale, supabase }: {
  item: any
  locale: string
  supabase: ReturnType<typeof createClient>
}) {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<MenuItemComment[]>(
    item.menu_item_comments || []
  )
  const [commentBody, setCommentBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [supabase])

  // Realtime subscription for live comments
  useEffect(() => {
    if (!showComments) return
    const channel = supabase
      .channel(`comments:${item.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'menu_item_comments',
          filter: `menu_item_id=eq.${item.id}`,
        },
        (payload) => {
          setComments(prev => [payload.new as MenuItemComment, ...prev])
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [showComments, item.id, supabase])

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentBody.trim() || !user) return
    setSubmitting(true)
    await (supabase as any).from('menu_item_comments').insert({
      menu_item_id: item.id,
      user_id: user.id,
      body: commentBody.trim(),
    })
    setCommentBody('')
    setSubmitting(false)
  }

  const deleteComment = async (commentId: string) => {
    await supabase.from('menu_item_comments').delete().eq('id', commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  const name = getTranslation(item.name, locale)
  const description = getTranslation(item.description, locale)
  const price = formatPrice(item.price)
  const imageUrl = getImageUrl(item.image_path, { width: 500 })

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Image */}
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 50vw"
          loading="lazy"
        />
        {/* Favourite button */}
        <div className="absolute top-2 right-2">
          <FavoriteButton menuItemId={item.id} supabase={supabase} user={user} />
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{name}</h3>
          {price && (
            <span className="flex-shrink-0 text-sm font-bold text-teal-600">{price}</span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{description}</p>
        )}

        {/* Comment toggle */}
        <button
          onClick={() => setShowComments(v => !v)}
          className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-teal-500 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {comments.length} {showComments ? 'Hide' : 'Comments'}
        </button>

        {/* Comments panel */}
        {showComments && (
          <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
            {comments.length === 0 && (
              <p className="text-xs text-gray-400 italic">Be the first to comment!</p>
            )}
            {comments.map(comment => (
              <div key={comment.id}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-semibold text-gray-700">
                    {comment.user_id.slice(0, 8)}
                  </span>
                  <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
                  {user?.id === comment.user_id && (
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="ml-auto text-xs text-red-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{comment.body}</p>
              </div>
            ))}

            {user ? (
              <form onSubmit={submitComment} className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  placeholder="Write a comment…"
                  maxLength={1000}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-200"
                />
                <button
                  type="submit"
                  disabled={submitting || !commentBody.trim()}
                  className="text-xs bg-teal-600 text-white rounded-lg px-3 py-1.5 hover:bg-teal-700 disabled:opacity-50"
                >
                  Post
                </button>
              </form>
            ) : (
              <a href="/login" className="block text-xs text-center text-teal-500 hover:underline mt-2">
                Sign in to comment
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
