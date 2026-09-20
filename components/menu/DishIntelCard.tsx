'use client'

import { useState, useEffect, useRef } from 'react'
import { findDishGuide, DISH_TAGS, TAG_COLOR_MAP } from '@/lib/dish-guides'
import { getTranslation } from '@/lib/utils'

interface DishIntelData {
  // Restaurant-provided (from DB)
  dish_story?: any
  how_to_eat?: any
  insider_tips?: any
  video_url?: string | null
  dish_tags?: string[]
  available_seasons?: string[]
  // English name for Wikipedia lookup
  name_en: string
}

interface WikiData {
  extract: string | null
  imageUrl: string | null
  sourceUrl: string | null
  title: string | null
}

type Tab = 'story' | 'howttoeat' | 'tips' | 'seasonal'

const SEASON_EMOJI: Record<string, string> = {
  spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️',
}

interface Props {
  dish: DishIntelData
  locale: string
}

export default function DishIntelCard({ dish, locale }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('story')
  const [wiki, setWiki] = useState<WikiData | null>(null)
  const [wikiLoading, setWikiLoading] = useState(false)
  const fetchedRef = useRef(false)

  // Lazy-load Wikipedia when card opens
  useEffect(() => {
    if (!open || fetchedRef.current) return
    fetchedRef.current = true
    setWikiLoading(true)
    fetch(`/api/dish-intel?name=${encodeURIComponent(dish.name_en)}&lang=${locale}`)
      .then(r => r.json())
      .then((data: WikiData) => setWiki(data))
      .catch(() => setWiki(null))
      .finally(() => setWikiLoading(false))
  }, [open, dish.name_en, locale])

  const curatedGuide = findDishGuide(dish.name_en)
  const tags = dish.dish_tags ?? []
  const seasons = dish.available_seasons ?? curatedGuide?.seasons ?? []

  // Determine which tabs have content
  const hasStory = !!(dish.dish_story || wiki?.extract || curatedGuide)
  const hasHowTo = !!(dish.how_to_eat || curatedGuide?.howToEat)
  const hasTips = !!(dish.insider_tips || curatedGuide?.insiderTips)
  const hasSeasonal = seasons.length > 0 || !!(curatedGuide?.pairings)
  const hasAnyContent = hasStory || hasHowTo || hasTips || hasSeasonal || tags.length > 0

  if (!hasAnyContent && tags.length === 0) return null

  // Story content: restaurant first, then Wikipedia, then curated origin note
  const storyContent = dish.dish_story
    ? getTranslation(dish.dish_story, locale) || getTranslation(dish.dish_story, 'en')
    : wiki?.extract ?? null

  const howToContent: string[] = (() => {
    if (!dish.how_to_eat) return curatedGuide?.howToEat ?? []
    const val = getTranslation(dish.how_to_eat, locale) ?? getTranslation(dish.how_to_eat, 'en')
    return Array.isArray(val) ? (val as unknown as string[]) : []
  })()

  const tipsContent: string[] = (() => {
    if (!dish.insider_tips) return curatedGuide?.insiderTips ?? []
    const val = getTranslation(dish.insider_tips, locale) ?? getTranslation(dish.insider_tips, 'en')
    return Array.isArray(val) ? (val as unknown as string[]) : []
  })()

  const etiquetteContent = curatedGuide?.etiquette ?? []
  const pairings = curatedGuide?.pairings ?? []
  const videoUrl = dish.video_url ?? null

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    return match?.[1] ?? null
  }

  const youtubeId = videoUrl ? extractYouTubeId(videoUrl) : null

  const TABS: { id: Tab; label: string; emoji: string; has: boolean }[] = [
    { id: 'story' as Tab,     label: 'Story',    emoji: '📖', has: hasStory || tags.length > 0 },
    { id: 'howttoeat' as Tab, label: 'How to Eat', emoji: '🍜', has: hasHowTo },
    { id: 'tips' as Tab,      label: 'Tips',     emoji: '💡', has: hasTips },
    { id: 'seasonal' as Tab,  label: 'Seasonal', emoji: '🌸', has: hasSeasonal },
  ].filter(t => t.has)

  return (
    <div className="mt-2">
      {/* Trigger row: tags + expand button */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {tags.slice(0, 4).map(tag => {
          const def = DISH_TAGS.find(t => t.value === tag)
          if (!def) return null
          const colorClass = TAG_COLOR_MAP[def.color] ?? 'bg-gray-100 text-gray-600'
          return (
            <span key={tag} className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${colorClass}`}>
              {def.emoji} {def.label}
            </span>
          )
        })}
        {(hasStory || hasHowTo || hasTips || hasSeasonal) && (
          <button
            onClick={() => setOpen(v => !v)}
            className="ml-auto text-xs text-teal-500 hover:text-teal-700 flex items-center gap-0.5 font-medium flex-shrink-0 transition-colors"
          >
            {open ? '▲ Hide' : '🔍 About this dish'}
          </button>
        )}
      </div>

      {/* Expandable panel */}
      {open && (
        <div className="mt-2 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
          {/* Tab bar */}
          {TABS.length > 1 && (
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-shrink-0 text-xs font-medium px-3 py-2 border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          )}

          <div className="p-3 space-y-3">
            {/* ── STORY TAB ─────────────────────────────────── */}
            {(tab === 'story' || TABS.length === 1) && (
              <div className="space-y-2">
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => {
                      const def = DISH_TAGS.find(t => t.value === tag)
                      if (!def) return null
                      const colorClass = TAG_COLOR_MAP[def.color] ?? 'bg-gray-100 text-gray-600'
                      return (
                        <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
                          {def.emoji} {def.label}
                        </span>
                      )
                    })}
                  </div>
                )}

                {wikiLoading && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                    <span className="animate-spin">⏳</span> Loading dish story…
                  </div>
                )}

                {storyContent && !wikiLoading && (
                  <p className="text-xs text-gray-600 leading-relaxed">{storyContent}</p>
                )}

                {curatedGuide?.originCountry && (
                  <p className="text-xs text-gray-400">
                    🌍 Origin: <span className="font-medium text-gray-600">{curatedGuide.originCountry}</span>
                  </p>
                )}

                {wiki?.sourceUrl && !dish.dish_story && (
                  <a
                    href={wiki.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-teal-500 underline"
                  >
                    📚 Wikipedia
                  </a>
                )}

                {!storyContent && !wikiLoading && !curatedGuide && (
                  <p className="text-xs text-gray-400 italic">No story available yet.</p>
                )}
              </div>
            )}

            {/* ── HOW TO EAT TAB ────────────────────────────── */}
            {tab === 'howttoeat' && (
              <div className="space-y-3">
                {howToContent.length > 0 && (
                  <ol className="space-y-2">
                    {howToContent.map((step, i) => (
                      <li key={i} className="flex gap-2 text-xs text-gray-600">
                        <span className="flex-shrink-0 w-5 h-5 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-xs">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                )}

                {etiquetteContent.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">🎌 Etiquette</p>
                    <ul className="space-y-1">
                      {etiquetteContent.map((tip, i) => (
                        <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                          <span className="text-teal-400">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {youtubeId && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">🎥 Watch & Learn</p>
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-200">
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        className="w-full h-full"
                        allowFullScreen
                        title="How to eat"
                      />
                    </div>
                  </div>
                )}

                {howToContent.length === 0 && !youtubeId && (
                  <p className="text-xs text-gray-400 italic">No eating guide available for this dish.</p>
                )}
              </div>
            )}

            {/* ── TIPS TAB ──────────────────────────────────── */}
            {tab === 'tips' && (
              <div className="space-y-2">
                {tipsContent.length > 0 && (
                  <ul className="space-y-2">
                    {tipsContent.map((tip, i) => (
                      <li key={i} className="flex gap-2 text-xs text-gray-600 bg-amber-50 rounded-lg p-2">
                        <span className="text-amber-500 flex-shrink-0">💡</span>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {tipsContent.length === 0 && (
                  <p className="text-xs text-gray-400 italic">
                    No insider tips yet.{' '}
                    <span className="text-teal-500">The restaurant can add tips in their dashboard.</span>
                  </p>
                )}
              </div>
            )}

            {/* ── SEASONAL TAB ──────────────────────────────── */}
            {tab === 'seasonal' && (
              <div className="space-y-3">
                {seasons.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">Best enjoyed in</p>
                    <div className="flex gap-2 flex-wrap">
                      {seasons.map(s => (
                        <span key={s} className="text-sm bg-teal-50 text-teal-700 px-3 py-1 rounded-full font-medium">
                          {SEASON_EMOJI[s] ?? '🌿'} {s.charAt(0).toUpperCase() + s.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {pairings.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">🍶 Pairs well with</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {pairings.map((p, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {seasons.length === 0 && pairings.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No seasonal info available.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
