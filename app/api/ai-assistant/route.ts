import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createPublicClient } from '@/lib/supabase/public'

// POST /api/ai-assistant
// body: { businessId: string; message: string; history: { role: 'user'|'model'; text: string }[]; locale: string }
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI assistant not configured' }, { status: 503 })
  }

  const { businessId, message, history = [], locale = 'en' } = await req.json()
  if (!businessId || !message?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createPublicClient()

  // Fetch the full menu for this restaurant (name + description + price + tags)
  const { data: business } = await (supabase as any)
    .from('businesses')
    .select(`
      name, description, currency,
      menu_sections(name, menu_items(name, description, price, dish_tags, is_available)),
      menu_items!menu_items_business_id_fkey(name, description, price, dish_tags, is_available, menu_section_id)
    `)
    .eq('id', businessId)
    .eq('menu_items.is_available', true)
    .single()

  if (!business) {
    return NextResponse.json({ reply: 'Sorry, I could not load the menu right now.' })
  }

  // Build a compact menu text for the prompt
  const langKey = ['ja', 'zh', 'ko', 'fr', 'de', 'es'].includes(locale) ? locale : 'en'
  const getName = (jsonb: any) => jsonb?.[langKey] || jsonb?.en || Object.values(jsonb ?? {})[0] || ''

  let menuText = `Restaurant: ${business.name}\n`
  if (business.description) menuText += `Description: ${business.description}\n`
  menuText += `Currency: ${business.currency ?? 'JPY'}\n\nMENU:\n`

  // Sectioned items
  for (const section of business.menu_sections ?? []) {
    menuText += `\n[${getName(section.name)}]\n`
    for (const item of section.menu_items ?? []) {
      if (!item.is_available) continue
      const tags = (item.dish_tags ?? []).join(', ')
      menuText += `• ${getName(item.name)}`
      if (item.price) menuText += ` — ${business.currency ?? '¥'}${item.price}`
      if (tags) menuText += ` [${tags}]`
      const desc = getName(item.description)
      if (desc) menuText += `\n  ${desc}`
      menuText += '\n'
    }
  }

  // Unsectioned items
  const unsectioned = (business.menu_items ?? []).filter((i: any) => !i.menu_section_id && i.is_available)
  if (unsectioned.length > 0) {
    menuText += '\n[Other items]\n'
    for (const item of unsectioned) {
      const tags = (item.dish_tags ?? []).join(', ')
      menuText += `• ${getName(item.name)}`
      if (item.price) menuText += ` — ${business.currency ?? '¥'}${item.price}`
      if (tags) menuText += ` [${tags}]`
      menuText += '\n'
    }
  }

  const systemPrompt = `You are a friendly, knowledgeable restaurant assistant for ${business.name}.
Your job is to help customers decide what to order based on their preferences, dietary needs, appetite, and mood.
Be warm, concise, and specific. Always recommend actual dishes from the menu by name.
If someone says they are vegan, recommend vegan options. If they want something spicy, recommend spicy dishes.
If they are not very hungry, suggest lighter or smaller portions. 
When recommending a dish, include the price.
Respond in the same language the customer uses.
Keep responses short — 2-4 sentences max.

${menuText}`

  try {
    const ai = new GoogleGenAI({ apiKey })

    // Build conversation history for multi-turn
    const contents = [
      ...history.map((h: { role: string; text: string }) => ({
        role: h.role as 'user' | 'model',
        parts: [{ text: h.text }],
      })),
      { role: 'user' as const, parts: [{ text: message }] },
    ]

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      config: { systemInstruction: systemPrompt, maxOutputTokens: 300, temperature: 0.7 },
      contents,
    })

    const reply = response.text ?? 'Sorry, I could not generate a response.'
    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error('AI assistant error:', err)
    return NextResponse.json({ reply: 'Sorry, I am having trouble right now. Please ask your waiter!' })
  }
}
