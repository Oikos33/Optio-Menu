import { NextRequest, NextResponse } from 'next/server'

// GET /api/dish-intel?name=ramen&lang=en
// Fetches dish information from Wikipedia (free, no API key)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const rawName = searchParams.get('name') ?? ''
  const lang = searchParams.get('lang') ?? 'en'

  if (!rawName.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  // Normalize: lowercase, trim
  const name = rawName.trim().toLowerCase()

  // Supported Wikipedia languages
  const wikiLang = ['ja', 'zh', 'ko', 'fr', 'de', 'es', 'it', 'pt'].includes(lang) ? lang : 'en'

  try {
    // Wikipedia REST API - completely free, no key needed
    const title = encodeURIComponent(rawName.trim())
    const wikiUrl = `https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${title}`

    const res = await fetch(wikiUrl, {
      headers: { 'User-Agent': 'Optio-Menu/1.0 (contact@optio-menu.ai)' },
      next: { revalidate: 86400 }, // Cache 24 hours
    })

    if (!res.ok) {
      // Try English fallback if non-English failed
      if (wikiLang !== 'en') {
        const fallbackRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`,
          { headers: { 'User-Agent': 'Optio-Menu/1.0' }, next: { revalidate: 86400 } }
        )
        if (!fallbackRes.ok) {
          return NextResponse.json({ extract: null, imageUrl: null, sourceUrl: null })
        }
        const fallback = await fallbackRes.json()
        return NextResponse.json({
          extract: fallback.extract ?? null,
          imageUrl: fallback.thumbnail?.source ?? null,
          sourceUrl: fallback.content_urls?.desktop?.page ?? null,
          sourceLang: 'en',
          title: fallback.title ?? rawName,
        })
      }
      return NextResponse.json({ extract: null, imageUrl: null, sourceUrl: null })
    }

    const data = await res.json()

    // Filter out disambiguation pages
    if (data.type === 'disambiguation') {
      return NextResponse.json({ extract: null, imageUrl: null, sourceUrl: null })
    }

    return NextResponse.json({
      extract: data.extract ?? null,
      imageUrl: data.thumbnail?.source ?? null,
      sourceUrl: data.content_urls?.desktop?.page ?? null,
      sourceLang: wikiLang,
      title: data.title ?? rawName,
    }, {
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600' }
    })
  } catch {
    return NextResponse.json({ extract: null, imageUrl: null, sourceUrl: null })
  }
}
