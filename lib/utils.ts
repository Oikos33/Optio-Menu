export { cn } from 'cn'
import type { Json, TranslatableText } from '@/types/database'

/**
 * Extract a translated string from a JSONB translatable field.
 * Falls back to English, then to the first available translation.
 */
export function getTranslation(
  field: Json | null | undefined,
  locale: string = 'en'
): string {
  if (!field || typeof field !== 'object' || Array.isArray(field)) return ''
  const obj = field as TranslatableText
  return obj[locale] || obj['en'] || Object.values(obj).find(Boolean) || ''
}

/**
 * Generate a URL-friendly slug from a business name.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Build a Supabase Storage public image URL with on-the-fly transforms.
 */
export function getImageUrl(
  path: string | null | undefined,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!path) return '/placeholder-dish.webp'
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${base}/storage/v1/object/public/${path}`
}

/**
 * Format a price number. Returns null if price not set.
 */
export function formatPrice(price: number | null | undefined): string | null {
  if (price == null) return null
  return new Intl.NumberFormat('en', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

/**
 * Format relative time.
 */
export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
